import { View, ActivityIndicator } from 'react-native'
import { useState } from 'react'
import * as Application from 'expo-application'
import { useAuth } from '@/features/auth'
import { Text, Button } from '@/components'
import { useTheme } from '@/lib/theme'

export function LandingScreen() {
  const { signUp, signIn } = useAuth()
  const { colors, spacing } = useTheme()
  const [isLoading, setIsLoading] = useState(false)

  const handleSignUp = async () => {
    try {
      setIsLoading(true)
      await signUp()
    } catch (error) {
      console.error('Sign up failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignIn = async () => {
    try {
      setIsLoading(true)
      await signIn()
    } catch (error) {
      console.error('Sign in failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.surface.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.action.primary} />
      </View>
    )
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.surface.background,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing['2xl'],
      }}
    >
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text variant="title.large" style={{ marginBottom: spacing.md }}>
          zottie
        </Text>
        <Text
          variant="body.primary"
          color="secondary"
          style={{ textAlign: 'center', maxWidth: 300 }}
        >
          Coordinate grocery lists, manage your kitchen inventory, and
          efficiently meal prep.
        </Text>
        <Text
          variant="caption"
          color="tertiary"
          style={{ marginTop: spacing.md }}
        >
          {Application.applicationId}
        </Text>
      </View>

      <View style={{ gap: spacing.sm }}>
        <Button title="Sign Up" onPress={handleSignUp} />
        <Button title="Sign In" variant="secondary" onPress={handleSignIn} />
      </View>
    </View>
  )
}
