import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native'

import { Screen } from '@/components/Screen'
import { Input } from '@/components/ui/Input'
import { Text } from '@/components/ui/Text'
import { useAuth, useColors, useResponsive } from '@/hooks'
import {
  fontSize,
  fontWeight,
  minTouchTarget,
  spacing,
  strokeWidth,
  thannuColors,
  thannuRadius,
  type Colors,
} from '@/lib'
import {
  getFirebaseErrorMessage,
  signIn,
  signUp,
} from '@/services/firebase'

type AuthMode = 'signIn' | 'signUp'

type AuthScreenProps = {
  mode: AuthMode
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const createStyles = (colors: Colors, isSmall: boolean) =>
  StyleSheet.create({
    keyboard: { width: '100%' },
    container: {
      width: '100%',
      maxWidth: 440,
      alignSelf: 'center',
      paddingTop: isSmall ? spacing.xl : 48,
      paddingBottom: isSmall ? spacing.lg : 32,
      gap: spacing.lg,
    },
    brand: {
      alignItems: 'center',
      alignSelf: 'stretch',
      gap: spacing.sm,
    },
    brandMark: {
      width: 58,
      height: 58,
      borderRadius: thannuRadius.md,
      borderWidth: strokeWidth.card,
      borderColor: thannuColors.ink,
      backgroundColor: thannuColors.sun,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: thannuColors.ink,
      shadowOffset: { width: 4, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 0,
      elevation: 5,
    },
    brandName: {
      color: colors.text,
      fontSize: isSmall ? 22 : 36,
      fontWeight: fontWeight.bold,
      letterSpacing: -1,
      textAlign: 'center',
    },
    tagline: { textAlign: 'center', color: colors.secondary },
    card: {
      width: '100%',
      padding: isSmall ? spacing.md : spacing.lg,
      borderRadius: thannuRadius.lg,
      borderWidth: strokeWidth.card,
      borderColor: thannuColors.ink,
      backgroundColor: colors.surface,
      shadowColor: thannuColors.ink,
      shadowOffset: { width: 4, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 0,
      elevation: 5,
      gap: spacing.md,
    },
    cardTitle: { marginBottom: -spacing.xs },
    cardSubtitle: { color: colors.secondary, marginBottom: spacing.sm },
    input: { marginBottom: spacing.sm },
    submit: {
      minHeight: 52,
      borderRadius: thannuRadius.md,
      borderWidth: strokeWidth.card,
      borderColor: thannuColors.ink,
      backgroundColor: thannuColors.sun,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: thannuColors.ink,
      shadowOffset: { width: 4, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 0,
      elevation: 5,
    },
    submitPressed: {
      transform: [{ translateX: 2 }, { translateY: 2 }],
      shadowOffset: { width: 2, height: 2 },
      elevation: 2,
    },
    submitText: {
      color: thannuColors.ink,
      fontSize: fontSize.base,
      fontWeight: fontWeight.bold,
    },
    error: {
      color: colors.danger,
      backgroundColor: colors.background,
      borderRadius: thannuRadius.sm,
      padding: spacing.sm,
      borderWidth: strokeWidth.chip,
      borderColor: colors.danger,
    },
    switchPrompt: { textAlign: 'center', color: colors.secondary },
    switchLink: {
      minHeight: minTouchTarget,
      alignItems: 'center',
      justifyContent: 'center',
    },
    switchLinkText: {
      color: thannuColors.violet,
      fontWeight: fontWeight.bold,
      textDecorationLine: 'underline',
    },
    configNote: {
      textAlign: 'center',
      color: colors.secondary,
      fontSize: fontSize.xs,
      lineHeight: fontSize.xs * 1.4,
    },
  })

export function AuthScreen({ mode }: AuthScreenProps) {
  const router = useRouter()
  const colors = useColors()
  const { isSmall } = useResponsive()
  const { configured } = useAuth()
  const styles = createStyles(colors, isSmall)
  const isSignUp = mode === 'signUp'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [emailError, setEmailError] = useState<string>()
  const [passwordError, setPasswordError] = useState<string>()
  const [confirmPasswordError, setConfirmPasswordError] = useState<string>()
  const [formError, setFormError] = useState<string>()
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    const normalizedEmail = email.trim()
    const nextEmailError = !emailPattern.test(normalizedEmail)
      ? 'Enter a valid email address.'
      : undefined
    const nextPasswordError = password.length === 0
      ? 'Enter your password.'
      : isSignUp && password.length < 6
        ? 'Use at least 6 characters.'
        : undefined
    const nextConfirmError = isSignUp && confirmPassword !== password
      ? 'Passwords do not match.'
      : undefined

    setEmailError(nextEmailError)
    setPasswordError(nextPasswordError)
    setConfirmPasswordError(nextConfirmError)
    setFormError(undefined)

    if (nextEmailError || nextPasswordError || nextConfirmError) return

    if (!configured) {
      setFormError('Firebase is not configured for this build. Add the EXPO_PUBLIC_FIREBASE_* values and reload.')
      return
    }

    setLoading(true)
    try {
      if (isSignUp) {
        await signUp(normalizedEmail, password)
      } else {
        await signIn(normalizedEmail, password)
      }
      // RootLayout observes the Firebase session and redirects to the app.
    } catch (error) {
      setFormError(getFirebaseErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Screen scroll horizontalPadding={isSmall ? spacing.md : spacing.xl}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboard}
      >
        <View style={styles.container}>
          <View style={styles.brand}>
            <View style={styles.brandMark}>
              <Ionicons name="bookmark" size={30} color={thannuColors.violet} />
            </View>
            <Text style={styles.brandName}>Thannu</Text>
            <Text variant="bodySmall" style={styles.tagline}>
              Save it. Get reminded.
            </Text>
          </View>

          <View style={styles.card}>
            <Text variant="h2" style={styles.cardTitle}>
              {isSignUp ? 'Make your account' : 'Welcome back'}
            </Text>
            <Text variant="bodySmall" style={styles.cardSubtitle}>
              {isSignUp ? 'Your saves deserve a home.' : 'Your library is waiting.'}
            </Text>

            <Input
              label="Email"
              value={email}
              onChangeText={(value) => {
                setEmail(value)
                if (emailError) setEmailError(undefined)
                if (formError) setFormError(undefined)
              }}
              error={emailError}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              leftIcon="mail-outline"
              containerStyle={styles.input}
              editable={!loading}
              returnKeyType="next"
            />
            <Input
              label="Password"
              value={password}
              onChangeText={(value) => {
                setPassword(value)
                if (passwordError) setPasswordError(undefined)
                if (formError) setFormError(undefined)
              }}
              error={passwordError}
              placeholder="Your password"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete={isSignUp ? 'new-password' : 'password'}
              textContentType={isSignUp ? 'newPassword' : 'password'}
              leftIcon="lock-closed-outline"
              containerStyle={styles.input}
              editable={!loading}
              onSubmitEditing={isSignUp ? undefined : submit}
              returnKeyType={isSignUp ? 'next' : 'go'}
            />
            {isSignUp && (
              <Input
                label="Confirm password"
                value={confirmPassword}
                onChangeText={(value) => {
                  setConfirmPassword(value)
                  if (confirmPasswordError) setConfirmPasswordError(undefined)
                  if (formError) setFormError(undefined)
                }}
                error={confirmPasswordError}
                placeholder="Type it again"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="new-password"
                textContentType="newPassword"
                leftIcon="lock-closed-outline"
                containerStyle={styles.input}
                editable={!loading}
                onSubmitEditing={submit}
                returnKeyType="go"
              />
            )}

            {formError && (
              <Text variant="bodySmall" style={styles.error} accessibilityRole="alert">
                {formError}
              </Text>
            )}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isSignUp ? 'Create account' : 'Sign in'}
              accessibilityState={{ busy: loading, disabled: loading }}
              disabled={loading}
              onPress={submit}
              style={({ pressed }) => [styles.submit, pressed && styles.submitPressed, loading && { opacity: 0.7 }]}
            >
              {loading ? (
                <ActivityIndicator color={thannuColors.ink} />
              ) : (
                <Text style={styles.submitText}>{isSignUp ? 'Create account' : 'Sign in'}</Text>
              )}
            </Pressable>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace((isSignUp ? '/login' : '/register') as never)}
            style={styles.switchLink}
          >
            <Text variant="bodySmall" style={styles.switchPrompt}>
              {isSignUp ? 'Already have an account? ' : 'New to Thannu? '}
              <Text variant="bodySmall" style={styles.switchLinkText}>
                {isSignUp ? 'Sign in' : 'Create one'}
              </Text>
            </Text>
          </Pressable>

          {!configured && (
            <Text variant="caption" style={styles.configNote}>
              Authentication is unavailable until this Expo build has Firebase configuration.
            </Text>
          )}
        </View>
      </KeyboardAvoidingView>
    </Screen>
  )
}
