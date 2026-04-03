import os
import httpx
from fastapi import HTTPException

AI_SERVICE_URL = os.getenv("AI_SERVICE_URL", "http://localhost:8001")


async def call_analyze_district(payload: dict) -> dict:
    async with httpx.AsyncClient(timeout=60.0) as client:
        r = await client.post(f"{AI_SERVICE_URL}/analyze/district", json=payload)
        if r.status_code != 200:
            raise HTTPException(status_code=502, detail=f"AI service error: {r.text}")
        return r.json()


async def call_simulate_action(payload: dict) -> dict:
    async with httpx.AsyncClient(timeout=60.0) as client:
        r = await client.post(f"{AI_SERVICE_URL}/analyze/simulate", json=payload)
        if r.status_code != 200:
            raise HTTPException(status_code=502, detail=f"AI service error: {r.text}")
        return r.json()
