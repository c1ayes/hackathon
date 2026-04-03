"""
Unit tests for POST /analyze/district and POST /analyze/simulate.
_call_ollama is replaced by the stub in conftest.py (autouse).
"""
import pytest

DISTRICT_PAYLOAD = {
    "district_id": 1,
    "name": "Алмалинский",
    "risk_score": 0.72,
    "mood_index": 45.0,
    "pollution_index": 0.6,
    "traffic_index": 0.8,
    "complaints_count": 23,
    "reports": [
        {
            "category": "road",
            "source": "citizen",
            "severity_score": 0.9,
            "text": "Large potholes on Abay Ave",
        }
    ],
}

SIMULATE_PAYLOAD = {
    "district_id": 1,
    "district_name": "Алмалинский",
    "action": "Repair potholes on Abay Ave",
    "before_risk": 0.72,
    "before_complaints_count": 23,
    "before_pollution": 0.6,
    "before_traffic": 0.8,
    "before_mood": 45.0,
}


def test_analyze_district_returns_200(client):
    response = client.post("/analyze/district", json=DISTRICT_PAYLOAD)
    assert response.status_code == 200


def test_analyze_district_response_shape(client):
    data = client.post("/analyze/district", json=DISTRICT_PAYLOAD).json()
    assert data["title"]
    assert data["summary"]


def test_analyze_district_confidence_is_float_in_range(client):
    data = client.post("/analyze/district", json=DISTRICT_PAYLOAD).json()
    assert isinstance(data["confidence"], float)
    assert 0.0 <= data["confidence"] <= 1.0


def test_analyze_district_recommendations_is_list(client):
    data = client.post("/analyze/district", json=DISTRICT_PAYLOAD).json()
    assert isinstance(data["recommendations"], list)
    assert len(data["recommendations"]) > 0


def test_analyze_district_works_without_reports(client):
    payload = {**DISTRICT_PAYLOAD, "reports": []}
    response = client.post("/analyze/district", json=payload)
    assert response.status_code == 200


def test_simulate_action_returns_200(client):
    response = client.post("/analyze/simulate", json=SIMULATE_PAYLOAD)
    assert response.status_code == 200


def test_simulate_action_response_shape(client):
    data = client.post("/analyze/simulate", json=SIMULATE_PAYLOAD).json()
    required = {"district_id", "action", "before", "after", "effect_summary", "city_status"}
    assert required.issubset(data.keys())


def test_simulate_action_before_metrics_match_request(client):
    data = client.post("/analyze/simulate", json=SIMULATE_PAYLOAD).json()
    assert data["before"]["risk"] == SIMULATE_PAYLOAD["before_risk"]
    assert data["before"]["complaints_count"] == SIMULATE_PAYLOAD["before_complaints_count"]


def test_simulate_action_after_metrics_are_in_valid_range(client):
    data = client.post("/analyze/simulate", json=SIMULATE_PAYLOAD).json()
    after = data["after"]
    assert 0.0 <= after["risk"] <= 1.0
    assert 0.0 <= after["pollution"] <= 1.0
    assert 0.0 <= after["traffic"] <= 1.0
    assert 0.0 <= after["mood_index"] <= 100.0
    assert after["complaints_count"] >= 0


def test_simulate_action_city_status_is_non_empty_string(client):
    data = client.post("/analyze/simulate", json=SIMULATE_PAYLOAD).json()
    assert isinstance(data["city_status"], str)
    assert len(data["city_status"]) > 0
