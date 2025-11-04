/**
 * @license
 * Copyright 2016 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.Touch

import type {Gesture} from './gesture.js';

/** Length in ms for a touch to become a long press. */
const LONGPRESS = 750;

/**
 * Whether touch is enabled in the browser.
 * Copied from Closure's goog.events.BrowserFeature.TOUCH_ENABLED
 */
export const TOUCH_ENABLED =
  'ontouchstart' in globalThis ||
  !!(
    globalThis['document'] &&
    document.documentElement &&
    'ontouchstart' in document.documentElement
  ) || // IE10 uses non-standard touch events,
  // so it has a different check.
  !!(
    globalThis['navigator'] &&
    (globalThis['navigator']['maxTouchPoints'] ||
      (globalThis['navigator'] as any)['msMaxTouchPoints'])
  );

/** Which touch events are we currently paying attention to? */
let touchIdentifier_: string | null = null;

/**
 * The TOUCH_MAP lookup dictionary specifies additional touch events to fire,
 * in conjunction with mouse events.
 */
export const TOUCH_MAP: {[key: string]: string[]} = {
  'mousedown': ['pointerdown'],
  'mouseenter': ['pointerenter'],
  'mouseleave': ['pointerleave'],
  'mousemove': ['pointermove'],
  'mouseout': ['pointerout'],
  'mouseover': ['pointerover'],
  'mouseup': ['pointerup', 'pointercancel'],
  'touchend': ['pointerup'],
  'touchcancel': ['pointercancel'],
};

/** PID of queued long-press task. */
let longPid_: AnyDuringMigration = 0;

/**
 * Context menus on touch devices are activated using a long-press.
 * Unfortunately the contextmenu touch event is currently (2015) only supported
 * by Chrome.  This function is fired on any touchstart event, queues a task,
 * which after about a second opens the context menu.  The tasks is killed
 * if the touch event terminates early.
 *
 * @param e Touch start event.
 * @param gesture The gesture that triggered this longStart.
 * @internal
 */
export function longStart(e: PointerEvent, gesture: Gesture) {
  longStop();
  longPid_ = setTimeout(function () {
    // Let the gesture route the right-click correctly.
    if (gesture) {
      gesture.handleRightClick(e);
    }
  }, LONGPRESS);
}

/**
 * Nope, that's not a long-press.  Either touchend or touchcancel was fired,
 * or a drag hath begun.  Kill the queued long-press task.
 *
 * @internal
 */
export function longStop() {
  if (longPid_) {
    clearTimeout(longPid_);
    longPid_ = 0;
  }
}

/**
 * Clear the touch identifier that tracks which touch stream to pay attention
 * to.  This ends the current drag/gesture and allows other pointers to be
 * captured.
 */
export function clearTouchIdentifier() {
  touchIdentifier_ = null;
}

/**
 * Decide whether Blockly should handle or ignore this event.
 * Mouse and touch events require special checks because we only want to deal
 * with one touch stream at a time.  All other events should always be handled.
 *
 * @param e The event to check.
 * @returns True if this event should be passed through to the registered
 *     handler; false if it should be blocked.
 */
export function shouldHandleEvent(e: Event): boolean {
  // Do not replace the startsWith with a check for `instanceof PointerEvent`.
  // `click` and `contextmenu` are PointerEvents in some browsers,
  // despite not starting with `pointer`, but we want to always handle them
  // without worrying about touch identifiers.
  return (
    !e.type.startsWith('pointer') ||
    (e instanceof PointerEvent && checkTouchIdentifier(e))
  );
}

/**
 * Get the pointer identifier from the given event.
 *
 * @param e Pointer event.
 * @returns The pointerId of the event.
 */
export function getTouchIdentifierFromEvent(e: PointerEvent): string {
  return `${e.pointerId}`;
}

/**
 * Check whether the pointer identifier on the event matches the current saved
 * identifier. If the current identifier was unset, save the identifier from
 * the event. This starts a drag/gesture, during which pointer events with
 * other identifiers will be silently ignored.
 *
 * @param e Pointer event.
 * @returns Whether the identifier on the event matches the current saved
 *     identifier.
 */
export function checkTouchIdentifier(e: PointerEvent): boolean {
  const identifier = getTouchIdentifierFromEvent(e);

  if (touchIdentifier_) {
    // We're already tracking some touch/mouse event.  Is this from the same
    // source?
    return touchIdentifier_ === identifier;
  }
  if (e.type === 'pointerdown') {
    // No identifier set yet, and this is the start of a drag.  Set it and
    // return.
    touchIdentifier_ = identifier;
    return true;
  }
  // There was no identifier yet, but this wasn't a start event so we're going
  // to ignore it.  This probably means that another drag finished while this
  // pointer was down.
  return false;
}
