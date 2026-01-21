/**
 * @license
 * Copyright 2011 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.ContextMenu

import type {Block} from './block.js';
import type {BlockSvg} from './block_svg.js';
import * as browserEvents from './browser_events.js';
import {config} from './config.js';
import type {
  ContextMenuOption,
  LegacyContextMenuOption,
} from './contextmenu_registry.js';
import {EventType} from './events/type.js';
import * as eventUtils from './events/utils.js';
import {getFocusManager} from './focus_manager.js';
import {Menu} from './menu.js';
import {MenuSeparator} from './menu_separator.js';
import {MenuItem} from './menuitem.js';
import * as serializationBlocks from './serialization/blocks.js';
import * as aria from './utils/aria.js';
import {Coordinate} from './utils/coordinate.js';
import * as dom from './utils/dom.js';
import {Rect} from './utils/rect.js';
import * as svgMath from './utils/svg_math.js';
import * as WidgetDiv from './widgetdiv.js';
import type {WorkspaceSvg} from './workspace_svg.js';
import * as Xml from './xml.js';

/**
 * Which block is the context menu attached to?
 */
let currentBlock: Block | null = null;

const dummyOwner = {};

/**
 * Gets the block the context menu is currently attached to.
 * It is not recommended that you use this function; instead,
 * use the scope object passed to the context menu callback.
 *
 * @returns The block the context menu is attached to.
 */
export function getCurrentBlock(): Block | null {
  return currentBlock;
}

/**
 * Sets the block the context menu is currently attached to.
 *
 * @param block The block the context menu is attached to.
 */
export function setCurrentBlock(block: Block | null) {
  currentBlock = block;
}

/**
 * Menu object.
 */
let menu_: Menu | null = null;

/**
 * Construct the menu based on the list of options and show the menu.
 *
 * @param menuOpenEvent Event that caused the menu to open.
 * @param options Array of menu options.
 * @param rtl True if RTL, false if LTR.
 * @param workspace The workspace associated with the context menu, if any.
 * @param location The screen coordinates at which to show the menu.
 */
export function show(
  menuOpenEvent: Event,
  options: (ContextMenuOption | LegacyContextMenuOption)[],
  rtl: boolean,
  workspace?: WorkspaceSvg,
  location?: Coordinate,
) {
  WidgetDiv.show(dummyOwner, rtl, dispose, workspace);
  if (!options.length) {
    hide();
    return;
  }

  if (!location) {
    if (menuOpenEvent instanceof PointerEvent) {
      location = new Coordinate(menuOpenEvent.clientX, menuOpenEvent.clientY);
    } else {
      // We got a keyboard event that didn't tell us where to open the menu, so just guess
      console.warn('Context menu opened with keyboard but no location given');
      location = new Coordinate(0, 0);
    }
  }
  const menu = populate_(options, rtl, menuOpenEvent, location);
  menu_ = menu;

  position_(menu, rtl, location);
  // 1ms delay is required for focusing on context menus because some other
  // mouse event is still waiting in the queue and clears focus.
  setTimeout(function () {
    menu.focus();
  }, 1);
  currentBlock = null; // May be set by Blockly.Block.
}

/**
 * Create the context menu object and populate it with the given options.
 *
 * @param options Array of menu options.
 * @param rtl True if RTL, false if LTR.
 * @param menuOpenEvent The event that triggered the context menu to open.
 * @param location The screen coordinates at which to show the menu.
 * @returns The menu that will be shown on right click.
 */
function populate_(
  options: (ContextMenuOption | LegacyContextMenuOption)[],
  rtl: boolean,
  menuOpenEvent: Event,
  location: Coordinate,
): Menu {
  /* Here's what one option object looks like:
      {text: 'Make It So',
       enabled: true,
       callback: Blockly.MakeItSo}
    */
  const menu = new Menu();
  menu.setRole(aria.Role.MENU);
  for (let i = 0; i < options.length; i++) {
    const option = options[i];
    if (option.separator) {
      menu.addChild(new MenuSeparator());
      continue;
    }

    const menuItem = new MenuItem(option.text);
    menuItem.setRightToLeft(rtl);
    menuItem.setRole(aria.Role.MENUITEM);
    menu.addChild(menuItem);
    menuItem.setEnabled(option.enabled);
    if (option.enabled) {
      const actionHandler = function (p1: MenuItem, menuSelectEvent: Event) {
        hide();
        requestAnimationFrame(() => {
          setTimeout(() => {
            // If .scope does not exist on the option, then the callback
            // will not be expecting a scope parameter, so there should be
            // no problems. Just assume it is a ContextMenuOption and we'll
            // pass undefined if it's not.
            option.callback(
              (option as ContextMenuOption).scope,
              menuOpenEvent,
              menuSelectEvent,
              location,
            );
          }, 0);
        });
      };
      menuItem.onAction(actionHandler, {});
    }
  }
  return menu;
}

/**
 * Add the menu to the page and position it correctly.
 *
 * @param menu The menu to add and position.
 * @param rtl True if RTL, false if LTR.
 * @param location The location at which to anchor the menu.
 */
function position_(menu: Menu, rtl: boolean, location: Coordinate) {
  // Record windowSize and scrollOffset before adding menu.
  const viewportBBox = svgMath.getViewportBBox();
  // This one is just a point, but we'll pretend that it's a rect so we can use
  // some helper functions.
  const anchorBBox = new Rect(
    location.y + viewportBBox.top,
    location.y + viewportBBox.top,
    location.x + viewportBBox.left,
    location.x + viewportBBox.left,
  );

  createWidget_(menu);
  const menuSize = menu.getSize();

  if (rtl) {
    anchorBBox.left += menuSize.width;
    anchorBBox.right += menuSize.width;
    viewportBBox.left += menuSize.width;
    viewportBBox.right += menuSize.width;
  }

  WidgetDiv.positionWithAnchor(viewportBBox, anchorBBox, menuSize, rtl);
  // Calling menuDom.focus() has to wait until after the menu has been placed
  // correctly.  Otherwise it will cause a page scroll to get the misplaced menu
  // in view.  See issue #1329.
  menu.focus();
}

/**
 * Create and render the menu widget inside Blockly's widget div.
 *
 * @param menu The menu to add to the widget div.
 */
function createWidget_(menu: Menu) {
  const div = WidgetDiv.getDiv();
  if (!div) {
    throw Error('Attempting to create a context menu when widget div is null');
  }
  const menuDom = menu.render(div);
  dom.addClass(menuDom, 'blocklyContextMenu');
  // Prevent system context menu when right-clicking a Blockly context menu.
  browserEvents.conditionalBind(
    menuDom as EventTarget,
    'contextmenu',
    null,
    haltPropagation,
  );
  // Focus only after the initial render to avoid issue #1329.
  menu.focus();
}
/**
 * Halts the propagation of the event without doing anything else.
 *
 * @param e An event.
 */
function haltPropagation(e: Event) {
  // This event has been handled.  No need to bubble up to the document.
  e.preventDefault();
  e.stopPropagation();
}

/**
 * Hide the context menu.
 */
export function hide() {
  WidgetDiv.hideIfOwner(dummyOwner);
  currentBlock = null;
}

/**
 * Dispose of the menu.
 */
export function dispose() {
  if (menu_) {
    menu_.dispose();
    menu_ = null;
  }
}

/**
 * Create a callback function that creates and configures a block,
 *   then places the new block next to the original and returns it.
 *
 * @param block Original block.
 * @param state XML or JSON object representation of the new block.
 * @returns Function that creates a block.
 */
export function callbackFactory(
  block: Block,
  state: Element | serializationBlocks.State,
): () => BlockSvg {
  return () => {
    eventUtils.disable();
    let newBlock: BlockSvg;
    try {
      if (state instanceof Element) {
        newBlock = Xml.domToBlockInternal(state, block.workspace!) as BlockSvg;
      } else {
        newBlock = serializationBlocks.appendInternal(
          state,
          block.workspace,
        ) as BlockSvg;
      }
      // Move the new block next to the old block.
      const xy = block.getRelativeToSurfaceXY();
      if (block.RTL) {
        xy.x -= config.snapRadius;
      } else {
        xy.x += config.snapRadius;
      }
      xy.y += config.snapRadius * 2;
      newBlock.moveBy(xy.x, xy.y);
    } finally {
      eventUtils.enable();
    }
    if (eventUtils.isEnabled() && !newBlock.isShadow()) {
      eventUtils.fire(new (eventUtils.get(EventType.BLOCK_CREATE))(newBlock));
    }
    getFocusManager().focusNode(newBlock);
    return newBlock;
  };
}
