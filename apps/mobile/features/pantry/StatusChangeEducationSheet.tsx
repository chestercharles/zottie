import { View, StyleSheet } from 'react-native'
import { forwardRef, useCallback } from 'react'
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from '@gorhom/bottom-sheet'
import { Ionicons } from '@expo/vector-icons'
import { Text, Button } from '@/components'
import { useTheme } from '@/lib/theme'

interface StatusChangeEducationSheetProps {
  onDismiss: () => void
}

export const StatusChangeEducationSheet = forwardRef<
  BottomSheet,
  StatusChangeEducationSheetProps
>(function StatusChangeEducationSheet({ onDismiss }, ref) {
  const { colors, spacing, radius } = useTheme()

  const renderBackdrop = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        pressBehavior="close"
      />
    ),
    []
  )

  return (
    <BottomSheet
      ref={ref}
      index={-1}
      snapPoints={['35%']}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      onClose={onDismiss}
      backgroundStyle={{ backgroundColor: colors.surface.elevated }}
      handleIndicatorStyle={{ backgroundColor: colors.border.strong }}
    >
      <BottomSheetView style={styles.content}>
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: colors.feedback.success + '20',
              borderRadius: radius.lg,
              padding: spacing.md,
              marginBottom: spacing.md,
            },
          ]}
        >
          <Ionicons
            name="cart-outline"
            size={32}
            color={colors.feedback.success}
          />
        </View>

        <Text
          variant="title.medium"
          style={[styles.title, { marginBottom: spacing.sm }]}
        >
          Added to Shopping List
        </Text>

        <Text
          variant="body.secondary"
          color="secondary"
          style={[
            styles.description,
            { marginBottom: spacing.lg, paddingHorizontal: spacing.md },
          ]}
        >
          Items marked as running low or out of stock automatically appear on
          your shopping list. When you restock, just update the status.
        </Text>

        <Button title="Got it" onPress={onDismiss} style={styles.button} />
      </BottomSheetView>
    </BottomSheet>
  )
})

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
  },
  button: {
    width: '100%',
  },
})
