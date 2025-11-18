"""ML module containing encoder, inference logic, and utilities."""

from .encoder import PestEncoder
from .inference import generate_embedding, classify_embedding, batch_generate_embeddings
from .utils import decode_base64_image, preprocess_image, compute_cosine_similarity

__all__ = [
    "PestEncoder",
    "generate_embedding",
    "classify_embedding",
    "batch_generate_embeddings",
    "decode_base64_image",
    "preprocess_image",
    "compute_cosine_similarity"
]
