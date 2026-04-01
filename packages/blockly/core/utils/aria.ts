/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.utils.aria

import * as dom from './dom.js';

/** ARIA states/properties prefix. */
const ARIA_PREFIX = 'aria-';

/** ARIA role attribute. */
const ROLE_ATTRIBUTE = 'role';

/**
 * ARIA state values for LivePriority.
 * Copied from Closure's goog.a11y.aria.LivePriority
 */
export enum LiveRegionAssertiveness {
  // This information has the highest priority and assistive technologies
  // SHOULD notify the user immediately. Because an interruption may disorient
  // users or cause them to not complete their current task, authors SHOULD NOT
  // use the assertive value unless the interruption is imperative.
  ASSERTIVE = 'assertive',
  // Updates to the region will not be presented to the user unless the
  // assistive technology is currently focused on that region.
  OFF = 'off',
  // (Background change) Assistive technologies SHOULD announce the updates at
  // the next graceful opportunity, such as at the end of speaking the current
  // sentence or when the users pauses typing.
  POLITE = 'polite',
}

/**
 * Customization options that can be passed when using `announceDynamicAriaState`.
 */
export interface DynamicAnnouncementOptions {
  /** The custom ARIA `Role` that should be used for the announcement container. */
  role?: Role;

  /**
   * How assertive the announcement should be.
   *
   * Important*: It was found through testing that `ASSERTIVE` announcements are
   * often outright ignored by some screen readers, so it's generally recommended
   * to always use `POLITE` unless specifically tested across supported readers.
   */
  assertiveness?: LiveRegionAssertiveness;
}

/**
 * ARIA role values.
 * Copied from Closure's goog.a11y.aria.Role
 */
export enum Role {
  // ARIA role for an interactive control of tabular data.
  GRID = 'grid',

  // ARIA role for a cell in a grid.
  GRIDCELL = 'gridcell',
  // ARIA role for a group of related elements like tree item siblings.
  GROUP = 'group',

  // ARIA role for a listbox.
  LISTBOX = 'listbox',

  // ARIA role for a popup menu.
  MENU = 'menu',

  // ARIA role for menu item elements.
  MENUITEM = 'menuitem',
  // ARIA role for a checkbox box element inside a menu.
  MENUITEMCHECKBOX = 'menuitemcheckbox',
  // ARIA role for option items that are  children of combobox, listbox, menu,
  // radiogroup, or tree elements.
  OPTION = 'option',
  // ARIA role for ignorable cosmetic elements with no semantic significance.
  PRESENTATION = 'presentation',

  // ARIA role for a row of cells in a grid.
  ROW = 'row',
  // ARIA role for a tree.
  TREE = 'tree',

  // ARIA role for a tree item that sometimes may be expanded or collapsed.
  TREEITEM = 'treeitem',

  // ARIA role for a visual separator in e.g. a menu.
  SEPARATOR = 'separator',

  // ARIA role for a live region providing information.
  STATUS = 'status',
}

const DEFAULT_LIVE_REGION_ROLE = Role.STATUS;

/**
 * ARIA states and properties.
 * Copied from Closure's goog.a11y.aria.State
 */
export enum State {
  // ARIA property for setting the currently active descendant of an element,
  // for example the selected item in a list box. Value: ID of an element.
  ACTIVEDESCENDANT = 'activedescendant',
  // ARIA property that, if true, indicates that all of a changed region should
  // be presented, instead of only parts. Value: one of {true, false}.
  ATOMIC = 'atomic',
  // ARIA property defines the total number of columns in a table, grid, or
  // treegrid.
  // Value: integer.
  COLCOUNT = 'colcount',
  // ARIA state for a disabled item. Value: one of {true, false}.
  DISABLED = 'disabled',

  // ARIA state for setting whether the element like a tree node is expanded.
  // Value: one of {true, false, undefined}.
  EXPANDED = 'expanded',

  // ARIA state indicating that the entered value does not conform. Value:
  // one of {false, true, 'grammar', 'spelling'}
  INVALID = 'invalid',

  // ARIA property that provides a label to override any other text, value, or
  // contents used to describe this element. Value: string.
  LABEL = 'label',
  // ARIA property for setting the element which labels another element.
  // Value: space-separated IDs of elements.
  LABELLEDBY = 'labelledby',

  // ARIA property for setting the level of an element in the hierarchy.
  // Value: integer.
  LEVEL = 'level',
  // ARIA property indicating if the element is horizontal or vertical.
  // Value: one of {'vertical', 'horizontal'}.
  ORIENTATION = 'orientation',

  // ARIA property that defines an element's number of position in a list.
  // Value: integer.
  POSINSET = 'posinset',

  // ARIA property defines the total number of rows in a table, grid, or
  // treegrid.
  // Value: integer.
  ROWCOUNT = 'rowcount',

  // ARIA state for setting the currently selected item in the list.
  // Value: one of {true, false, undefined}.
  SELECTED = 'selected',
  // ARIA property defining the number of items in a list. Value: integer.
  SETSIZE = 'setsize',

  // ARIA property for slider maximum value. Value: number.
  VALUEMAX = 'valuemax',

  // ARIA property for slider minimum value. Value: number.
  VALUEMIN = 'valuemin',

  // ARIA property for live region chattiness.
  // Value: one of {polite, assertive, off}.
  LIVE = 'live',

  // ARIA property for removing elements from the accessibility tree.
  // Value: one of {true, false, undefined}.
  HIDDEN = 'hidden',
}

/**
 * Removes the ARIA role from an element.
 *
 * Similar to Closure's goog.a11y.aria.removeRole
 *
 * @param element DOM element to remove the role from.
 */
export function removeRole(element: Element) {
  element.removeAttribute(ROLE_ATTRIBUTE);
}

/**
 * Sets the ARIA role of an element. If `roleName` is null,
 * the role is removed.
 *
 * Similar to Closure's goog.a11y.aria.setRole
 *
 * @param element DOM node to set role of.
 * @param roleName Role name, or null to remove the role.
 */
export function setRole(element: Element, roleName: Role | null) {
  if (!roleName) {
    console.log('Removing role from element', element, roleName);
    removeRole(element);
  } else {
    element.setAttribute(ROLE_ATTRIBUTE, roleName);
  }
}

/**
 * Sets the state or property of an element.
 * Copied from Closure's goog.a11y.aria
 *
 * @param element DOM node where we set state.
 * @param stateName State attribute being set.
 *     Automatically adds prefix 'aria-' to the state name if the attribute is
 * not an extra attribute.
 * @param value Value for the state attribute.
 */
export function setState(
  element: Element,
  stateName: State,
  value: string | boolean | number | string[],
) {
  if (Array.isArray(value)) {
    value = value.join(' ');
  }
  const attrStateName = ARIA_PREFIX + stateName;
  element.setAttribute(attrStateName, `${value}`);
}

let liveRegionElement: HTMLElement | null = null;

/**
 * Creates an ARIA live region under the specified parent Element to be used
 * for all dynamic announcements via `announceDynamicAriaState`. This must be
 * called only once and before any dynamic announcements can be made.
 *
 * @param parent The container element to which the live region will be appended.
 */
export function initializeGlobalAriaLiveRegion(parent: HTMLDivElement) {
  if (liveRegionElement && document.contains(liveRegionElement)) {
    return;
  }
  const ariaAnnouncementDiv = document.createElement('div');
  ariaAnnouncementDiv.textContent = '';
  ariaAnnouncementDiv.id = 'blocklyAriaAnnounce';
  dom.addClass(ariaAnnouncementDiv, 'hiddenForAria');
  setState(ariaAnnouncementDiv, State.LIVE, LiveRegionAssertiveness.POLITE);
  setRole(ariaAnnouncementDiv, DEFAULT_LIVE_REGION_ROLE);
  setState(ariaAnnouncementDiv, State.ATOMIC, true);
  parent.appendChild(ariaAnnouncementDiv);
  liveRegionElement = ariaAnnouncementDiv;
}

let ariaAnnounceTimeout: ReturnType<typeof setTimeout>;
let addBreakingSpace = false;

/**
 * Requests that the specified text be read to the user if a screen reader is
 * currently active.
 *
 * This relies on a centrally managed ARIA live region that is hidden from the
 * visual DOM. This live region is designed to try and ensure the text is read,
 * including if the same text is issued multiple times consecutively. Note that
 * `initializeGlobalAriaLiveRegion` must be called before this can be used.
 *
 * Callers should use this judiciously. It's often considered bad practice to
 * over-announce information that can be inferred from other sources on the page,
 * so this ought to be used only when certain context cannot be easily determined
 * (such as dynamic states that may not have perfect ARIA representations or
 * indications).
 *
 * @param text The text to read to the user.
 * @param options Custom options to configure the announcement. This defaults to
 *    the status role and polite assertiveness.
 */
export function announceDynamicAriaState(
  text: string,
  options?: DynamicAnnouncementOptions,
) {
  if (!liveRegionElement) {
    throw new Error('ARIA live region not initialized.');
  }
  const ariaAnnouncementContainer = liveRegionElement;
  const {
    assertiveness = LiveRegionAssertiveness.POLITE,
    role = DEFAULT_LIVE_REGION_ROLE,
  } = options || {};

  // We use a short delay so rapid successive calls collapse into a single
  // announcement, and to ensure assistive technologies reliably detect the
  // DOM change.
  clearTimeout(ariaAnnounceTimeout);
  ariaAnnounceTimeout = setTimeout(() => {
    // Clear previous content.
    ariaAnnouncementContainer.replaceChildren();
    setState(ariaAnnouncementContainer, State.LIVE, assertiveness);
    setRole(ariaAnnouncementContainer, role);

    const span = document.createElement('span');
    // The non-breaking space toggle ensures otherwise identical consecutive
    // messages are still announced.
    span.textContent = text + (addBreakingSpace ? '\u00A0' : '');
    addBreakingSpace = !addBreakingSpace;
    ariaAnnouncementContainer.appendChild(span);
  }, 10);
}
