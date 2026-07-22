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

type Point = { x: number; y: number };

type SegmentGeometry = {
  left: number;
  top: number;
  width: number;
  height: number;
  rotate: string;
};

type OutfitAppearance = {
  base: string;
  border: string;
  cuff: string;
  detail: string;
  pattern: 'plain' | 'ribbed' | 'cable' | 'lace';
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
// The generated scene is almost top-down. Keep live ink on the clear upper
// portion of the right page so it never paints over the character's hand.
const notebookSourceFrame = { x: 500, y: 620, width: 310, height: 290 };
const rightPageSourceFrame = { x: 470, y: 582, width: 370, height: 570 };
const writingArmSourceSize = { width: 1086, height: 1448 };
const writingArmNib = { x: 286, y: 270 };
const writingArmElbow = { x: 1020, y: 1415 };
const restingArmSourceSize = { width: 941, height: 1672 };
const restingArmShoulder = { x: 86, y: 1630 };
const restingArmWrist = { x: 346, y: 654 };
const rightShoulder = { x: 885, y: 1580 };
const leftShoulder = { x: 58, y: 1582 };
const leftElbow = { x: 62, y: 1320 };
const leftWrist = { x: 166, y: 1070 };
const upperArmLength = 410;
const forearmLength = 590;
const pageGuideLines = Array.from({ length: 15 });
const sleeveTextureLines = Array.from({ length: 4 });

const outfitAppearances: Record<CharacterId, OutfitAppearance> = {
  daily: {
    base: '#E9DFC9',
    border: '#C8B89E',
    cuff: '#D7C8AF',
    detail: 'rgba(146, 122, 91, 0.2)',
    pattern: 'ribbed',
  },
  cozy: {
    base: '#E8D5B5',
    border: '#C2A67E',
    cuff: '#D3B98E',
    detail: 'rgba(139, 103, 64, 0.25)',
    pattern: 'cable',
  },
  casual: {
    base: '#B9BEC0',
    border: '#899194',
    cuff: '#A4AAAC',
    detail: 'rgba(71, 82, 87, 0.2)',
    pattern: 'plain',
  },
  neat: {
    base: '#F3EDE3',
    border: '#CBBCA7',
    cuff: '#DDD0BB',
    detail: 'rgba(128, 104, 76, 0.18)',
    pattern: 'ribbed',
  },
  ropan: {
    base: '#E8C1BC',
    border: '#C79FA1',
    cuff: '#F0D7CE',
    detail: 'rgba(147, 92, 102, 0.22)',
    pattern: 'lace',
  },
};

function distanceBetween(a: Point, b: Point) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function pointBetween(start: Point, end: Point, progress: number): Point {
  return {
    x: start.x + ((end.x - start.x) * progress),
    y: start.y + ((end.y - start.y) * progress),
  };
}

function solveElbow(shoulder: Point, target: Point) {
  const dx = target.x - shoulder.x;
  const dy = target.y - shoulder.y;
  const targetDistance = Math.max(1, Math.hypot(dx, dy));
  const minReach = Math.abs(forearmLength - upperArmLength) + 1;
  const maxReach = forearmLength + upperArmLength - 1;
  const solvedDistance = Math.min(maxReach, Math.max(minReach, targetDistance));
  const direction = { x: dx / targetDistance, y: dy / targetDistance };
  const solvedTarget = {
    x: shoulder.x + direction.x * solvedDistance,
    y: shoulder.y + direction.y * solvedDistance,
  };
  const shoulderToProjection = (
    (upperArmLength ** 2)
    - (forearmLength ** 2)
    + (solvedDistance ** 2)
  ) / (2 * solvedDistance);
  const elbowOffset = Math.sqrt(Math.max(
    0,
    (upperArmLength ** 2) - (shoulderToProjection ** 2),
  ));
  const projection = {
    x: shoulder.x + direction.x * shoulderToProjection,
    y: shoulder.y + direction.y * shoulderToProjection,
  };
  const rightSideNormal = { x: -direction.y, y: direction.x };

  return {
    elbow: {
      x: projection.x + rightSideNormal.x * elbowOffset,
      y: projection.y + rightSideNormal.y * elbowOffset,
    },
    target: solvedTarget,
  };
}

function placeSegment(
  sourceSize: { width: number; height: number },
  sourceStart: Point,
  sourceEnd: Point,
  worldStart: Point,
  worldEnd: Point,
  coverScale: number,
  offsetX: number,
  offsetY: number,
): SegmentGeometry {
  const sourceAngle = Math.atan2(
    sourceEnd.y - sourceStart.y,
    sourceEnd.x - sourceStart.x,
  );
  const worldAngle = Math.atan2(
    worldEnd.y - worldStart.y,
    worldEnd.x - worldStart.x,
  );
  const rotation = worldAngle - sourceAngle;
  const assetScale = (distanceBetween(worldStart, worldEnd) / distanceBetween(sourceStart, sourceEnd))
    * coverScale;
  const width = sourceSize.width * assetScale;
  const height = sourceSize.height * assetScale;
  const center = { x: width / 2, y: height / 2 };
  const scaledStart = {
    x: sourceStart.x * assetScale,
    y: sourceStart.y * assetScale,
  };
  const startFromCenter = {
    x: scaledStart.x - center.x,
    y: scaledStart.y - center.y,
  };
  const rotatedStart = {
    x: (startFromCenter.x * Math.cos(rotation)) - (startFromCenter.y * Math.sin(rotation)),
    y: (startFromCenter.x * Math.sin(rotation)) + (startFromCenter.y * Math.cos(rotation)),
  };

  return {
    left: offsetX + (worldStart.x * coverScale) - center.x - rotatedStart.x,
    top: offsetY + (worldStart.y * coverScale) - center.y - rotatedStart.y,
    width,
    height,
    rotate: `${rotation * 180 / Math.PI}deg`,
  };
}

function placeBone(
  start: Point,
  end: Point,
  sourceThickness: number,
  coverScale: number,
  offsetX: number,
  offsetY: number,
): SegmentGeometry {
  const startOnScreen = {
    x: offsetX + (start.x * coverScale),
    y: offsetY + (start.y * coverScale),
  };
  const endOnScreen = {
    x: offsetX + (end.x * coverScale),
    y: offsetY + (end.y * coverScale),
  };
  const width = distanceBetween(startOnScreen, endOnScreen);
  const height = sourceThickness * coverScale;

  return {
    left: ((startOnScreen.x + endOnScreen.x) / 2) - (width / 2),
    top: ((startOnScreen.y + endOnScreen.y) / 2) - (height / 2),
    width,
    height,
    rotate: `${Math.atan2(
      endOnScreen.y - startOnScreen.y,
      endOnScreen.x - startOnScreen.x,
    ) * 180 / Math.PI}deg`,
  };
}

function SleeveTexture({ appearance, showCuff }: {
  appearance: OutfitAppearance;
  showCuff: boolean;
}) {
  return (
    <>
      {appearance.pattern !== 'plain' ? (
        <View style={styles.sleeveTexture}>
          {sleeveTextureLines.map((_, index) => (
            <View
              key={index}
              style={[
                styles.sleeveTextureLine,
                {
                  backgroundColor: appearance.detail,
                  left: `${18 + (index * 18)}%`,
                  transform: [{ rotate: appearance.pattern === 'cable' ? '8deg' : '0deg' }],
                },
              ]}
            />
          ))}
        </View>
      ) : null}
      {appearance.pattern === 'lace' ? (
        <View style={[styles.laceEdge, { borderColor: appearance.detail }]} />
      ) : null}
      {showCuff ? (
        <View style={[
          styles.sleeveCuff,
          { backgroundColor: appearance.cuff, borderColor: appearance.border },
        ]}
        />
      ) : null}
    </>
  );
}

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
  const writingMotion = useRef(new Animated.Value(0)).current;
  const breathingMotion = useRef(new Animated.Value(0)).current;
  const pageFlip = useRef(new Animated.Value(0)).current;
  const notebookClose = useRef(new Animated.Value(0)).current;
  const previousCompletedPages = useRef(completedPages);
  const outfit = outfitAppearances[characterId];

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
    if (!isStarted || !isRunning || isPaused || isCompleting) {
      writingMotion.stopAnimation();
      return undefined;
    }

    const writingLoop = Animated.loop(Animated.sequence([
      Animated.timing(writingMotion, {
        toValue: 1,
        duration: 1900,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(writingMotion, {
        toValue: 0,
        duration: 480,
        easing: Easing.out(Easing.quad),
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.delay(720),
    ]));

    writingLoop.start();
    return () => writingLoop.stop();
  }, [isCompleting, isPaused, isRunning, isStarted, writingMotion]);

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

  const writingLineIndex = Math.min(
    handwritingPatterns.length - 1,
    Math.floor(currentPageProgress * handwritingPatterns.length),
  );

  const lineProgresses = useMemo(() => (
    handwritingPatterns.map((_, index) => {
      const lineStart = index / handwritingPatterns.length;
      return Math.min(
        1,
        Math.max(0, (currentPageProgress - lineStart) * handwritingPatterns.length),
      );
    })
  ), [currentPageProgress]);

  const activePenPosition = useMemo(() => {
    const activePattern = handwritingPatterns[writingLineIndex];
    const lineProgress = lineProgresses[writingLineIndex] ?? 0;
    const strokeCursor = lineProgress * activePattern.length;
    const strokeIndex = Math.min(
      activePattern.length - 1,
      Math.floor(strokeCursor),
    );
    const stroke = activePattern[strokeIndex];
    const strokeProgress = lineProgress >= 1
      ? 1
      : Math.max(0, Math.min(1, strokeCursor - strokeIndex));

    return {
      xPercent: stroke.left + (stroke.width * strokeProgress),
      lineIndex: writingLineIndex,
    };
  }, [lineProgresses, writingLineIndex]);

  const sceneGeometry = useMemo(() => {
    const coverScale = Math.max(
      viewportWidth / sceneSource.width,
      viewportHeight / sceneSource.height,
    );
    const renderedWidth = sceneSource.width * coverScale;
    const renderedHeight = sceneSource.height * coverScale;
    const offsetX = (viewportWidth - renderedWidth) / 2;
    const offsetY = (viewportHeight - renderedHeight) / 2;

    const notebookPaddingX = notebookSourceFrame.width * 0.08;
    const notebookPaddingTop = notebookSourceFrame.height * 0.08;
    const notebookContentWidth = notebookSourceFrame.width - (notebookPaddingX * 2);
    const notebookContentHeight = notebookSourceFrame.height - notebookPaddingTop;
    const lineHeight = notebookContentHeight * 0.122;
    const activePenSourceX = notebookSourceFrame.x
      + notebookPaddingX
      + (notebookContentWidth * activePenPosition.xPercent / 100);
    const activePenSourceY = notebookSourceFrame.y
      + notebookPaddingTop
      + ((activePenPosition.lineIndex + 0.5) * lineHeight);
    const penTarget = { x: activePenSourceX, y: activePenSourceY };
    const solvedArm = solveElbow(rightShoulder, penTarget);
    const rightWrist = pointBetween(solvedArm.elbow, solvedArm.target, 0.64);
    const writingArm = placeSegment(
      writingArmSourceSize,
      writingArmElbow,
      writingArmNib,
      solvedArm.elbow,
      solvedArm.target,
      coverScale,
      offsetX,
      offsetY,
    );
    const restingArm = placeSegment(
      restingArmSourceSize,
      restingArmShoulder,
      restingArmWrist,
      leftShoulder,
      leftWrist,
      coverScale,
      offsetX,
      offsetY,
    );

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
      arm: {
        bareUpperRight: placeBone(
          rightShoulder,
          solvedArm.elbow,
          126,
          coverScale,
          offsetX,
          offsetY,
        ),
        writing: writingArm,
        resting: restingArm,
        sleeveUpperRight: placeBone(
          rightShoulder,
          solvedArm.elbow,
          176,
          coverScale,
          offsetX,
          offsetY,
        ),
        sleeveForearmRight: placeBone(
          solvedArm.elbow,
          rightWrist,
          158,
          coverScale,
          offsetX,
          offsetY,
        ),
        sleeveUpperLeft: placeBone(
          leftShoulder,
          leftElbow,
          174,
          coverScale,
          offsetX,
          offsetY,
        ),
        sleeveForearmLeft: placeBone(
          leftElbow,
          leftWrist,
          154,
          coverScale,
          offsetX,
          offsetY,
        ),
      },
    };
  }, [activePenPosition, viewportHeight, viewportWidth]);

  const armOpacity = isStarted
    ? pageFlip.interpolate({
      inputRange: [0, 0.08, 0.42, 0.9, 1],
      outputRange: [1, 1, 0, 0, 1],
    })
    : 0;
  const writingTranslateX = writingMotion.interpolate({
    inputRange: [0, 1],
    outputRange: [-1, 3],
  });

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
          source={require('../../../assets/images/study/moveon-study-scene-writing-clean.png')}
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
            styles.bareArmBone,
            sceneGeometry.arm.bareUpperRight,
            {
              opacity: armOpacity,
              transform: [
                { translateX: writingTranslateX },
                { translateY: isCompleting ? 18 : 0 },
                { rotate: sceneGeometry.arm.bareUpperRight.rotate },
              ],
            },
          ]}
        />

        <Animated.Image
          resizeMode="contain"
          source={require('../../../assets/images/study/moveon-resting-arm-bare.png')}
          style={[
            styles.articulatedArmSegment,
            sceneGeometry.arm.resting,
            {
              opacity: armOpacity,
              transform: [
                { translateY: isCompleting ? 10 : 0 },
                { rotate: sceneGeometry.arm.resting.rotate },
              ],
            },
          ]}
        />

        <Animated.Image
          resizeMode="contain"
          source={require('../../../assets/images/study/moveon-writing-arm-bare.png')}
          style={[
            styles.articulatedArmSegment,
            sceneGeometry.arm.writing,
            {
              opacity: armOpacity,
              transform: [
                { translateX: writingTranslateX },
                { translateY: isCompleting ? 18 : 0 },
                { rotate: sceneGeometry.arm.writing.rotate },
              ],
            },
          ]}
        />

        <Animated.View
          style={[
            styles.outfitSleeveSegment,
            sceneGeometry.arm.sleeveUpperLeft,
            {
              backgroundColor: outfit.base,
              borderColor: outfit.border,
              opacity: armOpacity,
              transform: [
                { translateY: isCompleting ? 10 : 0 },
                { rotate: sceneGeometry.arm.sleeveUpperLeft.rotate },
              ],
            },
          ]}
        >
          <SleeveTexture appearance={outfit} showCuff={false} />
        </Animated.View>

        <Animated.View
          style={[
            styles.outfitSleeveSegment,
            sceneGeometry.arm.sleeveForearmLeft,
            {
              backgroundColor: outfit.base,
              borderColor: outfit.border,
              opacity: armOpacity,
              transform: [
                { translateY: isCompleting ? 10 : 0 },
                { rotate: sceneGeometry.arm.sleeveForearmLeft.rotate },
              ],
            },
          ]}
        >
          <SleeveTexture appearance={outfit} showCuff />
        </Animated.View>

        <Animated.View
          style={[
            styles.outfitSleeveSegment,
            sceneGeometry.arm.sleeveUpperRight,
            {
              backgroundColor: outfit.base,
              borderColor: outfit.border,
              opacity: armOpacity,
              transform: [
                { translateX: writingTranslateX },
                { translateY: isCompleting ? 18 : 0 },
                { rotate: sceneGeometry.arm.sleeveUpperRight.rotate },
              ],
            },
          ]}
        >
          <SleeveTexture appearance={outfit} showCuff={false} />
        </Animated.View>

        <Animated.View
          style={[
            styles.outfitSleeveSegment,
            sceneGeometry.arm.sleeveForearmRight,
            {
              backgroundColor: outfit.base,
              borderColor: outfit.border,
              opacity: armOpacity,
              transform: [
                { translateX: writingTranslateX },
                { translateY: isCompleting ? 18 : 0 },
                { rotate: sceneGeometry.arm.sleeveForearmRight.rotate },
              ],
            },
          ]}
        >
          <SleeveTexture appearance={outfit} showCuff />
        </Animated.View>

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
  articulatedArmSegment: {
    position: 'absolute',
  },
  bareArmBone: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: '#E5A273',
    borderWidth: 0.7,
    borderColor: 'rgba(153, 92, 57, 0.3)',
  },
  outfitSleeveSegment: {
    position: 'absolute',
    overflow: 'hidden',
    borderRadius: 999,
    borderWidth: 1,
    shadowColor: '#6D4B32',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 1,
  },
  sleeveTexture: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    borderRadius: 999,
  },
  sleeveTextureLine: {
    position: 'absolute',
    top: '-20%',
    width: 1.2,
    height: '140%',
    borderRadius: 1,
  },
  sleeveCuff: {
    position: 'absolute',
    top: '-8%',
    right: '-1%',
    width: '17%',
    height: '116%',
    borderLeftWidth: 1,
    borderRadius: 999,
  },
  laceEdge: {
    position: 'absolute',
    top: '12%',
    right: '4%',
    width: '14%',
    height: '76%',
    borderWidth: 1,
    borderStyle: 'dotted',
    borderRadius: 999,
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
