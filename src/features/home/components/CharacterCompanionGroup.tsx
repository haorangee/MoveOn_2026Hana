import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { PlayerCharacter } from '@/features/home/components/PlayerCharacter';
import { PlayerPet, type CompanionMood } from '@/features/home/components/PlayerPet';
import type { RoomActivity } from '@/features/home/roomData';

type SceneSize = { width: number; height: number };

type CharacterCompanionGroupProps = {
  activity: RoomActivity;
  isInteracting: boolean;
  sceneSize: SceneSize;
};

const characterAnchors: Record<RoomActivity, { x: number; y: number }> = {
  desk: { x: 0.42, y: 0.72 },
  bookshelf: { x: 0.64, y: 0.68 },
  window: { x: 0.39, y: 0.66 },
  bed: { x: 0.75, y: 0.73 },
  plant: { x: 0.2, y: 0.78 },
  bathroom: { x: 0.17, y: 0.7 },
  walking: { x: 0.48, y: 0.79 },
};

const moodByActivity: Record<RoomActivity, CompanionMood> = {
  desk: 'studying',
  bookshelf: 'cheering',
  window: 'idle',
  bed: 'tired',
  plant: 'idle',
  bathroom: 'idle',
  walking: 'idle',
};

const maruMessages: Record<CompanionMood, string[]> = {
  idle: ['오늘도 우리 같이 해보자!', '책상에서 같이 공부할까?'],
  studying: ['책상에서 같이 공부할까?', '옆에서 조용히 기다릴게.'],
  happy: ['정말 잘했어! 내가 옆에서 봤어!'],
  tired: ['우리 잠깐 같이 쉬어갈까?'],
  cheering: ['오늘 만든 책도 같이 보러 가자!', '정말 잘했어! 내가 옆에서 봤어!'],
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));

export function CharacterCompanionGroup({
  activity,
  isInteracting,
  sceneSize,
}: CharacterCompanionGroupProps) {
  const companionMood = moodByActivity[activity] ?? 'idle';
  const [bubbleMessage, setBubbleMessage] = useState<string | null>(null);
  const messageIndex = useRef(0);
  const bubbleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearBubbleTimer = useCallback(() => {
    if (bubbleTimer.current) {
      clearTimeout(bubbleTimer.current);
      bubbleTimer.current = null;
    }
  }, []);

  const showBubble = useCallback((message: string) => {
    clearBubbleTimer();
    setBubbleMessage(message);
    bubbleTimer.current = setTimeout(() => setBubbleMessage(null), 3000);
  }, [clearBubbleTimer]);

  const handleMaruPress = useCallback(() => {
    const messages = maruMessages[companionMood];
    const nextMessage = messages[messageIndex.current % messages.length];
    messageIndex.current += 1;
    showBubble(nextMessage);
  }, [companionMood, showBubble]);

  useEffect(() => {
    if (companionMood !== 'cheering') return undefined;
    showBubble(maruMessages.cheering[0]);
    return clearBubbleTimer;
  }, [clearBubbleTimer, companionMood, showBubble]);

  useEffect(() => clearBubbleTimer, [clearBubbleTimer]);

  const bubbleStyle = useMemo(() => {
    if (sceneSize.width === 0 || sceneSize.height === 0) return null;
    const anchor = characterAnchors[activity];
    const width = Math.min(210, sceneSize.width * 0.52);
    return {
      width,
      left: clamp(anchor.x * sceneSize.width - width / 2 + sceneSize.width * 0.07, 12, sceneSize.width - width - 12),
      top: clamp(anchor.y * sceneSize.height - sceneSize.height * 0.32, 58, sceneSize.height - 155),
    };
  }, [activity, sceneSize.height, sceneSize.width]);

  return (
    <>
      <PlayerPet
        activity={activity}
        companionMood={companionMood}
        isInteracting={isInteracting}
        onPress={handleMaruPress}
        sceneSize={sceneSize}
      />
      <PlayerCharacter
        activity={activity}
        isInteracting={isInteracting}
        sceneSize={sceneSize}
      />
      {bubbleMessage && bubbleStyle ? (
        <View pointerEvents="none" style={[styles.bubble, bubbleStyle]}>
          <Text style={styles.bubbleText}>{bubbleMessage}</Text>
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  bubble: {
    position: 'absolute',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
    borderBottomLeftRadius: 5,
    backgroundColor: 'rgba(255, 252, 245, 0.92)',
    shadowColor: '#3D3428',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: Platform.OS === 'web' ? 0.1 : 0.14,
    shadowRadius: 7,
    elevation: 3,
  },
  bubbleText: {
    color: '#554A3D',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 16,
    textAlign: 'center',
  },
});
