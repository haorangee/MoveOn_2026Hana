import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const articles = [
  {
    section: '속보',
    headline: '박지민, 3일 연속 샤워 성공',
    quote: '전문가들 “생활사에 남을 기록”',
  },
  {
    section: '교육면',
    headline: '코딩 공부 누적 10시간 돌파',
    quote: '파란 책 출판계, 신간 공급 확대',
  },
  {
    section: '사회면',
    headline: '방 안에서 실종됐던 책상, 청소 이후 발견',
    quote: '관계자 “원래 이 자리에 있었다”',
  },
  {
    section: '생활면',
    headline: '물 한 잔 마신 박지민',
    quote: '화분 측 “방울토마토 생산 재개”',
  },
];

export function NewspaperPreviewScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.toolbar}>
        <Pressable
          accessibilityLabel="내 방으로 돌아가기"
          onPress={() => router.back()}
          style={styles.back}
        >
          <Ionicons name="chevron-back" size={22} color="#27231E" />
        </Pressable>
        <Text style={styles.toolbarLabel}>신문 펼쳐보기</Text>
        <View style={styles.toolbarSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.paper}>
          <View style={styles.mastheadRow}>
            <Text style={styles.masthead}>Move On Times</Text>
            <View style={styles.issue}>
              <Text style={styles.issueText}>2026.07.16</Text>
              <Text style={styles.issueText}>VOL. 18</Text>
            </View>
          </View>
          <View style={styles.rule} />
          <Text style={styles.tagline}>작은 행동이 오늘의 역사가 됩니다</Text>
          <View style={styles.heavyRule} />

          <View style={styles.lead}>
            <Text style={styles.leadKicker}>{articles[0].section}</Text>
            <Text style={styles.leadHeadline}>{articles[0].headline}</Text>
            <Text style={styles.leadQuote}>{articles[0].quote}</Text>
            <Text style={styles.bodyCopy}>
              조용하지만 분명히 자란 하루였다. 당사자는 “그냥 씻었을
              뿐”이라고 밝혔으나 방 안의 공기는 이전보다 산뜻해진 것으로
              확인됐다.
            </Text>
          </View>

          <View style={styles.articleGrid}>
            {articles.slice(1).map((article) => (
              <View key={article.section} style={styles.article}>
                <Text style={styles.articleSection}>{article.section}</Text>
                <Text style={styles.articleHeadline}>{article.headline}</Text>
                <Text style={styles.articleQuote}>{article.quote}</Text>
                <Text style={styles.articleBody}>
                  자세한 소식은 다음 호에서 계속된다. 편집부는 작은 변화의
                  현장을 꾸준히 취재할 예정이다.
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.footerRule} />
          <Text style={styles.footer}>
            MOVE ON TIMES · 오늘의 행동 기록을 바탕으로 만든 Mock 신문
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#D8CCB9',
  },
  toolbar: {
    height: 54,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(249, 243, 230, 0.86)',
  },
  toolbarLabel: {
    color: '#3F372E',
    fontSize: 14,
    fontWeight: '800',
  },
  toolbarSpacer: {
    width: 40,
  },
  scroll: {
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  paper: {
    paddingHorizontal: 17,
    paddingVertical: 17,
    backgroundColor: '#F0E6D2',
    borderWidth: 1,
    borderColor: '#A99A82',
    shadowColor: '#3A3025',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  mastheadRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  masthead: {
    color: '#161411',
    fontFamily: 'serif',
    fontSize: 31,
    fontWeight: '900',
    letterSpacing: -1.4,
  },
  issue: {
    alignItems: 'flex-end',
  },
  issueText: {
    color: '#34302A',
    fontFamily: 'serif',
    fontSize: 8,
  },
  rule: {
    height: 1,
    marginTop: 7,
    backgroundColor: '#25211C',
  },
  tagline: {
    paddingVertical: 6,
    color: '#39332B',
    fontFamily: 'serif',
    fontSize: 9,
    textAlign: 'center',
  },
  heavyRule: {
    height: 3,
    marginBottom: 13,
    backgroundColor: '#25211C',
  },
  lead: {
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#494238',
  },
  leadKicker: {
    color: '#201D19',
    fontFamily: 'serif',
    fontSize: 10,
    fontWeight: '900',
  },
  leadHeadline: {
    marginTop: 5,
    color: '#161411',
    fontFamily: 'serif',
    fontSize: 25,
    lineHeight: 31,
    fontWeight: '900',
  },
  leadQuote: {
    marginTop: 7,
    color: '#2E2923',
    fontFamily: 'serif',
    fontSize: 14,
    fontWeight: '700',
  },
  bodyCopy: {
    marginTop: 11,
    color: '#494137',
    fontFamily: 'serif',
    fontSize: 10,
    lineHeight: 17,
  },
  articleGrid: {
    marginTop: 13,
    gap: 12,
  },
  article: {
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#7E7363',
  },
  articleSection: {
    color: '#25211D',
    fontFamily: 'serif',
    fontSize: 9,
    fontWeight: '900',
  },
  articleHeadline: {
    marginTop: 4,
    color: '#191612',
    fontFamily: 'serif',
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '900',
  },
  articleQuote: {
    marginTop: 5,
    color: '#373129',
    fontFamily: 'serif',
    fontSize: 11,
    fontWeight: '700',
  },
  articleBody: {
    marginTop: 7,
    color: '#51493E',
    fontFamily: 'serif',
    fontSize: 9,
    lineHeight: 15,
  },
  footerRule: {
    height: 2,
    marginTop: 5,
    backgroundColor: '#25211C',
  },
  footer: {
    paddingTop: 7,
    color: '#484036',
    fontFamily: 'serif',
    fontSize: 7,
    textAlign: 'center',
  },
});
