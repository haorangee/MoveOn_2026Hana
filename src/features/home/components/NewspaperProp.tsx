import { StyleSheet, Text, View } from 'react-native';

export function NewspaperProp() {
  return (
    <View
      accessibilityLabel="반으로 접힌 Move On Times 신문"
      pointerEvents="none"
      style={styles.paper}
    >
      <View style={styles.backFold} />
      <View style={styles.frontPage}>
        <Text numberOfLines={1} style={styles.masthead}>Move On Times</Text>
        <View style={styles.rule} />
        <Text style={styles.date}>TODAY · VOL. 04</Text>
        <View style={styles.storyRow}>
          <View style={styles.photo}>
            <View style={styles.photoSun} />
            <View style={styles.photoDesk} />
          </View>
          <View style={styles.copy}>
            <View style={[styles.copyLine, { width: '96%' }]} />
            <View style={[styles.copyLine, { width: '82%' }]} />
            <View style={[styles.copyLine, { width: '90%' }]} />
            <View style={[styles.copyLine, { width: '64%' }]} />
          </View>
        </View>
        <View style={styles.foldCrease} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  paper: {
    position: 'absolute',
    right: '4%',
    top: '78%',
    width: '35%',
    height: '14%',
    transform: [{ rotate: '8deg' }],
    shadowColor: '#392C21',
    shadowOffset: { width: 3, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  backFold: {
    position: 'absolute',
    left: '4%',
    right: '-2%',
    top: '8%',
    bottom: '-5%',
    borderRadius: 2,
    backgroundColor: '#D8C9AF',
    transform: [{ rotate: '-3deg' }],
  },
  frontPage: {
    flex: 1,
    paddingHorizontal: 8,
    paddingTop: 7,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: '#EEE4D0',
    borderWidth: 1,
    borderColor: 'rgba(80, 62, 43, 0.22)',
  },
  masthead: {
    color: '#30271E',
    fontFamily: 'serif',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: -0.7,
  },
  rule: {
    height: 1,
    marginTop: 2,
    backgroundColor: '#544538',
  },
  date: {
    marginTop: 2,
    color: '#786955',
    fontSize: 4,
    fontWeight: '700',
  },
  storyRow: {
    flex: 1,
    marginTop: 4,
    paddingBottom: 5,
    flexDirection: 'row',
    gap: 5,
  },
  photo: {
    width: '42%',
    overflow: 'hidden',
    backgroundColor: '#C7B18D',
  },
  photoSun: {
    position: 'absolute',
    right: 5,
    top: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F4D497',
  },
  photoDesk: {
    position: 'absolute',
    left: 3,
    right: 3,
    bottom: 4,
    height: 8,
    backgroundColor: '#806348',
  },
  copy: {
    flex: 1,
    paddingTop: 1,
    gap: 3,
  },
  copyLine: {
    height: 1,
    backgroundColor: 'rgba(75, 61, 46, 0.6)',
  },
  foldCrease: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    height: 1,
    backgroundColor: 'rgba(102, 83, 61, 0.26)',
  },
});
