import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

/**
 * A stroke icon set drawn from Views.
 *
 * The app shipped with text glyphs for its controls — ↑ ↓ ◉ ○ ✕ ⋯ — and
 * those are the loudest signal that an app is unfinished: they inherit the
 * system font, so their weight, size and vertical alignment differ on every
 * device and none of them match each other.
 *
 * These are geometry instead, which is why there is no new dependency here.
 * An icon font or react-native-svg would both mean a native rebuild and a
 * library to keep current, and every icon this app needs is a rectangle, a
 * circle or a rotated corner. Each one is drawn inside a `size`-square box
 * from a 24-unit grid, so swapping `size` scales the whole glyph and the
 * stroke weight with it.
 */

export type IconName =
  | 'chevronRight'
  | 'chevronLeft'
  | 'chevronDown'
  | 'arrowUp'
  | 'arrowDown'
  | 'plus'
  | 'close'
  | 'check'
  | 'dots'
  | 'eye'
  | 'eyeOff'
  | 'trash'
  | 'upload'
  | 'doc'
  | 'sparkle'
  | 'crown'
  | 'lock'
  | 'sliders'
  | 'copy'
  | 'pencil'
  | 'share';

interface Props {
  name: IconName;
  /** Width and height of the box the glyph is drawn in. */
  size?: number;
  color?: string;
  /** Stroke weight. Scales with `size` unless given. */
  weight?: number;
  style?: ViewStyle;
}

export function Icon({
  name,
  size = 20,
  color = '#0E1726',
  weight,
  style,
}: Props) {
  // A 24-unit design grid, so every icon below can be written in the same
  // units regardless of the size it is rendered at.
  const u = (n: number) => (n / 24) * size;
  const w = weight ?? Math.max(1.5, size / 12);
  const box: ViewStyle = { width: size, height: size };

  /** A single stroke. Positioned from the grid, rounded at the ends. */
  const bar = (s: ViewStyle): ViewStyle => ({
    position: 'absolute',
    backgroundColor: color,
    borderRadius: w,
    ...s,
  });

  /**
   * An open corner — two adjacent borders on a square, rotated.
   *
   * This is how every chevron and the tick are drawn: cheaper and sharper
   * than two separately positioned bars, because the corner stays joined
   * at any size.
   */
  const corner = (deg: number, side: number, extra?: ViewStyle): ViewStyle => ({
    position: 'absolute',
    width: side,
    height: side,
    borderColor: color,
    borderTopWidth: w,
    borderRightWidth: w,
    transform: [{ rotate: `${deg}deg` }],
    ...extra,
  });

  const ring = (s: ViewStyle): ViewStyle => ({
    position: 'absolute',
    borderColor: color,
    borderWidth: w,
    ...s,
  });

  switch (name) {
    case 'chevronRight':
    case 'chevronLeft':
    case 'chevronDown': {
      const deg =
        name === 'chevronRight' ? 45 : name === 'chevronLeft' ? -135 : 135;
      const side = u(9);
      return (
        <View style={[box, styles.center, style]}>
          <View style={corner(deg, side)} />
        </View>
      );
    }

    case 'arrowUp':
    case 'arrowDown': {
      const up = name === 'arrowUp';
      const head = u(7.5);
      return (
        <View style={[box, style]}>
          <View
            style={bar({
              left: (size - w) / 2,
              top: u(3.5),
              width: w,
              height: u(17),
            })}
          />
          <View
            style={corner(up ? -45 : 135, head, {
              left: (size - head) / 2 - w / 2,
              top: up ? u(4) : undefined,
              bottom: up ? undefined : u(4),
            })}
          />
        </View>
      );
    }

    case 'plus':
      return (
        <View style={[box, style]}>
          <View
            style={bar({
              left: u(3.5),
              top: (size - w) / 2,
              width: u(17),
              height: w,
            })}
          />
          <View
            style={bar({
              top: u(3.5),
              left: (size - w) / 2,
              height: u(17),
              width: w,
            })}
          />
        </View>
      );

    case 'close': {
      const len = u(17);
      return (
        <View style={[box, styles.center, style]}>
          <View
            style={bar({
              width: len,
              height: w,
              transform: [{ rotate: '45deg' }],
            })}
          />
          <View
            style={bar({
              width: len,
              height: w,
              transform: [{ rotate: '-45deg' }],
            })}
          />
        </View>
      );
    }

    case 'check': {
      // The tick is a corner rotated past square, with the short arm
      // shortened by an overlaid cut — simplest shape that stays joined.
      return (
        <View style={[box, styles.center, style]}>
          <View
            style={{
              width: u(8),
              height: u(14),
              borderColor: color,
              borderBottomWidth: w,
              borderRightWidth: w,
              transform: [{ rotate: '45deg' }, { translateY: -u(1.5) }],
            }}
          />
        </View>
      );
    }

    case 'dots': {
      const d = Math.max(2.5, u(3.5));
      const dot = (top: number): ViewStyle => ({
        position: 'absolute',
        top,
        left: (size - d) / 2,
        width: d,
        height: d,
        borderRadius: d / 2,
        backgroundColor: color,
      });
      return (
        <View style={[box, style]}>
          <View style={dot(u(3.5) - d / 2)} />
          <View style={dot(size / 2 - d / 2)} />
          <View style={dot(size - u(3.5) - d / 2)} />
        </View>
      );
    }

    case 'eye':
    case 'eyeOff': {
      const lensW = u(20);
      const lensH = u(12);
      const pupil = u(6);
      return (
        <View style={[box, styles.center, style]}>
          {/*
            An eye is a lens: a wide box with a radius just under half its
            width, which gives the pointed corners a circle cannot.
          */}
          <View
            style={ring({
              width: lensW,
              height: lensH,
              borderRadius: lensH / 1.6,
            })}
          />
          <View
            style={{
              position: 'absolute',
              width: pupil,
              height: pupil,
              borderRadius: pupil / 2,
              backgroundColor: color,
            }}
          />
          {name === 'eyeOff' && (
            <View
              style={bar({
                width: u(22),
                height: w,
                transform: [{ rotate: '-40deg' }],
              })}
            />
          )}
        </View>
      );
    }

    case 'trash':
      return (
        <View style={[box, style]}>
          {/* Lid, with the handle above it. */}
          <View
            style={bar({ left: u(3), top: u(6), width: u(18), height: w })}
          />
          <View
            style={bar({ left: u(9), top: u(3), width: u(6), height: w })}
          />
          {/* Body, tapering is not worth the extra views at this size. */}
          <View
            style={ring({
              left: u(5.5),
              top: u(7.5),
              width: u(13),
              height: u(13.5),
              borderTopWidth: 0,
              borderBottomLeftRadius: u(2.5),
              borderBottomRightRadius: u(2.5),
            })}
          />
        </View>
      );

    case 'upload':
      return (
        <View style={[box, style]}>
          {/* Arrow out of the tray. */}
          <View
            style={bar({
              left: (size - w) / 2,
              top: u(2.5),
              width: w,
              height: u(11),
            })}
          />
          <View
            style={corner(-45, u(7), {
              left: (size - u(7)) / 2 - w / 2,
              top: u(3),
            })}
          />
          {/* Tray: an open-topped box. */}
          <View
            style={ring({
              left: u(3.5),
              bottom: u(3),
              width: u(17),
              height: u(8),
              borderTopWidth: 0,
              borderBottomLeftRadius: u(2),
              borderBottomRightRadius: u(2),
            })}
          />
        </View>
      );

    case 'doc':
      return (
        <View style={[box, style]}>
          <View
            style={ring({
              left: u(4),
              top: u(2.5),
              width: u(16),
              height: u(19),
              borderRadius: u(2.5),
            })}
          />
          {[8, 12, 16].map(y => (
            <View
              key={y}
              style={bar({
                left: u(7.5),
                top: u(y),
                width: u(y === 16 ? 5.5 : 9),
                height: Math.max(1, w * 0.8),
              })}
            />
          ))}
        </View>
      );

    case 'sparkle': {
      /*
        Two diamonds, one large and one small.

        Three constructions were tried before this. Crossed bars are a plus
        sign. Two squares overlapped at 45° is an eight-point star in
        geometry but needs its corners rounded to read as points, and any
        radius large enough to do that at 19px rounds the points off
        entirely — it came out as a gold blob. A diamond is a single square
        turned 45° with a small radius, which stays crisp at every size the
        app draws it, and a large one beside a small one reads as a sparkle.
      */
      const diamond = (cx: number, cy: number, r: number) => (
        <View
          key={`${cx}-${cy}`}
          style={{
            position: 'absolute',
            left: cx - r,
            top: cy - r,
            width: r * 2,
            height: r * 2,
            backgroundColor: color,
            borderRadius: Math.max(1, r * 0.22),
            transform: [{ rotate: '45deg' }],
          }}
        />
      );
      return (
        <View style={[box, style]}>
          {diamond(u(9), u(9.5), u(6.6))}
          {diamond(u(17.5), u(17.5), u(3.6))}
        </View>
      );
    }

    case 'crown': {
      /*
        A solid band with three points above it.

        The stroked version — three uprights over two rails — put five lines
        inside the 13px Pro pill and collapsed into a smudge. Filled shapes
        hold at that size where strokes do not, so the peaks are solid
        triangles standing on a solid base.
      */
      const peak = (cx: number, h: number) => {
        const half = u(3.4);
        return (
          <View
            key={cx}
            style={{
              position: 'absolute',
              left: cx - half,
              bottom: u(8.5),
              width: 0,
              height: 0,
              borderLeftWidth: half,
              borderRightWidth: half,
              borderBottomWidth: h,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderBottomColor: color,
            }}
          />
        );
      };
      return (
        <View style={[box, style]}>
          {peak(u(6), u(8))}
          {peak(u(12), u(12))}
          {peak(u(18), u(8))}
          <View
            style={{
              position: 'absolute',
              left: u(3),
              bottom: u(4),
              width: u(18),
              height: u(5),
              borderRadius: u(1.2),
              backgroundColor: color,
            }}
          />
        </View>
      );
    }

    case 'lock':
      return (
        <View style={[box, style]}>
          {/* Shackle: a ring with its bottom half cropped by the body. */}
          <View
            style={ring({
              left: u(7),
              top: u(2.5),
              width: u(10),
              height: u(10),
              borderRadius: u(5),
              borderBottomWidth: 0,
            })}
          />
          <View
            style={{
              position: 'absolute',
              left: u(3.5),
              bottom: u(2.5),
              width: u(17),
              height: u(11),
              borderRadius: u(2.5),
              backgroundColor: color,
            }}
          />
        </View>
      );

    case 'sliders': {
      /*
        Settings is three sliders, not a cogwheel.

        A cog needs its teeth masked by an opaque hub to read as a cog, and
        the hub here sits on a translucent circle over a gradient — there is
        no flat colour to mask with, so it came out as a flower. Sliders
        need no masking and stay legible at 19px, which a cog does not.
      */
      const knobR = u(3.2);
      const rows: [number, number][] = [
        [6, 16],
        [12, 8],
        [18, 13],
      ];
      return (
        <View style={[box, style]}>
          {rows.map(([y, kx]) => (
            <React.Fragment key={y}>
              <View
                style={bar({
                  left: u(3),
                  top: u(y) - w / 2,
                  width: u(18),
                  height: w,
                })}
              />
              <View
                style={{
                  position: 'absolute',
                  left: u(kx) - knobR,
                  top: u(y) - knobR,
                  width: knobR * 2,
                  height: knobR * 2,
                  borderRadius: knobR,
                  borderWidth: w,
                  borderColor: color,
                  backgroundColor: color,
                }}
              />
            </React.Fragment>
          ))}
        </View>
      );
    }

    case 'copy':
      return (
        <View style={[box, style]}>
          <View
            style={ring({
              left: u(3),
              top: u(3),
              width: u(13),
              height: u(13),
              borderRadius: u(2.5),
            })}
          />
          <View
            style={ring({
              right: u(3),
              bottom: u(3),
              width: u(13),
              height: u(13),
              borderRadius: u(2.5),
            })}
          />
        </View>
      );

    case 'pencil':
      return (
        <View style={[box, styles.center, style]}>
          <View
            style={{
              width: u(5),
              height: u(18),
              borderWidth: w,
              borderColor: color,
              borderRadius: u(1),
              transform: [{ rotate: '45deg' }],
            }}
          />
        </View>
      );

    case 'share':
      return (
        <View style={[box, style]}>
          {/* Arrow up out of an open box — the Android share affordance. */}
          <View
            style={bar({
              left: (size - w) / 2,
              top: u(2.5),
              width: w,
              height: u(11),
            })}
          />
          <View
            style={corner(-45, u(6.5), {
              left: (size - u(6.5)) / 2 - w / 2,
              top: u(3),
            })}
          />
          <View
            style={ring({
              left: u(4),
              bottom: u(2.5),
              width: u(16),
              height: u(10),
              borderTopWidth: 0,
              borderBottomLeftRadius: u(2),
              borderBottomRightRadius: u(2),
            })}
          />
        </View>
      );
  }
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
});
