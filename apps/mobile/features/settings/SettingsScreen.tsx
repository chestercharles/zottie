import { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
  Share,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Constants from 'expo-constants'
import { useAuth } from '@/features/auth'
import {
  useHousehold,
  useUpdateHousehold,
  useCreateHouseholdInvite,
} from '@/features/household'
import { queryClient } from '@/lib/query/client'

export function SettingsScreen() {
  const { user, signOut } = useAuth()
  const { household, isLoading: isLoadingHousehold } = useHousehold()
  const updateHouseholdMutation = useUpdateHousehold()
  const createInviteMutation = useCreateHouseholdInvite()

  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState('')

  const handleInvite = async () => {
    try {
      const invite = await createInviteMutation.mutateAsync()
      const scheme = Constants.expoConfig?.scheme ?? 'zottie'
      const inviteLink = `${scheme}://join/${invite.code}`
      const expiresDate = new Date(invite.expiresAt)
      const formattedDate = expiresDate.toLocaleDateString()

      await Share.share({
        message: `Join my household "${household?.name}" on Zottie!\n\n${inviteLink}\n\nThis link expires on ${formattedDate}.`,
      })
    } catch {
      Alert.alert('Error', 'Failed to create invite link')
    }
  }

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
        },
      },
    ])
  }

  const handleStartEditing = () => {
    setEditedName(household?.name ?? '')
    setIsEditingName(true)
  }

  const handleSaveName = async () => {
    if (!editedName.trim()) return
    try {
      await updateHouseholdMutation.mutateAsync({ name: editedName.trim() })
      setIsEditingName(false)
    } catch {
      Alert.alert('Error', 'Failed to update household name')
    }
  }

  const handleCancelEdit = () => {
    setIsEditingName(false)
    setEditedName('')
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.accountSection}>
          <Text style={styles.sectionTitle}>Account</Text>
          {user?.email && <Text style={styles.emailText}>{user.email}</Text>}
        </View>

        <View style={styles.householdSection}>
          <Text style={styles.sectionTitle}>Household</Text>
          {isLoadingHousehold ? (
            <ActivityIndicator size="small" color="#3498DB" />
          ) : isEditingName ? (
            <View style={styles.editContainer}>
              <TextInput
                style={styles.nameInput}
                value={editedName}
                onChangeText={setEditedName}
                placeholder="Household name"
                autoFocus
              />
              <View style={styles.editButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancelEdit}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSaveName}
                  disabled={
                    updateHouseholdMutation.isPending || !editedName.trim()
                  }
                >
                  <Text style={styles.saveButtonText}>
                    {updateHouseholdMutation.isPending ? 'Saving...' : 'Save'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity onPress={handleStartEditing}>
              <Text style={styles.householdName}>
                {household?.name ?? 'My Household'}
              </Text>
              <Text style={styles.tapToEdit}>Tap to edit</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.inviteButton}
            onPress={handleInvite}
            disabled={createInviteMutation.isPending}
          >
            <Ionicons
              name="person-add-outline"
              size={20}
              color="#3498DB"
              style={styles.inviteIcon}
            />
            <Text style={styles.inviteButtonText}>
              {createInviteMutation.isPending
                ? 'Creating invite...'
                : 'Invite to Household'}
            </Text>
          </TouchableOpacity>
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
  householdSection: {
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
  householdName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  tapToEdit: {
    fontSize: 13,
    color: '#3498DB',
    marginTop: 4,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF5FB',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  inviteIcon: {
    marginRight: 8,
  },
  inviteButtonText: {
    color: '#3498DB',
    fontSize: 15,
    fontWeight: '600',
  },
  editContainer: {
    gap: 12,
  },
  nameInput: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  editButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#3498DB',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
