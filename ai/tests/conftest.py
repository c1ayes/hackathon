"""
AI service test configuration.

The `mock_ollama` fixture is autouse=True so every unit test gets a
deterministic stub instead of calling the real Ollama process.
Integration tests bypass this by calling localhost:8001 directly with httpx
(those HTTP calls are never intercepted by monkeypatch).
"""
import pytest
from fastapi.testclient import TestClient

from main import app  # ai/main.py — imported with pythonpath = .


@pytest.fixture(scope="session")
def client():
    """In-process TestClient for the AI FastAPI app."""
    with TestClient(app) as c:
        yield c


_OLLAMA_STUB = {
    # district + simulate shared fields
    "title": "Stub Title",
    "summary": "Stub summary with tenge figures.",
    "possible_cause": "Stub cause.",
    "forecast": "Stub 30-day forecast.",
    "recommendations": ["Action A — 10M tenge", "Action B — 5M tenge", "Action C — impact"],
    "confidence": 0.88,
    # roads extras
    "top_priority_segments": ["Segment X", "Segment Y", "Segment Z"],
    "total_savings_if_fixed_now_tenge": 500_000_000,
    # cameras extras
    "top_priority_installs": ["Intersection A", "Intersection B"],
    "projected_additional_revenue_tenge": 92_000_000,
    # simulate extras
    "after_risk": 0.3,
    "after_complaints_count": 8,
    "after_pollution": 0.2,
    "after_traffic": 0.3,
    "after_mood": 72.0,
    "effect_summary": "Road repairs reduced risk and raised citizen mood.",
}


@pytest.fixture(autouse=True)
def mock_ollama(monkeypatch):
    """
    Patch _call_ollama in every router module so unit tests never touch Ollama.
    autouse=True applies this to all tests in this directory automatically.
    Integration tests call localhost:8001 via httpx and are unaffected.
    """
    def stub(prompt, max_tokens=800):
        return _OLLAMA_STUB.copy()

    monkeypatch.setattr("routers.analyze._call_ollama", stub)
    monkeypatch.setattr("routers.roads._call_ollama", stub)
    monkeypatch.setattr("routers.cameras._call_ollama", stub)
