import { Stack } from 'expo-router'

export default function PantryLayout() {
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
      <Stack.Screen name="index" options={{ title: 'Pantry' }} />
      <Stack.Screen name="create" options={{ title: 'Add Item' }} />
      <Stack.Screen name="[id]" options={{ title: 'Edit Item' }} />
    </Stack>
  )
}
