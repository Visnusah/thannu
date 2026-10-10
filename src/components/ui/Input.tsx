import { useMemo, useState, type Ref } from 'react'
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { useColors, useResponsive } from '@/hooks'
import { spacing, fontSize, fontWeight, borderRadius, minTouchTarget, type Colors } from '@/lib'

type InputProps = TextInputProps & {
  ref?: Ref<TextInput>
  label?: string
  error?: string
  hint?: string
  containerStyle?: StyleProp<ViewStyle>
  leftIcon?: keyof typeof Ionicons.glyphMap
  rightIcon?: keyof typeof Ionicons.glyphMap
  onRightIconPress?: () => void
}

const createStyles = (colors: Colors, isSmall: boolean) =>
  StyleSheet.create({
    container: {
      width: '100%',
    },
    label: {
      fontSize: isSmall ? fontSize.xs + 1 : fontSize.sm,
      fontWeight: fontWeight.medium,
      color: colors.text,
      marginBottom: spacing.xs,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: borderRadius.md,
      backgroundColor: colors.surface,
      minHeight: minTouchTarget,
    },
    inputContainerFocused: {
      borderColor: colors.accent,
    },
    inputContainerError: {
      borderColor: colors.danger,
    },
    leftIcon: {
      paddingLeft: isSmall ? spacing.sm : spacing.md,
    },
    input: {
      flex: 1,
      paddingVertical: isSmall ? spacing.sm : spacing.md,
      paddingHorizontal: isSmall ? spacing.sm : spacing.md,
      fontSize: isSmall ? fontSize.sm : fontSize.base,
      color: colors.text,
    },
    rightIconButton: {
      padding: isSmall ? spacing.sm : spacing.md,
      minWidth: minTouchTarget,
      minHeight: minTouchTarget,
      alignItems: 'center',
      justifyContent: 'center',
    },
    hint: {
      fontSize: fontSize.xs,
      color: colors.secondary,
      marginTop: spacing.xs,
    },
    error: {
      fontSize: fontSize.xs,
      color: colors.danger,
      marginTop: spacing.xs,
    },
  })

/**
 * Themed text input with label, hint, error states, and optional icons.
 * Enforces a 44px minimum height for the input row (design.md §3.3).
 * Font sizes and padding scale down slightly on xs/sm screens.
 */
export function Input({
  ref,
  label,
  error,
  hint,
  containerStyle,
  leftIcon,
  rightIcon,
  onRightIconPress,
  secureTextEntry,
  ...props
}: InputProps) {
  const colors = useColors()
  const { isSmall } = useResponsive()
  const styles = useMemo(() => createStyles(colors, isSmall), [colors, isSmall])
  const [isFocused, setIsFocused] = useState(false)
  const [isSecureVisible, setIsSecureVisible] = useState(false)

  const isPassword = secureTextEntry === true
  const showSecureToggle = isPassword && !rightIcon

  const handleFocus = (e: Parameters<NonNullable<TextInputProps['onFocus']>>[0]) => {
    setIsFocused(true)
    props.onFocus?.(e)
  }

  const handleBlur = (e: Parameters<NonNullable<TextInputProps['onBlur']>>[0]) => {
    setIsFocused(false)
    props.onBlur?.(e)
  }

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text
          style={styles.label}
          accessibilityRole="text"
          allowFontScaling
          maxFontSizeMultiplier={1.3}
        >
          {label}
        </Text>
      )}
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused,
          error && styles.inputContainerError,
        ]}
      >
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={isSmall ? 18 : 20}
            color={colors.tertiary}
            style={styles.leftIcon}
          />
        )}
        <TextInput
          ref={ref}
          style={styles.input}
          placeholderTextColor={colors.tertiary}
          secureTextEntry={isPassword && !isSecureVisible}
          accessibilityLabel={label || props.placeholder}
          accessibilityHint={hint}
          accessibilityState={{ disabled: props.editable === false }}
          allowFontScaling
          maxFontSizeMultiplier={1.3}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
        {showSecureToggle && (
          <Pressable
            onPress={() => setIsSecureVisible(!isSecureVisible)}
            style={styles.rightIconButton}
            accessibilityRole="button"
            accessibilityLabel={isSecureVisible ? 'Hide password' : 'Show password'}
          >
            <Ionicons
              name={isSecureVisible ? 'eye-off-outline' : 'eye-outline'}
              size={isSmall ? 18 : 20}
              color={colors.tertiary}
            />
          </Pressable>
        )}
        {rightIcon && (
          <Pressable
            onPress={onRightIconPress}
            style={styles.rightIconButton}
            accessibilityRole="button"
            disabled={!onRightIconPress}
          >
            <Ionicons name={rightIcon} size={isSmall ? 18 : 20} color={colors.tertiary} />
          </Pressable>
        )}
      </View>
      {error && (
        <Text style={styles.error} accessibilityRole="alert" allowFontScaling maxFontSizeMultiplier={1.5}>
          {error}
        </Text>
      )}
      {hint && !error && (
        <Text style={styles.hint} accessibilityRole="text" allowFontScaling maxFontSizeMultiplier={1.5}>
          {hint}
        </Text>
      )}
    </View>
  )
}
