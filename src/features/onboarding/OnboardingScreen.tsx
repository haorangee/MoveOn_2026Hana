import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  characterOptions,
  type CharacterId,
  petOptions,
  type PetSpecies,
} from '@/features/onboarding/onboardingData';
import { useOnboarding } from '@/features/onboarding/OnboardingProvider';

const steps = [
  { title: '이름을 알려주세요', subtitle: '방과 기록에 사용할 이름이에요.' },
  { title: '함께 지낼 친구는?', subtitle: '내 방에서 함께 살아갈 펫 종을 골라주세요.' },
  { title: '나이를 알려주세요', subtitle: '나이에 맞는 편안한 경험을 준비할게요.' },
  { title: '나의 모습을 골라주세요', subtitle: '초기 캐릭터는 나중에 설정에서 바꿀 수 있어요.' },
] as const;

export function OnboardingScreen() {
  const router = useRouter();
  const { completeOnboarding, profile } = useOnboarding();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(profile.name);
  const [age, setAge] = useState(profile.age);
  const [petSpecies, setPetSpecies] = useState<PetSpecies>(profile.petSpecies);
  const [characterId, setCharacterId] = useState<CharacterId>(profile.characterId);
  const [nameTouched, setNameTouched] = useState(false);

  const canContinue = useMemo(() => {
    if (step === 0) return name.trim().length >= 1;
    return true;
  }, [name, step]);

  const handleContinue = async () => {
    if (step === 0 && !canContinue) {
      setNameTouched(true);
      return;
    }

    if (step < steps.length - 1) {
      setStep((current) => current + 1);
      return;
    }

    await completeOnboarding({
      name: name.trim(),
      age,
      petSpecies,
      characterId,
    });
    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <SafeAreaView style={styles.safe}>
        <View style={styles.decorOne} />
        <View style={styles.decorTwo} />

        <View style={styles.topBar}>
          {step > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="이전 단계"
              onPress={() => setStep((current) => current - 1)}
              style={styles.backButton}
            >
              <Ionicons name="chevron-back" size={22} color="#4D443A" />
            </Pressable>
          ) : (
            <View style={styles.backPlaceholder} />
          )}
          <View style={styles.brandRow}>
            <Ionicons name="leaf" size={15} color="#819061" />
            <Text style={styles.brand}>MoveOn</Text>
          </View>
          <Text style={styles.stepCount}>{step + 1} / {steps.length}</Text>
        </View>

        <View style={styles.progressTrack}>
          <View
            style={[styles.progressFill, { width: `${((step + 1) / steps.length) * 100}%` }]}
          />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heading}>
            <Text style={styles.kicker}>내 방에서 살아가는 나의 모습</Text>
            <Text style={styles.title}>{steps[step].title}</Text>
            <Text style={styles.subtitle}>{steps[step].subtitle}</Text>
          </View>

          {step === 0 ? (
            <View style={styles.nameStep}>
              <View style={styles.nameIcon}>
                <Ionicons name="person-outline" size={28} color="#7B8563" />
              </View>
              <TextInput
                autoFocus
                autoCorrect={false}
                maxLength={12}
                onBlur={() => setNameTouched(true)}
                onChangeText={setName}
                placeholder="이름 입력"
                placeholderTextColor="#B5AA9B"
                returnKeyType="next"
                style={[styles.nameInput, nameTouched && !canContinue && styles.inputError]}
                value={name}
              />
              <Text style={styles.fieldHint}>
                {nameTouched && !canContinue
                  ? '이름을 한 글자 이상 입력해 주세요.'
                  : '한글과 영문 모두 사용할 수 있어요.'}
              </Text>
            </View>
          ) : null}

          {step === 1 ? (
            <View style={styles.petGrid}>
              {petOptions.map((pet) => {
                const selected = pet.id === petSpecies;
                return (
                  <Pressable
                    key={pet.id}
                    accessibilityRole="button"
                    accessibilityLabel={`${pet.name} 선택`}
                    onPress={() => setPetSpecies(pet.id)}
                    style={[styles.petCard, selected && styles.selectedCard]}
                  >
                    <View style={styles.petImageWrap}>
                      <Image contentFit="contain" source={pet.image} style={styles.petImage} />
                    </View>
                    <Text style={styles.petName}>{pet.name}</Text>
                    <Text style={styles.petDescription}>{pet.description}</Text>
                    {selected ? (
                      <View style={styles.checkBadge}>
                        <Ionicons name="checkmark" size={15} color="#FFFFFF" />
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          {step === 2 ? (
            <View style={styles.ageStep}>
              <View style={styles.ageControl}>
                <Pressable
                  accessibilityLabel="나이 줄이기"
                  accessibilityRole="button"
                  disabled={age <= 8}
                  onPress={() => setAge((current) => Math.max(8, current - 1))}
                  style={({ pressed }) => [styles.ageButton, pressed && styles.pressed]}
                >
                  <Ionicons name="remove" size={26} color="#655B50" />
                </Pressable>
                <View style={styles.ageValueWrap}>
                  <Text style={styles.ageValue}>{age}</Text>
                  <Text style={styles.ageUnit}>세</Text>
                </View>
                <Pressable
                  accessibilityLabel="나이 늘리기"
                  accessibilityRole="button"
                  disabled={age >= 99}
                  onPress={() => setAge((current) => Math.min(99, current + 1))}
                  style={({ pressed }) => [styles.ageButton, pressed && styles.pressed]}
                >
                  <Ionicons name="add" size={26} color="#655B50" />
                </Pressable>
              </View>
              <View style={styles.privacyNote}>
                <Ionicons name="lock-closed-outline" size={15} color="#8E806F" />
                <Text style={styles.privacyText}>나이는 프로필 경험에만 사용돼요.</Text>
              </View>
            </View>
          ) : null}

          {step === 3 ? (
            <ScrollView
              contentContainerStyle={styles.characterRail}
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              {characterOptions.map((character, index) => {
                const selected = character.id === characterId;
                return (
                  <Pressable
                    key={character.id}
                    accessibilityRole="button"
                    accessibilityLabel={`${character.name} 선택`}
                    onPress={() => setCharacterId(character.id)}
                    style={[styles.characterCard, selected && styles.selectedCharacterCard]}
                  >
                    <View style={styles.characterNumber}>
                      <Text style={styles.characterNumberText}>0{index + 1}</Text>
                    </View>
                    <Image
                      contentFit="contain"
                      source={character.image}
                      style={styles.characterImage}
                    />
                    <Text style={styles.characterName}>{character.name}</Text>
                    <Text style={styles.characterDescription}>{character.description}</Text>
                    {selected ? (
                      <View style={styles.selectedLabel}>
                        <Ionicons name="checkmark-circle" size={15} color="#74805B" />
                        <Text style={styles.selectedLabelText}>선택됨</Text>
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            accessibilityRole="button"
            disabled={!canContinue}
            onPress={() => void handleContinue()}
            style={({ pressed }) => [
              styles.continueButton,
              !canContinue && styles.continueDisabled,
              pressed && canContinue && styles.continuePressed,
            ]}
          >
            <Text style={styles.continueText}>
              {step === steps.length - 1 ? '내 방으로 들어가기' : '다음'}
            </Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFDF7" />
          </Pressable>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F1E7' },
  safe: { flex: 1, overflow: 'hidden' },
  decorOne: { position: 'absolute', top: -80, right: -90, width: 230, height: 230, borderRadius: 120, backgroundColor: '#EEF0DF' },
  decorTwo: { position: 'absolute', bottom: 20, left: -100, width: 210, height: 210, borderRadius: 110, backgroundColor: '#F2E5D8' },
  topBar: { height: 58, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.74)' },
  backPlaceholder: { width: 38 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  brand: { color: '#40362C', fontSize: 18, fontWeight: '900' },
  stepCount: { width: 38, color: '#827566', fontSize: 11, fontWeight: '800', textAlign: 'right' },
  progressTrack: { height: 3, marginHorizontal: 20, borderRadius: 2, backgroundColor: '#E4DCCD', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2, backgroundColor: '#829069' },
  scrollContent: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 35, paddingBottom: 22 },
  heading: { marginBottom: 30 },
  kicker: { color: '#87906F', fontSize: 11, fontWeight: '800', letterSpacing: 0.4 },
  title: { marginTop: 8, color: '#392F27', fontSize: 28, lineHeight: 36, fontWeight: '900', letterSpacing: -0.8 },
  subtitle: { marginTop: 9, color: '#817365', fontSize: 13, lineHeight: 20 },
  nameStep: { alignItems: 'center', paddingTop: 22 },
  nameIcon: { width: 70, height: 70, marginBottom: 25, borderRadius: 35, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E7EBD8' },
  nameInput: { width: '100%', height: 62, paddingHorizontal: 18, borderRadius: 18, borderWidth: 1.5, borderColor: '#D8CEBE', backgroundColor: 'rgba(255,255,255,0.78)', color: '#3C332A', fontSize: 19, fontWeight: '800', textAlign: 'center' },
  inputError: { borderColor: '#B98576' },
  fieldHint: { marginTop: 11, color: '#9A8D7D', fontSize: 11 },
  petGrid: { gap: 11 },
  petCard: { minHeight: 128, padding: 14, borderRadius: 22, borderWidth: 1.5, borderColor: '#E2D9CC', backgroundColor: 'rgba(255,255,255,0.72)', flexDirection: 'row', alignItems: 'center' },
  selectedCard: { borderColor: '#85926B', backgroundColor: '#F5F7EC' },
  petImageWrap: { width: 100, height: 96, marginRight: 16, borderRadius: 18, backgroundColor: '#F1EBE1', overflow: 'hidden' },
  petImage: { width: '100%', height: '100%' },
  petName: { position: 'absolute', left: 130, top: 35, color: '#41372F', fontSize: 17, fontWeight: '900' },
  petDescription: { position: 'absolute', left: 130, right: 35, top: 63, color: '#8A7C6D', fontSize: 11, lineHeight: 17 },
  checkBadge: { position: 'absolute', top: 12, right: 12, width: 27, height: 27, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#829069' },
  ageStep: { alignItems: 'center', paddingTop: 52 },
  ageControl: { flexDirection: 'row', alignItems: 'center', gap: 24 },
  ageButton: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.85)', borderWidth: 1, borderColor: '#DDD3C5' },
  ageValueWrap: { width: 116, height: 116, borderRadius: 58, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', backgroundColor: '#E8ECD9', borderWidth: 1, borderColor: '#D0D8BA' },
  ageValue: { color: '#46503A', fontSize: 48, fontWeight: '300', fontVariant: ['tabular-nums'] },
  ageUnit: { marginLeft: 3, color: '#6E795A', fontSize: 15, fontWeight: '800' },
  privacyNote: { marginTop: 29, paddingHorizontal: 15, paddingVertical: 10, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.6)', flexDirection: 'row', alignItems: 'center', gap: 7 },
  privacyText: { color: '#8B7F72', fontSize: 11 },
  characterRail: { gap: 12, paddingRight: 20, paddingBottom: 8 },
  characterCard: { width: 174, height: 365, padding: 12, borderRadius: 24, borderWidth: 1.5, borderColor: '#E1D7C8', backgroundColor: 'rgba(255,255,255,0.76)', overflow: 'hidden' },
  selectedCharacterCard: { borderColor: '#7F8D66', backgroundColor: '#F5F7EC' },
  characterNumber: { position: 'absolute', top: 12, left: 12, zIndex: 2, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: '#B78B5E' },
  characterNumberText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },
  characterImage: { width: '100%', height: 255 },
  characterName: { marginTop: 3, color: '#40362D', fontSize: 15, fontWeight: '900' },
  characterDescription: { marginTop: 5, color: '#8B7D6F', fontSize: 10, lineHeight: 15 },
  selectedLabel: { position: 'absolute', right: 12, bottom: 12, flexDirection: 'row', alignItems: 'center', gap: 4 },
  selectedLabelText: { color: '#74805B', fontSize: 10, fontWeight: '800' },
  footer: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 12 },
  continueButton: { minHeight: 56, borderRadius: 19, backgroundColor: '#75805D', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: '#4A4034', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.16, shadowRadius: 10, elevation: 5 },
  continueDisabled: { backgroundColor: '#C9C3B8', shadowOpacity: 0 },
  continuePressed: { opacity: 0.9, transform: [{ scale: 0.988 }] },
  continueText: { color: '#FFFDF7', fontSize: 15, fontWeight: '900' },
  pressed: { opacity: 0.78, transform: [{ scale: 0.94 }] },
});
