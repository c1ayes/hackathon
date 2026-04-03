"""
Ollama Service — LLM Integration

Provides functions for calling the Ollama LLM (qwen2.5:7b) with structured JSON output.
Brain 2 analysis is the primary use case.
"""

import json
import logging
from typing import Any

import ollama
from fastapi import HTTPException

logger = logging.getLogger(__name__)

MODEL = "qwen2.5:7b"

SYSTEM = (
    "You are an AI analyst for the Almaty Smart City Decision Dashboard. "
    "City officials use your output to allocate budget and dispatch teams. "
    "Respond ONLY with valid JSON — no markdown, no explanation, just the JSON object."
)

BRAIN2_SYSTEM = (
    "You are Brain 2 of a dual-brain AI system for Almaty Smart City infrastructure decisions. "
    "Brain 1 (Python) has already computed deterministic priority scores. "
    "Your job is to add qualitative enrichment, detect cross-domain overlaps, and flag anomalies. "
    "City officials depend on your analysis to allocate budget for road repairs and camera installations. "
    "Respond ONLY with valid JSON matching the exact structure requested — no markdown, no explanation."
)


def _clamp(val: float, lo: float, hi: float) -> float:
    """Clamp a value between lo and hi."""
    return max(lo, min(hi, val))


def _city_status(risk: float) -> str:
    """Derive city status label from risk score."""
    if risk > 0.7:
        return "critical"
    if risk > 0.45:
        return "warning"
    return "normal"


def _call_ollama(prompt: str, max_tokens: int = 1024) -> dict:
    """
    Call Ollama LLM with standard system prompt.
    
    Legacy function for backward compatibility with existing endpoints.
    """
    try:
        resp = ollama.chat(
            model=MODEL,
            format="json",
            options={"num_predict": max_tokens, "temperature": 0.3},
            messages=[
                {"role": "system", "content": SYSTEM},
                {"role": "user", "content": prompt},
            ],
        )
        content = resp["message"]["content"] if isinstance(resp, dict) else resp.message.content
        return json.loads(content)
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse LLM response as JSON: {e}")
        raise HTTPException(status_code=502, detail=f"LLM returned invalid JSON: {e}")
    except Exception as exc:
        logger.error(f"Ollama service error: {exc}")
        raise HTTPException(status_code=503, detail=f"AI service unavailable: {exc}")


def call_brain2_analysis(prompt: str, max_tokens: int = 2048) -> dict:
    """
    Call Ollama LLM for Brain 2 analysis.
    
    Uses the Brain 2-specific system prompt optimized for:
    - Enrichment of Brain 1 scores
    - Cross-domain overlap detection
    - Anomaly detection (Type A and Type B)
    
    Args:
        prompt: The full Brain 2 prompt including Brain 1 output context
        max_tokens: Maximum response length (default: 2048 for detailed analysis)
    
    Returns:
        Parsed JSON response from LLM
    
    Raises:
        HTTPException: If LLM is unavailable or returns invalid response
    """
    try:
        logger.info("Calling Ollama for Brain 2 analysis...")
        
        resp = ollama.chat(
            model=MODEL,
            format="json",
            options={
                "num_predict": max_tokens,
                "temperature": 0.3,  # Low temperature for consistency
                "top_p": 0.9,
                "repeat_penalty": 1.1,
            },
            messages=[
                {"role": "system", "content": BRAIN2_SYSTEM},
                {"role": "user", "content": prompt},
            ],
        )
        
        # Extract content from response
        if isinstance(resp, dict):
            content = resp.get("message", {}).get("content", "")
        else:
            content = resp.message.content
        
        if not content:
            logger.warning("LLM returned empty response")
            return _generate_fallback_brain2_response("Empty response from LLM")
        
        # Parse JSON
        result = json.loads(content)
        
        # Validate required keys
        required_keys = ["enrichment", "overlaps", "anomalies", "overall_confidence"]
        missing_keys = [k for k in required_keys if k not in result]
        
        if missing_keys:
            logger.warning(f"LLM response missing keys: {missing_keys}")
            # Fill in missing keys with defaults
            for key in missing_keys:
                result[key] = _get_default_for_key(key)
        
        logger.info(f"Brain 2 analysis complete. Confidence: {result.get('overall_confidence', {}).get('score_pct', 'N/A')}%")
        return result
        
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse Brain 2 response as JSON: {e}")
        return _generate_fallback_brain2_response(f"JSON parse error: {e}")
    
    except Exception as exc:
        logger.error(f"Brain 2 Ollama service error: {exc}")
        return _generate_fallback_brain2_response(f"Service error: {exc}")


def _get_default_for_key(key: str) -> Any:
    """Get default value for missing Brain 2 response keys."""
    defaults = {
        "enrichment": {"roads": [], "cameras": []},
        "overlaps": [],
        "anomalies": {"type_a": [], "type_b": []},
        "overall_confidence": {
            "score_pct": 50,
            "calculation_basis": "Unable to calculate — response incomplete",
            "interpretation": "Low confidence due to LLM response issues"
        },
    }
    return defaults.get(key, None)


def _generate_fallback_brain2_response(error_msg: str) -> dict:
    """
    Generate a fallback Brain 2 response when LLM fails.
    
    This ensures the pipeline can still return Brain 1 results even if Brain 2 fails.
    """
    return {
        "enrichment": {
            "roads": [],
            "cameras": [],
        },
        "overlaps": [],
        "anomalies": {
            "type_a": [],
            "type_b": [
                {
                    "entity": "brain2_response",
                    "entity_type": "system",
                    "suspicious_pattern": f"LLM analysis failed: {error_msg}",
                    "why_implausible": "Brain 2 could not complete analysis",
                    "expected_correct_data": "Valid JSON response with enrichment, overlaps, and anomalies"
                }
            ],
        },
        "overall_confidence": {
            "score_pct": 25,
            "calculation_basis": f"Fallback response due to: {error_msg}",
            "interpretation": "Low confidence — Brain 2 analysis unavailable. Rely on Brain 1 scores only."
        },
    }


def call_roads_analysis(prompt: str, max_tokens: int = 800) -> dict:
    """
    Call Ollama for roads-only analysis (backward compatibility).
    """
    return _call_ollama(prompt, max_tokens)


def call_cameras_analysis(prompt: str, max_tokens: int = 800) -> dict:
    """
    Call Ollama for cameras-only analysis (backward compatibility).
    """
    return _call_ollama(prompt, max_tokens)


def check_ollama_health() -> dict:
    """
    Check if Ollama service is available and model is loaded.
    
    Returns:
        dict with status information
    """
    try:
        # Try a minimal call to check service
        models = ollama.list()
        model_names = [m.get("name", "") for m in models.get("models", [])]
        
        model_available = any(MODEL in name for name in model_names)
        
        return {
            "status": "healthy" if model_available else "degraded",
            "model": MODEL,
            "model_available": model_available,
            "available_models": model_names,
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "model": MODEL,
            "model_available": False,
            "error": str(e),
        }
