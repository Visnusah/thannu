import { useMemo } from 'react'
import {
  Text as RNText,
  StyleSheet,
  type TextProps as RNTextProps,
  type StyleProp,
  type TextStyle,
} from 'react-native'

import { useColors, useResponsive } from '@/hooks'
import { Fonts, fontSize, fontWeight, type Colors } from '@/lib'

type TextVariant = 'h1' | 'h2' | 'h3' | 'body' | 'bodySmall' | 'caption' | 'label' | 'code'
// Each color maps to the theme token of the same name. Omit the prop to use
// the variant's default color.
type TextColor = 'primary' | 'secondary' | 'tertiary' | 'accent' | 'danger' | 'warning' | 'success'
type TextWeight = keyof typeof fontWeight

type TextProps = RNTextProps & {
  variant?: TextVariant
  color?: TextColor
  weight?: TextWeight
  style?: StyleProp<TextStyle>
}

const weightStyles: Record<TextWeight, TextStyle> = StyleSheet.create({
  normal: { fontWeight: fontWeight.normal },
  medium: { fontWeight: fontWeight.medium },
  semibold: { fontWeight: fontWeight.semibold },
  bold: { fontWeight: fontWeight.bold },
})

const createStyles = (colors: Colors, scale: (base: number) => number) => {
  const variants = StyleSheet.create({
    h1: {
      fontSize: scale(fontSize['3xl']),
      fontWeight: fontWeight.bold,
      color: colors.text,
      lineHeight: scale(fontSize['3xl']) * 1.15,
    },
    h2: {
      fontSize: scale(fontSize['2xl']),
      fontWeight: fontWeight.bold,
      color: colors.text,
      lineHeight: scale(fontSize['2xl']) * 1.2,
    },
    h3: {
      fontSize: scale(fontSize.xl),
      fontWeight: fontWeight.semibold,
      color: colors.text,
      lineHeight: scale(fontSize.xl) * 1.3,
    },
    body: {
      fontSize: scale(fontSize.base),
      fontWeight: fontWeight.normal,
      color: colors.text,
      lineHeight: scale(fontSize.base) * 1.5,
    },
    bodySmall: {
      fontSize: scale(fontSize.sm),
      fontWeight: fontWeight.normal,
      color: colors.text,
      lineHeight: scale(fontSize.sm) * 1.5,
    },
    caption: {
      fontSize: scale(fontSize.xs),
      fontWeight: fontWeight.normal,
      color: colors.secondary,
      lineHeight: scale(fontSize.xs) * 1.4,
    },
    label: {
      fontSize: scale(fontSize.sm),
      fontWeight: fontWeight.medium,
      color: colors.text,
      lineHeight: scale(fontSize.sm) * 1.4,
    },
    code: {
      fontFamily: Fonts.mono,
      fontSize: scale(fontSize.xs),
      fontWeight: fontWeight.medium,
      color: colors.text,
    },
  })

  const colorStyles: Record<TextColor, TextStyle> = StyleSheet.create({
    primary: { color: colors.primary },
    secondary: { color: colors.secondary },
    tertiary: { color: colors.tertiary },
    accent: { color: colors.accent },
    danger: { color: colors.danger },
    warning: { color: colors.warning },
    success: { color: colors.success },
  })

  return { variants, colorStyles }
}

/**
 * Themed text component. Font sizes scale slightly with the device width
 * so text feels proportionate on both iPhone SE and Pro Max screens.
 * `allowFontScaling` is enabled (capped at 1.3× for headings per design.md §11).
 */
export function Text({
  variant = 'body',
  color,
  weight,
  style,
  children,
  ...props
}: TextProps) {
  const colors = useColors()
  const { scale } = useResponsive()
  const styles = useMemo(() => createStyles(colors, scale), [colors, scale])

  // Headings cap at 1.3× Dynamic Type to prevent layout breaks (design.md §11)
  const isHeading = variant === 'h1' || variant === 'h2' || variant === 'h3'

  return (
    <RNText
      allowFontScaling
      maxFontSizeMultiplier={isHeading ? 1.3 : 1.5}
      style={[
        styles.variants[variant],
        color && styles.colorStyles[color],
        weight && weightStyles[weight],
        style,
      ]}
      {...props}
    >
      {children}
    </RNText>
  )
}
