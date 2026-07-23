/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Utility functions for handling suggestions.
 */
'use strict';

import * as Blockly from 'blockly/core';

/** Map from workspaces to BlockSuggestor objects. */
const suggestorLookup = new WeakMap();

/**
 * Class that tracks all blocks created in a workspace and suggests future
 * blocks to use.
 */
export class BlockSuggestor {
  /**
   * Constructs a BlockSuggestor object.
   * @param {number} numBlocksPerCategory the size of each toolbox category
   */
  constructor(numBlocksPerCategory) {
    /**
     * Saves the full JSON data for each block type the first time it's used.
     * This helps store what initial configuration / sub-blocks each block type
     * would be expected to have.
     */
    this.defaultJsonForBlockLookup = {};
    /**
     * List of recently used block types in order, starting from the most recent
     */
    this.recentlyUsedBlocks = [];
    /**
     * Checks if the workspace is finished loading, to avoid taking action on
     * all the BLOCK_CREATE events during workspace loading.
     */
    this.workspaceHasFinishedLoading = false;
    /**
     * Config parameter which sets the size of the toolbox categories.
     */
    this.numBlocksPerCategory = numBlocksPerCategory;

    this.eventListener = this.eventListener.bind(this);
    this.getMostUsed = this.getMostUsed.bind(this);
    this.getRecentlyUsed = this.getRecentlyUsed.bind(this);
    this.generateBlockData = this.generateBlockData.bind(this);
  }

  /**
   * Generates a list of the most frequently used blocks, in order.
   * Includes a secondary sort by most recent blocks.
   * @returns {!Array<!Blockly.utils.toolbox.BlockInfo>}A list of block JSON
   */
  getMostUsed = function () {
    // Store the frequency of each block, as well as the index first appears at.
    const countMap = new Map();
    const recencyMap = new Map();
    for (const [index, key] of this.recentlyUsedBlocks.entries()) {
      countMap.set(key, (countMap.get(key) || 0) + 1);
      if (!recencyMap.has(key)) {
        recencyMap.set(key, index + 1);
      }
    }

    // Get a sorted list.
    const freqUsedBlockTypes = [];
    for (const key of countMap.keys()) {
      freqUsedBlockTypes.push(key);
    }
    // Use recency as a tiebreak.
    freqUsedBlockTypes.sort(
      (a, b) =>
        countMap.get(b) -
        countMap.get(a) +
        0.01 * (recencyMap.get(a) - recencyMap.get(b)),
    );

    return this.generateBlockData(freqUsedBlockTypes);
  };

  /**
   * Generates a list of the most recently used blocks, in order, starting from
   * the most recent.
   * @returns {Array <object>} A list of block JSON objects
   */
  getRecentlyUsed = function () {
    // recentlyUsedBlocks sorted from most recent and spec requires sets
    // preserve insertion order
    const uniqueRecentBlocks = [...new Set(this.recentlyUsedBlocks)];
    return this.generateBlockData(uniqueRecentBlocks);
  };

  /**
   * Converts a list of block types to a full-fledge list of block data, limited
   * to the specified size of the category
   * @param {Array<string>} blockTypeList the list of block types
   * @returns {Array<JSON>} the block data list
   */
  generateBlockData = function (blockTypeList) {
    const blockList = blockTypeList
      .slice(0, this.numBlocksPerCategory)
      .map((key) => {
        const json = this.defaultJsonForBlockLookup[key] || {};
        json['kind'] = 'BLOCK';
        json['type'] = key;
        json['x'] = null;
        json['y'] = null;
        return json;
      });

    if (blockList.length == 0) {
      blockList.push({
        kind: 'LABEL',
        text: 'No blocks have been used yet!',
      });
    }
    return blockList;
  };

  /**
   * Loads the state of this object from a serialized JSON.
   * @param {object} data the serialized data payload to load from
   */
  loadFromSerializedData(data) {
    this.defaultJsonForBlockLookup = data.defaultJsonForBlockLookup;
    this.recentlyUsedBlocks = data.recentlyUsedBlocks;
  }

  /**
   * Saves the state of this object to a serialized JSON.
   * @returns {object} a serialized data object including this object's state
   */
  saveToSerializedData() {
    return {
      defaultJsonForBlockLookup: this.defaultJsonForBlockLookup,
      recentlyUsedBlocks: this.recentlyUsedBlocks,
    };
  }

  /**
   * Resets the internal state of this object.
   */
  clearPriorBlockData() {
    this.defaultJsonForBlockLookup = {};
    this.recentlyUsedBlocks = [];
  }

  /**
   * Callback for when the workspace sends out events.
   * @param {!Blockly.Events.Abstract} e the event object
   */
  eventListener(e) {
    if (e.type == Blockly.Events.FINISHED_LOADING) {
      this.workspaceHasFinishedLoading = true;
      return;
    }
    if (
      e.type == Blockly.Events.BLOCK_CREATE &&
      this.workspaceHasFinishedLoading
    ) {
      const newBlockType = e.json.type;
      // If this is the first time creating this block, store its default
      // configuration so we know how exactly to render it in the toolbox.
      if (!this.defaultJsonForBlockLookup[newBlockType]) {
        this.defaultJsonForBlockLookup[newBlockType] = e.json;
      }
      this.recentlyUsedBlocks.unshift(newBlockType);
    }
  }
}

/**
 * Main entry point to initialize the suggested blocks categories.
 * @param {Blockly.WorkspaceSvg} workspace the workspace to load into
 * @param {number} numBlocksPerCategory how many blocks should be included per
 * category. Defaults to 10.
 * @param {boolean} waitForFinishedLoading whether to wait until we hear the
 * FINISHED_LOADING event before responding to BLOCK_CREATE events. Set to false
 * if you disable events during initial load. Defaults to true.
 */
export const init = function (
  workspace,
  numBlocksPerCategory = 10,
  waitForFinishedLoading = true,
) {
  const suggestor = new BlockSuggestor(numBlocksPerCategory);
  workspace.registerToolboxCategoryCallback('MOST_USED', suggestor.getMostUsed);
  workspace.registerToolboxCategoryCallback(
    'RECENTLY_USED',
    suggestor.getRecentlyUsed,
  );
  // If user says not to wait to hear FINISHED_LOADING event,
  // then always respond to BLOCK_CREATE events.
  if (!waitForFinishedLoading) suggestor.workspaceHasFinishedLoading = true;
  workspace.addChangeListener(suggestor.eventListener);
  suggestorLookup.set(workspace, suggestor);
};

/**
 * Custom serializer so that the block suggestor can save and later recall which
 * blocks have been used in a workspace.
 */
class BlockSuggestorSerializer {
  /** Constructs the block suggestor serializer */
  constructor() {
    /**
     * The priority for deserializing block suggestion data.
     * Should be less than the priority for blocks so that this state is
     * applied after the blocks are loaded.
     * @type {number}
     */
    this.priority = Blockly.serialization.priorities.BLOCKS - 10;
  }

  /**
   * Saves a target workspace's state to serialized JSON.
   * @param {Blockly.Workspace} workspace the workspace to save
   * @returns {object|undefined} the serialized JSON if present
   */
  save(workspace) {
    return suggestorLookup.get(workspace)?.saveToSerializedData();
  }

  /**
   * Loads a serialized state into the target workspace.
   * @param {object} state the serialized state JSON
   * @param {Blockly.Workspace} workspace the workspace to load into
   */
  load(state, workspace) {
    suggestorLookup.get(workspace)?.loadFromSerializedData(state);
  }

  /**
   * Resets the state of a workspace.
   * @param {Blockly.Workspace} workspace the workspace to reset
   */
  clear(workspace) {
    suggestorLookup.get(workspace)?.clearPriorBlockData();
  }
}

Blockly.serialization.registry.register(
  'suggested-blocks', // Name
  new BlockSuggestorSerializer(),
);
