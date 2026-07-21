import { Redirect, type Href } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useOnboarding } from '@/features/onboarding/OnboardingProvider';
import { theme } from '@/shared/theme';

export default function Index() {
  const { isHydrated, isOnboarded } = useOnboarding();

  if (!isHydrated) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
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
