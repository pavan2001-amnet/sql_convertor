import os
from typing import Optional
from dotenv import load_dotenv

# Load .env file before reading variables
load_dotenv()

class Config:
    """Configuration class for API settings."""
    
    # OpenAI Configuration
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    
    # API Configuration
    API_HOST: str = os.getenv("API_HOST", "0.0.0.0")
    API_PORT: int = int(os.getenv("API_PORT", "8000"))
    
    # CORS Configuration
    CORS_ORIGINS: list = ["*"]  # In production, specify actual origins
    
    @classmethod
    def validate_config(cls) -> None:
        """Validate that required configuration is present."""
        if not cls.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY environment variable is required")
    
    @classmethod
    def get_openai_key(cls) -> str:
        """Get the OpenAI API key with validation."""
        if not cls.OPENAI_API_KEY:
            raise ValueError("OpenAI API key not found. Please set OPENAI_API_KEY environment variable.")
        return cls.OPENAI_API_KEY

# Create a config instance
config = Config() 