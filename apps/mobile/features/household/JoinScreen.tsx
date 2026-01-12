import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '@/features/auth'
import { useValidateInvite } from './hooks'

interface JoinScreenProps {
  code: string
  onSignIn: () => void
}

export function JoinScreen({ code, onSignIn }: JoinScreenProps) {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth()
  const { invite, isLoading: isValidating, error } = useValidateInvite(
    isAuthenticated ? code : null
  )

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
          <TouchableOpacity style={styles.primaryButton} onPress={onSignIn}>
            <Text style={styles.primaryButtonText}>Sign In to Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  if (isValidating) {
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
  primaryButtonText: {
    color: '#fff',
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
