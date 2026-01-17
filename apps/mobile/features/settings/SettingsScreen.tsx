import { useState } from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput as RNTextInput,
  ActivityIndicator,
  Share,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Constants from 'expo-constants'
import { useRouter } from 'expo-router'
import { useAuth } from '@/features/auth'
import {
  useHousehold,
  useUpdateHousehold,
  useCreateHouseholdInvite,
  useLeaveHousehold,
} from '@/features/household'
import { queryClient } from '@/lib/query/client'
import { useTheme, useThemePreference, type ThemePreference } from '../../lib/theme'
import { Text, Button } from '../../components/ui'

const themeOptions: { value: ThemePreference; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
]

export function SettingsScreen() {
  const router = useRouter()
  const { colors, spacing, radius } = useTheme()
  const { preference, setPreference } = useThemePreference()
  const { user, signOut } = useAuth()
  const { household, members, isLoading: isLoadingHousehold } = useHousehold()
  const updateHouseholdMutation = useUpdateHousehold()
  const createInviteMutation = useCreateHouseholdInvite()
  const leaveHouseholdMutation = useLeaveHousehold()

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

  const handleLeaveHousehold = () => {
    const isOnlyMember = members.length === 1
    const message = isOnlyMember
      ? 'You are the only member of this household. Leaving will permanently delete all household data including pantry items. You will need to create a new household or join an existing one.'
      : 'You will leave this household and lose access to the shared pantry. You will need to create a new household or join an existing one.'

    Alert.alert('Leave Household', message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: async () => {
          try {
            await leaveHouseholdMutation.mutateAsync()
            router.replace('/')
          } catch {
            Alert.alert('Error', 'Failed to leave household')
          }
        },
      },
    ])
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface.background }]}>
      <View style={[styles.content, { padding: spacing.lg }]}>
        <View style={[styles.accountSection, { marginBottom: spacing.xl }]}>
          <Text variant="caption" color="secondary" style={styles.sectionTitle}>
            ACCOUNT
          </Text>
          {user?.email && (
            <Text variant="body.primary">{user.email}</Text>
          )}
        </View>

        <View style={[styles.appearanceSection, { marginBottom: spacing.xl }]}>
          <Text variant="caption" color="secondary" style={styles.sectionTitle}>
            APPEARANCE
          </Text>
          <View
            style={[
              styles.segmentedControl,
              {
                backgroundColor: colors.surface.grouped,
                borderRadius: radius.sm,
                padding: spacing.xs,
              },
            ]}
          >
            {themeOptions.map((option) => {
              const isSelected = preference === option.value
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.segmentOption,
                    {
                      backgroundColor: isSelected ? colors.surface.elevated : 'transparent',
                      borderRadius: radius.sm - 2,
                      paddingVertical: spacing.sm,
                      paddingHorizontal: spacing.md,
                    },
                  ]}
                  onPress={() => setPreference(option.value)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`${option.label} theme`}
                >
                  <Text
                    variant="body.secondary"
                    style={{
                      color: isSelected ? colors.text.primary : colors.text.secondary,
                      fontWeight: isSelected ? '600' : '400',
                    }}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        <View style={[styles.householdSection, { marginBottom: spacing.xl }]}>
          <Text variant="caption" color="secondary" style={styles.sectionTitle}>
            HOUSEHOLD
          </Text>
          {isLoadingHousehold ? (
            <ActivityIndicator size="small" color={colors.action.primary} />
          ) : isEditingName ? (
            <View style={[styles.editContainer, { gap: spacing.sm }]}>
              <RNTextInput
                style={[
                  styles.nameInput,
                  {
                    color: colors.text.primary,
                    borderColor: colors.border.subtle,
                    borderRadius: radius.sm,
                    paddingHorizontal: spacing.sm,
                    paddingVertical: spacing.sm,
                  },
                ]}
                value={editedName}
                onChangeText={setEditedName}
                placeholder="Household name"
                placeholderTextColor={colors.text.tertiary}
              />
              <View style={[styles.editButtons, { gap: spacing.sm }]}>
                <Button
                  variant="secondary"
                  title="Cancel"
                  onPress={handleCancelEdit}
                  style={styles.flex1}
                />
                <Button
                  title={updateHouseholdMutation.isPending ? 'Saving...' : 'Save'}
                  onPress={handleSaveName}
                  disabled={updateHouseholdMutation.isPending || !editedName.trim()}
                  style={styles.flex1}
                />
              </View>
            </View>
          ) : (
            <TouchableOpacity onPress={handleStartEditing}>
              <Text variant="title.small">{household?.name ?? 'My Household'}</Text>
              <Text
                variant="caption"
                style={{ color: colors.action.primary, marginTop: spacing.xs }}
              >
                Tap to edit
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.inviteButton,
              {
                backgroundColor: colors.surface.grouped,
                borderRadius: radius.sm,
                paddingVertical: spacing.sm,
                paddingHorizontal: spacing.md,
                marginTop: spacing.md,
              },
            ]}
            onPress={handleInvite}
            disabled={createInviteMutation.isPending}
          >
            <Ionicons
              name="person-add-outline"
              size={20}
              color={colors.action.primary}
              style={{ marginRight: spacing.sm }}
            />
            <Text variant="body.secondary" style={{ color: colors.action.primary, fontWeight: '600' }}>
              {createInviteMutation.isPending
                ? 'Creating invite...'
                : 'Invite to Household'}
            </Text>
          </TouchableOpacity>

          {members.length > 0 && (
            <View style={[styles.membersContainer, { marginTop: spacing.lg }]}>
              <Text variant="caption" color="secondary" style={[styles.sectionTitle, { marginBottom: spacing.sm }]}>
                MEMBERS
              </Text>
              {members.map((member) => {
                const isCurrentUser = member.userId === user?.id
                return (
                  <View
                    key={member.id}
                    style={[
                      styles.memberRow,
                      {
                        paddingVertical: spacing.sm,
                        borderBottomColor: colors.border.subtle,
                      },
                    ]}
                  >
                    <Ionicons
                      name="person-outline"
                      size={20}
                      color={colors.text.secondary}
                      style={{ marginRight: spacing.sm }}
                    />
                    <View style={styles.memberInfo}>
                      <Text variant="body.primary">
                        {member.name || member.email}
                      </Text>
                      {isCurrentUser && (
                        <Text variant="caption" style={{ color: colors.action.primary, fontWeight: '600' }}>
                          You
                        </Text>
                      )}
                    </View>
                  </View>
                )
              })}
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.leaveButton,
              {
                borderRadius: radius.sm,
                paddingVertical: spacing.sm,
                paddingHorizontal: spacing.md,
                marginTop: spacing.lg,
                borderWidth: 1,
                borderColor: colors.feedback.error,
              },
            ]}
            onPress={handleLeaveHousehold}
            disabled={leaveHouseholdMutation.isPending}
          >
            <Ionicons
              name="exit-outline"
              size={20}
              color={colors.feedback.error}
              style={{ marginRight: spacing.sm }}
            />
            <Text variant="body.secondary" style={{ color: colors.feedback.error, fontWeight: '600' }}>
              {leaveHouseholdMutation.isPending
                ? 'Leaving...'
                : 'Leave Household'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.footer, { padding: spacing.lg, paddingBottom: spacing['2xl'] }]}>
        <TouchableOpacity
          style={[
            styles.logoutButton,
            {
              backgroundColor: colors.surface.background,
              borderWidth: 1,
              borderColor: colors.feedback.error,
              borderRadius: radius.sm,
              paddingVertical: spacing.sm + spacing.xs,
            },
          ]}
          onPress={handleLogout}
          disabled={isLoggingOut}
        >
          <Text variant="body.primary" style={{ color: colors.feedback.error, fontWeight: '600' }}>
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
  },
  content: {
    flex: 1,
  },
  accountSection: {},
  appearanceSection: {},
  segmentedControl: {
    flexDirection: 'row',
  },
  segmentOption: {
    flex: 1,
    alignItems: 'center',
  },
  householdSection: {},
  sectionTitle: {
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  editContainer: {},
  nameInput: {
    fontSize: 18,
    fontWeight: '600',
    borderWidth: 1,
    minHeight: 44,
  },
  editButtons: {
    flexDirection: 'row',
  },
  flex1: {
    flex: 1,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  membersContainer: {},
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  memberInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  footer: {},
  logoutButton: {
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
})
