# Arquitetura

## Visão geral

Monorepo com frontend React (Vite) e backend FastAPI, comunicando-se via API REST versionada (`/api/v1`).

Camadas do backend:

1. **Apresentação** (`app/api`) — routers HTTP, validação de entrada, OpenAPI
2. **Aplicação** (`app/application`) — casos de uso
3. **Domínio** (`app/domain`) — matching de produtos, comparação de preços
4. **Infraestrutura** (`app/infrastructure`) — PostgreSQL, Redis, JWT, e-mail stub
5. **Integrações** (`app/integrations/stores`) — adaptadores de lojas

## Princípios

- Clean Architecture leve (sem over-engineering)
- SOLID, DRY, KISS
- Dependency Injection via FastAPI `Depends`
- Repository + Service / Use Case
- DTOs Pydantic entre camadas de borda

## Diagrama lógico

```text
Browser → Frontend (TanStack Query)
       → FastAPI routers
       → Use cases
       → Domain + Repositories + Store adapters
       → PostgreSQL / Redis / Celery
```

## Escalabilidade

- Cache Redis para buscas e detalhes de produto
- Paginação no backend
- Celery para refresh periódico de preços e avaliação de alertas
- Pool de conexões SQLAlchemy
- Adaptadores habilitados sob demanda (sem fan-out desnecessário)
