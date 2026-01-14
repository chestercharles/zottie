import { View, ActivityIndicator, StyleSheet } from 'react-native'
import {
  useOnboardingFlag,
  ConversationalOnboarding,
  OriginalOnboarding,
} from '@/features/onboarding'

export default function OnboardingRoute() {
  const { flag, isLoading } = useOnboardingFlag()

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498DB" />
      </View>
    )
  }

  if (flag === 'conversational') {
    return <ConversationalOnboarding />
  }

  return <OriginalOnboarding />
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
})
