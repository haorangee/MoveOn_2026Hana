import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { theme } from '@/shared/theme';
import { OnboardingProvider } from '@/features/onboarding/OnboardingProvider';

export default function RootLayout() {
  return (
    <OnboardingProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      />
    </OnboardingProvider>
  );
}
