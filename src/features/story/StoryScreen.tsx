import { Card } from '@/shared/components/Card';
import { Screen } from '@/shared/components/Screen';
import { Body, Heading, Muted, Title } from '@/shared/components/Typography';

export function StoryScreen() {
  return (
    <Screen>
      <Title>나의 스토리</Title>
      <Muted>내 행동과 공간의 변화를 다시 보는 개인 기록이에요.</Muted>

      <Card>
        <Muted>오늘 · 일간 매거진</Muted>
        <Heading>차분히 네 페이지를 채운 날</Heading>
        <Body>42분 집중했고, 물 마시기 퀘스트를 완료했어요.</Body>
      </Card>

      <Card>
        <Muted>7월 둘째 주 · 주간 매거진</Muted>
        <Heading>코딩 책 한 권 완성</Heading>
        <Body>이번 주 총 6시간 20분을 집중했어요.</Body>
      </Card>

      <Card>
        <Muted>6월 · 월간 매거진</Muted>
        <Heading>작은 책장이 자라는 중</Heading>
        <Body>완성한 책 5권이 새로 꽂혔어요.</Body>
      </Card>
    </Screen>
  );
}
