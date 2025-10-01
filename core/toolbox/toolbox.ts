/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Toolbox from whence to create blocks.
 *
 * @class
 */
// Former goog.module ID: Blockly.Toolbox

// Unused import preserved for side-effects. Remove if unneeded.
import {BlockSvg} from '../block_svg.js';
import * as browserEvents from '../browser_events.js';
import * as common from '../common.js';
import {ComponentManager} from '../component_manager.js';
import * as Css from '../css.js';
import {DeleteArea} from '../delete_area.js';
import '../events/events_toolbox_item_select.js';
import {EventType} from '../events/type.js';
import * as eventUtils from '../events/utils.js';
import {getFocusManager} from '../focus_manager.js';
import {type IAutoHideable} from '../interfaces/i_autohideable.js';
import type {ICollapsibleToolboxItem} from '../interfaces/i_collapsible_toolbox_item.js';
import {isDeletable} from '../interfaces/i_deletable.js';
import type {IDraggable} from '../interfaces/i_draggable.js';
import type {IFlyout} from '../interfaces/i_flyout.js';
import type {IFocusableNode} from '../interfaces/i_focusable_node.js';
import type {IFocusableTree} from '../interfaces/i_focusable_tree.js';
import type {IKeyboardAccessible} from '../interfaces/i_keyboard_accessible.js';
import type {ISelectableToolboxItem} from '../interfaces/i_selectable_toolbox_item.js';
import {isSelectableToolboxItem} from '../interfaces/i_selectable_toolbox_item.js';
import type {IStyleable} from '../interfaces/i_styleable.js';
import type {IToolbox} from '../interfaces/i_toolbox.js';
import type {IToolboxItem} from '../interfaces/i_toolbox_item.js';
import {Msg} from '../msg.js';
import * as registry from '../registry.js';
import type {KeyboardShortcut} from '../shortcut_registry.js';
import * as Touch from '../touch.js';
import * as aria from '../utils/aria.js';
import * as dom from '../utils/dom.js';
import * as idGenerator from '../utils/idgenerator.js';
import {Rect} from '../utils/rect.js';
import * as toolbox from '../utils/toolbox.js';
import type {WorkspaceSvg} from '../workspace_svg.js';
import type {ToolboxCategory} from './category.js';
import {CollapsibleToolboxCategory} from './collapsible_category.js';

/**
 * Class for a Toolbox.
 * Creates the toolbox's DOM.
 */
export class Toolbox
  extends DeleteArea
  implements
    IAutoHideable,
    IKeyboardAccessible,
    IStyleable,
    IToolbox,
    IFocusableNode
{
  /**
   * The unique ID for this component that is used to register with the
   * ComponentManager.
   */
  override id = 'toolbox';
  protected toolboxDef_: toolbox.ToolboxInfo;
  private readonly horizontalLayout: boolean;

  /** The HTML container for the toolbox. */
  HtmlDiv: HTMLDivElement | null = null;

  /** The HTML container for the contents of a toolbox. */
  protected contentsDiv_: HTMLDivElement | null = null;

  /** Whether the Toolbox is visible. */
  protected isVisible_ = false;

  /** The width of the toolbox. */
  protected width_ = 0;

  /** The height of the toolbox. */
  protected height_ = 0;
  RTL: boolean;

  /** The flyout for the toolbox. */
  private flyout: IFlyout | null = null;

  /** Map from ID to the corresponding toolbox item. */
  protected contents = new Map<string, IToolboxItem>();

  toolboxPosition: toolbox.Position;

  /** The currently selected item. */
  protected selectedItem_: ISelectableToolboxItem | null = null;

  /** The previously selected item. */
  protected previouslySelectedItem_: ISelectableToolboxItem | null = null;

  /**
   * Array holding info needed to unbind event handlers.
   * Used for disposing.
   * Ex: [[node, name, func], [node, name, func]].
   */
  protected boundEvents_: browserEvents.Data[] = [];

  /** The workspace this toolbox is on. */
  protected readonly workspace_: WorkspaceSvg;

  /** @param workspace The workspace in which to create new blocks. */
  constructor(workspace: WorkspaceSvg) {
    super();

    this.workspace_ = workspace;

    /** The JSON describing the contents of this toolbox. */
    this.toolboxDef_ = workspace.options.languageTree || {
      contents: new Array<toolbox.ToolboxItemInfo>(),
    };

    /** Whether the toolbox should be laid out horizontally. */
    this.horizontalLayout = workspace.options.horizontalLayout;

    /** Is RTL vs LTR. */
    this.RTL = workspace.options.RTL;

    /** Position of the toolbox and flyout relative to the workspace. */
    this.toolboxPosition = workspace.options.toolboxPosition;
  }

  /**
   * Handles the given keyboard shortcut.
   *
   * @param _shortcut The shortcut to be handled.
   * @returns True if the shortcut has been handled, false otherwise.
   */
  onShortcut(_shortcut: KeyboardShortcut): boolean {
    return false;
  }

  /** Initializes the toolbox */
  init() {
    const workspace = this.workspace_;
    const svg = workspace.getParentSvg();

    this.flyout = this.createFlyout_();

    this.HtmlDiv = this.createDom_(this.workspace_);
    const flyoutDom = this.flyout.createDom('svg');
    dom.addClass(flyoutDom, 'blocklyToolboxFlyout');
    dom.insertAfter(flyoutDom, svg);
    this.setVisible(true);
    this.flyout.init(workspace);

    aria.setRole(this.HtmlDiv, aria.Role.TREE);
    aria.setState(this.HtmlDiv, aria.State.LABEL, Msg['TOOLBOX_ARIA_LABEL']);

    this.render(this.toolboxDef_);
    const themeManager = workspace.getThemeManager();
    themeManager.subscribe(
      this.HtmlDiv,
      'toolboxBackgroundColour',
      'background-color',
    );
    themeManager.subscribe(this.HtmlDiv, 'toolboxForegroundColour', 'color');
    this.workspace_.getComponentManager().addComponent({
      component: this,
      weight: ComponentManager.ComponentWeight.TOOLBOX_WEIGHT,
      capabilities: [
        ComponentManager.Capability.AUTOHIDEABLE,
        ComponentManager.Capability.DELETE_AREA,
        ComponentManager.Capability.DRAG_TARGET,
      ],
    });
    getFocusManager().registerTree(this, true);
  }

  /**
   * Creates the DOM for the toolbox.
   *
   * @param workspace The workspace this toolbox is on.
   * @returns The HTML container for the toolbox.
   */
  protected createDom_(workspace: WorkspaceSvg): HTMLDivElement {
    const svg = workspace.getParentSvg();

    const container = this.createContainer_();
    container.id = idGenerator.getNextUniqueId();

    this.contentsDiv_ = this.createContentsContainer_();
    container.appendChild(this.contentsDiv_);

    svg.parentNode!.insertBefore(container, svg);

    this.attachEvents_(container, this.contentsDiv_);
    return container;
  }

  /**
   * Creates the container div for the toolbox.
   *
   * @returns The HTML container for the toolbox.
   */
  protected createContainer_(): HTMLDivElement {
    const toolboxContainer = document.createElement('div');
    toolboxContainer.setAttribute('layout', this.isHorizontal() ? 'h' : 'v');
    dom.addClass(toolboxContainer, 'blocklyToolbox');
    toolboxContainer.setAttribute('dir', this.RTL ? 'RTL' : 'LTR');
    return toolboxContainer;
  }

  /**
   * Creates the container for all the contents in the toolbox.
   *
   * @returns The HTML container for the toolbox contents.
   */
  protected createContentsContainer_(): HTMLDivElement {
    const contentsContainer = document.createElement('div');
    dom.addClass(contentsContainer, 'blocklyToolboxCategoryGroup');
    if (this.isHorizontal()) {
      contentsContainer.style.flexDirection = 'row';
    }
    return contentsContainer;
  }

  /**
   * Adds event listeners to the toolbox container div.
   *
   * @param container The HTML container for the toolbox.
   * @param contentsContainer The HTML container for the contents of the
   *     toolbox.
   */
  protected attachEvents_(
    container: HTMLDivElement,
    contentsContainer: HTMLDivElement,
  ) {
    // Clicking on toolbox closes popups.
    const clickEvent = browserEvents.conditionalBind(
      container,
      'pointerdown',
      this,
      this.onClick_,
      /* opt_noCaptureIdentifier */ false,
    );
    this.boundEvents_.push(clickEvent);

    const keyDownEvent = browserEvents.conditionalBind(
      contentsContainer,
      'keydown',
      this,
      this.onKeyDown_,
      /* opt_noCaptureIdentifier */ false,
    );
    this.boundEvents_.push(keyDownEvent);
  }

  /**
   * Handles on click events for when the toolbox or toolbox items are clicked.
   *
   * @param e Click event to handle.
   */
  protected onClick_(e: PointerEvent) {
    if (browserEvents.isRightButton(e) || e.target === this.HtmlDiv) {
      // Close flyout.
      (common.getMainWorkspace() as WorkspaceSvg).hideChaff(false);
    } else {
      const targetElement = e.target;
      const itemId = (targetElement as Element).getAttribute('id');
      if (itemId) {
        const item = this.getToolboxItemById(itemId);
        if (item!.isSelectable()) {
          this.setSelectedItem(item);
          (item as ISelectableToolboxItem).onClick(e);
        }
      }
      // Just close popups.
      (common.getMainWorkspace() as WorkspaceSvg).hideChaff(true);
    }
    Touch.clearTouchIdentifier();
  }

  /**
   * Handles key down events for the toolbox.
   *
   * @param e The key down event.
   */
  protected onKeyDown_(e: KeyboardEvent) {
    let handled = false;
    switch (e.key) {
      case 'ArrowDown':
        handled = this.selectNext();
        break;
      case 'ArrowUp':
        handled = this.selectPrevious();
        break;
      case 'ArrowLeft':
        handled = this.selectParent();
        break;
      case 'ArrowRight':
        handled = this.selectChild();
        break;
      case 'Enter':
      case ' ':
        if (this.selectedItem_ && this.selectedItem_.isCollapsible()) {
          const collapsibleItem = this.selectedItem_ as ICollapsibleToolboxItem;
          collapsibleItem.toggleExpanded();
          handled = true;
        }
        break;
      default:
        handled = false;
        break;
    }
    if (!handled && this.selectedItem_) {
      // TODO(#6097): Figure out who implements onKeyDown and which interface it
      // should be part of.
      if ((this.selectedItem_ as any).onKeyDown) {
        handled = (this.selectedItem_ as any).onKeyDown(e);
      }
    }

    if (handled) {
      e.preventDefault();
    }
  }

  /**
   * Creates the flyout based on the toolbox layout.
   *
   * @returns The flyout for the toolbox.
   * @throws {Error} If missing a require for `Blockly.HorizontalFlyout`,
   *     `Blockly.VerticalFlyout`, and no flyout plugin is specified.
   */
  protected createFlyout_(): IFlyout {
    const workspace = this.workspace_;
    const workspaceOptions = workspace.copyOptionsForFlyout();
    // Options takes in either 'end' or 'start'. This has already been parsed to
    // be either 0 or 1, so set it after.
    workspaceOptions.toolboxPosition = workspace.options.toolboxPosition;
    let FlyoutClass = null;
    if (workspace.horizontalLayout) {
      FlyoutClass = registry.getClassFromOptions(
        registry.Type.FLYOUTS_HORIZONTAL_TOOLBOX,
        workspace.options,
        true,
      );
    } else {
      FlyoutClass = registry.getClassFromOptions(
        registry.Type.FLYOUTS_VERTICAL_TOOLBOX,
        workspace.options,
        true,
      );
    }
    return new FlyoutClass!(workspaceOptions);
  }

  /**
   * Fills the toolbox with new toolbox items and removes any old contents.
   *
   * @param toolboxDef Object holding information for creating a toolbox.
   * @internal
   */
  render(toolboxDef: toolbox.ToolboxInfo) {
    this.toolboxDef_ = toolboxDef;
    this.contents.forEach((item) => item.dispose());
    this.contents.clear();
    this.renderContents_(toolboxDef['contents']);
    this.position();
    this.handleToolboxItemResize();
    this.recomputeAriaOwners();
  }

  /**
   * Adds all the toolbox items to the toolbox.
   *
   * @param toolboxDef Array holding objects containing information on the
   *     contents of the toolbox.
   */
  protected renderContents_(toolboxDef: toolbox.ToolboxItemInfo[]) {
    // This is for performance reasons. By using document fragment we only have
    // to add to the DOM once.
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < toolboxDef.length; i++) {
      const toolboxItemDef = toolboxDef[i];
      this.createToolboxItem(toolboxItemDef, fragment);
    }
    this.contentsDiv_!.appendChild(fragment);
  }

  /**
   * Creates and renders the toolbox item.
   *
   * @param toolboxItemDef Any information that can be used to create an item in
   *     the toolbox.
   * @param fragment The document fragment to add the child toolbox elements to.
   */
  private createToolboxItem(
    toolboxItemDef: toolbox.ToolboxItemInfo,
    fragment: DocumentFragment,
  ) {
    let registryName = toolboxItemDef['kind'];

    // Categories that are collapsible are created using a class registered
    // under a different name.
    if (
      registryName.toUpperCase() === 'CATEGORY' &&
      toolbox.isCategoryCollapsible(toolboxItemDef as toolbox.CategoryInfo)
    ) {
      registryName = CollapsibleToolboxCategory.registrationName;
    }

    const ToolboxItemClass = registry.getClass(
      registry.Type.TOOLBOX_ITEM,
      registryName.toLowerCase(),
    );
    if (ToolboxItemClass) {
      const toolboxItem = new ToolboxItemClass(toolboxItemDef, this);
      toolboxItem.init();
      this.addToolboxItem_(toolboxItem);
      const toolboxItemDom = toolboxItem.getDiv();
      if (toolboxItemDom) {
        fragment.appendChild(toolboxItemDom);
      }
      // Adds the ID to the HTML element that can receive a click.
      // This is used in onClick_ to find the toolboxItem that was clicked.
      if (toolboxItem.getClickTarget()) {
        toolboxItem.getClickTarget()!.setAttribute('id', toolboxItem.getId());
      }
    }
  }

  /**
   * Adds an item to the toolbox.
   *
   * @param toolboxItem The item in the toolbox.
   */
  protected addToolboxItem_(toolboxItem: IToolboxItem) {
    this.contents.set(toolboxItem.getId(), toolboxItem);
    if (toolboxItem.isCollapsible()) {
      const collapsibleItem = toolboxItem as ICollapsibleToolboxItem;
      const childToolboxItems = collapsibleItem.getChildToolboxItems();
      for (let i = 0; i < childToolboxItems.length; i++) {
        const child = childToolboxItems[i];
        this.addToolboxItem_(child);
      }
    }
    this.recomputeAriaOwners();
  }

  /**
   * Gets the items in the toolbox.
   *
   * @returns The list of items in the toolbox.
   */
  getToolboxItems(): IToolboxItem[] {
    return [...this.contents.values()];
  }

  /**
   * Adds a style on the toolbox. Usually used to change the cursor.
   *
   * @param style The name of the class to add.
   * @internal
   */
  addStyle(style: string) {
    if (style && this.HtmlDiv) {
      dom.addClass(this.HtmlDiv, style);
    }
  }

  /**
   * Removes a style from the toolbox. Usually used to change the cursor.
   *
   * @param style The name of the class to remove.
   * @internal
   */
  removeStyle(style: string) {
    if (style && this.HtmlDiv) {
      dom.removeClass(this.HtmlDiv, style);
    }
  }

  /**
   * Returns the bounding rectangle of the drag target area in pixel units
   * relative to viewport.
   *
   * @returns The component's bounding box. Null if drag target area should be
   *     ignored.
   */
  override getClientRect(): Rect | null {
    if (!this.HtmlDiv || !this.isVisible_) {
      return null;
    }
    // BIG_NUM is offscreen padding so that blocks dragged beyond the toolbox
    // area are still deleted.  Must be smaller than Infinity, but larger than
    // the largest screen size.
    const BIG_NUM = 10000000;
    const toolboxRect = this.HtmlDiv.getBoundingClientRect();

    const top = toolboxRect.top;
    const bottom = top + toolboxRect.height;
    const left = toolboxRect.left;
    const right = left + toolboxRect.width;

    // Assumes that the toolbox is on the SVG edge.  If this changes
    // (e.g. toolboxes in mutators) then this code will need to be more complex.
    if (this.toolboxPosition === toolbox.Position.TOP) {
      return new Rect(-BIG_NUM, bottom, -BIG_NUM, BIG_NUM);
    } else if (this.toolboxPosition === toolbox.Position.BOTTOM) {
      return new Rect(top, BIG_NUM, -BIG_NUM, BIG_NUM);
    } else if (this.toolboxPosition === toolbox.Position.LEFT) {
      return new Rect(-BIG_NUM, BIG_NUM, -BIG_NUM, right);
    } else {
      // Right
      return new Rect(-BIG_NUM, BIG_NUM, left, BIG_NUM);
    }
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
  override wouldDelete(element: IDraggable): boolean {
    if (element instanceof BlockSvg) {
      const block = element;
      this.updateWouldDelete_(!block.getParent() && block.isDeletable());
    } else {
      this.updateWouldDelete_(isDeletable(element) && element.isDeletable());
    }
    return this.wouldDelete_;
  }

  /**
   * Handles when a cursor with a block or bubble enters this drag target.
   *
   * @param _dragElement The block or bubble currently being dragged.
   */
  override onDragEnter(_dragElement: IDraggable) {
    this.updateCursorDeleteStyle_(true);
  }

  /**
   * Handles when a cursor with a block or bubble exits this drag target.
   *
   * @param _dragElement The block or bubble currently being dragged.
   */
  override onDragExit(_dragElement: IDraggable) {
    this.updateCursorDeleteStyle_(false);
  }

  /**
   * Handles when a block or bubble is dropped on this component.
   * Should not handle delete here.
   *
   * @param _dragElement The block or bubble currently being dragged.
   */
  override onDrop(_dragElement: IDraggable) {
    this.updateCursorDeleteStyle_(false);
  }

  /**
   * Updates the internal wouldDelete_ state.
   *
   * @param wouldDelete The new value for the wouldDelete state.
   */
  protected override updateWouldDelete_(wouldDelete: boolean) {
    if (wouldDelete === this.wouldDelete_) {
      return;
    }
    // This logic handles updating the deleteStyle properly if the delete state
    // changes while the block is over the Toolbox. This could happen if the
    // implementation of wouldDeleteBlock depends on the couldConnect parameter
    // or if the isDeletable property of the block currently being dragged
    // changes during the drag.
    this.updateCursorDeleteStyle_(false);
    this.wouldDelete_ = wouldDelete;
    this.updateCursorDeleteStyle_(true);
  }

  /**
   * Adds or removes the CSS style of the cursor over the toolbox based whether
   * the block or bubble over it is expected to be deleted if dropped (using the
   * internal this.wouldDelete_ property).
   *
   * @param addStyle Whether the style should be added or removed.
   */
  protected updateCursorDeleteStyle_(addStyle: boolean) {
    const style = this.wouldDelete_
      ? 'blocklyToolboxDelete'
      : 'blocklyToolboxGrab';
    if (addStyle) {
      this.addStyle(style);
    } else {
      this.removeStyle(style);
    }
  }

  /**
   * Gets the toolbox item with the given ID.
   *
   * @param id The ID of the toolbox item.
   * @returns The toolbox item with the given ID, or null if no item exists.
   */
  getToolboxItemById(id: string): IToolboxItem | null {
    return this.contents.get(id) || null;
  }

  /**
   * Gets the width of the toolbox.
   *
   * @returns The width of the toolbox.
   */
  getWidth(): number {
    return this.width_;
  }

  /**
   * Gets the height of the toolbox.
   *
   * @returns The width of the toolbox.
   */
  getHeight(): number {
    return this.height_;
  }

  /**
   * Gets the toolbox flyout.
   *
   * @returns The toolbox flyout.
   */
  getFlyout(): IFlyout | null {
    return this.flyout;
  }

  /**
   * Gets the workspace for the toolbox.
   *
   * @returns The parent workspace for the toolbox.
   */
  getWorkspace(): WorkspaceSvg {
    return this.workspace_;
  }

  /**
   * Gets the selected item.
   *
   * @returns The selected item, or null if no item is currently selected.
   */
  getSelectedItem(): ISelectableToolboxItem | null {
    return this.selectedItem_;
  }

  /**
   * Gets the previously selected item.
   *
   * @returns The previously selected item, or null if no item was previously
   *     selected.
   */
  getPreviouslySelectedItem(): ISelectableToolboxItem | null {
    return this.previouslySelectedItem_;
  }

  /**
   * Gets whether or not the toolbox is horizontal.
   *
   * @returns True if the toolbox is horizontal, false if the toolbox is
   *     vertical.
   */
  isHorizontal(): boolean {
    return this.horizontalLayout;
  }

  /**
   * Positions the toolbox based on whether it is a horizontal toolbox and
   * whether the workspace is in rtl.
   */
  position() {
    const workspaceMetrics = this.workspace_.getMetrics();
    const toolboxDiv = this.HtmlDiv;
    if (!toolboxDiv) {
      // Not initialized yet.
      return;
    }

    if (this.horizontalLayout) {
      toolboxDiv.style.left = '0';
      toolboxDiv.style.height = 'auto';
      toolboxDiv.style.width = '100%';
      this.height_ = toolboxDiv.offsetHeight;
      this.width_ = workspaceMetrics.viewWidth;
      if (this.toolboxPosition === toolbox.Position.TOP) {
        toolboxDiv.style.top = '0';
      } else {
        // Bottom
        toolboxDiv.style.bottom = '0';
      }
    } else {
      if (this.toolboxPosition === toolbox.Position.RIGHT) {
        toolboxDiv.style.right = '0';
      } else {
        // Left
        toolboxDiv.style.left = '0';
      }
      toolboxDiv.style.height = '100%';
      this.width_ = toolboxDiv.offsetWidth;
      this.height_ = workspaceMetrics.viewHeight;
    }
    this.flyout!.position();
  }

  /**
   * Handles resizing the toolbox when a toolbox item resizes.
   *
   * @internal
   */
  handleToolboxItemResize() {
    // Reposition the workspace so that (0,0) is in the correct position
    // relative to the new absolute edge (ie toolbox edge).
    const workspace = this.workspace_;
    const rect = this.HtmlDiv!.getBoundingClientRect();
    const flyout = this.getFlyout();
    const newX =
      this.toolboxPosition === toolbox.Position.LEFT
        ? workspace.scrollX +
          rect.width +
          (flyout?.isVisible() ? flyout.getWidth() : 0)
        : workspace.scrollX;
    const newY =
      this.toolboxPosition === toolbox.Position.TOP
        ? workspace.scrollY +
          rect.height +
          (flyout?.isVisible() ? flyout.getHeight() : 0)
        : workspace.scrollY;
    workspace.translate(newX, newY);

    // Even though the div hasn't changed size, the visible workspace
    // surface of the workspace has, so we may need to reposition everything.
    common.svgResize(workspace);
  }

  /** Unhighlights any previously selected item. */
  clearSelection() {
    this.setSelectedItem(null);
  }

  /**
   * Updates the category colours and background colour of selected categories.
   *
   * @internal
   */
  refreshTheme() {
    this.contents.forEach((child) => {
      // TODO(#6097): Fix types or add refreshTheme to IToolboxItem.
      const childAsCategory = child as ToolboxCategory;
      if (childAsCategory.refreshTheme) {
        childAsCategory.refreshTheme();
      }
    });
  }

  /**
   * Updates the flyout's content without closing it.  Should be used in
   * response to a change in one of the dynamic categories, such as variables or
   * procedures.
   */
  refreshSelection() {
    if (
      this.selectedItem_ &&
      this.selectedItem_.isSelectable() &&
      this.selectedItem_.getContents().length
    ) {
      this.flyout!.show(this.selectedItem_.getContents());
    }
  }

  /**
   * Shows or hides the toolbox.
   *
   * @param isVisible True if toolbox should be visible.
   */
  setVisible(isVisible: boolean) {
    if (this.isVisible_ === isVisible) {
      return;
    }

    this.HtmlDiv!.style.display = isVisible ? 'block' : 'none';
    this.isVisible_ = isVisible;
    // Invisible toolbox is ignored as drag targets and must have the drag
    // target updated.
    this.workspace_.recordDragTargets();
  }

  /**
   * Hides the component. Called in WorkspaceSvg.hideChaff.
   *
   * @param onlyClosePopups Whether only popups should be closed.
   *     Flyouts should not be closed if this is true.
   */
  autoHide(onlyClosePopups: boolean) {
    if (!onlyClosePopups && this.flyout && this.flyout.autoClose) {
      this.clearSelection();
    }
  }

  /**
   * Sets the given item as selected.
   * No-op if the item is not selectable.
   *
   * @param newItem The toolbox item to select.
   */
  setSelectedItem(newItem: IToolboxItem | null) {
    const oldItem = this.selectedItem_;

    if (
      (!newItem && !oldItem) ||
      (newItem && !isSelectableToolboxItem(newItem))
    ) {
      return;
    }

    if (this.shouldDeselectItem_(oldItem, newItem) && oldItem !== null) {
      this.deselectItem_(oldItem);
    }

    if (this.shouldSelectItem_(oldItem, newItem) && newItem !== null) {
      this.selectItem_(oldItem, newItem);
    }

    this.updateFlyout_(oldItem, newItem);
    this.fireSelectEvent(oldItem, newItem);
  }

  /**
   * Decides whether the old item should be deselected.
   *
   * @param oldItem The previously selected toolbox item.
   * @param newItem The newly selected toolbox item.
   * @returns True if the old item should be deselected, false otherwise.
   */
  protected shouldDeselectItem_(
    oldItem: ISelectableToolboxItem | null,
    newItem: ISelectableToolboxItem | null,
  ): boolean {
    // Deselect the old item unless the old item is collapsible and has been
    // previously clicked on.
    return (
      oldItem !== null && (!oldItem.isCollapsible() || oldItem !== newItem)
    );
  }

  /**
   * Decides whether the new item should be selected.
   *
   * @param oldItem The previously selected toolbox item.
   * @param newItem The newly selected toolbox item.
   * @returns True if the new item should be selected, false otherwise.
   */
  protected shouldSelectItem_(
    oldItem: ISelectableToolboxItem | null,
    newItem: ISelectableToolboxItem | null,
  ): boolean {
    // Select the new item unless the old item equals the new item.
    return newItem !== null && newItem !== oldItem;
  }

  /**
   * Deselects the given item, marks it as unselected, and updates aria state.
   *
   * @param item The previously selected toolbox item which should be
   *     deselected.
   */
  protected deselectItem_(item: ISelectableToolboxItem) {
    this.selectedItem_ = null;
    this.previouslySelectedItem_ = item;
    item.setSelected(false);
    aria.setState(
      this.contentsDiv_ as Element,
      aria.State.ACTIVEDESCENDANT,
      '',
    );
  }

  /**
   * Selects the given item, marks it selected, and updates aria state.
   *
   * @param oldItem The previously selected toolbox item.
   * @param newItem The newly selected toolbox item.
   */
  protected selectItem_(
    oldItem: ISelectableToolboxItem | null,
    newItem: ISelectableToolboxItem,
  ) {
    this.selectedItem_ = newItem;
    this.previouslySelectedItem_ = oldItem;
    newItem.setSelected(true);
    aria.setState(
      this.contentsDiv_ as Element,
      aria.State.ACTIVEDESCENDANT,
      newItem.getId(),
    );
  }

  /**
   * Selects the toolbox item by its position in the list of toolbox items.
   *
   * @param position The position of the item to select.
   */
  selectItemByPosition(position: number) {
    const item = this.getToolboxItems()[position];
    if (item) {
      this.setSelectedItem(item);
    }
  }

  /**
   * Decides whether to hide or show the flyout depending on the selected item.
   *
   * @param oldItem The previously selected toolbox item.
   * @param newItem The newly selected toolbox item.
   */
  protected updateFlyout_(
    oldItem: ISelectableToolboxItem | null,
    newItem: ISelectableToolboxItem | null,
  ) {
    if (
      !newItem ||
      (oldItem === newItem && !newItem.isCollapsible()) ||
      !newItem.getContents().length
    ) {
      this.flyout!.hide();
    } else {
      this.flyout!.show(newItem.getContents());
      this.flyout!.scrollToStart();
    }
  }

  /**
   * Emits an event when a new toolbox item is selected.
   *
   * @param oldItem The previously selected toolbox item.
   * @param newItem The newly selected toolbox item.
   */
  private fireSelectEvent(
    oldItem: ISelectableToolboxItem | null,
    newItem: ISelectableToolboxItem | null,
  ) {
    const oldElement = oldItem && oldItem.getName();
    let newElement = newItem && newItem.getName();
    // In this case the toolbox closes, so the newElement should be null.
    if (oldItem === newItem) {
      newElement = null;
    }
    const event = new (eventUtils.get(EventType.TOOLBOX_ITEM_SELECT))(
      oldElement,
      newElement,
      this.workspace_.id,
    );
    eventUtils.fire(event);
  }

  /**
   * Closes the current item if it is expanded, or selects the parent.
   *
   * @returns True if a parent category was selected, false otherwise.
   */
  private selectParent(): boolean {
    if (!this.selectedItem_) {
      return false;
    }

    if (
      this.selectedItem_.isCollapsible() &&
      (this.selectedItem_ as ICollapsibleToolboxItem).isExpanded()
    ) {
      const collapsibleItem = this.selectedItem_ as ICollapsibleToolboxItem;
      collapsibleItem.toggleExpanded();
      return true;
    } else if (
      this.selectedItem_.getParent() &&
      this.selectedItem_.getParent()!.isSelectable()
    ) {
      this.setSelectedItem(this.selectedItem_.getParent());
      return true;
    }
    return false;
  }

  /**
   * Selects the first child of the currently selected item, or nothing if the
   * toolbox item has no children.
   *
   * @returns True if a child category was selected, false otherwise.
   */
  private selectChild(): boolean {
    if (!this.selectedItem_ || !this.selectedItem_.isCollapsible()) {
      return false;
    }
    const collapsibleItem = this.selectedItem_ as ICollapsibleToolboxItem;
    if (!collapsibleItem.isExpanded()) {
      collapsibleItem.toggleExpanded();
      return true;
    } else {
      this.selectNext();
      return true;
    }
  }

  /**
   * Selects the next visible toolbox item.
   *
   * @returns True if a next category was selected, false otherwise.
   */
  private selectNext(): boolean {
    if (!this.selectedItem_) {
      return false;
    }

    const items = [...this.contents.values()];
    let nextItemIdx = items.indexOf(this.selectedItem_) + 1;
    if (nextItemIdx > -1 && nextItemIdx < items.length) {
      let nextItem = items[nextItemIdx];
      while (nextItem && !nextItem.isSelectable()) {
        nextItem = items[++nextItemIdx];
      }
      if (nextItem && nextItem.isSelectable()) {
        this.setSelectedItem(nextItem);
        return true;
      }
    }
    return false;
  }

  /**
   * Selects the previous visible toolbox item.
   *
   * @returns True if a previous category was selected, false otherwise.
   */
  private selectPrevious(): boolean {
    if (!this.selectedItem_) {
      return false;
    }

    const items = [...this.contents.values()];
    let prevItemIdx = items.indexOf(this.selectedItem_) - 1;
    if (prevItemIdx > -1 && prevItemIdx < items.length) {
      let prevItem = items[prevItemIdx];
      while (prevItem && !prevItem.isSelectable()) {
        prevItem = items[--prevItemIdx];
      }
      if (prevItem && prevItem.isSelectable()) {
        this.setSelectedItem(prevItem);
        return true;
      }
    }
    return false;
  }

  /** Disposes of this toolbox. */
  dispose() {
    this.workspace_.getComponentManager().removeComponent('toolbox');
    this.flyout!.dispose();
    this.contents.forEach((item) => item.dispose());

    for (let j = 0; j < this.boundEvents_.length; j++) {
      browserEvents.unbind(this.boundEvents_[j]);
    }
    this.boundEvents_ = [];
    this.contents.clear();

    if (this.HtmlDiv) {
      this.workspace_.getThemeManager().unsubscribe(this.HtmlDiv);
      dom.removeNode(this.HtmlDiv);
    }

    getFocusManager().unregisterTree(this);
  }

  /** See IFocusableNode.getFocusableElement. */
  getFocusableElement(): HTMLElement | SVGElement {
    if (!this.HtmlDiv) throw Error('Toolbox DOM has not yet been created.');
    return this.HtmlDiv;
  }

  /** See IFocusableNode.getFocusableTree. */
  getFocusableTree(): IFocusableTree {
    return this;
  }

  /** See IFocusableNode.onNodeFocus. */
  onNodeFocus(): void {}

  /** See IFocusableNode.onNodeBlur. */
  onNodeBlur(): void {}

  /** See IFocusableNode.canBeFocused. */
  canBeFocused(): boolean {
    return true;
  }

  /** See IFocusableTree.getRootFocusableNode. */
  getRootFocusableNode(): IFocusableNode {
    return this;
  }

  /** See IFocusableTree.getRestoredFocusableNode. */
  getRestoredFocusableNode(
    previousNode: IFocusableNode | null,
  ): IFocusableNode | null {
    // Always try to select the first selectable toolbox item rather than the
    // root of the toolbox.
    if (!previousNode || previousNode === this) {
      return this.getToolboxItems().find((item) => item.isSelectable()) ?? null;
    }
    return null;
  }

  /** See IFocusableTree.getNestedTrees. */
  getNestedTrees(): Array<IFocusableTree> {
    return [];
  }

  /** See IFocusableTree.lookUpFocusableNode. */
  lookUpFocusableNode(id: string): IFocusableNode | null {
    return this.getToolboxItemById(id) as IFocusableNode;
  }

  /** See IFocusableTree.onTreeFocus. */
  onTreeFocus(
    node: IFocusableNode,
    _previousTree: IFocusableTree | null,
  ): void {
    if (node !== this) {
      // Only select the item if it isn't already selected so as to not toggle.
      if (this.getSelectedItem() !== node) {
        this.setSelectedItem(node as IToolboxItem);
      }
    } else {
      this.clearSelection();
    }
  }

  /** See IFocusableTree.onTreeBlur. */
  onTreeBlur(nextTree: IFocusableTree | null): void {
    // If navigating to anything other than the toolbox's flyout then clear the
    // selection so that the toolbox's flyout can automatically close.
    if (!nextTree || nextTree !== this.flyout?.getWorkspace()) {
      this.autoHide(false);
    }
  }

  /**
   * Recomputes ARIA tree ownership relationships for all of this toolbox's
   * categories and items.
   *
   * This should only be done when the toolbox's contents have changed.
   */
  recomputeAriaOwners() {
    const focusable = this.getFocusableElement();
    const selectableChildren =
      this.getToolboxItems().filter((item) => item.isSelectable()) ?? null;
    const focusableChildElems = selectableChildren.map((selectable) =>
      selectable.getFocusableElement(),
    );
    const focusableChildIds = focusableChildElems.map((elem) => elem.id);
    aria.setState(
      focusable,
      aria.State.OWNS,
      [...new Set(focusableChildIds)].join(' '),
    );
    // Ensure children have the correct position set.
    // TODO: Fix collapsible subcategories. Their groups aren't set up correctly yet, and they aren't getting a correct accounting in top-level toolbox tree.
    focusableChildElems.forEach((elem, index) =>
      aria.setState(elem, aria.State.POSINSET, index + 1),
    );
  }
}

/** CSS for Toolbox.  See css.js for use. */
Css.register(`
.blocklyToolboxDelete {
  cursor: url("<<<PATH>>>/handdelete.cur"), auto;
}

.blocklyToolboxGrab {
  cursor: url("<<<PATH>>>/handclosed.cur"), auto;
  cursor: grabbing;
  cursor: -webkit-grabbing;
}

/* Category tree in Toolbox. */
.blocklyToolbox {
  box-sizing: border-box;
  user-select: none;
  -ms-user-select: none;
  -webkit-user-select: none;
  background-color: #ddd;
  overflow-x: visible;
  overflow-y: auto;
  padding: 4px 0 4px 0;
  position: absolute;
  z-index: 70;  /* so blocks go under toolbox when dragging */
  -webkit-tap-highlight-color: transparent;  /* issue #1345 */
}

.blocklyToolboxCategoryGroup {
  display: flex;
  flex-wrap: wrap;
  flex-direction: column;
}

.blocklyToolboxCategoryGroup:focus {
  outline: none;
}
`);

registry.register(registry.Type.TOOLBOX, registry.DEFAULT, Toolbox);
