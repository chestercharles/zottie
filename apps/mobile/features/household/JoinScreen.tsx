import { useEffect, useState } from 'react'
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '@/features/auth'
import {
  useValidateInvite,
  useJoinHousehold,
  useHousehold,
  usePendingInvite,
} from './hooks'
import { useLocalSearchParams, useRouter } from 'expo-router'

export function JoinScreen() {
  const { code } = useLocalSearchParams<{ code: string }>()
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
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3498DB" />
      </View>
    )
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Ionicons name="home-outline" size={64} color="#3498DB" />
          <Text style={styles.title}>Join a Household</Text>
          <Text style={styles.message}>
            Sign in or create an account to join this household.
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleSignIn}>
            <Text style={styles.primaryButtonText}>Sign In to Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  if (isValidating || isLoadingHousehold) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3498DB" />
        <Text style={styles.loadingText}>Validating invite...</Text>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Ionicons name="alert-circle-outline" size={64} color="#E74C3C" />
          <Text style={styles.title}>Invalid Invite</Text>
          <Text style={styles.errorMessage}>
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
        <View style={styles.container}>
          <View style={styles.content}>
            <Ionicons name="checkmark-circle" size={64} color="#27AE60" />
            <Text style={styles.title}>You're Already a Member</Text>
            <Text style={styles.householdName}>{invite.householdName}</Text>
            <Text style={styles.message}>
              You're already part of this household.
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleCancel}
            >
              <Text style={styles.primaryButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      )
    }

    if (hasExistingHousehold) {
      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <Ionicons name="swap-horizontal" size={64} color="#F39C12" />
            <Text style={styles.title}>Switch Households?</Text>
            <Text style={styles.householdName}>{invite.householdName}</Text>
            <Text style={styles.warningMessage}>
              You're currently in "{currentHousehold?.name}". Joining this
              household will remove you from your current one.
            </Text>
          </View>

          <View style={styles.infoContainer}>
            <Ionicons name="time-outline" size={16} color="#7F8C8D" />
            <Text style={styles.expiryText}>
              Expires {new Date(invite.expiresAt).toLocaleDateString()}
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.primaryButton,
                styles.warningButton,
                isJoining && styles.disabledButton,
              ]}
              onPress={handleSwitchHousehold}
              disabled={isJoining}
            >
              {isJoining ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Switch Households</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleCancel}
              disabled={isJoining}
            >
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )
    }

    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Ionicons name="home" size={64} color="#27AE60" />
          <Text style={styles.title}>You're Invited!</Text>
          <Text style={styles.householdName}>{invite.householdName}</Text>
          <Text style={styles.message}>
            You've been invited to join this household.
          </Text>
        </View>

        <View style={styles.infoContainer}>
          <Ionicons name="time-outline" size={16} color="#7F8C8D" />
          <Text style={styles.expiryText}>
            Expires {new Date(invite.expiresAt).toLocaleDateString()}
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.primaryButton, isJoining && styles.disabledButton]}
            onPress={handleJoinHousehold}
            disabled={isJoining}
          >
            {isJoining ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Join Household</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return null
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    gap: 16,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginTop: 16,
  },
  householdName: {
    fontSize: 28,
    fontWeight: '600',
    color: '#3498DB',
  },
  message: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },
  errorMessage: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },
  warningMessage: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },
  loadingText: {
    fontSize: 16,
    color: '#7F8C8D',
  },
  buttonContainer: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#3498DB',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  warningButton: {
    backgroundColor: '#F39C12',
  },
  secondaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BDC3C7',
  },
  disabledButton: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#7F8C8D',
    fontSize: 18,
    fontWeight: '600',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingBottom: 24,
  },
  expiryText: {
    fontSize: 14,
    color: '#7F8C8D',
  },
})
