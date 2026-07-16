import type { PropsWithChildren } from 'react'; import { StyleSheet, View } from 'react-native'; import { theme } from '@/shared/theme';
export function Card({ children }: PropsWithChildren) { return <View style={styles.card}>{children}</View>; }
const styles = StyleSheet.create({ card: { padding: theme.spacing.md, gap: theme.spacing.sm, borderRadius: theme.radius.md, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border } });
