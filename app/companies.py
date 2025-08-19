import os
import logging
from fastapi import HTTPException, status, Depends
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime
from typing import List

from .database import get_db
from .models import Company, PDFFile, QALog, AgentLog
from .schemas import CompanyCreate, CompanyUpdate, CompanyResponse
from .auth import admin_required
from .openai_models import openai_models_service
from .vector_store_utils import build_or_update_vector_store

# Import embeddings from auth module
try:
    from .auth import embeddings
except ImportError:
    embeddings = None
    logging.warning("Could not import embeddings from auth module")

logger = logging.getLogger(__name__)

# Constants
BASE_COMPANY_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "companies")
BASE_VECTOR_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "vector_store")

def create_company_folder(company_name: str):
    """Create folder structure for a new company"""
    company_dir = os.path.join(BASE_COMPANY_DIR, company_name)
    os.makedirs(company_dir, exist_ok=True)
    logger.info(f"Created company directory: {company_dir}")

async def create_company(company: CompanyCreate, db: Session):
    """Create a new company with validation"""
    try:
        # Check if company name already exists
        existing = db.query(Company).filter(Company.name == company.name).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Company name already exists"
            )
        
        # Validate model name against available OpenAI models
        model_validation = openai_models_service.validate_model(company.model_name)
        if not model_validation["valid"]:
            # Get available models for the error message
            try:
                available_models = openai_models_service.get_available_models()
                model_list = [model["id"] for model in available_models]
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={
                        "error": f"Invalid model name: {model_validation['reason']}",
                        "provided_model": company.model_name,
                        "available_models": model_list,
                        "recommended_models": [model["id"] for model in available_models if model.get("recommended", False)]
                    }
                )
            except Exception as e:
                # If we can't fetch models, still fail but with basic validation error
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid model name: {model_validation['reason']}"
                )
        
        # Create company with all required fields
        db_company = Company(
            name=company.name,
            model_name=company.model_name,
            temperature=company.temperature,
            max_tokens=company.max_tokens
        )
        db.add(db_company)
        db.commit()
        
        # Create company folder
        create_company_folder(company.name)
        
        # Create agent automatically for the new company
        try:
            if embeddings:
                # Import here to avoid circular imports
                from .agent_manager import agent_manager
                logger.info(f"Creating agent automatically for new company: {company.name}")
                agent = await agent_manager.get_agent(db_company, embeddings)
                logger.info(f"Agent created successfully for company: {company.name}")
            else:
                logger.warning("Embeddings not available, skipping automatic agent creation")
        except Exception as e:
            logger.warning(f"Failed to create agent automatically for company {company.name}: {e}")
            # Don't fail company creation if agent creation fails
        
        logger.info(f"Company created: {company.name} with model {company.model_name}, temperature {company.temperature}")
        return {
            "message": "Company created successfully",
            "company_id": db_company.id,
            "company_name": db_company.name,
            "model_name": db_company.model_name,
            "temperature": db_company.temperature,
            "max_tokens": db_company.max_tokens
        }
        
    except HTTPException:
        raise
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error creating company: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create company"
        )
    except Exception as e:
        logger.error(f"Unexpected error creating company: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create company"
        )

async def update_company(company_id: int, update: CompanyUpdate, db: Session):
    """Update company with validation"""
    try:
        company = db.query(Company).filter(Company.id == company_id).first()
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found"
            )
        
        # Validate model_name if provided
        if update.model_name:
            model_validation = openai_models_service.validate_model(update.model_name)
            if not model_validation["valid"]:
                # Get available models for the error message
                try:
                    available_models = openai_models_service.get_available_models()
                    model_list = [model["id"] for model in available_models]
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail={
                            "error": f"Invalid model name: {model_validation['reason']}",
                            "provided_model": update.model_name,
                            "available_models": model_list,
                            "recommended_models": [model["id"] for model in available_models if model.get("recommended", False)]
                        }
                    )
                except Exception as e:
                    # If we can't fetch models, still fail but with basic validation error
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Invalid model name: {model_validation['reason']}"
                    )
        
        # Validate temperature if provided
        if update.temperature is not None:
            if not (0.0 <= update.temperature <= 2.0):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Temperature must be between 0.0 and 2.0"
                )
        
        # Validate max_tokens if provided
        if update.max_tokens is not None:
            if not (1 <= update.max_tokens <= 4000):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Max tokens must be between 1 and 4000"
                )
        
        # Apply updates
        if update.model_name:
            company.model_name = update.model_name
        if update.temperature is not None:
            company.temperature = update.temperature
        if update.max_tokens is not None:
            company.max_tokens = update.max_tokens
        
        db.commit()
        logger.info(f"Company updated: {company.name} (model: {company.model_name}, temp: {company.temperature}, max_tokens: {company.max_tokens})")
        return {"message": "Company updated"}
        
    except HTTPException:
        raise
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error updating company: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update company"
        )
    except Exception as e:
        logger.error(f"Unexpected error updating company: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update company"
        )

async def get_all_companies(db: Session) -> List[Company]:
    """Get all companies"""
    try:
        return db.query(Company).all()
    except SQLAlchemyError as e:
        logger.error(f"Database error listing companies: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve companies"
        )
    except Exception as e:
        logger.error(f"Unexpected error listing companies: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unexpected error occurred"
        )

async def remove_company(company_id: int, db: Session):
    """
    Remove a company completely from database and file system.
    
    This function:
    1. Deletes all associated database records (agent logs, PDF records, QA logs)
    2. Removes the company's PDF directory from the companies folder
    3. Removes the company's vector store directory
    4. Completely removes the company record from the database
    
    Args:
        company_id: The ID of the company to remove
        
    Returns:
        dict: Summary of what was removed
        
    Raises:
        HTTPException: If company not found or removal fails
    """
    try:
        # Get company
        company = db.query(Company).filter(Company.id == company_id).first()
        if not company:
            raise HTTPException(status_code=404, detail="Company not found")
        
        company_name = company.name
        logger.info(f"Starting complete cleanup and removal for company: {company_name}")
        
        # Clear database records
        logs_deleted = 0
        pdfs_deleted = 0
        qa_logs_deleted = 0
        
        try:
            # Clear agent logs
            logs_deleted = db.query(AgentLog).filter(AgentLog.company_id == company_id).delete()
            logger.info(f"Deleted {logs_deleted} agent logs for company: {company_name}")
            
            # Clear PDF records
            pdfs_deleted = db.query(PDFFile).filter(PDFFile.company_id == company_id).delete()
            logger.info(f"Deleted {pdfs_deleted} PDF records for company: {company_name}")
            
            # Clear QA logs
            qa_logs_deleted = db.query(QALog).filter(QALog.company_id == company_id).delete()
            logger.info(f"Deleted {qa_logs_deleted} QA logs for company: {company_name}")
            
        except Exception as e:
            logger.warning(f"Error deleting database records: {e}")
            db.rollback()
        
        # Remove vector store directory
        try:
            vector_store_path = os.path.join(BASE_VECTOR_DIR, company_name)
            if os.path.exists(vector_store_path):
                logger.info(f"Removing vector store directory: {vector_store_path}")
                import shutil
                shutil.rmtree(vector_store_path)
                logger.info(f"Vector store directory removed: {vector_store_path}")
            else:
                logger.info(f"Vector store directory does not exist: {vector_store_path}")
        except Exception as e:
            logger.warning(f"Error removing vector store directory: {e}")
        
        # Remove company PDF directory
        try:
            company_pdf_dir = os.path.join(BASE_COMPANY_DIR, company_name)
            if os.path.exists(company_pdf_dir):
                logger.info(f"Removing company PDF directory: {company_pdf_dir}")
                import shutil
                shutil.rmtree(company_pdf_dir)
                logger.info(f"Company PDF directory removed: {company_pdf_dir}")
            else:
                logger.info(f"Company PDF directory does not exist: {company_pdf_dir}")
        except Exception as e:
            logger.warning(f"Error removing company PDF directory: {e}")
        
        # Remove company from database
        try:
            # Remove agent for this company first
            try:
                if embeddings:
                    # Import here to avoid circular imports
                    from .agent_manager import agent_manager
                    if agent_manager.force_remove_agent(company_id):
                        logger.info(f"Agent removed for company: {company_name}")
                    else:
                        logger.info(f"No agent found for company: {company_name}")
                else:
                    logger.info("Embeddings not available, skipping agent removal")
            except Exception as e:
                logger.warning(f"Error removing agent for company {company_name}: {e}")
            
            db.delete(company)
            db.commit()
            logger.info(f"Company '{company_name}' completely removed from database")
        except Exception as e:
            logger.error(f"Error removing company from database: {e}")
            db.rollback()
            raise
        
        logger.info(f"Successfully removed company '{company_name}' and all associated data")
        
        return {
            "message": f"Successfully removed company '{company_name}' and all associated data",
            "company_id": company_id,
            "company_name": company_name,
            "removed_items": [
                "company_database_record",
                "agents",
                "vector_store", 
                "uploaded_pdfs",
                "company_directory",
                "agent_logs",
                "pdf_records",
                "qa_logs"
            ],
            "database_records_deleted": {
                "agent_logs": logs_deleted,
                "pdf_records": pdfs_deleted,
                "qa_logs": qa_logs_deleted,
                "company": 1
            },
            "directories_removed": [
                f"vector_store/{company_name}",
                f"companies/{company_name}"
            ],
            "timestamp": datetime.utcnow()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error removing company: {e}", exc_info=True)
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to remove company: {str(e)}") 