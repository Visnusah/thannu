import { useWindowDimensions } from 'react-native'

/**
 * Breakpoints (in logical pixels, portrait width of the device).
 *
 *  xs  < 375   — iPhone SE 1st gen
 *  sm  < 390   — iPhone 13 mini
 *  md  < 430   — iPhone 14 / 15 standard
 *  lg  ≥ 430   — iPhone 14/15 Plus / Pro Max
 */
export type ScreenSize = 'xs' | 'sm' | 'md' | 'lg'

const BREAKPOINTS = { xs: 375, sm: 390, md: 430 } as const

function getSize(width: number): ScreenSize {
  if (width < BREAKPOINTS.xs) return 'xs'
  if (width < BREAKPOINTS.sm) return 'sm'
  if (width < BREAKPOINTS.md) return 'md'
  return 'lg'
}

export interface ResponsiveValues {
  /** Current screen width in logical pixels */
  width: number
  /** Current screen height in logical pixels */
  height: number
  /** Named breakpoint for the current width */
  size: ScreenSize
  /** True on very small screens (iPhone SE / mini) */
  isSmall: boolean
  /** True on large screens (Plus / Pro Max) */
  isLarge: boolean
  /**
   * Pick a value depending on the current breakpoint.
   * Falls back to `md` → `sm` → `xs` for missing keys.
   */
  pick: <T>(values: Partial<Record<ScreenSize, T>> & { md: T }) => T
  /**
   * Scale a base value linearly between min/max across the 320–430 px range.
   * Useful for font sizes and spacing that should grow with the screen.
   */
  scale: (base: number, factor?: number) => number
}

/**
 * Reactive hook — re-renders when the device rotates or the window resizes.
 * Provides breakpoint helpers tailored to iPhone screen sizes.
 */
export function useResponsive(): ResponsiveValues {
  const { width, height } = useWindowDimensions()
  const size = getSize(width)

  const isSmall = size === 'xs' || size === 'sm'
  const isLarge = size === 'lg'

  function pick<T>(values: Partial<Record<ScreenSize, T>> & { md: T }): T {
    if (size === 'lg' && values.lg !== undefined) return values.lg
    if (size === 'md' && values.md !== undefined) return values.md
    if (size === 'sm' && values.sm !== undefined) return values.sm
    if (size === 'xs' && values.xs !== undefined) return values.xs
    // Cascade down
    if (values.sm !== undefined) return values.sm
    if (values.xs !== undefined) return values.xs
    return values.md
  }

  function scale(base: number, factor = 0.08): number {
    // Normalise width to [0, 1] over [320, 430]
    const t = Math.max(0, Math.min(1, (width - 320) / 110))
    return Math.round(base * (1 + factor * t))
  }

  return { width, height, size, isSmall, isLarge, pick, scale }
}
