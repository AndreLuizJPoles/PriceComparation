import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center">
      <p className="text-6xl font-bold text-brand-600">404</p>
      <h1 className="mt-4 text-2xl font-semibold text-surface-900">Página não encontrada</h1>
      <p className="mt-2 text-sm text-surface-700">
        O endereço pode estar incorreto ou o conteúdo foi removido.
      </p>
      <Link
        to="/"
        className="mt-8 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
      >
        Voltar ao início
      </Link>
    </div>
  )
}