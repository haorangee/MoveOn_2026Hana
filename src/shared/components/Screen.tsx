import type { PropsWithChildren } from 'react'; import { SafeAreaView, ScrollView, StyleSheet } from 'react-native'; import { theme } from '@/shared/theme';
export function Screen({ children }: PropsWithChildren) {
  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.content}>{children}</ScrollView></SafeAreaView>;
}
const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: theme.colors.background }, content: { padding: theme.spacing.lg, gap: theme.spacing.md } });
