/**
 * @license
 * Copyright 2011 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly

// Unused import preserved for side-effects. Remove if unneeded.
import './events/events_block_create.js';
// Unused import preserved for side-effects. Remove if unneeded.
import './events/workspace_events.js';
// Unused import preserved for side-effects. Remove if unneeded.
import './events/events_ui_base.js';
// Unused import preserved for side-effects. Remove if unneeded.
import './events/events_var_create.js';

import {Block} from './block.js';
import * as blockAnimations from './block_animations.js';
import {BlockFlyoutInflater} from './block_flyout_inflater.js';
import {BlockSvg} from './block_svg.js';
import {BlocklyOptions} from './blockly_options.js';
import {Blocks} from './blocks.js';
import * as browserEvents from './browser_events.js';
import * as bubbles from './bubbles.js';
import {MiniWorkspaceBubble} from './bubbles/mini_workspace_bubble.js';
import * as bumpObjects from './bump_objects.js';
import {ButtonFlyoutInflater} from './button_flyout_inflater.js';
import * as clipboard from './clipboard.js';
import * as comments from './comments.js';
import * as common from './common.js';
import {ComponentManager} from './component_manager.js';
import {config} from './config.js';
import {Connection} from './connection.js';
import {ConnectionChecker} from './connection_checker.js';
import {ConnectionDB} from './connection_db.js';
import {ConnectionType} from './connection_type.js';
import * as constants from './constants.js';
import * as ContextMenu from './contextmenu.js';
import * as ContextMenuItems from './contextmenu_items.js';
import {ContextMenuRegistry} from './contextmenu_registry.js';
import * as Css from './css.js';
import {DeleteArea} from './delete_area.js';
import * as dialog from './dialog.js';
import {DragTarget} from './drag_target.js';
import * as dragging from './dragging.js';
import * as dropDownDiv from './dropdowndiv.js';
import * as Events from './events/events.js';
import * as Extensions from './extensions.js';
import {
  Field,
  FieldConfig,
  FieldValidator,
  UnattachedFieldError,
} from './field.js';
import {
  FieldCheckbox,
  FieldCheckboxConfig,
  FieldCheckboxFromJsonConfig,
  FieldCheckboxValidator,
} from './field_checkbox.js';
import {
  FieldDropdown,
  FieldDropdownConfig,
  FieldDropdownFromJsonConfig,
  FieldDropdownValidator,
  ImageProperties,
  MenuGenerator,
  MenuGeneratorFunction,
  MenuOption,
} from './field_dropdown.js';
import {
  FieldImage,
  FieldImageConfig,
  FieldImageFromJsonConfig,
} from './field_image.js';
import {
  FieldLabel,
  FieldLabelConfig,
  FieldLabelFromJsonConfig,
} from './field_label.js';
import {FieldLabelSerializable} from './field_label_serializable.js';
import {
  FieldNumber,
  FieldNumberConfig,
  FieldNumberFromJsonConfig,
  FieldNumberValidator,
} from './field_number.js';
import * as fieldRegistry from './field_registry.js';
import {
  FieldTextInput,
  FieldTextInputConfig,
  FieldTextInputFromJsonConfig,
  FieldTextInputValidator,
} from './field_textinput.js';
import {
  FieldVariable,
  FieldVariableConfig,
  FieldVariableFromJsonConfig,
  FieldVariableValidator,
} from './field_variable.js';
import {Flyout} from './flyout_base.js';
import {FlyoutButton} from './flyout_button.js';
import {HorizontalFlyout} from './flyout_horizontal.js';
import {FlyoutItem} from './flyout_item.js';
import {FlyoutMetricsManager} from './flyout_metrics_manager.js';
import {FlyoutSeparator} from './flyout_separator.js';
import {VerticalFlyout} from './flyout_vertical.js';
import {
  FocusManager,
  ReturnEphemeralFocus,
  getFocusManager,
} from './focus_manager.js';
import {CodeGenerator} from './generator.js';
import {Gesture} from './gesture.js';
import {Grid} from './grid.js';
import * as icons from './icons.js';
import {inject} from './inject.js';
import * as inputs from './inputs.js';
import {IFlyoutInflater} from './interfaces/i_flyout_inflater.js';
import {LabelFlyoutInflater} from './label_flyout_inflater.js';
import {SeparatorFlyoutInflater} from './separator_flyout_inflater.js';
import {FocusableTreeTraverser} from './utils/focusable_tree_traverser.js';

import {Input} from './inputs/input.js';
import {InsertionMarkerPreviewer} from './insertion_marker_previewer.js';
import {IAutoHideable} from './interfaces/i_autohideable.js';
import {IBoundedElement} from './interfaces/i_bounded_element.js';
import {IBubble} from './interfaces/i_bubble.js';
import {ICollapsibleToolboxItem} from './interfaces/i_collapsible_toolbox_item.js';
import {IComponent} from './interfaces/i_component.js';
import {IConnectionChecker} from './interfaces/i_connection_checker.js';
import {IConnectionPreviewer} from './interfaces/i_connection_previewer.js';
import {IContextMenu} from './interfaces/i_contextmenu.js';
import {ICopyData, ICopyable, isCopyable} from './interfaces/i_copyable.js';
import {IDeletable, isDeletable} from './interfaces/i_deletable.js';
import {IDeleteArea} from './interfaces/i_delete_area.js';
import {IDragTarget} from './interfaces/i_drag_target.js';
import {
  IDragStrategy,
  IDraggable,
  isDraggable,
} from './interfaces/i_draggable.js';
import {IDragger} from './interfaces/i_dragger.js';
import {IFlyout} from './interfaces/i_flyout.js';
import {IFocusableNode} from './interfaces/i_focusable_node.js';
import {IFocusableTree} from './interfaces/i_focusable_tree.js';
import {IHasBubble, hasBubble} from './interfaces/i_has_bubble.js';
import {IIcon, isIcon} from './interfaces/i_icon.js';
import {IKeyboardAccessible} from './interfaces/i_keyboard_accessible.js';
import {IMetricsManager} from './interfaces/i_metrics_manager.js';
import {IMovable} from './interfaces/i_movable.js';
import {IObservable, isObservable} from './interfaces/i_observable.js';
import {IPaster, isPaster} from './interfaces/i_paster.js';
import {IPositionable} from './interfaces/i_positionable.js';
import {IRegistrable} from './interfaces/i_registrable.js';
import {
  IRenderedElement,
  isRenderedElement,
} from './interfaces/i_rendered_element.js';
import {ISelectable, isSelectable} from './interfaces/i_selectable.js';
import {ISelectableToolboxItem} from './interfaces/i_selectable_toolbox_item.js';
import {ISerializable, isSerializable} from './interfaces/i_serializable.js';
import {IStyleable} from './interfaces/i_styleable.js';
import {IToolbox} from './interfaces/i_toolbox.js';
import {IToolboxItem} from './interfaces/i_toolbox_item.js';
import {
  IVariableBackedParameterModel,
  isVariableBackedParameterModel,
} from './interfaces/i_variable_backed_parameter_model.js';
import {IVariableMap} from './interfaces/i_variable_map.js';
import {IVariableModel, IVariableState} from './interfaces/i_variable_model.js';
import * as internalConstants from './internal_constants.js';
import {LineCursor} from './keyboard_nav/line_cursor.js';
import {Marker} from './keyboard_nav/marker.js';
import {
  KeyboardNavigationController,
  keyboardNavigationController,
} from './keyboard_navigation_controller.js';
import type {LayerManager} from './layer_manager.js';
import * as layers from './layers.js';
import {MarkerManager} from './marker_manager.js';
import {Menu} from './menu.js';
import {MenuItem} from './menuitem.js';
import {MetricsManager} from './metrics_manager.js';
import {Msg, setLocale} from './msg.js';
import {Names} from './names.js';
import {Options} from './options.js';
import * as uiPosition from './positionable_helpers.js';
import * as Procedures from './procedures.js';
import * as registry from './registry.js';
import * as renderManagement from './render_management.js';
import {RenderedConnection} from './rendered_connection.js';
import * as blockRendering from './renderers/common/block_rendering.js';
import * as geras from './renderers/geras/geras.js';
import * as thrasos from './renderers/thrasos/thrasos.js';
import * as zelos from './renderers/zelos/zelos.js';
import {Scrollbar} from './scrollbar.js';
import {ScrollbarPair} from './scrollbar_pair.js';
import * as serialization from './serialization.js';
import * as ShortcutItems from './shortcut_items.js';
import {ShortcutRegistry} from './shortcut_registry.js';
import {Theme} from './theme.js';
import * as Themes from './theme/themes.js';
import {ThemeManager} from './theme_manager.js';
import {ToolboxCategory} from './toolbox/category.js';
import {CollapsibleToolboxCategory} from './toolbox/collapsible_category.js';
import {ToolboxSeparator} from './toolbox/separator.js';
import {Toolbox} from './toolbox/toolbox.js';
import {ToolboxItem} from './toolbox/toolbox_item.js';
import * as Tooltip from './tooltip.js';
import * as Touch from './touch.js';
import {Trashcan} from './trashcan.js';
import * as utils from './utils.js';
import * as toolbox from './utils/toolbox.js';
import {VariableMap} from './variable_map.js';
import {VariableModel} from './variable_model.js';
import * as Variables from './variables.js';
import * as VariablesDynamic from './variables_dynamic.js';
import * as WidgetDiv from './widgetdiv.js';
import {Workspace} from './workspace.js';
import {WorkspaceAudio} from './workspace_audio.js';
import {WorkspaceDragger} from './workspace_dragger.js';
import {WorkspaceSvg} from './workspace_svg.js';
import * as Xml from './xml.js';
import {ZoomControls} from './zoom_controls.js';

/**
 * Blockly core version.
 * This constant is overridden by the build script (npm run build) to the value
 * of the version in package.json. This is done by the Closure Compiler in the
 * buildCompressed gulp task.
 * For local builds, you can pass --define='Blockly.VERSION=X.Y.Z' to the
 * compiler to override this constant.
 *
 * @define {string}
 */
export const VERSION = 'uncompiled';

/*
 * Top-level functions and properties on the Blockly namespace.
 * These are used only in external code. Do not reference these
 * from internal code as importing from this file can cause circular
 * dependencies. Do not add new functions here. There is probably a better
 * namespace to put new functions on.
 */

/*
 * Aliases for constants used for connection and input types.
 */

/**
 * @see ConnectionType.INPUT_VALUE
 */
export const INPUT_VALUE = ConnectionType.INPUT_VALUE;

/**
 * @see ConnectionType.OUTPUT_VALUE
 */
export const OUTPUT_VALUE = ConnectionType.OUTPUT_VALUE;

/**
 * @see ConnectionType.NEXT_STATEMENT
 */
export const NEXT_STATEMENT = ConnectionType.NEXT_STATEMENT;

/**
 * @see ConnectionType.PREVIOUS_STATEMENT
 */
export const PREVIOUS_STATEMENT = ConnectionType.PREVIOUS_STATEMENT;

/** Aliases for toolbox positions. */

/**
 * @see toolbox.Position.TOP
 */
export const TOOLBOX_AT_TOP = toolbox.Position.TOP;

/**
 * @see toolbox.Position.BOTTOM
 */
export const TOOLBOX_AT_BOTTOM = toolbox.Position.BOTTOM;

/**
 * @see toolbox.Position.LEFT
 */
export const TOOLBOX_AT_LEFT = toolbox.Position.LEFT;

/**
 * @see toolbox.Position.RIGHT
 */
export const TOOLBOX_AT_RIGHT = toolbox.Position.RIGHT;

/*
 * Other aliased functions.
 */

/**
 * Size the SVG image to completely fill its container. Call this when the view
 * actually changes sizes (e.g. on a window resize/device orientation change).
 * See workspace.resizeContents to resize the workspace when the contents
 * change (e.g. when a block is added or removed).
 * Record the height/width of the SVG image.
 *
 * @param workspace Any workspace in the SVG.
 * @see Blockly.common.svgResize
 */
export const svgResize = common.svgResize;

/**
 * Close tooltips, context menus, dropdown selections, etc.
 *
 * @param opt_onlyClosePopups Whether only popups should be closed.
 * @see Blockly.WorkspaceSvg.hideChaff
 */
export function hideChaff(opt_onlyClosePopups?: boolean) {
  (common.getMainWorkspace() as WorkspaceSvg).hideChaff(opt_onlyClosePopups);
}

/**
 * Returns the main workspace.  Returns the last used main workspace (based on
 * focus).  Try not to use this function, particularly if there are multiple
 * Blockly instances on a page.
 *
 * @see Blockly.common.getMainWorkspace
 */
export const getMainWorkspace = common.getMainWorkspace;

/**
 * Returns the currently selected copyable object.
 */
export const getSelected = common.getSelected;

/**
 * Define blocks from an array of JSON block definitions, as might be generated
 * by the Blockly Developer Tools.
 *
 * @param jsonArray An array of JSON block definitions.
 * @see Blockly.common.defineBlocksWithJsonArray
 */
export const defineBlocksWithJsonArray = common.defineBlocksWithJsonArray;

/**
 * Set the parent container.  This is the container element that the WidgetDiv,
 * dropDownDiv, and Tooltip are rendered into the first time `Blockly.inject`
 * is called.
 * This method is a NOP if called after the first `Blockly.inject`.
 *
 * @param container The container element.
 * @see Blockly.common.setParentContainer
 */
export const setParentContainer = common.setParentContainer;

// Aliases to allow external code to access these values for legacy reasons.
export const COLLAPSE_CHARS = internalConstants.COLLAPSE_CHARS;
export const OPPOSITE_TYPE = internalConstants.OPPOSITE_TYPE;
export const RENAME_VARIABLE_ID = internalConstants.RENAME_VARIABLE_ID;
export const DELETE_VARIABLE_ID = internalConstants.DELETE_VARIABLE_ID;
export const COLLAPSED_INPUT_NAME = constants.COLLAPSED_INPUT_NAME;
export const COLLAPSED_FIELD_NAME = constants.COLLAPSED_FIELD_NAME;

/**
 * String for use in the "custom" attribute of a category in toolbox XML.
 * This string indicates that the category should be dynamically populated with
 * variable blocks.
 */
export const VARIABLE_CATEGORY_NAME: string = Variables.CATEGORY_NAME;

/**
 * String for use in the "custom" attribute of a category in toolbox XML.
 * This string indicates that the category should be dynamically populated with
 * variable blocks.
 */
export const VARIABLE_DYNAMIC_CATEGORY_NAME: string =
  VariablesDynamic.CATEGORY_NAME;
/**
 * String for use in the "custom" attribute of a category in toolbox XML.
 * This string indicates that the category should be dynamically populated with
 * procedure blocks.
 */
export const PROCEDURE_CATEGORY_NAME: string = Procedures.CATEGORY_NAME;

// Context for why we need to monkey-patch in these functions (internal):
//   https://docs.google.com/document/d/1MbO0LEA-pAyx1ErGLJnyUqTLrcYTo-5zga9qplnxeXo/edit?usp=sharing&resourcekey=0-5h_32-i-dHwHjf_9KYEVKg

// clang-format off
Workspace.prototype.newBlock = function (
  prototypeName: string,
  opt_id?: string,
): Block {
  return new Block(this, prototypeName, opt_id);
};

WorkspaceSvg.prototype.newBlock = function (
  prototypeName: string,
  opt_id?: string,
): BlockSvg {
  return new BlockSvg(this, prototypeName, opt_id);
};

Workspace.prototype.newComment = function (
  id?: string,
): comments.WorkspaceComment {
  return new comments.WorkspaceComment(this, id);
};

WorkspaceSvg.prototype.newComment = function (
  id?: string,
): comments.RenderedWorkspaceComment {
  return new comments.RenderedWorkspaceComment(this, id);
};

WorkspaceSvg.newTrashcan = function (workspace: WorkspaceSvg): Trashcan {
  return new Trashcan(workspace);
};

MiniWorkspaceBubble.prototype.newWorkspaceSvg = function (
  options: Options,
): WorkspaceSvg {
  return new WorkspaceSvg(options);
};

Names.prototype.populateProcedures = function (
  this: Names,
  workspace: Workspace,
) {
  const procedures = Procedures.allProcedures(workspace);
  // Flatten the return vs no-return procedure lists.
  const flattenedProcedures = procedures[0].concat(procedures[1]);
  for (let i = 0; i < flattenedProcedures.length; i++) {
    this.getName(flattenedProcedures[i][0], Names.NameType.PROCEDURE);
  }
};
// clang-format on

export * from './flyout_navigator.js';
export * from './interfaces/i_navigation_policy.js';
export * from './keyboard_nav/block_navigation_policy.js';
export * from './keyboard_nav/connection_navigation_policy.js';
export * from './keyboard_nav/field_navigation_policy.js';
export * from './keyboard_nav/flyout_button_navigation_policy.js';
export * from './keyboard_nav/flyout_navigation_policy.js';
export * from './keyboard_nav/flyout_separator_navigation_policy.js';
export * from './keyboard_nav/workspace_navigation_policy.js';
export * from './navigator.js';
export * from './toast.js';

// Re-export submodules that no longer declareLegacyNamespace.
export {
  Block,
  BlockSvg,
  BlocklyOptions,
  Blocks,
  CollapsibleToolboxCategory,
  ComponentManager,
  Connection,
  ConnectionChecker,
  ConnectionDB,
  ConnectionType,
  ContextMenu,
  ContextMenuItems,
  ContextMenuRegistry,
  Css,
  DeleteArea,
  DragTarget,
  Events,
  Extensions,
  LineCursor,
  Procedures,
  ShortcutItems,
  Themes,
  Tooltip,
  Touch,
  Variables,
  VariablesDynamic,
  WidgetDiv,
  Xml,
  blockAnimations,
  blockRendering,
  browserEvents,
  bubbles,
  bumpObjects,
  clipboard,
  comments,
  common,
  constants,
  dialog,
  dragging,
  fieldRegistry,
  geras,
  Procedures as procedures,
  registry,
  thrasos,
  uiPosition,
  utils,
  zelos,
};
export const DropDownDiv = dropDownDiv;
export {
  BlockFlyoutInflater,
  ButtonFlyoutInflater,
  CodeGenerator,
  Field,
  FieldCheckbox,
  FieldCheckboxConfig,
  FieldCheckboxFromJsonConfig,
  FieldCheckboxValidator,
  FieldConfig,
  FieldDropdown,
  FieldDropdownConfig,
  FieldDropdownFromJsonConfig,
  FieldDropdownValidator,
  FieldImage,
  FieldImageConfig,
  FieldImageFromJsonConfig,
  FieldLabel,
  FieldLabelConfig,
  FieldLabelFromJsonConfig,
  FieldLabelSerializable,
  FieldNumber,
  FieldNumberConfig,
  FieldNumberFromJsonConfig,
  FieldNumberValidator,
  FieldTextInput,
  FieldTextInputConfig,
  FieldTextInputFromJsonConfig,
  FieldTextInputValidator,
  FieldValidator,
  FieldVariable,
  FieldVariableConfig,
  FieldVariableFromJsonConfig,
  FieldVariableValidator,
  Flyout,
  FlyoutButton,
  FlyoutItem,
  FlyoutMetricsManager,
  FlyoutSeparator,
  FocusManager,
  FocusableTreeTraverser,
  CodeGenerator as Generator,
  Gesture,
  Grid,
  HorizontalFlyout,
  IAutoHideable,
  IBoundedElement,
  IBubble,
  ICollapsibleToolboxItem,
  IComponent,
  IConnectionChecker,
  IConnectionPreviewer,
  IContextMenu,
  ICopyData,
  ICopyable,
  IDeletable,
  IDeleteArea,
  IDragStrategy,
  IDragTarget,
  IDraggable,
  IDragger,
  IFlyout,
  IFlyoutInflater,
  IFocusableNode,
  IFocusableTree,
  IHasBubble,
  IIcon,
  IKeyboardAccessible,
  IMetricsManager,
  IMovable,
  IObservable,
  IPaster,
  IPositionable,
  IRegistrable,
  IRenderedElement,
  ISelectable,
  ISelectableToolboxItem,
  ISerializable,
  IStyleable,
  IToolbox,
  IToolboxItem,
  IVariableBackedParameterModel,
  IVariableMap,
  IVariableModel,
  IVariableState,
  ImageProperties,
  Input,
  InsertionMarkerPreviewer,
  KeyboardNavigationController,
  LabelFlyoutInflater,
  LayerManager,
  Marker,
  MarkerManager,
  Menu,
  MenuGenerator,
  MenuGeneratorFunction,
  MenuItem,
  MenuOption,
  MetricsManager,
  Msg,
  Names,
  Options,
  RenderedConnection,
  ReturnEphemeralFocus,
  Scrollbar,
  ScrollbarPair,
  SeparatorFlyoutInflater,
  ShortcutRegistry,
  Theme,
  ThemeManager,
  Toolbox,
  ToolboxCategory,
  ToolboxItem,
  ToolboxSeparator,
  Trashcan,
  UnattachedFieldError,
  VariableMap,
  VariableModel,
  VerticalFlyout,
  Workspace,
  WorkspaceAudio,
  WorkspaceDragger,
  WorkspaceSvg,
  ZoomControls,
  config,
  getFocusManager,
  hasBubble,
  icons,
  inject,
  inputs,
  isCopyable,
  isDeletable,
  isDraggable,
  isIcon,
  isObservable,
  isPaster,
  isRenderedElement,
  isSelectable,
  isSerializable,
  isVariableBackedParameterModel,
  keyboardNavigationController,
  layers,
  renderManagement,
  serialization,
  setLocale,
};
