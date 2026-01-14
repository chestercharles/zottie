import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  ActionSheetIOS,
  Modal,
  Pressable,
  Dimensions,
} from 'react-native'
import { useState, useRef, useLayoutEffect } from 'react'
import { useRouter, useNavigation } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Swipeable, Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated'
import { usePantryItems, useUpdatePantryItem, useDeletePantryItem, useCreatePantryItem } from './hooks'
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

function PantryItemRow({
  item,
  onPress,
  onSwipeAction,
}: {
  item: PantryItem
  onPress: () => void
  onSwipeAction: (item: PantryItem) => void
}) {
  const swipeableRef = useRef<Swipeable>(null)
  const showPlannedIndicator = item.itemType === 'planned' && item.status !== 'planned'

  const renderRightActions = () => {
    return (
      <TouchableOpacity
        style={styles.swipeAction}
        onPress={() => {
          swipeableRef.current?.close()
          onSwipeAction(item)
        }}
      >
        <Ionicons name="ellipsis-horizontal" size={24} color="#fff" />
      </TouchableOpacity>
    )
  }

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      overshootRight={false}
    >
      <TouchableOpacity style={styles.itemRow} onPress={onPress}>
        <View style={styles.itemInfo}>
          <View style={styles.itemNameContainer}>
            <Text style={styles.itemName}>{item.name}</Text>
            {showPlannedIndicator && (
              <Ionicons name="pricetag-outline" size={14} color="#9B59B6" style={styles.plannedIcon} />
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
    </Swipeable>
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
  const { items, mainListItems, plannedItems, isLoading, isRefreshing, error, refetch } =
    usePantryItems(searchTerm)
  const [isPlannedExpanded, setIsPlannedExpanded] = useState(false)
  const updatePantryItem = useUpdatePantryItem()
  const deletePantryItem = useDeletePantryItem()
  const createPantryItem = useCreatePantryItem()

  const [isAddSheetVisible, setIsAddSheetVisible] = useState(false)
  const [newItemName, setNewItemName] = useState('')
  const [newItemStatus, setNewItemStatus] = useState<PantryItemStatus>('in_stock')

  const screenHeight = Dimensions.get('window').height
  const sheetTopOffset = 50
  const backdropOpacity = useSharedValue(0)
  const sheetTranslateY = useSharedValue(screenHeight)

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }))

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetTranslateY.value }],
  }))

  const openAddSheet = () => {
    setIsAddSheetVisible(true)
    backdropOpacity.value = withTiming(1, { duration: 300 })
    sheetTranslateY.value = withTiming(sheetTopOffset, { duration: 350 })
  }

  const closeAddSheet = () => {
    backdropOpacity.value = withTiming(0, { duration: 250 })
    sheetTranslateY.value = withTiming(screenHeight, { duration: 300 }, () => {
      runOnJS(setIsAddSheetVisible)(false)
      runOnJS(setNewItemName)('')
      runOnJS(setNewItemStatus)('in_stock')
    })
  }

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 0) {
        sheetTranslateY.value = sheetTopOffset + event.translationY
        backdropOpacity.value = Math.max(0, 1 - event.translationY / 300)
      }
    })
    .onEnd((event) => {
      if (event.translationY > 150 || event.velocityY > 500) {
        runOnJS(closeAddSheet)()
      } else {
        sheetTranslateY.value = withTiming(sheetTopOffset, { duration: 250 })
        backdropOpacity.value = withTiming(1, { duration: 150 })
      }
    })

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={openAddSheet}
            style={{ marginRight: 16 }}
          >
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
        options: ['Cancel', 'Mark as Running Low', 'Mark as Out of Stock', 'Delete Item'],
        destructiveButtonIndex: 3,
        cancelButtonIndex: 0,
        title: item.name,
      },
      (buttonIndex) => {
        if (buttonIndex === 1) {
          updatePantryItem.mutate({ itemId: item.id, status: 'running_low' })
        } else if (buttonIndex === 2) {
          updatePantryItem.mutate({ itemId: item.id, status: 'out_of_stock' })
        } else if (buttonIndex === 3) {
          deletePantryItem.mutate(item.id)
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
          'Finished - Remove from Pantry',
          'Finished - Convert to Staple',
          'Delete Item',
        ],
        destructiveButtonIndex: 4,
        cancelButtonIndex: 0,
        title: item.name,
      },
      (buttonIndex) => {
        if (buttonIndex === 1) {
          updatePantryItem.mutate({ itemId: item.id, status: 'running_low' })
        } else if (buttonIndex === 2) {
          deletePantryItem.mutate(item.id)
        } else if (buttonIndex === 3) {
          updatePantryItem.mutate({ itemId: item.id, itemType: 'staple', status: 'out_of_stock' })
        } else if (buttonIndex === 4) {
          deletePantryItem.mutate(item.id)
        }
      }
    )
  }

  const handleSwipeAction = (item: PantryItem) => {
    if (item.itemType === 'planned') {
      showPlannedActionSheet(item)
    } else {
      showStapleActionSheet(item)
    }
  }

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

  return (
    <View style={styles.container}>
      {items.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No pantry items yet</Text>
          <Text style={styles.emptySubtext}>
            Add your first item to start tracking your pantry
          </Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={openAddSheet}
          >
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
          <ScrollView
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={refetch} />
            }
          >
          {plannedItems.length > 0 && (
            <View style={styles.plannedSection}>
              <TouchableOpacity
                style={styles.plannedHeader}
                onPress={() => setIsPlannedExpanded(!isPlannedExpanded)}
              >
                <View style={styles.plannedHeaderLeft}>
                  <Text style={styles.plannedHeaderText}>Planned Items</Text>
                  <View style={styles.plannedCountBadge}>
                    <Text style={styles.plannedCountText}>
                      {plannedItems.length}
                    </Text>
                  </View>
                </View>
                <Text style={styles.chevron}>
                  {isPlannedExpanded ? '▼' : '▶'}
                </Text>
              </TouchableOpacity>
              {isPlannedExpanded && (
                <View style={styles.plannedContent}>
                  {plannedItems.map((item) => (
                    <PantryItemRow
                      key={item.id}
                      item={item}
                      onPress={() => navigateToItem(item)}
                      onSwipeAction={handleSwipeAction}
                    />
                  ))}
                </View>
              )}
            </View>
          )}
          {mainListItems.map((item) => (
            <PantryItemRow
              key={item.id}
              item={item}
              onPress={() => navigateToItem(item)}
              onSwipeAction={handleSwipeAction}
            />
          ))}
          </ScrollView>
        </>
      )}
      <Modal
        visible={isAddSheetVisible}
        animationType="none"
        transparent
        onRequestClose={closeAddSheet}
      >
        <View style={styles.modalContainer}>
          <Animated.View style={[styles.backdrop, backdropStyle]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={closeAddSheet} />
          </Animated.View>
          <GestureDetector gesture={panGesture}>
            <Animated.View style={[styles.sheetWrapper, sheetStyle]}>
              <View style={styles.sheet}>
                <View style={styles.sheetHandleContainer}>
                  <View style={styles.sheetHandle} />
                </View>
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
                      (!newItemName.trim() || createPantryItem.isPending) && styles.sheetHeaderButtonDisabled,
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
                <TextInput
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
                        newItemStatus === option.value && styles.sheetStatusButtonActive,
                      ]}
                      onPress={() => setNewItemStatus(option.value)}
                      disabled={createPantryItem.isPending}
                    >
                      <Text
                        style={[
                          styles.sheetStatusButtonText,
                          newItemStatus === option.value && styles.sheetStatusButtonTextActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              </View>
            </Animated.View>
          </GestureDetector>
        </View>
      </Modal>
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
  swipeAction: {
    backgroundColor: '#3498DB',
    justifyContent: 'center',
    alignItems: 'center',
    width: 60,
    marginBottom: 12,
    borderRadius: 12,
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
  modalContainer: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  sheetWrapper: {
    flex: 1,
  },
  sheet: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  sheetHandleContainer: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  sheetHandle: {
    width: 36,
    height: 5,
    backgroundColor: '#c0c0c0',
    borderRadius: 2.5,
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
