import {
  ConversationalOnboarding,
  // OriginalOnboarding,
} from '@/features/onboarding'

export default function OnboardingRoute() {
  return <ConversationalOnboarding />
  // return <OriginalOnboarding /> // TODO: Uncomment this to toggle between onboarding flows
}
