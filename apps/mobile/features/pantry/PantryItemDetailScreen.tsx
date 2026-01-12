import { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import type { PantryItemStatus, ItemType } from './types'
import { useUpdatePantryItem, useDeletePantryItem } from './hooks'

const statusLabels: Record<PantryItemStatus, string> = {
  in_stock: 'In Stock',
  running_low: 'Running Low',
  out_of_stock: 'Out of Stock',
  planned: 'Planned',
}

const statusColors: Record<PantryItemStatus, string> = {
  in_stock: '#27AE60',
  running_low: '#F39C12',
  out_of_stock: '#E74C3C',
  planned: '#9B59B6',
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

  const [currentStatus, setCurrentStatus] = useState<PantryItemStatus>(
    params.status
  )
  const [currentName, setCurrentName] = useState(params.name)
  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState(params.name)

  const createdAt = parseInt(params.createdAt || '0', 10)
  const updatedAt = parseInt(params.updatedAt || '0', 10)
  const purchasedAt = params.purchasedAt ? parseInt(params.purchasedAt, 10) : null

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

    updateMutation.mutate(
      { itemId: params.id, status: newStatus },
      {
        onSuccess: () => setCurrentStatus(newStatus),
        onError: (error) =>
          Alert.alert(
            'Error',
            error instanceof Error
              ? error.message
              : 'Failed to update pantry item status'
          ),
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

  const statuses: PantryItemStatus[] = ['in_stock', 'running_low', 'out_of_stock']

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          {isEditingName ? (
            <View style={styles.editNameContainer}>
              <TextInput
                style={styles.nameInput}
                value={editedName}
                onChangeText={setEditedName}
                autoFocus
                selectTextOnFocus
                onSubmitEditing={handleSaveName}
                returnKeyType="done"
              />
              <View style={styles.editNameButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancelEdit}
                  disabled={updateMutation.isPending}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.saveButton,
                    updateMutation.isPending && styles.saveButtonDisabled,
                  ]}
                  onPress={handleSaveName}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.nameContainer}
              onPress={() => setIsEditingName(true)}
            >
              <Text style={styles.name}>{currentName}</Text>
              <Ionicons name="pencil" size={20} color="#999" />
            </TouchableOpacity>
          )}
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusColors[currentStatus] },
            ]}
          >
            <Text style={styles.statusText}>
              {statusLabels[currentStatus]}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Change Status</Text>
          {updateMutation.isPending ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#3498DB" />
              <Text style={styles.loadingText}>Updating...</Text>
            </View>
          ) : (
            <View style={styles.statusButtons}>
              {statuses.map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.statusButton,
                    currentStatus === status && styles.statusButtonActive,
                  ]}
                  onPress={() => handleStatusChange(status)}
                  disabled={currentStatus === status}
                >
                  <Text
                    style={[
                      styles.statusButtonText,
                      currentStatus === status &&
                        styles.statusButtonTextActive,
                    ]}
                  >
                    {statusLabels[status]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Item Name</Text>
            <Text style={styles.detailValue}>{currentName}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status</Text>
            <Text style={styles.detailValue}>
              {statusLabels[currentStatus]}
            </Text>
          </View>

          {purchasedAt && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Last Purchased</Text>
              <Text style={styles.detailValue}>{formatDate(purchasedAt)}</Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Created</Text>
            <Text style={styles.detailValue}>{formatDate(createdAt)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Last Updated</Text>
            <Text style={styles.detailValue}>{formatDate(updatedAt)}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          disabled={deleteMutation.isPending}
        >
          {deleteMutation.isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.deleteButtonText}>Delete Item</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  name: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
  },
  editNameContainer: {
    marginBottom: 12,
  },
  nameInput: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  editNameButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#3498DB',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#A9CCE3',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  statusButtons: {
    gap: 8,
  },
  statusButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#3498DB',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  statusButtonActive: {
    backgroundColor: '#3498DB',
    borderColor: '#3498DB',
  },
  statusButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3498DB',
  },
  statusButtonTextActive: {
    color: '#fff',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#E74C3C',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})
