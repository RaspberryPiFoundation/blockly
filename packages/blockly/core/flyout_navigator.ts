/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {IFlyout} from './interfaces/i_flyout.js';
import {FlyoutButtonNavigationPolicy} from './keyboard_nav/flyout_button_navigation_policy.js';
import {FlyoutNavigationPolicy} from './keyboard_nav/flyout_navigation_policy.js';
import {FlyoutSeparatorNavigationPolicy} from './keyboard_nav/flyout_separator_navigation_policy.js';
import {Navigator} from './navigator.js';

export class FlyoutNavigator extends Navigator {
  constructor(flyout: IFlyout) {
    super();
    this.rules.push(
      new FlyoutButtonNavigationPolicy(),
      new FlyoutSeparatorNavigationPolicy(),
    );
    this.rules = this.rules.map(
      (rule) => new FlyoutNavigationPolicy(rule, flyout),
    );
  }
}
