import { StyleSheet, Text, View } from 'react-native';

type QuestMemoBoardProps = {
  cleaningCompleted?: boolean;
  waterCompleted?: boolean;
};

export function QuestMemoBoard({
  cleaningCompleted = false,
  waterCompleted = false,
}: QuestMemoBoardProps) {
  const quests = [
    { title: '샤워하기', done: true, color: '#E8C99D' },
    { title: '방 청소하기', done: cleaningCompleted, color: '#D8DFAF' },
    { title: '물 마시기', done: waterCompleted, color: '#D7C3A7' },
  ];

  return (
    <View accessibilityLabel="벽에 붙은 오늘의 할 일 메모" pointerEvents="none" style={styles.board}>
      <View style={styles.boardGrain} />
      <View style={[styles.pin, styles.leftPin]} />
      <View style={[styles.pin, styles.rightPin]} />
      <Text style={styles.heading}>오늘의 작은 일</Text>
      <View style={styles.notes}>
        {quests.map((quest, index) => (
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
    </View>
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
    elevation: 2,
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
});
