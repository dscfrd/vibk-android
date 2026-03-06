import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../contexts/AuthContext'

export function LoginScreen(): React.JSX.Element {
  const { login, setVaultPassword, loading } = useAuth()
  const [password, setPassword] = useState('')
  const [step, setStep] = useState<'login' | 'vault'>('login')

  const handleLogin = async (): Promise<void> => {
    await login()
    setStep('vault')
  }

  const handleVault = (): void => {
    if (!password.trim()) return
    setVaultPassword(password.trim())
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.logo}>vibk</Text>
        <Text style={styles.subtitle}>Android Lite</Text>

        {step === 'login' ? (
          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#1a1b26" />
            ) : (
              <Text style={styles.buttonText}>Sign in with Google</Text>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.vaultSection}>
            <Text style={styles.label}>Vault Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter vault password..."
              placeholderTextColor="#565f89"
              secureTextEntry
              autoFocus
            />
            <TouchableOpacity style={styles.button} onPress={handleVault}>
              <Text style={styles.buttonText}>Unlock</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1b26' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  logo: { color: '#7aa2f7', fontSize: 36, fontWeight: '700', letterSpacing: 2 },
  subtitle: { color: '#565f89', fontSize: 14, marginTop: 4, marginBottom: 48 },
  button: {
    backgroundColor: '#7aa2f7',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center'
  },
  buttonText: { color: '#1a1b26', fontSize: 16, fontWeight: '600' },
  vaultSection: { width: '100%', maxWidth: 300, gap: 12 },
  label: { color: '#c0caf5', fontSize: 14, fontWeight: '500' },
  input: {
    backgroundColor: '#292e42',
    borderWidth: 1,
    borderColor: '#3b4261',
    borderRadius: 8,
    padding: 12,
    color: '#c0caf5',
    fontSize: 16
  }
})
