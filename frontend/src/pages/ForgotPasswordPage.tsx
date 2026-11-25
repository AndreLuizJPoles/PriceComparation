import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '@/schemas/auth'
import { forgotPassword } from '@/services/auth'
import { ApiClientError, NetworkError } from '@/types/api'
import { AuthShell } from '@/pages/LoginPage'

export function ForgotPasswordPage() {
  const [success, setSuccess] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      await forgotPassword(values.email)
      setSuccess(true)
    } catch (error) {
      if (error instanceof NetworkError || error instanceof ApiClientError) {
        setFormError(error.message)
        return
      }
      setFormError('Não foi possível enviar o e-mail de recuperação.')
    }
  })

  const inputClass =
    'mt-1 w-full rounded-lg border border-surface-200 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100'

  return (
    <AuthShell
      title="Recuperar senha"
      subtitle="Enviaremos um link para redefinir sua senha (em dev, o token pode aparecer nos logs do backend)."
      footer={
        <p className="text-center text-sm text-surface-700">
          <Link to="/login" className="font-medium text-brand-700 hover:underline">
            Voltar ao login
          </Link>
        </p>
      }
    >
      {success ? (
        <p className="text-sm text-surface-700">
          Se o e-mail estiver cadastrado, você receberá instruções em instantes.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          {formError && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {formError}
            </p>
          )}
          <label className="block text-sm font-medium text-surface-800">
            E-mail
            <input type="email" autoComplete="email" className={inputClass} {...register('email')} />
            {errors.email && (
              <span className="mt-1 block text-xs text-red-600">{errors.email.message}</span>
            )}
          </label>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-brand-600 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {isSubmitting ? 'Enviando…' : 'Enviar link'}
          </button>
        </form>
      )}
    </AuthShell>
  )
}