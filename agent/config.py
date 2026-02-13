"""
Configuration for TradvisorAI Agent.
Loads settings from .env file in this directory.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from agent directory
_env_path = Path(__file__).parent / ".env"
load_dotenv(_env_path)

# xAI API
XAI_API_KEY = os.getenv("XAI_API_KEY", "")
BASE_URL = os.getenv("BASE_URL", "https://api.x.ai/v1")

# Model - grok-4-1-fast-reasoning: smart + cheap ($0.20/M input)
MODEL = os.getenv("MODEL", "grok-3-mini")

# Agent loop settings
MAX_ITERATIONS = int(os.getenv("MAX_ITERATIONS", "15"))

# Validate
if not XAI_API_KEY:
    raise ValueError(
        "XAI_API_KEY not set. Copy .env.example to .env and add your key.\n"
        "Get one at https://console.x.ai"
    )
