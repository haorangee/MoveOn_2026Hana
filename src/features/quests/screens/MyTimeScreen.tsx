import { Ionicons } from '@expo/vector-icons';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Quest } from '@/contracts/quest';
import { useAuth } from '@/features/auth/AuthProvider';
import { ActivityRewardModal } from '@/features/activity/rewards/components/ActivityRewardModal';
import { useActivityRewardModal } from '@/features/activity/rewards/hooks/useActivityRewardModal';
import {
  completeQuestActivity,
  resolveQuestRewardCategory,
} from '@/features/activity/services/questActivityService';
import { getQuestRouteParam } from '@/features/quests/services/questActivityLinkService';
import { getQuest } from '@/features/quests/services/questService';

type MyTimeRouteParams = {
  questId?: string | string[];
};

const ALLOWED_DURATIONS = [5, 10, 15] as const;

function isAllowedDuration(value: number): value is typeof ALLOWED_DURATIONS[number] {
  return ALLOWED_DURATIONS.includes(value as typeof ALLOWED_DURATIONS[number]);
}

function formatRemainingTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function MyTimeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<MyTimeRouteParams>();
  const { isReady, user } = useAuth();
  const completingRef = useRef(false);
  const startedAtRef = useRef<number | null>(null);
  const [quest, setQuest] = useState<Quest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const {
    rewardResult,
    rewardModalVisible,
    rewardCategoryId,
    showRewardResult,
    clearRewardResult,
  } = useActivityRewardModal();

  const questId = getQuestRouteParam(params.questId)?.trim() ?? '';
  const durationMinutes = quest?.estimatedMinutes ?? 0;

  useEffect(() => {
    if (!isReady) return;
    let active = true;

    const loadQuest = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (!user?.uid || !questId) throw new Error('퀘스트 정보를 확인할 수 없어요.');
        const nextQuest = await getQuest(user.uid, questId);
        if (!nextQuest || nextQuest.executionType !== 'my_time') {
          throw new Error('시작할 수 있는 My Time 퀘스트를 찾지 못했어요.');
        }
        if (!isAllowedDuration(nextQuest.estimatedMinutes)) {
          throw new Error('My Time은 5분, 10분, 15분 퀘스트만 시작할 수 있어요.');
        }
        if (active) setQuest(nextQuest);
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : '퀘스트를 불러오지 못했어요.');
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void loadQuest();
    return () => {
      active = false;
    };
  }, [isReady, questId, user?.uid]);

  useEffect(() => {
    if (!quest || !isAllowedDuration(durationMinutes)) return undefined;
    const totalSeconds = durationMinutes * 60;
    startedAtRef.current = Date.now();

    const refresh = () => {
      const startedAt = startedAtRef.current;
      if (startedAt === null) return;
      const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
      setRemainingSeconds(Math.max(0, totalSeconds - elapsedSeconds));
    };

    refresh();
    const interval = setInterval(refresh, 1000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [durationMinutes, quest]);

  const complete = async () => {
    if (!quest || !isAllowedDuration(durationMinutes) || completingRef.current) return;
    completingRef.current = true;
    setIsCompleting(true);
    setError(null);
    try {
      const rewardCategory = resolveQuestRewardCategory(quest.rewardCategory);
      const result = await completeQuestActivity({
        questId: quest.id,
        title: quest.title,
        executionType: 'my_time',
        rewardCategory,
        durationMinutes,
      });
      showRewardResult(rewardCategory, result.rewardResult);
    } catch (completeError) {
      setError(completeError instanceof Error ? completeError.message : '완료를 저장하지 못했어요.');
    } finally {
      completingRef.current = false;
      setIsCompleting(false);
    }
  };

  const confirmReward = () => {
    clearRewardResult();
    router.replace('/quests' as Href);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="퀘스트 목록으로 돌아가기"
          accessibilityRole="button"
          onPress={() => router.replace('/quests' as Href)}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <Ionicons color="#57493E" name="chevron-back" size={22} />
        </Pressable>
        <Text style={styles.headerTitle}>My Time</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons color="#667A59" name="hourglass-outline" size={38} />
        </View>
        {isLoading ? (
          <ActivityIndicator color="#667A59" size="large" />
        ) : (
          <>
            <Text style={styles.kicker}>나를 위한 작은 시간</Text>
            <Text style={styles.title}>{quest?.title ?? '퀘스트를 불러오지 못했어요.'}</Text>
            {quest ? <Text style={styles.timer}>{formatRemainingTime(remainingSeconds)}</Text> : null}
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Pressable
              accessibilityRole="button"
              disabled={!quest || !isAllowedDuration(durationMinutes) || isCompleting}
              onPress={() => void complete()}
              style={({ pressed }) => [
                styles.completeButton,
                (!quest || !isAllowedDuration(durationMinutes) || isCompleting) && styles.buttonDisabled,
                pressed && !isCompleting && styles.pressed,
              ]}
            >
              {isCompleting ? <ActivityIndicator color="#FFF9F0" size="small" /> : null}
              <Text style={styles.completeButtonText}>{isCompleting ? '저장하는 중…' : '완료'}</Text>
            </Pressable>
          </>
        )}
      </View>

      <ActivityRewardModal
        visible={rewardModalVisible}
        categoryId={rewardCategoryId}
        result={rewardResult}
        onConfirm={confirmReward}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F3E8' },
  header: { height: 68, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 12 },
  backButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E5DED0', backgroundColor: '#FFFDF7' },
  headerTitle: { color: '#2D332A', fontSize: 18, fontWeight: '900' },
  content: { flex: 1, width: '100%', maxWidth: 560, alignSelf: 'center', paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center' },
  iconWrap: { width: 88, height: 88, marginBottom: 28, borderRadius: 34, alignItems: 'center', justifyContent: 'center', backgroundColor: '#DDE8D5' },
  kicker: { color: '#667A59', fontSize: 12, fontWeight: '900', letterSpacing: 0.8 },
  title: { marginTop: 12, color: '#2D332A', fontSize: 25, lineHeight: 36, fontWeight: '900', textAlign: 'center' },
  timer: { marginTop: 30, color: '#506246', fontSize: 54, fontWeight: '900', fontVariant: ['tabular-nums'], letterSpacing: 2 },
  error: { marginTop: 18, color: '#A85F73', fontSize: 13, lineHeight: 20, fontWeight: '700', textAlign: 'center' },
  completeButton: { minWidth: 190, height: 58, marginTop: 34, paddingHorizontal: 28, borderRadius: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, backgroundColor: '#5D7651' },
  completeButtonText: { color: '#FFF9F0', fontSize: 17, fontWeight: '900' },
  buttonDisabled: { opacity: 0.48 },
  pressed: { opacity: 0.86, transform: [{ scale: 0.99 }] },
});
