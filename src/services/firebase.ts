import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app'
import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  initializeAuth,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type Auth,
  type Persistence,
  type User,
  type Unsubscribe,
} from 'firebase/auth'
import * as firebaseAuthModule from '@firebase/auth'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'

import { setFirebaseTokenProvider } from '@/services/supabase'

const getReactNativePersistence = (
  firebaseAuthModule as typeof firebaseAuthModule & {
    getReactNativePersistence: (storage: typeof AsyncStorage) => Persistence
  }
).getReactNativePersistence

export type FirebaseConfig = {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
  measurementId?: string
}

const firebaseConfig: FirebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY?.trim() ?? '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim() ?? '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID?.trim() ?? '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim() ?? '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim() ?? '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID?.trim() ?? '',
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID?.trim() || undefined,
}

const requiredConfigKeys: (keyof FirebaseConfig)[] = [
  'apiKey',
  'authDomain',
  'projectId',
  'storageBucket',
  'messagingSenderId',
  'appId',
]

/** Firebase web config is public client configuration, but must come from env. */
export const isFirebaseConfigured = requiredConfigKeys.every((key) => Boolean(firebaseConfig[key]))

export const firebaseApp: FirebaseApp | null = isFirebaseConfigured
  ? getApps().length > 0
    ? getApp()
    : initializeApp(firebaseConfig)
  : null

function initializeFirebaseAuth(app: FirebaseApp): Auth {
  if (Platform.OS === 'web') return getAuth(app)

  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    })
  } catch (error) {
    // Fast refresh can retain an Auth instance between module evaluations.
    // Reusing it is safe; the first initialization still uses AsyncStorage.
    if (error instanceof Error && error.message.includes('already-initialized')) {
      return getAuth(app)
    }
    throw error
  }
}

/** The Firebase Auth instance, or null when the public env config is incomplete. */
export const auth: Auth | null = firebaseApp ? initializeFirebaseAuth(firebaseApp) : null

function requireAuth(): Auth {
  if (!auth) {
    throw new Error(
      'Firebase is not configured. Set the EXPO_PUBLIC_FIREBASE_* values before signing in.'
    )
  }

  return auth
}

/** Subscribe to Firebase session changes. The callback receives null if config is missing. */
export function subscribeToAuthState(listener: (user: User | null) => void): Unsubscribe {
  if (!auth) {
    listener(null)
    return () => undefined
  }

  return onAuthStateChanged(auth, listener)
}

export function getCurrentUser(): User | null {
  return auth?.currentUser ?? null
}

export async function signIn(email: string, password: string): Promise<User> {
  const result = await signInWithEmailAndPassword(requireAuth(), email.trim(), password)
  return result.user
}

export async function signUp(email: string, password: string): Promise<User> {
  const result = await createUserWithEmailAndPassword(requireAuth(), email.trim(), password)
  return result.user
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(requireAuth())
}

/** Get the current Firebase ID token for Supabase or other authenticated APIs. */
export async function getFirebaseToken(forceRefresh = false): Promise<string | null> {
  const user = getCurrentUser()
  return user ? user.getIdToken(forceRefresh) : null
}

// Short aliases make token access convenient for API clients while keeping the
// Firebase-specific name available to callers that prefer explicit naming.
export const getIdToken = getFirebaseToken
export const getToken = getFirebaseToken

// Supabase already exposes a token-provider integration point. Registering it
// here keeps Firebase as the source of truth without changing Supabase setup.
if (auth) {
  setFirebaseTokenProvider(() => getFirebaseToken())
}

export function getFirebaseErrorMessage(error: unknown): string {
  const code = typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code: unknown }).code)
    : ''

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'That email or password is not right.'
    case 'auth/email-already-in-use':
      return 'An account already uses that email. Try signing in.'
    case 'auth/invalid-email':
      return 'Enter a valid email address.'
    case 'auth/weak-password':
      return 'Use a password with at least 6 characters.'
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.'
    case 'auth/network-request-failed':
      return 'Check your internet connection and try again.'
    default:
      return error instanceof Error && error.message
        ? error.message
        : 'Something went wrong. Please try again.'
  }
}
