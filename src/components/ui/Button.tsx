import { useMemo, type ReactNode } from 'react'
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
} from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'

import { useColors, useResponsive } from '@/hooks'
import { spacing, fontSize, fontWeight, borderRadius, minTouchTarget, type Colors } from '@/lib'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

type ButtonProps = Omit<PressableProps, 'style'> & {
  children: string
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  fullWidth?: boolean
  leftIcon?: ReactNode
  style?: StyleProp<ViewStyle>
  textStyle?: StyleProp<TextStyle>
}

const createStyles = (colors: Colors, isSmall: boolean) => {
  // On xs/sm screens, reduce padding slightly while keeping min touch targets
  const sizeStyles = {
    sm: {
      paddingVertical: isSmall ? spacing.xs + 2 : spacing.sm,
      paddingHorizontal: isSmall ? spacing.sm + 2 : spacing.md,
      minHeight: minTouchTarget,
    },
    md: {
      paddingVertical: isSmall ? spacing.sm + 2 : spacing.md,
      paddingHorizontal: isSmall ? spacing.md : spacing.lg,
      minHeight: minTouchTarget,
    },
    lg: {
      paddingVertical: isSmall ? spacing.md : spacing.md + 4,
      paddingHorizontal: isSmall ? spacing.lg : spacing.xl,
      minHeight: minTouchTarget,
    },
  } as const

  const textSizeStyles = {
    sm: { fontSize: isSmall ? fontSize.xs + 1 : fontSize.sm },
    md: { fontSize: isSmall ? fontSize.sm : fontSize.base },
    lg: { fontSize: isSmall ? fontSize.base : fontSize.lg },
  } as const

  const variantStyles = {
    primary: { backgroundColor: colors.primary },
    secondary: { backgroundColor: colors.surface },
    outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border },
    ghost: { backgroundColor: 'transparent' },
    danger: { backgroundColor: colors.danger },
  } as const

  const textVariantStyles = {
    primary: { color: colors.background },
    secondary: { color: colors.text },
    outline: { color: colors.text },
    ghost: { color: colors.text },
    danger: { color: colors.onDanger },
  } as const

  return {
    base: StyleSheet.create({
      container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: borderRadius.md,
      },
      fullWidth: { width: '100%' },
      disabled: { opacity: 0.6 },
      textBase: { fontWeight: fontWeight.semibold },
      loader: { marginRight: spacing.sm },
      icon: { marginRight: spacing.sm },
    }),
    sizeStyles,
    textSizeStyles,
    variant: variantStyles,
    textVariant: textVariantStyles,
  }
}

/**
 * Themed button with press-in animation.
 * Enforces a 44×44 minimum touch target on all sizes (design.md §3.3).
 * Padding scales down slightly on xs/sm screens to preserve layout density.
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  leftIcon,
  style,
  textStyle,
  ...props
}: ButtonProps) {
  const colors = useColors()
  const { isSmall } = useResponsive()
  const styles = useMemo(() => createStyles(colors, isSmall), [colors, isSmall])

  const isDisabled = disabled || loading
  const loaderColor =
    variant === 'danger'
      ? colors.onDanger
      : variant === 'primary'
        ? colors.background
        : colors.text

  const scale = useSharedValue(1)
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
  }))

  return (
    <Animated.View style={[fullWidth && styles.base.fullWidth, animatedStyle]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled }}
        disabled={isDisabled}
        onPressIn={() => {
          scale.set(withTiming(0.97, { duration: 90 }))
        }}
        onPressOut={() => {
          scale.set(withTiming(1, { duration: 150 }))
        }}
        style={[
          styles.base.container,
          styles.sizeStyles[size],
          styles.variant[variant],
          isDisabled && styles.base.disabled,
          style,
        ]}
        {...props}
      >
        {loading && (
          <ActivityIndicator size="small" color={loaderColor} style={styles.base.loader} />
        )}
        {leftIcon ? <View style={styles.base.icon}>{leftIcon}</View> : null}
        <Text
          allowFontScaling
          maxFontSizeMultiplier={1.3}
          style={[
            styles.base.textBase,
            styles.textSizeStyles[size],
            styles.textVariant[variant],
            textStyle,
          ]}
        >
          {children}
        </Text>
      </Pressable>
    </Animated.View>
  )
}
