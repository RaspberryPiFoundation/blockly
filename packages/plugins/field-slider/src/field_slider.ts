/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Number slider input field.
 * @author kozbial@google.com (Monica Kozbial)
 */

import * as Blockly from 'blockly/core';

/**
 * A config object for defining a field slider.
 */
export type FieldSliderConfig = Blockly.FieldNumberConfig;

/**
 * Options used to define a field slider from JSON.
 */
export interface FieldSliderOptions extends FieldSliderConfig {
  value?: string | number;
}

export type FieldSliderValidator = Blockly.FieldNumberValidator;

/**
 * Slider field.
 */
export class FieldSlider extends Blockly.FieldNumber {
  /**
   * Array holding info needed to unbind events.
   * Used for disposing.
   * Ex: [[node, name, func], [node, name, func]].
   */
  private boundEvents: Blockly.browserEvents.Data[] = [];

  /**
   * The HTML range input element.
   */
  private sliderInput: HTMLInputElement | null = null;

  /**
   * Class for an number slider field.
   *
   * @param value The initial value of the field. Should
   *    cast to a number. Defaults to 0.
   * @param min Minimum value.
   * @param max Maximum value.
   * @param precision Precision for value.
   * @param validator A function that is called to validate
   *    changes to the field's value. Takes in a number & returns a validated
   *    number, or null to abort the change.
   * @param config A map of options used to configure the field.
   *    See the [field creation documentation]{@link
   * https://developers.google.com/blockly/guides/create-custom-blocks/fields/built-in-fields/number#creation}
   *    for a list of properties this parameter supports.
   */
  constructor(
    value?: string | number,
    min?: string | number,
    max?: string | number,
    precision?: string | number,
    validator?: FieldSliderValidator,
    config?: FieldSliderConfig,
  ) {
    super(value, min, max, precision, validator, config);
  }

  /**
   * Constructs a FieldSlider from a JSON arg object.
   *
   * @param options A JSON object with options
   *     (value, min, max, precision).
   * @returns The new field instance.
   * @package
   * @nocollapse
   */
  static fromJson(options: FieldSliderOptions): FieldSlider {
    // `this` might be a subclass of FieldSlider if that class doesn't override
    // the static fromJson method.
    return new this(
      options.value,
      undefined,
      undefined,
      undefined,
      undefined,
      options,
    );
  }

  /* eslint-disable @typescript-eslint/naming-convention */
  /**
   * Show the inline free-text editor on top of the text along with the slider
   * editor.
   *
   * @param e Optional mouse event that triggered the field to
   *     open, or undefined if triggered programmatically.
   * @param quietInput Quiet input (prevent focusing on the editor).
   */
  protected showEditor_(e?: Event, quietInput?: boolean) {
    // Always quiet the input for the super constructor, as we don't want to
    // focus on the text field, and we don't want to display the modal
    // editor on mobile devices. Also, don't let the parent take ephemeral focus
    // since the drop-down div below will handle it, instead.
    super.showEditor_(e, true, false);

    // Build the DOM.
    const editor = this.dropdownCreate_();

    Blockly.DropDownDiv.getContentDiv().appendChild(editor);
    const sourceBlock = this.getSourceBlock();
    if (sourceBlock instanceof Blockly.BlockSvg) {
      const primary = sourceBlock.getColour() || '';
      const tertiary = sourceBlock.getColourTertiary() || '';
      Blockly.DropDownDiv.setColour(primary, tertiary);
    }

    Blockly.DropDownDiv.showPositionedByField(
      this,
      this.dropdownDispose_.bind(this),
    );

    // Focus on the slider field, unless quietInput is passed.
    if (!quietInput) {
      // Wait for the dropdown to animate in before attempting to focus the
      // slider.
      setTimeout(() => {
        this.sliderInput?.focus({
          preventScroll: true,
        });
      }, 250);
    }
  }

  /**
   * Updates the slider when the field rerenders.
   */
  protected render_() {
    super.render_();
    this.updateSlider_();
  }

  /**
   * Creates the slider editor and add event listeners.
   *
   * @returns The newly created slider.
   */
  private dropdownCreate_(): HTMLElement {
    const wrapper = document.createElement('div') as HTMLElement;
    wrapper.className = 'fieldSliderContainer';
    const sliderInput = document.createElement('input');
    sliderInput.setAttribute('type', 'range');
    sliderInput.setAttribute('min', `${this.min_}`);
    sliderInput.setAttribute('max', `${this.max_}`);
    sliderInput.setAttribute('step', `${this.precision_}`);
    sliderInput.setAttribute('value', `${this.getValue()}`);
    sliderInput.setAttribute('tabindex', '0');
    sliderInput.setAttribute('data-untyped-default-value', String(this.value_));
    sliderInput.className = 'fieldSlider';
    sliderInput.addEventListener('keydown', (e) => {
      let handled = false;
      if (e.key === 'Enter') {
        handled = true;
      } else if (e.key === 'Escape') {
        this.isBeingEdited_ = false;
        this.setValue(
          sliderInput.getAttribute('data-untyped-default-value'),
          false,
        );
        handled = true;
      }

      if (handled) {
        Blockly.WidgetDiv.hideIfOwner(this);
        Blockly.DropDownDiv.hideIfOwner(this);
        e.stopPropagation();
      }
    });
    wrapper.appendChild(sliderInput);
    this.sliderInput = sliderInput;

    this.boundEvents.push(
      Blockly.browserEvents.conditionalBind(
        sliderInput,
        'input',
        this,
        this.onSliderChange_,
      ),
    );

    return wrapper;
  }

  /**
   * Disposes of events belonging to the slider editor.
   */
  private dropdownDispose_() {
    for (const event of this.boundEvents) {
      Blockly.browserEvents.unbind(event);
    }
    this.boundEvents.length = 0;
    this.sliderInput = null;
  }

  /**
   * Sets the text to match the slider's position.
   */
  private onSliderChange_() {
    // Intermediate value changes from user input are not confirmed until the
    // user closes the editor, and may be numerous. Inhibit reporting these as
    // normal block change events, and instead report them as special
    // intermediate changes that do not get recorded in undo history.
    const oldValue = this.value_;
    this.setEditorValue_(this.sliderInput?.value, false);
    if (this.getSourceBlock()) {
      Blockly.Events.fire(
        new (Blockly.Events.get(
          Blockly.Events.BLOCK_FIELD_INTERMEDIATE_CHANGE,
        ))(this.sourceBlock_, this.name || null, oldValue, this.value_),
      );
    }
    this.resizeEditor_();
  }

  /**
   * Updates the slider when the field rerenders.
   */
  private updateSlider_() {
    if (!this.sliderInput) {
      return;
    }
    this.sliderInput.setAttribute('value', `${this.getValue()}`);
  }
  /* eslint-enable @typescript-eslint/naming-convention */
}

Blockly.fieldRegistry.register('field_slider', FieldSlider);

/**
 * CSS for slider field.
 */
Blockly.Css.register(`
.fieldSliderContainer {
  align-items: center;
  display: flex;
  height: 32px;
  justify-content: center;
  width: 150px;
}
.fieldSlider {
  -webkit-appearance: none;
  background: transparent; /* override white in chrome */
  margin: 4px;
  padding: 0;
  width: 100%;
}
.fieldSlider:focus {
  outline: none;
}
/* Webkit */
.fieldSlider::-webkit-slider-runnable-track {
  background: #ddd;
  border-radius: 5px;
  height: 10px;
}
.fieldSlider::-webkit-slider-thumb {
  -webkit-appearance: none;
  background: #fff;
  border-radius: 50%;
  box-shadow: 0 0 0 4px rgba(255,255,255,.15);
  cursor: pointer;
  height: 24px;
  margin-top: -7px;
  width: 24px;
}
/* Firefox */
.fieldSlider::-moz-range-track {
  background: #ddd;
  border-radius: 5px;
  height: 10px;
}
.fieldSlider::-moz-range-thumb {
  background: #fff;
  border: none;
  border-radius: 50%;
  box-shadow: 0 0 0 4px rgba(255,255,255,.15);
  cursor: pointer;
  height: 24px;
  width: 24px;
}
.fieldSlider::-moz-focus-outer {
  /* override the focus border style */
  border: 0;
}
/* IE */
.fieldSlider::-ms-track {
  /* IE wont let the thumb overflow the track, so fake it */
  background: transparent;
  border-color: transparent;
  border-width: 15px 0;
  /* remove default tick marks */
  color: transparent;
  height: 10px;
  width: 100%;
  margin: -4px 0;
}
.fieldSlider::-ms-fill-lower  {
  background: #ddd;
  border-radius: 5px;
}
.fieldSlider::-ms-fill-upper  {
  background: #ddd;
  border-radius: 5px;
}
.fieldSlider::-ms-thumb {
  background: #fff;
  border: none;
  border-radius: 50%;
  box-shadow: 0 0 0 4px rgba(255,255,255,.15);
  cursor: pointer;
  height: 24px;
  width: 24px;
}
`);
