import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { type Href, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  DEFAULT_MVP_CHARACTER_ID,
  getMvpCharacterCatalogItem,
  isMvpCharacterId,
  MVP_CHARACTER_CATALOG,
} from '@/features/customization/catalogs/characterCatalog';
import {
  DEFAULT_MVP_PET_ID,
  getDefaultMvpPetIdBySpecies,
  getMvpPetCatalogItem,
  isMvpPetId,
  isMvpPetSpecies,
  MVP_PET_CATALOG,
} from '@/features/customization/catalogs/petCatalog';
import type {
  MvpCharacterGender,
  MvpCharacterId,
  MvpPetId,
  MvpPetSpecies,
} from '@/features/customization/types/customization';
import { useOnboarding } from '@/features/onboarding/OnboardingProvider';

const PET_NAME_MAX_LENGTH = 10;

type PetFilter = 'all' | 'dog' | 'cat' | 'small';

const CHARACTER_TABS: Array<{ label: string; value: MvpCharacterGender }> = [
  { label: '여자', value: 'female' },
  { label: '남자', value: 'male' },
];

const PET_FILTERS: Array<{ label: string; value: PetFilter }> = [
  { label: '전체', value: 'all' },
  { label: '강아지', value: 'dog' },
  { label: '고양이', value: 'cat' },
  { label: '소동물', value: 'small' },
];

function normalizeInitialCharacterId(value: unknown): MvpCharacterId {
  return isMvpCharacterId(value) ? value : DEFAULT_MVP_CHARACTER_ID;
}

function normalizeInitialPetId(petId: unknown, petSpecies: unknown): MvpPetId {
  return isMvpPetId(petId) ? petId : getDefaultMvpPetIdBySpecies(petSpecies);
}

function isPetVisible(filter: PetFilter, species: MvpPetSpecies) {
  if (filter === 'all') return true;
  if (filter === 'small') return species === 'hamster' || species === 'squirrel';
  return species === filter;
}

export function ProfileCustomizeScreen() {
  const router = useRouter();
  const { profile, updateProfileCustomization } = useOnboarding();

  const initialCharacterId = normalizeInitialCharacterId(profile.characterId);
  const initialPetId = normalizeInitialPetId(profile.petId, profile.petSpecies);
  const initialPet = getMvpPetCatalogItem(initialPetId, profile.petSpecies);
  const initialPetName = (profile.petName || '').trim();

  const [characterGender, setCharacterGender] = useState<MvpCharacterGender>(
    getMvpCharacterCatalogItem(initialCharacterId).gender,
  );
  const [draftCharacterId, setDraftCharacterId] = useState<MvpCharacterId>(initialCharacterId);
  const [petFilter, setPetFilter] = useState<PetFilter>('all');
  const [draftPetId, setDraftPetId] = useState<MvpPetId>(initialPet.id);
  const [draftPetName, setDraftPetName] = useState(initialPetName);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const draftPet = getMvpPetCatalogItem(draftPetId, profile.petSpecies);
  const draftCharacter = getMvpCharacterCatalogItem(draftCharacterId);
  const trimmedPetName = draftPetName.trim();

  const filteredCharacters = useMemo(() => (
    MVP_CHARACTER_CATALOG.filter((item) => item.gender === characterGender)
  ), [characterGender]);

  const filteredPets = useMemo(() => (
    MVP_PET_CATALOG.filter((item) => isPetVisible(petFilter, item.species))
  ), [petFilter]);

  const hasChanges = draftCharacterId !== initialCharacterId
    || draftPetId !== initialPetId
    || trimmedPetName !== initialPetName;

  const canSave = hasChanges
    && trimmedPetName.length > 0
    && trimmedPetName.length <= PET_NAME_MAX_LENGTH
    && !isSaving;

  const handleBack = () => {
    if (!hasChanges) {
      router.back();
      return;
    }

    Alert.alert(
      '변경사항을 버릴까요?',
      '저장하지 않은 캐릭터와 펫 변경사항이 있어요.',
      [
        { text: '계속 꾸미기', style: 'cancel' },
        { text: '나가기', style: 'destructive', onPress: () => router.back() },
      ],
    );
  };

  const handleSelectPet = (petId: MvpPetId) => {
    const pet = getMvpPetCatalogItem(petId);
    if (!isMvpPetSpecies(pet.species)) return;
    setDraftPetId(pet.id);
    setPetFilter((current) => (
      current === 'all' || isPetVisible(current, pet.species) ? current : 'all'
    ));
  };

  const handleSave = async () => {
    if (!canSave) return;

    setIsSaving(true);
    setErrorMessage(null);

    try {
      await updateProfileCustomization({
        characterId: draftCharacterId,
        petId: draftPet.id,
        petSpecies: draftPet.species,
        petName: trimmedPetName,
      });

      router.replace('/' as Href);
    } catch (error) {
      if (__DEV__) {
        console.warn('[ProfileCustomizeScreen] Failed to save customization.', error);
      }
      setErrorMessage('저장에 실패했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="뒤로 가기"
          accessibilityRole="button"
          onPress={handleBack}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <Ionicons color="#3D342B" name="chevron-back" size={24} />
        </Pressable>
        <Text style={styles.headerTitle}>캐릭터와 펫 꾸미기</Text>
        <View style={styles.headerSide} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.previewCard}>
          <View style={styles.previewGlow} />
          <Image contentFit="contain" source={draftCharacter.source} style={styles.previewCharacter} />
          <Image contentFit="contain" source={draftPet.source} style={styles.previewPet} />
          <View style={styles.previewCopy}>
            <Text style={styles.previewKicker}>MY ROOM FRIENDS</Text>
            <Text style={styles.previewTitle}>{profile.name || '나'}의 방</Text>
            <Text style={styles.previewDescription}>
              {trimmedPetName || '펫 이름'}와 함께 오늘도 작은 행동을 쌓아가요.
            </Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>캐릭터 선택</Text>
          <Text style={styles.sectionMeta}>남자 10종 · 여자 10종</Text>
        </View>
        <View style={styles.tabRow}>
          {CHARACTER_TABS.map((tab) => {
            const selected = characterGender === tab.value;
            return (
              <Pressable
                accessibilityRole="button"
                key={tab.value}
                onPress={() => setCharacterGender(tab.value)}
                style={({ pressed }) => [
                  styles.tab,
                  selected && styles.tabSelected,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.tabText, selected && styles.tabTextSelected]}>{tab.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.grid}>
          {filteredCharacters.map((item, index) => {
            const selected = draftCharacterId === item.id;
            return (
              <Pressable
                accessibilityRole="button"
                key={item.id}
                onPress={() => setDraftCharacterId(item.id)}
                style={({ pressed }) => [
                  styles.characterCard,
                  selected && styles.selectedCard,
                  pressed && styles.pressed,
                ]}
              >
                <Image contentFit="contain" source={item.source} style={styles.characterImage} />
                <Text style={styles.cardLabel}>캐릭터 {index + 1}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>펫 선택</Text>
          <Text style={styles.sectionMeta}>강아지 3 · 고양이 3 · 소동물 2</Text>
        </View>
        <View style={styles.tabRow}>
          {PET_FILTERS.map((tab) => {
            const selected = petFilter === tab.value;
            return (
              <Pressable
                accessibilityRole="button"
                key={tab.value}
                onPress={() => setPetFilter(tab.value)}
                style={({ pressed }) => [
                  styles.tab,
                  selected && styles.tabSelected,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.tabText, selected && styles.tabTextSelected]}>{tab.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.grid}>
          {filteredPets.map((item) => {
            const selected = draftPetId === item.id;
            return (
              <Pressable
                accessibilityRole="button"
                key={item.id}
                onPress={() => handleSelectPet(item.id)}
                style={({ pressed }) => [
                  styles.petCard,
                  selected && styles.selectedCard,
                  pressed && styles.pressed,
                ]}
              >
                <Image contentFit="contain" source={item.source} style={styles.petImage} />
                <Text style={styles.cardLabel}>{item.displayName}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.nameCard}>
          <Text style={styles.nameLabel}>펫 이름</Text>
          <TextInput
            maxLength={PET_NAME_MAX_LENGTH}
            onChangeText={setDraftPetName}
            placeholder="예: 마루"
            placeholderTextColor="#B4A796"
            style={styles.nameInput}
            value={draftPetName}
          />
          <Text style={styles.nameCounter}>
            {trimmedPetName.length}/{PET_NAME_MAX_LENGTH}
          </Text>
        </View>

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          disabled={!canSave}
          onPress={() => void handleSave()}
          style={({ pressed }) => [
            styles.saveButton,
            !canSave && styles.saveButtonDisabled,
            pressed && canSave && styles.pressed,
          ]}
        >
          {isSaving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.saveText}>저장하기</Text>
              <Ionicons color="#FFFFFF" name="checkmark" size={20} />
            </>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5EFE5' },
  header: {
    height: 62,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.74)',
  },
  headerTitle: { color: '#3D342B', fontSize: 17, fontWeight: '900' },
  headerSide: { width: 42 },
  content: {
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    paddingHorizontal: 22,
    paddingBottom: 112,
  },
  previewCard: {
    minHeight: 228,
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: '#E8DCC8',
    borderWidth: 1,
    borderColor: 'rgba(113, 96, 71, 0.18)',
  },
  previewGlow: {
    position: 'absolute',
    right: -54,
    top: -70,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(255,255,255,0.42)',
  },
  previewCharacter: {
    position: 'absolute',
    left: 18,
    bottom: 6,
    width: 172,
    height: 172,
  },
  previewPet: {
    position: 'absolute',
    left: 154,
    bottom: 22,
    width: 86,
    height: 86,
  },
  previewCopy: {
    marginLeft: 224,
    paddingTop: 42,
    paddingRight: 22,
  },
  previewKicker: { color: '#7C8965', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  previewTitle: { marginTop: 10, color: '#3D342B', fontSize: 23, fontWeight: '900' },
  previewDescription: { marginTop: 10, color: '#6F6256', fontSize: 12, lineHeight: 19 },
  sectionHeader: {
    marginTop: 28,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionTitle: { color: '#3D342B', fontSize: 18, fontWeight: '900' },
  sectionMeta: { color: '#8F8171', fontSize: 10, fontWeight: '800' },
  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  tab: {
    minHeight: 39,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.62)',
    borderWidth: 1,
    borderColor: '#DDD1BF',
  },
  tabSelected: {
    backgroundColor: '#7F8F63',
    borderColor: '#7F8F63',
  },
  tabText: { color: '#6F6256', fontSize: 12, fontWeight: '900' },
  tabTextSelected: { color: '#FFFFFF' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  characterCard: {
    width: '31.4%',
    minHeight: 142,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0D3C1',
    backgroundColor: 'rgba(255,255,255,0.68)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  selectedCard: {
    borderColor: '#7F8F63',
    backgroundColor: '#EEF2E4',
  },
  characterImage: { width: '100%', height: 104 },
  petCard: {
    width: '31.4%',
    minHeight: 122,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0D3C1',
    backgroundColor: 'rgba(255,255,255,0.68)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  petImage: { width: '100%', height: 78 },
  cardLabel: { marginTop: 7, color: '#4A4036', fontSize: 10, fontWeight: '900' },
  nameCard: {
    marginTop: 26,
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#DED2C0',
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  nameLabel: { color: '#5B5046', fontSize: 12, fontWeight: '900' },
  nameInput: {
    marginTop: 10,
    height: 52,
    borderRadius: 18,
    paddingHorizontal: 16,
    backgroundColor: '#FFFDF8',
    borderWidth: 1,
    borderColor: '#DFD2C1',
    color: '#3D342B',
    fontSize: 17,
    fontWeight: '800',
  },
  nameCounter: { marginTop: 8, alignSelf: 'flex-end', color: '#8F8171', fontSize: 10, fontWeight: '800' },
  errorText: {
    marginTop: 14,
    color: '#A7574F',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 20,
    backgroundColor: 'rgba(245,239,229,0.94)',
  },
  saveButton: {
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    minHeight: 58,
    borderRadius: 22,
    backgroundColor: '#7F8F63',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  saveButtonDisabled: { opacity: 0.45 },
  saveText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  pressed: { opacity: 0.75 },
});
