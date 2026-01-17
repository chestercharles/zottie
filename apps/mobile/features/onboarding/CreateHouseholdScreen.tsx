import { useState } from 'react'
import {
  View,
  StyleSheet,
  TextInput as RNTextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useCreateHousehold } from '@/features/household/hooks'
import { useAuth } from '@/features/auth'
import { queryClient } from '@/lib/query/client'
import { Text, Button } from '@/components'
import { useTheme } from '@/lib/theme'

interface CreateHouseholdScreenProps {
  onSuccess: () => void
}

export function CreateHouseholdScreen({
  onSuccess,
}: CreateHouseholdScreenProps) {
  const [householdName, setHouseholdName] = useState('')
  const createMutation = useCreateHousehold()
  const [isCreating, setIsCreating] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const { signOut } = useAuth()
  const insets = useSafeAreaInsets()
  const { colors, spacing, radius, typography } = useTheme()

  const handleCreateHousehold = async () => {
    const trimmedName = householdName.trim()
    if (!trimmedName) {
      Alert.alert(
        'Household Name Required',
        'Please enter a name for your household.'
      )
      return
    }

    setIsCreating(true)
    try {
      await createMutation.mutateAsync({ name: trimmedName })
      onSuccess()
    } catch (err) {
      Alert.alert(
        'Unable to Create Household',
        err instanceof Error ? err.message : 'Failed to create household'
      )
    } finally {
      setIsCreating(false)
    }
  }

  const isButtonDisabled = isCreating || !householdName.trim()

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          setIsLoggingOut(true)
          queryClient.clear()
          await signOut()
          router.replace('/')
        },
      },
    ])
  }

  return (
    <KeyboardAvoidingView
      style={[
        styles.container,
        {
          backgroundColor: colors.surface.background,
          paddingHorizontal: spacing.lg,
          paddingTop: spacing['2xl'],
        },
      ]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View
        style={[
          styles.content,
          { gap: spacing.sm, marginBottom: spacing.xl, marginTop: spacing['2xl'] },
        ]}
      >
        <Ionicons name="home" size={64} color={colors.action.primary} />
        <Text variant="title.large" style={{ marginTop: spacing.md }}>
          Welcome to zottie
        </Text>
        <Text
          variant="body.primary"
          color="secondary"
          style={[styles.subtitle, { maxWidth: 300 }]}
        >
          Create a household to start managing your pantry and shopping list.
        </Text>
      </View>

      <View style={{ marginBottom: spacing.lg }}>
        <Text
          variant="body.secondary"
          style={{ fontWeight: '600', marginBottom: spacing.sm }}
        >
          Household Name
        </Text>
        <RNTextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.surface.grouped,
              borderColor: colors.border.subtle,
              borderRadius: radius.sm,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm + spacing.xs,
              fontSize: typography.body.primary.fontSize,
              color: colors.text.primary,
            },
          ]}
          placeholder="e.g., Smith Family, My Apartment"
          placeholderTextColor={colors.text.tertiary}
          value={householdName}
          onChangeText={setHouseholdName}
          autoFocus
          autoCapitalize="words"
          returnKeyType="done"
          onSubmitEditing={handleCreateHousehold}
          editable={!isCreating}
        />
      </View>

      <View style={{ gap: spacing.md }}>
        <Button
          title={isCreating ? 'Creating...' : 'Create Household'}
          onPress={handleCreateHousehold}
          disabled={isButtonDisabled}
        />

        <View style={[styles.divider, { marginVertical: spacing.sm }]}>
          <View
            style={[styles.dividerLine, { backgroundColor: colors.border.subtle }]}
          />
          <Text
            variant="body.secondary"
            color="secondary"
            style={{ marginHorizontal: spacing.md }}
          >
            or
          </Text>
          <View
            style={[styles.dividerLine, { backgroundColor: colors.border.subtle }]}
          />
        </View>

        <View
          style={[
            styles.joinSection,
            {
              padding: spacing.lg,
              backgroundColor: colors.surface.grouped,
              borderRadius: radius.lg,
              gap: spacing.sm,
            },
          ]}
        >
          <Ionicons
            name="link-outline"
            size={24}
            color={colors.text.secondary}
          />
          <Text variant="body.primary" style={{ fontWeight: '600' }}>
            Join an Existing Household
          </Text>
          <Text
            variant="body.secondary"
            color="secondary"
            style={styles.joinMessage}
          >
            Ask someone in the household to send you an invite link. Open the
            link to join their household.
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.footer,
          {
            paddingTop: spacing.lg,
            paddingBottom: Math.max(insets.bottom, spacing.lg),
          },
        ]}
      >
        <Button
          variant="secondary"
          title={isLoggingOut ? 'Logging out...' : 'Log Out'}
          onPress={handleLogout}
          disabled={isLoggingOut}
          style={{
            borderWidth: 1,
            borderColor: colors.feedback.error,
            borderRadius: radius.md,
          }}
        />
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    alignItems: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  joinSection: {
    alignItems: 'center',
  },
  joinMessage: {
    textAlign: 'center',
  },
  footer: {
    marginTop: 'auto',
  },
})
