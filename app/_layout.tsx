import { Stack } from 'expo-router';
import Head from 'expo-router/head';
import { StatusBar } from 'expo-status-bar';
import { theme } from '@/shared/theme';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { OnboardingProvider } from '@/features/onboarding/OnboardingProvider';

export default function RootLayout() {
  return (
    <>
      <Head>
        <title>MoveOn</title>
        <meta name="application-name" content="MoveOn" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="MoveOn" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#F7F3E8" />
        <link rel="manifest" href="/manifest.json" />
      </Head>
      <AuthProvider>
        <OnboardingProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: theme.colors.background },
            }}
          />
        </OnboardingProvider>
      </AuthProvider>
    </>
  );
}
