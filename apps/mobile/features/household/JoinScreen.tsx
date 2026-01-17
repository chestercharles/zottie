import { useEffect, useState } from 'react'
import { View, StyleSheet, ActivityIndicator, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '@/features/auth'
import {
  useValidateInvite,
  useJoinHousehold,
  useHousehold,
  usePendingInvite,
} from './hooks'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Text, Button } from '@/components'
import { useTheme } from '@/lib/theme'

export function JoinScreen() {
  const { code } = useLocalSearchParams<{ code: string }>()
  const { colors, spacing, radius } = useTheme()
  const { storePendingInvite, clearPendingInvite } = usePendingInvite()
  const { signIn, isAuthenticated, isLoading: isAuthLoading } = useAuth()

  const router = useRouter()
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated && code) {
      storePendingInvite(code)
    }
  }, [isAuthLoading, isAuthenticated, code, storePendingInvite])

  const {
    invite,
    isLoading: isValidating,
    error,
  } = useValidateInvite(isAuthenticated ? code : null)
  const { household: currentHousehold, isLoading: isLoadingHousehold } =
    useHousehold()
  const joinMutation = useJoinHousehold()
  const [isJoining, setIsJoining] = useState(false)

  const isAlreadyMember =
    currentHousehold && invite && currentHousehold.id === invite.householdId
  const hasExistingHousehold =
    currentHousehold && invite && currentHousehold.id !== invite.householdId

  const handleJoinHousehold = async () => {
    setIsJoining(true)
    try {
      const response = await joinMutation.mutateAsync({ code })
      if (response.alreadyMember) {
        Alert.alert("You're already a member of this household!")
      }
      await clearPendingInvite()
      router.replace('/(authenticated)/pantry')
    } catch (err) {
      Alert.alert(
        'Unable to Join',
        err instanceof Error ? err.message : 'Failed to join household'
      )
    } finally {
      setIsJoining(false)
    }
  }

  const handleSwitchHousehold = () => {
    Alert.alert(
      'Switch Households?',
      `You will leave "${currentHousehold?.name}" and join "${invite?.householdName}".`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Switch', style: 'destructive', onPress: handleJoinHousehold },
      ]
    )
  }

  const handleSignIn = async () => {
    try {
      await signIn()
    } catch (error) {
      console.error('Sign in failed:', error)
    }
  }

  const handleCancel = () => {
    console.log('handleCancel')
    if (router.canGoBack()) {
      router.back()
    } else {
      router.replace('/(authenticated)/pantry')
    }
  }

  if (isAuthLoading) {
    return (
      <View
        style={[styles.centerContainer, { backgroundColor: colors.surface.background }]}
      >
        <ActivityIndicator size="large" color={colors.action.primary} />
      </View>
    )
  }

  if (!isAuthenticated) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.surface.background,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing['2xl'],
          },
        ]}
      >
        <View style={[styles.content, { gap: spacing.sm }]}>
          <Ionicons name="home-outline" size={64} color={colors.action.primary} />
          <Text variant="title.medium" style={{ marginTop: spacing.md }}>
            Join a Household
          </Text>
          <Text
            variant="body.primary"
            color="secondary"
            style={[styles.message, { maxWidth: 300 }]}
          >
            Sign in or create an account to join this household.
          </Text>
        </View>

        <View style={{ gap: spacing.sm }}>
          <Button title="Sign In to Continue" onPress={handleSignIn} />
        </View>
      </View>
    )
  }

  if (isValidating || isLoadingHousehold) {
    return (
      <View
        style={[
          styles.centerContainer,
          { backgroundColor: colors.surface.background, gap: spacing.md },
        ]}
      >
        <ActivityIndicator size="large" color={colors.action.primary} />
        <Text variant="body.primary" color="secondary">
          Validating invite...
        </Text>
      </View>
    )
  }

  if (error) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.surface.background,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing['2xl'],
          },
        ]}
      >
        <View style={[styles.content, { gap: spacing.sm }]}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.feedback.error} />
          <Text variant="title.medium" style={{ marginTop: spacing.md }}>
            Invalid Invite
          </Text>
          <Text
            variant="body.primary"
            color="secondary"
            style={[styles.message, { maxWidth: 300 }]}
          >
            This invite link is invalid or has expired. Please ask for a new
            invite link.
          </Text>
        </View>
      </View>
    )
  }

  if (invite) {
    if (isAlreadyMember) {
      return (
        <View
          style={[
            styles.container,
            {
              backgroundColor: colors.surface.background,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing['2xl'],
            },
          ]}
        >
          <View style={[styles.content, { gap: spacing.sm }]}>
            <Ionicons name="checkmark-circle" size={64} color={colors.feedback.success} />
            <Text variant="title.medium" style={{ marginTop: spacing.md }}>
              You're Already a Member
            </Text>
            <Text
              variant="title.large"
              style={{ color: colors.action.primary }}
            >
              {invite.householdName}
            </Text>
            <Text
              variant="body.primary"
              color="secondary"
              style={[styles.message, { maxWidth: 300 }]}
            >
              You're already part of this household.
            </Text>
          </View>

          <View style={{ gap: spacing.sm }}>
            <Button title="Go Back" onPress={handleCancel} />
          </View>
        </View>
      )
    }

    if (hasExistingHousehold) {
      return (
        <View
          style={[
            styles.container,
            {
              backgroundColor: colors.surface.background,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing['2xl'],
            },
          ]}
        >
          <View style={[styles.content, { gap: spacing.sm }]}>
            <Ionicons name="swap-horizontal" size={64} color={colors.feedback.warning} />
            <Text variant="title.medium" style={{ marginTop: spacing.md }}>
              Switch Households?
            </Text>
            <Text
              variant="title.large"
              style={{ color: colors.action.primary }}
            >
              {invite.householdName}
            </Text>
            <Text
              variant="body.primary"
              color="secondary"
              style={[styles.message, { maxWidth: 300 }]}
            >
              You're currently in "{currentHousehold?.name}". Joining this
              household will remove you from your current one.
            </Text>
          </View>

          <View
            style={[
              styles.infoContainer,
              { gap: spacing.xs, paddingBottom: spacing.lg },
            ]}
          >
            <Ionicons name="time-outline" size={16} color={colors.text.secondary} />
            <Text variant="body.secondary" color="secondary">
              Expires {new Date(invite.expiresAt).toLocaleDateString()}
            </Text>
          </View>

          <View style={{ gap: spacing.sm }}>
            <Button
              title={isJoining ? 'Switching...' : 'Switch Households'}
              onPress={handleSwitchHousehold}
              disabled={isJoining}
              style={{ backgroundColor: colors.feedback.warning }}
            />
            <Button
              variant="secondary"
              title="Cancel"
              onPress={handleCancel}
              disabled={isJoining}
              style={{
                borderWidth: 1,
                borderColor: colors.border.subtle,
                borderRadius: radius.md,
              }}
            />
          </View>
        </View>
      )
    }

    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.surface.background,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing['2xl'],
          },
        ]}
      >
        <View style={[styles.content, { gap: spacing.sm }]}>
          <Ionicons name="home" size={64} color={colors.feedback.success} />
          <Text variant="title.medium" style={{ marginTop: spacing.md }}>
            You're Invited!
          </Text>
          <Text
            variant="title.large"
            style={{ color: colors.action.primary }}
          >
            {invite.householdName}
          </Text>
          <Text
            variant="body.primary"
            color="secondary"
            style={[styles.message, { maxWidth: 300 }]}
          >
            You've been invited to join this household.
          </Text>
        </View>

        <View
          style={[
            styles.infoContainer,
            { gap: spacing.xs, paddingBottom: spacing.lg },
          ]}
        >
          <Ionicons name="time-outline" size={16} color={colors.text.secondary} />
          <Text variant="body.secondary" color="secondary">
            Expires {new Date(invite.expiresAt).toLocaleDateString()}
          </Text>
        </View>

        <View style={{ gap: spacing.sm }}>
          <Button
            title={isJoining ? 'Joining...' : 'Join Household'}
            onPress={handleJoinHousehold}
            disabled={isJoining}
          />
        </View>
      </View>
    )
  }

  return null
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    textAlign: 'center',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
