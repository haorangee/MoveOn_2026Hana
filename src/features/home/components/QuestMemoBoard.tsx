import { StyleSheet, Text, View } from 'react-native';

const quests = ['샤워하기', '방청소하기', '물 마시기'];

export function QuestMemoBoard() {
  return (
    <View style={styles.paper} pointerEvents="none">
      <View style={styles.tape} />
      <Text style={styles.title}>오늘의 퀘스트</Text>
      {quests.map((quest) => (
        <View key={quest} style={styles.questRow}>
          <View style={styles.questDot} />
          <Text style={styles.questText}>{quest}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  paper: {
    position: 'absolute',
    left: 16,
    top: 86,
    width: 116,
    paddingHorizontal: 13,
    paddingTop: 19,
    paddingBottom: 13,
    borderRadius: 4,
    backgroundColor: 'rgba(243, 222, 175, 0.92)',
    transform: [{ rotate: '-1.5deg' }],
    shadowColor: '#493B2B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 7,
    elevation: 3,
  },
  tape: {
    position: 'absolute',
    top: -6,
    left: 39,
    width: 38,
    height: 13,
    backgroundColor: 'rgba(238, 229, 208, 0.82)',
    transform: [{ rotate: '2deg' }],
  },
  title: {
    marginBottom: 9,
    color: '#504434',
    fontSize: 12,
    fontWeight: '800',
  },
  questRow: {
    minHeight: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  questDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#8B7658',
  },
  questText: {
    color: '#5A4C3A',
    fontSize: 10,
    fontWeight: '600',
  },
});
