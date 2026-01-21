/**
 * @license
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Text input field.
 *
 * @class
 */
// Former goog.module ID: Blockly.FieldInput

// Unused import preserved for side-effects. Remove if unneeded.
import './events/events_block_change.js';

import {BlockSvg} from './block_svg.js';
import * as browserEvents from './browser_events.js';
import * as bumpObjects from './bump_objects.js';
import * as dialog from './dialog.js';
import * as dropDownDiv from './dropdowndiv.js';
import {EventType} from './events/type.js';
import * as eventUtils from './events/utils.js';
import {
  Field,
  FieldConfig,
  FieldValidator,
  UnattachedFieldError,
} from './field.js';
import {getFocusManager} from './focus_manager.js';
import type {IFocusableNode} from './interfaces/i_focusable_node.js';
import {Msg} from './msg.js';
import * as renderManagement from './render_management.js';
import * as aria from './utils/aria.js';
import * as dom from './utils/dom.js';
import {Size} from './utils/size.js';
import * as userAgent from './utils/useragent.js';
import * as WidgetDiv from './widgetdiv.js';
import type {WorkspaceSvg} from './workspace_svg.js';

/**
 * Supported types for FieldInput subclasses.
 *
 * @internal
 */
type InputTypes = string | number;

/**
 * The minimum width of an input field.
 */
const MINIMUM_WIDTH = 14;

/**
 * Abstract class for an editable input field.
 *
 * @typeParam T - The value stored on the field.
 * @internal
 */
export abstract class FieldInput<T extends InputTypes> extends Field<
  string | T
> {
  /**
   * Pixel size of input border radius.
   * Should match blocklyText's border-radius in CSS.
   */
  static BORDERRADIUS = 4;

  /** Allow browser to spellcheck this field. */
  protected spellcheck_ = true;

  /** The HTML input element. */
  protected htmlInput_: HTMLInputElement | null = null;

  /** True if the field's value is currently being edited via the UI. */
  protected isBeingEdited_ = false;

  /**
   * True if the value currently displayed in the field's editory UI is valid.
   */
  protected isTextValid_ = false;

  /**
   * The intial value of the field when the user opened an editor to change its
   * value. When the editor is disposed, an event will be fired that uses this
   * as the event's oldValue.
   */
  protected valueWhenEditorWasOpened_: string | T | null = null;

  /** Key down event data. */
  private onKeyDownWrapper: browserEvents.Data | null = null;

  /** Input element input event data. */
  private onInputWrapper: browserEvents.Data | null = null;

  /**
   * Whether the field should consider the whole parent block to be its click
   * target.
   */
  fullBlockClickTarget_: boolean = false;

  /** The workspace that this field belongs to. */
  protected workspace_: WorkspaceSvg | null = null;

  /**
   * Serializable fields are saved by the serializer, non-serializable fields
   * are not. Editable fields should also be serializable.
   */
  override SERIALIZABLE = true;

  protected override set size_(newValue: Size) {
    // Although this appears to be a no-op, it must exist since the getter is
    // overridden below.
    super.size_ = newValue;
  }

  /**
   * Returns the size of this field, with a minimum width of 14.
   */
  protected override get size_() {
    const s = super.size_;
    if (s.width < MINIMUM_WIDTH) {
      s.width = MINIMUM_WIDTH;
    }

    return s;
  }

  /**
   * @param value The initial value of the field. Should cast to a string.
   *     Defaults to an empty string if null or undefined. Also accepts
   *     Field.SKIP_SETUP if you wish to skip setup (only used by subclasses
   *     that want to handle configuration and setting the field value after
   *     their own constructors have run).
   * @param validator A function that is called to validate changes to the
   *     field's value. Takes in a string & returns a validated string, or null
   *     to abort the change.
   * @param config A map of options used to configure the field.
   *     See the [field creation documentation]{@link
   * https://developers.google.com/blockly/guides/create-custom-blocks/fields/built-in-fields/text-input#creation}
   * for a list of properties this parameter supports.
   */
  constructor(
    value?: string | typeof Field.SKIP_SETUP,
    validator?: FieldInputValidator<T> | null,
    config?: FieldInputConfig,
  ) {
    super(Field.SKIP_SETUP);

    if (value === Field.SKIP_SETUP) return;
    if (config) {
      this.configure_(config);
    }
    this.setValue(value);
    if (validator) {
      this.setValidator(validator);
    }
  }

  protected override configure_(config: FieldInputConfig) {
    super.configure_(config);
    if (config.spellcheck !== undefined) {
      this.spellcheck_ = config.spellcheck;
    }
  }

  override initView() {
    const block = this.getSourceBlock();
    if (!block) throw new UnattachedFieldError();
    super.initView();

    if (this.isFullBlockField()) {
      this.clickTarget_ = (this.sourceBlock_ as BlockSvg).getSvgRoot();
    }

    if (this.fieldGroup_) {
      dom.addClass(this.fieldGroup_, 'blocklyInputField');
    }
  }

  override isFullBlockField(): boolean {
    const block = this.getSourceBlock();
    if (!block) throw new UnattachedFieldError();

    // Side effect for backwards compatibility.
    this.fullBlockClickTarget_ =
      !!this.getConstants()?.FULL_BLOCK_FIELDS && block.isSimpleReporter();
    return this.fullBlockClickTarget_;
  }

  /**
   * Called by setValue if the text input is not valid. If the field is
   * currently being edited it reverts value of the field to the previous
   * value while allowing the display text to be handled by the htmlInput_.
   *
   * @param _invalidValue The input value that was determined to be invalid.
   *     This is not used by the text input because its display value is stored
   *     on the htmlInput_.
   * @param fireChangeEvent Whether to fire a change event if the value changes.
   */
  protected override doValueInvalid_(
    _invalidValue: AnyDuringMigration,
    fireChangeEvent: boolean = true,
  ) {
    if (this.isBeingEdited_) {
      this.isDirty_ = true;
      this.isTextValid_ = false;
      const oldValue = this.value_;
      // Revert value when the text becomes invalid.
      this.value_ = this.valueWhenEditorWasOpened_;
      if (
        this.sourceBlock_ &&
        eventUtils.isEnabled() &&
        this.value_ !== oldValue &&
        fireChangeEvent
      ) {
        eventUtils.fire(
          new (eventUtils.get(EventType.BLOCK_CHANGE))(
            this.sourceBlock_,
            'field',
            this.name || null,
            oldValue,
            this.value_,
          ),
        );
      }
    }
  }

  /**
   * Called by setValue if the text input is valid. Updates the value of the
   * field, and updates the text of the field if it is not currently being
   * edited (i.e. handled by the htmlInput_).
   *
   * @param newValue The value to be saved. The default validator guarantees
   *     that this is a string.
   */
  protected override doValueUpdate_(newValue: string | T) {
    this.isDirty_ = true;
    this.isTextValid_ = true;
    this.value_ = newValue;
  }

  /**
   * Updates text field to match the colour/style of the block.
   */
  override applyColour() {
    const block = this.getSourceBlock() as BlockSvg | null;
    if (!block) throw new UnattachedFieldError();

    if (!this.getConstants()!.FULL_BLOCK_FIELDS) return;
    if (!this.fieldGroup_) return;

    if (!this.isFullBlockField() && this.borderRect_) {
      this.borderRect_!.style.display = 'block';
      this.borderRect_.setAttribute('stroke', block.getColourTertiary());
    } else {
      this.borderRect_!.style.display = 'none';
      // In general, do *not* let fields control the color of blocks. Having the
      // field control the color is unexpected, and could have performance
      // impacts.
      block.pathObject.svgPath.setAttribute(
        'fill',
        this.getConstants()!.FIELD_BORDER_RECT_COLOUR,
      );
    }
  }

  /**
   * Returns the height and width of the field.
   *
   * This should *in general* be the only place render_ gets called from.
   *
   * @returns Height and width.
   */
  override getSize(): Size {
    if (this.getConstants()?.FULL_BLOCK_FIELDS) {
      // In general, do *not* let fields control the color of blocks. Having the
      // field control the color is unexpected, and could have performance
      // impacts.
      // Full block fields have more control of the block than they should
      // (i.e. updating fill colour). Whenever we get the size, the field may
      // no longer be a full-block field, so we need to rerender.
      this.render_();
      this.isDirty_ = false;
    }
    return super.getSize();
  }

  /**
   * Notifies the field that it has changed locations. Moves the widget div to
   * be in the correct place if it is open.
   */
  onLocationChange(): void {
    if (this.isBeingEdited_) this.resizeEditor_();
  }

  /**
   * Updates the colour of the htmlInput given the current validity of the
   * field's value.
   *
   * Also updates the colour of the block to reflect whether this is a full
   * block field or not.
   */
  protected override render_() {
    super.render_();
    // This logic is done in render_ rather than doValueInvalid_ or
    // doValueUpdate_ so that the code is more centralized.
    if (this.isBeingEdited_) {
      const htmlInput = this.htmlInput_ as HTMLElement;
      if (!this.isTextValid_) {
        dom.addClass(htmlInput, 'blocklyInvalidInput');
        aria.setState(htmlInput, aria.State.INVALID, true);
      } else {
        dom.removeClass(htmlInput, 'blocklyInvalidInput');
        aria.setState(htmlInput, aria.State.INVALID, false);
      }
    }

    const block = this.getSourceBlock() as BlockSvg | null;
    if (!block) throw new UnattachedFieldError();
    // In general, do *not* let fields control the color of blocks. Having the
    // field control the color is unexpected, and could have performance
    // impacts.
    // Whenever we render, the field may no longer be a full-block-field so
    // we need to update the colour.
    if (this.getConstants()!.FULL_BLOCK_FIELDS) block.applyColour();
  }

  /**
   * Set whether this field is spellchecked by the browser.
   *
   * @param check True if checked.
   */
  setSpellcheck(check: boolean) {
    if (check === this.spellcheck_) {
      return;
    }
    this.spellcheck_ = check;
    if (this.htmlInput_) {
      // AnyDuringMigration because:  Argument of type 'boolean' is not
      // assignable to parameter of type 'string'.
      this.htmlInput_.setAttribute(
        'spellcheck',
        this.spellcheck_ as AnyDuringMigration,
      );
    }
  }

  /**
   * Show an editor for the field.
   * Shows the inline free-text editor on top of the text by default.
   * Shows a prompt editor for mobile browsers if the modalInputs option is
   * enabled.
   *
   * @param _e Optional mouse event that triggered the field to open, or
   *     undefined if triggered programmatically.
   * @param quietInput True if editor should be created without focus.
   *     Defaults to false.
   * @param manageEphemeralFocus Whether ephemeral focus should be managed as
   *     part of the editor's inline editor (when the inline editor is shown).
   *     Callers must manage ephemeral focus themselves if this is false.
   *     Defaults to true.
   */
  protected override showEditor_(
    _e?: Event,
    quietInput = false,
    manageEphemeralFocus: boolean = true,
  ) {
    this.workspace_ = (this.sourceBlock_ as BlockSvg).workspace;
    if (
      !quietInput &&
      this.workspace_.options.modalInputs &&
      (userAgent.MOBILE || userAgent.ANDROID || userAgent.IPAD)
    ) {
      this.showPromptEditor();
    } else {
      this.showInlineEditor(quietInput, manageEphemeralFocus);
    }
  }

  /**
   * Create and show a text input editor that is a prompt (usually a popup).
   * Mobile browsers may have issues with in-line textareas (focus and
   * keyboards).
   */
  private showPromptEditor() {
    dialog.prompt(
      Msg['CHANGE_VALUE_TITLE'],
      this.getText(),
      (text: string | null) => {
        // Text is null if user pressed cancel button.
        if (text !== null) {
          this.setValue(this.getValueFromEditorText_(text));
        }
        this.onFinishEditing_(this.value_);
      },
    );
  }

  /**
   * Create and show a text input editor that sits directly over the text input.
   *
   * @param quietInput True if editor should be created without focus.
   * @param manageEphemeralFocus Whether ephemeral focus should be managed as
   *     part of the field's inline editor (widget div).
   */
  private showInlineEditor(quietInput: boolean, manageEphemeralFocus: boolean) {
    const block = this.getSourceBlock();
    if (!block) {
      throw new UnattachedFieldError();
    }
    WidgetDiv.show(
      this,
      block.RTL,
      this.widgetDispose_.bind(this),
      this.workspace_,
      manageEphemeralFocus,
    );
    this.htmlInput_ = this.widgetCreate_() as HTMLInputElement;
    this.isBeingEdited_ = true;
    this.valueWhenEditorWasOpened_ = this.value_;

    if (!quietInput) {
      (this.htmlInput_ as HTMLElement).focus({
        preventScroll: true,
      });
      this.htmlInput_.select();
    }
  }

  /**
   * Create the text input editor widget.
   *
   * @returns The newly created text input editor.
   */
  protected widgetCreate_(): HTMLInputElement | HTMLTextAreaElement {
    const block = this.getSourceBlock();
    if (!block) {
      throw new UnattachedFieldError();
    }
    eventUtils.setGroup(true);
    const div = WidgetDiv.getDiv();

    const clickTarget = this.getClickTarget_();
    if (!clickTarget) throw new Error('A click target has not been set.');
    dom.addClass(clickTarget, 'blocklyEditing');

    const htmlInput = document.createElement('input');
    htmlInput.className = 'blocklyHtmlInput';
    // AnyDuringMigration because:  Argument of type 'boolean' is not assignable
    // to parameter of type 'string'.
    htmlInput.setAttribute(
      'spellcheck',
      this.spellcheck_ as AnyDuringMigration,
    );
    const scale = this.workspace_!.getAbsoluteScale();
    const fontSize = this.getConstants()!.FIELD_TEXT_FONTSIZE * scale + 'pt';
    div!.style.fontSize = fontSize;
    htmlInput.style.fontSize = fontSize;
    let borderRadius = FieldInput.BORDERRADIUS * scale + 'px';

    if (this.isFullBlockField()) {
      const bBox = this.getScaledBBox();

      // Override border radius.
      borderRadius = (bBox.bottom - bBox.top) / 2 + 'px';
      // Pull stroke colour from the existing shadow block
      const strokeColour = block.getParent()
        ? (block.getParent() as BlockSvg).getColourTertiary()
        : (this.sourceBlock_ as BlockSvg).getColourTertiary();
      htmlInput.style.border = 1 * scale + 'px solid ' + strokeColour;
      div!.style.borderRadius = borderRadius;
      div!.style.transition = 'box-shadow 0.25s ease 0s';
      if (this.getConstants()!.FIELD_TEXTINPUT_BOX_SHADOW) {
        div!.style.boxShadow =
          'rgba(255, 255, 255, 0.3) 0 0 0 ' + 4 * scale + 'px';
      }
    }
    htmlInput.style.borderRadius = borderRadius;

    div!.appendChild(htmlInput);

    htmlInput.value = htmlInput.defaultValue = this.getEditorText_(this.value_);
    htmlInput.setAttribute('data-untyped-default-value', String(this.value_));

    this.resizeEditor_();

    this.bindInputEvents_(htmlInput);

    return htmlInput;
  }

  /**
   * Closes the editor, saves the results, and disposes of any events or
   * DOM-references belonging to the editor.
   */
  protected widgetDispose_() {
    // Non-disposal related things that we do when the editor closes.
    this.isBeingEdited_ = false;
    this.isTextValid_ = true;
    // Make sure the field's node matches the field's internal value.
    this.forceRerender();
    this.onFinishEditing_(this.value_);

    if (
      this.sourceBlock_ &&
      eventUtils.isEnabled() &&
      this.valueWhenEditorWasOpened_ !== null &&
      this.valueWhenEditorWasOpened_ !== this.value_
    ) {
      // When closing a field input widget, fire an event indicating that the
      // user has completed a sequence of changes. The value may have changed
      // multiple times while the editor was open, but this will fire an event
      // containing the value when the editor was opened as well as the new one.
      eventUtils.fire(
        new (eventUtils.get(EventType.BLOCK_CHANGE))(
          this.sourceBlock_,
          'field',
          this.name || null,
          this.valueWhenEditorWasOpened_,
          this.value_,
        ),
      );
      this.valueWhenEditorWasOpened_ = null;
    }

    eventUtils.setGroup(false);

    // Actual disposal.
    this.unbindInputEvents_();
    const style = WidgetDiv.getDiv()!.style;
    style.width = 'auto';
    style.height = 'auto';
    style.fontSize = '';
    style.transition = '';
    style.boxShadow = '';
    this.htmlInput_ = null;

    const clickTarget = this.getClickTarget_();
    if (!clickTarget) throw new Error('A click target has not been set.');
    dom.removeClass(clickTarget, 'blocklyEditing');
  }

  /**
   * A callback triggered when the user is done editing the field via the UI.
   *
   * @param _value The new value of the field.
   */
  onFinishEditing_(_value: AnyDuringMigration) {}

  /**
   * Bind handlers for user input on the text input field's editor.
   *
   * @param htmlInput The htmlInput to which event handlers will be bound.
   */
  protected bindInputEvents_(htmlInput: HTMLElement) {
    // Trap Enter without IME and Esc to hide.
    this.onKeyDownWrapper = browserEvents.conditionalBind(
      htmlInput,
      'keydown',
      this,
      this.onHtmlInputKeyDown_,
    );
    // Resize after every input change.
    this.onInputWrapper = browserEvents.conditionalBind(
      htmlInput,
      'input',
      this,
      this.onHtmlInputChange,
    );
  }

  /** Unbind handlers for user input and workspace size changes. */
  protected unbindInputEvents_() {
    if (this.onKeyDownWrapper) {
      browserEvents.unbind(this.onKeyDownWrapper);
      this.onKeyDownWrapper = null;
    }
    if (this.onInputWrapper) {
      browserEvents.unbind(this.onInputWrapper);
      this.onInputWrapper = null;
    }
  }

  /**
   * Handle key down to the editor.
   *
   * @param e Keyboard event.
   */
  protected onHtmlInputKeyDown_(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      WidgetDiv.hideIfOwner(this);
      dropDownDiv.hideWithoutAnimation();
    } else if (e.key === 'Escape') {
      this.setValue(
        this.htmlInput_!.getAttribute('data-untyped-default-value'),
        false,
      );
      WidgetDiv.hideIfOwner(this);
      dropDownDiv.hideWithoutAnimation();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const cursor = this.workspace_?.getCursor();

      const isValidDestination = (node: IFocusableNode | null) =>
        (node instanceof FieldInput ||
          (node instanceof BlockSvg && node.isSimpleReporter())) &&
        node !== this.getSourceBlock();

      let target = e.shiftKey
        ? cursor?.getPreviousNode(this, isValidDestination, false)
        : cursor?.getNextNode(this, isValidDestination, false);
      target =
        target instanceof BlockSvg && target.isSimpleReporter()
          ? target.getFields().next().value
          : target;

      if (target instanceof FieldInput) {
        WidgetDiv.hideIfOwner(this);
        dropDownDiv.hideWithoutAnimation();
        const targetSourceBlock = target.getSourceBlock();
        if (
          target.isFullBlockField() &&
          targetSourceBlock &&
          targetSourceBlock instanceof BlockSvg
        ) {
          getFocusManager().focusNode(targetSourceBlock);
        } else getFocusManager().focusNode(target);
        target.showEditor();
      }
    }
  }

  /**
   * Handle a change to the editor.
   *
   * @param _e InputEvent.
   */
  private onHtmlInputChange(_e: Event) {
    // Intermediate value changes from user input are not confirmed until the
    // user closes the editor, and may be numerous. Inhibit reporting these as
    // normal block change events, and instead report them as special
    // intermediate changes that do not get recorded in undo history.
    const oldValue = this.value_;
    // Change the field's value without firing the normal change event.
    this.setValue(
      this.getValueFromEditorText_(this.htmlInput_!.value),
      /* fireChangeEvent= */ false,
    );
    if (
      this.sourceBlock_ &&
      eventUtils.isEnabled() &&
      this.value_ !== oldValue
    ) {
      // Fire a special event indicating that the value changed but the change
      // isn't complete yet and normal field change listeners can wait.
      eventUtils.fire(
        new (eventUtils.get(EventType.BLOCK_FIELD_INTERMEDIATE_CHANGE))(
          this.sourceBlock_,
          this.name || null,
          oldValue,
          this.value_,
        ),
      );
    }
  }

  /**
   * Set the HTML input value and the field's internal value. The difference
   * between this and `setValue` is that this also updates the HTML input
   * value whilst editing.
   *
   * @param newValue New value.
   * @param fireChangeEvent Whether to fire a change event. Defaults to true.
   *     Should usually be true unless the change will be reported some other
   *     way, e.g. an intermediate field change event.
   */
  protected setEditorValue_(
    newValue: AnyDuringMigration,
    fireChangeEvent = true,
  ) {
    this.isDirty_ = true;
    if (this.isBeingEdited_) {
      // In the case this method is passed an invalid value, we still
      // pass it through the transformation method `getEditorText` to deal
      // with. Otherwise, the internal field's state will be inconsistent
      // with what's shown to the user.
      this.htmlInput_!.value = this.getEditorText_(newValue);
    }
    this.setValue(newValue, fireChangeEvent);
  }

  /** Resize the editor to fit the text. */
  protected resizeEditor_() {
    renderManagement.finishQueuedRenders().then(() => {
      const block = this.getSourceBlock();
      if (!block) throw new UnattachedFieldError();
      const div = WidgetDiv.getDiv();
      const bBox = this.getScaledBBox();
      div!.style.width = bBox.right - bBox.left + 'px';
      div!.style.height = bBox.bottom - bBox.top + 'px';

      // In RTL mode block fields and LTR input fields the left edge moves,
      // whereas the right edge is fixed.  Reposition the editor.
      const x = block.RTL ? bBox.right - div!.offsetWidth : bBox.left;
      const y = bBox.top;

      div!.style.left = `${x}px`;
      div!.style.top = `${y}px`;
    });
  }

  /**
   * Handles repositioning the WidgetDiv used for input fields when the
   * workspace is resized. Will bump the block into the viewport and update the
   * position of the text input if necessary.
   *
   * @returns True for rendered workspaces, as we never want to hide the widget
   *     div.
   */
  override repositionForWindowResize(): boolean {
    const block = this.getSourceBlock()?.getRootBlock();
    // This shouldn't be possible. We should never have a WidgetDiv if not using
    // rendered blocks.
    if (!(block instanceof BlockSvg)) return false;

    const bumped = bumpObjects.bumpIntoBounds(
      this.workspace_!,
      this.workspace_!.getMetricsManager().getViewMetrics(true),
      block,
    );

    if (!bumped) this.resizeEditor_();

    return true;
  }

  /**
   * Position a field's text element after a size change.  This handles both LTR
   * and RTL positioning.
   *
   * @param xMargin x offset to use when positioning the text element.
   * @param contentWidth The content width.
   */
  protected override positionTextElement_(
    xMargin: number,
    contentWidth: number,
  ) {
    const effectiveWidth = xMargin * 2 + contentWidth;
    const delta =
      effectiveWidth < MINIMUM_WIDTH ? (MINIMUM_WIDTH - effectiveWidth) / 2 : 0;
    super.positionTextElement_(xMargin + delta, contentWidth);
  }

  /**
   * Use the `getText_` developer hook to override the field's text
   * representation. When we're currently editing, return the current HTML value
   * instead. Otherwise, return null which tells the field to use the default
   * behaviour (which is a string cast of the field's value).
   *
   * @returns The HTML value if we're editing, otherwise null.
   */
  protected override getText_(): string | null {
    if (this.isBeingEdited_ && this.htmlInput_) {
      // We are currently editing, return the HTML input value instead.
      return this.htmlInput_.value;
    }
    return null;
  }

  /**
   * Transform the provided value into a text to show in the HTML input.
   * Override this method if the field's HTML input representation is different
   * than the field's value. This should be coupled with an override of
   * `getValueFromEditorText_`.
   *
   * @param value The value stored in this field.
   * @returns The text to show on the HTML input.
   */
  protected getEditorText_(value: AnyDuringMigration): string {
    return `${value}`;
  }

  /**
   * Transform the text received from the HTML input into a value to store
   * in this field.
   * Override this method if the field's HTML input representation is different
   * than the field's value. This should be coupled with an override of
   * `getEditorText_`.
   *
   * @param text Text received from the HTML input.
   * @returns The value to store.
   */
  protected getValueFromEditorText_(text: string): AnyDuringMigration {
    return text;
  }
}

/**
 * Config options for the input field.
 *
 * @internal
 */
export interface FieldInputConfig extends FieldConfig {
  spellcheck?: boolean;
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
 * @internal
 */
export type FieldInputValidator<T extends InputTypes> = FieldValidator<
  string | T
>;
