import { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native'
import { useAuth } from '@/features/auth'
import { queryClient } from '@/lib/query/client'

export function SettingsScreen() {
  const { user, signOut } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            setIsLoggingOut(true)
            queryClient.clear()
            await signOut()
          },
        },
      ]
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.accountSection}>
          <Text style={styles.sectionTitle}>Account</Text>
          {user?.email && (
            <Text style={styles.emailText}>{user.email}</Text>
          )}
        </View>

        <View style={styles.placeholder}>
          <Text style={styles.subtext}>Household settings coming soon</Text>
        </View>
      </View>

      <View style={styles.footer}>
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
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  accountSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  emailText: {
    fontSize: 16,
    color: '#333',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  footer: {
    padding: 24,
    paddingBottom: 40,
  },
  logoutButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E74C3C',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#E74C3C',
    fontSize: 16,
    fontWeight: '600',
  },
})
