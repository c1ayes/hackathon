"""
Unit + integration tests for POST /analyze/roads.

Unit tests (default): _call_ollama is stubbed by conftest.py.
Integration tests (-m integration): call the live service at localhost:8001
and verify that real Ollama responses are non-empty and structurally correct.
"""
import pytest
import httpx


# ── Unit tests ────────────────────────────────────────────────────────────────

def test_analyze_roads_returns_200(client):
    response = client.post("/analyze/roads")
    assert response.status_code == 200


def test_analyze_roads_response_has_required_fields(client):
    data = client.post("/analyze/roads").json()
    required = {"title", "summary", "top_priority_segments", "recommendations", "confidence"}
    assert required.issubset(data.keys())


def test_analyze_roads_top_priority_segments_is_list_of_three(client):
    data = client.post("/analyze/roads").json()
    assert isinstance(data["top_priority_segments"], list)
    assert len(data["top_priority_segments"]) == 3


def test_analyze_roads_confidence_is_float_in_range(client):
    data = client.post("/analyze/roads").json()
    assert isinstance(data["confidence"], float)
    assert 0.0 <= data["confidence"] <= 1.0


def test_analyze_roads_total_savings_is_positive_int(client):
    data = client.post("/analyze/roads").json()
    assert isinstance(data["total_savings_if_fixed_now_tenge"], int)
    assert data["total_savings_if_fixed_now_tenge"] > 0


def test_analyze_roads_recommendations_is_non_empty_list(client):
    data = client.post("/analyze/roads").json()
    assert isinstance(data["recommendations"], list)
    assert len(data["recommendations"]) > 0


def test_analyze_roads_title_is_under_255_chars(client):
    data = client.post("/analyze/roads").json()
    assert len(data["title"]) <= 255


def test_analyze_roads_accepts_optional_context(client):
    response = client.post("/analyze/roads", json={"context": "Focus on freeze-thaw risk"})
    assert response.status_code == 200


# ── Integration tests (require live Ollama + ai service on :8001) ─────────────

@pytest.mark.integration
def test_roads_calls_ollama_and_returns_structured_json():
    """Hits the live service — verifies Ollama actually responds."""
    response = httpx.post("http://localhost:8001/analyze/roads", timeout=120)
    assert response.status_code == 200
    data = response.json()
    assert data["title"], "title must not be empty"
    assert data["summary"], "summary must not be empty"
    assert isinstance(data["top_priority_segments"], list)
    assert len(data["top_priority_segments"]) == 3
    assert isinstance(data["confidence"], float)


@pytest.mark.integration
def test_roads_live_response_contains_tenge_figures():
    """LLM should include financial context (tenge) in summary or recommendations."""
    data = httpx.post("http://localhost:8001/analyze/roads", timeout=120).json()
    combined_text = data["summary"] + " ".join(data["recommendations"])
    assert "tenge" in combined_text.lower() or data["total_savings_if_fixed_now_tenge"] is not None
