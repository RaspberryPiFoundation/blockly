/**
 * @license
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Methods for graphically rendering a block as SVG.
 *
 * @class
 */
// Former goog.module ID: Blockly.BlockSvg

// Unused import preserved for side-effects. Remove if unneeded.
import './events/events_selected.js';

import {Block} from './block.js';
import * as blockAnimations from './block_animations.js';
import * as browserEvents from './browser_events.js';
import {BlockCopyData, BlockPaster} from './clipboard/block_paster.js';
import * as common from './common.js';
import {config} from './config.js';
import type {Connection} from './connection.js';
import {ConnectionType} from './connection_type.js';
import * as constants from './constants.js';
import * as ContextMenu from './contextmenu.js';
import {
  ContextMenuOption,
  ContextMenuRegistry,
  LegacyContextMenuOption,
} from './contextmenu_registry.js';
import {BlockDragStrategy} from './dragging/block_drag_strategy.js';
import type {BlockMove} from './events/events_block_move.js';
import {EventType} from './events/type.js';
import * as eventUtils from './events/utils.js';
import {FieldImage} from './field_image.js';
import {FieldLabel} from './field_label.js';
import {getFocusManager} from './focus_manager.js';
import {IconType} from './icons/icon_types.js';
import {MutatorIcon} from './icons/mutator_icon.js';
import {WarningIcon} from './icons/warning_icon.js';
import type {Input} from './inputs/input.js';
import {inputTypes} from './inputs/input_types.js';
import type {IBoundedElement} from './interfaces/i_bounded_element.js';
import {IContextMenu} from './interfaces/i_contextmenu.js';
import type {ICopyable} from './interfaces/i_copyable.js';
import {IDeletable} from './interfaces/i_deletable.js';
import type {IDragStrategy, IDraggable} from './interfaces/i_draggable.js';
import type {IFocusableNode} from './interfaces/i_focusable_node.js';
import type {IFocusableTree} from './interfaces/i_focusable_tree.js';
import {IIcon} from './interfaces/i_icon.js';
import * as internalConstants from './internal_constants.js';
import {Msg} from './msg.js';
import * as renderManagement from './render_management.js';
import {RenderedConnection} from './rendered_connection.js';
import type {IPathObject} from './renderers/common/i_path_object.js';
import * as blocks from './serialization/blocks.js';
import type {BlockStyle} from './theme.js';
import * as Tooltip from './tooltip.js';
import {idGenerator} from './utils.js';
import * as aria from './utils/aria.js';
import {Coordinate} from './utils/coordinate.js';
import * as dom from './utils/dom.js';
import {Rect} from './utils/rect.js';
import {Svg} from './utils/svg.js';
import * as svgMath from './utils/svg_math.js';
import {FlyoutItemInfo} from './utils/toolbox.js';
import type {Workspace} from './workspace.js';
import type {WorkspaceSvg} from './workspace_svg.js';

/**
 * Class for a block's SVG representation.
 * Not normally called directly, workspace.newBlock() is preferred.
 */
export class BlockSvg
  extends Block
  implements
    IBoundedElement,
    IContextMenu,
    ICopyable<BlockCopyData>,
    IDraggable,
    IDeletable,
    IFocusableNode
{
  /**
   * Constant for identifying rows that are to be rendered inline.
   * Don't collide with Blockly.inputTypes.
   */
  static readonly INLINE = -1;

  /**
   * ID to give the "collapsed warnings" warning. Allows us to remove the
   * "collapsed warnings" warning without removing any warnings that belong to
   * the block.
   */
  static readonly COLLAPSED_WARNING_ID = 'TEMP_COLLAPSED_WARNING_';
  override decompose?: (p1: Workspace) => BlockSvg;
  // override compose?: ((p1: BlockSvg) => void)|null;

  /**
   * An optional method which saves a record of blocks connected to
   * this block so they can be later restored after this block is
   * recoomposed (reconfigured).  Typically records the connected
   * blocks on properties on blocks in the mutator flyout, so that
   * rearranging those component blocks will automatically rearrange
   * the corresponding connected blocks on this block after this block
   * is recomposed.
   *
   * To keep the saved connection information up-to-date, MutatorIcon
   * arranges for an event listener to call this method any time the
   * mutator flyout is open and a change occurs on this block's
   * workspace.
   *
   * @param rootBlock The root block in the mutator flyout.
   */
  saveConnections?: (rootBlock: BlockSvg) => void;

  customContextMenu?: (
    p1: Array<ContextMenuOption | LegacyContextMenuOption>,
  ) => void;

  /**
   * Height of this block, not including any statement blocks above or below.
   * Height is in workspace units.
   */
  height = 0;

  /**
   * Width of this block, including any connected value blocks.
   * Width is in workspace units.
   */
  width = 0;

  /**
   * Width of this block, not including any connected value blocks.
   * Width is in workspace units.
   *
   * @internal
   */
  childlessWidth = 0;

  /**
   * Map from IDs for warnings text to PIDs of functions to apply them.
   * Used to be able to maintain multiple warnings.
   */
  private warningTextDb = new Map<string, ReturnType<typeof setTimeout>>();

  /** Block's mutator icon (if any). */
  mutator: MutatorIcon | null = null;

  private svgGroup: SVGGElement;
  style: BlockStyle;
  /** @internal */
  pathObject: IPathObject;

  /** Is this block a BlockSVG? */
  override readonly rendered = true;

  private visuallyDisabled = false;

  override workspace: WorkspaceSvg;
  // TODO(b/109816955): remove '!', see go/strict-prop-init-fix.
  override outputConnection!: RenderedConnection;
  // TODO(b/109816955): remove '!', see go/strict-prop-init-fix.
  override nextConnection!: RenderedConnection;
  // TODO(b/109816955): remove '!', see go/strict-prop-init-fix.
  override previousConnection!: RenderedConnection;

  private translation = '';

  /** Whether this block is currently being dragged. */
  private dragging = false;

  public currentConnectionCandidate: RenderedConnection | null = null;

  /**
   * The location of the top left of this block (in workspace coordinates)
   * relative to either its parent block, or the workspace origin if it has no
   * parent.
   *
   * @internal
   */
  relativeCoords = new Coordinate(0, 0);

  private dragStrategy: IDragStrategy = new BlockDragStrategy(this);

  /**
   * @param workspace The block's workspace.
   * @param prototypeName Name of the language object containing type-specific
   *     functions for this block.
   * @param opt_id Optional ID.  Use this ID if provided, otherwise create a new
   *     ID.
   */
  constructor(workspace: WorkspaceSvg, prototypeName: string, opt_id?: string) {
    super(workspace, prototypeName, opt_id);
    if (!workspace.rendered) {
      throw TypeError('Cannot create a rendered block in a headless workspace');
    }
    this.workspace = workspace;
    this.svgGroup = dom.createSvgElement(Svg.G, {});

    if (prototypeName) {
      dom.addClass(this.svgGroup, prototypeName);
    }
    /** A block style object. */
    this.style = workspace.getRenderer().getConstants().getBlockStyle(null);

    /** The renderer's path object. */
    this.pathObject = workspace
      .getRenderer()
      .makePathObject(this.svgGroup, this.style);

    const svgPath = this.pathObject.svgPath;
    (svgPath as any).tooltip = this;
    Tooltip.bindMouseEvents(svgPath);

    // Expose this block's ID on its top-level SVG group.
    this.svgGroup.setAttribute('data-id', this.id);

    // The page-wide unique ID of this Block used for focusing.
    svgPath.id = idGenerator.getNextUniqueId();

    svgPath.tabIndex = -1;
    this.currentConnectionCandidate = null;

    this.doInit_();
    this.computeAriaRole();
  }

  /**
   * Updates the ARIA label of this block to reflect its current configuration.
   *
   * @internal
   */
  recomputeAriaLabel() {
    if (this.isSimpleReporter(true, true)) return;

    aria.setState(
      this.getFocusableElement(),
      aria.State.LABEL,
      this.computeAriaLabel(),
    );
  }

  computeAriaLabel(verbose: boolean = false): string {
    const labelComponents = [];

    if (!this.workspace.isFlyout && this.getRootBlock() === this) {
      labelComponents.push('Begin stack');
    }

    const parentInput = (
      this.previousConnection ?? this.outputConnection
    )?.targetConnection?.getParentInput();
    if (parentInput && parentInput.type === inputTypes.STATEMENT) {
      labelComponents.push(`Begin ${parentInput.getFieldRowLabel()}`);
    } else if (
      parentInput &&
      parentInput.type === inputTypes.VALUE &&
      this.getParent()?.statementInputCount
    ) {
      labelComponents.push(`${parentInput.getFieldRowLabel()}`);
    }

    const {commaSeparatedSummary, inputCount} = buildBlockSummary(
      this,
      verbose,
    );
    labelComponents.push(commaSeparatedSummary);

    if (!this.isEnabled()) {
      labelComponents.push('disabled');
    }
    if (this.isCollapsed()) {
      labelComponents.push('collapsed');
    }

    if (inputCount > 1) {
      labelComponents.push('has inputs');
    } else if (inputCount === 1) {
      labelComponents.push('has input');
    }

    return labelComponents.join(', ');
  }

  private computeAriaRole() {
    if (this.workspace.isFlyout) {
      aria.setRole(this.pathObject.svgPath, aria.Role.TREEITEM);
    } else {
      const roleDescription = this.getAriaRoleDescription();
      aria.setState(
        this.pathObject.svgPath,
        aria.State.ROLEDESCRIPTION,
        roleDescription,
      );
      aria.setRole(this.pathObject.svgPath, aria.Role.FIGURE);
    }
  }

  /**
   * Returns the ARIA role description for this block.
   *
   * Block definitions may override this method via a mixin to customize
   * their role description.
   *
   * @returns The ARIA roledescription for this block.
   */
  protected getAriaRoleDescription() {
    if (this.isShadow()) {
      return 'replaceable block';
    } else if (this.outputConnection) {
      return 'value block';
    } else if (this.statementInputCount) {
      return 'container block';
    } else {
      return 'statement block';
    }
  }

  /**
   * Create and initialize the SVG representation of the block.
   * May be called more than once.
   */
  initSvg() {
    if (this.initialized) return;
    for (const input of this.inputList) {
      input.init();
    }
    for (const icon of this.getIcons()) {
      icon.initView(this.createIconPointerDownListener(icon));
      icon.updateEditable();
    }
    this.applyColour();
    this.pathObject.updateMovable(this.isMovable() || this.isInFlyout);
    const svg = this.getSvgRoot();
    if (svg) {
      browserEvents.conditionalBind(svg, 'pointerdown', this, this.onMouseDown);
    }

    if (!svg.parentNode) {
      this.workspace.getCanvas().appendChild(svg);
    }
    this.initialized = true;
  }

  /**
   * Get the secondary colour of a block.
   *
   * @returns #RRGGBB string.
   */
  getColourSecondary(): string {
    return this.style.colourSecondary;
  }

  /**
   * Get the tertiary colour of a block.
   *
   * @returns #RRGGBB string.
   */
  getColourTertiary(): string {
    return this.style.colourTertiary;
  }

  /** Selects this block. Highlights the block visually. */
  select() {
    this.addSelect();
    common.fireSelectedEvent(this);
    aria.setState(this.getFocusableElement(), aria.State.SELECTED, true);
  }

  /** Unselects this block. Unhighlights the block visually. */
  unselect() {
    this.removeSelect();
    common.fireSelectedEvent(null);
    aria.setState(this.getFocusableElement(), aria.State.SELECTED, false);
  }

  /**
   * Sets the parent of this block to be a new block or null.
   *
   * @param newParent New parent block.
   * @internal
   */
  override setParent(newParent: this | null) {
    const oldParent = this.parentBlock_;
    if (newParent === oldParent) {
      return;
    }

    dom.startTextWidthCache();
    super.setParent(newParent);
    dom.stopTextWidthCache();

    const svgRoot = this.getSvgRoot();

    // Bail early if workspace is clearing, or we aren't rendered.
    // We won't need to reattach ourselves anywhere.
    if (this.workspace.isClearing || !svgRoot) {
      return;
    }

    const oldXY = this.getRelativeToSurfaceXY();
    const focusedNode = getFocusManager().getFocusedNode();
    const restoreFocus = this.getSvgRoot().contains(
      focusedNode?.getFocusableElement() ?? null,
    );
    if (newParent) {
      (newParent as BlockSvg).getSvgRoot().appendChild(svgRoot);
      // appendChild() clears focus state, so re-focus the previously focused
      // node in case it was this block and would otherwise lose its focus. Once
      // Element.moveBefore() has better browser support, it should be used
      // instead.
      if (restoreFocus && focusedNode) {
        getFocusManager().focusNode(focusedNode);
      }
    } else if (oldParent) {
      // If we are losing a parent, we want to move our DOM element to the
      // root of the workspace.  Try to insert it before any top-level
      // block being dragged, but note that blocks can have the
      // blocklyDragging class even if they're not top blocks (especially
      // at start and end of a drag).
      const draggingBlockElement = this.workspace
        .getCanvas()
        .querySelector('.blocklyDragging');
      const draggingParentElement = draggingBlockElement?.parentElement as
        | SVGElement
        | null
        | undefined;
      const canvas = this.workspace.getCanvas();
      if (draggingParentElement === canvas) {
        canvas.insertBefore(svgRoot, draggingBlockElement);
      } else {
        canvas.appendChild(svgRoot);
        // appendChild() clears focus state, so re-focus the previously focused
        // node in case it was this block and would otherwise lose its focus. Once
        // Element.moveBefore() has better browser support, it should be used
        // instead.
        if (restoreFocus && focusedNode) {
          getFocusManager().focusNode(focusedNode);
        }
      }
      this.translate(oldXY.x, oldXY.y);
    }

    this.applyColour();

    this.workspace.recomputeAriaTree();
  }

  /**
   * Return the coordinates of the top-left corner of this block relative to the
   * drawing surface's origin (0,0), in workspace units.
   * If the block is on the workspace, (0, 0) is the origin of the workspace
   * coordinate system.
   * This does not change with workspace scale.
   *
   * @returns Object with .x and .y properties in workspace coordinates.
   */
  override getRelativeToSurfaceXY(): Coordinate {
    const layerManger = this.workspace.getLayerManager();
    if (!layerManger) {
      throw new Error(
        'Cannot calculate position because the workspace has not been appended',
      );
    }
    let x = 0;
    let y = 0;

    let element: SVGElement = this.getSvgRoot();
    if (element) {
      do {
        // Loop through this block and every parent.
        const xy = svgMath.getRelativeXY(element);
        x += xy.x;
        y += xy.y;
        element = element.parentNode as SVGElement;
      } while (element && !layerManger.hasLayer(element));
    }
    return new Coordinate(x, y);
  }

  /**
   * Move a block by a relative offset.
   *
   * @param dx Horizontal offset in workspace units.
   * @param dy Vertical offset in workspace units.
   * @param reason Why is this move happening?  'drag', 'bump', 'snap', ...
   */
  override moveBy(dx: number, dy: number, reason?: string[]) {
    if (this.parentBlock_) {
      throw Error('Block has parent');
    }
    const eventsEnabled = eventUtils.isEnabled();
    let event: BlockMove | null = null;
    if (eventsEnabled) {
      event = new (eventUtils.get(EventType.BLOCK_MOVE)!)(this) as BlockMove;
      if (reason) event.setReason(reason);
    }

    const delta = new Coordinate(dx, dy);
    const currLoc = this.getRelativeToSurfaceXY();
    const newLoc = Coordinate.sum(currLoc, delta);
    this.translate(newLoc.x, newLoc.y);
    this.updateComponentLocations(newLoc);

    if (eventsEnabled && event) {
      event!.recordNew();
      eventUtils.fire(event);
    }
    this.workspace.resizeContents();
  }

  /**
   * Transforms a block by setting the translation on the transform attribute
   * of the block's SVG.
   *
   * @param x The x coordinate of the translation in workspace units.
   * @param y The y coordinate of the translation in workspace units.
   */
  translate(x: number, y: number) {
    this.translation = `translate(${x}, ${y})`;
    this.relativeCoords = new Coordinate(x, y);
    this.getSvgRoot().setAttribute('transform', this.getTranslation());
  }

  /**
   * Returns the SVG translation of this block.
   *
   * @internal
   */
  getTranslation(): string {
    return this.translation;
  }

  /**
   * Move a block to a position.
   *
   * @param xy The position to move to in workspace units.
   * @param reason Why is this move happening?  'drag', 'bump', 'snap', ...
   */
  moveTo(xy: Coordinate, reason?: string[]) {
    const curXY = this.getRelativeToSurfaceXY();
    this.moveBy(xy.x - curXY.x, xy.y - curXY.y, reason);
  }

  /**
   * Move this block during a drag.
   * This block must be a top-level block.
   *
   * @param newLoc The location to translate to, in workspace coordinates.
   * @internal
   */
  moveDuringDrag(newLoc: Coordinate) {
    this.translate(newLoc.x, newLoc.y);
    this.getSvgRoot().setAttribute('transform', this.getTranslation());
    this.updateComponentLocations(newLoc);
  }

  /** Snap this block to the nearest grid point. */
  snapToGrid() {
    if (this.isDeadOrDying()) return;
    if (this.getParent()) return;
    if (this.isInFlyout) return;
    const grid = this.workspace.getGrid();
    if (!grid?.shouldSnap()) return;
    const currentXY = this.getRelativeToSurfaceXY();
    const alignedXY = grid.alignXY(currentXY);
    if (alignedXY !== currentXY) {
      this.moveTo(alignedXY, ['snap']);
    }
  }

  /**
   * Returns the coordinates of a bounding box describing the dimensions of this
   * block and any blocks stacked below it.
   * Coordinate system: workspace coordinates.
   *
   * @returns Object with coordinates of the bounding box.
   */
  getBoundingRectangle(): Rect {
    return this.getBoundingRectangleWithDimensions(this.getHeightWidth());
  }

  /**
   * Returns the coordinates of a bounding box describing the dimensions of this
   * block alone.
   * Coordinate system: workspace coordinates.
   *
   * @returns Object with coordinates of the bounding box.
   */
  getBoundingRectangleWithoutChildren(): Rect {
    return this.getBoundingRectangleWithDimensions({
      height: this.height,
      width: this.childlessWidth,
    });
  }

  private getBoundingRectangleWithDimensions(blockBounds: {
    height: number;
    width: number;
  }) {
    const blockXY = this.getRelativeToSurfaceXY();
    let left;
    let right;
    if (this.RTL) {
      left = blockXY.x - blockBounds.width;
      right = blockXY.x;
    } else {
      left = blockXY.x;
      right = blockXY.x + blockBounds.width;
    }
    return new Rect(blockXY.y, blockXY.y + blockBounds.height, left, right);
  }

  /**
   * Notify every input on this block to mark its fields as dirty.
   * A dirty field is a field that needs to be re-rendered.
   */
  markDirty() {
    this.pathObject.constants = this.workspace.getRenderer().getConstants();
    for (let i = 0, input; (input = this.inputList[i]); i++) {
      input.markDirty();
    }
  }

  /**
   * Set whether the block is collapsed or not.
   *
   * @param collapsed True if collapsed.
   */
  override setCollapsed(collapsed: boolean) {
    if (this.collapsed_ === collapsed) {
      return;
    }
    super.setCollapsed(collapsed);
    this.updateCollapsed();
  }

  /**
   * Traverses child blocks to see if any of them have a warning.
   *
   * @returns true if any child has a warning, false otherwise.
   */
  private childHasWarning(): boolean {
    const children = this.getChildren(false);
    for (const child of children) {
      if (child.getIcon(WarningIcon.TYPE) || child.childHasWarning()) {
        return true;
      }
    }
    return false;
  }

  /**
   * Makes sure that when the block is collapsed, it is rendered correctly
   * for that state.
   */
  private updateCollapsed() {
    const collapsed = this.isCollapsed();
    const collapsedInputName = constants.COLLAPSED_INPUT_NAME;
    const collapsedFieldName = constants.COLLAPSED_FIELD_NAME;

    for (let i = 0, input; (input = this.inputList[i]); i++) {
      if (input.name !== collapsedInputName) {
        input.setVisible(!collapsed);
      }
    }

    for (const icon of this.getIcons()) {
      icon.updateCollapsed();
    }

    if (!collapsed) {
      this.updateDisabled();
      this.removeInput(collapsedInputName);
      dom.removeClass(this.svgGroup, 'blocklyCollapsed');
      this.setWarningText(null, BlockSvg.COLLAPSED_WARNING_ID);
      this.recomputeAriaLabel();
      return;
    }

    dom.addClass(this.svgGroup, 'blocklyCollapsed');
    if (this.childHasWarning()) {
      this.setWarningText(
        Msg['COLLAPSED_WARNINGS_WARNING'],
        BlockSvg.COLLAPSED_WARNING_ID,
      );
    }

    const text = this.toString(internalConstants.COLLAPSE_CHARS);
    const field = this.getField(collapsedFieldName);
    if (field) {
      field.setValue(text);
      return;
    }
    const input =
      this.getInput(collapsedInputName) ||
      this.appendDummyInput(collapsedInputName);
    input.appendField(new FieldLabel(text), collapsedFieldName);

    this.recomputeAriaLabel();
  }

  /**
   * Handle a pointerdown on an SVG block.
   *
   * @param e Pointer down event.
   */
  private onMouseDown(e: PointerEvent) {
    if (this.workspace.isReadOnly()) return;

    const gesture = this.workspace.getGesture(e);
    if (gesture) {
      gesture.handleBlockStart(e, this);
    }
  }

  /**
   * Load the block's help page in a new window.
   *
   * @internal
   */
  showHelp() {
    const url =
      typeof this.helpUrl === 'function' ? this.helpUrl() : this.helpUrl;
    if (url) {
      window.open(url);
    }
  }

  /**
   * Generate the context menu for this block.
   *
   * @returns Context menu options or null if no menu.
   */
  protected generateContextMenu(
    e: Event,
  ): Array<ContextMenuOption | LegacyContextMenuOption> | null {
    if (this.workspace.isReadOnly() || !this.contextMenu) {
      return null;
    }
    const menuOptions = ContextMenuRegistry.registry.getContextMenuOptions(
      {block: this, focusedNode: this},
      e,
    );

    // Allow the block to add or modify menuOptions.
    if (this.customContextMenu) {
      this.customContextMenu(menuOptions);
    }

    return menuOptions;
  }

  /**
   * Gets the location in which to show the context menu for this block.
   * Use the location of a click if the block was clicked, or a location
   * based on the block's fields otherwise.
   */
  protected calculateContextMenuLocation(e: Event): Coordinate {
    // Open the menu where the user clicked, if they clicked
    if (e instanceof PointerEvent) {
      return new Coordinate(e.clientX, e.clientY);
    }

    // Otherwise, calculate a location.
    // Get the location of the top-left corner of the block in
    // screen coordinates.
    const blockCoords = svgMath.wsToScreenCoordinates(
      this.workspace,
      this.getRelativeToSurfaceXY(),
    );

    // Prefer a y position below the first field in the block.
    const fieldBoundingClientRect = this.inputList
      .filter((input) => input.isVisible())
      .flatMap((input) => input.fieldRow)
      .find((f) => f.isVisible())
      ?.getSvgRoot()
      ?.getBoundingClientRect();

    const y =
      fieldBoundingClientRect && fieldBoundingClientRect.height
        ? fieldBoundingClientRect.y + fieldBoundingClientRect.height
        : blockCoords.y + this.height;

    return new Coordinate(
      this.RTL ? blockCoords.x - 5 : blockCoords.x + 5,
      y + 5,
    );
  }

  /**
   * Show the context menu for this block.
   *
   * @param e Mouse event.
   * @internal
   */
  showContextMenu(e: Event) {
    const menuOptions = this.generateContextMenu(e);

    const location = this.calculateContextMenuLocation(e);

    if (menuOptions && menuOptions.length) {
      ContextMenu.show(e, menuOptions, this.RTL, this.workspace, location);
      ContextMenu.setCurrentBlock(this);
    }
  }

  /**
   * Updates the locations of any parts of the block that need to know where
   * they are (e.g. connections, icons).
   *
   * @param blockOrigin The top-left of this block in workspace coordinates.
   * @internal
   */
  updateComponentLocations(blockOrigin: Coordinate) {
    if (!this.dragging) this.updateConnectionLocations(blockOrigin);
    this.updateIconLocations(blockOrigin);
    this.updateFieldLocations(blockOrigin);

    for (const child of this.getChildren(false)) {
      child.updateComponentLocations(
        Coordinate.sum(blockOrigin, child.relativeCoords),
      );
    }
  }

  private updateConnectionLocations(blockOrigin: Coordinate) {
    for (const conn of this.getConnections_(false)) {
      conn.moveToOffset(blockOrigin);
    }
  }

  private updateIconLocations(blockOrigin: Coordinate) {
    for (const icon of this.getIcons()) {
      icon.onLocationChange(blockOrigin);
    }
  }

  private updateFieldLocations(blockOrigin: Coordinate) {
    for (const input of this.inputList) {
      for (const field of input.fieldRow) {
        field.onLocationChange(blockOrigin);
      }
    }
  }

  /**
   * Add a CSS class to the SVG group of this block.
   *
   * @param className
   */
  addClass(className: string) {
    dom.addClass(this.svgGroup, className);
  }

  /**
   * Remove a CSS class from the SVG group of this block.
   *
   * @param className
   */
  removeClass(className: string) {
    dom.removeClass(this.svgGroup, className);
  }

  /**
   * Recursively adds or removes the dragging class to this node and its
   * children.
   *
   * @param adding True if adding, false if removing.
   * @internal
   */
  setDragging(adding: boolean) {
    this.dragging = adding;
    if (adding) {
      this.translation = '';
      common.draggingConnections.push(...this.getConnections_(true));
      this.addClass('blocklyDragging');
    } else {
      common.draggingConnections.length = 0;
      this.removeClass('blocklyDragging');
    }
    // Recurse through all blocks attached under this one.
    for (let i = 0; i < this.childBlocks_.length; i++) {
      (this.childBlocks_[i] as BlockSvg).setDragging(adding);
    }
  }

  /**
   * Set whether this block is movable or not.
   *
   * @param movable True if movable.
   */
  override setMovable(movable: boolean) {
    super.setMovable(movable);
    this.pathObject.updateMovable(movable);
  }

  /**
   * Set whether this block is editable or not.
   *
   * @param editable True if editable.
   */
  override setEditable(editable: boolean) {
    super.setEditable(editable);

    if (editable) {
      dom.removeClass(this.svgGroup, 'blocklyNotEditable');
    } else {
      dom.addClass(this.svgGroup, 'blocklyNotEditable');
    }

    const icons = this.getIcons();
    for (let i = 0; i < icons.length; i++) {
      icons[i].updateEditable();
    }
  }

  /**
   * Sets whether this block is a shadow block or not.
   * This method is internal and should not be called by users of Blockly. To
   * create shadow blocks programmatically call connection.setShadowState
   *
   * @param shadow True if a shadow.
   * @internal
   */
  override setShadow(shadow: boolean) {
    super.setShadow(shadow);
    this.applyColour();
  }

  /**
   * Set whether this block is an insertion marker block or not.
   * Once set this cannot be unset.
   *
   * @param insertionMarker True if an insertion marker.
   * @internal
   */
  override setInsertionMarker(insertionMarker: boolean) {
    if (this.isInsertionMarker_ === insertionMarker) {
      return; // No change.
    }
    this.isInsertionMarker_ = insertionMarker;
    if (this.isInsertionMarker_) {
      this.setColour(
        this.workspace.getRenderer().getConstants().INSERTION_MARKER_COLOUR,
      );
      this.pathObject.updateInsertionMarker(true);
    }
  }

  /**
   * Return the root node of the SVG or null if none exists.
   *
   * @returns The root SVG node (probably a group).
   */
  getSvgRoot(): SVGGElement {
    return this.svgGroup;
  }

  /**
   * Dispose of this block.
   *
   * @param healStack If true, then try to heal any gap by connecting the next
   *     statement with the previous statement.  Otherwise, dispose of all
   *     children of this block.
   * @param animate If true, show a disposal animation and sound.
   */
  override dispose(healStack?: boolean, animate?: boolean) {
    this.disposing = true;

    Tooltip.dispose();
    ContextMenu.hide();

    // If this block (or a descendant) was focused, focus its parent or
    // workspace instead.
    const focusManager = getFocusManager();
    if (
      this.getSvgRoot().contains(
        focusManager.getFocusedNode()?.getFocusableElement() ?? null,
      )
    ) {
      let parent: BlockSvg | undefined | null = this.getParent();
      if (!parent) {
        // In some cases, blocks are disconnected from their parents before
        // being deleted. Attempt to infer if there was a parent by checking
        // for a connection within a radius of 0. Even if this wasn't a parent,
        // it must be adjacent to this block and so is as good an option as any
        // to focus after deleting.
        const connection = this.outputConnection ?? this.previousConnection;
        if (connection) {
          const targetConnection = connection.closest(
            0,
            new Coordinate(0, 0),
          ).connection;
          parent = targetConnection?.getSourceBlock();
        }
      }
      if (parent) {
        focusManager.focusNode(parent);
      } else {
        setTimeout(() => focusManager.focusTree(this.workspace), 0);
      }
    }

    if (animate) {
      this.unplug(healStack);
      blockAnimations.disposeUiEffect(this);
    }

    super.dispose(!!healStack);
    dom.removeNode(this.svgGroup);
  }

  /**
   * Disposes of this block without doing things required by the top block.
   * E.g. does trigger UI effects, remove nodes, etc.
   */
  override disposeInternal() {
    this.disposing = true;
    super.disposeInternal();

    if (getFocusManager().getFocusedNode() === this) {
      this.workspace.cancelCurrentGesture();
    }

    [...this.warningTextDb.values()].forEach((n) => clearTimeout(n));
    this.warningTextDb.clear();

    this.getIcons().forEach((i) => i.dispose());
  }

  /**
   * Delete a block and hide chaff when doing so. The block will not be deleted
   * if it's in a flyout. This is called from the context menu and keyboard
   * shortcuts as the full delete action. If you are disposing of a block from
   * the workspace and don't need to perform flyout checks, handle event
   * grouping, or hide chaff, then use `block.dispose()` directly.
   */
  checkAndDelete() {
    if (this.workspace.isFlyout) {
      return;
    }
    eventUtils.setGroup(true);
    this.workspace.hideChaff();
    if (this.outputConnection) {
      // Do not attempt to heal rows
      // (https://github.com/google/blockly/issues/4832)
      this.dispose(false, true);
    } else {
      this.dispose(/* heal */ true, true);
    }
    eventUtils.setGroup(false);
  }

  /**
   * Encode a block for copying.
   *
   * @param addNextBlocks If true, copy subsequent blocks attached to this one
   *     as well.
   *
   * @returns Copy metadata, or null if the block is an insertion marker.
   */
  toCopyData(addNextBlocks = false): BlockCopyData | null {
    if (this.isInsertionMarker_) {
      return null;
    }
    return {
      paster: BlockPaster.TYPE,
      blockState: blocks.save(this, {
        addCoordinates: true,
        addNextBlocks,
        saveIds: false,
      }) as blocks.State,
      typeCounts: common.getBlockTypeCounts(this, true),
    };
  }

  /**
   * Updates the colour of the block to match the block's state.
   *
   * @internal
   */
  applyColour() {
    this.pathObject.applyColour?.(this);

    const icons = this.getIcons();
    for (let i = 0; i < icons.length; i++) {
      icons[i].applyColour();
    }

    for (const field of this.getFields()) {
      field.applyColour();
    }
  }

  /**
   * Updates the colour of the block (and children) to match the current
   * disabled state.
   *
   * @internal
   */
  updateDisabled() {
    const disabled = !this.isEnabled() || this.getInheritedDisabled();

    if (this.visuallyDisabled === disabled) {
      this.getNextBlock()?.updateDisabled();
      return;
    }

    this.applyColour();
    this.visuallyDisabled = disabled;
    for (const child of this.getChildren(false)) {
      child.updateDisabled();
    }

    this.recomputeAriaLabel();
  }

  /**
   * Set this block's warning text.
   *
   * @param text The text, or null to delete.
   * @param id An optional ID for the warning text to be able to maintain
   *     multiple warnings.
   */
  override setWarningText(text: string | null, id: string = '') {
    if (!id) {
      // Kill all previous pending processes, this edit supersedes them all.
      for (const timeout of this.warningTextDb.values()) {
        clearTimeout(timeout);
      }
      this.warningTextDb.clear();
    } else if (this.warningTextDb.has(id)) {
      // Only queue up the latest change.  Kill any earlier pending process.
      clearTimeout(this.warningTextDb.get(id)!);
      this.warningTextDb.delete(id);
    }
    if (this.workspace.isDragging()) {
      // Don't change the warning text during a drag.
      // Wait until the drag finishes.
      this.warningTextDb.set(
        id,
        setTimeout(() => {
          if (!this.isDeadOrDying()) {
            this.warningTextDb.delete(id);
            this.setWarningText(text, id);
          }
        }, 100),
      );
      return;
    }
    if (this.isInFlyout) {
      text = null;
    }

    const icon = this.getIcon(WarningIcon.TYPE) as WarningIcon | undefined;
    if (text) {
      // Bubble up to add a warning on top-most collapsed block.
      // TODO(#6020): This warning is never removed.
      let parent = this.getSurroundParent();
      let collapsedParent = null;
      while (parent) {
        if (parent.isCollapsed()) {
          collapsedParent = parent;
        }
        parent = parent.getSurroundParent();
      }
      if (collapsedParent) {
        collapsedParent.setWarningText(
          Msg['COLLAPSED_WARNINGS_WARNING'],
          BlockSvg.COLLAPSED_WARNING_ID,
        );
      }

      if (icon) {
        (icon as WarningIcon).addMessage(text, id);
      } else {
        this.addIcon(new WarningIcon(this).addMessage(text, id));
      }
    } else if (icon) {
      // Dispose all warnings if no ID is given.
      if (!id) {
        this.removeIcon(WarningIcon.TYPE);
      } else {
        // Remove just this warning id's message.
        icon.addMessage('', id);
        // Then remove the entire icon if there is no longer any text.
        if (!icon.getText()) this.removeIcon(WarningIcon.TYPE);
      }
    }
  }

  /**
   * Give this block a mutator dialog.
   *
   * @param mutator A mutator dialog instance or null to remove.
   */
  override setMutator(mutator: MutatorIcon | null) {
    this.removeIcon(MutatorIcon.TYPE);
    if (mutator) this.addIcon(mutator);
  }

  override addIcon<T extends IIcon>(icon: T): T {
    super.addIcon(icon);

    if (icon instanceof MutatorIcon) this.mutator = icon;

    icon.initView(this.createIconPointerDownListener(icon));
    icon.applyColour();
    icon.updateEditable();
    this.queueRender();

    return icon;
  }

  /**
   * Creates a pointer down event listener for the icon to append to its
   * root svg.
   */
  private createIconPointerDownListener(icon: IIcon) {
    return (e: PointerEvent) => {
      if (this.isDeadOrDying()) return;
      const gesture = this.workspace.getGesture(e);
      if (gesture) {
        gesture.setStartIcon(icon);
      }
    };
  }

  override removeIcon(type: IconType<IIcon>): boolean {
    const removed = super.removeIcon(type);

    if (type.equals(MutatorIcon.TYPE)) this.mutator = null;

    this.queueRender();

    return removed;
  }

  /**
   * Add or remove a reason why the block might be disabled. If a block has
   * any reasons to be disabled, then the block itself will be considered
   * disabled. A block could be disabled for multiple independent reasons
   * simultaneously, such as when the user manually disables it, or the block
   * is invalid.
   *
   * @param disabled If true, then the block should be considered disabled for
   *     at least the provided reason, otherwise the block is no longer disabled
   *     for that reason.
   * @param reason A language-neutral identifier for a reason why the block
   *     could be disabled. Call this method again with the same identifier to
   *     update whether the block is currently disabled for this reason.
   */
  override setDisabledReason(disabled: boolean, reason: string): void {
    const wasEnabled = this.isEnabled();
    super.setDisabledReason(disabled, reason);
    if (this.isEnabled() !== wasEnabled && !this.getInheritedDisabled()) {
      this.updateDisabled();
    }
  }

  /**
   * Add blocklyNotDeletable class when block is not deletable
   * Or remove class when block is deletable
   */
  override setDeletable(deletable: boolean) {
    super.setDeletable(deletable);

    if (deletable) {
      dom.removeClass(this.svgGroup, 'blocklyNotDeletable');
    } else {
      dom.addClass(this.svgGroup, 'blocklyNotDeletable');
    }
  }

  /**
   * Set whether the block is highlighted or not.  Block highlighting is
   * often used to visually mark blocks currently being executed.
   *
   * @param highlighted True if highlighted.
   */
  setHighlighted(highlighted: boolean) {
    this.pathObject.updateHighlighted(highlighted);
  }

  /**
   * Adds the visual "select" effect to the block, but does not actually select
   * it or fire an event.
   *
   * @see BlockSvg#select
   */
  addSelect() {
    this.pathObject.updateSelected(true);
  }

  /**
   * Removes the visual "select" effect from the block, but does not actually
   * unselect it or fire an event.
   *
   * @see BlockSvg#unselect
   */
  removeSelect() {
    this.pathObject.updateSelected(false);
  }

  /**
   * Update the cursor over this block by adding or removing a class.
   *
   * @param enable True if the delete cursor should be shown, false otherwise.
   * @internal
   */
  setDeleteStyle(enable: boolean) {
    this.pathObject.updateDraggingDelete(enable);
  }

  // Overrides of functions on Blockly.Block that take into account whether the
  // block has been rendered.

  /**
   * Get the colour of a block.
   *
   * @returns #RRGGBB string.
   */
  override getColour(): string {
    return this.style.colourPrimary;
  }

  /**
   * Change the colour of a block.
   *
   * @param colour HSV hue value, or #RRGGBB string.
   */
  override setColour(colour: number | string) {
    super.setColour(colour);
    const styleObj = this.workspace
      .getRenderer()
      .getConstants()
      .getBlockStyleForColour(this.colour_);

    this.pathObject.setStyle?.(styleObj.style);
    this.style = styleObj.style;
    this.styleName_ = styleObj.name;

    this.applyColour();
  }

  /**
   * Set the style and colour values of a block.
   *
   * @param blockStyleName Name of the block style.
   * @throws {Error} if the block style does not exist.
   */
  override setStyle(blockStyleName: string) {
    const blockStyle = this.workspace
      .getRenderer()
      .getConstants()
      .getBlockStyle(blockStyleName);

    if (this.styleName_) {
      dom.removeClass(this.svgGroup, this.styleName_);
    }

    if (blockStyle) {
      this.hat = blockStyle.hat;
      this.pathObject.setStyle?.(blockStyle);
      // Set colour to match Block.
      this.colour_ = blockStyle.colourPrimary;
      this.style = blockStyle;

      this.applyColour();

      dom.addClass(this.svgGroup, blockStyleName);
      this.styleName_ = blockStyleName;
    } else {
      throw Error('Invalid style name: ' + blockStyleName);
    }
  }

  /**
   * Returns the BlockStyle object used to style this block.
   *
   * @returns This block's style object.
   */
  getStyle(): BlockStyle {
    return this.style;
  }

  /**
   * Move this block to the front of the visible workspace.
   * <g> tags do not respect z-index so SVG renders them in the
   * order that they are in the DOM.  By placing this block first within the
   * block group's <g>, it will render on top of any other blocks.
   * Use sparingly, this method is expensive because it reorders the DOM
   * nodes.
   *
   * @param blockOnly True to only move this block to the front without
   *     adjusting its parents.
   */
  bringToFront(blockOnly = false) {
    const previouslyFocused = getFocusManager().getFocusedNode();
    /* eslint-disable-next-line @typescript-eslint/no-this-alias */
    let block: this | null = this;
    if (block.isDeadOrDying()) {
      return;
    }
    do {
      const root = block.getSvgRoot();
      const parent = root.parentNode;
      const childNodes = parent!.childNodes;
      // Avoid moving the block if it's already at the bottom.
      if (childNodes[childNodes.length - 1] !== root) {
        parent!.appendChild(root);
      }
      if (blockOnly) break;
      block = block.getParent();
    } while (block);
    if (previouslyFocused) {
      // Bringing a block to the front of the stack doesn't fundamentally change
      // the logical structure of the page, but it does change element ordering
      // which can take automatically take away focus from a node. Ensure focus
      // is restored to avoid a discontinuity.
      getFocusManager().focusNode(previouslyFocused);
    }
  }

  /**
   * Set whether this block can chain onto the bottom of another block.
   *
   * @param newBoolean True if there can be a previous statement.
   * @param opt_check Statement type or list of statement types.  Null/undefined
   *     if any type could be connected.
   */
  override setPreviousStatement(
    newBoolean: boolean,
    opt_check?: string | string[] | null,
  ) {
    super.setPreviousStatement(newBoolean, opt_check);
    this.queueRender();
  }

  /**
   * Set whether another block can chain onto the bottom of this block.
   *
   * @param newBoolean True if there can be a next statement.
   * @param opt_check Statement type or list of statement types.  Null/undefined
   *     if any type could be connected.
   */
  override setNextStatement(
    newBoolean: boolean,
    opt_check?: string | string[] | null,
  ) {
    super.setNextStatement(newBoolean, opt_check);
    this.queueRender();
  }

  /**
   * Set whether this block returns a value.
   *
   * @param newBoolean True if there is an output.
   * @param opt_check Returned type or list of returned types.  Null or
   *     undefined if any type could be returned (e.g. variable get).
   */
  override setOutput(
    newBoolean: boolean,
    opt_check?: string | string[] | null,
  ) {
    super.setOutput(newBoolean, opt_check);
    this.queueRender();
  }

  /**
   * Set whether value inputs are arranged horizontally or vertically.
   *
   * @param newBoolean True if inputs are horizontal.
   */
  override setInputsInline(newBoolean: boolean) {
    super.setInputsInline(newBoolean);
    this.queueRender();
  }

  /**
   * Remove an input from this block.
   *
   * @param name The name of the input.
   * @param opt_quiet True to prevent error if input is not present.
   * @returns True if operation succeeds, false if input is not present and
   *     opt_quiet is true
   * @throws {Error} if the input is not present and opt_quiet is not true.
   */
  override removeInput(name: string, opt_quiet?: boolean): boolean {
    const removed = super.removeInput(name, opt_quiet);
    this.queueRender();
    return removed;
  }

  /**
   * Move a numbered input to a different location on this block.
   *
   * @param inputIndex Index of the input to move.
   * @param refIndex Index of input that should be after the moved input.
   */
  override moveNumberedInputBefore(inputIndex: number, refIndex: number) {
    super.moveNumberedInputBefore(inputIndex, refIndex);
    this.queueRender();
  }

  /** @override */
  override appendInput(input: Input): Input {
    super.appendInput(input);
    this.queueRender();
    return input;
  }

  /**
   * Sets whether this block's connections are tracked in the database or not.
   *
   * Used by the deserializer to be more efficient. Setting a connection's
   * tracked_ value to false keeps it from adding itself to the db when it
   * gets its first moveTo call, saving expensive ops for later.
   *
   * @param track If true, start tracking. If false, stop tracking.
   * @internal
   */
  setConnectionTracking(track: boolean) {
    if (this.previousConnection) {
      this.previousConnection.setTracking(track);
    }
    if (this.outputConnection) {
      this.outputConnection.setTracking(track);
    }
    if (this.nextConnection) {
      this.nextConnection.setTracking(track);
      const child = this.nextConnection.targetBlock();
      if (child) {
        child.setConnectionTracking(track);
      }
    }

    if (this.collapsed_) {
      // When track is true, we don't want to start tracking collapsed
      // connections. When track is false, we're already not tracking
      // collapsed connections, so no need to update.
      return;
    }

    for (let i = 0; i < this.inputList.length; i++) {
      const conn = this.inputList[i].connection as RenderedConnection;
      if (conn) {
        conn.setTracking(track);

        // Pass tracking on down the chain.
        const block = conn.targetBlock();
        if (block) {
          block.setConnectionTracking(track);
        }
      }
    }
  }

  /**
   * Returns connections originating from this block.
   *
   * @param all If true, return all connections even hidden ones.
   *     Otherwise, for a collapsed block don't return inputs connections.
   * @returns Array of connections.
   * @internal
   */
  override getConnections_(all: boolean): RenderedConnection[] {
    const myConnections = [];
    if (this.outputConnection) {
      myConnections.push(this.outputConnection);
    }
    if (this.previousConnection) {
      myConnections.push(this.previousConnection);
    }
    if (this.nextConnection) {
      myConnections.push(this.nextConnection);
    }
    if (all || !this.collapsed_) {
      for (let i = 0, input; (input = this.inputList[i]); i++) {
        if (input.connection) {
          myConnections.push(input.connection as RenderedConnection);
        }
      }
    }
    return myConnections;
  }

  /**
   * Walks down a stack of blocks and finds the last next connection on the
   * stack.
   *
   * @param ignoreShadows If true,the last connection on a non-shadow block will
   *     be returned. If false, this will follow shadows to find the last
   *     connection.
   * @returns The last next connection on the stack, or null.
   * @internal
   */
  override lastConnectionInStack(
    ignoreShadows: boolean,
  ): RenderedConnection | null {
    return super.lastConnectionInStack(ignoreShadows) as RenderedConnection;
  }

  /**
   * Find the connection on this block that corresponds to the given connection
   * on the other block.
   * Used to match connections between a block and its insertion marker.
   *
   * @param otherBlock The other block to match against.
   * @param conn The other connection to match.
   * @returns The matching connection on this block, or null.
   * @internal
   */
  override getMatchingConnection(
    otherBlock: Block,
    conn: Connection,
  ): RenderedConnection | null {
    return super.getMatchingConnection(otherBlock, conn) as RenderedConnection;
  }

  /**
   * Create a connection of the specified type.
   *
   * @param type The type of the connection to create.
   * @returns A new connection of the specified type.
   * @internal
   */
  override makeConnection_(type: ConnectionType): RenderedConnection {
    return new RenderedConnection(this, type);
  }

  /**
   * Return the next statement block directly connected to this block.
   *
   * @returns The next statement block or null.
   */
  override getNextBlock(): BlockSvg | null {
    return super.getNextBlock() as BlockSvg;
  }

  /**
   * Returns the block connected to the previous connection.
   *
   * @returns The previous statement block or null.
   */
  override getPreviousBlock(): BlockSvg | null {
    return super.getPreviousBlock() as BlockSvg;
  }

  /**
   * Bumps unconnected blocks out of alignment.
   *
   * Two blocks which aren't actually connected should not coincidentally line
   * up on screen, because that creates confusion for end-users.
   */
  override bumpNeighbours() {
    const root = this.getRootBlock();
    if (
      this.isDeadOrDying() ||
      this.workspace.isDragging() ||
      root.isInFlyout
    ) {
      return;
    }

    function neighbourIsInStack(neighbour: RenderedConnection) {
      return neighbour.getSourceBlock().getRootBlock() === root;
    }

    for (const conn of this.getConnections_(false)) {
      if (conn.isSuperior()) {
        // Recurse down the block stack.
        conn.targetBlock()?.bumpNeighbours();
      }

      for (const neighbour of conn.neighbours(config.snapRadius)) {
        if (neighbourIsInStack(neighbour)) continue;
        if (conn.isConnected() && neighbour.isConnected()) continue;

        if (conn.isSuperior()) {
          neighbour.bumpAwayFrom(conn, /* initiatedByThis = */ false);
        } else {
          conn.bumpAwayFrom(neighbour, /* initiatedByThis = */ true);
        }
      }
    }
  }

  /**
   * Snap to grid, and then bump neighbouring blocks away at the end of the next
   * render.
   */
  scheduleSnapAndBump() {
    this.snapToGrid();
    this.bumpNeighbours();
  }

  /**
   * Position a block so that it doesn't move the target block when connected.
   * The block to position is usually either the first block in a dragged stack
   * or an insertion marker.
   *
   * @param sourceConnection The connection on the moving block's stack.
   * @param originalOffsetToTarget The connection original offset to the target connection
   * @param originalOffsetInBlock The connection original offset in its block
   * @internal
   */
  positionNearConnection(
    sourceConnection: RenderedConnection,
    originalOffsetToTarget: {x: number; y: number},
    originalOffsetInBlock: Coordinate,
  ) {
    // We only need to position the new block if it's before the existing one,
    // otherwise its position is set by the previous block.
    if (
      sourceConnection.type === ConnectionType.NEXT_STATEMENT ||
      sourceConnection.type === ConnectionType.INPUT_VALUE
    ) {
      // First move the block to match the orginal target connection position
      let dx = originalOffsetToTarget.x;
      let dy = originalOffsetToTarget.y;
      // Then adjust its position according to the connection resize
      dx += originalOffsetInBlock.x - sourceConnection.getOffsetInBlock().x;
      dy += originalOffsetInBlock.y - sourceConnection.getOffsetInBlock().y;

      this.moveBy(dx, dy);
    }
  }

  /**
   * Find all the blocks that are directly nested inside this one.
   * Includes value and statement inputs, as well as any following statement.
   * Excludes any connection on an output tab or any preceding statement.
   * Blocks are optionally sorted by position; top to bottom.
   *
   * @param ordered Sort the list if true.
   * @returns Array of blocks.
   */
  override getChildren(ordered: boolean): BlockSvg[] {
    return super.getChildren(ordered) as BlockSvg[];
  }

  /**
   * Triggers a rerender after a delay to allow for batching.
   *
   * @returns A promise that resolves after the currently queued renders have
   *     been completed. Used for triggering other behavior that relies on
   *     updated size/position location for the block.
   * @internal
   */
  queueRender(): Promise<void> {
    return renderManagement.queueRender(this);
  }

  /**
   * Immediately lays out and reflows a block based on its contents and
   * settings.
   */
  render() {
    this.queueRender();
    renderManagement.triggerQueuedRenders();
  }

  /**
   * Renders this block in a way that's compatible with the more efficient
   * render management system.
   *
   * @internal
   */
  renderEfficiently() {
    dom.startTextWidthCache();

    if (this.isCollapsed()) {
      this.updateCollapsed();
    }

    if (!this.isEnabled()) {
      this.updateDisabled();
    }

    this.workspace.getRenderer().render(this);
    this.tightenChildrenEfficiently();

    dom.stopTextWidthCache();
  }

  /**
   * Tightens all children of this block so they are snuggly rendered against
   * their parent connections.
   *
   * Does not update connection locations, so that they can be updated more
   * efficiently by the render management system.
   *
   * @internal
   */
  tightenChildrenEfficiently() {
    for (const input of this.inputList) {
      const conn = input.connection as RenderedConnection;
      if (conn) conn.tightenEfficiently();
    }
    if (this.nextConnection) this.nextConnection.tightenEfficiently();
  }

  /**
   * Returns a bounding box describing the dimensions of this block
   * and any blocks stacked below it.
   *
   * @returns Object with height and width properties in workspace units.
   * @internal
   */
  getHeightWidth(): {height: number; width: number} {
    let height = this.height;
    let width = this.width;
    // Recursively add size of subsequent blocks.
    const nextBlock = this.getNextBlock();
    if (nextBlock) {
      const nextHeightWidth = nextBlock.getHeightWidth();
      const tabHeight = this.workspace
        .getRenderer()
        .getConstants().NOTCH_HEIGHT;
      height += nextHeightWidth.height - tabHeight;
      width = Math.max(width, nextHeightWidth.width);
    }
    return {height, width};
  }

  /**
   * Visual effect to show that if the dragging block is dropped, this block
   * will be replaced.  If a shadow block, it will disappear.  Otherwise it will
   * bump.
   *
   * @param add True if highlighting should be added.
   * @internal
   */
  fadeForReplacement(add: boolean) {
    // TODO (7204): Remove these internal methods.
    (this.pathObject as AnyDuringMigration).updateReplacementFade(add);
  }

  /**
   * Visual effect to show that if the dragging block is dropped it will connect
   * to this input.
   *
   * @param conn The connection on the input to highlight.
   * @param add True if highlighting should be added.
   * @internal
   */
  highlightShapeForInput(conn: RenderedConnection, add: boolean) {
    // TODO (7204): Remove these internal methods.
    (this.pathObject as AnyDuringMigration).updateShapeForInputHighlight(
      conn,
      add,
    );
  }

  /**
   * Returns the drag strategy currently in use by this block.
   *
   * @internal
   * @returns This block's drag strategy.
   */
  getDragStrategy(): IDragStrategy {
    return this.dragStrategy;
  }

  /** Sets the drag strategy for this block. */
  setDragStrategy(dragStrategy: IDragStrategy) {
    this.dragStrategy = dragStrategy;
  }

  /** Returns whether this block is copyable or not. */
  isCopyable(): boolean {
    return this.isOwnDeletable() && this.isOwnMovable();
  }

  /** Returns whether this block is movable or not. */
  override isMovable(): boolean {
    return this.dragStrategy.isMovable();
  }

  /** Starts a drag on the block. */
  startDrag(e?: PointerEvent): void {
    this.dragStrategy.startDrag(e);
    const dragStrategy = this.dragStrategy as BlockDragStrategy;
    const candidate = dragStrategy.connectionCandidate?.neighbour ?? null;
    this.currentConnectionCandidate = candidate;
    this.announceDynamicAriaState(true, false);
  }

  /** Drags the block to the given location. */
  drag(newLoc: Coordinate, e?: PointerEvent): void {
    this.dragStrategy.drag(newLoc, e);
    const dragStrategy = this.dragStrategy as BlockDragStrategy;
    const candidate = dragStrategy.connectionCandidate?.neighbour ?? null;
    this.currentConnectionCandidate = candidate;
    this.announceDynamicAriaState(true, false, newLoc);
  }

  /** Ends the drag on the block. */
  endDrag(e?: PointerEvent): void {
    this.dragStrategy.endDrag(e);
    this.currentConnectionCandidate = null;
    this.announceDynamicAriaState(false, false);
  }

  /** Moves the block back to where it was at the start of a drag. */
  revertDrag(): void {
    this.dragStrategy.revertDrag();
    this.announceDynamicAriaState(false, true);
  }

  /**
   * Returns a representation of this block that can be displayed in a flyout.
   */
  toFlyoutInfo(): FlyoutItemInfo[] {
    const json: FlyoutItemInfo = {
      kind: 'BLOCK',
      ...blocks.save(this),
    };

    const toRemove = new Set(['id', 'height', 'width', 'pinned', 'enabled']);

    // Traverse the JSON recursively.
    const traverseJson = function (json: {[key: string]: unknown}) {
      for (const key in json) {
        if (toRemove.has(key)) {
          delete json[key];
        } else if (typeof json[key] === 'object') {
          traverseJson(json[key] as {[key: string]: unknown});
        }
      }
    };

    traverseJson(json as unknown as {[key: string]: unknown});
    return [json];
  }

  override jsonInit(json: AnyDuringMigration): void {
    super.jsonInit(json);

    if (json['classes']) {
      this.addClass(
        Array.isArray(json['classes'])
          ? json['classes'].join(' ')
          : json['classes'],
      );
    }
  }

  /** See IFocusableNode.getFocusableElement. */
  getFocusableElement(): HTMLElement | SVGElement {
    const singletonField = this.getSingletonFullBlockField(true, true);
    return singletonField?.getFocusableElement() ?? this.pathObject.svgPath;
  }

  /** See IFocusableNode.getFocusableTree. */
  getFocusableTree(): IFocusableTree {
    return this.workspace;
  }

  /** See IFocusableNode.onNodeFocus. */
  onNodeFocus(): void {
    this.recomputeAriaLabel();
    this.select();
    this.workspace.scrollBoundsIntoView(
      this.getBoundingRectangleWithoutChildren(),
    );
  }

  /** See IFocusableNode.onNodeBlur. */
  onNodeBlur(): void {
    this.unselect();
  }

  /** See IFocusableNode.canBeFocused. */
  canBeFocused(): boolean {
    return true;
  }

  /**
   * Announces the current dynamic state of the specified block, if any.
   *
   * An example of dynamic state is whether the block is currently being moved,
   * and in what way. These states aren't represented through ARIA directly, so
   * they need to be determined and announced using an ARIA live region
   * (see aria.announceDynamicAriaState).
   *
   * @param isMoving Whether the specified block is currently being moved.
   * @param isCanceled Whether the previous movement operation has been canceled.
   * @param newLoc The new location the block is moving to (if unconstrained).
   */
  private announceDynamicAriaState(
    isMoving: boolean,
    isCanceled: boolean,
    newLoc?: Coordinate,
  ) {
    if (isCanceled) {
      aria.announceDynamicAriaState('Canceled movement');
      return;
    }
    if (!isMoving) return;
    if (this.currentConnectionCandidate) {
      // TODO: Figure out general detachment.
      // TODO: Figure out how to deal with output connections.
      const surroundParent = this.currentConnectionCandidate.sourceBlock_;
      const announcementContext = [];
      announcementContext.push('Moving'); // TODO: Specialize for inserting?
      // NB: Old code here doesn't seem to handle parents correctly.
      if (this.currentConnectionCandidate.type === ConnectionType.INPUT_VALUE) {
        announcementContext.push('to', 'input');
      } else {
        announcementContext.push('to', 'child');
      }
      if (surroundParent) {
        announcementContext.push('of', surroundParent.computeAriaLabel());
      }

      // If the block is currently being moved, announce the new block label so that the user understands where it is now.
      // TODO: Figure out how much recomputeAriaTreeItemDetailsRecursively needs to anticipate position if it won't be reannounced, and how much of that context should be included in the liveannouncement.
      aria.announceDynamicAriaState(announcementContext.join(' '));
    } else if (newLoc) {
      // The block is being freely dragged.
      aria.announceDynamicAriaState(
        `Moving unconstrained to coordinate x ${Math.round(newLoc.x)} and y ${Math.round(newLoc.y)}.`,
      );
    }
  }
}

interface BlockSummary {
  blockSummary: string;
  commaSeparatedSummary: string;
  inputCount: number;
}

function buildBlockSummary(block: BlockSvg, verbose: boolean): BlockSummary {
  let inputCount = 0;

  // Produce structured segments
  // For example, the block:
  //   "create list with item foo repeated 5 times"
  // becomes:
  //   LABEL("create list with item"),
  //   INPUT("foo"),
  //   LABEL("repeated")
  //   INPUT("5"),
  //   LABEL("times")
  type SummarySegment =
    | {kind: 'label'; text: string}
    | {kind: 'input'; text: string};

  function recursiveInputSummary(
    block: BlockSvg,
    isNestedInput: boolean = false,
  ): SummarySegment[] {
    return block.inputList.flatMap((input) => {
      const fields: SummarySegment[] = input.fieldRow
        .filter((field) => {
          if (!field.isVisible()) return false;
          if (field instanceof FieldImage && field.isClickable()) {
            return false;
          }
          return true;
        })
        .map((field) => {
          const text = field.computeAriaLabel(verbose);
          // If the block is a full block field, we only want to know if it's an
          // editable field if we're not directly on it.
          if (field.EDITABLE && !field.isFullBlockField() && !isNestedInput) {
            inputCount++;
            return {kind: 'input', text};
          }

          return {kind: 'label', text};
        });

      if (
        input.isVisible() &&
        input.connection &&
        input.connection.type === ConnectionType.INPUT_VALUE
      ) {
        if (!isNestedInput) {
          inputCount++;
        }

        const targetBlock = input.connection.targetBlock();
        if (targetBlock) {
          const nestedSegments = recursiveInputSummary(
            targetBlock as BlockSvg,
            true,
          );

          if (!isNestedInput) {
            // treat the whole nested summary as a single input segment
            const nestedText = nestedSegments.map((s) => s.text).join(' ');
            return [...fields, {kind: 'input', text: nestedText}];
          }

          return [...fields, ...nestedSegments];
        }
      }

      return fields;
    });
  }

  const segments = recursiveInputSummary(block);

  const blockSummary = segments.map((s) => s.text).join(' ');

  const spokenParts: string[] = [];
  let labelRun: string[] = [];

  // create runs of labels, flush when hitting an input
  const flushLabels = () => {
    if (!labelRun.length) return;
    spokenParts.push(labelRun.join(' '));
    labelRun = [];
  };

  for (const seg of segments) {
    if (seg.kind === 'label') {
      labelRun.push(seg.text);
    } else {
      flushLabels();
      spokenParts.push(seg.text);
    }
  }
  flushLabels();

  // comma-separate label runs and inputs
  const commaSeparatedSummary = spokenParts.join(', ');

  return {
    blockSummary,
    commaSeparatedSummary,
    inputCount,
  };
}
