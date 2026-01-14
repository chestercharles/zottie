import { useEffect } from 'react'
import { Text, View, StyleSheet } from 'react-native'
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

interface NewProcessingScreenProps {
  step: 'pantry' | 'shopping' | 'both'
}

export function NewProcessingScreen({ step }: NewProcessingScreenProps) {
  const scale = useSharedValue(1)
  const opacity = useSharedValue(0.6)

  useEffect(() => {
    // Breathing/pulsing animation with spring physics for warm, organic feel
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

    // Gentle opacity fade for additional warmth
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

  const getMessage = () => {
    switch (step) {
      case 'pantry':
        return 'Adding your pantry items...'
      case 'shopping':
        return 'Getting your shopping list ready...'
      case 'both':
        return 'Setting up your kitchen...'
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Animated.View style={[styles.iconContainer, animatedStyle]}>
          <Ionicons name="checkmark-circle" size={80} color="#3498DB" />
        </Animated.View>

        <Text style={styles.message}>{getMessage()}</Text>

        <Text style={styles.subtitle}>
          This will just take a moment. We're organizing everything for you.
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  iconContainer: {
    marginBottom: 8,
  },
  message: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2C3E50',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },
})
