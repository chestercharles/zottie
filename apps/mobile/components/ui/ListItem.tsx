import { Pressable, PressableProps, View, StyleSheet, ViewStyle } from 'react-native'
import { useTheme } from '../../lib/theme'

interface ListItemProps extends Omit<PressableProps, 'style'> {
  children: React.ReactNode
  style?: ViewStyle
  showChevron?: boolean
}

export function ListItem({
  children,
  style,
  showChevron = false,
  disabled,
  onPress,
  ...props
}: ListItemProps) {
  const { colors, spacing } = useTheme()

  const isInteractive = !!onPress && !disabled

  const content = (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface.elevated,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm + spacing.xs,
          borderBottomColor: colors.border.subtle,
        },
        style,
      ]}
    >
      <View style={styles.content}>{children}</View>
      {showChevron && isInteractive && (
        <View style={styles.chevron}>
          <ChevronIcon color={colors.text.tertiary} />
        </View>
      )}
    </View>
  )

  if (!isInteractive) {
    return content
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        pressed && { opacity: 0.7 },
      ]}
      {...props}
    >
      {content}
    </Pressable>
  )
}

function ChevronIcon({ color }: { color: string }) {
  return (
    <View
      style={[
        styles.chevronShape,
        {
          borderRightColor: color,
          borderBottomColor: color,
        },
      ]}
    />
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  content: {
    flex: 1,
  },
  chevron: {
    marginLeft: 8,
  },
  chevronShape: {
    width: 8,
    height: 8,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    transform: [{ rotate: '-45deg' }],
  },
})
