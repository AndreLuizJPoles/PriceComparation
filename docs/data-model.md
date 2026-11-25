# Modelo de dados

## Entidades

| Tabela | Descrição |
|--------|-----------|
| `users` | Contas autenticadas |
| `refresh_tokens` | Refresh JWT rotacionados |
| `products` | Produto canônico interno |
| `product_identifiers` | EAN/GTIN/SKU e similares |
| `stores` | Lojas confiáveis (inclui flag demo) |
| `store_products` | Oferta de um produto em uma loja |
| `price_offers` | Preço atual observado |
| `price_history` | Série histórica |
| `favorites` | Favoritos do usuário |
| `price_alerts` | Alerta de preço alvo |
| `search_history` | Histórico de buscas autenticadas |

## Dinheiro

Todos os valores monetários usam `Numeric(12, 2)`. Nunca `float`.

## Matching

1. Identificador externo exato (EAN/GTIN/SKU)
2. Marca + modelo normalizados
3. Similaridade de nome com limiar alto (≥ 0.92)

Abaixo do limiar, produtos permanecem separados.
