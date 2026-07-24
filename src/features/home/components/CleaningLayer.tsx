import { Image } from 'expo-image';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  consumeCleaningVerificationPending,
  DAILY_CLEANING_GOAL,
  useCleaningMission,
  type CleaningMissionState,
} from '@/features/home/cleaningMission';

const messyFloorImage = require('../../../../assets/messy-floor-layer-anime.png');
const broomImage = require('../../../../assets/broom-cleaning.png');

type CleaningLayerProps = {
  disabled?: boolean;
  onMissionStateChange?: (state: CleaningMissionState) => void;
  onStartPhotoVerification?: () => void;
};

const cleaningIndexes = Array.from({ length: DAILY_CLEANING_GOAL }, (_, index) => index);

function getCleaningDescription(cleaningCount: number) {
  if (cleaningCount === 0) {
    return '바닥에 먼지가 쌓였어요. 첫 번째 청소로 깨끗하게 만들어볼까요?';
  }
  if (cleaningCount >= DAILY_CLEANING_GOAL) {
    return '오늘의 청소를 모두 완료했어요!';
  }
  return '바닥이 깨끗해도 가볍게 한 번 더 정리할 수 있어요.';
}

function getCleaningFeedback(cleaningCount: number) {
  if (cleaningCount === 1) return '바닥이 깨끗해졌어요!';
  if (cleaningCount === 2) return '한 번 더 깔끔하게 정리했어요!';
  return '오늘의 청소 미션을 모두 완료했어요! ✨';
}

export function CleaningLayer({
  disabled = false,
  onMissionStateChange,
  onStartPhotoVerification,
}: CleaningLayerProps) {
  const {
    state,
    isHydrated,
    isRecording,
    record,
  } = useCleaningMission({ onChange: onMissionStateChange });
  const [showConfirm, setShowConfirm] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const floorOpacity = useRef(new Animated.Value(1)).current;
  const broomSweep = useRef(new Animated.Value(0)).current;
  const dustSparkle = useRef(new Animated.Value(0)).current;
  const iconBounceValues = useRef(
    cleaningIndexes.map(() => new Animated.Value(1)),
  ).current;
  const previousCleaningCount = useRef(state.cleaningCount);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingVerificationHandled = useRef(false);

  const isFloorMessy = state.cleaningCount === 0;
  const canClean = state.cleaningCount < DAILY_CLEANING_GOAL;
  const canPressBroom = isHydrated && !disabled && !isCleaning;
  const canPressCleanButton = canPressBroom && canClean && !isRecording;

  useEffect(() => {
    floorOpacity.setValue(isFloorMessy ? 1 : 0);
  }, [floorOpacity, isFloorMessy]);

  useEffect(() => {
    if (!isFloorMessy || isCleaning) return undefined;

    const idleSweep = Animated.loop(
      Animated.sequence([
        Animated.delay(1800),
        Animated.timing(broomSweep, {
          toValue: 1,
          duration: 720,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(broomSweep, {
          toValue: 0,
          duration: 720,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]),
    );

    idleSweep.start();
    return () => idleSweep.stop();
  }, [broomSweep, isCleaning, isFloorMessy]);

  useEffect(() => {
    const filledIndex = state.cleaningCount - 1;
    if (state.cleaningCount > previousCleaningCount.current && filledIndex >= 0) {
      Animated.sequence([
        Animated.timing(iconBounceValues[filledIndex], {
          toValue: 1.18,
          duration: 120,
          easing: Easing.out(Easing.quad),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.spring(iconBounceValues[filledIndex], {
          toValue: 1,
          damping: 7,
          stiffness: 180,
          mass: 0.7,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();
    }

    previousCleaningCount.current = state.cleaningCount;
  }, [iconBounceValues, state.cleaningCount]);

  useEffect(() => () => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
  }, []);

  const dustStyle = useMemo(() => ({
    opacity: dustSparkle.interpolate({
      inputRange: [0, 0.18, 0.75, 1],
      outputRange: [0, 1, 0.9, 0],
    }),
    transform: [
      {
        scale: dustSparkle.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0.6, 1.08, 1.18],
        }),
      },
    ],
  }), [dustSparkle]);

  const runCleaningAnimation = async () => {
    if (isCleaning || isRecording || state.cleaningCount >= DAILY_CLEANING_GOAL) return;

    setShowConfirm(false);
    setIsCleaning(true);
    setFeedback(null);
    broomSweep.setValue(0);
    dustSparkle.setValue(0);

    const shouldFadeFloor = state.cleaningCount === 0;
    const sweepAnimation = Animated.sequence([
      Animated.timing(broomSweep, {
        toValue: 1,
        duration: 360,
        easing: Easing.out(Easing.quad),
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(broomSweep, {
        toValue: 0,
        duration: 340,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(broomSweep, {
        toValue: 1,
        duration: 360,
        easing: Easing.out(Easing.quad),
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(broomSweep, {
        toValue: 0,
        duration: 320,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]);

    const animations = [
      sweepAnimation,
      Animated.timing(dustSparkle, {
        toValue: 1,
        duration: 2100,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: Platform.OS !== 'web',
      }),
    ];

    if (shouldFadeFloor) {
      animations.push(
        Animated.timing(floorOpacity, {
          toValue: 0,
          duration: 900,
          delay: 1220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: Platform.OS !== 'web',
        }),
      );
    }

    Animated.parallel(animations).start(async ({ finished }) => {
      if (!finished) {
        setIsCleaning(false);
        return;
      }

      const nextState = await record();
      setIsCleaning(false);
      setFeedback(getCleaningFeedback(nextState.cleaningCount));
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
      feedbackTimer.current = setTimeout(() => setFeedback(null), 2200);
    });
  };

  useEffect(() => {
    if (!isHydrated || pendingVerificationHandled.current) return;

    pendingVerificationHandled.current = true;
    async function handlePendingVerification() {
      try {
        const hasPendingVerification = await consumeCleaningVerificationPending();
        if (hasPendingVerification) {
          await runCleaningAnimation();
        }
      } catch {
        pendingVerificationHandled.current = false;
      }
    }

    void handlePendingVerification();
  // runCleaningAnimation intentionally reads the latest state after hydration.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated]);

  const startPhotoVerification = () => {
    if (!canPressCleanButton) return;
    setShowConfirm(false);
    onStartPhotoVerification?.();
  };

  return (
    <>
      {isFloorMessy ? (
        <Animated.View
          pointerEvents="none"
          style={[styles.messyFloor, { opacity: floorOpacity }]}
        >
          <Image contentFit="contain" source={messyFloorImage} style={StyleSheet.absoluteFill} />
        </Animated.View>
      ) : null}

      {isCleaning ? (
        <Animated.View pointerEvents="none" style={[styles.cleaningEffects, dustStyle]}>
          <Text style={styles.cleaningText}>쓱싹쓱싹</Text>
          <View style={[styles.sparkle, styles.sparkleOne]} />
          <View style={[styles.sparkle, styles.sparkleTwo]} />
          <View style={[styles.dust, styles.dustOne]} />
          <View style={[styles.dust, styles.dustTwo]} />
        </Animated.View>
      ) : null}

      {feedback ? (
        <View pointerEvents="none" style={styles.feedbackBubble}>
          <Text style={styles.feedbackText}>{feedback}</Text>
        </View>
      ) : null}

      <Animated.View
        style={[
          styles.broomStage,
          {
            transform: [
              {
                translateX: broomSweep.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -18],
                }),
              },
              {
                translateY: broomSweep.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 8],
                }),
              },
              {
                rotate: broomSweep.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['18deg', '31deg'],
                }),
              },
            ],
          },
        ]}
      >
        <Pressable
          accessibilityHint="청소 진행 상태를 엽니다."
          accessibilityLabel="방 청소 빗자루"
          accessibilityRole="button"
          disabled={!canPressBroom}
          hitSlop={18}
          onPress={() => setShowConfirm(true)}
          style={({ pressed }) => [
            styles.broomTouchArea,
            pressed && styles.pressed,
            !canPressBroom && styles.disabled,
          ]}
        >
          <Image
            contentFit="contain"
            pointerEvents="none"
            source={broomImage}
            style={styles.broomImage}
          />
        </Pressable>
      </Animated.View>

      <Modal
        animationType="fade"
        onRequestClose={() => {
          if (!isCleaning) setShowConfirm(false);
        }}
        transparent
        visible={showConfirm}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>오늘의 방 청소</Text>
            <Text style={styles.progressText}>
              오늘의 청소 {state.cleaningCount} / {DAILY_CLEANING_GOAL}
            </Text>

            <View style={styles.iconRow}>
              {cleaningIndexes.map((index) => {
                const completed = index < state.cleaningCount;
                return (
                  <Animated.View
                    key={index}
                    style={[
                      styles.iconWrap,
                      { transform: [{ scale: iconBounceValues[index] }] },
                    ]}
                  >
                    <Image
                      contentFit="contain"
                      pointerEvents="none"
                      source={broomImage}
                      style={[
                        styles.progressBroomIcon,
                        !completed && styles.progressBroomIconInactive,
                      ]}
                    />
                  </Animated.View>
                );
              })}
            </View>

            <Text style={styles.modalDescription}>
              {getCleaningDescription(state.cleaningCount)}
            </Text>

            <View style={styles.modalActions}>
              <Pressable
                accessibilityRole="button"
                disabled={isCleaning}
                onPress={() => setShowConfirm(false)}
                style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
              >
                <Text style={styles.cancelText}>취소</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={!canPressCleanButton}
                onPress={startPhotoVerification}
                style={({ pressed }) => [
                  styles.cleanButton,
                  (!canPressCleanButton || state.cleaningCount >= DAILY_CLEANING_GOAL)
                    && styles.disabled,
                  pressed && canPressCleanButton && styles.pressed,
                ]}
              >
                <Text style={styles.cleanText}>
                  {state.cleaningCount >= DAILY_CLEANING_GOAL ? '완료' : '청소하기'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  messyFloor: {
    position: 'absolute',
    left: '10%',
    right: '5%',
    bottom: '5%',
    height: '34%',
    opacity: 0.92,
    transform: [{ rotate: '-8deg' }, { scaleX: 1.08 }, { scaleY: 0.76 }],
  },
  cleaningEffects: {
    position: 'absolute',
    right: '9%',
    top: '60%',
    width: 120,
    height: 88,
    zIndex: 17,
    elevation: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cleaningText: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    overflow: 'hidden',
    color: '#6C5E50',
    fontSize: 12,
    fontWeight: '900',
    backgroundColor: 'rgba(255, 249, 239, 0.88)',
  },
  sparkle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F5D982',
  },
  sparkleOne: { right: 14, top: 12 },
  sparkleTwo: { left: 16, bottom: 12 },
  dust: {
    position: 'absolute',
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: 'rgba(168, 145, 111, 0.45)',
  },
  dustOne: { left: 36, top: 26 },
  dustTwo: { right: 38, bottom: 24 },
  feedbackBubble: {
    position: 'absolute',
    right: '4%',
    top: '53%',
    maxWidth: 190,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 249, 239, 0.92)',
    zIndex: 19,
    elevation: 19,
  },
  feedbackText: {
    color: '#6C5E50',
    fontSize: 11,
    fontWeight: '900',
  },
  broomStage: {
    position: 'absolute',
    right: '3%',
    top: '58%',
    width: 50,
    height: 100,
    zIndex: 18,
    elevation: 18,
  },
  broomTouchArea: {
    position: 'absolute',
    left: '-36%',
    top: '-14%',
    right: '-28%',
    bottom: '-12%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  broomImage: {
    width: '100%',
    height: '100%',
  },
  pressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.58 },
  modalBackdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(38, 31, 25, 0.38)',
  },
  modalCard: {
    width: '100%',
    maxWidth: 370,
    padding: 20,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E6D9C8',
    backgroundColor: '#FFF9EF',
    shadowColor: '#2E261E',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 12,
  },
  modalTitle: { color: '#382F27', fontSize: 20, fontWeight: '900' },
  progressText: {
    marginTop: 8,
    color: '#5D7651',
    fontSize: 13,
    fontWeight: '900',
  },
  iconRow: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
  },
  iconWrap: {
    width: 42,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBroomIcon: {
    width: 34,
    height: 52,
  },
  progressBroomIconInactive: {
    opacity: 0.26,
  },
  modalDescription: {
    marginTop: 13,
    color: '#756757',
    fontSize: 12,
    lineHeight: 19,
    fontWeight: '700',
  },
  modalActions: { marginTop: 18, flexDirection: 'row', gap: 10 },
  cancelButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D8CBBB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFDF8',
  },
  cleanButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7D8D62',
  },
  cancelText: { color: '#6C5E50', fontSize: 13, fontWeight: '900' },
  cleanText: { color: '#FFF9EF', fontSize: 13, fontWeight: '900' },
});
