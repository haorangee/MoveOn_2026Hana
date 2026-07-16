import { StyleSheet, View } from 'react-native';
import { Card } from '@/shared/components/Card';
import { Screen } from '@/shared/components/Screen';
import { Body, Heading, Muted, Title } from '@/shared/components/Typography';
import { theme } from '@/shared/theme';

const quests = ['물 한 잔 마시기', '샤워하기', '25분 집중하기'];

export function HomeScreen() {
  return (
    <Screen>
      <Title>좋은 아침이에요, 하늘님</Title>
      <Muted>오늘도 한 페이지씩 천천히 채워봐요.</Muted>

      <Card>
        <Heading>오늘의 캐릭터</Heading>
        <View style={styles.character}>
          <Body>🌱 컨디션이 좋아요</Body>
          <Muted>Lv. 4 · 경험치 320 · 포도알 48</Muted>
        </View>
      </Card>

      <Heading>오늘의 퀘스트</Heading>
      {quests.map((quest, index) => (
        <Card key={quest}>
          <Body>{index === 0 ? '✓' : '○'} {quest}</Body>
          <Muted>완료 보상 · 경험치 10 / 포도알 3</Muted>
        </Card>
      ))}

      <Card>
        <Heading>오늘의 진행</Heading>
        <Body>공부 42분 · 4페이지</Body>
        <Muted>다음 페이지까지 8분</Muted>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  character: {
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primarySoft,
    gap: theme.spacing.xs,
  },
});
