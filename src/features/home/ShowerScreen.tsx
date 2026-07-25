import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  AppState,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/features/auth/AuthProvider';
import { ACTIVITY_CATEGORY } from '@/features/activity/constants/activityCategory';
import { ActivityRewardModal } from '@/features/activity/rewards/components/ActivityRewardModal';
import { useActivityRewardModal } from '@/features/activity/rewards/hooks/useActivityRewardModal';
import { completeShowerActivity } from '@/features/activity/services/activityService';
import {
  getQuestRouteParam,
  isFromQuestRoute,
  linkCompletedActivityToQuest,
} from '@/features/quests/services/questActivityLinkService';
import {
  clearActiveShowerTimer,
  formatTimer,
  getDisplayShowerMinutes,
  getLocalDateKey,
  loadActiveShowerTimer,
  loadShowerDayRecord,
  markShowerRewardProcessed,
  saveActiveShowerTimer,
  saveShowerSession,
  SHOWER_DURATION_OPTIONS,
  type ShowerDayRecord,
  type ShowerDurationMinutes,
} from '@/features/home/showerMission';

const bathroomImage = require('../../../assets/bathroom-shower.png');

type ShowerPhase = 'idle' | 'running' | 'result';

type ShowerRouteParams = {
  questId?: string;
  fromQuest?: string;
};

export function ShowerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<ShowerRouteParams>();
  const { user } = useAuth();
  const [selectedMinutes, setSelectedMinutes] = useState<ShowerDurationMinutes>(10);
  const [phase, setPhase] = useState<ShowerPhase>('idle');
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [record, setRecord] = useState<ShowerDayRecord | null>(null);
  const [result, setResult] = useState<{
    selectedMinutes: ShowerDurationMinutes;
    actualSeconds: number;
  } | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [restoredTimer, setRestoredTimer] = useState<{
    selectedMinutes: ShowerDurationMinutes;
    startedAt: number;
  } | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const completingRef = useRef(false);
  const shouldReturnToQuestsRef = useRef(false);
  const wave = useRef(new Animated.Value(0)).current;
  const {
    rewardResult,
    rewardModalVisible,
    rewardCategoryId,
    showRewardResult,
    clearRewardResult,
  } = useActivityRewardModal();

  const selectedSeconds = selectedMinutes * 60;
  const remainingSeconds = Math.max(0, selectedSeconds - elapsedSeconds);
  const progress = Math.min(elapsedSeconds / selectedSeconds, 1);
  const targetReached = elapsedSeconds >= selectedSeconds;
  const todaySeconds = record?.totalSeconds ?? 0;
  const todayMinutes = todaySeconds > 0 ? getDisplayShowerMinutes(todaySeconds) : 0;
  const questId = getQuestRouteParam(params.questId);
  const fromQuest = isFromQuestRoute(params.fromQuest);

  useEffect(() => {
    let mounted = true;

    async function hydrate() {
      const [todayRecord, activeTimer] = await Promise.all([
        loadShowerDayRecord(),
        loadActiveShowerTimer(),
      ]);
      if (!mounted) return;
      setRecord(todayRecord);
      if (activeTimer) {
        setRestoredTimer(activeTimer);
        setShowRestoreConfirm(true);
      }
    }

    void hydrate();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (phase !== 'running' || startedAt === null) return undefined;

    const updateElapsed = () => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
    };
    updateElapsed();
    const timer = setInterval(updateElapsed, 1000);
    const subscription = AppState.addEventListener('change', updateElapsed);

    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, [phase, startedAt]);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(wave, {
          toValue: 1,
          duration: 1600,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(wave, {
          toValue: 0,
          duration: 1600,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [wave]);

  const startShower = async () => {
    if (phase === 'running') return;
    const nextStartedAt = Date.now();
    setStartedAt(nextStartedAt);
    setElapsedSeconds(0);
    setPhase('running');
    await saveActiveShowerTimer({
      date: getLocalDateKey(),
      selectedMinutes,
      startedAt: nextStartedAt,
    });
  };

  const completeShower = async () => {
    if (completingRef.current || startedAt === null) return;

    completingRef.current = true;
    setIsCompleting(true);
    const actualSeconds = Math.max(1, Math.floor((Date.now() - startedAt) / 1000));
    const actualMinutes = getDisplayShowerMinutes(actualSeconds);
    try {
      const nextRecord = await saveShowerSession(selectedMinutes, actualSeconds);
      setRecord(nextRecord);
      setResult({ selectedMinutes, actualSeconds });
      setPhase('result');
      setStartedAt(null);
      setElapsedSeconds(actualSeconds);
      setShowFinishConfirm(false);

      if (user?.uid) {
        const nextRewardResult = await completeShowerActivity(user.uid, {
          showerType: selectedMinutes <= 10 ? 'quick' : 'normal',
          selectedMinutes,
          actualSeconds,
          actualMinutes,
          targetMet: actualSeconds >= selectedMinutes * 60,
        });
        if (nextRewardResult) {
          try {
            await linkCompletedActivityToQuest({
              questId,
              activityId: nextRewardResult.activityId,
            });
          } catch (questLinkError) {
            if (typeof __DEV__ !== 'undefined' && __DEV__) {
              console.warn('Failed to link shower activity to quest.', questLinkError);
            }
            if (fromQuest) {
              Alert.alert(
                '샤워 기록은 저장됐어요',
                '다만 퀘스트 완료 표시를 갱신하지 못했어요. 퀘스트 화면에서 상태를 다시 확인해 주세요.',
              );
            }
          }
          const updatedRecord = await markShowerRewardProcessed();
          setRecord(updatedRecord);
          shouldReturnToQuestsRef.current = fromQuest;
          showRewardResult(ACTIVITY_CATEGORY.SHOWER, nextRewardResult);
        }
      }
    } catch (error) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('Failed to complete shower.', error);
      }
      Alert.alert('샤워 기록을 저장할 수 없어요', '잠시 후 다시 시도해 주세요.');
    } finally {
      completingRef.current = false;
      setIsCompleting(false);
    }
  };

  const handleBackPress = () => {
    if (phase === 'running') {
      setShowExitConfirm(true);
      return;
    }
    router.back();
  };

  const exitRunningTimer = async () => {
    await clearActiveShowerTimer();
    setShowExitConfirm(false);
    router.back();
  };

  const continueRestoredTimer = () => {
    if (!restoredTimer) return;
    setSelectedMinutes(restoredTimer.selectedMinutes);
    setStartedAt(restoredTimer.startedAt);
    setElapsedSeconds(Math.max(0, Math.floor((Date.now() - restoredTimer.startedAt) / 1000)));
    setPhase('running');
    setShowRestoreConfirm(false);
    setRestoredTimer(null);
  };

  const discardRestoredTimer = async () => {
    await clearActiveShowerTimer();
    setShowRestoreConfirm(false);
    setRestoredTimer(null);
  };

  const closeResult = () => {
    setResult(null);
    setPhase('idle');
  };

  const confirmReward = () => {
    clearRewardResult();
    if (shouldReturnToQuestsRef.current) {
      shouldReturnToQuestsRef.current = false;
      router.replace('/quests' as Href);
    }
  };

  const resultSeconds = result?.actualSeconds ?? elapsedSeconds;
  const resultMinutes = getDisplayShowerMinutes(resultSeconds);
  const resultProgress = result
    ? Math.min(result.actualSeconds / (result.selectedMinutes * 60), 1)
    : progress;

  return (
    <View style={styles.container}>
      <Image contentFit="cover" source={bathroomImage} style={StyleSheet.absoluteFill} />
      <View pointerEvents="none" style={styles.warmOverlay} />

      <SafeAreaView style={styles.safe}>
        <View style={styles.topBar}>
          <Pressable
            accessibilityLabel="홈 방으로 돌아가기"
            accessibilityRole="button"
            onPress={handleBackPress}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          >
            <Ionicons color="#51473D" name="chevron-back" size={21} />
          </Pressable>
        </View>

        <View style={styles.content}>
          {record ? (
            <View pointerEvents="none" style={styles.todayCard}>
              <Text style={styles.todayLabel}>오늘의 샤워 기록</Text>
              <Text style={styles.todayValue}>
                {todaySeconds > 0 ? `${todayMinutes}분` : '아직 샤워 기록이 없어요'}
              </Text>
              <View style={styles.smallDrop}>
                <View style={[styles.smallDropFill, { height: `${Math.min(todaySeconds / 1800, 1) * 100}%` }]} />
              </View>
            </View>
          ) : null}

          <View style={styles.bottomCard}>
            {phase === 'running' ? (
              <>
                <Text style={styles.cardTitle}>
                  {targetReached ? '목표한 샤워 시간을 채웠어요! ✨' : '샤워 중이에요 🚿'}
                </Text>
                <Text style={styles.cardDescription}>
                  {targetReached ? '이제 상쾌하게 마무리해볼까요?' : '남은 시간을 확인하며 천천히 마무리해요.'}
                </Text>
                <View style={styles.timerRow}>
                  <WaterGauge progress={progress} wave={wave} />
                  <View style={styles.timerCopy}>
                    <Text style={styles.timerText}>{formatTimer(remainingSeconds)}</Text>
                    <Text style={styles.timerLabel}>남은 시간</Text>
                    <Text style={styles.metaText}>목표 시간 {selectedMinutes}분</Text>
                    <Text style={styles.metaText}>현재 샤워 시간 {getDisplayShowerMinutes(elapsedSeconds)}분</Text>
                  </View>
                </View>
                <Pressable
                  accessibilityRole="button"
                  disabled={isCompleting}
                  onPress={() => setShowFinishConfirm(true)}
                  style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
                >
                  <Text style={styles.primaryButtonText}>종료하기</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.cardTitle}>개운하게 샤워해볼까요?</Text>
                <Text style={styles.cardDescription}>샤워할 시간을 선택해 주세요.</Text>
                <View style={styles.durationRow}>
                  {SHOWER_DURATION_OPTIONS.map((minutes) => {
                    const selected = minutes === selectedMinutes;
                    return (
                      <Pressable
                        key={minutes}
                        accessibilityRole="button"
                        onPress={() => setSelectedMinutes(minutes)}
                        style={({ pressed }) => [
                          styles.durationButton,
                          selected && styles.durationButtonSelected,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text style={[styles.durationText, selected && styles.durationTextSelected]}>
                          {minutes}분
                        </Text>
                        {selected ? <Ionicons color="#4F7E74" name="checkmark-circle" size={14} /> : null}
                      </Pressable>
                    );
                  })}
                </View>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => void startShower()}
                  style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
                >
                  <Text style={styles.primaryButtonText}>샤워하기</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </SafeAreaView>

      <ResultModal
        onClose={closeResult}
        progress={resultProgress}
        result={result}
        visible={phase === 'result' && result !== null}
        wave={wave}
      />

      <ConfirmModal
        cancelLabel="계속하기"
        confirmLabel="종료하기"
        description={`현재까지 ${getDisplayShowerMinutes(elapsedSeconds)}분 동안 샤워했어요.`}
        onCancel={() => setShowFinishConfirm(false)}
        onConfirm={() => void completeShower()}
        title="샤워를 마칠까요?"
        visible={showFinishConfirm}
      />

      <ConfirmModal
        cancelLabel="계속하기"
        confirmLabel="종료하고 나가기"
        description="종료하면 진행 중인 타이머는 기록되지 않아요."
        onCancel={() => setShowExitConfirm(false)}
        onConfirm={() => void exitRunningTimer()}
        title="샤워 타이머가 실행 중이에요."
        visible={showExitConfirm}
      />

      <ConfirmModal
        cancelLabel="새로 시작하기"
        confirmLabel="이어서 기록하기"
        description="진행 중이던 샤워 타이머가 있어요."
        onCancel={() => void discardRestoredTimer()}
        onConfirm={continueRestoredTimer}
        title="이어서 기록할까요?"
        visible={showRestoreConfirm}
      />

      <ActivityRewardModal
        categoryId={rewardCategoryId ?? ACTIVITY_CATEGORY.SHOWER}
        onConfirm={confirmReward}
        result={rewardResult}
        visible={rewardModalVisible}
      />
    </View>
  );
}

function WaterGauge({
  progress,
  wave,
}: {
  progress: number;
  wave: Animated.Value;
}) {
  const fillHeight = `${Math.min(progress, 1) * 100}%` as `${number}%`;
  return (
    <View style={styles.gauge}>
      <Animated.View
        style={[
          styles.gaugeWave,
          {
            height: fillHeight,
            transform: [{ translateY: wave.interpolate({ inputRange: [0, 1], outputRange: [2, -2] }) }],
          },
        ]}
      />
      <Ionicons color="#4E7F88" name="water" size={34} />
    </View>
  );
}

function ResultModal({
  visible,
  result,
  progress,
  wave,
  onClose,
}: {
  visible: boolean;
  result: { selectedMinutes: ShowerDurationMinutes; actualSeconds: number } | null;
  progress: number;
  wave: Animated.Value;
  onClose: () => void;
}) {
  if (!result) return null;
  const minutes = getDisplayShowerMinutes(result.actualSeconds);
  const percent = Math.round(Math.min(result.actualSeconds / (result.selectedMinutes * 60), 1) * 100);
  const metTarget = result.actualSeconds >= result.selectedMinutes * 60;

  return (
    <Modal animationType="fade" transparent visible={visible}>
      <View style={styles.modalBackdrop}>
        <View style={styles.resultCard}>
          <View style={styles.resultIcon}>
            <WaterGauge progress={progress} wave={wave} />
          </View>
          <Text style={styles.resultKicker}>오늘 샤워 시간</Text>
          <Text style={styles.resultTitle}>{minutes}분!</Text>
          <Text style={styles.resultDescription}>
            {metTarget ? '목표 시간을 모두 채웠어요. ✨' : '몸도 마음도 개운해졌어요.'}
          </Text>
          <Text style={styles.resultMeta}>
            목표 {result.selectedMinutes}분 중 {percent}% 완료
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
          >
            <Text style={styles.primaryButtonText}>확인</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function ConfirmModal({
  visible,
  title,
  description,
  cancelLabel,
  confirmLabel,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  title: string;
  description: string;
  cancelLabel: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal animationType="fade" onRequestClose={onCancel} transparent visible={visible}>
      <View style={styles.modalBackdrop}>
        <View style={styles.confirmCard}>
          <Text style={styles.confirmTitle}>{title}</Text>
          <Text style={styles.confirmDescription}>{description}</Text>
          <View style={styles.confirmActions}>
            <Pressable
              accessibilityRole="button"
              onPress={onCancel}
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
            >
              <Text style={styles.secondaryButtonText}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={onConfirm}
              style={({ pressed }) => [styles.primaryButton, styles.confirmPrimary, pressed && styles.pressed]}
            >
              <Text style={styles.primaryButtonText}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EDE2D4' },
  warmOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255, 244, 224, 0.14)' },
  safe: { flex: 1 },
  topBar: { paddingHorizontal: 16, paddingTop: 4 },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 250, 241, 0.78)',
  },
  content: { flex: 1, justifyContent: 'space-between', paddingHorizontal: 18, paddingBottom: 18 },
  todayCard: {
    alignSelf: 'flex-end',
    maxWidth: 210,
    marginTop: 10,
    padding: 13,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 250, 242, 0.76)',
    borderWidth: 1,
    borderColor: 'rgba(235, 220, 199, 0.86)',
  },
  todayLabel: { color: '#746656', fontSize: 11, fontWeight: '900' },
  todayValue: { marginTop: 4, color: '#3E554F', fontSize: 15, fontWeight: '900' },
  smallDrop: {
    position: 'absolute',
    right: 11,
    top: 12,
    width: 16,
    height: 23,
    overflow: 'hidden',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#9CC8C2',
    justifyContent: 'flex-end',
  },
  smallDropFill: { backgroundColor: '#9ED8D1' },
  bottomCard: {
    padding: 18,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 250, 242, 0.82)',
    borderWidth: 1,
    borderColor: 'rgba(236, 222, 203, 0.95)',
    shadowColor: '#3A2E22',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 12,
  },
  cardTitle: { color: '#332B24', fontSize: 21, fontWeight: '900' },
  cardDescription: { marginTop: 6, color: '#746657', fontSize: 12, lineHeight: 18, fontWeight: '700' },
  durationRow: { marginTop: 16, flexDirection: 'row', gap: 8 },
  durationButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D8CBB9',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.52)',
  },
  durationButtonSelected: { borderColor: '#78AAA0', backgroundColor: '#D8EFEA' },
  durationText: { color: '#6A5D50', fontSize: 13, fontWeight: '900' },
  durationTextSelected: { color: '#426E66' },
  primaryButton: {
    minHeight: 50,
    marginTop: 16,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#69A79D',
  },
  primaryButtonText: { color: '#FFFDF7', fontSize: 14, fontWeight: '900' },
  timerRow: { marginTop: 15, flexDirection: 'row', alignItems: 'center', gap: 15 },
  timerCopy: { flex: 1 },
  timerText: { color: '#263F45', fontSize: 38, fontWeight: '900', fontVariant: ['tabular-nums'] },
  timerLabel: { color: '#60706E', fontSize: 11, fontWeight: '900' },
  metaText: { marginTop: 5, color: '#746657', fontSize: 11, fontWeight: '800' },
  gauge: {
    width: 88,
    height: 108,
    borderTopLeftRadius: 48,
    borderTopRightRadius: 48,
    borderBottomLeftRadius: 48,
    borderBottomRightRadius: 18,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#9CC8C2',
    backgroundColor: 'rgba(250, 255, 253, 0.75)',
    transform: [{ rotate: '-45deg' }],
  },
  gaugeWave: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#9ED8D1',
  },
  modalBackdrop: {
    flex: 1,
    padding: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(43, 34, 25, 0.38)',
  },
  confirmCard: {
    width: '100%',
    maxWidth: 390,
    padding: 20,
    borderRadius: 24,
    backgroundColor: '#FFF9EF',
  },
  confirmTitle: { color: '#332B24', fontSize: 20, fontWeight: '900' },
  confirmDescription: { marginTop: 10, color: '#756657', fontSize: 13, lineHeight: 20, fontWeight: '700' },
  confirmActions: { marginTop: 18, flexDirection: 'row', gap: 10 },
  secondaryButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D7C9B7',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFDF8',
  },
  secondaryButtonText: { color: '#635548', fontSize: 13, fontWeight: '900' },
  confirmPrimary: { flex: 1, marginTop: 0 },
  resultCard: {
    width: '100%',
    maxWidth: 380,
    padding: 22,
    borderRadius: 28,
    alignItems: 'center',
    backgroundColor: '#FFF9EF',
  },
  resultIcon: { marginBottom: 8, transform: [{ scale: 0.78 }] },
  resultKicker: { color: '#6F806D', fontSize: 12, fontWeight: '900' },
  resultTitle: { marginTop: 4, color: '#2F3F45', fontSize: 34, fontWeight: '900' },
  resultDescription: { marginTop: 8, color: '#63584C', fontSize: 13, fontWeight: '800', textAlign: 'center' },
  resultMeta: { marginTop: 9, color: '#748B86', fontSize: 12, fontWeight: '900' },
  pressed: { opacity: 0.86, transform: [{ scale: 0.985 }] },
});
