import { getColors, resolveIsDark, type Colors } from '@/lib'
import { useThemeStore } from '@/stores'

import { useColorScheme } from './useColorScheme'

export function useIsDark(): boolean {
  const systemColorScheme = useColorScheme()
  const mode = useThemeStore((state) => state.mode)

  return resolveIsDark(mode, systemColorScheme)
}

export function useColors(): Colors {
  return getColors(useIsDark())
}
