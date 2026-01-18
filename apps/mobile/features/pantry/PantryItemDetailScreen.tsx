import { useState, useEffect } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput as RNTextInput,
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import type { PantryItemStatus, ItemType } from './types'
import { useUpdatePantryItem, useDeletePantryItem } from './hooks'
import { useTheme } from '../../lib/theme'
import { Text, Button, Card, DragHandle } from '../../components/ui'

const statusLabels: Record<PantryItemStatus, string> = {
  in_stock: 'In Stock',
  running_low: 'Running Low',
  out_of_stock: 'Out of Stock',
  planned: 'Planned',
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface StatusButtonProps {
  status: PantryItemStatus
  isActive: boolean
  isPulsing: boolean
  onPress: () => void
  disabled: boolean
  colors: ReturnType<typeof useTheme>['colors']
  spacing: ReturnType<typeof useTheme>['spacing']
  radius: ReturnType<typeof useTheme>['radius']
}

function StatusButton({
  status,
  isActive,
  isPulsing,
  onPress,
  disabled,
  colors,
  spacing,
  radius,
}: StatusButtonProps) {
  const opacity = useSharedValue(1)

  useEffect(() => {
    if (isPulsing) {
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.5, {
            duration: 600,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(1, {
            duration: 600,
            easing: Easing.inOut(Easing.ease),
          })
        ),
        -1,
        false
      )
    } else {
      opacity.value = withTiming(1, { duration: 150 })
    }
  }, [isPulsing, opacity])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }))

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        style={[
          styles.statusButton,
          {
            backgroundColor: isActive
              ? colors.action.primary
              : colors.surface.background,
            borderColor: colors.action.primary,
            borderRadius: radius.sm,
            paddingVertical: spacing.sm,
            paddingHorizontal: spacing.md,
          },
        ]}
        onPress={onPress}
        disabled={disabled}
      >
        <Text
          variant="body.primary"
          style={[
            styles.statusButtonText,
            { color: isActive ? colors.text.inverse : colors.action.primary },
          ]}
        >
          {statusLabels[status]}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  )
}

export function PantryItemDetailScreen() {
  const params = useLocalSearchParams<{
    id: string
    name: string
    status: PantryItemStatus
    itemType: ItemType
    createdAt: string
    updatedAt: string
    purchasedAt: string
  }>()
  const router = useRouter()
  const updateMutation = useUpdatePantryItem()
  const deleteMutation = useDeletePantryItem()
  const { colors, spacing, radius } = useTheme()

  const [currentStatus, setCurrentStatus] = useState<PantryItemStatus>(
    params.status
  )
  const [pendingStatus, setPendingStatus] = useState<PantryItemStatus | null>(null)
  const [currentName, setCurrentName] = useState(params.name)
  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState(params.name)

  const createdAt = parseInt(params.createdAt || '0', 10)
  const updatedAt = parseInt(params.updatedAt || '0', 10)
  const purchasedAt = params.purchasedAt
    ? parseInt(params.purchasedAt, 10)
    : null

  const handleSaveName = () => {
    const trimmedName = editedName.trim()
    if (!trimmedName) {
      Alert.alert('Error', 'Name cannot be empty')
      return
    }
    if (trimmedName === currentName) {
      setIsEditingName(false)
      return
    }

    updateMutation.mutate(
      { itemId: params.id, name: trimmedName },
      {
        onSuccess: () => {
          setCurrentName(trimmedName)
          setIsEditingName(false)
        },
        onError: (error) =>
          Alert.alert(
            'Error',
            error instanceof Error
              ? error.message
              : 'Failed to update item name'
          ),
      }
    )
  }

  const handleCancelEdit = () => {
    setEditedName(currentName)
    setIsEditingName(false)
  }

  const handleStatusChange = (newStatus: PantryItemStatus) => {
    if (newStatus === currentStatus) return

    if (params.itemType === 'planned' && newStatus === 'out_of_stock') {
      Alert.alert(
        'Remove Item?',
        `"${currentName}" is a planned item. Do you want to remove it from your pantry?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => {
              deleteMutation.mutate(params.id, {
                onSuccess: () => router.back(),
                onError: (error) =>
                  Alert.alert(
                    'Error',
                    error instanceof Error
                      ? error.message
                      : 'Failed to remove item from pantry'
                  ),
              })
            },
          },
        ]
      )
      return
    }

    setPendingStatus(newStatus)
    updateMutation.mutate(
      { itemId: params.id, status: newStatus },
      {
        onSuccess: () => {
          setCurrentStatus(newStatus)
          setPendingStatus(null)
        },
        onError: (error) => {
          setPendingStatus(null)
          Alert.alert(
            'Error',
            error instanceof Error
              ? error.message
              : 'Failed to update pantry item status'
          )
        },
      }
    )
  }

  const handleDelete = () => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete "${currentName}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteMutation.mutate(params.id, {
              onSuccess: () => router.back(),
              onError: (error) =>
                Alert.alert(
                  'Error',
                  error instanceof Error
                    ? error.message
                    : 'Failed to delete pantry item'
                ),
            })
          },
        },
      ]
    )
  }

  const statuses: PantryItemStatus[] = [
    'in_stock',
    'running_low',
    'out_of_stock',
  ]

  return (
    <View style={[styles.container, { backgroundColor: colors.surface.background }]}>
      <DragHandle />
      <ScrollView>
        <View style={[styles.content, { padding: spacing.md }]}>
          <View style={[styles.header, { marginBottom: spacing.lg, paddingHorizontal: spacing.md }]}>
            {isEditingName ? (
            <View style={[styles.editNameContainer, { marginBottom: spacing.sm }]}>
              <RNTextInput
                style={[
                  styles.nameInput,
                  {
                    color: colors.text.primary,
                    backgroundColor: colors.surface.grouped,
                    borderRadius: radius.sm,
                    padding: spacing.sm,
                    marginBottom: spacing.sm,
                  },
                ]}
                value={editedName}
                onChangeText={setEditedName}
                selectTextOnFocus
                onSubmitEditing={handleSaveName}
                returnKeyType="done"
                placeholderTextColor={colors.text.tertiary}
              />
              <View style={[styles.editNameButtons, { gap: spacing.sm }]}>
                <Button
                  variant="secondary"
                  title="Cancel"
                  onPress={handleCancelEdit}
                  disabled={updateMutation.isPending}
                  style={styles.editButton}
                />
                <Button
                  title={updateMutation.isPending ? 'Saving...' : 'Save'}
                  onPress={handleSaveName}
                  disabled={updateMutation.isPending}
                  style={styles.editButton}
                />
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.nameContainer, { gap: spacing.sm }]}
              onPress={() => setIsEditingName(true)}
            >
              <Text variant="title.large">{currentName}</Text>
              <Ionicons name="pencil" size={20} color={colors.text.tertiary} />
            </TouchableOpacity>
          )}
        </View>

        <Card style={[styles.section, { marginBottom: spacing.md }]}>
          <Text variant="title.small" style={{ marginBottom: spacing.md }}>
            Change Status
          </Text>
          <View style={[styles.statusButtons, { gap: spacing.sm }]}>
            {statuses.map((status) => {
              const isActive = currentStatus === status || pendingStatus === status
              const isPulsing = pendingStatus === status
              return (
                <StatusButton
                  key={status}
                  status={status}
                  isActive={isActive}
                  isPulsing={isPulsing}
                  onPress={() => handleStatusChange(status)}
                  disabled={isActive || pendingStatus !== null}
                  colors={colors}
                  spacing={spacing}
                  radius={radius}
                />
              )
            })}
          </View>
        </Card>

        <Card style={[styles.section, { marginBottom: spacing.md }]}>
          <Text variant="title.small" style={{ marginBottom: spacing.md }}>
            Details
          </Text>

          {purchasedAt && (
            <View
              style={[
                styles.detailRow,
                {
                  paddingVertical: spacing.sm,
                  borderBottomColor: colors.border.subtle,
                },
              ]}
            >
              <Text variant="body.secondary" color="secondary">
                Last Purchased
              </Text>
              <Text variant="body.secondary">{formatDate(purchasedAt)}</Text>
            </View>
          )}

          <View
            style={[
              styles.detailRow,
              {
                paddingVertical: spacing.sm,
                borderBottomColor: colors.border.subtle,
              },
            ]}
          >
            <Text variant="body.secondary" color="secondary">
              Created
            </Text>
            <Text variant="body.secondary">{formatDate(createdAt)}</Text>
          </View>

          <View
            style={[
              styles.detailRow,
              {
                paddingVertical: spacing.sm,
                borderBottomWidth: 0,
              },
            ]}
          >
            <Text variant="body.secondary" color="secondary">
              Last Updated
            </Text>
            <Text variant="body.secondary">{formatDate(updatedAt)}</Text>
          </View>
        </Card>

        <TouchableOpacity
          style={[
            styles.deleteButton,
            {
              backgroundColor: colors.feedback.error,
              borderRadius: radius.md,
              paddingVertical: spacing.sm + spacing.xs,
              marginTop: spacing.sm,
            },
          ]}
          onPress={handleDelete}
          disabled={deleteMutation.isPending}
        >
          {deleteMutation.isPending ? (
            <ActivityIndicator size="small" color={colors.text.inverse} />
          ) : (
            <Text variant="body.primary" color="inverse" style={styles.deleteButtonText}>
              Delete Item
            </Text>
          )}
        </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {},
  header: {},
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editNameContainer: {},
  nameInput: {
    fontSize: 28,
    fontWeight: '700',
  },
  editNameButtons: {
    flexDirection: 'row',
  },
  editButton: {
    flex: 1,
  },
  section: {},
  statusButtons: {},
  statusButton: {
    borderWidth: 2,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  statusButtonText: {
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  deleteButton: {
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontWeight: '600',
  },
})
