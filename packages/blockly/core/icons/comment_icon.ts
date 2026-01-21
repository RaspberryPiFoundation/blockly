/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.Comment

import type {Block} from '../block.js';
import type {BlockSvg} from '../block_svg.js';
import {TextInputBubble} from '../bubbles/textinput_bubble.js';
import {EventType} from '../events/type.js';
import * as eventUtils from '../events/utils.js';
import type {IHasBubble} from '../interfaces/i_has_bubble.js';
import type {ISerializable} from '../interfaces/i_serializable.js';
import * as renderManagement from '../render_management.js';
import {Coordinate} from '../utils.js';
import * as dom from '../utils/dom.js';
import {Rect} from '../utils/rect.js';
import {Size} from '../utils/size.js';
import {Svg} from '../utils/svg.js';
import type {WorkspaceSvg} from '../workspace_svg.js';
import {Icon} from './icon.js';
import {IconType} from './icon_types.js';
import * as registry from './registry.js';

/** The size of the comment icon in workspace-scale units. */
const SIZE = 17;

/** The default width in workspace-scale units of the text input bubble. */
const DEFAULT_BUBBLE_WIDTH = 160;

/** The default height in workspace-scale units of the text input bubble. */
const DEFAULT_BUBBLE_HEIGHT = 80;

/**
 * An icon which allows the user to add comment text to a block.
 */
export class CommentIcon extends Icon implements IHasBubble, ISerializable {
  /** The type string used to identify this icon. */
  static readonly TYPE = IconType.COMMENT;

  /**
   * The weight this icon has relative to other icons. Icons with more positive
   * weight values are rendered farther toward the end of the block.
   */
  static readonly WEIGHT = 3;

  /** The bubble used to show comment text to the user. */
  private textInputBubble: TextInputBubble | null = null;

  /** The text of this comment. */
  private text = '';

  /** The size of this comment (which is applied to the editable bubble). */
  private bubbleSize = new Size(DEFAULT_BUBBLE_WIDTH, DEFAULT_BUBBLE_HEIGHT);

  /** The location of the comment bubble in workspace coordinates. */
  private bubbleLocation?: Coordinate;

  /**
   * The visibility of the bubble for this comment.
   *
   * This is used to track what the visible state /should/ be, not necessarily
   * what it currently /is/. E.g. sometimes this will be true, but the block
   * hasn't been rendered yet, so the bubble will not currently be visible.
   */
  private bubbleVisiblity = false;

  constructor(protected readonly sourceBlock: Block) {
    super(sourceBlock);
  }

  override getType(): IconType<CommentIcon> {
    return CommentIcon.TYPE;
  }

  override initView(pointerdownListener: (e: PointerEvent) => void): void {
    if (this.svgRoot) return; // Already initialized.

    super.initView(pointerdownListener);

    // Circle.
    dom.createSvgElement(
      Svg.CIRCLE,
      {'class': 'blocklyIconShape', 'r': '8', 'cx': '8', 'cy': '8'},
      this.svgRoot,
    );
    // Can't use a real '?' text character since different browsers and
    // operating systems render it differently. Body of question mark.
    dom.createSvgElement(
      Svg.PATH,
      {
        'class': 'blocklyIconSymbol',
        'd':
          'm6.8,10h2c0.003,-0.617 0.271,-0.962 0.633,-1.266 2.875,-2.405' +
          '0.607,-5.534 -3.765,-3.874v1.7c3.12,-1.657 3.698,0.118 2.336,1.25' +
          '-1.201,0.998 -1.201,1.528 -1.204,2.19z',
      },
      this.svgRoot,
    );
    // Dot of question mark.
    dom.createSvgElement(
      Svg.RECT,
      {
        'class': 'blocklyIconSymbol',
        'x': '6.8',
        'y': '10.78',
        'height': '2',
        'width': '2',
      },
      this.svgRoot,
    );
    dom.addClass(this.svgRoot!, 'blocklyCommentIcon');
  }

  override dispose() {
    super.dispose();
    this.textInputBubble?.dispose();
  }

  override getWeight(): number {
    return CommentIcon.WEIGHT;
  }

  override getSize(): Size {
    return new Size(SIZE, SIZE);
  }

  override applyColour(): void {
    super.applyColour();
    const colour = (this.sourceBlock as BlockSvg).getColour();
    this.textInputBubble?.setColour(colour);
  }

  /**
   * Updates the state of the bubble (editable / noneditable) to reflect the
   * state of the bubble if the bubble is currently shown.
   */
  override async updateEditable(): Promise<void> {
    super.updateEditable();
    if (this.bubbleIsVisible()) {
      // Close and reopen the bubble to display the correct UI.
      await this.setBubbleVisible(false);
      await this.setBubbleVisible(true);
    }
  }

  override onLocationChange(blockOrigin: Coordinate): void {
    const oldLocation = this.workspaceLocation;
    super.onLocationChange(blockOrigin);
    if (this.bubbleLocation) {
      const newLocation = this.workspaceLocation;
      const delta = Coordinate.difference(newLocation, oldLocation);
      this.bubbleLocation = Coordinate.sum(this.bubbleLocation, delta);
    }
    const anchorLocation = this.getAnchorLocation();
    this.textInputBubble?.setAnchorLocation(anchorLocation);
  }

  /** Sets the text of this comment. Updates any bubbles if they are visible. */
  setText(text: string) {
    const oldText = this.text;
    eventUtils.fire(
      new (eventUtils.get(EventType.BLOCK_CHANGE))(
        this.sourceBlock,
        'comment',
        null,
        oldText,
        text,
      ),
    );
    this.text = text;
    this.textInputBubble?.setText(this.text);
  }

  /** Returns the text of this comment. */
  getText(): string {
    return this.text;
  }

  /**
   * Sets the size of the editable bubble for this comment. Resizes the
   * bubble if it is visible.
   */
  setBubbleSize(size: Size) {
    this.bubbleSize = size;
    this.textInputBubble?.setSize(this.bubbleSize, true);
  }

  /** @returns the size of the editable bubble for this comment. */
  getBubbleSize(): Size {
    return this.bubbleSize;
  }

  /**
   * Sets the location of the comment bubble in the workspace.
   */
  setBubbleLocation(location: Coordinate) {
    this.bubbleLocation = location;
    this.textInputBubble?.moveDuringDrag(location);
  }

  /**
   * @returns the location of the comment bubble in the workspace.
   */
  getBubbleLocation(): Coordinate | undefined {
    return this.bubbleLocation;
  }

  /**
   * @returns the state of the comment as a JSON serializable value if the
   * comment has text. Otherwise returns null.
   */
  saveState(): CommentState | null {
    if (this.text) {
      const state: CommentState = {
        'text': this.text,
        'pinned': this.bubbleIsVisible(),
        'height': this.bubbleSize.height,
        'width': this.bubbleSize.width,
      };
      const location = this.getBubbleLocation();
      if (location) {
        state['x'] = this.sourceBlock.workspace.RTL
          ? this.sourceBlock.workspace.getWidth() -
            (location.x + this.bubbleSize.width)
          : location.x;
        state['y'] = location.y;
      }
      return state;
    }
    return null;
  }

  /** Applies the given state to this comment. */
  loadState(state: CommentState) {
    this.text = state['text'] ?? '';
    this.bubbleSize = new Size(
      state['width'] ?? DEFAULT_BUBBLE_WIDTH,
      state['height'] ?? DEFAULT_BUBBLE_HEIGHT,
    );
    this.bubbleVisiblity = state['pinned'] ?? false;
    this.setBubbleVisible(this.bubbleVisiblity);
    let x = state['x'];
    const y = state['y'];
    renderManagement.finishQueuedRenders().then(() => {
      if (x && y) {
        x = this.sourceBlock.workspace.RTL
          ? this.sourceBlock.workspace.getWidth() - (x + this.bubbleSize.width)
          : x;
        this.setBubbleLocation(new Coordinate(x, y));
      }
    });
  }

  override onClick(): void {
    super.onClick();
    this.setBubbleVisible(!this.bubbleIsVisible());
  }

  override isClickableInFlyout(): boolean {
    return false;
  }

  /**
   * Updates the text of this comment in response to changes in the text of
   * the input bubble.
   */
  onTextChange(): void {
    if (!this.textInputBubble) return;

    const newText = this.textInputBubble.getText();
    if (this.text === newText) return;

    eventUtils.fire(
      new (eventUtils.get(EventType.BLOCK_CHANGE))(
        this.sourceBlock,
        'comment',
        null,
        this.text,
        newText,
      ),
    );
    this.text = newText;
  }

  /**
   * Updates the size of this icon in response to changes in the size of the
   * input bubble.
   */
  onSizeChange(): void {
    if (this.textInputBubble) {
      this.bubbleSize = this.textInputBubble.getSize();
    }
  }

  onBubbleLocationChange(): void {
    if (this.textInputBubble) {
      this.bubbleLocation = this.textInputBubble.getRelativeToSurfaceXY();
    }
  }

  bubbleIsVisible(): boolean {
    return this.bubbleVisiblity;
  }

  async setBubbleVisible(visible: boolean): Promise<void> {
    if (this.bubbleVisiblity === visible) return;
    this.bubbleVisiblity = visible;

    await renderManagement.finishQueuedRenders();

    if (
      !this.sourceBlock.rendered ||
      this.sourceBlock.isInFlyout ||
      this.sourceBlock.isInsertionMarker()
    )
      return;

    if (visible) {
      if (this.sourceBlock.isEditable()) {
        this.showEditableBubble();
      } else {
        this.showNonEditableBubble();
      }
      this.applyColour();
    } else {
      this.hideBubble();
    }

    eventUtils.fire(
      new (eventUtils.get(EventType.BUBBLE_OPEN))(
        this.sourceBlock,
        visible,
        'comment',
      ),
    );
  }

  /** See IHasBubble.getBubble. */
  getBubble(): TextInputBubble | null {
    return this.textInputBubble;
  }

  /**
   * Shows the editable text bubble for this comment, and adds change listeners
   * to update the state of this icon in response to changes in the bubble.
   */
  private showEditableBubble() {
    this.createBubble();
    this.textInputBubble?.addTextChangeListener(() => this.onTextChange());
    this.textInputBubble?.addSizeChangeListener(() => this.onSizeChange());
  }

  /** Shows the non editable text bubble for this comment. */
  private showNonEditableBubble() {
    this.createBubble();
    this.textInputBubble?.setEditable(false);
  }

  protected createBubble() {
    this.textInputBubble = new TextInputBubble(
      this.sourceBlock.workspace as WorkspaceSvg,
      this.getAnchorLocation(),
      this.getBubbleOwnerRect(),
      this,
    );
    this.textInputBubble.setText(this.getText());
    this.textInputBubble.setSize(this.bubbleSize, true);
    if (this.bubbleLocation) {
      this.textInputBubble.moveDuringDrag(this.bubbleLocation);
    }
    this.textInputBubble.addTextChangeListener(() => this.onTextChange());
    this.textInputBubble.addSizeChangeListener(() => this.onSizeChange());
    this.textInputBubble.addLocationChangeListener(() =>
      this.onBubbleLocationChange(),
    );
  }

  /** Hides any open bubbles owned by this comment. */
  private hideBubble() {
    this.textInputBubble?.dispose();
    this.textInputBubble = null;
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
    return (this.sourceBlock as BlockSvg).getBoundingRectangleWithoutChildren();
  }
}

/** The save state format for a comment icon. */
export interface CommentState {
  /** The text of the comment. */
  text?: string;

  /** True if the comment is open, false otherwise. */
  pinned?: boolean;

  /** The height of the comment bubble. */
  height?: number;

  /** The width of the comment bubble. */
  width?: number;

  /** The X coordinate of the comment bubble. */
  x?: number;

  /** The Y coordinate of the comment bubble. */
  y?: number;
}

registry.register(CommentIcon.TYPE, CommentIcon);
