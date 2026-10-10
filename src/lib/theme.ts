import { Platform, type ColorSchemeName } from 'react-native'

export const lightColors = {
  background: '#fff',
  surface: '#f5f5f5',
  text: '#000',
  secondary: '#666',
  tertiary: '#999',
  border: '#ddd',
  primary: '#000',
  accent: '#007aff',
  danger: '#ff3b30',
  warning: '#ff9500',
  success: '#34c759',
  onDanger: '#fff',
} as const

export const darkColors = {
  background: '#000',
  surface: '#1c1c1e',
  text: '#fff',
  secondary: '#999',
  tertiary: '#666',
  border: '#333',
  primary: '#fff',
  accent: '#0a84ff',
  danger: '#ff453a',
  warning: '#ff9f0a',
  success: '#30d158',
  onDanger: '#fff',
} as const

export type Colors = {
  background: string
  surface: string
  text: string
  secondary: string
  tertiary: string
  border: string
  primary: string
  accent: string
  danger: string
  warning: string
  success: string
  onDanger: string
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const

export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 24,
  '2xl': 28,
  '3xl': 32,
} as const

export const fontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
}

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 9999,
} as const

export type ThemeMode = 'light' | 'dark' | 'system'

export function getColors(isDark: boolean): Colors {
  return isDark ? darkColors : lightColors
}

// Single source of truth for resolving the effective color scheme.
// Components should use the useIsDark()/useColors() hooks; this helper exists
// for non-hook contexts (e.g. class components like ErrorBoundary).
export function resolveIsDark(
  mode: ThemeMode,
  systemScheme: ColorSchemeName | null | undefined
): boolean {
  return mode === 'system' ? systemScheme === 'dark' : mode === 'dark'
}

// System font stacks per platform; the web values are CSS variables defined in src/global.css
export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
})

// Layout constants for the floating tab bars and wide-screen content.
// Native platforms render a bottom tab bar; web renders a floating tab bar
// pinned to the top of the viewport (see AppTabs.web.tsx).
export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0
export const TopTabInset = Platform.select({ web: 72 }) ?? 0
export const MaxContentWidth = 800

// ─── Thannu design tokens ─────────────────────────────────────────────────────
// Full neo-brutalist palette from design.md §3.1
export const thannuColors = {
  ink: '#121212',
  paper: '#F7F6F2',
  cream: '#FFF7E6',
  white: '#FFFFFF',
  sun: '#FFC93C',
  sunSoft: '#FFE29A',
  blue: '#3B7BE8',
  orange: '#FF6B1A',
  mint: '#19BE95',
  mintSoft: '#E3F7EF',
  lime: '#A3E635',
  coral: '#FF5A5F',
  violet: '#7C4DFF',
  violetSoft: '#ECE5FF',
  pink: '#FFB4CC',
  brown: '#8B5A2B',
  tan: '#EBD9A8',
  slate: '#5E7A9E',
  textMuted: '#5B5B5B',
  line: '#D9D7D0',
} as const

// Hard offset black drop-shadow (no blur) per design.md §3.3
export const hardShadow = {
  md: {
    shadowColor: '#121212',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1 as const,
    shadowRadius: 0,
    elevation: 5,
  },
  sm: {
    shadowColor: '#121212',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1 as const,
    shadowRadius: 0,
    elevation: 3,
  },
} as const

// Thick near-black border widths per design.md §3.3
export const strokeWidth = { card: 2.5, chip: 2 } as const

// Thannu extended radii — cards get larger rounding
export const thannuRadius = { sm: 10, md: 16, lg: 22, pill: 999 } as const

// Minimum tappable area per design.md §3.3
export const minTouchTarget = 44

// Responsive horizontal screen padding per device size
export const screenPaddingH = { xs: 16, sm: 18, md: 20, lg: 22 } as const

// Grid gap for 2-column collection grids
export const gridGap = 14
