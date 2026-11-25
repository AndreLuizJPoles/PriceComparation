# Backend — Price Comparator API

FastAPI skeleton (Phase 1 bootstrap). **Demo-ready**: no real store credentials; later phases mark offers with `is_demo=true`.

## Local (without Docker)

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- Docs: http://localhost:8000/docs
- Health: http://localhost:8000/api/v1/health
