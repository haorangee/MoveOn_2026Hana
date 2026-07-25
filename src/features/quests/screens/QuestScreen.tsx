import { Ionicons } from '@expo/vector-icons';
import { type Href, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ACTIVITY_CATEGORY } from '../../activity/constants/activityCategory';
import type { Quest } from '../../../contracts/quest';
import type { CreateQuestInput, UpdateQuestInput } from '../types/questInput';
import { QuestCard } from '../components/QuestCard';
import { QuestEmptyState } from '../components/QuestEmptyState';
import { QuestFormModal } from '../components/QuestFormModal';
import { useTodayQuests } from '../hooks/useTodayQuests';

type FormState = {
  mode: 'create' | 'edit';
  quest: Quest | null;
  visible: boolean;
};

const STATUS_ORDER: Record<Quest['status'], number> = {
  pending: 0,
  completed: 1,
  skipped: 2,
};

function formatToday() {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(new Date());
}

function getCompletionMessage(quest: Quest) {
  if (quest.category === 'custom') {
    return '작은 퀘스트를 완료했어요! 사용자 지정 퀘스트에는 XP와 포도가 지급되지 않아요.';
  }
  return '이 퀘스트의 활동 연결은 다음 단계에서 지원할 예정이에요.';
}

export default function QuestScreen() {
  const router = useRouter();
  const {
    completeQuest,
    createQuest,
    deleteQuest,
    error,
    isLoading,
    isRefreshing,
    processingQuestId,
    quests,
    refresh,
    reload,
    skipQuest,
    updateQuest,
  } = useTodayQuests();
  const [formState, setFormState] = useState<FormState>({
    mode: 'create',
    quest: null,
    visible: false,
  });
  const [notice, setNotice] = useState<string | null>(null);

  const sortedQuests = useMemo(() => (
    quests
      .map((quest, index) => ({ quest, index }))
      .sort((left, right) => {
        const statusDiff = STATUS_ORDER[left.quest.status] - STATUS_ORDER[right.quest.status];
        if (statusDiff !== 0) return statusDiff;
        return left.index - right.index;
      })
      .map((item) => item.quest)
  ), [quests]);

  const summary = useMemo(() => {
    const total = quests.length;
    const completed = quests.filter((quest) => quest.status === 'completed').length;
    const skipped = quests.filter((quest) => quest.status === 'skipped').length;
    const remaining = quests.filter((quest) => quest.status === 'pending').length;
    const progress = total > 0 ? completed / total : 0;
    return {
      completed,
      progress,
      remaining,
      skipped,
      total,
    };
  }, [quests]);

  const isMutating = processingQuestId !== null;

  const openCreateForm = () => {
    setNotice(null);
    setFormState({ mode: 'create', quest: null, visible: true });
  };

  const openEditForm = (quest: Quest) => {
    setNotice(null);
    setFormState({ mode: 'edit', quest, visible: true });
  };

  const closeForm = () => {
    if (isMutating) return;
    setFormState((current) => ({ ...current, visible: false }));
  };

  const handleFormSubmit = async (input: CreateQuestInput | UpdateQuestInput) => {
    if (formState.mode === 'create') {
      await createQuest(input as CreateQuestInput);
      setNotice('새 퀘스트 메모를 보드에 붙였어요.');
    } else if (formState.quest) {
      await updateQuest(formState.quest.id, input as UpdateQuestInput);
      setNotice('퀘스트 메모를 고쳤어요.');
    }
    setFormState({ mode: 'create', quest: null, visible: false });
  };

  const confirmDeleteQuest = (quest: Quest) => {
    Alert.alert(
      '이 퀘스트 메모를 없앨까요?',
      '삭제한 퀘스트는 다시 되돌릴 수 없어요.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteQuest(quest.id);
              setNotice('퀘스트 메모를 보드에서 떼어냈어요.');
            } catch (deleteError) {
              Alert.alert('삭제할 수 없어요', deleteError instanceof Error ? deleteError.message : '잠시 후 다시 시도해 주세요.');
            }
          },
        },
      ],
    );
  };

  const confirmSkipQuest = (quest: Quest) => {
    Alert.alert(
      '오늘은 이 퀘스트를 쉬어갈까요?',
      '이번에는 다시 진행 전 상태로 돌릴 수 없어요.',
      [
        { text: '계속하기', style: 'cancel' },
        {
          text: '쉬어가기',
          onPress: async () => {
            try {
              await skipQuest(quest.id);
              setNotice('오늘은 이 퀘스트를 쉬어가기로 했어요.');
            } catch (skipError) {
              Alert.alert('건너뛸 수 없어요', skipError instanceof Error ? skipError.message : '잠시 후 다시 시도해 주세요.');
            }
          },
        },
      ],
    );
  };

  const handleCompleteCustomQuest = async (quest: Quest) => {
    if (quest.category !== 'custom') return;
    try {
      await completeQuest(quest.id);
      setNotice(getCompletionMessage(quest));
    } catch (completeError) {
      Alert.alert('완료할 수 없어요', completeError instanceof Error ? completeError.message : '잠시 후 다시 시도해 주세요.');
    }
  };

  const handleStartActivityQuest = (quest: Quest) => {
    if (quest.category === 'custom') {
      void handleCompleteCustomQuest(quest);
      return;
    }
    Alert.alert(
      '활동 연결 준비 중이에요',
      getCompletionMessage(quest),
      [{ text: '확인' }],
    );
  };

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/' as Href);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View pointerEvents="none" style={styles.wallTilePattern}>
        {Array.from({ length: 42 }).map((_, index) => (
          <View key={index} style={styles.wallTile} />
        ))}
      </View>
      <View pointerEvents="none" style={styles.skyBubbleOne} />
      <View pointerEvents="none" style={styles.skyBubbleTwo} />

      <View style={styles.header}>
        <Pressable
          accessibilityLabel="뒤로 가기"
          accessibilityRole="button"
          onPress={goBack}
          style={({ pressed }) => [styles.roundButton, pressed && styles.pressed]}
        >
          <Ionicons color="#4C3F38" name="chevron-back" size={22} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.headerKicker}>ROOM QUEST BOARD</Text>
          <Text style={styles.headerTitle}>오늘의 작은 퀘스트</Text>
          <Text style={styles.headerDate}>{formatToday()}</Text>
        </View>
        <Pressable
          accessibilityLabel="퀘스트 추가"
          accessibilityRole="button"
          disabled={isMutating}
          onPress={openCreateForm}
          style={({ pressed }) => [styles.addButton, pressed && styles.pressed, isMutating && styles.disabled]}
        >
          <Ionicons color="#FFF8EE" name="add" size={24} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={(
          <RefreshControl
            refreshing={isRefreshing}
            tintColor="#D48A9A"
            onRefresh={refresh}
          />
        )}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.boardPanel}>
          <View style={styles.pinLeft} />
          <View style={styles.pinRight} />
          <View style={styles.summaryPaper}>
            <View style={styles.summaryTape} />
            <Text style={styles.summaryKicker}>TODAY MEMO</Text>
            <Text style={styles.summaryTitle}>
              {summary.total === 0
                ? '오늘은 아직 붙인 메모가 없어요'
                : `오늘 ${summary.completed}개의 작은 행동을 완료했어요`}
            </Text>
            <Text style={styles.summaryMeta}>
              {summary.completed} / {summary.total} 완료 · 남은 메모 {summary.remaining}개
              {summary.skipped > 0 ? ` · 쉬어가기 ${summary.skipped}개` : ''}
            </Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.round(summary.progress * 100)}%` }]} />
            </View>
          </View>

          {notice ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => setNotice(null)}
              style={({ pressed }) => [styles.notice, pressed && styles.pressed]}
            >
              <Ionicons color="#8C6170" name="sparkles-outline" size={16} />
              <Text style={styles.noticeText}>{notice}</Text>
            </Pressable>
          ) : null}

          {error ? (
            <View style={styles.errorCard}>
              <Ionicons color="#A85B5B" name="alert-circle-outline" size={20} />
              <View style={styles.errorCopy}>
                <Text style={styles.errorTitle}>퀘스트 보드를 불러오지 못했어요</Text>
                <Text style={styles.errorText}>{error}</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={() => void reload()}
                style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
              >
                <Text style={styles.retryText}>다시</Text>
              </Pressable>
            </View>
          ) : null}

          {isLoading ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator color="#D48A9A" />
              <Text style={styles.loadingText}>오늘의 메모를 펼치는 중...</Text>
            </View>
          ) : null}

          {!isLoading && sortedQuests.length === 0 ? (
            <QuestEmptyState disabled={isMutating} onCreatePress={openCreateForm} />
          ) : null}

          {!isLoading ? sortedQuests.map((quest) => (
            <QuestCard
              key={quest.id}
              disabled={isMutating}
              isProcessing={processingQuestId === quest.id}
              quest={quest}
              onCompleteCustom={handleCompleteCustomQuest}
              onDelete={confirmDeleteQuest}
              onEdit={openEditForm}
              onSkip={confirmSkipQuest}
              onStartActivity={handleStartActivityQuest}
            />
          )) : null}
        </View>
      </ScrollView>

      <QuestFormModal
        isSubmitting={processingQuestId === 'create' || (formState.quest ? processingQuestId === formState.quest.id : false)}
        mode={formState.mode}
        onClose={closeForm}
        onSubmit={handleFormSubmit}
        quest={formState.quest}
        visible={formState.visible}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFF6F8',
  },
  wallTilePattern: {
    position: 'absolute',
    top: -32,
    left: -18,
    right: -18,
    height: 230,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    padding: 22,
    backgroundColor: '#FFD9E3',
    opacity: 0.92,
    transform: [{ rotate: '-1.5deg' }],
  },
  wallTile: {
    width: 32,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.52)',
    backgroundColor: 'rgba(255, 197, 212, 0.8)',
  },
  skyBubbleOne: {
    position: 'absolute',
    top: 132,
    right: 26,
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: 'rgba(198, 228, 246, 0.52)',
  },
  skyBubbleTwo: {
    position: 'absolute',
    bottom: 68,
    left: -28,
    width: 116,
    height: 116,
    borderRadius: 58,
    backgroundColor: 'rgba(246, 217, 170, 0.38)',
  },
  header: {
    minHeight: 88,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  roundButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 250, 242, 0.86)',
    shadowColor: '#8F6370',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  headerCopy: {
    flex: 1,
  },
  headerKicker: {
    color: '#A96578',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  headerTitle: {
    marginTop: 3,
    color: '#382F2B',
    fontSize: 23,
    fontWeight: '900',
  },
  headerDate: {
    marginTop: 3,
    color: '#7E6F63',
    fontSize: 12,
    fontWeight: '800',
  },
  addButton: {
    width: 46,
    height: 46,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D48A9A',
    shadowColor: '#8F6370',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.14,
    shadowRadius: 9,
    elevation: 4,
  },
  content: {
    width: '100%',
    maxWidth: 660,
    alignSelf: 'center',
    paddingHorizontal: 18,
    paddingBottom: 34,
  },
  boardPanel: {
    minHeight: 580,
    marginTop: 6,
    padding: 16,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#ECCDD7',
    backgroundColor: 'rgba(255, 237, 242, 0.92)',
    shadowColor: '#8E6471',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.14,
    shadowRadius: 22,
    elevation: 8,
  },
  pinLeft: {
    position: 'absolute',
    top: 13,
    left: 26,
    width: 15,
    height: 15,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#FFF8EA',
    backgroundColor: '#8FB8D8',
  },
  pinRight: {
    position: 'absolute',
    top: 13,
    right: 26,
    width: 15,
    height: 15,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#FFF8EA',
    backgroundColor: '#F6CA75',
  },
  summaryPaper: {
    paddingHorizontal: 17,
    paddingTop: 24,
    paddingBottom: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#EAD9BD',
    backgroundColor: '#FFF8E7',
  },
  summaryTape: {
    position: 'absolute',
    top: -10,
    alignSelf: 'center',
    width: 84,
    height: 23,
    borderRadius: 7,
    backgroundColor: 'rgba(198, 228, 246, 0.74)',
    transform: [{ rotate: '1.5deg' }],
  },
  summaryKicker: {
    color: '#BD8190',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  summaryTitle: {
    marginTop: 6,
    color: '#41342D',
    fontSize: 19,
    lineHeight: 25,
    fontWeight: '900',
  },
  summaryMeta: {
    marginTop: 7,
    color: '#806F62',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '800',
  },
  progressTrack: {
    height: 10,
    marginTop: 13,
    overflow: 'hidden',
    borderRadius: 999,
    backgroundColor: '#F0E2CE',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#D48A9A',
  },
  notice: {
    marginTop: 13,
    padding: 12,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#EBCBD4',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF4F7',
  },
  noticeText: {
    flex: 1,
    color: '#8C6170',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '800',
  },
  errorCard: {
    marginTop: 13,
    padding: 13,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F1C7C5',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFF0EF',
  },
  errorCopy: {
    flex: 1,
  },
  errorTitle: {
    color: '#8E4E4E',
    fontSize: 13,
    fontWeight: '900',
  },
  errorText: {
    marginTop: 3,
    color: '#A85B5B',
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '700',
  },
  retryButton: {
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: 999,
    justifyContent: 'center',
    backgroundColor: '#A85B5B',
  },
  retryText: {
    color: '#FFF8EF',
    fontSize: 11,
    fontWeight: '900',
  },
  loadingCard: {
    minHeight: 180,
    marginTop: 18,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 248, 231, 0.76)',
  },
  loadingText: {
    color: '#806F62',
    fontSize: 13,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.985 }],
  },
  disabled: {
    opacity: 0.52,
  },
});
