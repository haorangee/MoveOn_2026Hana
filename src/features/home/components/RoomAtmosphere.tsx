import { useEffect, useMemo, useRef } from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';

export type RoomWeather = 'clear' | 'rain' | 'snow';
type DayPhase = 'morning' | 'afternoon' | 'evening' | 'night';

type RoomAtmosphereProps = {
  weather: RoomWeather;
};

const phaseColors: Record<DayPhase, string> = {
  morning: 'rgba(255, 222, 154, 0.08)',
  afternoon: 'rgba(255, 244, 213, 0.025)',
  evening: 'rgba(221, 125, 74, 0.18)',
  night: 'rgba(34, 48, 74, 0.42)',
};

function getDayPhase(hour: number): DayPhase {
  if (hour >= 6 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 20) return 'evening';
  return 'night';
}

export function getInitialMockWeather(): RoomWeather {
  const date = new Date();
  const code = (date.getMonth() + 1 + date.getDate()) % 12;
  if (code === 0) return 'snow';
  if (code <= 2) return 'rain';
  return 'clear';
}

export function getNextWeather(weather: RoomWeather): RoomWeather {
  if (weather === 'clear') return 'rain';
  if (weather === 'rain') return 'snow';
  return 'clear';
}

export function RoomAtmosphere({ weather }: RoomAtmosphereProps) {
  const curtain = useRef(new Animated.Value(0)).current;
  const sunlight = useRef(new Animated.Value(0)).current;
  const leaves = useRef(new Animated.Value(0)).current;
  const precipitation = useRef(new Animated.Value(0)).current;
  const phase = useMemo(() => getDayPhase(new Date().getHours()), []);

  useEffect(() => {
    const curtainAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(curtain, {
          toValue: 1,
          duration: 4400,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(curtain, {
          toValue: 0,
          duration: 5200,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]),
    );
    const sunlightAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(sunlight, {
          toValue: 1,
          duration: 11000,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(sunlight, {
          toValue: 0,
          duration: 11000,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]),
    );
    const leafAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(leaves, {
          toValue: 1,
          duration: 2600,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(leaves, {
          toValue: 0,
          duration: 3200,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]),
    );
    const weatherAnimation = Animated.loop(
      Animated.timing(precipitation, {
        toValue: 1,
        duration: weather === 'snow' ? 5200 : 1800,
        useNativeDriver: Platform.OS !== 'web',
      }),
    );

    curtainAnimation.start();
    sunlightAnimation.start();
    leafAnimation.start();
    precipitation.setValue(0);
    if (weather !== 'clear') weatherAnimation.start();

    return () => {
      curtainAnimation.stop();
      sunlightAnimation.stop();
      leafAnimation.stop();
      weatherAnimation.stop();
    };
  }, [curtain, leaves, precipitation, sunlight, weather]);

  const curtainTransform = {
    transform: [
      {
        translateX: curtain.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 4],
        }),
      },
      {
        rotate: curtain.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '1.3deg'],
        }),
      },
    ],
  };

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View
        style={[
          styles.sunBeam,
          {
            opacity: sunlight.interpolate({
              inputRange: [0, 1],
              outputRange: [0.12, 0.25],
            }),
            transform: [
              { rotate: '10deg' },
              {
                translateX: sunlight.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-8, 12],
                }),
              },
            ],
          },
        ]}
      />

      <View
        style={[
          styles.windowWeather,
          weather === 'rain' && styles.rainTint,
          weather === 'snow' && styles.snowTint,
        ]}
      >
        {weather === 'rain' ? (
          <Animated.View
            style={[
              styles.precipitationField,
              {
                transform: [
                  {
                    translateY: precipitation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-80, 80],
                    }),
                  },
                ],
              },
            ]}
          >
            {Array.from({ length: 16 }).map((_, index) => (
              <View
                key={`rain-${index}`}
                style={[
                  styles.rainDrop,
                  {
                    left: `${(index * 19) % 100}%`,
                    top: `${(index * 31) % 100}%`,
                    opacity: 0.42 + (index % 4) * 0.1,
                  },
                ]}
              />
            ))}
          </Animated.View>
        ) : null}

        {weather === 'snow' ? (
          <Animated.View
            style={[
              styles.precipitationField,
              {
                transform: [
                  {
                    translateY: precipitation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-38, 88],
                    }),
                  },
                ],
              },
            ]}
          >
            {Array.from({ length: 18 }).map((_, index) => (
              <View
                key={`snow-${index}`}
                style={[
                  styles.snowflake,
                  {
                    left: `${(index * 23) % 96}%`,
                    top: `${(index * 37) % 100}%`,
                    width: 2 + (index % 3),
                    height: 2 + (index % 3),
                  },
                ]}
              />
            ))}
          </Animated.View>
        ) : null}
      </View>

      <Animated.View style={[styles.leftCurtain, curtainTransform]} />
      <Animated.View
        style={[
          styles.rightCurtain,
          {
            transform: [
              {
                translateX: curtain.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -5],
                }),
              },
              {
                rotate: curtain.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '-1.1deg'],
                }),
              },
            ],
          },
        ]}
      />

      <Animated.View
        style={[
          styles.leafCluster,
          {
            transform: [
              {
                rotate: leaves.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['-1deg', '2deg'],
                }),
              },
            ],
          },
        ]}
      >
        <View style={[styles.leaf, styles.leafOne]} />
        <View style={[styles.leaf, styles.leafTwo]} />
        <View style={[styles.leaf, styles.leafThree]} />
      </Animated.View>

      <View style={[StyleSheet.absoluteFill, { backgroundColor: phaseColors[phase] }]} />
      {phase === 'night' ? <View style={styles.lampGlow} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  sunBeam: {
    position: 'absolute',
    left: '19%',
    top: '31%',
    width: '45%',
    height: '58%',
    borderRadius: 180,
    backgroundColor: 'rgba(255, 227, 162, 0.34)',
  },
  windowWeather: {
    position: 'absolute',
    left: '19%',
    top: '12%',
    width: '31%',
    height: '24%',
    overflow: 'hidden',
  },
  rainTint: { backgroundColor: 'rgba(81, 118, 139, 0.1)' },
  snowTint: { backgroundColor: 'rgba(226, 238, 242, 0.08)' },
  precipitationField: {
    ...StyleSheet.absoluteFillObject,
    height: '150%',
  },
  rainDrop: {
    position: 'absolute',
    width: 1,
    height: 15,
    backgroundColor: '#7396AA',
    transform: [{ rotate: '11deg' }],
  },
  snowflake: {
    position: 'absolute',
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.82)',
  },
  leftCurtain: {
    position: 'absolute',
    left: '16.5%',
    top: '9.5%',
    width: '5.8%',
    height: '29%',
    borderBottomRightRadius: 28,
    backgroundColor: 'rgba(255, 253, 247, 0.13)',
  },
  rightCurtain: {
    position: 'absolute',
    left: '43.7%',
    top: '9.8%',
    width: '6%',
    height: '30%',
    borderBottomLeftRadius: 28,
    backgroundColor: 'rgba(255, 253, 247, 0.12)',
  },
  leafCluster: {
    position: 'absolute',
    left: '1%',
    top: '57%',
    width: '20%',
    height: '15%',
  },
  leaf: {
    position: 'absolute',
    width: 24,
    height: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(76, 100, 59, 0.38)',
  },
  leafOne: { left: 5, top: 28, transform: [{ rotate: '-32deg' }] },
  leafTwo: { left: 30, top: 8, transform: [{ rotate: '28deg' }] },
  leafThree: { left: 42, top: 38, transform: [{ rotate: '-12deg' }] },
  lampGlow: {
    position: 'absolute',
    left: '38%',
    top: '31%',
    width: '30%',
    height: '28%',
    borderRadius: 140,
    backgroundColor: 'rgba(255, 198, 105, 0.17)',
  },
});
