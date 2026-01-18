import { useEffect } from 'react'
import { View, StyleSheet } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import { Text } from '@/components'
import { useTheme } from '@/lib/theme'

export function NewProcessingScreen() {
  const { colors, spacing } = useTheme()
  const scale = useSharedValue(1)
  const opacity = useSharedValue(0.6)

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withSpring(1.15, {
          damping: 8,
          stiffness: 100,
        }),
        withSpring(1, {
          damping: 8,
          stiffness: 100,
        })
      ),
      -1,
      false
    )

    opacity.value = withRepeat(
      withSequence(
        withTiming(1, {
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(0.6, {
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
        })
      ),
      -1,
      false
    )
  }, [])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }))


  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface.background,
          paddingHorizontal: spacing.lg,
        },
      ]}
    >
      <View style={[styles.content, { gap: spacing.lg }]}>
        <Animated.View style={[{ marginBottom: spacing.sm }, animatedStyle]}>
          <Ionicons
            name="checkmark-circle"
            size={80}
            color={colors.action.primary}
          />
        </Animated.View>

        <Text variant="title.medium" style={styles.message}>
          Getting your shopping list ready...
        </Text>

        <Text
          variant="body.primary"
          color="secondary"
          style={[styles.subtitle, { maxWidth: 300 }]}
        >
          This will just take a moment. We're organizing everything for you.
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
})
