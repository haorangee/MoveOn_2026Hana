import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  TutorialRoomScene,
  type TutorialObjectId,
} from '@/features/onboarding/components/TutorialRoomScene';
import type { CharacterId, PetSpecies } from '@/features/onboarding/onboardingData';

type MoveOnTimesTutorialPageProps = {
  characterId: CharacterId;
  nickname: string;
  petSpecies: PetSpecies;
  onContinue: () => void;
};

export function MoveOnTimesTutorialPage({
  characterId,
  nickname,
  petSpecies,
  onContinue,
}: MoveOnTimesTutorialPageProps) {
  const [opened, setOpened] = useState(false);
  const displayName = nickname.trim() || '박지민';

  const handleObjectPress = (id: TutorialObjectId) => {
    if (id === 'newspaper') setOpened(true);
  };

  return (
    <View style={styles.container}>
      <TutorialRoomScene
        characterActivity="pet"
        characterId={characterId}
        growthLevel={2}
        highlightedObject="newspaper"
        lighting="night"
        message={opened ? undefined : '방 안의 접힌 신문을 눌러 펼쳐보세요.'}
        onObjectPress={handleObjectPress}
        petBehavior="follow"
        petSpecies={petSpecies}
        weather="rain"
      >
        <View pointerEvents="none" style={styles.heading}>
          <Text style={styles.title}>당신의 하루가 뉴스가 됩니다</Text>
          <Text style={styles.description}>
            오늘의 작은 행동은{`\n`}Move On Times에 재미있는 기사로 기록돼요.
          </Text>
        </View>

        {opened ? (
          <View style={styles.paper}>
            <View style={styles.paperHeader}>
              <Text style={styles.masthead}>MOVE ON TIMES</Text>
              <Text style={styles.issue}>DAILY · VOL. 001</Text>
            </View>
            <View style={styles.doubleRule} />
            <Text style={styles.section}>생활면</Text>
            <Text style={styles.headline}>물 한 잔 마신 {displayName},{`\n`}화분 측 “성장 재개”</Text>
            <View style={styles.articleGrid}>
              <View style={styles.photo}>
                <View style={styles.plantStem} />
                <View style={[styles.plantLeaf, styles.leafOne]} />
                <View style={[styles.plantLeaf, styles.leafTwo]} />
              </View>
              <Text style={styles.article}>
                오늘 오후 방 안에서 물 한 잔이 포착됐다. 화분 관계자는 “작은 행동도 충분하다”며 잎을 활짝 폈다.
              </Text>
            </View>
            <View style={styles.paperFooter}>
              <Text style={styles.paperFooterText}>일간 · 주간 · 월간 기록</Text>
              <Text style={styles.paperFooterText}>저장과 공유는 이후 연결</Text>
            </View>
          </View>
        ) : null}

        {opened ? (
          <View style={styles.footer}>
            <Pressable
              accessibilityRole="button"
              onPress={onContinue}
              style={({ pressed }) => [styles.button, pressed && styles.pressed]}
            >
              <Text style={styles.buttonText}>내 정보 설정하기</Text>
            </Pressable>
          </View>
        ) : null}
      </TutorialRoomScene>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heading: { position: 'absolute', left: 24, right: 20, top: '5%' },
  title: { color: '#332B23', fontSize: 24, fontWeight: '900', letterSpacing: -0.9 },
  description: { marginTop: 8, color: '#6D5F4F', fontSize: 12, lineHeight: 19, fontWeight: '600' },
  paper: {
    position: 'absolute',
    left: 24,
    right: 24,
    top: '25%',
    bottom: 88,
    padding: 16,
    borderWidth: 1,
    borderColor: '#41372D',
    backgroundColor: '#EDE4D3',
    transform: [{ rotate: '-0.7deg' }],
    shadowColor: '#2C241D',
    shadowOffset: { width: 3, height: 7 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 8,
  },
  paperHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  masthead: { color: '#171513', fontFamily: 'serif', fontSize: 24, fontWeight: '900', letterSpacing: -1.2 },
  issue: { color: '#25221F', fontSize: 6, fontWeight: '700' },
  doubleRule: { height: 4, marginTop: 5, borderTopWidth: 2, borderBottomWidth: 1, borderColor: '#171513' },
  section: { marginTop: 12, color: '#171513', fontSize: 9, fontWeight: '900' },
  headline: { marginTop: 5, color: '#171513', fontFamily: 'serif', fontSize: 20, lineHeight: 27, fontWeight: '900', letterSpacing: -0.6 },
  articleGrid: { flex: 1, minHeight: 120, marginTop: 12, flexDirection: 'row', gap: 12 },
  photo: { width: '42%', overflow: 'hidden', borderWidth: 1, borderColor: '#302A24', backgroundColor: '#BDB6A8' },
  plantStem: { position: 'absolute', left: '49%', bottom: 12, width: 2, height: '55%', backgroundColor: '#4E4C43' },
  plantLeaf: { position: 'absolute', width: 34, height: 17, borderRadius: 20, backgroundColor: '#696A5E' },
  leafOne: { left: '25%', top: '32%', transform: [{ rotate: '24deg' }] },
  leafTwo: { right: '19%', top: '45%', transform: [{ rotate: '-30deg' }] },
  article: { flex: 1, color: '#27231F', fontFamily: 'serif', fontSize: 10, lineHeight: 17 },
  paperFooter: { paddingTop: 8, borderTopWidth: 1, borderColor: '#302A24', flexDirection: 'row', justifyContent: 'space-between' },
  paperFooterText: { color: '#2B2723', fontSize: 6, fontWeight: '700' },
  footer: { position: 'absolute', left: 24, right: 24, bottom: 20 },
  button: { minHeight: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#44392F' },
  buttonText: { color: '#FFF9EE', fontSize: 14, fontWeight: '900' },
  pressed: { opacity: 0.84 },
});
