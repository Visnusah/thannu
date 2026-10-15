import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { Pressable, StyleSheet, View } from 'react-native'

import { Screen } from '@/components'
import { Text } from '@/components/ui'
import { useAuth, useColors } from '@/hooks'
import { fontSize, fontWeight, minTouchTarget, spacing, strokeWidth, thannuColors, thannuRadius } from '@/lib'

export default function ShareScreen() {
  const router = useRouter()
  const colors = useColors()
  const { user } = useAuth()

  return (
    <Screen centered>
      <View style={[styles.icon, { backgroundColor: thannuColors.sun, borderColor: colors.text }]}>
        <Ionicons name="bookmark" size={30} color={thannuColors.violet} />
      </View>
      <Text variant="h2" style={[styles.title, { color: colors.text }]}>Share received</Text>
      <Text variant="body" style={[styles.message, { color: colors.secondary }]}>
        {user
          ? 'Thannu is saving your shared link to the Unsorted collection.'
          : 'Sign in to save shared links from Instagram, TikTok, YouTube, and other apps.'}
      </Text>
      {!user && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sign in to save shared link"
          onPress={() => router.replace('/login')}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: thannuColors.sun, borderColor: colors.text },
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={[styles.buttonText, { color: colors.text }]}>Sign in to continue</Text>
        </Pressable>
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  icon: {
    width: 64,
    height: 64,
    borderRadius: thannuRadius.md,
    borderWidth: strokeWidth.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: thannuColors.ink,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
    marginBottom: spacing.md,
  },
  title: {
    fontWeight: fontWeight.bold,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  message: {
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: fontSize.base * 1.5,
  },
  button: {
    minHeight: minTouchTarget,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderWidth: strokeWidth.card,
    borderRadius: thannuRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: thannuColors.ink,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  buttonPressed: {
    transform: [{ translateX: 2 }, { translateY: 2 }],
    shadowOffset: { width: 1, height: 1 },
    elevation: 1,
  },
  buttonText: {
    fontWeight: fontWeight.bold,
    fontSize: fontSize.base,
  },
})
