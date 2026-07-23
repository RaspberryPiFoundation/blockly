/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';

/**
 * A class that provides methods for indexing and searching blocks.
 */
export class BlockSearcher {
  private trigramsToBlocks = new Map<
    string,
    Set<Blockly.utils.toolbox.BlockInfo>
  >();

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
    const blockCreationWorkspace = new Blockly.Workspace();
    blockInfos.forEach((blockInfo) => {
      const type = blockInfo.type;
      if (!type || type === '') return;
      const block = blockCreationWorkspace.newBlock(type);
      this.indexBlockText(type.replaceAll('_', ' '), blockInfo);
      block.inputList.forEach((input) => {
        input.fieldRow.forEach((field) => {
          this.indexDropdownOption(field, blockInfo);
          this.indexBlockText(field.getText(), blockInfo);
        });
      });
    });
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
    if (field instanceof Blockly.FieldDropdown) {
      field.getOptions(true).forEach((option) => {
        if (typeof option[0] === 'string') {
          this.indexBlockText(option[0], block);
        } else if ('alt' in option[0]) {
          this.indexBlockText(option[0].alt, block);
        }
      });
    }
  }

  /**
   * Filters the available blocks based on the current query string.
   *
   * @param query The text to use to match blocks against.
   * @returns A list of blocks matching the query.
   */
  blockTypesMatching(query: string): Blockly.utils.toolbox.BlockInfo[] {
    return [
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
  }

  /**
   * Generates trigrams for the given text and associates them with the given
   * block.
   *
   * @param text The text to generate trigrams of.
   * @param block The block to associate the trigrams with.
   */
  private indexBlockText(text: string, block: Blockly.utils.toolbox.BlockInfo) {
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
