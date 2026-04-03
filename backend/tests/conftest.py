"""
Backend test configuration.

Sets DATABASE_URL to a throw-away SQLite file *before* any app module is
imported so that pydantic-settings picks it up and all SQLAlchemy engines
point to the test database instead of the production one.
"""
import os

os.environ["DATABASE_URL"] = "sqlite:///./test_smart_city.db"
os.environ["AI_PROVIDER"] = "mock"

import pytest
from fastapi.testclient import TestClient

from app.main import app  # imported after env-var override


@pytest.fixture(scope="session")
def client():
    """
    Session-scoped TestClient.  Using it as a context manager triggers the
    app lifespan which runs create_all + seed_database against the test DB.
    """
    with TestClient(app) as c:
        yield c
