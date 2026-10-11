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

/*
 * The lockup: mark, wordmark, rule, tagline, measured as one object.
 *
 * Two rules from brand practice drive every number below.
 *
 * 1. Clear space is derived from the type, not picked by eye. The unit is
 *    the wordmark's cap height, which is how a lockup keeps its proportions
 *    when the type size changes. Flutter's brand guide states the same rule
 *    as "a margin of at least the height of one F".
 *
 * 2. The LOCKUP is centred, not the mark. Centring the mark and letting the
 *    text hang below it puts the composition's whole mass under the middle
 *    of the screen, which is the "off balance" Flutter warns about — and it
 *    is what made the spacing look wrong here. The mark still STARTS at
 *    screen centre, because that is where the system splash leaves it, and
 *    then rises by exactly the amount that centres the finished lockup.
 */
const NAME_SIZE = 32;
const NAME_LEADING = 40;
const TAG_LEADING = 16;
const RULE_HEIGHT = 2;
/** Cap height of the serif wordmark, near enough for spacing purposes. */
const CAP = Math.round(NAME_SIZE * 0.7);

const GAP_MARK_NAME = Math.round(CAP * 1.3);
const GAP_NAME_RULE = CAP;
const GAP_RULE_TAG = CAP;

const LOCKUP_HEIGHT =
  MARK_SIZE +
  GAP_MARK_NAME +
  NAME_LEADING +
  GAP_NAME_RULE +
  RULE_HEIGHT +
  GAP_RULE_TAG +
  TAG_LEADING;

/**
 * Sits the finished lockup a touch above true centre. A composition centred
 * geometrically reads as slightly low, which is the oldest correction in
 * layout and the reason this is not simply LOCKUP_HEIGHT / 2.
 */
const OPTICAL_RISE = 8;

/** Exactly the travel that lands the centred lockup. */
const MARK_LIFT = Math.round(LOCKUP_HEIGHT / 2 - MARK_SIZE / 2 + OPTICAL_RISE);

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

  nameWrap: {
    position: 'absolute',
    top: '50%',
    marginTop: BELOW_MARK + GAP_MARK_NAME,
  },
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
    fontSize: NAME_SIZE,
    lineHeight: NAME_LEADING,
    fontWeight: '600',
    // Display sizes need less tracking than body text, not more: the
    // default fit already looks loose above about 28pt.
    letterSpacing: 0.2,
    color: theme.color.accent,
  },

  rule: {
    position: 'absolute',
    top: '50%',
    marginTop: BELOW_MARK + GAP_MARK_NAME + NAME_LEADING + GAP_NAME_RULE,
    // Narrower, thinner and fainter than before. A rule is punctuation
    // between the two lines; at 48x3 it was competing with them.
    width: 40,
    height: RULE_HEIGHT,
    borderRadius: RULE_HEIGHT / 2,
    backgroundColor: theme.color.accent,
    opacity: 0.25,
  },

  tagWrap: {
    position: 'absolute',
    top: '50%',
    marginTop:
      BELOW_MARK +
      GAP_MARK_NAME +
      NAME_LEADING +
      GAP_NAME_RULE +
      RULE_HEIGHT +
      GAP_RULE_TAG,
  },
  /**
   * Small, wide-tracked and upper case, against the large serif above it.
   * The contrast in size and letterfit is what makes the pair read as
   * designed; two lines at similar weights would just look like text.
   */
  tagline: {
    fontSize: 11,
    lineHeight: TAG_LEADING,
    fontWeight: '500',
    letterSpacing: 2.8,
    color: theme.color.textMuted,
  },
});
