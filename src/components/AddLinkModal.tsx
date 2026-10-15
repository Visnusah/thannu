import { useEffect, useState } from 'react'
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native'

import { Text } from '@/components/ui'
import { useColors } from '@/hooks'
import { fontSize, fontWeight, spacing, strokeWidth, thannuColors, thannuRadius } from '@/lib'

type AddLinkModalProps = {
  visible: boolean
  collectionName: string
  onClose: () => void
  onAdd: (url: string) => void
}

export function AddLinkModal({ visible, collectionName, onClose, onAdd }: AddLinkModalProps) {
  const colors = useColors()
  const [url, setUrl] = useState('')

  useEffect(() => {
    if (!visible) return
    const frame = requestAnimationFrame(() => setUrl(''))
    return () => cancelAnimationFrame(frame)
  }, [visible])

  if (!visible) return null

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.text }]}>
          <View style={styles.header}>
            <View>
              <Text variant="h3" style={{ color: colors.text }}>Add link</Text>
              <Text variant="caption" style={{ color: colors.secondary }}>Save directly to {collectionName}</Text>
            </View>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close add link" style={[styles.close, { borderColor: colors.text }]}>
              <Text style={{ color: colors.text, fontSize: fontSize.lg }}>×</Text>
            </Pressable>
          </View>
          <TextInput
            value={url}
            onChangeText={setUrl}
            placeholder="https://..."
            placeholderTextColor={colors.secondary}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            autoFocus
            style={[styles.input, { color: colors.text, borderColor: colors.text, backgroundColor: colors.background }]}
          />
          <Pressable
            disabled={!url.trim()}
            onPress={() => url.trim() && onAdd(url.trim())}
            accessibilityRole="button"
            accessibilityLabel="Save link to collection"
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: url.trim() ? thannuColors.mint : colors.background, borderColor: colors.text },
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={[styles.buttonText, { color: colors.text }]}>Save link</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  keyboard: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    borderTopLeftRadius: thannuRadius.lg,
    borderTopRightRadius: thannuRadius.lg,
    borderWidth: strokeWidth.card,
    borderBottomWidth: 0,
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  close: { width: 44, height: 44, borderWidth: strokeWidth.card, borderRadius: thannuRadius.sm, alignItems: 'center', justifyContent: 'center' },
  input: { minHeight: 52, borderWidth: strokeWidth.card, borderRadius: thannuRadius.sm, paddingHorizontal: spacing.sm, fontSize: fontSize.base },
  button: { minHeight: 52, borderWidth: strokeWidth.card, borderRadius: thannuRadius.md, alignItems: 'center', justifyContent: 'center' },
  buttonPressed: { transform: [{ translateY: 2 }] },
  buttonText: { fontSize: fontSize.base, fontWeight: fontWeight.bold },
})
