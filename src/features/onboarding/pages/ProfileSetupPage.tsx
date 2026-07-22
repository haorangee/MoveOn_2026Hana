import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  birthDateFromAge,
  createBirthDate,
  getBirthDateParts,
} from '@/features/onboarding/birthDate';
import {
  chapterOptions,
  type OnboardingState,
} from '@/features/onboarding/domain/onboardingState';
import {
  characterOptions,
  getPetOption,
  petOptions,
} from '@/features/onboarding/onboardingData';

const setupCopy = [
  { title: '당신을 어떻게 부르면 될까요?', description: '방과 신문에 사용할 닉네임이에요.' },
  { title: '함께 지낼 친구를 골라주세요', description: '내 방에서 함께 살아갈 펫이에요.' },
  { title: '친구의 이름은 무엇인가요?', description: '매일 다정하게 불러줄 이름을 지어주세요.' },
  { title: '생년월일을 알려주세요', description: '나이에 맞는 편안한 경험을 준비할게요.' },
  { title: '이 방에서 살아갈 나를 골라주세요', description: '꾸미기 기능은 이후에도 바꿀 수 있어요.' },
  { title: '지금 어떤 시간을 보내고 있나요?', description: '추천과 신문 문구에만 가볍게 활용해요.' },
  { title: '새로운 Times를 알려드릴까요?', description: '주간과 월간 신문이 발행될 때만 안내해요.' },
] as const;

type ProfileSetupPageProps = {
  state: OnboardingState;
  update: (patch: Partial<OnboardingState>) => void;
  onDone: () => void;
};

export function ProfileSetupPage({ state, update, onDone }: ProfileSetupPageProps) {
  const initialBirthDate = getBirthDateParts(state.birthDate || birthDateFromAge(20));
  const [birthYear, setBirthYear] = useState(initialBirthDate.year);
  const [birthMonth, setBirthMonth] = useState(initialBirthDate.month);
  const [birthDay, setBirthDay] = useState(initialBirthDate.day);
  const [touched, setTouched] = useState(false);
  const step = state.profileSetupStep;
  const copy = setupCopy[step];
  const selectedPet = getPetOption(state.selectedPetSpecies);
  const birthDate = useMemo(
    () => createBirthDate(birthYear, birthMonth, birthDay),
    [birthDay, birthMonth, birthYear],
  );

  const canContinue = useMemo(() => {
    if (step === 0) return state.nickname.trim().length > 0;
    if (step === 2) return state.petName.trim().length > 0;
    if (step === 3) return birthDate !== null;
    if (step === 6) return state.magazineNotificationEnabled !== null;
    return true;
  }, [birthDate, state.magazineNotificationEnabled, state.nickname, state.petName, step]);

  const handleContinue = () => {
    setTouched(true);
    if (!canContinue) return;

    if (step === 3 && birthDate) update({ birthDate });
    if (step < setupCopy.length - 1) {
      update({ profileSetupStep: step + 1 });
      setTouched(false);
      return;
    }
    onDone();
  };

  return (
    <View style={styles.container}>
      <View style={styles.heading}>
        <Text style={styles.kicker}>기본 설정 · {step + 1} / {setupCopy.length}</Text>
        <Text style={styles.title}>{copy.title}</Text>
        <Text style={styles.description}>{copy.description}</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === 0 ? (
          <View style={styles.centered}>
            <View style={styles.iconCircle}>
              <Ionicons color="#7B8563" name="person-outline" size={28} />
            </View>
            <TextInput
              autoCorrect={false}
              maxLength={10}
              onChangeText={(nickname) => update({ nickname })}
              placeholder="닉네임 입력"
              placeholderTextColor="#AA9F91"
              style={[styles.textInput, touched && !canContinue && styles.inputError]}
              value={state.nickname}
            />
            <Text style={styles.hint}>최대 10자 · 이후 설정에서 변경할 수 있어요.</Text>
          </View>
        ) : null}

        {step === 1 ? (
          <View style={styles.petGrid}>
            {petOptions.map((pet) => {
              const selected = pet.id === state.selectedPetSpecies;
              return (
                <Pressable
                  key={pet.id}
                  accessibilityRole="button"
                  onPress={() => update({ selectedPetSpecies: pet.id })}
                  style={({ pressed }) => [
                    styles.petOption,
                    selected && styles.selectedOption,
                    pressed && styles.pressed,
                  ]}
                >
                  <Image contentFit="contain" source={pet.image} style={styles.petImage} />
                  <View style={styles.petCopy}>
                    <Text style={styles.optionTitle}>{pet.name}</Text>
                    <Text style={styles.optionDescription}>{pet.description}</Text>
                  </View>
                  {selected ? <Ionicons color="#78825F" name="checkmark-circle" size={20} /> : null}
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {step === 2 ? (
          <View style={styles.centered}>
            <Image contentFit="contain" source={selectedPet.image} style={styles.selectedPet} />
            <Text style={styles.petPrompt}>{selectedPet.name}에게 어울리는 이름을 지어주세요.</Text>
            <TextInput
              autoCorrect={false}
              maxLength={10}
              onChangeText={(petName) => update({ petName })}
              placeholder="펫 이름 입력"
              placeholderTextColor="#AA9F91"
              style={[styles.textInput, touched && !canContinue && styles.inputError]}
              value={state.petName}
            />
          </View>
        ) : null}

        {step === 3 ? (
          <View style={styles.centered}>
            <View style={styles.birthDateRow}>
              <DateField label="년" maxLength={4} onChange={setBirthYear} placeholder="YYYY" value={birthYear} />
              <View style={styles.birthDivider} />
              <DateField label="월" maxLength={2} onChange={setBirthMonth} placeholder="MM" value={birthMonth} />
              <View style={styles.birthDivider} />
              <DateField label="일" maxLength={2} onChange={setBirthDay} placeholder="DD" value={birthDay} />
            </View>
            <Text style={[styles.hint, touched && !birthDate && styles.errorText]}>
              {touched && !birthDate ? '올바른 생년월일을 입력해 주세요. (만 8~99세)' : '예: 2005년 03월 21일'}
            </Text>
          </View>
        ) : null}

        {step === 4 ? (
          <ScrollView
            contentContainerStyle={styles.characterRail}
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            {characterOptions.map((character) => {
              const selected = character.id === state.selectedCharacterId;
              return (
                <Pressable
                  key={character.id}
                  accessibilityRole="button"
                  onPress={() => update({ selectedCharacterId: character.id })}
                  style={({ pressed }) => [
                    styles.characterOption,
                    selected && styles.selectedCharacter,
                    pressed && styles.pressed,
                  ]}
                >
                  <Image contentFit="contain" source={character.image} style={styles.characterImage} />
                  <Text style={styles.characterName}>{character.name}</Text>
                  <Text style={styles.characterDescription}>{character.description}</Text>
                  {selected ? <View style={styles.characterCheck}><Text style={styles.characterCheckText}>선택됨</Text></View> : null}
                </Pressable>
              );
            })}
          </ScrollView>
        ) : null}

        {step === 5 ? (
          <View style={styles.optionList}>
            {chapterOptions.map((chapter) => {
              const selected = chapter.id === state.selectedChapter;
              return (
                <Pressable
                  key={chapter.id}
                  accessibilityRole="button"
                  onPress={() => update({ selectedChapter: chapter.id })}
                  style={({ pressed }) => [
                    styles.chapterOption,
                    selected && styles.selectedOption,
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={styles.chapterNumber}><Text style={styles.chapterNumberText}>{chapterOptions.indexOf(chapter) + 1}</Text></View>
                  <View style={styles.chapterCopy}>
                    <Text style={styles.optionTitle}>{chapter.label}</Text>
                    <Text style={styles.optionDescription}>{chapter.description}</Text>
                  </View>
                  {selected ? <Ionicons color="#78825F" name="checkmark" size={19} /> : null}
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {step === 6 ? (
          <View style={styles.notificationOptions}>
            <Pressable
              accessibilityRole="button"
              onPress={() => update({ magazineNotificationEnabled: true })}
              style={({ pressed }) => [
                styles.notificationOption,
                state.magazineNotificationEnabled === true && styles.notificationSelected,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons color="#596247" name="notifications-outline" size={25} />
              <Text style={styles.notificationTitle}>알림 받기</Text>
              <Text style={styles.notificationDescription}>주간·월간 Times가 발행될 때 알려드려요.</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => update({ magazineNotificationEnabled: false })}
              style={({ pressed }) => [
                styles.notificationOption,
                state.magazineNotificationEnabled === false && styles.notificationSelected,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons color="#6D6255" name="time-outline" size={25} />
              <Text style={styles.notificationTitle}>나중에 설정하기</Text>
              <Text style={styles.notificationDescription}>행동을 재촉하는 알림은 보내지 않아요.</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          disabled={!canContinue}
          onPress={handleContinue}
          style={({ pressed }) => [
            styles.button,
            !canContinue && styles.disabled,
            pressed && canContinue && styles.pressed,
          ]}
        >
          <Text style={styles.buttonText}>{step === setupCopy.length - 1 ? '첫 행동 시작하기' : '다음'}</Text>
          <Ionicons color="#FFF9EE" name="arrow-forward" size={17} />
        </Pressable>
      </View>
    </View>
  );
}

type DateFieldProps = {
  label: string;
  maxLength: number;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
};

function DateField({ label, maxLength, onChange, placeholder, value }: DateFieldProps) {
  return (
    <View style={styles.dateField}>
      <TextInput
        keyboardType="number-pad"
        maxLength={maxLength}
        onChangeText={(next) => onChange(next.replace(/\D/g, ''))}
        placeholder={placeholder}
        placeholderTextColor="#A7A08F"
        selectTextOnFocus
        style={styles.dateInput}
        value={value}
      />
      <Text style={styles.dateLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5EFE5' },
  heading: { paddingHorizontal: 24, paddingTop: 14 },
  kicker: { color: '#85906C', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  title: { marginTop: 8, color: '#372E26', fontSize: 25, lineHeight: 32, fontWeight: '900', letterSpacing: -0.8 },
  description: { marginTop: 6, color: '#817363', fontSize: 12, lineHeight: 18 },
  content: { flexGrow: 1, paddingHorizontal: 22, paddingTop: 24, paddingBottom: 14 },
  centered: { alignItems: 'center', paddingTop: 20 },
  iconCircle: { width: 68, height: 68, marginBottom: 22, borderRadius: 34, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E7EBD9' },
  textInput: { width: '100%', height: 60, paddingHorizontal: 18, borderWidth: 1.5, borderColor: '#D5CBBB', borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.72)', color: '#3D332A', fontSize: 19, fontWeight: '800', textAlign: 'center' },
  inputError: { borderColor: '#B98073' },
  hint: { marginTop: 11, color: '#938677', fontSize: 10, textAlign: 'center' },
  errorText: { color: '#AF6F63' },
  petGrid: { gap: 9 },
  petOption: { minHeight: 94, padding: 10, borderWidth: 1.5, borderColor: '#DED5C8', borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.6)', flexDirection: 'row', alignItems: 'center' },
  selectedOption: { borderColor: '#84906A', backgroundColor: '#F4F6EA' },
  petImage: { width: 80, height: 74 },
  petCopy: { flex: 1, paddingHorizontal: 10 },
  optionTitle: { color: '#41372F', fontSize: 14, fontWeight: '900' },
  optionDescription: { marginTop: 4, color: '#8A7C6D', fontSize: 9, lineHeight: 14 },
  selectedPet: { width: 145, height: 145 },
  petPrompt: { marginVertical: 12, color: '#786A5A', fontSize: 11, fontWeight: '700' },
  birthDateRow: { width: '100%', minHeight: 116, paddingHorizontal: 16, borderWidth: 1.5, borderColor: '#D4DCC1', borderRadius: 24, backgroundColor: '#EBEEDF', flexDirection: 'row', alignItems: 'center' },
  birthDivider: { width: 1, height: 48, backgroundColor: '#C9D0B6' },
  dateField: { flex: 1, alignItems: 'center' },
  dateInput: { width: '100%', minHeight: 48, padding: 0, color: '#46503A', fontSize: 26, lineHeight: 34, textAlign: 'center', fontVariant: ['tabular-nums'] },
  dateLabel: { color: '#737D61', fontSize: 10, fontWeight: '900' },
  characterRail: { gap: 10, paddingRight: 20, paddingBottom: 8 },
  characterOption: { width: 168, height: 330, padding: 10, borderWidth: 1.5, borderColor: '#DED4C5', borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.66)', overflow: 'hidden' },
  selectedCharacter: { borderColor: '#7E8B65', backgroundColor: '#F3F5E9' },
  characterImage: { width: '100%', height: 240 },
  characterName: { color: '#40362D', fontSize: 14, fontWeight: '900' },
  characterDescription: { marginTop: 4, color: '#8B7D6F', fontSize: 9 },
  characterCheck: { position: 'absolute', top: 10, right: 10, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 10, backgroundColor: '#788360' },
  characterCheckText: { color: '#FFFFFF', fontSize: 8, fontWeight: '900' },
  optionList: { gap: 10 },
  chapterOption: { minHeight: 72, paddingHorizontal: 14, borderWidth: 1.5, borderColor: '#DDD3C5', borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.65)', flexDirection: 'row', alignItems: 'center' },
  chapterNumber: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E9E2D5' },
  chapterNumberText: { color: '#756758', fontSize: 11, fontWeight: '900' },
  chapterCopy: { flex: 1, paddingHorizontal: 12 },
  notificationOptions: { gap: 12 },
  notificationOption: { minHeight: 126, padding: 17, borderWidth: 1.5, borderColor: '#DDD3C5', borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.65)' },
  notificationSelected: { borderColor: '#829069', backgroundColor: '#F1F4E6' },
  notificationTitle: { marginTop: 10, color: '#40362D', fontSize: 15, fontWeight: '900' },
  notificationDescription: { marginTop: 5, color: '#827566', fontSize: 10, lineHeight: 16 },
  footer: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 18 },
  button: { minHeight: 55, borderRadius: 19, backgroundColor: '#6F7957', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  disabled: { backgroundColor: '#C4BDB1' },
  buttonText: { color: '#FFF9EE', fontSize: 14, fontWeight: '900' },
  pressed: { opacity: 0.84 },
});
