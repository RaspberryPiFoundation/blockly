/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.utils.string

/**
 * Given an array of strings, return the length of the shortest one.
 *
 * @param array Array of strings.
 * @returns Length of shortest string.
 */
export function shortestStringLength(array: string[]): number {
  if (!array.length) {
    return 0;
  }
  return array.reduce(function (a, b) {
    return a.length < b.length ? a : b;
  }).length;
}

/**
 * Given an array of strings, return the length of the common prefix.
 * Words may not be split.  Any space after a word is included in the length.
 *
 * @param array Array of strings.
 * @param opt_shortest Length of shortest string.
 * @returns Length of common prefix.
 */
export function commonWordPrefix(
  array: string[],
  opt_shortest?: number,
): number {
  if (!array.length) {
    return 0;
  } else if (array.length === 1) {
    return array[0].length;
  }
  let wordPrefix = 0;
  const max = opt_shortest || shortestStringLength(array);
  let len;
  for (len = 0; len < max; len++) {
    const letter = array[0][len];
    for (let i = 1; i < array.length; i++) {
      if (letter !== array[i][len]) {
        return wordPrefix;
      }
    }
    if (letter === ' ') {
      wordPrefix = len + 1;
    }
  }
  for (let i = 1; i < array.length; i++) {
    const letter = array[i][len];
    if (letter && letter !== ' ') {
      return wordPrefix;
    }
  }
  return max;
}

/**
 * Given an array of strings, return the length of the common suffix.
 * Words may not be split.  Any space after a word is included in the length.
 *
 * @param array Array of strings.
 * @param opt_shortest Length of shortest string.
 * @returns Length of common suffix.
 */
export function commonWordSuffix(
  array: string[],
  opt_shortest?: number,
): number {
  if (!array.length) {
    return 0;
  } else if (array.length === 1) {
    return array[0].length;
  }
  let wordPrefix = 0;
  const max = opt_shortest || shortestStringLength(array);
  let len;
  for (len = 0; len < max; len++) {
    const letter = array[0].substr(-len - 1, 1);
    for (let i = 1; i < array.length; i++) {
      if (letter !== array[i].substr(-len - 1, 1)) {
        return wordPrefix;
      }
    }
    if (letter === ' ') {
      wordPrefix = len + 1;
    }
  }
  for (let i = 1; i < array.length; i++) {
    const letter = array[i].charAt(array[i].length - len - 1);
    if (letter && letter !== ' ') {
      return wordPrefix;
    }
  }
  return max;
}

/**
 * Wrap text to the specified width.
 *
 * @param text Text to wrap.
 * @param limit Width to wrap each line.
 * @returns Wrapped text.
 */
export function wrap(text: string, limit: number): string {
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    lines[i] = wrapLine(lines[i], limit);
  }
  return lines.join('\n');
}

/**
 * Wrap single line of text to the specified width.
 *
 * @param text Text to wrap.
 * @param limit Width to wrap each line.
 * @returns Wrapped text.
 */
function wrapLine(text: string, limit: number): string {
  if (text.length <= limit) {
    // Short text, no need to wrap.
    return text;
  }
  // Split the text into words.
  const words = text.trim().split(/\s+/);
  // Set limit to be the length of the largest word.
  for (let i = 0; i < words.length; i++) {
    if (words[i].length > limit) {
      limit = words[i].length;
    }
  }

  let lastScore;
  let score = -Infinity;
  let lastText;
  let lineCount = 1;
  do {
    lastScore = score;
    lastText = text;
    // Create a list of booleans representing if a space (false) or
    // a break (true) appears after each word.
    let wordBreaks = [];
    // Seed the list with evenly spaced linebreaks.
    const steps = words.length / lineCount;
    let insertedBreaks = 1;
    for (let i = 0; i < words.length - 1; i++) {
      if (insertedBreaks < (i + 1.5) / steps) {
        insertedBreaks++;
        wordBreaks[i] = true;
      } else {
        wordBreaks[i] = false;
      }
    }
    wordBreaks = wrapMutate(words, wordBreaks, limit);
    score = wrapScore(words, wordBreaks, limit);
    text = wrapToText(words, wordBreaks);
    lineCount++;
  } while (score > lastScore);
  return lastText;
}

/**
 * Compute a score for how good the wrapping is.
 *
 * @param words Array of each word.
 * @param wordBreaks Array of line breaks.
 * @param limit Width to wrap each line.
 * @returns Larger the better.
 */
function wrapScore(
  words: string[],
  wordBreaks: boolean[],
  limit: number,
): number {
  // If this function becomes a performance liability, add caching.
  // Compute the length of each line.
  const lineLengths = [0];
  const linePunctuation = [];
  for (let i = 0; i < words.length; i++) {
    lineLengths[lineLengths.length - 1] += words[i].length;
    if (wordBreaks[i] === true) {
      lineLengths.push(0);
      linePunctuation.push(words[i].charAt(words[i].length - 1));
    } else if (wordBreaks[i] === false) {
      lineLengths[lineLengths.length - 1]++;
    }
  }
  const maxLength = Math.max(...lineLengths);

  let score = 0;
  for (let i = 0; i < lineLengths.length; i++) {
    // Optimize for width.
    // -2 points per char over limit (scaled to the power of 1.5).
    score -= Math.pow(Math.abs(limit - lineLengths[i]), 1.5) * 2;
    // Optimize for even lines.
    // -1 point per char smaller than max (scaled to the power of 1.5).
    score -= Math.pow(maxLength - lineLengths[i], 1.5);
    // Optimize for structure.
    // Add score to line endings after punctuation.
    if ('.?!'.includes(linePunctuation[i])) {
      score += limit / 3;
    } else if (',;)]}'.includes(linePunctuation[i])) {
      score += limit / 4;
    }
  }
  // All else being equal, the last line should not be longer than the
  // previous line.  For example, this looks wrong:
  // aaa bbb
  // ccc ddd eee
  if (
    lineLengths.length > 1 &&
    lineLengths[lineLengths.length - 1] <= lineLengths[lineLengths.length - 2]
  ) {
    score += 0.5;
  }
  return score;
}
/**
 * Mutate the array of line break locations until an optimal solution is found.
 * No line breaks are added or deleted, they are simply moved around.
 *
 * @param words Array of each word.
 * @param wordBreaks Array of line breaks.
 * @param limit Width to wrap each line.
 * @returns New array of optimal line breaks.
 */
function wrapMutate(
  words: string[],
  wordBreaks: boolean[],
  limit: number,
): boolean[] {
  let bestScore = wrapScore(words, wordBreaks, limit);
  let bestBreaks;
  // Try shifting every line break forward or backward.
  for (let i = 0; i < wordBreaks.length - 1; i++) {
    if (wordBreaks[i] === wordBreaks[i + 1]) {
      continue;
    }
    const mutatedWordBreaks = new Array<boolean>().concat(wordBreaks);
    mutatedWordBreaks[i] = !mutatedWordBreaks[i];
    mutatedWordBreaks[i + 1] = !mutatedWordBreaks[i + 1];
    const mutatedScore = wrapScore(words, mutatedWordBreaks, limit);
    if (mutatedScore > bestScore) {
      bestScore = mutatedScore;
      bestBreaks = mutatedWordBreaks;
    }
  }
  if (bestBreaks) {
    // Found an improvement.  See if it may be improved further.
    return wrapMutate(words, bestBreaks, limit);
  }
  // No improvements found.  Done.
  return wordBreaks;
}

/**
 * Reassemble the array of words into text, with the specified line breaks.
 *
 * @param words Array of each word.
 * @param wordBreaks Array of line breaks.
 * @returns Plain text.
 */
function wrapToText(words: string[], wordBreaks: boolean[]): string {
  const text = [];
  for (let i = 0; i < words.length; i++) {
    text.push(words[i]);
    if (wordBreaks[i] !== undefined) {
      text.push(wordBreaks[i] ? '\n' : ' ');
    }
  }
  return text.join('');
}

/**
 * Is the given string a number (includes negative and decimals).
 *
 * @param str Input string.
 * @returns True if number, false otherwise.
 */
export function isNumber(str: string): boolean {
  return /^\s*-?\d+(\.\d+)?\s*$/.test(str);
}
