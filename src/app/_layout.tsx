import { Stack, DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect } from 'react'
import { Platform } from 'react-native'

import '@/global.css'

import { ErrorBoundary } from '@/components/error'
import { useIsDark } from '@/hooks'
import { useThemeHydration } from '@/stores'

if (Platform.OS !== 'web') {
  SplashScreen.preventAutoHideAsync()
}

export default function RootLayout() {
  const isDark = useIsDark()
  const hydrated = useThemeHydration()

  useEffect(() => {
    if (hydrated) {
      SplashScreen.hideAsync()
    }
  }, [hydrated])

  // Hold the splash screen until the persisted theme mode has loaded, so the
  // first frame renders in the right theme. Web renders immediately — its
  // static output has no splash screen to hide behind.
  if (!hydrated && Platform.OS !== 'web') {
    return null
  }

  return (
    <ErrorBoundary>
      <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="collection/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="save/[id]" options={{ headerShown: false }} />
          <Stack.Screen
            name="review"
            options={{
              headerShown: false,
              presentation: 'fullScreenModal',
              animation: 'slide_from_bottom',
            }}
          />
        </Stack>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
