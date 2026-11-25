# Adaptadores de lojas

## Contrato

Cada loja implementa `StoreAdapter`:

- `store_slug`, `is_enabled`, `is_demo`
- `search(query, limit)`
- `get_product(external_id)`
- `health()`

## Status atual (MVP)

| Loja | Status | Fonte |
|------|--------|-------|
| Demo Multi-Store | Ativo | Fixtures JSON (`is_demo=true`) |
| Amazon BR | Desativado | Futuro: Creators API + Associados |
| Mercado Livre | Desativado | Futuro: API de desenvolvedores |
| Magazine Luiza | Desativado | Sem API pública de catálogo para afiliado |
| KaBuM! | Desativado | Futuro: feed Awin |
| Casas Bahia | Desativado | Futuro: Awin (PJ) |

## Regras

- Sem scraping indiscriminado
- Sem contornar CAPTCHA, auth ou rate limits
- Preferência: APIs oficiais → afiliados → feeds oficiais
- Dados demo sempre rotulados na API e no UI

## Ativação futura

1. Obter credenciais oficiais
2. Preencher variáveis de ambiente
3. Implementar o stub correspondente
4. Definir `is_enabled=true` no registry/settings
