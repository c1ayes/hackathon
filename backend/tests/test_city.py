def test_city_overview_returns_200(client):
    response = client.get("/api/city/overview")
    assert response.status_code == 200


def test_city_overview_top_level_shape(client):
    data = client.get("/api/city/overview").json()
    assert set(data.keys()) >= {"city", "districts", "segments", "totals"}
    assert data["city"] == "Almaty"


def test_city_overview_has_seeded_districts(client):
    data = client.get("/api/city/overview").json()
    assert len(data["districts"]) > 0
    totals = data["totals"]
    assert totals["districts"] == len(data["districts"])


def test_city_overview_districts_have_budget_fields(client):
    districts = client.get("/api/city/overview").json()["districts"]
    required = {"id", "name", "budget_total", "budget_available", "segment_count"}
    for d in districts:
        assert required.issubset(d.keys()), f"District missing fields: {required - d.keys()}"
        assert d["segment_count"] > 0


def test_city_overview_segments_have_map_fields(client):
    segments = client.get("/api/city/overview").json()["segments"]
    assert len(segments) > 0
    required = {"id", "name", "risk_level", "defect_score", "center_lat", "center_lng"}
    for s in segments:
        assert required.issubset(s.keys())


def test_city_overview_totals_are_consistent(client):
    data = client.get("/api/city/overview").json()
    totals = data["totals"]
    assert totals["segments"] == len(data["segments"])
    assert totals["red_segments"] <= totals["segments"]
    assert totals["low_camera_coverage_segments"] <= totals["segments"]
