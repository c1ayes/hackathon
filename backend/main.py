from fastapi import FastAPI
from routes.city import router as city_router

app = FastAPI(title="Smart City Dashboard API")

app.include_router(city_router)