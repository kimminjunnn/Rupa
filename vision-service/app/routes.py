import logging
import os
from pathlib import Path
from time import perf_counter

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.detection_utils import WallDetectionConfigError, WallDetectionInferenceError
from app.image_loader import load_image_payload
from app.route_helper import build_route_response
from app.schemas import (
    AnalyzeWallResponse,
    SelectRouteRequest,
    SelectRouteResponse,
)
from app.wall_detection import infer_wall_objects
from app.wall_detection import DEFAULT_PROVIDER, PROVIDER_ENV
from app.yolo_provider import MODEL_PATH_ENV

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/health")
def health():
    model_path = os.environ.get(MODEL_PATH_ENV)
    return {
        "ok": True,
        "service": "vision-service",
        "wallDetectionProvider": os.environ.get(PROVIDER_ENV, DEFAULT_PROVIDER),
        "modelPathConfigured": bool(model_path),
        "modelPathExists": bool(model_path and Path(model_path).expanduser().exists()),
    }


@router.post("/internal/analyze-wall", response_model=AnalyzeWallResponse)
async def analyze_wall(file: UploadFile = File(...)):
    started_at = perf_counter()
    read_finished_at = started_at
    decode_finished_at = started_at
    try:
        payload = await file.read()
        read_finished_at = perf_counter()
        image = load_image_payload(file.filename or "wall.jpg", payload)
        decode_finished_at = perf_counter()
        result = infer_wall_objects(image)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))
    except WallDetectionConfigError as error:
        logger.exception("wall_detection_config_failed")
        raise HTTPException(status_code=500, detail=str(error))
    except WallDetectionInferenceError as error:
        logger.exception("wall_detection_inference_failed")
        raise HTTPException(status_code=502, detail=str(error))
    except Exception:
        logger.exception("analyze_wall_failed")
        raise HTTPException(status_code=500, detail="analyze_wall_failed")

    if len(result.objects) == 0:
        raise HTTPException(status_code=422, detail="no_objects_detected")

    finished_at = perf_counter()
    logger.info(
        "wall_analysis_completed filename=%s bytes=%s image=%sx%s objects=%s read_ms=%.1f decode_ms=%.1f infer_ms=%.1f total_ms=%.1f",
        file.filename,
        len(payload),
        result.image.width,
        result.image.height,
        len(result.objects),
        (read_finished_at - started_at) * 1000,
        (decode_finished_at - read_finished_at) * 1000,
        (finished_at - decode_finished_at) * 1000,
        (finished_at - started_at) * 1000,
    )

    return result


@router.post("/internal/select-route", response_model=SelectRouteResponse)
def select_route(payload: SelectRouteRequest):
    try:
        return build_route_response(
            start_hold_object_id=payload.startHoldObjectId,
            objects=payload.objects,
        )
    except ValueError:
        raise HTTPException(status_code=422, detail="invalid_start_hold")
