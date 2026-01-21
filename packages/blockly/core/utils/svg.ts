/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Defines the Svg class. Its constants enumerate
 * all SVG tag names used by Blockly.
 *
 * @class
 */
// Former goog.module ID: Blockly.utils.Svg

/**
 * A name with the type of the SVG element stored in the generic.
 */
export class Svg<_T> {
  /** @internal */
  static ANIMATE = new Svg<SVGAnimateElement>('animate');
  /** @internal */
  static CIRCLE = new Svg<SVGCircleElement>('circle');
  /** @internal */
  static CLIPPATH = new Svg<SVGClipPathElement>('clipPath');
  /** @internal */
  static DEFS = new Svg<SVGDefsElement>('defs');
  /** @internal */
  static FECOMPOSITE = new Svg<SVGFECompositeElement>('feComposite');
  /** @internal */
  static FECOMPONENTTRANSFER = new Svg<SVGFEComponentTransferElement>(
    'feComponentTransfer',
  );
  /** @internal */
  static FEFLOOD = new Svg<SVGFEFloodElement>('feFlood');
  /** @internal */
  static FEFUNCA = new Svg<SVGFEFuncAElement>('feFuncA');
  /** @internal */
  static FEGAUSSIANBLUR = new Svg<SVGFEGaussianBlurElement>('feGaussianBlur');
  /** @internal */
  static FEPOINTLIGHT = new Svg<SVGFEPointLightElement>('fePointLight');
  /** @internal */
  static FESPECULARLIGHTING = new Svg<SVGFESpecularLightingElement>(
    'feSpecularLighting',
  );
  /** @internal */
  static FILTER = new Svg<SVGFilterElement>('filter');
  /** @internal */
  static FOREIGNOBJECT = new Svg<SVGForeignObjectElement>('foreignObject');
  /** @internal */
  static G = new Svg<SVGGElement>('g');
  /** @internal */
  static IMAGE = new Svg<SVGImageElement>('image');
  /** @internal */
  static LINE = new Svg<SVGLineElement>('line');
  /** @internal */
  static PATH = new Svg<SVGPathElement>('path');
  /** @internal */
  static PATTERN = new Svg<SVGPatternElement>('pattern');
  /** @internal */
  static POLYGON = new Svg<SVGPolygonElement>('polygon');
  /** @internal */
  static RECT = new Svg<SVGRectElement>('rect');
  /** @internal */
  static SVG = new Svg<SVGSVGElement>('svg');
  /** @internal */
  static TEXT = new Svg<SVGTextElement>('text');
  /** @internal */
  static TSPAN = new Svg<SVGTSpanElement>('tspan');

  /**
   * @param tagName The SVG element tag name.
   * @internal
   */
  constructor(private readonly tagName: string) {}

  /**
   * Returns the SVG element tag name.
   *
   * @returns The name.
   */
  toString(): string {
    return this.tagName;
  }
}
