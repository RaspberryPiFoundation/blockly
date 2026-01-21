/**
 * @license
 * Copyright 2011 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Object representing a trash can icon.
 *
 * @class
 */
// Former goog.module ID: Blockly.Trashcan

// Unused import preserved for side-effects. Remove if unneeded.
import * as browserEvents from './browser_events.js';
import {ComponentManager} from './component_manager.js';
import {DeleteArea} from './delete_area.js';
import type {Abstract} from './events/events_abstract.js';
import './events/events_trashcan_open.js';
import {isBlockDelete} from './events/predicates.js';
import {EventType} from './events/type.js';
import * as eventUtils from './events/utils.js';
import type {IAutoHideable} from './interfaces/i_autohideable.js';
import type {IDraggable} from './interfaces/i_draggable.js';
import type {IFlyout} from './interfaces/i_flyout.js';
import type {IPositionable} from './interfaces/i_positionable.js';
import type {UiMetrics} from './metrics_manager.js';
import * as uiPosition from './positionable_helpers.js';
import * as registry from './registry.js';
import type * as blocks from './serialization/blocks.js';
import {SPRITE} from './sprites.js';
import * as dom from './utils/dom.js';
import {Rect} from './utils/rect.js';
import {Size} from './utils/size.js';
import {Svg} from './utils/svg.js';
import * as toolbox from './utils/toolbox.js';
import {BlockInfo} from './utils/toolbox.js';
import type {WorkspaceSvg} from './workspace_svg.js';

/**
 * Class for a trash can.
 */
export class Trashcan
  extends DeleteArea
  implements IAutoHideable, IPositionable
{
  /**
   * The unique id for this component that is used to register with the
   * ComponentManager.
   */
  override id = 'trashcan';

  /**
   * A list of JSON (stored as strings) representing blocks in the trashcan.
   */
  private readonly contents: string[] = [];

  /**
   * The trashcan flyout.
   *
   * @internal
   */
  flyout: IFlyout | null = null;

  /** Current open/close state of the lid. */
  isLidOpen = false;

  /**
   * The minimum openness of the lid. Used to indicate if the trashcan
   * contains blocks.
   */
  private minOpenness = 0;

  /** The SVG group containing the trash can. */
  private svgGroup: SVGElement | null = null;

  /** The SVG image element of the trash can lid. */
  private svgLid: SVGElement | null = null;

  /** Task ID of opening/closing animation. */
  private lidTask: ReturnType<typeof setTimeout> | null = null;

  /** Current state of lid opening (0.0 = closed, 1.0 = open). */
  private lidOpen = 0;

  /** Left coordinate of the trash can. */
  private left = 0;

  /** Top coordinate of the trash can. */
  private top = 0;

  /** Whether this trash can has been initialized. */
  private initialized = false;

  /** @param workspace The workspace to sit in. */
  constructor(private workspace: WorkspaceSvg) {
    super();

    if (this.workspace.options.maxTrashcanContents <= 0) {
      return;
    }

    // Create flyout options.
    const flyoutWorkspaceOptions = this.workspace.copyOptionsForFlyout();
    // Create vertical or horizontal flyout.
    if (this.workspace.horizontalLayout) {
      flyoutWorkspaceOptions.toolboxPosition =
        this.workspace.toolboxPosition === toolbox.Position.TOP
          ? toolbox.Position.BOTTOM
          : toolbox.Position.TOP;
      const HorizontalFlyout = registry.getClassFromOptions(
        registry.Type.FLYOUTS_HORIZONTAL_TOOLBOX,
        this.workspace.options,
        true,
      );
      this.flyout = new HorizontalFlyout!(flyoutWorkspaceOptions);
    } else {
      flyoutWorkspaceOptions.toolboxPosition =
        this.workspace.toolboxPosition === toolbox.Position.RIGHT
          ? toolbox.Position.LEFT
          : toolbox.Position.RIGHT;
      const VerticalFlyout = registry.getClassFromOptions(
        registry.Type.FLYOUTS_VERTICAL_TOOLBOX,
        this.workspace.options,
        true,
      );
      this.flyout = new VerticalFlyout!(flyoutWorkspaceOptions);
    }
    this.workspace.addChangeListener(this.onDelete.bind(this));
  }

  /**
   * Create the trash can elements.
   *
   * @returns The trash can's SVG group.
   */
  createDom(): SVGElement {
    /* Here's the markup that will be generated:
        <g class="blocklyTrash">
          <clippath id="blocklyTrashBodyClipPath837493">
            <rect width="47" height="45" y="15"></rect>
          </clippath>
          <image width="64" height="92" y="-32" xlink:href="media/sprites.png"
              clip-path="url(#blocklyTrashBodyClipPath837493)"></image>
          <clippath id="blocklyTrashLidClipPath837493">
            <rect width="47" height="15"></rect>
          </clippath>
          <image width="84" height="92" y="-32" xlink:href="media/sprites.png"
              clip-path="url(#blocklyTrashLidClipPath837493)"></image>
        </g>
        */
    this.svgGroup = dom.createSvgElement(Svg.G, {'class': 'blocklyTrash'});
    let clip;
    const rnd = String(Math.random()).substring(2);
    clip = dom.createSvgElement(
      Svg.CLIPPATH,
      {'id': 'blocklyTrashBodyClipPath' + rnd},
      this.svgGroup,
    );
    dom.createSvgElement(
      Svg.RECT,
      {'width': WIDTH, 'height': BODY_HEIGHT, 'y': LID_HEIGHT},
      clip,
    );
    const body = dom.createSvgElement(
      Svg.IMAGE,
      {
        'width': SPRITE.width,
        'x': -SPRITE_LEFT,
        'height': SPRITE.height,
        'y': -SPRITE_TOP,
        'clip-path': 'url(#blocklyTrashBodyClipPath' + rnd + ')',
      },
      this.svgGroup,
    );
    body.setAttributeNS(
      dom.XLINK_NS,
      'xlink:href',
      this.workspace.options.pathToMedia + SPRITE.url,
    );

    clip = dom.createSvgElement(
      Svg.CLIPPATH,
      {'id': 'blocklyTrashLidClipPath' + rnd},
      this.svgGroup,
    );
    dom.createSvgElement(
      Svg.RECT,
      {'width': WIDTH, 'height': LID_HEIGHT},
      clip,
    );
    this.svgLid = dom.createSvgElement(
      Svg.IMAGE,
      {
        'width': SPRITE.width,
        'x': -SPRITE_LEFT,
        'height': SPRITE.height,
        'y': -SPRITE_TOP,
        'clip-path': 'url(#blocklyTrashLidClipPath' + rnd + ')',
      },
      this.svgGroup,
    );
    this.svgLid.setAttributeNS(
      dom.XLINK_NS,
      'xlink:href',
      this.workspace.options.pathToMedia + SPRITE.url,
    );

    // bindEventWithChecks_ quashes events too aggressively. See:
    // https://groups.google.com/forum/#!topic/blockly/QF4yB9Wx00s
    // Using bindEventWithChecks_ for blocking mousedown causes issue in mobile.
    // See #4303
    browserEvents.bind(
      this.svgGroup,
      'pointerdown',
      this,
      this.blockMouseDownWhenOpenable,
    );
    browserEvents.bind(this.svgGroup, 'pointerup', this, this.click);
    // Bind to body instead of this.svgGroup so that we don't get lid jitters
    browserEvents.bind(body, 'pointerover', this, this.mouseOver);
    browserEvents.bind(body, 'pointerout', this, this.mouseOut);
    this.animateLid();
    return this.svgGroup;
  }

  /** Initializes the trash can. */
  init() {
    if (this.workspace.options.maxTrashcanContents > 0) {
      const flyoutDom = this.flyout!.createDom(Svg.SVG)!;
      dom.addClass(flyoutDom, 'blocklyTrashcanFlyout');
      dom.insertAfter(flyoutDom, this.workspace.getParentSvg());
      this.flyout!.init(this.workspace);
    }
    this.workspace.getComponentManager().addComponent({
      component: this,
      weight: ComponentManager.ComponentWeight.TRASHCAN_WEIGHT,
      capabilities: [
        ComponentManager.Capability.AUTOHIDEABLE,
        ComponentManager.Capability.DELETE_AREA,
        ComponentManager.Capability.DRAG_TARGET,
        ComponentManager.Capability.POSITIONABLE,
      ],
    });
    this.initialized = true;
    this.setLidOpen(false);
  }

  /**
   * Dispose of this trash can.
   * Unlink from all DOM elements to prevent memory leaks.
   */
  dispose() {
    this.workspace.getComponentManager().removeComponent('trashcan');
    if (this.svgGroup) {
      dom.removeNode(this.svgGroup);
    }
    if (this.lidTask) {
      clearTimeout(this.lidTask);
    }
  }

  /**
   * Whether the trashcan has contents.
   *
   * @returns True if the trashcan has contents.
   */
  private hasContents(): boolean {
    return !!this.contents.length;
  }

  /**
   * Returns true if the trashcan contents-flyout is currently open.
   *
   * @returns True if the trashcan contents-flyout is currently open.
   */
  contentsIsOpen(): boolean {
    return !!this.flyout && this.flyout.isVisible();
  }

  /** Opens the trashcan flyout. */
  openFlyout() {
    if (this.contentsIsOpen()) {
      return;
    }
    const contents = this.contents.map(function (string) {
      return JSON.parse(string);
    });
    // Trashcans with lots of blocks can take a second to render.
    const blocklyStyle = this.workspace.getParentSvg().style;
    blocklyStyle.cursor = 'wait';
    setTimeout(() => {
      this.flyout?.show(contents);
      blocklyStyle.cursor = '';
      this.workspace.scrollbar?.setVisible(false);
    }, 10);
    this.fireUiEvent(true);
  }

  /** Closes the trashcan flyout. */
  closeFlyout() {
    if (!this.contentsIsOpen()) {
      return;
    }
    this.flyout?.hide();
    this.workspace.scrollbar?.setVisible(true);
    this.fireUiEvent(false);
    this.workspace.recordDragTargets();
  }

  /**
   * Hides the component. Called in WorkspaceSvg.hideChaff.
   *
   * @param onlyClosePopups Whether only popups should be closed.
   *     Flyouts should not be closed if this is true.
   */
  autoHide(onlyClosePopups: boolean) {
    // For now the trashcan flyout always autocloses because it overlays the
    // trashcan UI (no trashcan to click to close it).
    if (!onlyClosePopups && this.flyout) {
      this.closeFlyout();
    }
  }

  /**
   * Empties the trashcan's contents. If the contents-flyout is currently open
   * it will be closed.
   */
  emptyContents() {
    if (!this.hasContents()) {
      return;
    }
    this.contents.length = 0;
    this.setMinOpenness(0);
    this.closeFlyout();
  }

  /**
   * Positions the trashcan.
   * It is positioned in the opposite corner to the corner the
   * categories/toolbox starts at.
   *
   * @param metrics The workspace metrics.
   * @param savedPositions List of rectangles that are already on the workspace.
   */
  position(metrics: UiMetrics, savedPositions: Rect[]) {
    // Not yet initialized.
    if (!this.initialized) {
      return;
    }

    const cornerPosition = uiPosition.getCornerOppositeToolbox(
      this.workspace,
      metrics,
    );

    const height = BODY_HEIGHT + LID_HEIGHT;
    const startRect = uiPosition.getStartPositionRect(
      cornerPosition,
      new Size(WIDTH, height),
      MARGIN_HORIZONTAL,
      MARGIN_VERTICAL,
      metrics,
      this.workspace,
    );

    const verticalPosition = cornerPosition.vertical;
    const bumpDirection =
      verticalPosition === uiPosition.verticalPosition.TOP
        ? uiPosition.bumpDirection.DOWN
        : uiPosition.bumpDirection.UP;
    const positionRect = uiPosition.bumpPositionRect(
      startRect,
      MARGIN_VERTICAL,
      bumpDirection,
      savedPositions,
    );

    this.top = positionRect.top;
    this.left = positionRect.left;
    this.svgGroup?.setAttribute(
      'transform',
      'translate(' + this.left + ',' + this.top + ')',
    );

    this.flyout?.position();
  }

  /**
   * Returns the bounding rectangle of the UI element in pixel units relative to
   * the Blockly injection div.
   *
   * @returns The UI elements's bounding box. Null if bounding box should be
   *     ignored by other UI elements.
   */
  getBoundingRectangle(): Rect | null {
    const bottom = this.top + BODY_HEIGHT + LID_HEIGHT;
    const right = this.left + WIDTH;
    return new Rect(this.top, bottom, this.left, right);
  }

  /**
   * Returns the bounding rectangle of the drag target area in pixel units
   * relative to viewport.
   *
   * @returns The component's bounding box. Null if drag target area should be
   *     ignored.
   */
  override getClientRect(): Rect | null {
    if (!this.svgGroup) {
      return null;
    }

    const trashRect = this.svgGroup.getBoundingClientRect();
    const top = trashRect.top + SPRITE_TOP - MARGIN_HOTSPOT;
    const bottom = top + LID_HEIGHT + BODY_HEIGHT + 2 * MARGIN_HOTSPOT;
    const left = trashRect.left + SPRITE_LEFT - MARGIN_HOTSPOT;
    const right = left + WIDTH + 2 * MARGIN_HOTSPOT;
    return new Rect(top, bottom, left, right);
  }

  /**
   * Handles when a cursor with a block or bubble is dragged over this drag
   * target.
   *
   * @param _dragElement The block or bubble currently being dragged.
   */
  override onDragOver(_dragElement: IDraggable) {
    this.setLidOpen(this.wouldDelete_);
  }

  /**
   * Handles when a cursor with a block or bubble exits this drag target.
   *
   * @param _dragElement The block or bubble currently being dragged.
   */
  override onDragExit(_dragElement: IDraggable) {
    this.setLidOpen(false);
  }

  /**
   * Handles when a block or bubble is dropped on this component.
   * Should not handle delete here.
   *
   * @param _dragElement The block or bubble currently being dragged.
   */
  override onDrop(_dragElement: IDraggable) {
    setTimeout(this.setLidOpen.bind(this, false), 100);
  }

  /**
   * Flip the lid open or shut.
   *
   * @param state True if open.
   * @internal
   */
  setLidOpen(state: boolean) {
    if (this.isLidOpen === state) {
      return;
    }
    if (this.lidTask) {
      clearTimeout(this.lidTask);
    }
    this.isLidOpen = state;
    this.animateLid();
  }

  /** Rotate the lid open or closed by one step.  Then wait and recurse. */
  private animateLid() {
    const frames = ANIMATION_FRAMES;

    const delta = 1 / (frames + 1);
    this.lidOpen += this.isLidOpen ? delta : -delta;
    this.lidOpen = Math.min(Math.max(this.lidOpen, this.minOpenness), 1);

    this.setLidAngle(this.lidOpen * MAX_LID_ANGLE);

    // Linear interpolation between min and max.
    const opacity = OPACITY_MIN + this.lidOpen * (OPACITY_MAX - OPACITY_MIN);
    if (this.svgGroup) {
      this.svgGroup.style.opacity = `${opacity}`;
    }

    if (this.lidOpen > this.minOpenness && this.lidOpen < 1) {
      this.lidTask = setTimeout(
        this.animateLid.bind(this),
        ANIMATION_LENGTH / frames,
      );
    }
  }

  /**
   * Set the angle of the trashcan's lid.
   *
   * @param lidAngle The angle at which to set the lid.
   */
  private setLidAngle(lidAngle: number) {
    const openAtRight =
      this.workspace.toolboxPosition === toolbox.Position.RIGHT ||
      (this.workspace.horizontalLayout && this.workspace.RTL);
    this.svgLid?.setAttribute(
      'transform',
      'rotate(' +
        (openAtRight ? -lidAngle : lidAngle) +
        ',' +
        (openAtRight ? 4 : WIDTH - 4) +
        ',' +
        (LID_HEIGHT - 2) +
        ')',
    );
  }

  /**
   * Sets the minimum openness of the trashcan lid. If the lid is currently
   * closed, this will update lid's position.
   *
   * @param newMin The new minimum openness of the lid. Should be between 0
   *     and 1.
   */
  private setMinOpenness(newMin: number) {
    this.minOpenness = newMin;
    if (!this.isLidOpen) {
      this.setLidAngle(newMin * MAX_LID_ANGLE);
    }
  }

  /**
   * Flip the lid shut.
   * Called externally after a drag.
   */
  closeLid() {
    this.setLidOpen(false);
  }

  /** Inspect the contents of the trash. */
  click() {
    if (!this.hasContents() || this.workspace.isDragging()) {
      return;
    }
    this.openFlyout();
  }

  /**
   * Fires a UI event for trashcan flyout open or close.
   *
   * @param trashcanOpen Whether the flyout is opening.
   */
  private fireUiEvent(trashcanOpen: boolean) {
    const uiEvent = new (eventUtils.get(EventType.TRASHCAN_OPEN))(
      trashcanOpen,
      this.workspace.id,
    );
    eventUtils.fire(uiEvent);
  }

  /**
   * Prevents a workspace scroll and click event if the trashcan has blocks.
   *
   * @param e A mouse down event.
   */
  private blockMouseDownWhenOpenable(e: PointerEvent) {
    if (!this.contentsIsOpen() && this.hasContents()) {
      // Don't start a workspace scroll.
      e.stopPropagation();
    }
  }

  /**
   * Indicate that the trashcan can be clicked (by opening it) if it has blocks.
   */
  private mouseOver() {
    if (this.hasContents()) {
      this.setLidOpen(true);
    }
  }

  /**
   * Close the lid of the trashcan if it was open (Vis. it was indicating it had
   *    blocks).
   */
  private mouseOut() {
    // No need to do a .hasBlocks check here because if it doesn't the trashcan
    // won't be open in the first place, and setOpen won't run.
    this.setLidOpen(false);
  }

  /**
   * Handle a BLOCK_DELETE event. Adds deleted blocks oldXml to the content
   * array.
   *
   * @param event Workspace event.
   */
  private onDelete(event: Abstract) {
    if (
      this.workspace.options.maxTrashcanContents <= 0 ||
      !isBlockDelete(event) ||
      event.wasShadow
    ) {
      return;
    }
    if (!event.oldJson) {
      throw new Error('Encountered a delete event without proper oldJson');
    }
    const cleanedJson = JSON.stringify(this.cleanBlockJson(event.oldJson));
    if (this.contents.includes(cleanedJson)) return;
    this.contents.unshift(cleanedJson);
    while (this.contents.length > this.workspace.options.maxTrashcanContents) {
      this.contents.pop();
    }

    this.setMinOpenness(HAS_BLOCKS_LID_ANGLE);
  }

  /**
   * Converts JSON representing a block into text that can be stored in the
   * content array.
   *
   * @param json A JSON representation of a block's state.
   * @returns A BlockInfo object corresponding to the JSON, cleaned of all
   *     unnecessary attributes.
   */
  private cleanBlockJson(json: blocks.State): BlockInfo {
    // Create a deep copy.
    json = JSON.parse(JSON.stringify(json)) as blocks.State;

    /**
     * Reshape JSON into a nicer format.
     *
     * @param json The JSON to clean.
     */
    function cleanRec(json: blocks.State) {
      if (!json) {
        return;
      }

      delete json['id'];
      delete json['x'];
      delete json['y'];
      delete json['enabled'];
      delete json['disabledReasons'];

      if (json['icons'] && json['icons']['comment']) {
        const comment = json['icons']['comment'];
        delete comment['height'];
        delete comment['width'];
        delete comment['pinned'];
      }

      const inputs = json['inputs'];
      for (const name in inputs) {
        const input = inputs[name];
        const block = input['block'];
        const shadow = input['shadow'];
        if (block) {
          cleanRec(block);
        }
        if (shadow) {
          cleanRec(shadow);
        }
      }
      if (json['next']) {
        const next = json['next'];
        const block = next['block'];
        const shadow = next['shadow'];
        if (block) {
          cleanRec(block);
        }
        if (shadow) {
          cleanRec(shadow);
        }
      }
    }

    cleanRec(json);

    const blockInfo: BlockInfo = {
      'kind': 'BLOCK',
      ...json,
    };
    return blockInfo;
  }
}

/** Width of both the trash can and lid images. */
const WIDTH = 47;

/** Height of the trashcan image (minus lid). */
const BODY_HEIGHT = 44;

/** Height of the lid image. */
const LID_HEIGHT = 16;

/** Distance between trashcan and bottom or top edge of workspace. */
const MARGIN_VERTICAL = 20;

/** Distance between trashcan and right or left edge of workspace. */
const MARGIN_HORIZONTAL = 20;

/** Extent of hotspot on all sides beyond the size of the image. */
const MARGIN_HOTSPOT = 10;

/** Location of trashcan in sprite image. */
const SPRITE_LEFT = 0;

/** Location of trashcan in sprite image. */
const SPRITE_TOP = 32;

/**
 * The openness of the lid when the trashcan contains blocks.
 *    (0.0 = closed, 1.0 = open)
 */
const HAS_BLOCKS_LID_ANGLE = 0.1;

/** The length of the lid open/close animation in milliseconds. */
const ANIMATION_LENGTH = 80;

/** The number of frames in the animation. */
const ANIMATION_FRAMES = 4;

/** The minimum (resting) opacity of the trashcan and lid. */
const OPACITY_MIN = 0.4;

/** The maximum (hovered) opacity of the trashcan and lid. */
const OPACITY_MAX = 0.8;

/**
 * The maximum angle the trashcan lid can opens to. At the end of the open
 * animation the lid will be open to this angle.
 */
const MAX_LID_ANGLE = 45;
