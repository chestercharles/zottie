import { useState } from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth0 } from 'react-native-auth0'
import { Ionicons } from '@expo/vector-icons'
import { curatedPantryItems } from './curatedItems'
import { useAuth } from '@/features/auth'
import { createPantryItem } from '@/features/pantry/api'
import { queryClient } from '@/lib/query/client'
import { queryKeys } from '@/lib/query/keys'
import { Text, Button } from '@/components'
import { useTheme } from '@/lib/theme'

interface QuickAddInventoryScreenProps {
  onComplete: () => void
}

export function QuickAddInventoryScreen({
  onComplete,
}: QuickAddInventoryScreenProps) {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [isAdding, setIsAdding] = useState(false)
  const insets = useSafeAreaInsets()
  const { getCredentials } = useAuth0()
  const { user } = useAuth()
  const { colors, spacing, radius } = useTheme()

  const toggleItem = (item: string) => {
    setSelectedItems((prev) => {
      const next = new Set(prev)
      if (next.has(item)) {
        next.delete(item)
      } else {
        next.add(item)
      }
      return next
    })
  }

  const handleSkip = () => {
    onComplete()
  }

  const handleAddItems = async () => {
    if (selectedItems.size === 0) {
      onComplete()
      return
    }

    setIsAdding(true)
    try {
      const creds = await getCredentials()
      if (!creds?.accessToken || !user?.id) {
        throw new Error('Not authenticated')
      }

      // WARNING: This makes N individual API calls in parallel (e.g., 30 items = 30 requests).
      // If any fail, Promise.all rejects but some items may already be created (partial failure).
      // Consider adding a bulk create endpoint if this becomes a problem.
      await Promise.all(
        Array.from(selectedItems).map((itemName) =>
          createPantryItem(
            {
              name: itemName,
              status: 'in_stock',
              itemType: 'staple',
            },
            creds.accessToken,
            user.id
          )
        )
      )

      await queryClient.invalidateQueries({
        queryKey: queryKeys.pantryItems(user.id),
      })

      onComplete()
    } catch (err) {
      Alert.alert(
        'Unable to Add Items',
        err instanceof Error ? err.message : 'Failed to add pantry items'
      )
      setIsAdding(false)
    }
  }

  return (
    <View
      style={[styles.container, { backgroundColor: colors.surface.background }]}
    >
      <View
        style={[
          styles.header,
          {
            paddingTop: Math.max(insets.top, spacing.md) + spacing.md,
            paddingHorizontal: spacing.lg,
            paddingBottom: spacing.md,
            borderBottomColor: colors.border.subtle,
          },
        ]}
      >
        <View style={{ gap: spacing.sm }}>
          <Ionicons name="basket" size={32} color={colors.action.primary} />
          <Text variant="title.large">Quick Add Pantry Items</Text>
          <Text variant="body.secondary" color="secondary">
            Tap items you have in your pantry. You can adjust quantities and
            statuses later.
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
        }}
        showsVerticalScrollIndicator={false}
      >
        {curatedPantryItems.map((category) => (
          <View key={category.name} style={{ marginBottom: spacing.lg }}>
            <Text
              variant="title.small"
              style={{ marginBottom: spacing.sm + spacing.xs }}
            >
              {category.name}
            </Text>
            <View style={[styles.itemsGrid, { gap: spacing.sm }]}>
              {category.items.map((item) => {
                const isSelected = selectedItems.has(item)
                return (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.itemButton,
                      {
                        backgroundColor: isSelected
                          ? colors.surface.grouped
                          : colors.surface.background,
                        borderColor: isSelected
                          ? colors.action.primary
                          : colors.border.subtle,
                        borderRadius: 20,
                        paddingVertical: spacing.sm,
                        paddingHorizontal: spacing.md,
                        gap: spacing.xs,
                      },
                    ]}
                    onPress={() => toggleItem(item)}
                    disabled={isAdding}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isSelected }}
                    accessibilityLabel={item}
                  >
                    <Text
                      variant="body.secondary"
                      style={{
                        color: isSelected
                          ? colors.action.primary
                          : colors.text.primary,
                        fontWeight: isSelected ? '600' : '400',
                      }}
                    >
                      {item}
                    </Text>
                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={colors.action.primary}
                        style={{ marginLeft: 2 }}
                      />
                    )}
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>
        ))}
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.md,
            paddingBottom: Math.max(insets.bottom, spacing.md) + spacing.md,
            borderTopColor: colors.border.subtle,
            backgroundColor: colors.surface.background,
          },
        ]}
      >
        <View
          style={{
            alignItems: 'center',
            marginBottom: spacing.sm + spacing.xs,
          }}
        >
          <Text variant="body.secondary" color="secondary">
            {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''}{' '}
            selected
          </Text>
        </View>
        <View style={[styles.buttonRow, { gap: spacing.sm + spacing.xs }]}>
          <Button
            variant="secondary"
            title="Skip"
            onPress={handleSkip}
            disabled={isAdding}
            style={{ flex: 1 }}
          />
          <TouchableOpacity
            style={[
              styles.addButton,
              {
                backgroundColor:
                  isAdding || selectedItems.size === 0
                    ? colors.action.disabled
                    : colors.action.primary,
                borderRadius: radius.md,
                paddingVertical: spacing.sm + spacing.xs,
              },
            ]}
            onPress={handleAddItems}
            disabled={isAdding || selectedItems.size === 0}
            accessibilityRole="button"
            accessibilityLabel={
              selectedItems.size === 0
                ? 'Continue'
                : `Add ${selectedItems.size} items to pantry`
            }
          >
            {isAdding ? (
              <ActivityIndicator size="small" color={colors.text.inverse} />
            ) : (
              <Text
                variant="body.primary"
                color="inverse"
                style={{ fontWeight: '600' }}
              >
                {selectedItems.size === 0 ? 'Continue' : 'Add to Pantry'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
  },
  scrollView: {
    flex: 1,
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  itemButton: {
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  footer: {
    borderTopWidth: 1,
  },
  buttonRow: {
    flexDirection: 'row',
  },
  addButton: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
})
