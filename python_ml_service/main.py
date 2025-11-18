"""
FastAPI Application Entry Point
================================
High-performance, stateless ML microservice for pest detection.

This service provides two core ML operations:
1. Generate embeddings from pest images
2. Classify embeddings using prototypical networks (few-shot learning)

The model is loaded once on startup and cached in application state for
optimal performance across requests.
"""

import logging
from contextlib import asynccontextmanager
from typing import Dict, Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from api.router import api_router
from core.config import settings
from ml.encoder import PestEncoder

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    
    Loads the ML model once on startup and stores it in app.state.
    This prevents loading the model on every request, improving performance.
    
    Yields:
        None: Control flow during application runtime
    """
    logger.info("🚀 Starting Pest Detection ML Service...")
    logger.info(f"Model path: {settings.MODEL_PATH}")
    
    try:
        # Load the ML model encoder
        encoder = PestEncoder(
            model_name=settings.MODEL_NAME,
            model_path=settings.MODEL_PATH,
            embedding_dim=settings.EMBEDDING_DIM,
            device=settings.DEVICE
        )
        
        # Store encoder in application state
        app.state.encoder = encoder
        
        logger.info(f"✅ Model loaded successfully on device: {settings.DEVICE}")
        logger.info(f"Model: {settings.MODEL_NAME}")
        logger.info(f"Embedding dimension: {settings.EMBEDDING_DIM}")
        
    except Exception as e:
        logger.error(f"❌ Failed to load ML model: {e}")
        raise RuntimeError(f"Model initialization failed: {e}")
    
    yield
    
    # Cleanup on shutdown
    logger.info("🛑 Shutting down Pest Detection ML Service...")
    # Clear CUDA cache if using GPU
    if settings.DEVICE == "cuda":
        import torch
        torch.cuda.empty_cache()


# Initialize FastAPI application
app = FastAPI(
    title="Pest Detection ML Service",
    description="Production-ready ML microservice for agricultural pest detection using few-shot learning",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# CORS middleware for cross-origin requests from Node.js backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check endpoint
@app.get("/health", tags=["Health"])
async def health_check() -> Dict[str, str]:
    """
    Health check endpoint for monitoring and load balancers.
    
    Returns:
        dict: Service health status
    """
    return {
        "status": "ok",
        "service": "pest-detection-ml",
        "version": "1.0.0"
    }


# Include API router
app.include_router(api_router, prefix="/api/v1")


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc: Exception) -> JSONResponse:
    """
    Global exception handler for graceful error responses.
    
    Args:
        request: HTTP request object
        exc: Exception that occurred
        
    Returns:
        JSONResponse: Standardized error response
    """
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": str(exc) if settings.DEBUG else "An unexpected error occurred"
        }
    )


if __name__ == "__main__":
    import uvicorn
    
    # Run the application with Uvicorn
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info",
        access_log=True
    )
