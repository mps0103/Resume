import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';

/**
 * The app's splash screen: one piece of full-bleed artwork.
 *
 * Android always draws a system splash first and there is no refusing it,
 * but it only accepts an icon on a flat colour — it cannot show this. So
 * that window is kept as dumb as possible (the app mark on SPLASH_BG, no
 * animation, released the moment React Native paints) and the real splash
 * is here, where a full-screen image is possible.
 *
 * THE HAND-OVER. SPLASH_BG in tools/generate-icons.js is sampled from the
 * top edge of this artwork, so the system window is already the right
 * colour when this fades in over it. Only the centre changes; the
 * surrounding blue never moves.
 *
 * WHY resizeMode="cover". The artwork is 941x1672, an aspect of 0.563, and
 * phones run from about 0.50 down to 0.45. Fitting it whole would leave
 * bands of flat colour above and below, and the artwork's own edges are not
 * flat — they are blue waves — so those bands would show a seam. Cover
 * fills the screen and trims the sides instead, which on a tall device
 * costs the plant, the books and a sparkle, but keeps the figure, the
 * resume card and the wordmark, all of which sit well inside the centre.
 *
 * No text is drawn here: the name and tagline are part of the artwork.
 *
 * It takes no props. By the time it mounts the app has already decided it
 * is ready, so the overlay owns its own exit.
 */
const ART = require('../assets/splash-art.png');

/** Still, while the system splash fades out over the top of us. */
const HOLD_MS = 120;
const IN_MS = 520;
/** Long enough to look at the illustration and read the line. */
const SETTLE_MS = 1000;
const EXIT_MS = 320;

export function SplashOverlay() {
  const [gone, setGone] = useState(false);
  const enter = useRef(new Animated.Value(0)).current;
  const exit = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const run = Animated.sequence([
      Animated.delay(HOLD_MS),
      Animated.timing(enter, {
        toValue: 1,
        duration: IN_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.delay(SETTLE_MS),
      Animated.timing(exit, {
        toValue: 0,
        duration: EXIT_MS,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]);

    run.start(({ finished }) => {
      if (finished) setGone(true);
    });

    // If the animation is ever cancelled — backgrounding the app does that —
    // the overlay must still come down rather than sit on top of a working
    // app forever.
    const failsafe = setTimeout(() => setGone(true), 5000);

    return () => {
      run.stop();
      clearTimeout(failsafe);
    };
  }, [enter, exit]);

  if (gone) return null;

  return (
    <Animated.View style={[styles.root, { opacity: exit }]}>
      <Animated.Image
        source={ART}
        resizeMode="cover"
        style={[
          styles.art,
          {
            opacity: enter,
            // Settling from very slightly oversized reads as the image
            // arriving rather than being switched on. Easing down to 1
            // rather than up to it means no uncovered edge is ever exposed.
            transform: [
              {
                scale: enter.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1.05, 1],
                }),
              },
            ],
          },
        ]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // Matches the artwork's top edge and windowSplashScreenBackground, so
    // the scale-in never reveals a differently coloured gap behind it.
    backgroundColor: '#ADD2FD',
  },
  art: { width: '100%', height: '100%' },
});
