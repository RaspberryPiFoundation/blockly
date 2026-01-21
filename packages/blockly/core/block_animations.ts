/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.blockAnimations

import type {BlockSvg} from './block_svg.js';
import * as dom from './utils/dom.js';
import {Svg} from './utils/svg.js';

/** A bounding box for a cloned block. */
interface CloneRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** PID of disconnect UI animation.  There can only be one at a time. */
let disconnectPid: ReturnType<typeof setTimeout> | null = null;

/** The wobbling block.  There can only be one at a time. */
let wobblingBlock: BlockSvg | null = null;

/**
 * Play some UI effects (sound, animation) when disposing of a block.
 *
 * @param block The block being disposed of.
 * @internal
 */
export function disposeUiEffect(block: BlockSvg) {
  // Disposing is going to take so long the animation won't play anyway.
  if (block.getDescendants(false).length > 100) return;

  const workspace = block.workspace;
  const svgGroup = block.getSvgRoot();
  workspace.getAudioManager().play('delete');

  const xy = block.getRelativeToSurfaceXY();
  // Deeply clone the current block.
  const clone: SVGGElement = svgGroup.cloneNode(true) as SVGGElement;
  clone.setAttribute('transform', 'translate(' + xy.x + ',' + xy.y + ')');
  workspace.getLayerManager()?.appendToAnimationLayer({
    getSvgRoot: () => {
      return clone;
    },
  });
  const cloneRect = {
    'x': xy.x,
    'y': xy.y,
    'width': block.width,
    'height': block.height,
  };
  disposeUiStep(clone, cloneRect, workspace.RTL, new Date());
}
/**
 * Animate a cloned block and eventually dispose of it.
 * This is a class method, not an instance method since the original block has
 * been destroyed and is no longer accessible.
 *
 * @param clone SVG element to animate and dispose of.
 * @param rect Starting rect of the clone.
 * @param rtl True if RTL, false if LTR.
 * @param start Date of animation's start.
 */
function disposeUiStep(
  clone: Element,
  rect: CloneRect,
  rtl: boolean,
  start: Date,
) {
  const ms = new Date().getTime() - start.getTime();
  const percent = ms / 150;
  if (percent > 1) {
    dom.removeNode(clone);
  } else {
    const x = rect.x + (((rtl ? -1 : 1) * rect.width) / 2) * percent;
    const y = rect.y + (rect.height / 2) * percent;
    const scale = 1 - percent;
    clone.setAttribute(
      'transform',
      'translate(' + x + ',' + y + ')' + ' scale(' + scale + ')',
    );
    setTimeout(disposeUiStep, 10, clone, rect, rtl, start);
  }
}

/**
 * Play some UI effects (sound, ripple) after a connection has been established.
 *
 * @param block The block being connected.
 * @internal
 */
export function connectionUiEffect(block: BlockSvg) {
  const workspace = block.workspace;
  const scale = workspace.scale;
  workspace.getAudioManager().play('click');
  if (scale < 1) {
    return; // Too small to care about visual effects.
  }
  // Determine the absolute coordinates of the inferior block.
  const xy = workspace.getSvgXY(block.getSvgRoot());
  // Offset the coordinates based on the two connection types, fix scale.
  if (block.outputConnection) {
    xy.x += (block.RTL ? 3 : -3) * scale;
    xy.y += 13 * scale;
  } else if (block.previousConnection) {
    xy.x += (block.RTL ? -23 : 23) * scale;
    xy.y += 3 * scale;
  }
  const ripple = dom.createSvgElement(
    Svg.CIRCLE,
    {
      'cx': xy.x,
      'cy': xy.y,
      'r': 0,
      'fill': 'none',
      'stroke': '#888',
      'stroke-width': 10,
    },
    workspace.getParentSvg(),
  );

  const scaleAnimation = dom.createSvgElement(
    Svg.ANIMATE,
    {
      'id': 'animationCircle',
      'begin': 'indefinite',
      'attributeName': 'r',
      'dur': '150ms',
      'from': 0,
      'to': 25 * scale,
    },
    ripple,
  );
  const opacityAnimation = dom.createSvgElement(
    Svg.ANIMATE,
    {
      'id': 'animationOpacity',
      'begin': 'indefinite',
      'attributeName': 'opacity',
      'dur': '150ms',
      'from': 1,
      'to': 0,
    },
    ripple,
  );

  scaleAnimation.beginElement();
  opacityAnimation.beginElement();

  setTimeout(() => void dom.removeNode(ripple), 150);
}

/**
 * Play some UI effects (sound, animation) when disconnecting a block.
 *
 * @param block The block being disconnected.
 * @internal
 */
export function disconnectUiEffect(block: BlockSvg) {
  disconnectUiStop();
  block.workspace.getAudioManager().play('disconnect');
  if (block.workspace.scale < 1) {
    return; // Too small to care about visual effects.
  }
  // Horizontal distance for bottom of block to wiggle.
  const DISPLACEMENT = 10;
  // Scale magnitude of skew to height of block.
  const height = block.getHeightWidth().height;
  let magnitude = (Math.atan(DISPLACEMENT / height) / Math.PI) * 180;
  if (!block.RTL) {
    magnitude *= -1;
  }
  // Start the animation.
  wobblingBlock = block;
  disconnectUiStep(block, magnitude, new Date(), 0);
}

/**
 * Animate a brief wiggle of a disconnected block.
 *
 * @param block Block to animate.
 * @param magnitude Maximum degrees skew (reversed for RTL).
 * @param start Date of animation's start for deciding when to stop.
 * @param step Which step of the animation we're on.
 */
function disconnectUiStep(
  block: BlockSvg,
  magnitude: number,
  start: Date,
  step: number,
) {
  const DURATION = 200; // Milliseconds.
  const WIGGLES = [0.66, 1, 0.66, 0, -0.66, -1, -0.66, 0]; // Single cycle

  let skew = '';
  if (start.getTime() + DURATION > new Date().getTime()) {
    const val = Math.round(WIGGLES[step % WIGGLES.length] * magnitude);
    skew = `skewX(${val})`;
    disconnectPid = setTimeout(
      disconnectUiStep,
      15,
      block,
      magnitude,
      start,
      step + 1,
    );
  }

  block
    .getSvgRoot()
    .setAttribute('transform', `${block.getTranslation()} ${skew}`);
}

/**
 * Stop the disconnect UI animation immediately.
 *
 * @internal
 */
export function disconnectUiStop() {
  if (!wobblingBlock) return;
  if (disconnectPid) {
    clearTimeout(disconnectPid);
    disconnectPid = null;
  }
  wobblingBlock
    .getSvgRoot()
    .setAttribute('transform', wobblingBlock.getTranslation());
  wobblingBlock = null;
}
