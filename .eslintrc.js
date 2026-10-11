module.exports = {
  root: true,
  extends: '@react-native',
  overrides: [
    {
      // Build-time scripts run under plain node, not the React Native
      // runtime, so they need node globals. no-bitwise is off because CRC32
      // and PNG encoding are bit manipulation by definition — rewriting them
      // to satisfy the rule would make them wrong.
      files: ['tools/**/*.js'],
      env: { node: true },
      rules: { 'no-bitwise': 'off' },
    },
    {
      // The .docx writer is a zip container, a CRC32 and a base64 encoder.
      // All three are defined in terms of bit manipulation, so the rule has
      // nothing useful to say about them and rewriting to satisfy it would
      // only make the code wrong. Scoped to these two files on purpose.
      files: ['src/services/docx.ts', 'src/__tests__/docx.test.ts'],
      rules: { 'no-bitwise': 'off' },
    },
  ],
};
