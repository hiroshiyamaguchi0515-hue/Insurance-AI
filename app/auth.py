from dotenv import load_dotenv
load_dotenv()

from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from . import models, database
from langchain_openai import OpenAIEmbeddings
import os

# Use environment variable for secret key with fallback for development
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-secret-key-change-in-production")
if SECRET_KEY == "dev-secret-key-change-in-production":
    import warnings
    warnings.warn("Using default JWT secret key. Set JWT_SECRET_KEY environment variable for production!")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

# Use HTTP Bearer instead of OAuth2 password flow so Swagger does not force form-encoded login
bearer_scheme = HTTPBearer(auto_error=True)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Initialize embeddings with error handling
try:
    embeddings = OpenAIEmbeddings(
        openai_api_key=os.getenv("OPENAI_API_KEY")
    )
except Exception as e:
    import warnings
    warnings.warn(f"Failed to initialize OpenAI embeddings: {e}")
    embeddings = None

def verify_password(plain, hashed):
    return pwd_context.verify(plain, hashed)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_tokens(data: dict):
    access_expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    refresh_expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode = data.copy()
    to_encode["exp"] = access_expire
    access_token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    to_encode["exp"] = refresh_expire
    refresh_token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return access_token, refresh_token

def get_current_user(
    db: Session = Depends(database.get_db), 
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)
):
    cred_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED, 
        detail="Invalid credentials",
        headers={"WWW-Authenticate": "Bearer"}
    )
    if credentials is None or not credentials.credentials:
        raise cred_exc
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise cred_exc
    except JWTError:
        raise cred_exc
    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        raise cred_exc
    return user

def admin_required(user: models.User = Depends(get_current_user)):
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Admin privileges required"
        )
    return user
