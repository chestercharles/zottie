import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native'
import {
  useEffect,
  useState,
  useCallback,
  useRef,
  useLayoutEffect,
} from 'react'
import { useRouter, useNavigation } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable'
import Reanimated, {
  SharedValue,
  useAnimatedStyle,
  runOnJS,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import BottomSheet, {
  BottomSheetTextInput,
  BottomSheetBackdrop,
  BottomSheetView,
} from '@gorhom/bottom-sheet'
import {
  getCheckedItems,
  toggleCheckedItem,
  clearCheckedItems,
} from './checkedItemsStorage'
import {
  useShoppingItems,
  useMarkAsPurchased,
  useCreatePlannedItem,
} from './hooks'
import { useDeletePantryItem } from '@/features/pantry/hooks'
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

const SHEET_SNAP_POINTS = ['90%']

const SWIPE_THRESHOLD = -120

function SwipeActionButton({
  label,
  icon,
  color,
  onPress,
  drag,
  position,
  totalWidth,
}: {
  label: string
  icon: keyof typeof Ionicons.glyphMap
  color: string
  onPress: () => void
  drag: SharedValue<number>
  position: number
  totalWidth: number
}) {
  const buttonWidth = totalWidth / 2
  const animatedStyle = useAnimatedStyle(() => {
    const dragValue = Math.abs(drag.value)
    const scale = Math.min(1, dragValue / 60)
    const translateX =
      dragValue > 0 ? (totalWidth - dragValue) * (position / 2) : 0

    return {
      transform: [{ scale }, { translateX }],
      opacity: scale,
    }
  })

  return (
    <Reanimated.View
      style={[styles.swipeActionButton, { width: buttonWidth }, animatedStyle]}
    >
      <TouchableOpacity
        style={[styles.swipeActionContent, { backgroundColor: color }]}
        onPress={onPress}
      >
        <Ionicons name={icon} size={22} color="#fff" />
        <Text style={styles.swipeActionLabel}>{label}</Text>
      </TouchableOpacity>
    </Reanimated.View>
  )
}

function ShoppingItemRow({
  item,
  isChecked,
  onPress,
  onToggleCheck,
  onMarkPurchased,
  onDelete,
}: {
  item: ShoppingItem
  isChecked: boolean
  onPress: () => void
  onToggleCheck: () => void
  onMarkPurchased: () => void
  onDelete: () => void
}) {
  const swipeableRef = useRef<SwipeableMethods>(null)
  const hasTriggeredHaptic = useRef(false)
  const actionsWidth = 120

  const handleFullSwipe = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    onMarkPurchased()
    swipeableRef.current?.close()
  }, [onMarkPurchased])

  const renderRightActions = (
    _progress: SharedValue<number>,
    drag: SharedValue<number>
  ) => {
    const checkSwipeThreshold = () => {
      'worklet'
      if (drag.value < SWIPE_THRESHOLD && !hasTriggeredHaptic.current) {
        hasTriggeredHaptic.current = true
        runOnJS(handleFullSwipe)()
      }
    }

    return (
      <Reanimated.View
        style={[styles.swipeActionsContainer, { width: actionsWidth }]}
        onLayout={() => {
          checkSwipeThreshold()
        }}
      >
        <SwipeActionButton
          label="Purchased"
          icon="checkmark-circle"
          color="#27AE60"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
            onMarkPurchased()
            swipeableRef.current?.close()
          }}
          drag={drag}
          position={0}
          totalWidth={actionsWidth}
        />
        <SwipeActionButton
          label="Delete"
          icon="trash"
          color="#E74C3C"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
            onDelete()
            swipeableRef.current?.close()
          }}
          drag={drag}
          position={1}
          totalWidth={actionsWidth}
        />
      </Reanimated.View>
    )
  }

  return (
    <ReanimatedSwipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      overshootRight={false}
      rightThreshold={40}
      onSwipeableWillOpen={() => {
        hasTriggeredHaptic.current = false
      }}
    >
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
            <Text
              style={[styles.itemName, isChecked && styles.itemNameChecked]}
            >
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
    </ReanimatedSwipeable>
  )
}

export function ShoppingListScreen() {
  const router = useRouter()
  const navigation = useNavigation()
  const { items, isLoading, isRefreshing, error, refetch } = useShoppingItems()
  const markAsPurchasedMutation = useMarkAsPurchased()
  const createPlannedItemMutation = useCreatePlannedItem()
  const deletePantryItem = useDeletePantryItem()
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set())
  const [newItemName, setNewItemName] = useState('')
  const bottomSheetRef = useRef<BottomSheet>(null)

  const openAddSheet = useCallback(() => {
    bottomSheetRef.current?.expand()
  }, [])

  const closeAddSheet = useCallback(() => {
    bottomSheetRef.current?.close()
  }, [])

  const handleSheetChange = useCallback((index: number) => {
    if (index === -1) {
      setNewItemName('')
    }
  }, [])

  const renderBackdrop = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
      />
    ),
    []
  )

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={openAddSheet} style={{ marginRight: 8 }}>
          <Ionicons name="add" size={28} color="#9B59B6" />
        </TouchableOpacity>
      ),
    })
  }, [navigation, openAddSheet])

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
          err instanceof Error
            ? err.message
            : 'Failed to mark items as purchased'
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
      onSuccess: closeAddSheet,
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

  return (
    <View style={styles.container}>
      {items.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>You're all set!</Text>
          <Text style={styles.emptySubtext}>
            Items that are running low or out of stock will appear here.
          </Text>
          <TouchableOpacity style={styles.addButton} onPress={openAddSheet}>
            <Text style={styles.addButtonText}>Add Planned Item</Text>
          </TouchableOpacity>
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
                    itemType: item.itemType,
                    createdAt: item.createdAt.toString(),
                    updatedAt: item.updatedAt.toString(),
                    purchasedAt: item.purchasedAt?.toString() ?? '',
                  },
                })
              }
              onToggleCheck={() => handleToggleCheck(item.id)}
              onMarkPurchased={() => markAsPurchasedMutation.mutate([item.id])}
              onDelete={() => deletePantryItem.mutate(item.id)}
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
            style={[
              styles.purchaseButton,
              markAsPurchasedMutation.isPending &&
                styles.purchaseButtonDisabled,
            ]}
            onPress={handleMarkAsPurchased}
            disabled={markAsPurchasedMutation.isPending}
          >
            {markAsPurchasedMutation.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons
                  name="cart"
                  size={20}
                  color="#fff"
                  style={styles.purchaseButtonIcon}
                />
                <Text style={styles.purchaseButtonText}>
                  Mark {checkedCount} {checkedCount === 1 ? 'item' : 'items'} as
                  purchased
                </Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.resetButton}
            onPress={handleResetCheckmarks}
            disabled={markAsPurchasedMutation.isPending}
          >
            <Ionicons
              name="refresh"
              size={16}
              color="#666"
              style={styles.resetButtonIcon}
            />
            <Text style={styles.resetButtonText}>Reset checkmarks</Text>
          </TouchableOpacity>
        </View>
      )}
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={SHEET_SNAP_POINTS}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        onChange={handleSheetChange}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        handleIndicatorStyle={styles.sheetHandle}
      >
        <BottomSheetView style={styles.sheetContent}>
          <View style={styles.sheetHeader}>
            <TouchableOpacity
              style={styles.sheetHeaderButton}
              onPress={closeAddSheet}
              disabled={createPlannedItemMutation.isPending}
            >
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
            <Text style={styles.sheetTitle}>Add Planned Item</Text>
            <TouchableOpacity
              style={[
                styles.sheetHeaderButton,
                (!newItemName.trim() || createPlannedItemMutation.isPending) &&
                  styles.sheetHeaderButtonDisabled,
              ]}
              onPress={handleCreatePlannedItem}
              disabled={
                !newItemName.trim() || createPlannedItemMutation.isPending
              }
            >
              {createPlannedItemMutation.isPending ? (
                <ActivityIndicator color="#9B59B6" />
              ) : (
                <Ionicons
                  name="checkmark"
                  size={28}
                  color={newItemName.trim() ? '#9B59B6' : '#ccc'}
                />
              )}
            </TouchableOpacity>
          </View>
          <View style={styles.sheetBody}>
            <BottomSheetTextInput
              style={styles.sheetInput}
              value={newItemName}
              onChangeText={setNewItemName}
              placeholder="Item name"
              placeholderTextColor="#999"
              autoFocus
              editable={!createPlannedItemMutation.isPending}
              onSubmitEditing={handleCreatePlannedItem}
              returnKeyType="done"
            />
          </View>
        </BottomSheetView>
      </BottomSheet>
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
    marginBottom: 24,
  },
  addButton: {
    backgroundColor: '#9B59B6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  sheetContent: {
    flex: 1,
  },
  sheetHandle: {
    backgroundColor: '#c0c0c0',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  sheetHeaderButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetHeaderButtonDisabled: {
    opacity: 0.5,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
  },
  sheetBody: {
    padding: 24,
  },
  sheetInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  swipeActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  swipeActionButton: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeActionContent: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 2,
    gap: 4,
  },
  swipeActionLabel: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
})
