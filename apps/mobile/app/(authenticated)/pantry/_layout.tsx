import { Stack, useRouter } from 'expo-router'
import { TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

export default function PantryLayout() {
  const router = useRouter()

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#fff',
        },
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Pantry',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push('/pantry/settings')}
              style={{ marginRight: 8 }}
            >
              <Ionicons name="settings-outline" size={24} color="#333" />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen name="create" options={{ title: 'Add Item' }} />
      <Stack.Screen name="[id]" options={{ title: 'Edit Item' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
    </Stack>
  )
}
