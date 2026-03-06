import React, { forwardRef, useImperativeHandle, useRef, useCallback, useState, useEffect } from 'react'
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native'
import Voice from '@react-native-voice/voice'

interface InputBarProps {
  onSend: (text: string) => void
  onControlC: () => void
  autoYes: boolean
  autoYesCountdown: number
  onToggleAutoYes: () => void
}

export interface InputBarRef {
  focus: () => void
}

export const InputBar = forwardRef<InputBarRef, InputBarProps>(
  ({ onSend, onControlC, autoYes, autoYesCountdown, onToggleAutoYes }, ref) => {
    const [text, setText] = useState('')
    const [isListening, setIsListening] = useState(false)
    const inputRef = useRef<TextInput>(null)

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus()
    }), [])

    useEffect(() => {
      Voice.onSpeechStart = () => setIsListening(true)
      Voice.onSpeechEnd = () => setIsListening(false)
      Voice.onSpeechResults = (event) => {
        if (event.value && event.value.length > 0) {
          setText(prev => prev + (prev ? ' ' : '') + event.value![0])
        }
      }
      return () => { Voice.destroy().then(Voice.removeAllListeners) }
    }, [])

    const handleSend = useCallback(() => {
      if (text.trim()) {
        onSend(text)
        setText('')
      }
    }, [text, onSend])

    const handleVoice = useCallback(async () => {
      try {
        if (isListening) {
          await Voice.stop()
          setIsListening(false)
        } else {
          await Voice.start('ru-RU')
        }
      } catch {
        setIsListening(false)
      }
    }, [isListening])

    return (
      <View style={styles.container}>
        <View style={styles.inputRow}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Enter command..."
            placeholderTextColor="#565f89"
            multiline
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!text.trim()}
          >
            <Text style={styles.sendBtnText}>→</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.ctrlBtn, autoYes && styles.autoYesOn]}
            onPress={onToggleAutoYes}
          >
            <Text style={[styles.ctrlText, autoYes && styles.activeText]}>
              Auto{autoYes ? '✓' : ''}
            </Text>
            {autoYes && autoYesCountdown > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{autoYesCountdown}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.ctrlBtn, isListening && styles.voiceOn]}
            onPress={handleVoice}
          >
            <Text style={[styles.ctrlText, isListening && styles.activeText]}>🎤</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.ctrlBtn, styles.ctrlC]} onPress={onControlC}>
            <Text style={styles.ctrlCText}>^C</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }
)

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#292e42',
    borderTopWidth: 1,
    borderTopColor: '#3b4261',
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 20
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#1a1b26',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3b4261',
    paddingHorizontal: 10,
    minHeight: 44,
    maxHeight: 150
  },
  input: {
    flex: 1,
    color: '#c0caf5',
    fontSize: 15,
    paddingVertical: 10,
    maxHeight: 150
  },
  sendBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
    backgroundColor: '#7aa2f7',
    borderRadius: 8
  },
  sendBtnDisabled: { backgroundColor: '#3b4261' },
  sendBtnText: { color: '#1a1b26', fontSize: 20, fontWeight: '700' },
  controls: {
    flexDirection: 'row',
    marginTop: 6,
    gap: 6
  },
  ctrlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: '#24283b',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3b4261'
  },
  ctrlText: { color: '#c0caf5', fontSize: 13, fontWeight: '500' },
  activeText: { color: '#1a1b26' },
  autoYesOn: { backgroundColor: '#7aa2f7', borderColor: '#7aa2f7' },
  voiceOn: { backgroundColor: '#9ece6a', borderColor: '#9ece6a' },
  badge: {
    marginLeft: 5,
    backgroundColor: '#f7768e',
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: 'center'
  },
  badgeText: { color: '#1a1b26', fontSize: 11, fontWeight: '700' },
  ctrlC: { backgroundColor: '#f7768e', borderColor: '#f7768e' },
  ctrlCText: { color: '#1a1b26', fontSize: 13, fontWeight: '700' }
})
