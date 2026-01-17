import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { useColorScheme } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

export type ThemePreference = 'light' | 'dark' | 'system'

type ThemeContextValue = {
  preference: ThemePreference
  setPreference: (preference: ThemePreference) => void
  resolvedColorScheme: 'light' | 'dark'
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const THEME_STORAGE_KEY = 'themePreference'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme()
  const [preference, setPreferenceState] = useState<ThemePreference>('system')
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setPreferenceState(stored)
      }
      setIsLoaded(true)
    })
  }, [])

  const setPreference = (newPreference: ThemePreference) => {
    setPreferenceState(newPreference)
    AsyncStorage.setItem(THEME_STORAGE_KEY, newPreference)
  }

  const resolvedColorScheme: 'light' | 'dark' =
    preference === 'system' ? (systemColorScheme ?? 'light') : preference

  if (!isLoaded) {
    return null
  }

  return (
    <ThemeContext.Provider value={{ preference, setPreference, resolvedColorScheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useThemePreference() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useThemePreference must be used within a ThemeProvider')
  }
  return context
}
