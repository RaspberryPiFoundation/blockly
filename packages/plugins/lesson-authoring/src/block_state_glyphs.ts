/**
 * @license
 * Copyright 2026 Raspberry Pi Foundation
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Claude-generated glyphs for a block's deletable, editable and
 * movable states being turned off: a slashed trash can, a slashed pencil and
 * a pin.
 */

import * as Blockly from 'blockly/core';

/** A state that has been turned off on a block. */
export type Restriction = 'deletable' | 'editable' | 'movable';

/** The width and height of each glyph, in workspace-scale units. */
const GLYPH_SIZE = 16;

/** The space between glyphs, in workspace-scale units. */
const GLYPH_GAP = 2;

/** Outlines of each glyph, drawn on a 16x16 grid. */
const GLYPH_PATHS: Record<Restriction, string> = {
  deletable: 'M2.5 4.5h11M6 4.5V3h4v1.5M4 4.5l.8 9h6.4l.8-9', // Trash can with slash
  editable: 'M3 13l.8-3 6.7-6.7 2.2 2.2L6 12.2zM9.3 4.5l2.2 2.2', // Pencil with slash
  movable: 'M5.5 2.5h5M6.5 2.5v3.8L4.5 9h7l-2-2.7V2.5M8 9v4.5', // Pin
};

// Glyphs are drawn in the current text colour, so whoever draws them picks the
// colour by setting `color` on an ancestor.
Blockly.Css.register(`
.lessonBlockStateGlyph {
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6px;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.lessonBlockStateGap {
  stroke: #000;
  stroke-width: 2.4px;
  stroke-linecap: round;
}
`);

/**
 * Gets the width of a row of glyphs.
 *
 * @param count The number of glyphs in the row.
 * @returns The row's width, in workspace-scale units.
 */
export function getGlyphRowWidth(count: number): number {
  return count * GLYPH_SIZE + Math.max(count - 1, 0) * GLYPH_GAP;
}

/**
 * Draws a row of glyphs, one for each restriction, starting at the left edge
 * of their parent and centred vertically in the given height.
 *
 * @param parent The element to draw the glyphs in.
 * @param restrictions The restrictions to draw glyphs for, in order.
 * @param height The height of the row, in workspace-scale units.
 */
export function drawGlyphRow(
  parent: SVGElement,
  restrictions: Restriction[],
  height: number,
) {
  const top = (height - GLYPH_SIZE) / 2;
  restrictions.forEach((restriction, i) => {
    const glyph = Blockly.utils.dom.createSvgElement(
      Blockly.utils.Svg.G,
      {transform: `translate(${i * (GLYPH_SIZE + GLYPH_GAP)}, ${top})`},
      parent,
    );
    const path = Blockly.utils.dom.createSvgElement(
      Blockly.utils.Svg.PATH,
      {class: 'lessonBlockStateGlyph', d: GLYPH_PATHS[restriction]},
      glyph,
    );
    // The pin already means "can't move", so it is drawn without a slash.
    if (restriction !== 'movable') drawSlash(glyph, path);
  });
}

/**
 * Draws a slash across a glyph, with a gap cut out of the glyph along the
 * slash's upper side so that the two read as separate shapes. The gap is a
 * mask rather than a stroke in the block's colour, so it stays correct when
 * the block's colour or style changes.
 *
 * @param glyph The group to draw the slash in.
 * @param path The glyph's outline, which the gap is cut from.
 */
function drawSlash(glyph: SVGGElement, path: SVGElement) {
  const maskId = Blockly.utils.idGenerator.getNextUniqueId();
  const mask = Blockly.utils.dom.createSvgElement(
    'mask',
    {
      id: maskId,
      maskUnits: 'userSpaceOnUse',
      x: 0,
      y: 0,
      width: GLYPH_SIZE,
      height: GLYPH_SIZE,
    },
    glyph,
  );
  Blockly.utils.dom.createSvgElement(
    Blockly.utils.Svg.RECT,
    {width: GLYPH_SIZE, height: GLYPH_SIZE, fill: '#fff'},
    mask,
  );
  Blockly.utils.dom.createSvgElement(
    Blockly.utils.Svg.LINE,
    {class: 'lessonBlockStateGap', x1: 3.1, y1: 0.9, x2: 15.1, y2: 12.9},
    mask,
  );
  path.setAttribute('mask', `url(#${maskId})`);
  Blockly.utils.dom.createSvgElement(
    Blockly.utils.Svg.LINE,
    {class: 'lessonBlockStateGlyph', x1: 2, y1: 2, x2: 14, y2: 14},
    glyph,
  );
}
