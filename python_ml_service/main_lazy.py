"""
FastAPI Application Entry Point with Lazy Loading
==================================================
High-performance, stateless ML microservice for pest detection.

Uses lazy loading strategy to minimize startup time on Windows systems.
The model is loaded on first API request rather than at startup.
"""

import logging
from contextlib import asynccontextmanager
from typing import Dict

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Basic imports only - no ML libraries yet
from core.config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Global variable for lazy-loaded encoder
_encoder_instance = None


def get_encoder():
    """
    Lazy-load the ML encoder on first use.
    This avoids importing PyTorch/Timm at startup which can take 30-60 seconds on Windows.
    """
    global _encoder_instance
    if _encoder_instance is None:
        logger.info("🔄 Loading ML model (first request - this may take 30-60 seconds)...")
        from ml.encoder import PestEncoder
        _encoder_instance = PestEncoder(
            model_name=settings.MODEL_NAME,
            model_path=settings.MODEL_PATH,
            embedding_dim=settings.EMBEDDING_DIM,
            device=settings.DEVICE
        )
        logger.info(f"✅ ML model loaded successfully on device: {settings.DEVICE}")
    return _encoder_instance


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    Model loading is deferred to first request for faster startup.
    """
    logger.info("🚀 Starting Pest Detection ML Service...")
    logger.info("⚡ Using lazy loading - model will load on first API call")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"Port: {settings.PORT}")
    
    yield
    
    # Cleanup on shutdown
    logger.info("🛑 Shutting down Pest Detection ML Service...")
    if settings.DEVICE == "cuda" and _encoder_instance is not None:
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


# Health check endpoint (no ML dependencies)
@app.get("/health", tags=["Health"])
async def health_check() -> Dict[str, str]:
    """
    Health check endpoint for monitoring and load balancers.
    Does not load the ML model.
    """
    return {
        "status": "ok",
        "service": "pest-detection-ml",
        "version": "1.0.0",
        "model_loaded": _encoder_instance is not None
    }


# Import API router (will lazy-load ML modules when endpoints are called)
from api.router import create_api_router
api_router = create_api_router(get_encoder)
app.include_router(api_router, prefix="/api/v1")


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc: Exception) -> JSONResponse:
    """
    Global exception handler for graceful error responses.
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
    
    uvicorn.run(
        "main_lazy:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info",
        access_log=True
    )
