import { Stack } from 'expo-router'
import { useTheme } from '@/lib/theme'
import { Header, getHeaderTitle } from '@react-navigation/elements'
import type { NativeStackHeaderProps } from '@react-navigation/native-stack'
import { StyleSheet } from 'react-native'

const HEADER_HEIGHT = 56

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 12,
  },
})

export default function PantryLayout() {
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
        header: (props: NativeStackHeaderProps) => (
          <Header
            {...props}
            title={getHeaderTitle(props.options, props.route.name)}
            headerStyle={{
              backgroundColor: colors.surface.background,
              height: HEADER_HEIGHT,
            }}
            headerTintColor={colors.text.primary}
            headerTitleStyle={{
              fontWeight: '600',
              color: colors.text.primary,
            }}
            headerLeftContainerStyle={styles.headerContainer}
            headerRightContainerStyle={styles.headerContainer}
          />
        ),
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="create"
        options={{
          title: 'Add Item',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Edit Item',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
    </Stack>
  )
}
