/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.serialization.blocks

import type {Block} from '../block.js';
import type {BlockSvg} from '../block_svg.js';
import type {Connection} from '../connection.js';
import {MANUALLY_DISABLED} from '../constants.js';
import {EventType} from '../events/type.js';
import * as eventUtils from '../events/utils.js';
import {inputTypes} from '../inputs/input_types.js';
import {isSerializable} from '../interfaces/i_serializable.js';
import type {ISerializer} from '../interfaces/i_serializer.js';
import type {
  IVariableModel,
  IVariableState,
} from '../interfaces/i_variable_model.js';
import * as registry from '../registry.js';
import * as renderManagement from '../render_management.js';
import * as utilsXml from '../utils/xml.js';
import * as Variables from '../variables.js';
import type {Workspace} from '../workspace.js';
import * as Xml from '../xml.js';
import {
  BadConnectionCheck,
  MissingBlockType,
  MissingConnection,
  RealChildOfShadow,
  UnregisteredIcon,
} from './exceptions.js';
import * as priorities from './priorities.js';
import * as serializationRegistry from './registry.js';

// TODO(#5160): Remove this once lint is fixed.

/**
 * Represents the state of a connection.
 */
export interface ConnectionState {
  shadow?: State;
  block?: State;
}

/**
 * Represents the state of a given block.
 */
export interface State {
  type: string;
  id?: string;
  x?: number;
  y?: number;
  collapsed?: boolean;
  deletable?: boolean;
  movable?: boolean;
  editable?: boolean;
  enabled?: boolean;
  disabledReasons?: string[];
  inline?: boolean;
  data?: string;
  extraState?: AnyDuringMigration;
  icons?: {[key: string]: AnyDuringMigration};
  fields?: {[key: string]: AnyDuringMigration};
  inputs?: {[key: string]: ConnectionState};
  next?: ConnectionState;
}

/**
 * Returns the state of the given block as a plain JavaScript object.
 *
 * @param block The block to serialize.
 * @param param1 addCoordinates: If true, the coordinates of the block are added
 *     to the serialized state. False by default. addinputBlocks: If true,
 *     children of the block which are connected to inputs will be serialized.
 *     True by default. addNextBlocks: If true, children of the block which are
 *     connected to the block's next connection (if it exists) will be
 *     serialized. True by default. doFullSerialization: If true, fields that
 *     normally just save a reference to some external state (eg variables) will
 *     instead serialize all of the info about that state. This supports
 *     deserializing the block into a workspace where that state doesn't yet
 *     exist. True by default.
 * @returns The serialized state of the block, or null if the block could not be
 *     serialied (eg it was an insertion marker).
 */
export function save(
  block: Block,
  {
    addCoordinates = false,
    addInputBlocks = true,
    addNextBlocks = true,
    doFullSerialization = true,
    saveIds = true,
  }: {
    addCoordinates?: boolean;
    addInputBlocks?: boolean;
    addNextBlocks?: boolean;
    doFullSerialization?: boolean;
    saveIds?: boolean;
  } = {},
): State | null {
  if (block.isInsertionMarker()) {
    return null;
  }
  const state: State = {
    'type': block.type,
    'id': saveIds ? block.id : undefined,
  };

  if (addCoordinates) {
    saveCoords(block, state);
  }
  saveAttributes(block, state);
  saveExtraState(block, state, doFullSerialization);
  saveIcons(block, state, doFullSerialization);
  saveFields(block, state, doFullSerialization);
  if (addInputBlocks) {
    saveInputBlocks(block, state, doFullSerialization, saveIds);
  }
  if (addNextBlocks) {
    saveNextBlocks(block, state, doFullSerialization, saveIds);
  }

  return state;
}

/**
 * Adds attributes to the given state object based on the state of the block.
 * Eg collapsed, disabled, inline, etc.
 *
 * @param block The block to base the attributes on.
 * @param state The state object to append to.
 */
function saveAttributes(block: Block, state: State) {
  if (block.isCollapsed()) {
    state['collapsed'] = true;
  }
  if (!block.isEnabled()) {
    state['disabledReasons'] = Array.from(block.getDisabledReasons());
  }
  if (!block.isOwnDeletable()) {
    state['deletable'] = false;
  }
  if (!block.isOwnMovable()) {
    state['movable'] = false;
  }
  if (!block.isOwnEditable()) {
    state['editable'] = false;
  }
  if (
    block.inputsInline !== undefined &&
    block.inputsInline !== block.inputsInlineDefault
  ) {
    state['inline'] = block.inputsInline;
  }
  // Data is a nullable string, so we don't need to worry about falsy values.
  if (block.data) {
    state['data'] = block.data;
  }
}

/**
 * Adds the coordinates of the given block to the given state object.
 *
 * @param block The block to base the coordinates on.
 * @param state The state object to append to.
 */
function saveCoords(block: Block, state: State) {
  const workspace = block.workspace;
  const xy = block.getRelativeToSurfaceXY();
  state['x'] = Math.round(workspace.RTL ? workspace.getWidth() - xy.x : xy.x);
  state['y'] = Math.round(xy.y);
}

/**
 * Adds any extra state the block may provide to the given state object.
 *
 * @param block The block to serialize the extra state of.
 * @param state The state object to append to.
 * @param doFullSerialization Whether or not to serialize the full state of the
 *     extra state (rather than possibly saving a reference to some state).
 */
function saveExtraState(
  block: Block,
  state: State,
  doFullSerialization: boolean,
) {
  if (block.saveExtraState) {
    const extraState = block.saveExtraState(doFullSerialization);
    if (extraState !== null) {
      state['extraState'] = extraState;
    }
  } else if (block.mutationToDom) {
    const extraState = block.mutationToDom();
    if (extraState !== null) {
      state['extraState'] = Xml.domToText(extraState).replace(
        ' xmlns="https://developers.google.com/blockly/xml"',
        '',
      );
    }
  }
}

/**
 * Adds the state of all of the icons on the block to the given state object.
 *
 * @param block The block to serialize the icon state of.
 * @param state The state object to append to.
 * @param doFullSerialization Whether or not to serialize the full state of the
 *     icon (rather than possibly saving a reference to some state).
 */
function saveIcons(block: Block, state: State, doFullSerialization: boolean) {
  const icons = Object.create(null);
  for (const icon of block.getIcons()) {
    if (isSerializable(icon)) {
      const state = icon.saveState(doFullSerialization);
      if (state) icons[icon.getType().toString()] = state;
    }
  }

  if (Object.keys(icons).length) {
    state['icons'] = icons;
  }
}

/**
 * Adds the state of all of the fields on the block to the given state object.
 *
 * @param block The block to serialize the field state of.
 * @param state The state object to append to.
 * @param doFullSerialization Whether or not to serialize the full state of the
 *     field (rather than possibly saving a reference to some state).
 */
function saveFields(block: Block, state: State, doFullSerialization: boolean) {
  const fields = Object.create(null);
  for (const field of block.getFields()) {
    if (field.isSerializable()) {
      fields[field.name!] = field.saveState(doFullSerialization);
    }
  }
  if (Object.keys(fields).length) {
    state['fields'] = fields;
  }
}

/**
 * Adds the state of all of the child blocks of the given block (which are
 * connected to inputs) to the given state object.
 *
 * @param block The block to serialize the input blocks of.
 * @param state The state object to append to.
 * @param doFullSerialization Whether or not to do full serialization.
 */
function saveInputBlocks(
  block: Block,
  state: State,
  doFullSerialization: boolean,
  saveIds: boolean,
) {
  const inputs = Object.create(null);
  for (let i = 0; i < block.inputList.length; i++) {
    const input = block.inputList[i];
    if (!input.connection) continue;
    const connectionState = saveConnection(
      input.connection as Connection,
      doFullSerialization,
      saveIds,
    );
    if (connectionState) {
      inputs[input.name] = connectionState;
    }
  }

  if (Object.keys(inputs).length) {
    state['inputs'] = inputs;
  }
}

/**
 * Adds the state of all of the next blocks of the given block to the given
 * state object.
 *
 * @param block The block to serialize the next blocks of.
 * @param state The state object to append to.
 * @param doFullSerialization Whether or not to do full serialization.
 */
function saveNextBlocks(
  block: Block,
  state: State,
  doFullSerialization: boolean,
  saveIds: boolean,
) {
  if (!block.nextConnection) {
    return;
  }
  const connectionState = saveConnection(
    block.nextConnection,
    doFullSerialization,
    saveIds,
  );
  if (connectionState) {
    state['next'] = connectionState;
  }
}

/**
 * Returns the state of the given connection (ie the state of any connected
 * shadow or real blocks).
 *
 * @param connection The connection to serialize the connected blocks of.
 * @returns An object containing the state of any connected shadow block, or any
 *     connected real block.
 * @param doFullSerialization Whether or not to do full serialization.
 */
function saveConnection(
  connection: Connection,
  doFullSerialization: boolean,
  saveIds: boolean,
): ConnectionState | null {
  const shadow = connection.getShadowState(true);
  const child = connection.targetBlock();
  if (!shadow && !child) {
    return null;
  }
  const state = Object.create(null);
  if (shadow) {
    state['shadow'] = shadow;
  }
  if (child && !child.isShadow()) {
    state['block'] = save(child, {doFullSerialization, saveIds});
  }
  return state;
}

/**
 * Loads the block represented by the given state into the given workspace.
 *
 * @param state The state of a block to deserialize into the workspace.
 * @param workspace The workspace to add the block to.
 * @param param1 recordUndo: If true, events triggered by this function will be
 *     undo-able by the user. False by default.
 * @returns The block that was just loaded.
 */
export function append(
  state: State,
  workspace: Workspace,
  {recordUndo = false}: {recordUndo?: boolean} = {},
): Block {
  const block = appendInternal(state, workspace, {recordUndo});
  if (workspace.rendered) renderManagement.triggerQueuedRenders();
  return block;
}

/**
 * Loads the block represented by the given state into the given workspace.
 * This is defined internally so that the extra parameters don't clutter our
 * external API.
 * But it is exported so that other places within Blockly can call it directly
 * with the extra parameters.
 *
 * @param state The state of a block to deserialize into the workspace.
 * @param workspace The workspace to add the block to.
 * @param param1 parentConnection: If provided, the system will attempt to
 *     connect the block to this connection after it is created. Undefined by
 *     default. isShadow: If true, the block will be set to a shadow block after
 *     it is created. False by default. recordUndo: If true, events triggered by
 *     this function will be undo-able by the user. False by default.
 * @returns The block that was just appended.
 * @internal
 */
export function appendInternal(
  state: State,
  workspace: Workspace,
  {
    parentConnection = undefined,
    isShadow = false,
    recordUndo = false,
  }: {
    parentConnection?: Connection;
    isShadow?: boolean;
    recordUndo?: boolean;
  } = {},
): Block {
  const prevRecordUndo = eventUtils.getRecordUndo();
  eventUtils.setRecordUndo(recordUndo);
  const existingGroup = eventUtils.getGroup();
  if (!existingGroup) {
    eventUtils.setGroup(true);
  }
  eventUtils.disable();

  const variablesBeforeCreation = workspace.getVariableMap().getAllVariables();
  let block;
  try {
    block = appendPrivate(state, workspace, {parentConnection, isShadow});
  } finally {
    eventUtils.enable();
  }

  // Fire a VarCreate event for each (if any) new variable created.
  checkNewVariables(workspace, variablesBeforeCreation);

  if (eventUtils.isEnabled()) {
    // Block events come after var events, in case they refer to newly created
    // variables.
    eventUtils.fire(new (eventUtils.get(EventType.BLOCK_CREATE))(block));
  }
  eventUtils.setGroup(existingGroup);
  eventUtils.setRecordUndo(prevRecordUndo);

  // Adding connections to the connection db is expensive. This defers that
  // operation to decrease load time.
  if (workspace.rendered) {
    const blockSvg = block as BlockSvg;
    setTimeout(() => {
      if (!blockSvg.disposed) {
        blockSvg.setConnectionTracking(true);
      }
    }, 1);
  }

  return block;
}

/**
 * Loads the block represented by the given state into the given workspace.
 * This is defined privately so that it can be called recursively without firing
 * eroneous events. Events (and other things we only want to occur on the top
 * block) are handled by appendInternal.
 *
 * @param state The state of a block to deserialize into the workspace.
 * @param workspace The workspace to add the block to.
 * @param param1 parentConnection: If provided, the system will attempt to
 *     connect the block to this connection after it is created. Undefined by
 *     default. isShadow: The block will be set to a shadow block after it is
 *     created. False by default.
 * @returns The block that was just appended.
 */
function appendPrivate(
  state: State,
  workspace: Workspace,
  {
    parentConnection = undefined,
    isShadow = false,
  }: {parentConnection?: Connection; isShadow?: boolean} = {},
): Block {
  if (!state['type']) {
    throw new MissingBlockType(state);
  }

  const block = workspace.newBlock(state['type'], state['id']);
  block.setShadow(isShadow);
  loadCoords(block, state);
  loadAttributes(block, state);
  loadExtraState(block, state);
  tryToConnectParent(parentConnection, block, state);
  loadIcons(block, state);
  loadFields(block, state);
  loadInputBlocks(block, state);
  loadNextBlocks(block, state);
  initBlock(block, workspace.rendered);

  return block;
}

/**
 * Checks the workspace for any new variables that were created during the
 * deserialization of a block and fires a VarCreate event for each.
 *
 * @param workspace The workspace where new variables are being created
 * @param originalVariables The array of variables that existed in the workspace
 *     before adding the new block.
 */
function checkNewVariables(
  workspace: Workspace,
  originalVariables: IVariableModel<IVariableState>[],
) {
  if (eventUtils.isEnabled()) {
    const newVariables = Variables.getAddedVariables(
      workspace,
      originalVariables,
    );
    // Fire a VarCreate event for each (if any) new variable created.
    for (let i = 0; i < newVariables.length; i++) {
      const thisVariable = newVariables[i];
      eventUtils.fire(new (eventUtils.get(EventType.VAR_CREATE))(thisVariable));
    }
  }
}

/**
 * Applies any coordinate information available on the state object to the
 * block.
 *
 * @param block The block to set the position of.
 * @param state The state object to reference.
 */
function loadCoords(block: Block, state: State) {
  let x = state['x'] === undefined ? 0 : state['x'];
  const y = state['y'] === undefined ? 0 : state['y'];

  const workspace = block.workspace;
  x = workspace.RTL ? workspace.getWidth() - x : x;

  block.moveBy(x, y);
}

/**
 * Applies any attribute information available on the state object to the block.
 *
 * @param block The block to set the attributes of.
 * @param state The state object to reference.
 */
function loadAttributes(block: Block, state: State) {
  if (state['collapsed']) {
    block.setCollapsed(true);
  }
  if (state['deletable'] === false) {
    block.setDeletable(false);
  }
  if (state['movable'] === false) {
    block.setMovable(false);
  }
  if (state['editable'] === false) {
    block.setEditable(false);
  }
  if (state['enabled'] === false) {
    // Before May 2024 we just used 'enabled', with no reasons.
    // Contiune to support this syntax.
    block.setDisabledReason(true, MANUALLY_DISABLED);
  }
  if (Array.isArray(state['disabledReasons'])) {
    for (const reason of state['disabledReasons']) {
      block.setDisabledReason(true, reason);
    }
  }
  if (state['inline'] !== undefined) {
    block.setInputsInline(state['inline']);
  }
  if (state['data'] !== undefined) {
    block.data = state['data'];
  }
}

/**
 * Applies any extra state information available on the state object to the
 * block.
 *
 * @param block The block to set the extra state of.
 * @param state The state object to reference.
 */
function loadExtraState(block: Block, state: State) {
  if (!state['extraState']) {
    return;
  }
  if (block.loadExtraState) {
    block.loadExtraState(state['extraState']);
  } else if (block.domToMutation) {
    block.domToMutation(utilsXml.textToDom(state['extraState']));
  }
}

/**
 * Attempts to connect the block to the parent connection, if it exists.
 *
 * @param parentConnection The parent connection to try to connect the block to.
 * @param child The block to try to connect to the parent.
 * @param state The state which defines the given block
 */
function tryToConnectParent(
  parentConnection: Connection | undefined,
  child: Block,
  state: State,
) {
  if (!parentConnection) {
    return;
  }

  if (parentConnection.getSourceBlock().isShadow() && !child.isShadow()) {
    throw new RealChildOfShadow(state);
  }

  let connected = false;
  let childConnection;
  if (parentConnection.type === inputTypes.VALUE) {
    childConnection = child.outputConnection;
    if (!childConnection) {
      throw new MissingConnection('output', child, state);
    }
    connected = parentConnection.connect(childConnection);
  } else {
    // Statement type.
    childConnection = child.previousConnection;
    if (!childConnection) {
      throw new MissingConnection('previous', child, state);
    }
    connected = parentConnection.connect(childConnection);
  }

  if (!connected) {
    const checker = child.workspace.connectionChecker;
    throw new BadConnectionCheck(
      checker.getErrorMessage(
        checker.canConnectWithReason(childConnection, parentConnection, false),
        childConnection,
        parentConnection,
      ),
      parentConnection.type === inputTypes.VALUE
        ? 'output connection'
        : 'previous connection',
      child,
      state,
    );
  }
}

/**
 * Applies icon state to the icons on the block, based on the given state
 * object.
 *
 * @param block The block to set the icon state of.
 * @param state The state object to reference.
 */
function loadIcons(block: Block, state: State) {
  if (!state['icons']) return;

  const iconTypes = Object.keys(state['icons']);
  for (const iconType of iconTypes) {
    const iconState = state['icons'][iconType];
    let icon = block.getIcon(iconType);
    if (!icon) {
      const constructor = registry.getClass(
        registry.Type.ICON,
        iconType,
        false,
      );
      if (!constructor) throw new UnregisteredIcon(iconType, block, state);
      icon = new constructor(block);
      block.addIcon(icon);
    }
    if (isSerializable(icon)) icon.loadState(iconState);
  }
}

/**
 * Applies any field information available on the state object to the block.
 *
 * @param block The block to set the field state of.
 * @param state The state object to reference.
 */
function loadFields(block: Block, state: State) {
  if (!state['fields']) {
    return;
  }
  const keys = Object.keys(state['fields']);
  for (let i = 0; i < keys.length; i++) {
    const fieldName = keys[i];
    const fieldState = state['fields'][fieldName];
    const field = block.getField(fieldName);
    if (!field) {
      console.warn(
        `Ignoring non-existant field ${fieldName} in block ${block.type}`,
      );
      continue;
    }
    field.loadState(fieldState);
  }
}

/**
 * Creates any child blocks (attached to inputs) defined by the given state
 * and attaches them to the given block.
 *
 * @param block The block to attach input blocks to.
 * @param state The state object to reference.
 */
function loadInputBlocks(block: Block, state: State) {
  if (!state['inputs']) {
    return;
  }
  const keys = Object.keys(state['inputs']);
  for (let i = 0; i < keys.length; i++) {
    const inputName = keys[i];
    const input = block.getInput(inputName);
    if (!input || !input.connection) {
      throw new MissingConnection(inputName, block, state);
    }
    loadConnection(input.connection, state['inputs'][inputName]);
  }
}

/**
 * Creates any next blocks defined by the given state and attaches them to the
 * given block.
 *
 * @param block The block to attach next blocks to.
 * @param state The state object to reference.
 */
function loadNextBlocks(block: Block, state: State) {
  if (!state['next']) {
    return;
  }
  if (!block.nextConnection) {
    throw new MissingConnection('next', block, state);
  }
  loadConnection(block.nextConnection, state['next']);
}
/**
 * Applies the state defined by connectionState to the given connection, ie
 * assigns shadows and attaches child blocks.
 *
 * @param connection The connection to deserialize the connected blocks of.
 * @param connectionState The object containing the state of any connected
 *     shadow block, or any connected real block.
 */
function loadConnection(
  connection: Connection,
  connectionState: ConnectionState,
) {
  if (connectionState['shadow']) {
    connection.setShadowState(connectionState['shadow']);
  }
  if (connectionState['block']) {
    appendPrivate(
      connectionState['block'],
      connection.getSourceBlock().workspace,
      {parentConnection: connection},
    );
  }
}

// TODO(#5146): Remove this from the serialization system.
/**
 * Initializes the give block, eg init the model, inits the svg, renders, etc.
 *
 * @param block The block to initialize.
 * @param rendered Whether the block is a rendered or headless block.
 */
function initBlock(block: Block, rendered: boolean) {
  if (rendered) {
    const blockSvg = block as BlockSvg;
    // Adding connections to the connection db is expensive. This defers that
    // operation to decrease load time.
    blockSvg.setConnectionTracking(false);

    blockSvg.initSvg();
    blockSvg.queueRender();

    // fixes #6076 JSO deserialization doesn't
    // set .iconXY_ property so here it will be set
    for (const icon of blockSvg.getIcons()) {
      icon.onLocationChange(blockSvg.getRelativeToSurfaceXY());
    }
  } else {
    block.initModel();
  }
}

// Alias to disambiguate saving within the serializer.
const saveBlock = save;

/**
 * Serializer for saving and loading block state.
 */
export class BlockSerializer implements ISerializer {
  priority: number;

  constructor() {
    /** The priority for deserializing blocks. */
    this.priority = priorities.BLOCKS;
  }

  /**
   * Serializes the blocks of the given workspace.
   *
   * @param workspace The workspace to save the blocks of.
   * @returns The state of the workspace's blocks, or null if there are no
   *     blocks.
   */
  save(
    workspace: Workspace,
  ): {languageVersion: number; blocks: State[]} | null {
    const blockStates = [];
    for (const block of workspace.getTopBlocks(false)) {
      const state = saveBlock(block, {
        addCoordinates: true,
        doFullSerialization: false,
      });
      if (state) {
        blockStates.push(state);
      }
    }
    if (blockStates.length) {
      return {
        'languageVersion': 0, // Currently unused.
        'blocks': blockStates,
      };
    }
    return null;
  }

  /**
   * Deserializes the blocks defined by the given state into the given
   * workspace.
   *
   * @param state The state of the blocks to deserialize.
   * @param workspace The workspace to deserialize into.
   */
  load(
    state: {languageVersion: number; blocks: State[]},
    workspace: Workspace,
  ) {
    const blockStates = state['blocks'];
    for (const state of blockStates) {
      append(state, workspace, {recordUndo: eventUtils.getRecordUndo()});
    }
  }

  /**
   * Disposes of any blocks that exist on the workspace.
   *
   * @param workspace The workspace to clear the blocks of.
   */
  clear(workspace: Workspace) {
    // Cannot use workspace.clear() because that also removes variables.
    for (const block of workspace.getTopBlocks(false)) {
      block.dispose(false);
    }
  }
}

serializationRegistry.register('blocks', new BlockSerializer());
