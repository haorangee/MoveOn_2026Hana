import { Pressable, StyleSheet, View } from 'react-native';
import { Card } from '@/shared/components/Card';
import { Screen } from '@/shared/components/Screen';
import { Body, Heading, Muted, Title } from '@/shared/components/Typography';
import { theme } from '@/shared/theme';

const categories = ['코딩 공부', '토익 공부', '학교 과제'];

export function StudyScreen() {
  return (
    <Screen>
      <Title>공부</Title>
      <Muted>주제와 목표 시간을 고르고 집중을 시작하세요.</Muted>

      <Card>
        <Heading>공부 주제</Heading>
        <View style={styles.chips}>
          {categories.map((category, index) => (
            <View key={category} style={[styles.chip, index === 0 && styles.selected]}>
              <Body>{category}</Body>
            </View>
          ))}
        </View>
      </Card>

      <Card>
        <Heading>목표 시간</Heading>
        <Body>60분</Body>
        <Muted>완료하면 책 1권이 채워져요.</Muted>
      </Card>

      <View style={styles.book}>
        <Body>📗 📗 📗 📗</Body>
        <Muted>현재 책 · 4 / 6 페이지</Muted>
      </View>

      <Pressable style={styles.button}>
        <Body>집중 시작</Body>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  selected: {
    backgroundColor: theme.colors.primarySoft,
    borderColor: theme.colors.primary,
  },
  book: { alignItems: 'center', padding: 24, gap: 8 },
  button: {
    alignItems: 'center',
    padding: 16,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primarySoft,
  },
});
