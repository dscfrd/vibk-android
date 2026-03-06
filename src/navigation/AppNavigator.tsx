import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createStackNavigator } from '@react-navigation/stack'
import { Text } from 'react-native'

import { TerminalScreen } from '../screens/TerminalScreen'
import { PlanScreen } from '../screens/PlanScreen'
import { TicketsScreen } from '../screens/TicketsScreen'
import { SettingsScreen } from '../screens/SettingsScreen'
import { LoginScreen } from '../screens/LoginScreen'
import { useAuth } from '../contexts/AuthContext'

export type TabParamList = {
  Terminal: undefined
  Plan: undefined
  Tickets: undefined
  Settings: undefined
}

export type RootStackParamList = {
  Login: undefined
  Main: undefined
}

const Tab = createBottomTabNavigator<TabParamList>()
const Stack = createStackNavigator<RootStackParamList>()

const TAB_ICONS: Record<string, string> = {
  Terminal: '>_',
  Plan: '☑',
  Tickets: '🎫',
  Settings: '⚙'
}

function MainTabs(): React.JSX.Element {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#24283b',
          borderTopColor: '#3b4261',
          borderTopWidth: 1,
          height: 56,
          paddingBottom: 6,
          paddingTop: 4
        },
        tabBarActiveTintColor: '#7aa2f7',
        tabBarInactiveTintColor: '#565f89',
        tabBarIcon: ({ color }) => (
          <Text style={{ color, fontSize: 16 }}>{TAB_ICONS[route.name]}</Text>
        ),
        tabBarLabelStyle: { fontSize: 11 }
      })}
    >
      <Tab.Screen name="Terminal" component={TerminalScreen} />
      <Tab.Screen name="Plan" component={PlanScreen} />
      <Tab.Screen name="Tickets" component={TicketsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  )
}

export function AppNavigator(): React.JSX.Element {
  const { user } = useAuth()

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <Stack.Screen name="Main" component={MainTabs} />
      )}
    </Stack.Navigator>
  )
}
