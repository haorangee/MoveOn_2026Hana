import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  type LayoutChangeEvent,
  StyleSheet,
  View,
} from 'react-native';
import { type Href, useRouter } from 'expo-router';
import { TopGameStatus } from '@/features/home/components/TopGameStatus';
import {
  consumeCleaningVerificationPending,
  useCleaningMission,
} from '@/features/home/cleaningMission';
import { IsometricRoomScene } from '@/features/isometricRoom/components/IsometricRoomScene';
import { WaterPlantStatusModal } from '@/features/isometricRoom/components/WaterPlantStatusModal';
import {
  ROOM_DESIGN_HEIGHT,
  ROOM_DESIGN_WIDTH,
} from '@/features/isometricRoom/constants/isometricRoomLayout';
import { useIsometricCleaningState } from '@/features/isometricRoom/hooks/useIsometricCleaningState';
import { useIsometricShowerState } from '@/features/isometricRoom/hooks/useIsometricShowerState';
import { useIsometricStudyBooksState } from '@/features/isometricRoom/hooks/useIsometricStudyBooksState';
import { useIsometricWaterPlantState } from '@/features/isometricRoom/hooks/useIsometricWaterPlantState';
import type { IsometricRoomObjectId } from '@/features/isometricRoom/types/isometricRoom';

const objectRoutes: Partial<Record<IsometricRoomObjectId, Href>> = {
  bookshelf: '/bookshelf' as Href,
  cleaningFloor: '/cleaning' as Href,
  newspaper: '/newspaper' as Href,
  questBoard: '/quests' as Href,
  showerDoor: '/shower' as Href,
  studyDesk: '/study-desk' as Href,
};

export function IsometricHomeRoom() {
  const router = useRouter();
  const waterPlant = useIsometricWaterPlantState();
  const studyBooks = useIsometricStudyBooksState();
  const cleaning = useIsometricCleaningState();
  const shower = useIsometricShowerState();
  const reloadCleaningState = cleaning.reload;
  const {
    isHydrated: isCleaningMissionHydrated,
    record: recordCleaningMission,
  } = useCleaningMission();
  const [waterModalVisible, setWaterModalVisible] = useState(false);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const pendingCleaningHandledRef = useRef(false);

  const sceneScale = useMemo(() => {
    if (stageSize.width <= 0 || stageSize.height <= 0) return 1;
    return Math.min(
      stageSize.width / ROOM_DESIGN_WIDTH,
      stageSize.height / ROOM_DESIGN_HEIGHT,
    );
  }, [stageSize.height, stageSize.width]);

  const scaledSceneWidth = ROOM_DESIGN_WIDTH * sceneScale;
  const scaledSceneHeight = ROOM_DESIGN_HEIGHT * sceneScale;

  const handleStageLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setStageSize((previous) => {
      if (previous.width === width && previous.height === height) return previous;
      return { width, height };
    });
  }, []);

  useEffect(() => {
    if (!isCleaningMissionHydrated || pendingCleaningHandledRef.current) return;

    let active = true;
    pendingCleaningHandledRef.current = true;

    async function syncPendingCleaningVerification() {
      try {
        const hasPendingVerification = await consumeCleaningVerificationPending();
        if (!hasPendingVerification || !active) return;

        await recordCleaningMission();
        if (active) {
          await reloadCleaningState();
        }
      } catch (error) {
        pendingCleaningHandledRef.current = false;
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.warn('Failed to sync cleaning verification in isometric home.', error);
        }
      }
    }

    void syncPendingCleaningVerification();

    return () => {
      active = false;
    };
  }, [isCleaningMissionHydrated, recordCleaningMission, reloadCleaningState]);

  const handleSettingsPress = useCallback(() => {
    router.push('/settings' as Href);
  }, [router]);

  const handleObjectPress = useCallback(
    (objectId: IsometricRoomObjectId) => {
      if (objectId === 'waterPlant') {
        void waterPlant.reload();
        setWaterModalVisible(true);
        return;
      }

      const route = objectRoutes[objectId];
      if (!route) return;

      router.push(route);
    },
    [router, waterPlant],
  );

  return (
    <View style={styles.container}>
      <View onLayout={handleStageLayout} style={styles.roomStage}>
        <View
          style={[
            styles.sceneViewport,
            {
              height: scaledSceneHeight,
              width: scaledSceneWidth,
            },
          ]}
        >
          <View
            style={[
              styles.sceneScaler,
              {
                transform: [{ scale: sceneScale }],
              },
            ]}
          >
            <IsometricRoomScene
              cleaningStage={cleaning.stage}
              onObjectPress={handleObjectPress}
              plantCompleted={waterPlant.isCompleted}
              plantStage={waterPlant.stage}
              showerStage={shower.stage}
              showDebugHotspots={false}
              studyBooks={studyBooks.visibleBooks}
            />
          </View>
        </View>
      </View>

      <TopGameStatus onSettingsPress={handleSettingsPress} />

      <WaterPlantStatusModal
        error={waterPlant.error}
        goalAmountMl={waterPlant.goalAmountMl}
        goalCupCount={waterPlant.goalCupCount}
        isCompleted={waterPlant.isCompleted}
        onClose={() => setWaterModalVisible(false)}
        recordedAmountMl={waterPlant.recordedAmountMl}
        recordedCupCount={waterPlant.recordedCupCount}
        stage={waterPlant.stage}
        visible={waterModalVisible}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4EDE1',
  },
  roomStage: {
    flex: 1,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sceneViewport: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  sceneScaler: {
    width: ROOM_DESIGN_WIDTH,
    height: ROOM_DESIGN_HEIGHT,
  },
});
