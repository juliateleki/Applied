# apps/api/Dockerfile
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# System deps (psycopg needs build tools sometimes)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential curl \
  && rm -rf /var/lib/apt/lists/*

# Copy only dependency files first for better caching
COPY pyproject.toml ./
# If you use a lockfile, copy it too (uncomment if you have one)
# COPY uv.lock ./
# COPY poetry.lock ./

# Install dependencies
# Assumes your pyproject supports pip editable install:
RUN pip install --no-cache-dir -U pip \
 && pip install --no-cache-dir -e .

# Now copy the actual app code
COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host=0.0.0.0", "--port=8000"]
