import os
import logging
import openai
from fastapi import HTTPException, status
from datetime import datetime
from typing import List, Dict, Optional

logger = logging.getLogger(__name__)

class OpenAIModelsService:
    """Service for managing OpenAI models"""
    
    def __init__(self):
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        if not self.openai_api_key:
            logger.warning("OpenAI API key not configured")
    
    def get_available_models(self) -> List[Dict]:
        """Get list of available OpenAI models suitable for company configuration"""
        if not self.openai_api_key:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="OpenAI API key not configured"
            )
        
        try:
            client = openai.OpenAI(api_key=self.openai_api_key)
            models_response = client.models.list()
            
            # Filter for models suitable for company configuration
            suitable_models = []
            for model in models_response.data:
                model_info = {
                    "id": model.id,
                    "name": model.id,
                    "type": "chat" if "gpt" in model.id else "text",
                    "recommended": model.id in [
                        "gpt-3.5-turbo", "gpt-4", "gpt-4o", "gpt-4o-mini"
                    ]
                }
                suitable_models.append(model_info)
            
            # Sort by recommendation and then alphabetically
            suitable_models.sort(key=lambda x: (not x["recommended"], x["id"]))
            
            logger.info(f"Retrieved {len(suitable_models)} suitable OpenAI models")
            return suitable_models
            
        except openai.RateLimitError:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="OpenAI API rate limit exceeded. Please try again later."
            )
        except openai.AuthenticationError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid OpenAI API key"
            )
        except openai.APIError as e:
            logger.error(f"OpenAI API error: {e}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"OpenAI API error: {str(e)}"
            )
        except Exception as e:
            logger.error(f"Unexpected error fetching OpenAI models: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to fetch OpenAI models"
            )
    
    def validate_model(self, model_name: str) -> Dict:
        """Validate if a model name is suitable for company configuration"""
        # Basic validation
        import re
        if not re.match(r'^[a-zA-Z0-9\-\._]+$', model_name):
            return {
                "valid": False,
                "reason": "Invalid characters. Only alphanumeric characters, hyphens, dots, and underscores are allowed.",
                "model_name": model_name
            }
        
        if len(model_name) > 50:
            return {
                "valid": False,
                "reason": "Model name too long. Maximum 50 characters allowed.",
                "model_name": model_name
            }
        
        # Check if OpenAI API key is available
        if not self.openai_api_key:
            return {
                "valid": False,
                "reason": "OpenAI API key not configured. Cannot validate model availability.",
                "model_name": model_name
            }
        
        # Check against available models
        try:
            available_models = self.get_available_models()
            available_model_ids = [m["id"] for m in available_models]
            
            # Check if the model is available
            if model_name in available_model_ids:
                # Check if it's a recommended model
                recommended_models = [
                    "gpt-3.5-turbo", "gpt-4", "gpt-4o", "gpt-4o-mini"
                ]
                is_recommended = model_name in recommended_models
                
                return {
                    "valid": True,
                    "reason": "Model is available and suitable for company configuration",
                    "model_name": model_name,
                    "available": True,
                    "recommended": is_recommended,
                    "type": "chat" if "gpt" in model_name else "text"
                }
            else:
                return {
                    "valid": False,
                    "reason": f"Model '{model_name}' not found in available models. Available models: {available_model_ids[:10]}...",
                    "model_name": model_name,
                    "available": False,
                    "available_models_count": len(available_model_ids)
                }
                
        except Exception as e:
            logger.error(f"Error validating model: {e}")
            return {
                "valid": False,
                "reason": f"Could not validate model: {str(e)}",
                "model_name": model_name,
                "error": str(e)
            }

# Global instance
openai_models_service = OpenAIModelsService() 