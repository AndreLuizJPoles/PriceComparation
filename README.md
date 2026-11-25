# Comparador Inteligente de Preços

Monorepo full-stack para pesquisar produtos e comparar preços entre lojas virtuais confiáveis.

**Status:** MVP funcional em modo demonstração. Sem scraping. Adaptadores oficiais (Amazon, Mercado Livre, Magalu, KaBuM!, Casas Bahia) existem como stubs desativados até haver credenciais/APIs autorizadas.

## Stack

| Camada | Tecnologia |
|--------|------------|
| Frontend | React, TypeScript, Vite, Tailwind, TanStack Query, React Hook Form, Zod, Recharts |
| Backend | Python 3.12, FastAPI, Pydantic, SQLAlchemy, Alembic |
| Dados | PostgreSQL, Redis |
| Jobs | Celery (worker + beat) |
| Infra | Docker Compose, GitHub Actions |

## Estrutura

```text
PriceComparation/
├── frontend/
├── backend/
├── infrastructure/docker/
├── docs/
├── .github/workflows/
├── docker-compose.yml
├── .env.example
└── README.md
```

## Requisitos

- Docker Desktop (recomendado) **ou** Node 22+, Python 3.12+, PostgreSQL 16, Redis 7
- Copiar `.env.example` → `.env`

## Executar com Docker

```powershell
cd C:\Users\André\Documents\PriceComparation
Copy-Item .env.example .env
docker compose up --build
```

| Serviço | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| OpenAPI | http://localhost:8000/docs |
| Health | http://localhost:8000/api/v1/health |
| API via proxy do frontend | http://localhost:3000/api/v1/health |

O backend sobe com `alembic upgrade head` + seed demo.

## Desenvolvimento local

### Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
$env:DATABASE_URL="postgresql+asyncpg://pricecomp:pricecomp_dev_change_me@localhost:5432/pricecomp"
$env:REDIS_URL="redis://localhost:6379/0"
alembic upgrade head
python -m scripts.seed_demo
uvicorn app.main:app --reload --port 8000
```

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

## Testes

```powershell
# Backend
cd backend
pytest -q

# Frontend
cd frontend
npm run test
npm run typecheck
```

## API principal

- `GET /api/v1/products/search?q=`
- `GET /api/v1/products/{id}`
- `GET /api/v1/products/{id}/offers`
- `GET /api/v1/products/{id}/price-history?period=30d`
- `POST /api/v1/auth/register|login|logout|refresh`
- `GET/POST/DELETE /api/v1/favorites`
- `GET/POST/PATCH/DELETE /api/v1/alerts`

Respostas no envelope `{ data, meta, error }`. Dados demo trazem `is_demo: true` e banner no meta.

## Integrações de lojas

| Adapter | Status |
|---------|--------|
| Demo Multi-Store | Ativo (fixtures) |
| Amazon BR | Stub off |
| Mercado Livre | Stub off |
| Magazine Luiza | Stub off |
| KaBuM! | Stub off |
| Casas Bahia | Stub off |

Detalhes em [docs/store-adapters.md](docs/store-adapters.md).

## Segurança

- JWT access curto + refresh em cookie httpOnly
- Senhas com Argon2id
- CORS restrito, headers de segurança, rate limit
- Sem segredos versionados

## Documentação

- [Arquitetura](docs/architecture.md)
- [Modelo de dados](docs/data-model.md)
- [Fluxos](docs/flows.md)
- [Cache e jobs](docs/cache-and-jobs.md)
- [Segurança](docs/security.md)
- [Adaptadores](docs/store-adapters.md)

## Limitações conhecidas

- Preços atuais são de demonstração
- Frete real depende de CEP/APIs futuras
- E-mail de alerta/reset usa stub de console em desenvolvimento
- Sem notificações push

## Roadmap

1. Ativar adapters com APIs/feeds oficiais
2. SMTP real para alertas e reset de senha
3. Autocomplete com índice dedicado
4. Playwright e2e na CI
5. Observabilidade (Sentry em produção)

## Licença

Projeto educacional / portfólio.
