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
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useState, useRef, useLayoutEffect } from 'react'
import { useRouter, useNavigation } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Swipeable } from 'react-native-gesture-handler'
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
  const nameInputRef = useRef<TextInput>(null)

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => setIsAddSheetVisible(true)}
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
        onSuccess: () => {
          setIsAddSheetVisible(false)
          setNewItemName('')
          setNewItemStatus('in_stock')
        },
      }
    )
  }

  const closeAddSheet = () => {
    setIsAddSheetVisible(false)
    setNewItemName('')
    setNewItemStatus('in_stock')
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
            onPress={() => setIsAddSheetVisible(true)}
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
        animationType="slide"
        transparent
        onRequestClose={closeAddSheet}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <Pressable style={styles.backdrop} onPress={closeAddSheet} />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Add Item</Text>
            <TextInput
              ref={nameInputRef}
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
            <TouchableOpacity
              style={[
                styles.sheetAddButton,
                (!newItemName.trim() || createPantryItem.isPending) && styles.sheetAddButtonDisabled,
              ]}
              onPress={handleAddItem}
              disabled={!newItemName.trim() || createPantryItem.isPending}
            >
              {createPantryItem.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.sheetAddButtonText}>Add</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
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
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
    paddingBottom: 40,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#ddd',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  sheetInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
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
    marginBottom: 24,
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
  sheetAddButton: {
    backgroundColor: '#27AE60',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  sheetAddButtonDisabled: {
    opacity: 0.5,
  },
  sheetAddButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
