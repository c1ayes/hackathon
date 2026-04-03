"""
Tests for POST /api/segments/{id}/recommendations and
POST /api/recommendations/{action_id}/forecast.

AIService is pure Python (no HTTP, no Ollama) so these tests are fully
self-contained — no mocking required.
"""


RECOMMENDATION_BODY = {"scenario": "combined", "language": "ru"}


def test_create_recommendation_returns_200(client):
    response = client.post("/api/segments/1/recommendations", json=RECOMMENDATION_BODY)
    assert response.status_code == 200


def test_create_recommendation_response_shape(client):
    data = client.post("/api/segments/1/recommendations", json=RECOMMENDATION_BODY).json()
    required = {"id", "segment_id", "scenario_type", "summary", "priority_score", "actions"}
    assert required.issubset(data.keys())


def test_create_recommendation_has_actions(client):
    data = client.post("/api/segments/1/recommendations", json=RECOMMENDATION_BODY).json()
    assert len(data["actions"]) > 0


def test_create_recommendation_action_fields_are_valid(client):
    actions = client.post("/api/segments/1/recommendations", json=RECOMMENDATION_BODY).json()["actions"]
    valid_action_types = {
        "fix_now", "fix_this_quarter", "monitor",
        "install_camera", "increase_patrol",
        "infrastructure_change", "reallocate_budget",
    }
    for action in actions:
        assert action["action_type"] in valid_action_types
        assert action["title"]
        assert action["financial_impact"] >= 0
        assert 0.0 <= action["risk_reduction"] <= 1.0


def test_create_recommendation_priority_score_in_range(client):
    data = client.post("/api/segments/1/recommendations", json=RECOMMENDATION_BODY).json()
    assert 0.0 <= data["priority_score"] <= 100.0


def test_create_recommendation_road_only_scenario(client):
    response = client.post("/api/segments/1/recommendations", json={"scenario": "road_damage"})
    assert response.status_code == 200
    data = response.json()
    action_types = {a["action_type"] for a in data["actions"]}
    assert action_types & {"fix_now", "fix_this_quarter", "monitor", "reallocate_budget"}


def test_forecast_for_action_returns_200(client):
    rec = client.post("/api/segments/1/recommendations", json=RECOMMENDATION_BODY).json()
    action_id = rec["actions"][0]["id"]
    response = client.post(f"/api/recommendations/{action_id}/forecast", json={})
    assert response.status_code == 200


def test_forecast_response_shape(client):
    rec = client.post("/api/segments/1/recommendations", json=RECOMMENDATION_BODY).json()
    action_id = rec["actions"][0]["id"]
    data = client.post(f"/api/recommendations/{action_id}/forecast", json={}).json()
    required = {
        "id", "recommended_action_id", "forecast_summary",
        "projected_savings", "projected_revenue",
        "projected_accident_reduction", "projected_risk_change",
    }
    assert required.issubset(data.keys())


def test_forecast_projected_risk_change_is_negative(client):
    """Risk should go down after any recommended action."""
    rec = client.post("/api/segments/1/recommendations", json=RECOMMENDATION_BODY).json()
    action_id = rec["actions"][0]["id"]
    data = client.post(f"/api/recommendations/{action_id}/forecast", json={}).json()
    assert data["projected_risk_change"] < 0


def test_forecast_accepts_optional_notes(client):
    rec = client.post("/api/segments/1/recommendations", json=RECOMMENDATION_BODY).json()
    action_id = rec["actions"][0]["id"]
    response = client.post(
        f"/api/recommendations/{action_id}/forecast",
        json={"notes": "User note for context"},
    )
    assert response.status_code == 200
    assert "User note" in response.json()["forecast_summary"]
