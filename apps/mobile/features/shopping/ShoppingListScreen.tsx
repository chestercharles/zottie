import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { useEffect, useState, useCallback } from 'react'
import { useAuth0 } from 'react-native-auth0'
import { useAuth } from '@/features/auth'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { getShoppingItems, markItemsAsPurchased } from './api'
import { getCheckedItems, toggleCheckedItem, clearCheckedItems } from './checkedItemsStorage'
import type { ShoppingItem, PantryItemStatus, ItemType } from './types'

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

const itemTypeLabels: Record<ItemType, string> = {
  staple: 'Staple',
  planned: 'Planned',
}

function ShoppingItemRow({
  item,
  isChecked,
  onPress,
  onToggleCheck,
}: {
  item: ShoppingItem
  isChecked: boolean
  onPress: () => void
  onToggleCheck: () => void
}) {
  return (
    <View style={styles.itemRow}>
      <TouchableOpacity
        style={styles.checkbox}
        onPress={onToggleCheck}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons
          name={isChecked ? 'checkbox' : 'square-outline'}
          size={24}
          color={isChecked ? '#27AE60' : '#999'}
        />
      </TouchableOpacity>
      <TouchableOpacity style={styles.itemContent} onPress={onPress}>
        <View style={styles.itemDetails}>
          <Text style={[styles.itemName, isChecked && styles.itemNameChecked]}>
            {item.name}
          </Text>
          <Text style={styles.itemType}>{itemTypeLabels[item.itemType]}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: statusColors[item.status] },
          ]}
        >
          <Text style={styles.statusText}>{statusLabels[item.status]}</Text>
        </View>
      </TouchableOpacity>
    </View>
  )
}

export function ShoppingListScreen() {
  const { user } = useAuth()
  const { getCredentials } = useAuth0()
  const router = useRouter()
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadCheckedItems = useCallback(async () => {
    const stored = await getCheckedItems()
    setCheckedIds(stored)
  }, [])

  const fetchItems = useCallback(async () => {
    if (!user?.id) return

    try {
      const credentials = await getCredentials()
      if (!credentials?.accessToken) {
        throw new Error('No access token available')
      }

      const shoppingItems = await getShoppingItems(credentials.accessToken, user.id)
      setItems(shoppingItems)
      setError(null)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch shopping items'
      )
    }
  }, [user?.id, getCredentials])

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      await Promise.all([fetchItems(), loadCheckedItems()])
      setIsLoading(false)
    }
    loadData()
  }, [fetchItems, loadCheckedItems])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchItems()
    setIsRefreshing(false)
  }

  const handleToggleCheck = async (itemId: string) => {
    const newCheckedIds = await toggleCheckedItem(itemId, checkedIds)
    setCheckedIds(newCheckedIds)
  }

  const handleMarkAsPurchased = async () => {
    if (checkedIds.size === 0 || !user?.id) return

    try {
      setIsPurchasing(true)
      const credentials = await getCredentials()
      if (!credentials?.accessToken) {
        throw new Error('No access token available')
      }

      const itemIds = Array.from(checkedIds)
      await markItemsAsPurchased(itemIds, credentials.accessToken, user.id)
      await clearCheckedItems()
      setCheckedIds(new Set())
      await fetchItems()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to mark items as purchased'
      )
    } finally {
      setIsPurchasing(false)
    }
  }

  const checkedCount = checkedIds.size

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3498DB" />
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchItems}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {items.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>You're all set!</Text>
          <Text style={styles.emptySubtext}>
            Items that are running low or out of stock will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ShoppingItemRow
              item={item}
              isChecked={checkedIds.has(item.id)}
              onPress={() =>
                router.push({
                  pathname: '/pantry/[id]',
                  params: {
                    id: item.id,
                    name: item.name,
                    status: item.status,
                    createdAt: item.createdAt.toString(),
                    updatedAt: item.updatedAt.toString(),
                  },
                })
              }
              onToggleCheck={() => handleToggleCheck(item.id)}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
        />
      )}
      {checkedCount > 0 && (
        <View style={styles.purchaseButtonContainer}>
          <TouchableOpacity
            style={[styles.purchaseButton, isPurchasing && styles.purchaseButtonDisabled]}
            onPress={handleMarkAsPurchased}
            disabled={isPurchasing}
          >
            {isPurchasing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="cart" size={20} color="#fff" style={styles.purchaseButtonIcon} />
                <Text style={styles.purchaseButtonText}>
                  Mark {checkedCount} {checkedCount === 1 ? 'item' : 'items'} as purchased
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 24,
  },
  listContent: {
    padding: 16,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  checkbox: {
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  itemNameChecked: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  itemType: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginLeft: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#E74C3C',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#3498DB',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  purchaseButtonContainer: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  purchaseButton: {
    backgroundColor: '#27AE60',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  purchaseButtonDisabled: {
    backgroundColor: '#95D5B2',
  },
  purchaseButtonIcon: {
    marginRight: 8,
  },
  purchaseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})
