import {
  Stack,
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
  useRootNavigationState,
  useRouter,
  useSegments,
} from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect } from 'react'
import { Platform } from 'react-native'

import '@/global.css'

import { ErrorBoundary } from '@/components/error'
import { ShareReceiver } from '@/components/ShareReceiver'
import { useAuth, useIsDark } from '@/hooks'
import { useThemeHydration } from '@/stores'

if (Platform.OS !== 'web') {
  SplashScreen.preventAutoHideAsync()
}

export default function RootLayout() {
  const isDark = useIsDark()
  const hydrated = useThemeHydration()
  const { user, initializing: authInitializing } = useAuth()
  const router = useRouter()
  const segments = useSegments()
  const navigationState = useRootNavigationState()

  // The generated typed-route manifest can lag until Expo regenerates it after
  // adding a route, so compare the segment as a runtime string here.
  const firstSegment = String(segments[0] ?? '')
  const isAuthRoute = firstSegment === 'login' || firstSegment === 'register'
  const isShareRoute = firstSegment === 'share'

  useEffect(() => {
    if (hydrated && !authInitializing) {
      SplashScreen.hideAsync()
    }
  }, [hydrated, authInitializing])

  useEffect(() => {
    if (!navigationState?.key || authInitializing) return

    if (!user && !isAuthRoute && !isShareRoute) {
      router.replace('/login' as never)
    } else if (user && isAuthRoute) {
      router.replace('/(tabs)')
    }
  }, [authInitializing, isAuthRoute, isShareRoute, navigationState?.key, router, user])

  // Hold the splash screen until the persisted theme mode has loaded, so the
  // first frame renders in the right theme. Web renders immediately — its
  // static output has no splash screen to hide behind.
  if ((!hydrated || authInitializing) && Platform.OS !== 'web') {
    return null
  }

  return (
    <ErrorBoundary>
      <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="register" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="collection/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="save/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="share" options={{ headerShown: false }} />
          <Stack.Screen
            name="review"
            options={{
              headerShown: false,
              presentation: 'fullScreenModal',
              animation: 'slide_from_bottom',
            }}
          />
        </Stack>
        <ShareReceiver />
      </ThemeProvider>
    </ErrorBoundary>
  )
}
