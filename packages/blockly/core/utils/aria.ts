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
 * A valid ARIA role for a Blockly DOM element. See also setRole() and getRole().
 *
 * This should be used instead of directly setting an element's role attribute.
 */
export enum Role {
  /** See https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/application_role. */
  APPLICATION = 'application',
  /** See https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/button_role. */
  BUTTON = 'button',
  /** See https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/checkbox_role. */
  CHECKBOX = 'checkbox',
  /** See https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/dialog_role. */
  DIALOG = 'dialog',
  /** See https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/figure_role. */
  FIGURE = 'figure',
  /** See https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/generic_role. */
  GENERIC = 'generic',
  /** See https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/grid_role. */
  GRID = 'grid',
  /** See https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/gridcell_role. */
  GRIDCELL = 'gridcell',
  /** See https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/group_role. */
  GROUP = 'group',
  /** See https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/list_role. */
  LIST = 'list',
  /** See https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/listbox_role. */
  LISTBOX = 'listbox',
  /** See https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/listitem_role. */
  LISTITEM = 'listitem',
  /** See https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/menu_role. */
  MENU = 'menu',
  /** See https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/menuitem_role. */
  MENUITEM = 'menuitem',
  /** See https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/option_role. */
  OPTION = 'option',
  /** See https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/presentation_role. */
  PRESENTATION = 'presentation',
  /** See https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/region_role. */
  REGION = 'region',
  /** See https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/row_role. */
  ROW = 'row',
  /** See https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/separator_role. */
  SEPARATOR = 'separator',
  /** See https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/status_role. */
  STATUS = 'status',
  /** See https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/textbox_role. */
  TEXTBOX = 'textbox',
  /** See https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/tree_role. */
  TREE = 'tree',
  /** See https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/treeitem_role. */
  TREEITEM = 'treeitem',
}

const DEFAULT_LIVE_REGION_ROLE = Role.STATUS;

/**
 * A possible ARIA attribute state for a Blockly DOM element. See also setState() and getState().
 *
 * This should be used instead of directly setting aria-* attributes on elements.
 */
export enum State {
  /**
   * See https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-activedescendant.
   *
   * Value: ID of a DOM element.
   */
  ACTIVEDESCENDANT = 'activedescendant',
  /**
   * See https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-atomic.
   *
   * Value: one of {true, false}.
   */
  ATOMIC = 'atomic',
  /**
   * See https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-checked.
   *
   * Value: one of {true, false, mixed, undefined}.
   */
  CHECKED = 'checked',
  /**
   * See https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-controls.
   *
   * Value: an array of element IDs.
   */
  CONTROLS = 'controls',
  /**
   * See https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-disabled.
   *
   * Value: one of {true, false}.
   */
  DISABLED = 'disabled',
  /**
   * See https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-expanded.
   *
   * Value: one of {true, false, undefined}.
   */
  EXPANDED = 'expanded',
  /**
   * See https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-haspopup.
   *
   * Value: one of {true, false, menu, listbox, tree, grid, dialog}.
   */
  HASPOPUP = 'haspopup',
  /**
   * See https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-hidden.
   *
   * Value: one of {true, false,undefined}.
   */
  HIDDEN = 'hidden',
  /**
   * See https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-invalid.
   *
   * Value: one of {true, false, grammar, spelling}.
   */
  INVALID = 'invalid',
  /**
   * See https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-label.
   *
   * Value: a string.
   */
  LABEL = 'label',
  /**
   * See https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-labelledby.
   *
   * Value: an array of element IDs.
   */
  LABELLEDBY = 'labelledby',
  /**
   * See https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-level.
   *
   * Value: an integer.
   */
  LEVEL = 'level',
  /**
   * See https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-live.
   *
   * Value: one of {polite, assertive, off}.
   */
  LIVE = 'live',
  /**
   * See https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-roledescription.
   *
   * Value: a string.
   */
  ROLEDESCRIPTION = 'roledescription',
  /**
   * See https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-selected.
   *
   * Value:one of {true, false, undefined}.
   */
  SELECTED = 'selected',
  /**
   * See https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-valuemax.
   *
   * Value: a number representing the maximum allowed value for a range widget.
   */
  VALUEMAX = 'valuemax',
  /**
   * See https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-valuemin.
   *
   * Value: a number representing the minimum allowed value for a range widget.
   */
  VALUEMIN = 'valuemin',
}

/**
 * Used to control how verbose generated a11y labels are.
 */
export enum Verbosity {
  TERSE,
  STANDARD,
  LOQUACIOUS,
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
 * Updates the specific role for the specified element.
 *
 * @param element The element whose ARIA role should be changed.
 * @param roleName The new role for the specified element, or null if its role
 *     should be cleared.
 */
export function setRole(element: Element, roleName: Role | null) {
  if (!roleName) {
    removeRole(element);
  } else {
    element.setAttribute(ROLE_ATTRIBUTE, roleName);
  }
}

/**
 * Returns the ARIA role of the specified element, or null if it either doesn't
 * have a designated role or if that role is unknown.
 *
 * @param element The element from which to retrieve its ARIA role.
 * @returns The ARIA role of the element, or null if undefined or unknown.
 */
export function getRole(element: Element): Role | null {
  const role = element.getAttribute(ROLE_ATTRIBUTE);
  if (role && Object.values(Role).includes(role as Role)) {
    return role as Role;
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
  const attrStateName = ARIA_PREFIX + stateName;
  element.removeAttribute(attrStateName);
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
  const value = element.getAttribute(attrStateName);
  return value ? value : null;
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
