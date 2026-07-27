import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  type MoveOnNews,
  type NewsActivitySummary,
  buildFallbackMoveOnNews,
  normalizeMoveOnNews,
} from '@/contracts/moveon-news';
import { useStudyBooks } from '@/features/home/studyBooks';
import { useOnboarding } from '@/features/onboarding/OnboardingProvider';
import { loadMoveOnNewsActivitySummary } from '@/features/story/moveOnNewsSummary';

type NewsScreenState = 'idle' | 'loading' | 'success' | 'error';
type NewsSource = 'ai' | 'fallback';
type NewsTemplateId = 'pixel' | 'basic';

const PIXEL_BORDER_COLORS = [
  { id: 'blue', label: '파랑', color: '#35b7df', background: '#7DA5D4' },
  { id: 'violet', label: '보라', color: '#ab85de', background: '#B9A2E0' },
  { id: 'green', label: '초록', color: '#65db75', background: '#9CC58D' },
  { id: 'brown', label: '갈색', color: '#ba935f', background: '#C8A778' },
] as const;

type PixelBorderColorId = (typeof PIXEL_BORDER_COLORS)[number]['id'];

type GenerateNewsResponse = {
  news?: unknown;
  fallbackNews?: unknown;
  source?: NewsSource;
  message?: string;
};

function formatNumber(value: number) {
  return value.toLocaleString('ko-KR');
}

function fileDateKey(dateLabel: string) {
  return dateLabel.replace(/[^\d-]/g, '').slice(0, 10) || new Date().toISOString().slice(0, 10);
}

function buildRequestBody(summary: NewsActivitySummary) {
  const { userName, ...activities } = summary;
  return { userName, activities };
}

function PixelNewspaperCard({
  news,
  summary,
  borderColor,
  borderBackground,
}: {
  news: MoveOnNews;
  summary: NewsActivitySummary | null;
  borderColor: string;
  borderBackground: string;
}) {
  const studyMinutes = summary?.studyMinutes ?? 0;
  const waterCount = summary?.waterCount ?? 0;
  const cleaningCount = summary?.cleaningCount ?? 0;
  const showerMinutes = summary?.showerMinutes ?? 0;
  const userName = summary?.userName ?? 'MoveOn 주민';
  const periodLabel = summary
    ? `${summary.periodStart} ~ ${summary.periodEnd}`
    : news.dateLabel;

  return (
    <View style={[
      styles.pixelNewspaperShell,
      { backgroundColor: borderBackground, borderColor },
    ]}
    >
      <View style={styles.pixelNewspaperPage}>
        <View style={styles.pixelTopRule} />
        <View style={styles.pixelMastheadBlock}>
          <Text
            adjustsFontSizeToFit
            numberOfLines={1}
            style={styles.pixelDynamicMasthead}
          >
            MoveOn Times
          </Text>
        </View>

        <View style={styles.pixelMetaBar}>
          <Text style={styles.pixelMetaText}>No. M5650</Text>
          <Text style={styles.pixelMetaText}>DAILY NEWS FOR BETTER ME</Text>
          <View style={styles.pixelMetaIssue}>
            <Text style={styles.pixelMetaText}>{periodLabel}</Text>
            <Text style={styles.pixelEditionLabel}>SPECIAL EDITION</Text>
          </View>
        </View>

        <View style={styles.pixelSloganBar}>
          <Text style={styles.pixelSloganText}>작은 행동이 오늘의 역사가 됩니다</Text>
        </View>

        <View style={styles.pixelLeadBlock}>
          <Text style={styles.pixelMainKicker}>오늘의 특보</Text>
          <Text style={styles.pixelDynamicHeadline}>{news.mainHeadline}</Text>
          <Text style={styles.pixelDynamicSubheadline}>{news.mainSubheadline}</Text>
        </View>

        <View style={styles.pixelDynamicStatsRow}>
          <View style={styles.pixelDynamicStatBox}>
            <Text style={styles.pixelDynamicStatValue}>{formatNumber(studyMinutes)}</Text>
            <Text style={styles.pixelDynamicStatLabel}>공부 분</Text>
          </View>
          <View style={styles.pixelDynamicStatBox}>
            <Text style={styles.pixelDynamicStatValue}>{waterCount}</Text>
            <Text style={styles.pixelDynamicStatLabel}>물 잔</Text>
          </View>
          <View style={styles.pixelDynamicStatBox}>
            <Text style={styles.pixelDynamicStatValue}>{cleaningCount}</Text>
            <Text style={styles.pixelDynamicStatLabel}>청소 회</Text>
          </View>
          <View style={styles.pixelDynamicStatBox}>
            <Text style={styles.pixelDynamicStatValue}>{formatNumber(showerMinutes)}</Text>
            <Text style={styles.pixelDynamicStatLabel}>샤워 분</Text>
          </View>
        </View>

        <View style={styles.pixelArticleGrid}>
          <View style={styles.pixelArticleCard}>
            <View style={styles.pixelArticleCopy}>
              <Text style={styles.pixelKicker}>공부면</Text>
              <Text style={styles.pixelArticleTitle}>{news.studyHeadline}</Text>
              <Text style={styles.pixelArticleBody}>{news.studySubheadline}</Text>
            </View>
          </View>

          <View style={styles.pixelArticleCard}>
            <View style={styles.pixelArticleCopy}>
              <Text style={styles.pixelKicker}>생활면</Text>
              <Text style={styles.pixelArticleTitle}>{news.lifeHeadline}</Text>
              <Text style={styles.pixelArticleBody}>{news.lifeSubheadline}</Text>
            </View>
          </View>
        </View>

        <View style={styles.pixelSpecialRow}>
          <View style={styles.pixelSmallArticle}>
            <Text style={styles.pixelTinySection}>★ SPECIAL REPORT ★</Text>
            <Text style={styles.pixelSmallArticleTitle}>작은 행동 누적 중</Text>
            <Text style={styles.pixelSideText}>
              공부 {formatNumber(studyMinutes)}분, 물 {waterCount}잔, 청소 {cleaningCount}회,
              샤워 {formatNumber(showerMinutes)}분이 오늘 신문에 실렸어요.
            </Text>
          </View>
          <View style={styles.pixelSmallArticle}>
            <Text style={styles.pixelTinySection}>★ EDITOR'S NOTE ★</Text>
            <Text style={styles.pixelSideText}>{news.closingMessage}</Text>
          </View>
        </View>

        <View style={styles.pixelFooterLine}>
          <Text style={styles.pixelFooterTiny}>SPECIAL ISSUE</Text>
          <Text style={styles.pixelFooterQuote}>작은 습관이 만드는 큰 변화</Text>
          <Text style={styles.pixelFooterTiny}>MOVE FORWARD, MOVE ON</Text>
        </View>
      </View>
    </View>
  );
}

function BasicNewspaperCard({
  news,
  summary,
}: {
  news: MoveOnNews;
  summary: NewsActivitySummary | null;
}) {
  const studyMinutes = summary?.studyMinutes ?? 0;
  const waterCount = summary?.waterCount ?? 0;
  const cleaningCount = summary?.cleaningCount ?? 0;
  const showerMinutes = summary?.showerMinutes ?? 0;

  return (
    <View style={styles.paper}>
      <View style={styles.mastheadRow}>
        <Text style={styles.masthead}>{news.newspaperName}</Text>
        <View style={styles.issue}>
          <Text style={styles.issueText}>{news.dateLabel}</Text>
          <Text style={styles.issueText}>SPECIAL EDITION</Text>
        </View>
      </View>
      <View style={styles.rule} />
      <Text style={styles.tagline}>작은 행동이 오늘의 역사가 됩니다</Text>
      <View style={styles.heavyRule} />

      <View style={styles.lead}>
        <Text style={styles.leadKicker}>오늘의 특보</Text>
        <Text style={styles.leadHeadline}>{news.mainHeadline}</Text>
        <Text style={styles.leadQuote}>{news.mainSubheadline}</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{formatNumber(studyMinutes)}</Text>
          <Text style={styles.statLabel}>공부 분</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{waterCount}</Text>
          <Text style={styles.statLabel}>물 잔</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{cleaningCount}</Text>
          <Text style={styles.statLabel}>청소 회</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{formatNumber(showerMinutes)}</Text>
          <Text style={styles.statLabel}>샤워 분</Text>
        </View>
      </View>

      <View style={styles.articleGrid}>
        <View style={styles.article}>
          <Text style={styles.articleSection}>공부면</Text>
          <Text style={styles.articleHeadline}>{news.studyHeadline}</Text>
          <Text style={styles.articleQuote}>{news.studySubheadline}</Text>
        </View>
        <View style={styles.article}>
          <Text style={styles.articleSection}>생활면</Text>
          <Text style={styles.articleHeadline}>{news.lifeHeadline}</Text>
          <Text style={styles.articleQuote}>{news.lifeSubheadline}</Text>
        </View>
      </View>

      <View style={styles.footerRule} />
      <Text style={styles.footer}>{news.closingMessage}</Text>
    </View>
  );
}

export function NewspaperPreviewScreen() {
  const router = useRouter();
  const { profile } = useOnboarding();
  const { books, isHydrated: areBooksHydrated } = useStudyBooks();
  const pixelNewspaperRef = useRef<View>(null);
  const basicNewspaperRef = useRef<View>(null);
  const requestLock = useRef(false);
  const downloadLock = useRef(false);
  const [summary, setSummary] = useState<NewsActivitySummary | null>(null);
  const [news, setNews] = useState<MoveOnNews | null>(null);
  const [state, setState] = useState<NewsScreenState>('idle');
  const [source, setSource] = useState<NewsSource>('fallback');
  const [notice, setNotice] = useState('');
  const [downloadingTemplate, setDownloadingTemplate] = useState<NewsTemplateId | null>(null);
  const [pixelBorderColorId, setPixelBorderColorId] = useState<PixelBorderColorId>('blue');

  const fallbackNews = useMemo(
    () => buildFallbackMoveOnNews(summary),
    [summary],
  );
  const displayedNews = news ?? fallbackNews;
  const isBusy = state === 'loading';
  const pixelBorderColor = PIXEL_BORDER_COLORS.find((color) => (
    color.id === pixelBorderColorId
  )) ?? PIXEL_BORDER_COLORS[0];

  useEffect(() => {
    if (!areBooksHydrated) return;

    let active = true;
    async function hydrateSummary() {
      const nextSummary = await loadMoveOnNewsActivitySummary({
        userName: profile.name,
        books,
      });
      if (!active) return;
      setSummary(nextSummary);
      setNews((currentNews) => currentNews ?? buildFallbackMoveOnNews(nextSummary));
    }

    void hydrateSummary();
    return () => {
      active = false;
    };
  }, [areBooksHydrated, books, profile.name]);

  const handleGenerate = useCallback(async () => {
    if (!summary || requestLock.current) return;

    requestLock.current = true;
    setState('loading');
    setNotice('');

    try {
      const response = await fetch('/api/generate-news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildRequestBody(summary)),
      });
      const payload = await response.json() as GenerateNewsResponse;
      const generatedNews = normalizeMoveOnNews(payload.news);
      const serverFallback = normalizeMoveOnNews(payload.fallbackNews);

      if (!response.ok || !generatedNews) {
        setNews(serverFallback ?? buildFallbackMoveOnNews(summary));
        setSource('fallback');
        setNotice(payload.message ?? 'AI 기자가 잠시 자리를 비웠어요. 오늘의 기록으로 기본 뉴스를 만들었어요.');
        setState('error');
        return;
      }

      setNews(generatedNews);
      setSource(payload.source === 'ai' ? 'ai' : 'fallback');
      setNotice(payload.source === 'ai'
        ? ''
        : 'AI 기자가 잠시 자리를 비웠어요. 오늘의 기록으로 기본 뉴스를 만들었어요.');
      setState('success');
    } catch {
      setNews(buildFallbackMoveOnNews(summary));
      setSource('fallback');
      setNotice('AI 기자가 잠시 자리를 비웠어요. 오늘의 기록으로 기본 뉴스를 만들었어요.');
      setState('error');
    } finally {
      requestLock.current = false;
    }
  }, [summary]);

  const handleDownload = useCallback(async (templateId: NewsTemplateId) => {
    const targetRef = templateId === 'pixel' ? pixelNewspaperRef : basicNewspaperRef;

    if (Platform.OS !== 'web' || downloadLock.current || !targetRef.current) {
      if (Platform.OS !== 'web') {
        setNotice('이미지 저장은 웹 배포 화면에서 사용할 수 있어요.');
      }
      return;
    }

    downloadLock.current = true;
    setDownloadingTemplate(templateId);
    setNotice('');

    try {
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(targetRef.current as never, {
        pixelRatio: 2,
        backgroundColor: templateId === 'pixel' ? '#DDEBFF' : '#F0E6D2',
        cacheBust: true,
      });
      const fileName = `moveon-times-${templateId}-${fileDateKey(displayedNews.dateLabel)}.png`;
      const documentRef = globalThis.document;
      const navigatorRef = globalThis.navigator;
      const link = documentRef.createElement('a');
      link.href = dataUrl;
      link.download = fileName;

      if (/iP(ad|hone|od)/.test(navigatorRef.userAgent)) {
        globalThis.window.open(dataUrl, '_blank');
      } else {
        documentRef.body.appendChild(link);
        link.click();
        documentRef.body.removeChild(link);
      }
    } catch {
      setNotice('이미지 저장에 실패했어요. 잠시 뒤 다시 시도해 주세요.');
    } finally {
      downloadLock.current = false;
      setDownloadingTemplate(null);
    }
  }, [displayedNews.dateLabel]);

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
        <View style={styles.headerPanel}>
          <View>
            <Text style={styles.headerTitle}>Move On Times</Text>
            <Text style={styles.headerDescription}>
              공부, 물 마시기, 청소, 샤워 기록으로 오늘의 신문을 만들어요.
            </Text>
          </View>
          <Pressable
            accessibilityLabel="이번 주 신문 만들기"
            disabled={isBusy || !summary}
            onPress={handleGenerate}
            style={({ pressed }) => [
              styles.generateButton,
              (pressed && !isBusy) ? styles.generateButtonPressed : null,
              (isBusy || !summary) ? styles.disabledButton : null,
            ]}
          >
            {isBusy ? (
              <ActivityIndicator color="#FFF9EC" size="small" />
            ) : (
              <Ionicons name="sparkles-outline" size={16} color="#FFF9EC" />
            )}
            <Text style={styles.generateButtonText}>
              {isBusy ? '정리 중' : '이번 주 신문 만들기'}
            </Text>
          </Pressable>
        </View>

        {isBusy ? (
          <Text style={styles.statusText}>마루 기자가 이번 주 소식을 정리하고 있어요...</Text>
        ) : null}
        {notice ? <Text style={styles.noticeText}>{notice}</Text> : null}
        {source === 'fallback' && state !== 'idle' && !notice ? (
          <Text style={styles.noticeText}>오늘의 기록으로 기본 뉴스를 만들었어요.</Text>
        ) : null}

        <View style={styles.templateSection}>
          <Text style={styles.templateTitle}>Pixel Template</Text>
          <View ref={pixelNewspaperRef} collapsable={false}>
            <PixelNewspaperCard
              borderBackground={pixelBorderColor.background}
              borderColor={pixelBorderColor.color}
              news={displayedNews}
              summary={summary}
            />
          </View>

          <View style={styles.borderPicker}>
            <Text style={styles.borderPickerLabel}>테두리색</Text>
            <View style={styles.borderSwatches}>
              {PIXEL_BORDER_COLORS.map((option) => {
                const selected = option.id === pixelBorderColorId;
                return (
                  <Pressable
                    accessibilityLabel={`픽셀 신문 테두리색 ${option.label}`}
                    key={option.id}
                    onPress={() => setPixelBorderColorId(option.id)}
                    style={[
                      styles.borderSwatchButton,
                      selected ? styles.borderSwatchButtonSelected : null,
                    ]}
                  >
                    <View
                      style={[
                        styles.borderSwatch,
                        {
                          backgroundColor: option.background,
                          borderColor: option.color,
                        },
                      ]}
                    />
                    <Text style={[
                      styles.borderSwatchText,
                      selected ? styles.borderSwatchTextSelected : null,
                    ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <Pressable
            accessibilityLabel="픽셀 신문 이미지로 저장하기"
            disabled={downloadingTemplate !== null}
            onPress={() => handleDownload('pixel')}
            style={({ pressed }) => [
              styles.downloadButton,
              pressed ? styles.downloadButtonPressed : null,
              downloadingTemplate !== null ? styles.disabledDownloadButton : null,
            ]}
          >
            <Ionicons name="download-outline" size={15} color="#4B4134" />
            <Text style={styles.downloadButtonText}>
              {downloadingTemplate === 'pixel' ? '저장 중...' : 'Pixel 이미지로 저장하기'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.templateSection}>
          <Text style={styles.templateTitle}>Basic Template</Text>
          <View ref={basicNewspaperRef} collapsable={false}>
            <BasicNewspaperCard news={displayedNews} summary={summary} />
          </View>

          <Pressable
            accessibilityLabel="기본 신문 이미지로 저장하기"
            disabled={downloadingTemplate !== null}
            onPress={() => handleDownload('basic')}
            style={({ pressed }) => [
              styles.downloadButton,
              pressed ? styles.downloadButtonPressed : null,
              downloadingTemplate !== null ? styles.disabledDownloadButton : null,
            ]}
          >
            <Ionicons name="download-outline" size={15} color="#4B4134" />
            <Text style={styles.downloadButtonText}>
              {downloadingTemplate === 'basic' ? '저장 중...' : 'Basic 이미지로 저장하기'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f1e6d6',
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
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingBottom: 26,
    gap: 12,
  },
  headerPanel: {
    padding: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(249, 243, 230, 0.72)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerTitle: {
    color: '#3F372E',
    fontSize: 16,
    fontWeight: '900',
  },
  headerDescription: {
    maxWidth: 370,
    marginTop: 4,
    color: '#776B5C',
    fontSize: 11,
    lineHeight: 16,
  },
  generateButton: {
    minHeight: 40,
    paddingHorizontal: 13,
    borderRadius: 20,
    backgroundColor: '#7E6B55',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  generateButtonPressed: {
    transform: [{ scale: 0.98 }],
  },
  disabledButton: {
    opacity: 0.62,
  },
  generateButtonText: {
    color: '#FFF9EC',
    fontSize: 12,
    fontWeight: '900',
  },
  statusText: {
    color: '#655A4D',
    fontSize: 12,
    textAlign: 'center',
  },
  noticeText: {
    paddingHorizontal: 10,
    color: '#78634E',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  templateSection: {
    gap: 10,
  },
  templateTitle: {
    alignSelf: 'center',
    color: '#5D5041',
    fontSize: 12,
    fontWeight: '900',
  },
  borderPicker: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(249, 243, 230, 0.72)',
    gap: 8,
  },
  borderPickerLabel: {
    color: '#5D5041',
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
  },
  borderSwatches: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  borderSwatchButton: {
    minWidth: 62,
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    gap: 4,
  },
  borderSwatchButtonSelected: {
    borderColor: '#6D5B46',
    backgroundColor: 'rgba(255, 247, 226, 0.82)',
  },
  borderSwatch: {
    width: 30,
    height: 18,
    borderWidth: 3,
  },
  borderSwatchText: {
    color: '#7B6E60',
    fontSize: 10,
    fontWeight: '800',
  },
  borderSwatchTextSelected: {
    color: '#3F372E',
    fontWeight: '900',
  },
  pixelNewspaperShell: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    padding: 4,
    borderWidth: 2,
    shadowColor: '#2B261F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 7,
  },
  pixelNewspaperPage: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#ECE5D3',
    borderWidth: 1,
    borderColor: '#4A463A',
  },
  pixelTopRule: {
    height: 1,
    backgroundColor: '#2B2923',
    marginBottom: 8,
  },
  pixelMastheadBlock: {
    minHeight: 66,
    justifyContent: 'center',
  },
  pixelDynamicMasthead: {
    color: '#171613',
    fontFamily: 'serif',
    fontSize: 43,
    lineHeight: 50,
    fontWeight: '900',
    letterSpacing: 0,
    textAlign: 'center',
  },
  pixelMetaBar: {
    minHeight: 27,
    paddingVertical: 4,
    borderTopWidth: 2,
    borderBottomWidth: 1,
    borderColor: '#29271F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  pixelMetaText: {
    color: '#302D26',
    fontFamily: 'serif',
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '700',
  },
  pixelMetaIssue: {
    alignItems: 'flex-end',
  },
  pixelEditionLabel: {
    color: '#3F3473',
    fontFamily: 'serif',
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '800',
  },
  pixelSloganBar: {
    minHeight: 31,
    borderBottomWidth: 3,
    borderColor: '#2B2923',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pixelSloganText: {
    color: '#514A3C',
    fontFamily: 'serif',
    fontSize: 11,
    lineHeight: 15,
  },
  pixelLeadBlock: {
    minHeight: 158,
    paddingHorizontal: 0,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#4F493E',
    justifyContent: 'center',
  },
  pixelMainKicker: {
    alignSelf: 'flex-start',
    marginBottom: 9,
    paddingHorizontal: 6,
    paddingVertical: 3,
    backgroundColor: '#6C5694',
    color: '#F9F4E8',
    fontFamily: 'serif',
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '900',
  },
  pixelTinySection: {
    color: '#25231E',
    fontFamily: 'serif',
    fontSize: 8,
    lineHeight: 11,
    fontWeight: '900',
    textAlign: 'center',
  },
  pixelSideHeadline: {
    marginTop: 8,
    color: '#161411',
    fontFamily: 'serif',
    fontSize: 14,
    lineHeight: 17,
    fontWeight: '900',
    textAlign: 'center',
  },
  pixelSideText: {
    marginTop: 8,
    color: '#343029',
    fontFamily: 'serif',
    fontSize: 8,
    lineHeight: 12,
    fontWeight: '700',
  },
  pixelMainColumn: {
    flex: 1,
    minHeight: 171,
    borderWidth: 1,
    borderColor: '#4F493E',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  pixelLeadCopy: {
    flex: 1,
    paddingHorizontal: 7,
    paddingVertical: 8,
  },
  pixelKicker: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#6C5694',
    color: '#F9F4E8',
    fontFamily: 'serif',
    fontSize: 8,
    lineHeight: 11,
    fontWeight: '900',
  },
  pixelDynamicHeadline: {
    color: '#171613',
    fontFamily: 'serif',
    fontSize: 29,
    lineHeight: 36,
    fontWeight: '900',
  },
  pixelDynamicSubheadline: {
    marginTop: 11,
    color: '#312D25',
    fontFamily: 'serif',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '800',
  },
  pixelLeadImageBox: {
    width: '42%',
    padding: 5,
    borderLeftWidth: 1,
    borderColor: '#4F493E',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DDD3BD',
  },
  pixelDynamicStatsRow: {
    minHeight: 68,
    flexDirection: 'row',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#4F493E',
  },
  pixelDynamicStatBox: {
    flex: 1,
    paddingVertical: 7,
    borderRightWidth: 1,
    borderColor: '#4F493E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pixelDynamicStatValue: {
    color: '#171613',
    fontFamily: 'serif',
    fontSize: 22,
    lineHeight: 25,
    fontWeight: '900',
  },
  pixelDynamicStatLabel: {
    marginTop: 4,
    color: '#29251F',
    fontFamily: 'serif',
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '800',
  },
  pixelArticleGrid: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#4F493E',
  },
  pixelArticleCard: {
    minHeight: 95,
    padding: 7,
    borderBottomWidth: 1,
    borderColor: '#4F493E',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pixelArticleTitle: {
    marginTop: 6,
    color: '#171613',
    fontFamily: 'serif',
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '900',
  },
  pixelArticleBody: {
    marginTop: 5,
    color: '#312D25',
    fontFamily: 'serif',
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
  },
  pixelSpecialRow: {
    flexDirection: 'row',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#4F493E',
  },
  pixelSmallArticle: {
    flex: 1,
    minHeight: 74,
    paddingHorizontal: 7,
    paddingVertical: 7,
    borderRightWidth: 1,
    borderColor: '#4F493E',
  },
  pixelSmallArticleTitle: {
    marginTop: 5,
    color: '#171613',
    fontFamily: 'serif',
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '900',
  },
  pixelFooterLine: {
    minHeight: 24,
    paddingTop: 5,
    borderTopWidth: 2,
    borderColor: '#2B2923',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 5,
  },
  pixelFooterTiny: {
    color: '#352F27',
    fontFamily: 'serif',
    fontSize: 7,
    lineHeight: 10,
    fontWeight: '800',
  },
  pixelFooterQuote: {
    flex: 1,
    color: '#352F27',
    fontFamily: 'serif',
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  pixelPaper: {
    padding: 10,
    backgroundColor: '#FFF2C8',
    borderWidth: 3,
  },
  pixelMastheadRow: {
    minHeight: 50,
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: '#7B6B49',
    backgroundColor: '#FFF8D8',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  pixelSparkle: {
    color: '#8C5AC2',
    fontSize: 18,
    fontWeight: '900',
  },
  pixelMasthead: {
    flex: 1,
    minWidth: 0,
    color: '#2A2018',
    fontFamily: 'monospace',
    fontSize: 25,
    fontWeight: '900',
  },
  pixelIssue: {
    minWidth: 86,
    paddingLeft: 5,
    borderLeftWidth: 2,
    borderLeftColor: '#7B6B49',
    alignItems: 'flex-end',
  },
  pixelIssueText: {
    color: '#2A2018',
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: '900',
  },
  pixelEditionText: {
    marginTop: 2,
    color: '#8153B8',
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: '900',
  },
  pixelTagline: {
    marginTop: 5,
    paddingVertical: 6,
    borderWidth: 2,
    borderColor: '#7B6B49',
    backgroundColor: '#F9E8AF',
    alignItems: 'center',
  },
  pixelTaglineText: {
    color: '#4A3D2D',
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '900',
  },
  pixelLeadRow: {
    marginTop: 8,
    padding: 8,
    borderWidth: 2,
    borderColor: '#7B6B49',
    backgroundColor: '#FFF2C8',
    flexDirection: 'row',
    gap: 10,
  },
  pixelLeadText: {
    flex: 1,
    justifyContent: 'center',
  },
  pixelSectionBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#8B63C7',
    color: '#FFF7CE',
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '900',
  },
  pixelHeadline: {
    marginTop: 8,
    color: '#2A2018',
    fontFamily: 'monospace',
    fontSize: 24,
    lineHeight: 31,
    fontWeight: '900',
  },
  pixelDottedRule: {
    height: 1,
    marginVertical: 8,
    borderBottomWidth: 2,
    borderStyle: 'dotted',
    borderColor: '#A58D63',
  },
  pixelSubheadline: {
    color: '#3D3022',
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '800',
  },
  pixelHomeImage: {
    width: 190,
    height: 142,
    borderWidth: 1.5,
    backgroundColor: 'hsl(192, 100%, 84%)',
  },
  pixelStatsRow: {
    marginTop: 8,
    flexDirection: 'row',
    gap: 4,
  },
  pixelStatBox: {
    flex: 1,
    minHeight: 76,
    paddingVertical: 6,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#C7AD7B',
    backgroundColor: '#FFF5CF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pixelStatValue: {
    color: '#2A2018',
    fontFamily: 'monospace',
    fontSize: 25,
    fontWeight: '900',
  },
  pixelStatImage: {
    width: 28,
    height: 28,
    marginTop: 2,
  },
  pixelStatLabel: {
    marginTop: 2,
    color: '#2F271D',
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '900',
  },
  pixelArticleRow: {
    minHeight: 96,
    padding: 8,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#7B6B49',
    backgroundColor: '#FFF2C8',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pixelArticleCopy: {
    flex: 1,
  },
  pixelArticleHeadline: {
    marginTop: 6,
    color: '#2A2018',
    fontFamily: 'monospace',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '900',
  },
  pixelArticleText: {
    marginTop: 4,
    color: '#3D3022',
    fontFamily: 'monospace',
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '800',
  },
  pixelStudyImage: {
    width: 135,
    height: 76,
    borderWidth: 2,
    backgroundColor: 'rgba(240, 128, 30, 0.9)',
  },
  pixelLifeImageGroup: {
    width: 135,
    height: 78,
    borderWidth: 2,
    backgroundColor: 'rgba(240, 128, 30, 0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  pixelPlantImage: {
    width: 38,
    height: 58,
  },
  pixelWaterImage: {
    width: 34,
    height: 48,
  },
  pixelDogImage: {
    width: 58,
    height: 60,
  },
  pixelFooter: {
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#7B6B49',
    backgroundColor: '#F9E8AF',
    alignItems: 'center',
  },
  pixelFooterText: {
    color: '#5D4933',
    fontFamily: 'monospace',
    fontSize: 10,
    lineHeight: 15,
    fontWeight: '900',
    textAlign: 'center',
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
    gap: 10,
  },
  masthead: {
    flexShrink: 1,
    color: '#161411',
    fontFamily: 'serif',
    fontSize: 31,
    fontWeight: '900',
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
    lineHeight: 20,
    fontWeight: '700',
  },
  statsRow: {
    marginTop: 13,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#7E7363',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  statBox: {
    flex: 1,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#B9AA91',
    backgroundColor: '#E8DCC6',
  },
  statValue: {
    color: '#201D19',
    fontFamily: 'serif',
    fontSize: 18,
    fontWeight: '900',
  },
  statLabel: {
    marginTop: 2,
    color: '#51493E',
    fontFamily: 'serif',
    fontSize: 8,
    fontWeight: '800',
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
    lineHeight: 17,
    fontWeight: '700',
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
    fontSize: 9,
    lineHeight: 14,
    textAlign: 'center',
  },
  downloadButton: {
    alignSelf: 'center',
    minHeight: 34,
    paddingHorizontal: 13,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#B6A58B',
    backgroundColor: 'rgba(249, 243, 230, 0.78)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  downloadButtonPressed: {
    transform: [{ scale: 0.98 }],
  },
  disabledDownloadButton: {
    opacity: 0.58,
  },
  downloadButtonText: {
    color: '#4B4134',
    fontSize: 11,
    fontWeight: '800',
  },
});
