/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {FlyoutButton} from './flyout_button.js';
import {FlyoutItem} from './flyout_item.js';
import type {IFlyout} from './interfaces/i_flyout.js';
import type {IFlyoutInflater} from './interfaces/i_flyout_inflater.js';
import * as registry from './registry.js';
import {ButtonOrLabelInfo} from './utils/toolbox.js';
const LABEL_TYPE = 'label';

/**
 * Class responsible for creating labels for flyouts.
 */
export class LabelFlyoutInflater implements IFlyoutInflater {
  /**
   * Inflates a flyout label from the given state and adds it to the flyout.
   *
   * @param state A JSON representation of a flyout label.
   * @param flyout The flyout to create the label on.
   * @returns A FlyoutButton configured as a label.
   */
  load(state: object, flyout: IFlyout): FlyoutItem {
    const label = new FlyoutButton(
      flyout.getWorkspace(),
      flyout.targetWorkspace!,
      state as ButtonOrLabelInfo,
      true,
    );
    label.show();

    return new FlyoutItem(label, LABEL_TYPE);
  }

  /**
   * Returns the amount of space that should follow this label.
   *
   * @param state A JSON representation of a flyout label.
   * @param defaultGap The default spacing for flyout items.
   * @returns The amount of space that should follow this label.
   */
  gapForItem(state: object, defaultGap: number): number {
    return defaultGap;
  }

  /**
   * Disposes of the given label.
   *
   * @param item The flyout label to dispose of.
   */
  disposeItem(item: FlyoutItem): void {
    const element = item.getElement();
    if (element instanceof FlyoutButton) {
      element.dispose();
    }
  }

  /**
   * Returns the type of items this inflater is responsible for creating.
   *
   * @returns An identifier for the type of items this inflater creates.
   */
  getType() {
    return LABEL_TYPE;
  }
}

registry.register(
  registry.Type.FLYOUT_INFLATER,
  LABEL_TYPE,
  LabelFlyoutInflater,
);
