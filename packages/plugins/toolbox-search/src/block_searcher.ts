/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';

/** A value a field could be rewritten to, in order to make a query visible. */
interface FieldCandidate {
  // The id, in the saved state, of the block owning the field.
  blockId: string;
  fieldName: string;
  // Lowercase text that would be visible if this value were set.
  label: string;
  // The value to write into the block's serialized fields, either an option value
  // for dropdown options, or an object with name and type for variable fields.
  value: string | {name: string; type: string};
  // Whether the field already holds this value.
  selected: boolean;
}

/** A block in a toolbox definition, or in a serialized block state. */
type BlockNode =
  Blockly.utils.toolbox.BlockInfo | Blockly.serialization.blocks.State;

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
  // A map of blocks to the field values they could be rewritten to, used to
  // show a block with the searched text visible on it.
  private fieldCandidates = new Map<
    Blockly.utils.toolbox.BlockInfo,
    FieldCandidate[]
  >();
  // The workspace whose variables searches are matched against.
  private workspace: Blockly.Workspace;
  // A map of blocks to the serialized state of the block built while indexing.
  // Rewrites go through this rather than the toolbox definition, because it
  // carries an id for every block in the tree and the definition does not.
  private blockStates = new Map<
    Blockly.utils.toolbox.BlockInfo,
    Blockly.utils.toolbox.BlockInfo
  >();

  constructor(workspace: Blockly.Workspace) {
    this.workspace = workspace;
  }
  /**
   * Populates the cached map of trigrams to the blocks they correspond to.
   *
   * This method must be called before blockTypesMatching(). Behind the
   * scenes, it creates a workspace, loads the specified block types on it,
   * indexes their types and human-readable text, and cleans up after
   * itself.
   *
   * @param blockInfos A list of blocks to index.
   */
  indexBlocks(blockInfos: Blockly.utils.toolbox.BlockInfo[]) {
    this.blockText.clear();
    this.fieldCandidates.clear();
    this.trigramsToBlocks.clear();
    this.blockStates.clear();
    const workspaceVariables = this.workspace
      .getVariableMap()
      .getAllVariables()
      .sort(Blockly.Variables.compareByName);
    Blockly.Events.disable();
    const blockCreationWorkspace = new Blockly.Workspace();
    blockInfos.forEach((blockInfo) => {
      const type = blockInfo.type;
      if (!type || type === '') return;
      blockCreationWorkspace.clear();
      workspaceVariables.forEach((variable) =>
        blockCreationWorkspace
          .getVariableMap()
          .createVariable(variable.getName(), variable.getType()),
      );
      const block = Blockly.serialization.blocks.append(
        blockInfo as Blockly.serialization.blocks.State,
        blockCreationWorkspace,
      );
      const state = Blockly.serialization.blocks.save(block);
      if (state)
        // Merged with the original block info to preserve the kind and other props.
        this.blockStates.set(blockInfo, {...blockInfo, ...state});
      this.indexBlockText(type.replaceAll('_', ' '), blockInfo);
      // Index the text of every field on the block and its descendants, and
      // record the values each field could be rewritten to.
      block.getDescendants(false).forEach((descendantBlock) => {
        descendantBlock.inputList.forEach((input) => {
          input.fieldRow.forEach((field) => {
            this.indexBlockText(field.getText(), blockInfo);
            if (field instanceof Blockly.FieldVariable) {
              this.indexVariableCandidates(
                field,
                descendantBlock.id,
                blockInfo,
                workspaceVariables,
              );
            } else {
              this.indexDropdownCandidates(
                field,
                descendantBlock.id,
                blockInfo,
              );
            }
          });
        });
      });
    });
    blockCreationWorkspace.dispose();
    Blockly.Events.enable();
  }

  /**
   * Indexes a dropdown field's option labels and records each option
   * as a value the field could be rewritten to.
   *
   * @param field The field to index.
   * @param blockId The id of the block containing the field.
   * @param block The block to associate the trigrams with.
   */
  private indexDropdownCandidates(
    field: Blockly.Field,
    blockId: string,
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
      this.addCandidate(block, {
        blockId,
        fieldName: field.name,
        label: text.toLowerCase(),
        value,
        selected: value === field.getValue(),
      });
    });
  }

  /**
   * Indexes every workspace variable name against the block and records each
   * as a value the field could be rewritten to.
   *
   * A field set to a variable that exists only in the flyout is left alone.
   *
   * @param field The variable field to index.
   * @param blockId The id of the block containing the field.
   * @param block The block to associate the trigrams with.
   * @param variables The workspace's variables, sorted by name.
   */
  private indexVariableCandidates(
    field: Blockly.FieldVariable,
    blockId: string,
    block: Blockly.utils.toolbox.BlockInfo,
    variables: Array<Blockly.IVariableModel<Blockly.IVariableState>>,
  ) {
    const current = field.getText();
    if (!field.name || !variables.some((v) => v.getName() === current)) return;
    variables.forEach((variable) => {
      this.indexBlockText(variable.getName(), block);
      this.addCandidate(block, {
        blockId,
        fieldName: field.name as string,
        label: variable.getName().toLowerCase(),
        value: {name: variable.getName(), type: variable.getType()},
        selected: variable.getName() === current,
      });
    });
  }

  /**
   * Records a value a field could be rewritten to.
   *
   * @param block The block the field belongs to.
   * @param candidate The value and the text it would make visible.
   */
  private addCandidate(
    block: Blockly.utils.toolbox.BlockInfo,
    candidate: FieldCandidate,
  ) {
    const candidates = this.fieldCandidates.get(block) ?? [];
    candidates.push(candidate);
    this.fieldCandidates.set(block, candidates);
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
    // The flyout creates one getter per variable, and they all collapse onto
    // the same block once bound, so results are keyed by content.
    const results = new Map<string, Blockly.utils.toolbox.BlockInfo>();
    for (const match of matches) {
      const candidates = (this.fieldCandidates.get(match) ?? []).filter(
        (candidate) => candidate.label.includes(searchTerm),
      );
      // If the value is already showing, the block doesn't need to be updated.
      const hasUnselectedCandidates =
        candidates.length > 0 &&
        !candidates.some((candidate) => candidate.selected);
      const variants = hasUnselectedCandidates
        ? candidates.map((candidate) =>
            this.updateBlockField(
              this.blockStates.get(match) ?? match,
              candidate,
            ),
          )
        : [match];
      for (const variant of variants) {
        // Ignore the id when comparing, so that we don't end up with two
        // copies of the same block.
        const key = JSON.stringify(variant, (property, value) =>
          property === 'id' ? undefined : value,
        );
        results.set(key, hasUnselectedCandidates ? JSON.parse(key) : variant);
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

  /**
   * Returns the block with the given id, searched depth-first.
   *
   * @param node The block to search, along with its descendants.
   * @param id The block id to find.
   * @returns The matching block, or null if it isn't there.
   */
  private getNodeById(node: BlockNode, id: string): BlockNode | null {
    if (node.id === id) return node;
    for (const connection of [...Object.values(node.inputs ?? {}), node.next]) {
      for (const childBlock of [connection?.block, connection?.shadow]) {
        const found = childBlock && this.getNodeById(childBlock, id);
        if (found) return found;
      }
    }
    return null;
  }

  /**
   * Returns a copy of a block's state with one of its fields set.
   *
   * @param info The state to copy.
   * @param candidate The field to set, which may be on any block in the tree,
   *     and the value to set it to.
   * @returns A copy with the field set, or info itself if the block is gone.
   */
  private updateBlockField(
    info: Blockly.utils.toolbox.BlockInfo,
    candidate: FieldCandidate,
  ): Blockly.utils.toolbox.BlockInfo {
    const copy = JSON.parse(
      JSON.stringify(info),
    ) as Blockly.utils.toolbox.BlockInfo;
    const target = this.getNodeById(copy, candidate.blockId);
    if (!target) return info;
    target.fields = {...target.fields, [candidate.fieldName]: candidate.value};
    return copy;
  }
}
