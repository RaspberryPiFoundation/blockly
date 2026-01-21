// This config attempts to match google-style code.

module.exports = {
  // Prefer single quotes, but minimize escaping.
  singleQuote: true,
  // Some properties must be quoted to preserve closure compiler behavior.
  // Don't ever change whether properties are quoted.
  quoteProps: 'preserve',
  // Don't add spaces around braces for object literals.
  bracketSpacing: false,
  // Put HTML tag closing brackets on same line as last attribute.
  bracketSameLine: true,
  // Organise imports using a plugin.
  'plugins': ['prettier-plugin-organize-imports'],
};
