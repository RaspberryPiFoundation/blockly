/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.zelos.Renderer

import type {BlockSvg} from '../../block_svg.js';
import type {BlockStyle} from '../../theme.js';
import * as blockRendering from '../common/block_rendering.js';
import type {RenderInfo as BaseRenderInfo} from '../common/info.js';
import {Renderer as BaseRenderer} from '../common/renderer.js';
import {ConstantProvider} from './constants.js';
import {Drawer} from './drawer.js';
import {RenderInfo} from './info.js';
import {PathObject} from './path_object.js';

/**
 * The zelos renderer. This renderer emulates Scratch-style and MakeCode-style
 * rendering.
 *
 * Zelos is the ancient Greek spirit of rivalry and emulation.
 */
export class Renderer extends BaseRenderer {
  protected override constants_!: ConstantProvider;

  /**
   * @param name The renderer name.
   */
  constructor(name: string) {
    super(name);
  }

  /**
   * Create a new instance of the renderer's constant provider.
   *
   * @returns The constant provider.
   */
  protected override makeConstants_(): ConstantProvider {
    return new ConstantProvider();
  }

  /**
   * Create a new instance of the renderer's render info object.
   *
   * @param block The block to measure.
   * @returns The render info object.
   */
  protected override makeRenderInfo_(block: BlockSvg): RenderInfo {
    return new RenderInfo(this, block);
  }

  /**
   * Create a new instance of the renderer's drawer.
   *
   * @param block The block to render.
   * @param info An object containing all information needed to render this
   *     block.
   * @returns The drawer.
   */
  protected override makeDrawer_(
    block: BlockSvg,
    info: BaseRenderInfo,
  ): Drawer {
    return new Drawer(block, info as RenderInfo);
  }

  /**
   * Create a new instance of a renderer path object.
   *
   * @param root The root SVG element.
   * @param style The style object to use for colouring.
   * @returns The renderer path object.
   */
  override makePathObject(root: SVGElement, style: BlockStyle): PathObject {
    return new PathObject(root, style, this.getConstants() as ConstantProvider);
  }

  /**
   * Get the current renderer's constant provider.  We assume that when this is
   * called, the renderer has already been initialized.
   *
   * @returns The constant provider.
   */
  override getConstants(): ConstantProvider {
    return this.constants_;
  }
}

blockRendering.register('zelos', Renderer);
