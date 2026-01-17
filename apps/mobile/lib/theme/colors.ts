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
      grouped: '#F2F2F7',
      elevated: '#FFFFFF',
      overlay: 'rgba(0, 0, 0, 0.4)',
    },
    border: {
      subtle: '#E5E5EA',
      strong: '#C7C7CC',
    },
    feedback: {
      success: '#14B8A6',
      warning: '#FF9500',
      error: '#FF3B30',
      info: '#5856D6',
    },
    action: {
      primary: '#5856D6',
      primaryPressed: '#4B49B6',
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
      subtle: '#38383A',
      strong: '#545456',
    },
    feedback: {
      success: '#2DD4BF',
      warning: '#FF9F0A',
      error: '#FF453A',
      info: '#5E5CE6',
    },
    action: {
      primary: '#5E5CE6',
      primaryPressed: '#7371ED',
      secondary: 'transparent',
      disabled: '#3A3A3C',
    },
  },
} as const

export type ColorScheme = 'light' | 'dark'
export type Colors = typeof colors.light
