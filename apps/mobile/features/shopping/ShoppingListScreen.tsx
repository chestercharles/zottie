import {
  View,
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
  useMemo,
} from 'react'
import { useNavigation } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Reanimated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Easing,
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
import { useDeletePantryItem, useUpdatePantryItem } from '@/features/pantry/hooks'
import type { ShoppingItem, PantryItemStatus, ItemType } from './types'
import { useTheme } from '../../lib/theme'
import { Text, Button, StatusBadge, EmptyState } from '../../components/ui'

const itemTypeLabels: Record<ItemType, string> = {
  staple: 'Staple',
  planned: 'Planned',
}

const SHEET_SNAP_POINTS = ['90%']

const DELETE_BUTTON_WIDTH = 80
const REVEAL_THRESHOLD = 40

function ShoppingItemRow({
  item,
  isChecked,
  onToggleCheck,
  onSwipeAction,
  colors,
  spacing,
  radius,
}: {
  item: ShoppingItem
  isChecked: boolean
  onToggleCheck: () => void
  onSwipeAction: () => void
  colors: ReturnType<typeof useTheme>['colors']
  spacing: ReturnType<typeof useTheme>['spacing']
  radius: ReturnType<typeof useTheme>['radius']
}) {
  const translateX = useSharedValue(0)
  const isOpen = useSharedValue(false)

  const isStaple = item.itemType === 'staple'

  const closeRow = useCallback(() => {
    translateX.value = withSpring(0, { damping: 20, stiffness: 300 })
    isOpen.value = false
  }, [translateX, isOpen])

  const handleSwipeAction = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    translateX.value = withTiming(-400, { duration: 200, easing: Easing.out(Easing.ease) }, () => {
      runOnJS(onSwipeAction)()
    })
  }, [onSwipeAction, translateX])

  const handleRowPress = useCallback(() => {
    if (isOpen.value) {
      closeRow()
    } else {
      onToggleCheck()
    }
  }, [isOpen, closeRow, onToggleCheck])

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-5, 5])
    .onUpdate((event) => {
      const startX = isOpen.value ? -DELETE_BUTTON_WIDTH : 0
      const newX = startX + event.translationX
      translateX.value = Math.max(-DELETE_BUTTON_WIDTH, Math.min(0, newX))
    })
    .onEnd((event) => {
      const startX = isOpen.value ? -DELETE_BUTTON_WIDTH : 0
      const finalX = startX + event.translationX

      if (finalX < -REVEAL_THRESHOLD) {
        translateX.value = withSpring(-DELETE_BUTTON_WIDTH, { damping: 20, stiffness: 300 })
        isOpen.value = true
      } else {
        translateX.value = withSpring(0, { damping: 20, stiffness: 300 })
        isOpen.value = false
      }
    })

  const rowAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }))

  const deleteButtonStyle = useAnimatedStyle(() => {
    const progress = interpolate(
      Math.abs(translateX.value),
      [0, DELETE_BUTTON_WIDTH],
      [0, 1],
      'clamp'
    )
    return {
      opacity: progress,
    }
  })

  return (
    <View style={[styles.swipeContainer, { marginBottom: spacing.sm }]}>
      <Reanimated.View
        style={[
          styles.swipeActionContainer,
          { backgroundColor: isStaple ? colors.feedback.success : colors.feedback.error, borderRadius: radius.lg },
          deleteButtonStyle,
        ]}
      >
        <TouchableOpacity
          style={styles.swipeActionButton}
          onPress={handleSwipeAction}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={isStaple ? 'Mark as in stock' : 'Delete item'}
        >
          <Ionicons name="trash" size={24} color={colors.text.inverse} />
        </TouchableOpacity>
      </Reanimated.View>

      <GestureDetector gesture={panGesture}>
        <Reanimated.View style={rowAnimatedStyle}>
          <TouchableOpacity
            style={[
              styles.itemRow,
              {
                backgroundColor: colors.surface.grouped,
                borderRadius: radius.lg,
                padding: spacing.md,
              },
            ]}
            onPress={handleRowPress}
            activeOpacity={0.7}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isChecked }}
            accessibilityLabel={`${item.name}, ${isChecked ? 'checked' : 'unchecked'}`}
          >
            <View style={{ marginRight: spacing.sm }}>
              <Ionicons
                name={isChecked ? 'checkbox' : 'square-outline'}
                size={24}
                color={isChecked ? colors.feedback.success : colors.text.tertiary}
              />
            </View>
            <View style={styles.itemContent}>
              <View style={styles.itemDetails}>
                <Text
                  variant="body.primary"
                  style={[
                    styles.itemName,
                    isChecked && {
                      textDecorationLine: 'line-through',
                      color: colors.text.tertiary,
                    },
                  ]}
                >
                  {item.name}
                </Text>
                <Text variant="caption" color="secondary" style={{ marginTop: 2 }}>
                  {itemTypeLabels[item.itemType]}
                </Text>
              </View>
              <View style={{ marginLeft: spacing.sm }}>
                <StatusBadge status={item.status} />
              </View>
            </View>
          </TouchableOpacity>
        </Reanimated.View>
      </GestureDetector>
    </View>
  )
}

export function ShoppingListScreen() {
  const navigation = useNavigation()
  const { colors, spacing, radius, typography } = useTheme()
  const { items, isLoading, isRefreshing, error, refetch } = useShoppingItems()
  const markAsPurchasedMutation = useMarkAsPurchased()
  const createPlannedItemMutation = useCreatePlannedItem()
  const deletePantryItem = useDeletePantryItem()
  const updatePantryItem = useUpdatePantryItem()
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

  useLayoutEffect(() => {
    const parent = navigation.getParent()
    parent?.setOptions({
      headerRight: ({ tintColor }: { tintColor?: string }) => (
        <TouchableOpacity
          onPress={openAddSheet}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Add item"
        >
          <Ionicons name="add" size={28} color={tintColor} />
        </TouchableOpacity>
      ),
    })
  }, [navigation, openAddSheet])

  const renderBackdrop = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        pressBehavior="close"
        enableTouchThrough={false}
      />
    ),
    []
  )


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

  const handleSwipeAction = useCallback((item: ShoppingItem) => {
    if (item.itemType === 'staple') {
      updatePantryItem.mutate({ itemId: item.id, status: 'in_stock' })
    } else {
      deletePantryItem.mutate(item.id)
    }
  }, [updatePantryItem, deletePantryItem])

  const checkedCount = checkedIds.size

  const sortedItems = useMemo(() => {
    const unchecked = items.filter(item => !checkedIds.has(item.id))
    const checked = items.filter(item => checkedIds.has(item.id))
    return [...unchecked, ...checked]
  }, [items, checkedIds])

  if (isLoading) {
    return (
      <View
        style={[
          styles.centered,
          { backgroundColor: colors.surface.background, padding: spacing.lg },
        ]}
      >
        <ActivityIndicator size="large" color={colors.action.primary} />
      </View>
    )
  }

  if (error) {
    return (
      <View
        style={[
          styles.centered,
          { backgroundColor: colors.surface.background, padding: spacing.lg },
        ]}
      >
        <Text
          variant="body.primary"
          style={{ color: colors.feedback.error, textAlign: 'center', marginBottom: spacing.md }}
        >
          {error}
        </Text>
        <Button title="Retry" onPress={() => refetch()} />
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface.background }]}>
      {items.length === 0 ? (
        <EmptyState
          title="You're all set!"
          message="Items that are running low or out of stock will appear here."
          action={<Button title="Add Planned Item" onPress={openAddSheet} />}
        />
      ) : (
        <FlatList
          data={sortedItems}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ShoppingItemRow
              item={item}
              isChecked={checkedIds.has(item.id)}
              onToggleCheck={() => handleToggleCheck(item.id)}
              onSwipeAction={() => handleSwipeAction(item)}
              colors={colors}
              spacing={spacing}
              radius={radius}
            />
          )}
          contentContainerStyle={{ padding: spacing.md }}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={refetch} />
          }
        />
      )}
      {checkedCount > 0 && (
        <View
          style={[
            styles.purchaseButtonContainer,
            {
              padding: spacing.md,
              paddingBottom: spacing.xl,
              backgroundColor: colors.surface.background,
              borderTopColor: colors.border.subtle,
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.purchaseButton,
              {
                backgroundColor: markAsPurchasedMutation.isPending
                  ? colors.action.disabled
                  : colors.feedback.success,
                paddingVertical: spacing.md,
                paddingHorizontal: spacing.lg,
                borderRadius: radius.lg,
              },
            ]}
            onPress={handleMarkAsPurchased}
            disabled={markAsPurchasedMutation.isPending}
            accessibilityRole="button"
            accessibilityLabel={`Mark ${checkedIds.size} ${checkedIds.size === 1 ? 'item' : 'items'} as purchased`}
          >
            {markAsPurchasedMutation.isPending ? (
              <ActivityIndicator size="small" color={colors.text.inverse} />
            ) : (
              <>
                <Ionicons
                  name="cart"
                  size={20}
                  color={colors.text.inverse}
                  style={{ marginRight: spacing.sm }}
                />
                <Text variant="body.primary" color="inverse" style={styles.purchaseButtonText}>
                  Mark {checkedCount} {checkedCount === 1 ? 'item' : 'items'} as
                  purchased
                </Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.resetButton, { paddingVertical: spacing.sm, marginTop: spacing.sm }]}
            onPress={handleResetCheckmarks}
            disabled={markAsPurchasedMutation.isPending}
            accessibilityRole="button"
            accessibilityLabel="Reset checkmarks"
          >
            <Ionicons
              name="refresh"
              size={16}
              color={colors.text.secondary}
              style={{ marginRight: spacing.xs }}
            />
            <Text variant="body.secondary" color="secondary">
              Reset checkmarks
            </Text>
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
        backgroundStyle={{ backgroundColor: colors.surface.elevated }}
        handleIndicatorStyle={{ backgroundColor: colors.border.strong }}
      >
        <BottomSheetView style={styles.sheetContent}>
          <View
            style={[
              styles.sheetHeader,
              {
                paddingHorizontal: spacing.md,
                paddingTop: spacing.sm,
                paddingBottom: spacing.sm,
                borderBottomColor: colors.border.subtle,
              },
            ]}
          >
            <TouchableOpacity
              style={styles.sheetHeaderButton}
              onPress={closeAddSheet}
              disabled={createPlannedItemMutation.isPending}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={28} color={colors.text.primary} />
            </TouchableOpacity>
            <Text variant="title.small">Add Planned Item</Text>
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
              accessibilityRole="button"
              accessibilityLabel="Save item"
            >
              {createPlannedItemMutation.isPending ? (
                <ActivityIndicator color={colors.action.primary} />
              ) : (
                <Ionicons
                  name="checkmark"
                  size={28}
                  color={newItemName.trim() ? colors.action.primary : colors.action.disabled}
                />
              )}
            </TouchableOpacity>
          </View>
          <View style={[styles.sheetBody, { padding: spacing.lg }]}>
            <BottomSheetTextInput
              style={[
                styles.sheetInput,
                {
                  borderColor: colors.border.subtle,
                  borderRadius: radius.sm,
                  paddingVertical: spacing.sm,
                  paddingHorizontal: spacing.md,
                  color: colors.text.primary,
                  backgroundColor: colors.surface.background,
                  fontSize: typography.body.primary.fontSize,
                },
              ]}
              value={newItemName}
              onChangeText={setNewItemName}
              placeholder="Item name"
              placeholderTextColor={colors.text.tertiary}
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
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontWeight: '600',
  },
  purchaseButtonContainer: {
    borderTopWidth: 1,
  },
  purchaseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  purchaseButtonText: {
    fontWeight: '600',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetContent: {
    flex: 1,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
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
  sheetBody: {},
  sheetInput: {
    borderWidth: 1,
    minHeight: 44,
  },
  swipeContainer: {
    position: 'relative',
  },
  swipeActionContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: DELETE_BUTTON_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeActionButton: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
})
