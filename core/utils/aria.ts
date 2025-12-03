/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.utils.aria

/** ARIA states/properties prefix. */
const ARIA_PREFIX = 'aria-';

/** ARIA role attribute. */
const ROLE_ATTRIBUTE = 'role';

/**
 * ARIA role values.
 * Copied from Closure's goog.a11y.aria.Role
 */
export enum Role {
  // ARIA role for a group of related elements like tree item siblings.
  GROUP = 'group',

  // ARIA role for a listbox.
  LISTBOX = 'listbox',

  // ARIA role for a popup menu.
  MENU = 'menu',

  // ARIA role for menu item elements.
  MENUITEM = 'menuitem',
  // ARIA role for option items that are  children of combobox, listbox, menu,
  // radiogroup, or tree elements.
  OPTION = 'option',
  // ARIA role for ignorable cosmetic elements with no semantic significance.
  PRESENTATION = 'presentation',

  // ARIA role for a tree.
  TREE = 'tree',

  // ARIA role for a tree item that sometimes may be expanded or collapsed.
  TREEITEM = 'treeitem',

  // ARIA role for a visual separator in e.g. a menu.
  SEPARATOR = 'separator',

  // ARIA role for a live region providing information.
  STATUS = 'status',

  IMAGE = 'image',
  FIGURE = 'figure',
  BUTTON = 'button',
  CHECKBOX = 'checkbox',
  TEXTBOX = 'textbox',
  COMBOBOX = 'combobox',
  SPINBUTTON = 'spinbutton',
  REGION = 'region',
  GENERIC = 'generic',
}

/**
 * ARIA states and properties.
 * Copied from Closure's goog.a11y.aria.State
 */
export enum State {
  // ARIA property for setting the currently active descendant of an element,
  // for example the selected item in a list box. Value: ID of an element.
  ACTIVEDESCENDANT = 'activedescendant',
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

  // ARIA property that defines an element's number of position in a list.
  // Value: integer.
  POSINSET = 'posinset',

  // ARIA state for setting the currently selected item in the list.
  // Value: one of {true, false, undefined}.
  SELECTED = 'selected',
  // ARIA property defining the number of items in a list. Value: integer.
  SETSIZE = 'setsize',

  // ARIA property for slider maximum value. Value: number.
  VALUEMAX = 'valuemax',

  // ARIA property for slider minimum value. Value: number.
  VALUEMIN = 'valuemin',

  VALUENOW = 'valuenow',

  // ARIA property for live region chattiness.
  // Value: one of {polite, assertive, off}.
  LIVE = 'live',

  // ARIA property for removing elements from the accessibility tree.
  // Value: one of {true, false, undefined}.
  HIDDEN = 'hidden',

  ROLEDESCRIPTION = 'roledescription',
  OWNS = 'owns',
  HASPOPUP = 'haspopup',
  CONTROLS = 'controls',
  CHECKED = 'checked',
}

/**
 * Updates the specific role for the specified element.
 *
 * @param element The element whose ARIA role should be changed.
 * @param roleName The new role for the specified element, or null if its role
 *     should be cleared.
 */
export function setRole(element: Element, roleName: Role | null) {
  if (roleName) {
    element.setAttribute(ROLE_ATTRIBUTE, roleName);
  } else element.removeAttribute(ROLE_ATTRIBUTE);
}

/**
 * Returns the ARIA role of the specified element, or null if it either doesn't
 * have a designated role or if that role is unknown.
 *
 * @param element The element from which to retrieve its ARIA role.
 * @returns The ARIA role of the element, or null if undefined or unknown.
 */
export function getRole(element: Element): Role | null {
  // This is an unsafe cast which is why it needs to be checked to ensure that
  // it references a valid role.
  const currentRoleName = element.getAttribute(ROLE_ATTRIBUTE) as Role;
  if (Object.values(Role).includes(currentRoleName)) {
    return currentRoleName;
  }
  return null;
}

/**
 * Sets the specified ARIA state by its name and value for the specified
 * element.
 *
 * Note that the type of value is not validated against the specific type of
 * state being changed, so it's up to callers to ensure the correct value is
 * used for the given state.
 *
 * @param element The element whose ARIA state may be changed.
 * @param stateName The state to change.
 * @param value The new value to specify for the provided state.
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
 * Clears the specified ARIA state by removing any related attributes from the
 * specified element that have been set using setState().
 *
 * @param element The element whose ARIA state may be changed.
 * @param stateName The state to clear from the provided element.
 */
export function clearState(element: Element, stateName: State) {
  element.removeAttribute(ARIA_PREFIX + stateName);
}

/**
 * Returns a string representation of the specified state for the specified
 * element, or null if it's not defined or specified.
 *
 * Note that an explicit set state of 'null' will return the 'null' string, not
 * the value null.
 *
 * @param element The element whose state is being retrieved.
 * @param stateName The state to retrieve.
 * @returns The string representation of the requested state for the specified
 *     element, or null if not defined.
 */
export function getState(element: Element, stateName: State): string | null {
  const attrStateName = ARIA_PREFIX + stateName;
  return element.getAttribute(attrStateName);
}

/**
 * Assertively requests that the specified text be read to the user if a screen
 * reader is currently active.
 *
 * This relies on a centrally managed ARIA live region that is hidden from the
 * visual DOM. This live region is assertive, meaning it will interrupt other
 * text being read.
 *
 * Callers should use this judiciously. It's often considered bad practice to
 * over-announce information that can be inferred from other sources on the
 * page, so this ought to be used only when certain context cannot be easily
 * determined (such as dynamic states that may not have perfect ARIA
 * representations or indications).
 *
 * @param text The text to read to the user.
 */
export function announceDynamicAriaState(text: string) {
  const ariaAnnouncementSpan = document.getElementById('blocklyAriaAnnounce');
  if (!ariaAnnouncementSpan) {
    throw new Error('Expected element with id blocklyAriaAnnounce to exist.');
  }
  ariaAnnouncementSpan.innerHTML = text;
}
