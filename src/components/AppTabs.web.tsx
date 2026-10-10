import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui'
import { useMemo } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'

import { Text } from '@/components/ui'
import { useColors } from '@/hooks'
import { borderRadius, spacing, type Colors } from '@/lib'

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="home" href="/" asChild>
            <TabButton>Home</TabButton>
          </TabTrigger>
          <TabTrigger name="settings" href="/settings" asChild>
            <TabButton>Settings</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  )
}

function TabButton({ children, isFocused, ...props }: TabTriggerSlotProps) {
  const colors = useColors()
  const styles = useMemo(() => createStyles(colors), [colors])

  return (
    <Pressable {...props} style={({ pressed }) => pressed && styles.pressed}>
      <View style={[styles.tabButtonView, isFocused && styles.tabButtonViewFocused]}>
        <Text variant="label" color={isFocused ? 'primary' : 'secondary'}>
          {children}
        </Text>
      </View>
    </Pressable>
  )
}

function CustomTabList(props: TabListProps) {
  const colors = useColors()
  const styles = useMemo(() => createStyles(colors), [colors])

  return (
    <View {...props} style={styles.tabListContainer}>
      <View style={styles.innerContainer}>{props.children}</View>
    </View>
  )
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    // Floats over the content at the top of the viewport; screens clear it
    // via TopTabInset (see Screen.tsx and theme.ts)
    tabListContainer: {
      position: 'absolute',
      top: 0,
      width: '100%',
      padding: spacing.md,
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
    },
    innerContainer: {
      padding: spacing.sm,
      borderRadius: borderRadius.full,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.surface,
    },
    pressed: {
      opacity: 0.7,
    },
    tabButtonView: {
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.md,
      borderRadius: borderRadius.full,
      backgroundColor: colors.surface,
    },
    tabButtonViewFocused: {
      backgroundColor: colors.border,
    },
  })
