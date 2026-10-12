import { useMemo, type PropsWithChildren } from 'react'
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'

import { useColors, useResponsive } from '@/hooks'
import { spacing, borderRadius, strokeWidth, type Colors } from '@/lib'

type CardVariant = 'default' | 'brutalist'

type CardProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>
  /**
   * `default`  — standard themed card (matches existing design system)
   * `brutalist` — Thannu neo-brutalist card: white bg + ink border + hard shadow
   */
  variant?: CardVariant
}>

const createStyles = (colors: Colors, isSmall: boolean) =>
  StyleSheet.create({
    card: {
      padding: isSmall ? spacing.md : spacing.lg,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      gap: isSmall ? spacing.sm : spacing.md,
    },
    brutalist: {
      padding: isSmall ? spacing.md : spacing.lg,
      borderRadius: 22, // thannuRadius.lg
      borderWidth: strokeWidth.card,
      borderColor: colors.text,
      backgroundColor: colors.surface,
      gap: isSmall ? spacing.sm : spacing.md,
      shadowColor: colors.text,
      shadowOffset: { width: 4, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 0,
      elevation: 5,
    },
  })

/**
 * Surface container. Two variants:
 * - `default` — adapts to the current theme (light/dark).
 * - `brutalist` — Thannu neo-brutalist: white card, ink border, hard 4×4 shadow.
 *
 * Padding shrinks slightly on xs/sm screens.
 */
export function Card({ children, style, variant = 'default' }: CardProps) {
  const colors = useColors()
  const { isSmall } = useResponsive()
  const styles = useMemo(() => createStyles(colors, isSmall), [colors, isSmall])

  return (
    <View style={[variant === 'brutalist' ? styles.brutalist : styles.card, style]}>
      {children}
    </View>
  )
}
