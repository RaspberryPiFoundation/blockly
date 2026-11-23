/**
 * @license
 * Copyright 2026 Raspberry Pi Foundation
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Picks colours that stand out against a background, using the
 * WCAG definition of contrast.
 */

import * as Blockly from 'blockly/core';

// The constants below come from the WCAG 2.2 definition of relative luminance:
// https://www.w3.org/TR/WCAG22/#dfn-relative-luminance

/** How much red contributes to perceived brightness. */
const RED_WEIGHT = 0.2126;

/** How much green contributes to perceived brightness. */
const GREEN_WEIGHT = 0.7152;

/** How much blue contributes to perceived brightness. */
const BLUE_WEIGHT = 0.0722;

/** At or below this sRGB value, the sRGB curve is a straight line. */
const SRGB_LINEAR_THRESHOLD = 0.04045;

/** The slope of the straight part of the sRGB curve. */
const SRGB_LINEAR_SLOPE = 12.92;

/** The offset applied before the curved part of the sRGB curve. */
const SRGB_CURVE_OFFSET = 0.055;

/** The scale applied before the curved part of the sRGB curve. */
const SRGB_CURVE_SCALE = 1.055;

/** The exponent of the curved part of the sRGB curve. */
const SRGB_CURVE_EXPONENT = 2.4;

/**
 * Added to both luminances in a contrast ratio, to account for light
 * reflecting off the screen. From the WCAG 2.2 definition of contrast ratio:
 * https://www.w3.org/TR/WCAG22/#dfn-contrast-ratio
 */
const SCREEN_FLARE = 0.05;

/**
 * The contrast ratio to enforce between graphical objects and their backgrounds.
 * WCAG asks for a minimum contrast of 3:1.
 */
const MIN_CONTRAST = 3;

const BLACK = '#000000';
const WHITE = '#ffffff';

/**
 * Converts a red, green or blue channel value to the amount of light the
 * screen gives off for it.
 *
 * @param channel The channel value, between 0 and 255.
 * @returns The amount of light, between 0 and 1.
 */
function channelToLight(channel: number): number {
  const value = channel / 255;
  if (value <= SRGB_LINEAR_THRESHOLD) {
    return value / SRGB_LINEAR_SLOPE;
  }
  const shifted = (value + SRGB_CURVE_OFFSET) / SRGB_CURVE_SCALE;
  return shifted ** SRGB_CURVE_EXPONENT;
}

/**
 * Gets how bright a colour looks, as defined by WCAG.
 *
 * @param hex The colour, as a hex string.
 * @returns The relative luminance, from 0 for black to 1 for white.
 */
function getLuminance(hex: string): number {
  const [red, green, blue] = Blockly.utils.colour
    .hexToRgb(hex)
    .map(channelToLight);
  return RED_WEIGHT * red + GREEN_WEIGHT * green + BLUE_WEIGHT * blue;
}

/**
 * Gets the contrast ratio between two colours, as defined by WCAG.
 *
 * @param hex1 A colour, as a hex string. The order of the two colours doesn't
 *     matter.
 * @param hex2 Another colour, as a hex string.
 * @returns The contrast ratio, from 1 for identical colours to 21 for black
 *     and white.
 */
function getContrast(hex1: string, hex2: string): number {
  const luminance1 = getLuminance(hex1);
  const luminance2 = getLuminance(hex2);
  const lighter = Math.max(luminance1, luminance2);
  const darker = Math.min(luminance1, luminance2);
  return (lighter + SCREEN_FLARE) / (darker + SCREEN_FLARE);
}

/**
 * Picks a colour for graphics drawn on a background: the preferred colour if
 * it has the contrast WCAG asks for, otherwise whichever of black or white
 * contrasts more.
 *
 * @param preferred The colour to use if it stands out enough, in any format
 *     `Blockly.utils.colour.parse` accepts.
 * @param background The background colour, in any format
 *     `Blockly.utils.colour.parse` accepts.
 * @returns The colour to use, as a hex string. White if either colour can't
 *     be parsed.
 */
export function pickContrastingColour(
  preferred: string,
  background: string,
): string {
  const preferredHex = Blockly.utils.colour.parse(preferred);
  const backgroundHex = Blockly.utils.colour.parse(background);
  if (!preferredHex || !backgroundHex) return WHITE;
  if (getContrast(preferredHex, backgroundHex) >= MIN_CONTRAST) {
    return preferredHex;
  }
  return getContrast(BLACK, backgroundHex) > getContrast(WHITE, backgroundHex)
    ? BLACK
    : WHITE;
}
