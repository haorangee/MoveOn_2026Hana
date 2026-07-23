import { Redirect, type Href } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useAuth } from '@/features/auth/AuthProvider';
import { useOnboarding } from '@/features/onboarding/OnboardingProvider';
import { theme } from '@/shared/theme';

export default function Index() {
  const { isAuthenticated, isReady: isAuthReady, isRegistered } = useAuth();
  const { isHydrated, isOnboarded, syncStatus } = useOnboarding();

  if (!isAuthReady || (isAuthenticated && (!isHydrated || (isRegistered && syncStatus === 'idle')))) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href={'/login' as Href} />;
  }

  const nextRoute = (isOnboarded ? '/(tabs)' : '/onboarding') as Href;
  return <Redirect href={nextRoute} />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
});
