from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import analyze, roads, cameras

app = FastAPI(title="Smart City AI Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze.router, prefix="/analyze", tags=["Analyze"])
app.include_router(roads.router, prefix="/analyze", tags=["Roads"])
app.include_router(cameras.router, prefix="/analyze", tags=["Cameras"])


@app.get("/health")
def health():
    return {"status": "ok"}
