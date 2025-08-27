from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime
from typing import List, Optional
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
    PDFUploadResponse, AgentLogResponse, QALogResponse,
    ChatRequest, ChatConversationResponse, ChatConversationDetail,
    ChatMessageResponse
)
from .auth import (
    get_current_user, admin_required, create_tokens, 
    verify_password, get_password_hash, embeddings,
    SECRET_KEY, ALGORITHM
)
from .companies import (
    create_company, update_company, get_all_companies, 
    remove_company
)
from .openai_models import openai_models_service
from .agent_manager import agent_manager
from .vector_store_utils import build_or_update_vector_store
from . import crud

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Insurance",
    description="AI-powered PDF document analysis and question answering system",
    version="1.0.1",
    tags=[
        {"name": "Auth", "description": "Authentication and user management"},
        {"name": "Company", "description": "Company management and configuration"},
        {"name": "PDF", "description": "PDF file management and operations"},
        {"name": "VectorStore", "description": "Vector store management and operations"},
        {"name": "Agent", "description": "AI agent management and interactions"},
        {"name": "QA", "description": "Question and answer log management"},
        {"name": "Chat", "description": "Chat conversations and messaging"},
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
async def refresh_token(request: Request, db: Session = Depends(get_db)):
    """Refresh access token using refresh token"""
    try:
        # Get refresh token from request body
        body = await request.json()
        refresh_token = body.get("refresh_token")
        
        if not refresh_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Refresh token is required"
            )
        
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

@app.post("/admin/users", response_model=UserResponse, dependencies=[Depends(admin_required)], tags=["Auth"])
async def create_user(user: UserCreate, db: Session = Depends(get_db)):
    """Create a new user (admin only)"""
    try:
        # Check for existing username
        existing_username = db.query(User).filter(User.username == user.username).first()
        if existing_username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already exists"
            )
        
        # Check for existing email
        existing_email = db.query(User).filter(User.email == user.email).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already exists"
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

@app.get("/admin/users/{user_id}", response_model=UserResponse, dependencies=[Depends(admin_required)], tags=["Auth"])
async def get_user(user_id: int, db: Session = Depends(get_db)):
    """Get a specific user by ID (admin only)"""
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        return user
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving user {user_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve user"
        )

@app.put("/admin/users/{user_id}", response_model=UserResponse, dependencies=[Depends(admin_required)], tags=["Auth"])
async def update_user(user_id: int, user_update: UserUpdate, db: Session = Depends(get_db)):
    """Update a user (admin only)"""
    try:
        # Check if user exists
        existing_user = db.query(User).filter(User.id == user_id).first()
        if not existing_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Update user using CRUD function
        updated_user = crud.update_user(db, user_id, user_update)
        if not updated_user:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update user"
            )
        
        return updated_user
        
    except ValueError as e:
        # Handle validation errors from CRUD function
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating user {user_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user"
        )

@app.delete("/admin/users/{user_id}", dependencies=[Depends(admin_required)], tags=["Auth"])
async def delete_user(user_id: int, db: Session = Depends(get_db)):
    """Delete a user (admin only)"""
    try:
        # Check if user exists
        existing_user = db.query(User).filter(User.id == user_id).first()
        if not existing_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Delete user using CRUD function
        deleted_user = crud.delete_user(db, user_id)
        if not deleted_user:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete user"
            )
        
        return {"message": "User deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting user {user_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete user"
        )

# ============================================================================
# COMPANY MANAGEMENT ENDPOINTS
# ============================================================================

@app.post("/admin/companies", dependencies=[Depends(admin_required)], tags=["Company"])
async def create_company_endpoint(company: CompanyCreate, db: Session = Depends(get_db)):
    """Create a new company with required model configuration"""
    return await create_company(company, db)

@app.get("/admin/companies", response_model=List[CompanyResponse], dependencies=[Depends(admin_required)], tags=["Company"])
async def list_companies(db: Session = Depends(get_db)):
    """List all companies (admin only)"""
    return await get_all_companies(db)

@app.get("/companies", response_model=List[CompanyResponse], tags=["Company"])
async def get_companies(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Get all companies (accessible to all authenticated users)"""
    return await get_all_companies(db)

@app.patch("/admin/companies/{company_id}", dependencies=[Depends(admin_required)], tags=["Company"])
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
        
        # Transform logs to match QALogResponse schema
        response_logs = []
        for log in logs:
            response_logs.append({
                "id": log.id,
                "question": log.question,
                "user_id": log.user_id,
                "company_id": log.company_id,
                "answer": log.answer,
                "timestamp": log.timestamp,
                "company_name": company.name
            })
        
        return response_logs
        
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
        
        # Transform log to match AgentLogResponse schema
        return {
            "id": log.id,
            "user_id": log.user_id,
            "company_id": log.company_id,
            "question": log.question,
            "answer": log.answer,
            "reasoning": log.reasoning,
            "timestamp": log.timestamp
        }
        
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
# QA LOG ENDPOINTS
# ============================================================================

@app.get("/companies/{company_id}/qa/logs", response_model=List[QALogResponse], tags=["QA"])
async def list_qa_logs(
    company_id: int, 
    user: int = Query(None), 
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db), 
    current_user=Depends(get_current_user)
):
    """List QA logs for a company with pagination"""
    try:
        # Get company
        company = db.query(Company).filter(Company.id == company_id).first()
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found"
            )
        
        # Build query
        query = db.query(QALog).filter(QALog.company_id == company_id)
        
        # Apply filters
        if user:
            query = query.filter(QALog.user_id == user)
        
        # Apply pagination
        total_count = query.count()
        logs = query.offset(offset).limit(limit).all()
        
        # Transform logs to match QALogResponse schema
        response_logs = []
        for log in logs:
            response_logs.append({
                "id": log.id,
                "question": log.question,
                "user_id": log.user_id,
                "company_id": log.company_id,
                "answer": log.answer,
                "timestamp": log.timestamp,
                "company_name": company.name  # Add company name from the company query
            })
        
        return response_logs
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing QA logs: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list QA logs"
        )

@app.get("/companies/{company_id}/qa/logs/{log_id}", response_model=QALogResponse, tags=["QA"])
async def get_qa_log(company_id: int, log_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Get a specific QA log"""
    try:
        # Get company first
        company = db.query(Company).filter(Company.id == company_id).first()
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found"
            )
        
        log = db.query(QALog).filter(
            QALog.id == log_id,
            QALog.company_id == company_id
        ).first()
        
        if not log:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="QA log not found"
            )
        
        # Transform log to match QALogResponse schema
        return {
            "id": log.id,
            "question": log.question,
            "answer": log.answer,
            "timestamp": log.timestamp,
            "company_name": company.name  # Add company name from the company query
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving QA log: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve QA log"
        )

@app.delete("/companies/{company_id}/qa/logs", dependencies=[Depends(admin_required)], tags=["QA"])
async def clear_qa_logs(company_id: int, db: Session = Depends(get_db)):
    """Clear all QA logs for a company"""
    try:
        company = db.query(Company).filter(Company.id == company_id).first()
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found"
            )
        
        deleted_count = db.query(QALog).filter(QALog.company_id == company_id).delete()
        db.commit()
        logger.info(f"Cleared {deleted_count} QA logs for company_id: {company_id}")
        return {"message": f"Cleared {deleted_count} QA logs"}
        
    except HTTPException:
        raise
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error clearing QA logs: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error occurred"
        )
    except Exception as e:
        logger.error(f"Unexpected error clearing QA logs: {e}", exc_info=True)
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
# TEST ENDPOINTS
# ============================================================================

@app.get("/test/health", tags=["Admin"])
async def test_health_check():
    """Simple test endpoint to debug health check issues"""
    try:
        return {
            "message": "Health check test endpoint working",
            "timestamp": datetime.utcnow(),
            "test": "success"
        }
    except Exception as e:
        logger.error(f"Test health check error: {e}")
        return {
            "message": "Health check test endpoint failed",
            "error": str(e),
            "timestamp": datetime.utcnow()
        }

# ============================================================================
# SYSTEM STATUS ENDPOINTS
# ============================================================================

@app.get("/admin/system/status", tags=["Admin"])
async def get_system_status(user=Depends(admin_required)):
    """Get comprehensive system status including counts and service health"""
    try:
        db = next(get_db())
        
        # Get basic counts
        try:
            user_count = db.query(User).count()
            company_count = db.query(Company).count()
            pdf_count = db.query(PDFFile).count()
            qa_log_count = db.query(QALog).count()
            agent_log_count = db.query(AgentLog).count()
        except Exception as e:
            logger.error(f"Error getting database counts: {e}")
            user_count = company_count = pdf_count = qa_log_count = agent_log_count = 0
        
        # Get service health
        try:
            health_response = await health_check()
            service_health = health_response.get("services", {})
            overall_health = health_response.get("overall_status", "unknown")
        except Exception as e:
            logger.error(f"Error getting health status: {e}")
            service_health = {}
            overall_health = "unknown"
        
        # Get agent status
        try:
            agent_status = agent_manager.get_agent_stats()
        except Exception as e:
            logger.error(f"Error getting agent status: {e}")
            agent_status = {"active_agents": 0, "total_memory": 0}
        
        # Get system info
        import platform
        import psutil
        
        try:
            system_info = {
                "python_version": platform.python_version(),
                "platform": platform.platform(),
                "cpu_count": psutil.cpu_count(),
                "memory_total": psutil.virtual_memory().total,
                "memory_available": psutil.virtual_memory().available,
                "disk_usage": psutil.disk_usage('/').percent if os.path.exists('/') else 0
            }
        except ImportError:
            system_info = {
                "python_version": platform.python_version(),
                "platform": platform.platform(),
                "note": "psutil not available for detailed system metrics"
            }
        except Exception as e:
            logger.error(f"Error getting system info: {e}")
            system_info = {"error": str(e)}
        
        db.close()
        
        return {
            "timestamp": datetime.utcnow(),
            "overall_status": overall_health,
            "counts": {
                "users": user_count,
                "companies": company_count,
                "pdf_files": pdf_count,
                "qa_logs": qa_log_count,
                "agent_logs": agent_log_count
            },
            "services": service_health,
            "agents": agent_status,
            "system": system_info
        }
        
    except Exception as e:
        logger.error(f"Error getting system status: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get system status"
        )

# ============================================================================
# HEALTH CHECK ENDPOINT
# ============================================================================

@app.get("/health", tags=["Admin"])
async def health_check():
    """Health check endpoint that actually tests service availability"""
    try:
        logger.info("Starting health check...")
        health_status = {
            "timestamp": datetime.utcnow(),
            "overall_status": "unknown",
            "services": {}
        }
        
        # Test database connectivity
        try:
            logger.info("Testing database connectivity...")
            db = next(get_db())
            # Try a simple query - use text() for raw SQL
            from sqlalchemy import text
            db.execute(text("SELECT 1"))
            db.close()
            health_status["services"]["database"] = {
                "status": "healthy",
                "message": "Database connection successful"
            }
            logger.info("Database health check passed")
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            health_status["services"]["database"] = {
                "status": "unhealthy",
                "message": f"Database connection failed: {str(e)}"
            }
        
        # Test embeddings service
        try:
            logger.info("Testing embeddings service...")
            if embeddings:
                # Try to create a simple test embedding
                test_text = "test"
                test_embedding = embeddings.embed_query(test_text)
                if test_embedding and len(test_embedding) > 0:
                    health_status["services"]["embeddings"] = {
                        "status": "healthy",
                        "message": "Embeddings service working"
                    }
                    logger.info("Embeddings health check passed")
                else:
                    health_status["services"]["embeddings"] = {
                        "status": "unhealthy",
                        "message": "Embeddings service returned empty result"
                    }
                    logger.warning("Embeddings service returned empty result")
            else:
                health_status["services"]["embeddings"] = {
                    "status": "unavailable",
                    "message": "Embeddings service not configured"
                }
                logger.info("Embeddings service not configured")
        except Exception as e:
            logger.error(f"Embeddings health check failed: {e}")
            health_status["services"]["embeddings"] = {
                "status": "unhealthy",
                "message": f"Embeddings service error: {str(e)}"
            }
        
        # Test OpenAI API
        try:
            logger.info("Testing OpenAI API configuration...")
            openai_key = os.getenv("OPENAI_API_KEY")
            if openai_key:
                # Just test the configuration, don't make an actual request
                health_status["services"]["openai_api"] = {
                    "status": "configured",
                    "message": "OpenAI API key configured"
                }
                logger.info("OpenAI API key found")
            else:
                health_status["services"]["openai_api"] = {
                    "status": "not_configured",
                    "message": "OpenAI API key not found in environment"
                }
                logger.warning("OpenAI API key not found")
        except Exception as e:
            logger.error(f"OpenAI API health check failed: {e}")
            health_status["services"]["openai_api"] = {
                "status": "error",
                "message": f"OpenAI API test failed: {str(e)}"
            }
        
        # Determine overall status
        logger.info("Determining overall health status...")
        service_statuses = [service["status"] for service in health_status["services"].values()]
        logger.info(f"Service statuses: {service_statuses}")
        
        if "unhealthy" in service_statuses:
            health_status["overall_status"] = "unhealthy"
            logger.warning("Overall status: unhealthy")
        elif "unavailable" in service_statuses and "healthy" not in service_statuses:
            health_status["overall_status"] = "degraded"
            logger.warning("Overall status: degraded")
        elif all(status in ["healthy", "configured"] for status in service_statuses):
            health_status["overall_status"] = "healthy"
            logger.info("Overall status: healthy")
        elif "healthy" in service_statuses:
            health_status["overall_status"] = "operational"
            logger.info("Overall status: operational")
        else:
            health_status["overall_status"] = "unknown"
            logger.warning("Overall status: unknown")
        
        logger.info(f"Health check completed. Overall status: {health_status['overall_status']}")
        
        return health_status
        
    except Exception as e:
        logger.error(f"Health check error: {e}", exc_info=True)
        return {
            "timestamp": datetime.utcnow(),
            "overall_status": "error",
            "error": f"Health check failed: {str(e)}",
            "services": {}
        }

# ============================================================================
# CHAT ENDPOINTS
# ============================================================================

@app.get("/chat/conversations", response_model=List[ChatConversationResponse], tags=["Chat"])
async def get_user_conversations(
    company_id: Optional[int] = Query(None, description="Filter by company ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all chat conversations for the current user"""
    try:
        conversations = crud.get_user_conversations(db, current_user.id, company_id)
        
        # Convert to response format with additional data
        response_conversations = []
        for conv in conversations:
            # Get company name
            company = db.query(Company).filter(Company.id == conv.company_id).first()
            company_name = company.name if company else "Unknown Company"
            
            # Get message count and last message info
            messages = crud.get_conversation_messages(db, conv.id)
            message_count = len(messages)
            last_message = None
            last_message_time = None
            
            if messages:
                last_message = messages[-1].content[:100] + "..." if len(messages[-1].content) > 100 else messages[-1].content
                last_message_time = messages[-1].timestamp
            
            response_conversations.append(ChatConversationResponse(
                id=conv.id,
                user_id=conv.user_id,
                company_id=conv.company_id,
                company_name=company_name,
                title=conv.title,
                chat_type=conv.chat_type,
                created_at=conv.created_at,
                updated_at=conv.updated_at,
                message_count=message_count,
                last_message=last_message,
                last_message_time=last_message_time
            ))
        
        return response_conversations
        
    except Exception as e:
        logger.error(f"Error getting conversations: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get conversations"
        )

@app.get("/chat/conversations/{conversation_id}", response_model=ChatConversationDetail, tags=["Chat"])
async def get_conversation_detail(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed conversation with all messages"""
    try:
        conversation = crud.get_chat_conversation(db, conversation_id)
        if not conversation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found"
            )
        
        # Check if user owns this conversation
        if conversation.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        # Get company name
        company = db.query(Company).filter(Company.id == conversation.company_id).first()
        company_name = company.name if company else "Unknown Company"
        
        # Get messages
        messages = crud.get_conversation_messages(db, conversation_id)
        
        # Convert messages to response format
        response_messages = []
        for msg in messages:
            response_messages.append(ChatMessageResponse(
                id=msg.id,
                message_type=msg.message_type,
                content=msg.content,
                timestamp=msg.timestamp,
                conversation_id=msg.conversation_id
            ))
        
        return ChatConversationDetail(
            id=conversation.id,
            user_id=conversation.user_id,
            company_id=conversation.company_id,
            company_name=company_name,
            title=conversation.title,
            chat_type=conversation.chat_type,
            created_at=conversation.created_at,
            updated_at=conversation.updated_at,
            message_count=len(response_messages),
            last_message=None,
            last_message_time=None,
            messages=response_messages
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting conversation detail: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get conversation detail"
        )

@app.post("/chat/ask", tags=["Chat"])
async def chat_ask(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Ask a question and save to chat conversation"""
    try:
        # Check if company exists
        company = db.query(Company).filter(Company.id == request.company_id).first()
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found"
            )
        
        # Create or get conversation
        conversation_id = request.conversation_id
        if not conversation_id:
            # Create new conversation
            title = request.question[:50] + "..." if len(request.question) > 50 else request.question
            conversation = crud.create_chat_conversation(
                db, current_user.id, request.company_id, title, request.chat_type
            )
            conversation_id = conversation.id
        else:
            # Verify conversation exists and user owns it
            conversation = crud.get_chat_conversation(db, conversation_id)
            if not conversation or conversation.user_id != current_user.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied to conversation"
                )
        
        # Save user message
        crud.create_chat_message(db, conversation_id, "user", request.question)
        
        # Get answer based on chat type
        if request.chat_type == "simple":
            # Use existing QA endpoint logic
            try:
                # Check PDF count
                pdf_count = db.query(PDFFile).filter(PDFFile.company_id == request.company_id).count()
                if pdf_count == 0:
                    answer = "No PDF documents found for this company. Please contact an administrator to upload documents."
                    answer_type = "error"
                else:
                    # Check embeddings availability
                    if not embeddings:
                        answer = "AI service temporarily unavailable. Please try again later."
                        answer_type = "error"
                    else:
                        # Build or update vector store
                        vector_store = await build_or_update_vector_store(company.name, embeddings)
                        
                        # Get actual document count from vector store
                        from .vector_store_utils import get_vector_store_document_count, is_valid_vector_store
                        
                        if not is_valid_vector_store(vector_store):
                            answer = "Vector store is not valid or empty. Please contact an administrator."
                            answer_type = "error"
                        else:
                            vector_doc_count = get_vector_store_document_count(vector_store)
                            
                            if vector_doc_count == 0:
                                answer = "Vector store has no documents. Please contact an administrator."
                                answer_type = "error"
                            else:
                                # Create QA chain
                                from langchain_openai import ChatOpenAI
                                from langchain.chains import RetrievalQA
                                
                                llm = ChatOpenAI(
                                    openai_api_key=os.getenv("OPENAI_API_KEY"),
                                    model_name=company.model_name,
                                    temperature=company.temperature,
                                    max_tokens=company.max_tokens
                                )
                                
                                qa_chain = RetrievalQA.from_chain_type(
                                    llm=llm,
                                    chain_type="stuff",
                                    retriever=vector_store.as_retriever(search_kwargs={"k": vector_doc_count})
                                )
                                
                                # Get answer
                                qa_response = qa_chain.invoke({"query": request.question})
                                answer = qa_response.get("result", "No answer generated")
                                
                                # Clean up the answer
                                if isinstance(answer, str):
                                    answer = answer.strip()
                                    if "\\n" in answer or "\\t" in answer:
                                        answer = answer.replace("\\n", " ").replace("\\t", " ")
                                    answer = " ".join(answer.split())
                                else:
                                    answer = str(answer)
                                
                                answer_type = "assistant"
                                
                                # Log the question and answer
                                qa_log = QALog(
                                    company_id=request.company_id,
                                    user_id=current_user.id,
                                    question=request.question,
                                    answer=answer,
                                    timestamp=datetime.utcnow()
                                )
                                db.add(qa_log)
                                db.commit()
                                
            except Exception as e:
                answer = f"Error processing question: {str(e)}"
                answer_type = "error"
                logger.error(f"Error in chat simple QA: {e}", exc_info=True)
        else:
            # Use existing agent endpoint logic
            try:
                # Check PDF count
                pdf_count = db.query(PDFFile).filter(PDFFile.company_id == request.company_id).count()
                if pdf_count == 0:
                    answer = "No PDF documents found for this company. Please contact an administrator to upload documents."
                    answer_type = "error"
                else:
                    # Get or create agent
                    try:
                        agent = await agent_manager.get_agent(company, embeddings)
                        
                        # Ask question
                        response = await agent.ainvoke({"input": request.question})
                        answer = response.get("output", "No answer generated")
                        
                        # Clean up the agent answer
                        if isinstance(answer, str):
                            answer = answer.strip()
                            if "\\n" in answer or "\\t" in answer:
                                answer = answer.replace("\\n", " ").replace("\\t", " ")
                            answer = " ".join(answer.split())
                        else:
                            answer = str(answer)
                        
                        # Check if response is incomplete or invalid
                        if not answer or answer.strip() == "" or "Invalid or incomplete response" in answer:
                            answer = "I apologize, but I encountered an issue processing your question. Please try again."
                        
                        answer_type = "assistant"
                        
                        # Log the interaction
                        agent_log = AgentLog(
                            company_id=request.company_id,
                            user_id=current_user.id,
                            question=request.question,
                            answer=answer,
                            reasoning=str(response) if response else "Agent response generated",
                            timestamp=datetime.utcnow()
                        )
                        db.add(agent_log)
                        db.commit()
                        
                    except Exception as agent_error:
                        logger.error(f"Agent error in chat: {agent_error}")
                        answer = f"I encountered an error while processing your question: {str(agent_error)}"
                        answer_type = "error"
                        
            except Exception as e:
                answer = f"Error processing question: {str(e)}"
                answer_type = "error"
                logger.error(f"Error in chat agent QA: {e}", exc_info=True)
        
        # Save assistant/error message
        crud.create_chat_message(db, conversation_id, answer_type, answer)
        
        # Update conversation title if it's the first message
        if len(crud.get_conversation_messages(db, conversation_id)) == 2:  # User + Assistant
            crud.update_conversation_title(db, conversation_id, request.question[:50] + "...")
        
        return {
            "conversation_id": conversation_id,
            "answer": answer,
            "message_type": answer_type
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in chat ask: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process chat request"
        )

@app.delete("/chat/conversations/{conversation_id}", tags=["Chat"])
async def delete_conversation(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a chat conversation"""
    try:
        success = crud.delete_conversation(db, conversation_id, current_user.id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found or access denied"
            )
        
        return {"message": "Conversation deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting conversation: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete conversation"
        )
