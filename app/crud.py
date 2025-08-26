from sqlalchemy.orm import Session
from . import models, schemas
from .auth import get_password_hash
from typing import Optional

def create_user(db: Session, user: schemas.UserCreate):
    db_user = models.User(
        username=user.username, 
        email=user.email,
        password_hash=get_password_hash(user.password), 
        role=user.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def update_user(db: Session, user_id: int, user_update: schemas.UserUpdate):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        return None
    
    if user_update.username:
        # Prevent duplicate username
        existing = get_user_by_username(db, user_update.username)
        if existing and existing.id != user_id:
            raise ValueError("Username already exists")
        db_user.username = user_update.username
    
    if user_update.email:
        # Prevent duplicate email
        existing = get_user_by_email(db, user_update.email)
        if existing and existing.id != user_id:
            raise ValueError("Email already exists")
        db_user.email = user_update.email
    
    if user_update.password:
        db_user.password_hash = get_password_hash(user_update.password)
    
    if user_update.role:
        db_user.role = user_update.role
    
    db.commit()
    db.refresh(db_user)
    return db_user

def delete_user(db: Session, user_id: int):
    """Delete a user by ID"""
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        return None
    
    db.delete(db_user)
    db.commit()
    return db_user

# Chat CRUD operations
def create_chat_conversation(db: Session, user_id: int, company_id: int, title: str, chat_type: str):
    db_conversation = models.ChatConversation(
        user_id=user_id,
        company_id=company_id,
        title=title,
        chat_type=chat_type
    )
    db.add(db_conversation)
    db.commit()
    db.refresh(db_conversation)
    return db_conversation

def get_chat_conversation(db: Session, conversation_id: int):
    return db.query(models.ChatConversation).filter(models.ChatConversation.id == conversation_id).first()

def get_user_conversations(db: Session, user_id: int, company_id: Optional[int] = None):
    query = db.query(models.ChatConversation).filter(models.ChatConversation.user_id == user_id)
    if company_id:
        query = query.filter(models.ChatConversation.company_id == company_id)
    return query.order_by(models.ChatConversation.updated_at.desc()).all()

def update_conversation_title(db: Session, conversation_id: int, title: str):
    db_conversation = get_chat_conversation(db, conversation_id)
    if db_conversation:
        db_conversation.title = title
        db_conversation.updated_at = models.utc_now()
        db.commit()
        db.refresh(db_conversation)
    return db_conversation

def create_chat_message(db: Session, conversation_id: int, message_type: str, content: str):
    db_message = models.ChatMessage(
        conversation_id=conversation_id,
        message_type=message_type,
        content=content
    )
    db.add(db_message)
    
    # Update conversation's updated_at timestamp
    conversation = get_chat_conversation(db, conversation_id)
    if conversation:
        conversation.updated_at = models.utc_now()
    
    db.commit()
    db.refresh(db_message)
    return db_message

def get_conversation_messages(db: Session, conversation_id: int):
    return db.query(models.ChatMessage).filter(
        models.ChatMessage.conversation_id == conversation_id
    ).order_by(models.ChatMessage.timestamp.asc()).all()

def delete_conversation(db: Session, conversation_id: int, user_id: int):
    """Delete a conversation and all its messages (only if user owns it)"""
    db_conversation = db.query(models.ChatConversation).filter(
        models.ChatConversation.id == conversation_id,
        models.ChatConversation.user_id == user_id
    ).first()
    
    if db_conversation:
        db.delete(db_conversation)
        db.commit()
        return True
    return False
