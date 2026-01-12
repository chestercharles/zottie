import { Stack, Redirect } from 'expo-router'
import { useAuth } from '@/features/auth'

export default function AuthenticatedLayout() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return null
  }

  if (!isAuthenticated) {
    return <Redirect href="/" />
  }

  return <Stack />
}
