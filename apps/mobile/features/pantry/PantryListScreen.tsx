import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native'
import { useState } from 'react'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { usePantryItems } from './hooks'
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
}: {
  item: PantryItem
  onPress: () => void
}) {
  const showPlannedIndicator = item.itemType === 'planned' && item.status !== 'planned'

  return (
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
  )
}

export function PantryListScreen() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const { items, mainListItems, plannedItems, isLoading, isRefreshing, error, refetch } =
    usePantryItems(searchTerm)
  const [isPlannedExpanded, setIsPlannedExpanded] = useState(false)

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
            onPress={() => router.push('/pantry/create')}
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
            />
          ))}
          </ScrollView>
        </>
      )}
      {items.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/pantry/create')}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
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
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3498DB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  fabText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '400',
    lineHeight: 30,
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
