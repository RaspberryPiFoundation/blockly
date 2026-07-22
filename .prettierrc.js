// This config attempts to match google-style code.

module.exports = {
  // Prefer single quotes, but minimize escaping.
  singleQuote: true,
  // Put HTML tag closing brackets on same line as last attribute.
  bracketSameLine: true,
  // Organise imports using a plugin.
  overrides: [
    {
      files: 'packages/docs/**/*',
      options: {
        // Keep the existing wrapping in markdown text as-is.
        proseWrap: 'preserve'
      }
    },
    {
      files: 'packages/blockly/**/*',
      options: {
        // Some properties must be quoted to preserve closure compiler behavior.
        // Don't ever change whether properties are quoted.
        quoteProps: 'preserve',
        // Don't add spaces around braces for object literals.
        bracketSpacing: false,
        'plugins': ['prettier-plugin-organize-imports'],
      },
    },
    {
      files: 'packages/plugins/**/*',
      options: {
        // Some properties must be quoted to preserve closure compiler behavior.
        // If at least one property in an object requires quotes, quote all 
        // properties.
        quoteProps: 'consistent',
        // Don't add spaces around braces for object literals.
        bracketSpacing: false,
      },
    },
  ],
};
