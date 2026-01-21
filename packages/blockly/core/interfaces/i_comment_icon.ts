/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {CommentState} from '../icons/comment_icon.js';
import {IconType} from '../icons/icon_types.js';
import {Coordinate} from '../utils/coordinate.js';
import {Size} from '../utils/size.js';
import {IHasBubble, hasBubble} from './i_has_bubble.js';
import {IIcon, isIcon} from './i_icon.js';
import {ISerializable, isSerializable} from './i_serializable.js';

export interface ICommentIcon extends IIcon, IHasBubble, ISerializable {
  setText(text: string): void;

  getText(): string;

  setBubbleSize(size: Size): void;

  getBubbleSize(): Size;

  setBubbleLocation(location: Coordinate): void;

  getBubbleLocation(): Coordinate | undefined;

  saveState(): CommentState;

  loadState(state: CommentState): void;
}

/** Checks whether the given object is an ICommentIcon. */
export function isCommentIcon(obj: any): obj is ICommentIcon {
  return (
    isIcon(obj) &&
    hasBubble(obj) &&
    isSerializable(obj) &&
    typeof (obj as any).setText === 'function' &&
    typeof (obj as any).getText === 'function' &&
    typeof (obj as any).setBubbleSize === 'function' &&
    typeof (obj as any).getBubbleSize === 'function' &&
    typeof (obj as any).setBubbleLocation === 'function' &&
    typeof (obj as any).getBubbleLocation === 'function' &&
    obj.getType() === IconType.COMMENT
  );
}
