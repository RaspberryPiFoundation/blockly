/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Object representing a map of variables and their types.
 *
 * @class
 */
// Former goog.module ID: Blockly.VariableMap

// Unused import preserved for side-effects. Remove if unneeded.
import './events/events_var_delete.js';
// Unused import preserved for side-effects. Remove if unneeded.
import './events/events_var_rename.js';

import type {Block} from './block.js';
import {EventType} from './events/type.js';
import * as eventUtils from './events/utils.js';
import {FieldVariable} from './field_variable.js';
import type {IVariableMap} from './interfaces/i_variable_map.js';
import {IVariableModel, IVariableState} from './interfaces/i_variable_model.js';
import {Names} from './names.js';
import * as registry from './registry.js';
import type {State as BlockState} from './serialization/blocks.js';
import * as deprecation from './utils/deprecation.js';
import * as idGenerator from './utils/idgenerator.js';
import {
  deleteVariable,
  getOrCreateVariablePackage,
  getVariableUsesById,
} from './variables.js';
import type {Workspace} from './workspace.js';

/**
 * One field on a shadow block whose current value points at the variable
 * being deleted. The cascade replays the parent connection's stored
 * shadowState through `getOrCreateVariablePackage` for each entry, which
 * either returns an existing live variable (the template references a
 * different, still-live variable — "Case 1") or re-creates a same-id
 * same-name variable (the template references the variable being deleted
 * — "Case 2") and binds the field to the result.
 *
 * The two cases must replay around the variable map removal in opposite
 * order so the resulting event group can be undone correctly:
 *  - Case 1 entries fire BlockChange BEFORE VarDelete, so undo runs the
 *    VarDelete reverse first (restoring the old variable), then the
 *    BlockChange reverse (which calls field.setValue with the old id —
 *    field validation requires the variable to exist on the workspace).
 *  - Case 2 entries fire AFTER the variable map removal, so
 *    getOrCreateVariablePackage actually re-creates the variable (and
 *    fires VarCreate) instead of returning the soon-to-be-deleted one.
 */
interface ShadowFieldPlan {
  field: FieldVariable;
  /** The matching field entry in the parent connection's shadowState. */
  templateField: AnyDuringMigration;
  /**
   * True iff `templateField['id']` equals the id of the variable being
   * deleted. Determines which side of the variable map removal the
   * setValue replay runs on (see ShadowFieldPlan jsdoc).
   */
  isSelfTemplate: boolean;
}

/** Plan for a single shadow block use of the variable being deleted. */
interface ShadowPlan {
  shadow: Block;
  entries: ShadowFieldPlan[];
}

/**
 * Class for a variable map.  This contains a dictionary data structure with
 * variable types as keys and lists of variables as values.  The list of
 * variables are the type indicated by the key.
 */
export class VariableMap
  implements IVariableMap<IVariableModel<IVariableState>>
{
  /**
   * A map from variable type to map of IDs to variables. The maps contain
   * all of the named variables in the workspace, including variables that are
   * not currently in use.
   */
  private variableMap = new Map<
    string,
    Map<string, IVariableModel<IVariableState>>
  >();

  /**
   * @param workspace The workspace this map belongs to.
   * @param potentialMap True if this holds variables that don't exist in the
   *  workspace yet.
   */
  constructor(
    public workspace: Workspace,
    public potentialMap = false,
  ) {}

  /** Clear the variable map.  Fires events for every deletion. */
  clear() {
    for (const variables of this.variableMap.values()) {
      for (const variable of variables.values()) {
        this.deleteVariable(variable);
      }
    }
    if (this.variableMap.size !== 0) {
      throw Error('Non-empty variable map');
    }
  }

  /* Begin functions for renaming variables. */
  /**
   * Rename the given variable by updating its name in the variable map.
   *
   * @param variable Variable to rename.
   * @param newName New variable name.
   * @returns The newly renamed variable.
   */
  renameVariable(
    variable: IVariableModel<IVariableState>,
    newName: string,
  ): IVariableModel<IVariableState> {
    if (variable.getName() === newName) return variable;
    const type = variable.getType();
    const conflictVar = this.getVariable(newName, type);
    const blocks = this.workspace.getAllBlocks(false);
    let existingGroup = '';
    if (!this.potentialMap) {
      existingGroup = eventUtils.getGroup();
      if (!existingGroup) {
        eventUtils.setGroup(true);
      }
    }
    try {
      // The IDs may match if the rename is a simple case change (name1 ->
      // Name1).
      if (!conflictVar || conflictVar.getId() === variable.getId()) {
        this.renameVariableAndUses(variable, newName, blocks);
      } else {
        this.renameVariableWithConflict(variable, newName, conflictVar, blocks);
      }
    } finally {
      if (!this.potentialMap) eventUtils.setGroup(existingGroup);
    }
    return variable;
  }

  changeVariableType(
    variable: IVariableModel<IVariableState>,
    newType: string,
  ): IVariableModel<IVariableState> {
    const oldType = variable.getType();
    if (oldType === newType) return variable;

    const oldTypeVariables = this.variableMap.get(oldType);
    oldTypeVariables?.delete(variable.getId());
    if (oldTypeVariables?.size === 0) {
      this.variableMap.delete(oldType);
    }
    variable.setType(newType);
    const newTypeVariables =
      this.variableMap.get(newType) ??
      new Map<string, IVariableModel<IVariableState>>();
    newTypeVariables.set(variable.getId(), variable);
    if (!this.variableMap.has(newType)) {
      this.variableMap.set(newType, newTypeVariables);
    }
    eventUtils.fire(
      new (eventUtils.get(EventType.VAR_TYPE_CHANGE))(
        variable,
        oldType,
        newType,
      ),
    );
    return variable;
  }

  /**
   * Rename a variable by updating its name in the variable map. Identify the
   * variable to rename with the given ID.
   *
   * @deprecated v12: use VariableMap.renameVariable.
   * @param id ID of the variable to rename.
   * @param newName New variable name.
   */
  renameVariableById(id: string, newName: string) {
    deprecation.warn(
      'VariableMap.renameVariableById',
      'v12',
      'v13',
      'VariableMap.renameVariable',
    );
    const variable = this.getVariableById(id);
    if (!variable) {
      throw Error("Tried to rename a variable that didn't exist. ID: " + id);
    }

    this.renameVariable(variable, newName);
  }

  /**
   * Update the name of the given variable and refresh all references to it.
   * The new name must not conflict with any existing variable names.
   *
   * @param variable Variable to rename.
   * @param newName New variable name.
   * @param blocks The list of all blocks in the workspace.
   */
  private renameVariableAndUses(
    variable: IVariableModel<IVariableState>,
    newName: string,
    blocks: Block[],
  ) {
    if (!this.potentialMap) {
      eventUtils.fire(
        new (eventUtils.get(EventType.VAR_RENAME))(variable, newName),
      );
    }
    variable.setName(newName);
    for (let i = 0; i < blocks.length; i++) {
      blocks[i].updateVarName(variable);
    }
  }

  /**
   * Update the name of the given variable to the same name as an existing
   * variable.  The two variables are coalesced into a single variable with the
   * ID of the existing variable that was already using newName. Refresh all
   * references to the variable.
   *
   * @param variable Variable to rename.
   * @param newName New variable name.
   * @param conflictVar The variable that was already using newName.
   * @param blocks The list of all blocks in the workspace.
   */
  private renameVariableWithConflict(
    variable: IVariableModel<IVariableState>,
    newName: string,
    conflictVar: IVariableModel<IVariableState>,
    blocks: Block[],
  ) {
    const type = variable.getType();
    const oldCase = conflictVar.getName();

    if (newName !== oldCase) {
      // Simple rename to change the case and update references.
      this.renameVariableAndUses(conflictVar, newName, blocks);
    }

    // These blocks now refer to a different variable.
    // These will fire change events.
    for (let i = 0; i < blocks.length; i++) {
      blocks[i].renameVarById(variable.getId(), conflictVar.getId());
    }
    if (!this.potentialMap) {
      // Finally delete the original variable, which is now unreferenced.
      eventUtils.fire(new (eventUtils.get(EventType.VAR_DELETE))(variable));
    }
    // And remove it from the map.
    this.variableMap.get(type)?.delete(variable.getId());
  }

  /* End functions for renaming variables. */
  /**
   * Create a variable with a given name, optional type, and optional ID.
   *
   * @param name The name of the variable. This must be unique across variables
   *     and procedures.
   * @param opt_type The type of the variable like 'int' or 'string'.
   *     Does not need to be unique. Field_variable can filter variables based
   * on their type. This will default to '' which is a specific type.
   * @param opt_id The unique ID of the variable. This will default to a UUID.
   * @returns The newly created variable.
   */
  createVariable(
    name: string,
    opt_type?: string,
    opt_id?: string,
  ): IVariableModel<IVariableState> {
    let variable = this.getVariable(name, opt_type);
    if (variable) {
      if (opt_id && variable.getId() !== opt_id) {
        throw Error(
          'Variable "' +
            name +
            '" is already in use and its id is "' +
            variable.getId() +
            '" which conflicts with the passed in ' +
            'id, "' +
            opt_id +
            '".',
        );
      }
      // The variable already exists and has the same ID.
      return variable;
    }
    if (opt_id && this.getVariableById(opt_id)) {
      throw Error('Variable id, "' + opt_id + '", is already in use.');
    }
    const id = opt_id || idGenerator.genUid();
    const type = opt_type || '';
    const VariableModel = registry.getClassFromOptions(
      registry.Type.VARIABLE_MODEL,
      this.workspace.options,
      true,
    );
    if (!VariableModel) {
      throw new Error('No variable model is registered.');
    }
    variable = new VariableModel(this.workspace, name, type, id);

    const variables =
      this.variableMap.get(type) ??
      new Map<string, IVariableModel<IVariableState>>();
    variables.set(variable.getId(), variable);
    if (!this.variableMap.has(type)) {
      this.variableMap.set(type, variables);
    }
    if (!this.potentialMap) {
      eventUtils.fire(new (eventUtils.get(EventType.VAR_CREATE))(variable));
    }
    return variable;
  }

  /**
   * Adds the given variable to this variable map.
   *
   * @param variable The variable to add.
   */
  addVariable(variable: IVariableModel<IVariableState>) {
    const type = variable.getType();
    if (!this.variableMap.has(type)) {
      this.variableMap.set(
        type,
        new Map<string, IVariableModel<IVariableState>>(),
      );
    }
    this.variableMap.get(type)?.set(variable.getId(), variable);
  }

  /* Begin functions for variable deletion. */
  /**
   * Delete a variable and all of its uses without confirmation.
   *
   * Shadow uses are kept alive at the same parent input so the user can
   * still pick a different variable. After the variable map removal, the
   * cascade replays the parent connection's stored shadowState through
   * `getOrCreateVariablePackage` for every matching field. The helper
   * either returns an existing live variable (when the template
   * references a different, still-live variable) or re-creates the
   * variable from the template at the same id and same name (when the
   * template references the variable being deleted) — in the latter
   * case the cascade fires a `VarCreate` because the variable that gets
   * created is a real variable the user can interact with.
   *
   * Non-shadow uses are disposed normally, but the cascade temporarily
   * sets `workspace.suppressShadowRespawn` so that the auto-respawn fired
   * by `Connection.disconnectInternal` does not re-create the deleted
   * variable through `getOrCreateVariablePackage` triggered by a stale
   * shadowState template.
   *
   * @param variable Variable to delete.
   */
  deleteVariable(variable: IVariableModel<IVariableState>) {
    // Dedupe by block id (a single block with two FieldVariable fields
    // pointing at the same variable would otherwise appear twice in the
    // raw uses list).
    const seen = new Set<string>();
    const uniqueUses: Block[] = [];
    for (const use of getVariableUsesById(this.workspace, variable.getId())) {
      if (!seen.has(use.id)) {
        seen.add(use.id);
        uniqueUses.push(use);
      }
    }

    // Split shadow vs non-shadow uses.
    const nonShadowUses: Block[] = [];
    const shadowUses: Block[] = [];
    for (const use of uniqueUses) {
      if (use.isShadow()) shadowUses.push(use);
      else nonShadowUses.push(use);
    }

    // Plan each shadow's reset by snapshotting the parent connection's
    // stored shadowState. An unclassifiable shadow (no reachable parent,
    // no stored shadowState, no matching field, no template id) falls
    // back to the non-shadow dispose path.
    const shadowPlans: ShadowPlan[] = [];
    for (const shadow of shadowUses) {
      const plan = this.classifyShadow(shadow, variable.getId());
      if (plan) {
        shadowPlans.push(plan);
      } else {
        nonShadowUses.push(shadow);
      }
    }

    let existingGroup = '';
    if (!this.potentialMap) {
      existingGroup = eventUtils.getGroup();
      if (!existingGroup) {
        eventUtils.setGroup(true);
      }
    }
    try {
      // (a) Replay Case 1 entries — those whose template references a
      //     DIFFERENT, still-live variable. setValue fires a BlockChange
      //     in the current event group with oldValue=deletedId,
      //     newValue=tmplId. Doing this BEFORE the variable map removal
      //     means the undo replays in the order:
      //         VarDelete.run(false)  // restores the deleted variable
      //         BlockChange.run(false) // setValue(deletedId), which
      //                                // now passes field validation
      //                                // because the variable is back.
      for (const plan of shadowPlans) {
        for (const entry of plan.entries) {
          if (entry.isSelfTemplate) continue;
          const v = getOrCreateVariablePackage(
            this.workspace,
            entry.templateField['id'] as string,
            entry.templateField['name'] as string | undefined,
            (entry.templateField['type'] as string) || '',
          );
          entry.field.setValue(v.getId());
        }
      }

      // (b) Dispose non-shadow uses with respawn suppressed so that the
      //     auto-respawn fired by Connection.disconnectInternal does not
      //     re-create the deleted variable through a stale shadowState.
      const previousSuppress = this.workspace.suppressShadowRespawn;
      this.workspace.suppressShadowRespawn = true;
      try {
        for (const use of nonShadowUses) {
          if (use.isDeadOrDying()) continue;
          use.dispose(true);
        }
      } finally {
        this.workspace.suppressShadowRespawn = previousSuppress;
      }

      // (c) Remove the variable from the map and fire VarDelete. Has to
      //     happen between (a) and (d): (a)'s setValue replay needs the
      //     variable still in the map to validate the new id is real,
      //     and (d) needs the variable already removed so that
      //     getOrCreateVariablePackage actually re-creates it.
      const variables = this.variableMap.get(variable.getType());
      if (!variables || !variables.has(variable.getId())) return;
      variables.delete(variable.getId());
      if (!this.potentialMap) {
        eventUtils.fire(new (eventUtils.get(EventType.VAR_DELETE))(variable));
      }
      if (variables.size === 0) {
        this.variableMap.delete(variable.getType());
      }

      // (d) Replay Case 2 entries — those whose template references the
      //     variable being deleted. getOrCreateVariablePackage now
      //     re-creates the variable at the same id and same name and
      //     fires a VarCreate (a real variable the user can interact
      //     with, so the event is appropriate). setValue rebinds the
      //     field's `variable` reference to the fresh VariableModel via
      //     doValueUpdate_; the new id equals the old id so no
      //     BlockChange is fired.
      for (const plan of shadowPlans) {
        for (const entry of plan.entries) {
          if (!entry.isSelfTemplate) continue;
          const v = getOrCreateVariablePackage(
            this.workspace,
            entry.templateField['id'] as string,
            entry.templateField['name'] as string | undefined,
            (entry.templateField['type'] as string) || '',
          );
          entry.field.setValue(v.getId());
        }
      }
    } finally {
      if (!this.potentialMap) {
        eventUtils.setGroup(existingGroup);
      }
    }
  }

  /**
   * Snapshot a shadow use of the variable being deleted into a plan the
   * cascade can replay against `getOrCreateVariablePackage`.
   *
   * Returns null when the shadow cannot be classified — no reachable
   * parent connection, no stored shadowState, no matching `FieldVariable`
   * with a name, or no template entry with an id. The caller falls back
   * to disposing the shadow as if it were a regular non-shadow use.
   */
  private classifyShadow(
    shadow: Block,
    deletedVariableId: string,
  ): ShadowPlan | null {
    const parentConn =
      shadow.outputConnection?.targetConnection ||
      shadow.previousConnection?.targetConnection;
    if (!parentConn) return null;

    const templateState = parentConn.getShadowState() as BlockState | null;
    if (!templateState || !templateState.fields) return null;
    const templateFields = templateState.fields as AnyDuringMigration;

    const entries: ShadowFieldPlan[] = [];
    for (const input of shadow.inputList) {
      for (const field of input.fieldRow) {
        if (!(field instanceof FieldVariable)) continue;
        if (field.getVariable()?.getId() !== deletedVariableId) continue;
        const fieldName = field.name;
        if (!fieldName) continue;
        const tmplField = templateFields[fieldName];
        if (!tmplField || !tmplField['id']) continue;
        const isSelfTemplate = tmplField['id'] === deletedVariableId;
        entries.push({field, templateField: tmplField, isSelfTemplate});
      }
    }
    if (!entries.length) return null;
    return {shadow, entries};
  }

  /**
   * Delete a variables by the passed in ID and all of its uses from this
   * workspace. May prompt the user for confirmation.
   *
   * @deprecated v12: use Blockly.Variables.deleteVariable.
   * @param id ID of variable to delete.
   */
  deleteVariableById(id: string) {
    deprecation.warn(
      'VariableMap.deleteVariableById',
      'v12',
      'v13',
      'Blockly.Variables.deleteVariable',
    );
    const variable = this.getVariableById(id);
    if (variable) {
      deleteVariable(this.workspace, variable);
    }
  }

  /* End functions for variable deletion. */
  /**
   * Find the variable by the given name and type and return it.  Return null if
   *     it is not found.
   *
   * @param name The name to check for.
   * @param opt_type The type of the variable.  If not provided it defaults to
   *     the empty string, which is a specific type.
   * @returns The variable with the given name, or null if it was not found.
   */
  getVariable(
    name: string,
    opt_type?: string,
  ): IVariableModel<IVariableState> | null {
    const type = opt_type || '';
    const variables = this.variableMap.get(type);
    if (!variables) return null;

    return (
      [...variables.values()].find((variable) =>
        Names.equals(variable.getName(), name),
      ) ?? null
    );
  }

  /**
   * Find the variable by the given ID and return it.  Return null if not found.
   *
   * @param id The ID to check for.
   * @returns The variable with the given ID.
   */
  getVariableById(id: string): IVariableModel<IVariableState> | null {
    for (const variables of this.variableMap.values()) {
      if (variables.has(id)) {
        return variables.get(id) ?? null;
      }
    }
    return null;
  }

  /**
   * Get a list containing all of the variables of a specified type. If type is
   *     null, return list of variables with empty string type.
   *
   * @param type Type of the variables to find.
   * @returns The sought after variables of the passed in type. An empty array
   *     if none are found.
   */
  getVariablesOfType(type: string | null): IVariableModel<IVariableState>[] {
    type = type || '';
    const variables = this.variableMap.get(type);
    if (!variables) return [];

    return [...variables.values()];
  }

  /**
   * Returns a list of unique types of variables in this variable map.
   *
   * @returns A list of unique types of variables in this variable map.
   */
  getTypes(): string[] {
    return [...this.variableMap.keys()];
  }

  /**
   * Return all variables of all types.
   *
   * @returns List of variable models.
   */
  getAllVariables(): IVariableModel<IVariableState>[] {
    let allVariables: IVariableModel<IVariableState>[] = [];
    for (const variables of this.variableMap.values()) {
      allVariables = allVariables.concat(...variables.values());
    }
    return allVariables;
  }

  /**
   * Returns all of the variable names of all types.
   *
   * @deprecated v12: use Blockly.Variables.getAllVariables.
   * @returns All of the variable names of all types.
   */
  getAllVariableNames(): string[] {
    deprecation.warn(
      'VariableMap.getAllVariableNames',
      'v12',
      'v13',
      'Blockly.Variables.getAllVariables',
    );
    const names: string[] = [];
    for (const variables of this.variableMap.values()) {
      for (const variable of variables.values()) {
        names.push(variable.getName());
      }
    }
    return names;
  }

  /**
   * Find all the uses of a named variable.
   *
   * @deprecated v12: use Blockly.Variables.getVariableUsesById.
   * @param id ID of the variable to find.
   * @returns Array of block usages.
   */
  getVariableUsesById(id: string): Block[] {
    deprecation.warn(
      'VariableMap.getVariableUsesById',
      'v12',
      'v13',
      'Blockly.Variables.getVariableUsesById',
    );
    return getVariableUsesById(this.workspace, id);
  }
}

registry.register(registry.Type.VARIABLE_MAP, registry.DEFAULT, VariableMap);
