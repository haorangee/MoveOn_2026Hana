import { StyleSheet, View } from 'react-native';
import {
  isometricRoomHotspots,
  ROOM_DESIGN_HEIGHT,
  ROOM_DESIGN_WIDTH,
} from '../constants/isometricRoomLayout';
import { IsometricRoomArtwork } from './IsometricRoomArtwork';
import { RoomHotspot } from './RoomHotspot';
import { VacuumCleanerLayer } from './VacuumCleanerLayer';
import type { IsometricRoomObjectId } from '../types/isometricRoom';

type IsometricRoomSceneProps = {
  showDebugHotspots?: boolean;
  onObjectPress: (objectId: IsometricRoomObjectId, label: string) => void;
};

export function IsometricRoomScene({
  onObjectPress,
  showDebugHotspots = false,
}: IsometricRoomSceneProps) {
  return (
    <View style={styles.scene}>
      <View pointerEvents="none" style={styles.floatShadow} />
      <View style={styles.roomShell}>
        <IsometricRoomArtwork />
        <VacuumCleanerLayer />

        {/* Future dynamic layers:
            CleaningStateLayer
            WaterPlantLayer
            StudyBooksLayer
            QuestBoardLayer
            NewspaperLayer
            CharacterLayer
            PetLayer
            SparkleLayer
        */}

        {isometricRoomHotspots.map((object) => (
          <RoomHotspot
            key={`${object.id}-hotspot`}
            label={object.label}
            layout={object}
            onPress={() => onObjectPress(object.id, object.label)}
            showDebug={showDebugHotspots}
          />
        ))}
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
