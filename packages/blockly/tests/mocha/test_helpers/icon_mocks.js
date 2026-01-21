/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {isFocusableNode} from '../../../build/src/core/interfaces/i_focusable_node.js';
import {hasBubble} from '../../../build/src/core/interfaces/i_has_bubble.js';
import {isIcon} from '../../../build/src/core/interfaces/i_icon.js';
import {isSerializable} from '../../../build/src/core/interfaces/i_serializable.js';

export class MockFocusable {
  getFocusableElement() {}
  getFocusableTree() {}
  onNodeFocus() {}
  onNodeBlur() {}
  canBeFocused() {}
}

if (!isFocusableNode(new MockFocusable())) {
  throw new TypeError('MockFocusable not an IFocuableNode');
}

export class MockIcon extends MockFocusable {
  getType() {
    return new Blockly.icons.IconType('mock icon');
  }

  initView() {}

  dispose() {}

  getWeight() {}

  getSize() {
    return new Blockly.utils.Size(0, 0);
  }

  applyColour() {}

  hideForInsertionMarker() {}

  updateEditable() {}

  updateCollapsed() {}

  isShownWhenCollapsed() {}

  setOffsetInBlock() {}

  onLocationChange() {}

  onClick() {}

  getFocusableElement() {
    throw new Error('Unsupported operation in mock.');
  }

  getFocusableTree() {
    throw new Error('Unsupported operation in mock.');
  }

  onNodeFocus() {}

  onNodeBlur() {}

  canBeFocused() {
    return false;
  }
}

if (!isIcon(new MockIcon())) {
  throw new TypeError('MockIcon not an IIcon');
}

export class MockSerializableIcon extends MockIcon {
  constructor() {
    super();
    this.state = '';
  }

  getType() {
    return new Blockly.icons.IconType('serializable icon');
  }

  getWeight() {
    return 1;
  }

  saveState() {
    return 'some state';
  }

  loadState(state) {
    this.state = state;
  }
}

if (!isSerializable(new MockSerializableIcon())) {
  throw new TypeError('MockSerializableIcon not an ISerializable');
}

export class MockBubbleIcon extends MockIcon {
  constructor() {
    super();
    this.visible = false;
  }

  getType() {
    return new Blockly.icons.IconType('bubble icon');
  }

  updateCollapsed() {}

  bubbleIsVisible() {
    return this.visible;
  }

  setBubbleVisible(visible) {
    this.visible = visible;
  }

  getBubble() {
    return null;
  }
}

if (!hasBubble(new MockBubbleIcon())) {
  throw new TypeError('MockBubbleIcon not an IHasBubble');
}
