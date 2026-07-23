import { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Easing,
  Platform,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import type { CharacterId } from '@/features/onboarding/onboardingData';

type StudySceneProps = {
  characterId?: CharacterId;
  isStarted: boolean;
  isRunning: boolean;
  isPaused: boolean;
  isCompleting: boolean;
  completedPages: number;
  currentPageProgress: number;
};

type HandwritingStroke = {
  left: number;
  width: number;
  top: number;
  rotate: number;
  opacity: number;
};

const handwritingPatterns: HandwritingStroke[][] = [
  [
    { left: 1, width: 16, top: 1, rotate: -1.3, opacity: 0.58 },
    { left: 20, width: 9, top: 0, rotate: 1.1, opacity: 0.48 },
    { left: 32, width: 22, top: 1, rotate: -0.6, opacity: 0.62 },
    { left: 58, width: 13, top: -1, rotate: 1.4, opacity: 0.5 },
    { left: 74, width: 18, top: 0, rotate: -0.8, opacity: 0.57 },
  ],
  [
    { left: 0, width: 11, top: 0, rotate: 1.2, opacity: 0.52 },
    { left: 14, width: 19, top: 1, rotate: -0.9, opacity: 0.61 },
    { left: 37, width: 8, top: -1, rotate: 1.7, opacity: 0.45 },
    { left: 48, width: 25, top: 0, rotate: -0.5, opacity: 0.57 },
    { left: 77, width: 12, top: 1, rotate: 1.1, opacity: 0.49 },
  ],
  [
    { left: 2, width: 22, top: -1, rotate: -0.7, opacity: 0.6 },
    { left: 27, width: 10, top: 1, rotate: 1.4, opacity: 0.46 },
    { left: 40, width: 16, top: 0, rotate: -1.2, opacity: 0.56 },
    { left: 60, width: 24, top: 1, rotate: 0.6, opacity: 0.62 },
  ],
  [
    { left: 0, width: 14, top: 1, rotate: 1.1, opacity: 0.49 },
    { left: 17, width: 26, top: 0, rotate: -0.6, opacity: 0.61 },
    { left: 47, width: 12, top: -1, rotate: 1.5, opacity: 0.47 },
    { left: 62, width: 19, top: 1, rotate: -1, opacity: 0.57 },
    { left: 84, width: 8, top: 0, rotate: 1.2, opacity: 0.45 },
  ],
  [
    { left: 1, width: 18, top: 0, rotate: -1, opacity: 0.57 },
    { left: 23, width: 8, top: 1, rotate: 1.6, opacity: 0.44 },
    { left: 34, width: 23, top: -1, rotate: -0.5, opacity: 0.61 },
    { left: 61, width: 11, top: 1, rotate: 1.3, opacity: 0.48 },
    { left: 76, width: 15, top: 0, rotate: -0.8, opacity: 0.55 },
  ],
  [
    { left: 0, width: 10, top: -1, rotate: 1.4, opacity: 0.47 },
    { left: 13, width: 21, top: 0, rotate: -0.7, opacity: 0.6 },
    { left: 38, width: 14, top: 1, rotate: 1, opacity: 0.5 },
    { left: 56, width: 27, top: 0, rotate: -0.6, opacity: 0.59 },
  ],
  [
    { left: 2, width: 24, top: 1, rotate: -0.6, opacity: 0.62 },
    { left: 29, width: 11, top: -1, rotate: 1.4, opacity: 0.46 },
    { left: 44, width: 18, top: 0, rotate: -1, opacity: 0.56 },
    { left: 66, width: 10, top: 1, rotate: 1.2, opacity: 0.48 },
    { left: 79, width: 13, top: 0, rotate: -0.5, opacity: 0.54 },
  ],
  [
    { left: 0, width: 17, top: 0, rotate: 1, opacity: 0.55 },
    { left: 21, width: 12, top: 1, rotate: -1.4, opacity: 0.48 },
    { left: 36, width: 25, top: -1, rotate: 0.6, opacity: 0.61 },
    { left: 65, width: 16, top: 1, rotate: -0.8, opacity: 0.54 },
  ],
];
const sceneSource = { width: 941, height: 1672 };
const studySceneSources: Record<CharacterId, number> = {
  daily: require('../../../assets/images/study/moveon-study-scene-daily-v2.png'),
  cozy: require('../../../assets/images/study/moveon-study-scene-cozy-v2.png'),
  casual: require('../../../assets/images/study/moveon-study-scene-casual-v2.png'),
  neat: require('../../../assets/images/study/moveon-study-scene-neat-v2.png'),
  ropan: require('../../../assets/images/study/moveon-study-scene-ropan-v2.png'),
};
// The generated scene is almost top-down. Keep live ink on the clear upper
// portion of the right page so it never paints over the character's hand.
const notebookSourceFrame = { x: 500, y: 620, width: 310, height: 290 };
const rightPageSourceFrame = { x: 470, y: 582, width: 370, height: 570 };
const pageGuideLines = Array.from({ length: 15 });

export function StudyScene({
  characterId = 'daily',
  isStarted,
  isRunning,
  isPaused,
  isCompleting,
  completedPages,
  currentPageProgress,
}: StudySceneProps) {
  const { width: viewportWidth, height: viewportHeight } = useWindowDimensions();
  const sceneFocus = useRef(new Animated.Value(isStarted ? 1 : 0)).current;
  const breathingMotion = useRef(new Animated.Value(0)).current;
  const pageFlip = useRef(new Animated.Value(0)).current;
  const notebookClose = useRef(new Animated.Value(0)).current;
  const previousCompletedPages = useRef(completedPages);

  useEffect(() => {
    const animation = Animated.timing(sceneFocus, {
      toValue: isStarted ? 1 : 0,
      duration: 920,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    });
    animation.start();
    return () => animation.stop();
  }, [isStarted, sceneFocus]);

  useEffect(() => {
    if (!isStarted || isCompleting) {
      breathingMotion.stopAnimation();
      return undefined;
    }

    const breathingLoop = Animated.loop(Animated.sequence([
      Animated.timing(breathingMotion, {
        toValue: 1,
        duration: 2600,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(breathingMotion, {
        toValue: 0,
        duration: 2600,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]));

    breathingLoop.start();
    return () => breathingLoop.stop();
  }, [breathingMotion, isCompleting, isStarted]);

  useEffect(() => {
    if (completedPages <= previousCompletedPages.current) {
      previousCompletedPages.current = completedPages;
      return undefined;
    }

    previousCompletedPages.current = completedPages;
    pageFlip.setValue(0);
    const flipAnimation = Animated.timing(pageFlip, {
      toValue: 1,
      duration: 820,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    });
    flipAnimation.start(({ finished }) => {
      if (finished) pageFlip.setValue(0);
    });
    return () => flipAnimation.stop();
  }, [completedPages, pageFlip]);

  useEffect(() => {
    const closeAnimation = Animated.timing(notebookClose, {
      toValue: isCompleting ? 1 : 0,
      duration: isCompleting ? 620 : 180,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    });
    closeAnimation.start();
    return () => closeAnimation.stop();
  }, [isCompleting, notebookClose]);

  const lineProgresses = useMemo(() => (
    handwritingPatterns.map((_, index) => {
      const lineStart = index / handwritingPatterns.length;
      return Math.min(
        1,
        Math.max(0, (currentPageProgress - lineStart) * handwritingPatterns.length),
      );
    })
  ), [currentPageProgress]);

  const sceneGeometry = useMemo(() => {
    const coverScale = Math.max(
      viewportWidth / sceneSource.width,
      viewportHeight / sceneSource.height,
    );
    const renderedWidth = sceneSource.width * coverScale;
    const renderedHeight = sceneSource.height * coverScale;
    const offsetX = (viewportWidth - renderedWidth) / 2;
    const offsetY = (viewportHeight - renderedHeight) / 2;

    return {
      notebook: {
        left: offsetX + (notebookSourceFrame.x * coverScale),
        top: offsetY + (notebookSourceFrame.y * coverScale),
        width: notebookSourceFrame.width * coverScale,
        height: notebookSourceFrame.height * coverScale,
        paddingTop: notebookSourceFrame.height * coverScale * 0.08,
        paddingHorizontal: notebookSourceFrame.width * coverScale * 0.08,
      },
      rightPage: {
        left: offsetX + (rightPageSourceFrame.x * coverScale),
        top: offsetY + (rightPageSourceFrame.y * coverScale),
        width: rightPageSourceFrame.width * coverScale,
        height: rightPageSourceFrame.height * coverScale,
      },
    };
  }, [viewportHeight, viewportWidth]);

  return (
    <View pointerEvents="none" style={styles.scene}>
      <Animated.Image
        resizeMode="cover"
        source={require('../../../assets/images/room/moveon-room-empty.png')}
        style={[styles.image, {
          opacity: sceneFocus.interpolate({
            inputRange: [0, 0.82, 1],
            outputRange: [1, 0.28, 0],
          }),
          transform: [{
            scale: sceneFocus.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 1.2],
            }),
          }],
        }]}
      />

      <Animated.View
        style={[
          styles.focusedWorld,
          {
            opacity: sceneFocus,
            transform: [
              {
                scale: sceneFocus.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.93, 1.04],
                }),
              },
              {
                translateY: breathingMotion.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -1.2],
                }),
              },
            ],
          },
        ]}
      >
        <Animated.Image
          resizeMode="cover"
          source={studySceneSources[characterId]}
          style={styles.image}
        />

        <View style={[styles.notebookSurface, sceneGeometry.notebook]}>
          {lineProgresses.map((progress, lineIndex) => (
            <View key={lineIndex} style={styles.lineTrack}>
              {handwritingPatterns[lineIndex].map((stroke, strokeIndex) => {
                const strokeProgress = Math.min(
                  1,
                  Math.max(
                    0,
                    (progress - (strokeIndex / handwritingPatterns[lineIndex].length))
                      * handwritingPatterns[lineIndex].length,
                  ),
                );

                return (
                  <View
                    key={strokeIndex}
                    style={[
                      styles.handwritingStroke,
                      {
                        left: `${stroke.left}%`,
                        top: stroke.top,
                        width: `${stroke.width * strokeProgress}%`,
                        opacity: stroke.opacity,
                        transform: [{ rotate: `${stroke.rotate}deg` }],
                      },
                    ]}
                  />
                );
              })}
            </View>
          ))}

          <Animated.View
            style={[
              styles.notebookCover,
              {
                opacity: notebookClose,
                transform: [
                  { perspective: 420 },
                  {
                    rotateX: notebookClose.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['-82deg', '0deg'],
                    }),
                  },
                ],
              },
            ]}
          />
        </View>

        <Animated.View
          style={[
            styles.pageTurn,
            sceneGeometry.rightPage,
            {
              opacity: pageFlip.interpolate({
                inputRange: [0, 0.015, 0.84, 1],
                outputRange: [0, 1, 0.96, 0],
              }),
              transform: [
                { perspective: 760 },
                { translateX: -(sceneGeometry.rightPage.width / 2) },
                {
                  rotateY: pageFlip.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '-178deg'],
                  }),
                },
                { translateX: sceneGeometry.rightPage.width / 2 },
              ],
            },
          ]}
        >
          <View style={styles.pageTurnInner}>
            {pageGuideLines.map((_, index) => (
              <View key={index} style={styles.pageGuideLine} />
            ))}
            <View style={styles.pageTurnWriting}>
              {handwritingPatterns.map((pattern, lineIndex) => (
                <View key={lineIndex} style={styles.pageTurnWritingLine}>
                  {pattern.map((stroke, strokeIndex) => (
                    <View
                      key={strokeIndex}
                      style={[
                        styles.pageTurnStroke,
                        {
                          left: `${stroke.left}%`,
                          top: stroke.top,
                          width: `${stroke.width}%`,
                          opacity: stroke.opacity,
                          transform: [{ rotate: `${stroke.rotate}deg` }],
                        },
                      ]}
                    />
                  ))}
                </View>
              ))}
            </View>
          </View>
        </Animated.View>
      </Animated.View>

      <View style={styles.warmVignette} />
    </View>
  );
}

const styles = StyleSheet.create({
  scene: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    backgroundColor: '#E9D8BE',
  },
  focusedWorld: {
    ...StyleSheet.absoluteFillObject,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  notebookSurface: {
    position: 'absolute',
    overflow: 'hidden',
  },
  lineTrack: {
    position: 'relative',
    height: '12.2%',
    justifyContent: 'center',
  },
  handwritingStroke: {
    position: 'absolute',
    top: '50%',
    height: 0.85,
    borderRadius: 2,
    backgroundColor: '#5F5044',
  },
  notebookCover: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: 'rgba(91, 64, 40, 0.35)',
    backgroundColor: '#A98461',
  },
  pageTurn: {
    position: 'absolute',
    overflow: 'hidden',
    borderTopRightRadius: 9,
    borderBottomRightRadius: 9,
    borderWidth: 0.6,
    borderColor: 'rgba(118, 91, 60, 0.22)',
    backgroundColor: '#FFF9EA',
    shadowColor: '#4E351F',
    shadowOffset: { width: -7, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 5,
  },
  pageTurnInner: {
    flex: 1,
    paddingTop: '8%',
    paddingHorizontal: '9%',
    backgroundColor: 'rgba(255, 250, 237, 0.98)',
  },
  pageGuideLine: {
    height: 0.65,
    marginBottom: '5.1%',
    backgroundColor: 'rgba(148, 127, 99, 0.16)',
  },
  pageTurnWriting: {
    position: 'absolute',
    top: '8%',
    left: '9%',
    width: '82%',
    height: '52%',
  },
  pageTurnWritingLine: {
    position: 'relative',
    height: '12.2%',
    justifyContent: 'center',
  },
  pageTurnStroke: {
    position: 'absolute',
    top: '50%',
    height: 0.8,
    borderRadius: 2,
    backgroundColor: '#665547',
  },
  warmVignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(82, 53, 27, 0.04)',
  },
});
