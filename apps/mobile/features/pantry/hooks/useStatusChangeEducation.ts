import { useState, useEffect, useCallback } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

const STORAGE_KEY = 'hasSeenStatusChangeEducation'

export function useStatusChangeEducation() {
  const [hasSeenEducation, setHasSeenEducation] = useState<boolean | null>(null)
  const [showEducation, setShowEducation] = useState(false)

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      setHasSeenEducation(stored === 'true')
    })
  }, [])

  const markAsSeen = useCallback(() => {
    setHasSeenEducation(true)
    setShowEducation(false)
    AsyncStorage.setItem(STORAGE_KEY, 'true')
  }, [])

  const triggerEducation = useCallback(() => {
    if (hasSeenEducation === false) {
      setShowEducation(true)
    }
  }, [hasSeenEducation])

  const dismissEducation = useCallback(() => {
    markAsSeen()
  }, [markAsSeen])

  return {
    hasSeenEducation,
    showEducation,
    triggerEducation,
    dismissEducation,
  }
}
