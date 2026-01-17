import { TextStyle } from 'react-native'

export const typography = {
  title: {
    large: {
      fontSize: 28,
      fontWeight: '600' as TextStyle['fontWeight'],
    },
    medium: {
      fontSize: 22,
      fontWeight: '600' as TextStyle['fontWeight'],
    },
    small: {
      fontSize: 18,
      fontWeight: '600' as TextStyle['fontWeight'],
    },
  },
  body: {
    primary: {
      fontSize: 16,
      fontWeight: '400' as TextStyle['fontWeight'],
    },
    secondary: {
      fontSize: 14,
      fontWeight: '400' as TextStyle['fontWeight'],
    },
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as TextStyle['fontWeight'],
  },
} as const

export type Typography = typeof typography
export type TitleVariant = keyof Typography['title']
export type BodyVariant = keyof Typography['body']
