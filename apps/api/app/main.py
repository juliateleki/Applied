from fastapi import FastAPI
from fastapi.responses import Response

app = FastAPI(title="Applied API")

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/favicon.ico", include_in_schema=False)
def favicon():
    return Response(status_code=204)
