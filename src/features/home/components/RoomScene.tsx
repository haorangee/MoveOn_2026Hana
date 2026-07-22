import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  LayoutChangeEvent,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CharacterCompanionGroup } from '@/features/home/components/CharacterCompanionGroup';
import { InteractiveRoomObject } from '@/features/home/components/InteractiveRoomObject';
import { NewspaperProp } from '@/features/home/components/NewspaperProp';
import { QuestMemoBoard } from '@/features/home/components/QuestMemoBoard';
import {
  getInitialMockWeather,
  getNextWeather,
  RoomAtmosphere,
  type RoomWeather,
} from '@/features/home/components/RoomAtmosphere';
import { RoomBackdrop } from '@/features/home/components/RoomBackdrop';
import { StudyBookshelfOverlay } from '@/features/home/components/StudyBookshelfOverlay';
import { TopGameStatus } from '@/features/home/components/TopGameStatus';
import {
  roomHotspots,
  type RoomActivity,
  type RoomHotspot,
} from '@/features/home/roomData';

const idleActivities: RoomActivity[] = [
  'desk',
  'window',
  'bed',
  'bookshelf',
  'plant',
  'walking',
];

type RoomSceneProps = {
  focusedObject: RoomHotspot | null;
  systemMessage?: string | null;
  onObjectPress: (object: RoomHotspot) => void;
  onSettingsPress: () => void;
};

export function RoomScene({
  focusedObject,
  systemMessage,
  onObjectPress,
  onSettingsPress,
}: RoomSceneProps) {
  const initialActivity = useMemo(
    () => idleActivities[Math.floor(Math.random() * idleActivities.length)],
    [],
  );
  const [activity, setActivity] = useState<RoomActivity>(initialActivity);
  const [sceneSize, setSceneSize] = useState({ width: 0, height: 0 });
  const [weather, setWeather] = useState<RoomWeather>(() => getInitialMockWeather());
  const cameraScale = useRef(new Animated.Value(1)).current;
  const cameraX = useRef(new Animated.Value(0)).current;
  const cameraY = useRef(new Animated.Value(0)).current;
  const bookshelfOpenProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (focusedObject) {
      setActivity(focusedObject.activity);
      if (focusedObject.id === 'window') {
        setWeather((current) => getNextWeather(current));
      }
      return;
    }

    const lifestyleCycle = setInterval(() => {
      setActivity((current) => {
        const alternatives = idleActivities.filter((candidate) => candidate !== current);
        return alternatives[Math.floor(Math.random() * alternatives.length)];
      });
    }, 10500);

    return () => clearInterval(lifestyleCycle);
  }, [focusedObject]);

  useEffect(() => {
    if (sceneSize.width === 0 || sceneSize.height === 0) return;
    const scale = focusedObject?.focus.scale ?? 1;
    const focusX = focusedObject?.focus.x ?? 0.5;
    const focusY = focusedObject?.focus.y ?? 0.5;
    const translateX = (0.5 - focusX) * sceneSize.width * 0.72;
    const translateY = (0.5 - focusY) * sceneSize.height * 0.72;

    const cameraAnimation = Animated.parallel([
      Animated.timing(cameraScale, {
        toValue: scale,
        duration: 760,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(cameraX, {
        toValue: translateX,
        duration: 760,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(cameraY, {
        toValue: translateY,
        duration: 760,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]);
    cameraAnimation.start();

    return () => cameraAnimation.stop();
  }, [cameraScale, cameraX, cameraY, focusedObject, sceneSize.height, sceneSize.width]);

  useEffect(() => {
    if (focusedObject?.id !== 'bookshelf') {
      bookshelfOpenProgress.stopAnimation();
      bookshelfOpenProgress.setValue(0);
      return;
    }

    const bookshelfAnimation = Animated.sequence([
      Animated.timing(bookshelfOpenProgress, {
        toValue: 0.16,
        duration: 130,
        easing: Easing.out(Easing.quad),
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(bookshelfOpenProgress, {
        toValue: 0.52,
        duration: 310,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(bookshelfOpenProgress, {
        toValue: 1,
        duration: 380,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]);
    bookshelfAnimation.start();

    return () => bookshelfAnimation.stop();
  }, [bookshelfOpenProgress, focusedObject]);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSceneSize((current) => (
      current.width === width && current.height === height ? current : { width, height }
    ));
  };

  const feedback = focusedObject?.feedback ?? systemMessage;

  return (
    <View onLayout={handleLayout} style={styles.scene}>
      <Animated.View
        style={[
          styles.world,
          {
            transform: [
              { scale: cameraScale },
              { translateX: cameraX },
              { translateY: cameraY },
            ],
          },
        ]}
      >
        <RoomBackdrop />
        <RoomAtmosphere weather={weather} />
        <StudyBookshelfOverlay
          disabled={focusedObject !== null}
          onOpen={() => {
            const bookshelf = roomHotspots.find((object) => object.id === 'bookshelf');
            if (bookshelf) onObjectPress(bookshelf);
          }}
          openingProgress={bookshelfOpenProgress}
        />
        <QuestMemoBoard />
        <NewspaperProp />

        <CharacterCompanionGroup
          activity={activity}
          isInteracting={focusedObject !== null}
          sceneSize={sceneSize}
        />

        {roomHotspots.map((object) => (
          <InteractiveRoomObject
            key={object.id}
            disabled={focusedObject !== null}
            object={object}
            onPress={onObjectPress}
          />
        ))}
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        style={[
          styles.bookshelfFade,
          {
            opacity: bookshelfOpenProgress.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0, 0.1, 0.28],
            }),
          },
        ]}
      />

      <TopGameStatus onSettingsPress={onSettingsPress} />

      {feedback ? (
        <View accessibilityLiveRegion="polite" pointerEvents="none" style={styles.feedback}>
          <View style={styles.feedbackDot} />
          <Text style={styles.feedbackText}>{feedback}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  scene: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#F5EEE1',
  },
  world: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  bookshelfFade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#211B16',
  },
  feedback: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 24,
    minHeight: 42,
    paddingHorizontal: 15,
    borderRadius: 21,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    backgroundColor: 'rgba(49, 42, 34, 0.78)',
    shadowColor: '#2C241B',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  feedbackDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E7D39D',
  },
  feedbackText: {
    flexShrink: 1,
    color: '#FFF9EC',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
});
