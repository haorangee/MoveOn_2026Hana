import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { TutorialRoomScene } from '@/features/onboarding/components/TutorialRoomScene';
import type { CharacterId, PetSpecies } from '@/features/onboarding/onboardingData';

const flowLabels = ['책상', '코딩 선택', '시간 기록', '파란 책', '책장'];

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

  useEffect(() => {
    const timer = setInterval(() => {
      setDemoStep((current) => (current >= flowLabels.length - 1 ? 0 : current + 1));
    }, 1300);
    return () => clearInterval(timer);
  }, []);

  const bookCreated = demoStep >= 3;

  return (
    <View style={styles.container}>
      <TutorialRoomScene
        characterAtDesk={demoStep >= 1 && demoStep < 4}
        characterId={characterId}
        growthLevel={demoStep >= 4 ? 3 : demoStep >= 3 ? 1 : 0}
        highlightedObject={demoStep >= 4 ? 'bookshelf' : 'desk'}
        lighting="afternoon"
        petBehavior={demoStep >= 1 && demoStep < 4 ? 'sleep' : 'follow'}
        petSpecies={petSpecies}
      >
        <View pointerEvents="none" style={styles.heading}>
          <Text style={styles.title}>공부한 시간은 책이 됩니다</Text>
          <Text style={styles.description}>
            무엇을 공부할지 고르면, 사용한 시간이{`\n`}색과 두께가 다른 책으로 쌓여요.
          </Text>
        </View>

        <View pointerEvents="none" style={styles.flow}>
          {flowLabels.map((label, index) => (
            <View key={label} style={styles.flowItem}>
              <View style={[styles.flowDot, index <= demoStep && styles.flowDotActive]} />
              <Text style={[styles.flowText, index === demoStep && styles.flowTextActive]}>
                {label}
              </Text>
            </View>
          ))}
        </View>

        <View pointerEvents="none" style={[styles.book, bookCreated && styles.bookVisible]}>
          <View style={styles.bookBand} />
          <Text style={styles.bookTitle}>코딩 공부</Text>
          <Text style={styles.bookTime}>5초 · 첫 기록</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.rule}>책 색상 = 활동 · 책 두께 = 시간 · 기록 1회 = 책 1권</Text>
          <Pressable
            accessibilityRole="button"
            onPress={onContinue}
            style={({ pressed }) => [styles.button, pressed && styles.pressed]}
          >
            <Text style={styles.buttonText}>이해했어요</Text>
          </Pressable>
        </View>
      </TutorialRoomScene>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heading: { position: 'absolute', left: 24, right: 20, top: '5%' },
  title: { color: '#332B23', fontSize: 25, fontWeight: '900', letterSpacing: -0.8 },
  description: { marginTop: 8, color: '#6D5F4F', fontSize: 12, lineHeight: 19, fontWeight: '600' },
  flow: {
    position: 'absolute',
    left: 22,
    right: 22,
    top: '25%',
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(74,58,43,0.22)',
  },
  flowItem: { alignItems: 'center', gap: 5 },
  flowDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#C6B8A4' },
  flowDotActive: { backgroundColor: '#7189A8' },
  flowText: { color: '#8D7E6C', fontSize: 8, fontWeight: '700' },
  flowTextActive: { color: '#3E526C', fontWeight: '900' },
  book: {
    position: 'absolute',
    right: '19%',
    top: '37%',
    width: 28,
    height: 122,
    borderRadius: 3,
    opacity: 0,
    backgroundColor: '#6D89AA',
    shadowColor: '#1D2A38',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  bookVisible: { opacity: 1 },
  bookBand: { height: 10, marginTop: 14, backgroundColor: '#D8E2EA' },
  bookTitle: { marginTop: 14, color: '#F7FAFC', fontSize: 7, fontWeight: '900', transform: [{ rotate: '90deg' }] },
  bookTime: { position: 'absolute', bottom: 9, left: -12, width: 52, color: '#E5EDF4', fontSize: 5, textAlign: 'center', transform: [{ rotate: '90deg' }] },
  footer: { position: 'absolute', left: 22, right: 22, bottom: 20 },
  rule: { marginBottom: 9, color: '#5B4E40', fontSize: 10, fontWeight: '700', textAlign: 'center' },
  button: { minHeight: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#695848' },
  buttonText: { color: '#FFF9EE', fontSize: 14, fontWeight: '900' },
  pressed: { opacity: 0.86 },
});
