import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { TutorialRoomScene } from '@/features/onboarding/components/TutorialRoomScene';
import type { CharacterId, PetSpecies } from '@/features/onboarding/onboardingData';

const flowLabels = ['책장 선택', '코딩 선택', '시간 기록', '파란 책 생성', '책장에 꽂힘'];
const CODING_BLUE = '#5F82AE';

type StudyTutorialPageProps = {
  characterId: CharacterId;
  petSpecies: PetSpecies;
  onContinue: () => void;
};

export function StudyTutorialPage({
  characterId,
  petSpecies,
  onContinue,
}: StudyTutorialPageProps) {
  const [demoStep, setDemoStep] = useState(0);
  const bookTravel = useRef(new Animated.Value(0)).current;
  const bookPop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timers = [
      setTimeout(() => setDemoStep(1), 900),
      setTimeout(() => setDemoStep(2), 1900),
      setTimeout(() => setDemoStep(3), 3100),
      setTimeout(() => setDemoStep(4), 4050),
      setTimeout(() => setDemoStep(5), 5350),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (demoStep !== 3) return;
    bookPop.setValue(0);
    Animated.spring(bookPop, {
      toValue: 1,
      damping: 7,
      stiffness: 120,
      mass: 0.8,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [bookPop, demoStep]);

  useEffect(() => {
    if (demoStep !== 4) return;
    bookTravel.setValue(0);
    Animated.timing(bookTravel, {
      toValue: 1,
      duration: 1180,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [bookTravel, demoStep]);

  const bookAnimatedStyle = useMemo(() => ({
    opacity: demoStep >= 3 && demoStep < 5 ? 1 : 0,
    transform: [
      {
        translateX: bookTravel.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 126],
        }),
      },
      {
        translateY: bookTravel.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -112],
        }),
      },
      {
        scale: demoStep === 3
          ? bookPop.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1.16] })
          : bookTravel.interpolate({ inputRange: [0, 1], outputRange: [1.08, 0.42] }),
      },
      {
        rotate: bookTravel.interpolate({
          inputRange: [0, 1],
          outputRange: ['-6deg', '0deg'],
        }),
      },
    ],
  }), [bookPop, bookTravel, demoStep]);

  const activeFlowIndex = Math.min(demoStep, flowLabels.length - 1);
  const completed = demoStep >= 5;

  return (
    <View style={styles.container}>
      <TutorialRoomScene
        characterActivity={demoStep >= 2 && demoStep < 5 ? 'desk' : 'bookshelf'}
        characterId={characterId}
        growthLevel={0}
        highlightedObject="bookshelf"
        lighting="afternoon"
        petBehavior={demoStep >= 2 && demoStep < 5 ? 'sleep' : 'follow'}
        petSpecies={petSpecies}
      >
        <View pointerEvents="none" style={styles.dimLayer} />
        <View pointerEvents="none" style={styles.bookshelfSpotlight} />

        <View pointerEvents="none" style={styles.heading}>
          <Text style={styles.stepLabel}>3 / 6 · 공부 기록</Text>
          <Text style={styles.title}>공부한 시간은 책으로 남아요</Text>
          <Text style={styles.description}>
            공부한 시간을 책으로 기록해볼까요?
          </Text>
        </View>

        <View pointerEvents="none" style={styles.flow}>
          {flowLabels.map((label, index) => (
            <View key={label} style={styles.flowItem}>
              <View style={[styles.flowDot, index <= activeFlowIndex && styles.flowDotActive]} />
              <Text style={[styles.flowText, index === activeFlowIndex && styles.flowTextActive]}>
                {label}
              </Text>
            </View>
          ))}
        </View>

        {demoStep >= 1 && demoStep < 5 ? (
          <View pointerEvents="none" style={styles.categoryCard}>
            <Text style={styles.cardLabel}>공부 분야</Text>
            <View style={styles.codingRow}>
              <View style={styles.codingColor} />
              <Text style={styles.codingText}>코딩</Text>
              <Text style={styles.selectedText}>선택됨</Text>
            </View>
          </View>
        ) : null}

        {demoStep >= 2 && demoStep < 5 ? (
          <View pointerEvents="none" style={styles.timeCard}>
            <Text style={styles.cardLabel}>공부 시간 기록</Text>
            <Text style={styles.timeText}>00:25:00</Text>
            <View style={styles.timeBar}>
              <View style={styles.timeFill} />
            </View>
          </View>
        ) : null}

        <Animated.View pointerEvents="none" style={[styles.createdBook, bookAnimatedStyle]}>
          <View style={styles.bookSpine} />
          <View style={styles.bookBand} />
        </Animated.View>

        {completed ? (
          <View pointerEvents="none" style={styles.shelvedBook}>
            <View style={styles.shelvedBookBand} />
          </View>
        ) : null}

        <View style={styles.footer}>
          <Text style={styles.resultText}>
            {completed ? '공부 기록이 나만의 책으로 남았어요!' : '파란 책 1권이 책장 빈칸으로 이동하고 있어요.'}
          </Text>
          <Pressable
            accessibilityRole="button"
            disabled={!completed}
            onPress={onContinue}
            style={({ pressed }) => [
              styles.button,
              !completed && styles.buttonDisabled,
              pressed && completed && styles.pressed,
            ]}
          >
            <Text style={styles.buttonText}>{completed ? '다음' : '잠시만 기다려요'}</Text>
          </Pressable>
        </View>
      </TutorialRoomScene>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  dimLayer: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(41, 34, 28, 0.28)' },
  bookshelfSpotlight: {
    position: 'absolute',
    left: '54%',
    top: '17%',
    width: '22%',
    height: '38%',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 239, 177, 0.96)',
    backgroundColor: 'rgba(255, 237, 174, 0.12)',
  },
  heading: { position: 'absolute', left: 24, right: 20, top: '5%' },
  stepLabel: { color: '#7D8963', fontSize: 10, fontWeight: '900' },
  title: { marginTop: 6, color: '#FFF8EA', fontSize: 23, fontWeight: '900' },
  description: { marginTop: 7, color: '#FFF1D4', fontSize: 12, lineHeight: 18, fontWeight: '800' },
  flow: {
    position: 'absolute',
    left: 18,
    right: 18,
    top: '22%',
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 16,
    backgroundColor: 'rgba(255, 250, 239, 0.9)',
  },
  flowItem: { flex: 1, alignItems: 'center', gap: 5 },
  flowDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#C8B9A4' },
  flowDotActive: { backgroundColor: CODING_BLUE },
  flowText: { color: '#8D7E6C', fontSize: 8, fontWeight: '800', textAlign: 'center' },
  flowTextActive: { color: '#314966', fontWeight: '900' },
  categoryCard: {
    position: 'absolute',
    left: '8%',
    top: '35%',
    width: 128,
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 250, 239, 0.94)',
  },
  cardLabel: { color: '#7B6C5D', fontSize: 9, fontWeight: '900' },
  codingRow: { marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 7 },
  codingColor: { width: 10, height: 28, borderRadius: 3, backgroundColor: CODING_BLUE },
  codingText: { flex: 1, color: '#352D25', fontSize: 12, fontWeight: '900' },
  selectedText: { color: '#5E7EA4', fontSize: 8, fontWeight: '900' },
  timeCard: {
    position: 'absolute',
    left: '24%',
    top: '47%',
    width: 146,
    padding: 12,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 250, 239, 0.95)',
  },
  timeText: { marginTop: 5, color: '#2F3F54', fontSize: 20, fontWeight: '900' },
  timeBar: { marginTop: 8, height: 6, borderRadius: 999, overflow: 'hidden', backgroundColor: '#DCE6EF' },
  timeFill: { width: '76%', height: '100%', backgroundColor: CODING_BLUE },
  createdBook: {
    position: 'absolute',
    left: '34%',
    top: '48%',
    width: 38,
    height: 82,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(35, 42, 54, 0.22)',
    backgroundColor: CODING_BLUE,
    shadowColor: '#1D2B3D',
    shadowOpacity: 0.28,
    shadowRadius: 9,
    elevation: 8,
  },
  bookSpine: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 8, backgroundColor: 'rgba(40, 52, 70, 0.28)' },
  bookBand: { height: 8, marginTop: 18, marginHorizontal: 10, borderRadius: 2, backgroundColor: 'rgba(239, 247, 255, 0.68)' },
  shelvedBook: {
    position: 'absolute',
    left: '61.4%',
    top: '38.8%',
    width: 9,
    height: 36,
    borderRadius: 1.5,
    backgroundColor: CODING_BLUE,
  },
  shelvedBookBand: { height: 3, marginTop: 7, backgroundColor: 'rgba(239, 247, 255, 0.7)' },
  footer: { position: 'absolute', left: 22, right: 22, bottom: 20 },
  resultText: { marginBottom: 9, color: '#FFF5DE', fontSize: 12, fontWeight: '900', textAlign: 'center' },
  button: { minHeight: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#695848' },
  buttonDisabled: { opacity: 0.55 },
  buttonText: { color: '#FFF9EE', fontSize: 14, fontWeight: '900' },
  pressed: { opacity: 0.86 },
});
