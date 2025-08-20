from pydantic import BaseModel, Field, validator, field_validator
from pydantic import ConfigDict
from typing import Optional, List
from datetime import datetime
import re

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class LoginRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=1)

    # Allow unknown extra fields without raising 422, for maximum compatibility
    model_config = ConfigDict(extra='ignore')

class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, description="Username must be 3-50 characters")

class UserCreate(UserBase):
    email: str = Field(..., description="User's email address")
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters")
    role: str = Field(..., pattern="^(admin|user)$", description="Role must be 'admin' or 'user'")
    
    @validator('username')
    def validate_username(cls, v):
        if not re.match("^[a-zA-Z0-9_-]+$", v):
            raise ValueError("Username can only contain letters, numbers, underscores, and hyphens")
        return v
    
    @validator('email')
    def validate_email(cls, v):
        if not re.match(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", v):
            raise ValueError("Invalid email format")
        return v
    
    @validator('password')
    def validate_password(cls, v):
        if not re.search(r"[A-Za-z]", v):
            raise ValueError("Password must contain at least one letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one number")
        return v

class UserUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    email: Optional[str] = Field(None, description="User's email address")
    password: Optional[str] = Field(None, min_length=8)
    role: Optional[str] = Field(None, pattern="^(admin|user)$")
    
    @validator('username')
    def validate_username(cls, v):
        if v and not re.match("^[a-zA-Z0-9_-]+$", v):
            raise ValueError("Username can only contain letters, numbers, underscores, and hyphens")
        return v
    
    @validator('email')
    def validate_email(cls, v):
        if v and not re.match(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", v):
            raise ValueError("Invalid email format")
        return v
    
    @validator('password')
    def validate_password(cls, v):
        if v:
            if not re.search(r"[A-Za-z]", v):
                raise ValueError("Password must contain at least one letter")
            if not re.search(r"\d", v):
                raise ValueError("Password must contain at least one number")
        return v

class UserResponse(UserBase):
    id: int
    email: str
    role: str
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True

class CompanyCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    model_name: str = Field(..., description="OpenAI model name (e.g., gpt-3.5-turbo, gpt-4)")
    temperature: float = Field(..., ge=0.0, le=2.0, description="Model temperature (0.0 to 2.0)")
    max_tokens: int = Field(1000, ge=1, le=4000, description="Maximum tokens for responses")
    
    # Validate model name format
    @field_validator('model_name')
    @classmethod
    def validate_model_name(cls, v):
        import re
        if not re.match(r'^[a-zA-Z0-9\-\._]+$', v):
            raise ValueError('Model name can only contain alphanumeric characters, hyphens, dots, and underscores')
        if len(v) > 50:
            raise ValueError('Model name too long. Maximum 50 characters allowed.')
        return v
    
    # Validate temperature range
    @field_validator('temperature')
    @classmethod
    def validate_temperature(cls, v):
        if not (0.0 <= v <= 2.0):
            raise ValueError('Temperature must be between 0.0 and 2.0')
        return v

class CompanyUpdate(BaseModel):
    model_name: Optional[str] = Field(None, description="OpenAI model name (e.g., gpt-3.5-turbo, gpt-4)")
    temperature: Optional[float] = Field(None, ge=0.0, le=2.0, description="Model temperature (0.0 to 2.0)")
    max_tokens: Optional[int] = Field(None, ge=1, le=4000, description="Maximum tokens for responses")

class AskRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=2000, description="Question must be 1-2000 characters")

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

class QALogResponse(BaseModel):
    id: int
    user_id: int
    company_id: int
    question: str
    answer: str
    timestamp: datetime
    class Config:
        from_attributes = True

class CompanyResponse(BaseModel):
    id: int
    name: str
    model_name: str
    temperature: float
    max_tokens: int
    created_at: datetime
    updated_at: datetime
    pdf_count: Optional[int] = 0
    qa_logs_count: Optional[int] = 0
    agent_logs_count: Optional[int] = 0

    class Config:
        from_attributes = True

class PDFUploadResponse(BaseModel):
    message: str
    filename: str
    upload_timestamp: datetime

class ErrorResponse(BaseModel):
    detail: str
    error_code: Optional[str] = None
