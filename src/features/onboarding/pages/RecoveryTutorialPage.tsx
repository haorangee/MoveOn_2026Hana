import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  TutorialRoomScene,
  type TutorialObjectId,
} from '@/features/onboarding/components/TutorialRoomScene';
import type { CharacterId, PetSpecies } from '@/features/onboarding/onboardingData';

type RecoveryAction = 'shower' | 'clean' | 'water';

const actions: Array<{
  id: RecoveryAction;
  label: string;
  before: string;
  after: string;
  object: TutorialObjectId;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  {
    id: 'shower',
    label: '샤워',
    before: '조금 흐트러진 하루',
    after: '캐릭터가 개운하고 편안해졌어요.',
    object: 'bathroom',
    icon: 'water-outline',
  },
  {
    id: 'clean',
    label: '방청소',
    before: '물건이 살짝 흐트러진 방',
    after: '공간이 다시 편안하게 정돈됐어요.',
    object: 'bed',
    icon: 'sparkles-outline',
  },
  {
    id: 'water',
    label: '물 마시기',
    before: '잎이 잠시 쉬고 있는 화분',
    after: '물을 마시면 화분도 함께 자라요.',
    object: 'plant',
    icon: 'leaf-outline',
  },
];

type RecoveryTutorialPageProps = {
  characterId: CharacterId;
  petSpecies: PetSpecies;
  onContinue: () => void;
};

export function RecoveryTutorialPage({
  characterId,
  petSpecies,
  onContinue,
}: RecoveryTutorialPageProps) {
  const [selected, setSelected] = useState<RecoveryAction>('shower');
  const [completed, setCompleted] = useState<RecoveryAction[]>([]);
  const action = actions.find((item) => item.id === selected) ?? actions[0];
  const isCompleted = completed.includes(selected);

  const handleAction = (id: RecoveryAction) => {
    setSelected(id);
    setCompleted((current) => current.includes(id) ? current : [...current, id]);
  };

  return (
    <View style={styles.container}>
      <TutorialRoomScene
        characterActivity={selected === 'water' ? 'plant' : selected === 'clean' ? 'bookshelf' : 'center'}
        characterId={characterId}
        cleaned={completed.includes('clean')}
        growthLevel={completed.includes('water') ? 2 : completed.length > 0 ? 1 : 0}
        highlightedObject={action.object}
        lighting="afternoon"
        petBehavior="follow"
        petSpecies={petSpecies}
      >
        <View pointerEvents="none" style={styles.heading}>
          <Text style={styles.title}>작은 행동도 성장입니다</Text>
          <Text style={styles.description}>
            행동을 하나 눌러 보세요.{`\n`}작은 행동을 했을 때만 좋은 변화가 나타나요.
          </Text>
        </View>

        <View style={styles.actionRow}>
          {actions.map((item) => {
            const active = item.id === selected;
            const done = completed.includes(item.id);
            return (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                onPress={() => handleAction(item.id)}
                style={({ pressed }) => [
                  styles.action,
                  active && styles.actionActive,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons color={active ? '#FFF9EF' : '#625545'} name={item.icon} size={18} />
                <Text style={[styles.actionText, active && styles.actionTextActive]}>{item.label}</Text>
                {done ? <View style={styles.doneDot} /> : null}
              </Pressable>
            );
          })}
        </View>

        <View pointerEvents="none" style={styles.changeCopy}>
          <Text style={styles.before}>{isCompleted ? action.before : '행동 전 · ' + action.before}</Text>
          <View style={styles.divider} />
          <Text style={styles.after}>
            {isCompleted ? action.after : '위의 행동을 눌러 변화를 확인해 보세요.'}
          </Text>
        </View>

        <View style={styles.footer}>
          <Pressable
            accessibilityRole="button"
            onPress={onContinue}
            style={({ pressed }) => [styles.button, pressed && styles.pressed]}
          >
            <Text style={styles.buttonText}>다음</Text>
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
  actionRow: { position: 'absolute', left: 20, right: 20, top: '24%', flexDirection: 'row', gap: 8 },
  action: {
    flex: 1,
    minHeight: 66,
    borderWidth: 1,
    borderColor: 'rgba(95,77,58,0.24)',
    borderRadius: 16,
    backgroundColor: 'rgba(255,251,242,0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  actionActive: { borderColor: '#6F7659', backgroundColor: '#6F7659' },
  actionText: { color: '#625545', fontSize: 10, fontWeight: '800' },
  actionTextActive: { color: '#FFF9EF' },
  doneDot: { position: 'absolute', right: 8, top: 8, width: 5, height: 5, borderRadius: 3, backgroundColor: '#D9C48E' },
  changeCopy: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 93,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderLeftWidth: 2,
    borderColor: '#8C9572',
    backgroundColor: 'rgba(255,252,245,0.86)',
  },
  before: { color: '#817362', fontSize: 9, fontWeight: '700' },
  divider: { height: 1, marginVertical: 7, backgroundColor: 'rgba(88,72,55,0.13)' },
  after: { color: '#463B30', fontSize: 11, lineHeight: 17, fontWeight: '800' },
  footer: { position: 'absolute', left: 22, right: 22, bottom: 20 },
  button: { minHeight: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#695848' },
  buttonText: { color: '#FFF9EE', fontSize: 14, fontWeight: '900' },
  pressed: { opacity: 0.84 },
});
