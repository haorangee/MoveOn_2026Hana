import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { TutorialRoomScene } from '@/features/onboarding/components/TutorialRoomScene';
import type { CharacterId, PetSpecies } from '@/features/onboarding/onboardingData';

type WelcomePageProps = {
  characterId: CharacterId;
  petSpecies: PetSpecies;
  onStart: () => void;
};

export function WelcomePage({ characterId, petSpecies, onStart }: WelcomePageProps) {
  return (
    <View style={styles.container}>
      <TutorialRoomScene
        characterActivity="auto"
        characterId={characterId}
        lighting="morning"
        petBehavior="follow"
        petSpecies={petSpecies}
      >
        <View style={styles.copy}>
          <Text style={styles.eyebrow}>MOVEON · LIFE SIMULATION</Text>
          <Text style={styles.title}>작은 행동 하나가{`\n`}당신의 세상을 바꿉니다.</Text>
          <Text style={styles.description}>
            공부하고, 씻고, 방을 정리하면{`\n`}당신의 방과 이야기가 함께 자라나요.
          </Text>
        </View>
        <View style={styles.footer}>
          <Pressable
            accessibilityRole="button"
            onPress={onStart}
            style={({ pressed }) => [styles.button, pressed && styles.pressed]}
          >
            <Text style={styles.buttonText}>시작하기</Text>
            <Ionicons color="#FFF9EE" name="arrow-forward" size={18} />
          </Pressable>
        </View>
      </TutorialRoomScene>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  copy: { position: 'absolute', left: 25, right: 22, top: '7%' },
  eyebrow: { color: '#817158', fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
  title: {
    marginTop: 10,
    color: '#33291F',
    fontSize: 29,
    lineHeight: 38,
    fontWeight: '900',
    letterSpacing: -1,
    textShadowColor: 'rgba(255,250,240,0.85)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  description: {
    marginTop: 12,
    color: '#655747',
    fontSize: 13,
    lineHeight: 21,
    fontWeight: '600',
  },
  footer: { position: 'absolute', left: 24, right: 24, bottom: 24 },
  button: {
    minHeight: 58,
    borderRadius: 20,
    backgroundColor: '#695848',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#392E23',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonText: { color: '#FFF9EE', fontSize: 15, fontWeight: '900' },
  pressed: { transform: [{ scale: 0.98 }], opacity: 0.92 },
});
