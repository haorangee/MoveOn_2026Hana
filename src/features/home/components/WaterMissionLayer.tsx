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
  DAILY_WATER_CUP_COUNT,
  DAILY_WATER_GOAL_ML,
  useWaterMission,
  WATER_PER_CUP_ML,
  type WaterMissionState,
} from '@/features/home/waterMission';

type WaterMissionLayerProps = {
  disabled?: boolean;
  onMissionStateChange?: (state: WaterMissionState) => void;
};

const cupIndexes = Array.from({ length: DAILY_WATER_CUP_COUNT }, (_, index) => index);

export function WaterMissionLayer({
  disabled = false,
  onMissionStateChange,
}: WaterMissionLayerProps) {
  const {
    state,
    isHydrated,
    isRecording,
    recordCup,
    markFlowerBloomed,
  } = useWaterMission({ onChange: onMissionStateChange });
  const [showModal, setShowModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isBloomAnimating, setIsBloomAnimating] = useState(false);
  const previousCupCount = useRef(state.cupCount);
  const cupFillValues = useRef(cupIndexes.map(() => new Animated.Value(0))).current;
  const cupBounceValues = useRef(cupIndexes.map(() => new Animated.Value(1))).current;
  const bloomProgress = useRef(new Animated.Value(state.flowerBloomed ? 1 : 0)).current;
  const sparkleProgress = useRef(new Animated.Value(0)).current;
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const consumedMl = state.cupCount * WATER_PER_CUP_ML;
  const isComplete = state.missionCompleted;
  const canInteract = isHydrated && !disabled && !isRecording && !isBloomAnimating;

  useEffect(() => {
    if (!isHydrated) return;
    cupIndexes.forEach((index) => {
      Animated.timing(cupFillValues[index], {
        toValue: index < state.cupCount ? 1 : 0,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    });

    const filledIndex = state.cupCount - 1;
    if (state.cupCount > previousCupCount.current && filledIndex >= 0) {
      Animated.sequence([
        Animated.timing(cupBounceValues[filledIndex], {
          toValue: 1.14,
          duration: 120,
          easing: Easing.out(Easing.quad),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.spring(cupBounceValues[filledIndex], {
          toValue: 1,
          damping: 7,
          stiffness: 180,
          mass: 0.7,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();

      setFeedback('한 잔 충전했어요!');
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
      feedbackTimer.current = setTimeout(() => setFeedback(null), 1800);
    }

    previousCupCount.current = state.cupCount;
  }, [cupBounceValues, cupFillValues, isHydrated, state.cupCount]);

  useEffect(() => {
    if (state.flowerBloomed) {
      bloomProgress.setValue(1);
    }
  }, [bloomProgress, state.flowerBloomed]);

  useEffect(() => () => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
  }, []);

  const bloomStyle = useMemo(() => ({
    opacity: bloomProgress.interpolate({
      inputRange: [0, 0.25, 1],
      outputRange: [0, 1, 1],
    }),
    transform: [
      {
        translateY: bloomProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [10, 0],
        }),
      },
      {
        scale: bloomProgress.interpolate({
          inputRange: [0, 0.55, 1],
          outputRange: [0.15, 0.78, 1],
        }),
      },
    ],
  }), [bloomProgress]);

  const plantSwayStyle = useMemo(() => ({
    transform: [
      {
        rotate: sparkleProgress.interpolate({
          inputRange: [0, 0.25, 0.5, 0.75, 1],
          outputRange: ['0deg', '-4deg', '3deg', '-2deg', '0deg'],
        }),
      },
    ],
  }), [sparkleProgress]);

  const sparkleStyle = useMemo(() => ({
    opacity: sparkleProgress.interpolate({
      inputRange: [0, 0.18, 0.75, 1],
      outputRange: [0, 1, 0.85, 0],
    }),
    transform: [
      {
        scale: sparkleProgress.interpolate({
          inputRange: [0, 0.45, 1],
          outputRange: [0.45, 1, 1.2],
        }),
      },
    ],
  }), [sparkleProgress]);

  const handleCupPress = async (cupIndex?: number) => {
    if (!canInteract || isComplete) return;
    if (typeof cupIndex === 'number' && cupIndex < state.cupCount) return;

    const nextState = await recordCup();
    if (nextState.missionCompleted) {
      setShowSuccess(true);
    }
  };

  const playBloomAnimation = async () => {
    if (isBloomAnimating) return;
    setShowSuccess(false);
    setShowModal(false);

    if (state.flowerBloomed) return;

    setIsBloomAnimating(true);
    bloomProgress.setValue(0);
    sparkleProgress.setValue(0);

    Animated.parallel([
      Animated.timing(sparkleProgress, {
        toValue: 1,
        duration: 2400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.sequence([
        Animated.delay(280),
        Animated.spring(bloomProgress, {
          toValue: 1,
          damping: 8,
          stiffness: 90,
          mass: 0.75,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]),
    ]).start(async ({ finished }) => {
      if (finished) {
        await markFlowerBloomed();
      }
      setIsBloomAnimating(false);
    });
  };

  return (
    <>
      <Pressable
        accessibilityHint="오늘 물 마시기 기록을 엽니다."
        accessibilityLabel="물 마시기 미션 열기"
        accessibilityRole="button"
        disabled={!isHydrated || disabled || isBloomAnimating}
        hitSlop={10}
        onPress={() => setShowModal(true)}
        style={styles.waterHotspot}
      />

      <Animated.View pointerEvents="none" style={[styles.flowerStage, plantSwayStyle]}>
        {state.flowerBloomed || isBloomAnimating ? (
          <Animated.View style={[styles.flowerBloom, bloomStyle]}>
            <View style={[styles.petal, styles.petalTop]} />
            <View style={[styles.petal, styles.petalRight]} />
            <View style={[styles.petal, styles.petalBottom]} />
            <View style={[styles.petal, styles.petalLeft]} />
            <View style={styles.flowerCenter} />
          </Animated.View>
        ) : null}
      </Animated.View>

      {isBloomAnimating ? (
        <Animated.View pointerEvents="none" style={[styles.sparkleLayer, sparkleStyle]}>
          <View style={[styles.drop, styles.dropOne]} />
          <View style={[styles.drop, styles.dropTwo]} />
          <View style={[styles.sparkle, styles.sparkleOne]} />
          <View style={[styles.sparkle, styles.sparkleTwo]} />
        </Animated.View>
      ) : null}

      <Modal
        animationType="fade"
        onRequestClose={() => {
          if (!isRecording) setShowModal(false);
        }}
        transparent
        visible={showModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            {showSuccess || isComplete ? (
              <>
                <Text style={styles.modalTitle}>미션 성공!!</Text>
                <Text style={styles.modalDescription}>
                  오늘 수분이 모두 충전되었어요 💧
                </Text>
                <View style={styles.successPanel}>
                  <Text style={styles.progressValue}>
                    {DAILY_WATER_CUP_COUNT} / {DAILY_WATER_CUP_COUNT}컵 · {DAILY_WATER_GOAL_ML.toLocaleString()}ml
                  </Text>
                  <View style={styles.successCupRow}>
                    {cupIndexes.map((index) => (
                      <View key={index} style={styles.successCup}>
                        <View style={styles.successCupWater} />
                        <Text style={styles.successCupText}>✓</Text>
                      </View>
                    ))}
                  </View>
                </View>
                <Pressable
                  accessibilityRole="button"
                  disabled={isRecording}
                  onPress={() => void playBloomAnimation()}
                  style={({ pressed }) => [styles.singleButton, pressed && styles.pressed]}
                >
                  <Text style={styles.drinkText}>확인</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.modalTitle}>오늘의 수분을 충전하세요</Text>
                <Text style={styles.modalDescription}>
                  성인의 하루 권장 수분 섭취량은 약 2L예요.
                </Text>
                <Text style={styles.modalHint}>
                  하루 목표를 5번으로 나누어 천천히 채워보세요.
                </Text>

                <View style={styles.progressPanel}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressLabel}>현재 진행량</Text>
                    <Text style={styles.progressValue}>
                      {state.cupCount} / {DAILY_WATER_CUP_COUNT}컵 · {consumedMl.toLocaleString()}ml
                    </Text>
                  </View>
                  <View style={styles.cupRow}>
                    {cupIndexes.map((index) => {
                      const filled = index < state.cupCount;
                      const fillHeight = cupFillValues[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      });

                      return (
                        <Animated.View
                          key={index}
                          style={[
                            styles.cupButtonWrap,
                            { transform: [{ scale: cupBounceValues[index] }] },
                          ]}
                        >
                          <Pressable
                            accessibilityLabel={`${index + 1}번째 물컵`}
                            accessibilityRole="button"
                            disabled={!canInteract || isComplete || isRecording}
                            onPress={() => void handleCupPress(index)}
                            style={({ pressed }) => [
                              styles.cupButton,
                              pressed && styles.pressed,
                            ]}
                          >
                            <View style={styles.cupGlass}>
                              <Animated.View style={[styles.cupWater, { height: fillHeight }]} />
                              <View style={styles.cupShine} />
                            </View>
                            <Text style={[styles.cupText, filled && styles.cupTextFilled]}>
                              {filled ? '✓' : index + 1}
                            </Text>
                          </Pressable>
                        </Animated.View>
                      );
                    })}
                  </View>
                  <Text style={styles.perCupText}>
                    한 컵은 {WATER_PER_CUP_ML}ml · 하루 목표 {DAILY_WATER_GOAL_ML.toLocaleString()}ml
                  </Text>
                  {feedback ? <Text style={styles.feedbackText}>{feedback}</Text> : null}
                </View>

                <View style={styles.modalActions}>
                  <Pressable
                    accessibilityRole="button"
                    disabled={isRecording}
                    onPress={() => setShowModal(false)}
                    style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
                  >
                    <Text style={styles.closeText}>닫기</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    disabled={!canInteract || isComplete}
                    onPress={() => void handleCupPress()}
                    style={({ pressed }) => [
                      styles.drinkButton,
                      pressed && styles.pressed,
                      (!canInteract || isComplete) && styles.disabled,
                    ]}
                  >
                    <Text style={styles.drinkText}>물 한 컵 마시기</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  waterHotspot: {
    position: 'absolute',
    right: '6%',
    top: '61%',
    width: '22%',
    height: '14%',
    borderRadius: 34,
    zIndex: 16,
    elevation: 16,
  },
  flowerStage: {
    position: 'absolute',
    right: '18.5%',
    top: '58.2%',
    width: 32,
    height: 42,
    zIndex: 12,
    elevation: 12,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  flowerBloom: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  petal: {
    position: 'absolute',
    width: 12,
    height: 15,
    borderRadius: 10,
    backgroundColor: '#F1A9B6',
  },
  petalTop: { top: 0 },
  petalRight: { right: 0, transform: [{ rotate: '55deg' }] },
  petalBottom: { bottom: 0, transform: [{ rotate: '180deg' }] },
  petalLeft: { left: 0, transform: [{ rotate: '-55deg' }] },
  flowerCenter: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F5D36F',
  },
  sparkleLayer: {
    position: 'absolute',
    right: '16%',
    top: '57.4%',
    width: 58,
    height: 54,
    zIndex: 14,
    elevation: 14,
  },
  drop: {
    position: 'absolute',
    width: 7,
    height: 10,
    borderRadius: 7,
    backgroundColor: '#A9DDEB',
  },
  dropOne: { left: 8, top: 20 },
  dropTwo: { right: 10, top: 10 },
  sparkle: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#F8E8A5',
  },
  sparkleOne: { left: 2, top: 4 },
  sparkleTwo: { right: 2, bottom: 11 },
  modalBackdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(38, 31, 25, 0.34)',
  },
  modalCard: {
    width: '100%',
    maxWidth: 390,
    padding: 22,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E7D8C3',
    backgroundColor: '#FFF8EC',
    shadowColor: '#2E261E',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 22,
    elevation: 12,
  },
  modalTitle: { color: '#382F27', fontSize: 20, fontWeight: '900' },
  modalDescription: {
    marginTop: 9,
    color: '#6F6254',
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '800',
  },
  modalHint: {
    marginTop: 3,
    color: '#9A8974',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
  },
  progressPanel: {
    marginTop: 18,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EADCC8',
    backgroundColor: '#FFFDF8',
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  progressLabel: { color: '#756757', fontSize: 12, fontWeight: '900' },
  progressValue: { color: '#4E6E7D', fontSize: 12, fontWeight: '900' },
  successPanel: {
    marginTop: 16,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D8E9ED',
    alignItems: 'center',
    backgroundColor: '#F7FCFD',
  },
  successCupRow: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 8,
  },
  successCup: {
    width: 30,
    height: 36,
    borderWidth: 2,
    borderColor: '#91C8D8',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7FCFD',
  },
  successCupWater: {
    ...StyleSheet.absoluteFillObject,
    top: 6,
    backgroundColor: '#8ED7EA',
  },
  successCupText: {
    color: '#315A68',
    fontSize: 11,
    fontWeight: '900',
  },
  cupRow: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 7,
  },
  cupButtonWrap: { flex: 1 },
  cupButton: {
    minHeight: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cupGlass: {
    width: 34,
    height: 42,
    borderWidth: 2,
    borderTopWidth: 1,
    borderColor: '#9DB7BD',
    borderTopColor: '#CFE0E4',
    borderBottomLeftRadius: 11,
    borderBottomRightRadius: 11,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#F7FCFD',
  },
  cupWater: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#8ED7EA',
  },
  cupShine: {
    position: 'absolute',
    left: 7,
    top: 6,
    width: 4,
    height: 22,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.64)',
  },
  cupText: {
    marginTop: 4,
    color: '#8DA4AA',
    fontSize: 11,
    fontWeight: '900',
  },
  cupTextFilled: { color: '#315A68' },
  perCupText: {
    marginTop: 9,
    color: '#9A8974',
    fontSize: 11,
    fontWeight: '800',
  },
  feedbackText: {
    marginTop: 9,
    color: '#5D8EA0',
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
  },
  modalActions: { marginTop: 18, flexDirection: 'row', gap: 10 },
  closeButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D8CBBB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFDF8',
  },
  drinkButton: {
    flex: 1.35,
    minHeight: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7BA9B5',
  },
  singleButton: {
    marginTop: 20,
    minHeight: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7BA9B5',
  },
  closeText: { color: '#6C5E50', fontSize: 13, fontWeight: '900' },
  drinkText: { color: '#FFFDF8', fontSize: 13, fontWeight: '900' },
  pressed: { opacity: 0.84, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.58 },
});
