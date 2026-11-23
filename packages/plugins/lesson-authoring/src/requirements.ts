/**
 * @license
 * Copyright 2026 Raspberry Pi Foundation
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Functions for determining the requirements of a lesson artifact.
 */

import type {LessonArtifact, LessonRequirements} from './artifact_types';

import type * as Blockly from 'blockly/core';

/**
 * Derives the requirements by walking the toolbox and every workspace state.
 *
 * @param artifact The lesson artifact to analyze.
 * @returns The requirements (e.g. block types) of the artifact.
 */
export function getRequirements(artifact: LessonArtifact): LessonRequirements {
  const {toolbox, initialWorkspaceState} = artifact;
  const blockTypes = new Set<string>();
  // Get block types from the toolbox or flyout.
  if (toolbox) {
    addBlockTypesFromCategoryInfo(toolbox, blockTypes);
  }
  // Get block types from the initial workspace state.
  if (initialWorkspaceState) {
    const blocks: Blockly.serialization.blocks.State[] =
      initialWorkspaceState.blocks?.blocks ?? [];
    blocks.forEach((block) => {
      addBlockTypesFromBlockInfo(block, blockTypes);
    });
  }
  return {
    blockTypes: Array.from(blockTypes).sort(),
  };
}

function addBlockTypesFromCategoryInfo(
  categoryInfo: Pick<Blockly.utils.toolbox.StaticCategoryInfo, 'contents'>,
  blockTypes: Set<string>,
): void {
  if (categoryInfo.contents) {
    categoryInfo.contents.forEach((content) => {
      const kind = content.kind.toLowerCase();
      if (kind === 'block') {
        if ('blockxml' in content && content.blockxml) {
          throw new Error(
            'blockxml is not supported in lesson authoring requirements',
          );
        }
        if ('type' in content && content.type) {
          addBlockTypesFromBlockInfo(content, blockTypes);
        }
      }
      // TODO: Dynamic categories aren't checked here because they don't get blocks
      // until runtime. We will need to add their `custom` values to the requirements
      // in order to validate that the host provides them. This will require a change
      // to the LessonRequirements interface.
      if (kind === 'category' && 'contents' in content && content.contents) {
        addBlockTypesFromCategoryInfo(content, blockTypes);
      }
    });
  }
}

function addBlockTypesFromBlockInfo(
  blockInfo: Pick<Blockly.utils.toolbox.BlockInfo, 'type' | 'inputs' | 'next'>,
  blockTypes: Set<string>,
): void {
  if (blockInfo.type) {
    blockTypes.add(blockInfo.type);
  }
  // Walk nested inputs and next blocks.
  if (blockInfo.inputs) {
    const inputs = blockInfo.inputs;
    Object.keys(inputs).forEach((key) => {
      const input = inputs[key];
      if (input.block) {
        addBlockTypesFromBlockInfo(input.block, blockTypes);
      }
      if (input.shadow) {
        addBlockTypesFromBlockInfo(input.shadow, blockTypes);
      }
    });
  }
  if (blockInfo.next) {
    if (blockInfo.next.block) {
      addBlockTypesFromBlockInfo(blockInfo.next.block, blockTypes);
    }
    if (blockInfo.next.shadow) {
      addBlockTypesFromBlockInfo(blockInfo.next.shadow, blockTypes);
    }
  }
}

/**
 * Returns the requirements for an `artifact` that `supported` doesn't provide.
 * `supported.blockTypes` can be derived from Blockly.Blocks or specified by the host.
 * In the future, `supported` will potentially include dynamic category names, category
 * style names and colours, and button callback keys.
 *
 * @param artifact The lesson artifact to analyze
 * @param supported A list of supported block types (or other requirements in the future).
 * @returns The requirements that are needed but not available.
 */
export function findMissingRequirements(
  artifact: LessonArtifact,
  supported: LessonRequirements,
): LessonRequirements {
  const required = getRequirements(artifact);
  const supportedBlockTypes = new Set(supported.blockTypes);
  return {
    blockTypes: required.blockTypes.filter(
      (type) => !supportedBlockTypes.has(type),
    ),
  };
}
