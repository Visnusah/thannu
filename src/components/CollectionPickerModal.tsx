import { Ionicons } from '@expo/vector-icons'
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native'

import { Text } from '@/components/ui'
import { useColors } from '@/hooks'
import { fontWeight, spacing, strokeWidth, thannuRadius } from '@/lib'
import type { Collection } from '@/stores'

type CollectionPickerModalProps = {
  visible: boolean
  collections: Collection[]
  currentCollectionId: string
  onClose: () => void
  onSelect: (collection: Collection) => void
}

export function CollectionPickerModal({
  visible,
  collections,
  currentCollectionId,
  onClose,
  onSelect,
}: CollectionPickerModalProps) {
  const colors = useColors()

  if (!visible) return null

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.text }]}>
          <View style={styles.header}>
            <View>
              <Text variant="h3" style={{ color: colors.text }}>Move link</Text>
              <Text variant="caption" style={{ color: colors.secondary }}>Choose a collection</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close move link"
              onPress={onClose}
              style={[styles.close, { borderColor: colors.text }]}
            >
              <Ionicons name="close" size={20} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {collections.map((collection) => {
              const isCurrent = collection.id === currentCollectionId
              return (
                <Pressable
                  key={collection.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Move to ${collection.name}`}
                  accessibilityState={{ selected: isCurrent }}
                  disabled={isCurrent}
                  onPress={() => onSelect(collection)}
                  style={({ pressed }) => [
                    styles.row,
                    { borderColor: colors.text, backgroundColor: isCurrent ? collection.color + '33' : colors.background },
                    pressed && styles.rowPressed,
                    isCurrent && styles.currentRow,
                  ]}
                >
                  <View style={[styles.dot, { backgroundColor: collection.color, borderColor: colors.text }]} />
                  <Text style={[styles.name, { color: colors.text }]}>{collection.name}</Text>
                  {isCurrent && <Ionicons name="checkmark" size={20} color={colors.text} />}
                </Pressable>
              )
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  card: {
    maxHeight: '80%',
    borderWidth: strokeWidth.card,
    borderRadius: thannuRadius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  close: {
    width: 44,
    height: 44,
    borderWidth: strokeWidth.card,
    borderRadius: thannuRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: strokeWidth.card,
    borderRadius: thannuRadius.sm,
  },
  rowPressed: { transform: [{ translateY: 2 }] },
  currentRow: { opacity: 0.75 },
  dot: { width: 20, height: 20, borderWidth: 1.5, borderRadius: 5 },
  name: { flex: 1, fontWeight: fontWeight.bold },
})
