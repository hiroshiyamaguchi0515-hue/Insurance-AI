from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime
from typing import List
import os
import logging
from jose import JWTError, jwt

# Import our modules
from .database import get_db
from .models import Company, User, PDFFile, QALog, AgentLog
from .schemas import (
    UserCreate, UserResponse, UserUpdate,
    CompanyCreate, CompanyUpdate, CompanyResponse,
    LoginRequest, Token, AskRequest, AskResponse, AgentAskResponse,
    PDFUploadResponse, AgentLogResponse
)
from .auth import (
    get_current_user, admin_required, create_tokens, 
    verify_password, get_password_hash, embeddings
)
from .companies import (
    create_company, update_company, get_all_companies, 
    remove_company
)
from .openai_models import openai_models_service
from .agent_manager import agent_manager
from .vector_store_utils import build_or_update_vector_store

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Insurance",
    description="AI-powered PDF document analysis and question answering system",
    version="1.0.0",
    tags=[
        {"name": "Auth", "description": "Authentication and user management"},
        {"name": "Company", "description": "Company management and configuration"},
        {"name": "PDF", "description": "PDF file management and operations"},
        {"name": "VectorStore", "description": "Vector store management and operations"},
        {"name": "Agent", "description": "AI agent management and interactions"},
        {"name": "Admin", "description": "Administrative operations and system management"}
    ]
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Constants
BASE_COMPANY_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "companies")
BASE_VECTOR_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "vector_store")
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB limit

# ============================================================================
# AUTHENTICATION ENDPOINTS
# ============================================================================

@app.post("/auth/login", response_model=Token, tags=["Auth"])
async def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    """User login endpoint"""
    try:
        user = db.query(User).filter(User.username == credentials.username).first()
        if not user or not verify_password(credentials.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password"
            )
        
        access_token, refresh_token = create_tokens(data={"sub": user.username})
        return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed"
        )

@app.post("/auth/refresh", response_model=Token, tags=["Auth"])
async def refresh_token(refresh_token: str, db: Session = Depends(get_db)):
    """Refresh access token using refresh token"""
    try:
        # Verify refresh token
        payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        # Check if user exists
        user = db.query(User).filter(User.username == username).first()
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        
        # Create new tokens
        access_token, new_refresh_token = create_tokens(data={"sub": username})
        return {"access_token": access_token, "refresh_token": new_refresh_token, "token_type": "bearer"}
        
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    except Exception as e:
        logger.error(f"Token refresh error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Token refresh failed"
        )

# ============================================================================
# USER MANAGEMENT ENDPOINTS
# ============================================================================

@app.get("/users/me", response_model=UserResponse, tags=["Auth"])
async def get_current_user_info(current_user=Depends(get_current_user)):
    """Get current user information"""
    return current_user

@app.post("/users", response_model=UserResponse, dependencies=[Depends(admin_required)], tags=["Auth"])
async def create_user(user: UserCreate, db: Session = Depends(get_db)):
    """Create a new user (admin only)"""
    try:
        existing = db.query(User).filter(User.username == user.username).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already exists"
            )
        
        password_hash = get_password_hash(user.password)
        db_user = User(
            username=user.username,
            email=user.email,
            password_hash=password_hash,
            role=user.role
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        return db_user
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating user: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user"
        )

@app.get("/admin/users", response_model=List[UserResponse], dependencies=[Depends(admin_required)], tags=["Auth"])
async def list_users(db: Session = Depends(get_db)):
    """List all users (admin only)"""
    try:
        return db.query(User).all()
    except Exception as e:
        logger.error(f"Error listing users: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve users"
        )

# ============================================================================
# COMPANY MANAGEMENT ENDPOINTS
# ============================================================================

@app.post("/companies", dependencies=[Depends(admin_required)], tags=["Company"])
async def create_company_endpoint(company: CompanyCreate, db: Session = Depends(get_db)):
    """Create a new company with required model configuration"""
    return await create_company(company, db)

@app.get("/admin/companies", response_model=List[CompanyResponse], dependencies=[Depends(admin_required)], tags=["Company"])
async def list_companies(db: Session = Depends(get_db)):
    """List all companies (admin only)"""
    return await get_all_companies(db)

@app.patch("/companies/{company_id}", dependencies=[Depends(admin_required)], tags=["Company"])
async def update_company_endpoint(company_id: int, update: CompanyUpdate, db: Session = Depends(get_db)):
    """Update company configuration"""
    return await update_company(company_id, update, db)

@app.delete("/admin/companies/{company_id}", dependencies=[Depends(admin_required)], tags=["Company"])
async def remove_company_endpoint(company_id: int, db: Session = Depends(get_db)):
    """Remove a company completely from the database and file system"""
    return await remove_company(company_id, db)

# ============================================================================
# OPENAI MODELS ENDPOINT
# ============================================================================

@app.get("/admin/openai/models", tags=["Admin"])
async def get_openai_models(user=Depends(admin_required)):
    """Get list of available OpenAI models for company configuration (admin only)"""
    return {
        "models": openai_models_service.get_available_models(),
        "timestamp": datetime.utcnow()
    }

# ============================================================================
# PDF MANAGEMENT ENDPOINTS
# ============================================================================

@app.post("/companies/{company_id}/pdfs", response_model=PDFUploadResponse, dependencies=[Depends(admin_required)], tags=["PDF"])
async def upload_pdf(
    request: Request, 
    company_id: int, 
    file: UploadFile = File(...), 
    db: Session = Depends(get_db)
):
    """Upload PDF file for a company"""
    try:
        # Validate company exists
        company = db.query(Company).filter(Company.id == company_id).first()
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found"
            )
        
        # Validate file
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only PDF files are allowed"
            )
        
        # Create company directory if it doesn't exist
        company_dir = os.path.join(BASE_COMPANY_DIR, company.name)
        os.makedirs(company_dir, exist_ok=True)
        
        # Save file
        file_path = os.path.join(company_dir, file.filename)
        with open(file_path, "wb") as buffer:
            content = file.file.read()
            if len(content) > MAX_FILE_SIZE:
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail="File too large. Maximum size is 50MB."
                )
            buffer.write(content)
        
        # Save to database
        pdf_file = PDFFile(
            filename=file.filename,
            company_id=company_id,
            upload_timestamp=datetime.utcnow(),
            file_size=len(content)
        )
        db.add(pdf_file)
        db.commit()
        
        # Build or update vector store for the company
        try:
            if embeddings:
                logger.info(f"Building vector store for company: {company.name}")
                # Force rebuild to ensure new PDF is included
                await build_or_update_vector_store(company.name, embeddings, rebuild=True)
                logger.info(f"Vector store updated for company: {company.name}")
                
                # Update agent to use the new vector store
                try:
                    logger.info(f"Updating agent for company: {company.name} to use new vector store")
                    # Force remove existing agent so it gets recreated with new vector store
                    agent_manager.force_remove_agent(company_id)
                    logger.info(f"Agent removed for company: {company.name}, will be recreated on next use")
                except Exception as e:
                    logger.warning(f"Error updating agent for company {company.name}: {e}")
            else:
                logger.warning("Embeddings not available, skipping vector store update")
        except Exception as e:
            logger.error(f"Error updating vector store after PDF upload: {e}")
            # Don't fail the upload, just log the error
        
        logger.info(f"PDF uploaded: {file.filename} for company: {company.name}")
        return {
            "message": "PDF uploaded successfully",
            "filename": file.filename,
            "company_id": company_id,
            "file_size": len(content),
            "upload_timestamp": datetime.utcnow()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading PDF: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload PDF"
        )

@app.delete("/companies/{company_id}/pdfs/{filename}", dependencies=[Depends(admin_required)], tags=["PDF"])
async def remove_pdf(company_id: int, filename: str, db: Session = Depends(get_db)):
    """Remove a PDF file from a company"""
    try:
        # Get company
        company = db.query(Company).filter(Company.id == company_id).first()
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found"
            )
        
        # Get PDF record
        pdf_file = db.query(PDFFile).filter(
            PDFFile.company_id == company_id,
            PDFFile.filename == filename
        ).first()
        
        if not pdf_file:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="PDF file not found"
            )
        
        # Remove file from filesystem
        file_path = os.path.join(BASE_COMPANY_DIR, company.name, filename)
        if os.path.exists(file_path):
            os.remove(file_path)
            logger.info(f"Removed PDF file: {file_path}")
        
        # Remove from database
        db.delete(pdf_file)
        db.commit()
        
        # Remove vector store completely and rebuild from scratch
        try:
            if embeddings:
                logger.info(f"Removing vector store completely for company: {company.name}")
                
                # Remove the entire vector store directory
                vector_store_path = os.path.join(BASE_VECTOR_DIR, company.name)
                if os.path.exists(vector_store_path):
                    import shutil
                    shutil.rmtree(vector_store_path)
                    logger.info(f"Vector store directory removed: {vector_store_path}")
                
                # Check if there are remaining PDFs to rebuild from
                remaining_pdfs = db.query(PDFFile).filter(PDFFile.company_id == company_id).count()
                if remaining_pdfs > 0:
                    logger.info(f"Rebuilding vector store from {remaining_pdfs} remaining PDFs for company: {company.name}")
                    await build_or_update_vector_store(company.name, embeddings, rebuild=True)
                    logger.info(f"Vector store rebuilt for company: {company.name}")
                    
                    # Update agent to use the new vector store
                    try:
                        logger.info(f"Updating agent for company: {company.name} to use rebuilt vector store")
                        # Force remove existing agent so it gets recreated with new vector store
                        agent_manager.force_remove_agent(company_id)
                        logger.info(f"Agent removed for company: {company.name}, will be recreated on next use")
                    except Exception as e:
                        logger.warning(f"Error updating agent for company {company.name}: {e}")
                else:
                    logger.info(f"No PDFs remaining for company: {company.name}, vector store not rebuilt")
                    # Remove agent since no PDFs remain
                    try:
                        logger.info(f"Removing agent for company: {company.name} since no PDFs remain")
                        agent_manager.force_remove_agent(company_id)
                    except Exception as e:
                        logger.warning(f"Error removing agent for company {company.name}: {e}")
            else:
                logger.warning("Embeddings not available, skipping vector store rebuild")
        except Exception as e:
            logger.error(f"Error rebuilding vector store after PDF removal: {e}")
            # Don't fail the removal, just log the error
        
        return {"message": f"PDF {filename} removed successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error removing PDF: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to remove PDF"
        )

@app.get("/companies/{company_id}/pdfs", dependencies=[Depends(admin_required)], tags=["PDF"])
async def list_company_pdfs(company_id: int, db: Session = Depends(get_db)):
    """List all PDF files for a company"""
    try:
        # Get company
        company = db.query(Company).filter(Company.id == company_id).first()
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found"
            )
        
        # Get PDF files
        pdf_files = db.query(PDFFile).filter(PDFFile.company_id == company_id).all()
        
        return {
            "company_id": company_id,
            "company_name": company.name,
            "pdf_files": [
                {
                    "id": pdf.id,
                    "filename": pdf.filename,
                    "upload_timestamp": pdf.upload_timestamp,
                    "file_size": pdf.file_size
                }
                for pdf in pdf_files
            ],
            "total_count": len(pdf_files)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing PDFs: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list PDFs"
        )

# ============================================================================
# QUESTION ANSWERING ENDPOINTS
# ============================================================================

@app.post("/companies/{company_id}/ask", response_model=AskResponse, tags=["Company"])
async def ask_question(
    request: Request, 
    company_id: int, 
    req: AskRequest, 
    user=Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Ask a question about company documents using simple QA"""
    try:
        # Get company
        company = db.query(Company).filter(Company.id == company_id).first()
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found"
            )
        
        # Check PDF count
        pdf_count = db.query(PDFFile).filter(PDFFile.company_id == company_id).count()
        if pdf_count == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No PDF documents found for this company"
            )
        
        # Check embeddings availability
        if not embeddings:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="AI service temporarily unavailable"
            )
        
        # Build or update vector store
        vector_store = await build_or_update_vector_store(company.name, embeddings)
        
        # Get actual document count from vector store
        from .vector_store_utils import get_vector_store_document_count, is_valid_vector_store
        
        if not is_valid_vector_store(vector_store):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Vector store is not valid or empty"
            )
        
        vector_doc_count = get_vector_store_document_count(vector_store)
        logger.info(f"Company: {company.name}, Database PDFs: {pdf_count}, Vector store documents: {vector_doc_count}")
        
        if vector_doc_count == 0:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Vector store has no documents. Please try rebuilding the vector store."
            )
        
        # Create QA chain with better retriever settings
        from langchain_openai import ChatOpenAI
        from langchain.chains import RetrievalQA
        
        llm = ChatOpenAI(
            openai_api_key=os.getenv("OPENAI_API_KEY"),
            model_name=company.model_name,
            temperature=company.temperature,
            max_tokens=company.max_tokens
        )
        
        # Use ALL documents for maximum coverage
        k_value = vector_doc_count  # Use all available documents
        logger.info(f"Using ALL {k_value} documents for retrieval (maximum coverage)")
        
        qa_chain = RetrievalQA.from_chain_type(
            llm=llm,
            chain_type="stuff",
            retriever=vector_store.as_retriever(search_kwargs={"k": k_value})
        )
        
        # Get answer
        answer = qa_chain.invoke({"query": req.question})
        answer_text = answer.get("result", "No answer generated")
        
        # Clean up the answer - remove any extra formatting or metadata
        if isinstance(answer_text, str):
            # Remove any extra whitespace and newlines
            answer_text = answer_text.strip()
            # If the answer contains metadata or extra formatting, try to extract just the content
            if "\\n" in answer_text or "\\t" in answer_text:
                answer_text = answer_text.replace("\\n", " ").replace("\\t", " ")
            # Remove any extra spaces
            answer_text = " ".join(answer_text.split())
        else:
            answer_text = str(answer_text)
        
        # Log the question and answer
        qa_log = QALog(
            company_id=company_id,
            user_id=user.id,
            question=req.question,
            answer=answer_text,
            timestamp=datetime.utcnow()
        )
        db.add(qa_log)
        db.commit()
        
        return {
            "answer": answer_text,
            "company_id": company_id,
            "question": req.question,
            "timestamp": datetime.utcnow()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in ask endpoint: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process question"
        )

@app.post("/companies/{company_id}/agent/ask", response_model=AgentAskResponse, tags=["Company"])
async def ask_agent(
    request: Request, 
    company_id: int, 
    req: AskRequest, 
    user=Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Ask a question using AI agent with memory"""
    try:
        # Get company
        company = db.query(Company).filter(Company.id == company_id).first()
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found"
            )
        
        # Check if company has PDF files before trying to create agent
        pdf_count = db.query(PDFFile).filter(PDFFile.company_id == company_id).count()
        if pdf_count == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No PDF documents found for this company. Please upload PDF documents first before asking questions."
            )
        
        # Get or create agent
        response = None  # Initialize response variable
        try:
            agent = await agent_manager.get_agent(company, embeddings)
        except RuntimeError as agent_error:
            if "No PDF files found" in str(agent_error) or "Company PDF directory does not exist" in str(agent_error):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Cannot create agent: {str(agent_error)}. Please upload PDF documents first."
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to create agent: {str(agent_error)}"
                )
        
        # Ask question
        try:
            response = await agent.ainvoke({"input": req.question})
            answer = response.get("output", "No answer generated")
            
            # Clean up the agent answer
            if isinstance(answer, str):
                answer = answer.strip()
                # Remove any extra formatting
                if "\\n" in answer or "\\t" in answer:
                    answer = answer.replace("\\n", " ").replace("\\t", " ")
                # Remove extra spaces
                answer = " ".join(answer.split())
            else:
                answer = str(answer)
            
            # Check if response is incomplete or invalid
            if not answer or answer.strip() == "" or "Invalid or incomplete response" in answer:
                logger.warning(f"Incomplete agent response for company {company.name}: {answer}")
                # Try to get intermediate steps for debugging
                if "intermediate_steps" in response:
                    steps = response["intermediate_steps"]
                    logger.info(f"Agent intermediate steps: {steps}")
                
                # Provide fallback answer
                answer = "I apologize, but I encountered an issue processing your question. Let me try a simpler approach."
                
                # Try to get a direct answer from the vector store as fallback
                try:
                    from langchain_openai import ChatOpenAI
                    from langchain.chains import RetrievalQA
                    
                    vector_store = await build_or_update_vector_store(company.name, embeddings)
                    
                    # Get document count from vector store
                    from .vector_store_utils import get_vector_store_document_count
                    vector_doc_count = get_vector_store_document_count(vector_store)
                    
                    llm = ChatOpenAI(
                        openai_api_key=os.getenv("OPENAI_API_KEY"),
                        model_name=company.model_name,
                        temperature=company.temperature,
                        max_tokens=company.max_tokens
                    )
                    
                    qa_chain = RetrievalQA.from_chain_type(
                        llm=llm,
                        chain_type="stuff",
                        retriever=vector_store.as_retriever(search_kwargs={"k": vector_doc_count})  # Use ALL documents
                    )
                    
                    fallback_response = qa_chain.invoke({"query": req.question})
                    fallback_answer = fallback_response.get("result", "")
                    
                    if fallback_answer and fallback_answer.strip():
                        # Clean up fallback answer too
                        if isinstance(fallback_answer, str):
                            fallback_answer = fallback_answer.strip()
                            if "\\n" in fallback_answer or "\\t" in fallback_answer:
                                fallback_answer = fallback_answer.replace("\\n", " ").replace("\\t", " ")
                            fallback_answer = " ".join(fallback_answer.split())
                        
                        answer = f"{answer} Here's what I found: {fallback_answer}"
                        logger.info(f"Fallback answer generated: {fallback_answer[:100]}...")
                    
                except Exception as fallback_error:
                    logger.error(f"Fallback answer generation failed: {fallback_error}")
                    answer = "I apologize, but I'm unable to process your question at the moment. Please try again or contact support."
            
        except Exception as agent_error:
            logger.error(f"Agent error for company {company.name}: {agent_error}")
            answer = f"I encountered an error while processing your question: {str(agent_error)}"
        
        # Log the interaction
        agent_log = AgentLog(
            company_id=company_id,
            user_id=user.id,
            question=req.question,
            answer=answer,
            reasoning=str(response) if response else "Error occurred during agent creation or execution",
            timestamp=datetime.utcnow()
        )
        db.add(agent_log)
        db.commit()
        
        return {
            "answer": answer,
            "company_id": company_id,
            "question": req.question,
            "reasoning": str(response) if response else "Error occurred during agent creation or execution",
            "timestamp": datetime.utcnow()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in agent ask endpoint: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process question with agent"
        )

# ============================================================================
# AGENT MANAGEMENT ENDPOINTS
# ============================================================================

@app.post("/companies/{company_id}/agent/reset", tags=["Agent"])
async def reset_agent(company_id: int, user=Depends(admin_required), db: Session = Depends(get_db)):
    """Reset agent memory for a company"""
    try:
        company = db.query(Company).filter(Company.id == company_id).first()
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found"
            )
        
        if agent_manager.reset_agent_memory(company.id):
            logger.info(f"Agent memory reset for company: {company.name}")
            return {"message": f"Memory reset for {company.name}"}
        return {"message": "No memory to reset"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error resetting agent: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to reset agent"
        )

@app.get("/companies/{company_id}/agent/logs", response_model=List[AgentLogResponse], tags=["Agent"])
async def list_agent_logs(
    company_id: int, 
    user: int = Query(None), 
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db), 
    current_user=Depends(get_current_user)
):
    """List agent logs for a company with pagination"""
    try:
        # Get company
        company = db.query(Company).filter(Company.id == company_id).first()
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found"
            )
        
        # Build query
        query = db.query(AgentLog).filter(AgentLog.company_id == company_id)
        
        # Apply filters
        if user:
            query = query.filter(AgentLog.user_id == user)
        
        # Apply pagination
        total_count = query.count()
        logs = query.offset(offset).limit(limit).all()
        
        return logs
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing agent logs: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list agent logs"
        )

@app.get("/companies/{company_id}/agent/logs/{log_id}", response_model=AgentLogResponse, tags=["Agent"])
async def replay_agent_log(company_id: int, log_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Get a specific agent log for replay"""
    try:
        log = db.query(AgentLog).filter(
            AgentLog.id == log_id,
            AgentLog.company_id == company_id
        ).first()
        
        if not log:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent log not found"
            )
        
        return log
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving agent log: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve agent log"
        )

@app.delete("/companies/{company_id}/agent/logs", dependencies=[Depends(admin_required)], tags=["Agent"])
async def clear_agent_logs(company_id: int, db: Session = Depends(get_db)):
    """Clear all agent logs for a company"""
    try:
        company = db.query(Company).filter(Company.id == company_id).first()
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found"
            )
        
        deleted_count = db.query(AgentLog).filter(AgentLog.company_id == company_id).delete()
        db.commit()
        logger.info(f"Cleared {deleted_count} agent logs for company_id: {company_id}")
        return {"message": f"Cleared {deleted_count} agent logs"}
        
    except HTTPException:
        raise
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error clearing agent logs: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error occurred"
        )
    except Exception as e:
        logger.error(f"Unexpected error clearing agent logs: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unexpected error occurred"
        )

# ============================================================================
# VECTOR STORE MANAGEMENT ENDPOINTS
# ============================================================================

@app.get("/companies/{company_id}/vector-store-status", tags=["VectorStore"])
async def get_vector_store_status(company_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Get vector store status for a company"""
    try:
        company = db.query(Company).filter(Company.id == company_id).first()
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found"
            )
        
        # Check PDF count
        pdf_count = db.query(PDFFile).filter(PDFFile.company_id == company.id).count()
        
        vector_store_info = {
            "company_name": company.name,
            "pdf_count": pdf_count,
            "embeddings_available": embeddings is not None
        }
        
        if embeddings:
            try:
                from .vector_store_utils import is_valid_vector_store, get_vector_store_document_count
                
                vector_store = await build_or_update_vector_store(company.name, embeddings)
                is_valid = is_valid_vector_store(vector_store)
                doc_count = get_vector_store_document_count(vector_store)
                
                vector_store_info.update({
                    "vector_store_valid": is_valid,
                    "document_count": doc_count,
                    "status": "healthy" if is_valid and doc_count > 0 else "warning" if is_valid else "error"
                })
            except FileNotFoundError as e:
                vector_store_info.update({
                    "vector_store_valid": False,
                    "document_count": 0,
                    "status": f"file_not_found: {str(e)}"
                })
            except RuntimeError as e:
                vector_store_info.update({
                    "vector_store_valid": False,
                    "document_count": 0,
                    "status": f"runtime_error: {str(e)}"
                })
            except Exception as e:
                vector_store_info.update({
                    "vector_store_valid": False,
                    "document_count": 0,
                    "status": f"error: {str(e)}"
                })
        else:
            vector_store_info.update({
                "vector_store_valid": False,
                "document_count": 0,
                "status": "embeddings_unavailable"
            })
        
        return vector_store_info
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting vector store status: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get vector store status"
        )

@app.post("/companies/{company_id}/rebuild-vector-store", dependencies=[Depends(admin_required)], tags=["VectorStore"])
async def rebuild_vector_store(company_id: int, db: Session = Depends(get_db)):
    """Rebuild vector store for a company"""
    try:
        company = db.query(Company).filter(Company.id == company_id).first()
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found"
            )
        
        if not embeddings:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Embeddings service not available"
            )
        
        # Check PDF count
        pdf_count = db.query(PDFFile).filter(PDFFile.company_id == company_id).count()
        if pdf_count == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No PDF documents found for this company"
            )
        
        # Rebuild vector store
        vector_store = await build_or_update_vector_store(company.name, embeddings, rebuild=True)
        
        # Get document count
        from .vector_store_utils import get_vector_store_document_count
        doc_count = get_vector_store_document_count(vector_store)
        
        # Update agent to use the rebuilt vector store
        try:
            logger.info(f"Updating agent for company: {company.name} to use rebuilt vector store")
            # Force remove existing agent so it gets recreated with new vector store
            agent_manager.force_remove_agent(company_id)
            logger.info(f"Agent removed for company: {company.name}, will be recreated on next use")
        except Exception as e:
            logger.warning(f"Error updating agent for company {company.name}: {e}")
        
        logger.info(f"Vector store rebuilt for company: {company.name}, documents: {doc_count}")
        
        return {
            "message": "Vector store rebuilt successfully",
            "company_id": company_id,
            "company_name": company.name,
            "pdf_count": pdf_count,
            "document_count": doc_count,
            "timestamp": datetime.utcnow()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error rebuilding vector store: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to rebuild vector store"
        )

# ============================================================================
# ADMIN ENDPOINTS
# ============================================================================

@app.get("/admin/agents/status", tags=["Admin"])
async def get_agents_status(user=Depends(admin_required)):
    """Get status of all agents (admin only)"""
    try:
        return {
            "agents": agent_manager.get_all_agents(),
            "stats": agent_manager.get_agent_stats(),
            "timestamp": datetime.utcnow()
        }
    except Exception as e:
        logger.error(f"Error getting agents status: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get agents status"
        )

@app.get("/admin/agents/{company_id}/info", tags=["Admin"])
async def get_agent_info(company_id: int, db: Session = Depends(get_db), user=Depends(admin_required)):
    """Get detailed information about a specific agent (admin only)"""
    try:
        # Get company by ID
        company = db.query(Company).filter(Company.id == company_id).first()
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found"
            )
        
        company_name = company.name
        agent_info = agent_manager.get_agent_info(company_id)
        if not agent_info:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No agent found for company: {company_name}"
            )
        
        return {
            "company_id": company_id,
            "company_name": company_name,
            "agent_info": agent_info,
            "timestamp": datetime.utcnow()
        }
    except HTTPException:
        # Re-raise HTTPExceptions without modification
        raise
    except Exception as e:
        logger.error(f"Error getting agent info: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get agent info"
        )

@app.post("/admin/agents/{company_id}/force-remove", tags=["Admin"])
async def force_remove_agent(company_id: int, db: Session = Depends(get_db), user=Depends(admin_required)):
    """Force remove an agent (admin only)"""
    try:
        # Get company by ID
        company = db.query(Company).filter(Company.id == company_id).first()
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found"
            )
        
        company_name = company.name
        if agent_manager.force_remove_agent(company_id):
            return {
                "message": f"Agent forcefully removed for company: {company_name}",
                "company_id": company_id,
                "company_name": company_name
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No agent found for company: {company_name}"
            )
    except HTTPException:
        # Re-raise HTTPExceptions without modification
        raise
    except Exception as e:
        logger.error(f"Error force removing agent: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to force remove agent"
        )

# ============================================================================
# HEALTH CHECK ENDPOINT
# ============================================================================

@app.get("/health", tags=["Admin"])
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow(),
        "services": {
            "database": "connected",
            "embeddings": "available" if embeddings else "unavailable",
            "openai_api": "configured" if os.getenv("OPENAI_API_KEY") else "not_configured"
        }
    }
