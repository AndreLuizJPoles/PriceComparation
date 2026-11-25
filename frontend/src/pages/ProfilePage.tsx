import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { profileSchema, type ProfileFormValues } from '@/schemas/auth'
import { useAuth } from '@/contexts/AuthContext'
import { updateCurrentUser } from '@/services/users'
import { ApiClientError, NetworkError } from '@/types/api'
import { LoadingState } from '@/components/LoadingState'

export function ProfilePage() {
  const { user, reloadUser, isLoading, logout } = useAuth()
  const [message, setMessage] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    values: user ? { name: user.name, email: user.email } : undefined,
  })

  const updateMutation = useMutation({
    mutationFn: updateCurrentUser,
    onSuccess: async () => {
      await reloadUser()
      setMessage('Perfil atualizado.')
      setFormError(null)
    },
    onError: (error: unknown) => {
      if (error instanceof NetworkError || error instanceof ApiClientError) {
        setFormError(error.message)
        return
      }
      setFormError('Não foi possível salvar.')
    },
  })

  if (isLoading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12">
        <LoadingState />
      </div>
    )
  }

  if (!user) return null

  const onSubmit = handleSubmit(async (values) => {
    setMessage(null)
    await updateMutation.mutateAsync(values)
    reset(values)
  })

  const inputClass =
    'mt-1 w-full rounded-lg border border-surface-200 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100'

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-8">
      <h1 className="text-2xl font-bold text-surface-900">Meu perfil</h1>
      <p className="mt-2 text-sm text-surface-700">Conta ativa: {user.is_active ? 'Sim' : 'Não'}</p>

      <form
        onSubmit={onSubmit}
        className="mt-8 space-y-4 rounded-2xl border border-surface-200 bg-white p-6 shadow-sm"
      >
        {message && <p className="text-sm text-brand-700">{message}</p>}
        {formError && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {formError}
          </p>
        )}
        <label className="block text-sm font-medium text-surface-800">
          Nome
          <input type="text" className={inputClass} {...register('name')} />
          {errors.name && (
            <span className="mt-1 block text-xs text-red-600">{errors.name.message}</span>
          )}
        </label>
        <label className="block text-sm font-medium text-surface-800">
          E-mail
          <input type="email" className={inputClass} {...register('email')} />
          {errors.email && (
            <span className="mt-1 block text-xs text-red-600">{errors.email.message}</span>
          )}
        </label>
        <button
          type="submit"
          disabled={isSubmitting || updateMutation.isPending}
          className="w-full rounded-xl bg-brand-600 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          Salvar alterações
        </button>
      </form>

      <button
        type="button"
        onClick={() => void logout()}
        className="mt-6 text-sm text-red-700 hover:underline"
      >
        Sair da conta
      </button>
    </div>
  )
}