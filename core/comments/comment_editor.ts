/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as browserEvents from '../browser_events.js';
import {getFocusManager} from '../focus_manager.js';
import {IFocusableNode} from '../interfaces/i_focusable_node.js';
import {IFocusableTree} from '../interfaces/i_focusable_tree.js';
import {Msg} from '../msg.js';
import * as touch from '../touch.js';
import * as dom from '../utils/dom.js';
import {Rect} from '../utils/rect.js';
import {Size} from '../utils/size.js';
import {Svg} from '../utils/svg.js';
import * as svgMath from '../utils/svg_math.js';
import {WorkspaceSvg} from '../workspace_svg.js';

/**
 * String added to the ID of a workspace comment to identify
 * the focusable node for the comment editor.
 */
export const COMMENT_EDITOR_FOCUS_IDENTIFIER = '_comment_textarea_';

/** The part of a comment that can be typed into. */
export class CommentEditor implements IFocusableNode {
  id?: string;
  /** The foreignObject containing the HTML text area. */
  private foreignObject: SVGForeignObjectElement;

  /** The text area where the user can type. */
  private textArea: HTMLTextAreaElement;

  /** Listeners for changes to text. */
  private textChangeListeners: Array<
    (oldText: string, newText: string) => void
  > = [];

  /** The current text of the comment. Updates on text area change. */
  private text: string = '';

  constructor(
    public workspace: WorkspaceSvg,
    commentId?: string,
    private onFinishEditing?: () => void,
  ) {
    this.foreignObject = dom.createSvgElement(Svg.FOREIGNOBJECT, {
      'class': 'blocklyCommentForeignObject',
    });
    const body = document.createElementNS(dom.HTML_NS, 'body');
    body.setAttribute('xmlns', dom.HTML_NS);
    body.className = 'blocklyMinimalBody';
    this.textArea = document.createElementNS(
      dom.HTML_NS,
      'textarea',
    ) as HTMLTextAreaElement;
    this.textArea.setAttribute('tabindex', '-1');
    this.textArea.setAttribute('dir', this.workspace.RTL ? 'RTL' : 'LTR');
    this.textArea.setAttribute(
      'placeholder',
      Msg['WORKSPACE_COMMENT_DEFAULT_TEXT'],
    );
    dom.addClass(this.textArea, 'blocklyCommentText');
    dom.addClass(this.textArea, 'blocklyTextarea');
    dom.addClass(this.textArea, 'blocklyText');
    body.appendChild(this.textArea);
    this.foreignObject.appendChild(body);

    if (commentId) {
      this.id = commentId + COMMENT_EDITOR_FOCUS_IDENTIFIER;
      this.textArea.setAttribute('id', this.id);
    }

    // Register browser event listeners for the user typing in the textarea.
    browserEvents.conditionalBind(
      this.textArea,
      'change',
      this,
      this.onTextChange,
    );

    // Register listener for pointerdown to focus the textarea.
    browserEvents.conditionalBind(
      this.textArea,
      'pointerdown',
      this,
      (e: PointerEvent) => {
        // don't allow this event to bubble up
        // and steal focus away from the editor/comment.
        e.stopPropagation();
        getFocusManager().focusNode(this);
        touch.clearTouchIdentifier();
      },
    );

    // Don't zoom with mousewheel; let it scroll instead.
    browserEvents.conditionalBind(
      this.textArea,
      'wheel',
      this,
      (e: Event) => {
        e.stopPropagation();
      },
      false,
      {passive: true},
    );

    // Register listener for keydown events that would finish editing.
    browserEvents.conditionalBind(
      this.textArea,
      'keydown',
      this,
      this.handleKeyDown,
    );
  }

  /** Gets the dom structure for this comment editor. */
  getDom(): SVGForeignObjectElement {
    return this.foreignObject;
  }

  /** Gets the current text of the comment. */
  getText(): string {
    return this.text;
  }

  /** Sets the current text of the comment and fires change listeners. */
  setText(text: string) {
    this.textArea.value = text;
    this.onTextChange();
  }

  /**
   * Triggers listeners when the text of the comment changes, either
   * programmatically or manually by the user.
   */
  private onTextChange() {
    const oldText = this.text;
    this.text = this.textArea.value;
    // Loop through listeners backwards in case they remove themselves.
    for (let i = this.textChangeListeners.length - 1; i >= 0; i--) {
      this.textChangeListeners[i](oldText, this.text);
    }
  }

  /**
   * Do something when the user indicates they've finished editing.
   *
   * @param e Keyboard event.
   */
  private handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape' || (e.key === 'Enter' && (e.ctrlKey || e.metaKey))) {
      if (this.onFinishEditing) this.onFinishEditing();
      e.stopPropagation();
    }
  }

  /** Registers a callback that listens for text changes. */
  addTextChangeListener(listener: (oldText: string, newText: string) => void) {
    this.textChangeListeners.push(listener);
  }

  /** Removes the given listener from the list of text change listeners. */
  removeTextChangeListener(listener: () => void) {
    this.textChangeListeners.splice(
      this.textChangeListeners.indexOf(listener),
      1,
    );
  }

  /** Sets the placeholder text displayed for an empty comment. */
  setPlaceholderText(text: string) {
    this.textArea.placeholder = text;
  }

  /** Sets whether the textarea is editable. If not, the textarea will be readonly. */
  setEditable(isEditable: boolean) {
    if (isEditable) {
      this.textArea.removeAttribute('readonly');
    } else {
      this.textArea.setAttribute('readonly', 'true');
    }
  }

  /** Update the size of the comment editor element. */
  updateSize(size: Size, topBarSize: Size) {
    this.foreignObject.setAttribute(
      'height',
      `${size.height - topBarSize.height}`,
    );
    this.foreignObject.setAttribute('width', `${size.width}`);
    this.foreignObject.setAttribute('y', `${topBarSize.height}`);
    if (this.workspace.RTL) {
      this.foreignObject.setAttribute('x', `${-size.width}`);
    }
  }

  getFocusableElement(): HTMLElement | SVGElement {
    return this.textArea;
  }
  getFocusableTree(): IFocusableTree {
    return this.workspace;
  }
  onNodeFocus(): void {
    const bbox = Rect.from(this.foreignObject.getBoundingClientRect());
    this.workspace.scrollBoundsIntoView(
      Rect.createFromPoint(
        svgMath.screenToWsCoordinates(this.workspace, bbox.getOrigin()),
        bbox.getWidth(),
        bbox.getHeight(),
      ),
    );
  }
  onNodeBlur(): void {}
  canBeFocused(): boolean {
    if (this.id) return true;
    return false;
  }
}
