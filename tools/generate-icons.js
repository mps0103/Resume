/**
 * Generates every launcher-icon and splash asset from one geometry
 * definition, so the PNG mipmaps and the vector drawables can never drift
 * apart. Re-run with `node tools/generate-icons.js` after changing anything
 * here; the output is committed, so this is not part of the build.
 *
 * No image library is used. PNGs are encoded by hand with zlib, which is in
 * Node's standard library — an icon script is not worth a native dependency
 * that has to compile on every machine that touches this project.
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = path.join(__dirname, '..');
const RES = path.join(ROOT, 'android/app/src/main/res');

// Brand tokens. Kept in step with src/ui/theme.ts by hand — theme.ts is
// TypeScript and this script has to run under plain node.
const NAVY = [0x1f, 0x3a, 0x5f];
const WHITE = [0xff, 0xff, 0xff];
const LINE = [0xb4, 0xc0, 0xce];
const EDGE = [0xd7, 0xde, 0xe6];
// theme.color.bg. The splash paints the colour the app itself opens on, so
// the handover from the launch window to the first React screen is invisible
// rather than a navy-to-light flash.
const APP_BG = [0xf4, 0xf5, 0xf7];

// ---------------------------------------------------------------- geometry

/**
 * The glyph is a CV sheet: an avatar, a name line, a subtitle, then body
 * lines. A plain document reads as "file"; the avatar is what makes it read
 * as "resume" at 48px.
 *
 * Coordinates live in a 108x108 viewport, matching the adaptive-icon canvas.
 * The sheet rectangle is a parameter so the same layout can be
 * re-proportioned for the legacy icon, which is not cropped to a safe zone.
 */
function glyphLayers(sheet) {
  const m = metrics(sheet);
  const layers = [];

  // Hairline edge under the sheet so the white still reads once the navy
  // background is masked away by a light-wallpaper launcher.
  layers.push({ shape: roundRect(m.x, m.y, m.x + m.w, m.y + m.h, m.r), color: EDGE });
  layers.push({
    shape: roundRect(m.x + m.hair, m.y + m.hair, m.x + m.w - m.hair, m.y + m.h - m.hair, m.r),
    color: WHITE,
  });

  layers.push({ shape: circle(m.avatarCx, m.avatarCy, m.avatarR), color: NAVY });

  // Name and headline, beside the avatar.
  layers.push({
    shape: roundRect(m.textLeft, m.nameTop, m.right, m.nameTop + m.barH, m.barR),
    color: NAVY,
  });
  layers.push({
    shape: roundRect(m.textLeft, m.subTop, m.right - m.inner * 0.16, m.subTop + m.barH, m.barR),
    color: LINE,
  });

  // Body lines. The last is short so the block reads as text, not as a table.
  for (let i = 0; i < 4; i++) {
    const ly = m.bodyTop + m.gap * i;
    const lw = i === 3 ? m.inner * 0.66 : m.inner;
    layers.push({ shape: roundRect(m.left, ly, m.left + lw, ly + m.barH, m.barR), color: LINE });
  }
  return layers;
}

/** Every derived dimension, in one place, so raster and vector agree. */
function metrics(sheet) {
  const { x, y, w, h } = sheet;
  const pad = w * 0.143;
  const left = x + pad;
  const right = x + w - pad;
  const barH = h * 0.052;
  const avatarR = w * 0.125;
  const avatarCx = left + avatarR;
  const avatarCy = y + h * 0.207;
  return {
    x, y, w, h, left, right,
    inner: right - left,
    r: Math.max(1, w * 0.12),
    hair: w * 0.014,
    barH,
    barR: barH / 2,
    avatarR, avatarCx, avatarCy,
    textLeft: avatarCx + avatarR + w * 0.083,
    nameTop: avatarCy - barH * 1.35,
    subTop: avatarCy + barH * 0.35,
    bodyTop: y + h * 0.414,
    gap: h * 0.112,
  };
}

function roundRect(x0, y0, x1, y1, r) {
  const rr = Math.min(r, (x1 - x0) / 2, (y1 - y0) / 2);
  return (px, py) => {
    if (px < x0 || px > x1 || py < y0 || py > y1) return false;
    const cx = Math.min(Math.max(px, x0 + rr), x1 - rr);
    const cy = Math.min(Math.max(py, y0 + rr), y1 - rr);
    const dx = px - cx;
    const dy = py - cy;
    return dx * dx + dy * dy <= rr * rr;
  };
}

function circle(cx, cy, r) {
  return (px, py) => {
    const dx = px - cx;
    const dy = py - cy;
    return dx * dx + dy * dy <= r * r;
  };
}

// ------------------------------------------------------------------ raster

/**
 * Renders layers to RGBA at `size`, supersampled 4x4 per pixel. Coverage
 * averaging is the whole reason this is acceptable at mdpi — a hard
 * inside/outside test at 48px gives visibly jagged circles.
 */
function render(size, layers) {
  const SS = 4;
  const buf = Buffer.alloc(size * size * 4);
  const scale = 108 / size;
  const n = SS * SS;

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const dx = (px + (sx + 0.5) / SS) * scale;
          const dy = (py + (sy + 0.5) / SS) * scale;
          let cr = 0, cg = 0, cb = 0, ca = 0;
          for (const layer of layers) {
            if (layer.shape(dx, dy)) {
              const [lr, lg, lb] = layer.color;
              cr = lr; cg = lg; cb = lb; ca = 1;
            }
          }
          r += cr; g += cg; b += cb; a += ca;
        }
      }
      const i = (py * size + px) * 4;
      const av = a / n;
      // Un-premultiply, or antialiased edges darken towards black.
      buf[i] = av > 0 ? Math.round(r / n / av) : 0;
      buf[i + 1] = av > 0 ? Math.round(g / n / av) : 0;
      buf[i + 2] = av > 0 ? Math.round(b / n / av) : 0;
      buf[i + 3] = Math.round(av * 255);
    }
  }
  return buf;
}

// -------------------------------------------------------------- png encoder

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function encodePng(size, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // truecolour + alpha
  const stride = size * 4 + 1;
  const raw = Buffer.alloc(size * stride);
  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0; // filter: none
    rgba.copy(raw, y * stride + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ------------------------------------------------------------------ vector

function fixed(n) {
  return n.toFixed(2);
}

function rrPath(x0, y0, x1, y1, r) {
  const rr = Math.min(r, (x1 - x0) / 2, (y1 - y0) / 2);
  const a = fixed(rr);
  return (
    `M${fixed(x0 + rr)},${fixed(y0)} H${fixed(x1 - rr)} A${a},${a} 0 0 1 ${fixed(x1)},${fixed(y0 + rr)} ` +
    `V${fixed(y1 - rr)} A${a},${a} 0 0 1 ${fixed(x1 - rr)},${fixed(y1)} H${fixed(x0 + rr)} ` +
    `A${a},${a} 0 0 1 ${fixed(x0)},${fixed(y1 - rr)} V${fixed(y0 + rr)} A${a},${a} 0 0 1 ${fixed(x0 + rr)},${fixed(y0)} Z`
  );
}

function circlePath(cx, cy, r) {
  const a = fixed(r);
  return (
    `M${fixed(cx - r)},${fixed(cy)} A${a},${a} 0 1 0 ${fixed(cx + r)},${fixed(cy)} ` +
    `A${a},${a} 0 1 0 ${fixed(cx - r)},${fixed(cy)} Z`
  );
}

function hex(c) {
  return '#' + c.map(v => v.toString(16).padStart(2, '0').toUpperCase()).join('');
}

/** The vector twin of glyphLayers, driven by the same metrics(). */
function glyphPaths(sheet, mono) {
  const m = metrics(sheet);
  const sheetFill = mono ? '#00000000' : '#FFFFFF';
  const navyFill = mono ? '#FFFFFF' : hex(NAVY);
  const lineFill = mono ? '#FFFFFF' : hex(LINE);
  const out = [];

  if (mono) {
    // A themed icon is one flat colour, so a filled sheet would swallow the
    // contents. Outline it and let the inner marks carry the meaning.
    out.push({
      d: rrPath(m.x, m.y, m.x + m.w, m.y + m.h, m.r),
      fill: sheetFill,
      stroke: '#FFFFFF',
      width: m.w * 0.055,
    });
  } else {
    out.push({ d: rrPath(m.x, m.y, m.x + m.w, m.y + m.h, m.r), fill: sheetFill });
  }

  out.push({ d: circlePath(m.avatarCx, m.avatarCy, m.avatarR), fill: navyFill });
  out.push({ d: rrPath(m.textLeft, m.nameTop, m.right, m.nameTop + m.barH, m.barR), fill: navyFill });
  out.push({
    d: rrPath(m.textLeft, m.subTop, m.right - m.inner * 0.16, m.subTop + m.barH, m.barR),
    fill: lineFill,
  });
  for (let i = 0; i < 4; i++) {
    const ly = m.bodyTop + m.gap * i;
    const lw = i === 3 ? m.inner * 0.66 : m.inner;
    out.push({ d: rrPath(m.left, ly, m.left + lw, ly + m.barH, m.barR), fill: lineFill });
  }
  return out;
}

function vectorXml(paths, note) {
  const body = paths
    .map(p => {
      const attrs = [`android:pathData="${p.d}"`, `android:fillColor="${p.fill}"`];
      if (p.stroke) {
        attrs.push(`android:strokeColor="${p.stroke}"`);
        attrs.push(`android:strokeWidth="${fixed(p.width)}"`);
      }
      return '    <path\n        ' + attrs.join('\n        ') + ' />';
    })
    .join('\n');

  return `<?xml version="1.0" encoding="utf-8"?>
<!--
  ${note}
  Generated by tools/generate-icons.js — do not hand-edit.
-->
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
${body}
</vector>
`;
}

// ------------------------------------------------------------------ output

// Legacy icons show the whole canvas. Adaptive icons are cropped to a
// 66-unit safe zone, so their glyph has to be smaller: the sheet corners
// must stay inside a radius-36 circle from the centre.
const LEGACY_SHEET = { x: 27, y: 17, w: 54, h: 74 };
const ADAPTIVE_SHEET = { x: 33, y: 25, w: 42, h: 58 };

/**
 * The splash mark is a navy disc with the sheet on it, drawn into the
 * drawable rather than assembled by the platform.
 *
 * windowSplashScreenIconBackgroundColor would draw that disc for us, but only
 * on Android 12 and up: the androidx compat path used on everything older
 * draws the icon alone, which would leave a white sheet on a near-white
 * background and no visible logo at all on most of the install base.
 * Building the disc into the drawable makes every version identical.
 *
 * SPLASH_DISC_R is exactly the radius Android 12 masks the icon to — the
 * inner two thirds of the drawable — so the disc meets the mask edge to edge
 * instead of being clipped or floating inside it.
 */
const SPLASH_DISC_R = 36;
/**
 * Smaller than the adaptive sheet: that one is sized to touch the safe-zone
 * boundary, and a sheet whose corners graze the edge of a visible disc reads
 * as cramped rather than as a mark. Corners land at radius 27.2 of 36.
 */
const SPLASH_SHEET = { x: 38, y: 32, w: 32, h: 44 };

const DENSITIES = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
};

/** Keeps the glyph inside the icon silhouette on the round variant. */
function clipTo(layers, mask) {
  return layers.map(l => ({ ...l, shape: (x, y) => mask(x, y) && l.shape(x, y) }));
}

function legacyLayers(mask) {
  return [{ shape: mask, color: NAVY }, ...clipTo(glyphLayers(LEGACY_SHEET), mask)];
}

function write(file, buf) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, buf);
  console.log('  ' + path.relative(ROOT, file).replace(/\\/g, '/'));
}

function main() {
  console.log('launcher PNGs');
  const squareMask = roundRect(4, 4, 104, 104, 23);
  const circleMask = circle(54, 54, 52);
  for (const [dir, size] of Object.entries(DENSITIES)) {
    write(path.join(RES, dir, 'ic_launcher.png'), encodePng(size, render(size, legacyLayers(squareMask))));
    write(
      path.join(RES, dir, 'ic_launcher_round.png'),
      encodePng(size, render(size, legacyLayers(circleMask))),
    );
  }

  console.log('play store icon');
  write(
    path.join(ROOT, 'store/icon-512.png'),
    encodePng(512, render(512, legacyLayers(roundRect(0, 0, 108, 108, 0)))),
  );

  // The same mark as a bitmap, for the in-app splash that follows the
  // system one. Rendered from the identical geometry rather than drawn again
  // in React Native, so the two cannot drift apart and the hand-over from
  // the system splash is invisible. Transparent outside the disc.
  console.log('in-app splash mark');
  write(
    path.join(ROOT, 'src/assets/splash-mark.png'),
    encodePng(
      384,
      render(384, [
        { shape: circle(54, 54, SPLASH_DISC_R), color: NAVY },
        ...glyphLayers(SPLASH_SHEET),
      ]),
    ),
  );

  console.log('vector drawables');
  write(
    path.join(RES, 'drawable/ic_launcher_foreground.xml'),
    Buffer.from(vectorXml(glyphPaths(ADAPTIVE_SHEET, false), 'Adaptive icon foreground, sized to the safe zone.')),
  );
  write(
    path.join(RES, 'drawable/ic_launcher_monochrome.xml'),
    Buffer.from(vectorXml(glyphPaths(ADAPTIVE_SHEET, true), 'Themed-icon silhouette, Android 13+.')),
  );
  write(
    path.join(RES, 'drawable/ic_splash_logo.xml'),
    Buffer.from(
      vectorXml(
        [
          { d: circlePath(54, 54, SPLASH_DISC_R), fill: hex(NAVY) },
          ...glyphPaths(SPLASH_SHEET, false),
        ],
        'Splash screen mark: the launcher icon as a disc, on the app background.',
      ),
    ),
  );

  console.log('adaptive icon + colours');
  const adaptive = `<?xml version="1.0" encoding="utf-8"?>
<!-- Generated by tools/generate-icons.js — do not hand-edit. -->
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background" />
    <foreground android:drawable="@drawable/ic_launcher_foreground" />
    <monochrome android:drawable="@drawable/ic_launcher_monochrome" />
</adaptive-icon>
`;
  write(path.join(RES, 'mipmap-anydpi-v26/ic_launcher.xml'), Buffer.from(adaptive));
  write(path.join(RES, 'mipmap-anydpi-v26/ic_launcher_round.xml'), Buffer.from(adaptive));

  write(
    path.join(RES, 'values/ic_launcher_colors.xml'),
    Buffer.from(`<?xml version="1.0" encoding="utf-8"?>
<!-- Generated by tools/generate-icons.js — do not hand-edit. -->
<resources>
    <color name="ic_launcher_background">${hex(NAVY)}</color>
    <color name="splash_background">${hex(APP_BG)}</color>
</resources>
`),
  );

  console.log('done');
}

main();
