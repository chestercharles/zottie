import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
  Keyboard,
} from 'react-native'
import { useEffect, useState, useCallback, memo } from 'react'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { getCheckedItems, toggleCheckedItem, clearCheckedItems } from './checkedItemsStorage'
import { useShoppingItems, useMarkAsPurchased, useCreatePlannedItem } from './hooks'
import type { ShoppingItem, PantryItemStatus, ItemType } from './types'

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

const AddPlannedItemInput = memo(function AddPlannedItemInput({
  value,
  onChangeText,
  onSubmit,
  isCreating,
}: {
  value: string
  onChangeText: (text: string) => void
  onSubmit: () => void
  isCreating: boolean
}) {
  return (
    <View style={styles.addItemContainer}>
      <TextInput
        style={styles.addItemInput}
        placeholder="Add a planned item..."
        placeholderTextColor="#999"
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        returnKeyType="done"
        editable={!isCreating}
      />
      <TouchableOpacity
        style={[
          styles.addItemButton,
          (!value.trim() || isCreating) && styles.addItemButtonDisabled,
        ]}
        onPress={onSubmit}
        disabled={!value.trim() || isCreating}
      >
        {isCreating ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Ionicons name="add" size={24} color="#fff" />
        )}
      </TouchableOpacity>
    </View>
  )
})

export function ShoppingListScreen() {
  const router = useRouter()
  const { items, isLoading, isRefreshing, error, refetch } = useShoppingItems()
  const markAsPurchasedMutation = useMarkAsPurchased()
  const createPlannedItemMutation = useCreatePlannedItem()
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set())
  const [newItemName, setNewItemName] = useState('')

  const loadCheckedItems = useCallback(async () => {
    const stored = await getCheckedItems()
    setCheckedIds(stored)
  }, [])

  useEffect(() => {
    loadCheckedItems()
  }, [loadCheckedItems])

  const handleToggleCheck = async (itemId: string) => {
    const newCheckedIds = await toggleCheckedItem(itemId, checkedIds)
    setCheckedIds(newCheckedIds)
  }

  const handleMarkAsPurchased = () => {
    if (checkedIds.size === 0) return

    const itemIds = Array.from(checkedIds)
    markAsPurchasedMutation.mutate(itemIds, {
      onSuccess: async () => {
        await clearCheckedItems()
        setCheckedIds(new Set())
      },
      onError: (err) => {
        Alert.alert(
          'Error',
          err instanceof Error ? err.message : 'Failed to mark items as purchased'
        )
      },
    })
  }

  const handleResetCheckmarks = () => {
    Alert.alert(
      'Reset Checkmarks',
      'Are you sure you want to uncheck all items? This will not mark anything as purchased.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await clearCheckedItems()
            setCheckedIds(new Set())
          },
        },
      ]
    )
  }

  const handleCreatePlannedItem = () => {
    const trimmedName = newItemName.trim()
    if (!trimmedName) return

    createPlannedItemMutation.mutate(trimmedName, {
      onSuccess: () => {
        setNewItemName('')
        Keyboard.dismiss()
      },
      onError: (err) => {
        Alert.alert(
          'Error',
          err instanceof Error ? err.message : 'Failed to create planned item'
        )
      },
    })
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
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const addItemInput = (
    <AddPlannedItemInput
      value={newItemName}
      onChangeText={setNewItemName}
      onSubmit={handleCreatePlannedItem}
      isCreating={createPlannedItemMutation.isPending}
    />
  )

  return (
    <View style={styles.container}>
      {items.length === 0 ? (
        <View style={styles.emptyStateContainer}>
          {addItemInput}
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>You're all set!</Text>
            <Text style={styles.emptySubtext}>
              Items that are running low or out of stock will appear here.
              Add planned items above for one-time purchases.
            </Text>
          </View>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={addItemInput}
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
                    itemType: item.itemType,
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
            <RefreshControl refreshing={isRefreshing} onRefresh={refetch} />
          }
        />
      )}
      {checkedCount > 0 && (
        <View style={styles.purchaseButtonContainer}>
          <TouchableOpacity
            style={[styles.purchaseButton, markAsPurchasedMutation.isPending && styles.purchaseButtonDisabled]}
            onPress={handleMarkAsPurchased}
            disabled={markAsPurchasedMutation.isPending}
          >
            {markAsPurchasedMutation.isPending ? (
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
          <TouchableOpacity
            style={styles.resetButton}
            onPress={handleResetCheckmarks}
            disabled={markAsPurchasedMutation.isPending}
          >
            <Ionicons name="refresh" size={16} color="#666" style={styles.resetButtonIcon} />
            <Text style={styles.resetButtonText}>Reset checkmarks</Text>
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
  emptyStateContainer: {
    flex: 1,
  },
  addItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
    gap: 12,
  },
  addItemInput: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333',
  },
  addItemButton: {
    backgroundColor: '#9B59B6',
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addItemButtonDisabled: {
    backgroundColor: '#D7BDE2',
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
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  resetButtonIcon: {
    marginRight: 6,
  },
  resetButtonText: {
    color: '#666',
    fontSize: 14,
  },
})
