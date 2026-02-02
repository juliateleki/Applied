from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.applications import router as applications_router

app = FastAPI(title="Applied API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:8080", "http://localhost"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(applications_router)

@app.get("/health")
def health_check():
    return {"status": "ok"}
