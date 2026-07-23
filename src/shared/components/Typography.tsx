import type { PropsWithChildren } from 'react';
import type { TextStyle } from 'react-native';
import { StyleSheet, Text } from 'react-native';
import { theme } from '@/shared/theme';

type TypographyProps = PropsWithChildren<{
  style?: TextStyle | TextStyle[];
}>;

export function Title({ children, style }: TypographyProps) {
  return <Text style={[styles.title, style]}>{children}</Text>;
}
export function Heading({ children, style }: TypographyProps) {
  return <Text style={[styles.heading, style]}>{children}</Text>;
}
export function Body({ children, style }: TypographyProps) {
  return <Text style={[styles.body, style]}>{children}</Text>;
}
export function Muted({ children, style }: TypographyProps) {
  return <Text style={[styles.muted, style]}>{children}</Text>;
}
const styles = StyleSheet.create({ title: { fontSize: 28, fontWeight: '800', color: theme.colors.text }, heading: { fontSize: 18, fontWeight: '700', color: theme.colors.text }, body: { fontSize: 15, lineHeight: 22, color: theme.colors.text }, muted: { fontSize: 13, lineHeight: 19, color: theme.colors.muted } });

