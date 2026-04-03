from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.city import router as city_router

app = FastAPI(title="Smart City Dashboard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(city_router)