from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.routes import city, health, recommendations, segments
from app.core.config import settings
from app.db.database import Base, SessionLocal, engine
from app.db.seed import seed_database


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    yield


app = FastAPI(title=settings.app_name, lifespan=lifespan)
app.include_router(health.router, prefix=settings.api_prefix)
app.include_router(city.router, prefix=settings.api_prefix)
app.include_router(segments.router, prefix=settings.api_prefix)
app.include_router(recommendations.router, prefix=settings.api_prefix)
