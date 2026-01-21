/**
 * @license
 * Copyright 2016 Massachusetts Institute of Technology
 * All rights reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * A div that floats on top of the workspace, for drop-down menus.
 *
 * @class
 */
// Former goog.module ID: Blockly.dropDownDiv

import type {BlockSvg} from './block_svg.js';
import * as browserEvents from './browser_events.js';
import * as common from './common.js';
import type {Field} from './field.js';
import {ReturnEphemeralFocus, getFocusManager} from './focus_manager.js';
import * as dom from './utils/dom.js';
import * as math from './utils/math.js';
import {Rect} from './utils/rect.js';
import type {Size} from './utils/size.js';
import * as style from './utils/style.js';
import type {WorkspaceSvg} from './workspace_svg.js';

/**
 * Arrow size in px. Should match the value in CSS
 * (need to position pre-render).
 */
export const ARROW_SIZE = 16;

/**
 * Drop-down border size in px. Should match the value in CSS (need to position
 * the arrow).
 */
export const BORDER_SIZE = 1;

/**
 * Amount the arrow must be kept away from the edges of the main drop-down div,
 * in px.
 */
export const ARROW_HORIZONTAL_PADDING = 12;

/** Amount drop-downs should be padded away from the source, in px. */
export const PADDING_Y = 16;

/** Length of animations in seconds. */
export const ANIMATION_TIME = 0.25;

/**
 * Timer for animation out, to be cleared if we need to immediately hide
 * without disrupting new shows.
 */
let animateOutTimer: ReturnType<typeof setTimeout> | null = null;

/** Callback for when the drop-down is hidden. */
let onHide: (() => void) | null = null;

/** A class name representing the current owner's workspace renderer. */
let renderedClassName = '';

/** A class name representing the current owner's workspace theme. */
let themeClassName = '';

/** The content element. */
let div: HTMLDivElement;

/** The content element. */
let content: HTMLDivElement;

/** The arrow element. */
let arrow: HTMLDivElement;

/**
 * Drop-downs will appear within the bounds of this element if possible.
 * Set in setBoundsElement.
 */
let boundsElement: Element | null = null;

/** The object currently using the drop-down. */
let owner: Field | null = null;

/** Whether the dropdown was positioned to a field or the source block. */
let positionToField: boolean | null = null;

/** Callback to FocusManager to return ephemeral focus when the div closes. */
let returnEphemeralFocus: ReturnEphemeralFocus | null = null;

/** Identifier for shortcut keydown listener used to unbind it. */
let keydownListener: browserEvents.Data | null = null;

/**
 * Dropdown bounds info object used to encapsulate sizing information about a
 * bounding element (bounding box and width/height).
 */
export interface BoundsInfo {
  top: number;
  left: number;
  bottom: number;
  right: number;
  width: number;
  height: number;
}

/** Dropdown position metrics. */
export interface PositionMetrics {
  initialX: number;
  initialY: number;
  finalX: number;
  finalY: number;
  arrowX: number | null;
  arrowY: number | null;
  arrowAtTop: boolean | null;
  arrowVisible: boolean;
}

/**
 * Create and insert the DOM element for this div.
 *
 * @internal
 */
export function createDom() {
  if (document.querySelector('.blocklyDropDownDiv')) {
    return; // Already created.
  }
  div = document.createElement('div');
  div.className = 'blocklyDropDownDiv';
  div.tabIndex = -1;
  const parentDiv = common.getParentContainer() || document.body;
  parentDiv.appendChild(div);

  content = document.createElement('div');
  content.className = 'blocklyDropDownContent';
  div.appendChild(content);

  keydownListener = browserEvents.conditionalBind(
    content,
    'keydown',
    null,
    common.globalShortcutHandler,
  );

  arrow = document.createElement('div');
  arrow.className = 'blocklyDropDownArrow';
  div.appendChild(arrow);

  div.style.opacity = '0';
  // Transition animation for transform: translate() and opacity.
  div.style.transition =
    'transform ' + ANIMATION_TIME + 's, ' + 'opacity ' + ANIMATION_TIME + 's';
}

/**
 * Set an element to maintain bounds within. Drop-downs will appear
 * within the box of this element if possible.
 *
 * @param boundsElem Element to bind drop-down to.
 */
export function setBoundsElement(boundsElem: Element | null) {
  boundsElement = boundsElem;
}

/**
 * @returns The field that currently owns this, or null.
 */
export function getOwner(): Field | null {
  return owner;
}

/**
 * Provide the div for inserting content into the drop-down.
 *
 * @returns Div to populate with content.
 */
export function getContentDiv(): HTMLDivElement {
  return content;
}

/** Clear the content of the drop-down. */
export function clearContent() {
  if (keydownListener) {
    browserEvents.unbind(keydownListener);
    keydownListener = null;
  }
  div.remove();
  createDom();
}

/**
 * Set the colour for the drop-down.
 *
 * @param backgroundColour Any CSS colour for the background.
 * @param borderColour Any CSS colour for the border.
 */
export function setColour(backgroundColour: string, borderColour: string) {
  div.style.backgroundColor = backgroundColour;
  div.style.borderColor = borderColour;
}

/**
 * Shortcut to show and place the drop-down with positioning determined
 * by a particular block. The primary position will be below the block,
 * and the secondary position above the block. Drop-down will be
 * constrained to the block's workspace.
 *
 * @param field The field showing the drop-down.
 * @param block Block to position the drop-down around.
 * @param opt_onHide Optional callback for when the drop-down is hidden.
 * @param opt_secondaryYOffset Optional Y offset for above-block positioning.
 * @param manageEphemeralFocus Whether ephemeral focus should be managed
 *     according to the drop-down div's lifetime. Note that if a false value is
 *     passed in here then callers should manage ephemeral focus directly
 *     otherwise focus may not properly restore when the widget closes. Defaults
 *     to true.
 * @returns True if the menu rendered below block; false if above.
 */
export function showPositionedByBlock<T>(
  field: Field<T>,
  block: BlockSvg,
  opt_onHide?: () => void,
  opt_secondaryYOffset?: number,
  manageEphemeralFocus: boolean = true,
): boolean {
  return showPositionedByRect(
    getScaledBboxOfBlock(block),
    field as Field,
    manageEphemeralFocus,
    opt_onHide,
    opt_secondaryYOffset,
  );
}

/**
 * Shortcut to show and place the drop-down with positioning determined
 * by a particular field. The primary position will be below the field,
 * and the secondary position above the field. Drop-down will be
 * constrained to the block's workspace.
 *
 * @param field The field to position the dropdown against.
 * @param opt_onHide Optional callback for when the drop-down is hidden.
 * @param opt_secondaryYOffset Optional Y offset for above-block positioning.
 * @param manageEphemeralFocus Whether ephemeral focus should be managed
 *     according to the drop-down div's lifetime. Note that if a false value is
 *     passed in here then callers should manage ephemeral focus directly
 *     otherwise focus may not properly restore when the widget closes. Defaults
 *     to true.
 * @returns True if the menu rendered below block; false if above.
 */
export function showPositionedByField<T>(
  field: Field<T>,
  opt_onHide?: () => void,
  opt_secondaryYOffset?: number,
  manageEphemeralFocus: boolean = true,
): boolean {
  positionToField = true;
  return showPositionedByRect(
    getScaledBboxOfField(field as Field),
    field as Field,
    manageEphemeralFocus,
    opt_onHide,
    opt_secondaryYOffset,
  );
}
/**
 * Get the scaled bounding box of a block.
 *
 * @param block The block.
 * @returns The scaled bounding box of the block.
 */
function getScaledBboxOfBlock(block: BlockSvg): Rect {
  const blockSvg = block.getSvgRoot();
  const scale = block.workspace.scale;
  const scaledHeight = block.height * scale;
  const scaledWidth = block.width * scale;
  const xy = style.getPageOffset(blockSvg);
  return new Rect(xy.y, xy.y + scaledHeight, xy.x, xy.x + scaledWidth);
}

/**
 * Get the scaled bounding box of a field.
 *
 * @param field The field.
 * @returns The scaled bounding box of the field.
 */
function getScaledBboxOfField(field: Field): Rect {
  const bBox = field.getScaledBBox();
  return new Rect(bBox.top, bBox.bottom, bBox.left, bBox.right);
}

/**
 * Helper method to show and place the drop-down with positioning determined
 * by a scaled bounding box.  The primary position will be below the rect,
 * and the secondary position above the rect. Drop-down will be constrained to
 * the block's workspace.
 *
 * @param bBox The scaled bounding box.
 * @param field The field to position the dropdown against.
 * @param opt_onHide Optional callback for when the drop-down is hidden.
 * @param opt_secondaryYOffset Optional Y offset for above-block positioning.
 * @param manageEphemeralFocus Whether ephemeral focus should be managed
 *     according to the drop-down div's lifetime. Note that if a false value is
 *     passed in here then callers should manage ephemeral focus directly
 *     otherwise focus may not properly restore when the widget closes.
 * @returns True if the menu rendered below block; false if above.
 */
function showPositionedByRect(
  bBox: Rect,
  field: Field,
  manageEphemeralFocus: boolean,
  opt_onHide?: () => void,
  opt_secondaryYOffset?: number,
): boolean {
  // If we can fit it, render below the block.
  const primaryX = bBox.left + (bBox.right - bBox.left) / 2;
  const primaryY = bBox.bottom;
  // If we can't fit it, render above the entire parent block.
  const secondaryX = primaryX;
  let secondaryY = bBox.top;
  if (opt_secondaryYOffset) {
    secondaryY += opt_secondaryYOffset;
  }
  const sourceBlock = field.getSourceBlock() as BlockSvg;
  // Set bounds to main workspace; show the drop-down.
  let workspace = sourceBlock.workspace;
  while (workspace.options.parentWorkspace) {
    workspace = workspace.options.parentWorkspace;
  }
  setBoundsElement(workspace.getParentSvg().parentNode as Element | null);
  return show(
    field,
    sourceBlock.RTL,
    primaryX,
    primaryY,
    secondaryX,
    secondaryY,
    manageEphemeralFocus,
    opt_onHide,
  );
}

/**
 * Show and place the drop-down.
 * The drop-down is placed with an absolute "origin point" (x, y) - i.e.,
 * the arrow will point at this origin and box will positioned below or above
 * it.  If we can maintain the container bounds at the primary point, the arrow
 * will point there, and the container will be positioned below it.
 * If we can't maintain the container bounds at the primary point, fall-back to
 * the secondary point and position above.
 *
 * @param newOwner The object showing the drop-down
 * @param rtl Right-to-left (true) or left-to-right (false).
 * @param primaryX Desired origin point x, in absolute px.
 * @param primaryY Desired origin point y, in absolute px.
 * @param secondaryX Secondary/alternative origin point x, in absolute px.
 * @param secondaryY Secondary/alternative origin point y, in absolute px.
 * @param opt_onHide Optional callback for when the drop-down is hidden.
 * @param manageEphemeralFocus Whether ephemeral focus should be managed
 *     according to the widget div's lifetime.
 * @returns True if the menu rendered at the primary origin point.
 * @internal
 */
export function show<T>(
  newOwner: Field<T>,
  rtl: boolean,
  primaryX: number,
  primaryY: number,
  secondaryX: number,
  secondaryY: number,
  manageEphemeralFocus: boolean,
  opt_onHide?: () => void,
): boolean {
  owner = newOwner as Field;
  onHide = opt_onHide || null;
  // Set direction.
  div.style.direction = rtl ? 'rtl' : 'ltr';

  const mainWorkspace = common.getMainWorkspace() as WorkspaceSvg;
  renderedClassName = mainWorkspace.getRenderer().getClassName();
  themeClassName = mainWorkspace.getTheme().getClassName();
  dom.addClass(div, renderedClassName);
  dom.addClass(div, themeClassName);

  // When we change `translate` multiple times in close succession,
  // Chrome may choose to wait and apply them all at once.
  // Since we want the translation to initial X, Y to be immediate,
  // and the translation to final X, Y to be animated,
  // we saw problems where both would be applied after animation was turned on,
  // making the dropdown appear to fly in from (0, 0).
  // Using both `left`, `top` for the initial translation and then `translate`
  // for the animated transition to final X, Y is a workaround.
  const atOrigin = positionInternal(primaryX, primaryY, secondaryX, secondaryY);

  // Ephemeral focus must happen after the div is fully visible in order to
  // ensure that it properly receives focus.
  if (manageEphemeralFocus) {
    returnEphemeralFocus = getFocusManager().takeEphemeralFocus(div);
  }

  return atOrigin;
}

const internal = {
  /**
   * Get sizing info about the bounding element.
   *
   * @returns An object containing size information about the bounding element
   *     (bounding box and width/height).
   */
  getBoundsInfo: function (): BoundsInfo {
    const boundPosition = style.getPageOffset(boundsElement as Element);
    const boundSize = style.getSize(boundsElement as Element);

    return {
      left: boundPosition.x,
      right: boundPosition.x + boundSize.width,
      top: boundPosition.y,
      bottom: boundPosition.y + boundSize.height,
      width: boundSize.width,
      height: boundSize.height,
    };
  },

  /**
   * Helper to position the drop-down and the arrow, maintaining bounds.
   * See explanation of origin points in show.
   *
   * @param primaryX Desired origin point x, in absolute px.
   * @param primaryY Desired origin point y, in absolute px.
   * @param secondaryX Secondary/alternative origin point x, in absolute px.
   * @param secondaryY Secondary/alternative origin point y, in absolute px.
   * @returns Various final metrics, including rendered positions for drop-down
   *     and arrow.
   */
  getPositionMetrics: function (
    primaryX: number,
    primaryY: number,
    secondaryX: number,
    secondaryY: number,
  ): PositionMetrics {
    const boundsInfo = internal.getBoundsInfo();
    const divSize = style.getSize(div as Element);

    // Can we fit in-bounds below the target?
    if (primaryY + divSize.height < boundsInfo.bottom) {
      return getPositionBelowMetrics(primaryX, primaryY, boundsInfo, divSize);
    }
    // Can we fit in-bounds above the target?
    if (secondaryY - divSize.height > boundsInfo.top) {
      return getPositionAboveMetrics(
        secondaryX,
        secondaryY,
        boundsInfo,
        divSize,
      );
    }
    // Can we fit outside the workspace bounds (but inside the window)
    // below?
    if (primaryY + divSize.height < document.documentElement.clientHeight) {
      return getPositionBelowMetrics(primaryX, primaryY, boundsInfo, divSize);
    }
    // Can we fit outside the workspace bounds (but inside the window)
    // above?
    if (secondaryY - divSize.height > document.documentElement.clientTop) {
      return getPositionAboveMetrics(
        secondaryX,
        secondaryY,
        boundsInfo,
        divSize,
      );
    }

    // Last resort, render at top of page.
    return getPositionTopOfPageMetrics(primaryX, boundsInfo, divSize);
  },
};

/**
 * Get the metrics for positioning the div below the source.
 *
 * @param primaryX Desired origin point x, in absolute px.
 * @param primaryY Desired origin point y, in absolute px.
 * @param boundsInfo An object containing size information about the bounding
 *     element (bounding box and width/height).
 * @param divSize An object containing information about the size of the
 *     DropDownDiv (width & height).
 * @returns Various final metrics, including rendered positions for drop-down
 *     and arrow.
 */
function getPositionBelowMetrics(
  primaryX: number,
  primaryY: number,
  boundsInfo: BoundsInfo,
  divSize: Size,
): PositionMetrics {
  const xCoords = getPositionX(
    primaryX,
    boundsInfo.left,
    boundsInfo.right,
    divSize.width,
  );

  const arrowY = -(ARROW_SIZE / 2 + BORDER_SIZE);
  const finalY = primaryY + PADDING_Y;

  return {
    initialX: xCoords.divX,
    initialY: primaryY,
    finalX: xCoords.divX, // X position remains constant during animation.
    finalY,
    arrowX: xCoords.arrowX,
    arrowY,
    arrowAtTop: true,
    arrowVisible: true,
  };
}

/**
 * Get the metrics for positioning the div above the source.
 *
 * @param secondaryX Secondary/alternative origin point x, in absolute px.
 * @param secondaryY Secondary/alternative origin point y, in absolute px.
 * @param boundsInfo An object containing size information about the bounding
 *     element (bounding box and width/height).
 * @param divSize An object containing information about the size of the
 *     DropDownDiv (width & height).
 * @returns Various final metrics, including rendered positions for drop-down
 *     and arrow.
 */
function getPositionAboveMetrics(
  secondaryX: number,
  secondaryY: number,
  boundsInfo: BoundsInfo,
  divSize: Size,
): PositionMetrics {
  const xCoords = getPositionX(
    secondaryX,
    boundsInfo.left,
    boundsInfo.right,
    divSize.width,
  );

  const arrowY = divSize.height - BORDER_SIZE * 2 - ARROW_SIZE / 2;
  const finalY = secondaryY - divSize.height - PADDING_Y;
  const initialY = secondaryY - divSize.height; // No padding on Y.

  return {
    initialX: xCoords.divX,
    initialY,
    finalX: xCoords.divX, // X position remains constant during animation.
    finalY,
    arrowX: xCoords.arrowX,
    arrowY,
    arrowAtTop: false,
    arrowVisible: true,
  };
}

/**
 * Get the metrics for positioning the div at the top of the page.
 *
 * @param sourceX Desired origin point x, in absolute px.
 * @param boundsInfo An object containing size information about the bounding
 *     element (bounding box and width/height).
 * @param divSize An object containing information about the size of the
 *     DropDownDiv (width & height).
 * @returns Various final metrics, including rendered positions for drop-down
 *     and arrow.
 */
function getPositionTopOfPageMetrics(
  sourceX: number,
  boundsInfo: BoundsInfo,
  divSize: Size,
): PositionMetrics {
  const xCoords = getPositionX(
    sourceX,
    boundsInfo.left,
    boundsInfo.right,
    divSize.width,
  );

  // No need to provide arrow-specific information because it won't be visible.
  return {
    initialX: xCoords.divX,
    initialY: 0,
    finalX: xCoords.divX, // X position remains constant during animation.
    finalY: 0, // Y position remains constant during animation.
    arrowAtTop: null,
    arrowX: null,
    arrowY: null,
    arrowVisible: false,
  };
}

/**
 * Get the x positions for the left side of the DropDownDiv and the arrow,
 * accounting for the bounds of the workspace.
 *
 * @param sourceX Desired origin point x, in absolute px.
 * @param boundsLeft The left edge of the bounding element, in absolute px.
 * @param boundsRight The right edge of the bounding element, in absolute px.
 * @param divWidth The width of the div in px.
 * @returns An object containing metrics for the x positions of the left side of
 *     the DropDownDiv and the arrow.
 * @internal
 */
export function getPositionX(
  sourceX: number,
  boundsLeft: number,
  boundsRight: number,
  divWidth: number,
): {divX: number; arrowX: number} {
  let divX = sourceX;
  // Offset the topLeft coord so that the dropdowndiv is centered.
  divX -= divWidth / 2;
  // Fit the dropdowndiv within the bounds of the workspace.
  divX = math.clamp(boundsLeft, divX, boundsRight - divWidth);

  let arrowX = sourceX;
  // Offset the arrow coord so that the arrow is centered.
  arrowX -= ARROW_SIZE / 2;
  // Convert the arrow position to be relative to the top left of the div.
  let relativeArrowX = arrowX - divX;
  const horizPadding = ARROW_HORIZONTAL_PADDING;
  // Clamp the arrow position so that it stays attached to the dropdowndiv.
  relativeArrowX = math.clamp(
    horizPadding,
    relativeArrowX,
    divWidth - horizPadding - ARROW_SIZE,
  );

  return {arrowX: relativeArrowX, divX};
}

/**
 * Is the container visible?
 *
 * @returns True if visible.
 */
export function isVisible(): boolean {
  return !!owner;
}

/**
 * Hide the menu only if it is owned by the provided object.
 *
 * @param divOwner Object which must be owning the drop-down to hide.
 * @param opt_withoutAnimation True if we should hide the dropdown without
 *     animating.
 * @returns True if hidden.
 */
export function hideIfOwner<T>(
  divOwner: Field<T>,
  opt_withoutAnimation?: boolean,
): boolean {
  if (owner === divOwner) {
    if (opt_withoutAnimation) {
      hideWithoutAnimation();
    } else {
      hide();
    }
    return true;
  }
  return false;
}

/** Hide the menu, triggering animation. */
export function hide() {
  // Start the animation by setting the translation and fading out.
  // Reset to (initialX, initialY) - i.e., no translation.
  div.style.transform = 'translate(0, 0)';
  div.style.opacity = '0';
  // Finish animation - reset all values to default.
  animateOutTimer = setTimeout(function () {
    hideWithoutAnimation();
  }, ANIMATION_TIME * 1000);
  if (onHide) {
    onHide();
    onHide = null;
  }
}

/** Hide the menu, without animation. */
export function hideWithoutAnimation() {
  if (!isVisible()) {
    return;
  }
  if (animateOutTimer) {
    clearTimeout(animateOutTimer);
  }

  if (onHide) {
    onHide();
    onHide = null;
  }
  clearContent();
  owner = null;

  (common.getMainWorkspace() as WorkspaceSvg).markFocused();

  if (returnEphemeralFocus) {
    returnEphemeralFocus();
    returnEphemeralFocus = null;
  }
}

/**
 * Set the dropdown div's position.
 *
 * @param primaryX Desired origin point x, in absolute px.
 * @param primaryY Desired origin point y, in absolute px.
 * @param secondaryX Secondary/alternative origin point x, in absolute px.
 * @param secondaryY Secondary/alternative origin point y, in absolute px.
 * @returns True if the menu rendered at the primary origin point.
 */
function positionInternal(
  primaryX: number,
  primaryY: number,
  secondaryX: number,
  secondaryY: number,
): boolean {
  const metrics = internal.getPositionMetrics(
    primaryX,
    primaryY,
    secondaryX,
    secondaryY,
  );

  // Update arrow CSS.
  if (metrics.arrowVisible) {
    const x = metrics.arrowX;
    const y = metrics.arrowY;
    const rotation = metrics.arrowAtTop ? 45 : 225;
    arrow.style.display = '';
    arrow.style.transform = `translate(${x}px, ${y}px) rotate(${rotation}deg)`;
    arrow.setAttribute('class', 'blocklyDropDownArrow');
  } else {
    arrow.style.display = 'none';
  }

  const initialX = Math.floor(metrics.initialX);
  const initialY = Math.floor(metrics.initialY);
  const finalX = Math.floor(metrics.finalX);
  const finalY = Math.floor(metrics.finalY);

  // First apply initial translation.
  div.style.left = initialX + 'px';
  div.style.top = initialY + 'px';

  // Show the div.
  div.style.display = 'block';
  div.style.opacity = '1';
  // Add final translate, animated through `transition`.
  // Coordinates are relative to (initialX, initialY),
  // where the drop-down is absolutely positioned.
  const dx = finalX - initialX;
  const dy = finalY - initialY;
  div.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';

  return !!metrics.arrowAtTop;
}

/**
 * Repositions the dropdownDiv on window resize. If it doesn't know how to
 * calculate the new position, it will just hide it instead.
 *
 * @internal
 */
export function repositionForWindowResize() {
  // This condition mainly catches the dropdown div when it is being used as a
  // dropdown.  It is important not to close it in this case because on Android,
  // when a field is focused, the soft keyboard opens triggering a window resize
  // event and we want the dropdown div to stick around so users can type into
  // it.
  if (owner) {
    const block = owner.getSourceBlock() as BlockSvg;
    const bBox = positionToField
      ? getScaledBboxOfField(owner)
      : getScaledBboxOfBlock(block);
    // If we can fit it, render below the block.
    const primaryX = bBox.left + (bBox.right - bBox.left) / 2;
    const primaryY = bBox.bottom;
    // If we can't fit it, render above the entire parent block.
    const secondaryX = primaryX;
    const secondaryY = bBox.top;
    positionInternal(primaryX, primaryY, secondaryX, secondaryY);
  } else {
    hide();
  }
}

export const TEST_ONLY = internal;
