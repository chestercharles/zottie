import { View, Text, StyleSheet } from 'react-native'

export function SettingsScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.placeholderText}>Settings</Text>
        <Text style={styles.subtext}>Account and household settings will appear here</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  placeholderText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  subtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
})
