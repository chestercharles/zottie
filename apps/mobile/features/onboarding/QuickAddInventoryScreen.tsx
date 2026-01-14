import { useState } from 'react'
import {
  Text,
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
    <View style={styles.container}>
      <View
        style={[styles.header, { paddingTop: Math.max(insets.top, 16) + 16 }]}
      >
        <View style={styles.headerContent}>
          <Ionicons name="basket" size={32} color="#3498DB" />
          <Text style={styles.title}>Quick Add Pantry Items</Text>
          <Text style={styles.subtitle}>
            Tap items you have in your pantry. You can adjust quantities and
            statuses later.
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {curatedPantryItems.map((category) => (
          <View key={category.name} style={styles.category}>
            <Text style={styles.categoryName}>{category.name}</Text>
            <View style={styles.itemsGrid}>
              {category.items.map((item) => {
                const isSelected = selectedItems.has(item)
                return (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.itemButton,
                      isSelected && styles.itemButtonSelected,
                    ]}
                    onPress={() => toggleItem(item)}
                    disabled={isAdding}
                  >
                    <Text
                      style={[
                        styles.itemText,
                        isSelected && styles.itemTextSelected,
                      ]}
                    >
                      {item}
                    </Text>
                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color="#3498DB"
                        style={styles.checkmark}
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
          { paddingBottom: Math.max(insets.bottom, 16) + 16 },
        ]}
      >
        <View style={styles.selectedCount}>
          <Text style={styles.selectedCountText}>
            {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''}{' '}
            selected
          </Text>
        </View>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            disabled={isAdding}
          >
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.addButton,
              selectedItems.size === 0 && styles.disabledButton,
            ]}
            onPress={handleAddItems}
            disabled={isAdding || selectedItems.size === 0}
          >
            {isAdding ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.addButtonText}>
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
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerContent: {
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  subtitle: {
    fontSize: 14,
    color: '#7F8C8D',
    lineHeight: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  category: {
    marginBottom: 24,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 12,
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  itemButton: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemButtonSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#3498DB',
  },
  itemText: {
    fontSize: 14,
    color: '#2C3E50',
  },
  itemTextSelected: {
    color: '#3498DB',
    fontWeight: '600',
  },
  checkmark: {
    marginLeft: 2,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#fff',
  },
  selectedCount: {
    alignItems: 'center',
    marginBottom: 12,
  },
  selectedCountText: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  skipButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#7F8C8D',
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    flex: 2,
    backgroundColor: '#3498DB',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})
