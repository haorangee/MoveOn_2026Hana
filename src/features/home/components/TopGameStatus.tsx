import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  getMvpCharacterCatalogItem,
  isMvpCharacterId,
} from '@/features/customization/catalogs/characterCatalog';
import { getCharacterOption } from '@/features/onboarding/onboardingData';
import { useOnboarding } from '@/features/onboarding/OnboardingProvider';

type TopGameStatusProps = {
  onSettingsPress: () => void;
};

export function TopGameStatus({ onSettingsPress }: TopGameStatusProps) {
  const { profile } = useOnboarding();
  const characterSource = isMvpCharacterId(profile.characterId)
    ? getMvpCharacterCatalogItem(profile.characterId).source
    : getCharacterOption(profile.characterId).image;

  return (
    <View style={styles.container} pointerEvents="box-none">
      <View style={styles.identityPill}>
        <View style={styles.avatar}>
          <Image contentFit="contain" source={characterSource} style={styles.avatarImage} />
        </View>
        <View>
          <Text style={styles.roomName}>{profile.name || '나'}의 방</Text>
          <Text style={styles.level}>LV. 4 · 320 / 600</Text>
        </View>
      </View>

      <View style={styles.right}>
        <View style={styles.coinPill}>
          <View style={styles.grape}>
            <View style={[styles.grapeDot, styles.dotOne]} />
            <View style={[styles.grapeDot, styles.dotTwo]} />
            <View style={[styles.grapeDot, styles.dotThree]} />
          </View>
          <Text style={styles.coinText}>250</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="설정 열기"
          onPress={onSettingsPress}
          style={({ pressed }) => [styles.settings, pressed && styles.pressed]}
        >
          <Ionicons name="settings-outline" size={21} color="#4B443A" />
        </Pressable>
      </View>
    </View>
  );
}

const pillShadow = {
  shadowColor: '#3D3428',
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.14,
  shadowRadius: 8,
  elevation: 4,
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 14,
    right: 14,
    top: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  identityPill: {
    minHeight: 54,
    paddingRight: 16,
    paddingLeft: 7,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 252, 243, 0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    ...pillShadow,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEE6D6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(92, 75, 54, 0.14)',
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '135%', marginTop: 8 },
  roomName: { color: '#332D26', fontSize: 14, fontWeight: '800' },
  level: { marginTop: 2, color: '#7A6E60', fontSize: 10, fontWeight: '600' },
  right: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  coinPill: {
    height: 43,
    minWidth: 78,
    paddingHorizontal: 13,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 252, 243, 0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    ...pillShadow,
  },
  grape: { width: 17, height: 19 },
  grapeDot: {
    position: 'absolute',
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#76506F',
    borderWidth: 1,
    borderColor: '#5B3B55',
  },
  dotOne: { left: 0, top: 2 },
  dotTwo: { right: 0, top: 2 },
  dotThree: { left: 4, bottom: 0 },
  coinText: { color: '#332D26', fontSize: 15, fontWeight: '800' },
  settings: {
    width: 43,
    height: 43,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 252, 243, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    ...pillShadow,
  },
  pressed: { transform: [{ scale: 0.94 }], opacity: 0.86 },
});
