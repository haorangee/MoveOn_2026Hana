import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  isometricRoomHotspots,
  ROOM_DESIGN_HEIGHT,
  ROOM_DESIGN_WIDTH,
} from '../constants/isometricRoomLayout';
import { IsometricCharacterLayer } from './IsometricCharacterLayer';
import { IsometricPetLayer } from './IsometricPetLayer';
import { IsometricRoomArtwork } from './IsometricRoomArtwork';
import { IsometricWaterPlantLayer } from './IsometricWaterPlantLayer';
import { RoomHotspot } from './RoomHotspot';
import { VacuumCleanerLayer } from './VacuumCleanerLayer';
import { useIsometricRoomProfile } from '../hooks/useIsometricRoomProfile';
import type {
  IsometricPlantStage,
  IsometricRoomObjectId,
  VacuumCleanerState,
} from '../types/isometricRoom';

const CLEANING_START_DELAY_MS = 400;

type IsometricRoomSceneProps = {
  characterIdOverride?: string | null;
  plantStage?: IsometricPlantStage;
  plantCompleted?: boolean;
  petIdOverride?: string | null;
  showDebugHotspots?: boolean;
  onObjectPress: (objectId: IsometricRoomObjectId, label: string) => void;
};

export function IsometricRoomScene({
  characterIdOverride,
  onObjectPress,
  plantCompleted = false,
  plantStage = 0,
  petIdOverride,
  showDebugHotspots = false,
}: IsometricRoomSceneProps) {
  const profile = useIsometricRoomProfile();
  const characterId = characterIdOverride ?? profile.characterId;
  const petId = petIdOverride ?? profile.petId;
  const [vacuumState, setVacuumState] = useState<VacuumCleanerState>('idle');
  const [isStartingCleaning, setIsStartingCleaning] = useState(false);
  const navigationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (navigationTimerRef.current) {
      clearTimeout(navigationTimerRef.current);
      navigationTimerRef.current = null;
    }
  }, []);

  const handleObjectPress = (objectId: IsometricRoomObjectId, label: string) => {
    if (objectId !== 'cleaningFloor') {
      onObjectPress(objectId, label);
      return;
    }

    if (isStartingCleaning) {
      return;
    }

    setIsStartingCleaning(true);
    setVacuumState('active');

    navigationTimerRef.current = setTimeout(() => {
      navigationTimerRef.current = null;
      onObjectPress(objectId, label);
      setVacuumState('idle');
      setIsStartingCleaning(false);
    }, CLEANING_START_DELAY_MS);
  };

  return (
    <View style={styles.scene}>
      <View pointerEvents="none" style={styles.floatShadow} />
      <View style={styles.roomShell}>
        <IsometricRoomArtwork />
        <IsometricWaterPlantLayer
          isCompleted={plantCompleted}
          stage={plantStage}
        />
        <VacuumCleanerLayer state={vacuumState} />
        <IsometricCharacterLayer characterId={characterId} />
        <IsometricPetLayer
          petId={petId}
          petSpecies={profile.petSpecies}
        />

        {/* Future dynamic layers:
            CleaningStateLayer
            WaterPlantLayer
            StudyBooksLayer
            QuestBoardLayer
            NewspaperLayer
            SparkleLayer
        */}

        {isometricRoomHotspots.map((object) => {
          if (object.id === 'cleaningFloor' && isStartingCleaning) {
            return null;
          }

          return (
            <RoomHotspot
              accessibilityLabel={
                object.id === 'cleaningFloor' ? '청소 시작하기' : undefined
              }
              disabled={object.id === 'cleaningFloor' && isStartingCleaning}
              key={`${object.id}-hotspot`}
              label={object.label}
              layout={object}
              onPress={() => handleObjectPress(object.id, object.label)}
              showDebug={showDebugHotspots}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scene: {
    width: ROOM_DESIGN_WIDTH,
    height: ROOM_DESIGN_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatShadow: {
    position: 'absolute',
    left: 76,
    right: 76,
    bottom: 34,
    height: 46,
    borderRadius: 999,
    backgroundColor: 'rgba(110, 132, 150, 0.18)',
    transform: [{ scaleX: 1.12 }],
  },
  roomShell: {
    width: ROOM_DESIGN_WIDTH,
    height: ROOM_DESIGN_HEIGHT,
  },
});
