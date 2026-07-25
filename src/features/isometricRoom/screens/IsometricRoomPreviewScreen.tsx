import { Ionicons } from '@expo/vector-icons';
import { type Href, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IsometricRoomScene } from '../components/IsometricRoomScene';
import {
  ROOM_DESIGN_HEIGHT,
  ROOM_DESIGN_WIDTH,
} from '../constants/isometricRoomLayout';
import type { IsometricRoomObjectId } from '../types/isometricRoom';

type ViewportSize = {
  width: number;
  height: number;
};

const routeByObject: Partial<Record<IsometricRoomObjectId, Href>> = {
  studyDesk: '/study-desk',
  bookshelf: '/bookshelf',
  showerDoor: '/shower',
  questBoard: '/quests',
  newspaper: '/newspaper',
  cleaningFloor: '/cleaning',
};

export default function IsometricRoomPreviewScreen() {
  const router = useRouter();
  const [viewport, setViewport] = useState<ViewportSize>({ width: 0, height: 0 });
  const [showDebugHotspots, setShowDebugHotspots] = useState(false);
  const [waterNoticeVisible, setWaterNoticeVisible] = useState(false);
  const [routeNotice, setRouteNotice] = useState<string | null>(null);

  const sceneScale = useMemo(() => {
    if (viewport.width === 0 || viewport.height === 0) return 1;
    return Math.min(
      viewport.width / ROOM_DESIGN_WIDTH,
      viewport.height / ROOM_DESIGN_HEIGHT,
    );
  }, [viewport.height, viewport.width]);

  const scaledSceneSize = useMemo(() => ({
    width: ROOM_DESIGN_WIDTH * sceneScale,
    height: ROOM_DESIGN_HEIGHT * sceneScale,
  }), [sceneScale]);

  const handleSceneLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setViewport((current) => (
      current.width === width && current.height === height ? current : { width, height }
    ));
  };

  const openRoute = (objectId: IsometricRoomObjectId, label: string) => {
    if (objectId === 'waterPlant') {
      setWaterNoticeVisible(true);
      return;
    }

    const route = routeByObject[objectId];
    if (!route) return;

    try {
      router.push(route);
    } catch (error) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('Failed to open isometric room route.', { objectId, route, error });
      }
      setRouteNotice(`${label} 화면으로 이동하지 못했어요. route 연결을 확인해 주세요.`);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="뒤로 가기"
          accessibilityRole="button"
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <Ionicons name="chevron-back" size={24} color="#51433A" />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>MoveOn Room Preview</Text>
          <Text numberOfLines={1} style={styles.subtitle}>이미지 기반 원룸 배치 확인용</Text>
        </View>
        <Pressable
          accessibilityLabel="터치 영역 디버그 표시 전환"
          accessibilityRole="switch"
          accessibilityState={{ checked: showDebugHotspots }}
          onPress={() => setShowDebugHotspots((current) => !current)}
          style={({ pressed }) => [
            styles.debugToggle,
            showDebugHotspots && styles.debugToggleActive,
            pressed && styles.pressed,
          ]}
        >
          <Text style={[styles.debugToggleText, showDebugHotspots && styles.debugToggleTextActive]}>
            HIT
          </Text>
        </Pressable>
      </View>

      <View onLayout={handleSceneLayout} style={styles.previewArea}>
        <View
          style={[
            styles.scaledSceneFrame,
            {
              width: scaledSceneSize.width,
              height: scaledSceneSize.height,
            },
          ]}
        >
          <View
            style={[
              styles.scaledScene,
              {
                left: (scaledSceneSize.width - ROOM_DESIGN_WIDTH) / 2,
                top: (scaledSceneSize.height - ROOM_DESIGN_HEIGHT) / 2,
                transform: [{ scale: sceneScale }],
              },
            ]}
          >
            <IsometricRoomScene
              onObjectPress={openRoute}
              showDebugHotspots={showDebugHotspots}
            />
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>방 안의 물건을 눌러 기능 연결을 확인해 보세요.</Text>
        {__DEV__ ? (
          <Text style={styles.footerMeta}>
            {ROOM_DESIGN_WIDTH}×{ROOM_DESIGN_HEIGHT} canvas · scale {sceneScale.toFixed(2)}
          </Text>
        ) : null}
      </View>

      <Modal
        animationType="fade"
        onRequestClose={() => setWaterNoticeVisible(false)}
        transparent
        visible={waterNoticeVisible}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setWaterNoticeVisible(false)}>
          <Pressable style={styles.modalCard} onPress={() => null}>
            <Text style={styles.modalTitle}>물 마시기 연결 예정</Text>
            <Text style={styles.modalDescription}>
              기존 물 마시기 기능은 현재 홈의 WaterMissionLayer 내부 흐름에 연결되어 있어요.
              이번 프리뷰에서는 위치와 터치감만 확인하고, 다음 단계에서 기존 물 미션 상태와 안전하게 연결합니다.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setWaterNoticeVisible(false)}
              style={({ pressed }) => [styles.modalButton, pressed && styles.pressed]}
            >
              <Text style={styles.modalButtonText}>확인</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        animationType="fade"
        onRequestClose={() => setRouteNotice(null)}
        transparent
        visible={routeNotice !== null}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setRouteNotice(null)}>
          <Pressable style={styles.modalCard} onPress={() => null}>
            <Text style={styles.modalTitle}>이동 실패</Text>
            <Text style={styles.modalDescription}>{routeNotice}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setRouteNotice(null)}
              style={({ pressed }) => [styles.modalButton, pressed && styles.pressed]}
            >
              <Text style={styles.modalButtonText}>확인</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F2E8',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 2,
    paddingBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFDF8',
    shadowColor: '#6F5E51',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: Platform.OS === 'web' ? 0.08 : 0.12,
    shadowRadius: 9,
    elevation: 3,
  },
  headerCopy: {
    flex: 1,
  },
  title: {
    color: '#392F28',
    fontSize: 18,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: 2,
    color: '#817066',
    fontSize: 11,
    fontWeight: '700',
  },
  debugToggle: {
    minWidth: 48,
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2D5C5',
    backgroundColor: '#FFFDF8',
  },
  debugToggleActive: {
    borderColor: '#82A0C9',
    backgroundColor: '#DCEBFF',
  },
  debugToggleText: {
    color: '#827266',
    fontSize: 11,
    fontWeight: '900',
  },
  debugToggleTextActive: {
    color: '#3E648F',
  },
  previewArea: {
    height: '60%',
    minHeight: 330,
    maxHeight: 520,
    marginHorizontal: 8,
    marginTop: 2,
    marginBottom: 4,
    overflow: 'visible',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  scaledSceneFrame: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scaledScene: {
    position: 'absolute',
    width: ROOM_DESIGN_WIDTH,
    height: ROOM_DESIGN_HEIGHT,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 6,
    paddingBottom: 12,
    alignItems: 'center',
  },
  footerText: {
    color: '#5F5248',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  footerMeta: {
    marginTop: 4,
    color: '#A08E7E',
    fontSize: 10,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
  modalBackdrop: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(55, 43, 36, 0.36)',
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    padding: 22,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E7D8C3',
    backgroundColor: '#FFF9EF',
  },
  modalTitle: {
    color: '#372E27',
    fontSize: 19,
    fontWeight: '900',
  },
  modalDescription: {
    marginTop: 9,
    color: '#6D5F54',
    fontSize: 13,
    lineHeight: 21,
    fontWeight: '700',
  },
  modalButton: {
    marginTop: 18,
    minHeight: 48,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7D8D62',
  },
  modalButtonText: {
    color: '#FFF9EF',
    fontSize: 14,
    fontWeight: '900',
  },
});
