/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import {DebugDrawer} from './debugDrawer.js';

/**
 * The name that the debug renderer is registered under.
 * @type {string}
 */
export const debugRendererName = 'debugRenderer';

/**
 * Creates and registers a renderer that draws debug rectangles on top of the
 * blocks. This renderer extends the renderer with the given name.
 * @param {string} name The name of the renderer we want to debug.
 */
export function registerDebugRendererFromName(name) {
  if (!Blockly.registry.hasItem(Blockly.registry.Type.RENDERER, name)) {
    throw Error(
      'No renderer with the name ' +
        name +
        ' is registered. ' +
        'Please register your renderer using Blockly.registry.register.',
    );
  }
  const RendererClass = Blockly.registry.getClass(
    Blockly.registry.Type.RENDERER,
    name,
  );

  const DebugRenderer = createNewRenderer(RendererClass);

  Blockly.registry.register(
    Blockly.registry.Type.RENDERER,
    debugRendererName,
    DebugRenderer,
    true,
  );
}

/**
 * Creates a debug renderer.
 * @param {function(new: Blockly.blockRendering.Renderer)} Renderer The
 *     original renderer we are going to extend.
 * @returns {function(new: Blockly.blockRendering.Renderer)} The renderer with
 *     the necessary logic to draw the debug rectangles.
 */
export function createNewRenderer(Renderer) {
  /**
   * The debug renderer.
   */
  class DebugRenderer extends Renderer {
    /**
     * Maps the id of a block to the object that draws
     * the debug rectangles.
     * @type {!Object<string, DebugDrawer>}
     */
    blockToDebugger = Object.create(null);

    /**
     * Maps the workspace to the workspace event listener.
     * @type {!Object<string, Function>}
     */
    workspaceListeners = Object.create(null);

    /** @override */
    render(block) {
      super.render(block);
      const debugDrawer = this.getDebugger_(block);
      const info = this.makeRenderInfo_(block);

      info.measure();
      debugDrawer.drawDebug(block, info);
    }

    /**
     * Gets the debug renderer for the given block.
     * If we have already created a debugger for this block, use that debugger
     * so that it can remove any previously created html elements.
     * @param {Blockly.BlockSvg} block The block that is about to be rendered.
     * @returns {DebugDrawer} The object used to draw the debug rectangles
     *     on the block.
     * @private
     */
    getDebugger_(block) {
      let debugDrawer = this.blockToDebugger[block.id];

      if (!debugDrawer) {
        this.regiserWorkspaceListener_(block.workspace);
        debugDrawer = new DebugRenderer.DebugDrawerClass(this.getConstants());
        this.blockToDebugger[block.id] = debugDrawer;
      }
      return debugDrawer;
    }

    /**
     * Adds a change listener to the given workspace to remove the reference to
     * the block's debugger when a block is deleted.
     * @param {Blockly.WorkspaceSvg} workspace The workspace to add the change
     *     listener to.
     * @private
     */
    regiserWorkspaceListener_(workspace) {
      const workspaceListener = this.workspaceListeners[workspace.id];

      if (!workspaceListener) {
        this.workspaceListeners[workspace.id] = workspace.addChangeListener(
          (event) => {
            const blockIds = event.ids;
            if (event.type === Blockly.Events.DELETE) {
              for (let i = 0; i < blockIds.length; i++) {
                const blockId = blockIds[i];
                if (this.blockToDebugger[blockId]) {
                  delete this.blockToDebugger[blockId];
                }
              }
            }
          },
        );
      }
    }
  }
  DebugRenderer.DebugDrawerClass = DebugDrawer;
  return DebugRenderer;
}
