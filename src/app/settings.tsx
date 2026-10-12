import { Ionicons } from '@expo/vector-icons'
import { useMemo } from 'react'
import { Alert, Pressable, StyleSheet, Switch, View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { useRouter } from 'expo-router'

import { signOut, getFirebaseErrorMessage } from '@/services/firebase'

import { Screen } from '@/components'
import { ScreenErrorBoundary } from '@/components/error'
import { Text } from '@/components/ui'
import { useColors, useResponsive } from '@/hooks'
import { useSettingsStore, useThemeStore } from '@/stores'
import {
  spacing,
  strokeWidth,
  thannuColors,
  thannuRadius,
  minTouchTarget,
  type Colors,
} from '@/lib'

// ─── Styles ───────────────────────────────────────────────────────────────────

const createStyles = (colors: Colors, isSmall: boolean) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: isSmall ? spacing.md : spacing.lg,
    },
    backBtn: {
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
    headerTitle: {
      flex: 1,
      textAlign: 'center',
      marginRight: minTouchTarget, // To center title perfectly
    },

    section: {
      marginBottom: spacing.lg,
      gap: spacing.sm,
    },
    sectionLabel: {
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 1.2,
      color: colors.secondary,
      textTransform: 'uppercase',
      marginLeft: spacing.xs,
      marginBottom: spacing.xs,
    },

    rowCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.md,
      borderRadius: thannuRadius.md,
      borderWidth: strokeWidth.card,
      borderColor: colors.text,
      backgroundColor: colors.surface,
      shadowColor: colors.text,
      shadowOffset: { width: 2, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 0,
      elevation: 3,
      gap: spacing.md,
    },
    iconTile: {
      width: 40,
      height: 40,
      borderRadius: thannuRadius.sm,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowContent: {
      flex: 1,
      gap: 2,
    },
    rowRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    proBadge: {
      paddingHorizontal: spacing.xs,
      paddingVertical: 2,
      borderRadius: thannuRadius.pill,
      backgroundColor: thannuColors.sunSoft,
      borderWidth: 1,
      borderColor: colors.text,
    },
  })

// ─── Sub-components ───────────────────────────────────────────────────────────

function SettingsRow({
  icon,
  title,
  subtitle,
  rightIcon,
  isDanger = false,
  showPro = false,
  onPress,
  styles,
}: {
  icon: keyof typeof Ionicons.glyphMap
  title: string
  subtitle?: string
  rightIcon?: keyof typeof Ionicons.glyphMap
  isDanger?: boolean
  showPro?: boolean
  onPress?: () => void
  styles: ReturnType<typeof createStyles>
}) {
  const colors = useColors()
  const scale = useSharedValue(1)
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }))

  const titleColor = isDanger ? thannuColors.coral : colors.text
  const iconColor = isDanger ? thannuColors.coral : colors.text

  return (
    <Animated.View style={anim}>
      <Pressable
        style={styles.rowCard}
        onPressIn={() => onPress && scale.set(withTiming(0.97, { duration: 90 }))}
        onPressOut={() => onPress && scale.set(withTiming(1, { duration: 130 }))}
        onPress={onPress}
        disabled={!onPress}
        accessibilityRole={onPress ? 'button' : 'none'}
      >
        <View style={styles.iconTile}>
          <Ionicons name={icon} size={20} color={iconColor} />
        </View>
        <View style={styles.rowContent}>
          <Text variant="h3" style={{ color: titleColor, fontSize: 16 }}>
            {title}
          </Text>
          {subtitle && (
            <Text variant="caption" style={{ color: colors.secondary }}>
              {subtitle}
            </Text>
          )}
        </View>
        <View style={styles.rowRight}>
          {showPro && (
            <View style={styles.proBadge}>
              <Ionicons name="star" size={12} color={thannuColors.sun} />
            </View>
          )}
          {rightIcon && (
            <Ionicons name={rightIcon} size={20} color={colors.secondary} />
          )}
        </View>
      </Pressable>
    </Animated.View>
  )
}

function ToggleRow({
  icon,
  title,
  subtitle,
  value,
  onValueChange,
  styles,
}: {
  icon: keyof typeof Ionicons.glyphMap
  title: string
  subtitle?: string
  value: boolean
  onValueChange: (v: boolean) => void
  styles: ReturnType<typeof createStyles>
}) {
  const colors = useColors()
  return (
    <View style={styles.rowCard}>
      <View style={styles.iconTile}>
        <Ionicons name={icon} size={20} color={colors.text} />
      </View>
      <View style={styles.rowContent}>
        <Text variant="h3" style={{ color: colors.text, fontSize: 16 }}>
          {title}
        </Text>
        {subtitle && (
          <Text variant="caption" style={{ color: colors.secondary }}>
            {subtitle}
          </Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: thannuColors.mint }}
        thumbColor={colors.background}
        ios_backgroundColor={colors.border}
        style={{ transform: [{ scale: 0.9 }] }}
      />
    </View>
  )
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

function SettingsScreenContent() {
  const { isSmall } = useResponsive()
  const colors = useColors()
  const styles = useMemo(() => createStyles(colors, isSmall), [colors, isSmall])
  const router = useRouter()

  const {
    hapticsEnabled,
    setHapticsEnabled,
    newSaveReminders,
    setNewSaveReminders,
  } = useSettingsStore()

  // Theme toggle for dev (not in screenshots but useful to keep)
  const mode = useThemeStore((state) => state.mode)
  const setMode = useThemeStore((state) => state.setMode)

  function handleLogout() {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut()
              router.replace('/login')
            } catch (error) {
              Alert.alert('Error', getFirebaseErrorMessage(error))
            }
          },
        },
      ],
      { cancelable: true }
    )
  }

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Pressable
          style={styles.backBtn}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text variant="h2" style={styles.headerTitle}>
          Settings
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel} allowFontScaling={false}>
          Preferences
        </Text>
        <ToggleRow
          icon="flash-outline"
          title="Haptic Feedback"
          subtitle="Vibrate for actions and selections"
          value={hapticsEnabled}
          onValueChange={setHapticsEnabled}
          styles={styles}
        />
        <ToggleRow
          icon="notifications-outline"
          title="New Save Reminders"
          subtitle="Gentle reminders to review unseen saves"
          value={newSaveReminders}
          onValueChange={setNewSaveReminders}
          styles={styles}
        />
        {/* Dev only: Theme toggle */}
        <ToggleRow
          icon="color-palette-outline"
          title="Dark Mode"
          subtitle="Toggle app theme"
          value={mode === 'dark'}
          onValueChange={(val) => setMode(val ? 'dark' : 'light')}
          styles={styles}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel} allowFontScaling={false}>
          Your Thannu Data
        </Text>
        <SettingsRow
          icon="share-outline"
          title="Export Backup"
          subtitle="Export a backup file you can save anywhere"
          rightIcon="chevron-forward"
          showPro={true}
          onPress={() => {}}
          styles={styles}
        />
        <SettingsRow
          icon="cloud-download-outline"
          title="Restore from Backup"
          subtitle="Restore from a Thannu backup (.zip or .json)"
          rightIcon="chevron-forward"
          showPro={true}
          onPress={() => {}}
          styles={styles}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel} allowFontScaling={false}>
          Import From Other Apps
        </Text>
        <SettingsRow
          icon="file-tray-outline"
          title="Import Bookmarks"
          subtitle="From CSV, HTML, or JSON exports"
          rightIcon="chevron-forward"
          onPress={() => {}}
          styles={styles}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel} allowFontScaling={false}>
          Support
        </Text>
        <SettingsRow
          icon="book-outline"
          title="How To"
          subtitle="Quick guides for getting more from Thannu"
          rightIcon="chevron-forward"
          onPress={() => {}}
          styles={styles}
        />
        <SettingsRow
          icon="chatbubble-ellipses-outline"
          title="Send Feedback"
          subtitle="Got a bug or idea? We'd love to hear it!"
          rightIcon="open-outline"
          onPress={() => {}}
          styles={styles}
        />
        <SettingsRow
          icon="lock-closed-outline"
          title="Privacy Policy"
          rightIcon="open-outline"
          onPress={() => {}}
          styles={styles}
        />
        <SettingsRow
          icon="document-text-outline"
          title="Terms of Service"
          rightIcon="open-outline"
          onPress={() => {}}
          styles={styles}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel} allowFontScaling={false}>
          Account
        </Text>
        <SettingsRow
          icon="log-out-outline"
          title="Sign Out"
          subtitle="Sign out of your Thannu account"
          isDanger={true}
          onPress={handleLogout}
          styles={styles}
        />
        <SettingsRow
          icon="trash-outline"
          title="Delete All Data"
          subtitle="Permanently erase all saves, collections, and tags on this device"
          isDanger={true}
          onPress={() => {}}
          styles={styles}
        />
      </View>

      <View style={{ alignItems: 'center', marginBottom: spacing.xl }}>
        <Text variant="caption" style={{ color: thannuColors.textMuted }}>
          Version 1.0.0
        </Text>
      </View>
    </Screen>
  )
}

export default function SettingsScreen() {
  return (
    <ScreenErrorBoundary screenName="Settings">
      <SettingsScreenContent />
    </ScreenErrorBoundary>
  )
}
