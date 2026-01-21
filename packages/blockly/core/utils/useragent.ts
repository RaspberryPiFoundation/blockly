/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.utils.userAgent

/** The raw useragent string. */
let rawUserAgent: string;

let isJavaFx: boolean;

let isWebKit: boolean;

let isGecko: boolean;

let isAndroid: boolean;

let isIPad: boolean;

let isIPhone: boolean;

let isMac: boolean;

let isTablet: boolean;

let isMobile: boolean;

(function (raw) {
  rawUserAgent = raw;
  const rawUpper = rawUserAgent.toUpperCase();
  /**
   * Case-insensitive test of whether name is in the useragent string.
   *
   * @param name Name to test.
   * @returns True if name is present.
   */
  function has(name: string): boolean {
    return rawUpper.includes(name.toUpperCase());
  }

  // Browsers.  Logic from:
  // https://github.com/google/closure-library/blob/master/closure/goog/labs/useragent/browser.js
  // Useragent for JavaFX:
  // Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.44
  //     (KHTML, like Gecko) JavaFX/8.0 Safari/537.44
  isJavaFx = has('JavaFX');

  // Engines.  Logic from:
  // https://github.com/google/closure-library/blob/master/closure/goog/labs/useragent/engine.js
  isWebKit = has('WebKit');
  isGecko = has('Gecko') && !isWebKit;

  // Platforms.  Logic from:
  // https://github.com/google/closure-library/blob/master/closure/goog/labs/useragent/platform.js
  // and
  // https://github.com/google/closure-library/blob/master/closure/goog/labs/useragent/extra.js
  isAndroid = has('Android');
  const maxTouchPoints =
    globalThis['navigator'] && globalThis['navigator']['maxTouchPoints'];
  isIPad = has('iPad') || (has('Macintosh') && maxTouchPoints > 0);
  isIPhone = has('iPhone') && !isIPad;
  isMac = has('Macintosh');

  // Devices.  Logic from:
  // https://github.com/google/closure-library/blob/master/closure/goog/labs/useragent/device.js
  isTablet = isIPad || (isAndroid && !has('Mobile')) || has('Silk');
  isMobile = !isTablet && (isIPhone || isAndroid);
})((globalThis['navigator'] && globalThis['navigator']['userAgent']) || '');

export const raw: string = rawUserAgent;

export const JavaFx: boolean = isJavaFx;

export const GECKO: boolean = isGecko;

export const ANDROID: boolean = isAndroid;

export const IPAD: boolean = isIPad;

export const IPHONE: boolean = isIPhone;

export const MAC: boolean = isMac;

export const MOBILE: boolean = isMobile;
