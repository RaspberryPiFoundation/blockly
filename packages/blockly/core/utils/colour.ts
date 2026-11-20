/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.utils.colour

/**
 * The richness of block colours, regardless of the hue.
 * Must be in the range of 0 (inclusive) to 1 (exclusive).
 */
let hsvSaturation = 0.45;

/**
 * Get the richness of block colours, regardless of the hue.
 *
 * @returns The current richness.
 * @internal
 */
export function getHsvSaturation(): number {
  return hsvSaturation;
}

/**
 * Set the richness of block colours, regardless of the hue.
 *
 * @param newSaturation The new richness, in the range of  0 (inclusive) to 1
 *     (exclusive)
 * @internal
 */
export function setHsvSaturation(newSaturation: number) {
  hsvSaturation = newSaturation;
}

/**
 * The intensity of block colours, regardless of the hue.
 * Must be in the range of 0 (inclusive) to 1 (exclusive).
 */
let hsvValue = 0.65;

/**
 * Get the intensity of block colours, regardless of the hue.
 *
 * @returns The current intensity.
 * @internal
 */
export function getHsvValue(): number {
  return hsvValue;
}

/**
 * Set the intensity of block colours, regardless of the hue.
 *
 * @param newValue The new intensity, in the range of  0 (inclusive) to 1
 *     (exclusive)
 * @internal
 */
export function setHsvValue(newValue: number) {
  hsvValue = newValue;
}

/**
 * Parses a colour from a string.
 * .parse('red') = '#ff0000'
 * .parse('#f00') = '#ff0000'
 * .parse('#ff0000') = '#ff0000'
 * .parse('0xff0000') = '#ff0000'
 * .parse('rgb(255, 0, 0)') = '#ff0000'
 *
 * @param str Colour in some CSS format.
 * @returns A string containing a hex representation of the colour, or null if
 *     can't be parsed.
 */
export function parse(str: string | number): string | null {
  str = `${str}`.toLowerCase().trim();
  let hex = names[str];
  if (hex) {
    // e.g. 'red'
    return hex;
  }
  hex = str.substring(0, 2) === '0x' ? '#' + str.substring(2) : str;
  hex = hex[0] === '#' ? hex : '#' + hex;
  if (/^#[0-9a-f]{6}$/.test(hex)) {
    // e.g. '#00ff88'
    return hex;
  }
  if (/^#[0-9a-f]{3}$/.test(hex)) {
    // e.g. '#0f8'
    return ['#', hex[1], hex[1], hex[2], hex[2], hex[3], hex[3]].join('');
  }
  const rgb = str.match(/^(?:rgb)?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/);
  if (rgb) {
    // e.g. 'rgb(0, 128, 255)'
    const r = Number(rgb[1]);
    const g = Number(rgb[2]);
    const b = Number(rgb[3]);
    if (r >= 0 && r < 256 && g >= 0 && g < 256 && b >= 0 && b < 256) {
      return rgbToHex(r, g, b);
    }
  }
  return null;
}

/**
 * Converts a colour from RGB to hex representation.
 *
 * @param r Amount of red, int between 0 and 255.
 * @param g Amount of green, int between 0 and 255.
 * @param b Amount of blue, int between 0 and 255.
 * @returns Hex representation of the colour.
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const rgb = (r << 16) | (g << 8) | b;
  if (r < 0x10) {
    return '#' + (0x1000000 | rgb).toString(16).substr(1);
  }
  return '#' + rgb.toString(16);
}

/**
 * Converts a colour to RGB.
 *
 * @param colour String representing colour in any colour format ('#ff0000',
 *     'red', '0xff000', etc).
 * @returns RGB representation of the colour.
 */
export function hexToRgb(colour: string): number[] {
  const hex = parse(colour);
  if (!hex) {
    return [0, 0, 0];
  }

  const rgb = parseInt(hex.substr(1), 16);
  const r = rgb >> 16;
  const g = (rgb >> 8) & 255;
  const b = rgb & 255;

  return [r, g, b];
}

/**
 * Converts an HSV triplet to hex representation.
 *
 * @param h Hue value in [0, 360].
 * @param s Saturation value in [0, 1].
 * @param v Brightness in [0, 255].
 * @returns Hex representation of the colour.
 */
export function hsvToHex(h: number, s: number, v: number): string {
  let red = 0;
  let green = 0;
  let blue = 0;
  if (s === 0) {
    red = v;
    green = v;
    blue = v;
  } else {
    const sextant = Math.floor(h / 60);
    const remainder = h / 60 - sextant;
    const val1 = v * (1 - s);
    const val2 = v * (1 - s * remainder);
    const val3 = v * (1 - s * (1 - remainder));
    switch (sextant) {
      case 1:
        red = val2;
        green = v;
        blue = val1;
        break;
      case 2:
        red = val1;
        green = v;
        blue = val3;
        break;
      case 3:
        red = val1;
        green = val2;
        blue = v;
        break;
      case 4:
        red = val3;
        green = val1;
        blue = v;
        break;
      case 5:
        red = v;
        green = val1;
        blue = val2;
        break;
      case 6:
      case 0:
        red = v;
        green = val3;
        blue = val1;
        break;
    }
  }
  return rgbToHex(Math.floor(red), Math.floor(green), Math.floor(blue));
}

/**
 * Blend two colours together, using the specified factor to indicate the
 * weight given to the first colour.
 *
 * @param colour1 First colour.
 * @param colour2 Second colour.
 * @param factor The weight to be given to colour1 over colour2.
 *     Values should be in the range [0, 1].
 * @returns Combined colour represented in hex.
 */
export function blend(
  colour1: string,
  colour2: string,
  factor: number,
): string | null {
  const hex1 = parse(colour1);
  if (!hex1) {
    return null;
  }
  const hex2 = parse(colour2);
  if (!hex2) {
    return null;
  }
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  const r = Math.round(rgb2[0] + factor * (rgb1[0] - rgb2[0]));
  const g = Math.round(rgb2[1] + factor * (rgb1[1] - rgb2[1]));
  const b = Math.round(rgb2[2] + factor * (rgb1[2] - rgb2[2]));
  return rgbToHex(r, g, b);
}

/**
 * A map that contains the 16 basic colour keywords as defined by W3C:
 * https://www.w3.org/TR/2018/REC-css-color-3-20180619/#html4
 * The keys of this map are the lowercase "readable" names of the colours,
 * while the values are the "hex" values.
 */
export const names: {[key: string]: string} = {
  'aqua': '#00ffff',
  'black': '#000000',
  'blue': '#0000ff',
  'fuchsia': '#ff00ff',
  'gray': '#808080',
  'green': '#008000',
  'lime': '#00ff00',
  'maroon': '#800000',
  'navy': '#000080',
  'olive': '#808000',
  'purple': '#800080',
  'red': '#ff0000',
  'silver': '#c0c0c0',
  'teal': '#008080',
  'white': '#ffffff',
  'yellow': '#ffff00',
};

/**
 * Convert a hue (HSV model) into an RGB hex triplet.
 *
 * @param hue Hue on a colour wheel (0-360).
 * @returns RGB code, e.g. '#5ba65b'.
 */
export function hueToHex(hue: number): string {
  return hsvToHex(hue, hsvSaturation, hsvValue * 255);
}

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

/** The largest value of a red, green or blue channel. */
const MAX_CHANNEL_VALUE = 255;

/**
 * Converts a red, green or blue channel value to the amount of light the
 * screen gives off for it.
 *
 * @param channel The channel value, between 0 and 255.
 * @returns The amount of light, between 0 and 1.
 */
function channelToLight(channel: number): number {
  const value = channel / MAX_CHANNEL_VALUE;
  if (value <= SRGB_LINEAR_THRESHOLD) {
    return value / SRGB_LINEAR_SLOPE;
  }
  const shifted = (value + SRGB_CURVE_OFFSET) / SRGB_CURVE_SCALE;
  return shifted ** SRGB_CURVE_EXPONENT;
}

/**
 * Gets how bright a colour looks, as defined by WCAG.
 *
 * @param colour Colour in any format `parse` accepts ('#ff0000', 'red', etc).
 * @returns The relative luminance, from 0 for black to 1 for white.
 * @throws If the colour can't be parsed.
 * @internal
 */
export function getLuminance(colour: string): number {
  const hex = parse(colour);
  if (!hex) {
    throw new Error(`Can't get the luminance of invalid colour "${colour}".`);
  }
  const [red, green, blue] = hexToRgb(hex).map(channelToLight);
  return RED_WEIGHT * red + GREEN_WEIGHT * green + BLUE_WEIGHT * blue;
}

/**
 * Gets the contrast ratio between two colours, as defined by WCAG. WCAG asks
 * for at least 4.5 for normal text and 3 for graphics.
 *
 * @param colour1 Colour in any format `parse` accepts. The order of the two
 *     colours doesn't matter.
 * @param colour2 Colour in any format `parse` accepts.
 * @returns The contrast ratio, from 1 for identical colours to 21 for black
 *     and white.
 * @throws If either colour can't be parsed.
 * @internal
 */
export function getContrastRatio(colour1: string, colour2: string): number {
  const luminance1 = getLuminance(colour1);
  const luminance2 = getLuminance(colour2);
  const lighter = Math.max(luminance1, luminance2);
  const darker = Math.min(luminance1, luminance2);
  return (lighter + SCREEN_FLARE) / (darker + SCREEN_FLARE);
}

/**
 * Gets the colour for text drawn on a background: white, or black if white
 * would have less contrast than the given minimum.
 *
 * @param background Colour in any format `parse` accepts.
 * @param minWhiteContrast The lowest contrast ratio at which the text stays
 *     white. WCAG asks for at least 4.5 for normal text and 3 for large text
 *     and graphics.
 * @returns White ('#ffffff') or black ('#000000').
 * @throws If the background can't be parsed.
 * @internal
 */
export function getReadableTextColour(
  background: string,
  minWhiteContrast: number,
): string {
  const white = names['white'];
  const black = names['black'];
  return getContrastRatio(background, white) >= minWhiteContrast
    ? white
    : black;
}
