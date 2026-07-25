import { StyleSheet, Text, View } from 'react-native';
import {
  isometricRoomHotspots,
  isometricRoomObjects,
  ROOM_DESIGN_HEIGHT,
  ROOM_DESIGN_WIDTH,
} from '../constants/isometricRoomLayout';
import { RoomHotspot } from './RoomHotspot';
import type { IsometricRoomObjectId, IsometricRoomObjectLayout } from '../types/isometricRoom';

type IsometricRoomSceneProps = {
  showDebugHotspots?: boolean;
  onObjectPress: (objectId: IsometricRoomObjectId, label: string) => void;
};

const tileIndexes = Array.from({ length: 11 }, (_, index) => index);

export function IsometricRoomScene({
  onObjectPress,
  showDebugHotspots = false,
}: IsometricRoomSceneProps) {
  return (
    <View style={styles.scene}>
      <View style={styles.floatShadow} />
      <View style={styles.roomShell}>
        <View style={styles.leftWall}>
          <View style={[styles.window, styles.leftWindow]}>
            <View style={styles.windowShine} />
          </View>
          <View style={styles.wallRibbon} />
        </View>
        <View style={styles.rightWall}>
          <View style={styles.wallClock} />
          <View style={styles.wallPoster}>
            <Text style={styles.posterText}>MoveOn</Text>
          </View>
        </View>
        <View style={styles.floor}>
          {tileIndexes.map((index) => (
            <View
              key={`tile-v-${index}`}
              pointerEvents="none"
              style={[styles.tileLineVertical, { left: `${index * 10}%` }]}
            />
          ))}
          {tileIndexes.map((index) => (
            <View
              key={`tile-h-${index}`}
              pointerEvents="none"
              style={[styles.tileLineHorizontal, { top: `${index * 10}%` }]}
            />
          ))}
        </View>

        {isometricRoomObjects.map((object) => (
          <RoomObjectPreview key={object.id} object={object} />
        ))}

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

function RoomObjectPreview({ object }: { object: IsometricRoomObjectLayout }) {
  const baseStyle = {
    left: object.x,
    top: object.y,
    width: object.width,
    height: object.height,
    zIndex: object.zIndex,
    opacity: object.opacity ?? 1,
    transform: object.rotation ? [{ rotate: object.rotation }] : undefined,
  };

  if (object.id === 'bed') {
    return (
      <View style={[styles.object, baseStyle]}>
        <View style={styles.bedFrame}>
          <View style={styles.bedPillow} />
          <View style={styles.bedBlanket} />
          <Text style={styles.objectLabel}>휴식</Text>
        </View>
        <View style={styles.sideTable} />
      </View>
    );
  }

  if (object.id === 'vanity') {
    return (
      <View style={[styles.object, baseStyle]}>
        <View style={styles.vanityMirror} />
        <View style={styles.vanityDesk}>
          <View style={styles.vanityDrawer} />
          <View style={styles.vanityDrawer} />
        </View>
        <Text style={styles.smallLabel}>화장대</Text>
      </View>
    );
  }

  if (object.id === 'waterPlant') {
    return (
      <View style={[styles.object, baseStyle]}>
        <View style={styles.plantLeaves}>
          <View style={[styles.leaf, styles.leafOne]} />
          <View style={[styles.leaf, styles.leafTwo]} />
          <View style={[styles.leaf, styles.leafThree]} />
        </View>
        <View style={styles.plantPot} />
        <View style={styles.waterCup} />
        <Text style={styles.smallLabel}>물</Text>
      </View>
    );
  }

  if (object.id === 'studyDesk') {
    return (
      <View style={[styles.object, baseStyle]}>
        <View style={styles.deskTop}>
          <View style={styles.monitor} />
          <View style={styles.bookOpen} />
          <View style={styles.deskLamp} />
        </View>
        <View style={styles.deskChair} />
        <Text style={styles.objectLabel}>공부</Text>
      </View>
    );
  }

  if (object.id === 'bookshelf') {
    return (
      <View style={[styles.object, baseStyle]}>
        <View style={styles.bookshelf}>
          {[0, 1, 2].map((row) => (
            <View key={row} style={styles.shelfRow}>
              {[0, 1, 2, 3].map((book) => (
                <View
                  key={`${row}-${book}`}
                  style={[
                    styles.bookSpine,
                    { height: 22 + ((row + book) % 3) * 7 },
                    book % 2 === 0 && styles.bookSpineBlue,
                  ]}
                />
              ))}
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (object.id === 'showerDoor') {
    return (
      <View style={[styles.object, baseStyle]}>
        <View style={styles.showerDoor}>
          <View style={styles.doorKnob} />
          <Text style={styles.doorSign}>샤워</Text>
        </View>
        <View style={styles.towel} />
      </View>
    );
  }

  if (object.id === 'centerTable') {
    return (
      <View style={[styles.object, baseStyle]}>
        <View style={styles.rug} />
        <View style={styles.centerTable}>
          <View style={styles.teaCup} />
        </View>
      </View>
    );
  }

  if (object.id === 'questBoard') {
    return (
      <View style={[styles.object, baseStyle]}>
        <View style={styles.questBoard}>
          <Text style={styles.questTitle}>오늘 3 / 5</Text>
          <View style={styles.questNote} />
          <View style={[styles.questNote, styles.questNoteAlt]} />
        </View>
      </View>
    );
  }

  if (object.id === 'newspaper') {
    return (
      <View style={[styles.object, baseStyle]}>
        <View style={styles.newspaperBack} />
        <View style={styles.newspaperFront}>
          <Text numberOfLines={1} style={styles.newspaperTitle}>Move On Times</Text>
          <View style={styles.newspaperLine} />
          <View style={[styles.newspaperLine, styles.newspaperLineShort]} />
        </View>
      </View>
    );
  }

  if (object.id === 'cleaningFloor') {
    return (
      <View style={[styles.object, baseStyle]}>
        <View style={styles.broomStick} />
        <View style={styles.broomHead} />
        <Text style={styles.cleaningLabel}>청소</Text>
      </View>
    );
  }

  if (object.id === 'character') {
    return (
      <View style={[styles.object, baseStyle]}>
        <View style={styles.characterShadow} />
        <View style={styles.characterBody}>
          <View style={styles.characterHead}>
            <Text style={styles.characterFace}>나</Text>
          </View>
          <View style={styles.characterTorso} />
        </View>
      </View>
    );
  }

  if (object.id === 'pet') {
    return (
      <View style={[styles.object, baseStyle]}>
        <View style={styles.petShadow} />
        <View style={styles.petBody}>
          <Text style={styles.petText}>펫</Text>
        </View>
      </View>
    );
  }

  return null;
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
    left: 84,
    right: 84,
    bottom: 34,
    height: 44,
    borderRadius: 999,
    backgroundColor: 'rgba(125, 151, 171, 0.22)',
    transform: [{ scaleX: 1.18 }],
  },
  roomShell: {
    width: ROOM_DESIGN_WIDTH,
    height: ROOM_DESIGN_HEIGHT,
  },
  leftWall: {
    position: 'absolute',
    left: 82,
    top: 48,
    width: 304,
    height: 246,
    borderTopLeftRadius: 28,
    borderWidth: 4,
    borderColor: '#F1B8C9',
    backgroundColor: '#FFD3E2',
    transform: [{ skewY: '-14deg' }],
    shadowColor: '#B7899B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
  },
  rightWall: {
    position: 'absolute',
    right: 82,
    top: 48,
    width: 304,
    height: 246,
    borderTopRightRadius: 28,
    borderWidth: 4,
    borderColor: '#EFB0C5',
    backgroundColor: '#FFC6DA',
    transform: [{ skewY: '14deg' }],
    shadowColor: '#B7899B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
  },
  floor: {
    position: 'absolute',
    left: 118,
    top: 218,
    width: 532,
    height: 308,
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: '#F0ADC0',
    borderRadius: 22,
    backgroundColor: '#FBD1DA',
    transform: [{ rotate: '45deg' }, { scaleY: 0.58 }],
    shadowColor: '#D3A6B4',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.24,
    shadowRadius: 18,
  },
  tileLineVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: 'rgba(255, 249, 239, 0.46)',
  },
  tileLineHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255, 249, 239, 0.42)',
  },
  window: {
    position: 'absolute',
    width: 92,
    height: 62,
    borderRadius: 10,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    backgroundColor: '#CFE8F8',
  },
  leftWindow: {
    left: 72,
    top: 44,
  },
  windowShine: {
    position: 'absolute',
    left: 36,
    top: -2,
    width: 9,
    height: 66,
    backgroundColor: 'rgba(255, 255, 255, 0.48)',
    transform: [{ rotate: '18deg' }],
  },
  wallRibbon: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 46,
    height: 18,
    backgroundColor: 'rgba(255, 243, 249, 0.38)',
  },
  wallClock: {
    position: 'absolute',
    left: 84,
    top: 36,
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 3,
    borderColor: '#A8796F',
    backgroundColor: '#FFF8EC',
  },
  wallPoster: {
    position: 'absolute',
    right: 52,
    top: 58,
    width: 70,
    height: 52,
    borderRadius: 6,
    borderWidth: 3,
    borderColor: '#FFF8EC',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8E9A7',
  },
  posterText: {
    color: '#8A6558',
    fontSize: 11,
    fontWeight: '900',
  },
  object: {
    position: 'absolute',
  },
  bedFrame: {
    position: 'absolute',
    left: 0,
    right: 22,
    top: 18,
    bottom: 8,
    borderRadius: 22,
    borderWidth: 4,
    borderColor: '#D89BA9',
    backgroundColor: '#F7C0C8',
    shadowColor: '#B57F8D',
    shadowOffset: { width: 4, height: 7 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
  },
  bedPillow: {
    position: 'absolute',
    right: 18,
    top: 12,
    width: 52,
    height: 32,
    borderRadius: 14,
    backgroundColor: '#FFF8EC',
  },
  bedBlanket: {
    position: 'absolute',
    left: 18,
    right: 16,
    bottom: 14,
    height: 42,
    borderRadius: 16,
    backgroundColor: '#F4AEBE',
  },
  sideTable: {
    position: 'absolute',
    right: 0,
    bottom: 4,
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F3D2A6',
  },
  objectLabel: {
    position: 'absolute',
    left: 12,
    bottom: 11,
    color: '#6F5148',
    fontSize: 13,
    fontWeight: '900',
  },
  smallLabel: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: -3,
    color: '#6F5148',
    fontSize: 11,
    fontWeight: '900',
  },
  vanityMirror: {
    alignSelf: 'center',
    width: 54,
    height: 66,
    borderRadius: 28,
    borderWidth: 4,
    borderColor: '#F8EFF3',
    backgroundColor: '#CFE5F4',
  },
  vanityDesk: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 14,
    height: 34,
    borderRadius: 11,
    backgroundColor: '#F1B4C4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  vanityDrawer: {
    width: 28,
    height: 18,
    borderRadius: 6,
    backgroundColor: '#F9D7DF',
  },
  plantLeaves: {
    position: 'absolute',
    left: 34,
    top: 8,
    width: 50,
    height: 48,
  },
  leaf: {
    position: 'absolute',
    width: 28,
    height: 14,
    borderRadius: 18,
    backgroundColor: '#89AD74',
  },
  leafOne: { left: 4, top: 18, transform: [{ rotate: '-34deg' }] },
  leafTwo: { left: 20, top: 6, transform: [{ rotate: '28deg' }] },
  leafThree: { left: 24, top: 28, transform: [{ rotate: '-4deg' }] },
  plantPot: {
    position: 'absolute',
    left: 39,
    top: 52,
    width: 38,
    height: 32,
    borderRadius: 11,
    backgroundColor: '#D69A72',
  },
  waterCup: {
    position: 'absolute',
    right: 18,
    bottom: 26,
    width: 25,
    height: 30,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#8FBFD5',
    backgroundColor: '#D8EFF8',
  },
  deskTop: {
    position: 'absolute',
    left: 4,
    right: 4,
    top: 20,
    height: 62,
    borderRadius: 14,
    backgroundColor: '#FFF2CE',
    borderWidth: 3,
    borderColor: '#E5B983',
  },
  monitor: {
    position: 'absolute',
    right: 18,
    top: -20,
    width: 54,
    height: 40,
    borderRadius: 7,
    backgroundColor: '#B9DDF0',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  bookOpen: {
    position: 'absolute',
    left: 30,
    top: 18,
    width: 58,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#FFFDF8',
    borderWidth: 2,
    borderColor: '#E7D8C3',
  },
  deskLamp: {
    position: 'absolute',
    right: 82,
    top: -12,
    width: 18,
    height: 54,
    borderRadius: 8,
    backgroundColor: '#F6C968',
  },
  deskChair: {
    position: 'absolute',
    left: 58,
    bottom: 8,
    width: 62,
    height: 36,
    borderRadius: 16,
    backgroundColor: '#F8ADC2',
  },
  bookshelf: {
    flex: 1,
    padding: 8,
    borderRadius: 13,
    borderWidth: 4,
    borderColor: '#C28762',
    backgroundColor: '#D9A16E',
    justifyContent: 'space-around',
  },
  shelfRow: {
    height: 34,
    borderBottomWidth: 3,
    borderBottomColor: '#A97450',
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  bookSpine: {
    width: 9,
    borderRadius: 3,
    backgroundColor: '#95A873',
  },
  bookSpineBlue: {
    backgroundColor: '#91B9D1',
  },
  showerDoor: {
    flex: 1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 4,
    borderColor: '#F0AFC2',
    backgroundColor: '#F5D194',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doorKnob: {
    position: 'absolute',
    right: 12,
    top: 76,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#9B6B55',
  },
  doorSign: {
    color: '#8A5E55',
    fontSize: 12,
    fontWeight: '900',
  },
  towel: {
    position: 'absolute',
    left: -24,
    top: 52,
    width: 24,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#FFF4F8',
  },
  rug: {
    position: 'absolute',
    left: -8,
    right: -8,
    top: 14,
    bottom: 0,
    borderRadius: 42,
    backgroundColor: '#F4E9F1',
    transform: [{ scaleY: 0.62 }],
  },
  centerTable: {
    position: 'absolute',
    left: 25,
    right: 25,
    top: 28,
    height: 58,
    borderRadius: 24,
    borderWidth: 4,
    borderColor: '#E8BB84',
    backgroundColor: '#FFF1C7',
  },
  teaCup: {
    position: 'absolute',
    left: 26,
    top: 15,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#F8D37B',
  },
  questBoard: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    borderWidth: 4,
    borderColor: '#AD7B61',
    backgroundColor: '#E5BD8F',
  },
  questTitle: {
    color: '#6E5046',
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'center',
  },
  questNote: {
    marginTop: 8,
    height: 16,
    borderRadius: 4,
    backgroundColor: '#FFF2B8',
  },
  questNoteAlt: {
    width: '72%',
    backgroundColor: '#D8E8CE',
  },
  newspaperBack: {
    position: 'absolute',
    left: 5,
    right: -5,
    top: 6,
    bottom: -5,
    borderRadius: 4,
    backgroundColor: '#D9C8AF',
  },
  newspaperFront: {
    flex: 1,
    padding: 7,
    borderRadius: 4,
    backgroundColor: '#FFF8E9',
    borderWidth: 2,
    borderColor: '#D9C8AF',
  },
  newspaperTitle: {
    color: '#4B3A31',
    fontSize: 8,
    fontWeight: '900',
  },
  newspaperLine: {
    height: 2,
    marginTop: 5,
    borderRadius: 2,
    backgroundColor: '#A68D78',
  },
  newspaperLineShort: {
    width: '64%',
  },
  broomStick: {
    position: 'absolute',
    left: 34,
    top: 0,
    width: 8,
    height: 62,
    borderRadius: 6,
    backgroundColor: '#BA8759',
  },
  broomHead: {
    position: 'absolute',
    left: 18,
    bottom: 2,
    width: 42,
    height: 22,
    borderRadius: 10,
    backgroundColor: '#E8C88D',
  },
  cleaningLabel: {
    position: 'absolute',
    left: 56,
    top: 28,
    color: '#6F5148',
    fontSize: 12,
    fontWeight: '900',
  },
  characterShadow: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 6,
    height: 16,
    borderRadius: 999,
    backgroundColor: 'rgba(105, 78, 78, 0.2)',
  },
  characterBody: {
    alignItems: 'center',
  },
  characterHead: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7D7C5',
    borderWidth: 4,
    borderColor: '#7B5A4D',
  },
  characterFace: {
    color: '#5E4138',
    fontSize: 16,
    fontWeight: '900',
  },
  characterTorso: {
    marginTop: -4,
    width: 52,
    height: 52,
    borderRadius: 20,
    backgroundColor: '#FFF4DF',
    borderWidth: 4,
    borderColor: '#EBCDA8',
  },
  petShadow: {
    position: 'absolute',
    left: 9,
    right: 9,
    bottom: 3,
    height: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(105, 78, 78, 0.18)',
  },
  petBody: {
    marginTop: 6,
    width: 62,
    height: 42,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4D8A4',
    borderWidth: 4,
    borderColor: '#D6A970',
  },
  petText: {
    color: '#76573D',
    fontSize: 12,
    fontWeight: '900',
  },
});
