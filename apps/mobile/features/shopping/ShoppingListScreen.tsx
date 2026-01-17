import {
  View,
  StyleSheet,
  TouchableOpacity,
  Pressable,
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
import { useTheme } from '../../lib/theme'
import { Text, Button, StatusBadge, EmptyState } from '../../components/ui'

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
  textColor,
  onPress,
  drag,
  position,
  totalWidth,
}: {
  label: string
  icon: keyof typeof Ionicons.glyphMap
  color: string
  textColor: string
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
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <Ionicons name={icon} size={22} color={textColor} />
        <Text variant="caption" color="inverse" style={styles.swipeActionLabel}>
          {label}
        </Text>
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
  colors,
  spacing,
  radius,
}: {
  item: ShoppingItem
  isChecked: boolean
  onPress: () => void
  onToggleCheck: () => void
  onMarkPurchased: () => void
  onDelete: () => void
  colors: ReturnType<typeof useTheme>['colors']
  spacing: ReturnType<typeof useTheme>['spacing']
  radius: ReturnType<typeof useTheme>['radius']
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
          color={colors.feedback.success}
          textColor={colors.text.inverse}
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
          color={colors.feedback.error}
          textColor={colors.text.inverse}
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
      <View
        style={[
          styles.itemRow,
          {
            backgroundColor: colors.surface.grouped,
            borderRadius: radius.lg,
            padding: spacing.md,
            marginBottom: spacing.sm,
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.checkbox, { marginRight: spacing.sm }]}
          onPress={onToggleCheck}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: isChecked }}
          accessibilityLabel={`${item.name}`}
        >
          <Ionicons
            name={isChecked ? 'checkbox' : 'square-outline'}
            size={24}
            color={isChecked ? colors.feedback.success : colors.text.tertiary}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.itemContent} onPress={onPress}>
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
        </TouchableOpacity>
      </View>
    </ReanimatedSwipeable>
  )
}

export function ShoppingListScreen() {
  const router = useRouter()
  const navigation = useNavigation()
  const { colors, spacing, radius, typography } = useTheme()
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

  useLayoutEffect(() => {
    const parent = navigation.getParent()
    parent?.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={openAddSheet}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Add item"
        >
          <Ionicons name="add" size={28} color={colors.action.primary} />
        </TouchableOpacity>
      ),
    })
  }, [navigation, openAddSheet, colors])

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

  const checkedCount = checkedIds.size

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
  checkbox: {},
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
    fontWeight: '600',
  },
})
