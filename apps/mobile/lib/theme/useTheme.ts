import { useColorScheme } from 'react-native'
import { colors, type ColorScheme } from './colors'
import { spacing } from './spacing'
import { typography } from './typography'
import { radius } from './shape'

export function useTheme() {
  const systemColorScheme = useColorScheme()
  const colorScheme: ColorScheme = systemColorScheme ?? 'light'

  return {
    colors: colors[colorScheme],
    spacing,
    typography,
    radius,
    colorScheme,
  }
}

export type Theme = ReturnType<typeof useTheme>
