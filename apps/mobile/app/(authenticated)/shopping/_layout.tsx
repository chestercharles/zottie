import { Stack } from 'expo-router'
import { useTheme } from '@/lib/theme'

export default function ShoppingLayout() {
  const { colors } = useTheme()

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.surface.background,
        },
        headerTintColor: colors.text.primary,
        headerTitleStyle: {
          fontWeight: '600',
          color: colors.text.primary,
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  )
}
