import { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useAuth0 } from 'react-native-auth0'
import type { PantryItemStatus } from './types'
import { deletePantryItem, updatePantryItem } from './api'
import { useAuth } from '../auth'

const statusLabels: Record<PantryItemStatus, string> = {
  in_stock: 'In Stock',
  running_low: 'Running Low',
  out_of_stock: 'Out of Stock',
}

const statusColors: Record<PantryItemStatus, string> = {
  in_stock: '#27AE60',
  running_low: '#F39C12',
  out_of_stock: '#E74C3C',
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
    createdAt: string
    updatedAt: string
  }>()
  const { user } = useAuth()
  const { getCredentials } = useAuth0()
  const router = useRouter()

  const [currentStatus, setCurrentStatus] = useState<PantryItemStatus>(
    params.status
  )
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const createdAt = parseInt(params.createdAt || '0', 10)
  const updatedAt = parseInt(params.updatedAt || '0', 10)

  const handleStatusChange = async (newStatus: PantryItemStatus) => {
    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in to update items')
      return
    }

    if (newStatus === currentStatus) {
      return
    }

    setIsUpdating(true)

    try {
      const credentials = await getCredentials()
      if (!credentials?.accessToken) {
        throw new Error('No access token available')
      }

      await updatePantryItem(
        params.id,
        { status: newStatus },
        credentials.accessToken,
        user.id
      )
      setCurrentStatus(newStatus)
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error
          ? error.message
          : 'Failed to update pantry item status'
      )
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = () => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete "${params.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!user?.id) {
              Alert.alert('Error', 'You must be logged in to delete items')
              return
            }

            setIsDeleting(true)

            try {
              const credentials = await getCredentials()
              if (!credentials?.accessToken) {
                throw new Error('No access token available')
              }

              await deletePantryItem(
                params.id,
                credentials.accessToken,
                user.id
              )
              router.back()
            } catch (error) {
              Alert.alert(
                'Error',
                error instanceof Error
                  ? error.message
                  : 'Failed to delete pantry item'
              )
              setIsDeleting(false)
            }
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
          <Text style={styles.name}>{params.name}</Text>
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
          {isUpdating ? (
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
            <Text style={styles.detailValue}>{params.name}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status</Text>
            <Text style={styles.detailValue}>
              {statusLabels[currentStatus]}
            </Text>
          </View>

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
          disabled={isDeleting}
        >
          {isDeleting ? (
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
  name: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
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
