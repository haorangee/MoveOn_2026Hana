import { Ionicons } from '@expo/vector-icons';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, Easing, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ACTIVITY_CATEGORY } from '@/features/activity/constants/activityCategory';
import { ActivityRewardModal } from '@/features/activity/rewards/components/ActivityRewardModal';
import { useActivityRewardModal } from '@/features/activity/rewards/hooks/useActivityRewardModal';
import type { ProcessActivityRewardResult } from '@/features/activity/rewards/types/reward';
import { completeStudyActivity, startStudyActivity } from '@/features/activity/services/activityService';
import {
  createStudyBookFromResult,
  formatStudyTime,
  getStudyCategory,
  useStudyBooks,
} from '@/features/home/studyBooks';
import {
  getQuestRouteParam,
  isFromQuestRoute,
  linkCompletedActivityToQuest,
} from '@/features/quests/services/questActivityLinkService';
import { ensureAnonymousUser } from '@/shared/backend/authRepository';

type BookshelfParams = {
  startedAt?: string;
  endedAt?: string;
  elapsedSeconds?: string;
  targetDurationSeconds?: string;
  categoryId?: string;
  categoryLabel?: string;
  completedPages?: string;
  currentPageProgress?: string;
  questId?: string;
  fromQuest?: string;
};

export function BookshelfRecordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<BookshelfParams>();
  const {
    books,
    categorySummaries,
    totalMinutes,
    addBookOnce,
  } = useStudyBooks();
  const [isPlacing, setIsPlacing] = useState(false);
  const [placedBookId, setPlacedBookId] = useState<string | null>(null);
  const hasPlacedRef = useRef(false);
  const shouldReturnToQuestsRef = useRef(false);
  const settle = useRef(new Animated.Value(0)).current;
  const placeProgress = useRef(new Animated.Value(0)).current;
  const newBook = useMemo(() => createStudyBookFromResult(params), [params]);
  const newBookCategory = newBook ? getStudyCategory(newBook.categoryId) : null;
  const showNewBook = newBook !== null && placedBookId !== newBook.id;
  const sortedCategorySummaries = useMemo(() => (
    categorySummaries
      .map((category, originalIndex) => ({ category, originalIndex }))
      .sort((a, b) => (
        (b.category.minutes - a.category.minutes)
        || (a.originalIndex - b.originalIndex)
      ))
      .map(({ category }) => category)
  ), [categorySummaries]);
  const totalBookCount = categorySummaries.reduce(
    (total, category) => total + category.books.length,
    0,
  );
  const showEmptyPrompt = totalBookCount === 0 && !showNewBook;
  const questId = getQuestRouteParam(params.questId);
  const fromQuest = isFromQuestRoute(params.fromQuest);
  const {
    rewardResult,
    rewardModalVisible,
    rewardCategoryId,
    showRewardResult,
    clearRewardResult,
  } = useActivityRewardModal();

  useEffect(() => {
    const animation = Animated.sequence([
      Animated.timing(settle, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.quad),
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.spring(settle, {
        toValue: 0,
        damping: 13,
        stiffness: 120,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [settle]);

  const handlePlaceBook = async () => {
    if (!newBook || hasPlacedRef.current) return;

    hasPlacedRef.current = true;
    setIsPlacing(true);
    placeProgress.setValue(0);

    let nextRewardResult: ProcessActivityRewardResult | null = null;
    const alreadyHadBook = books.some((book) => book.id === newBook.id);

    try {
      await addBookOnce(newBook);
      if (!alreadyHadBook) {
        const user = await ensureAnonymousUser();
        const plannedMinutes = Math.max(1, Math.round(Number(params.targetDurationSeconds ?? 0) / 60));
        const actualMinutes = newBook.minutes;
        const activity = await startStudyActivity(user.uid, {
          subject: newBook.title,
          plannedMinutes: Number.isFinite(plannedMinutes) ? plannedMinutes : null,
          bookId: newBook.id ?? null,
        });

        nextRewardResult = await completeStudyActivity(
          user.uid,
          activity.activityId,
          {
            subject: newBook.title,
            plannedMinutes: Number.isFinite(plannedMinutes) ? plannedMinutes : null,
            actualMinutes,
            bookId: newBook.id ?? null,
          },
          actualMinutes,
        );

        if (!nextRewardResult) {
          throw new Error('Study activity reward result is empty.');
        }

        try {
          await linkCompletedActivityToQuest({
            questId,
            activityId: nextRewardResult.activityId,
          });
        } catch (questLinkError) {
          if (typeof __DEV__ !== 'undefined' && __DEV__) {
            console.warn('Failed to link study activity to quest.', questLinkError);
          }
          if (fromQuest) {
            Alert.alert(
              '공부 기록은 저장됐어요',
              '다만 퀘스트 완료 표시를 갱신하지 못했어요. 퀘스트 화면에서 상태를 다시 확인해 주세요.',
            );
          }
        }
      }
    } catch {
      setIsPlacing(false);
      hasPlacedRef.current = false;
      return;
    }

    Animated.timing(placeProgress, {
      toValue: 1,
      duration: 680,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    }).start(({ finished }) => {
      setIsPlacing(false);
      if (finished) {
        setPlacedBookId(newBook.id ?? null);
        if (nextRewardResult && !nextRewardResult.alreadyProcessed) {
          shouldReturnToQuestsRef.current = fromQuest;
          showRewardResult(ACTIVITY_CATEGORY.STUDY, nextRewardResult);
        } else if (fromQuest) {
          router.replace('/quests' as Href);
        }
        return;
      }
      hasPlacedRef.current = false;
    });
  };

  const confirmReward = () => {
    clearRewardResult();
    if (shouldReturnToQuestsRef.current) {
      shouldReturnToQuestsRef.current = false;
      router.replace('/quests' as Href);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable
            accessibilityLabel="내 방으로 돌아가기"
            accessibilityRole="button"
            onPress={() => router.back()}
            style={({ pressed }) => [styles.back, pressed && styles.pressed]}
          >
            <Ionicons name="arrow-back" size={21} color="#4A4035" />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>MY BOOKSHELF</Text>
            <Text style={styles.title}>나의 공부가 쌓인 책장</Text>
          </View>
        </View>

        {showNewBook && newBook ? (
          <View style={styles.newBookCard}>
            <View style={styles.newBookCopy}>
              <Text style={styles.newBookEyebrow}>NEW BOOK</Text>
              <Text style={styles.newBookTitle}>{newBook.title}</Text>
              <Text style={styles.newBookMeta}>
                {newBookCategory?.label} · {formatStudyTime(newBook.minutes)}
              </Text>
            </View>
            <Animated.View
              style={[
                styles.newBookPreview,
                {
                  backgroundColor: newBookCategory?.color ?? '#6288A8',
                  transform: [
                    {
                      translateY: placeProgress.interpolate({
                        inputRange: [0, 0.45, 1],
                        outputRange: [0, -22, 92],
                      }),
                    },
                    {
                      translateX: placeProgress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -76],
                      }),
                    },
                    {
                      scale: placeProgress.interpolate({
                        inputRange: [0, 0.65, 1],
                        outputRange: [1, 0.82, 0.45],
                      }),
                    },
                  ],
                  opacity: placeProgress.interpolate({
                    inputRange: [0, 0.95, 1],
                    outputRange: [1, 1, 0],
                  }),
                },
              ]}
            >
              <View style={styles.bookRule} />
              <Text numberOfLines={1} style={styles.newBookSpineText}>{newBook.title}</Text>
            </Animated.View>
            <Pressable
              accessibilityRole="button"
              disabled={isPlacing}
              onPress={() => void handlePlaceBook()}
              style={({ pressed }) => [
                styles.placeButton,
                isPlacing && styles.disabled,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.placeButtonText}>{isPlacing ? '꽂는 중' : '책장에 꽂기'}</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>누적 공부 시간</Text>
          <Text style={styles.totalValue}>{formatStudyTime(totalMinutes)}</Text>
          <Text style={styles.totalHint}>책의 색은 주제, 두께와 높이는 공부 시간이 쌓인 정도를 보여줘요.</Text>
        </View>

        {showEmptyPrompt ? (
          <View style={styles.emptyPrompt}>
            <View style={styles.emptyIcon}>
              <Ionicons name="book-outline" size={24} color="#7B6B59" />
            </View>
            <View style={styles.emptyCopy}>
              <Text style={styles.emptyTitle}>아직 꽂힌 책이 없어요</Text>
              <Text style={styles.emptyText}>
                공부를 완료하면 새 책이 만들어지고, 이 책장에 차곡차곡 쌓여요.
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="공부하러 책상으로 이동"
              onPress={() => router.push('/study-desk')}
              style={({ pressed }) => [styles.studyButton, pressed && styles.pressed]}
            >
              <Text style={styles.studyButtonText}>공부해서 새 책 만들기</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFF9EF" />
            </Pressable>
          </View>
        ) : null}

        <Animated.View
          style={[
            styles.shelfCase,
            {
              transform: [{
                scale: settle.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.025],
                }),
              }],
            },
          ]}
        >
          {sortedCategorySummaries.map((category) => (
            <View key={category.id} style={styles.shelfSection}>
              <View style={styles.shelfLabelRow}>
                <View style={[styles.legendDot, { backgroundColor: category.color }]} />
                <Text style={styles.categoryLabel}>{category.label}</Text>
                <Text style={styles.categoryTime}>{formatStudyTime(category.minutes)}</Text>
              </View>
              <View style={styles.bookRow}>
                {category.books.map((book, index) => (
                  <View
                    key={book.id}
                    style={[
                      styles.book,
                      {
                        width: 20 + ((book.minutes + index * 11) % 11),
                        height: 70 + Math.min(24, book.minutes / 5) + (index % 3) * 5,
                        backgroundColor: index % 2 === 0 ? category.color : category.colorDark,
                      },
                    ]}
                  >
                    <View style={styles.bookRule} />
                    <Text numberOfLines={1} style={styles.bookText}>{book.title}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.woodShelf} />
            </View>
          ))}
        </Animated.View>

        <View style={styles.insight}>
          <Ionicons name="sparkles-outline" size={18} color="#7C7753" />
          <Text style={styles.insightText}>
            최근 공부가 쌓이면 홈 방 책장과 이 상세 책장에 같은 책으로 반영돼요.
          </Text>
        </View>
      </ScrollView>
      <ActivityRewardModal
        categoryId={rewardCategoryId ?? ACTIVITY_CATEGORY.STUDY}
        onConfirm={confirmReward}
        result={rewardResult}
        visible={rewardModalVisible}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5EFE5' },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  back: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF9EF',
    borderWidth: 1,
    borderColor: '#E3D7C6',
  },
  pressed: { opacity: 0.75, transform: [{ scale: 0.96 }] },
  headerCopy: { flex: 1 },
  eyebrow: { color: '#94806B', fontSize: 10, fontWeight: '800', letterSpacing: 1.1 },
  title: { marginTop: 3, color: '#392F27', fontSize: 21, fontWeight: '900' },
  newBookCard: {
    marginTop: 22,
    minHeight: 142,
    padding: 18,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#FFF9EF',
    borderWidth: 1,
    borderColor: '#E8DDCD',
  },
  newBookCopy: { paddingRight: 116 },
  newBookEyebrow: { color: '#9A7A57', fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
  newBookTitle: { marginTop: 5, color: '#392F27', fontSize: 22, fontWeight: '900' },
  newBookMeta: { marginTop: 6, color: '#8C7967', fontSize: 12, fontWeight: '700' },
  newBookPreview: {
    position: 'absolute',
    top: 21,
    right: 34,
    width: 42,
    height: 92,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(48, 37, 29, 0.28)',
    alignItems: 'center',
  },
  newBookSpineText: {
    marginTop: 'auto',
    marginBottom: 10,
    width: 78,
    color: 'rgba(255, 249, 235, 0.88)',
    fontSize: 9,
    fontWeight: '900',
    transform: [{ rotate: '-90deg' }],
  },
  placeButton: {
    alignSelf: 'flex-start',
    minHeight: 40,
    marginTop: 18,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#655646',
  },
  placeButtonText: { color: '#FFF9EF', fontSize: 12, fontWeight: '900' },
  totalCard: {
    marginTop: 22,
    padding: 20,
    borderRadius: 22,
    backgroundColor: '#FFF9EF',
    borderWidth: 1,
    borderColor: '#E8DDCD',
  },
  totalLabel: { color: '#8C7967', fontSize: 12, fontWeight: '700' },
  totalValue: { marginTop: 5, color: '#3D332A', fontSize: 29, fontWeight: '900' },
  totalHint: { marginTop: 7, color: '#8D8174', fontSize: 11, lineHeight: 17 },
  emptyPrompt: {
    marginTop: 16,
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E8DDCD',
    backgroundColor: '#FFF9EF',
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFE3CF',
  },
  emptyCopy: {
    marginTop: 13,
  },
  emptyTitle: {
    color: '#392F27',
    fontSize: 17,
    fontWeight: '900',
  },
  emptyText: {
    marginTop: 7,
    color: '#8D8174',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
  },
  studyButton: {
    minHeight: 44,
    marginTop: 16,
    paddingHorizontal: 16,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: '#655646',
  },
  studyButtonText: {
    color: '#FFF9EF',
    fontSize: 12,
    fontWeight: '900',
  },
  shelfCase: {
    marginTop: 20,
    paddingHorizontal: 16,
    paddingTop: 17,
    paddingBottom: 22,
    borderRadius: 14,
    backgroundColor: '#876448',
    borderWidth: 5,
    borderColor: '#65472F',
    shadowColor: '#3C2B1E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 6,
  },
  shelfSection: { marginBottom: 14 },
  shelfLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 7 },
  legendDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  categoryLabel: { color: '#FFF4E3', fontSize: 11, fontWeight: '800' },
  categoryTime: { marginLeft: 'auto', color: '#E2CDB6', fontSize: 9, fontWeight: '700' },
  bookRow: {
    height: 102,
    paddingHorizontal: 6,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    overflow: 'hidden',
    backgroundColor: '#6C4D36',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  book: {
    minWidth: 20,
    paddingVertical: 7,
    alignItems: 'center',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    borderWidth: 1,
    borderColor: 'rgba(48, 37, 29, 0.28)',
  },
  bookRule: { width: '78%', height: 2, marginTop: 7, backgroundColor: 'rgba(255, 241, 217, 0.55)' },
  bookText: {
    marginTop: 'auto',
    color: 'rgba(255, 249, 235, 0.82)',
    fontSize: 7,
    fontWeight: '800',
    transform: [{ rotate: '-90deg' }],
  },
  woodShelf: {
    height: 8,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    backgroundColor: '#B48964',
    borderBottomWidth: 2,
    borderBottomColor: '#523822',
  },
  insight: {
    marginTop: 20,
    padding: 16,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#EBE7D4',
  },
  insightText: { flex: 1, color: '#646047', fontSize: 12, lineHeight: 19, fontWeight: '600' },
  disabled: { opacity: 0.62 },
});
