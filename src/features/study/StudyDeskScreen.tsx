import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StudyScene } from '@/features/study/StudyScene';
import {
  DEVELOPMENT_SECONDS_PER_PAGE,
  formatCountdown,
  formatElapsedTime,
  getSecondsUntilNextPage,
  PRODUCTION_SECONDS_PER_PAGE,
  studyCategories,
} from '@/features/study/studySession';
import { useStudySession } from '@/features/study/useStudySession';

export function StudyDeskScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState(studyCategories[0]);
  const [isStarted, setIsStarted] = useState(false);
  const [isAccelerated, setIsAccelerated] = useState(__DEV__);
  const [isCompleting, setIsCompleting] = useState(false);
  const panelEntrance = useRef(new Animated.Value(0)).current;
  const completionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const secondsPerPage = isAccelerated
    ? DEVELOPMENT_SECONDS_PER_PAGE
    : PRODUCTION_SECONDS_PER_PAGE;
  const {
    state,
    configure,
    start,
    pause,
    resume,
    finish,
  } = useStudySession(selectedCategory, secondsPerPage);

  useEffect(() => {
    const animation = Animated.spring(panelEntrance, {
      toValue: 1,
      damping: 19,
      stiffness: 92,
      useNativeDriver: Platform.OS !== 'web',
    });
    animation.start();
    return () => animation.stop();
  }, [panelEntrance]);

  useEffect(() => {
    if (!isStarted) configure(selectedCategory, secondsPerPage);
  }, [configure, isStarted, secondsPerPage, selectedCategory]);

  useEffect(() => () => {
    if (completionTimer.current) clearTimeout(completionTimer.current);
  }, []);

  const handleStart = () => {
    configure(selectedCategory, secondsPerPage);
    setIsStarted(true);
    start();
  };

  const handlePauseToggle = () => {
    if (state.isRunning) pause();
    else if (state.isPaused) resume();
  };

  const handleFinish = () => {
    if (isCompleting) return;

    const result = finish();
    setIsCompleting(true);
    completionTimer.current = setTimeout(() => {
      router.replace({
        pathname: '/(tabs)/study',
        params: {
          startedAt: result.startedAt,
          endedAt: result.endedAt,
          elapsedSeconds: result.elapsedSeconds.toString(),
          categoryId: result.category.id,
          categoryLabel: result.category.label,
          completedPages: result.completedPages.toString(),
          currentPageProgress: result.currentPageProgress.toFixed(4),
        },
      });
    }, 760);
  };

  const handleBack = () => {
    if (state.isRunning) pause();
    router.back();
  };

  return (
    <View style={styles.container}>
      <StudyScene
        completedPages={state.completedPages}
        currentPageProgress={state.currentPageProgress}
        isCompleting={isCompleting}
        isPaused={state.isPaused}
        isRunning={state.isRunning}
        isStarted={isStarted}
      />

      <SafeAreaView pointerEvents="box-none" style={styles.safe}>
        {isStarted ? (
          <>
            <View style={styles.runningHeader}>
              <Pressable
                accessibilityLabel="공부 화면 닫기"
                onPress={handleBack}
                style={styles.roundButton}
              >
                <Ionicons name="chevron-back" size={23} color="#41372E" />
              </Pressable>

              <View style={styles.timerPill}>
                <View style={[styles.categoryDot, { backgroundColor: selectedCategory.color }]} />
                <View>
                  <Text style={styles.timerCategory}>
                    {state.isPaused ? '잠시 멈춤' : selectedCategory.label}
                  </Text>
                  <Text accessibilityLiveRegion="polite" style={styles.timerText}>
                    {formatElapsedTime(state.elapsedMs)}
                  </Text>
                </View>
              </View>

              <Pressable
                accessibilityLabel={state.isRunning ? '공부 일시정지' : '공부 다시 시작'}
                onPress={handlePauseToggle}
                style={styles.roundButton}
              >
                <Ionicons
                  name={state.isRunning ? 'pause' : 'play'}
                  size={20}
                  color="#41372E"
                />
              </Pressable>
            </View>

            {state.isPaused ? (
              <View pointerEvents="none" style={styles.pausedBadge}>
                <Ionicons name="cafe-outline" size={16} color="#5D5145" />
                <Text style={styles.pausedText}>잠시 쉬고 있어요</Text>
              </View>
            ) : null}

            <View style={styles.compactControls}>
              <View style={styles.pageStatus}>
                <Text style={styles.pageCount}>필사한 페이지 {state.completedPages}장</Text>
                <Text style={styles.nextPage}>
                  다음 페이지까지 {formatCountdown(getSecondsUntilNextPage(state))}
                </Text>
              </View>
              {__DEV__ ? (
                <View style={styles.devBadge}>
                  <Text style={styles.devBadgeText}>{state.secondsPerPage}초/장</Text>
                </View>
              ) : null}
              <Pressable
                accessibilityLabel="공부 종료"
                disabled={isCompleting}
                onPress={handleFinish}
                style={({ pressed }) => [
                  styles.finishButton,
                  isCompleting && styles.disabled,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons name="checkmark" size={18} color="#FFF9EE" />
                <Text style={styles.finishLabel}>
                  {isCompleting ? '기록 중' : '공부 종료'}
                </Text>
              </Pressable>
            </View>
          </>
        ) : (
          <>
            <View style={styles.header}>
              <Pressable
                accessibilityLabel="내 방으로 돌아가기"
                onPress={() => router.back()}
                style={styles.roundButton}
              >
                <Ionicons name="chevron-back" size={23} color="#41372E" />
              </Pressable>
              <View style={styles.headerCopy}>
                <Text style={styles.eyebrow}>책상에 앉았어요</Text>
                <Text style={styles.headerTitle}>오늘은 무엇을 쌓아볼까요?</Text>
              </View>
            </View>

            <Animated.View
              style={[
                styles.selectionPanel,
                {
                  opacity: panelEntrance,
                  transform: [{
                    translateY: panelEntrance.interpolate({
                      inputRange: [0, 1],
                      outputRange: [74, 0],
                    }),
                  }],
                },
              ]}
            >
              <View style={styles.panelHeading}>
                <View>
                  <Text style={styles.panelEyebrow}>ACTIVITY</Text>
                  <Text style={styles.panelTitle}>활동 주제 선택</Text>
                </View>
                <Text style={styles.pageReward}>10분마다 1페이지</Text>
              </View>

              <View style={styles.categoryGrid}>
                {studyCategories.map((category) => {
                  const selected = category.id === selectedCategory.id;
                  return (
                    <Pressable
                      key={category.id}
                      onPress={() => setSelectedCategory(category)}
                      style={[
                        styles.category,
                        selected && {
                          borderColor: category.color,
                          backgroundColor: `${category.color}22`,
                        },
                      ]}
                    >
                      <View style={[styles.categoryDot, { backgroundColor: category.color }]} />
                      <Text style={styles.categoryLabel}>{category.label}</Text>
                      {selected ? (
                        <Ionicons name="checkmark-circle" size={17} color={category.color} />
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>

              {__DEV__ ? (
                <Pressable
                  accessibilityRole="switch"
                  accessibilityState={{ checked: isAccelerated }}
                  onPress={() => setIsAccelerated((current) => !current)}
                  style={styles.devToggle}
                >
                  <Ionicons name="flash-outline" size={16} color="#7A654E" />
                  <Text style={styles.devToggleText}>페이지 테스트 가속</Text>
                  <Text style={styles.devToggleValue}>
                    {isAccelerated ? '10초' : '10분'}
                  </Text>
                </Pressable>
              ) : null}

              <Pressable
                onPress={handleStart}
                style={({ pressed }) => [
                  styles.startButton,
                  { backgroundColor: selectedCategory.color },
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.startLabel}>필사 시작</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </Pressable>
            </Animated.View>
          </>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#EDE3D5',
  },
  safe: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  roundButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 252, 244, 0.9)',
    shadowColor: '#4C3828',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 7,
    elevation: 4,
  },
  headerCopy: {
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 252, 244, 0.91)',
  },
  eyebrow: {
    color: '#91806E',
    fontSize: 10,
    fontWeight: '700',
  },
  headerTitle: {
    marginTop: 2,
    color: '#3C332B',
    fontSize: 14,
    fontWeight: '800',
  },
  selectionPanel: {
    marginHorizontal: 12,
    marginBottom: 12,
    padding: 18,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 252, 246, 0.94)',
    shadowColor: '#33271D',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 12,
  },
  panelHeading: {
    marginBottom: 13,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  panelEyebrow: {
    color: '#A08C75',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.3,
  },
  panelTitle: {
    marginTop: 2,
    color: '#382F28',
    fontSize: 19,
    fontWeight: '900',
  },
  pageReward: {
    color: '#7E705F',
    fontSize: 10,
    fontWeight: '700',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  category: {
    width: '48.8%',
    minHeight: 40,
    paddingHorizontal: 10,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#E5DBCD',
    backgroundColor: '#FFFEFA',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  categoryLabel: {
    flex: 1,
    color: '#554A3F',
    fontSize: 11,
    fontWeight: '700',
  },
  devToggle: {
    minHeight: 34,
    marginTop: 10,
    paddingHorizontal: 11,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(228, 210, 183, 0.52)',
  },
  devToggleText: {
    flex: 1,
    color: '#695A4B',
    fontSize: 10,
    fontWeight: '700',
  },
  devToggleValue: {
    color: '#7A654E',
    fontSize: 10,
    fontWeight: '900',
  },
  startButton: {
    minHeight: 49,
    marginTop: 11,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  startLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
  runningHeader: {
    paddingHorizontal: 14,
    paddingTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  timerPill: {
    minWidth: 172,
    minHeight: 48,
    paddingHorizontal: 15,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    backgroundColor: 'rgba(255, 252, 244, 0.91)',
    shadowColor: '#493628',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.13,
    shadowRadius: 8,
    elevation: 4,
  },
  timerCategory: {
    color: '#887765',
    fontSize: 9,
    fontWeight: '800',
  },
  timerText: {
    marginTop: 1,
    color: '#382F28',
    fontSize: 20,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.5,
  },
  pausedBadge: {
    position: 'absolute',
    top: '17%',
    alignSelf: 'center',
    minHeight: 38,
    paddingHorizontal: 15,
    borderRadius: 19,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(255, 250, 240, 0.88)',
  },
  pausedText: {
    color: '#5D5145',
    fontSize: 11,
    fontWeight: '800',
  },
  compactControls: {
    marginHorizontal: 12,
    marginBottom: 10,
    minHeight: 66,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 252, 246, 0.91)',
    shadowColor: '#33271D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  pageStatus: {
    flex: 1,
  },
  pageCount: {
    color: '#4E4338',
    fontSize: 11,
    fontWeight: '900',
  },
  nextPage: {
    marginTop: 3,
    color: '#8C7C6B',
    fontSize: 9,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  devBadge: {
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 9,
    backgroundColor: 'rgba(218, 194, 157, 0.5)',
  },
  devBadgeText: {
    color: '#765F46',
    fontSize: 8,
    fontWeight: '900',
  },
  finishButton: {
    minHeight: 42,
    paddingHorizontal: 13,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#55483C',
  },
  finishLabel: {
    color: '#FFF9EE',
    fontSize: 11,
    fontWeight: '900',
  },
  disabled: {
    opacity: 0.62,
  },
});
