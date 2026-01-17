import {
  View,
  TouchableOpacity,
  Pressable,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  ActionSheetIOS,
  TextInput as RNTextInput,
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
import { Text, Button, StatusBadge, EmptyState } from '@/components'
import { useTheme } from '@/lib/theme'

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
  textColor,
}: {
  label: string
  icon: keyof typeof Ionicons.glyphMap
  color: string
  onPress: () => void
  drag: SharedValue<number>
  position: number
  totalWidth: number
  buttonCount?: number
  textColor: string
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
      style={[
        {
          height: '100%',
          justifyContent: 'center',
          alignItems: 'center',
          width: buttonWidth,
        },
        animatedStyle,
      ]}
    >
      <TouchableOpacity
        style={{
          flex: 1,
          width: '100%',
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: 8,
          marginHorizontal: 2,
          gap: 4,
          backgroundColor: color,
        }}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <Ionicons name={icon} size={22} color={textColor} />
        <Text
          variant="caption"
          color="inverse"
          style={{ fontWeight: '600' }}
        >
          {label}
        </Text>
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
  colors,
  spacing,
  radius,
}: {
  item: PantryItem
  onPress: () => void
  onMarkLow: () => void
  onMarkOut: () => void
  onMore: () => void
  colors: ReturnType<typeof useTheme>['colors']
  spacing: ReturnType<typeof useTheme>['spacing']
  radius: ReturnType<typeof useTheme>['radius']
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
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: spacing.sm + 4,
          width: actionsWidth,
        }}
        onLayout={() => {
          checkSwipeThreshold()
        }}
      >
        {isStaple ? (
          <>
            <SwipeActionButton
              label="Low"
              icon="alert-circle"
              color={colors.feedback.warning}
              textColor={colors.text.inverse}
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
              color={colors.feedback.error}
              textColor={colors.text.inverse}
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
            color={colors.action.primary}
            textColor={colors.text.inverse}
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
      <TouchableOpacity
        style={{
          backgroundColor: colors.surface.grouped,
          borderRadius: radius.lg,
          padding: spacing.md,
          marginBottom: spacing.sm + 4,
        }}
        onPress={onPress}
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              flex: 1,
              gap: spacing.xs + 2,
            }}
          >
            <Text
              variant="body.primary"
              style={{ fontWeight: '600', flexShrink: 1 }}
            >
              {item.name}
            </Text>
            {showPlannedIndicator && (
              <Ionicons
                name="pricetag-outline"
                size={14}
                color={colors.feedback.info}
                style={{ opacity: 0.8 }}
              />
            )}
          </View>
          <StatusBadge status={item.status} />
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
  const { colors, spacing, radius, typography } = useTheme()
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
          <Pressable
            onPress={openAddSheet}
            style={{ marginRight: spacing.md, padding: spacing.xs }}
            hitSlop={8}
          >
            <Ionicons name="add" size={28} color={colors.action.primary} />
          </Pressable>
          <Pressable
            onPress={() => router.push('/pantry/settings')}
            style={{ marginRight: spacing.sm, padding: spacing.xs }}
            hitSlop={8}
          >
            <Ionicons
              name="settings-outline"
              size={24}
              color={colors.text.primary}
            />
          </Pressable>
        </View>
      ),
    })
  }, [navigation, router, colors, spacing])

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
        colors={colors}
        spacing={spacing}
        radius={radius}
      />
    ),
    [updatePantryItem, colors, spacing, radius]
  )

  const renderListHeader = useCallback(() => {
    if (plannedItems.length === 0) return null

    return (
      <View
        style={{
          marginBottom: spacing.md,
          backgroundColor: colors.surface.grouped,
          borderRadius: radius.lg,
          overflow: 'hidden',
        }}
      >
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: spacing.md,
          }}
          onPress={() => setIsPlannedExpanded(!isPlannedExpanded)}
          accessibilityRole="button"
          accessibilityLabel={`Planned Items. ${plannedItems.length} items. ${isPlannedExpanded ? 'Collapse' : 'Expand'}`}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
            }}
          >
            <Text
              variant="body.primary"
              style={{ fontWeight: '600', color: colors.feedback.info }}
            >
              Planned Items
            </Text>
            <View
              style={{
                backgroundColor: colors.feedback.info,
                paddingVertical: 2,
                paddingHorizontal: spacing.sm,
                borderRadius: 10,
              }}
            >
              <Text variant="caption" color="inverse" style={{ fontWeight: '600' }}>
                {plannedItems.length}
              </Text>
            </View>
          </View>
          <Text
            variant="caption"
            style={{ color: colors.feedback.info }}
          >
            {isPlannedExpanded ? '▼' : '▶'}
          </Text>
        </TouchableOpacity>
        {isPlannedExpanded && (
          <View
            style={{
              paddingHorizontal: spacing.sm + 4,
              paddingBottom: spacing.sm + 4,
            }}
          >
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
                colors={colors}
                spacing={spacing}
                radius={radius}
              />
            ))}
          </View>
        )}
      </View>
    )
  }, [plannedItems, isPlannedExpanded, updatePantryItem, colors, spacing, radius])

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.surface.background,
          padding: spacing.lg,
        }}
      >
        <ActivityIndicator size="large" color={colors.action.primary} />
      </View>
    )
  }

  if (error) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.surface.background,
          padding: spacing.lg,
        }}
      >
        <Text
          variant="body.primary"
          style={{
            color: colors.feedback.error,
            textAlign: 'center',
            marginBottom: spacing.md,
          }}
        >
          {error}
        </Text>
        <Button title="Retry" onPress={() => refetch()} />
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface.background }}>
      {items.length === 0 ? (
        <EmptyState
          title="No pantry items yet"
          message="Add your first item to start tracking your pantry"
          action={<Button title="Add Item" onPress={openAddSheet} />}
        />
      ) : (
        <>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.surface.grouped,
              borderRadius: radius.lg,
              marginHorizontal: spacing.md,
              marginTop: spacing.md,
              paddingHorizontal: spacing.sm + 4,
            }}
          >
            <RNTextInput
              style={{
                flex: 1,
                height: 44,
                fontSize: typography.body.primary.fontSize,
                color: colors.text.primary,
              }}
              placeholder="Search pantry items..."
              placeholderTextColor={colors.text.tertiary}
              value={searchTerm}
              onChangeText={setSearchTerm}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchTerm.length > 0 && (
              <TouchableOpacity
                style={{ padding: spacing.sm }}
                onPress={() => setSearchTerm('')}
                accessibilityRole="button"
                accessibilityLabel="Clear search"
              >
                <Text variant="body.primary" color="tertiary">
                  ✕
                </Text>
              </TouchableOpacity>
            )}
          </View>
          <FlatList
            data={mainListItems}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            ListHeaderComponent={renderListHeader}
            contentContainerStyle={{
              padding: spacing.md,
              paddingTop: spacing.sm,
            }}
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
        handleIndicatorStyle={{ backgroundColor: colors.border.strong }}
      >
        <BottomSheetView style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: spacing.md,
              paddingTop: spacing.sm,
              paddingBottom: spacing.sm + 4,
              borderBottomWidth: 0.5,
              borderBottomColor: colors.border.subtle,
            }}
          >
            <TouchableOpacity
              style={{
                width: 44,
                height: 44,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onPress={closeAddSheet}
              disabled={createPantryItem.isPending}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={28} color={colors.text.primary} />
            </TouchableOpacity>
            <Text variant="title.small">Add Item</Text>
            <TouchableOpacity
              style={{
                width: 44,
                height: 44,
                alignItems: 'center',
                justifyContent: 'center',
                opacity:
                  !newItemName.trim() || createPantryItem.isPending ? 0.5 : 1,
              }}
              onPress={handleAddItem}
              disabled={!newItemName.trim() || createPantryItem.isPending}
              accessibilityRole="button"
              accessibilityLabel="Save item"
            >
              {createPantryItem.isPending ? (
                <ActivityIndicator color={colors.action.primary} />
              ) : (
                <Ionicons
                  name="checkmark"
                  size={28}
                  color={
                    newItemName.trim()
                      ? colors.action.primary
                      : colors.action.disabled
                  }
                />
              )}
            </TouchableOpacity>
          </View>
          <View style={{ padding: spacing.lg }}>
            <BottomSheetTextInput
              style={{
                borderWidth: 1,
                borderColor: colors.border.subtle,
                borderRadius: radius.sm,
                paddingVertical: spacing.sm + 4,
                paddingHorizontal: spacing.md,
                fontSize: typography.body.primary.fontSize,
                marginBottom: spacing.lg,
                color: colors.text.primary,
              }}
              value={newItemName}
              onChangeText={setNewItemName}
              placeholder="Item name"
              placeholderTextColor={colors.text.tertiary}
              editable={!createPantryItem.isPending}
              onSubmitEditing={handleAddItem}
              returnKeyType="done"
            />
            <Text
              variant="body.secondary"
              color="secondary"
              style={{ fontWeight: '600', marginBottom: spacing.sm }}
            >
              Status
            </Text>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              {addItemStatusOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={{
                    flex: 1,
                    paddingVertical: spacing.sm + 2,
                    paddingHorizontal: spacing.sm,
                    borderRadius: radius.sm,
                    borderWidth: 1,
                    borderColor:
                      newItemStatus === option.value
                        ? colors.action.primary
                        : colors.border.subtle,
                    backgroundColor:
                      newItemStatus === option.value
                        ? colors.action.primary
                        : 'transparent',
                    alignItems: 'center',
                  }}
                  onPress={() => setNewItemStatus(option.value)}
                  disabled={createPantryItem.isPending}
                >
                  <Text
                    variant="caption"
                    style={{
                      fontWeight: '600',
                      color:
                        newItemStatus === option.value
                          ? colors.text.inverse
                          : colors.text.secondary,
                    }}
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
