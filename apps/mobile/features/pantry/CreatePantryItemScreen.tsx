import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { useState } from 'react'
import { useAuth0 } from 'react-native-auth0'
import { useAuth } from '@/features/auth'
import { createPantryItem } from './api'
import type { PantryItemStatus } from './types'
import { useRouter } from 'expo-router'

export function CreatePantryItemScreen() {
  const { user } = useAuth()
  const { getCredentials } = useAuth0()
  const router = useRouter()
  const [name, setName] = useState('')
  const [status, setStatus] = useState<PantryItemStatus>('in_stock')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Please enter an item name')
      return
    }

    if (!user?.id) {
      setError('Not authenticated')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const credentials = await getCredentials()
      if (!credentials?.accessToken) {
        throw new Error('No access token available')
      }

      await createPantryItem(
        { name: name.trim(), status },
        credentials.accessToken,
        user.id
      )

      Alert.alert('Success', 'Pantry item created successfully', [
        { text: 'OK', onPress: () => router.back() },
      ])
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to create pantry item'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const statusOptions: { label: string; value: PantryItemStatus }[] = [
    { label: 'In Stock', value: 'in_stock' },
    { label: 'Running Low', value: 'running_low' },
    { label: 'Out of Stock', value: 'out_of_stock' },
  ]

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Item Name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="e.g. Milk, Eggs, Bread"
        editable={!isLoading}
        autoFocus
      />

      <Text style={styles.label}>Status</Text>
      <View style={styles.statusContainer}>
        {statusOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.statusButton,
              status === option.value && styles.statusButtonActive,
            ]}
            onPress={() => setStatus(option.value)}
            disabled={isLoading}
          >
            <Text
              style={[
                styles.statusButtonText,
                status === option.value && styles.statusButtonTextActive,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleCreate}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Add to Pantry</Text>
        )}
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 24,
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  statusButtonActive: {
    backgroundColor: '#3498DB',
    borderColor: '#3498DB',
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  statusButtonTextActive: {
    color: '#fff',
  },
  button: {
    backgroundColor: '#27AE60',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#FADBD8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  errorText: {
    color: '#C0392B',
    fontSize: 14,
  },
})
