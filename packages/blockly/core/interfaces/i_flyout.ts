/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.IFlyout

import type {FlyoutItem} from '../flyout_item.js';
import type {Svg} from '../utils/svg.js';
import type {FlyoutDefinition} from '../utils/toolbox.js';
import type {WorkspaceSvg} from '../workspace_svg.js';
import type {IRegistrable} from './i_registrable.js';

/**
 * Interface for a flyout.
 */
export interface IFlyout extends IRegistrable {
  /** Whether the flyout is laid out horizontally or not. */
  horizontalLayout: boolean;

  /** Is RTL vs LTR. */
  RTL: boolean;

  /** The target workspace */
  targetWorkspace: WorkspaceSvg | null;

  /** Margin around the edges of the blocks in the flyout. */
  readonly MARGIN: number;

  /** Does the flyout automatically close when a block is created? */
  autoClose: boolean;

  /** Corner radius of the flyout background. */
  readonly CORNER_RADIUS: number;

  /**
   * Creates the flyout's DOM.  Only needs to be called once.  The flyout can
   * either exist as its own svg element or be a g element nested inside a
   * separate svg element.
   *
   * @param tagName The type of tag to put the flyout in. This should be <svg>
   *     or <g>.
   * @returns The flyout's SVG group.
   */
  createDom(
    tagName: string | Svg<SVGSVGElement> | Svg<SVGGElement>,
  ): SVGElement;

  /**
   * Initializes the flyout.
   *
   * @param targetWorkspace The workspace in which to create new blocks.
   */
  init(targetWorkspace: WorkspaceSvg): void;

  /**
   * Dispose of this flyout.
   * Unlink from all DOM elements to prevent memory leaks.
   */
  dispose(): void;

  /**
   * Get the width of the flyout.
   *
   * @returns The width of the flyout.
   */
  getWidth(): number;

  /**
   * Get the height of the flyout.
   *
   * @returns The height of the flyout.
   */
  getHeight(): number;

  /**
   * Get the workspace inside the flyout.
   *
   * @returns The workspace inside the flyout.
   */
  getWorkspace(): WorkspaceSvg;

  /**
   * Is the flyout visible?
   *
   * @returns True if visible.
   */
  isVisible(): boolean;

  /**
   * Set whether the flyout is visible. A value of true does not necessarily
   * mean that the flyout is shown. It could be hidden because its container is
   * hidden.
   *
   * @param visible True if visible.
   */
  setVisible(visible: boolean): void;

  /**
   * Set whether this flyout's container is visible.
   *
   * @param visible Whether the container is visible.
   */
  setContainerVisible(visible: boolean): void;

  /** Hide and empty the flyout. */
  hide(): void;

  /**
   * Show and populate the flyout.
   *
   * @param flyoutDef Contents to display in the flyout. This is either an array
   *     of Nodes, a NodeList, a toolbox definition, or a string with the name
   *     of the dynamic category.
   */
  show(flyoutDef: FlyoutDefinition | string): void;

  /**
   * Returns the list of flyout items currently present in the flyout.
   * The `show` method parses the flyout definition into a list of actual
   * flyout items. This method should return those concrete items, which
   * may be used for e.g. keyboard navigation.
   *
   * @returns List of flyout items.
   */
  getContents(): FlyoutItem[];

  /** Reflow blocks and their mats. */
  reflow(): void;

  /**
   * @returns True if this flyout may be scrolled with a scrollbar or by
   *     dragging.
   */
  isScrollable(): boolean;

  /**
   * Calculates the x coordinate for the flyout position.
   *
   * @returns X coordinate.
   */
  getX(): number;

  /**
   * Calculates the y coordinate for the flyout position.
   *
   * @returns Y coordinate.
   */
  getY(): number;

  /** Position the flyout. */
  position(): void;

  /** Scroll the flyout to the beginning of its contents. */
  scrollToStart(): void;
}
