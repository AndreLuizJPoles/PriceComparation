import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { registerSchema, type RegisterFormValues } from '@/schemas/auth'
import { useAuth } from '@/contexts/AuthContext'
import { ApiClientError, NetworkError } from '@/types/api'
import { AuthShell } from '@/pages/LoginPage'

export function RegisterPage() {
  const navigate = useNavigate()
  const { register: registerAccount } = useAuth()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      await registerAccount({
        name: values.name,
        email: values.email,
        password: values.password,
      })
      void navigate('/', { replace: true })
    } catch (error) {
      if (error instanceof NetworkError || error instanceof ApiClientError) {
        setFormError(error.message)
        return
      }
      setFormError('Não foi possível criar a conta.')
    }
  })

  const inputClass =
    'mt-1 w-full rounded-lg border border-surface-200 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100'

  return (
    <AuthShell
      title="Criar conta"
      subtitle="Compare preços e salve seus produtos favoritos."
      footer={
        <p className="text-center text-sm text-surface-700">
          Já tem conta?{' '}
          <Link to="/login" className="font-medium text-brand-700 hover:underline">
            Entrar
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
        <label className="block text-sm font-medium text-surface-800">
          Nome
          <input type="text" autoComplete="name" className={inputClass} {...register('name')} />
          {errors.name && <span className="mt-1 block text-xs text-red-600">{errors.name.message}</span>}
        </label>
        <label className="block text-sm font-medium text-surface-800">
          E-mail
          <input type="email" autoComplete="email" className={inputClass} {...register('email')} />
          {errors.email && (
            <span className="mt-1 block text-xs text-red-600">{errors.email.message}</span>
          )}
        </label>
        <label className="block text-sm font-medium text-surface-800">
          Senha
          <input
            type="password"
            autoComplete="new-password"
            className={inputClass}
            {...register('password')}
          />
          {errors.password && (
            <span className="mt-1 block text-xs text-red-600">{errors.password.message}</span>
          )}
        </label>
        <label className="block text-sm font-medium text-surface-800">
          Confirmar senha
          <input
            type="password"
            autoComplete="new-password"
            className={inputClass}
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <span className="mt-1 block text-xs text-red-600">{errors.confirmPassword.message}</span>
          )}
        </label>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-brand-600 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {isSubmitting ? 'Criando…' : 'Criar conta'}
        </button>
      </form>
    </AuthShell>
  )
}