import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { InteractiveRoomObject } from '@/features/home/components/InteractiveRoomObject';
import { QuestMemoBoard } from '@/features/home/components/QuestMemoBoard';
import { RoomBackdrop } from '@/features/home/components/RoomBackdrop';
import { TopGameStatus } from '@/features/home/components/TopGameStatus';
import { roomHotspots, type RoomHotspot } from '@/features/home/roomData';

const maruMessages = [
  '천천히 해도 괜찮아.',
  '오늘은 어떤 책이 생길까?',
  '방이 한결 편안해졌네.',
];

type RoomSceneProps = {
  onObjectPress: (object: RoomHotspot) => void;
  onSettingsPress: () => void;
};

export function RoomScene({ onObjectPress, onSettingsPress }: RoomSceneProps) {
  const [showMaruMessage, setShowMaruMessage] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);
  const [debugHotspots, setDebugHotspots] = useState(false);
  const idleGlow = useRef(new Animated.Value(0.2)).current;

  useEffect(() => {
    const idleAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(idleGlow, {
          toValue: 0.62,
          duration: 1900,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(idleGlow, {
          toValue: 0.2,
          duration: 1900,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]),
    );
    idleAnimation.start();

    const firstMessage = setTimeout(() => setShowMaruMessage(true), 2800);
    const hideFirstMessage = setTimeout(() => setShowMaruMessage(false), 5600);
    const messageCycle = setInterval(() => {
      setMessageIndex((current) => (current + 1) % maruMessages.length);
      setShowMaruMessage(true);
      setTimeout(() => setShowMaruMessage(false), 2800);
    }, 12500);

    return () => {
      idleAnimation.stop();
      clearTimeout(firstMessage);
      clearTimeout(hideFirstMessage);
      clearInterval(messageCycle);
    };
  }, [idleGlow]);

  return (
    <View style={styles.scene}>
      <RoomBackdrop />
      <View style={styles.lightVeil} pointerEvents="none" />
      <TopGameStatus onSettingsPress={onSettingsPress} />
      <QuestMemoBoard />

      <Animated.View
        pointerEvents="none"
        style={[styles.characterIdleGlow, { opacity: idleGlow }]}
      />

      {roomHotspots.map((object) => (
        <InteractiveRoomObject
          key={object.id}
          debug={debugHotspots}
          object={object}
          onPress={onObjectPress}
        />
      ))}

      {showMaruMessage ? (
        <View pointerEvents="none" style={styles.maruBubble}>
          <Text style={styles.maruText}>{maruMessages[messageIndex]}</Text>
        </View>
      ) : null}

      {__DEV__ ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="터치 영역 디버그 전환"
          onLongPress={() => setDebugHotspots((current) => !current)}
          style={styles.debugTrigger}
        />
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
  lightVeil: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 252, 245, 0.03)',
  },
  characterIdleGlow: {
    position: 'absolute',
    left: '37%',
    top: '50%',
    width: '23%',
    height: '19%',
    borderRadius: 80,
    backgroundColor: 'rgba(255, 238, 190, 0.22)',
  },
  maruBubble: {
    position: 'absolute',
    left: 18,
    top: '56%',
    maxWidth: 162,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    backgroundColor: 'rgba(255, 252, 245, 0.92)',
    shadowColor: '#3D3428',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 7,
    elevation: 3,
  },
  maruText: {
    color: '#554A3D',
    fontSize: 11,
    fontWeight: '700',
  },
  debugTrigger: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 34,
    height: 34,
  },
});
