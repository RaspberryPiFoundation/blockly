/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';

import {injectSearchCss} from './css';

/**
 * Class for workspace search.
 */
export class WorkspaceSearch
  implements Blockly.IPositionable, Blockly.IAutoHideable
{
  /**
   * The unique id for this component.
   */
  id = 'workspaceSearch';

  /**
   * HTML container for the search bar.
   */
  private htmlDiv: HTMLElement | null = null;

  /**
   * The div that holds the search bar actions.
   */
  protected actionDiv: HTMLElement | null = null;

  /**
   * The text input for the search bar.
   */
  private inputElement: HTMLInputElement | null = null;

  /**
   * The placeholder text for the search bar input.
   */
  private textInputPlaceholder = Blockly.Msg['WORKSPACE_SEARCH_PLACEHOLDER'];

  /**
   * A list of blocks that came up in the search.
   */
  protected blocks: Blockly.BlockSvg[] = [];

  /**
   * The last highlighted block, which we focus on close.
   *
   * This block is focused on close even if the most recent search found nothing
   * because we've centered on it and it's helpful for focus to be in sync with
   * the scroll position.
   */
  private lastHighlighted: Blockly.BlockSvg | null = null;

  /**
   * Callback to FocusManager to return ephemeral focus when search closes.
   */
  private returnEphemeralFocus: Blockly.ReturnEphemeralFocus | null = null;

  /**
   * Index of the currently "selected" block in the blocks array.
   */
  protected currentBlockIndex = -1;

  /**
   * The search text.
   */
  protected searchText = '';

  /**
   * Whether to search as input changes as opposed to on enter.
   */
  searchOnInput = true;

  /**
   * Whether search should be case sensitive.
   */
  caseSensitive = false;

  /**
   * Whether search should preserve the currently selected block by default.
   */
  preserveSelected = true;

  /**
   * Array holding info needed to unbind events.
   * Used for disposing.
   */
  private boundEvents: Blockly.browserEvents.Data[] = [];

  /**
   * Class for workspace search.
   *
   * @param workspace The workspace the search bar sits in.
   */
  constructor(private workspace: Blockly.WorkspaceSvg) {}

  /**
   * Initializes the workspace search bar.
   */
  init() {
    this.workspace.getComponentManager().addComponent({
      component: this,
      weight: 0,
      capabilities: [
        Blockly.ComponentManager.Capability.POSITIONABLE,
        Blockly.ComponentManager.Capability.AUTOHIDEABLE,
      ],
    });
    injectSearchCss();
    this.createDom();
    this.setVisible(false);

    this.workspace.resize();
  }

  /**
   * Disposes of workspace search.
   * Unlink from all DOM elements and remove all event listeners
   * to prevent memory leaks.
   */
  dispose() {
    this.releaseEphemeralFocus(false);
    for (const event of this.boundEvents) {
      Blockly.browserEvents.unbind(event);
    }
    this.boundEvents.length = 0;
    if (this.htmlDiv) {
      this.htmlDiv.remove();
      this.htmlDiv = null;
    }
    this.actionDiv = null;
    this.inputElement = null;
  }

  /**
   * Creates and injects the search bar's DOM.
   */
  protected createDom() {
    /*
     * Creates the search bar. The generated search bar looks like:
     * <div class="ws-search'>
     *   <div class="ws-search-container'>
     *     <div class="ws-search-content'>
     *       <div class="ws-search-input'>
     *         [... text input goes here ...]
     *       </div>
     *       [... actions div goes here ...]
     *     </div>
     *     [... close button goes here ...]
     *   </div>
     * </div>
     */
    const injectionDiv = this.workspace.getInjectionDiv();
    this.addEvent(injectionDiv, 'keydown', this, (evt: KeyboardEvent) =>
      this.onWorkspaceKeyDown(evt),
    );

    this.htmlDiv = document.createElement('div');
    Blockly.utils.dom.addClass(this.htmlDiv, 'blockly-ws-search');
    Blockly.utils.aria.setRole(this.htmlDiv, Blockly.utils.aria.Role.SEARCH);

    const searchContainer = document.createElement('div');
    Blockly.utils.dom.addClass(searchContainer, 'blockly-ws-search-container');

    const searchContent = document.createElement('div');
    Blockly.utils.dom.addClass(searchContent, 'blockly-ws-search-content');
    searchContainer.appendChild(searchContent);

    const inputWrapper = document.createElement('div');
    Blockly.utils.dom.addClass(inputWrapper, 'blockly-ws-search-input');
    this.inputElement = this.createTextInput();
    this.addEvent(this.inputElement, 'keydown', this, (evt: KeyboardEvent) =>
      this.onKeyDown(evt),
    );
    this.addEvent(this.inputElement, 'input', this, () => this.onInput());
    this.addEvent(this.inputElement, 'click', this, () => {
      this.searchAndHighlight(this.searchText, this.preserveSelected);
      this.inputElement?.select();
    });

    inputWrapper.appendChild(this.inputElement);
    searchContent.appendChild(inputWrapper);

    this.actionDiv = document.createElement('div');
    Blockly.utils.dom.addClass(this.actionDiv, 'blockly-ws-search-actions');
    searchContent.appendChild(this.actionDiv);

    const nextBtn = this.createNextBtn();
    if (nextBtn) {
      this.addActionBtn(nextBtn, () => this.next());
    }

    const previousBtn = this.createPreviousBtn();
    if (previousBtn) {
      this.addActionBtn(previousBtn, () => this.previous());
    }

    const closeBtn = this.createCloseBtn();
    if (closeBtn) {
      this.addBtnListener(closeBtn, () => this.close());
      searchContainer.appendChild(closeBtn);
    }

    this.htmlDiv.appendChild(searchContainer);

    injectionDiv.insertBefore(this.htmlDiv, this.workspace.getParentSvg());
  }

  /**
   * Helper method for adding an event.
   *
   * @param node Node upon which to listen.
   * @param name Event name to listen to (e.g. 'mousedown').
   * @param thisObject The value of 'this' in the function.
   * @param func Function to call when event is triggered.
   */
  private addEvent<T extends Event>(
    node: Element,
    name: string,
    thisObject: object,
    func: (event: T) => void,
  ) {
    const event = Blockly.browserEvents.conditionalBind(
      node,
      name,
      thisObject,
      func,
    );
    this.boundEvents.push(event);
  }

  /**
   * Add a button to the action div. This must be called after the init function
   * has been called.
   *
   * @param btn The button to add the event listener to.
   * @param onClickFn The function to call when the user clicks on
   *     or hits enter on the button.
   */
  addActionBtn(btn: HTMLButtonElement, onClickFn: () => void) {
    this.addBtnListener(btn, onClickFn);
    this.actionDiv?.appendChild(btn);
  }

  /**
   * Creates the text input for the search bar.
   *
   * @returns A text input for the search bar.
   */
  protected createTextInput(): HTMLInputElement {
    const textInput = document.createElement('input');
    textInput.type = 'search';
    textInput.autocomplete = 'off';
    textInput.setAttribute('placeholder', this.textInputPlaceholder);
    Blockly.utils.aria.setState(
      textInput,
      Blockly.utils.aria.State.LABEL,
      Blockly.Msg['WORKSPACE_SEARCH_INPUT_LABEL'],
    );
    return textInput;
  }

  /**
   * Creates the button used to get the next block in the list.
   *
   * @returns The next button.
   */
  protected createNextBtn(): HTMLButtonElement {
    return this.createBtn(
      'blockly-ws-search-next-btn',
      Blockly.Msg['WORKSPACE_SEARCH_FIND_NEXT'],
    );
  }

  /**
   * Creates the button used to get the previous block in the list.
   *
   * @returns The previous button.
   */
  protected createPreviousBtn(): HTMLButtonElement {
    return this.createBtn(
      'blockly-ws-search-previous-btn',
      Blockly.Msg['WORKSPACE_SEARCH_FIND_PREVIOUS'],
    );
  }

  /**
   * Creates the button used for closing the search bar.
   *
   * @returns A button for closing the search bar.
   */
  protected createCloseBtn(): HTMLButtonElement {
    return this.createBtn(
      'blockly-ws-search-close-btn',
      Blockly.Msg['WORKSPACE_SEARCH_CLOSE'],
    );
  }

  /**
   * Creates a button for the workspace search bar.
   *
   * @param className The class name for the button.
   * @param text The text to display to the screen reader.
   * @returns The created button.
   */
  private createBtn(className: string, text: string): HTMLButtonElement {
    // Create the button
    const btn = document.createElement('button');
    Blockly.utils.dom.addClass(btn, className);
    btn.type = 'button';
    Blockly.utils.aria.setState(btn, Blockly.utils.aria.State.LABEL, text);
    return btn;
  }

  /**
   * Add event listener for clicking and keydown on the given button.
   *
   * @param btn The button to add the event listener to.
   * @param onClickFn The function to call when the user clicks on
   *      or hits enter on the button.
   */
  private addBtnListener(
    btn: HTMLButtonElement,
    onClickFn: (e: Event) => void,
  ) {
    this.addEvent(btn, 'click', this, onClickFn);
    // TODO: Review Blockly's key handling to see if there is a way to avoid
    //  needing to call stopPropogation().
    this.addEvent(btn, 'keydown', this, (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        onClickFn(e);
        e.preventDefault();
      } else if (e.key === 'Escape') {
        this.close();
      }
      e.stopPropagation();
    });
  }

  /**
   * Returns the bounding rectangle of the UI element in pixel units relative to
   * the Blockly injection div.
   *
   * @returns The component’s bounding box. Null in this
   *     case since we don't need other elements to avoid the workspace search
   *     field.
   */
  getBoundingRectangle(): Blockly.utils.Rect | null {
    return null;
  }

  /**
   * Positions the workspace search field.
   * It is positioned in the opposite corner to the corner the
   * categories/toolbox starts at.
   *
   * @param metrics The workspace metrics.
   * @param savedPositions List of rectangles that
   *     are already on the workspace.
   */
  position(
    metrics: Blockly.MetricsManager.UiMetrics,
    savedPositions: Blockly.utils.Rect[],
  ) {
    if (!this.htmlDiv) return;
    if (this.workspace.RTL) {
      this.htmlDiv.style.left = metrics.absoluteMetrics.left + 'px';
    } else {
      if (metrics.toolboxMetrics.position === Blockly.TOOLBOX_AT_RIGHT) {
        this.htmlDiv.style.right = metrics.toolboxMetrics.width + 'px';
      } else {
        this.htmlDiv.style.right = '0';
      }
    }
    this.htmlDiv.style.top = metrics.absoluteMetrics.top + 'px';
  }

  /**
   * Handles input value change in search bar.
   */
  private onInput() {
    if (this.searchOnInput && this.inputElement) {
      const inputValue = this.inputElement.value.trim();
      if (inputValue !== this.searchText) {
        this.searchAndHighlight(inputValue, this.preserveSelected);
      }
    }
  }

  /**
   * Handles a key down for the search bar.
   *
   * @param e The key down event.
   */
  private onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      this.close();
    } else if (e.key === 'Enter') {
      if (this.searchOnInput) {
        if (e.shiftKey) {
          this.previous();
        } else {
          this.next();
        }
      } else {
        if (!this.inputElement) return;
        const inputValue = this.inputElement.value.trim();
        if (inputValue !== this.searchText) {
          this.searchAndHighlight(inputValue, this.preserveSelected);
        }
      }
    }
  }

  /**
   * Opens the search bar when Control F or Command F are used on the workspace.
   *
   * @param e The key down event.
   */
  private onWorkspaceKeyDown(e: KeyboardEvent) {
    // TODO: Look into handling keyboard shortcuts on workspace in Blockly.
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      this.open();
      e.preventDefault();
      e.stopPropagation();
    }
  }

  /**
   * Selects the previous block.
   */
  previous() {
    this.setCurrentBlock(this.currentBlockIndex - 1);
  }

  /**
   * Selects the next block.
   */
  next() {
    this.setCurrentBlock(this.currentBlockIndex + 1);
  }

  /**
   * Sets the placeholder text for the search bar text input.
   *
   * @param placeholderText The placeholder text.
   */
  setSearchPlaceholder(placeholderText: string) {
    this.textInputPlaceholder = placeholderText;
    if (this.inputElement) {
      this.inputElement.setAttribute('placeholder', this.textInputPlaceholder);
    }
  }

  /**
   * Changes the currently "selected" block and adds extra highlight.
   *
   * @param index Index of block to set as current. Number is wrapped.
   */
  protected setCurrentBlock(index: number) {
    if (!this.blocks.length) {
      return;
    }
    let currentBlock = this.blocks[this.currentBlockIndex];
    if (currentBlock) {
      this.unhighlightCurrentSelection(currentBlock);
    }
    this.currentBlockIndex =
      ((index % this.blocks.length) + this.blocks.length) % this.blocks.length;
    currentBlock = this.blocks[this.currentBlockIndex];

    this.highlightCurrentSelection(currentBlock);
    this.workspace.centerOnBlock(currentBlock.id, false);
    this.lastHighlighted = currentBlock;
    Blockly.FocusManager.getFocusManager().focusNode(currentBlock);
    this.announceCurrentMatch();
  }

  /**
   * Opens the search bar.
   */
  open() {
    this.setVisible(true);
    if (this.inputElement) {
      this.inputElement.value = this.searchText;
      const focusManager = Blockly.FocusManager.getFocusManager();
      if (!this.returnEphemeralFocus && !focusManager.ephemeralFocusTaken()) {
        this.returnEphemeralFocus = focusManager.takeEphemeralFocus(
          this.inputElement,
        );
      } else {
        this.inputElement.focus();
      }
      this.inputElement.select();
    }
    this.searchAndHighlight(this.searchText, this.preserveSelected);
  }

  /**
   * Closes the search bar and releases ephemeral focus.
   */
  close() {
    this.setVisible(false);
    const focusManager = Blockly.FocusManager.getFocusManager();
    const lastHighlighted = this.lastHighlighted;
    if (lastHighlighted && !lastHighlighted.isDisposed()) {
      focusManager.focusNode(lastHighlighted);
      this.releaseEphemeralFocus(true);
    } else {
      this.releaseEphemeralFocus(false);
      focusManager.focusTree(this.workspace);
    }
    this.clearBlocks();
  }

  /**
   * Hides the search bar. Called from WorkspaceSvg.hideChaff, for example
   * when the user clicks a block.
   *
   * @param onlyClosePopups Whether only popups should be closed.
   */
  autoHide(onlyClosePopups: boolean) {
    if (onlyClosePopups || !this.isVisible()) {
      return;
    }
    this.setVisible(false);
    this.releaseEphemeralFocus(true);
    this.clearBlocks();
  }

  /**
   * Ends ephemeral focus if this search bar currently holds it.
   *
   * @param restoreFocus True to restore the FocusManager's focused node.
   */
  private releaseEphemeralFocus(restoreFocus = true) {
    if (!this.returnEphemeralFocus) {
      return;
    }
    this.returnEphemeralFocus(restoreFocus);
    this.returnEphemeralFocus = null;
  }

  /**
   * Shows or hides the workspace search bar.
   *
   * @param show Whether to set the search bar as visible.
   */
  private setVisible(show: boolean) {
    if (this.htmlDiv) {
      this.htmlDiv.style.display = show ? 'flex' : 'none';
    }
  }

  /** 
   * Checks whether the search bar is currently visible.
   *
   * @returns true if the search bar is visible, false otherwise.
   */
  private isVisible(): boolean {
    return !!this.htmlDiv && this.htmlDiv.style.display !== 'none';
  }

  /**
   * Searches the workspace for the current search term and highlights matching
   * blocks.
   *
   * @param searchText The search text.
   * @param preserveCurrent Whether to preserve the current block
   *    if it is included in the new matching blocks.
   */
  searchAndHighlight(searchText: string, preserveCurrent?: boolean) {
    const currentBlock = this.blocks[this.currentBlockIndex];
    let bookmarkId: string | undefined;
    if (currentBlock) {
      bookmarkId = currentBlock.id;
    } else if (this.lastHighlighted) {
      bookmarkId = this.lastHighlighted.id;
    }
    this.searchText = searchText.trim();
    this.clearBlocks();
    this.blocks = this.getMatchingBlocks(
      this.workspace,
      this.searchText,
      this.caseSensitive,
    );
    this.highlightSearchGroup(this.blocks);
    // If the current block is still in the new list of matching blocks, preserve
    // it as the current block. Otherwise, select the first block in the list.
    let currentIndex = 0;
    if (preserveCurrent && bookmarkId) {
      const bookmarkedBlock = this.workspace.getBlockById(bookmarkId);
      if (bookmarkedBlock) {
        const bookmarkedIndex = this.blocks.indexOf(bookmarkedBlock);
        if (bookmarkedIndex > -1) {
          currentIndex = bookmarkedIndex;
        }
      }
    }
    this.setCurrentBlock(currentIndex);
    if (this.searchText && !this.blocks.length) {
      this.announceNoMatches();
    }
  }

  /**
   * Returns pool of blocks to search from.
   *
   * @param workspace The workspace to get blocks from.
   * @returns The search pool of blocks to use.
   */
  private getSearchPool(workspace: Blockly.WorkspaceSvg): Blockly.BlockSvg[] {
    const blocks = workspace.getAllBlocks(true);
    return blocks.filter((block) => {
      // Filter out blocks contained inside of another collapsed block.
      const surroundParent = block.getSurroundParent();
      return !surroundParent || !surroundParent.isCollapsed();
    });
  }

  /**
   * Returns whether the given block matches the search text.
   *
   * @param block The block to check.
   * @param searchText The search text. Note if the search is case
   *    insensitive, this will be passed already converted to lowercase letters.
   * @param caseSensitive Whether the search is caseSensitive.
   * @returns True if the block is a match, false otherwise.
   */
  protected isBlockMatch(
    block: Blockly.BlockSvg,
    searchText: string,
    caseSensitive: boolean,
  ): boolean {
    let blockText;
    if (block.isCollapsed()) {
      // Search the whole string for collapsed blocks.
      blockText = block.toString();
    } else {
      const topBlockText: string[] = [];
      block.inputList.forEach((input) => {
        input.fieldRow.forEach((field) => {
          topBlockText.push(field.getText());
        });
      });
      blockText = topBlockText.join(' ').trim();
    }
    if (!caseSensitive) {
      blockText = blockText.toLowerCase();
    }
    return blockText.indexOf(searchText) > -1;
  }

  /**
   * Returns blocks that match the given search text.
   *
   * @param workspace The workspace to search.
   * @param searchText The search text.
   * @param caseSensitive Whether the search should be case sensitive.
   * @returns The blocks that match the search
   *    text.
   */
  protected getMatchingBlocks(
    workspace: Blockly.WorkspaceSvg,
    searchText: string,
    caseSensitive: boolean,
  ): Blockly.BlockSvg[] {
    if (!searchText) {
      return [];
    }
    if (!this.caseSensitive) {
      searchText = searchText.toLowerCase();
    }
    const searchGroup = this.getSearchPool(workspace);
    return searchGroup.filter((block) =>
      this.isBlockMatch(block, searchText, caseSensitive),
    );
  }

  /**
   * Clears the selection group and current block.
   */
  clearBlocks() {
    this.unhighlightSearchGroup(this.blocks);
    const currentBlock = this.blocks[this.currentBlockIndex];
    if (currentBlock) {
      this.unhighlightCurrentSelection(currentBlock);
    }
    this.currentBlockIndex = -1;
    this.blocks = [];
  }

  /**
   * Announces the currently highlighted match to screen readers.
   *
   * Focus stays in the search input while browsing results, so the highlighted
   * block is announced via the live region rather than by moving focus.
   */
  private announceCurrentMatch() {
    const currentBlock = this.blocks[this.currentBlockIndex];
    if (!currentBlock) {
      return;
    }
    Blockly.utils.aria.announceDynamicAriaState(
      Blockly.Msg['WORKSPACE_SEARCH_MATCH']
        .replace('%1', String(this.currentBlockIndex + 1))
        .replace('%2', String(this.blocks.length))
        .replace(
          '%3',
          currentBlock.getAriaLabel(Blockly.utils.aria.Verbosity.TERSE),
        ),
    );
  }

  /**
   * Announces that the current search term matched no blocks.
   */
  private announceNoMatches() {
    Blockly.utils.aria.announceDynamicAriaState(
      Blockly.Msg['WORKSPACE_SEARCH_NO_MATCHES'],
    );
  }

  /**
   * Adds "current selection" highlight to the provided block.
   * Highlights the provided block as the "current selection".
   *
   * @param currentBlock The block to highlight.
   */
  protected highlightCurrentSelection(currentBlock: Blockly.BlockSvg) {
    const path = currentBlock.pathObject.svgPath;
    Blockly.utils.dom.addClass(path, 'blockly-ws-search-current');
  }

  /**
   * Removes "current selection" highlight from provided block.
   *
   * @param currentBlock The block to unhighlight.
   */
  protected unhighlightCurrentSelection(currentBlock: Blockly.BlockSvg) {
    const path = currentBlock.pathObject.svgPath;
    Blockly.utils.dom.removeClass(path, 'blockly-ws-search-current');
  }

  /**
   * Adds highlight to the provided blocks.
   *
   * @param blocks The blocks to highlight.
   */
  protected highlightSearchGroup(blocks: Blockly.BlockSvg[]) {
    blocks.forEach((block) => {
      const blockPath = block.pathObject.svgPath;
      Blockly.utils.dom.addClass(blockPath, 'blockly-ws-search-highlight');
    });
  }

  /**
   * Removes highlight from the provided blocks.
   *
   * @param blocks The blocks to unhighlight.
   */
  protected unhighlightSearchGroup(blocks: Blockly.BlockSvg[]) {
    blocks.forEach((block) => {
      const blockPath = block.pathObject.svgPath;
      Blockly.utils.dom.removeClass(blockPath, 'blockly-ws-search-highlight');
    });
  }
}
