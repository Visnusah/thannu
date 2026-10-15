import { Ionicons } from '@expo/vector-icons'
import { Modal, Pressable, StyleSheet, View } from 'react-native'

import { Text } from '@/components/ui'
import { useColors } from '@/hooks'
import { fontSize, fontWeight, spacing, strokeWidth, thannuColors, thannuRadius } from '@/lib'

type CollectionActionsModalProps = {
  visible: boolean
  collectionName: string
  canDelete: boolean
  canCreateSubcollection: boolean
  onClose: () => void
  onAddLink: () => void
  onSelectLinks: () => void
  onCreateSubcollection: () => void
  onShareCollection: () => void
  onDelete: () => void
}

export function CollectionActionsModal({
  visible,
  collectionName,
  canDelete,
  canCreateSubcollection,
  onClose,
  onAddLink,
  onSelectLinks,
  onCreateSubcollection,
  onShareCollection,
  onDelete,
}: CollectionActionsModalProps) {
  const colors = useColors()

  if (!visible) return null

  const actions = [
    { icon: 'add-circle-outline' as const, label: 'Add link', onPress: onAddLink, color: colors.text },
    { icon: 'checkbox-outline' as const, label: 'Select links', onPress: onSelectLinks, color: colors.text },
    ...(canCreateSubcollection
      ? [{ icon: 'folder-open-outline' as const, label: 'Create sub-collection', onPress: onCreateSubcollection, color: colors.text }]
      : []),
    { icon: 'share-outline' as const, label: 'Share collection', onPress: onShareCollection, color: colors.text },
    ...(canDelete
      ? [{ icon: 'trash-outline' as const, label: 'Delete collection', onPress: onDelete, color: thannuColors.coral }]
      : []),
  ]

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.text }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View>
              <Text variant="h3" style={{ color: colors.text }}>{collectionName}</Text>
              <Text variant="caption" style={{ color: colors.secondary }}>Collection actions</Text>
            </View>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close collection actions" style={[styles.close, { borderColor: colors.text }]}>
              <Ionicons name="close" size={20} color={colors.text} />
            </Pressable>
          </View>
          <View style={styles.actions}>
            {actions.map((action) => (
              <Pressable
                key={action.label}
                accessibilityRole="button"
                accessibilityLabel={action.label}
                onPress={() => {
                  onClose()
                  action.onPress()
                }}
                style={({ pressed }) => [styles.action, { borderColor: colors.text, backgroundColor: colors.background }, pressed && styles.actionPressed]}
              >
                <Ionicons name={action.icon} size={22} color={action.color} />
                <Text style={[styles.actionLabel, { color: action.color }]}>{action.label}</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.secondary} />
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    borderTopLeftRadius: thannuRadius.lg,
    borderTopRightRadius: thannuRadius.lg,
    borderWidth: strokeWidth.card,
    borderBottomWidth: 0,
    padding: spacing.lg,
    gap: spacing.md,
  },
  handle: { alignSelf: 'center', width: 42, height: 4, borderRadius: 2, backgroundColor: thannuColors.ink },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  close: { width: 44, height: 44, borderWidth: strokeWidth.card, borderRadius: thannuRadius.sm, alignItems: 'center', justifyContent: 'center' },
  actions: { gap: spacing.sm },
  action: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderWidth: strokeWidth.card, borderRadius: thannuRadius.sm, paddingHorizontal: spacing.sm },
  actionPressed: { transform: [{ translateY: 2 }] },
  actionLabel: { flex: 1, fontSize: fontSize.base, fontWeight: fontWeight.bold },
})
