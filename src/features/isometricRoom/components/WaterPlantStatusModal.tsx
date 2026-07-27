import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { IsometricPlantStage } from '../types/isometricRoom';

type WaterPlantStatusModalProps = {
  error: Error | null;
  goalAmountMl: number;
  goalCupCount: number;
  isCompleted: boolean;
  onClose: () => void;
  recordedAmountMl: number;
  recordedCupCount: number;
  stage: IsometricPlantStage;
  visible: boolean;
};

function getStatusCopy(stage: IsometricPlantStage, isCompleted: boolean, error: Error | null) {
  if (error) {
    return '오늘의 물 기록을 불러오지 못했어요.\n잠시 후 다시 확인해 주세요.';
  }

  if (isCompleted || stage >= 5) {
    return '오늘의 물 마시기 목표를 달성했어요.\n화분이 활짝 피어났어요.';
  }

  if (stage === 0) {
    return '아직 물을 마시지 않았어요.\n첫 물부터 천천히 시작해 볼까요?';
  }

  return '화분이 조금씩 자라고 있어요.';
}

export function WaterPlantStatusModal({
  error,
  goalAmountMl,
  goalCupCount,
  isCompleted,
  onClose,
  recordedAmountMl,
  recordedCupCount,
  stage,
  visible,
}: WaterPlantStatusModalProps) {
  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={() => null}>
          <Text style={styles.modalTitle}>오늘의 물 마시기</Text>
          <Text style={styles.kicker}>화분 성장 {stage}단계</Text>
          <View style={styles.statusPanel}>
            <Text style={styles.statusLabel}>오늘 마신 물</Text>
            <Text style={styles.statusValue}>
              {recordedCupCount} / {goalCupCount}컵
            </Text>
            <Text style={styles.statusSubValue}>
              {recordedAmountMl.toLocaleString()} / {goalAmountMl.toLocaleString()}ml
            </Text>
          </View>
          <Text style={styles.modalDescription}>
            {getStatusCopy(stage, isCompleted, error)}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={({ pressed }) => [styles.modalButton, pressed && styles.pressed]}
          >
            <Text style={styles.modalButtonText}>확인</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
    fontSize: 20,
    fontWeight: '900',
  },
  kicker: {
    marginTop: 5,
    color: '#7D8D62',
    fontSize: 12,
    fontWeight: '900',
  },
  statusPanel: {
    marginTop: 16,
    padding: 15,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DDE8D1',
    backgroundColor: '#F8FBF1',
  },
  statusLabel: {
    color: '#7B735F',
    fontSize: 12,
    fontWeight: '900',
  },
  statusValue: {
    marginTop: 6,
    color: '#3F6978',
    fontSize: 24,
    fontWeight: '900',
  },
  statusSubValue: {
    marginTop: 2,
    color: '#64808B',
    fontSize: 13,
    fontWeight: '900',
  },
  modalDescription: {
    marginTop: 14,
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
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
});
