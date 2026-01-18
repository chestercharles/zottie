import {
  View,
  TextInput as RNTextInput,
  TextInputProps as RNTextInputProps,
  StyleSheet,
} from 'react-native'
import { useTheme } from '../../lib/theme'
import { Text } from './Text'

interface TextInputProps extends RNTextInputProps {
  label: string
  error?: string
}

export function TextInput({ label, error, style, ...props }: TextInputProps) {
  const { colors, radius, spacing } = useTheme()

  const borderColor = error ? colors.feedback.error : colors.border.subtle

  return (
    <View style={styles.container}>
      <Text variant="body.secondary" color="secondary" style={styles.label}>
        {label}
      </Text>
      <RNTextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.surface.background,
            borderColor,
            borderRadius: radius.sm,
            color: colors.text.primary,
            paddingHorizontal: spacing.sm + spacing.xs,
            paddingVertical: spacing.sm,
          },
          style,
        ]}
        placeholderTextColor={colors.text.tertiary}
        {...props}
      />
      {error && (
        <Text
          variant="caption"
          style={[styles.error, { color: colors.feedback.error }]}
        >
          {error}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    fontSize: 16,
    minHeight: 44,
  },
  error: {
    marginTop: 4,
  },
})
