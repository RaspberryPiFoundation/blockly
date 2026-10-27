/**
 * @license
 * Copyright 2026 Raspberry Pi Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Helpers for building/compiling using Googles Closure Compiler.
 */

import {compiler as ClosureCompiler} from 'google-closure-compiler';
import {getNativeImagePath} from 'google-closure-compiler/lib/utils.js';

/**
 * Closure Compiler diagnostic groups we want to be treated as errors.
 * These are effected when the --debug or --strict flags are passed.
 * For a full list of Closure Compiler groups, consult the output of
 * google-closure-compiler --help or look in the source  here:
 * https://github.com/google/closure-compiler/blob/master/src/com/google/javascript/jscomp/DiagnosticGroups.java#L117
 *
 * The list in JSCOMP_ERROR contains all the diagnostic groups we know
 * about, but some are commented out if we don't want them, and may
 * appear in JSCOMP_WARNING or JSCOMP_OFF instead.  Items not
 * appearing on any list will default to setting provided by the
 * compiler, which may vary depending on compilation level.
 */
const JSCOMP_ERROR = [
  // 'accessControls',  // Deprecated; means same as visibility.
  // 'checkPrototypalTypes',  // override annotations are stripped by tsc.
  'checkRegExp',
  // 'checkTypes',  // Disabled; see note in JSCOMP_OFF.
  'checkVars',
  'conformanceViolations',
  'const',
  'constantProperty',
  'duplicateMessage',
  'es5Strict',
  'externsValidation',
  'extraRequire', // Undocumented but valid.
  'functionParams',
  // 'globalThis',  // This types are stripped by tsc.
  'invalidCasts',
  'misplacedTypeAnnotation',
  // 'missingOverride',  // There are many of these, which should be fixed.
  'missingPolyfill',
  // 'missingProperties',  // Unset static properties are stripped by tsc.
  'missingProvide',
  'missingRequire',
  'missingReturn',
  // 'missingSourcesWarnings',  // Group of several other options.
  'moduleLoad',
  'msgDescriptions',
  // 'nonStandardJsDocs',  // Disabled; see note in JSCOMP_OFF.
  // 'partialAlias',  // Don't want this to be an error yet; only warning.
  // 'polymer',  // Not applicable.
  // 'reportUnknownTypes',  // VERY verbose.
  // 'strictCheckTypes',  // Use --strict to enable.
  // 'strictMissingProperties',  // Part of strictCheckTypes.
  'strictModuleChecks', // Undocumented but valid.
  'strictModuleDepCheck',
  // 'strictPrimitiveOperators',  // Part of strictCheckTypes.
  'suspiciousCode',
  'typeInvalidation',
  'undefinedVars',
  'underscore',
  'unknownDefines',
  // 'unusedLocalVariables',  // Disabled; see note in JSCOMP_OFF.
  'uselessCode',
  'untranspilableFeatures',
  // 'visibility',  // Disabled; see note in JSCOMP_OFF.
];

/**
 * Closure Compiler diagnostic groups we want to be treated as warnings.
 * These are effected when the --debug or --strict flags are passed.
 *
 * For most (all?) diagnostic groups this is the default level, so
 * it's generally sufficient to remove them from JSCOMP_ERROR.
 */
const JSCOMP_WARNING = ['deprecated', 'deprecatedAnnotations'];

/**
 * Closure Compiler diagnostic groups we want to be ignored.  These
 * suppressions are always effected by default.
 *
 * Make sure that anything added here is commented out of JSCOMP_ERROR
 * above, as that takes precedence.)
 */
const JSCOMP_OFF = [
  /* The removal of Closure type system types from our JSDoc
   * annotations means that the Closure Compiler now generates certain
   * diagnostics because it no longer has enough information to be
   * sure that the input code is correct.  The following diagnostic
   * groups are turned off to suppress such errors.
   *
   * When adding additional items to this list it may be helpful to
   * search the compiler source code
   * (https://github.com/google/closure-compiler/) for the JSC_*
   * diagnostic name (omitting the JSC_ prefix) to find the corresponding
   * DiagnosticGroup.
   */
  'checkTypes',
  'nonStandardJsDocs', // Due to @internal
  'unusedLocalVariables', // Due to code generated for merged namespaces.

  /* In order to transition to ES modules, modules will need to import
   * one another by relative paths. This means that the previous
   * practice of moving all source files into the same directory for
   * compilation would break imports.
   *
   * Not flattening files in this way breaks our usage
   * of @package however: files were flattened so that all Blockly
   * source files are in the same directory and can use @package to
   * mark methods that are only allowed for use by Blockly, while
   * still allowing access between e.g. core/events/* and
   * core/utils/*. We were downgrading access control violations
   * (including @private) to warnings, but this ends up being so
   * spammy that it makes the compiler output nearly useless.
   *
   * Once ES module migration is complete, they will be re-enabled and
   * an alternative to @package will be established.
   */
  'visibility',
];

/**
 * Helper method for fetching the default closure compiler options.
 *
 * @param {string[]} argv The arguments passed in from the command line.
 */
function getDefaultCompileOptions(argv) {
  const defaultOptions = {
    compilation_level: 'SIMPLE_OPTIMIZATIONS',
    warning_level: argv?.verbose ? 'VERBOSE' : 'DEFAULT',
    language_in: 'ECMASCRIPT_2020',
    language_out: 'ECMASCRIPT_2015',
    jscomp_off: [...JSCOMP_OFF],
    rewrite_polyfills: true,
    hide_warnings_for: ['node_modules'],
    define: ['COMPILED=true'],
  };
  if (argv?.debug || argv?.strict) {
    defaultOptions.jscomp_error = [...JSCOMP_ERROR];
    defaultOptions.jscomp_warning = [...JSCOMP_WARNING];
    if (argv?.strict) {
      defaultOptions.jscomp_error.push('strictCheckTypes');
    }
  }
  return defaultOptions;
}

/**
 * Helper method for calling the Closure Compiler, establishing
 * default options (that can be overridden by the caller).
 *
 * The compiler reads its inputs from and writes its outputs to disk,
 * so the caller is expected to supply --js and either --js_output_file
 * or --chunk_output_path_prefix.
 *
 * @param {{[flag: string]: string|boolean|!Array<string>}} options
 *     Caller-supplied options that will override the defaultOptions.
 * @param {string[]} argv The arguments passed in from the command line.
 * @return {!Promise<string>} Resolves with the compiler's stdout once
 *     it exits successfully; rejects if it exits non-zero.
 */
export function compile(options, argv) {
  const compilerInstance = new ClosureCompiler({
    ...getDefaultCompileOptions(argv),
    ...options,
  });

  // google-closure-compiler's node API always shells out to `java`
  // unless JAR_PATH is cleared; only its gulp and grunt plugins know
  // about the platform-native binaries.  Do what those plugins do, so
  // that a JRE isn't needed on platforms we ship a binary for.  See
  // getFirstSupportedPlatform() in google-closure-compiler/lib/utils.js.
  const nativeImagePath = getNativeImagePath();
  if (nativeImagePath) {
    compilerInstance.JAR_PATH = null;
    compilerInstance.javaPath = nativeImagePath;
  } else if (!process.env.JAVA_HOME) {
    throw new Error(
      'No native Closure Compiler binary for this platform and no JRE ' +
        'found; set JAVA_HOME or install google-closure-compiler-<platform>.',
    );
  }

  return new Promise((resolve, reject) => {
    compilerInstance.run((exitCode, stdout, stderr) => {
      // Diagnostics go to stderr even when compilation succeeds.
      if (stderr) process.stderr.write(stderr);
      if (exitCode === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`Closure Compiler exited with code ${exitCode}.`));
      }
    });
  });
}
