import { Ionicons } from '@expo/vector-icons'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useMemo } from 'react'
import {
  Pressable,
  StyleSheet,
  View,
} from 'react-native'
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'

import { Screen } from '@/components'
import { ScreenErrorBoundary } from '@/components/error'
import { Text } from '@/components/ui'
import { useColors, useResponsive, type ScreenSize, useIsDark } from '@/hooks'
import {
  gridGap,
  hardShadow,
  minTouchTarget,
  screenPaddingH,
  spacing,
  strokeWidth,
  thannuColors,
  thannuRadius,
  type Colors,
} from '@/lib'

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_SAVES = [
  { id: '1', title: 'Abhishek Agarwal on Instagram', domain: 'Instagram', isVideo: true, color: '#3A9E2D' },
  { id: '2', title: 'Volkan Erdogan on Instagram', domain: 'Instagram', isVideo: true, color: '#88989F' },
  { id: '3', title: 'codeN’ on Instagram', domain: 'Instagram', isVideo: true, color: '#1E1E1E' },
  { id: '4', title: 'Shubhaam Tiwary on Instagram', domain: 'Instagram', isVideo: true, color: '#1F1E24' },
  { id: '5', title: 'Ankit Dungawat on Instagram', domain: 'Instagram', isVideo: false, color: '#1B69BC' },
  { id: '6', title: 'Moksh Agrawal on Instagram', domain: 'Instagram', isVideo: true, color: '#25203A' },
]

// ─── Styles ───────────────────────────────────────────────────────────────────

const createStyles = (colors: Colors, isSmall: boolean, width: number, size: ScreenSize) => {
  const colWidth = (width - screenPaddingH[size] * 2 - gridGap) / 2

  return StyleSheet.create({
    // Header
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.xl,
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
    headerTitleContainer: {
      alignItems: 'center',
      flex: 1,
      paddingHorizontal: spacing.sm,
    },
    headerTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.text,
    },
    headerSubtitle: {
      fontSize: 11,
      color: colors.secondary,
      marginTop: 2,
    },

    // Section title
    sectionTitle: {
      fontSize: 13,
      fontWeight: '800',
      letterSpacing: 0.5,
      color: colors.text,
      marginBottom: spacing.md,
      textTransform: 'uppercase',
    },

    // Grid
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: gridGap,
      paddingBottom: 48,
    },

    // Card
    card: {
      width: colWidth,
      borderRadius: thannuRadius.md,
      borderWidth: strokeWidth.card,
      borderColor: colors.text,
      backgroundColor: colors.surface,
      overflow: 'hidden',
      shadowColor: colors.text,
      shadowOffset: { width: 3, height: 3 },
      shadowOpacity: 1,
      shadowRadius: 0,
      elevation: 4,
    },
    cardImageArea: {
      height: 100,
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      borderBottomWidth: strokeWidth.card,
      borderBottomColor: colors.text,
    },
    playBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(0,0,0,0.5)',
      alignItems: 'center',
      justifyContent: 'center',
      paddingLeft: 3, // visual center for play icon
    },
    cardBody: {
      padding: spacing.sm,
      gap: spacing.sm,
      backgroundColor: colors.surface,
    },
    cardTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.text,
      lineHeight: 16,
    },
    cardFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    favicon: {
      width: 16,
      height: 16,
      borderRadius: 4,
      backgroundColor: '#E1306C', // Insta pinkish red for mock
      alignItems: 'center',
      justifyContent: 'center',
    },
    domain: {
      fontSize: 11,
      color: colors.secondary,
    },
  })
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function IconButton({
  icon,
  onPress,
  accessibilityLabel,
  backgroundColor,
}: {
  icon: keyof typeof Ionicons.glyphMap
  onPress?: () => void
  accessibilityLabel: string
  backgroundColor?: string
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
          backgroundColor: backgroundColor || colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: colors.text,
          shadowOffset: { width: 2, height: 2 },
          shadowOpacity: 1,
          shadowRadius: 0,
          elevation: 3,
        },
      }),
    [colors, backgroundColor]
  )

  const scale = useSharedValue(1)
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }))

  return (
    <Animated.View style={anim}>
      <Pressable
        style={styles.btn}
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

function SaveCard({
  item,
  styles,
  index,
}: {
  item: (typeof MOCK_SAVES)[number]
  styles: ReturnType<typeof createStyles>
  index: number
}) {
  const router = useRouter()
  const scale = useSharedValue(1)
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }))

  return (
    <Animated.View
      entering={FadeInDown.delay(100 + index * 50).duration(400)}
      style={anim}
    >
      <Pressable
        style={styles.card}
        onPressIn={() => scale.set(withTiming(0.97, { duration: 90 }))}
        onPressOut={() => scale.set(withTiming(1, { duration: 130 }))}
        onPress={() => router.push(`/save/${item.id}` as any)}
      >
        {/* Mock Image Area */}
        <View style={[styles.cardImageArea, { backgroundColor: item.color }]}>
          {item.isVideo && (
            <View style={styles.playBtn}>
              <Ionicons name="play" size={20} color="#fff" />
            </View>
          )}
        </View>

        {/* Info Area */}
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={styles.cardFooter}>
            <View style={styles.favicon}>
              <Ionicons name="logo-instagram" size={10} color="#fff" />
            </View>
            <Text style={styles.domain}>{item.domain}</Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  )
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

import { useCollectionsStore } from '@/stores'

function CollectionScreenContent() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { collections } = useCollectionsStore()
  
  const { isSmall, width, size } = useResponsive()
  const colors = useColors()
  const styles = useMemo(() => createStyles(colors, isSmall, width, size), [colors, isSmall, width, size])

  const collection = collections.find((c) => c.id === id)
  const title = collection ? collection.name : id || 'Collection'

  return (
    <Screen scroll>
      {/* ── Header ── */}
      <View style={styles.header}>
        <IconButton 
          icon="arrow-back" 
          accessibilityLabel="Go back" 
          onPress={() => router.back()} 
        />
        
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{title}</Text>
          <Text style={styles.headerSubtitle}>{MOCK_SAVES.length} items · 0 subcollections</Text>
        </View>

        <View style={styles.headerIcons}>
          <IconButton 
            icon="folder-open-outline" 
            accessibilityLabel="Add subcollection" 
            backgroundColor={thannuColors.sun}
          />
          <IconButton 
            icon="ellipsis-horizontal" 
            accessibilityLabel="More options" 
          />
        </View>
      </View>

      {/* ── Section Title ── */}
      <Text style={styles.sectionTitle}>
        SAVES ({MOCK_SAVES.length})
      </Text>

      {/* ── Grid ── */}
      <View style={styles.grid}>
        {MOCK_SAVES.map((item, index) => (
          <SaveCard key={item.id} item={item} styles={styles} index={index} />
        ))}
      </View>
    </Screen>
  )
}

export default function CollectionScreen() {
  return (
    <ScreenErrorBoundary screenName="CollectionDetail">
      <CollectionScreenContent />
    </ScreenErrorBoundary>
  )
}
