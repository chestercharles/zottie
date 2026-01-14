import { useState } from 'react'
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
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

interface OnboardingScreenProps {
  onSuccess: () => void
}

export function OnboardingScreen({ onSuccess }: OnboardingScreenProps) {
  const [householdName, setHouseholdName] = useState('')
  const createMutation = useCreateHousehold()
  const [isCreating, setIsCreating] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const { signOut } = useAuth()
  const insets = useSafeAreaInsets()

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
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Ionicons name="home" size={64} color="#3498DB" />
        <Text style={styles.title}>Welcome to zottie</Text>
        <Text style={styles.subtitle}>
          Create a household to start managing your pantry and shopping list.
        </Text>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.label}>Household Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Smith Family, My Apartment"
          placeholderTextColor="#BDC3C7"
          value={householdName}
          onChangeText={setHouseholdName}
          autoFocus
          autoCapitalize="words"
          returnKeyType="done"
          onSubmitEditing={handleCreateHousehold}
          editable={!isCreating}
        />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.primaryButton,
            isButtonDisabled && styles.disabledButton,
          ]}
          onPress={handleCreateHousehold}
          disabled={isButtonDisabled}
        >
          {isCreating ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>Create Household</Text>
          )}
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.joinSection}>
          <Ionicons name="link-outline" size={24} color="#7F8C8D" />
          <Text style={styles.joinTitle}>Join an Existing Household</Text>
          <Text style={styles.joinMessage}>
            Ask someone in the household to send you an invite link. Open the
            link to join their household.
          </Text>
        </View>
      </View>

      <View
        style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) }]}
      >
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={isLoggingOut}
        >
          <Text style={styles.logoutButtonText}>
            {isLoggingOut ? 'Logging out...' : 'Log Out'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingTop: 48,
  },
  content: {
    alignItems: 'center',
    gap: 12,
    marginBottom: 32,
    marginTop: 48,
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
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },
  formContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#2C3E50',
  },
  buttonContainer: {
    gap: 16,
  },
  primaryButton: {
    backgroundColor: '#3498DB',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    color: '#7F8C8D',
    fontSize: 14,
    marginHorizontal: 16,
  },
  joinSection: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    gap: 8,
  },
  joinTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  joinMessage: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 24,
  },
  logoutButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E74C3C',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#E74C3C',
    fontSize: 16,
    fontWeight: '600',
  },
})
