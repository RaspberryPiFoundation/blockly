/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.Mutator

import type {BlockSvg} from '../block_svg.js';
import type {BlocklyOptions} from '../blockly_options.js';
import {MiniWorkspaceBubble} from '../bubbles/mini_workspace_bubble.js';
import type {Abstract} from '../events/events_abstract.js';
import {BlockChange} from '../events/events_block_change.js';
import {isBlockChange, isBlockCreate} from '../events/predicates.js';
import {EventType} from '../events/type.js';
import * as eventUtils from '../events/utils.js';
import type {IHasBubble} from '../interfaces/i_has_bubble.js';
import * as renderManagement from '../render_management.js';
import {Coordinate} from '../utils/coordinate.js';
import * as dom from '../utils/dom.js';
import {Rect} from '../utils/rect.js';
import {Size} from '../utils/size.js';
import {Svg} from '../utils/svg.js';
import type {WorkspaceSvg} from '../workspace_svg.js';
import {Icon} from './icon.js';
import {IconType} from './icon_types.js';

/** The size of the mutator icon in workspace-scale units. */
const SIZE = 17;

/**
 * The distance between the root block in the mini workspace and that
 * workspace's edges.
 */
const WORKSPACE_MARGIN = 16;

/**
 * An icon that allows the user to change the shape of the block.
 *
 * For example, it could be used to add additional fields or inputs to
 * the block.
 */
export class MutatorIcon extends Icon implements IHasBubble {
  /** The type string used to identify this icon. */
  static readonly TYPE = IconType.MUTATOR;

  /**
   * The weight this icon has relative to other icons. Icons with more positive
   * weight values are rendered farther toward the end of the block.
   */
  static readonly WEIGHT = 1;

  /** The bubble used to show the mini workspace to the user. */
  private miniWorkspaceBubble: MiniWorkspaceBubble | null = null;

  /** The root block in the mini workspace. */
  private rootBlock: BlockSvg | null = null;

  /** The PID tracking updating the workkspace in response to user events. */
  private updateWorkspacePid: ReturnType<typeof setTimeout> | null = null;

  /**
   * The change listener in the main workspace that triggers the saveConnections
   * method when anything in the main workspace changes.
   *
   * Only actually registered to listen for events while the mutator bubble is
   * open.
   */
  private saveConnectionsListener: (() => void) | null = null;

  constructor(
    private readonly flyoutBlockTypes: string[],
    protected readonly sourceBlock: BlockSvg,
  ) {
    super(sourceBlock);
  }

  override getType(): IconType<MutatorIcon> {
    return MutatorIcon.TYPE;
  }

  override initView(pointerdownListener: (e: PointerEvent) => void): void {
    if (this.svgRoot) return; // Already initialized.

    super.initView(pointerdownListener);

    // Square with rounded corners.
    dom.createSvgElement(
      Svg.RECT,
      {
        'class': 'blocklyIconShape',
        'rx': '4',
        'ry': '4',
        'height': '16',
        'width': '16',
      },
      this.svgRoot,
    );
    // Gear teeth.
    dom.createSvgElement(
      Svg.PATH,
      {
        'class': 'blocklyIconSymbol',
        'd':
          'm4.203,7.296 0,1.368 -0.92,0.677 -0.11,0.41 0.9,1.559 0.41,' +
          '0.11 1.043,-0.457 1.187,0.683 0.127,1.134 0.3,0.3 1.8,0 0.3,' +
          '-0.299 0.127,-1.138 1.185,-0.682 1.046,0.458 0.409,-0.11 0.9,' +
          '-1.559 -0.11,-0.41 -0.92,-0.677 0,-1.366 0.92,-0.677 0.11,' +
          '-0.41 -0.9,-1.559 -0.409,-0.109 -1.046,0.458 -1.185,-0.682 ' +
          '-0.127,-1.138 -0.3,-0.299 -1.8,0 -0.3,0.3 -0.126,1.135 -1.187,' +
          '0.682 -1.043,-0.457 -0.41,0.11 -0.899,1.559 0.108,0.409z',
      },
      this.svgRoot,
    );
    // Axle hole.
    dom.createSvgElement(
      Svg.CIRCLE,
      {'class': 'blocklyIconShape', 'r': '2.7', 'cx': '8', 'cy': '8'},
      this.svgRoot,
    );
    dom.addClass(this.svgRoot!, 'blocklyMutatorIcon');
  }

  override dispose(): void {
    super.dispose();
    this.miniWorkspaceBubble?.dispose();
  }

  override getWeight(): number {
    return MutatorIcon.WEIGHT;
  }

  override getSize(): Size {
    return new Size(SIZE, SIZE);
  }

  override applyColour(): void {
    super.applyColour();
    this.miniWorkspaceBubble?.setColour(this.sourceBlock.getColour());
    this.miniWorkspaceBubble?.updateBlockStyles();
  }

  override updateCollapsed(): void {
    super.updateCollapsed();
    if (this.sourceBlock.isCollapsed()) this.setBubbleVisible(false);
  }

  override onLocationChange(blockOrigin: Coordinate): void {
    super.onLocationChange(blockOrigin);
    this.miniWorkspaceBubble?.setAnchorLocation(this.getAnchorLocation());
  }

  override onClick(): void {
    super.onClick();
    if (this.sourceBlock.isEditable()) {
      this.setBubbleVisible(!this.bubbleIsVisible());
    }
  }

  override isClickableInFlyout(): boolean {
    return false;
  }

  bubbleIsVisible(): boolean {
    return !!this.miniWorkspaceBubble;
  }

  async setBubbleVisible(visible: boolean): Promise<void> {
    if (this.bubbleIsVisible() === visible) return;

    await renderManagement.finishQueuedRenders();

    if (visible) {
      this.miniWorkspaceBubble = new MiniWorkspaceBubble(
        this.getMiniWorkspaceConfig(),
        this.sourceBlock.workspace,
        this.getAnchorLocation(),
        this.getBubbleOwnerRect(),
      );
      this.applyColour();
      this.createRootBlock();
      this.addSaveConnectionsListener();
      this.miniWorkspaceBubble?.addWorkspaceChangeListener(
        this.createMiniWorkspaceChangeListener(),
      );
    } else {
      this.miniWorkspaceBubble?.dispose();
      this.miniWorkspaceBubble = null;
      if (this.saveConnectionsListener) {
        this.sourceBlock.workspace.removeChangeListener(
          this.saveConnectionsListener,
        );
      }
      this.saveConnectionsListener = null;
    }

    eventUtils.fire(
      new (eventUtils.get(EventType.BUBBLE_OPEN))(
        this.sourceBlock,
        visible,
        'mutator',
      ),
    );
  }

  /** See IHasBubble.getBubble. */
  getBubble(): MiniWorkspaceBubble | null {
    return this.miniWorkspaceBubble;
  }

  /** @returns the configuration the mini workspace should have. */
  private getMiniWorkspaceConfig() {
    const options: BlocklyOptions = {
      'disable': false,
      'media': this.sourceBlock.workspace.options.pathToMedia,
      'rtl': this.sourceBlock.RTL,
      'renderer': this.sourceBlock.workspace.options.renderer,
      'rendererOverrides':
        this.sourceBlock.workspace.options.rendererOverrides ?? undefined,
    };

    if (this.flyoutBlockTypes.length) {
      options.toolbox = {
        'kind': 'flyoutToolbox',
        'contents': this.flyoutBlockTypes.map((type) => ({
          'kind': 'block',
          'type': type,
        })),
      };
    }

    return options;
  }

  /**
   * @returns the location the bubble should be anchored to.
   *     I.E. the middle of this icon.
   */
  private getAnchorLocation(): Coordinate {
    const midIcon = SIZE / 2;
    return Coordinate.sum(
      this.workspaceLocation,
      new Coordinate(midIcon, midIcon),
    );
  }

  /**
   * @returns the rect the bubble should avoid overlapping.
   *     I.E. the block that owns this icon.
   */
  private getBubbleOwnerRect(): Rect {
    const bbox = this.sourceBlock.getSvgRoot().getBBox();
    return new Rect(bbox.y, bbox.y + bbox.height, bbox.x, bbox.x + bbox.width);
  }

  /** Decomposes the source block to create blocks in the mini workspace. */
  private createRootBlock() {
    if (!this.sourceBlock.decompose) {
      throw new Error(
        'Blocks with mutator icons must include a decompose method',
      );
    }
    this.rootBlock = this.sourceBlock.decompose(
      this.miniWorkspaceBubble!.getWorkspace(),
    )!;

    for (const child of this.rootBlock.getDescendants(false)) {
      child.queueRender();
    }

    this.rootBlock.setMovable(false);
    this.rootBlock.setDeletable(false);

    const flyoutWidth =
      this.miniWorkspaceBubble?.getWorkspace()?.getFlyout()?.getWidth() ?? 0;
    this.rootBlock.moveBy(
      this.rootBlock.RTL ? -(flyoutWidth + WORKSPACE_MARGIN) : WORKSPACE_MARGIN,
      WORKSPACE_MARGIN,
    );
  }

  /** Adds a listen to the source block that triggers saving connections. */
  private addSaveConnectionsListener() {
    if (!this.sourceBlock.saveConnections || !this.rootBlock) return;
    this.saveConnectionsListener = () => {
      if (!this.sourceBlock.saveConnections || !this.rootBlock) return;
      this.sourceBlock.saveConnections(this.rootBlock);
    };
    this.saveConnectionsListener();
    this.sourceBlock.workspace.addChangeListener(this.saveConnectionsListener);
  }

  /**
   * Creates a change listener to add to the mini workspace which recomposes
   * the block.
   */
  private createMiniWorkspaceChangeListener() {
    return (e: Abstract) => {
      if (!MutatorIcon.isIgnorableMutatorEvent(e) && !this.updateWorkspacePid) {
        this.updateWorkspacePid = setTimeout(() => {
          this.updateWorkspacePid = null;
          this.recomposeSourceBlock();
        }, 0);
      }
    };
  }

  /**
   * Returns true if the given event is not one the mutator needs to
   * care about.
   *
   * @internal
   */
  static isIgnorableMutatorEvent(e: Abstract) {
    return (
      e.isUiEvent ||
      isBlockCreate(e) ||
      (isBlockChange(e) && e.element === 'disabled')
    );
  }

  /** Recomposes the source block based on changes to the mini workspace. */
  private recomposeSourceBlock() {
    if (!this.rootBlock) return;
    if (!this.sourceBlock.compose) {
      throw new Error(
        'Blocks with mutator icons must include a compose method',
      );
    }

    const existingGroup = eventUtils.getGroup();
    if (!existingGroup) eventUtils.setGroup(true);

    const oldExtraState = BlockChange.getExtraBlockState_(this.sourceBlock);
    this.sourceBlock.compose(this.rootBlock);
    const newExtraState = BlockChange.getExtraBlockState_(this.sourceBlock);

    if (oldExtraState !== newExtraState) {
      eventUtils.fire(
        new (eventUtils.get(EventType.BLOCK_CHANGE))(
          this.sourceBlock,
          'mutation',
          null,
          oldExtraState,
          newExtraState,
        ),
      );
    }

    eventUtils.setGroup(existingGroup);
  }

  /**
   * @returns The workspace of the mini workspace bubble, if the bubble is
   *     currently open.
   */
  getWorkspace(): WorkspaceSvg | undefined {
    return this.miniWorkspaceBubble?.getWorkspace();
  }
}
