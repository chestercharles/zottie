import {
  View,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { useLayoutEffect, useCallback } from 'react'
import { useRouter, useNavigation } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useGotos } from './hooks'
import { useHouseholdMembership } from '@/features/household/hooks/useHouseholdMembership'
import type { Goto } from './types'
import { Text, Button, EmptyState } from '@/components'
import { useTheme } from '@/lib/theme'

function GotoCard({
  item,
  onPress,
  creatorName,
  colors,
  spacing,
  radius,
}: {
  item: Goto
  onPress: () => void
  creatorName: string | null
  colors: ReturnType<typeof useTheme>['colors']
  spacing: ReturnType<typeof useTheme>['spacing']
  radius: ReturnType<typeof useTheme>['radius']
}) {
  const needsPreview =
    item.needs.length > 80 ? item.needs.slice(0, 80) + '...' : item.needs

  return (
    <TouchableOpacity
      style={{
        backgroundColor: colors.surface.grouped,
        borderRadius: radius.lg,
        padding: spacing.md,
        marginBottom: spacing.sm,
      }}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${item.name}. ${needsPreview}`}
    >
      <Text variant="body.primary" style={{ fontWeight: '600' }}>
        {item.name}
      </Text>
      <Text
        variant="body.secondary"
        color="secondary"
        style={{ marginTop: spacing.xs }}
        numberOfLines={2}
      >
        {item.needs}
      </Text>
      {creatorName && (
        <Text
          variant="caption"
          color="tertiary"
          style={{ marginTop: spacing.sm }}
        >
          by {creatorName}
        </Text>
      )}
    </TouchableOpacity>
  )
}

export function GotosListScreen() {
  const router = useRouter()
  const navigation = useNavigation()
  const { colors, spacing, radius } = useTheme()
  const { gotos, isLoading, isRefreshing, error, refetch } = useGotos()
  const { members } = useHouseholdMembership()

  const getCreatorName = useCallback(
    (createdBy: string) => {
      const member = members.find((m) => m.userId === createdBy)
      return member?.name || null
    },
    [members]
  )

  const openCreateScreen = useCallback(() => {
    router.push('/gotos/create')
  }, [router])

  useLayoutEffect(() => {
    const parent = navigation.getParent()
    parent?.setOptions({
      headerRight: ({ tintColor }: { tintColor?: string }) => (
        <TouchableOpacity
          onPress={openCreateScreen}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Add go-to"
        >
          <Ionicons name="add" size={28} color={tintColor} />
        </TouchableOpacity>
      ),
    })
  }, [navigation, openCreateScreen])

  const navigateToGoto = useCallback(
    (item: Goto) => {
      router.push({
        pathname: '/gotos/[id]',
        params: {
          id: item.id,
          name: item.name,
          needs: item.needs,
          createdBy: item.createdBy,
          createdAt: item.createdAt.toString(),
          updatedAt: item.updatedAt.toString(),
        },
      })
    },
    [router]
  )

  const renderItem = useCallback(
    ({ item }: { item: Goto }) => (
      <GotoCard
        item={item}
        onPress={() => navigateToGoto(item)}
        creatorName={getCreatorName(item.createdBy)}
        colors={colors}
        spacing={spacing}
        radius={radius}
      />
    ),
    [navigateToGoto, getCreatorName, colors, spacing, radius]
  )

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
      <FlatList
        data={gotos}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <EmptyState
            title="No go-tos yet"
            message="Save your favorite meals here for quick access when planning your shopping list."
            action={
              <Button
                title="Add your first go-to"
                onPress={openCreateScreen}
              />
            }
          />
        }
        contentContainerStyle={{
          padding: spacing.md,
          flexGrow: 1,
        }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refetch} />
        }
      />
    </View>
  )
}
