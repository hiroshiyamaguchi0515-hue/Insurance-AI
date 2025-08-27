from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
try:
    from database import Base  # For Alembic (when run from app directory)
except ImportError:
    from app.database import Base  # For FastAPI app (when run from project root)


def utc_now():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    password_hash = Column(String(128), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    role = Column(String(20), default="user", nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)
    qa_logs = relationship("QALog", back_populates="user", cascade="all, delete-orphan")
    agent_logs = relationship("AgentLog", back_populates="user", cascade="all, delete-orphan")
    chat_conversations = relationship("ChatConversation", back_populates="user", cascade="all, delete-orphan")

class Company(Base):
    __tablename__ = "companies"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    model_name = Column(String(50), default="gpt-4-0125-preview", nullable=False)
    temperature = Column(Float, default=0.0, nullable=False)
    max_tokens = Column(Integer, default=1000, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)
    pdfs = relationship("PDFFile", back_populates="company", cascade="all, delete-orphan")
    qa_logs = relationship("QALog", back_populates="company", cascade="all, delete-orphan")
    agent_logs = relationship("AgentLog", back_populates="company", cascade="all, delete-orphan")
    chat_conversations = relationship("ChatConversation", back_populates="company", cascade="all, delete-orphan")

class PDFFile(Base):
    __tablename__ = "pdf_files"
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(200), nullable=False)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    upload_timestamp = Column(DateTime, default=utc_now, nullable=False)
    file_size = Column(Integer, nullable=False)
    company = relationship("Company", back_populates="pdfs")

class QALog(Base):
    __tablename__ = "qa_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=utc_now, nullable=False, index=True)
    user = relationship("User", back_populates="qa_logs")
    company = relationship("Company", back_populates="qa_logs")

class AgentLog(Base):
    __tablename__ = "agent_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    reasoning = Column(Text)
    timestamp = Column(DateTime, default=utc_now, nullable=False, index=True)
    user = relationship("User", back_populates="agent_logs")
    company = relationship("Company", back_populates="agent_logs")

class ChatConversation(Base):
    __tablename__ = "chat_conversations"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)  # First question or auto-generated title
    chat_type = Column(String(20), default="simple", nullable=False)  # 'simple' or 'agent'
    created_at = Column(DateTime, default=utc_now, nullable=False, index=True)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False, index=True)
    
    # Relationships
    user = relationship("User", back_populates="chat_conversations")
    company = relationship("Company", back_populates="chat_conversations")
    messages = relationship("ChatMessage", back_populates="conversation", cascade="all, delete-orphan")

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("chat_conversations.id", ondelete="CASCADE"), nullable=False)
    message_type = Column(String(20), nullable=False)  # 'user', 'assistant', 'error'
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=utc_now, nullable=False, index=True)
    
    # Relationships
    conversation = relationship("ChatConversation", back_populates="messages")
