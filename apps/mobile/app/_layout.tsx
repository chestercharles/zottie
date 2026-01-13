import { Stack } from 'expo-router'
import { Auth0Provider } from 'react-native-auth0'
import { QueryClientProvider } from '@tanstack/react-query'
import Constants from 'expo-constants'
import { queryClient } from '../lib/query'

const auth0Domain = Constants.expoConfig?.extra?.auth0Domain
const auth0ClientId = Constants.expoConfig?.extra?.auth0ClientId
const auth0Audience = Constants.expoConfig?.extra?.auth0Audience

export default function RootLayout() {
  if (!auth0ClientId) {
    throw new Error('Auth0 client ID missing in app.config.js')
  }

  if (!auth0Domain) {
    throw new Error('Auth0 domain missing in app.config.js')
  }

  if (!auth0Audience) {
    throw new Error('Auth0 audience missing in app.config.js')
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Auth0Provider domain={auth0Domain} clientId={auth0ClientId}>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(authenticated)" options={{ headerShown: false }} />
          <Stack.Screen
            name="onboarding"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="join/[code]"
            options={{
              headerShown: true,
              title: 'Join Household',
              headerBackTitle: 'Back',
            }}
          />
        </Stack>
      </Auth0Provider>
    </QueryClientProvider>
  )
}
