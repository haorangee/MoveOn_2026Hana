import { useCallback, useEffect, useRef, useState } from 'react';
import { PlayerCharacter } from '@/features/home/components/PlayerCharacter';
import { PlayerPet, type CompanionMood } from '@/features/home/components/PlayerPet';
import { useOnboarding } from '@/features/onboarding/OnboardingProvider';
import type { RoomActivity } from '@/features/home/roomData';

type SceneSize = { width: number; height: number };

type CharacterCompanionGroupProps = {
  activity: RoomActivity;
  isInteracting: boolean;
  sceneSize: SceneSize;
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

export function CharacterCompanionGroup({
  activity,
  isInteracting,
  sceneSize,
}: CharacterCompanionGroupProps) {
  const { profile } = useOnboarding();
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
    const nickname = profile.name.trim();
    if (nickname) {
      showBubble(`${nickname} 같이 놀자!`);
      return;
    }

    const messages = maruMessages[companionMood];
    const nextMessage = messages[messageIndex.current % messages.length];
    messageIndex.current += 1;
    showBubble(nextMessage);
  }, [companionMood, profile.name, showBubble]);

  useEffect(() => {
    if (companionMood !== 'cheering') return undefined;
    showBubble(maruMessages.cheering[0]);
    return clearBubbleTimer;
  }, [clearBubbleTimer, companionMood, showBubble]);

  useEffect(() => clearBubbleTimer, [clearBubbleTimer]);

  return (
    <>
      <PlayerPet
        activity={activity}
        bubbleMessage={bubbleMessage}
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
    </>
  );
}
