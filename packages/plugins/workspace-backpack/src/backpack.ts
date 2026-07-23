/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview A backpack that lives on top of the workspace.
 * @author kozbial@google.com (Monica Kozbial)
 */

/* eslint-disable @typescript-eslint/naming-convention */

import * as Blockly from 'blockly/core';

import {registerContextMenus} from './backpack_helpers';
import {BackpackOptions, parseOptions} from './options';
import {BackpackChange, BackpackOpen} from './ui_events';
import {Backpackable, isBackpackable} from './backpackable';

/**
 * Class for backpack that can be used save blocks from the workspace for
 * future use.
 */
export class Backpack
  extends Blockly.DragTarget
  implements
    Blockly.IComponent,
    Blockly.IContextMenu,
    Blockly.IAutoHideable,
    Blockly.IPositionable,
    Blockly.IFocusableNode,
    Blockly.IContextMenu
{
  /** The unique id for this component. */
  id = 'backpack';

  /**
   * The backpack options, such as which context menus to show, whether to
   * allow opening the backpack when empty and whether to use a different
   * image when the backpack contains blocks.
   */
  private options: BackpackOptions;

  /** The backpack flyout. Initialized during init. */
  protected flyout_: Blockly.IFlyout | null = null;

  /** A list of JSON (stored as strings) representing blocks in the backpack. */
  protected contents_: string[] = [];

  /** Array holding info needed to unbind events. Used for disposing. */
  private boundEvents: Blockly.browserEvents.Data[] = [];

  /** Left coordinate of the backpack in pixels. */
  protected left_ = 0;

  /** Top coordinate of the backpack in pixels. */
  protected top_ = 0;

  /** Width of the backpack in pixels. Used for clip path. */
  protected readonly WIDTH_ = 40;

  /** Height of the backpack in pixels. Used for clip path. */
  protected readonly HEIGHT_ = 60;

  /** Distance between backpack and bottom/top edge of workspace in pixels. */
  protected readonly MARGIN_VERTICAL_ = 20;

  /** Distance between backpack and right/left edge of workspace in pixels. */
  protected readonly MARGIN_HORIZONTAL_ = 20;

  /** Extent of hotspot on all sides beyond the size of the image in pixels. */
  protected readonly HOTSPOT_MARGIN_ = 10;

  /** The SVG group containing the backpack. */
  protected svgGroup_: SVGElement | null = null;

  /** The SVG image of the backpack. */
  protected svgImg_: SVGImageElement | null = null;

  /** Top offset for backpack svg in pixels. */
  private spriteTop = 10;

  /** Left offset for backpack svg in pixels. */
  private spriteLeft = 20;

  /** Width/Height of svg in pixels. */
  private readonly spriteSize = 80;

  /** Whether or not the plugin has been initialized. */
  protected initialized_ = false;

  /**
   * Constructor for a backpack.
   *
   * @param workspace_ The target workspace that
   *     the backpack will be added to.
   * @param backpackOptions The backpack options to use.
   */
  constructor(
    protected workspace_: Blockly.WorkspaceSvg,
    backpackOptions?: BackpackOptions,
  ) {
    super();
    this.options = parseOptions(backpackOptions);
    this.registerSerializer();
  }

  /**
   * Registers serializer if options.skipSerializerRegistration is false
   * and it hasn't been registered already.
   */
  private registerSerializer() {
    if (this.options.skipSerializerRegistration) {
      return;
    }

    if (
      Blockly.registry.hasItem(Blockly.registry.Type.SERIALIZER, 'backpack')
    ) {
      return;
    }

    Blockly.serialization.registry.register(
      'backpack',
      new BackpackSerializer(),
    );
  }

  /**
   * Initializes the backpack.
   */
  init() {
    this.workspace_.getComponentManager().addComponent({
      component: this,
      weight: 2,
      capabilities: [
        Blockly.ComponentManager.Capability.AUTOHIDEABLE,
        Blockly.ComponentManager.Capability.DRAG_TARGET,
        Blockly.ComponentManager.Capability.POSITIONABLE,
        Blockly.ComponentManager.Capability.FOCUSABLE,
      ],
    });
    this.initFlyout();
    this.createDom();
    this.attachListeners();
    if (this.options.contextMenu) {
      registerContextMenus(this.options.contextMenu, this.workspace_);
    }
    this.initialized_ = true;
    this.workspace_.resize();
  }

  /**
   * Disposes of workspace search.
   * Unlink from all DOM elements and remove all event listeners
   * to prevent memory leaks.
   */
  dispose() {
    if (this.svgGroup_) {
      Blockly.utils.dom.removeNode(this.svgGroup_);
    }
    for (const event of this.boundEvents) {
      Blockly.browserEvents.unbind(event);
    }
    this.boundEvents.length = 0;
  }

  /**
   * Creates and initializes the flyout and inserts it into the dom.
   */
  protected initFlyout() {
    // Create flyout options.
    const flyoutWorkspaceOptions = new Blockly.Options({
      scrollbars: true,
      parentWorkspace: this.workspace_,
      rtl: this.workspace_.RTL,
      oneBasedIndex: this.workspace_.options.oneBasedIndex,
      renderer: this.workspace_.options.renderer,
      rendererOverrides: this.workspace_.options.rendererOverrides || undefined,
      move: {
        scrollbars: true,
      },
    });
    // Create vertical or horizontal flyout.
    if (this.workspace_.horizontalLayout) {
      flyoutWorkspaceOptions.toolboxPosition =
        this.workspace_.toolboxPosition === Blockly.utils.toolbox.Position.TOP
          ? Blockly.utils.toolbox.Position.BOTTOM
          : Blockly.utils.toolbox.Position.TOP;
      const HorizontalFlyout = Blockly.registry.getClassFromOptions(
        Blockly.registry.Type.FLYOUTS_HORIZONTAL_TOOLBOX,
        this.workspace_.options,
        true,
      );
      if (HorizontalFlyout) {
        this.flyout_ = new HorizontalFlyout(flyoutWorkspaceOptions);
      } else {
        throw new Error('HorizontalFlyout does not exist');
      }
    } else {
      flyoutWorkspaceOptions.toolboxPosition =
        this.workspace_.toolboxPosition === Blockly.utils.toolbox.Position.RIGHT
          ? Blockly.utils.toolbox.Position.LEFT
          : Blockly.utils.toolbox.Position.RIGHT;
      const VerticalFlyout = Blockly.registry.getClassFromOptions(
        Blockly.registry.Type.FLYOUTS_VERTICAL_TOOLBOX,
        this.workspace_.options,
        true,
      );
      if (VerticalFlyout) {
        this.flyout_ = new VerticalFlyout(flyoutWorkspaceOptions);
      } else {
        throw new Error('VerticalFlyout does not exist');
      }
    }
    // Add flyout to DOM.
    const parentNode = this.workspace_.getParentSvg().parentNode;
    parentNode?.appendChild(this.flyout_?.createDom(Blockly.utils.Svg.SVG));
    this.flyout_.init(this.workspace_);
  }

  /**
   * Creates DOM for UI element.
   */
  protected createDom() {
    this.svgGroup_ = Blockly.utils.dom.createSvgElement(
      Blockly.utils.Svg.G,
      {
        id: Blockly.utils.idGenerator.getNextUniqueId(),
        tabindex: '0',
        class: 'blocklyBackpackContainer',
      },
      null,
    );
    Blockly.utils.aria.setState(
      this.svgGroup_,
      Blockly.utils.aria.State.LABEL,
      Blockly.Msg['OPEN_BACKPACK'],
    );
    Blockly.utils.aria.setRole(this.svgGroup_, Blockly.utils.aria.Role.BUTTON);
    const margin = 8;
    const cornerRadius = 2;
    Blockly.utils.dom.createSvgElement(
      Blockly.utils.Svg.RECT,
      {
        width: this.WIDTH_ + margin,
        height: this.HEIGHT_ + margin,
        class: 'blocklyFocusRing',
        x: -1 * (margin / 2),
        y: -1 * (margin / 2),
        rx: cornerRadius,
        ry: cornerRadius,
        fill: 'none',
      },
      this.svgGroup_,
    );
    const rnd = Blockly.utils.idGenerator.genUid();
    const clip = Blockly.utils.dom.createSvgElement(
      Blockly.utils.Svg.CLIPPATH,
      {id: 'blocklyBackpackClipPath' + rnd},
      this.svgGroup_,
    );
    Blockly.utils.dom.createSvgElement(
      Blockly.utils.Svg.RECT,
      {
        width: this.WIDTH_,
        height: this.HEIGHT_,
      },
      clip,
    );
    this.svgImg_ = Blockly.utils.dom.createSvgElement(
      Blockly.utils.Svg.IMAGE,
      {
        'class': 'blocklyBackpack',
        'clip-path': 'url(#blocklyBackpackClipPath' + rnd + ')',
        'width': this.spriteSize + 'px',
        'x': -this.spriteLeft,
        'height': this.spriteSize + 'px',
        'y': -this.spriteTop,
      },
      this.svgGroup_,
    );
    this.svgImg_.setAttributeNS(
      Blockly.utils.dom.XLINK_NS,
      'xlink:href',
      backpackSvgDataUri,
    );

    Blockly.utils.dom.insertAfter(
      this.svgGroup_,
      this.workspace_.getBubbleCanvas(),
    );
  }

  /**
   * Attaches event listeners.
   */
  protected attachListeners() {
    if (!this.svgGroup_) return;
    this.addEvent(
      this.svgGroup_,
      'mousedown',
      this,
      this.blockMouseDownWhenOpenable,
    );
    this.addEvent(this.svgGroup_, 'mouseup', this, this.onClick);
    this.addEvent(this.svgGroup_, 'mouseover', this, this.onMouseOver);
    this.addEvent(this.svgGroup_, 'mouseout', this, this.onMouseOut);
  }

  /**
   * Helper method for adding an event.
   *
   * @param node Node upon which to listen.
   * @param name Event name to listen to (e.g. 'mousedown').
   * @param thisObject The value of 'this' in the function.
   * @param func Function to call when event is triggered.
   */
  private addEvent(
    node: Element,
    name: string,
    thisObject: object,
    func: (event: Event) => void,
  ) {
    const event = Blockly.browserEvents.bind(node, name, thisObject, func);
    this.boundEvents.push(event);
  }

  /**
   * Returns the backpack flyout.
   *
   * @returns The backpack flyout.
   */
  getFlyout(): Blockly.IFlyout | null {
    return this.flyout_;
  }

  /**
   * Returns the bounding rectangle of the drag target area in pixel units
   * relative to viewport.
   *
   * @returns The component's bounding box. Null if drag
   *   target area should be ignored.
   */
  getClientRect(): Blockly.utils.Rect | null {
    if (!this.svgGroup_) {
      return null;
    }

    const clientRect = this.svgGroup_.getBoundingClientRect();
    const top = clientRect.top + this.spriteTop - this.HOTSPOT_MARGIN_;
    const bottom = top + this.HEIGHT_ + 2 * this.HOTSPOT_MARGIN_;
    const left = clientRect.left + this.spriteLeft - this.HOTSPOT_MARGIN_;
    const right = left + this.WIDTH_ + 2 * this.HOTSPOT_MARGIN_;
    return new Blockly.utils.Rect(top, bottom, left, right);
  }

  /**
   * Returns the bounding rectangle of the UI element in pixel units relative to
   * the Blockly injection div.
   *
   * @returns The component’s bounding box.
   */
  getBoundingRectangle(): Blockly.utils.Rect {
    return new Blockly.utils.Rect(
      this.top_,
      this.top_ + this.HEIGHT_,
      this.left_,
      this.left_ + this.WIDTH_,
    );
  }

  /**
   * Positions the backpack.
   * It is positioned in the opposite corner to the corner the
   * categories/toolbox starts at.
   *
   * @param metrics The workspace metrics.
   * @param savedPositions List of rectangles that
   *     are already on the workspace.
   */
  position(
    metrics: Blockly.MetricsManager.UiMetrics,
    savedPositions: Blockly.utils.Rect[],
  ) {
    if (!this.initialized_) {
      return;
    }

    const scrollbars = this.workspace_.scrollbar;
    const hasVerticalScrollbars =
      scrollbars && scrollbars.isVisible() && scrollbars.canScrollVertically();
    const hasHorizontalScrollbars =
      scrollbars &&
      scrollbars.isVisible() &&
      scrollbars.canScrollHorizontally();

    if (
      metrics.toolboxMetrics.position === Blockly.TOOLBOX_AT_LEFT ||
      (this.workspace_.horizontalLayout && !this.workspace_.RTL)
    ) {
      // Right corner placement.
      this.left_ =
        metrics.absoluteMetrics.left +
        metrics.viewMetrics.width -
        this.WIDTH_ -
        this.MARGIN_HORIZONTAL_;
      if (hasVerticalScrollbars && !this.workspace_.RTL) {
        this.left_ -= Blockly.Scrollbar.scrollbarThickness;
      }
    } else {
      // Left corner placement.
      this.left_ = this.MARGIN_HORIZONTAL_;
      if (hasVerticalScrollbars && this.workspace_.RTL) {
        this.left_ += Blockly.Scrollbar.scrollbarThickness;
      }
    }

    const startAtBottom =
      metrics.toolboxMetrics.position === Blockly.TOOLBOX_AT_BOTTOM;
    if (startAtBottom) {
      // Bottom corner placement
      this.top_ =
        metrics.absoluteMetrics.top +
        metrics.viewMetrics.height -
        this.HEIGHT_ -
        this.MARGIN_VERTICAL_;
      if (hasHorizontalScrollbars) {
        // The horizontal scrollbars are always positioned on the bottom.
        this.top_ -= Blockly.Scrollbar.scrollbarThickness;
      }
    } else {
      // Upper corner placement
      this.top_ = metrics.absoluteMetrics.top + this.MARGIN_VERTICAL_;
    }

    // Check for collision and bump if needed.
    let boundingRect = this.getBoundingRectangle();
    for (let i = 0, otherEl; (otherEl = savedPositions[i]); i++) {
      if (boundingRect.intersects(otherEl)) {
        if (startAtBottom) {
          // Bump up.
          this.top_ = otherEl.top - this.HEIGHT_ - this.MARGIN_VERTICAL_;
        } else {
          // Bump down.
          this.top_ = otherEl.bottom + this.MARGIN_VERTICAL_;
        }
        // Recheck other savedPositions
        boundingRect = this.getBoundingRectangle();
        i = -1;
      }
    }

    if (this.svgGroup_) {
      this.svgGroup_.setAttribute(
        'transform',
        `translate(${this.left_},${this.top_})`,
      );
    }
  }

  /**
   * Returns the count of items in the backpack.
   *
   * @returns The count of items.
   */
  getCount(): number {
    return this.contents_.length;
  }

  /**
   * Returns backpack contents.
   *
   * @returns The backpack contents.
   */
  getContents(): string[] {
    // Return a shallow copy of the contents array.
    return [...this.contents_];
  }

  /**
   * Handles when a block or bubble is dropped on this component.
   * Should not handle delete here.
   *
   * @param dragElement The block or bubble currently
   *   being dragged.
   */
  onDrop(dragElement: Blockly.IDraggable) {
    if (isBackpackable(dragElement)) {
      this.addBackpackable(dragElement);
    }
  }

  /**
   * Converts the provided block into a JSON string and
   * cleans the JSON of any unnecessary attributes
   *
   * @param block The block to convert.
   * @returns The JSON object as a string.
   */
  private blockToJsonString(block: Blockly.Block): string {
    const json = Blockly.serialization.blocks.save(
      block,
    ) as Blockly.utils.toolbox.FlyoutItemInfo | null;

    if (json) {
      // Add a 'kind' key so the flyout can recognize it as a block.
      json.kind = 'BLOCK';
      this.cleanFlyoutInfo(json);
    }

    return JSON.stringify(json);
  }

  /**
   * Removes unnecessary keys from flyout info in place.
   *
   * @param dirtyInfo The flyout info object to clean.
   */
  private cleanFlyoutInfo(dirtyInfo: Blockly.utils.toolbox.FlyoutItemInfo) {
    // The keys to remove.
    const removeKeys = [
      'id',
      'height',
      'width',
      'pinned',
      'enabled',
      'disabledReasons',
    ];

    // Traverse the object recursively.
    const traverseClean = function (
      obj: {[key: string]: unknown},
      keys: string[],
    ) {
      for (const key of Object.keys(obj)) {
        if (keys.indexOf(key) !== -1) {
          delete obj[key];
          continue;
        }

        const item = obj[key];
        if (item !== null && typeof item === 'object') {
          traverseClean(item as {[key: string]: unknown}, keys);
        }
      }
    };

    traverseClean(dirtyInfo as unknown as {[key: string]: unknown}, removeKeys);
  }

  /**
   * Converts serialized XML to its equivalent serialized JSON string
   *
   * @param blockXml The XML serialized block.
   * @returns The JSON object as a string.
   */
  private blockXmlToJsonString(blockXml: string): string {
    if (!blockXml.startsWith('<block')) {
      throw new Error('Unrecognized XML format');
    }

    const workspace = new Blockly.Workspace();
    try {
      const block = Blockly.Xml.domToBlock(
        Blockly.utils.xml.textToDom(blockXml),
        workspace,
      );
      return this.blockToJsonString(block);
    } finally {
      workspace.dispose();
    }
  }

  /**
   * Returns whether the backpack contains a duplicate of the provided Block.
   *
   * @param block The block to check.
   * @returns Whether the backpack contains a duplicate of the
   *     provided block.
   */
  containsBlock(block: Blockly.Block): boolean {
    if (isBackpackable(block)) {
      return this.containsBackpackable(block);
    } else {
      return this.contents_.indexOf(this.blockToJsonString(block)) !== -1;
    }
  }

  /**
   * Adds the specified block to backpack.
   *
   * @param block The block to be added to the backpack.
   */
  addBlock(block: Blockly.Block) {
    if (isBackpackable(block)) {
      this.addBackpackable(block);
    } else {
      this.addItem(this.blockToJsonString(block));
    }
  }

  /**
   * Adds the provided blocks to backpack.
   *
   * @param blocks The blocks to be added to the
   *     backpack.
   */
  addBlocks(blocks: Blockly.Block[]) {
    for (const block of blocks) {
      if (isBackpackable(block)) {
        this.addBackpackable(block);
      } else {
        this.addItem(this.blockToJsonString(block));
      }
    }
  }

  /**
   * Removes the specified block from the backpack.
   *
   * @param block The block to be removed from the backpack.
   */
  removeBlock(block: Blockly.Block) {
    if (isBackpackable(block)) {
      this.removeBackpackable(block);
    } else {
      this.removeItem(this.blockToJsonString(block));
    }
  }

  /**
   * @param backpackable The backpackable we want to check for existence within
   *     the backpack.
   * @return whether the backpack contains a duplicate of the provided
   *     backpackable.
   */
  containsBackpackable(backpackable: Backpackable): boolean {
    return backpackable
      .toFlyoutInfo()
      .every((info) => this.contents_.indexOf(JSON.stringify(info)) !== -1);
  }

  /**
   * @param backpackable The backpackable to add to the backpack.
   */
  addBackpackable(backpackable: Backpackable) {
    this.addBackpackables([backpackable]);
  }

  /** @param backpackables The backpackables to add to the backpack. */
  addBackpackables(backpackables: Backpackable[]) {
    this.addItems(
      backpackables
        .map((b) => b.toFlyoutInfo())
        .reduce((acc, curr) => [...acc, ...curr])
        .map((info) => {
          this.cleanFlyoutInfo(info);
          return JSON.stringify(info);
        }),
    );
  }

  /** @param backpackable The backpackable to remove from the backpack. */
  removeBackpackable(backpackable: Backpackable) {
    for (const info of backpackable.toFlyoutInfo()) {
      this.removeItem(JSON.stringify(info));
    }
  }

  /**
   * Adds item to backpack.
   *
   * @param item Text representing the JSON of a block to add,
   *     cleaned of all unnecessary attributes.
   */
  addItem(item: string) {
    this.addItems([item]);
  }

  /**
   * Adds multiple items to the backpack.
   *
   * @param items The backpack contents to add.
   */
  addItems(items: string[]) {
    const addedItems = this.filterDuplicates(items);
    if (addedItems.length) {
      this.contents_.unshift(...addedItems);
      this.onContentChange();
    }
  }

  /**
   * Removes item from the backpack.
   *
   * @param item Text representing the JSON of a block to remove,
   * cleaned of all unnecessary attributes.
   */
  removeItem(item: string) {
    const itemIndex = this.contents_.indexOf(item);
    if (itemIndex !== -1) {
      this.contents_.splice(itemIndex, 1);
      this.onContentChange();
    }
  }

  /**
   * Sets backpack contents.
   *
   * @param contents The new backpack contents.
   */
  setContents(contents: string[]) {
    this.contents_ = [];
    this.contents_ = this.filterDuplicates(
      // Support XML serialized content for backwards compatiblity:
      // https://github.com/RaspberryPiFoundation/blockly-samples/issues/1827
      contents.map((content) =>
        content.startsWith('<block')
          ? this.blockXmlToJsonString(content)
          : content,
      ),
    );
    this.onContentChange();
  }

  /**
   * Empties the backpack's contents. If the contents-flyout is currently open
   * it will be closed.
   */
  empty() {
    if (!this.getCount()) {
      return;
    }
    if (this.contents_.length) {
      this.contents_ = [];
      this.onContentChange();
    }
    this.close();
  }

  /**
   * Handles content change.
   */
  protected onContentChange() {
    this.maybeRefreshFlyoutContents();
    Blockly.Events.fire(new BackpackChange(this.workspace_.id));

    if (!this.options.useFilledBackpackImage || !this.svgImg_) return;
    if (this.contents_.length > 0) {
      this.svgImg_.setAttributeNS(
        Blockly.utils.dom.XLINK_NS,
        'xlink:href',
        backpackFilledSvgDataUri,
      );
    } else {
      this.svgImg_.setAttributeNS(
        Blockly.utils.dom.XLINK_NS,
        'xlink:href',
        backpackSvgDataUri,
      );
    }
  }

  /**
   * Returns a filtered list without duplicates within itself and without any
   * shared elements with this.contents_.
   *
   * @param array The array of items to filter.
   * @returns The filtered list.
   */
  private filterDuplicates(array: string[]): string[] {
    return array.filter((item, idx) => {
      return array.indexOf(item) === idx && this.contents_.indexOf(item) === -1;
    });
  }

  /**
   * Returns whether the backpack is open-able.
   *
   * @returns Whether the backpack is open-able.
   */
  protected isOpenable(): boolean {
    return !this.isOpen() && this.options.allowEmptyBackpackOpen
      ? true
      : this.getCount() > 0;
  }

  /**
   * Returns whether the backpack is open.
   *
   * @returns Whether the backpack is open.
   */
  isOpen(): boolean {
    return this.flyout_ ? this.flyout_.isVisible() : false;
  }

  /**
   * Opens the backpack flyout.
   */
  open() {
    if (!this.isOpenable() || !this.flyout_ || !this.svgGroup_) {
      return;
    }
    Blockly.utils.aria.setState(
      this.svgGroup_,
      Blockly.utils.aria.State.LABEL,
      Blockly.Msg['CLOSE_BACKPACK'],
    );
    const jsons = this.contents_.map((text) => JSON.parse(text));
    this.flyout_.show(jsons);
    this.workspace_.scrollbar?.setVisible(false);
    if (Blockly.keyboardNavigationController.getIsActive()) {
      const flyoutWorkspace = this.flyout_.getWorkspace();
      const firstItem = flyoutWorkspace?.getNavigator().getFirstNode();
      if (firstItem) {
        Blockly.getFocusManager().focusNode(firstItem);
      }
    }
    Blockly.Events.fire(new BackpackOpen(true, this.workspace_.id));
  }

  /**
   * Refreshes backpack flyout contents if the flyout is open.
   */
  protected maybeRefreshFlyoutContents() {
    if (!this.isOpen()) {
      return;
    }
    const json = this.contents_.map((text) => JSON.parse(text));
    this.flyout_?.show(json);
  }

  /**
   * Closes the backpack flyout.
   */
  close() {
    if (!this.isOpen() || !this.svgGroup_) {
      return;
    }
    this.flyout_?.hide();
    this.workspace_.scrollbar?.setVisible(true);

    Blockly.Events.fire(new BackpackOpen(false, this.workspace_.id));
    Blockly.utils.aria.setState(
      this.svgGroup_,
      Blockly.utils.aria.State.LABEL,
      Blockly.Msg['OPEN_BACKPACK'],
    );
  }

  /**
   * Hides the component. Called in Blockly.hideChaff.
   *
   * @param onlyClosePopups Whether only popups should be closed.
   *     Flyouts should not be closed if this is true.
   */
  autoHide(onlyClosePopups: boolean) {
    // The backpack flyout always autocloses because it overlays the backpack UI
    // (no backpack to click to close it).
    if (!onlyClosePopups) {
      this.close();
    }
  }

  /**
   * Handle click event.
   *
   * @param e Mouse event.
   */
  protected onClick(e?: Event) {
    if (e instanceof MouseEvent && Blockly.browserEvents.isRightButton(e)) {
      return;
    }
    this.isOpen() ? this.close() : this.open();
    const uiEvent = new (Blockly.Events.get(Blockly.Events.CLICK))(
      null,
      this.workspace_.id,
      'backpack',
    );
    Blockly.Events.fire(uiEvent);
  }

  /**
   * Handles when a cursor with a block or bubble enters this drag target.
   *
   * @param dragElement The block or bubble currently
   *   being dragged.
   */
  onDragEnter(dragElement: Blockly.IDraggable) {
    if (isBackpackable(dragElement)) {
      this.updateHoverStying(true);
    }
  }

  /**
   * Handles when a cursor with a block or bubble exits this drag target.
   *
   * @param dragElement The block or bubble currently
   *   being dragged.
   */
  onDragExit(dragElement: Blockly.IDraggable) {
    this.updateHoverStying(false);
  }

  /**
   * Handles a mouseover event.
   */
  private onMouseOver() {
    if (this.isOpenable()) {
      this.updateHoverStying(true);
    }
  }

  /**
   * Handles a mouseout event.
   */
  private onMouseOut() {
    this.updateHoverStying(false);
  }

  /**
   * Adds or removes styling to darken the backpack to show it is interactable.
   *
   * @param addClass True to add styling, false to remove.
   */
  protected updateHoverStying(addClass: boolean) {
    const backpackDarken = 'blocklyBackpackDarken';
    if (this.svgImg_) {
      if (addClass) {
        Blockly.utils.dom.addClass(this.svgImg_, backpackDarken);
      } else {
        Blockly.utils.dom.removeClass(this.svgImg_, backpackDarken);
      }
    }
  }

  /**
   * Returns whether the provided block or bubble should not be moved after
   * being dropped on this component. If true, the element will return to where
   * it was when the drag started.
   *
   * @param dragElement The block or bubble currently
   *   being dragged.
   * @returns Whether the block or bubble provided should be returned
   *   to drag start.
   */
  shouldPreventMove(dragElement: Blockly.IDraggable): boolean {
    return dragElement instanceof Blockly.BlockSvg;
  }

  /**
   * Prevents a workspace scroll and click event if the backpack is openable.
   *
   * @param e A mouse down event.
   */
  protected blockMouseDownWhenOpenable(e: Event) {
    if (e instanceof MouseEvent) {
      if (Blockly.browserEvents.isRightButton(e)) {
        this.showContextMenu(e);
        e.stopPropagation();
        return;
      }

      if (this.isOpenable()) {
        e.stopPropagation(); // Don't start a workspace scroll.
      }
    }
  }

  getFocusableElement(): HTMLElement | SVGElement {
    if (!this.svgGroup_) {
      throw new Error('Attempted to focus an uninitialized backpack');
    }

    return this.svgGroup_;
  }

  getFocusableTree(): Blockly.IFocusableTree {
    return this.workspace_;
  }

  onNodeFocus(): void {}

  onNodeBlur(): void {}

  canBeFocused(): boolean {
    return true;
  }

  performAction(e?: Event): void {
    this.onClick(e);
  }

  /**
   * Show the context menu for the backpack.
   *
   * @param e Event that triggered the display of the context menu.
   */
  showContextMenu(e: Event): void {
    if (!this.options.contextMenu?.emptyBackpack) return;

    Blockly.ContextMenu.show(
      e,
      [
        {
          text: Blockly.Msg['EMPTY_BACKPACK'],
          enabled: !!this.getCount(),
          callback: () => {
            this.empty();
          },
          weight: 0,
          id: 'empty_backpack',
        },
      ],
      this.workspace_.RTL,
      this.workspace_,
      new Blockly.utils.Coordinate(
        e instanceof MouseEvent ? e.clientX : this.left_,
        e instanceof MouseEvent ? e.clientY : this.top_,
      ),
    );
  }
}

/**
 * Base64 encoded data uri for backpack icon.
 */
const backpackSvgDataUri =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC' +
  '9zdmciIGVuYWJsZS1iYWNrZ3JvdW5kPSJuZXcgMCAwIDI0IDI0IiBoZWlnaHQ9IjI0cHgiIH' +
  'ZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjI0cHgiIGZpbGw9IiM0NTVBNjQiPjxnPjxyZW' +
  'N0IGZpbGw9Im5vbmUiIGhlaWdodD0iMjQiIHdpZHRoPSIyNCIvPjwvZz48Zz48Zy8+PGc+PH' +
  'BhdGggZD0iTTEzLjk3LDUuMzRDMTMuOTgsNS4yMywxNCw1LjEyLDE0LDVjMC0xLjEtMC45LT' +
  'ItMi0ycy0yLDAuOS0yLDJjMCwwLjEyLDAuMDIsMC4yMywwLjAzLDAuMzRDNy42OSw2LjE1LD' +
  'YsOC4zOCw2LDExdjggYzAsMS4xLDAuOSwyLDIsMmg4YzEuMSwwLDItMC45LDItMnYtOEMxOC' +
  'w4LjM4LDE2LjMxLDYuMTUsMTMuOTcsNS4zNHogTTExLDVjMC0wLjU1LDAuNDUtMSwxLTFzMS' +
  'wwLjQ1LDEsMSBjMCwwLjAzLTAuMDEsMC4wNi0wLjAyLDAuMDlDMTIuNjYsNS4wMywxMi4zNC' +
  'w1LDEyLDVzLTAuNjYsMC4wMy0wLjk4LDAuMDlDMTEuMDEsNS4wNiwxMSw1LjAzLDExLDV6IE' +
  '0xNiwxM3YxdjAuNSBjMCwwLjI4LTAuMjIsMC41LTAuNSwwLjVTMTUsMTQuNzgsMTUsMTQuNV' +
  'YxNHYtMUg4di0xaDdoMVYxM3oiLz48L2c+PC9nPjwvc3ZnPg==';

/**
 * Base64 encoded data uri for backpack icon when filled.
 */
const backpackFilledSvgDataUri =
  'data:image/svg+xml;base64,PD94bWwgdmVyc2' +
  'lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjwhLS0gQ3JlYX' +
  'RlZCB3aXRoIElua3NjYXBlIChodHRwOi8vd3d3Lmlua3NjYXBlLm9yZy8pIC0tPgoKPHN2Zw' +
  'ogICB3aWR0aD0iMjQiCiAgIGhlaWdodD0iMjQiCiAgIHZpZXdCb3g9IjAgMCAyNCAyNCIKIC' +
  'AgdmVyc2lvbj0iMS4xIgogICBpZD0ic3ZnNSIKICAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3' +
  'JnLzIwMDAvc3ZnIgogICB4bWxuczpzdmc9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj' +
  '4KICA8ZGVmcwogICAgIGlkPSJkZWZzMiIgLz4KICA8ZwogICAgIGlkPSJsYXllcjEiPgogIC' +
  'AgPGcKICAgICAgIHN0eWxlPSJmaWxsOiM0NTVhNjQiCiAgICAgICBpZD0iZzg0OCIKICAgIC' +
  'AgIHRyYW5zZm9ybT0ibWF0cml4KDAuMjY0NTgzMzMsMCwwLDAuMjY0NTgzMzMsOC44MjQ5OT' +
  'k3LDguODI0OTk5NykiPgogICAgICA8ZwogICAgICAgICBpZD0iZzgyNiI+CiAgICAgICAgPH' +
  'JlY3QKICAgICAgICAgICBmaWxsPSJub25lIgogICAgICAgICAgIGhlaWdodD0iMjQiCiAgIC' +
  'AgICAgICAgd2lkdGg9IjI0IgogICAgICAgICAgIGlkPSJyZWN0ODI0IgogICAgICAgICAgIH' +
  'g9IjAiCiAgICAgICAgICAgeT0iMCIgLz4KICAgICAgPC9nPgogICAgICA8ZwogICAgICAgIC' +
  'BpZD0iZzgzNCI+CiAgICAgICAgPGcKICAgICAgICAgICBpZD0iZzgyOCIgLz4KICAgICAgIC' +
  'A8ZwogICAgICAgICAgIGlkPSJnMjIyMyI+CiAgICAgICAgICA8ZwogICAgICAgICAgICAgaW' +
  'Q9ImcyMTAxNiI+CiAgICAgICAgICAgIDxnCiAgICAgICAgICAgICAgIHN0eWxlPSJmaWxsOi' +
  'M0NTVhNjQiCiAgICAgICAgICAgICAgIGlkPSJnMTQ5MyIKICAgICAgICAgICAgICAgdHJhbn' +
  'Nmb3JtPSJtYXRyaXgoMy43Nzk1Mjc2LDAsMCwzLjc3OTUyNzYsLTMzLjM1NDMzLC0zMy4zNT' +
  'QzMykiPgogICAgICAgICAgICAgIDxnCiAgICAgICAgICAgICAgICAgaWQ9ImcxNDcxIj4KIC' +
  'AgICAgICAgICAgICAgIDxwYXRoCiAgICAgICAgICAgICAgICAgICBpZD0icmVjdDE0NjkiCi' +
  'AgICAgICAgICAgICAgICAgICBzdHlsZT0iZmlsbDpub25lIgogICAgICAgICAgICAgICAgIC' +
  'AgZD0iTSAwLDAgSCAyNCBWIDI0IEggMCBaIiAvPgogICAgICAgICAgICAgIDwvZz4KICAgIC' +
  'AgICAgICAgICA8ZwogICAgICAgICAgICAgICAgIGlkPSJnMTQ3OSI+CiAgICAgICAgICAgIC' +
  'AgICA8ZwogICAgICAgICAgICAgICAgICAgaWQ9ImcxNDczIiAvPgogICAgICAgICAgICAgIC' +
  'AgPGcKICAgICAgICAgICAgICAgICAgIGlkPSJnMTQ3NyI+CiAgICAgICAgICAgICAgICAgID' +
  'xwYXRoCiAgICAgICAgICAgICAgICAgICAgIGlkPSJwYXRoMTQ3NSIKICAgICAgICAgICAgIC' +
  'AgICAgICAgZD0ibSAxMiwzIGMgLTEuMSwwIC0yLDAuOSAtMiwyIDAsMC4xMiAwLjAxOTMsMC' +
  '4yMjk4NDM4IDAuMDI5MywwLjMzOTg0MzggQyA3LjY4OTI5NjUsNi4xNDk4NDMzIDYsOC4zOC' +
  'A2LDExIHYgOCBjIDAsMS4xIDAuOSwyIDIsMiBoIDggYyAxLjEsMCAyLC0wLjkgMiwtMiBWID' +
  'ExIEMgMTgsOC4zOCAxNi4zMTA3MDMsNi4xNDk4NDMzIDEzLjk3MDcwMyw1LjMzOTg0MzggMT' +
  'MuOTgwNzAzLDUuMjI5ODQzOCAxNCw1LjEyIDE0LDUgMTQsMy45IDEzLjEsMyAxMiwzIFogbS' +
  'AwLDEgYyAwLjU1LDAgMSwwLjQ1IDEsMSAwLDAuMDMgLTAuMDA5NSwwLjA1OTg0NCAtMC4wMT' +
  'k1MywwLjA4OTg0NCBDIDEyLjY2MDQ2OSw1LjAyOTg0MzggMTIuMzQsNSAxMiw1IDExLjY2LD' +
  'UgMTEuMzM5NTMxLDUuMDI5ODQzOCAxMS4wMTk1MzEsNS4wODk4NDM4IDExLjAwOTUzMSw1Lj' +
  'A1OTg0MzggMTEsNS4wMyAxMSw1IDExLDQuNDUgMTEuNDUsNCAxMiw0IFogbSAtMy40NzI2NT' +
  'YyLDYuMzk4NDM4IGggMS4xNTYyNSB2IDIuNjQwNjI0IGggMC4zMDkzMzU0IGwgLTIuMzdlLT' +
  'UsLTEuMTcxMTQ2IDEuMDgyNzEwNSwtMTBlLTcgMC4wMTEsMS4xNzExNDYgaCAwLjMzMzMwNC' +
  'BsIC0wLjAzNTA0LC0yLjU4NzMxNSBoIDAuNTc4MTI1IDAuNTc4MTI1IGwgMC4wMTEwNSwyLj' +
  'U4NzMxNSBoIDAuMzU2MDI0IFYgMTIuMDYwNTQ3IEggMTQuMDYyNSB2IDAuOTc4NTE1IGggMC' +
  '4zMzAwNzggdiAtMi41NTI3MzQgaCAxLjE1NjI1IHYgMi41NTI3MzQgaCAwLjk2Njc5NyB2ID' +
  'AuMzU3NDIyIEggOS42ODM1OTM4IDguNTI3MzQzOCA3LjYwMzUxNTYgdiAtMC4zNTc0MjIgaC' +
  'AwLjkyMzgyODIgeiIKICAgICAgICAgICAgICAgICAgICAgLz4KICAgICAgICAgICAgICAgID' +
  'wvZz4KICAgICAgICAgICAgICA8L2c+CiAgICAgICAgICAgIDwvZz4KICAgICAgICAgIDwvZz' +
  '4KICAgICAgICA8L2c+CiAgICAgIDwvZz4KICAgIDwvZz4KICA8L2c+Cjwvc3ZnPgo=';

Blockly.Css.register(`
.blocklyBackpack {
  opacity: 0.4;
}
.blocklyBackpackContainer:focus .blocklyBackpack, .blocklyBackpackDarken {
  opacity: 0.6;
}
.blocklyBackpack:active {
  opacity: 0.8;
}
`);

/**
 * Custom serializer so that the backpack can save and later recall which
 * blocks have been saved in a workspace.
 */
class BackpackSerializer {
  /**
   * The priority for deserializing block suggestion data.
   * Should be after blocks, procedures, and variables.
   */
  priority = Blockly.serialization.priorities.BLOCKS - 10;

  /**
   * Saves a target workspace's state to serialized JSON.
   *
   * @param workspace the workspace to save
   * @returns the serialized JSON if present
   */
  save(workspace: Blockly.WorkspaceSvg): object[] {
    const componentManager = workspace.getComponentManager();
    const backpack = componentManager.getComponent('backpack') as Backpack;
    return backpack?.getContents().map((text) => JSON.parse(text));
  }

  /**
   * Loads a serialized state into the target workspace.
   *
   * @param state the serialized state JSON
   * @param workspace the workspace to load into
   */
  load(state: object[], workspace: Blockly.WorkspaceSvg) {
    const jsonStrings = state.map((j) => JSON.stringify(j));
    const componentManager = workspace.getComponentManager();
    const backpack = componentManager.getComponent('backpack') as Backpack;
    backpack?.setContents(jsonStrings);
  }

  /**
   * Resets the state of a workspace.
   *
   * @param workspace the workspace to reset
   */
  clear(workspace: Blockly.WorkspaceSvg) {
    const componentManager = workspace.getComponentManager();
    const backpack = componentManager.getComponent('backpack') as Backpack;
    backpack?.empty();
  }
}
