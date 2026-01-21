/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The abstract class for a component that can delete a block or
 * bubble that is dropped on top of it.
 *
 * @class
 */
// Former goog.module ID: Blockly.DeleteArea

import {BlockSvg} from './block_svg.js';
import {DragTarget} from './drag_target.js';
import {isDeletable} from './interfaces/i_deletable.js';
import type {IDeleteArea} from './interfaces/i_delete_area.js';
import type {IDraggable} from './interfaces/i_draggable.js';

/**
 * Abstract class for a component that can delete a block or bubble that is
 * dropped on top of it.
 */
export class DeleteArea extends DragTarget implements IDeleteArea {
  /**
   * Whether the last block or bubble dragged over this delete area would be
   * deleted if dropped on this component.
   * This property is not updated after the block or bubble is deleted.
   */
  protected wouldDelete_ = false;

  /**
   * The unique id for this component that is used to register with the
   * ComponentManager.
   */
  // TODO(b/109816955): remove '!', see go/strict-prop-init-fix.
  override id!: string;

  /**
   * Constructor for DeleteArea. Should not be called directly, only by a
   * subclass.
   */
  constructor() {
    super();
  }

  /**
   * Returns whether the provided block or bubble would be deleted if dropped on
   * this area.
   * This method should check if the element is deletable and is always called
   * before onDragEnter/onDragOver/onDragExit.
   *
   * @param element The block or bubble currently being dragged.
   * @returns Whether the element provided would be deleted if dropped on this
   *     area.
   */
  wouldDelete(element: IDraggable): boolean {
    if (element instanceof BlockSvg) {
      const block = element;
      const couldDeleteBlock = !block.getParent() && block.isDeletable();
      this.updateWouldDelete_(couldDeleteBlock);
    } else {
      this.updateWouldDelete_(isDeletable(element) && element.isDeletable());
    }
    return this.wouldDelete_;
  }

  /**
   * Updates the internal wouldDelete_ state.
   *
   * @param wouldDelete The new value for the wouldDelete state.
   */
  protected updateWouldDelete_(wouldDelete: boolean) {
    this.wouldDelete_ = wouldDelete;
  }
}
