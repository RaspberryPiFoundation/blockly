/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';

/**
 * Gets the current location of the workspace considering
 * when there's no drag surface.
 *
 * @param ws The workspace to calculate.
 * @returns The current workspace coordinate.
 */
export const getTranslation = (
  ws: Blockly.WorkspaceSvg,
): Blockly.utils.Coordinate => {
  // TODO(blockly/#7157): We should maybe make getBlockCanvas public?
  const translation = ws.svgBlockCanvas_.getAttribute('transform');
  if (!translation)
    throw new Error(`svgBlockCanvas has no attribute 'transform'`);

  // Translation has the format 'translate(x, y)'.
  const splitted = translation.split(',');
  const x = Number(splitted[0].split('(')[1]);
  const y = Number(splitted[1].split(')')[0]);
  return new Blockly.utils.Coordinate(x, y);
};
