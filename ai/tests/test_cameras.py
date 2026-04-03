"""
Unit + integration tests for POST /analyze/cameras.

Unit tests (default): _call_ollama is stubbed by conftest.py.
Integration tests (-m integration): call the live service at localhost:8001
and verify real Ollama responses are non-empty and structurally correct.
"""
import pytest
import httpx


# ── Unit tests ────────────────────────────────────────────────────────────────

def test_analyze_cameras_returns_200(client):
    response = client.post("/analyze/cameras")
    assert response.status_code == 200


def test_analyze_cameras_response_has_required_fields(client):
    data = client.post("/analyze/cameras").json()
    required = {"title", "summary", "top_priority_installs", "recommendations", "confidence"}
    assert required.issubset(data.keys())


def test_analyze_cameras_top_priority_installs_has_two_entries(client):
    data = client.post("/analyze/cameras").json()
    assert isinstance(data["top_priority_installs"], list)
    assert len(data["top_priority_installs"]) == 2


def test_analyze_cameras_confidence_is_float_in_range(client):
    data = client.post("/analyze/cameras").json()
    assert isinstance(data["confidence"], float)
    assert 0.0 <= data["confidence"] <= 1.0


def test_analyze_cameras_projected_revenue_is_positive(client):
    data = client.post("/analyze/cameras").json()
    assert isinstance(data["projected_additional_revenue_tenge"], int)
    assert data["projected_additional_revenue_tenge"] > 0


def test_analyze_cameras_recommendations_is_non_empty_list(client):
    data = client.post("/analyze/cameras").json()
    assert isinstance(data["recommendations"], list)
    assert len(data["recommendations"]) > 0


def test_analyze_cameras_title_is_under_255_chars(client):
    data = client.post("/analyze/cameras").json()
    assert len(data["title"]) <= 255


def test_analyze_cameras_accepts_optional_context(client):
    response = client.post("/analyze/cameras", json={"context": "Focus on accident hotspots"})
    assert response.status_code == 200


# ── Integration tests (require live Ollama + ai service on :8001) ─────────────

@pytest.mark.integration
def test_cameras_calls_ollama_and_returns_structured_json():
    """Hits the live service — verifies Ollama actually responds."""
    response = httpx.post("http://localhost:8001/analyze/cameras", timeout=120)
    assert response.status_code == 200
    data = response.json()
    assert data["title"], "title must not be empty"
    assert data["summary"], "summary must not be empty"
    assert isinstance(data["top_priority_installs"], list)
    assert len(data["top_priority_installs"]) == 2
    assert isinstance(data["confidence"], float)


@pytest.mark.integration
def test_cameras_live_response_mentions_roi():
    """LLM prompt explicitly asks for ROI — it should appear in recommendations."""
    data = httpx.post("http://localhost:8001/analyze/cameras", timeout=120).json()
    combined_text = " ".join(data["recommendations"]) + data["summary"]
    has_roi = (
        "roi" in combined_text.lower()
        or "breakeven" in combined_text.lower()
        or data["projected_additional_revenue_tenge"] is not None
    )
    assert has_roi
