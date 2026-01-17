import { useState, useEffect } from 'react'
import { View, StyleSheet, ActivityIndicator, Share, Alert } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useCreateHouseholdInvite } from '@/features/household'
import { Text, Button } from '@/components'
import { useTheme } from '@/lib/theme'

interface NewHouseholdInvitationScreenProps {
  onContinue: () => void
  onSkip: () => void
}

export function NewHouseholdInvitationScreen({
  onContinue,
  onSkip,
}: NewHouseholdInvitationScreenProps) {
  const insets = useSafeAreaInsets()
  const { colors, spacing, radius, typography } = useTheme()
  const createInvite = useCreateHouseholdInvite()
  const [inviteCode, setInviteCode] = useState<string | null>(null)

  useEffect(() => {
    createInvite.mutate(undefined, {
      onSuccess: (invite) => {
        setInviteCode(invite.code)
      },
      onError: (error) => {
        console.error('Failed to create invite:', error)
        Alert.alert(
          'Unable to create invite',
          'There was a problem generating your invite link. You can skip this step and invite someone later from settings.',
          [{ text: 'OK' }]
        )
      },
    })
  }, [])

  const handleShare = async () => {
    if (!inviteCode) return

    const inviteUrl = `zottie://invite/${inviteCode}`
    const message = `Join my household on zottie! Use this link: ${inviteUrl}`

    try {
      await Share.share({
        message,
        url: inviteUrl,
      })
      onContinue()
    } catch (error) {
      console.error('Error sharing invite:', error)
    }
  }

  const isLoading = createInvite.isPending || !inviteCode

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface.background,
          paddingHorizontal: spacing.lg,
        },
      ]}
    >
      <View style={[styles.content, { gap: spacing.md }]}>
        <Ionicons name="people" size={64} color={colors.action.primary} />
        <Text variant="title.large" style={{ marginTop: spacing.md }}>
          Invite your household
        </Text>
        <Text variant="body.primary" color="secondary">
          Share your grocery lists and coordinate shopping together. You can
          invite your partner, roommate, or anyone you share a kitchen with.
        </Text>

        {isLoading ? (
          <View
            style={[
              styles.loadingContainer,
              { marginTop: spacing.xl, gap: spacing.md },
            ]}
          >
            <ActivityIndicator size="large" color={colors.action.primary} />
            <Text variant="body.primary" color="secondary">
              Creating your invite link...
            </Text>
          </View>
        ) : (
          <View style={{ marginTop: spacing.lg }}>
            <Text
              variant="body.primary"
              style={{ fontWeight: '600', marginBottom: spacing.sm }}
            >
              Your invite code:
            </Text>
            <View
              style={[
                styles.codeContainer,
                {
                  backgroundColor: colors.surface.grouped,
                  borderColor: colors.border.subtle,
                  borderRadius: radius.lg,
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.md,
                },
              ]}
            >
              <Text
                style={[
                  styles.codeText,
                  {
                    color: colors.action.primary,
                    fontSize: typography.title.medium.fontSize,
                  },
                ]}
              >
                {inviteCode}
              </Text>
            </View>
            <Text
              variant="body.secondary"
              color="tertiary"
              style={{ marginTop: spacing.sm }}
            >
              Tap "Share invite" to send this link to someone you'd like to add
              to your household.
            </Text>
          </View>
        )}
      </View>

      <View
        style={[
          styles.footer,
          {
            gap: spacing.sm,
            paddingTop: spacing.lg,
            paddingBottom: Math.max(insets.bottom, spacing.md),
          },
        ]}
      >
        <Button
          variant="secondary"
          title="Skip"
          onPress={onSkip}
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: colors.border.subtle,
            borderRadius: radius.md,
          }}
        />
        <Button
          title="Share invite"
          onPress={handleShare}
          disabled={isLoading}
          style={{ flex: 2 }}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: 60,
  },
  loadingContainer: {
    alignItems: 'center',
  },
  codeContainer: {
    borderWidth: 1,
    alignItems: 'center',
  },
  codeText: {
    fontWeight: '700',
    letterSpacing: 2,
  },
  footer: {
    flexDirection: 'row',
  },
})
