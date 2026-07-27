import os
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables from .env file explicitly
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
import models
import schemas
import api_routes

# Create all database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Sensale API", description="API for Sensale - AI Sales Assistant")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_routes.router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "Welcome to Sensale API"}
