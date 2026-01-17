import { Pressable, PressableProps, StyleSheet, ViewStyle } from 'react-native'
import { useTheme } from '../../lib/theme'
import { Text } from './Text'

type ButtonVariant = 'primary' | 'secondary'

interface ButtonProps extends Omit<PressableProps, 'style'> {
  variant?: ButtonVariant
  title: string
  style?: ViewStyle
}

export function Button({
  variant = 'primary',
  title,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const { colors, radius, spacing } = useTheme()

  const getBackgroundColor = (pressed: boolean) => {
    if (disabled) return colors.action.disabled
    if (variant === 'secondary') return colors.action.secondary
    return pressed ? colors.action.primaryPressed : colors.action.primary
  }

  const getTextColor = () => {
    if (disabled) return colors.text.secondary
    if (variant === 'secondary') return colors.action.primary
    return colors.text.inverse
  }

  return (
    <Pressable
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: getBackgroundColor(pressed),
          borderRadius: radius.md,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.sm + spacing.xs,
        },
        variant === 'secondary' && styles.secondary,
        style,
      ]}
      {...props}
    >
      <Text
        variant="body.primary"
        style={[styles.text, { color: getTextColor() }]}
      >
        {title}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondary: {
    borderWidth: 0,
  },
  text: {
    fontWeight: '600',
  },
})
