/**
 * @license
 * Copyright 2011 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The class representing one block.
 *
 * @class
 */
// Former goog.module ID: Blockly.Block

// Unused import preserved for side-effects. Remove if unneeded.
import './events/events_block_change.js';
// Unused import preserved for side-effects. Remove if unneeded.
import './events/events_block_create.js';
// Unused import preserved for side-effects. Remove if unneeded.
import './events/events_block_delete.js';

import {Blocks} from './blocks.js';
import * as common from './common.js';
import {Connection} from './connection.js';
import {ConnectionType} from './connection_type.js';
import * as constants from './constants.js';
import type {Abstract} from './events/events_abstract.js';
import type {BlockChange} from './events/events_block_change.js';
import type {BlockMove} from './events/events_block_move.js';
import {EventType} from './events/type.js';
import * as eventUtils from './events/utils.js';
import * as Extensions from './extensions.js';
import type {Field} from './field.js';
import * as fieldRegistry from './field_registry.js';
import {DuplicateIconType} from './icons/exceptions.js';
import {IconType} from './icons/icon_types.js';
import type {MutatorIcon} from './icons/mutator_icon.js';
import {Align} from './inputs/align.js';
import {DummyInput} from './inputs/dummy_input.js';
import {EndRowInput} from './inputs/end_row_input.js';
import {Input} from './inputs/input.js';
import {StatementInput} from './inputs/statement_input.js';
import {ValueInput} from './inputs/value_input.js';
import {isCommentIcon} from './interfaces/i_comment_icon.js';
import {type IIcon} from './interfaces/i_icon.js';
import type {
  IVariableModel,
  IVariableState,
} from './interfaces/i_variable_model.js';
import * as registry from './registry.js';
import * as Tooltip from './tooltip.js';
import * as arrayUtils from './utils/array.js';
import {Coordinate} from './utils/coordinate.js';
import * as idGenerator from './utils/idgenerator.js';
import * as parsing from './utils/parsing.js';
import {Size} from './utils/size.js';
import type {Workspace} from './workspace.js';

/**
 * Class for one block.
 * Not normally called directly, workspace.newBlock() is preferred.
 */
export class Block {
  /**
   * An optional callback method to use whenever the block's parent workspace
   * changes. This is usually only called from the constructor, the block type
   * initializer function, or an extension initializer function.
   */
  onchange?: ((p1: Abstract) => void) | null;

  /** The language-neutral ID given to the collapsed input. */
  static readonly COLLAPSED_INPUT_NAME: string = constants.COLLAPSED_INPUT_NAME;

  /** The language-neutral ID given to the collapsed field. */
  static readonly COLLAPSED_FIELD_NAME: string = constants.COLLAPSED_FIELD_NAME;

  /**
   * Optional text data that round-trips between blocks and XML.
   * Has no effect. May be used by 3rd parties for meta information.
   */
  data: string | null = null;

  /**
   * Has this block been disposed of?
   *
   * @internal
   */
  disposed = false;

  /**
   * Colour of the block as HSV hue value (0-360)
   * This may be null if the block colour was not set via a hue number.
   */
  private hue: number | null = null;

  /** Colour of the block in '#RRGGBB' format. */
  protected colour_ = '#000000';

  /** Name of the block style. */
  protected styleName_ = '';

  /** An optional method called during initialization. */
  init?: () => void;

  /** An optional method called during disposal. */
  destroy?: () => void;

  /**
   * An optional serialization method for defining how to serialize the
   * mutation state to XML. This must be coupled with defining
   * `domToMutation`.
   */
  mutationToDom?: (...p1: AnyDuringMigration[]) => Element;

  /**
   * An optional deserialization method for defining how to deserialize the
   * mutation state from XML. This must be coupled with defining
   * `mutationToDom`.
   */
  domToMutation?: (p1: Element) => void;

  /**
   * An optional serialization method for defining how to serialize the
   * block's extra state (eg mutation state) to something JSON compatible.
   * This must be coupled with defining `loadExtraState`.
   *
   * @param doFullSerialization Whether or not to serialize the full state of
   *     the extra state (rather than possibly saving a reference to some
   *     state). This is used during copy-paste. See the
   *     {@link https://developers.devsite.google.com/blockly/guides/create-custom-blocks/extensions#full_serialization_and_backing_data | block serialization docs}
   *     for more information.
   */
  saveExtraState?: (doFullSerialization?: boolean) => AnyDuringMigration;

  /**
   * An optional serialization method for defining how to deserialize the
   * block's extra state (eg mutation state) from something JSON compatible.
   * This must be coupled with defining `saveExtraState`.
   */
  loadExtraState?: (p1: AnyDuringMigration) => void;

  /**
   * An optional property for suppressing adding STATEMENT_PREFIX and
   * STATEMENT_SUFFIX to generated code.
   */
  suppressPrefixSuffix: boolean | null = false;

  /**
   * An optional method for declaring developer variables, to be used
   * by generators.  Developer variables are never shown to the user,
   * but are declared as global variables in the generated code.
   *
   * @returns a list of developer variable names.
   */
  getDeveloperVariables?: () => string[];

  /**
   * An optional method that reconfigures the block based on the
   * contents of the mutator dialog.
   *
   * @param rootBlock The root block in the mutator flyout.
   */
  compose?: (rootBlock: Block) => void;

  /**
   * An optional function that populates the mutator flyout with
   * blocks representing this block's configuration.
   *
   * @param workspace The mutator flyout's workspace.
   * @returns The root block created in the flyout's workspace.
   */
  decompose?: (workspace: Workspace) => Block;

  id: string;
  outputConnection: Connection | null = null;
  nextConnection: Connection | null = null;
  previousConnection: Connection | null = null;
  inputList: Input[] = [];
  inputsInline?: boolean;
  icons: IIcon[] = [];
  private disabledReasons = new Set<string>();
  tooltip: Tooltip.TipInfo = '';
  contextMenu = true;

  protected parentBlock_: this | null = null;

  protected childBlocks_: this[] = [];

  private deletable = true;

  private movable = true;

  private editable = true;

  private shadow = false;

  protected collapsed_ = false;
  protected outputShape_: number | null = null;

  /**
   * Is the current block currently in the process of being disposed?
   */
  protected disposing = false;

  /**
   * Has this block been fully initialized? E.g. all fields initailized.
   *
   * @internal
   */
  initialized = false;

  private readonly xy: Coordinate;
  isInFlyout: boolean;
  isInMutator: boolean;
  RTL: boolean;

  /** True if this block is an insertion marker. */
  protected isInsertionMarker_ = false;

  /** Name of the type of hat. */
  hat?: string;

  /** Is this block a BlockSVG? */
  readonly rendered: boolean = false;

  /**
   * String for block help, or function that returns a URL. Null for no help.
   */
  helpUrl: string | (() => string) | null = null;

  /** A bound callback function to use when the parent workspace changes. */
  private onchangeWrapper: ((p1: Abstract) => void) | null = null;

  /**
   * A count of statement inputs on the block.
   *
   * @internal
   */
  statementInputCount = 0;
  // TODO(b/109816955): remove '!', see go/strict-prop-init-fix.
  type!: string;
  // Record initial inline state.
  inputsInlineDefault?: boolean;
  workspace: Workspace;

  /**
   * @param workspace The block's workspace.
   * @param prototypeName Name of the language object containing type-specific
   *     functions for this block.
   * @param opt_id Optional ID.  Use this ID if provided, otherwise create a new
   *     ID.
   * @throws When the prototypeName is not valid or not allowed.
   */
  constructor(workspace: Workspace, prototypeName: string, opt_id?: string) {
    this.workspace = workspace;

    this.id =
      opt_id && !workspace.getBlockById(opt_id) ? opt_id : idGenerator.genUid();
    workspace.setBlockById(this.id, this);

    /**
     * The block's position in workspace units.  (0, 0) is at the workspace's
     * origin; scale does not change this value.
     */
    this.xy = new Coordinate(0, 0);
    this.isInFlyout = workspace.isFlyout;
    this.isInMutator = workspace.isMutator;

    this.RTL = workspace.RTL;

    // Copy the type-specific functions and data from the prototype.
    if (prototypeName) {
      this.type = prototypeName;
      const prototype = Blocks[prototypeName];
      if (!prototype || typeof prototype !== 'object') {
        throw TypeError('Invalid block definition for type: ' + prototypeName);
      }
      Object.assign(this, prototype);
    }

    workspace.addTopBlock(this);
    workspace.addTypedBlock(this);

    if (new.target === Block) {
      this.doInit_();
    }
  }

  /** Calls the init() function and handles associated event firing, etc. */
  protected doInit_() {
    // All events fired should be part of the same group.
    // Any events fired during init should not be undoable,
    // so that block creation is atomic.
    const existingGroup = eventUtils.getGroup();
    if (!existingGroup) {
      eventUtils.setGroup(true);
    }
    const initialUndoFlag = eventUtils.getRecordUndo();

    try {
      // Call an initialization function, if it exists.
      if (typeof this.init === 'function') {
        eventUtils.setRecordUndo(false);
        this.init();
        eventUtils.setRecordUndo(initialUndoFlag);
      }

      // Fire a create event.
      if (eventUtils.isEnabled()) {
        eventUtils.fire(new (eventUtils.get(EventType.BLOCK_CREATE))(this));
      }
    } finally {
      eventUtils.setGroup(existingGroup);
      // In case init threw, recordUndo flag should still be reset.
      eventUtils.setRecordUndo(initialUndoFlag);
    }
    this.inputsInlineDefault = this.inputsInline;

    // Bind an onchange function, if it exists.
    if (typeof this.onchange === 'function') {
      this.setOnChange(this.onchange);
    }
  }

  /**
   * Dispose of this block.
   *
   * @param healStack If true, then try to heal any gap by connecting the next
   *     statement with the previous statement.  Otherwise, dispose of all
   *     children of this block.
   */
  dispose(healStack = false) {
    this.disposing = true;

    // Dispose of this change listener before unplugging.
    // Technically not necessary due to the event firing delay.
    // But future-proofing.
    if (this.onchangeWrapper) {
      this.workspace.removeChangeListener(this.onchangeWrapper);
    }

    this.unplug(healStack);
    if (eventUtils.isEnabled()) {
      // Constructing the delete event is costly. Only perform if necessary.
      eventUtils.fire(new (eventUtils.get(EventType.BLOCK_DELETE))(this));
    }
    this.workspace.removeTopBlock(this);
    this.disposeInternal();
  }

  /**
   * Disposes of this block without doing things required by the top block.
   * E.g. does not fire events, unplug the block, etc.
   */
  protected disposeInternal() {
    this.disposing = true;
    if (this.onchangeWrapper) {
      this.workspace.removeChangeListener(this.onchangeWrapper);
    }

    this.workspace.removeTypedBlock(this);
    this.workspace.removeBlockById(this.id);

    if (typeof this.destroy === 'function') this.destroy();

    this.childBlocks_.forEach((c) => c.disposeInternal());
    this.inputList.forEach((i) => i.dispose());
    this.inputList.length = 0;
    this.getConnections_(true).forEach((c) => c.dispose());
    this.disposed = true;
  }

  /**
   * Returns true if the block is either in the process of being disposed, or
   * is disposed.
   *
   * @internal
   */
  isDeadOrDying(): boolean {
    return this.disposing || this.disposed;
  }

  /**
   * Call initModel on all fields on the block.
   * May be called more than once.
   * Either initModel or initSvg must be called after creating a block and
   * before the first interaction with it.  Interactions include UI actions
   * (e.g. clicking and dragging) and firing events (e.g. create, delete, and
   * change).
   */
  initModel() {
    if (this.initialized) return;
    for (const input of this.inputList) {
      input.initModel();
    }
    this.initialized = true;
  }

  /**
   * Unplug this block from its superior block.  If this block is a statement,
   * optionally reconnect the block underneath with the block on top.
   *
   * @param opt_healStack Disconnect child statement and reconnect stack.
   *     Defaults to false.
   */
  unplug(opt_healStack?: boolean) {
    if (this.outputConnection) {
      this.unplugFromRow(opt_healStack);
    }
    if (this.previousConnection) {
      this.unplugFromStack(opt_healStack);
    }
  }

  /**
   * Unplug this block's output from an input on another block.  Optionally
   * reconnect the block's parent to the only child block, if possible.
   *
   * @param opt_healStack Disconnect right-side block and connect to left-side
   *     block.  Defaults to false.
   */
  private unplugFromRow(opt_healStack?: boolean) {
    let parentConnection = null;
    if (this.outputConnection?.isConnected()) {
      parentConnection = this.outputConnection.targetConnection;
      // Disconnect from any superior block.
      this.outputConnection.disconnect();
    }

    // Return early in obvious cases.
    if (!parentConnection || !opt_healStack) {
      return;
    }

    const thisConnection = this.getOnlyValueConnection();
    if (
      !thisConnection ||
      !thisConnection.isConnected() ||
      thisConnection.targetBlock()!.isShadow()
    ) {
      // Too many or too few possible connections on this block, or there's
      // nothing on the other side of this connection.
      return;
    }

    const childConnection = thisConnection.targetConnection;
    // Disconnect the child block.
    childConnection?.disconnect();
    // Connect child to the parent if possible, otherwise bump away.
    if (
      this.workspace.connectionChecker.canConnect(
        childConnection,
        parentConnection,
        false,
      )
    ) {
      parentConnection.connect(childConnection!);
    } else {
      childConnection?.onFailedConnect(parentConnection);
    }
  }

  /**
   * Returns the connection on the value input that is connected to another
   * block. When an insertion marker is connected to a connection with a block
   * already attached, the connected block is attached to the insertion marker.
   * Since only one block can be displaced and attached to the insertion marker
   * this should only ever return one connection.
   *
   * @returns The connection on the value input, or null.
   */
  private getOnlyValueConnection(): Connection | null {
    let connection = null;
    for (let i = 0; i < this.inputList.length; i++) {
      const thisConnection = this.inputList[i].connection;
      if (
        thisConnection &&
        thisConnection.type === ConnectionType.INPUT_VALUE &&
        thisConnection.targetConnection
      ) {
        if (connection) {
          return null; // More than one value input found.
        }
        connection = thisConnection;
      }
    }
    return connection;
  }

  /**
   * Unplug this statement block from its superior block.  Optionally reconnect
   * the block underneath with the block on top.
   *
   * @param opt_healStack Disconnect child statement and reconnect stack.
   *     Defaults to false.
   */
  private unplugFromStack(opt_healStack?: boolean) {
    let previousTarget = null;
    if (this.previousConnection?.isConnected()) {
      // Remember the connection that any next statements need to connect to.
      previousTarget = this.previousConnection.targetConnection;
      // Detach this block from the parent's tree.
      this.previousConnection.disconnect();
    }

    if (!opt_healStack) return;

    // Immovable or shadow next blocks need to move along with the block; keep
    // going until we encounter a normal block or run off the end of the stack.
    let nextBlock = this.getNextBlock();
    while (nextBlock && (nextBlock.isShadow() || !nextBlock.isMovable())) {
      nextBlock = nextBlock.getNextBlock();
    }
    if (!nextBlock) return;

    // Disconnect the next statement.
    const nextTarget =
      nextBlock.previousConnection?.targetBlock()?.nextConnection
        ?.targetConnection ?? null;
    nextTarget?.disconnect();
    if (
      previousTarget &&
      this.workspace.connectionChecker.canConnect(
        previousTarget,
        nextTarget,
        false,
      )
    ) {
      // Attach the next statement to the previous statement.
      previousTarget.connect(nextTarget!);
    }
  }

  /**
   * Returns all connections originating from this block.
   *
   * @param _all If true, return all connections even hidden ones.
   * @returns Array of connections.
   * @internal
   */
  getConnections_(_all: boolean): Connection[] {
    const myConnections = [];
    if (this.outputConnection) {
      myConnections.push(this.outputConnection);
    }
    if (this.previousConnection) {
      myConnections.push(this.previousConnection);
    }
    if (this.nextConnection) {
      myConnections.push(this.nextConnection);
    }
    for (let i = 0, input; (input = this.inputList[i]); i++) {
      if (input.connection) {
        myConnections.push(input.connection);
      }
    }
    return myConnections;
  }

  /**
   * Walks down a stack of blocks and finds the last next connection on the
   * stack.
   *
   * @param ignoreShadows If true,the last connection on a non-shadow block will
   *     be returned. If false, this will follow shadows to find the last
   *     connection.
   * @returns The last next connection on the stack, or null.
   * @internal
   */
  lastConnectionInStack(ignoreShadows: boolean): Connection | null {
    let nextConnection = this.nextConnection;
    while (nextConnection) {
      const nextBlock = nextConnection.targetBlock();
      if (!nextBlock || (ignoreShadows && nextBlock.isShadow())) {
        return nextConnection;
      }
      nextConnection = nextBlock.nextConnection;
    }
    return null;
  }

  /**
   * Bump unconnected blocks out of alignment.  Two blocks which aren't actually
   * connected should not coincidentally line up on screen.
   */
  bumpNeighbours() {}

  /**
   * Return the parent block or null if this block is at the top level. The
   * parent block is either the block connected to the previous connection (for
   * a statement block) or the block connected to the output connection (for a
   * value block).
   *
   * @returns The block (if any) that holds the current block.
   */
  getParent(): this | null {
    return this.parentBlock_;
  }

  /**
   * Return the input that connects to the specified block.
   *
   * @param block A block connected to an input on this block.
   * @returns The input (if any) that connects to the specified block.
   */
  getInputWithBlock(block: Block): Input | null {
    for (let i = 0, input; (input = this.inputList[i]); i++) {
      if (input.connection && input.connection.targetBlock() === block) {
        return input;
      }
    }
    return null;
  }

  /**
   * Return the parent block that surrounds the current block, or null if this
   * block has no surrounding block.  A parent block might just be the previous
   * statement, whereas the surrounding block is an if statement, while loop,
   * etc.
   *
   * @returns The block (if any) that surrounds the current block.
   */
  getSurroundParent(): this | null {
    /* eslint-disable-next-line @typescript-eslint/no-this-alias */
    let block: this | null = this;
    let prevBlock;
    do {
      prevBlock = block;
      block = block.getParent();
      if (!block) {
        // Ran off the top.
        return null;
      }
    } while (block.getNextBlock() === prevBlock);
    // This block is an enclosing parent, not just a statement in a stack.
    return block;
  }

  /**
   * Return the next statement block directly connected to this block.
   *
   * @returns The next statement block or null.
   */
  getNextBlock(): Block | null {
    return this.nextConnection && this.nextConnection.targetBlock();
  }

  /**
   * Returns the block connected to the previous connection.
   *
   * @returns The previous statement block or null.
   */
  getPreviousBlock(): Block | null {
    return this.previousConnection && this.previousConnection.targetBlock();
  }

  /**
   * Return the top-most block in this block's tree.
   * This will return itself if this block is at the top level.
   *
   * @returns The root block.
   */
  getRootBlock(): this {
    let rootBlock: this;
    /* eslint-disable-next-line @typescript-eslint/no-this-alias */
    let block: this | null = this;
    do {
      rootBlock = block;
      block = rootBlock.parentBlock_;
    } while (block);
    return rootBlock;
  }

  /**
   * Walk up from the given block up through the stack of blocks to find
   * the top block of the sub stack. If we are nested in a statement input only
   * find the top-most nested block. Do not go all the way to the root block.
   *
   * @returns The top block in a stack.
   * @internal
   */
  getTopStackBlock(): this {
    /* eslint-disable-next-line @typescript-eslint/no-this-alias */
    let block = this;
    let previous;
    do {
      previous = block.getPreviousBlock();
      // AnyDuringMigration because:  Type 'Block' is not assignable to type
      // 'this'.
    } while (
      previous &&
      previous.getNextBlock() === block &&
      (block = previous as AnyDuringMigration)
    );
    return block;
  }

  /**
   * Find all the blocks that are directly nested inside this one.
   * Includes value and statement inputs, as well as any following statement.
   * Excludes any connection on an output tab or any preceding statement.
   * Blocks are optionally sorted by position; top to bottom.
   *
   * @param ordered Sort the list if true.
   * @returns Array of blocks.
   */
  getChildren(ordered: boolean): Block[] {
    if (!ordered) {
      return this.childBlocks_;
    }
    const blocks = [];
    for (let i = 0, input; (input = this.inputList[i]); i++) {
      if (input.connection) {
        const child = input.connection.targetBlock();
        if (child) {
          blocks.push(child);
        }
      }
    }
    const next = this.getNextBlock();
    if (next) {
      blocks.push(next);
    }
    return blocks;
  }

  /**
   * Set parent of this block to be a new block or null.
   *
   * @param newParent New parent block.
   * @internal
   */
  setParent(newParent: this | null) {
    if (newParent === this.parentBlock_) {
      return;
    }

    // Check that block is connected to new parent if new parent is not null and
    // that block is not connected to superior one if new parent is null.
    const targetBlock =
      (this.previousConnection && this.previousConnection.targetBlock()) ||
      (this.outputConnection && this.outputConnection.targetBlock());
    const isConnected = !!targetBlock;

    if (isConnected && newParent && targetBlock !== newParent) {
      throw Error('Block connected to superior one that is not new parent.');
    } else if (!isConnected && newParent) {
      throw Error('Block not connected to new parent.');
    } else if (isConnected && !newParent) {
      throw Error(
        'Cannot set parent to null while block is still connected to' +
          ' superior block.',
      );
    }

    // This block hasn't actually moved on-screen, so there's no need to
    // update its connection locations.
    if (this.parentBlock_) {
      // Remove this block from the old parent's child list.
      arrayUtils.removeElem(this.parentBlock_.childBlocks_, this);
    } else {
      // New parent must be non-null so remove this block from the
      // workspace's list of top-most blocks.
      this.workspace.removeTopBlock(this);
    }

    this.parentBlock_ = newParent;
    if (newParent) {
      // Add this block to the new parent's child list.
      newParent.childBlocks_.push(this);
    } else {
      this.workspace.addTopBlock(this);
    }
  }

  /**
   * Find all the blocks that are directly or indirectly nested inside this one.
   * Includes this block in the list.
   * Includes value and statement inputs, as well as any following statements.
   * Excludes any connection on an output tab or any preceding statements.
   * Blocks are optionally sorted by position; top to bottom.
   *
   * @param ordered Sort the list if true.
   * @returns Flattened array of blocks.
   */
  getDescendants(ordered: boolean): this[] {
    const blocks = [this];
    const childBlocks = this.getChildren(ordered);
    for (let child, i = 0; (child = childBlocks[i]); i++) {
      // AnyDuringMigration because:  Argument of type 'Block[]' is not
      // assignable to parameter of type 'this[]'.
      blocks.push(...(child.getDescendants(ordered) as AnyDuringMigration));
    }
    return blocks;
  }

  /**
   * Get whether this block is deletable or not.
   *
   * @returns True if deletable.
   */
  isDeletable(): boolean {
    return (
      this.deletable &&
      !this.isInFlyout &&
      !this.shadow &&
      !this.isDeadOrDying() &&
      !this.workspace.isReadOnly()
    );
  }

  /**
   * Return whether this block's own deletable property is true or false.
   *
   * @returns True if the block's deletable property is true, false otherwise.
   */
  isOwnDeletable(): boolean {
    return this.deletable;
  }

  /**
   * Set whether this block is deletable or not.
   *
   * @param deletable True if deletable.
   */
  setDeletable(deletable: boolean) {
    this.deletable = deletable;
  }

  /**
   * Get whether this block is movable or not.
   *
   * @returns True if movable.
   * @internal
   */
  isMovable(): boolean {
    return (
      this.movable &&
      !this.isInFlyout &&
      !this.shadow &&
      !this.isDeadOrDying() &&
      !this.workspace.isReadOnly()
    );
  }

  /**
   * Return whether this block's own movable property is true or false.
   *
   * @returns True if the block's movable property is true, false otherwise.
   * @internal
   */
  isOwnMovable(): boolean {
    return this.movable;
  }

  /**
   * Set whether this block is movable or not.
   *
   * @param movable True if movable.
   */
  setMovable(movable: boolean) {
    this.movable = movable;
  }

  /**
   * Get whether is block is duplicatable or not. If duplicating this block and
   * descendants will put this block over the workspace's capacity this block is
   * not duplicatable. If duplicating this block and descendants will put any
   * type over their maxInstances this block is not duplicatable.
   *
   * @returns True if duplicatable.
   */
  isDuplicatable(): boolean {
    if (!this.workspace.hasBlockLimits()) {
      return true;
    }
    return this.workspace.isCapacityAvailable(
      common.getBlockTypeCounts(this, true),
    );
  }

  /**
   * Get whether this block is a shadow block or not.
   *
   * @returns True if a shadow.
   */
  isShadow(): boolean {
    return this.shadow;
  }

  /**
   * Set whether this block is a shadow block or not.
   * This method is internal and should not be called by users of Blockly. To
   * create shadow blocks programmatically call connection.setShadowState
   *
   * @param shadow True if a shadow.
   * @internal
   */
  setShadow(shadow: boolean) {
    this.shadow = shadow;
  }

  /**
   * Get whether this block is an insertion marker block or not.
   *
   * @returns True if an insertion marker.
   */
  isInsertionMarker(): boolean {
    return this.isInsertionMarker_;
  }

  /**
   * Set whether this block is an insertion marker block or not.
   * Once set this cannot be unset.
   *
   * @param insertionMarker True if an insertion marker.
   * @internal
   */
  setInsertionMarker(insertionMarker: boolean) {
    this.isInsertionMarker_ = insertionMarker;
  }

  /**
   * Get whether this block is editable or not.
   *
   * @returns True if editable.
   * @internal
   */
  isEditable(): boolean {
    return (
      this.editable && !this.isDeadOrDying() && !this.workspace.isReadOnly()
    );
  }

  /**
   * Return whether this block's own editable property is true or false.
   *
   * @returns True if the block's editable property is true, false otherwise.
   */
  isOwnEditable(): boolean {
    return this.editable;
  }

  /**
   * Set whether this block is editable or not.
   *
   * @param editable True if editable.
   */
  setEditable(editable: boolean) {
    this.editable = editable;
    for (const field of this.getFields()) {
      field.updateEditable();
    }
  }

  /**
   * Returns if this block has been disposed of / deleted.
   *
   * @returns True if this block has been disposed of / deleted.
   */
  isDisposed(): boolean {
    return this.disposed;
  }

  /**
   * @returns True if this block is a value block with a full block field.
   * @param mustBeFullBlock Whether the evaluated field must be 'full-block'.
   * @param mustBeEditable Whether the evaluated field must be editable.
   * @internal
   */
  isSimpleReporter(
    mustBeFullBlock: boolean = false,
    mustBeEditable: boolean = false,
  ): boolean {
    return (
      this.getSingletonFullBlockField(mustBeFullBlock, mustBeEditable) !== null
    );
  }

  /**
   * Determines and returns the only field of this block, or null if there isn't
   * one and this block can't be considered a simple reporter. Null will also be
   * returned if the singleton block doesn't match additional criteria, if set,
   * such as being full-block or editable.
   *
   * @param mustBeFullBlock Whether the returned field must be 'full-block'.
   * @param mustBeEditable Whether the returned field must be editable.
   * @returns The only full-block, maybe editable field of this block, or null.
   * @internal
   */
  getSingletonFullBlockField(
    mustBeFullBlock: boolean,
    mustBeEditable: boolean,
  ): Field<any> | null {
    if (!this.outputConnection) return null;
    for (const input of this.inputList) if (input.connection) return null;
    const matchingFields = Array.from(this.getFields()).filter((field) => {
      if (mustBeFullBlock && !field.isFullBlockField()) return false;
      if (mustBeEditable && !field.isCurrentlyEditable()) return false;
      return true;
    });
    return matchingFields.length === 1 ? matchingFields[0] : null;
  }

  /**
   * Find the connection on this block that corresponds to the given connection
   * on the other block.
   * Used to match connections between a block and its insertion marker.
   *
   * @param otherBlock The other block to match against.
   * @param conn The other connection to match.
   * @returns The matching connection on this block, or null.
   * @internal
   */
  getMatchingConnection(
    otherBlock: Block,
    conn: Connection,
  ): Connection | null {
    const connections = this.getConnections_(true);
    const otherConnections = otherBlock.getConnections_(true);
    if (connections.length !== otherConnections.length) {
      throw Error('Connection lists did not match in length.');
    }
    for (let i = 0; i < otherConnections.length; i++) {
      if (otherConnections[i] === conn) {
        return connections[i];
      }
    }
    return null;
  }

  /**
   * Set the URL of this block's help page.
   *
   * @param url URL string for block help, or function that returns a URL.  Null
   *     for no help.
   */
  setHelpUrl(url: string | (() => string)) {
    this.helpUrl = url;
  }

  /**
   * Sets the tooltip for this block.
   *
   * @param newTip The text for the tooltip, a function that returns the text
   *     for the tooltip, or a parent object whose tooltip will be used. To not
   *     display a tooltip pass the empty string.
   */
  setTooltip(newTip: Tooltip.TipInfo) {
    this.tooltip = newTip;
  }

  /**
   * Returns the tooltip text for this block.
   *
   * @returns The tooltip text for this block.
   */
  getTooltip(): string {
    return Tooltip.getTooltipOfObject(this);
  }

  /**
   * Get the colour of a block.
   *
   * @returns #RRGGBB string.
   */
  getColour(): string {
    return this.colour_;
  }

  /**
   * Get the name of the block style.
   *
   * @returns Name of the block style.
   */
  getStyleName(): string {
    return this.styleName_;
  }

  /**
   * Get the HSV hue value of a block.  Null if hue not set.
   *
   * @returns Hue value (0-360).
   */
  getHue(): number | null {
    return this.hue;
  }

  /**
   * Change the colour of a block.
   *
   * @param colour HSV hue value (0 to 360), #RRGGBB string, or a message
   *     reference string pointing to one of those two values.
   */
  setColour(colour: number | string) {
    const parsed = parsing.parseBlockColour(colour);
    this.hue = parsed.hue;
    this.colour_ = parsed.hex;
  }

  /**
   * Set the style and colour values of a block.
   *
   * @param blockStyleName Name of the block style.
   */
  setStyle(blockStyleName: string) {
    this.styleName_ = blockStyleName;
  }

  /**
   * Sets a callback function to use whenever the block's parent workspace
   * changes, replacing any prior onchange handler. This is usually only called
   * from the constructor, the block type initializer function, or an extension
   * initializer function.
   *
   * @param onchangeFn The callback to call when the block's workspace changes.
   * @throws {Error} if onchangeFn is not falsey and not a function.
   */
  setOnChange(onchangeFn: (p1: Abstract) => void) {
    if (onchangeFn && typeof onchangeFn !== 'function') {
      throw Error('onchange must be a function.');
    }
    if (this.onchangeWrapper) {
      this.workspace.removeChangeListener(this.onchangeWrapper);
    }
    this.onchange = onchangeFn;
    this.onchangeWrapper = onchangeFn.bind(this);
    this.workspace.addChangeListener(this.onchangeWrapper);
  }

  /**
   * Returns the named field from a block.
   *
   * @param name The name of the field.
   * @returns Named field, or null if field does not exist.
   */
  getField(name: string): Field | null {
    if (typeof name !== 'string') {
      throw TypeError(
        'Block.prototype.getField expects a string ' +
          'with the field name but received ' +
          (name === undefined ? 'nothing' : name + ' of type ' + typeof name) +
          ' instead',
      );
    }
    for (const field of this.getFields()) {
      if (field.name === name) {
        return field;
      }
    }
    return null;
  }

  /**
   * Returns a generator that provides every field on the block.
   *
   * @returns A generator that can be used to iterate the fields on the block.
   */
  *getFields(): Generator<Field, undefined, void> {
    for (const input of this.inputList) {
      for (const field of input.fieldRow) {
        yield field;
      }
    }
  }

  /**
   * Return all variables referenced by this block.
   *
   * @returns List of variable ids.
   */
  getVars(): string[] {
    const vars: string[] = [];
    for (const field of this.getFields()) {
      if (field.referencesVariables()) {
        vars.push(field.getValue());
      }
    }
    return vars;
  }

  /**
   * Return all variables referenced by this block.
   *
   * @returns List of variable models.
   * @internal
   */
  getVarModels(): IVariableModel<IVariableState>[] {
    const vars = [];
    for (const field of this.getFields()) {
      if (field.referencesVariables()) {
        const model = this.workspace.getVariableById(
          field.getValue() as string,
        );
        // Check if the variable actually exists (and isn't just a potential
        // variable).
        if (model) {
          vars.push(model);
        }
      }
    }
    return vars;
  }

  /**
   * Notification that a variable is renaming but keeping the same ID.  If the
   * variable is in use on this block, rerender to show the new name.
   *
   * @param variable The variable being renamed.
   * @internal
   */
  updateVarName(variable: IVariableModel<IVariableState>) {
    for (const field of this.getFields()) {
      if (
        field.referencesVariables() &&
        variable.getId() === field.getValue()
      ) {
        field.refreshVariableName();
      }
    }
  }

  /**
   * Notification that a variable is renaming.
   * If the ID matches one of this block's variables, rename it.
   *
   * @param oldId ID of variable to rename.
   * @param newId ID of new variable.  May be the same as oldId, but with an
   *     updated name.
   */
  renameVarById(oldId: string, newId: string) {
    for (const field of this.getFields()) {
      if (field.referencesVariables() && oldId === field.getValue()) {
        field.setValue(newId);
      }
    }
  }

  /**
   * Returns the language-neutral value of the given field.
   *
   * @param name The name of the field.
   * @returns Value of the field or null if field does not exist.
   */
  getFieldValue(name: string): AnyDuringMigration {
    const field = this.getField(name);
    if (field) {
      return field.getValue();
    }
    return null;
  }

  /**
   * Sets the value of the given field for this block.
   *
   * @param newValue The value to set.
   * @param name The name of the field to set the value of.
   */
  setFieldValue(newValue: AnyDuringMigration, name: string) {
    const field = this.getField(name);
    if (!field) {
      throw Error('Field "' + name + '" not found.');
    }
    field.setValue(newValue);
  }

  /**
   * Set whether this block can chain onto the bottom of another block.
   *
   * @param newBoolean True if there can be a previous statement.
   * @param opt_check Statement type or list of statement types.  Null/undefined
   *     if any type could be connected.
   */
  setPreviousStatement(
    newBoolean: boolean,
    opt_check?: string | string[] | null,
  ) {
    if (newBoolean) {
      if (opt_check === undefined) {
        opt_check = null;
      }
      if (!this.previousConnection) {
        this.previousConnection = this.makeConnection_(
          ConnectionType.PREVIOUS_STATEMENT,
        );
      }
      this.previousConnection.setCheck(opt_check);
    } else {
      if (this.previousConnection) {
        if (this.previousConnection.isConnected()) {
          throw Error(
            'Must disconnect previous statement before removing ' +
              'connection.',
          );
        }
        this.previousConnection.dispose();
        this.previousConnection = null;
      }
    }
  }

  /**
   * Set whether another block can chain onto the bottom of this block.
   *
   * @param newBoolean True if there can be a next statement.
   * @param opt_check Statement type or list of statement types.  Null/undefined
   *     if any type could be connected.
   */
  setNextStatement(newBoolean: boolean, opt_check?: string | string[] | null) {
    if (newBoolean) {
      if (opt_check === undefined) {
        opt_check = null;
      }
      if (!this.nextConnection) {
        this.nextConnection = this.makeConnection_(
          ConnectionType.NEXT_STATEMENT,
        );
      }
      this.nextConnection.setCheck(opt_check);
    } else {
      if (this.nextConnection) {
        if (this.nextConnection.isConnected()) {
          throw Error(
            'Must disconnect next statement before removing ' + 'connection.',
          );
        }
        this.nextConnection.dispose();
        this.nextConnection = null;
      }
    }
  }

  /**
   * Set whether this block returns a value.
   *
   * @param newBoolean True if there is an output.
   * @param opt_check Returned type or list of returned types.  Null or
   *     undefined if any type could be returned (e.g. variable get).
   */
  setOutput(newBoolean: boolean, opt_check?: string | string[] | null) {
    if (newBoolean) {
      if (opt_check === undefined) {
        opt_check = null;
      }
      if (!this.outputConnection) {
        this.outputConnection = this.makeConnection_(
          ConnectionType.OUTPUT_VALUE,
        );
      }
      this.outputConnection.setCheck(opt_check);
    } else {
      if (this.outputConnection) {
        if (this.outputConnection.isConnected()) {
          throw Error(
            'Must disconnect output value before removing connection.',
          );
        }
        this.outputConnection.dispose();
        this.outputConnection = null;
      }
    }
  }

  /**
   * Set whether value inputs are arranged horizontally or vertically.
   *
   * @param newBoolean True if inputs are horizontal.
   */
  setInputsInline(newBoolean: boolean) {
    if (this.inputsInline !== newBoolean) {
      eventUtils.fire(
        new (eventUtils.get(EventType.BLOCK_CHANGE))(
          this,
          'inline',
          null,
          this.inputsInline,
          newBoolean,
        ),
      );
      this.inputsInline = newBoolean;
    }
  }

  /**
   * Get whether value inputs are arranged horizontally or vertically.
   *
   * @returns True if inputs are horizontal.
   */
  getInputsInline(): boolean {
    if (this.inputsInline !== undefined) {
      // Set explicitly.
      return this.inputsInline;
    }
    // Not defined explicitly.  Figure out what would look best.
    for (let i = 1; i < this.inputList.length; i++) {
      if (
        this.inputList[i - 1] instanceof DummyInput &&
        this.inputList[i] instanceof DummyInput
      ) {
        // Two dummy inputs in a row.  Don't inline them.
        return false;
      }
    }
    for (let i = 1; i < this.inputList.length; i++) {
      if (
        this.inputList[i - 1] instanceof ValueInput &&
        this.inputList[i] instanceof DummyInput
      ) {
        // Dummy input after a value input.  Inline them.
        return true;
      }
    }
    for (let i = 0; i < this.inputList.length; i++) {
      if (this.inputList[i] instanceof EndRowInput) {
        // A row-end input is present. Inline value inputs.
        return true;
      }
    }
    return false;
  }

  /**
   * Set the block's output shape.
   *
   * @param outputShape Value representing an output shape.
   */
  setOutputShape(outputShape: number | null) {
    this.outputShape_ = outputShape;
  }

  /**
   * Get the block's output shape.
   *
   * @returns Value representing output shape if one exists.
   */
  getOutputShape(): number | null {
    return this.outputShape_;
  }

  /**
   * Get whether this block is enabled or not. A block is considered enabled
   * if there aren't any reasons why it would be disabled. A block may still
   * be disabled for other reasons even if the user attempts to manually
   * enable it, such as when the block is in an invalid location.
   *
   * @returns True if enabled.
   */
  isEnabled(): boolean {
    return this.disabledReasons.size === 0;
  }

  /**
   * Add or remove a reason why the block might be disabled. If a block has
   * any reasons to be disabled, then the block itself will be considered
   * disabled. A block could be disabled for multiple independent reasons
   * simultaneously, such as when the user manually disables it, or the block
   * is invalid.
   *
   * @param disabled If true, then the block should be considered disabled for
   *     at least the provided reason, otherwise the block is no longer disabled
   *     for that reason.
   * @param reason A language-neutral identifier for a reason why the block
   *     could be disabled. Call this method again with the same identifier to
   *     update whether the block is currently disabled for this reason.
   */
  setDisabledReason(disabled: boolean, reason: string): void {
    // Workspaces that were serialized before the reason for being disabled
    // could be specified may have blocks that are disabled without a known
    // reason. On being loaded, these blocks will default to having the manually
    // disabled reason. However, if the user isn't allowed to manually disable
    // or enable blocks, then this manually disabled reason cannot be removed.
    // For backward compatibility with these legacy workspaces, when removing
    // any disabled reason and the workspace does not allow manually disabling
    // but the block is manually disabled, then remove the manually disabled
    // reason in addition to the more specific reason. For example, when an
    // orphaned block is no longer orphaned, the block should be enabled again.
    if (
      !disabled &&
      !this.workspace.options.disable &&
      this.hasDisabledReason(constants.MANUALLY_DISABLED) &&
      reason != constants.MANUALLY_DISABLED
    ) {
      this.setDisabledReason(false, constants.MANUALLY_DISABLED);
    }

    if (this.disabledReasons.has(reason) !== disabled) {
      if (disabled) {
        this.disabledReasons.add(reason);
      } else {
        this.disabledReasons.delete(reason);
      }
      const blockChangeEvent = new (eventUtils.get(EventType.BLOCK_CHANGE))(
        this,
        'disabled',
        /* name= */ null,
        /* oldValue= */ !disabled,
        /* newValue= */ disabled,
      ) as BlockChange;
      blockChangeEvent.setDisabledReason(reason);
      eventUtils.fire(blockChangeEvent);
    }
  }

  /**
   * Get whether the block is disabled or not due to parents.
   * The block's own disabled property is not considered.
   *
   * @returns True if disabled.
   */
  getInheritedDisabled(): boolean {
    let ancestor = this.getSurroundParent();
    while (ancestor) {
      if (!ancestor.isEnabled()) {
        return true;
      }
      ancestor = ancestor.getSurroundParent();
    }
    // Ran off the top.
    return false;
  }

  /**
   * Get whether the block is currently disabled for the provided reason.
   *
   * @param reason A language-neutral identifier for a reason why the block
   *     could be disabled.
   * @returns Whether the block is disabled for the provided reason.
   */
  hasDisabledReason(reason: string): boolean {
    return this.disabledReasons.has(reason);
  }

  /**
   * Get a set of reasons why the block is currently disabled, if any. If the
   * block is enabled, this set will be empty.
   *
   * @returns The set of reasons why the block is disabled, if any.
   */
  getDisabledReasons(): ReadonlySet<string> {
    return this.disabledReasons;
  }

  /**
   * Get whether the block is collapsed or not.
   *
   * @returns True if collapsed.
   */
  isCollapsed(): boolean {
    return this.collapsed_;
  }

  /**
   * Set whether the block is collapsed or not.
   *
   * @param collapsed True if collapsed.
   */
  setCollapsed(collapsed: boolean) {
    if (this.collapsed_ !== collapsed) {
      eventUtils.fire(
        new (eventUtils.get(EventType.BLOCK_CHANGE))(
          this,
          'collapsed',
          null,
          this.collapsed_,
          collapsed,
        ),
      );
      this.collapsed_ = collapsed;
    }
  }

  /**
   * Create a human-readable text representation of this block and any children.
   *
   * @param opt_maxLength Truncate the string to this length.
   * @param opt_emptyToken The placeholder string used to denote an empty input.
   *     If not specified, '?' is used.
   * @returns Text of block.
   */
  toString(opt_maxLength?: number, opt_emptyToken?: string): string {
    const tokens = this.toTokens(opt_emptyToken);

    // Run through our tokens array and simplify expression to remove
    // parentheses around single field blocks.
    // E.g. ['repeat', '(', '10', ')', 'times', 'do', '?']
    for (let i = 2; i < tokens.length; i++) {
      if (tokens[i - 2] === '(' && tokens[i] === ')') {
        tokens[i - 2] = tokens[i - 1];
        tokens.splice(i - 1, 2);
      }
    }

    // Join the text array, removing the spaces around added parentheses.
    let prev = '';
    let text: string = tokens.reduce((acc, curr) => {
      const val = acc + (prev === '(' || curr === ')' ? '' : ' ') + curr;
      prev = curr[curr.length - 1];
      return val;
    }, '');

    text = text.trim() || '???';
    if (opt_maxLength) {
      // TODO: Improve truncation so that text from this block is given
      // priority. E.g. "1+2+3+4+5+6+7+8+9=0" should be "...6+7+8+9=0", not
      // "1+2+3+4+5...". E.g. "1+2+3+4+5=6+7+8+9+0" should be "...4+5=6+7...".
      if (text.length > opt_maxLength) {
        text = text.substring(0, opt_maxLength - 3) + '...';
      }
    }
    return text;
  }

  /**
   * Converts this block into string tokens.
   *
   * @param emptyToken The token to use in place of an empty input.
   *     Defaults to '?'.
   * @returns The array of string tokens representing this block.
   */
  private toTokens(emptyToken = '?'): string[] {
    const tokens = [];
    /**
     * Whether or not to add parentheses around an input.
     *
     * @param connection The connection.
     * @returns True if we should add parentheses around the input.
     */
    function shouldAddParentheses(connection: Connection): boolean {
      let checks = connection.getCheck();
      if (!checks && connection.targetConnection) {
        checks = connection.targetConnection.getCheck();
      }
      return (
        !!checks && (checks.includes('Boolean') || checks.includes('Number'))
      );
    }

    for (const input of this.inputList) {
      if (input.name == constants.COLLAPSED_INPUT_NAME) {
        continue;
      }
      for (const field of input.fieldRow) {
        tokens.push(field.getText());
      }
      if (input.connection) {
        const child = input.connection.targetBlock();
        if (child) {
          const shouldAddParens = shouldAddParentheses(input.connection);
          if (shouldAddParens) tokens.push('(');
          tokens.push(...child.toTokens(emptyToken));
          if (shouldAddParens) tokens.push(')');
        } else {
          tokens.push(emptyToken);
        }
      }
    }
    return tokens;
  }

  /**
   * Appends a value input row.
   *
   * @param name Language-neutral identifier which may used to find this input
   *     again.  Should be unique to this block.
   * @returns The input object created.
   */
  appendValueInput(name: string): Input {
    return this.appendInput(new ValueInput(name, this));
  }

  /**
   * Appends a statement input row.
   *
   * @param name Language-neutral identifier which may used to find this input
   *     again.  Should be unique to this block.
   * @returns The input object created.
   */
  appendStatementInput(name: string): Input {
    this.statementInputCount++;
    return this.appendInput(new StatementInput(name, this));
  }

  /**
   * Appends a dummy input row.
   *
   * @param name Optional language-neutral identifier which may used to find
   *     this input again.  Should be unique to this block.
   * @returns The input object created.
   */
  appendDummyInput(name = ''): Input {
    return this.appendInput(new DummyInput(name, this));
  }

  /**
   * Appends an input that ends the row.
   *
   * @param name Optional language-neutral identifier which may used to find
   *     this input again.  Should be unique to this block.
   * @returns The input object created.
   */
  appendEndRowInput(name = ''): Input {
    return this.appendInput(new EndRowInput(name, this));
  }

  /**
   * Appends the given input row.
   *
   * Allows for custom inputs to be appended to the block.
   */
  appendInput(input: Input): Input {
    this.inputList.push(input);
    return input;
  }

  /**
   * Appends an input with the given input type and name to the block after
   * constructing it from the registry.
   *
   * @param type The name the input is registered under in the registry.
   * @param name The name the input will have within the block.
   * @returns The constucted input, or null if there was no constructor
   *     associated with the type.
   */
  private appendInputFromRegistry(type: string, name: string): Input | null {
    const inputConstructor = registry.getClass(
      registry.Type.INPUT,
      type,
      false,
    );
    if (!inputConstructor) return null;
    return this.appendInput(new inputConstructor(name, this));
  }

  /**
   * Initialize this block using a cross-platform, internationalization-friendly
   * JSON description.
   *
   * @param json Structured data describing the block.
   */
  jsonInit(json: AnyDuringMigration) {
    const warningPrefix = json['type'] ? 'Block "' + json['type'] + '": ' : '';

    // Validate inputs.
    if (json['output'] && json['previousStatement']) {
      throw Error(
        warningPrefix + 'Must not have both an output and a previousStatement.',
      );
    }

    // Validate that each arg has a corresponding message
    let n = 0;
    while (json['args' + n]) {
      if (json['message' + n] === undefined) {
        throw Error(
          warningPrefix +
            `args${n} must have a corresponding message (message${n}).`,
        );
      }
      n++;
    }

    // Set basic properties of block.
    // Makes styles backward compatible with old way of defining hat style.
    if (json['style'] && json['style'].hat) {
      this.hat = json['style'].hat;
      // Must set to null so it doesn't error when checking for style and
      // colour.
      json['style'] = null;
    }

    if (json['style'] && json['colour']) {
      throw Error(warningPrefix + 'Must not have both a colour and a style.');
    } else if (json['style']) {
      this.jsonInitStyle(json, warningPrefix);
    } else {
      this.jsonInitColour(json, warningPrefix);
    }

    // Interpolate the message blocks.
    let i = 0;
    while (json['message' + i] !== undefined) {
      this.interpolate(
        json['message' + i],
        json['args' + i] || [],
        // Backwards compatibility: lastDummyAlign aliases implicitAlign.
        json['implicitAlign' + i] || json['lastDummyAlign' + i],
        warningPrefix,
      );
      i++;
    }

    if (json['inputsInline'] !== undefined) {
      eventUtils.disable();
      this.setInputsInline(json['inputsInline']);
      eventUtils.enable();
    }

    // Set output and previous/next connections.
    if (json['output'] !== undefined) {
      this.setOutput(true, json['output']);
    }
    if (json['outputShape'] !== undefined) {
      this.setOutputShape(json['outputShape']);
    }
    if (json['previousStatement'] !== undefined) {
      this.setPreviousStatement(true, json['previousStatement']);
    }
    if (json['nextStatement'] !== undefined) {
      this.setNextStatement(true, json['nextStatement']);
    }
    if (json['tooltip'] !== undefined) {
      const rawValue = json['tooltip'];
      const localizedText = parsing.replaceMessageReferences(rawValue);
      this.setTooltip(localizedText);
    }
    if (json['enableContextMenu'] !== undefined) {
      this.contextMenu = !!json['enableContextMenu'];
    }
    if (json['suppressPrefixSuffix'] !== undefined) {
      this.suppressPrefixSuffix = !!json['suppressPrefixSuffix'];
    }
    if (json['helpUrl'] !== undefined) {
      const rawValue = json['helpUrl'];
      const localizedValue = parsing.replaceMessageReferences(rawValue);
      this.setHelpUrl(localizedValue);
    }
    if (typeof json['extensions'] === 'string') {
      console.warn(
        warningPrefix +
          "JSON attribute 'extensions' should be an array of" +
          " strings. Found raw string in JSON for '" +
          json['type'] +
          "' block.",
      );
      json['extensions'] = [json['extensions']]; // Correct and continue.
    }

    // Add the mutator to the block.
    if (json['mutator'] !== undefined) {
      Extensions.apply(json['mutator'], this, true);
    }

    const extensionNames = json['extensions'];
    if (Array.isArray(extensionNames)) {
      for (let j = 0; j < extensionNames.length; j++) {
        Extensions.apply(extensionNames[j], this, false);
      }
    }
  }

  /**
   * Initialize the colour of this block from the JSON description.
   *
   * @param json Structured data describing the block.
   * @param warningPrefix Warning prefix string identifying block.
   */
  private jsonInitColour(json: AnyDuringMigration, warningPrefix: string) {
    if ('colour' in json) {
      if (json['colour'] === undefined) {
        console.warn(warningPrefix + 'Undefined colour value.');
      } else {
        const rawValue = json['colour'];
        try {
          this.setColour(rawValue);
        } catch {
          console.warn(warningPrefix + 'Illegal colour value: ', rawValue);
        }
      }
    }
  }

  /**
   * Initialize the style of this block from the JSON description.
   *
   * @param json Structured data describing the block.
   * @param warningPrefix Warning prefix string identifying block.
   */
  private jsonInitStyle(json: AnyDuringMigration, warningPrefix: string) {
    const blockStyleName = json['style'];
    try {
      this.setStyle(blockStyleName);
    } catch {
      console.warn(warningPrefix + 'Style does not exist: ', blockStyleName);
    }
  }

  /**
   * Add key/values from mixinObj to this block object. By default, this method
   * will check that the keys in mixinObj will not overwrite existing values in
   * the block, including prototype values. This provides some insurance against
   * mixin / extension incompatibilities with future block features. This check
   * can be disabled by passing true as the second argument.
   *
   * @param mixinObj The key/values pairs to add to this block object.
   * @param opt_disableCheck Option flag to disable overwrite checks.
   */
  mixin(mixinObj: AnyDuringMigration, opt_disableCheck?: boolean) {
    if (
      opt_disableCheck !== undefined &&
      typeof opt_disableCheck !== 'boolean'
    ) {
      throw Error('opt_disableCheck must be a boolean if provided');
    }
    if (!opt_disableCheck) {
      const overwrites = [];
      for (const key in mixinObj) {
        if ((this as AnyDuringMigration)[key] !== undefined) {
          overwrites.push(key);
        }
      }
      if (overwrites.length) {
        throw Error(
          'Mixin will overwrite block members: ' + JSON.stringify(overwrites),
        );
      }
    }
    Object.assign(this, mixinObj);
  }

  /**
   * Interpolate a message description onto the block.
   *
   * @param message Text contains interpolation tokens (%1, %2, ...) that match
   *     with fields or inputs defined in the args array.
   * @param args Array of arguments to be interpolated.
   * @param implicitAlign If an implicit input is added at the end or in place
   *     of newline tokens, how should it be aligned?
   * @param warningPrefix Warning prefix string identifying block.
   */
  private interpolate(
    message: string,
    args: AnyDuringMigration[],
    implicitAlign: string | undefined,
    warningPrefix: string,
  ) {
    const tokens = parsing.tokenizeInterpolation(message);
    this.validateTokens(tokens, args.length);
    const elements = this.interpolateArguments(tokens, args, implicitAlign);

    // An array of [field, fieldName] tuples.
    const fieldStack = [];
    for (let i = 0, element; (element = elements[i]); i++) {
      if (this.isInputKeyword(element['type'])) {
        const input = this.inputFromJson(element, warningPrefix);
        // Should never be null, but just in case.
        if (input) {
          for (let j = 0, tuple; (tuple = fieldStack[j]); j++) {
            input.appendField(tuple[0], tuple[1]);
          }
          fieldStack.length = 0;
        }
      } else {
        // All other types, including ones starting with 'input_' get routed
        // here.
        const field = this.fieldFromJson(element);
        if (field) {
          fieldStack.push([field, element['name']]);
        }
      }
    }
  }

  /**
   * Validates that the tokens are within the correct bounds, with no
   * duplicates, and that all of the arguments are referred to. Throws errors if
   * any of these things are not true.
   *
   * @param tokens An array of tokens to validate
   * @param argsCount The number of args that need to be referred to.
   */
  private validateTokens(tokens: Array<string | number>, argsCount: number) {
    const visitedArgsHash = [];
    let visitedArgsCount = 0;
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (typeof token !== 'number') {
        continue;
      }
      if (token < 1 || token > argsCount) {
        throw Error(
          'Block "' +
            this.type +
            '": ' +
            'Message index %' +
            token +
            ' out of range.',
        );
      }
      if (visitedArgsHash[token]) {
        throw Error(
          'Block "' +
            this.type +
            '": ' +
            'Message index %' +
            token +
            ' duplicated.',
        );
      }
      visitedArgsHash[token] = true;
      visitedArgsCount++;
    }
    if (visitedArgsCount !== argsCount) {
      throw Error(
        'Block "' +
          this.type +
          '": ' +
          'Message does not reference all ' +
          argsCount +
          ' arg(s).',
      );
    }
  }

  /**
   * Inserts args in place of numerical tokens. String args are converted to
   * JSON that defines a label field. Newline characters are converted to
   * end-row inputs, and if necessary an extra dummy input is added to the end
   * of the elements.
   *
   * @param tokens The tokens to interpolate
   * @param args The arguments to insert.
   * @param implicitAlign The alignment to use for any implicitly added end-row
   *     or dummy inputs, if necessary.
   * @returns The JSON definitions of field and inputs to add to the block.
   */
  private interpolateArguments(
    tokens: Array<string | number>,
    args: Array<AnyDuringMigration | string>,
    implicitAlign: string | undefined,
  ): AnyDuringMigration[] {
    const elements = [];
    for (let i = 0; i < tokens.length; i++) {
      let element = tokens[i];
      if (typeof element === 'number') {
        element = args[element - 1];
      }
      // Args can be strings, which is why this isn't elseif.
      if (typeof element === 'string') {
        if (element === '\n') {
          // Convert newline tokens to end-row inputs.
          const newlineInput = {'type': 'input_end_row'};
          if (implicitAlign) {
            (newlineInput as AnyDuringMigration)['align'] = implicitAlign;
          }
          element = newlineInput as AnyDuringMigration;
        } else {
          // AnyDuringMigration because:  Type '{ text: string; type: string; }
          // | null' is not assignable to type 'string | number'.
          element = this.stringToFieldJson(element) as AnyDuringMigration;
          if (!element) {
            continue;
          }
        }
      }
      elements.push(element);
    }

    const length = elements.length;
    if (
      length &&
      !this.isInputKeyword((elements as AnyDuringMigration)[length - 1]['type'])
    ) {
      const dummyInput = {'type': 'input_dummy'};
      if (implicitAlign) {
        (dummyInput as AnyDuringMigration)['align'] = implicitAlign;
      }
      elements.push(dummyInput);
    }

    return elements;
  }

  /**
   * Creates a field from the JSON definition of a field. If a field with the
   * given type cannot be found, this attempts to create a different field using
   * the 'alt' property of the JSON definition (if it exists).
   *
   * @param element The element to try to turn into a field.
   * @returns The field defined by the JSON, or null if one couldn't be created.
   */
  private fieldFromJson(element: {
    alt?: string;
    type: string;
    text?: string;
  }): Field | null {
    const field = fieldRegistry.fromJson(element);
    if (!field && element['alt']) {
      if (typeof element['alt'] === 'string') {
        const json = this.stringToFieldJson(element['alt']);
        return json ? this.fieldFromJson(json) : null;
      }
      return this.fieldFromJson(element['alt']);
    }
    return field;
  }

  /**
   * Creates an input from the JSON definition of an input. Sets the input's
   * check and alignment if they are provided.
   *
   * @param element The JSON to turn into an input.
   * @param warningPrefix The prefix to add to warnings to help the developer
   *     debug.
   * @returns The input that has been created, or null if one could not be
   *     created for some reason (should never happen).
   */
  private inputFromJson(
    element: AnyDuringMigration,
    warningPrefix: string,
  ): Input | null {
    const alignmentLookup = {
      'LEFT': Align.LEFT,
      'RIGHT': Align.RIGHT,
      'CENTRE': Align.CENTRE,
      'CENTER': Align.CENTRE,
    };

    let input = null;
    switch (element['type']) {
      case 'input_value':
        input = this.appendValueInput(element['name']);
        break;
      case 'input_statement':
        input = this.appendStatementInput(element['name']);
        break;
      case 'input_dummy':
        input = this.appendDummyInput(element['name']);
        break;
      case 'input_end_row':
        input = this.appendEndRowInput(element['name']);
        break;
      default: {
        input = this.appendInputFromRegistry(element['type'], element['name']);
        break;
      }
    }
    // Should never be hit because of interpolate_'s checks, but just in case.
    if (!input) {
      return null;
    }

    if (element['check']) {
      input.setCheck(element['check']);
    }
    if (element['align']) {
      const alignment = (alignmentLookup as AnyDuringMigration)[
        element['align'].toUpperCase()
      ];
      if (alignment === undefined) {
        console.warn(warningPrefix + 'Illegal align value: ', element['align']);
      } else {
        input.setAlign(alignment);
      }
    }
    return input;
  }

  /**
   * Returns true if the given string matches one of the input keywords.
   *
   * @param str The string to check.
   * @returns True if the given string matches one of the input keywords, false
   *     otherwise.
   */
  private isInputKeyword(str: string): boolean {
    return (
      str === 'input_value' ||
      str === 'input_statement' ||
      str === 'input_dummy' ||
      str === 'input_end_row' ||
      registry.hasItem(registry.Type.INPUT, str)
    );
  }

  /**
   * Turns a string into the JSON definition of a label field. If the string
   * becomes an empty string when trimmed, this returns null.
   *
   * @param str String to turn into the JSON definition of a label field.
   * @returns The JSON definition or null.
   */
  private stringToFieldJson(str: string): {text: string; type: string} | null {
    str = str.trim();
    if (str) {
      return {
        'type': 'field_label',
        'text': str,
      };
    }
    return null;
  }

  /**
   * Move a named input to a different location on this block.
   *
   * @param name The name of the input to move.
   * @param refName Name of input that should be after the moved input, or null
   *     to be the input at the end.
   */
  moveInputBefore(name: string, refName: string | null) {
    if (name === refName) {
      return;
    }
    // Find both inputs.
    let inputIndex = -1;
    let refIndex = refName ? -1 : this.inputList.length;
    for (let i = 0, input; (input = this.inputList[i]); i++) {
      if (input.name === name) {
        inputIndex = i;
        if (refIndex !== -1) {
          break;
        }
      } else if (refName && input.name === refName) {
        refIndex = i;
        if (inputIndex !== -1) {
          break;
        }
      }
    }
    if (inputIndex === -1) {
      throw Error('Named input "' + name + '" not found.');
    }
    if (refIndex === -1) {
      throw Error('Reference input "' + refName + '" not found.');
    }
    this.moveNumberedInputBefore(inputIndex, refIndex);
  }

  /**
   * Move a numbered input to a different location on this block.
   *
   * @param inputIndex Index of the input to move.
   * @param refIndex Index of input that should be after the moved input.
   */
  moveNumberedInputBefore(inputIndex: number, refIndex: number) {
    // Validate arguments.
    if (inputIndex === refIndex) {
      throw Error("Can't move input to itself.");
    }
    if (inputIndex >= this.inputList.length) {
      throw RangeError('Input index ' + inputIndex + ' out of bounds.');
    }
    if (refIndex > this.inputList.length) {
      throw RangeError('Reference input ' + refIndex + ' out of bounds.');
    }
    // Remove input.
    const input = this.inputList[inputIndex];
    this.inputList.splice(inputIndex, 1);
    if (inputIndex < refIndex) {
      refIndex--;
    }
    // Reinsert input.
    this.inputList.splice(refIndex, 0, input);
  }

  /**
   * Remove an input from this block.
   *
   * @param name The name of the input.
   * @param opt_quiet True to prevent an error if input is not present.
   * @returns True if operation succeeds, false if input is not present and
   *     opt_quiet is true.
   * @throws {Error} if the input is not present and opt_quiet is not true.
   */
  removeInput(name: string, opt_quiet?: boolean): boolean {
    for (let i = 0, input; (input = this.inputList[i]); i++) {
      if (input.name === name) {
        if (input instanceof StatementInput) this.statementInputCount--;
        input.dispose();
        this.inputList.splice(i, 1);
        return true;
      }
    }
    if (opt_quiet) {
      return false;
    }
    throw Error('Input not found: ' + name);
  }

  /**
   * Fetches the named input object.
   *
   * @param name The name of the input.
   * @returns The input object, or null if input does not exist.
   */
  getInput(name: string): Input | null {
    for (let i = 0, input; (input = this.inputList[i]); i++) {
      if (input.name === name) {
        return input;
      }
    }
    // This input does not exist.
    return null;
  }

  /**
   * Fetches the block attached to the named input.
   *
   * @param name The name of the input.
   * @returns The attached value block, or null if the input is either
   *     disconnected or if the input does not exist.
   */
  getInputTargetBlock(name: string): Block | null {
    const input = this.getInput(name);
    return input && input.connection && input.connection.targetBlock();
  }

  /**
   * Returns the comment on this block (or null if there is no comment).
   *
   * @returns Block's comment.
   */
  getCommentText(): string | null {
    const comment = this.getIcon(IconType.COMMENT);
    return comment?.getText() ?? null;
  }

  /**
   * Set this block's comment text.
   *
   * @param text The text, or null to delete.
   */
  setCommentText(text: string | null) {
    const comment = this.getIcon(IconType.COMMENT);
    const oldText = comment?.getText() ?? null;
    if (oldText === text) return;
    if (text !== null) {
      let comment = this.getIcon(IconType.COMMENT);
      if (!comment) {
        const commentConstructor = registry.getClass(
          registry.Type.ICON,
          IconType.COMMENT.toString(),
          false,
        );
        if (!commentConstructor) {
          throw new Error(
            'No comment icon class is registered, so a comment cannot be set',
          );
        }
        const icon = new commentConstructor(this);
        if (!isCommentIcon(icon)) {
          throw new Error(
            'The class registered as a comment icon does not conform to the ' +
              'ICommentIcon interface',
          );
        }
        comment = this.addIcon(icon);
      }
      eventUtils.disable();
      comment.setText(text);
      eventUtils.enable();
    } else {
      this.removeIcon(IconType.COMMENT);
    }

    eventUtils.fire(
      new (eventUtils.get(EventType.BLOCK_CHANGE))(
        this,
        'comment',
        null,
        oldText,
        text,
      ),
    );
  }

  /**
   * Set this block's warning text.
   *
   * @param _text The text, or null to delete.
   * @param _opt_id An optional ID for the warning text to be able to maintain
   *     multiple warnings.
   */
  setWarningText(_text: string | null, _opt_id?: string) {
    // NOOP.
  }

  /**
   * Give this block a mutator dialog.
   *
   * @param _mutator A mutator dialog instance or null to remove.
   */
  setMutator(_mutator: MutatorIcon) {
    // NOOP.
  }

  /** Adds the given icon to the block. */
  addIcon<T extends IIcon>(icon: T): T {
    if (this.hasIcon(icon.getType())) throw new DuplicateIconType(icon);
    this.icons.push(icon);
    this.icons.sort((a, b) => a.getWeight() - b.getWeight());
    return icon;
  }

  /**
   * Removes the icon whose getType matches the given type iconType from the
   * block.
   *
   * @param type The type of the icon to remove from the block.
   * @returns True if an icon with the given type was found, false otherwise.
   */
  removeIcon(type: IconType<IIcon>): boolean {
    if (!this.hasIcon(type)) return false;
    this.getIcon(type)?.dispose();
    this.icons = this.icons.filter((icon) => !icon.getType().equals(type));
    return true;
  }

  /**
   * @returns True if an icon with the given type exists on the block,
   *     false otherwise.
   */
  hasIcon(type: IconType<IIcon>): boolean {
    return this.icons.some((icon) => icon.getType().equals(type));
  }

  /**
   * @param type The type of the icon to retrieve. Prefer passing an `IconType`
   *     for proper type checking when using typescript.
   * @returns The icon with the given type if it exists on the block, undefined
   *     otherwise.
   */
  getIcon<T extends IIcon>(type: IconType<T> | string): T | undefined {
    if (type instanceof IconType) {
      return this.icons.find((icon) => icon.getType().equals(type)) as T;
    } else {
      return this.icons.find((icon) => icon.getType().toString() === type) as T;
    }
  }

  /** @returns An array of the icons attached to this block. */
  getIcons(): IIcon[] {
    return [...this.icons];
  }

  /**
   * Return the coordinates of the top-left corner of this block relative to the
   * drawing surface's origin (0,0), in workspace units.
   *
   * @returns Object with .x and .y properties.
   */
  getRelativeToSurfaceXY(): Coordinate {
    return this.xy;
  }

  /**
   * Move a block by a relative offset.
   *
   * @param dx Horizontal offset, in workspace units.
   * @param dy Vertical offset, in workspace units.
   * @param reason Why is this move happening?  'drag', 'bump', 'snap', ...
   */
  moveBy(dx: number, dy: number, reason?: string[]) {
    if (this.parentBlock_) {
      throw Error('Block has parent');
    }
    const event = new (eventUtils.get(EventType.BLOCK_MOVE))(this) as BlockMove;
    if (reason) event.setReason(reason);
    this.xy.translate(dx, dy);
    event.recordNew();
    eventUtils.fire(event);
  }

  /**
   * Create a connection of the specified type.
   *
   * @param type The type of the connection to create.
   * @returns A new connection of the specified type.
   * @internal
   */
  makeConnection_(type: ConnectionType): Connection {
    return new Connection(this, type);
  }

  /**
   * Recursively checks whether all statement and value inputs are filled with
   * blocks. Also checks all following statement blocks in this stack.
   *
   * @param opt_shadowBlocksAreFilled An optional argument controlling whether
   *     shadow blocks are counted as filled. Defaults to true.
   * @returns True if all inputs are filled, false otherwise.
   */
  allInputsFilled(opt_shadowBlocksAreFilled?: boolean): boolean {
    // Account for the shadow block filledness toggle.
    if (opt_shadowBlocksAreFilled === undefined) {
      opt_shadowBlocksAreFilled = true;
    }
    if (!opt_shadowBlocksAreFilled && this.isShadow()) {
      return false;
    }

    // Recursively check each input block of the current block.
    for (let i = 0, input; (input = this.inputList[i]); i++) {
      if (!input.connection) {
        continue;
      }
      const target = input.connection.targetBlock();
      if (!target || !target.allInputsFilled(opt_shadowBlocksAreFilled)) {
        return false;
      }
    }

    // Recursively check the next block after the current block.
    const next = this.getNextBlock();
    if (next) {
      return next.allInputsFilled(opt_shadowBlocksAreFilled);
    }

    return true;
  }

  /**
   * This method returns a string describing this Block in developer terms (type
   * name and ID; English only).
   *
   * Intended to on be used in console logs and errors. If you need a string
   * that uses the user's native language (including block text, field values,
   * and child blocks), use {@link (Block:class).toString | toString()}.
   *
   * @returns The description.
   */
  toDevString(): string {
    let msg = this.type ? '"' + this.type + '" block' : 'Block';
    if (this.id) {
      msg += ' (id="' + this.id + '")';
    }
    return msg;
  }
}

export namespace Block {
  export interface CommentModel {
    text: string | null;
    pinned: boolean;
    size: Size;
  }
}

export type CommentModel = Block.CommentModel;
