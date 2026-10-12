import { useEffect, useState } from 'react'
import type { User } from 'firebase/auth'

import {
  isFirebaseConfigured,
  subscribeToAuthState,
} from '@/services/firebase'

export type AuthState = {
  user: User | null
  initializing: boolean
  configured: boolean
}

/** React-facing Firebase session state for routing and authenticated screens. */
export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null)
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    const unsubscribe = subscribeToAuthState((nextUser) => {
      setUser(nextUser)
      setInitializing(false)
    })

    return unsubscribe
  }, [])

  return { user, initializing, configured: isFirebaseConfigured }
}
