import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    openai_api_key: str = "your-openai-api-key-here"
    jwt_secret_key: str = "your-jwt-secret-key-here"
    
    class Config:
        env_file = ".env"

settings = Settings()
