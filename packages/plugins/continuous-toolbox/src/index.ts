/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Continuous-scroll toolbox and flyout that is always open.
 */

import * as Blockly from 'blockly/core';

import {ContinuousCategory} from './ContinuousCategory';
import {ContinuousFlyout} from './ContinuousFlyout';
import type {LabelFlyoutItem} from './ContinuousFlyout';
import {ContinuousMetrics} from './ContinuousMetrics';
import {ContinuousToolbox} from './ContinuousToolbox';
import {RecyclableBlockFlyoutInflater} from './RecyclableBlockFlyoutInflater';

export {
  ContinuousCategory,
  ContinuousFlyout,
  ContinuousMetrics,
  ContinuousToolbox,
  LabelFlyoutItem,
  RecyclableBlockFlyoutInflater,
};

/**
 * Registers the components of the continuous toolbox, replacing Blockly's
 * built-in defaults.
 */
export function registerContinuousToolbox() {
  Blockly.registry.register(
    Blockly.registry.Type.TOOLBOX_ITEM,
    Blockly.ToolboxCategory.registrationName,
    ContinuousCategory,
    true,
  );

  Blockly.registry.register(
    Blockly.registry.Type.METRICS_MANAGER,
    'ContinuousMetrics',
    ContinuousMetrics,
    true,
  );

  Blockly.registry.register(
    Blockly.registry.Type.FLYOUTS_VERTICAL_TOOLBOX,
    'ContinuousFlyout',
    ContinuousFlyout,
    true,
  );

  Blockly.registry.register(
    Blockly.registry.Type.TOOLBOX,
    'ContinuousToolbox',
    ContinuousToolbox,
    true,
  );

  Blockly.registry.register(
    Blockly.registry.Type.FLYOUT_INFLATER,
    'block',
    RecyclableBlockFlyoutInflater,
    true,
  );

  Blockly.Css.register(`
  .categoryBubble {
    margin: 0 auto 0.125rem;
    border-radius: 100%;
    border: 1px solid;
    width: 1.25rem;
    height: 1.25rem;
  }
  .blocklyToolboxCategory {
    height: initial;
    padding: 3px 0;
  }
  .blocklyTreeRowContentContainer {
    display: flex;
    flex-direction: column;
  }
  .blocklyToolboxCategoryLabel {
    margin: auto;
  }
  .blocklyToolboxCategoryLabel {
    text-align: center;
  }
  `);
}
