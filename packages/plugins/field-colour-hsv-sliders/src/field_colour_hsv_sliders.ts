/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Colour input field with HSV sliders.
 */

import * as Blockly from 'blockly/core';
import {FieldColour} from '@blockly/field-colour';

// Experimental API: https://developer.mozilla.org/en-US/docs/Web/API/EyeDropper
declare interface EyeDropper {
  open: () => Promise<{sRGBHex: string}>;
}
declare global {
  interface Window {
    EyeDropper?: {new (): EyeDropper};
  }
}

/**
 * A structure with three properties r, g, and b, representing the amount of
 * red, green, and blue light in the sRGB colour space where 1 is the maximum
 * amount of light that can be displayed.
 */
class RgbColour {
  /** The red component of the colour, ranging from 0 to 1. */
  r: number;

  /** The green component of the colour, ranging from 0 to 1. */
  g: number;

  /** The blue component of the colour, ranging from 0 to 1. */
  b: number;

  /**
   * The RgbColour constructor.
   *
   * @param r The initial amount of red. Defaults to 0.
   * @param g The initial amount of green. Defaults to 0.
   * @param b The initial amount of blue. Defaults to 0.
   */
  constructor(r = 0, g = 0, b = 0) {
    this.r = r;
    this.g = g;
    this.b = b;
  }

  /**
   * Given a number from 0 to 1, returns a two-digit hexadecimal string from
   * '00' to 'ff'.
   *
   * @param x The amount of light in a component from 0 to 1.
   * @returns A hexadecimal representation from '00' to 'ff'.
   */
  static componentToHex(x: number): string {
    if (x <= 0) return '00';
    if (x >= 1) return 'ff';
    return ('0' + ((x * 255 + 0.5) >>> 0).toString(16)).slice(-2);
  }

  /**
   * Returns a hexadecimal string in the format #rrggbb representing the colour.
   *
   * @returns A hexadecimal representation of this colour.
   */
  toHex(): string {
    return (
      '#' +
      RgbColour.componentToHex(this.r) +
      RgbColour.componentToHex(this.g) +
      RgbColour.componentToHex(this.b)
    );
  }

  /**
   * Updates the properties of this instance to represent the same colour as the
   * provided string in the hexadecimal format #rrggbb.
   *
   * @param hex A hexadecimal string in the format '#rrggbb'.
   * @returns This instance after updating it.
   */
  loadFromHex(hex: string): RgbColour {
    this.r = parseInt(hex.slice(1, 3), 16) / 255;
    this.g = parseInt(hex.slice(3, 5), 16) / 255;
    this.b = parseInt(hex.slice(5, 7), 16) / 255;
    return this;
  }

  /**
   * Updates the properties of this instance to represent the same colour as the
   * provided HsvColour but in the sRGB colour space.
   *
   * @param hsv An HSV representation of a colour to copy.
   * @returns This instance after updating it.
   */
  loadFromHsv(hsv: HsvColour): RgbColour {
    const hue: number = (hsv.h - Math.floor(hsv.h)) * 6;
    this.r =
      hsv.v * (1 - hsv.s * Math.max(0, Math.min(1, 2 - Math.abs(hue - 3))));
    this.g =
      hsv.v * (1 - hsv.s * Math.max(0, Math.min(1, Math.abs(hue - 2) - 1)));
    this.b =
      hsv.v * (1 - hsv.s * Math.max(0, Math.min(1, Math.abs(hue - 4) - 1)));
    return this;
  }
}

/**
 * A structure with three properties h, s, and v, representing the hue,
 * saturation, and brightness in a colour. All three properties range from 0
 * to 1.
 */
class HsvColour {
  /** The hue of the colour, ranging from 0 to 1. */
  h: number;

  /** The saturation of the colour, ranging from 0 to 1. */
  s: number;

  /** The brightness of the colour, ranging from 0 to 1. */
  v: number;

  /**
   * The HsvColour constructor.
   *
   * @param h The initial hue of the colour. Defaults to 0.
   * @param s The initial amount of saturation. Defaults to 0.
   * @param v The initial amount of brightness. Defaults to 0.
   */
  constructor(h = 0, s = 0, v = 0) {
    this.h = h;
    this.s = s;
    this.v = v;
  }

  /**
   * Updates the properties of this instance to represent the same colour as the
   * provided RgbColour but in the HSV colour space.
   *
   * @param rgb An RGB representation of a colour to copy.
   * @returns This instance after updating it.
   */
  loadFromRgb(rgb: RgbColour): HsvColour {
    const max: number = Math.max(Math.max(rgb.r, rgb.g), rgb.b);
    const min: number = Math.min(Math.min(rgb.r, rgb.g), rgb.b);
    this.v = max;
    if (min === max) {
      this.h = 0;
      this.s = 0;
      return this;
    }

    const delta: number = max - min;
    this.s = delta / max;

    let hue: number;
    if (rgb.r === max) {
      hue = (rgb.g - rgb.b) / delta;
    } else if (rgb.g === max) {
      hue = 2 + (rgb.b - rgb.r) / delta;
    } else {
      hue = 4 + (rgb.r - rgb.g) / delta;
    }
    hue /= 6;
    this.h = hue - Math.floor(hue);
    return this;
  }

  /**
   * Updates the properties of this instance to copy the provided HsvColour.
   *
   * @param other An HSV representation of a colour to copy.
   * @returns This instance after updating it.
   */
  copy(other: HsvColour): HsvColour {
    this.h = other.h;
    this.s = other.s;
    this.v = other.v;
    return this;
  }
}

/**
 * Class for a colour input field that displays HSV slider widgets when clicked.
 */
export class FieldColourHsvSliders extends FieldColour {
  /** The maximum value of the hue slider range. */
  private static readonly HUE_SLIDER_MAX = 360;

  /** The maximum value of the saturation slider range. */
  private static readonly SATURATION_SLIDER_MAX = 100;

  /** The maximum value of the brightness slider range. */
  private static readonly BRIGHTNESS_SLIDER_MAX = 100;

  /**
   * The gradient control point positions should align with the center of the
   * slider thumb when the corresponding colour is selected. When the slider
   * is at the minimum or maximum value, the distance of center of the thumb
   * from the edge of the track will be the thumb's radius, so that's how far
   * the minimum and maximum control points should be.
   */
  static readonly THUMB_RADIUS = 12;

  /** Helper colour structures to allow manipulation in the HSV colour space. */
  private static readonly helperHsv: HsvColour = new HsvColour();

  /** Helper colour structures to support conversion to the RGB colour space. */
  private static readonly helperRgb: RgbColour = new RgbColour();

  /**
   * The intial value of the field when the user opened an editor to change its
   * value. When the editor is disposed, an event will be fired that uses this
   * as the event's oldValue.
   */
  protected valueWhenEditorWasOpened: string | null = null;

  /** Array holding info needed to unbind events. Used for disposing. */
  private hsvBoundEvents: Blockly.browserEvents.Data[] = [];

  /** HTML span element to display the current hue. */
  private hueReadout: HTMLSpanElement | null = null;

  /** HTML range input element for editing hue. */
  private hueSlider: HTMLInputElement | null = null;

  /** HTML span element to display the current saturation. */
  private saturationReadout: HTMLSpanElement | null = null;

  /** HTML range input element for editing saturation. */
  private saturationSlider: HTMLInputElement | null = null;

  /** HTML span element to display the current brightness. */
  private brightnessReadout: HTMLSpanElement | null = null;

  /** HTML range input element for editing brightness. */
  private brightnessSlider: HTMLInputElement | null = null;

  /** HTML div element containing all the labels and sliders. */
  private dropdownContainer: HTMLDivElement | null = null;

  /* eslint-disable @typescript-eslint/naming-convention */
  /**
   * Create and show the colour field's editor.
   *
   * @override
   */
  protected showEditor_(): void {
    /* eslint-enable @typescript-eslint/naming-convention */
    this.createDropdownSliders();
    if (!this.dropdownContainer || !this.hueSlider) {
      throw new Error('Failed to initialize the HSV sliders.');
    }
    Blockly.DropDownDiv.getContentDiv().appendChild(this.dropdownContainer);

    Blockly.DropDownDiv.showPositionedByField(
      this,
      this.dropdownDisposeSliders.bind(this),
    );

    this.valueWhenEditorWasOpened = this.value_;

    // Focus so we can start receiving keyboard events.
    setTimeout(() => {
      this.hueSlider?.focus({preventScroll: true});
    }, 250);
  }

  /**
   * Creates a row with a slider label and a readout to display the slider
   * value, appends it to the provided container, and returns the readout.
   *
   * @param name The display name of the slider.
   * @param container Where the row will be inserted.
   * @returns The readout, so that it can be updated.
   */
  private static createLabelInContainer(
    name: string,
    container: HTMLElement,
  ): HTMLSpanElement {
    const label: HTMLDivElement = document.createElement('div');
    const labelText: HTMLSpanElement = document.createElement('span');
    const readout: HTMLSpanElement = document.createElement('span');
    label.classList.add('fieldColourSliderLabel');
    labelText.textContent = name;
    label.appendChild(labelText);
    label.appendChild(readout);
    container.appendChild(label);
    return readout;
  }

  /**
   * Creates a slider, appends it to the provided container, and returns it.
   *
   * @param max The maximum value of the slider.
   * @param step The minimum step size of the slider.
   * @param container Where the row slider be inserted.
   * @returns The slider.
   */
  private createSliderInContainer(
    max: number,
    step: number,
    container: HTMLElement,
  ): HTMLInputElement {
    const slider: HTMLInputElement = document.createElement('input');
    slider.classList.add('fieldColourSlider');
    slider.type = 'range';
    slider.min = String(0);
    slider.max = String(max);
    slider.step = String(step);
    slider.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        Blockly.DropDownDiv.hideIfOwner(this);
        Blockly.getFocusManager().focusNode(this);
      } else if (e.key === 'Escape') {
        this.setValue(this.valueWhenEditorWasOpened);
      }
    });
    container.appendChild(slider);
    return slider;
  }

  /** Creates the colour picker slider editor and adds event listeners. */
  private createDropdownSliders(): void {
    const container: HTMLDivElement = document.createElement('div');
    container.classList.add('fieldColourSliderContainer');

    this.hueReadout = FieldColourHsvSliders.createLabelInContainer(
      'Hue',
      container,
    );
    this.hueSlider = this.createSliderInContainer(
      FieldColourHsvSliders.HUE_SLIDER_MAX,
      2,
      container,
    );
    Blockly.utils.aria.setState(
      this.hueSlider,
      Blockly.utils.aria.State.LABEL,
      'Hue',
    );
    this.saturationReadout = FieldColourHsvSliders.createLabelInContainer(
      'Saturation',
      container,
    );
    this.saturationSlider = this.createSliderInContainer(
      FieldColourHsvSliders.SATURATION_SLIDER_MAX,
      1,
      container,
    );
    Blockly.utils.aria.setState(
      this.saturationSlider,
      Blockly.utils.aria.State.LABEL,
      'Saturation',
    );
    this.brightnessReadout = FieldColourHsvSliders.createLabelInContainer(
      'Brightness',
      container,
    );
    this.brightnessSlider = this.createSliderInContainer(
      FieldColourHsvSliders.BRIGHTNESS_SLIDER_MAX,
      1,
      container,
    );
    Blockly.utils.aria.setState(
      this.brightnessSlider,
      Blockly.utils.aria.State.LABEL,
      'Brightness',
    );

    this.hsvBoundEvents.push(
      Blockly.browserEvents.conditionalBind(
        this.hueSlider,
        'input',
        this,
        this.onSliderChange,
      ),
    );
    this.hsvBoundEvents.push(
      Blockly.browserEvents.conditionalBind(
        this.saturationSlider,
        'input',
        this,
        this.onSliderChange,
      ),
    );
    this.hsvBoundEvents.push(
      Blockly.browserEvents.conditionalBind(
        this.brightnessSlider,
        'input',
        this,
        this.onSliderChange,
      ),
    );

    if (window.EyeDropper) {
      // If the browser supports the eyedropper API, create a button for it.
      const button: HTMLButtonElement = document.createElement('button');
      button.classList.add('fieldColourEyedropper');
      button.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          this.setValue(this.valueWhenEditorWasOpened);
        }
      });
      container.appendChild(document.createElement('hr'));
      container.appendChild(button);
      this.hsvBoundEvents.push(
        Blockly.browserEvents.conditionalBind(
          button,
          'click',
          this,
          this.onEyedropperEvent,
        ),
      );
    }

    this.dropdownContainer = container;

    this.updateSliderValues();
  }

  /**
   * Updates the ARIA roles and label for this field.
   */
  override recomputeAriaContext(): boolean {
    const shouldCustomize = super.recomputeAriaContext();
    if (!shouldCustomize) return false;
    Blockly.utils.aria.setState(
      this.getFocusableElement(),
      Blockly.utils.aria.State.HASPOPUP,
      'menu',
    );
    return true;
  }

  /** Disposes of events and DOM-references belonging to the colour editor. */
  private dropdownDisposeSliders(): void {
    for (const event of this.hsvBoundEvents) {
      Blockly.browserEvents.unbind(event);
    }
    this.hsvBoundEvents.length = 0;
    this.hueReadout = null;
    this.hueSlider = null;
    this.saturationReadout = null;
    this.saturationSlider = null;
    this.brightnessReadout = null;
    this.brightnessSlider = null;
    this.dropdownContainer = null;

    if (
      this.sourceBlock_ &&
      Blockly.Events.isEnabled() &&
      this.valueWhenEditorWasOpened !== null &&
      this.valueWhenEditorWasOpened !== this.value_
    ) {
      // When closing a field input widget, fire an event indicating that the
      // user has completed a sequence of changes. The value may have changed
      // multiple times while the editor was open, but this will fire an event
      // containing the value when the editor was opened as well as the new one.
      Blockly.Events.fire(
        new (Blockly.Events.get(Blockly.Events.BLOCK_CHANGE))(
          this.sourceBlock_,
          'field',
          this.name || null,
          this.valueWhenEditorWasOpened,
          this.value_,
        ),
      );
      this.valueWhenEditorWasOpened = null;
    }
  }

  /**
   * A helper function that converts a colour, specified by the provided hue,
   * saturation, and brightness parameters, into a hexadecimal string in the
   * format "#rrggbb".
   *
   * @param hue The hue of the colour.
   * @param saturation The saturation of the colour.
   * @param brightness The brightness of the colour.
   * @returns A hexadecimal representation of the colour in the format "#rrggbb"
   */
  private static hsvToHex(
    hue: number,
    saturation: number,
    brightness: number,
  ): string {
    FieldColourHsvSliders.helperHsv.h = hue;
    FieldColourHsvSliders.helperHsv.s = saturation;
    FieldColourHsvSliders.helperHsv.v = brightness;
    return FieldColourHsvSliders.helperRgb
      .loadFromHsv(FieldColourHsvSliders.helperHsv)
      .toHex();
  }

  /**
   * Updates the value of this field based on the editor sliders.
   *
   * @param event Unused.
   */
  private onSliderChange(event?: Event): void {
    if (!this.hueSlider || !this.saturationSlider || !this.brightnessSlider) {
      throw new Error('The HSV sliders are missing.');
    }
    const hue: number =
      parseFloat(this.hueSlider.value) / FieldColourHsvSliders.HUE_SLIDER_MAX;
    const saturation: number =
      parseFloat(this.saturationSlider.value) /
      FieldColourHsvSliders.SATURATION_SLIDER_MAX;
    const brightness: number =
      parseFloat(this.brightnessSlider.value) /
      FieldColourHsvSliders.BRIGHTNESS_SLIDER_MAX;
    this.setIntermediateValue(
      FieldColourHsvSliders.hsvToHex(hue, saturation, brightness),
    );
    this.renderSliders();
  }

  /**
   * Updates the value of this field and editor sliders using an eyedropper.
   *
   * @param event Unused.
   */
  private onEyedropperEvent(event?: Event): void {
    if (window.EyeDropper) {
      const eyeDropper: EyeDropper = new window.EyeDropper();
      eyeDropper.open().then(
        (result) => {
          this.setIntermediateValue(result.sRGBHex);
          this.updateSliderValues();
        },
        // Prevent throwing by handling promise rejection and doing nothing.
        () => {},
      );
    }
  }

  private setIntermediateValue(value: string): void {
    // Intermediate value changes from user input are not confirmed until the
    // user closes the editor, and may be numerous. Inhibit reporting these as
    // normal block change events, and instead report them as special
    // intermediate changes that do not get recorded in undo history.
    const oldValue = this.value_;
    // Change the field's value without firing the normal change event.
    this.setValue(value, false);
    if (
      this.sourceBlock_ &&
      Blockly.Events.isEnabled() &&
      this.value_ !== oldValue
    ) {
      // Fire a special event indicating that the value changed but the change
      // isn't complete yet and normal field change listeners can wait.
      Blockly.Events.fire(
        new (Blockly.Events.get(
          Blockly.Events.BLOCK_FIELD_INTERMEDIATE_CHANGE,
        ))(this.sourceBlock_, this.name || null, oldValue, this.value_),
      );
    }
  }

  /**
   * Updates the gradient backgrounds of the slider tracks and readouts based
   * on the slider values.
   */
  private renderSliders(): void {
    if (
      !this.hueSlider ||
      !this.hueReadout ||
      !this.saturationSlider ||
      !this.saturationReadout ||
      !this.brightnessSlider ||
      !this.brightnessReadout
    ) {
      throw new Error('The HSV sliders are missing.');
    }
    this.hueReadout.textContent = this.hueSlider.value;
    this.saturationReadout.textContent = this.saturationSlider.value;
    this.brightnessReadout.textContent = this.brightnessSlider.value;

    const h: number =
      parseFloat(this.hueSlider.value) / FieldColourHsvSliders.HUE_SLIDER_MAX;
    const s: number =
      parseFloat(this.saturationSlider.value) /
      FieldColourHsvSliders.SATURATION_SLIDER_MAX;
    const v: number =
      parseFloat(this.brightnessSlider.value) /
      FieldColourHsvSliders.BRIGHTNESS_SLIDER_MAX;

    // The hue slider needs intermediate gradient control points to include all
    // colours of the rainbow.
    let hueGradient = 'linear-gradient(to right, ';
    hueGradient +=
      FieldColourHsvSliders.hsvToHex(0 / 6, s, v) +
      ` ${FieldColourHsvSliders.THUMB_RADIUS}px, `;
    hueGradient += FieldColourHsvSliders.hsvToHex(1 / 6, s, v) + ', ';
    hueGradient += FieldColourHsvSliders.hsvToHex(2 / 6, s, v) + ', ';
    hueGradient += FieldColourHsvSliders.hsvToHex(3 / 6, s, v) + ', ';
    hueGradient += FieldColourHsvSliders.hsvToHex(4 / 6, s, v) + ', ';
    hueGradient += FieldColourHsvSliders.hsvToHex(5 / 6, s, v) + ', ';
    hueGradient +=
      FieldColourHsvSliders.hsvToHex(6 / 6, s, v) +
      ` calc(100% - ${FieldColourHsvSliders.THUMB_RADIUS}px))`;
    this.hueSlider.style.setProperty('--slider-track-background', hueGradient);

    // The saturation slider only needs gradient control points at each end.
    let saturationGradient = 'linear-gradient(to right, ';
    saturationGradient +=
      FieldColourHsvSliders.hsvToHex(h, 0, v) +
      ` ${FieldColourHsvSliders.THUMB_RADIUS}px, `;
    saturationGradient +=
      FieldColourHsvSliders.hsvToHex(h, 1, v) +
      ` calc(100% - ${FieldColourHsvSliders.THUMB_RADIUS}px))`;
    this.saturationSlider.style.setProperty(
      '--slider-track-background',
      saturationGradient,
    );

    // The brightness slider only needs gradient control points at each end.
    let brightnessGradient = 'linear-gradient(to right, ';
    brightnessGradient +=
      FieldColourHsvSliders.hsvToHex(h, s, 0) +
      ` ${FieldColourHsvSliders.THUMB_RADIUS}px, `;
    brightnessGradient +=
      FieldColourHsvSliders.hsvToHex(h, s, 1) +
      ` calc(100% - ${FieldColourHsvSliders.THUMB_RADIUS}px))`;
    this.brightnessSlider.style.setProperty(
      '--slider-track-background',
      brightnessGradient,
    );
  }

  /** Updates slider values based on the current value of the field. */
  private updateSliderValues(): void {
    if (!this.hueSlider || !this.saturationSlider || !this.brightnessSlider) {
      return;
    }

    const hsv: HsvColour = FieldColourHsvSliders.helperHsv.loadFromRgb(
      FieldColourHsvSliders.helperRgb.loadFromHex(this.getValue() ?? ''),
    );

    this.hueSlider.value = String(hsv.h * FieldColourHsvSliders.HUE_SLIDER_MAX);
    this.saturationSlider.value = String(
      hsv.s * FieldColourHsvSliders.SATURATION_SLIDER_MAX,
    );
    this.brightnessSlider.value = String(
      hsv.v * FieldColourHsvSliders.BRIGHTNESS_SLIDER_MAX,
    );

    this.renderSliders();
  }

  override getAriaValue() {
    const hsv: HsvColour = FieldColourHsvSliders.helperHsv.loadFromRgb(
      FieldColourHsvSliders.helperRgb.loadFromHex(this.getValue() ?? ''),
    );

    const components = [];
    const brightness = hsv.v * 100;
    if (brightness === 0) {
      return 'black';
    } else if (brightness <= 25) {
      components.push('very dark');
    } else if (brightness < 75) {
      components.push('dark');
    }

    const saturation = hsv.s * 100;
    if (saturation === 0) {
      if (brightness === 100) {
        return 'white';
      }
      components.push('grey');
      return components.join(' ');
    } else if (saturation <= 30) {
      components.push(brightness <= 60 ? 'greyish' : 'pale');
    } else if (saturation >= 75) {
      components.push('vibrant');
    }

    const hue = hsv.h * 360;
    if (hue >= 330 || hue <= 10) {
      components.push('red');
    } else if (hue <= 45) {
      components.push('orange');
    } else if (hue <= 65) {
      components.push('yellow');
    } else if (hue <= 160) {
      components.push('green');
    } else if (hue <= 190) {
      components.push('cyan');
    } else if (hue <= 260) {
      components.push('blue');
    } else if (hue <= 290) {
      components.push('purple');
    } else {
      components.push('fuchsia');
    }

    return components.join(' ');
  }
}

Blockly.fieldRegistry.register(
  'field_colour_hsv_sliders',
  FieldColourHsvSliders,
);

// CSS for colour slider fields.
Blockly.Css.register(`
.fieldColourSliderContainer {
  padding: 4px;
  font-family: Roboto, Arial, sans-serif;
  color: #5c5c5c;
}
.fieldColourSliderContainer hr {
  border: none;
  border-top: 1px solid #bbb;
}
.fieldColourSliderLabel {
  display: flex;
  justify-content: space-between;
}
.fieldColourEyedropper {
  appearance: none;
  position: relative;
  border: none;
  border-radius: 4px;
  background: transparent;
  font: inherit;
  color: inherit;
  cursor: pointer;
  width: 100%;
  margin: 0;
  display: flex;
  justify-content: center;
  align-items: center;
}
.fieldColourEyedropper:hover {
  background: rgba(0,0,0,0.1)
}
.fieldColourEyedropper input {
  opacity: 0;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}
.fieldColourEyedropper::before {
  content: "Eyedropper";
}
.fieldColourEyedropper::after {
  content: "";
  margin-left: 8px;
  width: 24px;
  height: 24px;
  background: currentColor;
  pointer-events: none;
  -webkit-mask-image: var(--customize-dial-symbol);
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-position: center;
  mask-image: var(--customize-dial-symbol);
  mask-repeat: no-repeat;
  mask-position: center;
  --customize-dial-symbol: url('data:image/svg+xml,\
    <svg xmlns="http://www.w3.org/2000/svg" \
         width="24px" height="24px" \
         viewBox="0 0 24 24"> \
      <path stroke="black" strokewidth="1.414" fill="none" \
            d="m 13 8 L 6 15 Q 3 18 2 21 Q 0 23 .5 23.5 Q 1 24 3 22 \
                Q 6 21 9 18 L 16 11"/> \
      <path fill="black" \
            d="m 12 7 Q 11 6 12 5 Q 13 4 14 5 Q 15 6 16 5 Q 20 -1 22.5 1.5 \
                Q 25 4 19 8 Q 18 9 19 10 Q 20 11 19 12 Q 18 13 17 12"/> \
    </svg>');
}
.blocklyKeyboardNavigation .fieldColourEyedropper:focus {
  outline: none;
  border: var(--blockly-selection-width) solid var(--blockly-active-node-color);
  border-radius: 4px;
}
.fieldColourSlider {
  -webkit-appearance: none;
  width: 150px;
  height: 24px;
  margin: 4px 8px 24px 8px;
  padding: 0;
}
.fieldColourSlider:last-child {
  margin-bottom: 4px;
}
.fieldColourSlider:focus {
  outline: none;
}
/* Webkit */
.fieldColourSlider::-webkit-slider-runnable-track {
  background: var(--slider-track-background);
  border-radius: 8px;
  height: 16px;
}
.fieldColourSlider::-webkit-slider-thumb {
  -webkit-appearance: none;
  background: #fff;
  border-radius: 50%;
  box-shadow: 0 0 0 4px rgba(0,0,0,.15);
  cursor: pointer;
  width: ${FieldColourHsvSliders.THUMB_RADIUS * 2}px;
  height: ${FieldColourHsvSliders.THUMB_RADIUS * 2}px;
  margin-top: -4px;
}
/* Firefox */
.fieldColourSlider::-moz-range-track {
  background: var(--slider-track-background);
  border-radius: 8px;
  height: 16px;
}
.fieldColourSlider::-moz-range-thumb {
  background: #fff;
  border: none;
  border-radius: 50%;
  box-shadow: 0 0 0 4px rgba(0,0,0,.15);
  cursor: pointer;
  width: ${FieldColourHsvSliders.THUMB_RADIUS * 2}px;
  height: ${FieldColourHsvSliders.THUMB_RADIUS * 2}px;
}
.fieldColourSlider::-moz-focus-outer {
  /* override the focus border style */
  border: 0;
}
/* IE */
.fieldColourSlider::-ms-track {
  background: var(--slider-track-background);
  border-radius: 12px;
  width: 100%;
  height: 24px;
  /* remove default tick marks */
  color: transparent;
}
.fieldColourSlider::-ms-fill-lower  {
  background: transparent;
}
.fieldColourSlider::-ms-fill-upper  {
  background: transparent;
}
.fieldColourSlider::-ms-thumb {
  background: #fff;
  border: none;
  border-radius: 50%;
  box-shadow: 0 0 0 4px rgba(0,0,0,.15);
  cursor: pointer;
  width: ${FieldColourHsvSliders.THUMB_RADIUS * 2}px;
  height: ${FieldColourHsvSliders.THUMB_RADIUS * 2}px;
}
.blocklyKeyboardNavigation .fieldColourSlider:focus {
  border: var(--blockly-selection-width) solid var(--blockly-active-node-color);
  border-radius: 16px;
  padding: 1px;
}
`);
