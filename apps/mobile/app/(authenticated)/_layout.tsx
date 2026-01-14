import { Tabs, Redirect } from 'expo-router'
import { useAuth } from '@/features/auth'
import { Ionicons } from '@expo/vector-icons'

export default function AuthenticatedLayout() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return null
  }

  if (!isAuthenticated) {
    return <Redirect href="/" />
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#3498DB',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#e0e0e0',
        },
        headerStyle: {
          backgroundColor: '#fff',
        },
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="pantry"
        options={{
          title: 'Pantry',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="shopping"
        options={{
          title: 'Shopping',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="commands"
        options={{
          title: 'Commands',
          headerShown: true,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="mic-outline" size={size} color={color} />
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
