/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {IFocusableNode} from './blockly.js';
import type {IFlyout} from './interfaces/i_flyout.js';
import {FlyoutButtonNavigationPolicy} from './keyboard_nav/flyout_button_navigation_policy.js';
import {FlyoutNavigationPolicy} from './keyboard_nav/flyout_navigation_policy.js';
import {FlyoutSeparatorNavigationPolicy} from './keyboard_nav/flyout_separator_navigation_policy.js';
import {NavigationDirection, Navigator} from './navigator.js';

/**
 * Navigator that handles keyboard navigation within a flyout.
 */
export class FlyoutNavigator extends Navigator {
  constructor(protected flyout: IFlyout) {
    super();
    this.rules.push(
      new FlyoutButtonNavigationPolicy(),
      new FlyoutSeparatorNavigationPolicy(),
    );
    this.rules = this.rules.map(
      (rule) => new FlyoutNavigationPolicy(rule, flyout),
    );
  }

  /**
   * Returns the toolbox when navigating to the left in a flyout.
   */
  override getOutNode(): IFocusableNode | null {
    const toolbox = this.flyout.targetWorkspace?.getToolbox();
    if (toolbox) return toolbox.getSelectedItem();

    return null;
  }

  /**
   * Returns a function used to validate navigation candidates. Always allows
   * up/down navigation, never allows left/right.
   */
  override getValidationFunction(direction: NavigationDirection) {
    if (
      direction === NavigationDirection.NEXT ||
      direction === NavigationDirection.PREVIOUS
    ) {
      return () => true;
    } else {
      return () => false;
    }
  }
}
