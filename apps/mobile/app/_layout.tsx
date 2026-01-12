import { Stack } from 'expo-router'
import { Auth0Provider } from 'react-native-auth0'
import Constants from 'expo-constants'

const auth0Domain = Constants.expoConfig?.extra?.auth0Domain
const auth0ClientId = Constants.expoConfig?.extra?.auth0ClientId

export default function RootLayout() {
  if (!auth0Domain || !auth0ClientId) {
    throw new Error('Auth0 configuration missing in app.config.js')
  }

  return (
    <Auth0Provider domain={auth0Domain} clientId={auth0ClientId}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
      </Stack>
    </Auth0Provider>
  )
}
