import { useMemo } from 'react'
import {
  Text as RNText,
  StyleSheet,
  type TextProps as RNTextProps,
  type StyleProp,
  type TextStyle,
} from 'react-native'

import { useColors } from '@/hooks'
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

const createStyles = (colors: Colors) => {
  const variants = StyleSheet.create({
    h1: {
      fontSize: fontSize['3xl'],
      fontWeight: fontWeight.bold,
      color: colors.text,
    },
    h2: {
      fontSize: fontSize['2xl'],
      fontWeight: fontWeight.bold,
      color: colors.text,
    },
    h3: {
      fontSize: fontSize.xl,
      fontWeight: fontWeight.semibold,
      color: colors.text,
    },
    body: {
      fontSize: fontSize.base,
      fontWeight: fontWeight.normal,
      color: colors.text,
    },
    bodySmall: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.normal,
      color: colors.text,
    },
    caption: {
      fontSize: fontSize.xs,
      fontWeight: fontWeight.normal,
      color: colors.secondary,
    },
    label: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.medium,
      color: colors.text,
    },
    code: {
      fontFamily: Fonts.mono,
      fontSize: fontSize.xs,
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

export function Text({
  variant = 'body',
  color,
  weight,
  style,
  children,
  ...props
}: TextProps) {
  const colors = useColors()
  const styles = useMemo(() => createStyles(colors), [colors])

  return (
    <RNText
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
