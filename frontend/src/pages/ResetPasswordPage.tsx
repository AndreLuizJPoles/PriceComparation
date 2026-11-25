import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { resetPasswordSchema, type ResetPasswordFormValues } from '@/schemas/auth'
import { resetPassword } from '@/services/auth'
import { ApiClientError, NetworkError } from '@/types/api'
import { AuthShell } from '@/pages/LoginPage'

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [success, setSuccess] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
  })

  const onSubmit = handleSubmit(async (values) => {
    if (!token) {
      setFormError('Token inválido ou ausente. Solicite um novo link.')
      return
    }
    setFormError(null)
    try {
      await resetPassword(token, values.password)
      setSuccess(true)
    } catch (error) {
      if (error instanceof NetworkError || error instanceof ApiClientError) {
        setFormError(error.message)
        return
      }
      setFormError('Não foi possível redefinir a senha.')
    }
  })

  const inputClass =
    'mt-1 w-full rounded-lg border border-surface-200 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100'

  return (
    <AuthShell
      title="Nova senha"
      subtitle="Defina uma senha forte com pelo menos 8 caracteres."
      footer={
        success ? (
          <p className="text-center text-sm text-surface-700">
            <Link to="/login" className="font-medium text-brand-700 hover:underline">
              Ir para o login
            </Link>
          </p>
        ) : undefined
      }
    >
      {success ? (
        <p className="text-sm text-surface-700">Senha atualizada com sucesso.</p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          {!token && (
            <p role="alert" className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Token não encontrado na URL. Use o link completo enviado por e-mail.
            </p>
          )}
          {formError && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {formError}
            </p>
          )}
          <label className="block text-sm font-medium text-surface-800">
            Nova senha
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
            {isSubmitting ? 'Salvando…' : 'Redefinir senha'}
          </button>
        </form>
      )}
    </AuthShell>
  )
}