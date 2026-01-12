import { useMutation } from '@tanstack/react-query'
import { useAuth0 } from 'react-native-auth0'
import { createHouseholdInvite } from '../api'
import { useAuth } from '@/features/auth'

export function useCreateHouseholdInvite() {
  const { user } = useAuth()
  const { getCredentials } = useAuth0()

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated')
      const credentials = await getCredentials()
      if (!credentials?.accessToken) throw new Error('No access token')
      return createHouseholdInvite(credentials.accessToken, user.id)
    },
  })
}
