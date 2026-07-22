import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  TutorialRoomScene,
  type TutorialObjectId,
} from '@/features/onboarding/components/TutorialRoomScene';
import type { CharacterId, PetSpecies } from '@/features/onboarding/onboardingData';

const objectOrder: TutorialObjectId[] = [
  'desk',
  'bookshelf',
  'plant',
  'bathroom',
  'bed',
  'newspaper',
];

const messages: Record<TutorialObjectId, string> = {
  desk: '책상을 한번 눌러볼까요?  공부를 시작하는 실제 책상이에요.',
  bookshelf: '책장에는 공부 기록과 누적 시간이 책으로 쌓여요.',
  plant: '화분을 누르면 물 마시기를 기록할 수 있어요.',
  bathroom: '욕실 문을 누르면 샤워를 시작해요.',
  bed: '침대는 오늘의 에너지를 편안히 내려놓는 곳이에요.',
  newspaper: '신문을 누르면 Move On Times가 펼쳐져요.',
};

type RoomTutorialPageProps = {
  characterId: CharacterId;
  petSpecies: PetSpecies;
  onDeskPress: () => void;
};

export function RoomTutorialPage({
  characterId,
  petSpecies,
  onDeskPress,
}: RoomTutorialPageProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeObject = objectOrder[activeIndex];

  useEffect(() => {
    const cycle = setInterval(() => {
      setActiveIndex((current) => (current + 1) % objectOrder.length);
    }, 1800);
    return () => clearInterval(cycle);
  }, []);

  const handleObjectPress = (id: TutorialObjectId) => {
    if (id === 'desk') {
      onDeskPress();
      return;
    }
    setActiveIndex(objectOrder.indexOf(id));
  };

  return (
    <View style={styles.container}>
      <TutorialRoomScene
        characterActivity="auto"
        characterId={characterId}
        highlightedObject={activeObject}
        lighting={activeIndex < 2 ? 'morning' : activeIndex < 4 ? 'afternoon' : 'night'}
        message={messages[activeObject]}
        onObjectPress={handleObjectPress}
        petBehavior="follow"
        petSpecies={petSpecies}
        weather={activeObject === 'newspaper' ? 'rain' : 'clear'}
      >
        <View pointerEvents="none" style={styles.heading}>
          <Text style={styles.title}>방 안을 둘러보세요</Text>
          <Text style={styles.description}>
            방 안의 물건을 누르면{`\n`}각각의 행동을 시작할 수 있어요.
          </Text>
        </View>
      </TutorialRoomScene>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heading: { position: 'absolute', left: 24, right: 20, top: '6%' },
  title: { color: '#332B23', fontSize: 27, fontWeight: '900', letterSpacing: -0.8 },
  description: { marginTop: 8, color: '#6D5F4F', fontSize: 13, lineHeight: 20, fontWeight: '600' },
});
