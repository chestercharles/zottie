import { useState, useEffect } from 'react'
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Alert,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useCreateHouseholdInvite } from '@/features/household'

interface NewHouseholdInvitationScreenProps {
  onContinue: () => void
  onSkip: () => void
}

export function NewHouseholdInvitationScreen({
  onContinue,
  onSkip,
}: NewHouseholdInvitationScreenProps) {
  const insets = useSafeAreaInsets()
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
    <View style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="people" size={64} color="#3498DB" />
        <Text style={styles.title}>Invite your household</Text>
        <Text style={styles.subtitle}>
          Share your grocery lists and coordinate shopping together. You can
          invite your partner, roommate, or anyone you share a kitchen with.
        </Text>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3498DB" />
            <Text style={styles.loadingText}>Creating your invite link...</Text>
          </View>
        ) : (
          <View style={styles.inviteContainer}>
            <Text style={styles.inviteLabel}>Your invite code:</Text>
            <View style={styles.codeContainer}>
              <Text style={styles.codeText}>{inviteCode}</Text>
            </View>
            <Text style={styles.hint}>
              Tap "Share invite" to send this link to someone you'd like to add
              to your household.
            </Text>
          </View>
        )}
      </View>

      <View
        style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}
      >
        <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.continueButton,
            isLoading && styles.disabledButton,
          ]}
          onPress={handleShare}
          disabled={isLoading}
        >
          <Text style={styles.continueButtonText}>Share invite</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
    paddingTop: 60,
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#7F8C8D',
    lineHeight: 24,
  },
  loadingContainer: {
    marginTop: 32,
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#7F8C8D',
  },
  inviteContainer: {
    marginTop: 24,
    gap: 12,
  },
  inviteLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  codeContainer: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  codeText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3498DB',
    letterSpacing: 2,
  },
  hint: {
    fontSize: 14,
    color: '#95A5A6',
    fontStyle: 'italic',
    lineHeight: 20,
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 24,
  },
  skipButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#7F8C8D',
    fontSize: 16,
    fontWeight: '600',
  },
  continueButton: {
    flex: 2,
    backgroundColor: '#3498DB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})
