from pydantic import BaseModel, Field, validator
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
    secret: Optional[str] = None
    client_id: Optional[str] = None
    client_secret: Optional[str] = None
    otp: Optional[str] = None
    scope: Optional[List[str]] = None

    # Allow unknown extra fields without raising 422, for maximum compatibility
    model_config = ConfigDict(extra='ignore')

class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, description="Username must be 3-50 characters")

class UserCreate(UserBase):
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters")
    role: str = Field(..., pattern="^(admin|normal)$", description="Role must be 'admin' or 'normal'")
    
    @validator('username')
    def validate_username(cls, v):
        if not re.match("^[a-zA-Z0-9_-]+$", v):
            raise ValueError("Username can only contain letters, numbers, underscores, and hyphens")
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
    password: Optional[str] = Field(None, min_length=8)
    role: Optional[str] = Field(None, pattern="^(admin|normal)$")
    
    @validator('username')
    def validate_username(cls, v):
        if v and not re.match("^[a-zA-Z0-9_-]+$", v):
            raise ValueError("Username can only contain letters, numbers, underscores, and hyphens")
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
    role: str
    class Config:
        from_attributes = True

class CompanyCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Company name must be 1-100 characters")
    
    @validator('name')
    def validate_company_name(cls, v):
        if not re.match("^[a-zA-Z0-9_\\- ]+$", v):
            raise ValueError("Company name can only contain letters, numbers, spaces, underscores, and hyphens")
        return v.strip()

class CompanyUpdate(BaseModel):
    model_name: Optional[str] = Field(None, pattern="^gpt-[34].*", description="Must be a valid GPT model")
    temperature: Optional[float] = Field(None, ge=0.0, le=2.0, description="Temperature must be between 0.0 and 2.0")

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

class CompanyResponse(BaseModel):
    id: int
    name: str
    model_name: str
    temperature: float  # Changed from int to float

    class Config:
        from_attributes = True

class PDFUploadResponse(BaseModel):
    message: str
    filename: str
    upload_timestamp: datetime

class ErrorResponse(BaseModel):
    detail: str
    error_code: Optional[str] = None
