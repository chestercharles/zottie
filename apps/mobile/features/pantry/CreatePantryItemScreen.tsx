import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput as RNTextInput,
} from 'react-native'
import { useState } from 'react'
import type { PantryItemStatus } from './types'
import { useRouter } from 'expo-router'
import { useCreatePantryItem } from './hooks'
import { useTheme } from '../../lib/theme'
import { Text, Button, DragHandle } from '../../components/ui'

export function CreatePantryItemScreen() {
  const router = useRouter()
  const createMutation = useCreatePantryItem()
  const { colors, spacing, radius } = useTheme()
  const [name, setName] = useState('')
  const [status, setStatus] = useState<PantryItemStatus>('in_stock')
  const [validationError, setValidationError] = useState<string | null>(null)

  const handleCreate = () => {
    if (!name.trim()) {
      setValidationError('Please enter an item name')
      return
    }

    setValidationError(null)
    createMutation.mutate(
      { name: name.trim(), status },
      {
        onSuccess: () => {
          router.back()
        },
        onError: (err) => {
          setValidationError(
            err instanceof Error ? err.message : 'Failed to create pantry item'
          )
        },
      }
    )
  }

  const statusOptions: { label: string; value: PantryItemStatus }[] = [
    { label: 'In Stock', value: 'in_stock' },
    { label: 'Running Low', value: 'running_low' },
    { label: 'Out of Stock', value: 'out_of_stock' },
  ]

  return (
    <View
      style={[styles.container, { backgroundColor: colors.surface.background }]}
    >
      <DragHandle />
      <View style={{ padding: spacing.lg, flex: 1 }}>
        <Text
          variant="body.primary"
          style={[styles.label, { marginBottom: spacing.sm }]}
        >
          Item Name
        </Text>
        <RNTextInput
          style={[
            styles.input,
            {
              borderColor: validationError
                ? colors.feedback.error
                : colors.border.subtle,
              borderRadius: radius.sm,
              paddingVertical: spacing.sm,
              paddingHorizontal: spacing.md,
              marginBottom: spacing.lg,
              color: colors.text.primary,
              backgroundColor: colors.surface.background,
            },
          ]}
          value={name}
          onChangeText={(text) => {
            setName(text)
            if (validationError) setValidationError(null)
          }}
          placeholder="e.g. Milk, Eggs, Bread"
          placeholderTextColor={colors.text.tertiary}
          editable={!createMutation.isPending}
        />

        <Text
          variant="body.primary"
          style={[styles.label, { marginBottom: spacing.sm }]}
        >
          Status
        </Text>
        <View
          style={[
            styles.statusContainer,
            { gap: spacing.sm, marginBottom: spacing.lg },
          ]}
        >
          {statusOptions.map((option) => {
            const isActive = status === option.value
            return (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.statusButton,
                  {
                    borderRadius: radius.sm,
                    borderColor: isActive
                      ? colors.action.primary
                      : colors.border.subtle,
                    backgroundColor: isActive
                      ? colors.action.primary
                      : colors.surface.background,
                    paddingVertical: spacing.sm,
                    paddingHorizontal: spacing.md,
                  },
                ]}
                onPress={() => setStatus(option.value)}
                disabled={createMutation.isPending}
              >
                <Text
                  variant="body.secondary"
                  style={[
                    styles.statusButtonText,
                    {
                      color: isActive
                        ? colors.text.inverse
                        : colors.text.secondary,
                    },
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>

        {validationError && (
          <View
            style={[
              styles.errorContainer,
              {
                padding: spacing.sm,
                borderRadius: radius.sm,
                marginBottom: spacing.lg,
                borderWidth: 1,
                borderColor: colors.feedback.error,
                backgroundColor: colors.surface.background,
              },
            ]}
          >
            <Text
              variant="body.secondary"
              style={{ color: colors.feedback.error }}
            >
              {validationError}
            </Text>
          </View>
        )}

        <Button
          title={createMutation.isPending ? 'Adding...' : 'Add to Pantry'}
          onPress={handleCreate}
          disabled={createMutation.isPending}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  label: {
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    fontSize: 16,
    minHeight: 44,
  },
  statusContainer: {
    flexDirection: 'row',
  },
  statusButton: {
    flex: 1,
    borderWidth: 1,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  statusButtonText: {
    fontWeight: '600',
  },
  errorContainer: {},
})
