import eslint from '@eslint/js';
import googleStyle from 'eslint-config-google';
import jsdoc from 'eslint-plugin-jsdoc';
import * as mdx from 'eslint-plugin-mdx';
import mochaPlugin from 'eslint-plugin-mocha';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import {defineConfig} from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';

// These rules are no longer supported, but the Google style package we depend
// on hasn't been updated in years to remove them, even though they have been
// removed from the repo. Manually delete them here to avoid breaking linting.
delete googleStyle.rules['valid-jsdoc'];
delete googleStyle.rules['require-jsdoc'];

const rules = {
  'spaced-comment': [
    'error',
    'always',
    {
      'block': {
        'balanced': true,
      },
      'exceptions': ['*'],
    },
  ],
  // Blockly uses prefixes for optional arguments and test-only functions.
  'camelcase': [
    'error',
    {
      'properties': 'never',
      'allow': ['^opt_', '^_opt_', '^testOnly_'],
    },
  ],
  // Blockly uses capital letters for some non-constructor namespaces.
  // Keep them for legacy reasons.
  'new-cap': ['off'],
  // Blockly uses objects as maps, but uses Object.create(null) to
  // instantiate them.
  'guard-for-in': ['off'],
  // New rule added that we're breaking in many places.
  // TODO: Fix and remove this.
  'no-useless-assignment': ['off'],
};

/**
 * Build shared settings for TS linting and add in the config differences.
 * @param {object} root0 A configuration options struct.
 * @param {!Array<string>} root0.files List of file globs to apply rules to.
 * @param {string} root0.tsconfig Path to the tsconfig.json file to use.
 * @returns {object} The override TS linting for given files and a given
 *     tsconfig.
 */
function buildTSOverride({files, tsconfig}) {
  return {
    files: files,
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      jsdoc,
    },
    languageOptions: {
      parser: tseslint.parser,
      'ecmaVersion': 2020,
      'sourceType': 'module',
      parserOptions: {
        'project': tsconfig,
        'tsconfigRootDir': process.cwd(),
      },
      globals: {
        ...globals.browser,
      },
    },
    extends: [
      ...tseslint.configs.recommended,
      jsdoc.configs['flat/recommended-typescript'],
      eslintPluginPrettierRecommended,
    ],
    rules: {
      // TS rules
      // Blockly uses namespaces to do declaration merging in some cases.
      '@typescript-eslint/no-namespace': ['off'],
      // Use the updated TypeScript-specific rule.
      'no-invalid-this': ['off'],
      '@typescript-eslint/no-invalid-this': ['error'],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          'argsIgnorePattern': '^_',
          'varsIgnorePattern': '^_',
        },
      ],
      // Temporarily disable. 23 problems.
      '@typescript-eslint/no-explicit-any': ['off'],
      // We use this pattern extensively for block (e.g. controls_if) interfaces.
      '@typescript-eslint/no-empty-object-type': ['off'],
      // TSDoc doesn't support @yields, so don't require that we use it.
      'jsdoc/require-yields': ['off'],
      // params and returns docs are optional.
      'jsdoc/require-param-description': ['off'],
      'jsdoc/require-returns': ['off'],
      // Disable for now (breaks on `this` which is not really a param).
      'jsdoc/require-param': ['off'],
      // Don't auto-add missing jsdoc. Only required on exported items.
      'jsdoc/require-jsdoc': [
        'warn',
        {
          'enableFixer': false,
          'publicOnly': true,
        },
      ],
      'jsdoc/check-tag-names': [
        'error',
        {
          'definedTags': [
            'sealed',
            'typeParam',
            'remarks',
            'define',
            'nocollapse',
          ],
        },
      ],
      // Disabled due to not handling `this`. If re-enabled,
      // checkDestructured option
      // should be left as false.
      'jsdoc/check-param-names': ['off', {'checkDestructured': false}],
      // Allow any text in the license tag. Other checks are not relevant.
      'jsdoc/check-values': ['off'],
      // Ensure there is a blank line between the body and any @tags,
      // as required by the tsdoc spec (see #6353).
      'jsdoc/tag-lines': ['error', 'any', {'startLines': 1}],
      'jsdoc/require-throws-type': ['off'],
    },
  };
}

export default defineConfig(
  {
    // Note: there should be no other properties in this object
    ignores: [
      // All Packages
      'packages/*/node_modules/**',
      'packages/**/build/',
      'packages/**/dist/',
      // Core Build artifacts
      // All Packages
      'packages/*/node_modules/**',
      'packages/**/build/',
      'packages/**/dist/',
      // Core Build artifacts
      'packages/blockly/msg/*',
      'packages/blockly/typings/*',
      'packages/blockly/docs/*',
      // Core Tests other than mocha unit tests
      'packages/blockly/tests/blocks/*',
      'packages/blockly/tests/themes/*',
      'packages/blockly/tests/compile/*',
      'packages/blockly/tests/jsunit/*',
      'packages/blockly/tests/generators/*',
      'packages/blockly/tests/mocha/webdriver.js',
      'packages/blockly/tests/screenshot/*',
      'packages/blockly/tests/test_runner.js',
      'packages/blockly/tests/workspace_svg/*',
      // Core Demos, scripts, misc
      'packages/blockly/generators/*',
      'packages/blockly/demos/*',
      'packages/blockly/appengine/*',
      'packages/blockly/externs/*',
      'packages/blockly/closure/*',
      'packages/blockly/scripts/gulpfiles/*',
      'packages/blockly/CHANGELOG.md',
      'packages/blockly/PULL_REQUEST_TEMPLATE.md',
      // Docs
      'packages/docs/docs/reference/**',
      'packages/docs/.docusaurus/**',
    ],
  },
  jsdoc.configs['flat/recommended'],
  {
    files: ['packages/blockly/**/*.ts', 'packages/blockly/**/*.tsx', 'packages/blockly/**/*.js'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
    },
    extends: [eslint.configs.recommended, googleStyle],
    ...eslintPluginPrettierRecommended,
  },
  {
    files: [
      'packages/blockly/eslint.config.mjs',
      'packages/blockly/.prettierrc.js',
      'packages/blockly/gulpfile.mjs',
      'packages/blockly/scripts/helpers.js',
      'packages/blockly/tests/mocha/.mocharc.js',
      'packages/blockly/tests/migration/validate-renamings.mjs',
      'packages/blockly/tests/scripts/magic_symlink.js',
      'packages/blockly/tests/scripts/webdriver_helpers.js',
    ],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'jsdoc/check-values': ['off'],
    },
  },
  {
    files: ['packages/blockly/tests/**'],
    plugins: {
      mocha: mochaPlugin,
    },
    languageOptions: {
      globals: {
        'Blockly': true,
        'dartGenerator': true,
        'javascriptGenerator': true,
        'luaGenerator': true,
        'phpGenerator': true,
        'pythonGenerator': true,
      },
    },
    rules: {
      'jsdoc/check-values': ['off'],
      'jsdoc/require-returns': ['off'],
      'jsdoc/no-undefined-types': ['off'],
      'jsdoc/valid-types': ['off'],
      'jsdoc/check-types': ['off'],
      'jsdoc/check-tag-names': ['warn', {'definedTags': ['record']}],
      'jsdoc/tag-lines': ['off'],
      'jsdoc/no-defaults': ['off'],
      'jsdoc/reject-any-type': ['off'],
      'jsdoc/reject-function-type': ['off'],
      'jsdoc/require-throws-type': ['off'],
      'mocha/no-exclusive-tests': 'error',
    },
  },
  {
    files: ['packages/blockly/tests/browser/**'],
    languageOptions: {
      sourceType: 'module',
      globals: {
        'chai': false,
        'sinon': false,
        ...globals.mocha,
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      // Allow uncommented helper functions in tests.
      'jsdoc/require-jsdoc': ['off'],
      'jsdoc/require-returns-type': ['off'],
      'jsdoc/require-param-type': ['off'],
      'no-invalid-this': ['off'],
    },
  },
  {
    files: ['packages/blockly/tests/mocha/**'],
    languageOptions: {
      sourceType: 'module',
      globals: {
        'chai': false,
        'sinon': false,
        ...globals.mocha,
        ...globals.browser,
      },
    },
    rules: {
      'no-unused-vars': ['off'],
      // Allow uncommented helper functions in tests.
      'jsdoc/require-jsdoc': ['off'],
      'prefer-rest-params': ['off'],
      'no-invalid-this': ['off'],
    },
  },
  {
    files: ['packages/blockly/tests/node/**'],
    languageOptions: {
      globals: {
        'console': true,
        'require': true,
        ...globals.mocha,
        ...globals.node,
      },
    },
  },
  {
    files: ['packages/blockly/tests/playgrounds/**', 'packages/blockly/tests/scripts/**'],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },
  {
    files: ['packages/blockly/scripts/**'],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      'jsdoc/check-values': ['off'],
      'jsdoc/require-returns': ['off'],
      'jsdoc/tag-lines': ['off'],
    },
  },
  {
    ...mdx.flat,
    files: ['packages/docs/**/*.mdx'],
    rules: {
      ...mdx.flat.rules,
      'mdx/remark': 'off',
    },
  },
  {
    ...mdx.flat,
    files: ['packages/docs/**/*.md'],
    ...mdx.flatCodeBlocks,
    rules: {
      ...mdx.flat.rules,
      ...mdx.flatCodeBlocks.rules,
      'mdx/remark': 'off',
    },
  },
  {
    files: ['packages/plugins/**'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.commonjs,
        ...globals.node,
        ...globals.es5,
        Blockly: true,
        goog: true,
        monaco: true,
        dat: true,
      },
    },
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
    plugins: {
      jsdoc,
    },
    settings: {
      jsdoc: {
        tagNamePreference: {
          returns: 'returns',
        },
        mode: 'closure',
      },
    },
    rules: {
      // http://eslint.org/docs/rules/
      'camelcase': 'warn',
      'new-cap': ['error', {capIsNewExceptionPattern: '^.*Error'}],
      'no-invalid-this': 'off',
      // valid-jsdoc does not work properly for interface methods.
      // https://github.com/eslint/eslint/issues/9978
      'valid-jsdoc': 'off',
      // https://github.com/gajus/eslint-plugin-jsdoc#eslint-plugin-jsdoc-rules
      'require-jsdoc': 'off',
      'jsdoc/newline-after-description': 'off',
      // This should warn instead, but it's broken for long record type params.
      'jsdoc/require-description-complete-sentence': 'off',
      'jsdoc/require-returns': [
        'error',
        {
          forceRequireReturn: false,
        },
      ],
      'jsdoc/require-description': [
        'warn',
        {
          // Don't require descriptions if these tags are present.
          exemptedBy: ['inheritdoc', 'param', 'return', 'returns', 'type'],
        },
      ],
      'jsdoc/check-tag-names': 'off',
      'jsdoc/check-access': 'warn',
      'jsdoc/check-types': 'off',
      'jsdoc/check-values': 'off',
      'jsdoc/reject-any-type': 'off',
      'jsdoc/reject-function-type': 'off',
      'jsdoc/require-jsdoc': [
        'warn',
        {
          enableFixer: false,
          require: {
            FunctionDeclaration: true,
            ClassDeclaration: true,
            MethodDefinition: true,
          },
        },
      ],
    }
  },
  {
    settings: {
      // Allowlist some JSDoc tag aliases we use.
      'jsdoc': {
        'tagNamePreference': {
          'return': 'return',
          'fileoverview': 'fileoverview',
          'extends': 'extends',
          'constructor': 'constructor',
        },
      },
    },
    rules,
  },
  ...tseslint.config(
    buildTSOverride({
      files: ['packages/blockly/**/*.ts', 'packages/blockly/**/*.tsx'],
      tsconfig: './tsconfig.json',
    }),
    buildTSOverride({
      files: ['packages/blockly/tests/typescript/**/*.ts', 'packages/blockly/tests/typescript/**/*.tsx'],
      tsconfig: './tests/typescript/tsconfig.json',
    }),
  ),
);
