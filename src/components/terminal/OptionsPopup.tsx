import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native'
import type { DetectedOption } from '../../utils/detect-options'

interface OptionsPopupProps {
  options: DetectedOption[] | null
  visible: boolean
  onSelect: (num: string) => void
  onClose: () => void
}

export function OptionsPopup({ options, visible, onSelect, onClose }: OptionsPopupProps): React.JSX.Element | null {
  if (!visible || !options || options.length === 0) return null

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Select option</Text>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt.num}
              style={styles.option}
              onPress={() => { onSelect(opt.num); onClose() }}
            >
              <Text style={styles.optNum}>{opt.num}.</Text>
              <Text style={styles.optLabel}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: '#24283b',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    paddingBottom: 32
  },
  title: { color: '#565f89', fontSize: 12, marginBottom: 8, textAlign: 'center' },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#292e42',
    borderRadius: 8,
    marginBottom: 6
  },
  optNum: { color: '#7aa2f7', fontSize: 16, fontWeight: '600', marginRight: 10, minWidth: 24 },
  optLabel: { color: '#c0caf5', fontSize: 15, flex: 1 }
})
