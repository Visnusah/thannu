import { Ionicons } from '@expo/vector-icons'
import * as Linking from 'expo-linking'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState } from 'react'
import { Alert, Image, Pressable, ScrollView, Share, StyleSheet, View } from 'react-native'
import Animated, { FadeIn, SlideInDown, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { CollectionPickerModal, LinkEditModal, type LinkEditValues } from '@/components'
import { Text } from '@/components/ui'
import { useColors, useSupabaseSync } from '@/hooks'
import { fetchLinkMetadata } from '@/services/metadata'
import { useCollectionsStore, useLinksStore } from '@/stores'
import {
  minTouchTarget,
  spacing,
  strokeWidth,
  thannuColors,
  thannuRadius,
} from '@/lib'

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
  onPress,
  isFirst,
  isLast,
}: {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  color: string
  onPress?: () => void
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
         onPress={onPress}
      >
        <Ionicons name={icon} size={20} color={color} />
        <Text style={[styles.actionLabel, { color }]}>{label}</Text>
      </Pressable>
    </Animated.View>
  )
}

export default function SaveDetailScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const colors = useColors()
  const insets = useSafeAreaInsets()
  const [isExpanded, setIsExpanded] = useState(false)
  const [isEditVisible, setIsEditVisible] = useState(false)
  const [isMoveVisible, setIsMoveVisible] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const link = useLinksStore((state) => state.links.find((item) => item.id === id))
  const updateLink = useLinksStore((state) => state.updateLink)
  const collections = useCollectionsStore((state) => state.collections)
  const { deleteLink: deleteRemoteLink, moveLink, toggleLinkPin, pushLink } = useSupabaseSync()
  const openLinkScale = useSharedValue(1)
  const openLinkAnim = useAnimatedStyle(() => ({ transform: [{ scale: openLinkScale.get() }] }))

  if (!link) {
    return (
      <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
        <Ionicons name="link-outline" size={44} color={colors.secondary} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>Save not found</Text>
        <Text style={[styles.emptySubtitle, { color: colors.secondary }]}>This link may have been deleted.</Text>
        <Pressable style={[styles.emptyButton, { backgroundColor: thannuColors.sun }]} onPress={() => router.back()}>
          <Text style={styles.emptyButtonText}>Go back</Text>
        </Pressable>
      </View>
    )
  }

  const collection = collections.find((item) => item.id === link.collectionId)
  const collectionName = collection?.name || 'Unsorted'
  const collectionColor = collection?.color || thannuColors.slate
  const createdDate = new Date(link.createdAt).toLocaleDateString()
  const openLink = () => {
    Linking.openURL(link.url).catch(() => {
      Alert.alert('Unable to open link', 'Check your connection and try again.')
    })
  }
  const shareLink = () => {
    void Share.share({
      title: link.title,
      message: `${link.title}\n${link.url}`,
      url: link.url,
    }).catch(() => Alert.alert('Sharing unavailable', 'This device could not open the native share sheet.'))
  }
  const deleteLink = () => {
    Alert.alert('Delete this save?', "You can't undo this.", [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteRemoteLink(link.id)
          } catch (error) {
            console.warn('[SaveDetail] Failed to delete link remotely:', error)
          }
          router.back()
        },
      },
    ])
  }

  const saveEdits = (values: LinkEditValues) => {
    updateLink(link.id, values)
    const updated = useLinksStore.getState().links.find((item) => item.id === link.id)
    if (updated) {
      pushLink(updated).catch((error) => console.warn('[SaveDetail] Failed to sync edits:', error))
    }
    setIsEditVisible(false)
  }

  const handleMove = (targetCollection: (typeof collections)[number]) => {
    setIsMoveVisible(false)
    moveLink(link.id, targetCollection.id).then(() => {
      Alert.alert('Link moved', `Saved to ${targetCollection.name}.`)
    }).catch((error) => {
      console.warn('[SaveDetail] Failed to move link:', error)
      Alert.alert('Move failed', 'The link was kept in its current collection.')
    })
  }

  const refreshMetadata = () => {
    if (isRefreshing) return
    setIsRefreshing(true)
    fetchLinkMetadata(link.url)
      .then((metadata) => {
        updateLink(link.id, {
          title: metadata.title || link.title,
          description: metadata.description || link.description,
          imageUrl: metadata.imageUrl ?? link.imageUrl,
          domain: metadata.domain || link.domain,
        })
        const updated = useLinksStore.getState().links.find((item) => item.id === link.id)
        if (updated) {
          return pushLink(updated)
        }
      })
      .then(() => Alert.alert('Link refreshed', 'Title, description, and thumbnail are up to date.'))
      .catch(() => Alert.alert('Refresh unavailable', 'This platform did not expose metadata. Your saved link is unchanged.'))
      .finally(() => setIsRefreshing(false))
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
        {/* ── Hero Image Area ── */}
        <Animated.View entering={FadeIn.duration(400)} style={[styles.heroArea, { backgroundColor: collectionColor }] }>
          {link.imageUrl && <Image source={{ uri: link.imageUrl }} style={styles.heroImage} resizeMode="cover" />}
          {/* Header Controls */}
          <View style={[styles.headerOverlay, { paddingTop: Math.max(insets.top, spacing.md) }]}>
            <IconButton icon="arrow-back" onPress={() => router.back()} accessibilityLabel="Go back" />
            <IconButton
              icon={link.isPinned ? 'pin' : 'pin-outline'}
              onPress={() => toggleLinkPin(link.id).catch((error) => console.warn('[SaveDetail] Failed to pin link:', error))}
              accessibilityLabel={link.isPinned ? 'Unpin link' : 'Pin link'}
            />
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
              <Ionicons name="globe-outline" size={14} color="#fff" />
            </View>
            <Text style={[styles.domainText, { color: colors.text }]}>{link.domain}</Text>
          </View>

          {/* Title & Edit Row */}
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
              {link.title}
            </Text>
            <IconButton icon="pencil" onPress={() => setIsEditVisible(true)} accessibilityLabel="Edit link" />
          </View>

          {/* Badges Row */}
          <View style={styles.badgesRow}>
            <View style={[styles.collectionBadge, { borderColor: colors.text }]}>
              <View style={[styles.collectionColorDot, { backgroundColor: collectionColor, borderColor: colors.text }]} />
              <Text style={[styles.collectionBadgeText, { color: colors.text }]}>{collectionName}</Text>
            </View>
            <Text style={[styles.dateText, { color: colors.secondary }]}>{createdDate}</Text>
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
              onPress={openLink}
            >
              <View style={styles.openLinkContent}>
                <Text style={styles.openLinkTitle}>Open link</Text>
                <Text style={styles.openLinkSubtitle} numberOfLines={1}>
                  {link.url}
                </Text>
              </View>
              <View style={styles.openLinkIconWrap}>
                <Ionicons name="arrow-forward" size={20} color={thannuColors.white} />
              </View>
            </Pressable>
          </Animated.View>

          {/* Segmented Actions */}
          <View style={[styles.actionsRow, { shadowColor: colors.text, backgroundColor: colors.surface }]}>
            <ActionButton icon="share-outline" label="Share" color={colors.text} isFirst onPress={shareLink} />
            <ActionButton icon="folder-outline" label="Move" color={colors.text} onPress={() => setIsMoveVisible(true)} />
            <ActionButton icon="refresh-outline" label={isRefreshing ? 'Wait' : 'Refresh'} color={colors.text} onPress={refreshMetadata} />
            <ActionButton icon="trash-outline" label="Delete" color={thannuColors.coral} isLast onPress={deleteLink} />
          </View>

          {/* Description Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>DESCRIPTION</Text>
            <Text
              style={[styles.bodyText, { color: colors.text }]}
              numberOfLines={isExpanded ? undefined : 6}
            >
              {link.description || 'No description added yet.'}
            </Text>
            {!isExpanded && (
              <Pressable onPress={() => setIsExpanded(true)} hitSlop={8}>
                <Text style={[styles.showMore, { color: colors.text }]}>Show more</Text>
              </Pressable>
            )}
          </View>

          {link.notes ? (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>NOTE</Text>
              <Text style={[styles.bodyText, { color: colors.text }]}>{link.notes}</Text>
            </View>
          ) : null}

          {/* Tags Section */}
          <View style={[styles.section, { paddingBottom: Math.max(insets.bottom, 48) }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>TAGS</Text>
            <View style={styles.tagsRow}>
              {link.tags.map((tag) => (
                <View key={tag} style={[styles.tagChip, { backgroundColor: thannuColors.violetSoft, borderColor: colors.text }]}>
                  <Text style={[styles.tagText, { color: colors.text }]}>#{tag}</Text>
                </View>
              ))}
              {link.tags.length === 0 && <Text style={[styles.bodyText, { color: colors.secondary }]}>No tags added yet.</Text>}
            </View>
            <Pressable onPress={() => setIsEditVisible(true)} style={styles.editTagsButton} accessibilityRole="button" accessibilityLabel="Edit tags">
              <Ionicons name="add-circle-outline" size={18} color={colors.text} />
              <Text style={[styles.showMore, { color: colors.text }]}>Add or edit tags</Text>
            </Pressable>
          </View>
        </Animated.View>
      </ScrollView>
      <LinkEditModal visible={isEditVisible} link={link} onClose={() => setIsEditVisible(false)} onSave={saveEdits} />
      <CollectionPickerModal
        visible={isMoveVisible}
        collections={collections}
        currentCollectionId={link.collectionId}
        onClose={() => setIsMoveVisible(false)}
        onSelect={handleMove}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '900',
    marginTop: spacing.lg,
  },
  emptySubtitle: {
    fontSize: 15,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  emptyButton: {
    minHeight: minTouchTarget,
    borderWidth: strokeWidth.card,
    borderColor: '#121212',
    borderRadius: thannuRadius.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyButtonText: {
    color: '#121212',
    fontSize: 16,
    fontWeight: '800',
  },
  container: {
    flex: 1,
  },
  heroArea: {
    height: 320,
    width: '100%',
  },
  heroImage: {
    ...StyleSheet.absoluteFill,
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
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  tagChip: {
    borderWidth: strokeWidth.chip,
    borderRadius: thannuRadius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },
  tagText: { fontSize: 12, fontWeight: '800' },
  editTagsButton: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  showMore: {
    fontSize: 14,
    fontWeight: '900',
    textDecorationLine: 'underline',
  },
})
