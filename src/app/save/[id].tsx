import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native'
import Animated, { FadeIn, SlideInDown, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Text } from '@/components/ui'
import { useColors, useIsDark, useResponsive } from '@/hooks'
import {
  hardShadow,
  minTouchTarget,
  spacing,
  strokeWidth,
  thannuColors,
  thannuRadius,
} from '@/lib'

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_SAVE = {
  id: '5',
  title: 'Ankit Dungawat on Instagram',
  domain: 'Instagram',
  url: 'instagram.com/codewith_random/p/Ddld...',
  date: '14 Sep 2026 at 9:09 AM',
  collection: 'DSA',
  collectionColor: '#F45D8E', // Pinkish mock color
  description: 'codewith_random on September 10, 2026: "I was really bad at DSA until I found these websites. 😭💻\n\nIf DSA feels confusing because you’re trying to understand algorithms only through code, visualization can change the way you learn.\n\nThese websites let you visually explore things like array..."',
  color: '#1B69BC', // Mock hero image background color
}

// ─── Components ───────────────────────────────────────────────────────────────

function IconButton({
  icon,
  onPress,
  accessibilityLabel,
}: {
  icon: keyof typeof Ionicons.glyphMap
  onPress?: () => void
  accessibilityLabel: string
}) {
  const colors = useColors()
  const scale = useSharedValue(1)
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }))

  return (
    <Animated.View style={anim}>
      <Pressable
        style={[
          styles.iconBtn,
          { backgroundColor: colors.surface, borderColor: colors.text, shadowColor: colors.text },
        ]}
        onPressIn={() => scale.set(withTiming(0.93, { duration: 90 }))}
        onPressOut={() => scale.set(withTiming(1, { duration: 130 }))}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        <Ionicons name={icon} size={22} color={colors.text} />
      </Pressable>
    </Animated.View>
  )
}

function ActionButton({
  icon,
  label,
  color,
  isFirst,
  isLast,
}: {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  color: string
  isFirst?: boolean
  isLast?: boolean
}) {
  const colors = useColors()
  const scale = useSharedValue(1)
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }))

  return (
    <Animated.View style={[styles.actionBtnWrapper, anim]}>
      <Pressable
        style={[
          styles.actionBtn,
          { borderColor: colors.text },
          isFirst && { borderTopLeftRadius: thannuRadius.sm, borderBottomLeftRadius: thannuRadius.sm },
          isLast && { borderTopRightRadius: thannuRadius.sm, borderBottomRightRadius: thannuRadius.sm, borderRightWidth: strokeWidth.card },
        ]}
        onPressIn={() => scale.set(withTiming(0.97, { duration: 90 }))}
        onPressOut={() => scale.set(withTiming(1, { duration: 130 }))}
      >
        <Ionicons name={icon} size={20} color={color} />
        <Text style={[styles.actionLabel, { color }]}>{label}</Text>
      </Pressable>
    </Animated.View>
  )
}

export default function SaveDetailScreen() {
  const router = useRouter()
  const colors = useColors()
  const insets = useSafeAreaInsets()
  const [isExpanded, setIsExpanded] = useState(false)

  const openLinkScale = useSharedValue(1)
  const openLinkAnim = useAnimatedStyle(() => ({ transform: [{ scale: openLinkScale.get() }] }))

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
        {/* ── Hero Image Area ── */}
        <Animated.View entering={FadeIn.duration(400)} style={[styles.heroArea, { backgroundColor: MOCK_SAVE.color }]}>
          {/* Header Controls */}
          <View style={[styles.headerOverlay, { paddingTop: Math.max(insets.top, spacing.md) }]}>
            <IconButton icon="arrow-back" onPress={() => router.back()} accessibilityLabel="Go back" />
            <IconButton icon="volume-mute-outline" onPress={() => {}} accessibilityLabel="Mute" />
          </View>
        </Animated.View>

        {/* ── Content Sheet ── */}
        <Animated.View
          entering={SlideInDown.delay(100).duration(400)}
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              borderColor: colors.text,
            },
          ]}
        >
          {/* Favicon & Domain */}
          <View style={styles.domainRow}>
            <View style={styles.favicon}>
              <Ionicons name="logo-instagram" size={14} color="#fff" />
            </View>
            <Text style={[styles.domainText, { color: colors.text }]}>{MOCK_SAVE.domain}</Text>
          </View>

          {/* Title & Edit Row */}
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
              {MOCK_SAVE.title}
            </Text>
            <IconButton icon="pencil" onPress={() => {}} accessibilityLabel="Edit" />
          </View>

          {/* Badges Row */}
          <View style={styles.badgesRow}>
            <View style={[styles.collectionBadge, { borderColor: colors.text }]}>
              <View style={[styles.collectionColorDot, { backgroundColor: MOCK_SAVE.collectionColor, borderColor: colors.text }]} />
              <Text style={[styles.collectionBadgeText, { color: colors.text }]}>{MOCK_SAVE.collection}</Text>
            </View>
            <Text style={[styles.dateText, { color: colors.secondary }]}>{MOCK_SAVE.date}</Text>
          </View>

          {/* Open Link Button */}
          <Animated.View style={openLinkAnim}>
            <Pressable
              style={[
                styles.openLinkBtn,
                { backgroundColor: thannuColors.sun, borderColor: colors.text, shadowColor: colors.text },
              ]}
              onPressIn={() => openLinkScale.set(withTiming(0.97, { duration: 90 }))}
              onPressOut={() => openLinkScale.set(withTiming(1, { duration: 130 }))}
            >
              <View style={styles.openLinkContent}>
                <Text style={styles.openLinkTitle}>Open link</Text>
                <Text style={styles.openLinkSubtitle} numberOfLines={1}>
                  {MOCK_SAVE.url}
                </Text>
              </View>
              <View style={styles.openLinkIconWrap}>
                <Ionicons name="arrow-forward" size={20} color={thannuColors.white} />
              </View>
            </Pressable>
          </Animated.View>

          {/* Segmented Actions */}
          <View style={[styles.actionsRow, { shadowColor: colors.text, backgroundColor: colors.surface }]}>
            <ActionButton icon="share-outline" label="Share" color={colors.text} isFirst />
            <ActionButton icon="folder-outline" label="Move" color={colors.text} />
            <ActionButton icon="refresh-outline" label="Refresh" color={colors.text} />
            <ActionButton icon="trash-outline" label="Delete" color={thannuColors.coral} isLast />
          </View>

          {/* Description Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>DESCRIPTION</Text>
            <Text
              style={[styles.bodyText, { color: colors.text }]}
              numberOfLines={isExpanded ? undefined : 6}
            >
              {MOCK_SAVE.description}
            </Text>
            {!isExpanded && (
              <Pressable onPress={() => setIsExpanded(true)} hitSlop={8}>
                <Text style={[styles.showMore, { color: colors.text }]}>Show more</Text>
              </Pressable>
            )}
          </View>

          {/* Tags Section */}
          <View style={[styles.section, { paddingBottom: Math.max(insets.bottom, 48) }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>TAGS</Text>
            <Text style={[styles.bodyText, { color: colors.secondary }]}>No tags added yet.</Text>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroArea: {
    height: 320,
    width: '100%',
  },
  headerOverlay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  iconBtn: {
    width: minTouchTarget,
    height: minTouchTarget,
    borderRadius: thannuRadius.sm,
    borderWidth: strokeWidth.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  sheet: {
    marginTop: -40,
    minHeight: 600,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: strokeWidth.card,
    borderBottomWidth: 0,
    padding: spacing.xl,
  },
  domainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  favicon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#E1306C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  domainText: {
    fontSize: 14,
    fontWeight: '700',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 28,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  collectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: strokeWidth.card,
    borderRadius: thannuRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  collectionColorDot: {
    width: 10,
    height: 10,
    borderWidth: 1,
    borderRadius: 2,
  },
  collectionBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  dateText: {
    fontSize: 12,
    fontWeight: '500',
  },
  openLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: thannuRadius.md,
    borderWidth: strokeWidth.card,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  openLinkContent: {
    flex: 1,
    marginRight: spacing.md,
  },
  openLinkTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#000',
    marginBottom: 2,
  },
  openLinkSubtitle: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.6)',
    fontWeight: '600',
  },
  openLinkIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    borderRadius: thannuRadius.sm,
    borderWidth: strokeWidth.card,
    borderRightWidth: 0, // handeled by last item
    marginBottom: spacing.xl,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  actionBtnWrapper: {
    flex: 1,
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRightWidth: strokeWidth.card,
    gap: 4,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '800',
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '500',
    marginBottom: spacing.sm,
  },
  showMore: {
    fontSize: 14,
    fontWeight: '900',
    textDecorationLine: 'underline',
  },
})
