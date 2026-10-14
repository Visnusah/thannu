import * as Clipboard from 'expo-clipboard'
import * as Haptics from 'expo-haptics'
import { Ionicons } from '@expo/vector-icons'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'expo-router'
import {
  PanResponder,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native'
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeOut,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated'

import { Screen, CreateCollectionModal } from '@/components'
import { ScreenErrorBoundary } from '@/components/error'
import { Text } from '@/components/ui'
import { useColors, useResponsive, type ScreenSize, useIsDark, useSupabaseSync } from '@/hooks'
import {
  useCollectionsStore,
  isValidLinkUrl,
  useLinksStore,
  useSettingsStore,
  type Collection,
  type CollectionPriority,
} from '@/stores'
import {
  gridGap,
  minTouchTarget,
  screenPaddingH,
  spacing,
  strokeWidth,
  thannuColors,
  thannuRadius,
  type Colors,
} from '@/lib'

const priorityColor: Record<CollectionPriority, string> = {
  high: thannuColors.coral,
  medium: thannuColors.sun,
  low: thannuColors.blue,
  none: 'transparent',
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const createStyles = (colors: Colors, isSmall: boolean, width: number, size: ScreenSize, isDark: boolean) => {
  const colWidth = (width - screenPaddingH[size] * 2 - gridGap) / 2

  return StyleSheet.create({
    // Header row
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: isSmall ? spacing.md : spacing.lg,
    },
    headerIcons: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    iconBtn: {
      width: minTouchTarget,
      height: minTouchTarget,
      borderRadius: thannuRadius.sm,
      borderWidth: strokeWidth.card,
      borderColor: colors.text,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.text,
      shadowOffset: { width: 2, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 0,
      elevation: 3,
    },

    // Hero title
    heroBlock: {
      marginBottom: isSmall ? spacing.md : spacing.lg,
      gap: 2,
    },
    heroTitle: {
      fontSize: isSmall ? 34 : 40,
      fontWeight: '800',
      color: colors.text,
      letterSpacing: -1.2,
      lineHeight: isSmall ? 38 : 44,
    },

    // Quick-save field
    quickSaveRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: isSmall ? spacing.md : spacing.lg,
    },
    quickSaveField: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: strokeWidth.card,
      borderColor: colors.text,
      borderRadius: thannuRadius.md,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.md,
      height: 52,
      gap: spacing.sm,
      shadowColor: colors.text,
      shadowOffset: { width: 2, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 0,
      elevation: 3,
    },
    quickSaveInput: {
      flex: 1,
      fontSize: isSmall ? 14 : 15,
      color: colors.text,
    },
    addBtn: {
      width: 52,
      height: 52,
      borderRadius: thannuRadius.md,
      borderWidth: strokeWidth.card,
      borderColor: colors.text,
      backgroundColor: thannuColors.sun,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.text,
      shadowOffset: { width: 4, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 0,
      elevation: 5,
    },

    // Banners
    banner: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: strokeWidth.card,
      borderColor: colors.text,
      borderRadius: thannuRadius.md,
      padding: isSmall ? spacing.sm : spacing.md,
      marginBottom: spacing.sm,
      gap: spacing.sm,
      shadowColor: colors.text,
      shadowOffset: { width: 2, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 0,
      elevation: 3,
    },
    bannerMint: { backgroundColor: isDark ? '#0D3325' : thannuColors.mintSoft },
    bannerIcon: {
      width: 40,
      height: 40,
      borderRadius: thannuRadius.sm,
      borderWidth: strokeWidth.chip,
      borderColor: colors.text,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bannerMintIcon: { backgroundColor: isDark ? colors.surface : thannuColors.mint },
    bannerText: { flex: 1 },
    bannerChevron: {
      opacity: 0.5,
    },

    // Collections section
    sectionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
      marginTop: isSmall ? spacing.md : spacing.lg,
    },
    sectionLabel: {
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 1.2,
      color: colors.secondary,
      textTransform: 'uppercase',
    },
    sortBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 4,
      paddingHorizontal: spacing.sm,
      borderRadius: thannuRadius.pill,
      borderWidth: strokeWidth.chip,
      borderColor: colors.border,
    },

    // Collection grid
    gridWrapper: {
      zIndex: 51,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: gridGap,
    },

    // Collection card
    collectionCard: {
      width: colWidth,
      borderRadius: thannuRadius.lg,
      borderWidth: strokeWidth.card,
      borderColor: colors.text,
      backgroundColor: colors.surface,
      overflow: 'visible',
      shadowColor: colors.text,
      shadowOffset: { width: 4, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 0,
      elevation: 5,
    },
    collectionTab: {
      height: 6,
      borderTopLeftRadius: thannuRadius.lg - 2,
      borderTopRightRadius: thannuRadius.lg - 2,
    },
    collectionBody: {
      padding: isSmall ? spacing.sm : spacing.md,
      gap: spacing.sm,
    },
    collectionIconTile: {
      width: 44,
      height: 44,
      borderRadius: thannuRadius.sm,
      borderWidth: strokeWidth.chip,
      borderColor: colors.text,
      alignItems: 'center',
      justifyContent: 'center',
    },
    collectionFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 2,
    },
    newBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: thannuRadius.pill,
      borderWidth: strokeWidth.chip,
      borderColor: colors.text,
      backgroundColor: thannuColors.sun,
    },
    priorityFlag: {
      width: 20,
      height: 20,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: colors.text,
      alignItems: 'center',
      justifyContent: 'center',
    },

    // Floating action buttons (Edit, Share, Delete)
    floatingActionBtn: {
      position: 'absolute',
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.surface,
      borderWidth: strokeWidth.card,
      borderColor: colors.text,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.text,
      shadowOffset: { width: 3, height: 3 },
      shadowOpacity: 1,
      shadowRadius: 0,
      elevation: 6,
      zIndex: 200,
    },
  })
}

// ─── Sub-components ───────────────────────────────────────────────────────────

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
  const styles = useMemo(
    () =>
      StyleSheet.create({
        btn: {
          width: minTouchTarget,
          height: minTouchTarget,
          borderRadius: thannuRadius.sm,
          borderWidth: strokeWidth.card,
          borderColor: colors.text,
          backgroundColor: colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: colors.text,
          shadowOffset: { width: 2, height: 2 },
          shadowOpacity: 1,
          shadowRadius: 0,
          elevation: 3,
        },
      }),
    [colors]
  )

  const scale = useSharedValue(1)
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))

  return (
    <Animated.View style={anim}>
      <Pressable
        style={styles.btn}
        onPressIn={() => {
          scale.set(withTiming(0.93, { duration: 90 }))
        }}
        onPressOut={() => {
          scale.set(withTiming(1, { duration: 130 }))
        }}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        <Ionicons name={icon} size={20} color={colors.text} />
      </Pressable>
    </Animated.View>
  )
}

function Banner({
  title,
  subtitle,
  styles,
  onPress,
  onDismiss,
}: {
  title: string
  subtitle: string
  styles: ReturnType<typeof createStyles>
  onPress?: () => void
  onDismiss?: () => void
}) {
  const colors = useColors()
  const translateX = useSharedValue(0)
  const opacity = useSharedValue(1)
  const hapticsEnabled = useSettingsStore((state) => state.hapticsEnabled)

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) =>
      gestureState.dx > 10 && Math.abs(gestureState.dy) < 15,
    onPanResponderMove: (_, gestureState) => {
      if (gestureState.dx > 0) {
        translateX.set(gestureState.dx)
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dx > 75 || gestureState.vx > 0.5) {
        translateX.set(
          withTiming(400, { duration: 250 }, () => {
            if (onDismiss) runOnJS(onDismiss)()
          })
        )
        opacity.set(withTiming(0, { duration: 200 }))
        if (hapticsEnabled) {
          runOnJS(Haptics.notificationAsync)(Haptics.NotificationFeedbackType.Success)
        }
      } else {
        translateX.set(withSpring(0, { damping: 15 }))
      }
    },
  })

  const bannerAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }))

  return (
    <Animated.View entering={FadeInDown.delay(500).duration(500)}>
      <Animated.View
        style={bannerAnimStyle}
        {...panResponder.panHandlers}
      >
        <Pressable
          style={[styles.banner, styles.bannerMint]}
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={`${title}. Swipe right to clear.`}
        >
          <View style={[styles.bannerIcon, styles.bannerMintIcon]}>
            <Ionicons name="time-outline" size={20} color={colors.text} />
          </View>
          <View style={styles.bannerText}>
            <Text variant="label" style={{ color: colors.text, fontWeight: '700' }}>
              {title}
            </Text>
            <Text variant="caption" style={{ color: colors.secondary }}>
              {subtitle} · Swipe right to clear
            </Text>
          </View>
          <Pressable
            hitSlop={12}
            onPress={(e) => {
              e.stopPropagation()
              if (onDismiss) onDismiss()
            }}
            accessibilityLabel="Clear notification"
            accessibilityRole="button"
          >
            <Ionicons
              name="checkmark-circle-outline"
              size={22}
              color={colors.text}
              style={{ opacity: 0.6 }}
            />
          </Pressable>
        </Pressable>
      </Animated.View>
    </Animated.View>
  )
}

// Helper for floating action buttons
function FloatingActionButton({
  icon,
  style,
  delay,
  isActive,
  onPress,
  styles,
}: {
  icon: keyof typeof Ionicons.glyphMap
  style: any
  delay: number
  isActive: boolean
  onPress: () => void
  styles: ReturnType<typeof createStyles>
}) {
  const colors = useColors()
  const scale = useSharedValue(0)
  
  useEffect(() => {
    if (isActive) {
      setTimeout(() => {
        scale.value = withSpring(1, { damping: 22, stiffness: 350 })
      }, delay)
    } else {
      scale.value = withTiming(0, { duration: 120 })
    }
  }, [isActive, scale, delay])

  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: scale.value > 0 ? 1 : 0,
  }))

  return (
    <Animated.View style={[styles.floatingActionBtn, style, anim]} pointerEvents={isActive ? 'auto' : 'none'}>
      <Pressable onPress={onPress} hitSlop={8} style={{ padding: 8 }}>
        <Ionicons name={icon} size={22} color={colors.text} />
      </Pressable>
    </Animated.View>
  )
}

function CollectionCard({
  item,
  styles,
  index,
  isActive,
  onActivate,
}: {
  item: Collection
  styles: ReturnType<typeof createStyles>
  index: number
  isActive: boolean
  onActivate: () => void
}) {
  const router = useRouter()
  const colors = useColors()
  const scale = useSharedValue(1)
  const rotation = useSharedValue(0)

  const isLeftColumn = index % 2 === 0

  // Floating card animation when active
  useEffect(() => {
    if (isActive) {
      scale.value = withSpring(1.05, { damping: 22, stiffness: 350 })
      rotation.value = withSpring(isLeftColumn ? 3 : -3, { damping: 22, stiffness: 350 })
    } else {
      scale.value = withTiming(1, { duration: 150 })
      rotation.value = withTiming(0, { duration: 150 })
    }
  }, [isActive, scale, rotation, isLeftColumn])

  const anim = useAnimatedStyle(() => ({ 
    transform: [
      { scale: scale.value },
      { rotateZ: `${rotation.value}deg` }
    ],
    zIndex: isActive ? 100 : 1,
  }))

  const hasPriority = item.priority !== 'none'
  const flagColor = priorityColor[item.priority]

  return (
    <Animated.View
      entering={FadeInDown.delay(700 + index * 80).duration(500)}
      style={{ zIndex: isActive ? 100 : 1 }}
    >
      <Animated.View style={anim}>
        <Pressable
          style={styles.collectionCard}
          onPressIn={() => {
            if (!isActive) scale.set(withTiming(0.97, { duration: 90 }))
          }}
          onPressOut={() => {
            if (!isActive) scale.set(withTiming(1, { duration: 130 }))
          }}
          onPress={() => {
            if (!isActive) {
              router.push(`/collection/${item.id}`)
            }
          }}
          onLongPress={onActivate}
          delayLongPress={300}
          accessibilityRole="button"
          accessibilityLabel={`${item.name}, ${item.itemCount} items`}
        >
        {/* Colored folder tab */}
        <View
          style={[
            styles.collectionTab,
            {
              backgroundColor: item.color,
              borderBottomWidth: hasPriority ? 2 : 0,
              borderBottomColor: colors.text,
              borderStyle: hasPriority ? 'dashed' : 'solid',
            },
          ]}
        />
        <View style={styles.collectionBody}>
          {/* Icon tile */}
          <View style={[styles.collectionIconTile, { backgroundColor: item.color + '33' }]}>
            <Ionicons name={item.icon as any} size={22} color={item.color === thannuColors.ink ? colors.text : item.color} />
          </View>

          {/* Count */}
          <Text
            variant="caption"
            style={{ color: colors.secondary, fontWeight: '600' }}
            allowFontScaling
            maxFontSizeMultiplier={1.2}
          >
            {item.itemCount} items
          </Text>

          {/* Footer: title + badges */}
          <View style={styles.collectionFooter}>
            <Text
              variant="h3"
              style={{
                color: colors.text,
                fontWeight: '800',
                fontSize: 14,
                flexShrink: 1,
                flexWrap: 'wrap',
              }}
              numberOfLines={2}
              allowFontScaling
              maxFontSizeMultiplier={1.2}
            >
              {item.name}
            </Text>

            {/* NEW badge */}
            {item.newCount > 0 && (
              <View style={styles.newBadge}>
                <Text
                  style={{ fontSize: 10, fontWeight: '800', color: colors.text }}
                  allowFontScaling={false}
                >
                  {item.newCount} NEW
                </Text>
              </View>
            )}

            {/* Priority flag */}
            {hasPriority && (
              <View style={[styles.priorityFlag, { backgroundColor: flagColor }]}>
                <Ionicons name="flag" size={10} color={thannuColors.white} />
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons (Rendered inside the card but positioned absolute outside) */}
        <FloatingActionButton
          icon="trash-outline"
          style={isLeftColumn ? { top: -25, right: -25 } : { top: -25, left: -25 }}
          delay={50}
          isActive={isActive}
          onPress={() => {}}
          styles={styles}
        />
        <FloatingActionButton
          icon="share-outline"
          style={isLeftColumn ? { top: 15, right: -35 } : { top: 15, left: -35 }}
          delay={100}
          isActive={isActive}
          onPress={() => {}}
          styles={styles}
        />
        <FloatingActionButton
          icon="pencil"
          style={isLeftColumn ? { top: 55, right: -20 } : { top: 55, left: -20 }}
          delay={150}
          isActive={isActive}
          onPress={() => {}}
          styles={styles}
        />
      </Pressable>
      </Animated.View>
    </Animated.View>
  )
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

function HomeScreenContent() {
  const router = useRouter()
  const { isSmall, width, size } = useResponsive()
  const colors = useColors()
  const isDark = useIsDark()
  const styles = useMemo(() => createStyles(colors, isSmall, width, size, isDark), [colors, isSmall, width, size, isDark])

  const { collections, addCollection, ensureUnsortedCollection } = useCollectionsStore()
  const links = useLinksStore((state) => state.links)
  const addLink = useLinksStore((state) => state.addLink)
  const hapticsEnabled = useSettingsStore((state) => state.hapticsEnabled)
  const { pushCollection, pushLink, markAllReviewed } = useSupabaseSync()

  const [activeCardId, setActiveCardId] = useState<string | null>(null)
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false)
  
  const [linkInput, setLinkInput] = useState('')
  const newSavesCount = links.filter((link) => link.reviewedAt === null).length

  const handlePaste = async () => {
    const text = await Clipboard.getStringAsync()
    if (text) {
      setLinkInput(text)
      if (hapticsEnabled) Haptics.selectionAsync()
    }
  }

  const handleSave = () => {
    const url = linkInput.trim()
    if (!isValidLinkUrl(url)) return

    // Ensure Unsorted collection exists; if missing, create it automatically
    const unsortedCol = ensureUnsortedCollection()

    const newLinkId = addLink({
      url,
      collectionId: unsortedCol.id,
    })
    if (hapticsEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    setLinkInput('')

    const createdLink = useLinksStore.getState().links.find((l) => l.id === newLinkId)
    if (createdLink) {
      pushLink(createdLink).catch((err) => {
        console.warn('[HomeScreen] Failed to push link to Supabase:', err)
      })
    }
  }

  // Floating "+" add button pulse
  const addPulse = useSharedValue(1)

  useEffect(() => {
    addPulse.set(
      withRepeat(
        withTiming(1.06, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
        -1,
        true
      )
    )
  }, [addPulse])
  const addPulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: addPulse.get() }] }))

  return (
    <View style={{ flex: 1 }}>
      <Screen scroll>
        {/* ── Header ── */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
          <View />
          <View style={styles.headerIcons}>
            <IconButton icon="settings-outline" accessibilityLabel="Settings" onPress={() => router.push('/settings')} />
            <IconButton icon="folder-open-outline" accessibilityLabel="Add folder" onPress={() => setIsCreateModalVisible(true)} />
            <IconButton icon="search-outline" accessibilityLabel="Search" />
          </View>
        </Animated.View>

        {/* ── Hero Title ── */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.heroBlock}>
          <Text style={styles.heroTitle} allowFontScaling maxFontSizeMultiplier={1.1}>
            Save now.{'\n'}Find anytime.
          </Text>
        </Animated.View>

        {/* ── Quick-save field ── */}
        <Animated.View entering={FadeInDown.delay(250).duration(500)} style={styles.quickSaveRow}>
          <View style={styles.quickSaveField}>
            <Ionicons name="pricetag-outline" size={18} color={colors.secondary} />
            <TextInput
              style={styles.quickSaveInput}
              placeholder="Paste link to quick save"
              placeholderTextColor={colors.secondary}
              accessibilityLabel="Paste link to quick save"
              returnKeyType="go"
              autoCapitalize="none"
              autoCorrect={false}
              allowFontScaling
              maxFontSizeMultiplier={1.2}
              value={linkInput}
              onChangeText={setLinkInput}
              onSubmitEditing={handleSave}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Paste from clipboard"
              hitSlop={8}
              onPress={handlePaste}
            >
              <Ionicons name="clipboard-outline" size={18} color={colors.secondary} />
            </Pressable>
          </View>

          {/* Sun "+" add button */}
          <Animated.View style={addPulseStyle}>
            <Pressable
              style={styles.addBtn}
              accessibilityRole="button"
              accessibilityLabel="Add link"
              onPress={handleSave}
            >
              <Ionicons name="add" size={28} color={colors.text} />
            </Pressable>
          </Animated.View>
        </Animated.View>

        {/* ── Mint banner (unreviewed saves) ── */}
        {newSavesCount > 0 && (
          <Banner
            title={`${newSavesCount} new save${newSavesCount === 1 ? '' : 's'} waiting`}
            subtitle="Review now"
            styles={styles}
            onPress={() => router.push('/review')}
            onDismiss={() => {
              markAllReviewed().catch((err) => {
                console.warn('[HomeScreen] Failed to mark all reviewed:', err)
              })
            }}
          />
        )}

        {/* ── My Collections ── */}
        <Animated.View entering={FadeInDown.delay(600).duration(500)} style={styles.sectionRow}>
          <Text style={styles.sectionLabel} allowFontScaling={false}>
            My Collections
          </Text>
        </Animated.View>

        {/* Full-screen Dark Overlay inside ScrollView so zIndex works */}
        {activeCardId !== null && (
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
            style={{
              position: 'absolute',
              top: -3000,
              left: -3000,
              right: -3000,
              bottom: -3000,
              backgroundColor: 'rgba(0,0,0,0.6)',
              zIndex: 50,
            }}
          >
            <Pressable style={{ flex: 1 }} onPress={() => setActiveCardId(null)} />
          </Animated.View>
        )}

        {/* ── 2-col Collection Grid ── */}
        <View style={[styles.gridWrapper, { zIndex: activeCardId !== null ? 51 : 1 }]}>
          <View style={styles.grid}>
            {[...collections]
              .sort((a, b) => Number(b.priority !== 'none') - Number(a.priority !== 'none'))
              .map((item, index) => {
                const itemLinks = links.filter((link) => link.collectionId === item.id)
                const displayItem = {
                  ...item,
                  itemCount: itemLinks.length,
                  newCount: itemLinks.filter((link) => link.reviewedAt === null).length,
                }

                return (
                  <CollectionCard
                    key={displayItem.id}
                    item={displayItem}
                    styles={styles}
                    index={index}
                    isActive={activeCardId === displayItem.id}
                    onActivate={() => setActiveCardId(displayItem.id)}
                  />
                )
              })}
          </View>
        </View>
      </Screen>

      <CreateCollectionModal
        visible={isCreateModalVisible}
        onClose={() => setIsCreateModalVisible(false)}
        onCreate={(data) => {
          const newCollection = addCollection(data)
          if (hapticsEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
          setIsCreateModalVisible(false)
          pushCollection(newCollection).catch((err) => {
            console.warn('[HomeScreen] Failed to push collection to Supabase:', err)
          })
        }}
      />
    </View>
  )
}

export default function HomeScreen() {
  return (
    <ScreenErrorBoundary screenName="Home">
      <HomeScreenContent />
    </ScreenErrorBoundary>
  )
}
