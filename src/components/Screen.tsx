import { useMemo, type PropsWithChildren } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useColors, useResponsive } from '@/hooks'
import {
  spacing,
  BottomTabInset,
  TopTabInset,
  MaxContentWidth,
  screenPaddingH,
  type Colors,
} from '@/lib'

type ScreenProps = PropsWithChildren<{
  /** Wrap content in a ScrollView — for screens that can outgrow the viewport */
  scroll?: boolean
  /** Center content vertically — for hero-style screens */
  centered?: boolean
  /** Override horizontal padding (defaults to responsive screenPaddingH) */
  horizontalPadding?: number
}>

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },
    row: {
      flexGrow: 1,
      flexDirection: 'row',
      justifyContent: 'center',
    },
    content: {
      flex: 1,
      maxWidth: MaxContentWidth,
    },
    centered: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.md,
    },
  })

/**
 * Shared screen scaffold: themed background, safe-area padding, clearance for
 * the floating tab bars, and a centered max-width column on wide viewports.
 * Padding automatically adapts to the device's screen width breakpoint.
 * Every screen should render its content inside a Screen.
 */
export function Screen({
  children,
  scroll = false,
  centered = false,
  horizontalPadding,
}: ScreenProps) {
  const colors = useColors()
  const styles = useMemo(() => createStyles(colors), [colors])
  const insets = useSafeAreaInsets()
  const { size } = useResponsive()

  // Pick responsive horizontal padding or fall back to caller override
  const hPad = horizontalPadding ?? screenPaddingH[size]

  const insetStyle = {
    paddingTop: insets.top + TopTabInset,
    paddingBottom: insets.bottom + BottomTabInset + spacing.md,
    paddingLeft: insets.left + hPad,
    paddingRight: insets.right + hPad,
  }

  const content = (
    <View style={[styles.content, centered && styles.centered, insetStyle]}>
      {children}
    </View>
  )

  if (scroll) {
    return (
      <ScrollView
        style={styles.root}
        contentContainerStyle={styles.row}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {content}
      </ScrollView>
    )
  }

  return <View style={[styles.root, styles.row]}>{content}</View>
}
