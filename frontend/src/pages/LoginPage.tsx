import { useState, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginFormValues } from '@/schemas/auth'
import { useAuth } from '@/contexts/AuthContext'
import { ApiClientError, NetworkError } from '@/types/api'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [formError, setFormError] = useState<string | null>(null)

  const from = (location.state as { from?: string } | null)?.from ?? '/'

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      await login(values)
      void navigate(from, { replace: true })
    } catch (error) {
      if (error instanceof NetworkError || error instanceof ApiClientError) {
        setFormError(error.message)
        return
      }
      setFormError('Não foi possível entrar. Tente novamente.')
    }
  })

  return (
    <AuthShell
      title="Entrar"
      subtitle="Acesse favoritos, alertas e histórico personalizado."
      footer={
        <p className="text-center text-sm text-surface-700">
          Ainda não tem conta?{' '}
          <Link to="/register" className="font-medium text-brand-700 hover:underline">
            Criar conta
          </Link>
        </p>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {formError && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {formError}
          </p>
        )}
        <Field label="E-mail" error={errors.email?.message}>
          <input
            type="email"
            autoComplete="email"
            className={inputClass}
            {...register('email')}
          />
        </Field>
        <Field label="Senha" error={errors.password?.message}>
          <input
            type="password"
            autoComplete="current-password"
            className={inputClass}
            {...register('password')}
          />
        </Field>
        <div className="text-right">
          <Link to="/forgot-password" className="text-sm text-brand-700 hover:underline">
            Esqueci a senha
          </Link>
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-brand-600 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {isSubmitting ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </AuthShell>
  )
}

const inputClass =
  'mt-1 w-full rounded-lg border border-surface-200 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100'

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col px-4 py-12">
      <h1 className="text-2xl font-bold text-surface-900">{title}</h1>
      <p className="mt-2 text-sm text-surface-700">{subtitle}</p>
      <div className="mt-8 rounded-2xl border border-surface-200 bg-white p-6 shadow-sm">{children}</div>
      {footer && <div className="mt-6">{footer}</div>}
    </div>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: ReactNode
}) {
  return (
    <label className="block text-sm font-medium text-surface-800">
      {label}
      {children}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  )
}