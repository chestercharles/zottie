import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '@/features/auth'

export function HomeScreen() {
  const { user, signOut } = useAuth()
  const router = useRouter()

  return (
    <View style={styles.container}>
      <Text style={styles.welcome}>Welcome, {user?.name || user?.email}!</Text>
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => router.push('/pantry')}
      >
        <Text style={styles.primaryButtonText}>View Pantry</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
        <Text style={styles.signOutButtonText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  welcome: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: '#2ECC71',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  signOutButton: {
    backgroundColor: '#E74C3C',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  signOutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})
