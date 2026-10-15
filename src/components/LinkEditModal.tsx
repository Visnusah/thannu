import { useEffect, useState } from 'react'
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native'

import { Text } from '@/components/ui'
import { useColors } from '@/hooks'
import { fontSize, fontWeight, spacing, strokeWidth, thannuColors, thannuRadius } from '@/lib'
import type { LinkRecord } from '@/stores'

export type LinkEditValues = {
  title: string
  description: string
  tags: string[]
  notes: string
}

type LinkEditModalProps = {
  visible: boolean
  link: LinkRecord
  onClose: () => void
  onSave: (values: LinkEditValues) => void
}

export function LinkEditModal({ visible, link, onClose, onSave }: LinkEditModalProps) {
  const colors = useColors()
  const [title, setTitle] = useState(link.title)
  const [description, setDescription] = useState(link.description)
  const [tags, setTags] = useState(link.tags.join(', '))
  const [notes, setNotes] = useState(link.notes)

  useEffect(() => {
    if (!visible) return
    const frame = requestAnimationFrame(() => {
      setTitle(link.title)
      setDescription(link.description)
      setTags(link.tags.join(', '))
      setNotes(link.notes)
    })
    return () => cancelAnimationFrame(frame)
  }, [link, visible])

  if (!visible) return null

  const save = () => {
    const normalizedTags = [...new Set(
      tags
        .split(/[,\n]/)
        .map((tag) => tag.trim().replace(/^#/, ''))
        .filter(Boolean)
    )]

    onSave({
      title: title.trim() || link.title,
      description: description.trim(),
      tags: normalizedTags,
      notes: notes.trim(),
    })
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.text }]}>
          <View style={styles.header}>
            <View>
              <Text variant="h3" style={{ color: colors.text }}>Edit link</Text>
              <Text variant="caption" style={{ color: colors.secondary }}>Update your saved information</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close edit link"
              onPress={onClose}
              style={[styles.close, { borderColor: colors.text }]}
            >
              <Text style={{ color: colors.text, fontSize: fontSize.lg }}>×</Text>
            </Pressable>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Field label="TITLE" value={title} onChangeText={setTitle} colors={colors} />
            <Field
              label="DESCRIPTION"
              value={description}
              onChangeText={setDescription}
              colors={colors}
              multiline
            />
            <Field
              label="TAGS"
              value={tags}
              onChangeText={setTags}
              colors={colors}
              placeholder="recipes, inspiration, watch-later"
            />
            <Field
              label="NOTE"
              value={notes}
              onChangeText={setNotes}
              colors={colors}
              multiline
              placeholder="Add a personal note"
            />
          </ScrollView>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Save link changes"
            onPress={save}
            style={({ pressed }) => [
              styles.save,
              { backgroundColor: thannuColors.mint, borderColor: colors.text },
              pressed && styles.savePressed,
            ]}
          >
            <Text style={[styles.saveText, { color: colors.text }]}>Save changes</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

function Field({
  label,
  value,
  onChangeText,
  colors,
  multiline = false,
  placeholder,
}: {
  label: string
  value: string
  onChangeText: (value: string) => void
  colors: ReturnType<typeof useColors>
  multiline?: boolean
  placeholder?: string
}) {
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.secondary}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={[
          styles.input,
          multiline && styles.multiline,
          { color: colors.text, borderColor: colors.text, backgroundColor: colors.background },
        ]}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  keyboard: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    maxHeight: '90%',
    borderTopLeftRadius: thannuRadius.lg,
    borderTopRightRadius: thannuRadius.lg,
    borderWidth: strokeWidth.card,
    borderBottomWidth: 0,
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  close: {
    width: 44,
    height: 44,
    borderWidth: strokeWidth.card,
    borderRadius: thannuRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  field: { marginBottom: spacing.md, gap: spacing.xs },
  label: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, letterSpacing: 1 },
  input: {
    minHeight: 48,
    borderWidth: strokeWidth.card,
    borderRadius: thannuRadius.sm,
    paddingHorizontal: spacing.sm,
    fontSize: fontSize.base,
  },
  multiline: { minHeight: 100, paddingTop: spacing.sm },
  save: {
    minHeight: 52,
    borderWidth: strokeWidth.card,
    borderRadius: thannuRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savePressed: { transform: [{ translateY: 2 }] },
  saveText: { fontSize: fontSize.base, fontWeight: fontWeight.bold },
})
