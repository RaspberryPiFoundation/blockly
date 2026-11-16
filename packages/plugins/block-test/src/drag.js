/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
'use strict';

/**
 * @fileoverview Drag test blocks.
 * @author samelh@google.com (Sam El-Husseini)
 */

import * as Blockly from 'blockly/core';

/** Block that duplicates itself on drag. */
Blockly.Blocks['drag_to_dupe'] = {
  init: function () {
    this.setOutput(true, null);
    this.appendDummyInput().appendField('drag to dupe');
    this.setDragStrategy(new DragToDupe(this));

    this.cloningAllowed = true;
    this.isCloningAllowed = () => {
      return this.cloningAllowed && !this.isInFlyout && !this.isShadow();
    };
    this.setCloningAllowed = (/** @type {boolean} */ allowed) => {
      this.cloningAllowed = allowed;
    };
  },
};

/** Drag strategy that duplicates the block on drag. */
class DragToDupe extends Blockly.dragging.BlockDragStrategy {
  /**
   * Creates a new `DragToDupe` drag strategy.
   * @param {!Blockly.BlockSvg} block The block that will be dragged.
   */
  constructor(block) {
    super(block);
    this.draggingBlock = block;
  }

  /**
   * Returns a block instance on which the drag should actually be performed,
   * which may differ from that which we were instantiated with.
   * @returns {!Blockly.BlockSvg} The block to drag.
   */
  getTargetBlock() {
    let targetBlock;

    if (
      'isCloningAllowed' in this.draggingBlock &&
      typeof this.draggingBlock.isCloningAllowed === 'function' &&
      this.draggingBlock.isCloningAllowed()
    ) {
      const json = Blockly.serialization.blocks.save(this.draggingBlock, {
        addCoordinates: true,
      });
      if (json) {
        targetBlock = /** @type {!Blockly.BlockSvg} */ (
          Blockly.serialization.blocks.appendInternal(
            json,
            this.draggingBlock.workspace,
            {
              recordUndo: true,
            },
          )
        );
      }
    }

    targetBlock ??= super.getTargetBlock();
    this.maybeSetCloningAllowed(targetBlock, false);
    return targetBlock;
  }

  /**
   * Handles the end of a drag.
   * @param {!PointerEvent|!KeyboardEvent} event The event that triggered the
   *     end of the drag.
   * @param {Blockly.DragDisposition} disposition How the drag is being ended.
   */
  endDrag(event, disposition) {
    super.endDrag(event, disposition);
    this.maybeSetCloningAllowed(this.draggingBlock, true);

    if (disposition === Blockly.DragDisposition.REVERT) {
      this.draggingBlock.dispose();
    }
  }

  /**
   * Handles a drag being reverted/cancelled.
   */
  revertDrag() {
    super.revertDrag();
    if (
      'isCloningAllowed' in this.draggingBlock &&
      typeof this.draggingBlock.isCloningAllowed === 'function'
    ) {
      this.draggingBlock.dispose();
    }
  }

  /**
   * If supported, sets whether or not cloning the given block is allowed.
   * @param {!Blockly.BlockSvg} block The block to toggle cloning on.
   * @param {boolean} allowed Whether or not cloning should be allowed.
   */
  maybeSetCloningAllowed(block, allowed) {
    if (
      'setCloningAllowed' in block &&
      typeof block.setCloningAllowed === 'function'
    ) {
      block.setCloningAllowed(allowed);
    }
  }
}

/**
 * The Drag category.
 */
export const category = {
  kind: 'CATEGORY',
  name: 'Drag',
  contents: [
    {
      kind: 'LABEL',
      text: 'Drag each to the workspace',
    },
    {
      kind: 'BLOCK',
      blockxml: `
<block type="text_print">
  <value name="TEXT">
    <block type="text">
      <field name="TEXT">Drag me by this child</field>
    </block>
  </value>
</block>`,
    },
    {
      kind: 'BLOCK',
      blockxml: `
<block type="text_print">
  <value name="TEXT">
    <shadow type="text">
      <field name="TEXT">Drag me by this shadow</field>
    </shadow>
  </value>
</block>`,
    },
    {
      kind: 'BLOCK',
      blockxml: `
<block type="text_print">
  <value name="TEXT">
    <shadow type="text">
      <field name="TEXT">Shadow value</field>
    </shadow>
  </value>
  <next>
    <shadow type="text_print">
      <value name="TEXT">
        <shadow type="text">
          <field name="TEXT">Shadow statement</field>
        </shadow>
      </value>
    </shadow>
  </next>
</block>`,
    },
    {
      kind: 'LABEL',
      text: 'Multiple Variable Refs',
    },
    {
      kind: 'BLOCK',
      blockxml: `
<block type="text_print">
  <value name="TEXT">
    <block type="variables_get">
      <field name="VAR" id="item">item</field>
    </block>
  </value>
  <next>
    <block type="text_print">
      <value name="TEXT">
        <block type="variables_get">
          <field name="VAR" id="item">item</field>
        </block>
      </value>
    </block>
  </next>
</block>`,
    },
    {
      kind: 'LABEL',
      text: 'Procedure Definitions',
    },
    {
      kind: 'BLOCK',
      blockxml: `
<block type="procedures_defnoreturn">
  <field name="NAME">without arguments</field>
  <statement name="STACK">
    <block type="text_print">
      <value name="TEXT">
        <shadow type="text">
          <field name="TEXT">No argument reference.</field>
        </shadow>
      </value>
    </block>
  </statement>
</block>`,
    },
    {
      kind: 'BLOCK',
      blockxml: `
<block type="procedures_defnoreturn">
  <mutation><arg name="fnArgument"></arg></mutation>
  <field name="NAME">with one argument</field>
  <statement name="STACK">
    <block type="text_print">
      <value name="TEXT">
        <shadow type="text">
          <field name="TEXT">Expected an argument reference here.</field>
        </shadow>
        <block type="variables_get">
          <field name="VAR">fnArgument</field>
        </block>
      </value>
    </block>
  </statement>
</block>`,
    },
    {
      kind: 'BLOCK',
      type: 'drag_to_dupe',
    },
    {
      kind: 'BLOCK',
      type: 'text_print',
      inputs: {
        TEXT: {
          shadow: {
            type: 'drag_to_dupe',
          },
        },
      },
    },
  ],
};

/**
 * Initialize this toolbox category.
 * @param {!Blockly.WorkspaceSvg} workspace The Blockly workspace.
 */
export function onInit(workspace) {
  // NOP
}
