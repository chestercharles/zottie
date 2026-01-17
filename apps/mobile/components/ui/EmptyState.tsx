import { View, StyleSheet } from 'react-native'
import { useTheme } from '../../lib/theme'
import { Text } from './Text'

interface EmptyStateProps {
  title: string
  message?: string
  action?: React.ReactNode
}

export function EmptyState({ title, message, action }: EmptyStateProps) {
  const { spacing } = useTheme()

  return (
    <View style={[styles.container, { padding: spacing.xl }]}>
      <Text variant="title.small" color="secondary" style={styles.title}>
        {title}
      </Text>
      {message && (
        <Text
          variant="body.secondary"
          color="tertiary"
          style={[styles.message, { marginTop: spacing.sm }]}
        >
          {message}
        </Text>
      )}
      {action && <View style={[styles.action, { marginTop: spacing.lg }]}>{action}</View>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
  },
  action: {},
})
