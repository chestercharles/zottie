import { Tabs, Redirect, useRouter } from 'expo-router'
import { useAuth } from '@/features/auth'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '@/lib/theme'
import { View, TouchableOpacity, StyleSheet } from 'react-native'

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 12,
  },
})

export default function AuthenticatedLayout() {
  const { isAuthenticated, isLoading } = useAuth()
  const { colors } = useTheme()
  const router = useRouter()

  if (isLoading) {
    return null
  }

  if (!isAuthenticated) {
    return <Redirect href="/" />
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.action.primary,
        tabBarInactiveTintColor: colors.text.secondary,
        tabBarStyle: {
          backgroundColor: colors.surface.background,
          borderTopColor: colors.border.subtle,
        },
        headerStyle: {
          backgroundColor: colors.surface.background,
        },
        headerTintColor: colors.text.primary,
        headerTitleStyle: {
          fontWeight: '600',
          color: colors.text.primary,
        },
        headerLeftContainerStyle: styles.headerContainer,
        headerRightContainerStyle: styles.headerContainer,
      }}
    >
      <Tabs.Screen
        name="pantry"
        options={{
          title: 'Pantry',
          headerShown: true,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={size}
              color={color}
            />
          ),
          headerLeft: ({ tintColor }) => (
            <TouchableOpacity
              onPress={() => router.push('/pantry/settings')}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Settings"
            >
              <Ionicons name="settings-outline" size={24} color={tintColor} />
            </TouchableOpacity>
          ),
          headerRight: ({ tintColor }) => (
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}
            >
              <TouchableOpacity
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Search pantry"
              >
                <Ionicons name="search" size={24} color={tintColor} />
              </TouchableOpacity>
              <TouchableOpacity
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Add item"
              >
                <Ionicons name="add" size={28} color={colors.action.primary} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="shopping"
        options={{
          title: 'Shopping',
          headerShown: true,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'cart' : 'cart-outline'}
              size={size}
              color={color}
            />
          ),
          headerRight: ({ tintColor }) => (
            <TouchableOpacity
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Add item"
            >
              <Ionicons name="add" size={28} color={colors.action.primary} />
            </TouchableOpacity>
          ),
        }}
      />
      <Tabs.Screen
        name="commands"
        options={{
          title: 'Commands',
          headerShown: true,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'mic' : 'mic-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="assistant"
        options={{
          title: 'Assistant',
          headerShown: true,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'chatbubble' : 'chatbubble-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          href: null,
        }}
      />
    </Tabs>
  )
}
