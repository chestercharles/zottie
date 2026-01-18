import { View, StyleSheet } from 'react-native'
import { useTheme } from '@/lib/theme'

export function DragHandle() {
  const { colors, spacing } = useTheme()

  return (
    <View
      style={[
        styles.container,
        { paddingTop: spacing.sm, paddingBottom: spacing.xs },
      ]}
    >
      <View
        style={[styles.handle, { backgroundColor: colors.border.strong }]}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  handle: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
  },
})
