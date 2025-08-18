from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
try:
    from database import Base  # For Alembic (when run from app directory)
except ImportError:
    from app.database import Base  # For FastAPI app (when run from project root)


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    password_hash = Column(String(128), nullable=False)
    role = Column(String(20), default="normal", nullable=False)
    qa_logs = relationship("QALog", back_populates="user")
    agent_logs = relationship("AgentLog", back_populates="user")

class Company(Base):
    __tablename__ = "companies"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    model_name = Column(String(50), default="gpt-4-0125-preview", nullable=False)
    temperature = Column(Integer, default=0, nullable=False)
    pdfs = relationship("PDFFile", back_populates="company")
    qa_logs = relationship("QALog", back_populates="company")
    agent_logs = relationship("AgentLog", back_populates="company")

class PDFFile(Base):
    __tablename__ = "pdf_files"
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(200), nullable=False)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    company = relationship("Company", back_populates="pdfs")

class QALog(Base):
    __tablename__ = "qa_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    user = relationship("User", back_populates="qa_logs")
    company = relationship("Company", back_populates="qa_logs")

class AgentLog(Base):
    __tablename__ = "agent_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    reasoning = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    user = relationship("User", back_populates="agent_logs")
    company = relationship("Company", back_populates="agent_logs")
