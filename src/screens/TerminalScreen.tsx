import React, { useRef, useState, useCallback, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Modal } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { TerminalWebView, type TerminalWebViewRef } from '../components/terminal/TerminalWebView'
import { InputBar } from '../components/terminal/InputBar'
import { OptionsPopup } from '../components/terminal/OptionsPopup'
import { useSync } from '../contexts/SyncContext'
import { useAutoYes } from '../hooks/useAutoYes'
import { useSendMessage } from '../hooks/useSendMessage'
import { stripAnsi } from '../utils/strip-ansi'
import { detectOptions, type DetectedOption } from '../utils/detect-options'
import sshService, { type ConnectionState } from '../services/ssh-service'
import type { SshServer } from '../shared/server-types'

export function TerminalScreen(): React.JSX.Element {
  const { sshServers } = useSync()
  const termRef = useRef<TerminalWebViewRef>(null)
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected')
  const [selectedServer, setSelectedServer] = useState<SshServer | null>(null)
  const [showServerPicker, setShowServerPicker] = useState(false)
  const [detectedOptions, setDetectedOptions] = useState<DetectedOption[] | null>(null)
  const [showOptions, setShowOptions] = useState(false)
  const assistantAccumRef = useRef('')

  const writeRef = useRef((data: string) => sshService.write(data))
  const { sendText, sendRaw } = useSendMessage((data) => writeRef.current(data))

  const sendToConnectionRef = useRef((data: string) => sshService.write(data))
  const { autoYes, autoYesCountdown, processAutoYesRef, toggleAutoYes } = useAutoYes(sendToConnectionRef)

  // SSH callbacks
  useEffect(() => {
    sshService.setCallbacks({
      onData: (data) => {
        termRef.current?.writeData(data)
        const stripped = stripAnsi(data)
        assistantAccumRef.current += stripped
        // Keep last 5000 chars
        if (assistantAccumRef.current.length > 5000) {
          assistantAccumRef.current = assistantAccumRef.current.slice(-5000)
        }
        processAutoYesRef.current(stripped)
        // Detect options after idle
        const opts = detectOptions(assistantAccumRef.current)
        setDetectedOptions(opts?.options || null)
      },
      onConnect: () => setConnectionState('connected'),
      onDisconnect: () => setConnectionState('disconnected'),
      onError: (err) => {
        termRef.current?.writeData(`\r\n\x1b[31m[Error] ${err}\x1b[0m\r\n`)
      }
    })
    return () => sshService.disconnect()
  }, [processAutoYesRef])

  const handleConnect = useCallback(async (server: SshServer) => {
    setSelectedServer(server)
    setShowServerPicker(false)
    setConnectionState('connecting')
    assistantAccumRef.current = ''
    await sshService.connect(server, 80, 24)
  }, [])

  const handleDisconnect = useCallback(() => {
    sshService.disconnect()
    setSelectedServer(null)
  }, [])

  const handleSend = useCallback((text: string) => {
    sendText(text)
    assistantAccumRef.current = ''
    setDetectedOptions(null)
  }, [sendText])

  const handleControlC = useCallback(() => {
    sendRaw('\x03')
  }, [sendRaw])

  const handleResize = useCallback((cols: number, rows: number) => {
    sshService.resize(cols, rows)
  }, [])

  const handleOptionSelect = useCallback((num: string) => {
    if (num === 'yes') sendRaw('y\r')
    else if (num === 'no') sendRaw('n\r')
    else sendRaw(num + '\r')
    assistantAccumRef.current = ''
    setDetectedOptions(null)
  }, [sendRaw])

  const activeServers = sshServers.filter(s => !s.archived)

  const STATUS_COLORS: Record<ConnectionState, string> = {
    disconnected: '#565f89',
    connecting: '#e0af68',
    connected: '#9ece6a'
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.serverBtn}
          onPress={() => {
            if (connectionState === 'connected') handleDisconnect()
            else setShowServerPicker(true)
          }}
        >
          <View style={[styles.dot, { backgroundColor: STATUS_COLORS[connectionState] }]} />
          <Text style={styles.serverName} numberOfLines={1}>
            {selectedServer?.name || 'Select server'}
          </Text>
        </TouchableOpacity>

        {detectedOptions && detectedOptions.length > 0 && (
          <TouchableOpacity style={styles.optionsBtn} onPress={() => setShowOptions(true)}>
            <Text style={styles.optionsBtnText}>{detectedOptions.length} opts</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Terminal */}
      <TerminalWebView ref={termRef} onData={(data) => sshService.write(data)} onResize={handleResize} />

      {/* Input Bar */}
      <InputBar
        onSend={handleSend}
        onControlC={handleControlC}
        autoYes={autoYes}
        autoYesCountdown={autoYesCountdown}
        onToggleAutoYes={toggleAutoYes}
      />

      {/* Options Popup */}
      <OptionsPopup
        options={detectedOptions}
        visible={showOptions}
        onSelect={handleOptionSelect}
        onClose={() => setShowOptions(false)}
      />

      {/* Server Picker Modal */}
      <Modal visible={showServerPicker} transparent animationType="slide" onRequestClose={() => setShowServerPicker(false)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setShowServerPicker(false)}>
          <View style={styles.pickerSheet}>
            <Text style={styles.pickerTitle}>SSH Servers</Text>
            {activeServers.length === 0 ? (
              <Text style={styles.noServers}>No servers synced. Add servers on desktop.</Text>
            ) : (
              <FlatList
                data={activeServers}
                keyExtractor={(s) => s.id}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.serverItem} onPress={() => handleConnect(item)}>
                    <Text style={styles.serverItemName}>{item.name}</Text>
                    <Text style={styles.serverItemHost}>{item.username}@{item.host}:{item.port}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1b26' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#24283b',
    borderBottomWidth: 1,
    borderBottomColor: '#3b4261'
  },
  serverBtn: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  serverName: { color: '#c0caf5', fontSize: 14, fontWeight: '500' },
  optionsBtn: {
    backgroundColor: '#7aa2f7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  optionsBtnText: { color: '#1a1b26', fontSize: 12, fontWeight: '600' },
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  pickerSheet: {
    backgroundColor: '#24283b',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    paddingBottom: 32,
    maxHeight: '60%'
  },
  pickerTitle: { color: '#c0caf5', fontSize: 16, fontWeight: '600', marginBottom: 12 },
  noServers: { color: '#565f89', fontSize: 13, textAlign: 'center', padding: 20 },
  serverItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#292e42',
    borderRadius: 8,
    marginBottom: 6
  },
  serverItemName: { color: '#c0caf5', fontSize: 15, fontWeight: '500' },
  serverItemHost: { color: '#565f89', fontSize: 12, marginTop: 2 }
})
