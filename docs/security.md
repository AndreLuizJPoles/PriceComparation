# Segurança

## Autenticação

- Access JWT de curta duração (15 min)
- Refresh token rotacionado em cookie `httpOnly`, `Secure` (prod), `SameSite=Lax`
- Senhas com Argon2id
- Reset de senha com token opaco no Redis + TTL curto

## API

- Validação Pydantic em todas as entradas
- SQLAlchemy parametrizado (proteção contra SQL injection)
- CORS restrito às origens do frontend
- Rate limiting em auth e search
- Headers de segurança (CSP básica, X-Content-Type-Options, etc.)
- Logs estruturados sem senhas/tokens

## Integrações

- Allowlist de hosts por adapter (anti-SSRF)
- Timeouts e retries com backoff
- Limite de concorrência
- Credenciais apenas em variáveis de ambiente

## Frontend

- Sem segredos no bundle
- Access token em memória
- Rotas privadas protegidas
- Sem `dangerouslySetInnerHTML`
- Validação Zod no client (complementar à do servidor)
