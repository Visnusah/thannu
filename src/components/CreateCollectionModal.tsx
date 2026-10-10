import { Ionicons } from '@expo/vector-icons'
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
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated'

import { Text } from '@/components/ui'
import { useColors, useResponsive } from '@/hooks'
import {
  hardShadow,
  spacing,
  strokeWidth,
  thannuColors,
  thannuRadius,
} from '@/lib'

const COLLECTION_COLORS = [
  '#F4B73F', '#F45D8E', '#A975FF', '#4C8EEB', '#00C996', '#72C738', '#ADEE34', '#FA7B1E',
  '#EEDAA3', '#C2C4C6', '#7D95AB', '#BE6DB5', '#A5734D', '#1B1B1B', '#FA6261', '#726DFF',
]

const COLLECTION_ICONS = [
  'folder', 'star', 'heart', 'book', 'musical-note', 'camera', 'flag', 'moon',
  'sunny', 'cloud', 'pin', 'calendar', 'globe', 'gift', 'leaf', 'briefcase',
  'cart', 'airplane', 'car', 'cafe', 'film', 'headset', 'color-wand', 'ellipsis-horizontal',
] as const

type CreateCollectionModalProps = {
  visible: boolean
  onClose: () => void
  onCreate: (data: { name: string; color: string; icon: string }) => void
}

export function CreateCollectionModal({ visible, onClose, onCreate }: CreateCollectionModalProps) {
  const colors = useColors()
  const { isSmall } = useResponsive()

  const [name, setName] = useState('')
  const [selectedColor, setSelectedColor] = useState(COLLECTION_COLORS[0])
  const [selectedIcon, setSelectedIcon] = useState<typeof COLLECTION_ICONS[number]>(COLLECTION_ICONS[0])

  useEffect(() => {
    if (visible) {
      setName('')
      setSelectedColor(COLLECTION_COLORS[0])
      setSelectedIcon(COLLECTION_ICONS[0])
    }
  }, [visible])

  if (!visible) return null

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          style={styles.overlay}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View
          entering={SlideInDown.duration(200)}
          exiting={SlideOutDown.duration(200)}
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              borderColor: colors.text,
            },
          ]}
        >
          {/* Handle */}
          <View style={styles.handleContainer}>
            <View style={[styles.handle, { backgroundColor: colors.text }]} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text variant="h3" style={{ color: colors.text, fontWeight: '800' }}>
              Add new collection
            </Text>
            <Pressable
              style={[
                styles.closeBtn,
                {
                  borderColor: colors.text,
                  backgroundColor: colors.surface,
                },
              ]}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={20} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* NAME */}
            <View style={styles.section}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: colors.text }]}>NAME</Text>
                <Text style={[styles.counter, { color: colors.secondary }]}>
                  {name.length}/40
                </Text>
              </View>
              <View
                style={[
                  styles.inputWrap,
                  {
                    borderColor: colors.text,
                    backgroundColor: colors.surface,
                  },
                ]}
              >
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="e.g. Travel, Design Inspiration..."
                  placeholderTextColor={colors.secondary}
                  value={name}
                  onChangeText={(txt) => setName(txt.slice(0, 40))}
                  autoFocus
                />
              </View>
            </View>

            {/* COLOR */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.text, marginBottom: spacing.sm }]}>COLOR</Text>
              <View style={styles.gridRow}>
                {COLLECTION_COLORS.map((color) => {
                  const isSelected = selectedColor === color
                  return (
                    <Pressable
                      key={color}
                      onPress={() => setSelectedColor(color)}
                      style={[
                        styles.colorSwatch,
                        {
                          backgroundColor: color,
                          borderColor: colors.text,
                          borderWidth: isSelected ? 3 : strokeWidth.card,
                        },
                      ]}
                    >
                      {isSelected && (
                        <Ionicons name="checkmark" size={18} color="#000" />
                      )}
                    </Pressable>
                  )
                })}
              </View>
            </View>

            {/* ICON */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.text, marginBottom: spacing.sm }]}>ICON</Text>
              <View style={styles.gridRow}>
                {COLLECTION_ICONS.map((icon) => {
                  const isSelected = selectedIcon === icon
                  return (
                    <Pressable
                      key={icon}
                      onPress={() => setSelectedIcon(icon)}
                      style={[
                        styles.iconSwatch,
                        {
                          borderColor: colors.text,
                          borderWidth: isSelected ? 3 : strokeWidth.card,
                          backgroundColor: isSelected ? selectedColor : colors.surface,
                        },
                      ]}
                    >
                      <Ionicons
                        name={icon === 'ellipsis-horizontal' ? icon : `${icon}-outline`}
                        size={20}
                        color={isSelected ? '#000' : colors.text}
                      />
                    </Pressable>
                  )
                })}
              </View>
            </View>
          </ScrollView>

          {/* Create Button */}
          <View style={[styles.footer, { paddingBottom: isSmall ? spacing.lg : spacing.xl }]}>
            <Pressable
              style={[
                styles.createBtn,
                {
                  borderColor: colors.text,
                  backgroundColor: name.trim() ? thannuColors.mint : colors.surface,
                  opacity: name.trim() ? 1 : 0.6,
                },
                name.trim() ? { ...hardShadow.md, shadowColor: colors.text } : {},
              ]}
              disabled={!name.trim()}
              onPress={() => {
                if (name.trim()) {
                  onCreate({ name: name.trim(), color: selectedColor, icon: selectedIcon })
                }
              }}
            >
              <Text style={[styles.createBtnText, { color: colors.text }]}>
                Create collection
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFill as any,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: strokeWidth.card,
    borderBottomWidth: 0,
    maxHeight: '90%',
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: thannuRadius.sm,
    borderWidth: strokeWidth.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  counter: {
    fontSize: 11,
    fontWeight: '600',
  },
  inputWrap: {
    borderWidth: strokeWidth.card,
    borderRadius: thannuRadius.md,
    height: 48,
    paddingHorizontal: spacing.sm,
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  colorSwatch: {
    width: 36,
    height: 36,
    borderRadius: thannuRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSwatch: {
    width: 36,
    height: 36,
    borderRadius: thannuRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    padding: spacing.lg,
    paddingTop: spacing.md,
  },
  createBtn: {
    height: 52,
    borderRadius: thannuRadius.md,
    borderWidth: strokeWidth.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createBtnText: {
    fontSize: 16,
    fontWeight: '800',
  },
})
