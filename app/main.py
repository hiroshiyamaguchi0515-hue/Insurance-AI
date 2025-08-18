import os, asyncio
from datetime import datetime
from fastapi import FastAPI, Depends, UploadFile, HTTPException, Query
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from langchain_community.chat_models import ChatOpenAI
from langchain.chains import RetrievalQA
from . import database, models, schemas, crud, auth
from .vector_store_utils import build_or_update_vector_store, delete_pdf_and_reindex
from .agent_manager import agent_manager
from .callbacks import ReasoningCaptureHandler

models.Base.metadata.create_all(bind=database.engine)
app = FastAPI(title="PDF QA API with Agents", version="4.0.0")

BASE_COMPANY_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "companies")

def create_company_folder(company_name):
    os.makedirs(BASE_COMPANY_DIR, exist_ok=True)
    company_path = os.path.join(BASE_COMPANY_DIR, company_name)
    os.makedirs(company_path, exist_ok=True)
    return company_path

@app.post("/auth/login", response_model=schemas.Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = crud.get_user_by_username(db, form_data.username)
    if not user or not auth.verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    access_token, refresh_token = auth.create_tokens({"sub": user.username})
    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}

@app.post("/users", response_model=schemas.UserResponse, dependencies=[Depends(auth.admin_required)])
async def create_user(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    db_user = crud.get_user_by_username(db, user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already exists")
    return crud.create_user(db, user)

@app.get("/users", response_model=list[schemas.UserResponse], dependencies=[Depends(auth.admin_required)])
async def list_users(db: Session = Depends(database.get_db)):
    return db.query(models.User).all()

@app.patch("/users/{user_id}", response_model=schemas.UserResponse, dependencies=[Depends(auth.admin_required)])
async def update_user(user_id: int, user_update: schemas.UserUpdate, db: Session = Depends(database.get_db)):
    try:
        updated = crud.update_user(db, user_id, user_update)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if not updated:
        raise HTTPException(status_code=404, detail="User not found")
    return updated

@app.post("/companies", dependencies=[Depends(auth.admin_required)])
async def create_company(company: schemas.CompanyCreate, db: Session = Depends(database.get_db)):
    existing = db.query(models.Company).filter(models.Company.name == company.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Company name already exists")
    db_company = models.Company(name=company.name)
    db.add(db_company)
    db.commit()
    create_company_folder(company.name)
    return {"message": "Company created"}

@app.patch("/companies/{company_id}", dependencies=[Depends(auth.admin_required)])
async def update_company(company_id: int, update: schemas.CompanyUpdate, db: Session = Depends(database.get_db)):
    company = db.query(models.Company).filter(models.Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    if update.model_name:
        company.model_name = update.model_name
    if update.temperature is not None:
        company.temperature = update.temperature
    db.commit()
    return {"message": "Company updated"}

@app.post("/companies/{company_id}/pdfs", dependencies=[Depends(auth.admin_required)])
async def upload_pdf(company_id: int, file: UploadFile, db: Session = Depends(database.get_db)):
    company = db.query(models.Company).filter(models.Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    create_company_folder(company.name)
    with open(os.path.join(f"companies/{company.name}", file.filename), "wb") as f:
        f.write(await file.read())
    await build_or_update_vector_store(company.name, auth.embeddings)
    pdf = models.PDFFile(filename=file.filename, company_id=company.id)
    db.add(pdf)
    db.commit()
    return {"message": "PDF uploaded and indexed"}

@app.delete("/companies/{company_id}/pdfs/{filename}", dependencies=[Depends(auth.admin_required)])
async def remove_pdf(company_id: int, filename: str, db: Session = Depends(database.get_db)):
    company = db.query(models.Company).filter(models.Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    await delete_pdf_and_reindex(company.name, filename, auth.embeddings)
    db.query(models.PDFFile).filter(models.PDFFile.company_id == company.id, models.PDFFile.filename == filename).delete()
    db.commit()
    return {"message": "PDF deleted and index rebuilt"}

@app.post("/companies/{company_id}/ask", response_model=schemas.AskResponse)
async def ask(company_id: int, req: schemas.AskRequest, user=Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    company = db.query(models.Company).filter(models.Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    vector_store = await build_or_update_vector_store(company.name, auth.embeddings)
    llm = ChatOpenAI(openai_api_key=os.getenv("OPENAI_API_KEY"), model_name=company.model_name, temperature=company.temperature)
    qa_chain = RetrievalQA.from_chain_type(llm, retriever=vector_store.as_retriever(search_kwargs={"k": 3}))
    answer = await asyncio.to_thread(qa_chain.run, req.question)
    log = models.QALog(user_id=user.id, company_id=company.id, question=req.question, answer=answer)
    db.add(log)
    db.commit()
    return {"answer": answer, "timestamp": datetime.utcnow()}

@app.post("/companies/{company_id}/agent/ask", response_model=schemas.AgentAskResponse)
async def ask_agent(company_id: int, req: schemas.AskRequest, user=Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    company = db.query(models.Company).filter(models.Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    agent = await agent_manager.get_agent(company)
    handler = ReasoningCaptureHandler()
    answer = await asyncio.to_thread(agent.run, req.question, callbacks=[handler])
    reasoning = handler.get_reasoning()
    log = models.AgentLog(user_id=user.id, company_id=company.id, question=req.question, answer=answer, reasoning=reasoning)
    db.add(log)
    db.commit()
    return {"answer": answer, "reasoning": reasoning, "timestamp": datetime.utcnow()}

@app.post("/companies/{company_id}/agent/reset")
async def reset_agent(company_id: int, user=Depends(auth.admin_required), db: Session = Depends(database.get_db)):
    company = db.query(models.Company).filter(models.Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    if agent_manager.reset_agent_memory(company.name):
        return {"message": f"Memory reset for {company.name}"}
    return {"message": "No memory to reset"}

@app.get("/companies/{company_id}/agent/logs", response_model=list[schemas.AgentLogResponse])
async def list_agent_logs(company_id: int, user: int = Query(None), db: Session = Depends(database.get_db), current_user=Depends(auth.get_current_user)):
    query = db.query(models.AgentLog).filter(models.AgentLog.company_id == company_id)
    if user:
        query = query.filter(models.AgentLog.user_id == user)
    logs = query.order_by(models.AgentLog.timestamp.desc()).all()
    return logs

@app.get("/companies/{company_id}/agent/logs/{log_id}", response_model=schemas.AgentLogResponse)
async def replay_agent_log(company_id: int, log_id: int, db: Session = Depends(database.get_db), current_user=Depends(auth.get_current_user)):
    log = db.query(models.AgentLog).filter(models.AgentLog.company_id == company_id, models.AgentLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    return log

@app.delete("/companies/{company_id}/agent/logs", dependencies=[Depends(auth.admin_required)])
async def clear_agent_logs(company_id: int, db: Session = Depends(database.get_db)):
    db.query(models.AgentLog).filter(models.AgentLog.company_id == company_id).delete()
    db.commit()
    return {"message": "All agent logs cleared"}
