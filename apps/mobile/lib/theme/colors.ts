// Brand palette:
// Lilac Ash: #B0A1BA — secondary accents, selected states, tags
// Cool Steel: #A5B5BF — borders, dividers
// Ash Grey: #ABC8C7 — surface tints
// Celadon: #B8E2C8 / #BFF0D4 — success states

export const colors = {
  light: {
    text: {
      primary: '#1C1C1E',
      secondary: '#6B7280',
      tertiary: '#9CA3AF',
      inverse: '#FFFFFF',
    },
    surface: {
      background: '#FFFFFF',
      grouped: '#F5F7F7',
      elevated: '#FFFFFF',
      overlay: 'rgba(0, 0, 0, 0.4)',
    },
    border: {
      subtle: '#D4DEE0',
      strong: '#A5B5BF',
    },
    feedback: {
      success: '#5A9B7A',
      warning: '#D4952A',
      error: '#C44D4D',
      info: '#6B5A75',
    },
    action: {
      primary: '#6B5A75',
      primaryPressed: '#5A4A63',
      secondary: 'transparent',
      disabled: '#D1D1D6',
    },
  },
  dark: {
    text: {
      primary: '#F2F2F7',
      secondary: '#AEAEB2',
      tertiary: '#636366',
      inverse: '#1C1C1E',
    },
    surface: {
      background: '#000000',
      grouped: '#1C1C1E',
      elevated: '#2C2C2E',
      overlay: 'rgba(0, 0, 0, 0.6)',
    },
    border: {
      subtle: '#3D4548',
      strong: '#5A6A70',
    },
    feedback: {
      success: '#8FD4A8',
      warning: '#FFBB5C',
      error: '#FF6B6B',
      info: '#C4B5CE',
    },
    action: {
      primary: '#C4B5CE',
      primaryPressed: '#D5C9DD',
      secondary: 'transparent',
      disabled: '#3A3A3C',
    },
  },
} as const

export type ColorScheme = 'light' | 'dark'
export type Colors = typeof colors.light
