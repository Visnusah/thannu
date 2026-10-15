import { Ionicons } from '@expo/vector-icons'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useMemo, useState } from 'react'
import {
  Alert,
  Image,
  Pressable,
  Share,
  StyleSheet,
  View,
} from 'react-native'
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'

import { AddLinkModal, CollectionActionsModal, CreateCollectionModal, Screen } from '@/components'
import { ScreenErrorBoundary } from '@/components/error'
import { Text } from '@/components/ui'
import { useColors, useResponsive, type ScreenSize, useSupabaseSync } from '@/hooks'
import { fetchLinkMetadata } from '@/services/metadata'
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
import { isValidLinkUrl, useCollectionsStore, useLinksStore } from '@/stores'

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
    selectionToolbar: {
      borderWidth: strokeWidth.card,
      borderRadius: thannuRadius.sm,
      padding: spacing.sm,
      marginBottom: spacing.md,
      gap: 2,
    },
    subCollectionsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    subCollectionChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      borderWidth: strokeWidth.chip,
      borderRadius: thannuRadius.pill,
      paddingHorizontal: spacing.sm,
      paddingVertical: 7,
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
      overflow: 'hidden',
    },
    cardImage: { ...StyleSheet.absoluteFill },
    selectionBadge: {
      position: 'absolute',
      top: 8,
      right: 8,
      zIndex: 2,
      width: 28,
      height: 28,
      borderWidth: 2,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pinBadge: {
      position: 'absolute',
      top: 8,
      right: 8,
      zIndex: 2,
      width: 28,
      height: 28,
      borderWidth: 2,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
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
  selectionMode,
  selected,
  onToggle,
}: {
  item: import('@/stores').LinkRecord
  styles: ReturnType<typeof createStyles>
  index: number
  selectionMode: boolean
  selected: boolean
  onToggle: () => void
}) {
  const router = useRouter()
  const scale = useSharedValue(1)
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }))

  return (
    <Animated.View
      entering={FadeInDown.delay(100 + index * 50).duration(400)}
    >
      <Animated.View style={anim}>
        <Pressable
          style={styles.card}
          onPressIn={() => scale.set(withTiming(0.97, { duration: 90 }))}
          onPressOut={() => scale.set(withTiming(1, { duration: 130 }))}
          onPress={() => selectionMode ? onToggle() : router.push(`/save/${item.id}` as any)}
        >
          {selectionMode && (
            <View
              style={[styles.selectionBadge, { backgroundColor: selected ? thannuColors.mint : '#fff', borderColor: '#121212' }]}
            >
              <Ionicons name={selected ? 'checkmark' : 'ellipse-outline'} size={16} color="#121212" />
            </View>
          )}
          {item.isPinned && !selectionMode && (
            <View
              style={[styles.pinBadge, { backgroundColor: thannuColors.sun, borderColor: '#121212' }]}
            >
              <Ionicons name="pin" size={14} color="#121212" />
            </View>
          )}
          <View style={[styles.cardImageArea, { backgroundColor: item.domain === 'instagram.com' ? '#E1306C' : thannuColors.slate }]}>
            {item.imageUrl && <Image source={{ uri: item.imageUrl }} style={styles.cardImage} resizeMode="cover" />}
            {!item.imageUrl && <Ionicons name="link-outline" size={28} color="#fff" />}
          </View>

          {/* Info Area */}
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <View style={styles.cardFooter}>
              <View style={[styles.favicon, { backgroundColor: thannuColors.slate }]}>
                <Ionicons name="link-outline" size={10} color="#fff" />
              </View>
              <Text style={styles.domain}>{item.domain}</Text>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    </Animated.View>
  )
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

function CollectionScreenContent() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { collections, addCollection } = useCollectionsStore()
  const links = useLinksStore((state) => state.links)
  const addLink = useLinksStore((state) => state.addLink)
  const updateLink = useLinksStore((state) => state.updateLink)
  
  const { isSmall, width, size } = useResponsive()
  const colors = useColors()
  const styles = useMemo(() => createStyles(colors, isSmall, width, size), [colors, isSmall, width, size])

  const collection = collections.find((c) => c.id === id)
  const title = collection ? collection.name : id || 'Collection'
  const collectionLinks = links.filter((link) => link.collectionId === id)
  const subCollections = collections.filter((item) => item.parentId === id)

  const [isSelecting, setIsSelecting] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isAddLinkVisible, setIsAddLinkVisible] = useState(false)
  const [isSubCollectionVisible, setIsSubCollectionVisible] = useState(false)
  const [isActionsVisible, setIsActionsVisible] = useState(false)

  const { deleteCollection, pushCollection, pushLink } = useSupabaseSync()

  const toggleSelected = (linkId: string) => {
    setSelectedIds((current) => current.includes(linkId)
      ? current.filter((idValue) => idValue !== linkId)
      : [...current, linkId])
  }

  const shareItems = (items: typeof collectionLinks, shareTitle: string) => {
    if (items.length === 0) {
      Alert.alert('Nothing to share', 'Add at least one link to this collection first.')
      return
    }
    const message = [shareTitle, ...items.map((item) => `${item.title}\n${item.url}`)].join('\n\n')
    void Share.share({ title: shareTitle, message }).catch(() => {
      Alert.alert('Sharing unavailable', 'This device could not open the native share sheet.')
    })
  }

  const handleShareCollection = () => shareItems(collectionLinks, title)

  const saveUrlToCollection = (rawUrl: string) => {
    const url = rawUrl.trim()
    if (!isValidLinkUrl(url) || !collection) {
      Alert.alert('Invalid link', 'Enter a complete http or https URL.')
      return
    }

    const linkId = addLink({ url, collectionId: collection.id })
    setIsAddLinkVisible(false)
    const created = useLinksStore.getState().links.find((item) => item.id === linkId)
    if (!created) return

    void pushLink(created).catch((error) => console.warn('[CollectionDetail] Failed to sync link:', error))
    void fetchLinkMetadata(url)
      .then((metadata) => {
        updateLink(linkId, {
          title: metadata.title || created.title,
          description: metadata.description || created.description,
          imageUrl: metadata.imageUrl ?? created.imageUrl,
          domain: metadata.domain || created.domain,
        })
        const enriched = useLinksStore.getState().links.find((item) => item.id === linkId)
        if (enriched) return pushLink(enriched)
      })
      .catch((error) => console.warn('[CollectionDetail] Metadata enrichment failed:', error))
  }

  const handleOptions = () => setIsActionsVisible(true)

  const confirmDeleteCollection = () => {
    if (!collection) return
    Alert.alert(
      'Delete collection?',
      `Are you sure you want to delete "${collection.name}"? Links will be kept in Unsorted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => {
          deleteCollection(collection.id).catch((error) => console.warn('[CollectionDetail] Delete failed:', error))
          router.back()
        } },
      ]
    )
  }

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
          <Text style={styles.headerSubtitle}>{collectionLinks.length} items · {subCollections.length} subcollections</Text>
        </View>

        <View style={styles.headerIcons}>
          {isSelecting ? (
            <IconButton
              icon="close"
              accessibilityLabel="Stop selecting links"
              onPress={() => { setIsSelecting(false); setSelectedIds([]) }}
              backgroundColor={thannuColors.sun}
            />
          ) : (
            <IconButton
              icon="add"
              accessibilityLabel="Add link"
              onPress={() => setIsAddLinkVisible(true)}
              backgroundColor={thannuColors.sun}
            />
          )}
          {isSelecting && selectedIds.length > 0 && (
            <IconButton
              icon="share-outline"
              accessibilityLabel="Share selected links"
              onPress={() => shareItems(collectionLinks.filter((item) => selectedIds.includes(item.id)), `${title} selected links`)}
            />
          )}
          <IconButton 
            icon="ellipsis-horizontal" 
            accessibilityLabel="More options" 
            onPress={handleOptions}
          />
        </View>
      </View>

      {isSelecting && (
        <View
          style={[styles.selectionToolbar, { backgroundColor: thannuColors.violetSoft, borderColor: colors.text }]}
        >
          <Text style={{ color: colors.text, fontWeight: '800' }}>{selectedIds.length} selected</Text>
          <Text style={{ color: colors.secondary }}>Tap cards to select links for sharing.</Text>
        </View>
      )}

      {subCollections.length > 0 && (
        <View style={styles.subCollectionsRow}>
          {subCollections.map((subCollection) => (
            <Pressable
              key={subCollection.id}
              onPress={() => router.push(`/collection/${subCollection.id}` as any)}
              style={[styles.subCollectionChip, { backgroundColor: subCollection.color + '33', borderColor: colors.text }]}
            >
              <Ionicons name={subCollection.icon as any} size={16} color={colors.text} />
              <Text style={{ color: colors.text, fontWeight: '800' }}>{subCollection.name}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* ── Section Title ── */}
      <Text style={styles.sectionTitle}>
        SAVES ({collectionLinks.length})
      </Text>

      {/* ── Grid ── */}
      <View style={styles.grid}>
        {collectionLinks.map((item, index) => (
          <SaveCard
            key={item.id}
            item={item}
            styles={styles}
            index={index}
            selectionMode={isSelecting}
            selected={selectedIds.includes(item.id)}
            onToggle={() => toggleSelected(item.id)}
          />
        ))}
        {collectionLinks.length === 0 && (
          <View style={{ width: '100%', alignItems: 'center', paddingVertical: spacing.xl }}>
            <Ionicons name="file-tray-outline" size={40} color={colors.secondary} />
            <Text style={{ color: colors.secondary, marginTop: spacing.md }}>
              Nothing here yet — add a link from the collection menu.
            </Text>
          </View>
        )}
      </View>

      <AddLinkModal
        visible={isAddLinkVisible}
        collectionName={title}
        onClose={() => setIsAddLinkVisible(false)}
        onAdd={saveUrlToCollection}
      />
      <CollectionActionsModal
        visible={isActionsVisible}
        collectionName={title}
        canDelete={Boolean(collection && !collection.isSystem)}
        canCreateSubcollection={Boolean(collection && !collection.isSystem)}
        onClose={() => setIsActionsVisible(false)}
        onAddLink={() => setIsAddLinkVisible(true)}
        onSelectLinks={() => { setIsSelecting(true); setSelectedIds([]) }}
        onCreateSubcollection={() => setIsSubCollectionVisible(true)}
        onShareCollection={handleShareCollection}
        onDelete={confirmDeleteCollection}
      />
      <CreateCollectionModal
        visible={isSubCollectionVisible}
        parentId={collection?.id}
        title="Create sub-collection"
        submitLabel="Create sub-collection"
        onClose={() => setIsSubCollectionVisible(false)}
        onCreate={(data) => {
          const created = addCollection(data)
          setIsSubCollectionVisible(false)
          pushCollection(created).catch((error) => console.warn('[CollectionDetail] Failed to sync sub-collection:', error))
        }}
      />
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
