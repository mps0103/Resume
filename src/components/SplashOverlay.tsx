import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text } from 'react-native';
import { APP_NAME } from '../config/legal';
import { theme } from '../ui/theme';

/**
 * The app's splash screen.
 *
 * Android always draws a system splash first and there is no way to refuse
 * it, but it takes an icon and a background colour and nothing else — no
 * text, so no name and no tagline. The approach here is therefore to make
 * that window as dumb as possible (a still mark on the app's background, no
 * animation, released the moment React Native has painted) and to do the
 * whole branded splash here, where text and real motion are possible.
 *
 * THE SEAM IS THE WHOLE DESIGN. Everything below follows from the fact that
 * this component replaces a window that is already on screen:
 *
 *  - It opens in exactly the state the system splash ends in: identical
 *    background colour, the identical mark, at the identical size, in the
 *    identical position, perfectly still.
 *  - HOLD_MS passes before anything moves, so the cross-fade between the two
 *    windows lands while both are showing the same still image. An earlier
 *    version animated immediately and the two marks visibly diverged
 *    mid-fade, which is what the ghosting and jumping were.
 *  - The mark is the same PNG the system drawable is generated from, at the
 *    160dp the platform draws it at: Android renders the splash icon at two
 *    thirds of a 240dp canvas, and the disc is exactly two thirds of our
 *    108-unit drawable. Rebuilding it out of Views would drift.
 *
 * It takes no props. By the time it mounts the app has already decided it is
 * ready — App renders nothing until then — so it owns its own exit.
 */
const MARK = require('../assets/splash-mark.png');

/** The size the platform draws the system splash icon at. */
const MARK_SIZE = 160;
/** How far the mark travels up to make room for the wordmark. */
const MARK_LIFT = 26;

/** Still, while the system splash fades out over the top of us. */
const HOLD_MS = 160;
/**
 * How long the finished composition sits there before it leaves.
 *
 * Generous on purpose. The entry is only about a second, and leaving
 * immediately afterwards meant the name and tagline were gone before they
 * could be read — the splash registered as a flicker rather than as
 * branding. This is the part that is actually worth the user's time, so it
 * gets most of it.
 */
const SETTLE_MS = 900;
const EXIT_MS = 320;

export function SplashOverlay() {
  const [gone, setGone] = useState(false);

  // One driver per element so they can overlap rather than queue. A strict
  // sequence reads as four separate reveals; overlapping reads as one move.
  const lift = useRef(new Animated.Value(0)).current;
  const name = useRef(new Animated.Value(0)).current;
  const rule = useRef(new Animated.Value(0)).current;
  const tag = useRef(new Animated.Value(0)).current;
  const exit = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const ease = Easing.out(Easing.cubic);
    const step = (
      value: Animated.Value,
      delay: number,
      duration: number,
    ) =>
      Animated.timing(value, {
        toValue: 1,
        delay: HOLD_MS + delay,
        duration,
        easing: ease,
        useNativeDriver: true,
      });

    const run = Animated.sequence([
      Animated.parallel([
        step(lift, 0, 520),
        step(name, 160, 420),
        step(rule, 420, 280),
        step(tag, 540, 360),
      ]),
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
    const failsafe = setTimeout(() => setGone(true), 4000);

    return () => {
      run.stop();
      clearTimeout(failsafe);
    };
  }, [lift, name, rule, tag, exit]);

  if (gone) return null;

  const rise = (value: Animated.Value, from: number) => ({
    opacity: value,
    transform: [
      {
        translateY: value.interpolate({
          inputRange: [0, 1],
          outputRange: [from, 0],
        }),
      },
    ],
  });

  return (
    <Animated.View style={[styles.root, { opacity: exit }]}>
      <Animated.Image
        source={MARK}
        resizeMode="contain"
        style={[
          styles.mark,
          {
            transform: [
              {
                translateY: lift.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -MARK_LIFT],
                }),
              },
            ],
          },
        ]}
      />

      <Animated.View style={[styles.nameWrap, rise(name, 18)]}>
        <Text style={styles.name}>{APP_NAME}</Text>
      </Animated.View>

      {/* Wipes outward from its centre: scaleX about the default origin. */}
      <Animated.View
        style={[styles.rule, { opacity: rule, transform: [{ scaleX: rule }] }]}
      />

      <Animated.View style={[styles.tagWrap, rise(tag, 14)]}>
        <Text style={styles.tagline}>YOUR CAREER, ON ONE PAGE</Text>
      </Animated.View>
    </Animated.View>
  );
}

/**
 * The caption is hung off the screen's centre line rather than laid out in a
 * column under the mark. If it were in the flow, adding or changing a line
 * of text would shift the mark — and the mark is the one thing that has to
 * stay exactly where the system splash left it.
 */
const BELOW_MARK = MARK_SIZE / 2 - MARK_LIFT;

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // Must equal windowSplashScreenBackground, or the hand-over flashes.
    backgroundColor: theme.color.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mark: { width: MARK_SIZE, height: MARK_SIZE },

  nameWrap: { position: 'absolute', top: '50%', marginTop: BELOW_MARK + 26 },
  /**
   * Serif, not the system sans.
   *
   * Roboto Bold is the default on every Android app in existence, so it
   * reads as "no typeface was chosen" rather than as a wordmark. A serif
   * also happens to be the right argument for this product: the thing being
   * made is a formal document, and every resume template in the app is set
   * in one.
   *
   * 'serif' resolves to Noto Serif on Android, so this costs nothing in
   * download size. Shipping an actual licensed display face would be more
   * distinctive still — see the note in RELEASE.md.
   */
  name: {
    fontFamily: 'serif',
    fontSize: 32,
    fontWeight: '600',
    letterSpacing: 0.3,
    color: theme.color.accent,
  },

  rule: {
    position: 'absolute',
    top: '50%',
    marginTop: BELOW_MARK + 82,
    width: 48,
    height: 3,
    borderRadius: 2,
    backgroundColor: theme.color.accent,
    opacity: 0.3,
  },

  tagWrap: { position: 'absolute', top: '50%', marginTop: BELOW_MARK + 104 },
  /**
   * Small, wide-tracked and upper case, against the large serif above it.
   * The contrast in size and letterfit is what makes the pair read as
   * designed; two lines at similar weights would just look like text.
   */
  tagline: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 2.6,
    color: theme.color.textMuted,
  },
});
