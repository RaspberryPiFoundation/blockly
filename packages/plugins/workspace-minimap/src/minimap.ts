/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview A minimap is a miniature version of your blocks that
 * appears on top of your main workspace. This gives you an overview
 * of what your code looks like, and how it is organized.
 * @author cesarades@google.com (Cesar Ades)
 */

import * as Blockly from 'blockly/core';
import {FocusRegion} from './focus_region';

// Events that should be send over to the minimap from the primary workspace
const blockEvents = new Set<string>([
  Blockly.Events.BLOCK_CHANGE,
  Blockly.Events.BLOCK_CREATE,
  Blockly.Events.BLOCK_DELETE,
  Blockly.Events.BLOCK_DRAG,
  Blockly.Events.BLOCK_MOVE,
]);

/** Default primary-workspace pixels to pan per arrow keypress. */
const DEFAULT_PAN_STEP = 40;

/**
 * A minimap is a miniature version of your blocks that appears on
 * top of your main workspace. This gives you an overview of what
 * your code looks like, and how it is organized.
 */
export class Minimap {
  protected primaryWorkspace: Blockly.WorkspaceSvg;
  protected minimapWorkspace: Blockly.WorkspaceSvg | null = null;
  protected focusRegion: FocusRegion | null = null;
  protected onMouseMoveWrapper: Blockly.browserEvents.Data | null = null;
  protected onMouseDownWrapper: Blockly.browserEvents.Data | null = null;
  protected onMouseUpWrapper: Blockly.browserEvents.Data | null = null;
  protected minimapWrapper: HTMLDivElement | null = null;
  private onKeyDownWrapper: Blockly.browserEvents.Data | null = null;
  private onFocusWrapper: Blockly.browserEvents.Data | null = null;
  private onBlurWrapper: Blockly.browserEvents.Data | null = null;
  protected panStep = DEFAULT_PAN_STEP;

  /**
   * Constructor for a minimap.
   *
   * @param workspace The workspace to mirror.
   */
  constructor(workspace: Blockly.WorkspaceSvg) {
    this.primaryWorkspace = workspace;
  }

  /**
   * Initialize.
   */
  init(): void {
    const primaryInjectParentDiv =
      this.primaryWorkspace.getInjectionDiv().parentNode;

    if (!primaryInjectParentDiv) {
      throw new Error(
        'The workspace must be injected into the page before the minimap can be initalized',
      );
    }

    // Create a wrapper div for the minimap injection.
    this.minimapWrapper = document.createElement('div');
    this.minimapWrapper.id = 'minimapWrapper' + this.primaryWorkspace.id;
    this.minimapWrapper.className = 'blockly-minimap';

    // Make the wrapper a sibling to the primary injection div.
    primaryInjectParentDiv?.appendChild(this.minimapWrapper);

    // Inject the minimap workspace.
    this.minimapWorkspace = Blockly.inject(this.minimapWrapper.id, {
      // Inherit the layout of the primary workspace.
      rtl: this.primaryWorkspace.RTL,
      // Include the scrollbars so that internal scrolling is enabled and
      // remove direct interaction with the minimap workspace.
      move: {
        scrollbars: true,
        drag: false,
        wheel: false,
      },
      // Remove the scale bounds of the minimap so that it can
      // correctly zoomToFit.
      zoom: {
        maxScale: Infinity,
        minScale: 0,
      },
      readOnly: true,
      theme: this.primaryWorkspace.getTheme(),
      renderer: this.primaryWorkspace.options.renderer,
    });

    // Remove the minimap workspace from the focus manager so keyboard focus
    // can never land inside it.
    // `unregisterTree` also removes the tabIndex that inject
    // set on the minimap SVG, dropping it from the tab order.
    const focusManager = Blockly.getFocusManager();
    if (focusManager.isRegistered(this.minimapWorkspace)) {
      focusManager.unregisterTree(this.minimapWorkspace);
    }

    // The focus-ring CSS variables are defined on .injectionDiv. The wrapper is
    // a sibling of that element, not a descendant, so var() references won't
    // resolve there. Copy the values onto the wrapper so the focus handler can
    // use them.
    const injectionStyle = getComputedStyle(
      this.primaryWorkspace.getInjectionDiv(),
    );
    for (const prop of [
      '--blockly-active-tree-color',
      '--blockly-selection-width',
    ]) {
      const value = injectionStyle.getPropertyValue(prop).trim();
      if (value) this.minimapWrapper.style.setProperty(prop, value);
    }

    const label =
      Blockly.Msg['MINIMAP_ARIA_LABEL'] ||
      'Workspace minimap. Use the arrow keys to pan the workspace.';
    this.minimapWrapper.tabIndex = 0;
    this.minimapWrapper.setAttribute('role', 'application');
    this.minimapWrapper.setAttribute('aria-label', label);

    // Bind arrow-key panning on the wrapper (where focus lives).
    this.onKeyDownWrapper = Blockly.browserEvents.bind(
      this.minimapWrapper,
      'keydown',
      this,
      this.onKeyDown,
    );

    // Apply a focus ring matching the workspace when focused via keyboard.
    // Ideally this would just be done with CSS, but our CSS management system
    // doesn't allow us to inject CSS after workspace creation, so deal with it.
    this.onFocusWrapper = Blockly.browserEvents.bind(
      this.minimapWrapper,
      'focus',
      this,
      this.onMinimapFocus,
    );
    this.onBlurWrapper = Blockly.browserEvents.bind(
      this.minimapWrapper,
      'blur',
      this,
      this.onMinimapBlur,
    );

    this.minimapWorkspace.scrollbar?.setContainerVisible(false);
    this.primaryWorkspace.addChangeListener((e) => void this.mirror(e));
    window.addEventListener('resize', () => {
      if (this.minimapWorkspace) {
        this.minimapWorkspace.zoomToFit();
      }
    });

    // The mousedown handler needs to take precedent over other mouse handlers
    // in the workspace, such as the handler that opens comments, which means it
    // needs to be attached in the capture phase. Blockly's built-in event
    // binding does not let us use the capture phase so we reimplement it here.
    const mouseDownFunc = (event: Event) =>
      this.onClickDown(event as PointerEvent);
    this.minimapWorkspace.svgGroup_.addEventListener(
      'pointerdown',
      mouseDownFunc,
      /* usecapture */ true,
    );
    this.onMouseDownWrapper = [
      [this.minimapWorkspace.svgGroup_, 'pointerdown', mouseDownFunc],
    ];

    // The mouseup binds to the parent container div instead of the minimap
    // because if a drag begins on the minimap and ends outside of it the
    // mousemove should still unbind.
    this.onMouseUpWrapper = Blockly.browserEvents.bind(
      primaryInjectParentDiv,
      'mouseup',
      this,
      this.onClickUp,
    );

    // Initializes the focus region.
    this.focusRegion = new FocusRegion(
      this.primaryWorkspace,
      this.minimapWorkspace,
    );
    this.enableFocusRegion();
  }

  /**
   * Disposes the minimap.
   * Unlinks from all DOM elements and remove all event listeners
   * to prevent memory leaks.
   */
  dispose() {
    if (this.isFocusEnabled()) {
      this.disableFocusRegion();
    }
    if (this.minimapWorkspace) {
      this.minimapWorkspace.dispose();
    }
    Blockly.utils.dom.removeNode(this.minimapWrapper);
    if (this.onMouseMoveWrapper) {
      Blockly.browserEvents.unbind(this.onMouseMoveWrapper);
    }
    if (this.onMouseDownWrapper) {
      Blockly.browserEvents.unbind(this.onMouseDownWrapper);
    }
    if (this.onMouseUpWrapper) {
      Blockly.browserEvents.unbind(this.onMouseUpWrapper);
    }
    if (this.onKeyDownWrapper) {
      Blockly.browserEvents.unbind(this.onKeyDownWrapper);
      this.onKeyDownWrapper = null;
    }
    if (this.onFocusWrapper) {
      Blockly.browserEvents.unbind(this.onFocusWrapper);
      this.onFocusWrapper = null;
    }
    if (this.onBlurWrapper) {
      Blockly.browserEvents.unbind(this.onBlurWrapper);
      this.onBlurWrapper = null;
    }
  }

  /**
   * Creates the mirroring between workspaces. Passes on all desired events
   * to the minimap from the primary workspace.
   *
   * @param event The primary workspace event.
   */
  private mirror(event: Blockly.Events.Abstract): void {
    if (!blockEvents.has(event.type)) {
      return; // Filter out events.
    }
    // Run the event in the minimap.
    const json = event.toJson();
    if (this.minimapWorkspace) {
      const duplicate = Blockly.Events.fromJson(json, this.minimapWorkspace);
      duplicate.run(true);
    }

    // Resize and center the minimap.
    // We need to wait for the event to finish rendering to do the zoom.
    Blockly.renderManagement.finishQueuedRenders().then(() => {
      if (this.minimapWorkspace) {
        this.minimapWorkspace.zoomToFit();
      }
    });
  }

  /**
   * Converts the coorindates from a mouse event on the minimap
   * into scroll coordinates for the primary viewport.
   *
   * @param primaryMetrics The metrics from the primary workspace.
   * @param minimapMetrics The metrics from the minimap workspace.
   * @param offsetX The x offset of the mouse event.
   * @param offsetY The y offset of the mouse event.
   * @returns (x, y) primary workspace scroll coordinates.
   */
  static minimapToPrimaryCoords(
    primaryMetrics: Blockly.utils.Metrics,
    minimapMetrics: Blockly.utils.Metrics,
    offsetX: number,
    offsetY: number,
  ): [number, number] {
    // Gets the coordinate relative to the top left of the minimap content.
    offsetX -= (minimapMetrics.svgWidth - minimapMetrics.contentWidth) / 2;
    offsetY -= (minimapMetrics.svgHeight - minimapMetrics.contentHeight) / 2;

    // Scales the coordinate to the primary workspace.
    const scale = primaryMetrics.contentWidth / minimapMetrics.contentWidth;
    offsetX *= scale;
    offsetY *= scale;

    // Gets the coordinate relative to the top left of the primary content.
    let x = -primaryMetrics.contentLeft - offsetX;
    let y = -primaryMetrics.contentTop - offsetY;

    // Centers the coordinate in the primary viewport.
    x += primaryMetrics.viewWidth / 2;
    y += primaryMetrics.viewHeight / 2;

    return [x, y];
  }

  /**
   * Scrolls the primary workspace viewport based on a minimap event.
   *
   * @param event The minimap browser event.
   */
  private primaryScroll(event: PointerEvent): void {
    const primaryMetrics = this.primaryWorkspace.getMetrics();
    if (this.minimapWorkspace) {
      const minimapMetrics = this.minimapWorkspace.getMetrics();
      if (primaryMetrics && minimapMetrics) {
        const [x, y] = Minimap.minimapToPrimaryCoords(
          primaryMetrics,
          minimapMetrics,
          event.offsetX,
          event.offsetY,
        );
        this.primaryWorkspace.scroll(x, y);
      }
    }
  }

  /**
   * Updates the primary workspace viewport based on a click in the minimap.
   *
   * @param event The minimap browser event.
   */
  private onClickDown(event: PointerEvent): void {
    if (this.minimapWorkspace) {
      // Stop any other click event handlers in the workspace from handling
      // this event.
      event.stopImmediatePropagation();

      this.onMouseMoveWrapper = Blockly.browserEvents.bind(
        this.minimapWorkspace.svgGroup_,
        'mousemove',
        this,
        this.onMouseMove,
      );
      this.primaryScroll(event);
    }
  }

  /**
   * Unbinds the minimap mousemove when the mouse is not clicked.
   */
  private onClickUp(): void {
    if (this.onMouseMoveWrapper) {
      Blockly.browserEvents.unbind(this.onMouseMoveWrapper);
      this.onMouseMoveWrapper = null;
    }
  }

  /**
   * Updates the primary workspace viewport based on a drag in the minimap.
   *
   * @param event The minimap browser event.
   */
  private onMouseMove(event: PointerEvent): void {
    this.primaryScroll(event);
  }

  private onMinimapFocus(): void {
    if (this.minimapWrapper?.matches(':focus-visible')) {
      this.minimapWrapper.style.setProperty(
        'outline-width',
        'var(--blockly-selection-width)',
      );
      this.minimapWrapper.style.setProperty('outline-style', 'solid');
      this.minimapWrapper.style.setProperty(
        'outline-color',
        'var(--blockly-active-tree-color)',
      );
    }
  }

  private onMinimapBlur(): void {
    if (this.minimapWrapper) {
      this.minimapWrapper.style.removeProperty('outline-width');
      this.minimapWrapper.style.removeProperty('outline-style');
      this.minimapWrapper.style.removeProperty('outline-color');
    }
  }

  /**
   * Pans the primary workspace when an arrow key is pressed on the minimap
   * wrapper.
   *
   * @param event The keyboard event.
   */
  private onKeyDown(event: KeyboardEvent): void {
    if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey)
      return;
    let dx = 0;
    let dy = 0;
    switch (event.key) {
      case 'ArrowUp':
        dy = this.panStep;
        break;
      case 'ArrowDown':
        dy = -this.panStep;
        break;
      case 'ArrowLeft':
        dx = this.panStep;
        break;
      case 'ArrowRight':
        dx = -this.panStep;
        break;
      default:
        return;
    }
    event.preventDefault();
    event.stopPropagation();
    const ws = this.primaryWorkspace;
    ws.scroll(ws.scrollX + dx, ws.scrollY + dy);
  }

  /**
   * Sets how far (in primary-workspace pixels) each arrow keypress pans the
   * workspace when the minimap is focused.
   *
   * @param stepPixels Pixels to pan per keypress.
   */
  setKeyboardPanStep(stepPixels: number): void {
    this.panStep = stepPixels;
  }

  /**
   * Returns the current keyboard pan step in primary-workspace pixels.
   *
   * @returns The pan step in pixels.
   */
  getKeyboardPanStep(): number {
    return this.panStep;
  }

  /**
   * Enables the focus region; A highlight of the viewport in the minimap.
   */
  enableFocusRegion(): void {
    if (this.focusRegion) {
      this.focusRegion.init();
    }
  }

  /**
   * Disables the focus region.
   */
  disableFocusRegion(): void {
    if (this.focusRegion) {
      this.focusRegion.dispose();
    }
  }

  /**
   * Returns whether the focus region is enabled.
   *
   * @returns True if the focus region is enabled.
   */
  isFocusEnabled(): boolean {
    if (this.focusRegion) {
      return this.focusRegion.isEnabled();
    }
    return false;
  }
}
