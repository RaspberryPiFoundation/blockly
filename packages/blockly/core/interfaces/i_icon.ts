/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {IconType} from '../icons/icon_types.js';
import type {Coordinate} from '../utils/coordinate.js';
import type {Size} from '../utils/size.js';
import {IFocusableNode, isFocusableNode} from './i_focusable_node.js';

export interface IIcon extends IFocusableNode {
  /**
   * @returns the IconType representing the type of the icon. This value should
   *     also be used to register the icon via `Blockly.icons.registry.register`.
   */
  getType(): IconType<IIcon>;

  /**
   * Creates the SVG elements for the icon that will live on the block.
   *
   * @param pointerdownListener An event listener that must be attached to the
   *     root SVG element by the implementation of `initView`. Used by Blockly's
   *     gesture system to properly handle clicks and drags.
   */
  initView(pointerdownListener: (e: PointerEvent) => void): void;

  /**
   * Disposes of any elements of the icon.
   *
   * @remarks
   *
   * In particular, if this icon is currently showing a bubble, this should be
   * used to hide it.
   */
  dispose(): void;

  /**
   * @returns the "weight" of the icon, which determines the static order which
   *     icons should be rendered in. More positive numbers are rendered farther
   *     toward the end of the block.
   */
  getWeight(): number;

  /** @returns The dimensions of the icon for use in rendering. */
  getSize(): Size;

  /** Updates the icon's color when the block's color changes.. */
  applyColour(): void;

  /** Hides the icon when it is part of an insertion marker. */
  hideForInsertionMarker(): void;

  /** Updates the icon's editability when the block's editability changes. */
  updateEditable(): void;

  /**
   * Updates the icon's collapsed-ness/view when the block's collapsed-ness
   * changes.
   */
  updateCollapsed(): void;

  /**
   * @returns Whether this icon is shown when the block is collapsed. Used
   *     to allow renderers to account for padding.
   */
  isShownWhenCollapsed(): boolean;

  /**
   * Notifies the icon where it is relative to its block's top-start, in
   * workspace units.
   */
  setOffsetInBlock(offset: Coordinate): void;

  /**
   * Notifies the icon that it has changed locations.
   *
   * @param blockOrigin The location of this icon's block's top-start corner
   *     in workspace coordinates.
   */
  onLocationChange(blockOrigin: Coordinate): void;

  /**
   * Notifies the icon that it has been clicked.
   */
  onClick(): void;

  /**
   * Check whether the icon should be clickable while the block is in a flyout.
   * If this function is not defined, the icon will be clickable in all flyouts.
   *
   * @param autoClosingFlyout true if the containing flyout is an auto-closing one.
   * @returns Whether the icon should be clickable while the block is in a flyout.
   */
  isClickableInFlyout?(autoClosingFlyout: boolean): boolean;
}

/** Type guard that checks whether the given object is an IIcon. */
export function isIcon(obj: any): obj is IIcon {
  return (
    isFocusableNode(obj) &&
    typeof (obj as IIcon).getType === 'function' &&
    typeof (obj as IIcon).initView === 'function' &&
    typeof (obj as IIcon).dispose === 'function' &&
    typeof (obj as IIcon).getWeight === 'function' &&
    typeof (obj as IIcon).getSize === 'function' &&
    typeof (obj as IIcon).applyColour === 'function' &&
    typeof (obj as IIcon).hideForInsertionMarker === 'function' &&
    typeof (obj as IIcon).updateEditable === 'function' &&
    typeof (obj as IIcon).updateCollapsed === 'function' &&
    typeof (obj as IIcon).isShownWhenCollapsed === 'function' &&
    typeof (obj as IIcon).setOffsetInBlock === 'function' &&
    typeof (obj as IIcon).onLocationChange === 'function' &&
    typeof (obj as IIcon).onClick === 'function'
  );
}
