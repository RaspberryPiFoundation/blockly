/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';

interface DropdownOption {
  fieldName: string;
  label: string;
  value: string;
  selected: boolean;
}

/**
 * A class that provides methods for indexing and searching blocks.
 */
export class BlockSearcher {
  private trigramsToBlocks = new Map<
    string,
    Set<Blockly.utils.toolbox.BlockInfo>
  >();

  // A map of blocks to the text that was indexed for them, used to filter
  // the results of a search to only those blocks that contain the search term.
  private blockText = new Map<Blockly.utils.toolbox.BlockInfo, string[]>();
  // A map of blocks to the options of their dropdown fields, used to generate
  // variants of blocks with different dropdown values.
  private dropdownOptions = new Map<
    Blockly.utils.toolbox.BlockInfo,
    DropdownOption[]
  >();
  // A map of blocks to the names of their variable fields, used to generate
  // variants of blocks with different variable values.
  private variableFields = new Map<Blockly.utils.toolbox.BlockInfo, string[]>();
  // All workspace variables, sorted by name, updated when blocks are indexed.
  private workspaceVariables: Array<
    Blockly.IVariableModel<Blockly.IVariableState>
  > = [];

  /**
   * Populates the cached map of trigrams to the blocks they correspond to.
   *
   * This method must be called before blockTypesMatching(). Behind the
   * scenes, it creates a workspace, loads the specified block types on it,
   * indexes their types and human-readable text, and cleans up after
   * itself.
   *
   * @param blockInfos A list of blocks to index.
   * @param workspace The workspace source of truth for variables. This is
   *   used to index variable names and update variable fields.
   */
  indexBlocks(
    blockInfos: Blockly.utils.toolbox.BlockInfo[],
    workspace: Blockly.Workspace,
  ) {
    this.blockText.clear();
    this.dropdownOptions.clear();
    this.trigramsToBlocks.clear();
    this.variableFields.clear();
    this.workspaceVariables = workspace
      .getVariableMap()
      .getAllVariables()
      .sort(Blockly.Variables.compareByName);

    const blockCreationWorkspace = new Blockly.Workspace();
    blockInfos.forEach((blockInfo) => {
      const type = blockInfo.type;
      if (!type || type === '') return;
      blockCreationWorkspace.clear();
      this.workspaceVariables.forEach((variable) =>
        blockCreationWorkspace
          .getVariableMap()
          .createVariable(variable.getName(), variable.getType()),
      );
      const block = Blockly.serialization.blocks.append(
        blockInfo as Blockly.serialization.blocks.State,
        blockCreationWorkspace,
      );
      this.indexBlockText(type.replaceAll('_', ' '), blockInfo);
      const variableFieldNames: string[] = [];

      // Index the text of every field on the block and its descendants, and record
      // the names of any variable fields for later use in generating variants.
      block.getDescendants(false).forEach((descendantBlock) => {
        descendantBlock.inputList.forEach((input) => {
          input.fieldRow.forEach((field) => {
            if (field instanceof Blockly.FieldVariable) {
              this.indexBlockText(field.getText(), blockInfo);
              // If the current variable is one of the workspace variables, record
              // the field name for later use in generating variants.
              if (
                descendantBlock === block &&
                field.name &&
                this.workspaceVariables.some(
                  (v) => v.getName() === field.getText(),
                )
              ) {
                variableFieldNames.push(field.name);
              }
            } else {
              // Index the text of the dropdown option and the block.
              this.indexDropdownOption(field, blockInfo);
              this.indexBlockText(field.getText(), blockInfo);
            }
          });
        });
      });
      if (variableFieldNames.length) {
        // Index all workspace variable names for the block, so that a search for any of them
        // will return the block, and record the names of the variable fields for later use
        // in generating variants.
        this.variableFields.set(blockInfo, variableFieldNames);
        this.workspaceVariables.forEach((variable) => {
          this.indexBlockText(variable.getName(), blockInfo);
        });
      }
    });
    blockCreationWorkspace.dispose();
  }

  /**
   * Check if the field is a dropdown, and index every text in the option
   *
   * @param field We need to check the type of field
   * @param block The block to associate the trigrams with.
   */
  private indexDropdownOption(
    field: Blockly.Field,
    block: Blockly.utils.toolbox.BlockInfo,
  ) {
    if (!(field instanceof Blockly.FieldDropdown)) {
      return;
    }
    field.getOptions(true).forEach(([label, value]) => {
      const text =
        typeof label === 'string'
          ? label
          : label && 'alt' in label
            ? label.alt
            : '';
      if (!text) return;
      this.indexBlockText(text, block);
      if (!field.name || typeof value !== 'string') return;
      const options = this.dropdownOptions.get(block) ?? [];
      options.push({
        fieldName: field.name,
        label: text.toLowerCase(),
        value,
        selected: value === field.getValue(),
      });
      this.dropdownOptions.set(block, options);
    });
  }

  /**
   * Returns a list of variants of the given block with different dropdown values
   *
   * @param info The block to vary.
   * @param options The options whose labels matched the query.
   * @returns One block per matching option.
   */
  private createMatchingBlockVariants(
    info: Blockly.utils.toolbox.BlockInfo,
    options: Array<{fieldName: string; value: string; selected: boolean}>,
  ): Blockly.utils.toolbox.BlockInfo[] {
    if (!options.length) return [info];
    // One variant per matching option, each differing in a single field, so
    // two matching dropdowns give two results rather than four.
    return options.map((option) =>
      option.selected
        ? info
        : {...info, fields: {...info.fields, [option.fieldName]: option.value}},
    );
  }

  /**
   * Filters the available blocks based on the current query string.
   *
   * @param query The text to use to match blocks against.
   * @returns A list of blocks matching the query.
   */
  blockTypesMatching(query: string): Blockly.utils.toolbox.BlockInfo[] {
    const candidates = [
      ...this.generateTrigrams(query)
        .map((trigram) => {
          return (
            this.trigramsToBlocks.get(trigram) ??
            new Set<Blockly.utils.toolbox.BlockInfo>()
          );
        })
        .reduce((matches, current) => {
          return this.getIntersection(matches, current);
        })
        .values(),
    ];

    const searchTerm = query.toLowerCase();
    const matches = candidates.filter((block) =>
      this.blockText.get(block)?.some((text) => text.includes(searchTerm)),
    );

    const matchedVariables = this.workspaceVariables.filter((v) =>
      v.getName().toLowerCase().includes(searchTerm),
    );
    // The flyout creates one getter per variable, and they all collapse onto
    // the same block once bound, so results are keyed by content.
    const results = new Map<string, Blockly.utils.toolbox.BlockInfo>();
    for (const match of matches) {
      const variableFieldNames = this.variableFields.get(match);
      const bound =
        variableFieldNames && matchedVariables.length
          ? matchedVariables.map((variable) => ({
              ...match,
              fields: {
                ...match.fields,
                ...Object.fromEntries(
                  variableFieldNames.map((name) => [
                    name,
                    {name: variable.getName(), type: variable.getType()},
                  ]),
                ),
              },
            }))
          : [match];

      const options = (this.dropdownOptions.get(match) ?? []).filter((option) =>
        option.label.includes(searchTerm),
      );

      for (const info of bound) {
        for (const variant of this.createMatchingBlockVariants(info, options)) {
          results.set(JSON.stringify(variant), variant);
        }
      }
    }
    return [...results.values()];
  }

  /**
   * Generates trigrams for the given text and associates them with the given
   * block.
   *
   * @param text The text to generate trigrams of.
   * @param block The block to associate the trigrams with.
   */
  private indexBlockText(text: string, block: Blockly.utils.toolbox.BlockInfo) {
    const texts = this.blockText.get(block) ?? [];
    texts.push(text.toLowerCase());
    this.blockText.set(block, texts);
    this.generateTrigrams(text).forEach((trigram) => {
      const blockSet =
        this.trigramsToBlocks.get(trigram) ??
        new Set<Blockly.utils.toolbox.BlockInfo>();
      blockSet.add(block);
      this.trigramsToBlocks.set(trigram, blockSet);
    });
  }

  /**
   * Generates a list of trigrams for a given string.
   *
   * @param input The string to generate trigrams of.
   * @returns A list of trigrams of the given string.
   */
  private generateTrigrams(input: string): string[] {
    const normalizedInput = input.toLowerCase();
    if (!normalizedInput) return [];
    if (normalizedInput.length <= 3) return [normalizedInput];

    const trigrams: string[] = [];
    for (let start = 0; start <= normalizedInput.length - 3; start++) {
      trigrams.push(normalizedInput.substring(start, start + 3));
    }
    return trigrams;
  }

  /**
   * Returns the intersection of two sets.
   *
   * @param a The first set.
   * @param b The second set.
   * @returns The intersection of the two sets.
   */
  private getIntersection(
    a: Set<Blockly.utils.toolbox.BlockInfo>,
    b: Set<Blockly.utils.toolbox.BlockInfo>,
  ): Set<Blockly.utils.toolbox.BlockInfo> {
    return new Set([...a].filter((value) => b.has(value)));
  }
}
