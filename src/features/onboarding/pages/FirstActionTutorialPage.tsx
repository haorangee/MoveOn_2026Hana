import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  TutorialRoomScene,
  type TutorialCharacterActivity,
  type TutorialObjectId,
  type TutorialPetBehavior,
} from '@/features/onboarding/components/TutorialRoomScene';
import type { CharacterId, PetSpecies } from '@/features/onboarding/onboardingData';

type FirstActionStep =
  | 'desk'
  | 'category'
  | 'walking'
  | 'sitting'
  | 'notebook'
  | 'pen'
  | 'timer'
  | 'celebrate';

const categories = [
  { id: 'coding', label: '코딩 공부', color: '#6684A6' },
  { id: 'language', label: '어학 공부', color: '#C98D9A' },
  { id: 'startup', label: '창업 활동', color: '#758B67' },
] as const;

const preparationDurations: Partial<Record<FirstActionStep, number>> = {
  walking: 1150,
  sitting: 720,
  notebook: 720,
  pen: 620,
};

const nextPreparationStep: Partial<Record<FirstActionStep, FirstActionStep>> = {
  walking: 'sitting',
  sitting: 'notebook',
  notebook: 'pen',
  pen: 'timer',
};

type FirstActionTutorialPageProps = {
  characterId: string;
  firstBookCreated: boolean;
  petSpecies: PetSpecies;
  onBookCreated: () => void;
  onDone: () => void;
};

export function FirstActionTutorialPage({
  characterId,
  firstBookCreated,
  petSpecies,
  onBookCreated,
  onDone,
}: FirstActionTutorialPageProps) {
  const [step, setStep] = useState<FirstActionStep>('desk');
  const [category, setCategory] = useState<(typeof categories)[number]>(categories[0]);
  const [elapsed, setElapsed] = useState(0);
  const startedAt = useRef<number | null>(null);
  const rewardProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const duration = preparationDurations[step];
    const next = nextPreparationStep[step];
    if (!duration || !next) return;
    const transition = setTimeout(() => setStep(next), duration);
    return () => clearTimeout(transition);
  }, [step]);

  useEffect(() => {
    if (step !== 'timer') return;
    startedAt.current = Date.now();

    const tick = () => {
      if (startedAt.current === null) return;
      const nextElapsed = Math.min(3, (Date.now() - startedAt.current) / 1000);
      setElapsed(nextElapsed);
      if (nextElapsed >= 3) setStep('celebrate');
    };
    tick();
    const timer = setInterval(tick, 100);
    return () => clearInterval(timer);
  }, [step]);

  useEffect(() => {
    if (step !== 'celebrate') return;
    rewardProgress.setValue(0);
    const reward = Animated.timing(rewardProgress, {
      toValue: 1,
      duration: 760,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    });
    reward.start();
    return () => reward.stop();
  }, [rewardProgress, step]);

  const handleObjectPress = (id: TutorialObjectId) => {
    if (step === 'desk' && id === 'desk') setStep('category');
  };

  const lineCount = Math.floor((elapsed / 5) * 8);
  const showingDesk = ['walking', 'sitting', 'notebook', 'pen', 'timer'].includes(step);
  const showingPage = ['notebook', 'pen', 'timer'].includes(step);
  const showingPen = step === 'pen' || step === 'timer';
  const highlightedObject = step === 'desk' ? 'desk' : null;
  const characterActivity: TutorialCharacterActivity = step === 'celebrate'
      ? 'celebrate'
      : showingDesk
        ? 'desk'
        : 'center';
  const petBehavior: TutorialPetBehavior = step === 'timer'
    ? 'sleep'
    : step === 'celebrate'
      ? 'celebrate'
      : 'follow';

  return (
    <View style={styles.container}>
      <TutorialRoomScene
        characterActivity={characterActivity}
        characterId={characterId}
        growthLevel={0}
        highlightedObject={highlightedObject}
        lighting="afternoon"
        message={step === 'desk' ? '책상을 한번 눌러볼까요?' : undefined}
        onObjectPress={handleObjectPress}
        petBehavior={petBehavior}
        petSpecies={petSpecies}
      >
        {step !== 'celebrate' ? (
          <View pointerEvents="none" style={styles.heading}>
            <Text style={styles.kicker}>FIRST ACTION</Text>
            <Text style={styles.title}>{getTitle(step)}</Text>
            <Text style={styles.description}>{getDescription(step)}</Text>
          </View>
        ) : null}

        {step === 'category' ? (
          <View style={styles.categoryPanel}>
            <Text style={styles.panelLabel}>오늘 쌓고 싶은 시간</Text>
            {categories.map((item) => (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                onPress={() => {
                  setCategory(item);
                  setElapsed(0);
                  setStep('walking');
                }}
                style={({ pressed }) => [styles.category, pressed && styles.pressed]}
              >
                <View style={[styles.categoryColor, { backgroundColor: item.color }]} />
                <Text style={styles.categoryText}>{item.label}</Text>
                <Ionicons color="#817363" name="chevron-forward" size={16} />
              </Pressable>
            ))}
          </View>
        ) : null}

        {['walking', 'sitting', 'notebook', 'pen'].includes(step) ? (
          <View pointerEvents="none" style={styles.sceneCaption}>
            <View style={styles.captionLine} />
            <Text style={styles.sceneCaptionText}>{getPreparationCaption(step)}</Text>
          </View>
        ) : null}

        {showingPage ? (
          <View pointerEvents="none" style={[styles.deskPage, step === 'notebook' && styles.openingPage]}>
            <View style={styles.notebookSpine} />
            <View style={styles.pageFold} />
            {Array.from({ length: 8 }, (_, index) => (
              <View
                key={index}
                style={[
                  styles.writingLine,
                  index < lineCount && styles.writingLineFilled,
                  { width: index % 3 === 2 ? '68%' : '88%' },
                ]}
              />
            ))}
            {showingPen ? (
              <View style={[styles.pen, { left: `${22 + Math.min(lineCount, 7) * 7}%` }]} />
            ) : null}
          </View>
        ) : null}

        {step === 'timer' ? (
          <>
            <View pointerEvents="none" style={styles.timerPill}>
              <View style={[styles.timerDot, { backgroundColor: category.color }]} />
              <Text style={styles.timerCategory}>{category.label}</Text>
              <Text style={styles.timerText}>00:0{Math.floor(elapsed)}</Text>
            </View>
            <Text pointerEvents="none" style={styles.writingSound}>사각사각…</Text>
          </>
        ) : null}

        {step === 'celebrate' ? (
          <View style={styles.celebration}>
            <View style={styles.celebrationRule} />
            <Text style={styles.celebrationKicker}>미션 완료!</Text>
            <Text style={styles.celebrationTitle}>오늘의 할 일을 완료했어요.</Text>
            <Text style={styles.celebrationDescription}>
              미션을 완료하면 경험치와 포도를 받을 수 있어요!
            </Text>
            <Animated.View
              pointerEvents="none"
              style={[
                styles.rewardPreview,
                {
                  opacity: rewardProgress,
                  transform: [{ translateY: rewardProgress.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
                },
              ]}
            >
              <Text style={styles.rewardPill}>+10 XP</Text>
              <Text style={styles.rewardPill}>+5 포도</Text>
            </Animated.View>
            <Pressable
              accessibilityRole="button"
              onPress={onDone}
              style={({ pressed }) => [styles.doneButton, pressed && styles.pressed]}
            >
              <Text style={styles.doneButtonText}>내 방으로 가기</Text>
              <Ionicons color="#FFF9EE" name="arrow-forward" size={17} />
            </Pressable>
          </View>
        ) : null}
      </TutorialRoomScene>
    </View>
  );
}

function getTitle(step: FirstActionStep) {
  if (step === 'desk') return '방에서 첫 행동을 시작해요';
  if (step === 'category') return '오늘의 할 일을 선택해요';
  if (step === 'walking') return '캐릭터가 책상으로 가고 있어요';
  if (step === 'sitting') return '의자를 빼고 자리를 잡아요';
  if (step === 'notebook') return '공책을 천천히 펼쳐요';
  if (step === 'pen') return '펜을 들고 준비해요';
  if (step === 'timer') return '잠깐만 집중해 볼까요?';
  return '미션이 완료됐어요';
}

function getDescription(step: FirstActionStep) {
  if (step === 'desk') return '메뉴가 아니라 방 안의 실제 책상을 눌러보세요.';
  if (step === 'category') return '첫 행동에서는 미션을 선택하고 완료하는 흐름만 익혀요.';
  if (step === 'timer') return '짧은 예시 타이머로 미션 완료 과정을 보여줄게요.';
  return '마루도 캐릭터를 따라 조용히 움직여요.';
}

function getPreparationCaption(step: FirstActionStep) {
  if (step === 'walking') return '책상으로 걸어가는 중';
  if (step === 'sitting') return '의자를 당겨 앉는 중';
  if (step === 'notebook') return '공책을 펼치는 중';
  return '펜을 드는 중';
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heading: { position: 'absolute', left: 24, right: 20, top: '5%' },
  kicker: { color: '#7D8963', fontSize: 9, fontWeight: '900', letterSpacing: 1.1 },
  title: { marginTop: 7, color: '#332B23', fontSize: 23, fontWeight: '900', letterSpacing: -0.8 },
  description: { marginTop: 7, color: '#6D5F4F', fontSize: 11, lineHeight: 18, fontWeight: '600' },
  categoryPanel: { position: 'absolute', left: 24, right: 24, bottom: 24, padding: 15, borderRadius: 20, backgroundColor: 'rgba(248,243,233,0.95)' },
  panelLabel: { marginBottom: 8, color: '#6D6050', fontSize: 10, fontWeight: '900' },
  category: { minHeight: 50, borderTopWidth: 1, borderColor: 'rgba(91,72,54,0.13)', flexDirection: 'row', alignItems: 'center', gap: 10 },
  categoryColor: { width: 9, height: 28, borderRadius: 3 },
  categoryText: { flex: 1, color: '#40362D', fontSize: 12, fontWeight: '800' },
  sceneCaption: { position: 'absolute', left: 24, bottom: 24, flexDirection: 'row', alignItems: 'center', gap: 8 },
  captionLine: { width: 22, height: 1, backgroundColor: '#75654F' },
  sceneCaptionText: { color: '#514538', fontSize: 10, fontWeight: '800' },
  timerPill: { position: 'absolute', top: '21%', alignSelf: 'center', minWidth: 172, height: 48, paddingHorizontal: 15, borderRadius: 24, backgroundColor: 'rgba(255,252,245,0.91)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  timerDot: { width: 6, height: 6, borderRadius: 3 },
  timerCategory: { color: '#6F6253', fontSize: 9, fontWeight: '800' },
  timerText: { color: '#342C25', fontSize: 18, fontWeight: '700', fontVariant: ['tabular-nums'] },
  deskPage: {
    position: 'absolute',
    left: '25.5%',
    top: '45%',
    width: '30%',
    height: '12.5%',
    paddingLeft: 14,
    paddingRight: 9,
    paddingTop: 11,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#D4C6B3',
    borderRadius: 5,
    backgroundColor: '#F7EFE2',
    shadowColor: '#382B1E',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 8,
    transform: [{ rotate: '-9deg' }, { skewX: '-4deg' }],
  },
  openingPage: { transform: [{ rotate: '-10deg' }, { skewX: '-5deg' }, { scaleX: 0.96 }] },
  notebookSpine: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 8, backgroundColor: '#C9B89D' },
  pageFold: { position: 'absolute', right: -5, top: 0, bottom: 0, width: 18, backgroundColor: 'rgba(219,207,190,0.42)', transform: [{ skewX: '-10deg' }] },
  writingLine: { height: 1.5, marginBottom: 5, borderRadius: 1, backgroundColor: 'transparent' },
  writingLineFilled: { backgroundColor: '#66758A' },
  pen: { position: 'absolute', top: '57%', width: 28, height: 3, borderRadius: 2, backgroundColor: '#4D5660', transform: [{ rotate: '-34deg' }] },
  writingSound: { position: 'absolute', left: '29%', top: '59%', color: '#665746', fontSize: 9, fontWeight: '700', fontStyle: 'italic' },
  celebration: { position: 'absolute', left: 20, right: 20, bottom: 20, minHeight: 176, padding: 16, borderRadius: 21, backgroundColor: 'rgba(246,239,226,0.91)', shadowColor: '#2F271F', shadowOpacity: 0.2, shadowRadius: 13, elevation: 9 },
  celebrationRule: { width: 34, height: 2, marginBottom: 11, backgroundColor: '#82906A' },
  celebrationKicker: { color: '#7C8764', fontSize: 10, fontWeight: '900' },
  celebrationTitle: { marginTop: 6, color: '#352D25', fontSize: 21, fontWeight: '900', letterSpacing: -0.7 },
  celebrationDescription: { marginTop: 7, color: '#776959', fontSize: 10, lineHeight: 16 },
  rewardPreview: { marginTop: 10, flexDirection: 'row', gap: 8 },
  rewardPill: { overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, color: '#FFF9EF', fontSize: 10, fontWeight: '900', backgroundColor: '#765E8B' },
  doneButton: { minHeight: 47, marginTop: 12, borderRadius: 15, backgroundColor: '#675646', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  doneButtonText: { color: '#FFF9EE', fontSize: 13, fontWeight: '900' },
  pressed: { opacity: 0.84 },
});
