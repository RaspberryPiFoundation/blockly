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
export enum LivePriority {
  // This information has the highest priority and assistive technologies
  // SHOULD notify the user immediately. Because an interruption may disorient
  // users or cause them to not complete their current task, authors SHOULD NOT
  // use the assertive value unless the interruption is imperative.
  ASSERTIVE = 'assertive',
  // Updates to the region will not be presented to the user unless the
  // assistive teechnology is currently focused on that region.
  OFF = 'off',
  // (Background change) Assistive technologies SHOULD announce the updates at
  // the next graceful opportunity, such as at the end of speaking the current
  // sentence or when the users pauses typing.
  POLITE = 'polite',
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

/**
 * ARIA states and properties.
 * Copied from Closure's goog.a11y.aria.State
 */
export enum State {
  // ARIA property for setting the currently active descendant of an element,
  // for example the selected item in a list box. Value: ID of an element.
  ACTIVEDESCENDANT = 'activedescendant',
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
 * Sets the role of an element.
 *
 * Similar to Closure's goog.a11y.aria
 *
 * @param element DOM node to set role of.
 * @param roleName Role name.
 */
export function setRole(element: Element, roleName: Role | null) {
  if (roleName) {
    element.setAttribute(ROLE_ATTRIBUTE, roleName);
  } else {
    element.removeAttribute(ROLE_ATTRIBUTE);
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

/**
 * Creates the centralized ARIA live region used to announce dynamic state
 * changes to screen readers. This live region is visually hidden but exposed to
 * assistive technologies.
 *
 * Only one live region should exist per Blockly injection. This function should
 * be called during workspace/injection setup to create the region inside the
 * Blockly container.
 *
 * See: https://stackoverflow.com/a/48590836 for a reference.
 *
 * @param container The container element to which the live region will be
 *     appended.
 */
export function createLiveRegion(container: HTMLDivElement) {
  const ariaAnnouncementDiv = document.createElement('div');
  ariaAnnouncementDiv.textContent = '';
  ariaAnnouncementDiv.id = 'blocklyAriaAnnounce';
  dom.addClass(ariaAnnouncementDiv, 'hiddenForAria');
  setState(ariaAnnouncementDiv, State.LIVE, LivePriority.POLITE);
  container.appendChild(ariaAnnouncementDiv);
}

let ariaAnnounceTimeout: ReturnType<typeof setTimeout>;
let addBreakingSpace = false;

/**
 * Requests that the specified text be announced to the user via a centrally
 * managed ARIA live region, if a screen reader is active.
 *
 * Announcements are scheduled asynchronously. If this function is called again
 * before a pending announcement is inserted into the live region, the pending
 * announcement is canceled and replaced with the new one.
 *
 * The live region element must have id `blocklyAriaAnnounce`. Its `aria-live`
 * politeness setting and optional `role` are updated before the message is
 * inserted so screen readers announce the content correctly.
 *
 * A non-breaking space is alternated at the end of the message to ensure that
 * repeated messages are still announced by screen readers.
 *
 * Callers should use this judiciously. Over-announcing can reduce usability,
 * so this should primarily be used for dynamic states or information that
 * cannot be conveyed through standard ARIA semantics.
 *
 * @param text The text to announce to the user.
 * @param options Configuration options for the announcement.
 * @param options.assertiveness The ARIA live region priority
 * @param options.role Optional ARIA role to apply to the live region before
 */
export function announceDynamicAriaState(
  text: string,
  options: {
    assertiveness: LivePriority;
    role: Role | null;
  } = {
    assertiveness: LivePriority.POLITE,
    role: null,
  },
) {
  const ariaAnnouncementContainer = document.getElementById(
    'blocklyAriaAnnounce',
  );
  if (!ariaAnnouncementContainer) {
    throw new Error('Expected element with id blocklyAriaAnnounce to exist.');
  }
  const {assertiveness, role} = options;

  // Clear previous content.
  ariaAnnouncementContainer.replaceChildren();
  setState(ariaAnnouncementContainer, State.LIVE, assertiveness);

  clearTimeout(ariaAnnounceTimeout);
  ariaAnnounceTimeout = setTimeout(() => {
    setRole(ariaAnnouncementContainer, role);
    const p = document.createElement('p');
    p.textContent = text + (addBreakingSpace ? '\u00A0' : '');
    addBreakingSpace = !addBreakingSpace;
    ariaAnnouncementContainer.appendChild(p);
  }, 10);
}
