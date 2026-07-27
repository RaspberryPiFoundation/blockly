/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Angle input field.
 */

import * as Blockly from 'blockly/core';

/**
 * Class for an editable angle field.
 */
export class FieldAngle extends Blockly.FieldNumber {
  /** Half the width of protractor image. */
  static readonly HALF = 100 / 2;

  /**
   * Radius of protractor circle.  Slightly smaller than protractor size since
   * otherwise SVG crops off half the border at the edges.
   */
  static readonly RADIUS: number = FieldAngle.HALF - 1;

  static readonly DEFAULT_PRECISION = 15;
  static readonly DEFAULT_MIN = 0;
  static readonly DEFAULT_MAX = 360;

  /**
   * Whether the angle should increase as the angle picker is moved clockwise
   * (true) or counterclockwise (false).
   */
  private clockwise = false;

  /**
   * The angle (in degrees) at which displayMin is pointed.  Always in the
   * counterclockwise direction, regardless of the field's clockwise property.
   * Usually either 0 (0 = right) or 90 (0 = up).
   */
  private offset = 0;

  /**
   * Smallest value displayed on the gauge.  Usually 0 or -180.
   */
  private displayMin = 0;

  /**
   * Largest value displayed on the gauge.  Usually 360 or 180.
   */
  private displayMax = 360;

  /**
   * Distance between minor tick marks on dial.  Zero to disable.
   * If displayMin/Max span 360, then majorTick would usually be 15.
   * May not be negative.
   */
  private minorTick = 15;

  /**
   * Distance between major tick marks on dial.  Zero to disable.
   * If displayMin/Max span 360, then majorTick would usually be 45.
   * May not be negative.
   */
  private majorTick = 45;

  /**
   * Unit symbol to append to the number when not being edited.
   */
  private symbol = '°';

  /**
   * Array holding info needed to unbind events.
   * Used for disposing.
   * Ex: [[node, name, func], [node, name, func]].
   */
  private boundEvents: Blockly.browserEvents.Data[] = [];

  /** Dynamic red line pointing at the value's angle. */
  private line: SVGLineElement | null = null;

  /** Dynamic pink area extending from 0 to the value's angle. */
  private gauge: SVGPathElement | null = null;

  /** The degree symbol for this field. */
  protected symbolElement: SVGTSpanElement | null = null;

  /**
   * @param value The initial value of the field.  Should cast to a number.
   *     Defaults to 0.  Also accepts Field.SKIP_SETUP if you wish to skip setup
   *     (only used by subclasses that want to handle configuration and setting
   *     the field value after their own constructors have run).
   * @param validator A function that is called to validate changes to the
   *     field's value.  Takes in a number & returns a validated number, or null
   *     to abort the change.
   * @param config A map of options used to configure the field.
   *     See the [field creation documentation]{@link
   * https://developers.google.com/blockly/guides/create-custom-blocks/fields/built-in-fields/angle#creation}
   * for a list of properties this parameter supports.
   */
  constructor(
    value?: string | number | typeof Blockly.Field.SKIP_SETUP,
    validator?: FieldAngleValidator,
    config?: FieldAngleConfig,
  ) {
    super(Blockly.Field.SKIP_SETUP);

    if (value === Blockly.Field.SKIP_SETUP) return;
    if (config) {
      this.configure_(config);
      if (config.min === undefined || config.min === null) {
        this.setMin(FieldAngle.DEFAULT_MIN);
      }
      if (config.max === undefined || config.max === null) {
        this.setMax(FieldAngle.DEFAULT_MAX);
      }
      if (config.precision === undefined || config.precision === null) {
        this.setPrecision(FieldAngle.DEFAULT_PRECISION);
      }
    } else {
      this.setMin(FieldAngle.DEFAULT_MIN);
      this.setMax(FieldAngle.DEFAULT_MAX);
      this.setPrecision(FieldAngle.DEFAULT_PRECISION);
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
  protected override configure_(config: FieldAngleConfig) {
    super.configure_(config);
    switch (config.mode) {
      case Mode.COMPASS:
        this.clockwise = true;
        this.offset = 90;
        break;
      case Mode.PROTRACTOR:
        // This is the default mode, so we could do nothing.  But just to
        // future-proof, we'll set it anyway.
        this.clockwise = false;
        this.offset = 0;
        break;
    }

    // Allow individual settings to override the mode setting.
    if (config.clockwise !== undefined) this.clockwise = config.clockwise;
    if (config.offset !== undefined) this.offset = config.offset;
    if (config.displayMin !== undefined) this.displayMin = config.displayMin;
    if (config.displayMax !== undefined) this.displayMax = config.displayMax;
    if (config.minorTick !== undefined) this.minorTick = config.minorTick;
    if (config.majorTick !== undefined) this.majorTick = config.majorTick;
    if (config.symbol !== undefined) this.symbol = config.symbol;

    // Sanity check the inputs.
    if (this.displayMin >= this.displayMax) {
      throw Error('Display min must be larger than display max');
    }
    if (this.minorTick < 0 || this.majorTick < 0) {
      throw Error('Ticks cannot be negative');
    }
  }

  override getAriaTypeName() {
    return Blockly.Msg['ARIA_TYPE_FIELD_ANGLE'];
  }

  override getAriaValue() {
    return Blockly.Msg['ARIA_LABEL_FIELD_ANGLE'].replace(
      '%1',
      super.getAriaValue() ?? '',
    );
  }

  /**
   * Create the block UI for this field.
   *
   * @internal
   */
  override initView() {
    super.initView();
    if (this.symbol) {
      // Add the degree symbol to the left of the number,
      // even in RTL (https://github.com/google/blockly/issues/2380).
      this.symbolElement = Blockly.utils.dom.createSvgElement(
        Blockly.utils.Svg.TSPAN,
        {class: 'blocklyAngleSymbol'},
      );
      this.symbolElement.appendChild(document.createTextNode(this.symbol));
      this.getTextElement().appendChild(this.symbolElement);
    }
  }

  /**
   * Updates the angle when the field rerenders.
   */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  protected override render_() {
    super.render_();
    this.updateGraph();
  }

  /**
   * Create and show the angle field's editor.
   *
   * @param e Optional mouse event that triggered the field to open,
   *     or undefined if triggered programmatically.
   */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  protected override showEditor_(e?: Event) {
    // Mobile browsers have issues with in-line textareas (focus & keyboards).
    // Also, don't let the parent take ephemeral focus since the drop-down div
    // below will handle it, instead.
    const noFocus =
      Blockly.utils.userAgent.MOBILE ||
      Blockly.utils.userAgent.ANDROID ||
      Blockly.utils.userAgent.IPAD;

    const editor = this.dropdownCreate();
    Blockly.DropDownDiv.getContentDiv().appendChild(editor);

    const sourceBlock = this.getSourceBlock();
    if (sourceBlock instanceof Blockly.BlockSvg) {
      Blockly.DropDownDiv.setColour(
        sourceBlock.style.colourPrimary,
        sourceBlock.style.colourTertiary,
      );
    }

    Blockly.DropDownDiv.showPositionedByField(
      this,
      this.dropdownDispose.bind(this),
    );

    super.showEditor_(e, noFocus, false);

    this.updateGraph();
  }

  /**
   * Creates the angle dropdown editor.
   *
   * @returns The newly created slider.
   */
  private dropdownCreate(): SVGSVGElement {
    const svg = Blockly.utils.dom.createSvgElement(Blockly.utils.Svg.SVG, {
      'xmlns': Blockly.utils.dom.SVG_NS,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      'xmlns:html': Blockly.utils.dom.HTML_NS,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      'xmlns:xlink': Blockly.utils.dom.XLINK_NS,
      'version': '1.1',
      'height': FieldAngle.HALF * 2 + 'px',
      'width': FieldAngle.HALF * 2 + 'px',
    });
    svg.style.touchAction = 'none';
    const circle = Blockly.utils.dom.createSvgElement(
      Blockly.utils.Svg.CIRCLE,
      {
        cx: FieldAngle.HALF,
        cy: FieldAngle.HALF,
        r: FieldAngle.RADIUS,
        class: 'blocklyAngleCircle',
      },
      svg,
    );
    this.gauge = Blockly.utils.dom.createSvgElement(
      Blockly.utils.Svg.PATH,
      {
        class: 'blocklyAngleGauge',
      },
      svg,
    );
    this.line = Blockly.utils.dom.createSvgElement(
      Blockly.utils.Svg.LINE,
      {
        x1: FieldAngle.HALF,
        y1: FieldAngle.HALF,
        class: 'blocklyAngleLine',
      },
      svg,
    );

    // Draw markers around the edge.
    const minValueDegrees = Blockly.utils.math.toDegrees(
      this.fieldAngleToRadians(this.min_),
    );
    const maxValueDegrees = Blockly.utils.math.toDegrees(
      this.fieldAngleToRadians(this.max_),
    );

    /**
     * Draw a set of ticks on the gauge.
     *
     * @param tickAngle Angle between each tick.
     * @param length Length of the tick (minor=5, major=10).
     */
    const drawTicks = (tickAngle: number, length: number) => {
      let min = Math.ceil(minValueDegrees / tickAngle) * tickAngle;
      let max = Math.floor(maxValueDegrees / tickAngle) * tickAngle;

      if (this.clockwise) {
        if (min < max) {
          min += 360;
        }
      } else {
        if (min > max) {
          max += 360;
        }
      }
      if (max === min) {
        // Technically this could actually be zero, but more likely it's whole.
        max += 360;
      }
      if (min > max) {
        [min, max] = [max, min];
      }
      for (let angle = min; angle <= max; angle += tickAngle) {
        Blockly.utils.dom.createSvgElement(
          Blockly.utils.Svg.LINE,
          {
            x1: FieldAngle.HALF + FieldAngle.RADIUS,
            y1: FieldAngle.HALF,
            x2: FieldAngle.HALF + FieldAngle.RADIUS - length,
            y2: FieldAngle.HALF,
            class: 'blocklyAngleMarks',
            transform:
              'rotate(' +
              -angle +
              ',' +
              FieldAngle.HALF +
              ',' +
              FieldAngle.HALF +
              ')',
          },
          svg,
        );
      }
    };

    const displayRange = this.displayMax - this.displayMin;
    const minorTickAngle = (360 / displayRange) * this.minorTick;
    if (minorTickAngle) {
      drawTicks(minorTickAngle, 5);
    }
    const majorTickAngle = (360 / displayRange) * this.majorTick;
    if (majorTickAngle) {
      drawTicks(majorTickAngle, 10);
    }

    // The angle picker is different from other fields in that it updates on
    // mousemove even if it's not in the middle of a drag.  In future we may
    // change this behaviour.
    this.boundEvents.push(
      Blockly.browserEvents.conditionalBind(svg, 'click', this, this.hide),
    );
    // On touch devices, the picker's value is only updated with a drag.  Add
    // a click handler on the drag surface to update the value if the surface
    // is clicked.
    this.boundEvents.push(
      Blockly.browserEvents.conditionalBind(
        circle,
        'pointerdown',
        this,
        this.onMouseMove_,
        true,
      ),
    );
    this.boundEvents.push(
      Blockly.browserEvents.conditionalBind(
        circle,
        'pointermove',
        this,
        this.onMouseMove_,
        true,
      ),
    );
    return svg;
  }

  /**
   * Disposes of events belonging to the angle editor.
   */
  private dropdownDispose() {
    for (const event of this.boundEvents) {
      Blockly.browserEvents.unbind(event);
    }
    this.boundEvents.length = 0;
    this.gauge = null;
    this.line = null;
  }

  /** Hide the editor. */
  private hide() {
    this.recomputeAriaContext();
    Blockly.DropDownDiv.hideIfOwner(this);
    Blockly.WidgetDiv.hide();
  }

  /**
   * Set the angle to match the mouse's position.
   *
   * @param e Mouse move event.
   */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  protected onMouseMove_(e: PointerEvent) {
    // Calculate angle.
    const bBox = this.gauge?.ownerSVGElement?.getBoundingClientRect();
    if (!bBox) {
      // This can't happen, but TypeScript thinks it can and lint forbids `!.`.
      return;
    }
    const dx = e.clientX - bBox.left - FieldAngle.HALF;
    const dy = e.clientY - bBox.top - FieldAngle.HALF;
    let angle = Math.atan2(-dy, dx);
    if (isNaN(angle)) {
      // This shouldn't happen, but let's not let this error propagate further.
      return;
    }
    angle = this.radiansToFieldAngle(angle);
    this.displayMouseOrKeyboardValue(angle);
  }

  /**
   * Convert an on-screen angle into a value for this field.
   *
   * @param angle Radians where 0: East, π/2: North, π or -π: West, -π/2: South.
   * @returns Angle value for this field, scaled and offset as specified.
   */
  private radiansToFieldAngle(angle: number): number {
    // Convert angle from radians (-π to π) to turns (-0.5 to 0.5).
    angle /= 2 * Math.PI;
    // Compensate for offset.
    angle -= this.offset / 360;
    // Flip if clockwise.
    if (this.clockwise) {
      angle *= -1;
    }
    // Normalize to positive.
    angle %= 1;
    if (angle < 0) {
      angle += 1;
    }
    // Convert angle from turns (0.0 to 1.0) to the display min/max range.
    angle *= this.displayMax - this.displayMin;
    angle += this.displayMin;
    return angle;
  }

  /**
   * Convert a value for this field into an on-screen angle.
   *
   * @param angle Angle value for this field, scaled and offset as specified.
   * @returns Radians where 0: East, π/2: North, π or -π: West, -π/2: South.
   */
  private fieldAngleToRadians(angle: number): number {
    // Convert angle from the display min/max range to turns (0.0 to 1.0).
    angle -= this.displayMin;
    angle /= this.displayMax - this.displayMin;
    // Flip if clockwise.
    if (this.clockwise) {
      angle *= -1;
    }
    // Compensate for offset.
    angle += this.offset / 360;
    // Normalize to span equally across zero (-0.5 to 0.5).
    angle %= 1;
    if (angle > 0.5) {
      angle -= 1;
    }
    if (angle < -0.5) {
      angle += 1;
    }
    // Convert angle from turns to radians.
    angle *= 2 * Math.PI;
    return angle;
  }

  /**
   * Handles and displays values that are input via mouse or arrow key input.
   * These values need to be rounded and wrapped before being displayed so
   * that the text input's value is appropriate.
   *
   * @param angle New angle.
   */
  private displayMouseOrKeyboardValue(angle: number) {
    const validAngle = this.doClassValidation_(angle);
    if (validAngle !== null && validAngle !== this.value_) {
      // Intermediate value changes from user input are not confirmed until the
      // user closes the editor, and may be numerous. Inhibit reporting these as
      // normal block change events, and instead report them as special
      // intermediate changes that do not get recorded in undo history.
      const oldValue = this.value_;
      this.setEditorValue_(validAngle, false);
      if (
        this.sourceBlock_ &&
        Blockly.Events.isEnabled() &&
        this.value_ !== oldValue
      ) {
        Blockly.Events.fire(
          new (Blockly.Events.get(
            Blockly.Events.BLOCK_FIELD_INTERMEDIATE_CHANGE,
          ))(this.sourceBlock_, this.name || null, oldValue, this.value_),
        );
        Blockly.utils.aria.announceDynamicAriaState(this.getAriaValue());
      }
    }
  }

  /** Redraw the graph with the current angle. */
  private updateGraph() {
    if (!this.gauge || !this.line) {
      return;
    }
    let angle = Number(this.getText());
    if (isNaN(angle)) {
      // This shouldn't happen, but let's not let this error propagate further.
      return;
    }
    angle = this.fieldAngleToRadians(angle);

    let path = `M ${FieldAngle.HALF},${FieldAngle.HALF}`;
    let x2 = FieldAngle.HALF;
    let y2 = FieldAngle.HALF;
    if (!isNaN(angle)) {
      const angle1 = Blockly.utils.math.toRadians(this.offset);
      const x1 = Math.cos(angle1) * FieldAngle.RADIUS;
      const y1 = Math.sin(angle1) * -FieldAngle.RADIUS;
      x2 += Math.cos(angle) * FieldAngle.RADIUS;
      y2 -= Math.sin(angle) * FieldAngle.RADIUS;
      // Don't ask how the flag calculations work.  They just do.
      const clockwiseFlag = Number(this.clockwise);
      let largeFlag = Math.abs(Math.floor((angle - angle1) / Math.PI) % 2);
      if (clockwiseFlag) {
        largeFlag = 1 - largeFlag;
      }
      path +=
        ` l ${x1},${y1} A ${FieldAngle.RADIUS},${FieldAngle.RADIUS} 0 ` +
        `${largeFlag} ${clockwiseFlag} ${x2},${y2} z`;
    }
    this.gauge.setAttribute('d', path);
    this.line.setAttribute('x2', `${x2}`);
    this.line.setAttribute('y2', `${y2}`);
  }

  /**
   * Handle key down to the editor.
   *
   * @param e Keyboard event.
   */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  protected override onHtmlInputKeyDown_(e: KeyboardEvent) {
    super.onHtmlInputKeyDown_(e);
    const block = this.getSourceBlock();
    if (!block) {
      throw new Error(
        'The field has not yet been attached to its input. ' +
          'Call appendField to attach it.',
      );
    }

    let multiplier = 0;
    switch (e.key) {
      case 'ArrowLeft':
        // decrement (increment in RTL)
        multiplier = block.RTL ? 1 : -1;
        break;
      case 'ArrowRight':
        // increment (decrement in RTL)
        multiplier = block.RTL ? -1 : 1;
        break;
      case 'ArrowDown':
        // decrement
        multiplier = -1;
        break;
      case 'ArrowUp':
        // increment
        multiplier = 1;
        break;
    }
    if (multiplier) {
      const value = this.getValue() as number;
      this.displayMouseOrKeyboardValue(value + multiplier * this.precision_);
      e.preventDefault();
      e.stopPropagation();
    }
  }

  /**
   * Ensure that the input value is a valid angle.
   *
   * @param newValue The input value.
   * @returns A valid angle, or null if invalid.
   */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  protected override doClassValidation_(
    newValue: number,
  ): number | null | undefined;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  protected override doClassValidation_(newValue?: number): number | null;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  protected override doClassValidation_(
    newValue?: number,
  ): number | null | undefined {
    // The obvious approach would be to call super.doClassValidation_ to handle
    // min/max limitations.  However angle pickers out of range need to clamp
    // to the closest min/max point, which may involve a wrap to the opposite
    // end of the numeric scale.
    // E.g. min/max is 0/180 on a 0/360 display, and value is 365.
    // FieldNumber would clamp 365 to max (180), but 0 is closer on the dial.
    if (newValue === null) {
      return null;
    }
    let value = Number(newValue);
    if (isNaN(value) || !isFinite(value)) {
      return null;
    }
    // Get the value in range.
    value = this.wrapValue(value);
    // Round to nearest multiple of precision.
    if (this.precision_) {
      value = Math.round(value / this.precision_) * this.precision_;
    }
    // Deal with 6.6000000000000005 IEEE float errors.
    // Clean up floating point errors.
    value = Number(value.toFixed(10));
    // Clamp the value between min and max, noting wrapping.
    const displayRange = this.displayMax - this.displayMin;
    const valueRange = this.max_ - this.min_;
    if (value < this.min_) {
      const undershoot = this.min_ - value;
      const overshoot = displayRange - undershoot - valueRange;
      value = undershoot < overshoot ? this.min_ : this.max_;
    }
    if (value > this.max_) {
      const overshoot = value - this.max_;
      const undershoot = displayRange - overshoot - valueRange;
      value = undershoot < overshoot ? this.min_ : this.max_;
    }
    return value;
  }

  /**
   * Wraps the value so that it is in the min/max display range (e.g. 0 to 360).
   *
   * @param value The value to wrap.
   * @returns The wrapped value.
   */
  private wrapValue(value: number): number {
    const displayRange = this.displayMax - this.displayMin;
    value %= displayRange;
    while (value < this.displayMin) {
      value += displayRange;
    }
    while (value >= this.displayMax) {
      value -= displayRange;
    }
    return value;
  }

  /**
   * Construct a FieldAngle from a JSON arg object.
   *
   * @param options A JSON object with options
   *     (value, mode, clockwise, offset, min, max, precision).
   * @returns The new field instance.
   * @nocollapse
   * @internal
   */
  static fromJson(options: FieldAngleFromJsonConfig): FieldAngle {
    // `this` might be a subclass of FieldAngle if that class doesn't override
    // the static fromJson method.
    return new this(options.value, undefined, options);
  }

  /**
   * Hides the angle editor and updates the ARIA label.
   */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  protected override widgetDispose_() {
    super.widgetDispose_();
    this.recomputeAriaContext();
  }
}

/** Register the field and any dependencies. */
export function registerFieldAngle() {
  Blockly.fieldRegistry.register('field_angle', FieldAngle);
}

FieldAngle.prototype.DEFAULT_VALUE = 0;

/**
 * CSS for angle field.
 */
Blockly.Css.register(`
.blocklyAngleCircle {
  stroke: #444;
  stroke-width: 1;
  fill: #ddd;
  fill-opacity: 0.8;
}

.blocklyAngleMarks {
  stroke: #444;
  stroke-width: 1;
}

.blocklyAngleGauge {
  fill: #f88;
  fill-opacity: 0.8;
  pointer-events: none;
}

.blocklyAngleLine {
  stroke: #f00;
  stroke-width: 2;
  stroke-linecap: round;
  pointer-events: none;
}

.blocklyAngleSymbol {
  dominant-baseline: central;
}
`);

/**
 * The two main modes of the angle field.
 * Compass specifies:
 *   - clockwise: true
 *   - offset: 90
 *   - min: 0
 *   - max: 360
 *   - precision: 15
 *   - displayMin: 0
 *   - displayMax: 360
 *   - minorTick: 15
 *   - majorTick: 45
 *   - symbol: '°'
 *
 * Protractor specifies:
 *   - clockwise: false
 *   - offset: 0
 *   - min: 0
 *   - max: 360
 *   - precision: 15
 *   - displayMin: 0
 *   - displayMax: 360
 *   - minorTick: 15
 *   - majorTick: 45
 *   - symbol: '°'
 */
export enum Mode {
  COMPASS = 'compass',
  PROTRACTOR = 'protractor',
}

/**
 * Extra configuration options for the angle field.
 */
export interface FieldAngleConfig extends Blockly.FieldNumberConfig {
  mode?: Mode;
  clockwise?: boolean;
  offset?: number;
  displayMin?: number;
  displayMax?: number;
  minorTick?: number;
  majorTick?: number;
  symbol?: string;
}

/**
 * fromJson configuration options for the angle field.
 */
export interface FieldAngleFromJsonConfig extends FieldAngleConfig {
  value?: number;
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
export type FieldAngleValidator = Blockly.FieldNumberValidator;
