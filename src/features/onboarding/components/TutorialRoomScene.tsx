import { Image } from 'expo-image';
import { type PropsWithChildren, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  type LayoutChangeEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  getCharacterOption,
  getPetOption,
  type CharacterId,
  type PetSpecies,
} from '@/features/onboarding/onboardingData';

const roomImage = require('../../../../assets/images/room/moveon-room-empty.png');

export type TutorialObjectId =
  | 'desk'
  | 'bookshelf'
  | 'plant'
  | 'bathroom'
  | 'bed'
  | 'newspaper';

export type TutorialCharacterActivity =
  | 'auto'
  | 'center'
  | 'window'
  | 'pet'
  | 'plant'
  | 'bookshelf'
  | 'desk'
  | 'celebrate';

export type TutorialPetBehavior = 'follow' | 'sleep' | 'celebrate';
export type TutorialLighting = 'auto' | 'morning' | 'afternoon' | 'night';
export type TutorialWeather = 'clear' | 'rain';

const objectFrames: Record<TutorialObjectId, {
  left: `${number}%`;
  top: `${number}%`;
  width: `${number}%`;
  height: `${number}%`;
  label: string;
}> = {
  desk: { left: '15%', top: '31%', width: '44%', height: '27%', label: '책상 · 공부 시작' },
  bookshelf: { left: '52%', top: '15%', width: '29%', height: '41%', label: '책장 · 공부 기록' },
  plant: { left: '0%', top: '56%', width: '26%', height: '29%', label: '화분 · 물 마시기' },
  bathroom: { left: '0%', top: '13%', width: '15%', height: '43%', label: '욕실 문 · 샤워하기' },
  bed: { left: '56%', top: '38%', width: '44%', height: '31%', label: '침대 · 휴식하기' },
  newspaper: { left: '60%', top: '74%', width: '40%', height: '22%', label: '신문 · Move On Times' },
};

const idleActivities: Exclude<TutorialCharacterActivity, 'auto' | 'desk' | 'celebrate'>[] = [
  'window',
  'pet',
  'plant',
  'bookshelf',
];

const characterAnchors: Record<Exclude<TutorialCharacterActivity, 'auto'>, { x: number; y: number }> = {
  center: { x: 0.35, y: 0.56 },
  window: { x: 0.24, y: 0.43 },
  pet: { x: 0.34, y: 0.6 },
  plant: { x: 0.11, y: 0.57 },
  bookshelf: { x: 0.54, y: 0.39 },
  desk: { x: 0.25, y: 0.38 },
  celebrate: { x: 0.38, y: 0.37 },
};

type TutorialRoomSceneProps = PropsWithChildren<{
  characterId: string;
  petSpecies: PetSpecies;
  highlightedObject?: TutorialObjectId | null;
  message?: string;
  onObjectPress?: (id: TutorialObjectId) => void;
  characterAtDesk?: boolean;
  characterActivity?: TutorialCharacterActivity;
  petBehavior?: TutorialPetBehavior;
  lighting?: TutorialLighting;
  weather?: TutorialWeather;
  growthLevel?: 0 | 1 | 2 | 3;
  cleaned?: boolean;
}>;

export function TutorialRoomScene({
  characterId,
  petSpecies,
  highlightedObject = null,
  message,
  onObjectPress,
  characterAtDesk = false,
  characterActivity = 'auto',
  petBehavior = 'follow',
  lighting = 'auto',
  weather = 'clear',
  growthLevel = 0,
  cleaned = false,
  children,
}: TutorialRoomSceneProps) {
  const character = getCharacterOption(characterId);
  const pet = getPetOption(petSpecies);
  const [sceneSize, setSceneSize] = useState({ width: 0, height: 0 });
  const [idleIndex, setIdleIndex] = useState(0);
  const idle = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const light = useRef(new Animated.Value(0)).current;
  const characterX = useRef(new Animated.Value(0)).current;
  const characterY = useRef(new Animated.Value(0)).current;
  const petX = useRef(new Animated.Value(0)).current;
  const petY = useRef(new Animated.Value(0)).current;
  const placed = useRef(false);

  const resolvedActivity = characterAtDesk
    ? 'desk'
    : characterActivity === 'auto'
      ? idleActivities[idleIndex]
      : characterActivity;
  const resolvedLighting = useMemo(() => {
    if (lighting !== 'auto') return lighting;
    const hour = new Date().getHours();
    if (hour < 11) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'night';
  }, [lighting]);

  useEffect(() => {
    if (characterActivity !== 'auto' || characterAtDesk) return;
    const cycle = setInterval(() => {
      setIdleIndex((current) => (current + 1) % idleActivities.length);
    }, 5200);
    return () => clearInterval(cycle);
  }, [characterActivity, characterAtDesk]);

  useEffect(() => {
    const idleAnimation = Animated.loop(Animated.sequence([
      Animated.timing(idle, {
        toValue: 1,
        duration: petBehavior === 'celebrate' ? 320 : 1900,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(idle, {
        toValue: 0,
        duration: petBehavior === 'celebrate' ? 320 : 1900,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]));
    const glowAnimation = Animated.loop(Animated.sequence([
      Animated.timing(glow, { toValue: 1, duration: 900, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(glow, { toValue: 0, duration: 900, useNativeDriver: Platform.OS !== 'web' }),
    ]));
    const lightAnimation = Animated.loop(Animated.sequence([
      Animated.timing(light, { toValue: 1, duration: 4200, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(light, { toValue: 0, duration: 4200, useNativeDriver: Platform.OS !== 'web' }),
    ]));

    idleAnimation.start();
    glowAnimation.start();
    lightAnimation.start();
    return () => {
      idleAnimation.stop();
      glowAnimation.stop();
      lightAnimation.stop();
    };
  }, [glow, idle, light, petBehavior]);

  useEffect(() => {
    if (!sceneSize.width || !sceneSize.height) return;
    const characterAnchor = characterAnchors[resolvedActivity];
    const characterTargetX = sceneSize.width * characterAnchor.x;
    const characterTargetY = sceneSize.height * characterAnchor.y;
    const petAnchor = petBehavior === 'sleep'
      ? { x: 0.22, y: 0.62 }
      : petBehavior === 'celebrate'
        ? { x: 0.24, y: 0.52 }
        : { x: Math.max(0.06, characterAnchor.x - 0.13), y: Math.min(0.74, characterAnchor.y + 0.2) };
    const petTargetX = sceneSize.width * petAnchor.x;
    const petTargetY = sceneSize.height * petAnchor.y;

    if (!placed.current) {
      characterX.setValue(characterTargetX);
      characterY.setValue(characterTargetY);
      petX.setValue(petTargetX);
      petY.setValue(petTargetY);
      placed.current = true;
      return;
    }

    const movement = Animated.parallel([
      Animated.timing(characterX, {
        toValue: characterTargetX,
        duration: resolvedActivity === 'desk' ? 1050 : 1750,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(characterY, {
        toValue: characterTargetY,
        duration: resolvedActivity === 'desk' ? 1050 : 1750,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(petX, {
        toValue: petTargetX,
        duration: petBehavior === 'celebrate' ? 520 : 1450,
        delay: petBehavior === 'follow' ? 260 : 0,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(petY, {
        toValue: petTargetY,
        duration: petBehavior === 'celebrate' ? 520 : 1450,
        delay: petBehavior === 'follow' ? 260 : 0,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]);
    movement.start();
    return () => movement.stop();
  }, [characterX, characterY, petBehavior, petX, petY, resolvedActivity, sceneSize.height, sceneSize.width]);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSceneSize((current) => current.width === width && current.height === height
      ? current
      : { width, height });
  };

  const night = resolvedLighting === 'night';
  const afternoon = resolvedLighting === 'afternoon';

  return (
    <View onLayout={handleLayout} style={styles.scene}>
      <Image contentFit="cover" source={roomImage} style={StyleSheet.absoluteFill} />
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          night && styles.nightTint,
          afternoon && styles.afternoonTint,
          weather === 'rain' && styles.rainTint,
        ]}
      />

      {!night ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.sunlight,
            {
              backgroundColor: afternoon ? '#FFD29A' : '#FFF3C8',
              opacity: light.interpolate({ inputRange: [0, 1], outputRange: [0.07, afternoon ? 0.18 : 0.14] }),
              transform: [
                { translateX: light.interpolate({ inputRange: [0, 1], outputRange: [-18, 18] }) },
                { rotate: afternoon ? '-18deg' : '-12deg' },
              ],
            },
          ]}
        />
      ) : (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.lampGlow,
            { opacity: light.interpolate({ inputRange: [0, 1], outputRange: [0.24, 0.42] }) },
          ]}
        />
      )}

      <Animated.View
        pointerEvents="none"
        style={[
          styles.curtain,
          { transform: [{ rotate: idle.interpolate({ inputRange: [0, 1], outputRange: ['-1deg', '1.2deg'] }) }] },
        ]}
      />

      {weather === 'rain' ? (
        <View pointerEvents="none" style={styles.rainWindow}>
          {Array.from({ length: 12 }, (_, index) => (
            <Animated.View
              key={index}
              style={[
                styles.rainDrop,
                {
                  left: `${8 + (index * 17) % 88}%`,
                  top: `${4 + (index * 23) % 82}%`,
                  opacity: light.interpolate({ inputRange: [0, 1], outputRange: [0.24, 0.62] }),
                  transform: [{ translateY: light.interpolate({ inputRange: [0, 1], outputRange: [-4, 10] }) }],
                },
              ]}
            />
          ))}
        </View>
      ) : null}

      {growthLevel >= 1 ? <GrowthBooks /> : null}
      {growthLevel >= 2 ? <GrowthFrame /> : null}
      {growthLevel >= 3 ? <View pointerEvents="none" style={styles.growthLampGlow} /> : null}
      {cleaned ? <View pointerEvents="none" style={styles.cleanGlow} /> : null}

      {sceneSize.width > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.character,
            {
              width: sceneSize.width * (resolvedActivity === 'desk' ? 0.29 : 0.34),
              height: sceneSize.height * (resolvedActivity === 'desk' ? 0.3 : 0.35),
              transform: [
                { translateX: characterX },
                { translateY: characterY },
                { translateY: idle.interpolate({ inputRange: [0, 1], outputRange: [0, resolvedActivity === 'desk' ? -1 : -3] }) },
                { rotate: idle.interpolate({ inputRange: [0, 1], outputRange: ['-0.4deg', resolvedActivity === 'pet' ? '1.4deg' : '0.4deg'] }) },
              ],
            },
          ]}
        >
          <Image contentFit="contain" source={character.image} style={StyleSheet.absoluteFill} />
        </Animated.View>
      ) : null}

      {sceneSize.width > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.pet,
            {
              width: sceneSize.width * 0.24,
              height: sceneSize.height * 0.15,
              opacity: petBehavior === 'sleep' ? 0.9 : 1,
              transform: [
                { translateX: petX },
                { translateY: petY },
                { translateY: idle.interpolate({ inputRange: [0, 1], outputRange: [0, petBehavior === 'sleep' ? 1 : -2] }) },
                { rotate: idle.interpolate({ inputRange: [0, 1], outputRange: [petBehavior === 'celebrate' ? '-7deg' : '-1deg', petBehavior === 'celebrate' ? '7deg' : '1deg'] }) },
                { scaleY: petBehavior === 'sleep' ? 0.78 : 1 },
              ],
            },
          ]}
        >
          <Image contentFit="contain" source={pet.image} style={StyleSheet.absoluteFill} />
        </Animated.View>
      ) : null}

      {onObjectPress ? (Object.keys(objectFrames) as TutorialObjectId[]).map((id) => {
        const frame = objectFrames[id];
        const active = highlightedObject === id;
        return (
          <Pressable
            key={id}
            accessibilityLabel={frame.label}
            accessibilityRole="button"
            onPress={() => onObjectPress(id)}
            style={[styles.touchObject, frame]}
          >
            {active ? (
              <Animated.View
                pointerEvents="none"
                style={[
                  StyleSheet.absoluteFill,
                  styles.objectGlow,
                  { opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.28, 0.68] }) },
                ]}
              />
            ) : null}
          </Pressable>
        );
      }) : null}

      {children}

      {message ? (
        <View pointerEvents="none" style={styles.messageWrap}>
          <View style={styles.messageRule} />
          <Text style={styles.message}>{message}</Text>
        </View>
      ) : null}
    </View>
  );
}

function GrowthBooks() {
  return (
    <View pointerEvents="none" style={styles.growthBooks}>
      {['#6684A6', '#758B67', '#B47F70', '#9A82A3'].map((color, index) => (
        <View key={color} style={[styles.growthBook, { height: 28 + index * 3, backgroundColor: color }]} />
      ))}
    </View>
  );
}

function GrowthFrame() {
  return (
    <View pointerEvents="none" style={styles.growthFrame}>
      <View style={styles.frameSky} />
      <View style={styles.frameGround}>
        <View style={styles.frameHill} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scene: { flex: 1, overflow: 'hidden', backgroundColor: '#E9DDCA' },
  afternoonTint: { backgroundColor: 'rgba(183, 116, 54, 0.09)' },
  nightTint: { backgroundColor: 'rgba(25, 34, 54, 0.38)' },
  rainTint: { backgroundColor: 'rgba(69, 83, 96, 0.12)' },
  sunlight: { position: 'absolute', left: '12%', top: '14%', width: '52%', height: '66%' },
  lampGlow: { position: 'absolute', left: '24%', top: '26%', width: '32%', height: '34%', borderRadius: 100, backgroundColor: '#FFE7A6' },
  curtain: { position: 'absolute', left: '17%', top: '8%', width: '5%', height: '39%', borderRadius: 20, backgroundColor: 'rgba(255,255,248,0.18)' },
  rainWindow: { position: 'absolute', left: '17%', top: '10%', width: '34%', height: '30%', overflow: 'hidden' },
  rainDrop: { position: 'absolute', width: 2, height: 9, borderRadius: 2, backgroundColor: '#DCE6EB', transform: [{ rotate: '10deg' }] },
  cleanGlow: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255, 247, 213, 0.09)' },
  character: { position: 'absolute', left: 0, top: 0 },
  pet: { position: 'absolute', left: 0, top: 0 },
  touchObject: { position: 'absolute' },
  objectGlow: { borderWidth: 1.5, borderRadius: 16, borderColor: '#FFF0B0', backgroundColor: 'rgba(255, 230, 151, 0.08)', shadowColor: '#FFF0A8', shadowOpacity: 0.7, shadowRadius: 16, elevation: 3 },
  messageWrap: { position: 'absolute', left: 22, right: 22, bottom: 20, paddingHorizontal: 16, paddingVertical: 13, borderRadius: 4, backgroundColor: 'rgba(48, 40, 32, 0.82)', flexDirection: 'row', alignItems: 'center', gap: 10 },
  messageRule: { width: 2, alignSelf: 'stretch', backgroundColor: '#D9C79E' },
  message: { flex: 1, color: '#FFF9EC', fontSize: 12, lineHeight: 18, fontWeight: '700' },
  growthBooks: { position: 'absolute', left: '58%', top: '28%', width: '15%', height: '8%', flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  growthBook: { width: 7, borderRadius: 1, borderWidth: 0.5, borderColor: 'rgba(42,34,28,0.28)' },
  growthFrame: { position: 'absolute', right: '7%', top: '21%', width: '12%', height: '9%', padding: 3, overflow: 'hidden', borderWidth: 3, borderColor: '#8A6748', backgroundColor: '#E7D7BE', transform: [{ rotate: '1deg' }] },
  frameSky: { flex: 1, backgroundColor: '#B7C9C5' },
  frameGround: { height: '43%', overflow: 'hidden', backgroundColor: '#8FA181' },
  frameHill: { position: 'absolute', left: -5, bottom: -9, width: 42, height: 25, borderRadius: 24, backgroundColor: '#71836B', transform: [{ rotate: '-12deg' }] },
  growthLampGlow: { position: 'absolute', left: '31%', top: '30%', width: '18%', height: '22%', borderRadius: 90, backgroundColor: 'rgba(255, 218, 144, 0.2)' },
});
