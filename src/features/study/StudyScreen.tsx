import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/shared/components/Card';
import { Screen } from '@/shared/components/Screen';
import { Heading, Muted, Title } from '@/shared/components/Typography';
import { formatElapsedTime, studyCategories } from '@/features/study/studySession';
import { theme } from '@/shared/theme';

type StudyResultParams = {
  elapsedSeconds?: string;
  categoryLabel?: string;
  completedPages?: string;
  currentPageProgress?: string;
};

export function StudyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<StudyResultParams>();
  const elapsedSeconds = Number(params.elapsedSeconds ?? 0);
  const completedPages = Number(params.completedPages ?? 0);
  const currentPageProgress = Number(params.currentPageProgress ?? 0);
  const hasResult = typeof params.elapsedSeconds === 'string';

  return (
    <Screen>
      <Title>{hasResult ? '오늘의 공부 기록' : '공부'}</Title>
      <Muted>
        {hasResult
          ? '방금 채운 시간과 페이지를 기록했어요.'
          : '책상에 앉아 한 페이지씩 차분하게 채워보세요.'}
      </Muted>

      {hasResult ? (
        <Card>
          <View style={styles.resultHeading}>
            <View style={styles.resultIcon}>
              <Ionicons name="book-outline" size={22} color="#6D5B46" />
            </View>
            <View>
              <Heading>{params.categoryLabel ?? '공부 활동'}</Heading>
              <Muted>필사 세션이 저장되었습니다.</Muted>
            </View>
          </View>

          <View style={styles.metrics}>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>{formatElapsedTime(elapsedSeconds * 1000)}</Text>
              <Text style={styles.metricLabel}>공부 시간</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metric}>
              <Text style={styles.metricValue}>{completedPages}장</Text>
              <Text style={styles.metricLabel}>완성 페이지</Text>
            </View>
          </View>

          <View style={styles.partialProgress}>
            <View style={styles.partialCopy}>
              <Text style={styles.partialLabel}>다음 페이지 진행</Text>
              <Text style={styles.partialValue}>
                {Math.round(currentPageProgress * 100)}%
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min(100, currentPageProgress * 100)}%` },
                ]}
              />
            </View>
          </View>
        </Card>
      ) : (
        <Card>
          <Heading>공부 주제</Heading>
          <View style={styles.chips}>
            {studyCategories.slice(0, 4).map((category) => (
              <View key={category.id} style={styles.chip}>
                <View style={[styles.categoryDot, { backgroundColor: category.color }]} />
                <Text style={styles.chipText}>{category.label}</Text>
              </View>
            ))}
          </View>
        </Card>
      )}

      <Pressable
        onPress={() => router.push('/study-desk')}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <Text style={styles.buttonLabel}>{hasResult ? '한 번 더 공부하기' : '책상으로 이동'}</Text>
        <Ionicons name="arrow-forward" size={18} color="#FFF9ED" />
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  resultHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  resultIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFE3CF',
  },
  metrics: {
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 16,
    flexDirection: 'row',
    backgroundColor: '#FAF5EC',
  },
  metric: {
    flex: 1,
    alignItems: 'center',
  },
  metricDivider: {
    width: 1,
    backgroundColor: '#E4D8C7',
  },
  metricValue: {
    color: '#40352C',
    fontSize: 19,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  metricLabel: {
    marginTop: 4,
    color: '#8A7A68',
    fontSize: 10,
    fontWeight: '700',
  },
  partialProgress: {
    marginTop: 16,
  },
  partialCopy: {
    marginBottom: 7,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  partialLabel: {
    color: '#746656',
    fontSize: 10,
    fontWeight: '700',
  },
  partialValue: {
    color: '#746656',
    fontSize: 10,
    fontWeight: '900',
  },
  progressTrack: {
    height: 7,
    overflow: 'hidden',
    borderRadius: 4,
    backgroundColor: '#E8DED0',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#8EA485',
  },
  chips: {
    marginTop: 13,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  chipText: {
    color: '#554A3F',
    fontSize: 11,
    fontWeight: '700',
  },
  button: {
    minHeight: 52,
    paddingHorizontal: 18,
    borderRadius: theme.radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#655646',
  },
  buttonLabel: {
    color: '#FFF9ED',
    fontSize: 13,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
});
