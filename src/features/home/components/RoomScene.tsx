import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  type GestureResponderEvent,
  LayoutChangeEvent,
  PanResponder,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { InteractiveRoomObject } from '@/features/home/components/InteractiveRoomObject';
import { NewspaperProp } from '@/features/home/components/NewspaperProp';
import { PlayerCharacter } from '@/features/home/components/PlayerCharacter';
import { PlayerPet } from '@/features/home/components/PlayerPet';
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

const lifestyleRoute: RoomActivity[] = [
  'window',
  'desk',
  'plant',
  'walking',
  'bookshelf',
  'bed',
];

const maruMessages = [
  '오늘은 어디부터 가볼까?',
  '나는 방을 조금 더 둘러볼게!',
  '햇살이 따뜻해서 기분이 좋아.',
];

const MIN_USER_SCALE = 1;
const MAX_USER_SCALE = 2.2;

type WheelLikeEvent = {
  deltaY?: number;
  nativeEvent?: { deltaY?: number };
  preventDefault?: () => void;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getPinchDistance(event: GestureResponderEvent) {
  const touches = event.nativeEvent.touches;
  if (touches.length < 2) return null;
  const [first, second] = touches;
  return Math.hypot(second.pageX - first.pageX, second.pageY - first.pageY);
}

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
    () => lifestyleRoute[Math.floor(Math.random() * lifestyleRoute.length)],
    [],
  );
  const [activity, setActivity] = useState<RoomActivity>(initialActivity);
  const [sceneSize, setSceneSize] = useState({ width: 0, height: 0 });
  const [weather, setWeather] = useState<RoomWeather>(() => getInitialMockWeather());
  const [showMaruMessage, setShowMaruMessage] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);
  const cameraScale = useRef(new Animated.Value(1)).current;
  const cameraX = useRef(new Animated.Value(0)).current;
  const cameraY = useRef(new Animated.Value(0)).current;
  const focusShade = useRef(new Animated.Value(0)).current;
  const userScale = useRef(new Animated.Value(1)).current;
  const userPanX = useRef(new Animated.Value(0)).current;
  const userPanY = useRef(new Animated.Value(0)).current;
  const userScaleValue = useRef(1);
  const userPanValue = useRef({ x: 0, y: 0 });
  const gestureStartPan = useRef({ x: 0, y: 0 });
  const pinchStartDistance = useRef<number | null>(null);
  const pinchStartScale = useRef(1);
  const routeIndex = useRef(lifestyleRoute.indexOf(initialActivity));
  const [showCameraHint, setShowCameraHint] = useState(true);
  const combinedScale = useMemo(
    () => Animated.multiply(cameraScale, userScale),
    [cameraScale, userScale],
  );
  const combinedX = useMemo(
    () => Animated.add(cameraX, userPanX),
    [cameraX, userPanX],
  );
  const combinedY = useMemo(
    () => Animated.add(cameraY, userPanY),
    [cameraY, userPanY],
  );

  const settleUserPan = () => {
    const maxX = sceneSize.width * (userScaleValue.current - 1) * 0.42;
    const maxY = sceneSize.height * (userScaleValue.current - 1) * 0.36;
    const nextX = clamp(userPanValue.current.x, -maxX, maxX);
    const nextY = clamp(userPanValue.current.y, -maxY, maxY);
    userPanValue.current = { x: nextX, y: nextY };
    Animated.parallel([
      Animated.spring(userPanX, {
        toValue: nextX,
        damping: 18,
        stiffness: 170,
        mass: 0.8,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.spring(userPanY, {
        toValue: nextY,
        damping: 18,
        stiffness: 170,
        mass: 0.8,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();
  };

  const resetUserCamera = () => {
    userScaleValue.current = 1;
    userPanValue.current = { x: 0, y: 0 };
    Animated.parallel([
      Animated.spring(userScale, {
        toValue: 1,
        damping: 18,
        stiffness: 170,
        mass: 0.8,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.spring(userPanX, {
        toValue: 0,
        damping: 18,
        stiffness: 170,
        mass: 0.8,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.spring(userPanY, {
        toValue: 0,
        damping: 18,
        stiffness: 170,
        mass: 0.8,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();
  };

  const cameraResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: (event) => event.nativeEvent.touches.length >= 2,
    onStartShouldSetPanResponderCapture: (event) => event.nativeEvent.touches.length >= 2,
    onMoveShouldSetPanResponder: (event, gesture) => (
      focusedObject === null
      && (event.nativeEvent.touches.length >= 2 || Math.abs(gesture.dx) > 7 || Math.abs(gesture.dy) > 7)
    ),
    onMoveShouldSetPanResponderCapture: (event, gesture) => (
      focusedObject === null
      && (event.nativeEvent.touches.length >= 2 || Math.abs(gesture.dx) > 7 || Math.abs(gesture.dy) > 7)
    ),
    onPanResponderGrant: (event) => {
      setShowCameraHint(false);
      gestureStartPan.current = userPanValue.current;
      pinchStartDistance.current = getPinchDistance(event);
      pinchStartScale.current = userScaleValue.current;
    },
    onPanResponderMove: (event, gesture) => {
      const distance = getPinchDistance(event);
      if (distance !== null) {
        if (pinchStartDistance.current === null) {
          pinchStartDistance.current = distance;
          pinchStartScale.current = userScaleValue.current;
          return;
        }
        const nextScale = clamp(
          pinchStartScale.current * (distance / pinchStartDistance.current),
          MIN_USER_SCALE,
          MAX_USER_SCALE,
        );
        userScaleValue.current = nextScale;
        userScale.setValue(nextScale);
        return;
      }

      const nextX = gestureStartPan.current.x + gesture.dx;
      const nextY = gestureStartPan.current.y + gesture.dy;
      userPanValue.current = { x: nextX, y: nextY };
      userPanX.setValue(nextX);
      userPanY.setValue(nextY);
    },
    onPanResponderRelease: () => {
      pinchStartDistance.current = null;
      settleUserPan();
    },
    onPanResponderTerminate: () => {
      pinchStartDistance.current = null;
      settleUserPan();
    },
    onPanResponderTerminationRequest: () => true,
  }), [focusedObject, sceneSize.height, sceneSize.width, userPanX, userPanY, userScale]);

  const handleWheel = (event: WheelLikeEvent) => {
    if (focusedObject) return;
    event.preventDefault?.();
    setShowCameraHint(false);
    const deltaY = event.nativeEvent?.deltaY ?? event.deltaY ?? 0;
    const nextScale = clamp(
      userScaleValue.current + (deltaY < 0 ? 0.12 : -0.12),
      MIN_USER_SCALE,
      MAX_USER_SCALE,
    );
    userScaleValue.current = nextScale;
    Animated.spring(userScale, {
      toValue: nextScale,
      damping: 18,
      stiffness: 170,
      mass: 0.8,
      useNativeDriver: Platform.OS !== 'web',
    }).start(() => settleUserPan());
  };

  const webZoomProps = Platform.OS === 'web' ? { onWheel: handleWheel } : {};

  useEffect(() => {
    if (focusedObject) {
      setActivity(focusedObject.activity);
      if (focusedObject.id === 'window') {
        setWeather((current) => getNextWeather(current));
      }
      return;
    }

    const lifestyleCycle = setInterval(() => {
      routeIndex.current = (routeIndex.current + 1) % lifestyleRoute.length;
      setActivity(lifestyleRoute[routeIndex.current]);
    }, 7200);

    return () => clearInterval(lifestyleCycle);
  }, [focusedObject]);

  useEffect(() => {
    if (!focusedObject) return;
    resetUserCamera();
  // Camera values are stable Animated.Value instances.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusedObject]);

  useEffect(() => {
    const hintTimer = setTimeout(() => setShowCameraHint(false), 5200);
    return () => clearTimeout(hintTimer);
  }, []);

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
      Animated.timing(focusShade, {
        toValue: focusedObject ? 1 : 0,
        duration: 520,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]);
    cameraAnimation.start();

    return () => cameraAnimation.stop();
  }, [cameraScale, cameraX, cameraY, focusShade, focusedObject, sceneSize.height, sceneSize.width]);

  useEffect(() => {
    const firstMessage = setTimeout(() => setShowMaruMessage(true), 3000);
    const hideFirstMessage = setTimeout(() => setShowMaruMessage(false), 5700);
    const messageCycle = setInterval(() => {
      setMessageIndex((current) => (current + 1) % maruMessages.length);
      setShowMaruMessage(true);
      setTimeout(() => setShowMaruMessage(false), 2600);
    }, 14000);

    return () => {
      clearTimeout(firstMessage);
      clearTimeout(hideFirstMessage);
      clearInterval(messageCycle);
    };
  }, []);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSceneSize((current) => (
      current.width === width && current.height === height ? current : { width, height }
    ));
  };

  const feedback = focusedObject?.feedback ?? systemMessage;

  return (
    <View
      {...webZoomProps}
      {...cameraResponder.panHandlers}
      onLayout={handleLayout}
      style={styles.scene}
    >
      <Animated.View
        style={[
          styles.world,
          {
            transform: [
              { translateX: combinedX },
              { translateY: combinedY },
              { scale: combinedScale },
            ],
          },
        ]}
      >
        <RoomBackdrop />
        <RoomAtmosphere weather={weather} />
        <StudyBookshelfOverlay />
        <QuestMemoBoard />
        <NewspaperProp />

        <Animated.View
          pointerEvents="none"
          style={[
            styles.characterGroundGlow,
            {
              opacity: focusShade.interpolate({
                inputRange: [0, 1],
                outputRange: [0.13, 0.25],
              }),
            },
          ]}
        />
        <PlayerPet
          activity={activity}
          isInteracting={focusedObject !== null}
          sceneSize={sceneSize}
        />
        <PlayerCharacter
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

        {showMaruMessage && !focusedObject ? (
          <View pointerEvents="none" style={styles.maruBubble}>
            <Text style={styles.maruText}>{maruMessages[messageIndex]}</Text>
          </View>
        ) : null}
      </Animated.View>

      <TopGameStatus onSettingsPress={onSettingsPress} />

      {showCameraHint && !focusedObject ? (
        <View pointerEvents="none" style={styles.cameraHint}>
          <Text style={styles.cameraHintText}>두 손가락으로 확대 · 드래그로 둘러보기</Text>
        </View>
      ) : null}

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
  characterGroundGlow: {
    position: 'absolute',
    left: '31%',
    top: '70%',
    width: '36%',
    height: '8%',
    borderRadius: 90,
    backgroundColor: 'rgba(255, 231, 171, 0.36)',
  },
  maruBubble: {
    position: 'absolute',
    left: '12%',
    top: '66%',
    maxWidth: 154,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
    borderBottomLeftRadius: 4,
    backgroundColor: 'rgba(255, 252, 245, 0.9)',
    shadowColor: '#3D3428',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.13,
    shadowRadius: 7,
    elevation: 3,
  },
  maruText: { color: '#554A3D', fontSize: 10, fontWeight: '700' },
  cameraHint: {
    position: 'absolute',
    alignSelf: 'center',
    top: 78,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 15,
    backgroundColor: 'rgba(50, 42, 34, 0.66)',
  },
  cameraHintText: { color: '#FFF8EA', fontSize: 9, fontWeight: '700' },
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
