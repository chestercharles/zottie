import { useContext } from 'react'
import { useColorScheme } from 'react-native'
import { colors, type ColorScheme } from './colors'
import { spacing } from './spacing'
import { typography } from './typography'
import { radius } from './shape'
import { useThemePreference } from './ThemeContext'

export function useTheme() {
  let colorScheme: ColorScheme

  try {
    const { resolvedColorScheme } = useThemePreference()
    colorScheme = resolvedColorScheme
  } catch {
    const systemColorScheme = useColorScheme()
    colorScheme = systemColorScheme ?? 'light'
  }

  return {
    colors: colors[colorScheme],
    spacing,
    typography,
    radius,
    colorScheme,
  }
}

export type Theme = ReturnType<typeof useTheme>
