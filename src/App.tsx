import React from 'react'
import { StatusBar } from 'react-native'
import { NavigationContainer, DefaultTheme } from '@react-navigation/native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider } from './contexts/AuthContext'
import { SyncProvider } from './contexts/SyncContext'
import { AppNavigator } from './navigation/AppNavigator'

const DarkTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: '#7aa2f7',
    background: '#1a1b26',
    card: '#24283b',
    text: '#c0caf5',
    border: '#3b4261',
    notification: '#f7768e'
  }
}

export default function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <SyncProvider>
          <NavigationContainer theme={DarkTheme}>
            <StatusBar barStyle="light-content" backgroundColor="#1a1b26" />
            <AppNavigator />
          </NavigationContainer>
        </SyncProvider>
      </AuthProvider>
    </SafeAreaProvider>
  )
}
