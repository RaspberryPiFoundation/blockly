/**
 * @license
 * Copyright 2015 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Object representing a zoom icons.
 *
 * @class
 */
// Former goog.module ID: Blockly.ZoomControls

// Unused import preserved for side-effects. Remove if unneeded.
import './events/events_click.js';

import {IFocusableNode} from './blockly.js';
import * as browserEvents from './browser_events.js';
import {ComponentManager} from './component_manager.js';
import * as Css from './css.js';
import {EventType} from './events/type.js';
import * as eventUtils from './events/utils.js';
import type {IPositionable} from './interfaces/i_positionable.js';
import type {UiMetrics} from './metrics_manager.js';
import {Msg} from './msg.js';
import * as uiPosition from './positionable_helpers.js';
import {SPRITE} from './sprites.js';
import * as Touch from './touch.js';
import * as aria from './utils/aria.js';
import * as dom from './utils/dom.js';
import {getNextUniqueId} from './utils/idgenerator.js';
import {Rect} from './utils/rect.js';
import {Size} from './utils/size.js';
import {Svg} from './utils/svg.js';
import type {WorkspaceSvg} from './workspace_svg.js';

/**
 * Base class for an individual zoom control (in, out, reset).
 *
 * @internal
 */
abstract class ZoomControl implements IFocusableNode {
  private pointerDownHandler: browserEvents.Data;
  private id: string;

  constructor(
    protected workspace: WorkspaceSvg,
    protected group: SVGGElement,
  ) {
    this.pointerDownHandler = browserEvents.conditionalBind(
      group,
      'pointerdown',
      null,
      this.performAction.bind(this),
    );

    aria.setRole(group, aria.Role.BUTTON);

    this.id = getNextUniqueId();
    this.group.id = this.id;
  }

  getId() {
    return this.id;
  }

  /**
   * Handles a mouse down event on the zoom in or zoom out buttons on the
   *    workspace.
   *
   * @param amount Amount of zooming. Negative amount values zoom out, and
   *     positive amount values zoom in.
   * @param e A mouse down or keydown event.
   */
  protected zoom(amount: number, e: Event) {
    this.workspace.markFocused();
    this.workspace.zoomCenter(amount);
    this.fireZoomEvent();
    Touch.clearTouchIdentifier(); // Don't block future drags.
    e.stopPropagation(); // Don't start a workspace scroll.
    e.preventDefault(); // Stop double-clicking from selecting text.
  }

  /** Fires a zoom control UI event. */
  protected fireZoomEvent() {
    const uiEvent = new (eventUtils.get(EventType.CLICK))(
      null,
      this.workspace.id,
      'zoom_controls',
    );
    eventUtils.fire(uiEvent);
  }

  getFocusableElement() {
    return this.group;
  }

  getFocusableTree() {
    return this.workspace;
  }

  onNodeFocus() {}

  onNodeBlur() {}

  canBeFocused() {
    return true;
  }

  abstract performAction(_e: Event): void;

  dispose() {
    browserEvents.unbind(this.pointerDownHandler);
  }
}

class ZoomInControl extends ZoomControl {
  constructor(workspace: WorkspaceSvg, zoomControlContainer: SVGElement) {
    const rnd = String(Math.random()).substring(2);
    const group = dom.createSvgElement(
      Svg.G,
      {'class': 'blocklyZoom blocklyZoomIn', 'tabindex': '0'},
      zoomControlContainer,
    );
    aria.setState(group, aria.State.LABEL, Msg['ZOOM_IN']);
    const clip = dom.createSvgElement(
      Svg.CLIPPATH,
      {'id': 'blocklyZoominClipPath' + rnd},
      group,
    );
    dom.createSvgElement(
      Svg.RECT,
      {
        'width': 32,
        'height': 32,
      },
      clip,
    );
    const zoominSvg = dom.createSvgElement(
      Svg.IMAGE,
      {
        'width': SPRITE.width,
        'height': SPRITE.height,
        'x': -32,
        'y': -92,
        'clip-path': 'url(#blocklyZoominClipPath' + rnd + ')',
      },
      group,
    );
    zoominSvg.setAttributeNS(
      dom.XLINK_NS,
      'xlink:href',
      workspace.options.pathToMedia + SPRITE.url,
    );

    super(workspace, group);
  }

  override performAction(e: Event) {
    this.zoom(1, e);
  }
}

class ZoomOutControl extends ZoomControl {
  constructor(workspace: WorkspaceSvg, zoomControlContainer: SVGElement) {
    const rnd = String(Math.random()).substring(2);
    const group = dom.createSvgElement(
      Svg.G,
      {'class': 'blocklyZoom blocklyZoomOut', 'tabindex': '0'},
      zoomControlContainer,
    );
    aria.setState(group, aria.State.LABEL, Msg['ZOOM_OUT']);
    const clip = dom.createSvgElement(
      Svg.CLIPPATH,
      {'id': 'blocklyZoomoutClipPath' + rnd},
      group,
    );
    dom.createSvgElement(
      Svg.RECT,
      {
        'width': 32,
        'height': 32,
      },
      clip,
    );
    const zoomoutSvg = dom.createSvgElement(
      Svg.IMAGE,
      {
        'width': SPRITE.width,
        'height': SPRITE.height,
        'x': -64,
        'y': -92,
        'clip-path': 'url(#blocklyZoomoutClipPath' + rnd + ')',
      },
      group,
    );
    zoomoutSvg.setAttributeNS(
      dom.XLINK_NS,
      'xlink:href',
      workspace.options.pathToMedia + SPRITE.url,
    );

    super(workspace, group);
  }

  override performAction(e: Event) {
    this.zoom(-1, e);
  }
}

class ZoomResetControl extends ZoomControl {
  constructor(workspace: WorkspaceSvg, zoomControlContainer: SVGElement) {
    const rnd = String(Math.random()).substring(2);
    const group = dom.createSvgElement(
      Svg.G,
      {'class': 'blocklyZoom blocklyZoomReset', 'tabindex': '0'},
      zoomControlContainer,
    );
    aria.setState(group, aria.State.LABEL, Msg['RESET_ZOOM']);
    const clip = dom.createSvgElement(
      Svg.CLIPPATH,
      {'id': 'blocklyZoomresetClipPath' + rnd},
      group,
    );
    dom.createSvgElement(Svg.RECT, {'width': 32, 'height': 32}, clip);
    const zoomresetSvg = dom.createSvgElement(
      Svg.IMAGE,
      {
        'width': SPRITE.width,
        'height': SPRITE.height,
        'y': -92,
        'clip-path': 'url(#blocklyZoomresetClipPath' + rnd + ')',
      },
      group,
    );
    zoomresetSvg.setAttributeNS(
      dom.XLINK_NS,
      'xlink:href',
      workspace.options.pathToMedia + SPRITE.url,
    );

    super(workspace, group);
  }

  /**
   * Handles a mouse down event on the reset zoom button on the workspace.
   *
   * @param e A mouse down or keydown event.
   */
  override performAction(e: Event) {
    this.workspace.markFocused();

    // zoom is passed amount and computes the new scale using the formula:
    // targetScale = currentScale * Math.pow(speed, amount)
    const targetScale = this.workspace.options.zoomOptions.startScale;
    const currentScale = this.workspace.scale;
    const speed = this.workspace.options.zoomOptions.scaleSpeed;
    // To compute amount:
    // amount = log(speed, (targetScale / currentScale))
    // Math.log computes natural logarithm (ln), to change the base, use
    // formula: log(base, value) = ln(value) / ln(base)
    const amount = Math.log(targetScale / currentScale) / Math.log(speed);
    this.workspace.beginCanvasTransition();
    this.workspace.zoomCenter(amount);
    this.workspace.scrollCenter();

    setTimeout(this.workspace.endCanvasTransition.bind(this.workspace), 500);
    this.fireZoomEvent();
    Touch.clearTouchIdentifier(); // Don't block future drags.
    e.stopPropagation(); // Don't start a workspace scroll.
    e.preventDefault(); // Stop double-clicking from selecting text.
  }
}

/**
 * Class for a zoom controls.
 */
export class ZoomControls implements IPositionable {
  /**
   * The unique ID for this component that is used to register with the
   * ComponentManager.
   */
  id = 'zoomControls';

  /** The zoom in control. */
  private zoomInControl: ZoomInControl | null = null;

  /** The zoom out control. */
  private zoomOutControl: ZoomControl | null = null;

  /** The zoom reset control. */
  private zoomResetControl: ZoomControl | null = null;

  /** Width of the zoom controls. */
  private readonly WIDTH = 32;

  /** Height of each zoom control. */
  private readonly HEIGHT = 32;

  /** Small spacing used between the zoom in and out control, in pixels. */
  private readonly SMALL_SPACING = 2;

  /**
   * Large spacing used between the zoom in and reset control, in pixels.
   */
  private readonly LARGE_SPACING = 11;

  /** Distance between zoom controls and bottom or top edge of workspace. */
  private readonly MARGIN_VERTICAL = 20;

  /** Distance between zoom controls and right or left edge of workspace. */
  private readonly MARGIN_HORIZONTAL = 20;

  /** The SVG group containing the zoom controls. */
  private svgGroup: SVGElement | null = null;

  /** Left coordinate of the zoom controls. */
  private left = 0;

  /** Top coordinate of the zoom controls. */
  private top = 0;

  /** Whether this has been initialized. */
  private initialized = false;

  /** @param workspace The workspace to sit in. */
  constructor(private readonly workspace: WorkspaceSvg) {}

  /**
   * Create the zoom controls.
   *
   * @returns The zoom controls SVG group.
   */
  createDom(): SVGElement {
    this.svgGroup = dom.createSvgElement(Svg.G, {});
    this.zoomOutControl = new ZoomOutControl(this.workspace, this.svgGroup);
    this.zoomInControl = new ZoomInControl(this.workspace, this.svgGroup);
    if (this.workspace.isMovable()) {
      // If we zoom to the center and the workspace isn't movable we could
      // loose blocks at the edges of the workspace.
      this.zoomResetControl = new ZoomResetControl(
        this.workspace,
        this.svgGroup,
      );
    }
    return this.svgGroup;
  }

  /** Initializes the zoom controls. */
  init() {
    this.workspace.getComponentManager().addComponent({
      component: this,
      weight: ComponentManager.ComponentWeight.ZOOM_CONTROLS_WEIGHT,
      capabilities: [ComponentManager.Capability.POSITIONABLE],
    });
    this.initialized = true;
  }

  /**
   * Disposes of this zoom controls.
   * Unlink from all DOM elements to prevent memory leaks.
   */
  dispose() {
    this.workspace.getComponentManager().removeComponent('zoomControls');
    if (this.svgGroup) {
      dom.removeNode(this.svgGroup);
    }
    this.zoomInControl?.dispose();
    this.zoomOutControl?.dispose();
    this.zoomResetControl?.dispose();
  }

  /**
   * Returns the bounding rectangle of the UI element in pixel units relative to
   * the Blockly injection div.
   *
   * @returns The UI elements's bounding box. Null if bounding box should be
   *     ignored by other UI elements.
   */
  getBoundingRectangle(): Rect | null {
    let height = this.SMALL_SPACING + 2 * this.HEIGHT;
    if (this.zoomResetControl) {
      height += this.LARGE_SPACING + this.HEIGHT;
    }
    const bottom = this.top + height;
    const right = this.left + this.WIDTH;
    return new Rect(this.top, bottom, this.left, right);
  }

  /**
   * Positions the zoom controls.
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
    let height = this.SMALL_SPACING + 2 * this.HEIGHT;
    if (this.zoomResetControl) {
      height += this.LARGE_SPACING + this.HEIGHT;
    }
    const startRect = uiPosition.getStartPositionRect(
      cornerPosition,
      new Size(this.WIDTH, height),
      this.MARGIN_HORIZONTAL,
      this.MARGIN_VERTICAL,
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
      this.MARGIN_VERTICAL,
      bumpDirection,
      savedPositions,
    );

    if (verticalPosition === uiPosition.verticalPosition.TOP) {
      const zoomInTranslateY = this.SMALL_SPACING + this.HEIGHT;
      this.zoomInControl
        ?.getFocusableElement()
        .setAttribute('transform', 'translate(0, ' + zoomInTranslateY + ')');
      if (this.zoomResetControl) {
        const zoomResetTranslateY =
          zoomInTranslateY + this.LARGE_SPACING + this.HEIGHT;
        this.zoomResetControl
          .getFocusableElement()
          .setAttribute(
            'transform',
            'translate(0, ' + zoomResetTranslateY + ')',
          );
      }
    } else {
      const zoomInTranslateY = this.zoomResetControl
        ? this.LARGE_SPACING + this.HEIGHT
        : 0;
      this.zoomInControl
        ?.getFocusableElement()
        .setAttribute('transform', 'translate(0, ' + zoomInTranslateY + ')');
      const zoomOutTranslateY =
        zoomInTranslateY + this.SMALL_SPACING + this.HEIGHT;
      this.zoomOutControl
        ?.getFocusableElement()
        .setAttribute('transform', 'translate(0, ' + zoomOutTranslateY + ')');
    }

    this.top = positionRect.top;
    this.left = positionRect.left;
    this.svgGroup?.setAttribute(
      'transform',
      'translate(' + this.left + ',' + this.top + ')',
    );
  }

  /**
   * Returns the individual zoom control, if any, with the given ID. Used for
   * focus management.
   *
   * @internal
   */
  getControlWithId(id: string) {
    for (const control of [
      this.zoomInControl,
      this.zoomOutControl,
      this.zoomResetControl,
    ]) {
      if (control?.getId() === id) {
        return control;
      }
    }
  }
}

/** CSS for zoom controls.  See css.js for use. */
Css.register(`
.blocklyZoom>image, .blocklyZoom>svg>image {
  opacity: .4;
}

.blocklyZoom>image:hover, .blocklyZoom>svg>image:hover, .blocklyZoom:focus>image {
  opacity: .8;
}

.blocklyZoom>image:active, .blocklyZoom>svg>image:active {
  opacity: 1;
}
`);
