/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';

export const DEFAULT_HEIGHT = 5;
export const DEFAULT_WIDTH = 5;
const DEFAULT_PIXEL_SIZE = 15;
const DEFAULT_PIXEL_COLOURS: PixelColours = {
  empty: '#fff',
  filled: '#363d80',
};
const DEFAULT_BUTTONS: Buttons = {
  randomize: true,
  clear: true,
};

/**
 * Field for inputting a small bitmap image.
 * Includes a grid of clickable pixels that's exported as a bitmap.
 */
export class FieldBitmap extends Blockly.Field<number[][]> {
  private initialValue: number[][] | null = null;
  private imgHeight: number;
  private imgWidth: number;
  /**
   * Array holding info needed to unbind events.
   * Used for disposing.
   */
  private boundEvents: Blockly.browserEvents.Data[] = [];
  /** References to UI elements */
  private pixelGrid: HTMLDivElement | null = null;
  private editorPixels: HTMLButtonElement[][] | null = null;
  private blockDisplayPixels: SVGElement[][] | null = null;
  /** Index of the keyboard-focused pixel in row-major order, or -1. */
  private focusedPixelIndex = -1;
  /** Stateful variables */
  private pointerIsDown = false;
  private valToPaintWith?: number;
  buttonOptions: Buttons;
  pixelSize: number;
  pixelColours: {empty: string; filled: string};
  fieldHeight?: number;

  protected override ariaTypeName = Blockly.Msg['ARIA_TYPE_FIELD_BITMAP'];

  /**
   * Constructor for the bitmap field.
   *
   * @param value 2D rectangular array of 1s and 0s.
   * @param validator A function that is called to validate.
   * @param config Config A map of options used to configure the field.
   */
  constructor(
    value: number[][] | typeof Blockly.Field.SKIP_SETUP,
    validator?: Blockly.FieldValidator<number[][]>,
    config?: FieldBitmapFromJsonConfig,
  ) {
    super(value, validator, config);

    this.SERIALIZABLE = true;
    this.buttonOptions = {...DEFAULT_BUTTONS, ...config?.buttons};
    this.pixelColours = {...DEFAULT_PIXEL_COLOURS, ...config?.colours};

    // Configure value, height, and width
    const currentValue = this.getValue();
    if (currentValue !== null) {
      this.imgHeight = currentValue.length;
      this.imgWidth = currentValue[0].length || 0;
    } else {
      this.imgHeight = config?.height ?? DEFAULT_HEIGHT;
      this.imgWidth = config?.width ?? DEFAULT_WIDTH;
      // Set a default empty value
      this.setValue(this.getEmptyArray());
    }
    this.fieldHeight = config?.fieldHeight;
    if (this.fieldHeight) {
      this.pixelSize = this.fieldHeight / this.imgHeight;
    } else {
      this.pixelSize = DEFAULT_PIXEL_SIZE;
    }
  }

  /**
   * Constructs a FieldBitmap from a JSON arg object.
   *
   * @param options A JSON object with options.
   * @returns The new field instance.
   */
  static fromJson(options: FieldBitmapFromJsonConfig) {
    // `this` might be a subclass of FieldBitmap if that class doesn't override the static fromJson method.
    return new this(
      options.value ?? Blockly.Field.SKIP_SETUP,
      undefined,
      options,
    );
  }

  /**
   * Returns the width of the image in pixels.
   *
   * @returns The width in pixels.
   */
  getImageWidth() {
    return this.imgWidth;
  }

  /**
   * Returns the height of the image in pixels.
   *
   * @returns The height in pixels.
   */
  getImageHeight() {
    return this.imgHeight;
  }

  /**
   * Updates the ARIA roles and label for this field.
   */
  override recomputeAriaContext(): boolean {
    const shouldCustomize = super.recomputeAriaContext();
    if (!shouldCustomize) return false;
    const focusableElement = this.getFocusableElement();
    Blockly.utils.aria.setState(
      focusableElement,
      Blockly.utils.aria.State.HASPOPUP,
      'grid',
    );
    Blockly.utils.aria.setState(
      focusableElement,
      Blockly.utils.aria.State.EXPANDED,
      !!this.pixelGrid,
    );
    return true;
  }

  /**
   * Validates that a new value meets the requirements for a valid bitmap array.
   *
   * @param newValue The new value to be tested.
   * @returns The new value if it's valid, or null.
   */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  protected override doClassValidation_(
    newValue: number[][],
  ): number[][] | null | undefined;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  protected override doClassValidation_(
    newValue?: number[][],
  ): number[][] | null;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  protected override doClassValidation_(
    newValue?: number[][],
  ): number[][] | null | undefined {
    if (!newValue) {
      return null;
    }
    // Check if the new value is an array
    if (!Array.isArray(newValue)) {
      return null;
    }
    const newHeight = newValue.length;
    // The empty list is not an acceptable bitmap
    if (newHeight == 0) {
      return null;
    }

    // Check that the width matches the existing width of the image if it
    // already has a value.
    const newWidth = newValue[0].length;
    for (const row of newValue) {
      if (!Array.isArray(row)) {
        return null;
      }
      if (row.length !== newWidth) {
        return null;
      }
    }

    // Check if all contents of the arrays are either 0 or 1
    for (const row of newValue) {
      for (const cell of row) {
        if (cell !== 0 && cell !== 1) {
          return null;
        }
      }
    }
    return newValue;
  }

  /**
   * Called when a new value has been validated and is about to be set.
   *
   * @param newValue The value that's about to be set.
   */
  // eslint-disable-next-line
  protected override doValueUpdate_(newValue: number[][]) {
    super.doValueUpdate_(newValue);
    if (newValue) {
      this.imgHeight = newValue.length;
      this.imgWidth = newValue[0] ? newValue[0].length : 0;
      // If the field height is static, adjust the pixel size to fit.
      if (this.fieldHeight) {
        this.pixelSize = this.fieldHeight / this.imgHeight;
      } else {
        this.pixelSize = DEFAULT_PIXEL_SIZE;
      }
    }
    this.recomputeAriaContext();
  }

  /**
   * Show the bitmap editor dialog.
   *
   * @param e Optional mouse event that triggered the field to open, or
   *    undefined if triggered programmatically.
   */
  // eslint-disable-next-line
  protected override showEditor_(e?: Event) {
    const editor = this.dropdownCreate();
    Blockly.DropDownDiv.getContentDiv().appendChild(editor);
    Blockly.DropDownDiv.showPositionedByField(
      this,
      this.dropdownDispose.bind(this),
    );
    this.focusPixelAt(0);
    this.recomputeAriaContext();
  }

  /**
   * Updates the block display and editor dropdown when the field re-renders.
   */
  // eslint-disable-next-line
  protected override render_() {
    super.render_();

    if (!this.getValue()) {
      return;
    }

    if (this.blockDisplayPixels) {
      const display = this.blockDisplayPixels;
      this.forAllCells((r, c) => {
        const pixel = this.getPixel(r, c);
        display[r][c].style.fill = pixel
          ? this.pixelColours.filled
          : this.pixelColours.empty;
      });
    }
    if (this.editorPixels) {
      this.forAllCells((r, c) => {
        this.updateEditorPixelDisplay(r, c, this.getPixel(r, c));
      });
    }
  }

  override getAriaValue(): string | null {
    // Get a label for the bitmap's dimensions and the number of pixels that are on.
    const value = this.getValue();
    if (!value) {
      return null;
    }
    const height = value.length;
    const width = value[0].length;
    let onCount = 0;
    for (const row of value) {
      for (const cell of row) {
        if (cell === 1) {
          onCount++;
        }
      }
    }

    return (Blockly.Msg['FIELD_BITMAP_ARIA_VALUE'] ?? '%1 by %2, %3 pixels on')
      .replace('%1', String(width))
      .replace('%2', String(height))
      .replace('%3', String(onCount));
  }

  /**
   * Determines whether the field is editable.
   *
   * @returns True since it is always editable.
   */
  override updateEditable() {
    const editable = super.updateEditable();
    // Blockly.Field's implementation sets these classes as appropriate, but
    // since this field has no text they just mess up the rendering of the grid
    // lines.
    const svgRoot = this.getSvgRoot();
    if (svgRoot) {
      Blockly.utils.dom.removeClass(svgRoot, 'blocklyNonEditableField');
      Blockly.utils.dom.removeClass(svgRoot, 'blocklyEditableField');
    }
    return editable;
  }

  /**
   * Gets the rectangle built out of dimensions matching SVG's <g> element.
   *
   * @returns The newly created rectangle of same size as the SVG element.
   */
  override getScaledBBox() {
    const boundingBox = this.getSvgRoot()?.getBoundingClientRect();
    if (!boundingBox) {
      throw new Error('Tried to retrieve a bounding box without a rect');
    }
    return new Blockly.utils.Rect(
      boundingBox.top,
      boundingBox.bottom,
      boundingBox.left,
      boundingBox.right,
    );
  }

  /**
   * Creates the bitmap editor and add event listeners.
   *
   * @returns The newly created dropdown menu.
   */
  private dropdownCreate() {
    const dropdownEditor = this.createElementWithClassname(
      'div',
      'dropdownEditor',
    );
    if (this.buttonOptions.randomize || this.buttonOptions.clear) {
      dropdownEditor.classList.add('has-buttons');
    }

    // This prevents the normal max-height from adding a scroll bar for large images.
    Blockly.DropDownDiv.getContentDiv().classList.add('contains-bitmap-editor');

    this.bindEvent(dropdownEditor, 'pointermove', this.onPointerMove);
    this.bindEvent(dropdownEditor, 'pointerup', this.onPointerEnd);
    this.bindEvent(dropdownEditor, 'pointerleave', this.onPointerEnd);
    this.bindEvent(dropdownEditor, 'pointerdown', this.onPointerStart);
    this.bindEvent(dropdownEditor, 'pointercancel', this.onPointerEnd);
    // Stop the browser from handling touch events and cancelling the event.
    this.bindEvent(dropdownEditor, 'touchmove', (e: Event) => {
      e.preventDefault();
    });

    const rtl = !!this.getSourceBlock()?.workspace.RTL;
    this.pixelGrid = this.createPixelGrid(rtl);
    dropdownEditor.appendChild(this.pixelGrid);

    // Add control buttons below the pixel grid
    if (this.buttonOptions.randomize) {
      this.addControlButton(
        dropdownEditor,
        // For backwards compatibility, use the old message if it exists, otherwise use the new message.
        Blockly.Msg['BUTTON_LABEL_RANDOMIZE'] ??
          Blockly.Msg['FIELD_BITMAP_BUTTON_LABEL_RANDOMIZE'],
        this.randomizePixels,
      );
    }
    if (this.buttonOptions.clear) {
      this.addControlButton(
        dropdownEditor,
        // For backwards compatibility, use the old message if it exists, otherwise use the new message.
        Blockly.Msg['BUTTON_LABEL_CLEAR'] ??
          Blockly.Msg['FIELD_BITMAP_BUTTON_LABEL_CLEAR'],
        this.clearPixels,
      );
    }

    // Store the initial value at the start of the edit.
    this.initialValue = this.getValue();

    return dropdownEditor;
  }

  /**
   * Builds the accessible pixel grid DOM.
   *
   * @param rtl Whether the workspace is RTL.
   * @returns The grid root element.
   */
  private createPixelGrid(rtl: boolean): HTMLDivElement {
    const grid = document.createElement('div');
    grid.className = 'bitmapPixelGrid';
    grid.tabIndex = 0;
    Blockly.utils.aria.setRole(grid, Blockly.utils.aria.Role.GRID);
    grid.style.setProperty('--bitmap-columns', `${this.imgWidth}`);

    this.boundEvents.push(
      Blockly.browserEvents.bind(grid, 'keydown', this, (e: KeyboardEvent) => {
        this.onPixelGridKeyDown(e, rtl);
      }),
    );

    this.editorPixels = [];
    for (let r = 0; r < this.imgHeight; r++) {
      const row = document.createElement('div');
      row.className = 'bitmapPixelRow';
      Blockly.utils.aria.setRole(row, Blockly.utils.aria.Role.ROW);
      grid.appendChild(row);

      this.editorPixels.push([]);
      for (let c = 0; c < this.imgWidth; c++) {
        const cell = document.createElement('div');
        Blockly.utils.aria.setRole(cell, Blockly.utils.aria.Role.GRIDCELL);

        const button = document.createElement('button');
        button.type = 'button';
        button.id = Blockly.utils.idGenerator.getNextUniqueId();
        button.className = 'pixelButton';
        button.setAttribute('data-row', r.toString());
        button.setAttribute('data-col', c.toString());
        // Keyboard activation is handled on the grid; avoid a second toggle
        // from the native button click after pointer paint.
        button.addEventListener('click', (e) => e.preventDefault());

        cell.appendChild(button);
        row.appendChild(cell);
        this.editorPixels[r].push(button);
        this.updateEditorPixelDisplay(r, c, this.getPixel(r, c));
      }
    }
    return grid;
  }

  /**
   * Handles keyboard navigation and activation inside the pixel grid.
   *
   * @param e The keydown event.
   * @param rtl Whether the workspace is RTL.
   */
  private onPixelGridKeyDown(e: KeyboardEvent, rtl: boolean) {
    if (
      !this.editorPixels ||
      e.shiftKey ||
      e.ctrlKey ||
      e.metaKey ||
      e.altKey
    ) {
      return;
    }

    const length = this.imgWidth * this.imgHeight;
    if (!length) return;

    if (this.focusedPixelIndex < 0) {
      this.focusedPixelIndex = 0;
    }

    switch (e.key) {
      case 'ArrowUp':
      case 'ArrowDown':
      case 'ArrowLeft':
      case 'ArrowRight': {
        const next = this.getNextPixelIndex(this.focusedPixelIndex, e.key, rtl);
        if (next === null) {
          (this.getSourceBlock()?.workspace as Blockly.WorkspaceSvg | null)
            ?.getAudioManager()
            .playErrorBeep();
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        this.focusPixelAt(next);
        break;
      }
      case 'PageUp':
      case 'Home':
        this.focusPixelAt(0);
        break;
      case 'PageDown':
      case 'End':
        this.focusPixelAt(length - 1);
        break;
      case 'Enter':
      case ' ':
      case 'Space': {
        const [r, c] = this.indexToCoords(this.focusedPixelIndex);
        this.togglePixel(r, c);
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      default:
        return;
    }
    e.preventDefault();
    e.stopPropagation();
  }

  /**
   * Returns the next pixel index for an arrow key, or null at hard edges.
   *
   * @param current Current focused index.
   * @param key Arrow key.
   * @param rtl Whether the workspace is RTL.
   * @returns Next index, or null if navigation should no-op.
   */
  private getNextPixelIndex(
    current: number,
    key: string,
    rtl: boolean,
  ): number | null {
    const col = current % this.imgWidth;
    const row = Math.floor(current / this.imgWidth);
    const length = this.imgWidth * this.imgHeight;

    let effectiveKey = key;
    if (rtl) {
      if (key === 'ArrowLeft') effectiveKey = 'ArrowRight';
      else if (key === 'ArrowRight') effectiveKey = 'ArrowLeft';
    }

    switch (effectiveKey) {
      case 'ArrowLeft':
        return col > 0 ? current - 1 : null;
      case 'ArrowRight':
        return col < this.imgWidth - 1 && current + 1 < length
          ? current + 1
          : null;
      case 'ArrowUp':
        return row > 0 ? current - this.imgWidth : null;
      case 'ArrowDown':
        return current + this.imgWidth < length
          ? current + this.imgWidth
          : null;
      default:
        return null;
    }
  }

  /**
   * Focuses the pixel button at the given row-major index.
   *
   * @param index Pixel index.
   */
  private focusPixelAt(index: number) {
    if (!this.editorPixels || !this.pixelGrid) return;
    const length = this.imgWidth * this.imgHeight;
    if (index < 0 || index >= length) return;

    this.focusedPixelIndex = index;
    const [r, c] = this.indexToCoords(index);
    const button = this.editorPixels[r][c];
    button.focus({preventScroll: true});
    Blockly.utils.aria.setState(
      this.pixelGrid,
      Blockly.utils.aria.State.ACTIVEDESCENDANT,
      button.id,
    );
  }

  /**
   * Converts a pixel index to coordinates.
   *
   * @param index Pixel index.
   * @returns Row and column.
   */
  private indexToCoords(index: number): [number, number] {
    return [Math.floor(index / this.imgWidth), index % this.imgWidth];
  }

  /**
   * Builds an accessible label for a pixel cell.
   *
   * @param r Row index (0-based).
   * @param c Column index (0-based).
   * @param pixelValue Pixel value (0 or 1).
   * @returns Localized aria label.
   */
  private getPixelAriaLabel(r: number, c: number, pixelValue: number): string {
    const state = pixelValue
      ? (Blockly.Msg['FIELD_BITMAP_PIXEL_ON'] ?? 'on')
      : (Blockly.Msg['FIELD_BITMAP_PIXEL_OFF'] ?? 'off');
    return (Blockly.Msg['FIELD_BITMAP_PIXEL_LABEL'] ?? '%1, row %2, column %3')
      .replace('%1', state)
      .replace('%2', String(r + 1))
      .replace('%3', String(c + 1));
  }

  /**
   * Toggles a pixel and updates the editor presentation.
   *
   * @param r Row index.
   * @param c Column index.
   * @returns The new pixel value.
   */
  private togglePixel(r: number, c: number): number {
    const newPixelValue = 1 - this.getPixel(r, c);
    this.setPixel(r, c, newPixelValue);
    return newPixelValue;
  }

  /**
   * Syncs one editor pixel's colour, pressed state, and aria label.
   *
   * @param r Row index.
   * @param c Column index.
   * @param pixelValue Pixel value (0 or 1).
   */
  private updateEditorPixelDisplay(r: number, c: number, pixelValue: number) {
    const button = this.editorPixels?.[r]?.[c];
    if (!button) return;
    button.style.background = pixelValue
      ? this.pixelColours.filled
      : this.pixelColours.empty;
    button.setAttribute('aria-pressed', String(!!pixelValue));
    Blockly.utils.aria.setState(
      button,
      Blockly.utils.aria.State.LABEL,
      this.getPixelAriaLabel(r, c, pixelValue),
    );
  }

  /**
   * Initializes the on-block display.
   */
  override initView() {
    this.createBorderRect_();
    // Invisible fill so the rect only provides keyboard-nav focus stroke.
    this.getBorderRect().style.fill = 'none';
    // Don't intercept clicks meant for the pixel rects beneath.
    this.getBorderRect().style.pointerEvents = 'none';
    if (this.fieldGroup_) {
      Blockly.utils.dom.addClass(this.fieldGroup_, 'blocklyField');
    }
    this.blockDisplayPixels = [];
    for (let r = 0; r < this.imgHeight; r++) {
      const row = [];
      for (let c = 0; c < this.imgWidth; c++) {
        const square = Blockly.utils.dom.createSvgElement(
          'rect',
          {
            x: c * this.pixelSize,
            y: r * this.pixelSize,
            width: this.pixelSize,
            height: this.pixelSize,
            fill: this.pixelColours.empty,
            fill_opacity: 1, // eslint-disable-line
          },
          this.getSvgRoot(),
        );
        row.push(square);
      }
      this.blockDisplayPixels.push(row);
    }
    // SVG strokes are centered on the path; paint the border above the
    // pixels so the inner half of the focus ring isn't covered.
    this.getSvgRoot()?.appendChild(this.getBorderRect());
    this.recomputeAriaContext();
  }

  /**
   * Updates the size of the block based on the size of the underlying image.
   */
  // eslint-disable-next-line
  protected override updateSize_() {
    {
      const newWidth = this.pixelSize * this.imgWidth;
      const newHeight = this.pixelSize * this.imgHeight;
      if (this.borderRect_) {
        this.borderRect_.setAttribute('width', String(newWidth));
        this.borderRect_.setAttribute('height', String(newHeight));
      }

      this.size_.width = newWidth;
      this.size_.height = newHeight;
    }
  }

  /**
   * Create control button.
   *
   * @param parent Parent HTML element to which control button will be added.
   * @param buttonText Text of the control button.
   * @param onClick Callback that will be attached to the control button.
   */
  private addControlButton(
    parent: HTMLElement,
    buttonText: string,
    onClick: () => void,
  ) {
    const button = this.createElementWithClassname('button', 'controlButton');
    button.innerText = buttonText;
    parent.appendChild(button);
    this.bindEvent(button, 'click', onClick);
  }

  /**
   * Disposes of events belonging to the bitmap editor.
   */
  private dropdownDispose() {
    if (
      this.getSourceBlock() &&
      this.initialValue !== null &&
      this.initialValue !== this.getValue()
    ) {
      Blockly.Events.fire(
        new (Blockly.Events.get(Blockly.Events.BLOCK_CHANGE))(
          this.sourceBlock_,
          'field',
          this.name || null,
          this.initialValue,
          this.getValue(),
        ),
      );
    }

    for (const event of this.boundEvents) {
      Blockly.browserEvents.unbind(event);
    }
    this.boundEvents.length = 0;
    // Keep aria-expanded accurate on later recomputes.
    this.pixelGrid = null;
    this.editorPixels = null;
    this.focusedPixelIndex = -1;
    this.pointerIsDown = false;
    this.valToPaintWith = undefined;
    this.initialValue = null;

    Blockly.DropDownDiv.getContentDiv().classList.remove(
      'contains-bitmap-editor',
    );
    this.recomputeAriaContext();
  }

  /**
   * Constructs an array of zeros with the specified width and height.
   *
   * @returns The new value.
   */
  private getEmptyArray(): number[][] {
    const newVal: number[][] = [];
    for (let r = 0; r < this.imgHeight; r++) {
      newVal.push([]);
      for (let c = 0; c < this.imgWidth; c++) {
        newVal[r].push(0);
      }
    }
    return newVal;
  }

  /**
   * Toggles the pixel under the pointer and starts a drag-paint gesture.
   *
   * @param e The down event.
   */
  private onPointerStart(e: PointerEvent) {
    if (e.button !== 0) return;
    const pixelCoords = this.getPixelCoordsFromElement(e.target as Element);
    if (pixelCoords) {
      const newPixelValue = this.togglePixel(pixelCoords.r, pixelCoords.c);
      this.pointerIsDown = true;
      this.valToPaintWith = newPixelValue;
      this.focusPixelAt(pixelCoords.r * this.imgWidth + pixelCoords.c);
      // Keep receiving move/up outside the editor so drag-paint can continue
      // (and pointerleave does not end the gesture).
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      e.preventDefault();
    }
  }

  /**
   * Moves focus (and paints when dragging) as the pointer moves over pixels.
   *
   * @param e The move event.
   */
  private onPointerMove(e: PointerEvent) {
    // Same guard as field-grid-dropdown: ignore moves with no pointer delta
    // (e.g. content scrolled under a still pointer).
    if (!(e.movementX || e.movementY)) {
      return;
    }
    const currentElement = document.elementFromPoint(e.clientX, e.clientY);
    const pixelCoords = this.getPixelCoordsFromElement(currentElement);
    if (pixelCoords) {
      this.focusPixelAt(pixelCoords.r * this.imgWidth + pixelCoords.c);
      if (this.pointerIsDown) {
        this.updatePixelValue(pixelCoords.r, pixelCoords.c);
      }
    }
    if (this.pointerIsDown) {
      e.preventDefault();
    }
  }

  /**
   * Reads row/column indices from a pixel button or a descendant.
   *
   * @param element Element under the pointer.
   * @returns Row and column, or null if not a pixel.
   */
  private getPixelCoordsFromElement(
    element: Element | null,
  ): {r: number; c: number} | null {
    const pixelButton = element?.closest('.pixelButton');
    const rowIndex = pixelButton?.getAttribute('data-row');
    const colIndex = pixelButton?.getAttribute('data-col');
    if (rowIndex == null || colIndex == null) {
      return null;
    }
    return {r: parseInt(rowIndex), c: parseInt(colIndex)};
  }

  /**
   * Sets the specified pixel in the editor to the current value being painted.
   *
   * @param r Row number of grid.
   * @param c Column number of grid.
   */
  private updatePixelValue(r: number, c: number) {
    if (
      this.valToPaintWith !== undefined &&
      this.getPixel(r, c) !== this.valToPaintWith
    ) {
      this.setPixel(r, c, this.valToPaintWith);
    }
  }

  /**
   * Resets pointer state (e.g. After either a pointerup event or if the
   * gesture is canceled).
   *
   * @param e The pointer event that ended the gesture, when available.
   */
  private onPointerEnd(e?: PointerEvent) {
    if (
      e &&
      e.currentTarget instanceof HTMLElement &&
      e.currentTarget.hasPointerCapture?.(e.pointerId)
    ) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    this.pointerIsDown = false;
    this.valToPaintWith = undefined;
  }

  /**
   * Sets all the pixels in the image to a random value.
   */
  private randomizePixels() {
    const getRandBinary = () => Math.floor(Math.random() * 2);
    this.forAllCells((r, c) => {
      this.setPixel(r, c, getRandBinary());
    });
  }

  /**
   * Sets all the pixels to 0.
   */
  private clearPixels() {
    const cleared = this.getEmptyArray();
    this.fireIntermediateChangeEvent(cleared);
    this.setValue(cleared, false);
    this.forAllCells((r, c) => {
      this.updateEditorPixelDisplay(r, c, 0);
    });
  }

  /**
   * Sets the value of a particular pixel.
   *
   * @param r Row number of grid.
   * @param c Column number of grid.
   * @param newValue Value of the pixel.
   */
  private setPixel(r: number, c: number, newValue: number) {
    const newGrid = JSON.parse(JSON.stringify(this.getValue()));
    newGrid[r][c] = newValue;
    this.fireIntermediateChangeEvent(newGrid);
    this.setValue(newGrid, false);
    this.updateEditorPixelDisplay(r, c, newValue);
  }

  private getPixel(row: number, column: number): number {
    const value = this.getValue();
    if (!value) {
      throw new Error(
        'Attempted to retrieve a pixel value when no value is set',
      );
    }

    return value[row][column];
  }

  /**
   * Calls a given function for all cells in the image, with the cell
   * coordinates as the arguments.
   *
   * @param func A function to be applied.
   */
  private forAllCells(func: (row: number, col: number) => void) {
    for (let r = 0; r < this.imgHeight; r++) {
      for (let c = 0; c < this.imgWidth; c++) {
        func(r, c);
      }
    }
  }

  /**
   * Creates a new element with the specified type and class.
   *
   * @param elementType Type of html element.
   * @param className ClassName of html element.
   * @returns The created element.
   */
  private createElementWithClassname(elementType: string, className: string) {
    const newElt = document.createElement(elementType);
    newElt.className = className;
    return newElt;
  }

  /**
   * Binds an event listener to the specified element.
   *
   * @param element Specified element.
   * @param eventName Name of the event to bind.
   * @param callback Function to be called on specified event.
   */
  private bindEvent(
    element: HTMLElement,
    eventName: string,
    callback: (e: PointerEvent) => void,
  ) {
    this.boundEvents.push(
      Blockly.browserEvents.bind(element, eventName, this, callback),
    );
  }

  private fireIntermediateChangeEvent(newValue: number[][]) {
    if (this.getSourceBlock()) {
      Blockly.Events.fire(
        new (Blockly.Events.get(
          Blockly.Events.BLOCK_FIELD_INTERMEDIATE_CHANGE,
        ))(this.getSourceBlock(), this.name || null, this.getValue(), newValue),
      );
    }
  }
}

interface Buttons {
  readonly randomize: boolean;
  readonly clear: boolean;
}
interface PixelColours {
  readonly empty: string;
  readonly filled: string;
}

export interface FieldBitmapFromJsonConfig extends Blockly.FieldConfig {
  value?: number[][];
  width?: number;
  height?: number;
  buttons?: Buttons;
  fieldHeight?: number;
  colours?: PixelColours;
}

Blockly.fieldRegistry.register('field_bitmap', FieldBitmap);

/**
 * CSS for bitmap field.
 */
Blockly.Css.register(`
.dropdownEditor {
  align-items: center;
  flex-direction: column;
  display: flex;
  justify-content: center;
}
.dropdownEditor.has-buttons {
  margin-bottom: 20px;
}
.bitmapPixelGrid {
  display: grid;
  margin: 20px;
  grid-template-columns: repeat(var(--bitmap-columns), min-content);
}
.bitmapPixelRow {
  display: contents;
}
.bitmapPixelGrid [role="gridcell"] {
  padding: 0;
  margin: 0;
  line-height: 0;
}
.pixelButton {
  width: ${DEFAULT_PIXEL_SIZE}px;
  height: ${DEFAULT_PIXEL_SIZE}px;
  border: 1px solid #000;
  cursor: pointer;
}
.pixelButton:focus {
  outline: var(--blockly-selection-width) solid var(--blockly-active-node-color);
  outline-offset: -2px;
  box-shadow: none;
  position: relative;
  z-index: 1;
}
.controlButton {
  margin: 5px 0;
}
.blocklyDropDownContent.contains-bitmap-editor {
  max-height: none;
}
`);
