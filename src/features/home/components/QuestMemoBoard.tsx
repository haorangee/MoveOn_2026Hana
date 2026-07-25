import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { loadShowerDayRecord } from '@/features/home/showerMission';
import { useStudyBooks } from '@/features/home/studyBooks';

type QuestMemoBoardProps = {
  cleaningCompleted?: boolean;
  waterCompleted?: boolean;
};

function getLocalDateKey(now = new Date()) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function QuestMemoBoard({
  cleaningCompleted = false,
  waterCompleted = false,
}: QuestMemoBoardProps) {
  const { books } = useStudyBooks();
  const [showBoard, setShowBoard] = useState(false);
  const [showerCompleted, setShowerCompleted] = useState(false);
  const todayKey = useMemo(() => getLocalDateKey(), []);
  const studyCompleted = useMemo(
    () => books.some((book) => book.createdAt.slice(0, 10) === todayKey),
    [books, todayKey],
  );

  const quests = [
    { title: '샤워하기', done: showerCompleted, color: '#E8C99D' },
    { title: '방 청소하기', done: cleaningCompleted, color: '#D8DFAF' },
    { title: '물 마시기', done: waterCompleted, color: '#D7C3A7' },
    { title: '공부하기', done: studyCompleted, color: '#C8D8E8' },
  ];

  const refreshShowerStatus = async () => {
    const record = await loadShowerDayRecord(todayKey);
    setShowerCompleted(record.totalSeconds > 0);
  };

  useEffect(() => {
    void refreshShowerStatus();
  // todayKey is stable for this mounted home session.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayKey]);

  const openBoard = () => {
    void refreshShowerStatus();
    setShowBoard(true);
  };

  return (
    <>
      <Pressable
        accessibilityLabel="오늘의 작은 일 게시판 열기"
        accessibilityRole="button"
        onPress={openBoard}
        style={({ pressed }) => [styles.board, pressed && styles.pressed]}
      >
        <View pointerEvents="none" style={styles.boardGrain} />
        <View pointerEvents="none" style={[styles.pin, styles.leftPin]} />
        <View pointerEvents="none" style={[styles.pin, styles.rightPin]} />
        <Text pointerEvents="none" style={styles.heading}>오늘의 작은 일</Text>
        <View pointerEvents="none" style={styles.notes}>
          {quests.slice(0, 3).map((quest, index) => (
            <View
              key={quest.title}
              style={[
                styles.note,
                { backgroundColor: quest.color },
                index === 0 && styles.noteOne,
                index === 1 && styles.noteTwo,
                index === 2 && styles.noteThree,
              ]}
            >
              <View style={styles.tape} />
              <Text style={[styles.noteText, quest.done && styles.doneText]}>
                {quest.done ? '✓ ' : '○ '}{quest.title}
              </Text>
            </View>
          ))}
        </View>
      </Pressable>

      <Modal
        animationType="fade"
        onRequestClose={() => setShowBoard(false)}
        transparent
        visible={showBoard}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowBoard(false)}>
          <Pressable style={styles.modalCard} onPress={() => null}>
            <Text style={styles.modalTitle}>오늘의 작은 일</Text>
            <Text style={styles.modalDescription}>
              캐릭터가 실제로 완료한 행동만 체크돼요.
            </Text>

            <View style={styles.questList}>
              {quests.map((quest) => (
                <View key={quest.title} style={styles.questRow}>
                  <View style={[styles.checkCircle, quest.done && styles.checkCircleDone]}>
                    <Text style={styles.checkText}>{quest.done ? '✓' : ''}</Text>
                  </View>
                  <View style={[styles.questColor, { backgroundColor: quest.color }]} />
                  <Text style={[styles.questTitle, quest.done && styles.questTitleDone]}>
                    {quest.title}
                  </Text>
                </View>
              ))}
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={() => setShowBoard(false)}
              style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
            >
              <Text style={styles.closeButtonText}>확인</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  board: {
    position: 'absolute',
    right: '4.5%',
    top: '14.5%',
    width: '20%',
    height: '14.5%',
    paddingHorizontal: 5,
    paddingTop: 8,
    borderWidth: 3,
    borderColor: '#7E5F42',
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: '#A9825B',
    transform: [{ perspective: 500 }, { rotateY: '-2deg' }, { rotate: '0.5deg' }],
    shadowColor: '#3B2B1D',
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.24,
    shadowRadius: 5,
    elevation: 14,
    zIndex: 14,
  },
  boardGrain: {
    position: 'absolute',
    left: 5,
    right: 5,
    top: '48%',
    height: 1,
    backgroundColor: 'rgba(77, 51, 31, 0.18)',
  },
  pin: {
    position: 'absolute',
    top: 3,
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#8B433A',
    borderWidth: 1,
    borderColor: '#69312A',
  },
  leftPin: { left: 5 },
  rightPin: { right: 5 },
  heading: {
    color: '#FFF3DB',
    fontSize: 6,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  notes: {
    flex: 1,
    marginTop: 3,
    justifyContent: 'space-around',
  },
  note: {
    minHeight: 15,
    paddingHorizontal: 3,
    paddingVertical: 3,
    borderRadius: 1,
    shadowColor: '#4A3522',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1,
  },
  noteOne: { width: '82%', transform: [{ rotate: '-1deg' }] },
  noteTwo: { width: '88%', alignSelf: 'flex-end', transform: [{ rotate: '1.2deg' }] },
  noteThree: { width: '76%', transform: [{ rotate: '-0.5deg' }] },
  tape: {
    position: 'absolute',
    top: -2,
    left: '38%',
    width: 13,
    height: 4,
    backgroundColor: 'rgba(244, 229, 194, 0.72)',
  },
  noteText: {
    color: '#544535',
    fontSize: 5.5,
    fontWeight: '800',
  },
  doneText: {
    color: '#766353',
    textDecorationLine: 'line-through',
  },
  modalBackdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 22,
    backgroundColor: 'rgba(42, 33, 24, 0.34)',
  },
  modalCard: {
    width: '100%',
    maxWidth: 390,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E4D6C3',
    backgroundColor: '#FFF9EF',
    shadowColor: '#2E261E',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 12,
  },
  modalTitle: {
    color: '#382F27',
    fontSize: 20,
    fontWeight: '900',
  },
  modalDescription: {
    marginTop: 7,
    color: '#7A6A59',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
  },
  questList: {
    marginTop: 16,
    gap: 10,
  },
  questRow: {
    minHeight: 48,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8DDCE',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFDF8',
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#CDBFAE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleDone: {
    borderColor: '#6F8A67',
    backgroundColor: '#DDEAD6',
  },
  checkText: {
    color: '#4F754B',
    fontSize: 13,
    fontWeight: '900',
  },
  questColor: {
    width: 7,
    height: 28,
    borderRadius: 999,
  },
  questTitle: {
    flex: 1,
    color: '#44382D',
    fontSize: 14,
    fontWeight: '900',
  },
  questTitleDone: {
    color: '#6B7A5C',
    textDecorationLine: 'line-through',
  },
  closeButton: {
    minHeight: 48,
    marginTop: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#695848',
  },
  closeButtonText: {
    color: '#FFF9EE',
    fontSize: 14,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.86,
  },
});
