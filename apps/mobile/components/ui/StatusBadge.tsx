import { View, StyleSheet } from 'react-native'
import { useTheme } from '../../lib/theme'
import { Text } from './Text'

type PantryStatus =
  | 'in_stock'
  | 'running_low'
  | 'out_of_stock'
  | 'planned'
  | 'dormant'

interface StatusBadgeProps {
  status: PantryStatus
}

const statusLabels: Record<PantryStatus, string> = {
  in_stock: 'In Stock',
  running_low: 'Running Low',
  out_of_stock: 'Out of Stock',
  planned: 'Planned',
  dormant: 'Dormant',
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const { colors, radius, spacing } = useTheme()

  const getBackgroundColor = () => {
    switch (status) {
      case 'in_stock':
        return colors.feedback.success
      case 'running_low':
        return colors.feedback.warning
      case 'out_of_stock':
        return colors.feedback.error
      case 'planned':
        return colors.border.strong
      case 'dormant':
        return colors.text.tertiary
    }
  }

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: getBackgroundColor(),
          borderRadius: radius.sm,
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xs,
        },
      ]}
    >
      <Text variant="caption" color="inverse" style={styles.text}>
        {statusLabels[status]}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {},
  text: {
    fontWeight: '500',
  },
})
