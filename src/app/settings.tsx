import { StyleSheet, View } from 'react-native'

import { Screen } from '@/components'
import { ScreenErrorBoundary } from '@/components/error'
import { Button, Card, Text } from '@/components/ui'
import { useThemeStore } from '@/stores'
import { spacing, type ThemeMode } from '@/lib'

const themeModes: { value: ThemeMode; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

const styles = StyleSheet.create({
  titleContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  sectionHeader: {
    gap: spacing.xs,
  },
  modeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
})

function SettingsScreenContent() {
  const mode = useThemeStore((state) => state.mode)
  const setMode = useThemeStore((state) => state.setMode)

  return (
    <Screen scroll>
      <View style={styles.titleContainer}>
        <Text variant="h2">Settings</Text>
      </View>

      <Card>
        <View style={styles.sectionHeader}>
          <Text variant="label">Appearance</Text>
          <Text variant="caption">
            Saved on this device and restored on launch.
          </Text>
        </View>
        <View style={styles.modeRow}>
          {themeModes.map(({ value, label }) => (
            <Button
              key={value}
              size="sm"
              variant={mode === value ? 'primary' : 'outline'}
              onPress={() => setMode(value)}
            >
              {label}
            </Button>
          ))}
        </View>
      </Card>
    </Screen>
  )
}

export default function SettingsScreen() {
  return (
    <ScreenErrorBoundary screenName="Settings">
      <SettingsScreenContent />
    </ScreenErrorBoundary>
  )
}
