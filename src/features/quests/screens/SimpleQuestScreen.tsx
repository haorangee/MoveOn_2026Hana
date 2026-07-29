import { Ionicons } from '@expo/vector-icons';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
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

type SimpleQuestRouteParams = {
  questId?: string | string[];
};

export default function SimpleQuestScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<SimpleQuestRouteParams>();
  const { isReady, user } = useAuth();
  const completingRef = useRef(false);
  const [quest, setQuest] = useState<Quest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    rewardResult,
    rewardModalVisible,
    rewardCategoryId,
    showRewardResult,
    clearRewardResult,
  } = useActivityRewardModal();

  const questId = getQuestRouteParam(params.questId)?.trim() ?? '';

  useEffect(() => {
    if (!isReady) return;
    let active = true;

    const loadQuest = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (!user?.uid || !questId) throw new Error('퀘스트 정보를 확인할 수 없어요.');
        const nextQuest = await getQuest(user.uid, questId);
        if (!nextQuest || nextQuest.executionType !== 'simple') {
          throw new Error('시작할 수 있는 간단 퀘스트를 찾지 못했어요.');
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

  const complete = async () => {
    if (!quest || !quest.aiQuestLevel || completingRef.current) return;
    completingRef.current = true;
    setIsCompleting(true);
    setError(null);
    try {
      const rewardCategory = resolveQuestRewardCategory(quest.rewardCategory);
      const result = await completeQuestActivity({
        questId: quest.id,
        title: quest.title,
        executionType: 'simple',
        rewardCategory,
        aiQuestLevel: quest.aiQuestLevel,
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
        <Text style={styles.headerTitle}>작은 퀘스트</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons color="#A85F73" name="sparkles" size={38} />
        </View>
        {isLoading ? (
          <ActivityIndicator color="#A85F73" size="large" />
        ) : (
          <>
            <Text style={styles.kicker}>지금은 이것 하나만</Text>
            <Text style={styles.title}>{quest?.title ?? '퀘스트를 불러오지 못했어요.'}</Text>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Pressable
              accessibilityRole="button"
              disabled={!quest || !quest.aiQuestLevel || isCompleting}
              onPress={() => void complete()}
              style={({ pressed }) => [
                styles.completeButton,
                (!quest || !quest.aiQuestLevel || isCompleting) && styles.buttonDisabled,
                pressed && !isCompleting && styles.pressed,
              ]}
            >
              {isCompleting ? <ActivityIndicator color="#FFF9F0" size="small" /> : null}
              <Text style={styles.completeButtonText}>{isCompleting ? '저장하는 중…' : '했어!'}</Text>
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
  safe: { flex: 1, backgroundColor: '#FAF4E8' },
  header: { height: 68, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 12 },
  backButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E9DDCB', backgroundColor: '#FFFDF7' },
  headerTitle: { color: '#463A32', fontSize: 18, fontWeight: '900' },
  content: { flex: 1, width: '100%', maxWidth: 560, alignSelf: 'center', paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center' },
  iconWrap: { width: 88, height: 88, marginBottom: 30, borderRadius: 34, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FCE9EC' },
  kicker: { color: '#A85F73', fontSize: 12, fontWeight: '900', letterSpacing: 0.8 },
  title: { marginTop: 12, color: '#42372F', fontSize: 27, lineHeight: 38, fontWeight: '900', textAlign: 'center' },
  error: { marginTop: 18, color: '#A85F73', fontSize: 13, lineHeight: 20, fontWeight: '700', textAlign: 'center' },
  completeButton: { minWidth: 190, height: 58, marginTop: 38, paddingHorizontal: 28, borderRadius: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, backgroundColor: '#B96E82' },
  completeButtonText: { color: '#FFF9F0', fontSize: 17, fontWeight: '900' },
  buttonDisabled: { opacity: 0.48 },
  pressed: { opacity: 0.86, transform: [{ scale: 0.99 }] },
});
