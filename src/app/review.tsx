import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import {
  Pressable,
  StyleSheet,
  View,
} from 'react-native'
import Animated, { FadeIn, FadeOut, SlideInRight, SlideOutLeft, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Text } from '@/components/ui'
import { useColors, useIsDark, useResponsive } from '@/hooks'
import {
  minTouchTarget,
  spacing,
  strokeWidth,
  thannuColors,
  thannuRadius,
} from '@/lib'

// ─── Mock Data ────────────────────────────────────────────────────────────────

const UNREVIEWED_SAVES = [
  {
    id: '1',
    title: 'Abdul moiz on Instagram',
    domain: 'Instagram',
    url: 'instagram.com/lowkeymoizzz...',
    description: '26K likes, 136 comments - lowkeymoizzz on October 9, 2026: "Youngest in the room btw ...',
    collection: 'Unsorted',
    isVideo: true,
    color: '#1B1E21',
  },
]

// ─── Components ───────────────────────────────────────────────────────────────

function PressableScale({ children, style, onPress, disabled, ...props }: any) {
  const scale = useSharedValue(1)
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }))

  return (
    <Animated.View style={[anim, style]}>
      <Pressable
        {...props}
        onPressIn={() => !disabled && scale.set(withTiming(0.95, { duration: 90 }))}
        onPressOut={() => !disabled && scale.set(withTiming(1, { duration: 130 }))}
        onPress={onPress}
        disabled={disabled}
      >
        {children}
      </Pressable>
    </Animated.View>
  )
}

export default function ReviewScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { isSmall } = useResponsive()
  
  // Force a very dark theme for the review screen to match screenshots
  const bgColor = '#121212'
  const textColor = '#FFFFFF'
  const secondaryColor = '#888888'
  const cardColor = '#FFFFFF'
  
  const [currentIndex, setCurrentIndex] = useState(0)
  const isComplete = currentIndex >= UNREVIEWED_SAVES.length

  const handleNext = () => {
    setCurrentIndex(prev => prev + 1)
  }

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(prev => prev - 1)
  }

  // Common header
  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: Math.max(insets.top, spacing.md) }]}>
      {!isComplete && (
        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerLabel, { color: secondaryColor }]}>NEW SAVES</Text>
          <View style={styles.counterRow}>
            <Text style={[styles.counterCurrent, { color: textColor }]}>
              {String(currentIndex + 1).padStart(2, '0')}
            </Text>
            <Text style={[styles.counterTotal, { color: secondaryColor }]}>
              /{String(UNREVIEWED_SAVES.length).padStart(2, '0')}
            </Text>
          </View>
        </View>
      )}
      
      {isComplete && <View style={{ flex: 1 }} />}

      <PressableScale
        style={styles.closeBtn}
        onPress={() => router.back()}
        accessibilityLabel="Close"
      >
        <Ionicons name="close" size={20} color={textColor} />
      </PressableScale>
    </View>
  )

  const renderReviewState = () => {
    const item = UNREVIEWED_SAVES[currentIndex]
    if (!item) return null

    return (
      <Animated.View
        key={`review-${currentIndex}`}
        entering={SlideInRight.duration(300)}
        exiting={SlideOutLeft.duration(300)}
        style={styles.contentWrap}
      >
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${((currentIndex + 1) / UNREVIEWED_SAVES.length) * 100}%` }]} />
        </View>

        {/* Card */}
        <View style={styles.cardContainer}>
          <View style={[styles.card, { backgroundColor: cardColor }]}>
            {/* Domain */}
            <View style={styles.domainRow}>
              <View style={styles.favicon}>
                <Ionicons name="logo-instagram" size={14} color="#fff" />
              </View>
              <Text style={styles.domainText}>{item.domain}</Text>
            </View>

            {/* Media Area */}
            <View style={[styles.mediaArea, { backgroundColor: item.color }]}>
              {item.isVideo && (
                <View style={styles.playBtn}>
                  <Ionicons name="play" size={24} color="#fff" />
                </View>
              )}
              {/* Unsorted Badge overlay on image */}
              <View style={styles.unsortedBadge}>
                <View style={styles.unsortedIcon} />
                <Text style={styles.unsortedText}>{item.collection}</Text>
              </View>
            </View>

            {/* Content Area */}
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.cardDescription} numberOfLines={3}>{item.description}</Text>
            </View>
          </View>
        </View>

        {/* Footer Actions */}
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
          <PressableScale
            style={styles.navBtn}
            onPress={handlePrev}
            disabled={currentIndex === 0}
          >
            <Ionicons name="arrow-back" size={20} color={currentIndex === 0 ? secondaryColor : textColor} />
          </PressableScale>

          <PressableScale
            style={[styles.mainBtn, { backgroundColor: thannuColors.sun }]}
            onPress={() => {}}
          >
            <Text style={[styles.mainBtnText, { color: '#000' }]}>Open link</Text>
            <Ionicons name="arrow-forward" size={18} color="#000" />
          </PressableScale>

          <PressableScale
            style={styles.navBtn}
            onPress={handleNext}
          >
            <Ionicons name="arrow-forward" size={20} color={textColor} />
          </PressableScale>
        </View>
      </Animated.View>
    )
  }

  const renderCompleteState = () => (
    <Animated.View
      entering={FadeIn.delay(200).duration(400)}
      style={styles.contentWrap}
    >
      <View style={styles.completeCenter}>
        {/* Checkmark Circle */}
        <View style={styles.checkCircle}>
          <Ionicons name="checkmark" size={48} color="#fff" />
        </View>
        
        <Text style={[styles.completeTitle, { color: textColor }]}>You're all caught up!</Text>
        <Text style={[styles.completeSubtitle, { color: secondaryColor }]}>Great job.</Text>
        
        <View style={styles.viewedBadge}>
          <Text style={styles.viewedText}>Viewed {UNREVIEWED_SAVES.length}</Text>
        </View>
      </View>

      {/* Footer Actions */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
        <PressableScale
          style={[styles.mainBtn, { backgroundColor: '#fff', flex: 0.8, justifyContent: 'center' }]}
          onPress={handlePrev}
        >
          <Ionicons name="arrow-back" size={18} color="#000" style={{ marginRight: 8 }} />
          <Text style={[styles.mainBtnText, { color: '#000' }]}>Previous</Text>
        </PressableScale>

        <PressableScale
          style={[styles.mainBtn, { backgroundColor: thannuColors.sun, flex: 1, justifyContent: 'center' }]}
          onPress={() => router.back()}
        >
          <Ionicons name="home-outline" size={18} color="#000" style={{ marginRight: 8 }} />
          <Text style={[styles.mainBtnText, { color: '#000' }]}>Done</Text>
        </PressableScale>
      </View>
    </Animated.View>
  )

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {renderHeader()}
      <View style={styles.body}>
        {isComplete ? renderCompleteState() : renderReviewState()}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  body: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  headerTitleWrap: {
    justifyContent: 'center',
  },
  headerLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: -4,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  counterCurrent: {
    fontSize: 24,
    fontWeight: '900',
  },
  counterTotal: {
    fontSize: 14,
    fontWeight: '700',
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: thannuRadius.sm,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentWrap: {
    flex: 1,
  },
  progressContainer: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: thannuColors.sun,
  },
  cardContainer: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  card: {
    borderRadius: thannuRadius.lg,
    padding: spacing.md,
  },
  domainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  favicon: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: '#E1306C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  domainText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#000',
  },
  mediaArea: {
    height: 300,
    borderRadius: thannuRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    position: 'relative',
    overflow: 'hidden',
  },
  playBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 4,
  },
  unsortedBadge: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.md,
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: thannuRadius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  unsortedIcon: {
    width: 14,
    height: 14,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#000',
    backgroundColor: '#C2C4C6',
  },
  unsortedText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#000',
  },
  cardContent: {
    gap: spacing.xs,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#000',
  },
  cardDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  navBtn: {
    width: 56,
    height: 56,
    borderRadius: thannuRadius.md,
    borderWidth: strokeWidth.card,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainBtn: {
    flex: 1,
    height: 56,
    borderRadius: thannuRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  mainBtnText: {
    fontSize: 16,
    fontWeight: '800',
  },
  completeCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#2CD97B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  completeTitle: {
    fontSize: 24,
    fontWeight: '900',
    marginBottom: spacing.xs,
  },
  completeSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: spacing.xl,
  },
  viewedBadge: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: thannuRadius.pill,
  },
  viewedText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#000',
  },
})
