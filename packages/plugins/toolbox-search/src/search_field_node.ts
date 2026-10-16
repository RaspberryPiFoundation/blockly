/**
 * @license
 * Copyright 2026 Raspberry Pi Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';

/**
 * The field's box size, in CSS pixels.
 */
const FIELD_HEIGHT = 24;
const FIELD_WIDTH = 150;

/**
 * The search field that a search category pins to the top of its flyout.
 *
 * The field is deliberately not a flyout item. Typing into it rebuilds the
 * flyout's contents, which would dispose the field along with everything else.
 * It is positioned over the flyout instead, and reserves room for itself with
 * a separator at the head of the flyout's contents.
 *
 * It is still a focusable node of the flyout's workspace, so focusing it does
 * not read as leaving the toolbox and close the flyout.
 */
export class SearchFieldNode
  implements Blockly.IFocusableNode, Blockly.IPositionable
{
  private readonly input: HTMLInputElement;
  private readonly foreignObject: SVGForeignObjectElement;
  private readonly boundEvents: Blockly.browserEvents.Data[] = [];

  /**
   * @param id The DOM ID of the input, which the flyout's workspace matches
   *     against to resolve focus back to this node. IComponent requires this
   *     exact name.
   * @param workspace The workspace whose injection div the field is added to.
   * @param flyout The flyout the field sits above.
   * @param category The category the field belongs to.
   */
  constructor(
    readonly id: string,
    private readonly workspace: Blockly.WorkspaceSvg,
    private readonly flyout: Blockly.Flyout,
    private readonly category: Blockly.ISelectableToolboxItem,
  ) {
    const html = Blockly.utils.dom.HTML_NS;
    this.foreignObject = Blockly.utils.dom.createSvgElement(
      Blockly.utils.Svg.FOREIGNOBJECT,
      {},
    );
    const body = document.createElementNS(html, 'body');
    body.setAttribute('xmlns', html);
    body.className = 'blocklyMinimalBody blocklyToolboxSearchField';
    this.input = document.createElementNS(html, 'input') as HTMLInputElement;
    this.input.id = id;
    this.input.type = 'search';
    this.input.placeholder = Blockly.Msg['TOOLBOX_SEARCH_PLACEHOLDER'];
    Blockly.utils.aria.setState(
      this.input,
      Blockly.utils.aria.State.LABEL,
      Blockly.Msg['TOOLBOX_SEARCH_PLACEHOLDER'],
    );

    body.appendChild(this.input);
    this.foreignObject.appendChild(body);
    this.setVisible(false);

    flyout.getWorkspace().getSvgGroup().appendChild(this.foreignObject);

    workspace.getComponentManager().addComponent({
      component: this,
      weight: 0,
      capabilities: [Blockly.ComponentManager.Capability.POSITIONABLE],
    });
    flyout
      .getWorkspace()
      .getComponentManager()
      .addComponent({
        component: this,
        weight: 0,
        capabilities: [Blockly.ComponentManager.Capability.FOCUSABLE],
      });

    this.boundEvents.push(
      Blockly.browserEvents.conditionalBind(
        flyout.getWorkspace().getParentSvg(),
        'focusin',
        this,
        (event: FocusEvent) => this.keepClearOfField(event.target),
      ),
    );
  }

  /**
   * Scrolls the flyout on if a newly focused item would sit under the field.
   *
   * Blockly scrolls a focused item just far enough to reach the edge of the
   * viewport, which in a horizontal flyout is the edge the field covers.
   *
   * @param target The element that just took focus.
   */
  private keepClearOfField(target: EventTarget | null) {
    if (
      !this.flyout.horizontalLayout ||
      !this.canBeFocused() ||
      !(target instanceof Element)
    ) {
      return;
    }

    const flyoutWorkspace = this.flyout.getWorkspace();

    // Focus lands on an element inside the item, so climb to the item itself.
    const canvas = flyoutWorkspace.getCanvas();
    let root: Element | null = target;
    while (root && root.parentNode !== canvas) root = root.parentElement;
    if (!root) return;

    const item = root.getBoundingClientRect();
    if (!item.width) return;
    const field = this.foreignObject.getBoundingClientRect();
    // Leave the same gap the flyout leaves before its first item, so that an
    // item reached by wrapping lands where scrolling to the start would put it.
    // The rects are CSS pixels and these two are workspace units.
    const clearance =
      (this.flyout.MARGIN +
        flyoutWorkspace.getRenderer().getConstants().TAB_WIDTH) *
      flyoutWorkspace.scale;
    const overlap = this.flyout.RTL
      ? item.right - (field.left - clearance)
      : field.right + clearance - item.left;
    if (overlap <= 0) return;

    const offset = this.flyout.RTL ? overlap : -overlap;
    flyoutWorkspace.scrollbar?.setX(
      flyoutWorkspace.getMetricsManager().getViewMetrics().left + offset,
    );
  }

  /** @returns The search input, which the category binds its listeners to. */
  getInput(): HTMLInputElement {
    return this.input;
  }

  /** See IFocusableNode.getFocusableElement. */
  getFocusableElement(): HTMLElement | SVGElement {
    return this.input;
  }

  /**
   * See IFocusableNode.getFocusableTree.
   *
   * @returns The flyout's workspace, not the main one: that is what stops
   *     focusing the field reading as leaving the toolbox.
   */
  getFocusableTree(): Blockly.IFocusableTree {
    return this.flyout.getWorkspace();
  }

  /**
   * See IFocusableNode.canBeFocused.
   *
   * @returns Whether its own category's flyout is the one on screen. This is
   *     what keeps the field out of other categories' flyouts, since the
   *     navigator it installs serves all of them.
   */
  canBeFocused(): boolean {
    return (
      this.flyout.isVisible() &&
      this.workspace.getToolbox()?.getSelectedItem() === this.category
    );
  }

  /** See IFocusableNode.onNodeFocus. */
  onNodeFocus(): void {}

  /** See IFocusableNode.onNodeBlur. */
  onNodeBlur(): void {}

  /**
   * Shows or hides the field, which also governs whether it can be focused.
   *
   * @param visible Whether the field should be shown.
   */
  setVisible(visible: boolean) {
    this.foreignObject.style.display = visible ? 'block' : 'none';
  }

  /**
   * Returns the bounding rectangle of the UI element in pixel units relative to
   * the Blockly injection div.
   *
   * @returns The component's bounding box. Null in this case since we don't need
   *     other elements to avoid the toolbox search field.
   */
  getBoundingRectangle(): Blockly.utils.Rect | null {
    return null;
  }

  /**
   * Aligns the field with the top edge of the flyout.
   */
  position() {
    const flyout = this.flyout;
    if (!flyout.isVisible()) return;

    const margin = flyout.MARGIN;
    // The flyout's own group is the origin, so getX()/getY() drop out.
    let left = margin;
    let width = FIELD_WIDTH;

    if (flyout.horizontalLayout) {
      if (this.workspace.RTL) left = flyout.getWidth() - margin - width;
    } else {
      // Fit the search field within the flyout, accounting for the scrollbar.
      const scrollbarInset =
        Blockly.Scrollbar.scrollbarThickness + flyout.SCROLLBAR_MARGIN;
      if (this.workspace.RTL) left += scrollbarInset;
      width = Math.max(flyout.getWidth() - 2 * margin - scrollbarInset, 0);
    }

    this.foreignObject.setAttribute('x', `${left}`);
    this.foreignObject.setAttribute('y', `${margin}`);
    this.foreignObject.setAttribute('width', `${width}`);
    this.foreignObject.setAttribute('height', `${FIELD_HEIGHT}`);
  }

  /**
   * Returns the room the flyout should reserve at its head for this field.
   *
   * @returns The size of the field along the flyout's axis, in workspace units.
   */
  getRequiredGap(): number {
    const flyout = this.flyout;
    const scale = flyout.getWorkspace().scale || 1;
    // Leave the flyout's own margin below the field as well as room for the
    // field itself.
    const clearance = flyout.MARGIN;
    const size = flyout.horizontalLayout ? FIELD_WIDTH : FIELD_HEIGHT;
    return (size + clearance) / scale;
  }

  /**
   * Removes the field and unregisters it from both component managers.
   */
  dispose() {
    for (const event of this.boundEvents) {
      Blockly.browserEvents.unbind(event);
    }
    this.boundEvents.length = 0;
    this.workspace.getComponentManager().removeComponent(this.id);
    this.flyout.getWorkspace().getComponentManager().removeComponent(this.id);
    this.foreignObject.remove();
  }
}

Blockly.Css.register(`
.blocklyToolboxSearchField>input {
  width: 100%;
}
`);
