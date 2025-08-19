from dotenv import load_dotenv
load_dotenv()

import os, asyncio, logging
from datetime import datetime
from fastapi import FastAPI, Depends, UploadFile, HTTPException, Query, status, File, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from langchain_openai import ChatOpenAI
from langchain.chains import RetrievalQA
from . import database, models, schemas, crud, auth
from .vector_store_utils import build_or_update_vector_store, delete_pdf_and_reindex
from .agent_manager import agent_manager
from .callbacks import ReasoningCaptureHandler
from typing import List
import openai
from openai import RateLimitError, OpenAIError

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Setup rate limiting
limiter = Limiter(key_func=get_remote_address)

# Create database tables
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(
    title="PDF QA API with Agents", 
    version="4.1.0",
    description="AI-powered PDF Question Answering API with multi-company support",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8000"],  # Add your frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security middleware
app.add_middleware(
    TrustedHostMiddleware, 
    allowed_hosts=["localhost", "127.0.0.1", "*.yourdomain.com"]
)

BASE_COMPANY_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "companies")
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB limit

# Read optional shared secret from environment
LOGIN_SHARED_SECRET = os.getenv("LOGIN_SHARED_SECRET")

def create_company_folder(company_name):
    """Create company folder with proper error handling"""
    if os.path.isfile(BASE_COMPANY_DIR):
        raise RuntimeError(f"'{BASE_COMPANY_DIR}' exists as a file. Please remove or rename it.")
    os.makedirs(BASE_COMPANY_DIR, exist_ok=True)
    company_path = os.path.join(BASE_COMPANY_DIR, company_name)
    os.makedirs(company_path, exist_ok=True)
    return company_path

def validate_file_upload(file: UploadFile) -> None:
    """Validate uploaded file"""
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are allowed"
        )
    
    # Check file size (this is an approximation for uploaded files)
    if getattr(file, 'size', None) and file.size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB"
        )

@app.post("/auth/login", response_model=schemas.Token)
@limiter.limit("5/minute")
async def login(request: Request, credentials: schemas.LoginRequest, db: Session = Depends(database.get_db)):
    try:
        # Optional shared secret check
        if LOGIN_SHARED_SECRET:
            provided = credentials.secret or credentials.client_secret
            if provided != LOGIN_SHARED_SECRET:
                logger.warning("Login blocked due to invalid shared secret")
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

        user = crud.get_user_by_username(db, credentials.username)
        if not user or not auth.verify_password(credentials.password, user.password_hash):
            logger.warning(f"Failed login attempt for username: {credentials.username}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
                headers={"WWW-Authenticate": "Bearer"}
            )
        access_token, refresh_token = auth.create_tokens({"sub": user.username})
        logger.info(f"Successful login for user: {user.username}")
        return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}
    except SQLAlchemyError as e:
        logger.error(f"Database error during login: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error occurred"
        )

@app.post("/users", response_model=schemas.UserResponse, dependencies=[Depends(auth.admin_required)])
async def create_user(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    try:
        db_user = crud.get_user_by_username(db, user.username)
        if db_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already exists"
            )
        new_user = crud.create_user(db, user)
        logger.info(f"User created: {new_user.username} by admin")
        return new_user
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error creating user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user"
        )

@app.get("/users", response_model=list[schemas.UserResponse], dependencies=[Depends(auth.admin_required)])
async def list_users(db: Session = Depends(database.get_db)):
    try:
        return db.query(models.User).all()
    except SQLAlchemyError as e:
        logger.error(f"Database error listing users: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve users"
        )

@app.patch("/users/{user_id}", response_model=schemas.UserResponse, dependencies=[Depends(auth.admin_required)])
async def update_user(user_id: int, user_update: schemas.UserUpdate, db: Session = Depends(database.get_db)):
    try:
        updated = crud.update_user(db, user_id, user_update)
        if not updated:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        logger.info(f"User updated: {updated.username}")
        return updated
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error updating user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user"
        )

@app.post("/companies", dependencies=[Depends(auth.admin_required)])
async def create_company(company: schemas.CompanyCreate, db: Session = Depends(database.get_db)):
    try:
        existing = db.query(models.Company).filter(models.Company.name == company.name).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Company name already exists"
            )
        db_company = models.Company(name=company.name)
        db.add(db_company)
        db.commit()
        create_company_folder(company.name)
        logger.info(f"Company created: {company.name}")
        return {"message": "Company created", "company_id": db_company.id}
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error creating company: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create company"
        )

@app.get("/admin/companies", response_model=List[schemas.CompanyResponse], dependencies=[Depends(auth.admin_required)])
async def get_all_companies(db: Session = Depends(database.get_db)):
    try:
        return db.query(models.Company).all()
    except SQLAlchemyError as e:
        logger.error(f"Database error listing companies: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve companies"
        )

@app.patch("/companies/{company_id}", dependencies=[Depends(auth.admin_required)])
async def update_company(company_id: int, update: schemas.CompanyUpdate, db: Session = Depends(database.get_db)):
    try:
        company = db.query(models.Company).filter(models.Company.id == company_id).first()
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found"
            )
        if update.model_name:
            company.model_name = update.model_name
        if update.temperature is not None:
            company.temperature = update.temperature
        db.commit()
        logger.info(f"Company updated: {company.name}")
        return {"message": "Company updated"}
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error updating company: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update company"
        )

@app.post("/companies/{company_id}/pdfs", response_model=schemas.PDFUploadResponse, dependencies=[Depends(auth.admin_required)])
@limiter.limit("10/minute")
async def upload_pdf(request: Request, company_id: int, file: UploadFile = File(...), db: Session = Depends(database.get_db)):
    validate_file_upload(file)
    
    try:
        company = db.query(models.Company).filter(models.Company.id == company_id).first()
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found"
            )
        
        # Check if embeddings are available
        if auth.embeddings is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="OpenAI embeddings service unavailable"
            )
        
        create_company_folder(company.name)
        file_path = os.path.join(f"companies/{company.name}", file.filename)
        
        # Write file with size check
        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB"
            )
        
        with open(file_path, "wb") as f:
            f.write(content)
        
        await build_or_update_vector_store(company.name, auth.embeddings)
        
        pdf = models.PDFFile(filename=file.filename, company_id=company.id)
        db.add(pdf)
        db.commit()
        
        logger.info(f"PDF uploaded: {file.filename} for company {company.name}")
        return schemas.PDFUploadResponse(
            message="PDF uploaded and indexed",
            filename=file.filename,
            upload_timestamp=datetime.utcnow()
        )
        
    except RateLimitError:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="OpenAI API rate limit exceeded. Please try again later."
        )
    except OpenAIError as e:
        logger.error(f"OpenAI API error: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"OpenAI API error: {str(e)}"
        )
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error uploading PDF: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error occurred"
        )
    except Exception as e:
        logger.error(f"Unexpected error uploading PDF: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unexpected error occurred"
        )

@app.delete("/companies/{company_id}/pdfs/{filename}", dependencies=[Depends(auth.admin_required)])
async def remove_pdf(company_id: int, filename: str, db: Session = Depends(database.get_db)):
    try:
        company = db.query(models.Company).filter(models.Company.id == company_id).first()
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found"
            )
        
        file_path = os.path.join(BASE_COMPANY_DIR, company.name, filename)
        if not os.path.exists(file_path):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found"
            )
        
        if auth.embeddings is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="OpenAI embeddings service unavailable"
            )
        
        await delete_pdf_and_reindex(company.name, filename, auth.embeddings)
        
        db.query(models.PDFFile).filter(
            models.PDFFile.company_id == company.id, 
            models.PDFFile.filename == filename
        ).delete()
        db.commit()
        
        logger.info(f"PDF deleted: {filename} from company {company.name}")
        return {"message": "PDF deleted and index rebuilt"}
        
    except (RateLimitError, OpenAIError) as e:
        logger.error(f"OpenAI API error: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"OpenAI API error: {str(e)}"
        )
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error deleting PDF: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error occurred"
        )
    except Exception as e:
        logger.error(f"Unexpected error deleting PDF: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unexpected error occurred"
        )

@app.get("/companies/{company_id}/pdfs", dependencies=[Depends(auth.admin_required)])
async def list_company_pdfs(company_id: int, db: Session = Depends(database.get_db)):
    try:
        company = db.query(models.Company).filter(models.Company.id == company_id).first()
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found"
            )
        pdfs = db.query(models.PDFFile).filter(models.PDFFile.company_id == company.id).all()
        return [{"filename": pdf.filename, "upload_timestamp": pdf.upload_timestamp} for pdf in pdfs]
    except SQLAlchemyError as e:
        logger.error(f"Database error listing PDFs: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error occurred"
        )

@app.post("/companies/{company_id}/ask", response_model=schemas.AskResponse)
@limiter.limit("30/minute")
async def ask(request: Request, company_id: int, req: schemas.AskRequest, user=Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    try:
        company = db.query(models.Company).filter(models.Company.id == company_id).first()
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found"
            )
        
        if auth.embeddings is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="OpenAI embeddings service unavailable"
            )
        
        vector_store = await build_or_update_vector_store(company.name, auth.embeddings)
        llm = ChatOpenAI(
            openai_api_key=os.getenv("OPENAI_API_KEY"), 
            model_name=company.model_name, 
            temperature=company.temperature
        )
        qa_chain = RetrievalQA.from_chain_type(
            llm, 
            retriever=vector_store.as_retriever(search_kwargs={"k": 3})
        )
        answer = await asyncio.to_thread(qa_chain.run, req.question)
        
        log = models.QALog(
            user_id=user.id, 
            company_id=company.id, 
            question=req.question, 
            answer=answer
        )
        db.add(log)
        db.commit()
        
        return {"answer": answer, "timestamp": datetime.utcnow()}
        
    except (RateLimitError, OpenAIError) as e:
        logger.error(f"OpenAI API error: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"OpenAI API error: {str(e)}"
        )
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error in ask: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error occurred"
        )
    except Exception as e:
        logger.error(f"Unexpected error in ask: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unexpected error occurred"
        )

@app.post("/companies/{company_id}/agent/ask", response_model=schemas.AgentAskResponse)
@limiter.limit("20/minute")
async def ask_agent(request: Request, company_id: int, req: schemas.AskRequest, user=Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    try:
        company = db.query(models.Company).filter(models.Company.id == company_id).first()
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found"
            )
        
        agent = await agent_manager.get_agent(company)
        handler = ReasoningCaptureHandler()
        answer = await asyncio.to_thread(agent.run, req.question, callbacks=[handler])
        reasoning = handler.get_reasoning()
        
        log = models.AgentLog(
            user_id=user.id, 
            company_id=company.id, 
            question=req.question, 
            answer=answer, 
            reasoning=reasoning
        )
        db.add(log)
        db.commit()
        
        return {"answer": answer, "reasoning": reasoning, "timestamp": datetime.utcnow()}
        
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error in agent ask: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error occurred"
        )
    except Exception as e:
        logger.error(f"Unexpected error in agent ask: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unexpected error occurred"
        )

@app.post("/companies/{company_id}/agent/reset")
async def reset_agent(company_id: int, user=Depends(auth.admin_required), db: Session = Depends(database.get_db)):
    try:
        company = db.query(models.Company).filter(models.Company.id == company_id).first()
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found"
            )
        
        if agent_manager.reset_agent_memory(company.name):
            logger.info(f"Agent memory reset for company: {company.name}")
            return {"message": f"Memory reset for {company.name}"}
        return {"message": "No memory to reset"}
        
    except SQLAlchemyError as e:
        logger.error(f"Database error resetting agent: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error occurred"
        )

@app.get("/companies/{company_id}/agent/logs", response_model=list[schemas.AgentLogResponse])
async def list_agent_logs(
    company_id: int, 
    user: int = Query(None), 
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(database.get_db), 
    current_user=Depends(auth.get_current_user)
):
    try:
        query = db.query(models.AgentLog).filter(models.AgentLog.company_id == company_id)
        if user:
            query = query.filter(models.AgentLog.user_id == user)
        logs = query.order_by(models.AgentLog.timestamp.desc()).offset(offset).limit(limit).all()
        return logs
    except SQLAlchemyError as e:
        logger.error(f"Database error listing agent logs: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error occurred"
        )

@app.get("/companies/{company_id}/agent/logs/{log_id}", response_model=schemas.AgentLogResponse)
async def replay_agent_log(company_id: int, log_id: int, db: Session = Depends(database.get_db), current_user=Depends(auth.get_current_user)):
    try:
        log = db.query(models.AgentLog).filter(
            models.AgentLog.company_id == company_id, 
            models.AgentLog.id == log_id
        ).first()
        if not log:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Log not found"
            )
        return log
    except SQLAlchemyError as e:
        logger.error(f"Database error retrieving agent log: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error occurred"
        )

@app.delete("/companies/{company_id}/agent/logs", dependencies=[Depends(auth.admin_required)])
async def clear_agent_logs(company_id: int, db: Session = Depends(database.get_db)):
    try:
        deleted_count = db.query(models.AgentLog).filter(models.AgentLog.company_id == company_id).delete()
        db.commit()
        logger.info(f"Cleared {deleted_count} agent logs for company_id: {company_id}")
        return {"message": f"Cleared {deleted_count} agent logs"}
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error clearing agent logs: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error occurred"
        )

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow(),
        "embeddings_available": auth.embeddings is not None
    }
