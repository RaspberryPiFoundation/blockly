/**
 * @license
 * Copyright 2016 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Class for a button in the flyout.
 *
 * @class
 */
// Former goog.module ID: Blockly.FlyoutButton

import * as browserEvents from './browser_events.js';
import * as Css from './css.js';
import type {IBoundedElement} from './interfaces/i_bounded_element.js';
import type {IFocusableNode} from './interfaces/i_focusable_node.js';
import type {IFocusableTree} from './interfaces/i_focusable_tree.js';
import type {IRenderedElement} from './interfaces/i_rendered_element.js';
import {idGenerator} from './utils.js';
import {Coordinate} from './utils/coordinate.js';
import * as dom from './utils/dom.js';
import * as parsing from './utils/parsing.js';
import {Rect} from './utils/rect.js';
import * as style from './utils/style.js';
import {Svg} from './utils/svg.js';
import type * as toolbox from './utils/toolbox.js';
import type {WorkspaceSvg} from './workspace_svg.js';

/**
 * Class for a button or label in the flyout.
 */
export class FlyoutButton
  implements IBoundedElement, IRenderedElement, IFocusableNode
{
  /** The horizontal margin around the text in the button. */
  static TEXT_MARGIN_X = 5;

  /** The vertical margin around the text in the button. */
  static TEXT_MARGIN_Y = 2;

  /** The radius of the flyout button's borders. */
  static BORDER_RADIUS = 4;

  /** The key to the function called when this button is activated. */
  readonly callbackKey: string;

  private readonly text: string;
  private readonly position: Coordinate;
  private readonly cssClass: string | null;

  /** Mouse up event data. */
  private onMouseDownWrapper: browserEvents.Data;
  private onMouseUpWrapper: browserEvents.Data;
  info: toolbox.ButtonOrLabelInfo;

  /** The width of the button's rect. */
  width = 0;

  /** The height of the button's rect. */
  height = 0;

  /** The root SVG group for the button or label. */
  private svgGroup: SVGGElement;

  /** The SVG element with the text of the label or button. */
  private svgText: SVGTextElement | null = null;

  /**
   * Holds the cursors svg element when the cursor is attached to the button.
   * This is null if there is no cursor on the button.
   */
  cursorSvg: SVGElement | null = null;

  /** The unique ID for this FlyoutButton. */
  private id: string;

  /**
   * @param workspace The workspace in which to place this button.
   * @param targetWorkspace The flyout's target workspace.
   * @param json The JSON specifying the label/button.
   * @param isFlyoutLabel Whether this button should be styled as a label.
   * @internal
   */
  constructor(
    private readonly workspace: WorkspaceSvg,
    private readonly targetWorkspace: WorkspaceSvg,
    json: toolbox.ButtonOrLabelInfo,
    private readonly isFlyoutLabel: boolean,
  ) {
    this.text = json['text'];

    this.position = new Coordinate(0, 0);

    /**
     * The key to the function called when this button is activated.
     * Check both the uppercase and lowercase version, because the docs
     * say `callbackKey` but the type says `callbackkey`.
     */
    this.callbackKey =
      (json as AnyDuringMigration)['callbackKey'] ||
      (json as AnyDuringMigration)['callbackkey'];

    /** If specified, a CSS class to add to this button. */
    this.cssClass = (json as AnyDuringMigration)['web-class'] || null;

    /** The JSON specifying the label / button. */
    this.info = json;
    let cssClass = this.isFlyoutLabel
      ? 'blocklyFlyoutLabel'
      : 'blocklyFlyoutButton';
    if (this.cssClass) {
      cssClass += ' ' + this.cssClass;
    }

    this.id = idGenerator.getNextUniqueId();
    this.svgGroup = dom.createSvgElement(
      Svg.G,
      {'id': this.id, 'class': cssClass},
      this.workspace.getCanvas(),
    );

    let shadow;
    if (!this.isFlyoutLabel) {
      // Shadow rectangle (light source does not mirror in RTL).
      shadow = dom.createSvgElement(
        Svg.RECT,
        {
          'class': 'blocklyFlyoutButtonShadow',
          'rx': FlyoutButton.BORDER_RADIUS,
          'ry': FlyoutButton.BORDER_RADIUS,
          'x': 1,
          'y': 1,
        },
        this.svgGroup!,
      );
    }
    // Background rectangle.
    const rect = dom.createSvgElement(
      Svg.RECT,
      {
        'class': this.isFlyoutLabel
          ? 'blocklyFlyoutLabelBackground'
          : 'blocklyFlyoutButtonBackground',
        'rx': FlyoutButton.BORDER_RADIUS,
        'ry': FlyoutButton.BORDER_RADIUS,
      },
      this.svgGroup!,
    );

    const svgText = dom.createSvgElement(
      Svg.TEXT,
      {
        'class': this.isFlyoutLabel ? 'blocklyFlyoutLabelText' : 'blocklyText',
        'x': 0,
        'y': 0,
        'text-anchor': 'middle',
      },
      this.svgGroup!,
    );
    let text = parsing.replaceMessageReferences(this.text);
    if (this.workspace.RTL) {
      // Force text to be RTL by adding an RLM.
      text += '\u200F';
    }
    svgText.textContent = text;
    if (this.isFlyoutLabel) {
      this.svgText = svgText;
      this.workspace
        .getThemeManager()
        .subscribe(this.svgText, 'flyoutForegroundColour', 'fill');
    }

    const fontSize = style.getComputedStyle(svgText, 'fontSize');
    const fontWeight = style.getComputedStyle(svgText, 'fontWeight');
    const fontFamily = style.getComputedStyle(svgText, 'fontFamily');
    this.width = dom.getFastTextWidthWithSizeString(
      svgText,
      fontSize,
      fontWeight,
      fontFamily,
    );
    const fontMetrics = dom.measureFontMetrics(
      text,
      fontSize,
      fontWeight,
      fontFamily,
    );
    this.height = this.height || fontMetrics.height;

    if (!this.isFlyoutLabel) {
      this.width += 2 * FlyoutButton.TEXT_MARGIN_X;
      this.height += 2 * FlyoutButton.TEXT_MARGIN_Y;
      shadow?.setAttribute('width', String(this.width));
      shadow?.setAttribute('height', String(this.height));
    }
    rect.setAttribute('width', String(this.width));
    rect.setAttribute('height', String(this.height));

    svgText.setAttribute('x', String(this.width / 2));
    svgText.setAttribute(
      'y',
      String(this.height / 2 - fontMetrics.height / 2 + fontMetrics.baseline),
    );

    this.updateTransform();

    this.onMouseDownWrapper = browserEvents.conditionalBind(
      this.svgGroup,
      'pointerdown',
      this,
      this.onMouseDown,
    );
    this.onMouseUpWrapper = browserEvents.conditionalBind(
      this.svgGroup,
      'pointerup',
      this,
      this.onMouseUp,
    );
  }

  createDom(): SVGElement {
    // No-op, now handled in constructor. Will be removed in followup refactor
    // PR that updates the flyout classes to use inflaters.
    return this.svgGroup;
  }

  /** Correctly position the flyout button and make it visible. */
  show() {
    this.updateTransform();
    this.svgGroup!.setAttribute('display', 'block');
  }

  /** Update SVG attributes to match internal state. */
  private updateTransform() {
    this.svgGroup!.setAttribute(
      'transform',
      'translate(' + this.position.x + ',' + this.position.y + ')',
    );
  }

  /**
   * Move the button to the given x, y coordinates.
   *
   * @param x The new x coordinate.
   * @param y The new y coordinate.
   */
  moveTo(x: number, y: number) {
    this.position.x = x;
    this.position.y = y;
    this.updateTransform();
  }

  /**
   * Move the element by a relative offset.
   *
   * @param dx Horizontal offset in workspace units.
   * @param dy Vertical offset in workspace units.
   * @param _reason Why is this move happening?  'user', 'bump', 'snap'...
   */
  moveBy(dx: number, dy: number, _reason?: string[]) {
    this.moveTo(this.position.x + dx, this.position.y + dy);
  }

  /** @returns Whether or not the button is a label. */
  isLabel(): boolean {
    return this.isFlyoutLabel;
  }

  /**
   * Location of the button.
   *
   * @returns x, y coordinates.
   * @internal
   */
  getPosition(): Coordinate {
    return this.position;
  }

  /**
   * Returns the coordinates of a bounded element describing the dimensions of
   * the element. Coordinate system: workspace coordinates.
   *
   * @returns Object with coordinates of the bounded element.
   */
  getBoundingRectangle() {
    return new Rect(
      this.position.y,
      this.position.y + this.height,
      this.position.x,
      this.position.x + this.width,
    );
  }

  /** @returns Text of the button. */
  getButtonText(): string {
    return this.text;
  }

  /**
   * Get the button's target workspace.
   *
   * @returns The target workspace of the flyout where this button resides.
   */
  getTargetWorkspace(): WorkspaceSvg {
    return this.targetWorkspace;
  }

  /**
   * Get the button's workspace.
   *
   * @returns The workspace in which to place this button.
   */
  getWorkspace(): WorkspaceSvg {
    return this.workspace;
  }

  /** Dispose of this button. */
  dispose() {
    browserEvents.unbind(this.onMouseDownWrapper);
    browserEvents.unbind(this.onMouseUpWrapper);
    if (this.svgGroup) {
      dom.removeNode(this.svgGroup);
    }
    if (this.svgText) {
      this.workspace.getThemeManager().unsubscribe(this.svgText);
    }
  }

  /**
   * Add the cursor SVG to this buttons's SVG group.
   *
   * @param cursorSvg The SVG root of the cursor to be added to the button SVG
   *     group.
   */
  setCursorSvg(cursorSvg: SVGElement) {
    if (!cursorSvg) {
      this.cursorSvg = null;
      return;
    }
    if (this.svgGroup) {
      this.svgGroup.appendChild(cursorSvg);
      this.cursorSvg = cursorSvg;
    }
  }

  /**
   * Do something when the button is clicked.
   *
   * @param e Pointer up event.
   */
  private onMouseUp(e: PointerEvent) {
    const gesture = this.targetWorkspace.getGesture(e);
    if (gesture) {
      gesture.cancel();
    }

    if (this.isFlyoutLabel && this.callbackKey) {
      console.warn(
        'Labels should not have callbacks. Label text: ' + this.text,
      );
    } else if (
      !this.isFlyoutLabel &&
      !(
        this.callbackKey &&
        this.targetWorkspace.getButtonCallback(this.callbackKey)
      )
    ) {
      console.warn('Buttons should have callbacks. Button text: ' + this.text);
    } else if (!this.isFlyoutLabel) {
      const callback = this.targetWorkspace.getButtonCallback(this.callbackKey);
      if (callback) {
        callback(this);
      }
    }
  }

  private onMouseDown(e: PointerEvent) {
    const gesture = this.targetWorkspace.getGesture(e);
    const flyout = this.targetWorkspace.getFlyout();
    if (gesture && flyout) {
      gesture.handleFlyoutStart(e, flyout);
    }
  }

  /**
   * @returns The root SVG element of this rendered element.
   */
  getSvgRoot() {
    return this.svgGroup;
  }

  /** See IFocusableNode.getFocusableElement. */
  getFocusableElement(): HTMLElement | SVGElement {
    return this.svgGroup;
  }

  /** See IFocusableNode.getFocusableTree. */
  getFocusableTree(): IFocusableTree {
    return this.workspace;
  }

  /** See IFocusableNode.onNodeFocus. */
  onNodeFocus(): void {
    const xy = this.getPosition();
    const bounds = new Rect(xy.y, xy.y + this.height, xy.x, xy.x + this.width);
    this.workspace.scrollBoundsIntoView(bounds);
  }

  /** See IFocusableNode.onNodeBlur. */
  onNodeBlur(): void {}

  /** See IFocusableNode.canBeFocused. */
  canBeFocused(): boolean {
    return true;
  }
}

/** CSS for buttons and labels. See css.js for use. */
Css.register(`
.blocklyFlyoutButton {
  fill: #888;
  cursor: default;
}

.blocklyFlyoutButtonShadow {
  fill: #666;
}

.blocklyFlyoutButton:hover {
  fill: #aaa;
}

.blocklyFlyoutLabel {
  cursor: default;
}

.blocklyFlyoutLabelBackground {
  opacity: 0;
}
`);
