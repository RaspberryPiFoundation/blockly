/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.utils.style

import {Coordinate} from './coordinate.js';
import {Rect} from './rect.js';
import {Size} from './size.js';

/**
 * Gets the height and width of an element.
 * Similar to Closure's goog.style.getSize
 *
 * @param element Element to get size of.
 * @returns Object with width/height properties.
 */
export function getSize(element: Element): Size {
  return TEST_ONLY.getSizeInternal(element);
}

/**
 * Private version of getSize for stubbing in tests.
 */
function getSizeInternal(element: Element): Size {
  if (getComputedStyle(element, 'display') !== 'none') {
    return getSizeWithDisplay(element);
  }

  // Evaluate size with a temporary element.
  // AnyDuringMigration because:  Property 'style' does not exist on type
  // 'Element'.
  const style = (element as AnyDuringMigration).style;
  const originalDisplay = style.display;
  const originalVisibility = style.visibility;
  const originalPosition = style.position;

  style.visibility = 'hidden';
  style.position = 'absolute';
  style.display = 'inline';

  const offsetWidth = (element as HTMLElement).offsetWidth;
  const offsetHeight = (element as HTMLElement).offsetHeight;

  style.display = originalDisplay;
  style.position = originalPosition;
  style.visibility = originalVisibility;

  return new Size(offsetWidth, offsetHeight);
}

/**
 * Gets the height and width of an element when the display is not none.
 *
 * @param element Element to get size of.
 * @returns Object with width/height properties.
 */
function getSizeWithDisplay(element: Element): Size {
  const offsetWidth = (element as HTMLElement).offsetWidth;
  const offsetHeight = (element as HTMLElement).offsetHeight;
  return new Size(offsetWidth, offsetHeight);
}

/**
 * Retrieves a computed style value of a node. It returns empty string
 * if the property requested is an SVG one and it has not been
 * explicitly set (firefox and webkit).
 *
 * Copied from Closure's goog.style.getComputedStyle
 *
 * @param element Element to get style of.
 * @param property Property to get (camel-case).
 * @returns Style value.
 */
export function getComputedStyle(element: Element, property: string): string {
  const styles = window.getComputedStyle(element);
  // element.style[..] is undefined for browser specific styles
  // as 'filter'.
  return (
    (styles as AnyDuringMigration)[property] ||
    styles.getPropertyValue(property)
  );
}

/**
 * Returns a Coordinate object relative to the top-left of the HTML document.
 * Similar to Closure's goog.style.getPageOffset
 *
 * @param el Element to get the page offset for.
 * @returns The page offset.
 */
export function getPageOffset(el: Element): Coordinate {
  const pos = new Coordinate(0, 0);
  const box = el.getBoundingClientRect();
  const documentElement = document.documentElement;
  // Must add the scroll coordinates in to get the absolute page offset
  // of element since getBoundingClientRect returns relative coordinates to
  // the viewport.
  const scrollCoord = new Coordinate(
    window.pageXOffset || documentElement.scrollLeft,
    window.pageYOffset || documentElement.scrollTop,
  );
  pos.x = box.left + scrollCoord.x;
  pos.y = box.top + scrollCoord.y;

  return pos;
}

/**
 * Calculates the viewport coordinates relative to the document.
 * Similar to Closure's goog.style.getViewportPageOffset
 *
 * @returns The page offset of the viewport.
 */
export function getViewportPageOffset(): Coordinate {
  const body = document.body;
  const documentElement = document.documentElement;
  const scrollLeft = body.scrollLeft || documentElement.scrollLeft;
  const scrollTop = body.scrollTop || documentElement.scrollTop;
  return new Coordinate(scrollLeft, scrollTop);
}

/**
 * Gets the computed border widths (on all sides) in pixels
 * Copied from Closure's goog.style.getBorderBox
 *
 * @param element  The element to get the border widths for.
 * @returns The computed border widths.
 */
export function getBorderBox(element: Element): Rect {
  const left = parseFloat(getComputedStyle(element, 'borderLeftWidth'));
  const right = parseFloat(getComputedStyle(element, 'borderRightWidth'));
  const top = parseFloat(getComputedStyle(element, 'borderTopWidth'));
  const bottom = parseFloat(getComputedStyle(element, 'borderBottomWidth'));

  return new Rect(top, bottom, left, right);
}

/**
 * Changes the scroll position of `container` with the minimum amount so
 * that the content and the borders of the given `element` become visible.
 * If the element is bigger than the container, its top left corner will be
 * aligned as close to the container's top left corner as possible.
 * Copied from Closure's goog.style.scrollIntoContainerView
 *
 * @param element The element to make visible.
 * @param container The container to scroll. If not set, then the document
 *     scroll element will be used.
 * @param opt_center Whether to center the element in the container.
 *     Defaults to false.
 */
export function scrollIntoContainerView(
  element: Element,
  container: Element,
  opt_center?: boolean,
) {
  const offset = getContainerOffsetToScrollInto(element, container, opt_center);
  container.scrollLeft = offset.x;
  container.scrollTop = offset.y;
}

/**
 * Calculate the scroll position of `container` with the minimum amount so
 * that the content and the borders of the given `element` become visible.
 * If the element is bigger than the container, its top left corner will be
 * aligned as close to the container's top left corner as possible.
 * Copied from Closure's goog.style.getContainerOffsetToScrollInto
 *
 * @param element The element to make visible.
 * @param container The container to scroll. If not set, then the document
 *     scroll element will be used.
 * @param opt_center Whether to center the element in the container.
 *     Defaults to false.
 * @returns The new scroll position of the container.
 */
export function getContainerOffsetToScrollInto(
  element: Element,
  container: Element,
  opt_center?: boolean,
): Coordinate {
  // Absolute position of the element's border's top left corner.
  const elementPos = getPageOffset(element);
  // Absolute position of the container's border's top left corner.
  const containerPos = getPageOffset(container);
  const containerBorder = getBorderBox(container);
  // Relative pos. of the element's border box to the container's content box.
  const relX = elementPos.x - containerPos.x - containerBorder.left;
  const relY = elementPos.y - containerPos.y - containerBorder.top;
  // How much the element can move in the container, i.e. the difference between
  // the element's bottom-right-most and top-left-most position where it's
  // fully visible.
  const elementSize = getSizeWithDisplay(element);
  const spaceX = container.clientWidth - elementSize.width;
  const spaceY = container.clientHeight - elementSize.height;
  let scrollLeft = container.scrollLeft;
  let scrollTop = container.scrollTop;
  if (opt_center) {
    // All browsers round non-integer scroll positions down.
    scrollLeft += relX - spaceX / 2;
    scrollTop += relY - spaceY / 2;
  } else {
    // This formula was designed to give the correct scroll values in the
    // following cases:
    // - element is higher than container (spaceY < 0) => scroll down by relY
    // - element is not higher that container (spaceY >= 0):
    //   - it is above container (relY < 0) => scroll up by abs(relY)
    //   - it is below container (relY > spaceY) => scroll down by relY - spaceY
    //   - it is in the container => don't scroll
    scrollLeft += Math.min(relX, Math.max(relX - spaceX, 0));
    scrollTop += Math.min(relY, Math.max(relY - spaceY, 0));
  }
  return new Coordinate(scrollLeft, scrollTop);
}

export const TEST_ONLY = {
  getSizeInternal,
};
