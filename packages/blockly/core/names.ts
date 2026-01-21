/**
 * @license
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Utility functions for handling variable and procedure names.
 *
 * @class
 */
// Former goog.module ID: Blockly.Names

import type {IVariableMap} from './interfaces/i_variable_map.js';
import type {
  IVariableModel,
  IVariableState,
} from './interfaces/i_variable_model.js';
import {Msg} from './msg.js';
import * as Variables from './variables.js';
import type {Workspace} from './workspace.js';

/**
 * Class for a database of entity names (variables, procedures, etc).
 */
export class Names {
  static DEVELOPER_VARIABLE_TYPE: NameType;
  private readonly variablePrefix: string;

  /** A set of reserved words. */
  private readonly reservedWords: Set<string>;

  /**
   * A map from type (e.g. name, procedure) to maps from names to generated
   * names.
   */
  private readonly db = new Map<string, Map<string, string>>();

  /** A set of used names to avoid collisions. */
  private readonly dbReverse = new Set<string>();

  /**
   * The variable map from the workspace, containing Blockly variable models.
   */
  private variableMap: IVariableMap<IVariableModel<IVariableState>> | null =
    null;

  /**
   * @param reservedWordsList A comma-separated string of words that are illegal
   *     for use as names in a language (e.g. 'new,if,this,...').
   * @param opt_variablePrefix Some languages need a '$' or a namespace before
   *     all variable names (but not procedure names).
   */
  constructor(reservedWordsList: string, opt_variablePrefix?: string) {
    /** The prefix to attach to variable names in generated code. */
    this.variablePrefix = opt_variablePrefix || '';

    this.reservedWords = new Set<string>(
      reservedWordsList ? reservedWordsList.split(',') : [],
    );
  }

  /**
   * Empty the database and start from scratch.  The reserved words are kept.
   */
  reset() {
    this.db.clear();
    this.dbReverse.clear();
    this.variableMap = null;
  }

  /**
   * Set the variable map that maps from variable name to variable object.
   *
   * @param map The map to track.
   */
  setVariableMap(map: IVariableMap<IVariableModel<IVariableState>>) {
    this.variableMap = map;
  }

  /**
   * Get the name for a user-defined variable, based on its ID.
   * This should only be used for variables of NameType VARIABLE.
   *
   * @param id The ID to look up in the variable map.
   * @returns The name of the referenced variable, or null if there was no
   *     variable map or the variable was not found in the map.
   */
  private getNameForUserVariable(id: string): string | null {
    if (!this.variableMap) {
      console.warn(
        'Deprecated call to Names.prototype.getName without ' +
          'defining a variable map. To fix, add the following code in your ' +
          "generator's init() function:\n" +
          'Blockly.YourGeneratorName.nameDB_.setVariableMap(' +
          'workspace.getVariableMap());',
      );
      return null;
    }
    const variable = this.variableMap.getVariableById(id);
    if (variable) {
      return variable.getName();
    }
    return null;
  }

  /**
   * Generate names for user variables, but only ones that are being used.
   *
   * @param workspace Workspace to generate variables from.
   */
  populateVariables(workspace: Workspace) {
    const variables = Variables.allUsedVarModels(workspace);
    for (let i = 0; i < variables.length; i++) {
      this.getName(variables[i].getId(), NameType.VARIABLE);
    }
  }

  /**
   * Generate names for procedures.
   *
   * @param workspace Workspace to generate procedures from.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  populateProcedures(workspace: Workspace) {
    throw new Error(
      'The implementation of populateProcedures should be ' +
        'monkey-patched in by blockly.ts',
    );
  }

  /**
   * Convert a Blockly entity name to a legal exportable entity name.
   *
   * @param nameOrId The Blockly entity name (no constraints) or variable ID.
   * @param type The type of the name in Blockly ('VARIABLE', 'PROCEDURE',
   *     'DEVELOPER_VARIABLE', etc...).
   * @returns An entity name that is legal in the exported language.
   */
  getName(nameOrId: string, type: NameType | string): string {
    let name = nameOrId;
    if (type === NameType.VARIABLE) {
      const varName = this.getNameForUserVariable(nameOrId);
      if (varName) {
        // Successful ID lookup.
        name = varName;
      }
    }
    const normalizedName = name.toLowerCase();

    const isVar =
      type === NameType.VARIABLE || type === NameType.DEVELOPER_VARIABLE;

    const prefix = isVar ? this.variablePrefix : '';
    if (!this.db.has(type)) {
      this.db.set(type, new Map<string, string>());
    }
    const typeDb = this.db.get(type);
    if (typeDb!.has(normalizedName)) {
      return prefix + typeDb!.get(normalizedName);
    }
    const safeName = this.getDistinctName(name, type);
    typeDb!.set(normalizedName, safeName.substr(prefix.length));
    return safeName;
  }

  /**
   * Return a list of all known user-created names of a specified name type.
   *
   * @param type The type of entity in Blockly ('VARIABLE', 'PROCEDURE',
   *     'DEVELOPER_VARIABLE', etc...).
   * @returns A list of Blockly entity names (no constraints).
   */
  getUserNames(type: NameType | string): string[] {
    const userNames = this.db.get(type)?.keys();
    return userNames ? Array.from(userNames) : [];
  }

  /**
   * Convert a Blockly entity name to a legal exportable entity name.
   * Ensure that this is a new name not overlapping any previously defined name.
   * Also check against list of reserved words for the current language and
   * ensure name doesn't collide.
   *
   * @param name The Blockly entity name (no constraints).
   * @param type The type of entity in Blockly ('VARIABLE', 'PROCEDURE',
   *     'DEVELOPER_VARIABLE', etc...).
   * @returns An entity name that is legal in the exported language.
   */
  getDistinctName(name: string, type: NameType | string): string {
    let safeName = this.safeName(name);
    let i: number | null = null;
    while (
      this.dbReverse.has(safeName + (i ?? '')) ||
      this.reservedWords.has(safeName + (i ?? ''))
    ) {
      // Collision with existing name.  Create a unique name.
      i = i ? i + 1 : 2;
    }
    safeName += i ?? '';
    this.dbReverse.add(safeName);
    const isVar =
      type === NameType.VARIABLE || type === NameType.DEVELOPER_VARIABLE;
    const prefix = isVar ? this.variablePrefix : '';
    return prefix + safeName;
  }

  /**
   * Given a proposed entity name, generate a name that conforms to the
   * [_A-Za-z][_A-Za-z0-9]* format that most languages consider legal for
   * variable and function names.
   *
   * @param name Potentially illegal entity name.
   * @returns Safe entity name.
   */
  private safeName(name: string): string {
    if (!name) {
      name = Msg['UNNAMED_KEY'] || 'unnamed';
    } else {
      // Unfortunately names in non-latin characters will look like
      // _E9_9F_B3_E4_B9_90 which is pretty meaningless.
      // https://github.com/google/blockly/issues/1654
      name = encodeURI(name.replace(/ /g, '_')).replace(/[^\w]/g, '_');
      // Most languages don't allow names with leading numbers.
      if ('0123456789'.includes(name[0])) {
        name = 'my_' + name;
      }
    }
    return name;
  }

  /**
   * Do the given two entity names refer to the same entity?
   * Blockly names are case-insensitive.
   *
   * @param name1 First name.
   * @param name2 Second name.
   * @returns True if names are the same.
   */
  static equals(name1: string, name2: string): boolean {
    // name1.localeCompare(name2) is slower.
    return name1.toLowerCase() === name2.toLowerCase();
  }
}

export namespace Names {
  /**
   * Enum for the type of a name. Different name types may have different rules
   * about collisions.
   * When JavaScript (or most other languages) is generated, variable 'foo' and
   * procedure 'foo' would collide.  However, Blockly has no such problems since
   * variable get 'foo' and procedure call 'foo' are unambiguous.
   * Therefore, Blockly keeps a separate name type to disambiguate.
   * getName('foo', 'VARIABLE') = 'foo'
   * getName('foo', 'PROCEDURE') = 'foo2'
   *
   */
  export enum NameType {
    DEVELOPER_VARIABLE = 'DEVELOPER_VARIABLE',
    VARIABLE = 'VARIABLE',
    PROCEDURE = 'PROCEDURE',
  }
}

export type NameType = Names.NameType;
export const NameType = Names.NameType;

/**
 * Constant to separate developer variable names from user-defined variable
 * names when running generators.
 * A developer variable will be declared as a global in the generated code, but
 * will never be shown to the user in the workspace or stored in the variable
 * map.
 */
Names.DEVELOPER_VARIABLE_TYPE = NameType.DEVELOPER_VARIABLE;
