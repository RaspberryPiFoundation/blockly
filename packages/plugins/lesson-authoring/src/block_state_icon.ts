/**
 * @license
 * Copyright 2026 Raspberry Pi Foundation
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview An icon showing which of a block's deletable, editable and
 * movable states are turned off, and a per-workspace switch for it.
 */

import * as Blockly from 'blockly/core';
import {drawGlyphRow, getGlyphRowWidth} from './block_state_glyphs';
import type {BlockPermission} from './block_state_change';
import {pickContrastingColour} from './colour_contrast';

/** The size of the icon in workspace-scale units. */
const ICON_HEIGHT = 17;

/** The space between the glyphs and the focus ring, in workspace units. */
const FOCUS_RING_MARGIN = 3;

/**
 * The label for each restriction. Each is a complete phrase that is shown as
 * written, so it can be translated without the code changing its case or
 * combining it into a sentence. TODO: Translate these labels.
 */
const LABELS: Record<BlockPermission, string> = {
  deletable: "Can't delete",
  editable: "Can't edit",
  movable: "Can't move",
};

// Core dims icons until they are hovered or focused, to show they can be
// clicked. This icon can't be clicked, so it is always shown at full opacity.
Blockly.Css.register(`
.blocklyIconGroup.lessonBlockStateIcon:not(:hover):not(:focus) {
  opacity: 1;
}
`);

/**
 * Returns the states that are turned off on a block, in display order. Shadow
 * blocks can never be moved or deleted on their own, so only their editable
 * state is shown.
 *
 * @param block The block to read.
 * @returns The restrictions to show.
 */
function getRestrictions(block: Blockly.Block): BlockPermission[] {
  const restrictions: BlockPermission[] = [];
  if (!block.isShadow() && !block.isOwnDeletable()) {
    restrictions.push('deletable');
  }
  if (!block.isOwnEditable()) restrictions.push('editable');
  if (!block.isShadow() && !block.isOwnMovable()) restrictions.push('movable');
  return restrictions;
}

/**
 * An icon showing a glyph for each of a block's deletable, editable and
 * movable states that is turned off.
 */
export class BlockStateIcon extends Blockly.icons.Icon {
  /** The type of this icon. */
  static readonly TYPE = new Blockly.icons.IconType<BlockStateIcon>(
    'lesson_block_state',
  );

  /** Places this icon after core's mutator, warning and comment icons. */
  static readonly WEIGHT = 4;

  private restrictions: BlockPermission[];

  /**
   * @param sourceBlock The block this icon is attached to.
   * @param restrictions The restrictions to show.
   */
  constructor(sourceBlock: Blockly.Block, restrictions: BlockPermission[]) {
    super(sourceBlock);
    this.restrictions = restrictions;
    this.updateTooltip();
  }

  override getType(): Blockly.icons.IconType<BlockStateIcon> {
    return BlockStateIcon.TYPE;
  }

  override getWeight(): number {
    return BlockStateIcon.WEIGHT;
  }

  override getSize(): Blockly.utils.Size {
    return new Blockly.utils.Size(
      getGlyphRowWidth(this.restrictions.length),
      ICON_HEIGHT,
    );
  }

  override initView(pointerdownListener: (e: PointerEvent) => void): void {
    if (this.svgRoot) return;
    super.initView(pointerdownListener);
    this.getFocusableElement().classList.add('lessonBlockStateIcon');
    this.drawGlyphs();
  }

  override applyColour(): void {
    this.updateGlyphColour();
  }

  /**
   * Updates the glyph colour on every render, as well as when the block's
   * colour is applied. A full-block field repaints the block after its icons'
   * colours are applied, and again whenever its value changes, so the colour
   * the icon sees in applyColour can be out of date.
   *
   * @param offset The icon's position relative to its block's top-start.
   */
  override setOffsetInBlock(offset: Blockly.utils.Coordinate): void {
    super.setOffsetInBlock(offset);
    this.updateGlyphColour();
  }

  /**
   * Draws the glyphs in white, like block text. If the block's is a full-block
   * field, the glyphs sit on that field's background, so they use the block's
   * colour, or black or white if that doesn't stand out against the block's fill.
   */
  private updateGlyphColour() {
    if (!this.svgRoot) return;
    const block = this.sourceBlock as Blockly.BlockSvg;
    const fields = [...block.getFields()];
    const isFullBlockField =
      fields.length === 1 && fields[0].isFullBlockField();
    const background = block.pathObject.svgPath.getAttribute('fill') ?? '';
    this.svgRoot.style.color = isFullBlockField
      ? pickContrastingColour(block.getColour(), background)
      : '#fff';
  }

  /**
   * Changes the restrictions this icon shows.
   *
   * @param restrictions The restrictions to show.
   */
  setRestrictions(restrictions: BlockPermission[]) {
    const sizeChanged = restrictions.length !== this.restrictions.length;
    this.restrictions = restrictions;
    this.updateTooltip();
    if (!this.svgRoot) return;
    this.drawGlyphs();
    this.recomputeAriaContext();
    if (sizeChanged) (this.sourceBlock as Blockly.BlockSvg).queueRender();
  }

  /**
   * Lists the restrictions separated by commas, the way core joins the parts
   * of its own ARIA labels.
   */
  protected override getAriaLabel(): string {
    return this.getLabels().join(', ');
  }

  /** Sets the tooltip to list this icon's restrictions, one per line. */
  private updateTooltip() {
    this.setTooltip(this.getLabels().join('\n'));
  }

  /**
   * Gets the label for each of this icon's restrictions, in display order.
   *
   * @returns The labels.
   */
  private getLabels(): string[] {
    return this.restrictions.map((restriction) => LABELS[restriction]);
  }

  /** Replaces the icon's glyphs with ones for its current restrictions. */
  private drawGlyphs() {
    const svgRoot = this.svgRoot;
    if (!svgRoot) return;
    svgRoot.replaceChildren();
    // Core strokes a focused element's blocklyFocusRing child, as it does for
    // the trashcan and zoom controls. Unfilled, so it shows only when focused,
    // just outside the glyphs.
    const size = this.getSize();
    Blockly.utils.dom.createSvgElement(
      Blockly.utils.Svg.RECT,
      {
        class: 'blocklyFocusRing',
        fill: 'none',
        x: -FOCUS_RING_MARGIN,
        y: -FOCUS_RING_MARGIN,
        width: size.width + 2 * FOCUS_RING_MARGIN,
        height: size.height + 2 * FOCUS_RING_MARGIN,
        rx: FOCUS_RING_MARGIN,
      },
      svgRoot,
    );
    drawGlyphRow(svgRoot, this.restrictions, ICON_HEIGHT);
  }
}

/** The indicators switched on for each workspace. */
const indicatorsByWorkspace = new WeakMap<
  Blockly.Workspace,
  BlockStateIndicators
>();

/**
 * Adds, updates or removes a block's state icon to match its deletable,
 * editable and movable states, if indicators are switched on for its
 * workspace.
 *
 * @param block The block to update.
 */
export function refreshBlockStateIcon(block: Blockly.Block) {
  if (!indicatorsByWorkspace.get(block.workspace)?.isEnabled()) return;
  showBlockStateIcon(block);
}

/**
 * Adds, updates or removes a block's state icon to match its states.
 *
 * @param block The block to update.
 */
function showBlockStateIcon(block: Blockly.Block) {
  if (block.isInFlyout || block.isInsertionMarker()) return;
  const restrictions = getRestrictions(block);
  const icon = block.getIcon(BlockStateIcon.TYPE) as BlockStateIcon | undefined;
  if (!restrictions.length) {
    block.removeIcon(BlockStateIcon.TYPE);
  } else if (icon) {
    icon.setRestrictions(restrictions);
  } else {
    block.addIcon(new BlockStateIcon(block, restrictions));
  }
}

/** Options for {@link BlockStateIndicators}. */
export interface BlockStateIndicatorsOptions {
  /** Whether the indicators start switched on. Defaults to true. */
  enabled?: boolean;
}

/**
 * Shows icons on a workspace's blocks for any deletable, editable or movable
 * state that is turned off, and keeps them up to date as blocks are created
 * and as those states change through the lesson-authoring context menu or
 * undo.
 */
export class BlockStateIndicators {
  private enabled = false;

  /**
   * Adds icons to blocks as they are loaded, pasted or restored.
   *
   * @param event The workspace event.
   */
  private readonly onChange = (event: Blockly.Events.Abstract) => {
    if (event.type !== Blockly.Events.BLOCK_CREATE) return;
    for (const id of (event as Blockly.Events.BlockCreate).ids ?? []) {
      const block = this.workspace.getBlockById(id);
      if (block) showBlockStateIcon(block);
    }
  };

  /**
   * Blocks are found when the indicators are switched on and from their
   * creation events afterwards, so blocks loaded with events disabled are only
   * picked up if the indicators are created after loading.
   *
   * @param workspace The workspace to show indicators on. Replaces any
   *     indicators already created for it.
   * @param options Options for the indicators.
   */
  constructor(
    private readonly workspace: Blockly.Workspace,
    options: BlockStateIndicatorsOptions = {},
  ) {
    indicatorsByWorkspace.get(workspace)?.setEnabled(false);
    indicatorsByWorkspace.set(workspace, this);
    this.setEnabled(options.enabled ?? true);
  }

  /**
   * Returns whether the indicators are switched on.
   *
   * @returns True if the indicators are shown.
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Switches the indicators on or off, adding or removing icons on every
   * block in the workspace.
   *
   * @param enabled True to show the indicators.
   */
  setEnabled(enabled: boolean) {
    if (enabled === this.enabled) return;
    this.enabled = enabled;
    if (enabled) {
      this.workspace.addChangeListener(this.onChange);
      this.workspace.getAllBlocks(false).forEach(showBlockStateIcon);
    } else {
      this.workspace.removeChangeListener(this.onChange);
      this.workspace
        .getAllBlocks(false)
        .forEach((block) => block.removeIcon(BlockStateIcon.TYPE));
    }
  }
}
