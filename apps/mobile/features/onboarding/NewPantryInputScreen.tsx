import { useState } from 'react'
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'

interface NewPantryInputScreenProps {
  onSubmit: (text: string) => void
  onSkip: () => void
}

export function NewPantryInputScreen({
  onSubmit,
  onSkip,
}: NewPantryInputScreenProps) {
  const [text, setText] = useState('')
  const insets = useSafeAreaInsets()

  const handleSubmit = () => {
    onSubmit(text.trim())
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Ionicons name="basket" size={64} color="#3498DB" />
        <Text style={styles.title}>What's in your pantry?</Text>
        <Text style={styles.subtitle}>
          Just start listing what you have. No need to be perfect - you can
          easily add more or make changes later.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="e.g., milk, eggs, bread, apples..."
          placeholderTextColor="#BDC3C7"
          value={text}
          onChangeText={setText}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          autoFocus
          returnKeyType="done"
          blurOnSubmit={false}
        />

        <Text style={styles.hint}>
          You can list as many items as you'd like, or skip if you prefer to
          add things later.
        </Text>
      </View>

      <View
        style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}
      >
        <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.continueButton, !text.trim() && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={!text.trim()}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    paddingTop: 60,
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#7F8C8D',
    lineHeight: 24,
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#2C3E50',
    minHeight: 140,
    marginTop: 8,
  },
  hint: {
    fontSize: 14,
    color: '#95A5A6',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 24,
  },
  skipButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#7F8C8D',
    fontSize: 16,
    fontWeight: '600',
  },
  continueButton: {
    flex: 2,
    backgroundColor: '#3498DB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})
