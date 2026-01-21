/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.utils.toolbox

import type {ConnectionState} from '../serialization/blocks.js';
import type {CssConfig as CategoryCssConfig} from '../toolbox/category.js';
import type {CssConfig as SeparatorCssConfig} from '../toolbox/separator.js';
import * as utilsXml from './xml.js';

/**
 * The information needed to create a block in the toolbox.
 * Note that disabled has a different type for backwards compatibility.
 */
export interface BlockInfo {
  kind: string;
  blockxml?: string | Node;
  type?: string;
  gap?: string | number;
  disabled?: string | boolean;
  disabledReasons?: string[];
  enabled?: boolean;
  id?: string;
  collapsed?: boolean;
  inline?: boolean;
  data?: string;
  extraState?: AnyDuringMigration;
  icons?: {[key: string]: AnyDuringMigration};
  fields?: {[key: string]: AnyDuringMigration};
  inputs?: {[key: string]: ConnectionState};
  next?: ConnectionState;
}

/**
 * The information needed to create a separator in the toolbox.
 */
export interface SeparatorInfo {
  kind: string;
  id: string | undefined;
  gap: number | undefined;
  cssconfig: SeparatorCssConfig | undefined;
}

/**
 * The information needed to create a button in the toolbox.
 */
export interface ButtonInfo {
  kind: string;
  text: string;
  callbackkey: string;
}

/**
 * The information needed to create a label in the toolbox.
 */
export interface LabelInfo {
  kind: string;
  text: string;
  id: string | undefined;
}

/**
 * The information needed to create either a button or a label in the flyout.
 */
export type ButtonOrLabelInfo = ButtonInfo | LabelInfo;

/**
 * The information needed to create a category in the toolbox.
 */
export interface StaticCategoryInfo {
  kind: string;
  name: string;
  contents: ToolboxItemInfo[];
  id: string | undefined;
  categorystyle: string | undefined;
  colour: string | undefined;
  cssconfig: CategoryCssConfig | undefined;
  hidden: string | undefined;
  expanded?: string | boolean;
}

/**
 * The information needed to create a custom category.
 */
export interface DynamicCategoryInfo {
  kind: string;
  custom: string;
  id: string | undefined;
  categorystyle: string | undefined;
  colour: string | undefined;
  cssconfig: CategoryCssConfig | undefined;
  hidden: string | undefined;
  expanded?: string | boolean;
}

/**
 * The information needed to create either a dynamic or static category.
 */
export type CategoryInfo = StaticCategoryInfo | DynamicCategoryInfo;

/**
 * Any information that can be used to create an item in the toolbox.
 */
export type ToolboxItemInfo = FlyoutItemInfo | StaticCategoryInfo;

/**
 * All the different types that can be displayed in a flyout.
 */
export type FlyoutItemInfo =
  | BlockInfo
  | SeparatorInfo
  | ButtonInfo
  | LabelInfo
  | DynamicCategoryInfo;

/**
 * The JSON definition of a toolbox.
 */
export interface ToolboxInfo {
  kind?: string;
  contents: ToolboxItemInfo[];
}

/**
 * An array holding flyout items.
 */
export type FlyoutItemInfoArray = FlyoutItemInfo[];

/**
 * All of the different types that can create a toolbox.
 */
export type ToolboxDefinition = Node | ToolboxInfo | string;

/**
 * All of the different types that can be used to show items in a flyout.
 */
export type FlyoutDefinition =
  | FlyoutItemInfoArray
  | NodeList
  | ToolboxInfo
  | Node[];

/**
 * The name used to identify a toolbox that has category like items.
 * This only needs to be used if a toolbox wants to be treated like a category
 * toolbox but does not actually contain any toolbox items with the kind
 * 'category'.
 */
const CATEGORY_TOOLBOX_KIND = 'categoryToolbox';

/**
 * The name used to identify a toolbox that has no categories and is displayed
 * as a simple flyout displaying blocks, buttons, or labels.
 */
const FLYOUT_TOOLBOX_KIND = 'flyoutToolbox';

/**
 * Position of the toolbox and/or flyout relative to the workspace.
 */
export enum Position {
  TOP,
  BOTTOM,
  LEFT,
  RIGHT,
}

/**
 * Converts the toolbox definition into toolbox JSON.
 *
 * @param toolboxDef The definition of the toolbox in one of its many forms.
 * @returns Object holding information for creating a toolbox.
 * @internal
 */
export function convertToolboxDefToJson(
  toolboxDef: ToolboxDefinition | null,
): ToolboxInfo | null {
  if (!toolboxDef) {
    return null;
  }

  if (toolboxDef instanceof Element || typeof toolboxDef === 'string') {
    toolboxDef = parseToolboxTree(toolboxDef);
    // AnyDuringMigration because:  Argument of type 'Node | null' is not
    // assignable to parameter of type 'Node'.
    toolboxDef = convertToToolboxJson(toolboxDef as AnyDuringMigration);
  }

  const toolboxJson = toolboxDef as ToolboxInfo;
  validateToolbox(toolboxJson);
  return toolboxJson;
}

/**
 * Validates the toolbox JSON fields have been set correctly.
 *
 * @param toolboxJson Object holding information for creating a toolbox.
 * @throws {Error} if the toolbox is not the correct format.
 */
function validateToolbox(toolboxJson: ToolboxInfo) {
  const toolboxKind = toolboxJson['kind'];
  const toolboxContents = toolboxJson['contents'];

  if (toolboxKind) {
    if (
      toolboxKind !== FLYOUT_TOOLBOX_KIND &&
      toolboxKind !== CATEGORY_TOOLBOX_KIND
    ) {
      throw Error(
        'Invalid toolbox kind ' +
          toolboxKind +
          '.' +
          ' Please supply either ' +
          FLYOUT_TOOLBOX_KIND +
          ' or ' +
          CATEGORY_TOOLBOX_KIND,
      );
    }
  }
  if (!toolboxContents) {
    throw Error('Toolbox must have a contents attribute.');
  }
}

/**
 * Converts the flyout definition into a list of flyout items.
 *
 * @param flyoutDef The definition of the flyout in one of its many forms.
 * @returns A list of flyout items.
 * @internal
 */
export function convertFlyoutDefToJsonArray(
  flyoutDef: FlyoutDefinition | null,
): FlyoutItemInfoArray {
  if (!flyoutDef) {
    return [];
  }

  if ((flyoutDef as AnyDuringMigration)['contents']) {
    return (flyoutDef as AnyDuringMigration)['contents'];
  }
  // If it is already in the correct format return the flyoutDef.
  // AnyDuringMigration because:  Property 'nodeType' does not exist on type
  // 'Node | FlyoutItemInfo'.
  if (
    Array.isArray(flyoutDef) &&
    flyoutDef.length > 0 &&
    !(flyoutDef[0] as AnyDuringMigration).nodeType
  ) {
    // AnyDuringMigration because:  Type 'FlyoutItemInfoArray | Node[]' is not
    // assignable to type 'FlyoutItemInfoArray'.
    return flyoutDef as AnyDuringMigration;
  }

  // AnyDuringMigration because:  Type 'ToolboxItemInfo[] | FlyoutItemInfoArray'
  // is not assignable to type 'FlyoutItemInfoArray'.
  return xmlToJsonArray(flyoutDef as Node[] | NodeList) as AnyDuringMigration;
}

/**
 * Whether or not the toolbox definition has categories.
 *
 * @param toolboxJson Object holding information for creating a toolbox.
 * @returns True if the toolbox has categories.
 * @internal
 */
export function hasCategories(toolboxJson: ToolboxInfo | null): boolean {
  return TEST_ONLY.hasCategoriesInternal(toolboxJson);
}

/**
 * Private version of hasCategories for stubbing in tests.
 */
function hasCategoriesInternal(toolboxJson: ToolboxInfo | null): boolean {
  if (!toolboxJson) {
    return false;
  }

  const toolboxKind = toolboxJson['kind'];
  if (toolboxKind) {
    return toolboxKind === CATEGORY_TOOLBOX_KIND;
  }

  const categories = toolboxJson['contents'].filter(
    (item) => item['kind'].toUpperCase() === 'CATEGORY',
  );
  return !!categories.length;
}

/**
 * Whether or not the category is collapsible.
 *
 * @param categoryInfo Object holing information for creating a category.
 * @returns True if the category has subcategories.
 * @internal
 */
export function isCategoryCollapsible(categoryInfo: CategoryInfo): boolean {
  if (!categoryInfo || !(categoryInfo as AnyDuringMigration)['contents']) {
    return false;
  }

  const categories = (categoryInfo as AnyDuringMigration)['contents'].filter(
    function (item: AnyDuringMigration) {
      return item['kind'].toUpperCase() === 'CATEGORY';
    },
  );
  return !!categories.length;
}

/**
 * Parses the provided toolbox definition into a consistent format.
 *
 * @param toolboxDef The definition of the toolbox in one of its many forms.
 * @returns Object holding information for creating a toolbox.
 */
function convertToToolboxJson(toolboxDef: Node): ToolboxInfo {
  const contents = xmlToJsonArray(toolboxDef as Node | Node[]);
  const toolboxJson = {'contents': contents};
  if (toolboxDef instanceof Node) {
    addAttributes(toolboxDef, toolboxJson);
  }
  return toolboxJson;
}

/**
 * Converts the xml for a toolbox to JSON.
 *
 * @param toolboxDef The definition of the toolbox in one of its many forms.
 * @returns A list of objects in the toolbox.
 */
function xmlToJsonArray(
  toolboxDef: Node | Node[] | NodeList,
): FlyoutItemInfoArray | ToolboxItemInfo[] {
  const arr = [];
  // If it is a node it will have children.
  // AnyDuringMigration because:  Property 'childNodes' does not exist on type
  // 'Node | NodeList | Node[]'.
  let childNodes = (toolboxDef as AnyDuringMigration).childNodes;
  if (!childNodes) {
    // Otherwise the toolboxDef is an array or collection.
    childNodes = toolboxDef;
  }
  for (let i = 0, child; (child = childNodes[i]); i++) {
    if (!child.tagName) {
      continue;
    }
    const obj = {};
    const tagName = child.tagName.toUpperCase();
    (obj as AnyDuringMigration)['kind'] = tagName;

    // Store the XML for a block.
    if (tagName === 'BLOCK') {
      (obj as AnyDuringMigration)['blockxml'] = child;
    } else if (child.childNodes && child.childNodes.length > 0) {
      // Get the contents of a category
      (obj as AnyDuringMigration)['contents'] = xmlToJsonArray(child);
    }

    // Add XML attributes to object
    addAttributes(child, obj);
    arr.push(obj);
  }
  // AnyDuringMigration because:  Type '{}[]' is not assignable to type
  // 'ToolboxItemInfo[] | FlyoutItemInfoArray'.
  return arr as AnyDuringMigration;
}

/**
 * Adds the attributes on the node to the given object.
 *
 * @param node The node to copy the attributes from.
 * @param obj The object to copy the attributes to.
 */
function addAttributes(node: Node, obj: AnyDuringMigration) {
  // AnyDuringMigration because:  Property 'attributes' does not exist on type
  // 'Node'.
  for (let j = 0; j < (node as AnyDuringMigration).attributes.length; j++) {
    // AnyDuringMigration because:  Property 'attributes' does not exist on type
    // 'Node'.
    const attr = (node as AnyDuringMigration).attributes[j];
    if (attr.nodeName.includes('css-')) {
      obj['cssconfig'] = obj['cssconfig'] || {};
      obj['cssconfig'][attr.nodeName.replace('css-', '')] = attr.value;
    } else {
      obj[attr.nodeName] = attr.value;
    }
  }
}

/**
 * Parse the provided toolbox tree into a consistent DOM format.
 *
 * @param toolboxDef DOM tree of blocks, or text representation of same.
 * @returns DOM tree of blocks, or null.
 */
export function parseToolboxTree(
  toolboxDef: Element | null | string,
): Element | null {
  let parsedToolboxDef: Element | null = null;
  if (toolboxDef) {
    if (typeof toolboxDef === 'string') {
      parsedToolboxDef = utilsXml.textToDom(toolboxDef);
      if (parsedToolboxDef.nodeName.toLowerCase() !== 'xml') {
        throw TypeError('Toolbox should be an <xml> document.');
      }
    } else if (toolboxDef instanceof Element) {
      parsedToolboxDef = toolboxDef;
    }
  }
  return parsedToolboxDef;
}

export const TEST_ONLY = {
  hasCategoriesInternal,
};
