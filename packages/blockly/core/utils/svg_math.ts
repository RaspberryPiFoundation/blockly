/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.utils.svgMath

import type {WorkspaceSvg} from '../workspace_svg.js';
import {Coordinate} from './coordinate.js';
import {Rect} from './rect.js';
import * as style from './style.js';

/**
 * Static regex to pull the x,y values out of an SVG translate() directive.
 * Note that Firefox and IE (9,10) return 'translate(12)' instead of
 * 'translate(12, 0)'.
 * Note that IE (9,10) returns 'translate(16 8)' instead of 'translate(16, 8)'.
 * Note that IE has been reported to return scientific notation (0.123456e-42).
 */
const XY_REGEX = /translate\(\s*([-+\d.e]+)([ ,]\s*([-+\d.e]+)\s*)?/;

/**
 * Static regex to pull the x,y values out of a translate() or translate3d()
 * style property.
 * Accounts for same exceptions as XY_REGEX.
 */
const XY_STYLE_REGEX =
  /transform:\s*translate(?:3d)?\(\s*([-+\d.e]+)\s*px([ ,]\s*([-+\d.e]+)\s*px)?/;

/**
 * Return the coordinates of the top-left corner of this element relative to
 * its parent.  Only for SVG elements and children (e.g. rect, g, path).
 *
 * @param element SVG element to find the coordinates of.
 * @returns Object with .x and .y properties.
 */
export function getRelativeXY(element: Element): Coordinate {
  const xy = new Coordinate(0, 0);
  // First, check for x and y attributes.
  // Checking for the existence of x/y properties is faster than getAttribute.
  // However, x/y contains an SVGAnimatedLength object, so rely on getAttribute
  // to get the number.
  const x = (element as any).x && element.getAttribute('x');
  const y = (element as any).y && element.getAttribute('y');
  if (x) {
    xy.x = parseInt(x);
  }
  if (y) {
    xy.y = parseInt(y);
  }
  // Second, check for transform="translate(...)" attribute.
  const transform = element.getAttribute('transform');
  const r = transform && transform.match(XY_REGEX);
  if (r) {
    xy.x += Number(r[1]);
    if (r[3]) {
      xy.y += Number(r[3]);
    }
  }

  // Then check for style = transform: translate(...) or translate3d(...)
  const style = element.getAttribute('style');
  if (style && style.includes('translate')) {
    const styleComponents = style.match(XY_STYLE_REGEX);
    if (styleComponents) {
      xy.x += Number(styleComponents[1]);
      if (styleComponents[3]) {
        xy.y += Number(styleComponents[3]);
      }
    }
  }
  return xy;
}

/**
 * Return the coordinates of the top-left corner of this element relative to
 * the div Blockly was injected into.
 *
 * @param element SVG element to find the coordinates of. If this is not a child
 *     of the div Blockly was injected into, the behaviour is undefined.
 * @returns Object with .x and .y properties.
 */
export function getInjectionDivXY(element: Element): Coordinate {
  let x = 0;
  let y = 0;
  while (element) {
    const xy = getRelativeXY(element);
    x += xy.x;
    y += xy.y;
    const classes = element.getAttribute('class') || '';
    if ((' ' + classes + ' ').includes(' injectionDiv ')) {
      break;
    }
    element = element.parentNode as Element;
  }
  return new Coordinate(x, y);
}

/**
 * Get the position of the current viewport in window coordinates.  This takes
 * scroll into account.
 *
 * @returns An object containing window width, height, and scroll position in
 *     window coordinates.
 * @internal
 */
export function getViewportBBox(): Rect {
  // Pixels, in window coordinates.
  const scrollOffset = style.getViewportPageOffset();
  return new Rect(
    scrollOffset.y,
    document.documentElement.clientHeight + scrollOffset.y,
    scrollOffset.x,
    document.documentElement.clientWidth + scrollOffset.x,
  );
}

/**
 * Gets the document scroll distance as a coordinate object.
 * Copied from Closure's goog.dom.getDocumentScroll.
 *
 * @returns Object with values 'x' and 'y'.
 */
export function getDocumentScroll(): Coordinate {
  const el = document.documentElement;
  const win = window;
  return new Coordinate(
    win.pageXOffset || el.scrollLeft,
    win.pageYOffset || el.scrollTop,
  );
}

/**
 * Converts screen coordinates to workspace coordinates.
 *
 * @param ws The workspace to find the coordinates on.
 * @param screenCoordinates The screen coordinates to be converted to workspace
 *     coordinates
 * @returns The workspace coordinates.
 */
export function screenToWsCoordinates(
  ws: WorkspaceSvg,
  screenCoordinates: Coordinate,
): Coordinate {
  const screenX = screenCoordinates.x;
  const screenY = screenCoordinates.y;

  const injectionDiv = ws.getInjectionDiv();
  // Bounding rect coordinates are in client coordinates, meaning that they
  // are in pixels relative to the upper left corner of the visible browser
  // window.  These coordinates change when you scroll the browser window.
  const boundingRect = injectionDiv.getBoundingClientRect();

  // The client coordinates offset by the injection div's upper left corner.
  const clientOffsetPixels = new Coordinate(
    screenX - boundingRect.left,
    screenY - boundingRect.top,
  );

  // The offset in pixels between the main workspace's origin and the upper
  // left corner of the injection div.
  const mainOffsetPixels = ws.getOriginOffsetInPixels();

  // The position of the new comment in pixels relative to the origin of the
  // main workspace.
  const finalOffsetPixels = Coordinate.difference(
    clientOffsetPixels,
    mainOffsetPixels,
  );
  // The position in main workspace coordinates.
  const finalOffsetMainWs = finalOffsetPixels.scale(1 / ws.scale);
  return finalOffsetMainWs;
}

/**
 * Converts workspace coordinates to screen coordinates.
 *
 * @param ws The workspace to get the coordinates out of.
 * @param workspaceCoordinates  The workspace coordinates to be converted
 *     to screen coordinates.
 * @returns The screen coordinates.
 */
export function wsToScreenCoordinates(
  ws: WorkspaceSvg,
  workspaceCoordinates: Coordinate,
): Coordinate {
  // Fix workspace scale vs browser scale.
  const screenCoordinates = workspaceCoordinates.scale(ws.scale);
  const screenX = screenCoordinates.x;
  const screenY = screenCoordinates.y;

  const injectionDiv = ws.getInjectionDiv();
  const boundingRect = injectionDiv.getBoundingClientRect();
  const mainOffset = ws.getOriginOffsetInPixels();

  // Fix workspace origin vs browser origin.
  return new Coordinate(
    screenX + boundingRect.left + mainOffset.x,
    screenY + boundingRect.top + mainOffset.y,
  );
}

export const TEST_ONLY = {
  XY_REGEX,
  XY_STYLE_REGEX,
};
