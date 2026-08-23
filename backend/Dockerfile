FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

ENV DATABASE_URL=postgresql+psycopg://nexa:nexa@postgres:5432/nexa \
    REDIS_URL=redis://redis:6379/0 \
    QDRANT_URL=http://qdrant:6333 \
    FRONTEND_ORIGIN=http://localhost:3000 \
    DATA_DIR=/app/data

RUN mkdir -p /app/data/knowledge

EXPOSE 8000

HEALTHCHECK --interval=15s --timeout=5s --retries=5 \
  CMD curl -fsS http://localhost:8000/api/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]