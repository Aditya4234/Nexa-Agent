# Nexa-Agent

AI-powered agentic platform with Next.js frontend and FastAPI backend.

## Tech Stack
- **Frontend:** Next.js 14, TypeScript, Tailwind CSS
- **Backend:** FastAPI, Python, SQLAlchemy
- **Infra:** Docker, Docker Compose

## Project Structure
```
NexaAgent/
├── backend/      # FastAPI app (app/, api/, data/, requirements.txt)
├── frontend/     # Next.js app (app/, components/, lib/)
├── docker/       # Docker configs
├── docker-compose.yml
└── .env.example
```

## Quick Start

### Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python run.py
```

### Frontend
```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

### Docker
```bash
docker-compose up --build
```

## Environment Variables
Copy `.env.example` to `.env` and `frontend/.env.local.example` to `frontend/.env.local` and fill required values.

## License
MIT
