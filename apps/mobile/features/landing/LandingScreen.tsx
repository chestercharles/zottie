import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { useState } from 'react'
import * as Application from 'expo-application'
import { useAuth } from '@/features/auth'

export function LandingScreen() {
  const { signUp, signIn } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const handleSignUp = async () => {
    try {
      setIsLoading(true)
      await signUp()
    } catch (error) {
      console.error('Sign up failed:', error)
      // TODO: Show error to user (toast/alert)
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
      // TODO: Show error to user (toast/alert)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498DB" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.logo}>zottie</Text>
        <Text style={styles.tagline}>
          Coordinate grocery lists, manage your kitchen inventory, and
          efficiently meal prep.
        </Text>
        <Text style={styles.bundleId}>{Application.applicationId}</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleSignUp}>
          <Text style={styles.primaryButtonText}>Sign Up</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={handleSignIn}>
          <Text style={styles.secondaryButtonText}>Sign In</Text>
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
    paddingVertical: 48,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 16,
  },
  tagline: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },
  bundleId: {
    fontSize: 12,
    color: '#BDC3C7',
    marginTop: 16,
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
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3498DB',
  },
  secondaryButtonText: {
    color: '#3498DB',
    fontSize: 18,
    fontWeight: '600',
  },
})
