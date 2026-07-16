import type { PropsWithChildren } from 'react'; import { StyleSheet, Text } from 'react-native'; import { theme } from '@/shared/theme';
export function Title({ children }: PropsWithChildren) { return <Text style={styles.title}>{children}</Text>; }
export function Heading({ children }: PropsWithChildren) { return <Text style={styles.heading}>{children}</Text>; }
export function Body({ children }: PropsWithChildren) { return <Text style={styles.body}>{children}</Text>; }
export function Muted({ children }: PropsWithChildren) { return <Text style={styles.muted}>{children}</Text>; }
const styles = StyleSheet.create({ title: { fontSize: 28, fontWeight: '800', color: theme.colors.text }, heading: { fontSize: 18, fontWeight: '700', color: theme.colors.text }, body: { fontSize: 15, lineHeight: 22, color: theme.colors.text }, muted: { fontSize: 13, lineHeight: 19, color: theme.colors.muted } });

