import pytest


def test_get_segment_returns_200_for_seeded_id(client):
    response = client.get("/api/segments/1")
    assert response.status_code == 200


def test_get_segment_has_required_fields(client):
    data = client.get("/api/segments/1").json()
    required = {
        "id", "name", "district_id", "risk_level",
        "defect_score", "camera_coverage_score", "accident_risk_score",
    }
    assert required.issubset(data.keys())


def test_get_segment_risk_level_is_valid_enum(client):
    data = client.get("/api/segments/1").json()
    assert data["risk_level"] in {"red", "yellow", "green"}


def test_get_segment_scores_are_in_valid_range(client):
    data = client.get("/api/segments/1").json()
    assert 0.0 <= data["defect_score"] <= 100.0
    assert 0.0 <= data["camera_coverage_score"] <= 1.0
    assert 0.0 <= data["accident_risk_score"] <= 1.0


def test_get_segment_returns_404_for_nonexistent_id(client):
    response = client.get("/api/segments/999999")
    assert response.status_code == 404
