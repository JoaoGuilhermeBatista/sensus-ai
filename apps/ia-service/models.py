from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


# ─── Request ─────────────────────────────────────────────────────────────────

class InferRequest(BaseModel):
    """Payload sent by the backend to request inference on a single frame."""
    frameId: str
    timestamp: int
    image: str  # base64-encoded JPEG


# ─── Shared Detection ─────────────────────────────────────────────────────────

class DetectedObject(BaseModel):
    """
    Normalized detection matching the shared contract in SDD 04.

    Bounding box coordinates (x, y, width, height) are relative to image
    dimensions and must be in the range [0.0, 1.0].
    """
    name: str
    confidence: float = Field(ge=0.0, le=1.0)
    x: float = Field(ge=0.0, le=1.0)       # left edge, normalized
    y: float = Field(ge=0.0, le=1.0)       # top edge, normalized
    width: float = Field(ge=0.0, le=1.0)
    height: float = Field(ge=0.0, le=1.0)
    distance: Literal["perto", "medio", "longe"]
    isClose: bool


# ─── Response ─────────────────────────────────────────────────────────────────

class InferResponse(BaseModel):
    """Inference result returned to the backend after processing a frame."""
    frameId: str
    timestamp: int
    inferenceMs: float
    objects: list[DetectedObject]


# ─── Health ───────────────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    """Service health state returned by GET /health."""
    status: Literal["UP", "DEGRADED", "DOWN"]
    modelLoaded: bool
    device: str | None = None
    gpuAvailable: bool
    inferenceReady: bool


# ─── Errors ───────────────────────────────────────────────────────────────────

class ErrorDetail(BaseModel):
    code: str
    message: str


class ErrorResponse(BaseModel):
    """Structured error envelope for all failure responses."""
    error: ErrorDetail
    timestamp: int