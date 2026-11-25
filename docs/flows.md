# Fluxos

## Pesquisa

1. Usuário digita (debounce no frontend)
2. `GET /api/v1/products/search?q=`
3. Cache Redis → hit retorna imediatamente
4. Miss → busca no PostgreSQL; se vazio/stale, fan-out nos adapters `enabled`
5. Matching/normalização e persistência
6. Resposta paginada com `is_demo` quando aplicável

## Comparação

1. `GET /products/{id}` + `GET /products/{id}/offers`
2. Ordenação por `total_price` (preço + frete quando disponível)
3. Melhor oferta marcada no DTO e destacada no UI

## Histórico

1. `GET /products/{id}/price-history?period=7d|30d|90d|1y`
2. Agregações: min, max, média no período
3. Gráfico Recharts no frontend

## Alertas (preparado)

1. Usuário cria alerta com preço alvo
2. Worker avalia após refresh
3. `EmailPort` registra/envia notificação (console em desenvolvimento)
