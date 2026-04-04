from fastapi import APIRouter, Body

from app.services.ai_client import (
    call_brain1_analysis,
    call_ollama_health,
    call_unified_analysis,
)


router = APIRouter(prefix="/analysis", tags=["analysis"])


@router.get("/health/ollama")
async def get_ollama_health() -> dict:
    return await call_ollama_health()


@router.post("/unified")
async def run_unified_analysis(payload: dict = Body(default_factory=dict)) -> dict:
    return await call_unified_analysis(payload or {})


@router.post("/unified/brain1-only")
async def run_brain1_only_analysis(payload: dict = Body(default_factory=dict)) -> dict:
    return await call_brain1_analysis(payload or {})
