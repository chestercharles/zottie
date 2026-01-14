import { StyleSheet } from 'react-native'
import {
  ConversationalOnboarding,
  // OriginalOnboarding,
} from '@/features/onboarding'

export default function OnboardingRoute() {
  return <ConversationalOnboarding />
  // return <OriginalOnboarding /> // TODO: Uncomment this to toggle between onboarding flows
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
})
