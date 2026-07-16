import { StyleSheet, View } from 'react-native';
import { Card } from '@/shared/components/Card';
import { Screen } from '@/shared/components/Screen';
import { Body, Heading, Muted, Title } from '@/shared/components/Typography';
import { theme } from '@/shared/theme';

export function RoomScreen() {
  return (
    <Screen>
      <Title>나의 방</Title>
      <Muted>행동이 쌓이면 캐릭터와 공간도 함께 변해요.</Muted>

      <View style={styles.room}>
        <Body>🪟      🌿</Body>
        <Body>📚 📚   🧑‍💻</Body>
        <Body>🛏️       🪑</Body>
      </View>

      <Card>
        <Heading>작은 책장</Heading>
        <Body>완성한 책 8권</Body>
        <Muted>공부방 해금까지 22권 남았어요.</Muted>
      </Card>

      <Card>
        <Heading>방 상태</Heading>
        <Body>청결함 72% · 캐릭터 컨디션 84%</Body>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  room: {
    minHeight: 250,
    justifyContent: 'space-around',
    padding: 28,
    borderRadius: theme.radius.lg,
    backgroundColor: '#EADFC8',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
});
