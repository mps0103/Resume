import React, { useCallback, useRef } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  PressableProps,
  StyleProp,
  ViewStyle,
} from 'react-native';

/**
 * One node, not two.
 *
 * The first version wrapped an Animated.View inside a Pressable and put the
 * caller's style on the inner view. That quietly broke layout: the Pressable
 * is what the parent lays out, so `width: '31%'` or `flex: 1` landed on a
 * child of the box being sized and the Pressable collapsed to its content.
 * The theme swatches came out as narrow pills with their names wrapped
 * mid-word. Animating the Pressable itself means the styled node and the
 * laid-out node are the same one.
 */
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Props extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  /**
   * How far it dips. The default suits a card; a small icon button wants
   * more, because a 2% scale on a 30pt target is invisible.
   */
  scaleTo?: number;
  /** Set false to keep the layout but drop the animation. */
  animate?: boolean;
  children?: React.ReactNode;
}

/**
 * A Pressable that springs under the finger.
 *
 * Nothing in the app moved when touched before this, which is most of why
 * it felt static: a plain Pressable gives no feedback at all on Android, so
 * every tap had to be confirmed by the screen changing. Scale is used rather
 * than an opacity fade because it survives on any background colour, and it
 * reads at a glance on a list of white cards where a fade does not.
 *
 * `useNativeDriver` matters here. These fire on touch, so the animation has
 * to run on the UI thread or it stutters exactly when a slow JS frame is
 * most likely — while a screen is being built in response to the tap.
 */
export function Touchable({
  style,
  scaleTo = 0.975,
  animate = true,
  children,
  onPressIn,
  onPressOut,
  disabled,
  ...rest
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  const to = useCallback(
    (value: number, duration: number) => {
      Animated.timing(scale, {
        toValue: value,
        duration,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    },
    [scale],
  );

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      onPressIn={e => {
        // Down is quicker than up: the dip should feel like it tracks the
        // finger, while the release can afford to settle.
        if (animate && !disabled) to(scaleTo, 90);
        onPressIn?.(e);
      }}
      onPressOut={e => {
        if (animate && !disabled) to(1, 160);
        onPressOut?.(e);
      }}
      style={[style, { transform: [{ scale }] }]}
    >
      {children}
    </AnimatedPressable>
  );
}
