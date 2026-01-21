/**
 * @license
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Dropdown input field.  Used for editable titles and variables.
 * In the interests of a consistent UI, the toolbox shares some functions and
 * properties with the context menu.
 *
 * @class
 */
// Former goog.module ID: Blockly.FieldDropdown

import type {BlockSvg} from './block_svg.js';
import * as dropDownDiv from './dropdowndiv.js';
import {
  Field,
  FieldConfig,
  FieldValidator,
  UnattachedFieldError,
} from './field.js';
import * as fieldRegistry from './field_registry.js';
import {Menu} from './menu.js';
import {MenuSeparator} from './menu_separator.js';
import {MenuItem} from './menuitem.js';
import * as aria from './utils/aria.js';
import {Coordinate} from './utils/coordinate.js';
import * as dom from './utils/dom.js';
import * as parsing from './utils/parsing.js';
import {Size} from './utils/size.js';
import * as utilsString from './utils/string.js';
import {Svg} from './utils/svg.js';

/**
 * Class for an editable dropdown field.
 */
export class FieldDropdown extends Field<string> {
  /**
   * Magic constant used to represent a separator in a list of dropdown items.
   */
  static readonly SEPARATOR = 'separator';

  static ARROW_CHAR = '▾';

  /** A reference to the currently selected menu item. */
  private selectedMenuItem: MenuItem | null = null;

  /** The dropdown menu. */
  protected menu_: Menu | null = null;

  /**
   * SVG image element if currently selected option is an image, or null.
   */
  private imageElement: SVGImageElement | null = null;

  /** Tspan based arrow element. */
  private arrow: SVGTSpanElement | null = null;

  /** SVG based arrow element. */
  private svgArrow: SVGElement | null = null;

  /**
   * Serializable fields are saved by the serializer, non-serializable fields
   * are not. Editable fields should also be serializable.
   */
  override SERIALIZABLE = true;

  protected menuGenerator_?: MenuGenerator;

  /** A cache of the most recently generated options. */
  private generatedOptions: MenuOption[] | null = null;

  /**
   * The prefix field label, of common words set after options are trimmed.
   *
   * @internal
   */
  override prefixField: string | null = null;

  /**
   * The suffix field label, of common words set after options are trimmed.
   *
   * @internal
   */
  override suffixField: string | null = null;
  // TODO(b/109816955): remove '!', see go/strict-prop-init-fix.
  private selectedOption!: MenuOption;
  override clickTarget_: SVGElement | null = null;

  /**
   * The y offset from the top of the field to the top of the image, if an image
   * is selected.
   */
  protected static IMAGE_Y_OFFSET = 5;

  /** The total vertical padding above and below an image. */
  protected static IMAGE_Y_PADDING = FieldDropdown.IMAGE_Y_OFFSET * 2;

  /**
   * @param menuGenerator A non-empty array of options for a dropdown list, or a
   *     function which generates these options. Also accepts Field.SKIP_SETUP
   *     if you wish to skip setup (only used by subclasses that want to handle
   *     configuration and setting the field value after their own constructors
   *     have run).
   * @param validator A function that is called to validate changes to the
   *     field's value. Takes in a language-neutral dropdown option & returns a
   *     validated language-neutral dropdown option, or null to abort the
   *     change.
   * @param config A map of options used to configure the field.
   *     See the [field creation documentation]{@link
   * https://developers.google.com/blockly/guides/create-custom-blocks/fields/built-in-fields/dropdown#creation}
   * for a list of properties this parameter supports.
   * @throws {TypeError} If `menuGenerator` options are incorrectly structured.
   */
  constructor(
    menuGenerator: MenuGenerator,
    validator?: FieldDropdownValidator,
    config?: FieldDropdownConfig,
  );
  constructor(menuGenerator: typeof Field.SKIP_SETUP);
  constructor(
    menuGenerator: MenuGenerator | typeof Field.SKIP_SETUP,
    validator?: FieldDropdownValidator,
    config?: FieldDropdownConfig,
  ) {
    super(Field.SKIP_SETUP);

    // If we pass SKIP_SETUP, don't do *anything* with the menu generator.
    if (menuGenerator === Field.SKIP_SETUP) return;

    this.setOptions(menuGenerator);

    if (config) {
      this.configure_(config);
    }
    if (validator) {
      this.setValidator(validator);
    }
  }

  /**
   * Sets the field's value based on the given XML element. Should only be
   * called by Blockly.Xml.
   *
   * @param fieldElement The element containing info about the field's state.
   * @internal
   */
  override fromXml(fieldElement: Element) {
    if (this.isOptionListDynamic()) {
      this.getOptions(false);
    }
    this.setValue(fieldElement.textContent);
  }

  /**
   * Sets the field's value based on the given state.
   *
   * @param state The state to apply to the dropdown field.
   * @internal
   */
  override loadState(state: AnyDuringMigration) {
    if (this.loadLegacyState(FieldDropdown, state)) {
      return;
    }
    if (this.isOptionListDynamic()) {
      this.getOptions(false);
    }
    this.setValue(state);
  }

  /**
   * Create the block UI for this dropdown.
   */
  override initView() {
    if (this.shouldAddBorderRect_()) {
      this.createBorderRect_();
    } else {
      this.clickTarget_ = (this.sourceBlock_ as BlockSvg).getSvgRoot();
    }
    this.createTextElement_();

    this.imageElement = dom.createSvgElement(Svg.IMAGE, {}, this.fieldGroup_);

    if (this.getConstants()!.FIELD_DROPDOWN_SVG_ARROW) {
      this.createSVGArrow_();
    } else {
      this.createTextArrow_();
    }

    if (this.borderRect_) {
      dom.addClass(this.borderRect_, 'blocklyDropdownRect');
    }

    if (this.fieldGroup_) {
      dom.addClass(this.fieldGroup_, 'blocklyField');
      dom.addClass(this.fieldGroup_, 'blocklyDropdownField');
    }
  }

  /**
   * Whether or not the dropdown should add a border rect.
   *
   * @returns True if the dropdown field should add a border rect.
   */
  protected shouldAddBorderRect_(): boolean {
    return (
      !this.getConstants()!.FIELD_DROPDOWN_NO_BORDER_RECT_SHADOW ||
      (this.getConstants()!.FIELD_DROPDOWN_NO_BORDER_RECT_SHADOW &&
        !this.getSourceBlock()?.isShadow())
    );
  }

  /** Create a tspan based arrow. */
  protected createTextArrow_() {
    this.arrow = dom.createSvgElement(Svg.TSPAN, {}, this.textElement_);
    this.arrow!.appendChild(
      document.createTextNode(
        this.getSourceBlock()?.RTL
          ? FieldDropdown.ARROW_CHAR + ' '
          : ' ' + FieldDropdown.ARROW_CHAR,
      ),
    );
    if (this.getConstants()!.FIELD_TEXT_BASELINE_CENTER) {
      this.arrow.setAttribute('dominant-baseline', 'central');
    }
    if (this.getSourceBlock()?.RTL) {
      this.getTextElement().insertBefore(this.arrow, this.textContent_);
    } else {
      this.getTextElement().appendChild(this.arrow);
    }
  }

  /** Create an SVG based arrow. */
  protected createSVGArrow_() {
    this.svgArrow = dom.createSvgElement(
      Svg.IMAGE,
      {
        'height': this.getConstants()!.FIELD_DROPDOWN_SVG_ARROW_SIZE + 'px',
        'width': this.getConstants()!.FIELD_DROPDOWN_SVG_ARROW_SIZE + 'px',
      },
      this.fieldGroup_,
    );
    this.svgArrow!.setAttributeNS(
      dom.XLINK_NS,
      'xlink:href',
      this.getConstants()!.FIELD_DROPDOWN_SVG_ARROW_DATAURI,
    );
  }

  /**
   * Create a dropdown menu under the text.
   *
   * @param e Optional mouse event that triggered the field to open, or
   *     undefined if triggered programmatically.
   */
  protected override showEditor_(e?: MouseEvent) {
    const block = this.getSourceBlock();
    if (!block) {
      throw new UnattachedFieldError();
    }
    this.dropdownCreate();
    if (!this.menu_) return;

    if (e && typeof e.clientX === 'number') {
      this.menu_.openingCoords = new Coordinate(e.clientX, e.clientY);
    } else {
      this.menu_.openingCoords = null;
    }

    // Remove any pre-existing elements in the dropdown.
    dropDownDiv.clearContent();
    // Element gets created in render.
    const menuElement = this.menu_.render(dropDownDiv.getContentDiv());
    dom.addClass(menuElement, 'blocklyDropdownMenu');

    if (this.getConstants()!.FIELD_DROPDOWN_COLOURED_DIV) {
      const primaryColour = block.getColour();
      const borderColour = (this.sourceBlock_ as BlockSvg).getColourTertiary();
      dropDownDiv.setColour(primaryColour, borderColour);
    }

    dropDownDiv.showPositionedByField(this, this.dropdownDispose_.bind(this));

    dropDownDiv.getContentDiv().style.height = `${this.menu_.getSize().height}px`;

    // Focusing needs to be handled after the menu is rendered and positioned.
    // Otherwise it will cause a page scroll to get the misplaced menu in
    // view. See issue #1329.
    this.menu_.focus();

    if (this.selectedMenuItem) {
      this.menu_.setHighlighted(this.selectedMenuItem);
    }

    this.applyColour();
  }

  /** Create the dropdown editor. */
  private dropdownCreate() {
    const block = this.getSourceBlock();
    if (!block) {
      throw new UnattachedFieldError();
    }
    const menu = new Menu();
    menu.setRole(aria.Role.LISTBOX);
    this.menu_ = menu;

    const options = this.getOptions(false);
    this.selectedMenuItem = null;
    for (let i = 0; i < options.length; i++) {
      const option = options[i];
      if (option === FieldDropdown.SEPARATOR) {
        menu.addChild(new MenuSeparator());
        continue;
      }

      const [label, value] = option;
      const content = (() => {
        if (isImageProperties(label)) {
          // Convert ImageProperties to an HTMLImageElement.
          const image = new Image(label.width, label.height);
          image.src = label.src;
          image.alt = label.alt;
          return image;
        }
        return label;
      })();
      const menuItem = new MenuItem(content, value);
      menuItem.setRole(aria.Role.OPTION);
      menuItem.setRightToLeft(block.RTL);
      menuItem.setCheckable(true);
      menu.addChild(menuItem);
      menuItem.setChecked(value === this.value_);
      if (value === this.value_) {
        this.selectedMenuItem = menuItem;
      }
      menuItem.onAction(this.handleMenuActionEvent, this);
    }
  }

  /**
   * Disposes of events and DOM-references belonging to the dropdown editor.
   */
  protected dropdownDispose_() {
    if (this.menu_) {
      this.menu_.dispose();
    }
    this.menu_ = null;
    this.selectedMenuItem = null;
    this.applyColour();
  }

  /**
   * Handle an action in the dropdown menu.
   *
   * @param menuItem The MenuItem selected within menu.
   */
  private handleMenuActionEvent(menuItem: MenuItem) {
    dropDownDiv.hideIfOwner(this, true);
    this.onItemSelected_(this.menu_ as Menu, menuItem);
  }

  /**
   * Handle the selection of an item in the dropdown menu.
   *
   * @param menu The Menu component clicked.
   * @param menuItem The MenuItem selected within menu.
   */
  protected onItemSelected_(menu: Menu, menuItem: MenuItem) {
    this.setValue(menuItem.getValue());
  }

  /**
   * @returns True if the option list is generated by a function.
   *     Otherwise false.
   */
  isOptionListDynamic(): boolean {
    return typeof this.menuGenerator_ === 'function';
  }

  /**
   * Return a list of the options for this dropdown.
   *
   * @param useCache For dynamic options, whether or not to use the cached
   *     options or to re-generate them.
   * @returns A non-empty array of option tuples:
   *     (human-readable text or image, language-neutral name).
   * @throws {TypeError} If generated options are incorrectly structured.
   */
  getOptions(useCache?: boolean): MenuOption[] {
    if (!this.menuGenerator_) {
      // A subclass improperly skipped setup without defining the menu
      // generator.
      throw TypeError('A menu generator was never defined.');
    }
    if (Array.isArray(this.menuGenerator_)) return this.menuGenerator_;
    if (useCache && this.generatedOptions) return this.generatedOptions;

    this.generatedOptions = this.menuGenerator_();
    this.validateOptions(this.generatedOptions);
    return this.generatedOptions;
  }

  /**
   * Update the options on this dropdown. This will reset the selected item to
   * the first item in the list.
   *
   * @param menuGenerator The array of options or a generator function.
   */
  setOptions(menuGenerator: MenuGenerator) {
    if (Array.isArray(menuGenerator)) {
      this.validateOptions(menuGenerator);
      const trimmed = this.trimOptions(menuGenerator);
      this.menuGenerator_ = trimmed.options;
      this.prefixField = trimmed.prefix || null;
      this.suffixField = trimmed.suffix || null;
    } else {
      this.menuGenerator_ = menuGenerator;
    }
    // The currently selected option. The field is initialized with the
    // first option selected.
    this.selectedOption = this.getOptions(false)[0];
    this.setValue(this.selectedOption[1]);
  }

  /**
   * Ensure that the input value is a valid language-neutral option.
   *
   * @param newValue The input value.
   * @returns A valid language-neutral option, or null if invalid.
   */
  protected override doClassValidation_(
    newValue: string,
  ): string | null | undefined;
  protected override doClassValidation_(newValue?: string): string | null;
  protected override doClassValidation_(
    newValue?: string,
  ): string | null | undefined {
    const options = this.getOptions(true);
    const isValueValid = options.some((option) => option[1] === newValue);

    if (!isValueValid) {
      if (this.sourceBlock_) {
        console.warn(
          "Cannot set the dropdown's value to an unavailable option." +
            ' Block type: ' +
            this.sourceBlock_.type +
            ', Field name: ' +
            this.name +
            ', Value: ' +
            newValue,
        );
      }
      return null;
    }
    return newValue;
  }

  /**
   * Update the value of this dropdown field.
   *
   * @param newValue The value to be saved. The default validator guarantees
   *     that this is one of the valid dropdown options.
   */
  protected override doValueUpdate_(newValue: string) {
    super.doValueUpdate_(newValue);
    const options = this.getOptions(true);
    for (let i = 0, option; (option = options[i]); i++) {
      if (option[1] === this.value_) {
        this.selectedOption = option;
      }
    }
  }

  /**
   * Updates the dropdown arrow to match the colour/style of the block.
   */
  override applyColour() {
    const sourceBlock = this.sourceBlock_ as BlockSvg;
    if (this.borderRect_) {
      this.borderRect_.setAttribute('stroke', sourceBlock.getColourTertiary());
      if (this.menu_) {
        this.borderRect_.setAttribute('fill', sourceBlock.getColourTertiary());
      } else {
        this.borderRect_.setAttribute('fill', 'transparent');
      }
    }
    // Update arrow's colour.
    if (sourceBlock && this.arrow) {
      if (sourceBlock.isShadow()) {
        this.arrow.style.fill = sourceBlock.getColourSecondary();
      } else {
        this.arrow.style.fill = sourceBlock.getColour();
      }
    }
  }

  /** Draws the border with the correct width. */
  protected override render_() {
    // Hide both elements.
    this.getTextContent().nodeValue = '';
    this.imageElement!.style.display = 'none';

    // Show correct element.
    const option = this.selectedOption && this.selectedOption[0];
    if (isImageProperties(option)) {
      this.renderSelectedImage(option);
    } else {
      this.renderSelectedText();
    }

    this.positionBorderRect_();
  }

  /**
   * Renders the selected option, which must be an image.
   *
   * @param imageJson Selected option that must be an image.
   */
  private renderSelectedImage(imageJson: ImageProperties) {
    const block = this.getSourceBlock();
    if (!block) {
      throw new UnattachedFieldError();
    }
    this.imageElement!.style.display = '';
    this.imageElement!.setAttributeNS(
      dom.XLINK_NS,
      'xlink:href',
      imageJson.src,
    );
    this.imageElement!.setAttribute('height', String(imageJson.height));
    this.imageElement!.setAttribute('width', String(imageJson.width));

    const imageHeight = Number(imageJson.height);
    const imageWidth = Number(imageJson.width);

    // Height and width include the border rect.
    const hasBorder = !!this.borderRect_;
    const height = Math.max(
      hasBorder ? this.getConstants()!.FIELD_DROPDOWN_BORDER_RECT_HEIGHT : 0,
      imageHeight + FieldDropdown.IMAGE_Y_PADDING,
    );
    const xPadding = hasBorder
      ? this.getConstants()!.FIELD_BORDER_RECT_X_PADDING
      : 0;
    let arrowWidth = 0;
    if (this.svgArrow) {
      arrowWidth = this.positionSVGArrow(
        imageWidth + xPadding,
        height / 2 - this.getConstants()!.FIELD_DROPDOWN_SVG_ARROW_SIZE / 2,
      );
    } else {
      arrowWidth = dom.getTextWidth(this.arrow as SVGTSpanElement);
    }
    this.size_ = new Size(imageWidth + arrowWidth + xPadding * 2, height);

    let arrowX = 0;
    if (block.RTL) {
      const imageX = xPadding + arrowWidth;
      this.imageElement!.setAttribute('x', `${imageX}`);
    } else {
      arrowX = imageWidth + arrowWidth;
      this.getTextElement().setAttribute('text-anchor', 'end');
      this.imageElement!.setAttribute('x', `${xPadding}`);
    }
    this.imageElement!.setAttribute('y', String(height / 2 - imageHeight / 2));

    this.positionTextElement_(arrowX + xPadding, imageWidth + arrowWidth);
  }

  /** Renders the selected option, which must be text. */
  private renderSelectedText() {
    // Retrieves the selected option to display through getText_.
    this.getTextContent().nodeValue = this.getDisplayText_();
    const textElement = this.getTextElement();
    dom.addClass(textElement, 'blocklyDropdownText');
    textElement.setAttribute('text-anchor', 'start');

    // Height and width include the border rect.
    const hasBorder = !!this.borderRect_;
    const height = Math.max(
      hasBorder ? this.getConstants()!.FIELD_DROPDOWN_BORDER_RECT_HEIGHT : 0,
      this.getConstants()!.FIELD_TEXT_HEIGHT,
    );
    const textWidth = dom.getTextWidth(this.getTextElement());
    const xPadding = hasBorder
      ? this.getConstants()!.FIELD_BORDER_RECT_X_PADDING
      : 0;
    let arrowWidth = 0;
    if (this.svgArrow) {
      arrowWidth = this.positionSVGArrow(
        textWidth + xPadding,
        height / 2 - this.getConstants()!.FIELD_DROPDOWN_SVG_ARROW_SIZE / 2,
      );
    }
    this.size_ = new Size(textWidth + arrowWidth + xPadding * 2, height);

    this.positionTextElement_(xPadding, textWidth);
  }

  /**
   * Position a drop-down arrow at the appropriate location at render-time.
   *
   * @param x X position the arrow is being rendered at, in px.
   * @param y Y position the arrow is being rendered at, in px.
   * @returns Amount of space the arrow is taking up, in px.
   */
  private positionSVGArrow(x: number, y: number): number {
    if (!this.svgArrow) {
      return 0;
    }
    const block = this.getSourceBlock();
    if (!block) {
      throw new UnattachedFieldError();
    }
    const hasBorder = !!this.borderRect_;
    const xPadding = hasBorder
      ? this.getConstants()!.FIELD_BORDER_RECT_X_PADDING
      : 0;
    const textPadding = this.getConstants()!.FIELD_DROPDOWN_SVG_ARROW_PADDING;
    const svgArrowSize = this.getConstants()!.FIELD_DROPDOWN_SVG_ARROW_SIZE;
    const arrowX = block.RTL ? xPadding : x + textPadding;
    this.svgArrow.setAttribute(
      'transform',
      'translate(' + arrowX + ',' + y + ')',
    );
    return svgArrowSize + textPadding;
  }

  /**
   * Use the `getText_` developer hook to override the field's text
   * representation.  Get the selected option text.  If the selected option is
   * an image we return the image alt text. If the selected option is
   * an HTMLElement, return the title, ariaLabel, or innerText of the
   * element.
   *
   * If you use HTMLElement options in Node.js and call this function,
   * ensure that you are supplying an implementation of HTMLElement,
   * such as through jsdom-global.
   *
   * @returns Selected option text.
   */
  protected override getText_(): string | null {
    if (!this.selectedOption) {
      return null;
    }
    const option = this.selectedOption[0];
    if (isImageProperties(option)) {
      return option.alt;
    } else if (
      typeof HTMLElement !== 'undefined' &&
      option instanceof HTMLElement
    ) {
      return option.title ?? option.ariaLabel ?? option.innerText;
    } else if (typeof option === 'string') {
      return option;
    }

    console.warn(
      "Can't get text for existing dropdown option. If " +
        "you're using HTMLElement dropdown options in node, ensure you're " +
        'using jsdom-global or similar.',
    );
    return null;
  }

  /**
   * Construct a FieldDropdown from a JSON arg object.
   *
   * @param options A JSON object with options (options).
   * @returns The new field instance.
   * @nocollapse
   * @internal
   */
  static override fromJson(
    options: FieldDropdownFromJsonConfig,
  ): FieldDropdown {
    if (!options.options) {
      throw new Error(
        'options are required for the dropdown field. The ' +
          'options property must be assigned an array of ' +
          '[humanReadableValue, languageNeutralValue] tuples.',
      );
    }
    // `this` might be a subclass of FieldDropdown if that class doesn't
    // override the static fromJson method.
    return new this(options.options, undefined, options);
  }

  /**
   * Factor out common words in statically defined options.
   * Create prefix and/or suffix labels.
   */
  protected trimOptions(options: MenuOption[]): {
    options: MenuOption[];
    prefix?: string;
    suffix?: string;
  } {
    let hasNonTextContent = false;
    const trimmedOptions = options.map((option): MenuOption => {
      if (option === FieldDropdown.SEPARATOR) {
        hasNonTextContent = true;
        return option;
      }

      const [label, value] = option;
      if (typeof label === 'string') {
        return [parsing.replaceMessageReferences(label), value];
      }

      hasNonTextContent = true;
      // Copy the image properties so they're not influenced by the original.
      // NOTE: No need to deep copy since image properties are only 1 level deep.
      const imageLabel = isImageProperties(label)
        ? {...label, alt: parsing.replaceMessageReferences(label.alt)}
        : label;
      return [imageLabel, value];
    });

    if (hasNonTextContent || options.length < 2) {
      return {options: trimmedOptions};
    }

    const stringOptions = trimmedOptions as [string, string][];
    const stringLabels = stringOptions.map(([label]) => label);

    const shortest = utilsString.shortestStringLength(stringLabels);
    const prefixLength = utilsString.commonWordPrefix(stringLabels, shortest);
    const suffixLength = utilsString.commonWordSuffix(stringLabels, shortest);

    if (
      (!prefixLength && !suffixLength) ||
      shortest <= prefixLength + suffixLength
    ) {
      // One or more strings will entirely vanish if we proceed.  Abort.
      return {options: stringOptions};
    }

    const prefix = prefixLength
      ? stringLabels[0].substring(0, prefixLength - 1)
      : undefined;
    const suffix = suffixLength
      ? stringLabels[0].substr(1 - suffixLength)
      : undefined;
    return {
      options: this.applyTrim(stringOptions, prefixLength, suffixLength),
      prefix,
      suffix,
    };
  }

  /**
   * Use the calculated prefix and suffix lengths to trim all of the options in
   * the given array.
   *
   * @param options Array of option tuples:
   *     (human-readable text or image, language-neutral name).
   * @param prefixLength The length of the common prefix.
   * @param suffixLength The length of the common suffix
   * @returns A new array with all of the option text trimmed.
   */
  private applyTrim(
    options: [string, string][],
    prefixLength: number,
    suffixLength: number,
  ): MenuOption[] {
    return options.map(([text, value]) => [
      text.substring(prefixLength, text.length - suffixLength),
      value,
    ]);
  }

  /**
   * Validates the data structure to be processed as an options list.
   *
   * @param options The proposed dropdown options.
   * @throws {TypeError} If proposed options are incorrectly structured.
   */
  protected validateOptions(options: MenuOption[]) {
    if (!Array.isArray(options)) {
      throw TypeError('FieldDropdown options must be an array.');
    }
    if (!options.length) {
      throw TypeError('FieldDropdown options must not be an empty array.');
    }
    let foundError = false;
    for (let i = 0; i < options.length; i++) {
      const option = options[i];
      if (!Array.isArray(option) && option !== FieldDropdown.SEPARATOR) {
        foundError = true;
        console.error(
          `Invalid option[${i}]: Each FieldDropdown option must be an array or
          the string literal 'separator'. Found: ${option}`,
        );
      } else if (typeof option[1] !== 'string') {
        foundError = true;
        console.error(
          `Invalid option[${i}]: Each FieldDropdown option id must be a string.
          Found ${option[1]} in: ${option}`,
        );
      } else if (
        option[0] &&
        typeof option[0] !== 'string' &&
        !isImageProperties(option[0]) &&
        !(
          typeof HTMLElement !== 'undefined' && option[0] instanceof HTMLElement
        )
      ) {
        foundError = true;
        console.error(
          `Invalid option[${i}]: Each FieldDropdown option must have a string
          label, image description, or HTML element. Found ${option[0]} in: ${option}`,
        );
      }
    }
    if (foundError) {
      throw TypeError('Found invalid FieldDropdown options.');
    }
  }
}

/**
 * Returns whether or not an object conforms to the ImageProperties interface.
 *
 * @param obj The object to test.
 * @returns True if the object conforms to ImageProperties, otherwise false.
 */
function isImageProperties(obj: any): obj is ImageProperties {
  return (
    obj &&
    typeof obj === 'object' &&
    'src' in obj &&
    typeof obj.src === 'string' &&
    'alt' in obj &&
    typeof obj.alt === 'string' &&
    'width' in obj &&
    typeof obj.width === 'number' &&
    'height' in obj &&
    typeof obj.height === 'number'
  );
}

/**
 * Definition of a human-readable image dropdown option.
 */
export interface ImageProperties {
  src: string;
  alt: string;
  width: number;
  height: number;
}

/**
 * An individual option in the dropdown menu. Can be either the string literal
 * `separator` for a menu separator item, or an array for normal action menu
 * items. In the latter case, the first element is the human-readable value
 * (text, ImageProperties object, or HTML element), and the second element is
 * the language-neutral value.
 */
export type MenuOption =
  | [string | ImageProperties | HTMLElement, string]
  | 'separator';

/**
 * A function that generates an array of menu options for FieldDropdown
 * or its descendants.
 */
export type MenuGeneratorFunction = (this: FieldDropdown) => MenuOption[];

/**
 * Either an array of menu options or a function that generates an array of
 * menu options for FieldDropdown or its descendants.
 */
export type MenuGenerator = MenuOption[] | MenuGeneratorFunction;

/**
 * Config options for the dropdown field.
 */
export type FieldDropdownConfig = FieldConfig;

/**
 * fromJson config for the dropdown field.
 */
export interface FieldDropdownFromJsonConfig extends FieldDropdownConfig {
  options?: MenuOption[];
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
export type FieldDropdownValidator = FieldValidator<string>;

fieldRegistry.register('field_dropdown', FieldDropdown);
