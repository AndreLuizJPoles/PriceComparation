# Cache e jobs

## Redis

- Cache de resultados de busca (`search:{hash}`), TTL configurável
- Cache de detalhe de produto
- Invalidação após refresh de preços ou seed
- Tokens de reset de senha

## Celery

| Task | Função |
|------|--------|
| `refresh_store_prices` | Consulta adapters habilitados, grava offers/history, invalida cache |
| `evaluate_alerts` | Compara preço atual com `target_price` e dispara `EmailPort` (stub em dev) |

Intervalo: `PRICE_REFRESH_INTERVAL_MINUTES` (padrão 60).

## Estratégia

Não consultar todas as lojas a cada request do usuário. Preferir índice local + refresh assíncrono.
