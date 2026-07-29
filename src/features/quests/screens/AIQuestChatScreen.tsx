import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { type Href, useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type {
  AIQuestLevel,
  AIQuestOption,
  AIQuestResponse,
} from '@/contracts/ai-quest';
import { firebaseAuth } from '@/config/firebaseAuth';
import { getMvpPetCatalogItem } from '@/features/customization/catalogs/petCatalog';
import { useOnboarding } from '@/features/onboarding/OnboardingProvider';
import { savePendingWaterQuestId } from '@/features/quests/services/questActivityLinkService';
import {
  AIQuestServiceError,
  generateAIQuests,
} from '@/features/quests/services/aiQuestService';
import { createQuestFromDraft } from '@/features/quests/services/questService';
import { mapAIQuestOptionToQuestDraft } from '@/features/quests/utils/aiQuestMapping';

const INITIAL_PET_MESSAGE = `안녕, 나한테 그냥 편하게 말해줘.
지금 뭐가 제일 하기 싫거나 막막해?
말이 정리되지 않아도 괜찮아.`;

const LEVEL_LABELS: Record<AIQuestLevel, string> = {
  very_easy: '가장 가볍게 시작',
  easy: '조금만 더 움직이기',
  action: '가능하면 여기까지',
};

const LEVEL_ICONS: Record<AIQuestLevel, keyof typeof Ionicons.glyphMap> = {
  very_easy: 'leaf-outline',
  easy: 'footsteps-outline',
  action: 'sparkles-outline',
};

function getErrorMessage(error: unknown) {
  if (!(error instanceof AIQuestServiceError)) {
    return '앗, 퀘스트를 고르는 중에 잠깐 꼬였어. 한 번만 다시 해볼까?';
  }

  switch (error.code) {
    case 'unauthenticated':
      return '로그인 정보를 확인한 뒤 다시 시도해줘.';
    case 'invalid_argument':
      return '내용을 한 번만 확인해줄래?';
    case 'unavailable':
      return '연결이 잠깐 불안정한 것 같아. 한 번만 다시 해볼까?';
    case 'internal':
      return '앗, 퀘스트를 고르는 중에 잠깐 꼬였어. 한 번만 다시 해볼까?';
    case 'invalid_response':
    case 'unknown':
    default:
      return '앗, 퀘스트를 가져오지 못했어. 한 번만 다시 해볼까?';
  }
}

type QuestChoiceCardProps = {
  disabled: boolean;
  index: number;
  isSelected: boolean;
  onPress: () => void;
  quest: AIQuestOption;
};

function QuestChoiceCard({
  disabled,
  index,
  isSelected,
  onPress,
  quest,
}: QuestChoiceCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled, selected: isSelected }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.questCard,
        isSelected && styles.questCardSelected,
        pressed && !disabled && styles.pressed,
        disabled && styles.questCardDisabled,
      ]}
    >
      <View style={styles.questNumberWrap}>
        <Text style={styles.questNumber}>{index + 1}</Text>
      </View>
      <View style={styles.questCopy}>
        <View style={styles.questLabelRow}>
          <Ionicons
            color={isSelected ? '#A85F73' : '#8A7663'}
            name={LEVEL_ICONS[quest.level]}
            size={14}
          />
          <Text style={[
            styles.questLevel,
            isSelected && styles.questLevelSelected,
          ]}>
            {LEVEL_LABELS[quest.level]}
          </Text>
        </View>
        <Text style={styles.questTitle}>{quest.title}</Text>
        {typeof quest.durationMinutes === 'number' ? (
          <View style={styles.durationBadge}>
            <Ionicons color="#8A7663" name="time-outline" size={13} />
            <Text style={styles.durationText}>{quest.durationMinutes}분</Text>
          </View>
        ) : null}
      </View>
      <View style={[
        styles.choiceMark,
        isSelected && styles.choiceMarkSelected,
      ]}>
        {isSelected ? <Ionicons color="#FFF9F0" name="checkmark" size={15} /> : null}
      </View>
    </Pressable>
  );
}

export default function AIQuestChatScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const startingRef = useRef(false);
  const { profile } = useOnboarding();
  const pet = useMemo(
    () => getMvpPetCatalogItem(profile.petId, profile.petSpecies),
    [profile.petId, profile.petSpecies],
  );
  const petName = profile.petName?.trim() || pet.displayName;

  const [input, setInput] = useState('');
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<AIQuestResponse | null>(null);
  const [selectedQuestId, setSelectedQuestId] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const requestAIQuests = async (message: string) => {
    if (isLoading) return;

    setIsLoading(true);
    setError(null);
    setResponse(null);
    setSelectedQuestId(null);
    setStartError(null);

    try {
      const nextResponse = await generateAIQuests({
        message,
        mode: 'first',
      });
      setResponse(nextResponse);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = () => {
    const message = input.trim();
    if (!message || isLoading) return;

    setInput('');
    setSubmittedMessage(message);
    void requestAIQuests(message);
  };

  const handleRetry = () => {
    if (!submittedMessage || isLoading) return;
    void requestAIQuests(submittedMessage);
  };

  const handleStartSelected = async () => {
    if (!selectedQuestId || !response || startingRef.current) return;

    const selectedQuest = response.quests.find(
      (quest) => quest.id === selectedQuestId,
    );
    if (!selectedQuest) return;

    startingRef.current = true;
    setIsStarting(true);
    setStartError(null);

    try {
      await firebaseAuth.authStateReady();
      const userId = firebaseAuth.currentUser?.uid;
      if (!userId) {
        throw new Error('로그인 정보를 확인할 수 없어요.');
      }

      const draft = mapAIQuestOptionToQuestDraft(selectedQuest);
      const createdQuest = await createQuestFromDraft(userId, draft);
      const params = {
        questId: createdQuest.id,
        fromQuest: '1',
      };

      switch (createdQuest.executionType) {
        case 'study':
          router.push({ pathname: '/study-desk', params });
          return;
        case 'cleaning':
          router.push({ pathname: '/cleaning', params });
          return;
        case 'shower':
          router.push({ pathname: '/shower', params });
          return;
        case 'water':
          await savePendingWaterQuestId(createdQuest.id);
          router.replace('/' as Href);
          return;
        case 'simple':
          router.push({ pathname: '/quest-simple', params: { questId: createdQuest.id } } as unknown as Href);
          return;
        case 'my_time':
          router.push({ pathname: '/my-time', params: { questId: createdQuest.id } } as unknown as Href);
          return;
        default:
          throw new Error('아직 시작할 수 없는 퀘스트예요.');
      }
    } catch (startQuestError) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('Failed to save or start selected AI Quest.', startQuestError);
      }
      setStartError('퀘스트를 시작하지 못했어. 잠시 후 다시 시도해줘.');
    } finally {
      startingRef.current = false;
      setIsStarting(false);
    }
  };

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/quests' as Href);
  };

  const canSubmit = input.trim().length > 0 && !isLoading;

  return (
    <SafeAreaView style={styles.safe}>
      <View pointerEvents="none" style={styles.blobTop} />
      <View pointerEvents="none" style={styles.blobBottom} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityLabel="뒤로 가기"
            accessibilityRole="button"
            onPress={goBack}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          >
            <Ionicons color="#57493E" name="chevron-back" size={22} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.headerKicker}>PET QUEST TALK</Text>
            <Text style={styles.headerTitle}>{petName}, 작은 퀘스트를 찾아줘</Text>
          </View>
          <View style={styles.headerSparkle}>
            <Ionicons color="#B96E82" name="sparkles" size={19} />
          </View>
        </View>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.petConversation}>
            <View style={styles.petPortrait}>
              <View style={styles.petGlow} />
              <Image
                accessibilityLabel={`선택한 펫 ${petName}`}
                contentFit="contain"
                source={pet.source}
                style={styles.petImage}
              />
            </View>
            <View style={styles.petBubble}>
              <Text style={styles.petName}>{petName}</Text>
              <Text style={styles.petMessage}>{INITIAL_PET_MESSAGE}</Text>
              <View style={styles.petBubbleTail} />
            </View>
          </View>

          {submittedMessage ? (
            <View style={styles.userBubbleWrap}>
              <View style={styles.userBubble}>
                <Text style={styles.userBubbleLabel}>나</Text>
                <Text style={styles.userMessage}>{submittedMessage}</Text>
              </View>
            </View>
          ) : null}

          {isLoading ? (
            <View style={styles.thinkingBubble}>
              <ActivityIndicator color="#B96E82" size="small" />
              <Text style={styles.thinkingText}>퀘스트를 고르는 중…</Text>
            </View>
          ) : null}

          {error ? (
            <View style={styles.errorCard}>
              <View style={styles.errorIcon}>
                <Ionicons color="#A85F73" name="paw-outline" size={19} />
              </View>
              <Text style={styles.errorText}>{error}</Text>
              <Pressable
                accessibilityRole="button"
                disabled={isLoading}
                onPress={handleRetry}
                style={({ pressed }) => [
                  styles.retryButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.retryButtonText}>다시 시도</Text>
              </Pressable>
            </View>
          ) : null}

          {response ? (
            <View style={styles.responseSection}>
              <View style={styles.empathyBubble}>
                <View style={styles.smallPetPortrait}>
                  <Image
                    accessibilityLabel=""
                    contentFit="contain"
                    source={pet.source}
                    style={styles.smallPetImage}
                  />
                </View>
                <View style={styles.empathyCopy}>
                  <Text style={styles.empathyText}>{response.empathy}</Text>
                  <Text style={styles.followupText}>
                    이 중에서 지금 할 수 있을 것 같은 건 뭐야?
                  </Text>
                </View>
              </View>

              <View style={styles.questList}>
                {response.quests.map((quest, index) => (
                  <QuestChoiceCard
                    key={quest.id}
                    disabled={isStarting}
                    index={index}
                    isSelected={selectedQuestId === quest.id}
                    onPress={() => {
                      setSelectedQuestId(quest.id);
                      setStartError(null);
                    }}
                    quest={quest}
                  />
                ))}
              </View>

              {startError ? <Text style={styles.startError}>{startError}</Text> : null}

              <Pressable
                accessibilityRole="button"
                disabled={!selectedQuestId || isStarting}
                onPress={() => void handleStartSelected()}
                style={({ pressed }) => [
                  styles.startButton,
                  (!selectedQuestId || isStarting) && styles.startButtonDisabled,
                  pressed && selectedQuestId && !isStarting && styles.pressed,
                ]}
              >
                {isStarting ? (
                  <ActivityIndicator color="#FFF9F0" size="small" />
                ) : (
                  <Ionicons color="#FFF9F0" name="play" size={17} />
                )}
                <Text style={styles.startButtonText}>
                  {isStarting ? '준비하는 중…' : '이걸로 시작할게'}
                </Text>
              </Pressable>
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.inputDock}>
          <View style={styles.inputShell}>
            <TextInput
              accessibilityLabel="AI Quest 요청 메시지"
              blurOnSubmit
              editable={!isLoading}
              maxLength={500}
              multiline
              onChangeText={setInput}
              onSubmitEditing={handleSubmit}
              placeholder="지금 하기 싫거나 막막한 일을 말해줘"
              placeholderTextColor="#A99C8D"
              returnKeyType="send"
              style={styles.input}
              value={input}
            />
            <Text style={styles.characterCount}>{input.length}/500</Text>
          </View>
          <Pressable
            accessibilityLabel="메시지 보내기"
            accessibilityRole="button"
            disabled={!canSubmit}
            onPress={handleSubmit}
            style={({ pressed }) => [
              styles.sendButton,
              !canSubmit && styles.sendButtonDisabled,
              pressed && canSubmit && styles.pressed,
            ]}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF9F0" size="small" />
            ) : (
              <Ionicons color="#FFF9F0" name="arrow-up" size={21} />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FAF4E8',
  },
  keyboardView: {
    flex: 1,
  },
  blobTop: {
    position: 'absolute',
    top: -88,
    right: -74,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(243, 205, 211, 0.52)',
  },
  blobBottom: {
    position: 'absolute',
    bottom: 90,
    left: -82,
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: 'rgba(216, 230, 200, 0.46)',
  },
  header: {
    minHeight: 76,
    paddingHorizontal: 18,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E9DDCB',
    backgroundColor: 'rgba(255, 252, 245, 0.88)',
  },
  headerCopy: {
    flex: 1,
  },
  headerKicker: {
    color: '#B96E82',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.1,
  },
  headerTitle: {
    marginTop: 4,
    color: '#463A32',
    fontSize: 17,
    fontWeight: '900',
  },
  headerSparkle: {
    width: 40,
    height: 40,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FCE9EC',
  },
  content: {
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 28,
  },
  petConversation: {
    minHeight: 142,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  petPortrait: {
    width: 104,
    height: 112,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  petGlow: {
    position: 'absolute',
    bottom: 4,
    width: 90,
    height: 46,
    borderRadius: 45,
    backgroundColor: 'rgba(242, 205, 133, 0.42)',
  },
  petImage: {
    width: 100,
    height: 100,
  },
  petBubble: {
    flex: 1,
    marginBottom: 14,
    paddingHorizontal: 17,
    paddingVertical: 14,
    borderRadius: 22,
    borderBottomLeftRadius: 7,
    borderWidth: 1,
    borderColor: '#E9DDCB',
    backgroundColor: '#FFFDF7',
    shadowColor: '#796453',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.09,
    shadowRadius: 10,
    elevation: 3,
  },
  petBubbleTail: {
    position: 'absolute',
    left: -6,
    bottom: 10,
    width: 14,
    height: 14,
    borderRadius: 3,
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E9DDCB',
    backgroundColor: '#FFFDF7',
    transform: [{ rotate: '45deg' }],
  },
  petName: {
    color: '#B96E82',
    fontSize: 11,
    fontWeight: '900',
  },
  petMessage: {
    marginTop: 5,
    color: '#51463D',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700',
  },
  userBubbleWrap: {
    marginTop: 18,
    alignItems: 'flex-end',
  },
  userBubble: {
    maxWidth: '84%',
    paddingHorizontal: 17,
    paddingVertical: 13,
    borderRadius: 21,
    borderBottomRightRadius: 7,
    backgroundColor: '#E5EDD9',
  },
  userBubbleLabel: {
    color: '#71805F',
    fontSize: 10,
    fontWeight: '900',
  },
  userMessage: {
    marginTop: 4,
    color: '#3D4935',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  thinkingBubble: {
    alignSelf: 'flex-start',
    minHeight: 48,
    marginTop: 18,
    marginLeft: 32,
    paddingHorizontal: 16,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFDF7',
  },
  thinkingText: {
    color: '#857568',
    fontSize: 12,
    fontWeight: '800',
  },
  errorCard: {
    marginTop: 18,
    padding: 15,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#EBCAD1',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFF0F2',
  },
  errorIcon: {
    width: 34,
    height: 34,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9DDE3',
  },
  errorText: {
    flex: 1,
    color: '#8F5364',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '800',
  },
  retryButton: {
    minHeight: 36,
    paddingHorizontal: 13,
    borderRadius: 999,
    justifyContent: 'center',
    backgroundColor: '#B96E82',
  },
  retryButtonText: {
    color: '#FFF9F0',
    fontSize: 11,
    fontWeight: '900',
  },
  responseSection: {
    marginTop: 20,
  },
  empathyBubble: {
    padding: 14,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: '#E9DDCB',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    backgroundColor: '#FFFDF7',
  },
  smallPetPortrait: {
    width: 50,
    height: 50,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8E8D2',
  },
  smallPetImage: {
    width: 46,
    height: 46,
  },
  empathyCopy: {
    flex: 1,
  },
  empathyText: {
    color: '#51463D',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700',
  },
  followupText: {
    marginTop: 8,
    color: '#A85F73',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '900',
  },
  questList: {
    marginTop: 13,
    gap: 10,
  },
  startError: {
    marginTop: 12,
    color: '#A85F73',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  questCard: {
    minHeight: 104,
    padding: 14,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#E8DDCD',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#FFF9F0',
  },
  questCardSelected: {
    borderColor: '#C8768D',
    backgroundColor: '#FFF0F3',
    shadowColor: '#A85F73',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  questCardDisabled: {
    opacity: 0.72,
  },
  questNumberWrap: {
    width: 31,
    height: 31,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1E5D3',
  },
  questNumber: {
    color: '#715F50',
    fontSize: 13,
    fontWeight: '900',
  },
  questCopy: {
    flex: 1,
  },
  questLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  questLevel: {
    color: '#8A7663',
    fontSize: 10,
    fontWeight: '900',
  },
  questLevelSelected: {
    color: '#A85F73',
  },
  questTitle: {
    marginTop: 7,
    color: '#42372F',
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '900',
  },
  durationBadge: {
    alignSelf: 'flex-start',
    marginTop: 9,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1E8DA',
  },
  durationText: {
    color: '#786757',
    fontSize: 10,
    fontWeight: '900',
  },
  choiceMark: {
    width: 25,
    height: 25,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#D9CBB8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceMarkSelected: {
    borderColor: '#B96E82',
    backgroundColor: '#B96E82',
  },
  startButton: {
    minHeight: 52,
    marginTop: 15,
    borderRadius: 19,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#B96E82',
  },
  startButtonDisabled: {
    opacity: 0.4,
  },
  startButtonText: {
    color: '#FFF9F0',
    fontSize: 14,
    fontWeight: '900',
  },
  inputDock: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 8 : 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(222, 210, 193, 0.78)',
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    backgroundColor: 'rgba(250, 244, 232, 0.96)',
  },
  inputShell: {
    flex: 1,
    minHeight: 50,
    maxHeight: 112,
    paddingLeft: 15,
    paddingRight: 50,
    paddingVertical: 8,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: '#DED2C2',
    justifyContent: 'center',
    backgroundColor: '#FFFDF7',
  },
  input: {
    minHeight: 30,
    maxHeight: 82,
    padding: 0,
    color: '#463A32',
    fontSize: 14,
    lineHeight: 19,
    textAlignVertical: 'center',
  },
  characterCount: {
    position: 'absolute',
    right: 10,
    bottom: 7,
    color: '#B4A798',
    fontSize: 9,
    fontWeight: '700',
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#B96E82',
  },
  sendButtonDisabled: {
    backgroundColor: '#D5C8B9',
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.985 }],
  },
});
