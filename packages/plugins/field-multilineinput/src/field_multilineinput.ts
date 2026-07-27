/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Multiline text input field.
 */

import * as Blockly from 'blockly/core';

/**
 * Class for an editable text area input field.
 */
export class FieldMultilineInput extends Blockly.FieldTextInput {
  /**
   * Minimum editor width (in SVG/workspace units) when the field is open.
   * Prevents narrow editors when the initial text is very short.
   */

  static readonly EDITOR_MIN_WIDTH = 150;

  /**
   * The SVG group element that will contain a text element for each text row
   *     when initialized.
   */
  textGroup: SVGGElement | null = null;

  /**
   * Defines the maximum number of lines of field.
   * If exceeded, scrolling functionality is enabled.
   */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  protected maxLines_ = Infinity;

  /** Whether Y overflow is currently occurring. */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  protected isOverflowedY_ = false;

  /** Whether pressing Enter commits the value (default) or inserts a newline. */
  static enterCommits = true;

  /** Whether to show the keyboard-shortcut hint bar in the editor. */
  static showHint = true;

  /** The hint bar DOM element while the editor is open. */
  private hintElement: HTMLDivElement | null = null;

  /**
   * Cached natural width of the hint bar in px, keyed by scale.
   * Invalidated when zoom changes to avoid stale measurements.
   */
  private cachedHintWidth: {scale: number; widthPx: number} | null = null;

  /**
   * @param value The initial content of the field.  Should cast to a string.
   *     Defaults to an empty string if null or undefined.  Also accepts
   *     Field.SKIP_SETUP if you wish to skip setup (only used by subclasses
   *     that want to handle configuration and setting the field value after
   *     their own constructors have run).
   * @param validator An optional function that is called to validate any
   *     constraints on what the user entered.  Takes the new text as an
   *     argument and returns either the accepted text, a replacement text, or
   *     null to abort the change.
   * @param config A map of options used to configure the field.
   *     See the [field creation documentation]{@link
   * https://developers.google.com/blockly/guides/create-custom-blocks/fields/built-in-fields/multiline-text-input#creation}
   * for a list of properties this parameter supports.
   */
  constructor(
    value?: string | typeof Blockly.Field.SKIP_SETUP,
    validator?: FieldMultilineInputValidator,
    config?: FieldMultilineInputConfig,
  ) {
    super(Blockly.Field.SKIP_SETUP);

    if (value === Blockly.Field.SKIP_SETUP) return;
    if (config) {
      this.configure_(config);
    }
    this.setValue(value);
    if (validator) {
      this.setValidator(validator);
    }
  }

  /**
   * Configure the field based on the given map of options.
   *
   * @param config A map of options to configure the field based on.
   */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  protected override configure_(config: FieldMultilineInputConfig) {
    super.configure_(config);
    if (config.maxLines) this.setMaxLines(config.maxLines);
  }

  /**
   * Serializes this field's value to XML.
   * Should only be called by Blockly.Xml.
   *
   * @param fieldElement The element to populate with info about the field's
   *     state.
   * @returns The element containing info about the field's state.
   */
  override toXml(fieldElement: Element): Element {
    // Replace '\n' characters with HTML-escaped equivalent '&#10'.  This is
    // needed so the plain-text representation of the XML produced by
    // `Blockly.Xml.domToText` will appear on a single line (this is a
    // limitation of the plain-text format).
    fieldElement.textContent = (this.getValue() as string).replace(
      /\n/g,
      '&#10;',
    );
    return fieldElement;
  }

  /**
   * Sets the field's value based on the given XML element.  Should only be
   * called by Blockly.Xml.
   *
   * @param fieldElement The element containing info about the field's state.
   */
  override fromXml(fieldElement: Element) {
    this.setValue((fieldElement.textContent as string).replace(/&#10;/g, '\n'));
  }

  /**
   * Saves this field's value.
   * This function only exists for subclasses of FieldMultilineInput which
   * predate the load/saveState API and only define to/fromXml.
   *
   * @returns The state of this field.
   */
  override saveState() {
    const legacyState = this.saveLegacyState(FieldMultilineInput);
    if (legacyState !== null) {
      return legacyState;
    }
    return this.getValue();
  }

  /**
   * Sets the field's value based on the given state.
   * This function only exists for subclasses of FieldMultilineInput which
   * predate the load/saveState API and only define to/fromXml.
   *
   * @param state The state of the variable to assign to this variable field.
   */
  override loadState(state: unknown) {
    if (this.loadLegacyState(Blockly.Field, state)) {
      return;
    }
    this.setValue(state);
  }

  /**
   * Create the block UI for this field.
   */
  override initView() {
    this.createBorderRect_();
    this.textGroup = Blockly.utils.dom.createSvgElement(
      Blockly.utils.Svg.G,
      {
        class: 'blocklyEditableField',
      },
      this.fieldGroup_,
    );
    if (this.fieldGroup_) {
      Blockly.utils.dom.addClass(this.fieldGroup_, 'blocklyField');
    }
  }

  /**
   * Get the text from this field as displayed on screen.  May differ from
   * getText due to ellipsis, and other formatting.
   *
   * @returns Currently displayed text.
   */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  protected override getDisplayText_(): string {
    const block = this.getSourceBlock();
    if (!block) {
      throw new Error(
        'The field has not yet been attached to its input. ' +
          'Call appendField to attach it.',
      );
    }
    let textLines = this.getText();
    if (!textLines) {
      // Prevent the field from disappearing if empty.
      return Blockly.Field.NBSP;
    }
    const lines = textLines.split('\n');
    textLines = '';
    const displayLinesNumber = this.isOverflowedY_
      ? this.maxLines_
      : lines.length;
    for (let i = 0; i < displayLinesNumber; i++) {
      let text = lines[i];
      if (text.length > this.maxDisplayLength) {
        // Truncate displayed string and add an ellipsis ('...').
        text = text.substring(0, this.maxDisplayLength - 4) + '...';
      } else if (this.isOverflowedY_ && i === displayLinesNumber - 1) {
        text = text.substring(0, text.length - 3) + '...';
      }
      // Replace whitespace with non-breaking spaces so the text doesn't
      // collapse.
      text = text.replace(/\s/g, Blockly.Field.NBSP);

      textLines += text;
      if (i !== displayLinesNumber - 1) {
        textLines += '\n';
      }
    }
    if (block.RTL) {
      // The SVG is LTR, force value to be RTL.
      textLines += '\u200F';
    }
    return textLines;
  }

  /**
   * Called by setValue if the text input is valid.  Updates the value of the
   * field, and updates the text of the field if it is not currently being
   * edited (i.e. handled by the htmlInput_).  Is being redefined here to update
   * overflow state of the field.
   *
   * @param newValue The value to be saved.  The default validator guarantees
   *     that this is a string.
   */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  protected override doValueUpdate_(newValue: string) {
    super.doValueUpdate_(newValue);
    if (this.value_ !== null) {
      this.isOverflowedY_ = this.value_.split('\n').length > this.maxLines_;
    }
  }

  /** Updates the text of the textElement. */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  protected override render_() {
    const block = this.getSourceBlock();
    if (!block) {
      throw new Error(
        'The field has not yet been attached to its input. ' +
          'Call appendField to attach it.',
      );
    }
    // Remove all text group children.
    let currentChild;
    const textGroup = this.textGroup as SVGElement;
    while ((currentChild = textGroup.firstChild)) {
      textGroup.removeChild(currentChild);
    }

    const constants = this.getConstants();
    // This can't happen, but TypeScript thinks it can and lint forbids `!.`.
    if (!constants) throw Error('Constants not found');
    // Add in text elements into the group.
    const lines = this.getDisplayText_().split('\n');
    let y = 0;
    for (let i = 0; i < lines.length; i++) {
      const lineHeight =
        constants.FIELD_TEXT_HEIGHT + constants.FIELD_BORDER_RECT_Y_PADDING;
      const span = Blockly.utils.dom.createSvgElement(
        Blockly.utils.Svg.TEXT,
        {
          class: 'blocklyText blocklyMultilineText',
          x: constants.FIELD_BORDER_RECT_X_PADDING,
          y: y + constants.FIELD_BORDER_RECT_Y_PADDING,
          dy: constants.FIELD_TEXT_BASELINE,
        },
        textGroup,
      );
      span.appendChild(document.createTextNode(lines[i]));
      y += lineHeight;
    }

    if (this.isBeingEdited_) {
      const htmlInput = this.htmlInput_ as HTMLElement;
      if (this.isOverflowedY_) {
        Blockly.utils.dom.addClass(
          htmlInput,
          'blocklyHtmlTextAreaInputOverflowedY',
        );
      } else {
        Blockly.utils.dom.removeClass(
          htmlInput,
          'blocklyHtmlTextAreaInputOverflowedY',
        );
      }
    }

    this.updateSize_();

    if (this.isBeingEdited_) {
      if (block.RTL) {
        // in RTL, we need to let the browser reflow before resizing
        // in order to get the correct bounding box of the borderRect
        // avoiding issue #2777.
        setTimeout(this.resizeEditor_.bind(this), 0);
      } else {
        this.resizeEditor_();
      }
      const htmlInput = this.htmlInput_ as HTMLElement;
      if (!this.isTextValid_) {
        Blockly.utils.dom.addClass(htmlInput, 'blocklyInvalidInput');
        Blockly.utils.aria.setState(
          htmlInput,
          Blockly.utils.aria.State.INVALID,
          true,
        );
      } else {
        Blockly.utils.dom.removeClass(htmlInput, 'blocklyInvalidInput');
        Blockly.utils.aria.setState(
          htmlInput,
          Blockly.utils.aria.State.INVALID,
          false,
        );
      }
    }
  }

  /** Updates the size of the field based on the text. */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  protected override updateSize_() {
    const constants = this.getConstants();
    // This can't happen, but TypeScript thinks it can and lint forbids `!.`.
    if (!constants) throw Error('Constants not found');
    const nodes = (this.textGroup as SVGElement).childNodes;
    let totalWidth = 0;
    let totalHeight = 0;
    for (let i = 0; i < nodes.length; i++) {
      const tspan = nodes[i] as SVGTextElement;
      const textWidth = Blockly.utils.dom.getTextWidth(tspan);
      if (textWidth > totalWidth) {
        totalWidth = textWidth;
      }
      totalHeight +=
        constants.FIELD_TEXT_HEIGHT +
        (i > 0 ? constants.FIELD_BORDER_RECT_Y_PADDING : 0);
    }
    if (this.isBeingEdited_) {
      // The default width is based on the longest line in the display text,
      // but when it's being edited, width should be calculated based on the
      // absolute longest line, even if it would be truncated after editing.
      // Otherwise we would get wrong editor width when there are more
      // lines than this.maxLines_.
      const actualEditorLines = String(this.value_).split('\n');
      const dummyTextElement = Blockly.utils.dom.createSvgElement(
        Blockly.utils.Svg.TEXT,
        {class: 'blocklyText blocklyMultilineText'},
      );

      for (let i = 0; i < actualEditorLines.length; i++) {
        if (actualEditorLines[i].length > this.maxDisplayLength) {
          actualEditorLines[i] = actualEditorLines[i].substring(
            0,
            this.maxDisplayLength,
          );
        }
        dummyTextElement.textContent = actualEditorLines[i];
        const lineWidth = Blockly.utils.dom.getTextWidth(dummyTextElement);
        if (lineWidth > totalWidth) {
          totalWidth = lineWidth;
        }
      }

      const htmlInput = this.htmlInput_ as HTMLElement;
      const scrollbarWidth = htmlInput.offsetWidth - htmlInput.clientWidth;
      totalWidth += scrollbarWidth;

      if (FieldMultilineInput.showHint) {
        // Reserve a row at the bottom of the editor for the keyboard hint bar.
        // The textarea's padding-bottom (set in widgetCreate_) keeps the text
        // and caret out of this reserved strip.
        totalHeight +=
          constants.FIELD_TEXT_HEIGHT + constants.FIELD_BORDER_RECT_Y_PADDING;
      }
    }
    if (this.borderRect_) {
      totalHeight += constants.FIELD_BORDER_RECT_Y_PADDING * 2;
      // NOTE: Adding 1 extra px to prevent wrapping. Based on browser zoom,
      // the rounding of the calculated value can result in the line wrapping
      // unintentionally.
      totalWidth += constants.FIELD_BORDER_RECT_X_PADDING * 2 + 1;
    }
    if (this.isBeingEdited_) {
      totalWidth = Math.max(totalWidth, FieldMultilineInput.EDITOR_MIN_WIDTH);

      // Measure the hint bar's natural width to make sure the editor is wide enough.
      if (FieldMultilineInput.showHint && this.hintElement?.isConnected) {
        const scale = (this.workspace_ as Blockly.WorkspaceSvg).getScale();
        if (!this.cachedHintWidth || this.cachedHintWidth.scale !== scale) {
          // Temporarily let the element size to its content to measure its
          // natural width, unaffected by the current WidgetDiv width.
          this.hintElement.style.width = 'max-content';
          const widthPx = this.hintElement.offsetWidth;
          this.hintElement.style.width = '';
          if (widthPx > 0) this.cachedHintWidth = {scale, widthPx};
        }
        if (this.cachedHintWidth) {
          totalWidth = Math.max(
            totalWidth,
            this.cachedHintWidth.widthPx / scale,
          );
        }
      }
    }
    if (this.borderRect_) {
      this.borderRect_.setAttribute('width', `${totalWidth}`);
      this.borderRect_.setAttribute('height', `${totalHeight}`);
    }
    this.size_.width = totalWidth;
    this.size_.height = totalHeight;

    this.positionBorderRect_();
  }

  /**
   * Show the inline free-text editor on top of the text.
   * Overrides the default behaviour to force rerender in order to
   * correct block size, based on editor text.
   *
   * @param e Optional mouse event that triggered the field to open, or
   *     undefined if triggered programmatically.
   * @param quietInput True if editor should be created without focus.
   *     Defaults to false.
   */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  override showEditor_(e?: Event, quietInput?: boolean) {
    super.showEditor_(e, quietInput);
    this.forceRerender();
  }

  /**
   * Create the text input editor widget.
   *
   * @returns The newly created text input editor.
   */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  protected override widgetCreate_(): HTMLTextAreaElement {
    const div = Blockly.WidgetDiv.getDiv() as HTMLDivElement;
    const scale = (this.workspace_ as Blockly.WorkspaceSvg).getScale();
    const constants = this.getConstants();
    // This can't happen, but TypeScript thinks it can and lint forbids `!.`.
    if (!constants) throw Error('Constants not found');

    const htmlInput = document.createElement('textarea');
    htmlInput.className = 'blocklyHtmlInput blocklyHtmlTextAreaInput';
    htmlInput.setAttribute('spellcheck', String(this.spellcheck_));
    const fontSize = constants.FIELD_TEXT_FONTSIZE * scale + 'pt';
    div.style.fontSize = fontSize;
    htmlInput.style.fontSize = fontSize;
    const borderRadius = Blockly.FieldTextInput.BORDERRADIUS * scale + 'px';
    htmlInput.style.borderRadius = borderRadius;
    const paddingX = constants.FIELD_BORDER_RECT_X_PADDING * scale;
    const paddingY = (constants.FIELD_BORDER_RECT_Y_PADDING * scale) / 2;
    const lineHeight =
      constants.FIELD_TEXT_HEIGHT + constants.FIELD_BORDER_RECT_Y_PADDING;
    const hintHeightPx = Math.ceil(lineHeight * scale);
    // When the hint bar is visible it occupies one text row at the bottom;
    // pad the textarea by that row so we don't edit text underneath it.
    const paddingBottomPx = FieldMultilineInput.showHint
      ? paddingY + hintHeightPx
      : paddingY;
    htmlInput.style.padding = `${paddingY}px ${paddingX}px ${paddingBottomPx}px ${paddingX}px`;
    htmlInput.style.lineHeight = lineHeight * scale + 'px';
    div.appendChild(htmlInput);

    htmlInput.value = htmlInput.defaultValue = this.getEditorText_(this.value_);
    htmlInput.setAttribute('data-untyped-default-value', String(this.value_));
    htmlInput.setAttribute('data-old-value', '');
    if (Blockly.utils.userAgent.GECKO) {
      // In FF, ensure the browser reflows before resizing to avoid issue #2777.
      setTimeout(this.resizeEditor_.bind(this), 0);
    } else {
      this.resizeEditor_();
    }

    this.bindInputEvents_(htmlInput);

    if (FieldMultilineInput.showHint) {
      this.hintElement = this.createHint(hintHeightPx);
      this.hintElement.style.fontFamily = constants.FIELD_TEXT_FONTFAMILY;
      div.appendChild(this.hintElement);
    }

    return htmlInput;
  }

  /**
   * Creates the keyboard hint bar shown at the bottom of the editor.
   *
   * Keys are rendered as keycaps (bordered boxes).
   *
   * @param heightPx The height of the hint bar in pixels.
   * @returns The hint bar element.
   */
  private createHint(heightPx: number): HTMLDivElement {
    const shiftKey = '⇧';
    const enterKey = '⏎';
    const hint = document.createElement('div');
    hint.className = 'blocklyMultilineHint';
    hint.setAttribute('aria-hidden', 'true');
    hint.style.height = heightPx + 'px';

    // Plain Enter
    const enterGroup = document.createElement('div');
    enterGroup.className = 'blocklyMultilineHintGroup';
    enterGroup.appendChild(this.createHintKeycap(enterKey));
    enterGroup.appendChild(this.createHintColon());
    enterGroup.appendChild(
      this.createHintLabel(
        FieldMultilineInput.enterCommits ? 'commit' : 'newline',
      ),
    );
    hint.appendChild(enterGroup);

    // Modifier+Enter
    const modEnterGroup = document.createElement('div');
    modEnterGroup.className = 'blocklyMultilineHintGroup';
    modEnterGroup.appendChild(this.createHintKeycap(shiftKey));
    modEnterGroup.appendChild(this.createHintKeycap(enterKey));
    modEnterGroup.appendChild(this.createHintColon());
    modEnterGroup.appendChild(
      this.createHintLabel(
        FieldMultilineInput.enterCommits ? 'newline' : 'commit',
      ),
    );
    hint.appendChild(modEnterGroup);

    return hint;
  }

  /**
   * Creates a colon separator element used between keycaps and the action icon.
   *
   * @returns The colon element.
   */
  private createHintColon(): HTMLSpanElement {
    const colon = document.createElement('span');
    colon.className = 'blocklyMultilineHintColon';
    colon.textContent = ':';
    return colon;
  }

  /**
   * Creates a keycap element displaying a single key label.
   *
   * @param label The key symbol to display.
   * @returns The keycap element.
   */
  private createHintKeycap(label: string): HTMLSpanElement {
    const key = document.createElement('span');
    key.className = 'blocklyMultilineHintKey';
    key.textContent = label;
    return key;
  }

  /**
   * Creates a text label describing the result of a key action.
   *
   * Uses Blockly.Msg for i18n with hardcoded English fallbacks.
   *
   * @param type Either 'commit' or 'newline'.
   * @returns The label element.
   */
  private createHintLabel(type: 'commit' | 'newline'): HTMLSpanElement {
    const label = document.createElement('span');
    label.className = 'blocklyMultilineHintLabel';
    label.textContent =
      type === 'commit'
        ? Blockly.Msg['FIELD_MULTILINEINPUT_FINISH_EDITING'] || 'Finish editing'
        : Blockly.Msg['FIELD_MULTILINEINPUT_NEW_LINE'] || 'New line';
    return label;
  }

  /**
   * Sets the maxLines config for this field.
   *
   * @param maxLines Defines the maximum number of lines allowed, before
   *     scrolling functionality is enabled.
   */
  setMaxLines(maxLines: number) {
    if (
      typeof maxLines === 'number' &&
      maxLines > 0 &&
      maxLines !== this.maxLines_
    ) {
      this.maxLines_ = maxLines;
      this.forceRerender();
    }
  }

  /**
   * Returns the maxLines config of this field.
   *
   * @returns The maxLines config value.
   */
  getMaxLines(): number {
    return this.maxLines_;
  }

  /**
   * Handle key down to the editor.
   *
   * Enter commits the value and closes the editor (matching FieldTextInput).
   * Shift+Enter inserts a newline at the cursor.
   * All other keys are handled by the parent class (Escape reverts, Tab navigates).
   *
   * @param e Keyboard event.
   */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  protected override onHtmlInputKeyDown_(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      if (e.isComposing) {
        // Let the IME (input method editor) finalize its composition naturally;
        // don't commit or insert a newline ourselves.
        return;
      }
      const shiftPressed = e.shiftKey;
      const shouldCommit = FieldMultilineInput.enterCommits
        ? !shiftPressed
        : shiftPressed;
      if (shouldCommit) {
        super.onHtmlInputKeyDown_(e);
      } else {
        this.insertNewline();
        e.preventDefault();
        e.stopPropagation();
      }
    } else {
      super.onHtmlInputKeyDown_(e);
    }
  }

  /**
   * Inserts a newline character at the current cursor position in the textarea.
   *
   * The browser's default Enter-key behavior inserts a newline, but
   * Shift+Enter has no default character-insertion action, so we handle it
   * manually here.  After splicing the character we dispatch an `input` event
   * to trigger Blockly's onHtmlInputChange handler (programmatic `.value`
   * assignment doesn't fire `input` on its own).
   */
  private insertNewline() {
    const htmlInput = this.htmlInput_;
    if (!htmlInput) return;
    const start = htmlInput.selectionStart ?? htmlInput.value.length;
    const end = htmlInput.selectionEnd ?? start;
    htmlInput.value =
      htmlInput.value.substring(0, start) +
      '\n' +
      htmlInput.value.substring(end);
    htmlInput.selectionStart = htmlInput.selectionEnd = start + 1;
    htmlInput.dispatchEvent(new Event('input'));
  }

  /**
   * Construct a FieldMultilineInput from a JSON arg object,
   * dereferencing any string table references.
   *
   * @param options A JSON object with options (text, and spellcheck).
   * @returns The new field instance.
   * @nocollapse
   */
  static override fromJson(
    options: FieldMultilineInputFromJsonConfig,
  ): FieldMultilineInput {
    const text = Blockly.utils.parsing.replaceMessageReferences(options.text);
    // `this` might be a subclass of FieldMultilineInput if that class doesn't
    // override the static fromJson method.
    return new this(text, undefined, options);
  }
}

/**
 * Register the field and any dependencies.
 */
export function registerFieldMultilineInput() {
  Blockly.fieldRegistry.register('field_multilinetext', FieldMultilineInput);
}

/**
 * CSS for multiline field.
 */
Blockly.Css.register(`
.blocklyHtmlTextAreaInput {
  font-family: monospace;
  resize: none;
  overflow: hidden;
  height: 100%;
  text-align: left;
}

.blocklyHtmlTextAreaInputOverflowedY {
  overflow-y: scroll;
}

.blocklyMultilineHint {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 0 4px;
  box-sizing: border-box;
  font-size: 0.85em;
  color: rgba(0, 0, 0, 0.6);
  background-color: white;
  border-top: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 0 0 4px 4px;
  user-select: none;
  pointer-events: none;
}

.blocklyMultilineHintGroup {
  display: inline-flex;
  align-items: center;
}

.blocklyMultilineHintKey {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.3em;
  height: 1.3em;
  padding: 0 0.25em;
  margin: 0 0.1em;
  border: 1px solid rgba(0, 0, 0, 0.35);
  border-radius: 3px;
  background-color: #f5f5f5;
  line-height: 1;
  box-sizing: border-box;
}

.blocklyMultilineHintColon {
  margin: 0 0.15em;
}

.blocklyMultilineHintLabel {
  white-space: nowrap;
}
`);

/**
 * Config options for the multiline input field.
 */
export interface FieldMultilineInputConfig
  extends Blockly.FieldTextInputConfig {
  maxLines?: number;
}

/**
 * fromJson config options for the multiline input field.
 */
export interface FieldMultilineInputFromJsonConfig extends FieldMultilineInputConfig {
  text?: string;
}

/**
 * A function that is called to validate changes to the field's value before
 * they are set.
 *
 * @see {@link https://developers.google.com/blockly/guides/create-custom-blocks/fields/validators#return_values}
 * @param newValue The value to be validated.
 * @returns One of three instructions for setting the new value: `T`, `null`,
 * or `undefined`.
 *
 * - `T` to set this function's returned value instead of `newValue`.
 *
 * - `null` to invoke `doValueInvalid_` and not set a value.
 *
 * - `undefined` to set `newValue` as is.
 */
export type FieldMultilineInputValidator = Blockly.FieldTextInputValidator;
