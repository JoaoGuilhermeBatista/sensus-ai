from __future__ import annotations

import base64
import ipaddress
import os
import re
import time
from collections import defaultdict, deque
from pathlib import Path
from typing import Optional
from urllib.parse import urlparse
import socket

import cv2
import httpx
import numpy as np
from fastapi import FastAPI, Header, HTTPException, UploadFile
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from ultralytics import YOLO

from models import (
    DetectedObject,
    ErrorDetail,
    ErrorResponse,
    HealthResponse,
    InferRequest,
    InferResponse,
)

# â”€â”€â”€ Environment â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# SDD-specified primary env vars; backward-compat aliases kept as fallbacks.

CONFIDENCE_THRESHOLD = float(
    os.environ.get("CONFIDENCE_THRESHOLD")
    or os.environ.get("IA_INFERENCE_CONF", "0.25")
)
MODEL_PATH = (
    os.environ.get("MODEL_PATH", "").strip()
    or os.environ.get("IA_MODEL_PATH", "").strip()
)
MAX_IMAGE_SIZE = int(os.environ.get("MAX_IMAGE_SIZE", "512000"))
DEVICE = os.environ.get("DEVICE", "cpu").strip()
LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO").strip()

# Internal inference tuning (not exposed in SDD but kept configurable)
_INFERENCE_IOU = float(os.environ.get("IA_INFERENCE_IOU", "0.45"))
_INFERENCE_IMGSZ = int(os.environ.get("IA_INFERENCE_IMGSZ", "640"))
_MIN_BOX_AREA_RATIO = float(os.environ.get("IA_MIN_BOX_AREA_RATIO", "0.0015"))
_MAX_BOX_AREA_RATIO = float(os.environ.get("IA_MAX_BOX_AREA_RATIO", "0.85"))
_MIN_BOX_ASPECT_RATIO = float(
    os.environ.get("IA_MIN_BOX_ASPECT_RATIO", "0.12"))
_MAX_BOX_ASPECT_RATIO = float(os.environ.get("IA_MAX_BOX_ASPECT_RATIO", "8.0"))
_MIN_PERSISTENCE = int(os.environ.get("IA_MIN_PERSISTENCE", "1"))
_CAMERA_HISTORY_SIZE = int(os.environ.get("IA_CAMERA_HISTORY_SIZE", "5"))
_ENABLE_TRACKING = (
    os.environ.get("IA_ENABLE_TRACKING", "1").strip().lower()
    not in {"0", "false", "no"}
)

# Distance classification thresholds (bbox height / image height)
_DISTANCE_CLOSE_THRESHOLD = float(os.environ.get("IA_DISTANCE_CLOSE", "0.35"))
_DISTANCE_MEDIUM_THRESHOLD = float(
    os.environ.get("IA_DISTANCE_MEDIUM", "0.12"))

# â”€â”€â”€ App â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

app = FastAPI(title="Sensus IA Service", version="1.0.0")
app.mount("/static", StaticFiles(directory="static"), name="static")


@app.on_event("startup")
def _preload_model() -> None:
    """Eagerly load the model at startup so /health returns UP immediately."""
    try:
        get_model()
    except Exception as exc:
        print(
            f"[ia-service] WARNING: could not preload model at startup: {exc}")

# â”€â”€â”€ Global Model State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€


_model: Optional[YOLO] = None
_model_path: Optional[str] = None
_history: defaultdict = defaultdict(lambda: deque(maxlen=_CAMERA_HISTORY_SIZE))

# â”€â”€â”€ Per-class Heuristics â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

_OBSTACLE_CLASSES = {
    "chair", "sofa", "couch", "bench", "person", "bicycle", "motorbike",
    "car", "bed", "dining table", "potted plant", "tv", "laptop", "backpack",
    "suitcase", "handbag", "bottle", "umbrella", "table", "cell phone",
}

_CLASS_REAL_HEIGHT_CM = {
    "person": 170.0, "pessoa": 170.0,
    "chair": 90.0, "cadeira": 90.0,
    "table": 75.0, "mesa": 75.0,
    "bottle": 25.0,
}

_CLASS_MIN_CONF = {
    "person": 0.30, "pessoa": 0.30,
    "chair": 0.28, "cadeira": 0.28,
    "backpack": 0.30, "laptop": 0.35,
    "bench": 0.28, "table": 0.28, "mesa": 0.28,
    "cell phone": 0.20,
}

_CLASS_PRIORITY = {
    "person": 3.0, "pessoa": 3.0,
    "chair": 1.5, "cadeira": 1.5,
    "table": 1.5, "mesa": 1.5,
    "laptop": 1.2, "backpack": 1.0, "bench": 1.2,
}

# â”€â”€â”€ API Key Auth (optional) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

_API_KEY = os.environ.get("IA_API_KEY", "").strip()


def _require_api_key(x_api_key: Optional[str]) -> None:
    if _API_KEY and x_api_key != _API_KEY:
        raise HTTPException(status_code=401, detail="Unauthorized")


# â”€â”€â”€ Model Loading â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

def get_model() -> YOLO:
    global _model, _model_path
    if _model is None:
        path = MODEL_PATH or "yolov8n.pt"
        if path and not Path(path).exists():
            print(
                f"[ia-service] Model not found at '{path}', falling back to yolov8n.pt (auto-download)")
            path = "yolov8n.pt"
        print(f"[ia-service] Loading model: {path}  device={DEVICE}")
        _model = YOLO(path)
        _model_path = str(path)
    return _model


def _gpu_available() -> bool:
    try:
        import torch
        return torch.cuda.is_available()
    except Exception:
        return False


def _half_precision() -> bool:
    return _gpu_available()


# â”€â”€â”€ Image Utilities â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

def _resize_to_imgsz(img: np.ndarray) -> np.ndarray:
    h, w = img.shape[:2]
    max_side = max(h, w)
    if max_side <= _INFERENCE_IMGSZ:
        return img
    scale = _INFERENCE_IMGSZ / float(max_side)
    return cv2.resize(
        img,
        (max(1, int(w * scale)), max(1, int(h * scale))),
        interpolation=cv2.INTER_AREA,
    )


def _bytes_to_image(data: bytes) -> Optional[np.ndarray]:
    arr = np.frombuffer(data, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    return _resize_to_imgsz(img) if img is not None else None


def _base64_to_image(b64: str) -> Optional[np.ndarray]:
    try:
        data = base64.b64decode(b64)
    except Exception:
        return None
    return _bytes_to_image(data)


def _box_is_plausible(x1: float, y1: float, x2: float, y2: float, w: int, h: int) -> bool:
    bw = max(0.0, x2 - x1)
    bh = max(0.0, y2 - y1)
    if w <= 0 or h <= 0:
        return False
    area = (bw * bh) / float(w * h)
    if not (_MIN_BOX_AREA_RATIO <= area <= _MAX_BOX_AREA_RATIO):
        return False
    aspect = bw / max(1.0, bh)
    return _MIN_BOX_ASPECT_RATIO <= aspect <= _MAX_BOX_ASPECT_RATIO


# â”€â”€â”€ Distance Classification â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

def _classify_distance(height_ratio: float) -> str:
    """
    Classify distance based on bounding-box height relative to the image.

    Thresholds:
      >= CLOSE  â†’ perto   (isClose=True)
      >= MEDIUM â†’ medio
      <  MEDIUM â†’ longe
    """
    if height_ratio >= _DISTANCE_CLOSE_THRESHOLD:
        return "perto"
    if height_ratio >= _DISTANCE_MEDIUM_THRESHOLD:
        return "medio"
    return "longe"


# â”€â”€â”€ Core Inference Pipeline â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

def _run_inference(img: np.ndarray):
    model = get_model()
    return model.predict(
        img,
        conf=CONFIDENCE_THRESHOLD,
        iou=_INFERENCE_IOU,
        imgsz=_INFERENCE_IMGSZ,
        half=_half_precision(),
        verbose=False,
    )


def _run_tracked_inference(img: np.ndarray):
    model = get_model()
    return model.track(
        img,
        conf=CONFIDENCE_THRESHOLD,
        iou=_INFERENCE_IOU,
        imgsz=_INFERENCE_IMGSZ,
        half=_half_precision(),
        persist=True,
        tracker="bytetrack.yaml",
        verbose=False,
    )


def _coalesce_history(camera_id: Optional[str], detections: list[dict]) -> list[dict]:
    if not camera_id:
        return detections
    history = _history[camera_id]
    history.append(detections)
    if len(history) < _MIN_PERSISTENCE:
        return detections
    counts: dict = defaultdict(int)
    conf_sum: dict = defaultdict(float)
    latest: dict = {}
    for frame in history:
        for d in frame:
            key = (
                d.get("track_id") if d.get(
                    "track_id") is not None else d.get("nome"),
                d.get("lado"),
            )
            counts[key] += 1
            conf_sum[key] += float(d.get("confidence") or 0.0)
            latest[key] = d
    result = []
    for key, d in latest.items():
        if counts[key] >= _MIN_PERSISTENCE:
            avg = conf_sum[key] / float(counts[key])
            result.append({**d, "confidence": round(avg, 4)} if avg else d)
    return result


def _detect(img: np.ndarray, camera_id: Optional[str] = None) -> list[dict]:
    """
    Run YOLO inference and return a list of raw detection dicts.

    Each dict contains all internal fields needed by both the SDD-contract
    normalizer (_to_detected_object) and the legacy normalizer (_to_legacy_object).
    """
    h, w = img.shape[:2]
    use_tracking = _ENABLE_TRACKING and camera_id is not None
    results = _run_tracked_inference(
        img) if use_tracking else _run_inference(img)
    model = get_model()
    raw: list[dict] = []

    for r in results:
        for box in r.boxes:
            conf = float(box.conf[0]) if getattr(
                box, "conf", None) is not None else None
            cls = int(box.cls[0])
            nome = str(model.names[cls])

            min_conf = _CLASS_MIN_CONF.get(nome.lower(), CONFIDENCE_THRESHOLD)
            if conf is not None and conf < min_conf:
                continue

            track_id = None
            try:
                if getattr(box, "id", None) is not None:
                    track_id = int(box.id[0])
            except Exception:
                pass

            x1, y1, x2, y2 = box.xyxy[0].tolist()
            if not _box_is_plausible(x1, y1, x2, y2, w, h):
                continue

            cx = (x1 + x2) / 2.0
            bbox_h = y2 - y1
            height_ratio = bbox_h / float(h) if h else 0.0
            lado = (
                "esquerda" if cx < w / 3
                else ("direita" if cx > 2 * w / 3 else "centro")
            )

            distance_cm = None
            rh = _CLASS_REAL_HEIGHT_CM.get(nome.lower())
            if rh is not None and bbox_h > 0:
                distance_cm = round(rh * float(h) / bbox_h, 1)

            raw.append({
                "nome": nome,
                "lado": lado,
                "bbox": [x1, y1, x2, y2],
                "confidence": conf,
                "height_ratio": height_ratio,
                "distance_cm": distance_cm,
                "track_id": track_id,
                "img_w": w,
                "img_h": h,
            })

    return _coalesce_history(camera_id, raw)


# â”€â”€â”€ Normalization â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

def _to_detected_object(raw: dict) -> DetectedObject:
    """Normalize a raw detection into the SDD 04 DetectedObject contract."""
    x1, y1, x2, y2 = raw["bbox"]
    iw, ih = float(raw["img_w"]), float(raw["img_h"])
    distance = _classify_distance(raw["height_ratio"])
    return DetectedObject(
        name=raw["nome"],
        confidence=round(float(raw["confidence"] or 0.0), 4),
        x=max(0.0, min(1.0, x1 / iw)),
        y=max(0.0, min(1.0, y1 / ih)),
        width=max(0.0, min(1.0, (x2 - x1) / iw)),
        height=max(0.0, min(1.0, (y2 - y1) / ih)),
        distance=distance,
        isClose=(distance == "perto"),
    )


def _to_legacy_object(raw: dict) -> dict:
    """Shape expected by the backend's IAResponseDTO (backward-compat)."""
    distance = _classify_distance(raw["height_ratio"])
    return {
        "nome": raw["nome"],
        "distancia": distance,
        "isClose": distance == "perto",
        "lado": raw.get("lado"),
        "confidence": raw.get("confidence"),
        "distance_cm": raw.get("distance_cm"),
        "bboxX": max(0.0, min(1.0, raw["bbox"][0] / float(raw["img_w"]))),
        "bboxY": max(0.0, min(1.0, raw["bbox"][1] / float(raw["img_h"]))),
        "bboxWidth": max(0.0, min(1.0, (raw["bbox"][2] - raw["bbox"][0]) / float(raw["img_w"]))),
        "bboxHeight": max(0.0, min(1.0, (raw["bbox"][3] - raw["bbox"][1]) / float(raw["img_h"]))),
    }


def _build_orientation(raw_list: list[dict]) -> str:
    sides: dict = {"esquerda": [], "centro": [], "direita": []}
    scores: dict = {"esquerda": 0.0, "centro": 0.0, "direita": 0.0}
    for r in raw_list:
        lado = r.get("lado", "centro")
        nome = str(r.get("nome", "")).lower()
        conf = float(r.get("confidence") or 0.0)
        is_close = _classify_distance(r["height_ratio"]) == "perto"
        priority = _CLASS_PRIORITY.get(nome, 0.0)
        sides.setdefault(lado, []).append(nome)
        if nome in {"person", "pessoa"}:
            scores[lado] += 2.5 + priority + conf
        elif nome in _OBSTACLE_CLASSES or is_close:
            scores[lado] += 1.0 + priority + conf

    parts = []
    for lado in ["centro", "esquerda", "direita"]:
        if any(n in {"person", "pessoa"} for n in sides.get(lado, [])):
            parts.append("Pessoa Ã  frente" if lado ==
                         "centro" else f"Pessoa Ã  {lado}")
    if scores["centro"] > 0:
        free = "esquerda" if scores["esquerda"] == 0 else (
            "direita" if scores["direita"] == 0 else None)
        parts.append(
            f"ObstÃ¡culo Ã  frente â€” siga para a {free}" if free
            else "ObstÃ¡culo Ã  frente â€” cuidado, espaÃ§o estreito"
        )
    else:
        parts.append("Caminho livre Ã  frente")
    for lado in ["esquerda", "direita"]:
        if sides.get(lado):
            parts.append(f"{sides[lado][0]} Ã  {lado}")
    return ", ".join(parts)


# â”€â”€â”€ Error Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

def _error(code: str, message: str, status: int) -> HTTPException:
    return HTTPException(
        status_code=status,
        detail=ErrorResponse(
            error=ErrorDetail(code=code, message=message),
            timestamp=int(time.time()),
        ).model_dump(),
    )


# â”€â”€â”€ Routes: Health â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

@app.get("/health", response_model=HealthResponse)
def health():
    loaded = _model is not None
    gpu = _gpu_available()
    device_str: Optional[str] = DEVICE
    if loaded:
        try:
            md = getattr(_model, "model", None) or _model
            for p in md.parameters():
                device_str = str(p.device)
                break
        except Exception:
            pass
    return HealthResponse(
        status="UP" if loaded else "DEGRADED",
        modelLoaded=loaded,
        device=device_str,
        gpuAvailable=gpu,
        inferenceReady=loaded,
    )


@app.get("/")
async def root():
    return FileResponse("static/index.html")


# â”€â”€â”€ Routes: Inference (SDD contract) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

@app.post("/infer", response_model=InferResponse)
async def infer(request: InferRequest):
    """
    SDD-compliant inference endpoint.

    Accepts a JSON body with a base64-encoded JPEG frame.
    Returns normalized detections following the shared DetectedObject contract.
    """
    # Reject oversized payloads before decoding (base64 adds ~33% overhead)
    if len(request.image) * 3 // 4 > MAX_IMAGE_SIZE:
        raise _error("PAYLOAD_TOO_LARGE",
                     f"Image exceeds {MAX_IMAGE_SIZE} bytes", 413)

    img = _base64_to_image(request.image)
    if img is None:
        raise _error("INVALID_PAYLOAD", "Failed to decode base64 JPEG", 400)

    t0 = time.time()
    try:
        raw = _detect(img)
    except FileNotFoundError as exc:
        raise _error("INFERENCE_ERROR", str(exc), 503)
    except Exception:
        raise _error("INFERENCE_ERROR", "Inference pipeline failed", 500)
    inference_ms = round((time.time() - t0) * 1000, 2)

    return InferResponse(
        frameId=request.frameId,
        timestamp=request.timestamp,
        inferenceMs=inference_ms,
        objects=[_to_detected_object(r) for r in raw],
    )


# â”€â”€â”€ Routes: Legacy (/analisar â€” backend still calls this) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

@app.post("/analisar")
async def analisar(
    file: UploadFile,
    focal_length_px: Optional[float] = None,
    real_height_cm: Optional[float] = None,
    camera_id: Optional[str] = None,
):
    contents = await file.read()
    if len(contents) > MAX_IMAGE_SIZE:
        return JSONResponse(
            status_code=413,
            content=ErrorResponse(
                error=ErrorDetail(code="PAYLOAD_TOO_LARGE",
                                  message=f"Image exceeds {MAX_IMAGE_SIZE} bytes"),
                timestamp=int(time.time()),
            ).model_dump(),
        )
    img = _bytes_to_image(contents)
    if img is None:
        return JSONResponse(
            status_code=400,
            content=ErrorResponse(
                error=ErrorDetail(code="INVALID_PAYLOAD",
                                  message="Invalid or unsupported image"),
                timestamp=int(time.time()),
            ).model_dump(),
        )
    try:
        raw = _detect(img, camera_id=camera_id)
    except FileNotFoundError as exc:
        return JSONResponse(
            status_code=503,
            content=ErrorResponse(
                error=ErrorDetail(code="INFERENCE_ERROR", message=str(exc)),
                timestamp=int(time.time()),
            ).model_dump(),
        )
    except Exception:
        return JSONResponse(
            status_code=500,
            content=ErrorResponse(
                error=ErrorDetail(code="INFERENCE_ERROR",
                                  message="Inference pipeline failed"),
                timestamp=int(time.time()),
            ).model_dump(),
        )
    return {
        "objetos": [_to_legacy_object(r) for r in raw],
        "orientacao": _build_orientation(raw),
        "timestamp": int(time.time()),
    }


# â”€â”€â”€ Routes: URL Inference (legacy) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

_PRIVATE_NETS = [
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("169.254.0.0/16"),
    ipaddress.ip_network("::1/128"),
    ipaddress.ip_network("fc00::/7"),
]


def _validate_public_url(url: str) -> None:
    if not re.match(r"^https?://", url, re.IGNORECASE):
        raise HTTPException(
            status_code=400, detail="URL must use http or https")
    host = urlparse(url).hostname
    if not host:
        raise HTTPException(status_code=400, detail="Invalid URL")
    try:
        ip = ipaddress.ip_address(socket.gethostbyname(host))
    except Exception:
        raise HTTPException(status_code=400, detail="Cannot resolve URL host")
    if any(ip in net for net in _PRIVATE_NETS):
        raise HTTPException(
            status_code=400, detail="URL points to a private address")


class _URLItem(BaseModel):
    url: str


@app.post("/analisar_url")
async def analisar_url(
    item: _URLItem,
    focal_length_px: Optional[float] = None,
    real_height_cm: Optional[float] = None,
    camera_id: Optional[str] = None,
):
    _validate_public_url(item.url)
    try:
        async with httpx.AsyncClient(timeout=20.0, follow_redirects=False) as client:
            resp = await client.get(item.url)
            resp.raise_for_status()
            contents = resp.content
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=400, detail="Could not download image")
    img = _bytes_to_image(contents)
    if img is None:
        raise HTTPException(
            status_code=400, detail="Invalid or unsupported image format")
    raw = _detect(img, camera_id=camera_id)
    return {
        "objetos": [_to_legacy_object(r) for r in raw],
        "orientacao": _build_orientation(raw),
        "timestamp": int(time.time()),
    }


# â”€â”€â”€ Routes: Model Management â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

@app.get("/model")
async def model_info():
    loaded = _model is not None
    device_str = None
    classes = None
    if loaded:
        try:
            names = getattr(_model, "names", None)
            if isinstance(names, dict):
                classes = [names[k]
                           for k in sorted(names, key=lambda x: int(x))]
            else:
                classes = names
            md = getattr(_model, "model", None) or _model
            for p in md.parameters():
                device_str = str(p.device)
                break
        except Exception:
            pass
    return {"loaded": loaded, "model_path": _model_path, "device": device_str, "classes": classes}


@app.post("/model")
async def model_set(item: dict, x_api_key: Optional[str] = Header(default=None)):
    _require_api_key(x_api_key)
    path = item.get("path") if isinstance(item, dict) else None
    if not path:
        raise HTTPException(
            status_code=400, detail='Provide JSON with key "path"')
    if not Path(path).exists():
        raise HTTPException(status_code=404, detail="Model file not found")
    try:
        global _model, _model_path
        _model = YOLO(path)
        _model_path = path
        return {"model_path": _model_path}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
