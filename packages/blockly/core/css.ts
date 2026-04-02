/**
 * @license
 * Copyright 2013 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.Css
/** Has CSS already been injected? */
const injectionSites = new WeakSet<Document | ShadowRoot>();
const registeredStyleSheets: Array<CSSStyleSheet> = [];

/**
 * Add some CSS to the blob that will be injected later.  Allows optional
 * components such as fields and the toolbox to store separate CSS.
 *
 * @param cssContent Multiline CSS string or an array of single lines of CSS.
 */
export function register(cssContent: string) {
  if (typeof window === 'undefined' || !window.CSSStyleSheet) return;

  const sheet = new CSSStyleSheet();
  sheet.replace(cssContent);
  registeredStyleSheets.push(sheet);
}

/**
 * Inject the CSS into the DOM.  This is preferable over using a regular CSS
 * file since:
 * a) It loads synchronously and doesn't force a redraw later.
 * b) It speeds up loading by not blocking on a separate HTTP transfer.
 * c) The CSS content may be made dynamic depending on init options.
 *
 * @param container The div or other HTML element into which Blockly was injected.
 * @param hasCss If false, don't inject CSS (providing CSS becomes the
 *     document's responsibility).
 * @param pathToMedia Path from page to the Blockly media directory.
 */
export function inject(
  container: HTMLElement,
  hasCss: boolean,
  pathToMedia: string,
) {
  if (!hasCss || typeof window === 'undefined' || !window.CSSStyleSheet) {
    return;
  }

  const root = container.getRootNode() as Document | ShadowRoot;
  // Only inject the CSS once.
  if (injectionSites.has(root)) return;
  injectionSites.add(root);

  // Strip off any trailing slash (either Unix or Windows).
  const mediaPath = pathToMedia.replace(/[\\/]$/, '');
  const cssContent = content.replace(/<<<PATH>>>/g, mediaPath);

  const sheet = new CSSStyleSheet();
  sheet.replace(cssContent);
  root.adoptedStyleSheets.push(sheet);

  registeredStyleSheets.forEach((sheet) => root.adoptedStyleSheets.push(sheet));
}

/**
 * The CSS content for Blockly.
 */
const content = `
:is(
  .injectionDiv,
  .blocklyWidgetDiv,
  .blocklyDropdownDiv,
  .blocklyTooltipDiv,
) * {
  box-sizing: border-box;
}

.blocklySvg {
  background-color: #fff;
  outline: none;
  overflow: hidden;  /* IE overflows by default. */
  position: absolute;
  display: block;
}

.blocklyWidgetDiv {
  display: none;
  position: absolute;
  z-index: 99999;  /* big value for bootstrap3 compatibility */
}

.injectionDiv {
  height: 100%;
  position: relative;
  overflow: hidden;  /* So blocks in drag surface disappear at edges */
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}

.blocklyBlockCanvas.blocklyCanvasTransitioning,
.blocklyBubbleCanvas.blocklyCanvasTransitioning {
  transition: transform .5s;
}

.blocklyEmboss {
  filter: var(--blocklyEmbossFilter);
}

.blocklyTooltipDiv {
  background-color: #ffffc7;
  border: 1px solid #ddc;
  box-shadow: 4px 4px 20px 1px rgba(0,0,0,.15);
  color: #000;
  display: none;
  font: 9pt sans-serif;
  opacity: .9;
  padding: 2px;
  position: absolute;
  z-index: 100000;  /* big value for bootstrap3 compatibility */
}

.blocklyDropDownDiv {
  position: absolute;
  left: 0;
  top: 0;
  z-index: 1000;
  display: none;
  border: 1px solid;
  border-color: #dadce0;
  background-color: #fff;
  border-radius: 2px;
  padding: 4px;
  box-shadow: 0 0 3px 1px rgba(0,0,0,.3);
}

.blocklyDropDownDiv:focus {
  box-shadow: 0 0 6px 1px rgba(0,0,0,.3);
}

.blocklyDropDownContent {
  max-height: 300px;  /* @todo: spec for maximum height. */
}

.blocklyDropDownArrow {
  position: absolute;
  left: 0;
  top: 0;
  width: 16px;
  height: 16px;
  z-index: -1;
  background-color: inherit;
  border-color: inherit;
  border-top: 1px solid;
  border-left: 1px solid;
  border-top-left-radius: 4px;
  border-color: inherit;
}

.blocklyHighlighted>.blocklyPath {
  filter: var(--blocklyEmbossFilter);
}

.blocklyHighlightedConnectionPath {
  fill: none;
  stroke: #fc3;
  stroke-width: 4px;
}

.blocklyPathLight {
  fill: none;
  stroke-linecap: round;
  stroke-width: 1;
}

.blocklySelected>.blocklyPathLight {
  display: none;
}

.blocklyDraggable {
  cursor: grab;
  cursor: -webkit-grab;
}

.blocklyDragging {
  cursor: grabbing;
  cursor: -webkit-grabbing;
  /* Drag surface disables events to not block the toolbox, so we have to
   * reenable them here for the cursor values to work. */
  pointer-events: auto;
}

  /* Changes cursor on mouse down. Not effective in Firefox because of
     https://bugzilla.mozilla.org/show_bug.cgi?id=771241 */
.blocklyDraggable:active {
  cursor: grabbing;
  cursor: -webkit-grabbing;
}

.blocklyDragging.blocklyDraggingDelete,
.blocklyDragging.blocklyDraggingDelete .blocklyField {
  cursor: url("<<<PATH>>>/handdelete.cur"), auto;
}

.blocklyDragging>.blocklyPath,
.blocklyDragging>.blocklyPathLight {
  fill-opacity: .8;
  stroke-opacity: .8;
}

.blocklyDragging>.blocklyPathDark {
  display: none;
}

.blocklyDisabledPattern>.blocklyPath {
  fill: var(--blocklyDisabledPattern);
  fill-opacity: .5;
  stroke-opacity: .5;
}

.blocklyDisabled>.blocklyPathLight,
.blocklyDisabled>.blocklyPathDark {
  display: none;
}

.blocklyInsertionMarker>.blocklyPath,
.blocklyInsertionMarker>.blocklyPathLight,
.blocklyInsertionMarker>.blocklyPathDark {
  fill-opacity: .2;
  stroke: none;
}

.blocklyNonEditableField>text {
  pointer-events: none;
}

.blocklyFlyout {
  position: absolute;
  z-index: 20;
}

.blocklyText text {
  cursor: default;
}

/*
  Don't allow users to select text.  It gets annoying when trying to
  drag a block and selected text moves instead.
*/
.blocklySvg text {
  user-select: none;
  -ms-user-select: none;
  -webkit-user-select: none;
  cursor: inherit;
}

.blocklyIconGroup {
  cursor: default;
}

.blocklyIconGroup:not(:hover):not(:focus),
.blocklyIconGroupReadonly {
  opacity: .6;
}

.blocklyIconShape {
  fill: #00f;
  stroke: #fff;
  stroke-width: 1px;
}

.blocklyIconSymbol {
  fill: #fff;
}

.blocklyMinimalBody {
  margin: 0;
  padding: 0;
  height: 100%;
}

.blocklyHtmlInput {
  border: none;
  border-radius: 4px;
  height: 100%;
  margin: 0;
  outline: none;
  padding: 0;
  width: 100%;
  text-align: center;
  display: block;
  box-sizing: border-box;
}

/* Remove the increase and decrease arrows on the field number editor */
input.blocklyHtmlInput[type=number]::-webkit-inner-spin-button,
input.blocklyHtmlInput[type=number]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type=number] {
  -moz-appearance: textfield;
}

.blocklyMainBackground {
  stroke-width: 1;
  stroke: #c6c6c6;  /* Equates to #ddd due to border being off-pixel. */
}

.blocklyMutatorBackground {
  fill: #fff;
  stroke: #ddd;
  stroke-width: 1;
}

.blocklyFlyoutBackground {
  fill: #ddd;
  fill-opacity: .8;
}

.blocklyMainWorkspaceScrollbar {
  z-index: 20;
}

.blocklyFlyoutScrollbar {
  z-index: 30;
}

.blocklyScrollbarHorizontal,
.blocklyScrollbarVertical {
  position: absolute;
  outline: none;
}

.blocklyScrollbarBackground {
  opacity: 0;
  pointer-events: none;
}

.blocklyScrollbarHandle {
  fill: #ccc;
}

.blocklyScrollbarBackground:hover+.blocklyScrollbarHandle,
.blocklyScrollbarHandle:hover {
  fill: #bbb;
}

/* Darken flyout scrollbars due to being on a grey background. */
/* By contrast, workspace scrollbars are on a white background. */
.blocklyFlyout .blocklyScrollbarHandle {
  fill: #bbb;
}

.blocklyFlyout .blocklyScrollbarBackground:hover+.blocklyScrollbarHandle,
.blocklyFlyout .blocklyScrollbarHandle:hover {
  fill: #aaa;
}

.blocklyInvalidInput {
  background: #faa;
}

.blocklyVerticalMarker {
  stroke-width: 3px;
  fill: rgba(255,255,255,.5);
  pointer-events: none;
}

.blocklyComputeCanvas {
  position: absolute;
  width: 0;
  height: 0;
}

.blocklyNoPointerEvents {
  pointer-events: none;
}

.blocklyContextMenu {
  border-radius: 4px;
  max-height: 100%;
}

.blocklyDropdownMenu {
  border-radius: 2px;
  padding: 0 !important;
}

.blocklyDropdownMenu .blocklyMenuItem {
  /* 28px on the left for icon or checkbox. */
  padding-left: 28px;
}

/* BiDi override for the resting state. */
.blocklyDropdownMenu .blocklyMenuItemRtl {
  /* Flip left/right padding for BiDi. */
  padding-left: 5px;
  padding-right: 28px;
}

.blocklyWidgetDiv .blocklyMenu {
  user-select: none;
  -ms-user-select: none;
  -webkit-user-select: none;
  background: #fff;
  border: 1px solid transparent;
  box-shadow: 0 0 3px 1px rgba(0,0,0,.3);
  font: normal 13px Arial, sans-serif;
  margin: 0;
  outline: none;
  padding: 4px 0;
  position: absolute;
  overflow-y: auto;
  overflow-x: hidden;
  max-height: 100%;
  z-index: 20000;  /* Arbitrary, but some apps depend on it... */
}

.blocklyWidgetDiv .blocklyMenu:focus {
  box-shadow: 0 0 6px 1px rgba(0,0,0,.3);
}

.blocklyDropDownDiv .blocklyMenu {
  user-select: none;
  -ms-user-select: none;
  -webkit-user-select: none;
  background: inherit;  /* Compatibility with gapi, reset from goog-menu */
  border: inherit;  /* Compatibility with gapi, reset from goog-menu */
  font: normal 13px "Helvetica Neue", Helvetica, sans-serif;
  outline: none;
  overflow-y: auto;
  overflow-x: hidden;
  max-height: 100%;
  z-index: 20000;  /* Arbitrary, but some apps depend on it... */
}

/* State: resting. */
.blocklyMenuItem {
  border: none;
  color: #000;
  cursor: pointer;
  list-style: none;
  margin: 0;
  /* 7em on the right for shortcut. */
  min-width: 7em;
  padding: 6px 15px;
  white-space: nowrap;
}

/* State: disabled. */
.blocklyMenuItemDisabled {
  color: #ccc;
  cursor: inherit;
}

/* State: hover. */
.blocklyMenuItemHighlight {
  background-color: rgba(0,0,0,.1);
}

/* State: selected/checked. */
.blocklyMenuItemSelected .blocklyMenuItemCheckbox {
  background: url(<<<PATH>>>/sprites.svg) no-repeat -48px -16px;
  float: left;
  margin-left: -24px;
  width: 16px;
  height: 16px;
  position: static;  /* Scroll with the menu. */
  display: block;
}

.blocklyMenuItemRtl .blocklyMenuItemCheckbox {
  float: right;
  margin-right: -24px;
}

.blocklyMenuSeparator {
  background-color: #ccc;
  height: 1px;
  border: 0;
  margin-left: 4px;
  margin-right: 4px;
}

.blocklyBlockDragSurface, .blocklyAnimationLayer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: visible !important;
  z-index: 80;
  pointer-events: none;
}

.blocklyField {
  cursor: default;
}

.blocklyInputField {
  cursor: text;
}

.blocklyDragging .blocklyField,
.blocklyDragging .blocklyIconGroup {
  cursor: grabbing;
}

.blocklyActiveFocus:is(
  .blocklyFlyout,
  .blocklyWorkspace,
  .blocklyField,
  .blocklyPath,
  .blocklyHighlightedConnectionPath,
  .blocklyComment,
  .blocklyBubble,
  .blocklyIconGroup,
  .blocklyTextarea
) {
  outline: none;
}
.hiddenForAria {
  position: absolute;
  left: -9999px;
  width: 1px;
  height: 1px;
  overflow: hidden;
}

.injectionDiv {
  --blockly-active-node-color: #fff200;
  --blockly-active-tree-color: #60a5fa;
  --blockly-selection-width: 3px;
}

/* Active focus cases: */
/* Blocks with active focus. */
.blocklyKeyboardNavigation
  .blocklyActiveFocus:is(.blocklyPath, .blocklyHighlightedConnectionPath),
/* Fields with active focus, */
.blocklyKeyboardNavigation
  .blocklyActiveFocus.blocklyField
  > .blocklyFieldRect,
/* Icons with active focus. */
.blocklyKeyboardNavigation
  .blocklyActiveFocus.blocklyIconGroup
  > .blocklyIconShape:first-child {
  stroke: var(--blockly-active-node-color);
  stroke-width: var(--blockly-selection-width);
}

/* Passive focus cases: */
/* Blocks with passive focus except when widget/dropdown div in use. */
.blocklyKeyboardNavigation:not(
        :has(
            .blocklyDropDownDiv:focus-within,
            .blocklyWidgetDiv:focus-within
          )
      )
  .blocklyPassiveFocus:is(
    .blocklyPath:not(.blocklyFlyout .blocklyPath),
    .blocklyHighlightedConnectionPath
  ),
/* Fields with passive focus except when widget/dropdown div in use. */
.blocklyKeyboardNavigation:not(
        :has(
            .blocklyDropDownDiv:focus-within,
            .blocklyWidgetDiv:focus-within
          )
      )
  .blocklyPassiveFocus.blocklyField
  > .blocklyFieldRect,
/* Icons with passive focus except when widget/dropdown div in use. */
.blocklyKeyboardNavigation:not(
        :has(
            .blocklyDropDownDiv:focus-within,
            .blocklyWidgetDiv:focus-within
          )
      )
  .blocklyPassiveFocus.blocklyIconGroup
  > .blocklyIconShape:first-child {
  stroke: var(--blockly-active-node-color);
  stroke-dasharray: 5px 3px;
  stroke-width: var(--blockly-selection-width);
}

/* Workaround for unexpectedly hidden connection path due to core style. */
.blocklyKeyboardNavigation
  .blocklyPassiveFocus.blocklyHighlightedConnectionPath {
  display: unset !important;
}

/* Different ways for toolbox/flyout to be the active tree: */
/* Active focus in the flyout. */
.blocklyKeyboardNavigation .blocklyFlyout:has(.blocklyActiveFocus),
/* Active focus in the toolbox. */
.blocklyKeyboardNavigation .blocklyToolbox:has(.blocklyActiveFocus),
/* Active focus on the toolbox/flyout. */
.blocklyKeyboardNavigation
  .blocklyActiveFocus:is(.blocklyFlyout, .blocklyToolbox) {
  outline-offset: calc(var(--blockly-selection-width) * -1);
  outline: var(--blockly-selection-width) solid
    var(--blockly-active-tree-color);
}

/* Suppress default outline. */
.blocklyKeyboardNavigation
  .blocklyToolboxCategoryContainer:focus-visible {
  outline: none;
}

 /* Different ways for the workspace to be the active tree: */
/* Active focus within workspace. */
.blocklyKeyboardNavigation
  .blocklyWorkspace:has(.blocklyActiveFocus)
  .blocklyWorkspaceFocusRing,
/* Active focus within drag layer. */
.blocklyKeyboardNavigation
  .blocklySvg:has(~ .blocklyBlockDragSurface .blocklyActiveFocus)
  .blocklyWorkspaceFocusRing,
/* Active focus on workspace. */
.blocklyKeyboardNavigation
  .blocklyWorkspace.blocklyActiveFocus
  .blocklyWorkspaceFocusRing,
/* Focus in widget/dropdown div considered to be in workspace. */
.blocklyKeyboardNavigation:has(
  .blocklyWidgetDiv:focus-within,
  .blocklyDropDownDiv:focus-within
)
  .blocklyWorkspace
  .blocklyWorkspaceFocusRing {
  stroke: var(--blockly-active-tree-color);
  stroke-width: calc(var(--blockly-selection-width) * 2);
}

/* The workspace itself is the active node. */
.blocklyKeyboardNavigation
  .blocklyWorkspace.blocklyActiveFocus
  .blocklyWorkspaceSelectionRing {
  stroke: var(--blockly-active-node-color);
  stroke-width: var(--blockly-selection-width);
}

/* The workspace itself is the active node. */
.blocklyKeyboardNavigation
  .blocklyBubble.blocklyActiveFocus
  .blocklyDraggable {
  stroke: var(--blockly-active-node-color);
  stroke-width: var(--blockly-selection-width);
}
`;
