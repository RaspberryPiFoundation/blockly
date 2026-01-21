/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as browserEvents from '../browser_events.js';
import {
  WorkspaceCommentCopyData,
  WorkspaceCommentPaster,
} from '../clipboard/workspace_comment_paster.js';
import * as common from '../common.js';
import * as contextMenu from '../contextmenu.js';
import {ContextMenuRegistry} from '../contextmenu_registry.js';
import {CommentDragStrategy} from '../dragging/comment_drag_strategy.js';
import {getFocusManager} from '../focus_manager.js';
import {IBoundedElement} from '../interfaces/i_bounded_element.js';
import {IContextMenu} from '../interfaces/i_contextmenu.js';
import {ICopyable} from '../interfaces/i_copyable.js';
import {IDeletable} from '../interfaces/i_deletable.js';
import {IDraggable} from '../interfaces/i_draggable.js';
import {IFocusableNode} from '../interfaces/i_focusable_node.js';
import type {IFocusableTree} from '../interfaces/i_focusable_tree.js';
import {IRenderedElement} from '../interfaces/i_rendered_element.js';
import {ISelectable} from '../interfaces/i_selectable.js';
import * as commentSerialization from '../serialization/workspace_comments.js';
import {Coordinate} from '../utils/coordinate.js';
import * as dom from '../utils/dom.js';
import {Rect} from '../utils/rect.js';
import {Size} from '../utils/size.js';
import * as svgMath from '../utils/svg_math.js';
import {WorkspaceSvg} from '../workspace_svg.js';
import {CommentView} from './comment_view.js';
import {WorkspaceComment} from './workspace_comment.js';

export class RenderedWorkspaceComment
  extends WorkspaceComment
  implements
    IBoundedElement,
    IRenderedElement,
    IDraggable,
    ISelectable,
    IDeletable,
    ICopyable<WorkspaceCommentCopyData>,
    IContextMenu,
    IFocusableNode
{
  /** The class encompassing the svg elements making up the workspace comment. */
  view: CommentView;

  public readonly workspace: WorkspaceSvg;

  private dragStrategy = new CommentDragStrategy(this);

  /** Constructs the workspace comment, including the view. */
  constructor(workspace: WorkspaceSvg, id?: string) {
    super(workspace, id);

    this.workspace = workspace;

    this.view = new CommentView(workspace, this.id);
    // Set the size to the default size as defined in the superclass.
    this.view.setSize(this.getSize());
    this.view.setEditable(this.isEditable());
    this.view.getSvgRoot().setAttribute('data-id', this.id);
    this.view.getSvgRoot().setAttribute('id', this.id);

    this.addModelUpdateBindings();

    browserEvents.conditionalBind(
      this.view.getSvgRoot(),
      'pointerdown',
      this,
      this.startGesture,
    );
  }

  /**
   * Adds listeners to the view that updates the model (i.e. the superclass)
   * when changes are made to the view.
   */
  private addModelUpdateBindings() {
    this.view.addTextChangeListener(
      (_, newText: string) => void super.setText(newText),
    );
    this.view.addSizeChangeListener(
      (_, newSize: Size) => void super.setSize(newSize),
    );
    this.view.addOnCollapseListener(
      () => void super.setCollapsed(this.view.isCollapsed()),
    );
    this.view.addDisposeListener(() => {
      if (!this.isDeadOrDying()) this.dispose();
    });
  }

  /** Sets the text of the comment. */
  override setText(text: string): void {
    // setText will trigger the change listener that updates
    // the model aka superclass.
    this.view.setText(text);
  }

  /** Sets the placeholder text displayed if the comment is empty. */
  setPlaceholderText(text: string): void {
    this.view.setPlaceholderText(text);
  }

  /** Sets the size of the comment. */
  override setSize(size: Size) {
    // setSize will trigger the change listener that updates
    // the model aka superclass.
    this.view.setSize(size);
  }

  /** Sets whether the comment is collapsed or not. */
  override setCollapsed(collapsed: boolean) {
    // setCollapsed will trigger the change listener that updates
    // the model aka superclass.
    this.view.setCollapsed(collapsed);
  }

  /** Sets whether the comment is editable or not. */
  override setEditable(editable: boolean): void {
    super.setEditable(editable);
    // Use isEditable rather than isOwnEditable to account for workspace state.
    this.view.setEditable(this.isEditable());
  }

  /** Returns the root SVG element of this comment. */
  getSvgRoot(): SVGElement {
    return this.view.getSvgRoot();
  }

  /**
   * Returns the comment's size in workspace units.
   * Does not respect collapsing.
   */
  getSize(): Size {
    return super.getSize();
  }

  /**
   * Returns the bounding rectangle of this comment in workspace coordinates.
   * Respects collapsing.
   */
  getBoundingRectangle(): Rect {
    const loc = this.getRelativeToSurfaceXY();
    const size = this.view?.getSize() ?? this.getSize();
    let left;
    let right;
    if (this.workspace.RTL) {
      left = loc.x - size.width;
      right = loc.x;
    } else {
      left = loc.x;
      right = loc.x + size.width;
    }
    return new Rect(loc.y, loc.y + size.height, left, right);
  }

  /** Move the comment by the given amounts in workspace coordinates. */
  moveBy(dx: number, dy: number, reason?: string[] | undefined): void {
    const loc = this.getRelativeToSurfaceXY();
    const newLoc = new Coordinate(loc.x + dx, loc.y + dy);
    this.moveTo(newLoc, reason);
  }

  /** Moves the comment to the given location in workspace coordinates. */
  override moveTo(location: Coordinate, reason?: string[] | undefined): void {
    super.moveTo(location, reason);
    this.view.moveTo(location);
  }

  /**
   * Moves the comment during a drag. Doesn't fire move events.
   *
   * @internal
   */
  moveDuringDrag(location: Coordinate): void {
    this.location = location;
    this.view.moveTo(location);
  }

  /**
   * Adds the dragging CSS class to this comment.
   *
   * @internal
   */
  setDragging(dragging: boolean): void {
    if (dragging) {
      dom.addClass(this.getSvgRoot(), 'blocklyDragging');
    } else {
      dom.removeClass(this.getSvgRoot(), 'blocklyDragging');
    }
  }

  /** Disposes of the view. */
  override dispose() {
    this.disposing = true;
    const focusManager = getFocusManager();
    if (focusManager.getFocusedNode() === this) {
      setTimeout(() => focusManager.focusTree(this.workspace), 0);
    }
    if (!this.view.isDeadOrDying()) this.view.dispose();

    super.dispose();
  }

  /**
   * Starts a gesture because we detected a pointer down on the comment
   * (that wasn't otherwise gobbled up, e.g. by resizing).
   */
  private startGesture(e: PointerEvent) {
    const gesture = this.workspace.getGesture(e);
    if (gesture) {
      gesture.handleCommentStart(e, this);
      getFocusManager().focusNode(this);
    }
  }

  /** Visually indicates that this comment would be deleted if dropped. */
  setDeleteStyle(wouldDelete: boolean): void {
    if (wouldDelete) {
      dom.addClass(this.getSvgRoot(), 'blocklyDraggingDelete');
    } else {
      dom.removeClass(this.getSvgRoot(), 'blocklyDraggingDelete');
    }
  }

  /** Returns whether this comment is copyable or not */
  isCopyable(): boolean {
    return this.isOwnMovable() && this.isOwnDeletable();
  }

  /** Returns whether this comment is movable or not. */
  isMovable(): boolean {
    return this.dragStrategy.isMovable();
  }

  /** Starts a drag on the comment. */
  startDrag(): void {
    this.dragStrategy.startDrag();
  }

  /** Drags the comment to the given location. */
  drag(newLoc: Coordinate): void {
    this.dragStrategy.drag(newLoc);
  }

  /** Ends the drag on the comment. */
  endDrag(): void {
    this.dragStrategy.endDrag();
  }

  /** Moves the comment back to where it was at the start of a drag. */
  revertDrag(): void {
    this.dragStrategy.revertDrag();
  }

  /** Visually highlights the comment. */
  select(): void {
    dom.addClass(this.getSvgRoot(), 'blocklySelected');
    common.fireSelectedEvent(this);
  }

  /** Visually unhighlights the comment. */
  unselect(): void {
    dom.removeClass(this.getSvgRoot(), 'blocklySelected');
    common.fireSelectedEvent(null);
  }

  /**
   * Returns a JSON serializable representation of this comment's state that
   * can be used for pasting.
   */
  toCopyData(): WorkspaceCommentCopyData | null {
    return {
      paster: WorkspaceCommentPaster.TYPE,
      commentState: commentSerialization.save(this, {
        addCoordinates: true,
        saveIds: false,
      }),
    };
  }

  /** Show a context menu for this comment. */
  showContextMenu(e: Event): void {
    const menuOptions = ContextMenuRegistry.registry.getContextMenuOptions(
      {comment: this, focusedNode: this},
      e,
    );

    let location: Coordinate;
    if (e instanceof PointerEvent) {
      location = new Coordinate(e.clientX, e.clientY);
    } else {
      // Show the menu based on the location of the comment
      const xy = svgMath.wsToScreenCoordinates(
        this.workspace,
        this.getRelativeToSurfaceXY(),
      );
      location = xy.translate(10, 10);
    }

    contextMenu.show(
      e,
      menuOptions,
      this.workspace.RTL,
      this.workspace,
      location,
    );
  }

  /** Snap this comment to the nearest grid point. */
  snapToGrid(): void {
    if (this.isDeadOrDying()) return;
    const grid = this.workspace.getGrid();
    if (!grid?.shouldSnap()) return;
    const currentXY = this.getRelativeToSurfaceXY();
    const alignedXY = grid.alignXY(currentXY);
    if (alignedXY !== currentXY) {
      this.moveTo(alignedXY, ['snap']);
    }
  }

  /**
   * @returns The FocusableNode representing the editor portion of this comment.
   */
  getEditorFocusableNode(): IFocusableNode {
    return this.view.getEditorFocusableNode();
  }

  /** See IFocusableNode.getFocusableElement. */
  getFocusableElement(): HTMLElement | SVGElement {
    return this.getSvgRoot();
  }

  /** See IFocusableNode.getFocusableTree. */
  getFocusableTree(): IFocusableTree {
    return this.workspace;
  }

  /** See IFocusableNode.onNodeFocus. */
  onNodeFocus(): void {
    this.select();
    // Ensure that the comment is always at the top when focused.
    this.getSvgRoot().parentElement?.appendChild(this.getSvgRoot());
    this.workspace.scrollBoundsIntoView(this.getBoundingRectangle());
  }

  /** See IFocusableNode.onNodeBlur. */
  onNodeBlur(): void {
    this.unselect();
  }

  /** See IFocusableNode.canBeFocused. */
  canBeFocused(): boolean {
    return true;
  }
}
