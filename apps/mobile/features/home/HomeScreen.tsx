import { View } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '@/features/auth'
import { Text, Button } from '@/components'
import { useTheme } from '@/lib/theme'

export function HomeScreen() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const { colors, spacing } = useTheme()

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
        backgroundColor: colors.surface.background,
      }}
    >
      <Text
        variant="title.medium"
        style={{ marginBottom: spacing.lg, textAlign: 'center' }}
      >
        Welcome, {user?.name || user?.email}!
      </Text>
      <View style={{ gap: spacing.sm, width: '100%', maxWidth: 300 }}>
        <Button title="View Pantry" onPress={() => router.push('/pantry')} />
        <Button title="Sign Out" variant="secondary" onPress={signOut} />
      </View>
    </View>
  )
}
