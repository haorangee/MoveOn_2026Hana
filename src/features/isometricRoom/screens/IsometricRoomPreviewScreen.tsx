import { Ionicons } from '@expo/vector-icons';
import { type Href, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  MVP_CHARACTER_CATALOG,
  MVP_CHARACTER_IDS,
} from '@/features/customization/catalogs/characterCatalog';
import {
  MVP_PET_CATALOG,
  MVP_PET_IDS,
} from '@/features/customization/catalogs/petCatalog';
import type {
  MvpCharacterId,
  MvpPetId,
} from '@/features/customization/types/customization';
import { IsometricRoomScene } from '../components/IsometricRoomScene';
import { WaterPlantStatusModal } from '../components/WaterPlantStatusModal';
import {
  isometricCharacterAnchor,
  isometricPetAnchor,
  ROOM_DESIGN_HEIGHT,
  ROOM_DESIGN_WIDTH,
} from '../constants/isometricRoomLayout';
import { useIsometricRoomProfile } from '../hooks/useIsometricRoomProfile';
import { useIsometricCleaningState } from '../hooks/useIsometricCleaningState';
import { useIsometricShowerState } from '../hooks/useIsometricShowerState';
import { useIsometricStudyBooksState } from '../hooks/useIsometricStudyBooksState';
import { useIsometricWaterPlantState } from '../hooks/useIsometricWaterPlantState';
import type {
  IsometricCleaningStage,
  IsometricPlantStage,
  IsometricRoomObjectId,
  IsometricShowerStage,
} from '../types/isometricRoom';
import { createPreviewIsometricStudyBooks } from '../utils/layoutIsometricStudyBooks';

type ViewportSize = {
  width: number;
  height: number;
};

type BookPreviewMode = 'actual' | '0' | '3' | '6' | '10' | 'full';
type CleaningPreviewMode = 'actual' | IsometricCleaningStage;
type ShowerPreviewMode = 'actual' | IsometricShowerStage;

const routeByObject: Partial<Record<IsometricRoomObjectId, Href>> = {
  studyDesk: '/study-desk',
  bookshelf: '/bookshelf',
  showerDoor: '/shower',
  questBoard: '/quests',
  newspaper: '/newspaper',
  cleaningFloor: '/cleaning',
};

const previewStages: Array<IsometricPlantStage> = [0, 1, 2, 3, 4, 5];
const cleaningPreviewStages: IsometricCleaningStage[] = [0, 1, 2, 3];
const bookPreviewModes: Array<{ label: string; mode: BookPreviewMode }> = [
  { label: '실제', mode: 'actual' },
  { label: '0', mode: '0' },
  { label: '3', mode: '3' },
  { label: '6', mode: '6' },
  { label: '10', mode: '10' },
  { label: '가득', mode: 'full' },
];

export default function IsometricRoomPreviewScreen() {
  const router = useRouter();
  const profile = useIsometricRoomProfile();
  const cleaningState = useIsometricCleaningState();
  const showerState = useIsometricShowerState();
  const waterPlantState = useIsometricWaterPlantState();
  const studyBooksState = useIsometricStudyBooksState();
  const [viewport, setViewport] = useState<ViewportSize>({ width: 0, height: 0 });
  const [showDebugHotspots, setShowDebugHotspots] = useState(false);
  const [showAvatarPanel, setShowAvatarPanel] = useState(false);
  const [showStatePanel, setShowStatePanel] = useState(false);
  const [previewCharacterId, setPreviewCharacterId] = useState<MvpCharacterId | null>(null);
  const [previewPetId, setPreviewPetId] = useState<MvpPetId | null>(null);
  const [previewPlantStage, setPreviewPlantStage] = useState<IsometricPlantStage | null>(null);
  const [previewBookMode, setPreviewBookMode] = useState<BookPreviewMode>('actual');
  const [previewCleaningMode, setPreviewCleaningMode] = useState<CleaningPreviewMode>('actual');
  const [previewShowerMode, setPreviewShowerMode] = useState<ShowerPreviewMode>('actual');
  const [waterStatusVisible, setWaterStatusVisible] = useState(false);
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

  const currentCharacterId = previewCharacterId ?? profile.characterId;
  const currentPetId = previewPetId ?? profile.petId;
  const currentPlantStage = previewPlantStage ?? waterPlantState.stage;
  const currentPlantCompleted = currentPlantStage >= 5 || (
    previewPlantStage === null && waterPlantState.isCompleted
  );
  const currentCleaningStage = previewCleaningMode === 'actual'
    ? cleaningState.stage
    : previewCleaningMode;
  const currentShowerStage = previewShowerMode === 'actual'
    ? showerState.stage
    : previewShowerMode;
  const currentCharacter = MVP_CHARACTER_CATALOG.find((item) => item.id === currentCharacterId)
    ?? MVP_CHARACTER_CATALOG[0];
  const currentPet = MVP_PET_CATALOG.find((item) => item.id === currentPetId)
    ?? MVP_PET_CATALOG[0];
  const currentStudyBooks = useMemo(() => {
    if (previewBookMode === 'actual') {
      return studyBooksState.visibleBooks;
    }

    const count = previewBookMode === 'full'
      ? studyBooksState.maxVisibleBooks
      : Number(previewBookMode);
    return createPreviewIsometricStudyBooks(count);
  }, [
    previewBookMode,
    studyBooksState.maxVisibleBooks,
    studyBooksState.visibleBooks,
  ]);

  const handleSceneLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setViewport((current) => (
      current.width === width && current.height === height ? current : { width, height }
    ));
  };

  const moveCharacterPreview = (direction: 1 | -1) => {
    setPreviewCharacterId((current) => {
      const currentIndex = MVP_CHARACTER_IDS.indexOf(current ?? profile.characterId);
      const nextIndex = (currentIndex + direction + MVP_CHARACTER_IDS.length)
        % MVP_CHARACTER_IDS.length;
      return MVP_CHARACTER_IDS[nextIndex];
    });
  };

  const movePetPreview = (direction: 1 | -1) => {
    setPreviewPetId((current) => {
      const currentIndex = MVP_PET_IDS.indexOf(current ?? profile.petId);
      const nextIndex = (currentIndex + direction + MVP_PET_IDS.length) % MVP_PET_IDS.length;
      return MVP_PET_IDS[nextIndex];
    });
  };

  const restoreProfileAvatar = () => {
    setPreviewCharacterId(null);
    setPreviewPetId(null);
  };

  const openRoute = (objectId: IsometricRoomObjectId, label: string) => {
    if (objectId === 'waterPlant') {
      void waterPlantState.reload();
      setWaterStatusVisible(true);
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

  const selectBookPreviewMode = (mode: BookPreviewMode) => {
    setPreviewBookMode(mode);
    if (mode === 'actual') {
      void studyBooksState.reload();
    }
  };

  const selectCleaningPreviewMode = (mode: CleaningPreviewMode) => {
    setPreviewCleaningMode(mode);
    if (mode === 'actual') {
      void cleaningState.reload();
    }
  };

  const selectShowerPreviewMode = (mode: ShowerPreviewMode) => {
    setPreviewShowerMode(mode);
    if (mode === 'actual') {
      void showerState.reload();
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
          <Text numberOfLines={1} style={styles.subtitle}>이미지 기반 아이소메트릭 방 상태 확인</Text>
        </View>
        <Pressable
          accessibilityLabel="배치 영역 디버그 표시 전환"
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
        {__DEV__ ? (
          <Pressable
            accessibilityLabel="AVATAR 개발 패널 열기"
            accessibilityRole="button"
            onPress={() => setShowAvatarPanel((current) => !current)}
            style={({ pressed }) => [
              styles.debugToggle,
              showAvatarPanel && styles.avatarToggleActive,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.debugToggleText, showAvatarPanel && styles.avatarToggleTextActive]}>
              AVATAR
            </Text>
          </Pressable>
        ) : null}
        {__DEV__ ? (
          <Pressable
            accessibilityLabel="STATE 개발 패널 열기"
            accessibilityRole="button"
            onPress={() => setShowStatePanel((current) => !current)}
            style={({ pressed }) => [
              styles.debugToggle,
              showStatePanel && styles.stateToggleActive,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.debugToggleText, showStatePanel && styles.stateToggleTextActive]}>
              STATE
            </Text>
          </Pressable>
        ) : null}
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
              characterIdOverride={previewCharacterId}
              cleaningStage={currentCleaningStage}
              onObjectPress={openRoute}
              petIdOverride={previewPetId}
              plantCompleted={currentPlantCompleted}
              plantStage={currentPlantStage}
              showerStage={currentShowerStage}
              showDebugHotspots={showDebugHotspots}
              studyBooks={currentStudyBooks}
            />
          </View>
        </View>
      </View>

      {__DEV__ && showAvatarPanel ? (
        <View style={styles.avatarPanel}>
          <View style={styles.avatarRow}>
            <Text style={styles.avatarLabel}>캐릭터</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => moveCharacterPreview(-1)}
              style={({ pressed }) => [styles.avatarStepButton, pressed && styles.pressed]}
            >
              <Text style={styles.avatarStepText}>이전</Text>
            </Pressable>
            <Text numberOfLines={1} style={styles.avatarValue}>
              {currentCharacter.id} · {currentCharacter.displayName}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => moveCharacterPreview(1)}
              style={({ pressed }) => [styles.avatarStepButton, pressed && styles.pressed]}
            >
              <Text style={styles.avatarStepText}>다음</Text>
            </Pressable>
          </View>
          <View style={styles.avatarRow}>
            <Text style={styles.avatarLabel}>펫</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => movePetPreview(-1)}
              style={({ pressed }) => [styles.avatarStepButton, pressed && styles.pressed]}
            >
              <Text style={styles.avatarStepText}>이전</Text>
            </Pressable>
            <Text numberOfLines={1} style={styles.avatarValue}>
              {currentPet.id} · {currentPet.displayName}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => movePetPreview(1)}
              style={({ pressed }) => [styles.avatarStepButton, pressed && styles.pressed]}
            >
              <Text style={styles.avatarStepText}>다음</Text>
            </Pressable>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={restoreProfileAvatar}
            style={({ pressed }) => [styles.avatarRestoreButton, pressed && styles.pressed]}
          >
            <Text style={styles.avatarRestoreText}>프로필 값으로 복원</Text>
          </Pressable>
          <Text style={styles.avatarAnchorText}>
            Character anchor: {isometricCharacterAnchor.x}, {isometricCharacterAnchor.y}
            {' · '}
            Pet anchor: {isometricPetAnchor.x}, {isometricPetAnchor.y}
          </Text>
        </View>
      ) : null}

      {__DEV__ && showStatePanel ? (
        <ScrollView
          style={styles.statePanel}
          contentContainerStyle={styles.statePanelContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.stateHeader}>
            <Text style={styles.stateTitle}>화분 단계</Text>
            <Text style={styles.stateMeta}>
              실제 {waterPlantState.recordedCupCount}/{waterPlantState.goalCupCount}컵 · {waterPlantState.recordedAmountMl.toLocaleString()}ml
            </Text>
          </View>
          <View style={styles.stageRow}>
            <PreviewButton
              label="실제"
              onPress={() => setPreviewPlantStage(null)}
              selected={previewPlantStage === null}
            />
            {previewStages.map((stage) => (
              <PreviewButton
                key={stage}
                label={String(stage)}
                onPress={() => setPreviewPlantStage(stage)}
                selected={previewPlantStage === stage}
              />
            ))}
          </View>

          <View style={styles.stateDivider} />

          <View style={styles.stateHeader}>
            <Text style={styles.stateTitle}>책장</Text>
            <Text style={styles.stateMeta}>
              표시 {currentStudyBooks.length}권 / 실제 {studyBooksState.totalBookCount}권
            </Text>
          </View>
          <View style={styles.stageRow}>
            {bookPreviewModes.map((item) => (
              <PreviewButton
                key={item.mode}
                label={item.label}
                onPress={() => selectBookPreviewMode(item.mode)}
                selected={previewBookMode === item.mode}
              />
            ))}
          </View>

          <View style={styles.stateDivider} />

          <View style={styles.stateHeader}>
            <Text style={styles.stateTitle}>청소</Text>
            <Text style={styles.stateMeta}>
              실제 {cleaningState.todayCleaningCount} / 3회 · stage {cleaningState.stage}
            </Text>
          </View>
          <View style={styles.stageRow}>
            <PreviewButton
              label="실제"
              onPress={() => selectCleaningPreviewMode('actual')}
              selected={previewCleaningMode === 'actual'}
            />
            {cleaningPreviewStages.map((stage) => (
              <PreviewButton
                key={stage}
                label={String(stage)}
                onPress={() => selectCleaningPreviewMode(stage)}
                selected={previewCleaningMode === stage}
              />
            ))}
          </View>

          <View style={styles.stateDivider} />

          <View style={styles.stateHeader}>
            <Text style={styles.stateTitle}>샤워</Text>
            <Text style={styles.stateMeta}>
              실제 {showerState.isCompleted ? '완료' : '미완료'}
              {showerState.todayShowerCount > 0 ? ` · ${showerState.todayShowerCount}회` : ''}
            </Text>
          </View>
          <View style={styles.stageRow}>
            <PreviewButton
              label="실제"
              onPress={() => selectShowerPreviewMode('actual')}
              selected={previewShowerMode === 'actual'}
            />
            <PreviewButton
              label="미완료"
              onPress={() => selectShowerPreviewMode(0)}
              selected={previewShowerMode === 0}
            />
            <PreviewButton
              label="완료"
              onPress={() => selectShowerPreviewMode(1)}
              selected={previewShowerMode === 1}
            />
          </View>
          <Text style={styles.stateHelp}>
            개발 전환은 화면 state만 바꾸며 물 기록·공부 기록·청소 기록·샤워 기록·AsyncStorage·Firestore에는 저장하지 않아요.
          </Text>
        </ScrollView>
      ) : null}

      <View style={styles.footer}>
        <Text style={styles.footerText}>방 안의 물건을 눌러 기능 연결을 확인해 보세요.</Text>
        {__DEV__ ? (
          <Text style={styles.footerMeta}>
            {ROOM_DESIGN_WIDTH}×{ROOM_DESIGN_HEIGHT} canvas · scale {sceneScale.toFixed(2)}
          </Text>
        ) : null}
      </View>

      <WaterPlantStatusModal
        error={waterPlantState.error}
        goalAmountMl={waterPlantState.goalAmountMl}
        goalCupCount={waterPlantState.goalCupCount}
        isCompleted={waterPlantState.isCompleted}
        onClose={() => setWaterStatusVisible(false)}
        recordedAmountMl={waterPlantState.recordedAmountMl}
        recordedCupCount={waterPlantState.recordedCupCount}
        stage={waterPlantState.stage}
        visible={waterStatusVisible}
      />

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

type PreviewButtonProps = {
  label: string;
  onPress: () => void;
  selected: boolean;
};

function PreviewButton({ label, onPress, selected }: PreviewButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.stageButton,
        selected && styles.stageButtonActive,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.stageButtonText, selected && styles.stageButtonTextActive]}>
        {label}
      </Text>
    </Pressable>
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
    gap: 8,
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
    paddingHorizontal: 11,
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
  avatarToggleActive: {
    borderColor: '#A586BE',
    backgroundColor: '#F1E5FF',
  },
  stateToggleActive: {
    borderColor: '#86A56D',
    backgroundColor: '#EAF4DD',
  },
  debugToggleText: {
    color: '#827266',
    fontSize: 11,
    fontWeight: '900',
  },
  debugToggleTextActive: {
    color: '#3E648F',
  },
  avatarToggleTextActive: {
    color: '#704D8E',
  },
  stateToggleTextActive: {
    color: '#577340',
  },
  previewArea: {
    height: '46%',
    minHeight: 300,
    maxHeight: 420,
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
  avatarPanel: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E3D6C5',
    backgroundColor: 'rgba(255, 253, 248, 0.96)',
    gap: 8,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarLabel: {
    width: 48,
    color: '#554A3D',
    fontSize: 12,
    fontWeight: '900',
  },
  avatarStepButton: {
    minWidth: 44,
    minHeight: 32,
    paddingHorizontal: 10,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFE5D7',
  },
  avatarStepText: {
    color: '#51433A',
    fontSize: 11,
    fontWeight: '900',
  },
  avatarValue: {
    flex: 1,
    color: '#6D5F54',
    fontSize: 11,
    fontWeight: '800',
  },
  avatarRestoreButton: {
    alignSelf: 'flex-end',
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7D8D62',
  },
  avatarRestoreText: {
    color: '#FFF9EF',
    fontSize: 11,
    fontWeight: '900',
  },
  avatarAnchorText: {
    color: '#9A8978',
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'right',
  },
  statePanel: {
    marginHorizontal: 16,
    marginBottom: 8,
    maxHeight: 230,
  },
  statePanelContent: {
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DCE8CF',
    backgroundColor: 'rgba(250, 255, 244, 0.96)',
    gap: 9,
  },
  stateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  stateTitle: {
    color: '#475D38',
    fontSize: 13,
    fontWeight: '900',
  },
  stateMeta: {
    flex: 1,
    color: '#7B8F66',
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'right',
  },
  stateDivider: {
    height: 1,
    backgroundColor: '#DEE8D4',
  },
  stageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  stageButton: {
    minWidth: 42,
    minHeight: 32,
    paddingHorizontal: 10,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF3E7',
  },
  stageButtonActive: {
    backgroundColor: '#7D8D62',
  },
  stageButtonText: {
    color: '#637452',
    fontSize: 11,
    fontWeight: '900',
  },
  stageButtonTextActive: {
    color: '#FFF9EF',
  },
  stateHelp: {
    color: '#8B9A78',
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 15,
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
