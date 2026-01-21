/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {BlockSvg} from './block_svg.js';
import * as browserEvents from './browser_events.js';
import * as common from './common.js';
import {MANUALLY_DISABLED} from './constants.js';
import type {Abstract as AbstractEvent} from './events/events_abstract.js';
import {EventType} from './events/type.js';
import {FlyoutItem} from './flyout_item.js';
import type {IFlyout} from './interfaces/i_flyout.js';
import type {IFlyoutInflater} from './interfaces/i_flyout_inflater.js';
import * as registry from './registry.js';
import * as blocks from './serialization/blocks.js';
import type {BlockInfo} from './utils/toolbox.js';
import * as utilsXml from './utils/xml.js';
import type {WorkspaceSvg} from './workspace_svg.js';
import * as Xml from './xml.js';

/**
 * The language-neutral ID for when the reason why a block is disabled is
 * because the workspace is at block capacity.
 */
const WORKSPACE_AT_BLOCK_CAPACITY_DISABLED_REASON =
  'WORKSPACE_AT_BLOCK_CAPACITY';

const BLOCK_TYPE = 'block';

/**
 * Class responsible for creating blocks for flyouts.
 */
export class BlockFlyoutInflater implements IFlyoutInflater {
  protected permanentlyDisabledBlocks = new Set<BlockSvg>();
  protected listeners = new Map<string, browserEvents.Data[]>();
  protected flyout?: IFlyout;
  private capacityWrapper: (event: AbstractEvent) => void;

  /**
   * Creates a new BlockFlyoutInflater instance.
   */
  constructor() {
    this.capacityWrapper = this.filterFlyoutBasedOnCapacity.bind(this);
  }

  /**
   * Inflates a flyout block from the given state and adds it to the flyout.
   *
   * @param state A JSON representation of a flyout block.
   * @param flyout The flyout to create the block on.
   * @returns A newly created block.
   */
  load(state: object, flyout: IFlyout): FlyoutItem {
    this.setFlyout(flyout);
    const block = this.createBlock(state as BlockInfo, flyout.getWorkspace());

    if (!block.isEnabled()) {
      // Record blocks that were initially disabled.
      // Do not enable these blocks as a result of capacity filtering.
      this.permanentlyDisabledBlocks.add(block);
    } else {
      this.updateStateBasedOnCapacity(block);
    }

    // Mark blocks as being inside a flyout.  This is used to detect and
    // prevent the closure of the flyout if the user right-clicks on such
    // a block.
    block.getDescendants(false).forEach((b) => (b.isInFlyout = true));
    this.addBlockListeners(block);

    return new FlyoutItem(block, BLOCK_TYPE);
  }

  /**
   * Creates a block on the given workspace.
   *
   * @param blockDefinition A JSON representation of the block to create.
   * @param workspace The workspace to create the block on.
   * @returns The newly created block.
   */
  createBlock(blockDefinition: BlockInfo, workspace: WorkspaceSvg): BlockSvg {
    let block;
    if (blockDefinition['blockxml']) {
      const xml = (
        typeof blockDefinition['blockxml'] === 'string'
          ? utilsXml.textToDom(blockDefinition['blockxml'])
          : blockDefinition['blockxml']
      ) as Element;
      block = Xml.domToBlockInternal(xml, workspace);
    } else {
      if (blockDefinition['enabled'] === undefined) {
        blockDefinition['enabled'] =
          blockDefinition['disabled'] !== 'true' &&
          blockDefinition['disabled'] !== true;
      }
      if (
        blockDefinition['disabledReasons'] === undefined &&
        blockDefinition['enabled'] === false
      ) {
        blockDefinition['disabledReasons'] = [MANUALLY_DISABLED];
      }
      // These fields used to be allowed and may still be present, but are
      // ignored here since everything in the flyout should always be laid out
      // linearly.
      if ('x' in blockDefinition) {
        delete blockDefinition['x'];
      }
      if ('y' in blockDefinition) {
        delete blockDefinition['y'];
      }
      block = blocks.appendInternal(blockDefinition as blocks.State, workspace);
    }

    return block as BlockSvg;
  }

  /**
   * Returns the amount of space that should follow this block.
   *
   * @param state A JSON representation of a flyout block.
   * @param defaultGap The default spacing for flyout items.
   * @returns The amount of space that should follow this block.
   */
  gapForItem(state: object, defaultGap: number): number {
    const blockState = state as BlockInfo;
    let gap;
    if (blockState['gap']) {
      gap = parseInt(String(blockState['gap']));
    } else if (blockState['blockxml']) {
      const xml = (
        typeof blockState['blockxml'] === 'string'
          ? utilsXml.textToDom(blockState['blockxml'])
          : blockState['blockxml']
      ) as Element;
      gap = parseInt(xml.getAttribute('gap')!);
    }

    return !gap || isNaN(gap) ? defaultGap : gap;
  }

  /**
   * Disposes of the given block.
   *
   * @param item The flyout block to dispose of.
   */
  disposeItem(item: FlyoutItem): void {
    const element = item.getElement();
    if (!(element instanceof BlockSvg)) return;
    this.removeListeners(element.id);
    element.dispose(false, false);
  }

  /**
   * Removes event listeners for the block with the given ID.
   *
   * @param blockId The ID of the block to remove event listeners from.
   */
  protected removeListeners(blockId: string) {
    const blockListeners = this.listeners.get(blockId) ?? [];
    blockListeners.forEach((l) => browserEvents.unbind(l));
    this.listeners.delete(blockId);
  }

  /**
   * Updates this inflater's flyout.
   *
   * @param flyout The flyout that owns this inflater.
   */
  protected setFlyout(flyout: IFlyout) {
    if (this.flyout === flyout) return;

    if (this.flyout) {
      this.flyout.targetWorkspace?.removeChangeListener(this.capacityWrapper);
    }
    this.flyout = flyout;
    this.flyout.targetWorkspace?.addChangeListener(this.capacityWrapper);
  }

  /**
   * Updates the enabled state of the given block based on the capacity of the
   * workspace.
   *
   * @param block The block to update the enabled/disabled state of.
   */
  private updateStateBasedOnCapacity(block: BlockSvg) {
    const enable = this.flyout?.targetWorkspace?.isCapacityAvailable(
      common.getBlockTypeCounts(block),
    );
    let currentBlock: BlockSvg | null = block;
    while (currentBlock) {
      currentBlock.setDisabledReason(
        !enable,
        WORKSPACE_AT_BLOCK_CAPACITY_DISABLED_REASON,
      );
      currentBlock = currentBlock.getNextBlock();
    }
  }

  /**
   * Add listeners to a block that has been added to the flyout.
   *
   * @param block The block to add listeners for.
   */
  protected addBlockListeners(block: BlockSvg) {
    const blockListeners = [];

    blockListeners.push(
      browserEvents.conditionalBind(
        block.getSvgRoot(),
        'pointerdown',
        block,
        (e: PointerEvent) => {
          const gesture = this.flyout?.targetWorkspace?.getGesture(e);
          if (gesture && this.flyout) {
            gesture.setStartBlock(block);
            gesture.handleFlyoutStart(e, this.flyout);
          }
        },
      ),
    );

    blockListeners.push(
      browserEvents.bind(block.getSvgRoot(), 'pointermove', null, () => {
        if (!this.flyout?.targetWorkspace?.isDragging()) {
          block.addSelect();
        }
      }),
    );
    blockListeners.push(
      browserEvents.bind(block.getSvgRoot(), 'pointerleave', null, () => {
        if (!this.flyout?.targetWorkspace?.isDragging()) {
          block.removeSelect();
        }
      }),
    );

    this.listeners.set(block.id, blockListeners);
  }

  /**
   * Updates the state of blocks in our owning flyout to be disabled/enabled
   * based on the capacity of the workspace for more blocks of that type.
   *
   * @param event The event that triggered this update.
   */
  private filterFlyoutBasedOnCapacity(event: AbstractEvent) {
    if (
      !this.flyout ||
      (event &&
        !(
          event.type === EventType.BLOCK_CREATE ||
          event.type === EventType.BLOCK_DELETE
        ))
    )
      return;

    this.flyout
      .getWorkspace()
      .getTopBlocks(false)
      .forEach((block) => {
        if (!this.permanentlyDisabledBlocks.has(block)) {
          this.updateStateBasedOnCapacity(block);
        }
      });
  }

  /**
   * Returns the type of items this inflater is responsible for creating.
   *
   * @returns An identifier for the type of items this inflater creates.
   */
  getType() {
    return BLOCK_TYPE;
  }
}

registry.register(
  registry.Type.FLYOUT_INFLATER,
  BLOCK_TYPE,
  BlockFlyoutInflater,
);
