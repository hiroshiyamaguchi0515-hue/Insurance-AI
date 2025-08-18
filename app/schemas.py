from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str
    role: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = None

class UserResponse(UserBase):
    id: int
    role: str
    class Config:
        from_attributes = True

class CompanyCreate(BaseModel):
    name: str

class CompanyUpdate(BaseModel):
    model_name: Optional[str] = None
    temperature: Optional[int] = None

class AskRequest(BaseModel):
    question: str

class AskResponse(BaseModel):
    answer: str
    timestamp: datetime

class AgentAskResponse(BaseModel):
    answer: str
    reasoning: str
    timestamp: datetime

class AgentLogResponse(BaseModel):
    id: int
    user_id: int
    company_id: int
    question: str
    answer: str
    reasoning: str
    timestamp: datetime
    class Config:
        from_attributes = True
