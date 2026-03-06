import React, { useState, useCallback } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../contexts/AuthContext'
import { useSync } from '../contexts/SyncContext'
import { storage, type Theme } from '../services/storage'

function SettingRow({ label, children }: { label: string; children: React.ReactNode }): React.JSX.Element {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      {children}
    </View>
  )
}

function SectionHeader({ title }: { title: string }): React.JSX.Element {
  return <Text style={styles.sectionHeader}>{title}</Text>
}

export function SettingsScreen(): React.JSX.Element {
  const { user, logout } = useAuth()
  const { syncing, lastSyncAt, syncNow, error: syncError, projects, sshServers } = useSync()

  const [theme, setThemeState] = useState<Theme>(storage.getTheme())
  const [notifSound, setNotifSoundState] = useState(storage.getNotificationSound())
  const [keepAwake, setKeepAwakeState] = useState(storage.getKeepAwake())

  const toggleTheme = useCallback(() => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setThemeState(next)
    storage.setTheme(next)
  }, [theme])

  const toggleNotifSound = useCallback((val: boolean) => {
    setNotifSoundState(val)
    storage.setNotificationSound(val)
  }, [])

  const toggleKeepAwake = useCallback((val: boolean) => {
    setKeepAwakeState(val)
    storage.setKeepAwake(val)
  }, [])

  const formatDate = (ts: number | null): string => {
    if (!ts) return 'Never'
    const d = new Date(ts)
    return d.toLocaleString()
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>Settings</Text>

        {/* Account */}
        <SectionHeader title="Account" />
        {user && (
          <View style={styles.card}>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
            <TouchableOpacity style={styles.signOutBtn} onPress={logout}>
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Sync */}
        <SectionHeader title="Cloud Sync" />
        <View style={styles.card}>
          <View style={styles.syncRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.syncLabel}>Last sync: {formatDate(lastSyncAt)}</Text>
              <Text style={styles.syncMeta}>{projects.length} projects, {sshServers.length} servers</Text>
              {syncError && <Text style={styles.syncError}>{syncError}</Text>}
            </View>
            <TouchableOpacity style={styles.syncBtn} onPress={syncNow} disabled={syncing}>
              {syncing ? (
                <ActivityIndicator color="#1a1b26" size="small" />
              ) : (
                <Text style={styles.syncBtnText}>Sync</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Appearance */}
        <SectionHeader title="Appearance" />
        <View style={styles.card}>
          <SettingRow label="Theme">
            <TouchableOpacity style={styles.themeToggle} onPress={toggleTheme}>
              <Text style={styles.themeText}>{theme === 'dark' ? 'Dark' : 'Light'}</Text>
            </TouchableOpacity>
          </SettingRow>
        </View>

        {/* Notifications */}
        <SectionHeader title="Notifications" />
        <View style={styles.card}>
          <SettingRow label="Sound">
            <Switch
              value={notifSound}
              onValueChange={toggleNotifSound}
              trackColor={{ false: '#3b4261', true: '#7aa2f7' }}
              thumbColor={notifSound ? '#c0caf5' : '#565f89'}
            />
          </SettingRow>
        </View>

        {/* Display */}
        <SectionHeader title="Display" />
        <View style={styles.card}>
          <SettingRow label="Keep Screen Awake">
            <Switch
              value={keepAwake}
              onValueChange={toggleKeepAwake}
              trackColor={{ false: '#3b4261', true: '#7aa2f7' }}
              thumbColor={keepAwake ? '#c0caf5' : '#565f89'}
            />
          </SettingRow>
        </View>

        {/* About */}
        <SectionHeader title="About" />
        <View style={styles.card}>
          <Text style={styles.aboutText}>vibk lite v1.0.0</Text>
          <Text style={styles.aboutMuted}>Android companion for vibk desktop</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1b26' },
  content: { flex: 1 },
  title: {
    color: '#c0caf5',
    fontSize: 24,
    fontWeight: '700',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8
  },
  sectionHeader: {
    color: '#565f89',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 6,
    letterSpacing: 0.5
  },
  card: {
    backgroundColor: '#292e42',
    marginHorizontal: 12,
    borderRadius: 10,
    padding: 14
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 36
  },
  rowLabel: { color: '#c0caf5', fontSize: 15 },
  userName: { color: '#c0caf5', fontSize: 16, fontWeight: '600' },
  userEmail: { color: '#565f89', fontSize: 13, marginTop: 2 },
  signOutBtn: {
    marginTop: 12,
    backgroundColor: '#f7768e',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center'
  },
  signOutText: { color: '#1a1b26', fontSize: 14, fontWeight: '600' },
  syncRow: { flexDirection: 'row', alignItems: 'center' },
  syncLabel: { color: '#c0caf5', fontSize: 14 },
  syncMeta: { color: '#565f89', fontSize: 12, marginTop: 2 },
  syncError: { color: '#f7768e', fontSize: 12, marginTop: 4 },
  syncBtn: {
    backgroundColor: '#7aa2f7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center'
  },
  syncBtnText: { color: '#1a1b26', fontSize: 14, fontWeight: '600' },
  themeToggle: {
    backgroundColor: '#24283b',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6
  },
  themeText: { color: '#c0caf5', fontSize: 13 },
  aboutText: { color: '#c0caf5', fontSize: 14, fontWeight: '500' },
  aboutMuted: { color: '#565f89', fontSize: 12, marginTop: 2 }
})
