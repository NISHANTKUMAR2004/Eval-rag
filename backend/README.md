# EvalGuard AI Backend

EvalGuard AI is a Multi-Agent RAG Evaluation Platform.

## Phase 1 Features

- FastAPI backend foundation
- Environment-based configuration
- Logging setup
- Health check route
- Database connection setup
- Docker support
- Basic tests

## Run Locally

```powershell
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn app.main:app --reload