import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SearchBar } from '@/components/SearchBar'

describe('SearchBar', () => {
  it('submits search query to navigation', async () => {
    const user = userEvent.setup()
    const queryClient = new QueryClient()

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <SearchBar defaultQuery="" variant="compact" />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    const input = screen.getByRole('searchbox')
    await user.type(input, 'notebook')
    await user.click(screen.getByRole('button', { name: 'Buscar' }))

    expect(input).toHaveValue('notebook')
  })
})