import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  ActionSheetIOS,
  TextInput,
} from 'react-native'
import { useState, useRef, useLayoutEffect, useCallback } from 'react'
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
  usePantryItems,
  useUpdatePantryItem,
  useCreatePantryItem,
} from './hooks'
import type { PantryItem, PantryItemStatus } from './types'

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

const SWIPE_THRESHOLD = -150

function SwipeActionButton({
  label,
  icon,
  color,
  onPress,
  drag,
  position,
  totalWidth,
  buttonCount = 2,
}: {
  label: string
  icon: keyof typeof Ionicons.glyphMap
  color: string
  onPress: () => void
  drag: SharedValue<number>
  position: number
  totalWidth: number
  buttonCount?: number
}) {
  const buttonWidth = totalWidth / buttonCount
  const animatedStyle = useAnimatedStyle(() => {
    const dragValue = Math.abs(drag.value)
    const scale = Math.min(1, dragValue / 60)
    const translateX =
      dragValue > 0 ? (totalWidth - dragValue) * (position / buttonCount) : 0

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

function PantryItemRow({
  item,
  onPress,
  onMarkLow,
  onMarkOut,
  onMore,
}: {
  item: PantryItem
  onPress: () => void
  onMarkLow: () => void
  onMarkOut: () => void
  onMore: () => void
}) {
  const swipeableRef = useRef<SwipeableMethods>(null)
  const hasTriggeredHaptic = useRef(false)
  const showPlannedIndicator =
    item.itemType === 'planned' && item.status !== 'planned'

  const isStaple = item.itemType === 'staple'
  const actionsWidth = isStaple ? 120 : 60

  const handleFullSwipe = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    onMarkLow()
    swipeableRef.current?.close()
  }, [onMarkLow])

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
        {isStaple ? (
          <>
            <SwipeActionButton
              label="Low"
              icon="alert-circle"
              color="#F39C12"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
                onMarkLow()
                swipeableRef.current?.close()
              }}
              drag={drag}
              position={0}
              totalWidth={actionsWidth}
              buttonCount={2}
            />
            <SwipeActionButton
              label="Out"
              icon="close-circle"
              color="#E74C3C"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
                onMarkOut()
                swipeableRef.current?.close()
              }}
              drag={drag}
              position={1}
              totalWidth={actionsWidth}
              buttonCount={2}
            />
          </>
        ) : (
          <SwipeActionButton
            label="More"
            icon="ellipsis-horizontal"
            color="#3498DB"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              onMore()
              swipeableRef.current?.close()
            }}
            drag={drag}
            position={0}
            totalWidth={actionsWidth}
            buttonCount={1}
          />
        )}
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
      <TouchableOpacity style={styles.itemRow} onPress={onPress}>
        <View style={styles.itemInfo}>
          <View style={styles.itemNameContainer}>
            <Text style={styles.itemName}>{item.name}</Text>
            {showPlannedIndicator && (
              <Ionicons
                name="pricetag-outline"
                size={14}
                color="#9B59B6"
                style={styles.plannedIcon}
              />
            )}
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusColors[item.status] },
            ]}
          >
            <Text style={styles.statusText}>{statusLabels[item.status]}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </ReanimatedSwipeable>
  )
}

const addItemStatusOptions: { label: string; value: PantryItemStatus }[] = [
  { label: 'In Stock', value: 'in_stock' },
  { label: 'Running Low', value: 'running_low' },
  { label: 'Out of Stock', value: 'out_of_stock' },
]

export function PantryListScreen() {
  const router = useRouter()
  const navigation = useNavigation()
  const [searchTerm, setSearchTerm] = useState('')
  const {
    items,
    mainListItems,
    plannedItems,
    isLoading,
    isRefreshing,
    error,
    refetch,
  } = usePantryItems(searchTerm)
  const [isPlannedExpanded, setIsPlannedExpanded] = useState(false)
  const updatePantryItem = useUpdatePantryItem()
  const createPantryItem = useCreatePantryItem()

  const [newItemName, setNewItemName] = useState('')
  const [newItemStatus, setNewItemStatus] =
    useState<PantryItemStatus>('in_stock')
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
      setNewItemStatus('in_stock')
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
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={openAddSheet} style={{ marginRight: 16 }}>
            <Ionicons name="add" size={28} color="#3498DB" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/pantry/settings')}
            style={{ marginRight: 8 }}
          >
            <Ionicons name="settings-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      ),
    })
  }, [navigation, router])

  const handleAddItem = () => {
    if (!newItemName.trim()) return

    createPantryItem.mutate(
      { name: newItemName.trim(), status: newItemStatus },
      {
        onSuccess: closeAddSheet,
      }
    )
  }

  const showStapleActionSheet = (item: PantryItem) => {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: ['Cancel', 'Mark as Running Low', 'Mark as Out of Stock'],
        cancelButtonIndex: 0,
        title: item.name,
      },
      (buttonIndex) => {
        if (buttonIndex === 1) {
          updatePantryItem.mutate({ itemId: item.id, status: 'running_low' })
        } else if (buttonIndex === 2) {
          updatePantryItem.mutate({ itemId: item.id, status: 'out_of_stock' })
        }
      }
    )
  }

  const showPlannedActionSheet = (item: PantryItem) => {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: [
          'Cancel',
          'Mark as Running Low',
          'Finished - Convert to Staple',
        ],
        cancelButtonIndex: 0,
        title: item.name,
      },
      (buttonIndex) => {
        if (buttonIndex === 1) {
          updatePantryItem.mutate({ itemId: item.id, status: 'running_low' })
        } else if (buttonIndex === 2) {
          updatePantryItem.mutate({
            itemId: item.id,
            itemType: 'staple',
            status: 'out_of_stock',
          })
        }
      }
    )
  }

  const navigateToItem = (item: PantryItem) => {
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

  const renderItem = useCallback(
    ({ item }: { item: PantryItem }) => (
      <PantryItemRow
        item={item}
        onPress={() => navigateToItem(item)}
        onMarkLow={() =>
          updatePantryItem.mutate({
            itemId: item.id,
            status: 'running_low',
          })
        }
        onMarkOut={() =>
          updatePantryItem.mutate({
            itemId: item.id,
            status: 'out_of_stock',
          })
        }
        onMore={() =>
          item.itemType === 'planned'
            ? showPlannedActionSheet(item)
            : showStapleActionSheet(item)
        }
      />
    ),
    [updatePantryItem]
  )

  const renderListHeader = useCallback(() => {
    if (plannedItems.length === 0) return null

    return (
      <View style={styles.plannedSection}>
        <TouchableOpacity
          style={styles.plannedHeader}
          onPress={() => setIsPlannedExpanded(!isPlannedExpanded)}
        >
          <View style={styles.plannedHeaderLeft}>
            <Text style={styles.plannedHeaderText}>Planned Items</Text>
            <View style={styles.plannedCountBadge}>
              <Text style={styles.plannedCountText}>{plannedItems.length}</Text>
            </View>
          </View>
          <Text style={styles.chevron}>{isPlannedExpanded ? '▼' : '▶'}</Text>
        </TouchableOpacity>
        {isPlannedExpanded && (
          <View style={styles.plannedContent}>
            {plannedItems.map((item) => (
              <PantryItemRow
                key={item.id}
                item={item}
                onPress={() => navigateToItem(item)}
                onMarkLow={() =>
                  updatePantryItem.mutate({
                    itemId: item.id,
                    status: 'running_low',
                  })
                }
                onMarkOut={() =>
                  updatePantryItem.mutate({
                    itemId: item.id,
                    status: 'out_of_stock',
                  })
                }
                onMore={() => showPlannedActionSheet(item)}
              />
            ))}
          </View>
        )}
      </View>
    )
  }, [plannedItems, isPlannedExpanded, updatePantryItem])

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
          <Text style={styles.emptyText}>No pantry items yet</Text>
          <Text style={styles.emptySubtext}>
            Add your first item to start tracking your pantry
          </Text>
          <TouchableOpacity style={styles.addButton} onPress={openAddSheet}>
            <Text style={styles.addButtonText}>Add Item</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search pantry items..."
              placeholderTextColor="#999"
              value={searchTerm}
              onChangeText={setSearchTerm}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchTerm.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => setSearchTerm('')}
              >
                <Text style={styles.clearButtonText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
          <FlatList
            data={mainListItems}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            ListHeaderComponent={renderListHeader}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={refetch} />
            }
          />
        </>
      )}
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={['90%']}
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
              disabled={createPantryItem.isPending}
            >
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
            <Text style={styles.sheetTitle}>Add Item</Text>
            <TouchableOpacity
              style={[
                styles.sheetHeaderButton,
                (!newItemName.trim() || createPantryItem.isPending) &&
                  styles.sheetHeaderButtonDisabled,
              ]}
              onPress={handleAddItem}
              disabled={!newItemName.trim() || createPantryItem.isPending}
            >
              {createPantryItem.isPending ? (
                <ActivityIndicator color="#3498DB" />
              ) : (
                <Ionicons
                  name="checkmark"
                  size={28}
                  color={newItemName.trim() ? '#3498DB' : '#ccc'}
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
              editable={!createPantryItem.isPending}
              onSubmitEditing={handleAddItem}
              returnKeyType="done"
            />
            <Text style={styles.sheetLabel}>Status</Text>
            <View style={styles.sheetStatusContainer}>
              {addItemStatusOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.sheetStatusButton,
                    newItemStatus === option.value &&
                      styles.sheetStatusButtonActive,
                  ]}
                  onPress={() => setNewItemStatus(option.value)}
                  disabled={createPantryItem.isPending}
                >
                  <Text
                    style={[
                      styles.sheetStatusButtonText,
                      newItemStatus === option.value &&
                        styles.sheetStatusButtonTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
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
    paddingTop: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 8,
  },
  clearButtonText: {
    fontSize: 16,
    color: '#999',
  },
  itemRow: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
  itemInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flexShrink: 1,
  },
  plannedIcon: {
    opacity: 0.8,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
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
    backgroundColor: '#3498DB',
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
    marginBottom: 24,
  },
  sheetLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  sheetStatusContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  sheetStatusButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  sheetStatusButtonActive: {
    backgroundColor: '#3498DB',
    borderColor: '#3498DB',
  },
  sheetStatusButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  sheetStatusButtonTextActive: {
    color: '#fff',
  },
  plannedSection: {
    marginBottom: 16,
    backgroundColor: '#F5F0FA',
    borderRadius: 12,
    overflow: 'hidden',
  },
  plannedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  plannedHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  plannedHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9B59B6',
  },
  plannedCountBadge: {
    backgroundColor: '#9B59B6',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  plannedCountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  chevron: {
    fontSize: 12,
    color: '#9B59B6',
  },
  plannedContent: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
})
