import { View, ViewProps, StyleSheet } from 'react-native'
import { useTheme } from '../../lib/theme'

export function Card({ style, children, ...props }: ViewProps) {
  const { colors, radius, spacing } = useTheme()

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface.elevated,
          borderRadius: radius.lg,
          padding: spacing.md,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {},
})
