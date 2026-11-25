import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ProductCard } from '@/components/ProductCard'
import type { ProductSummary } from '@/types/api'

const product: ProductSummary = {
  id: 'prod-1',
  name: 'Notebook Demo',
  brand: 'Marca X',
  model: '15',
  category: 'Informática',
  description: null,
  image_url: null,
  best_price: 2499.9,
  min_total_price: 2499.9,
  offer_count: 3,
  is_demo: true,
}

describe('ProductCard', () => {
  it('renders product name and formatted price', () => {
    render(
      <MemoryRouter>
        <ProductCard product={product} />
      </MemoryRouter>,
    )

    expect(screen.getByRole('article')).toBeInTheDocument()
    expect(screen.getByText('Notebook Demo')).toBeInTheDocument()
    expect(screen.getByText(/R\$\s*2\.499,90/)).toBeInTheDocument()
    expect(screen.getByText('3 ofertas')).toBeInTheDocument()
  })
})