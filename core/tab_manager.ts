/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {BlocklyOptions} from './blockly_options.js';
import {WorkspaceSvg} from './workspace_svg.js';
import {Options} from './options.js';
import * as dom from './utils/dom.js';
import * as Css from './css.js';
import * as Xml from './xml.js';
import {textToDom, domToText} from './utils/xml.js';
import {createDom, createMainWorkspace} from './inject.js';

// Register tab manager CSS
Css.register(`
.blocklyTabBar {
  display: flex;
  align-items: center;
  background-color: #f5f5f5;
  border-bottom: 1px solid #ddd;
  overflow-x: auto;
  overflow-y: hidden;
  white-space: nowrap;
  height: 36px;
  box-sizing: border-box;
}

.blocklyTabContainer {
  display: flex;
  align-items: center;
  flex-grow: 1;
  overflow-x: auto;
  overflow-y: hidden;
}

.blocklyTab {
  display: flex;
  align-items: center;
  padding: 0 12px;
  margin: 0 4px;
  background-color: #e0e0e0;
  border: 1px solid #ccc;
  border-bottom: none;
  border-radius: 4px 4px 0 0;
  cursor: pointer;
  height: 30px;
  position: relative;
  top: 1px;
  font-size: 14px;
  color: #333;
  transition: background-color 0.2s;
}

.blocklyTab:hover {
  background-color: #d0d0d0;
}

.blocklyActiveTab {
  background-color: #fff !important;
  border-color: #bbb;
  font-weight: 500;
}

.blocklyTabName {
  margin-right: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 150px;
}

.blocklyTabCloseButton {
  font-size: 18px;
  font-weight: bold;
  color: #666;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
}

.blocklyTabCloseButton:hover {
  color: #333;
  background-color: #f0f0f0;
  border-radius: 4px;
}

.blocklyTabAddButton {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  margin: 0 8px;
  background-color: #e0e0e0;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
  font-size: 20px;
  font-weight: bold;
  color: #666;
  transition: background-color 0.2s;
}

.blocklyTabAddButton:hover {
  background-color: #d0d0d0;
  color: #333;
}

.blocklyTabContent {
  width: 100%;
  height: calc(100% - 36px);
  overflow: hidden;
}

.blocklyWorkspaceContainer {
  width: 100%;
  height: 100%;
  display: none;
}

.blocklyActiveWorkspace {
  display: block;
}

/* Scrollbar styling for tab bar */
.blocklyTabBar::-webkit-scrollbar {
  height: 8px;
}

.blocklyTabBar::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.blocklyTabBar::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.blocklyTabBar::-webkit-scrollbar-thumb:hover {
  background: #555;
}

/* RTL support */
.blocklyRTL .blocklyTabBar {
  direction: rtl;
}

.blocklyRTL .blocklyTabContainer {
  direction: ltr;
}
`);

/**
 * TabManager manages multiple workspaces in tabbed interface.
 */
export class TabManager {
  private readonly tabBar: HTMLElement;
  private readonly tabContainer: HTMLElement;
  private readonly contentContainer: HTMLElement;
  private readonly tabs: Tab[] = [];
  private activeTabIndex: number = 0;
  private readonly onTabChange: (tab: Tab) => void;

  /**
   * Create a new TabManager.
   * @param container The container element for the entire tabbed interface.
   * @param onTabChange Callback function when active tab changes.
   */
  constructor(container: HTMLElement, onTabChange?: (tab: Tab) => void) {
    this.onTabChange = onTabChange || (() => {});
    
    // Create tab bar container
    this.tabBar = document.createElement('div');
    dom.addClass(this.tabBar, 'blocklyTabBar');
    
    // Create tab container for scrolling
    this.tabContainer = document.createElement('div');
    dom.addClass(this.tabContainer, 'blocklyTabContainer');
    this.tabBar.appendChild(this.tabContainer);
    
    // Create add button
    const addButton = document.createElement('div');
    dom.addClass(addButton, 'blocklyTabAddButton');
    addButton.innerHTML = '+';
    addButton.addEventListener('click', () => this.createTab());
    this.tabBar.appendChild(addButton);
    
    // Create content container
    this.contentContainer = document.createElement('div');
    dom.addClass(this.contentContainer, 'blocklyTabContent');
    
    container.appendChild(this.tabBar);
    container.appendChild(this.contentContainer);
    
    // Initialize with one tab
    this.createTab();
    
    // Add keyboard event listeners
    this.addKeyboardListeners();
  }

  /**
   * Create a new tab with a new workspace.
   * @param opt_options Optional options for the new workspace.
   * @returns The new tab.
   */
  createTab(opt_options?: BlocklyOptions): Tab {
    const tabId = `tab_${Date.now()}`;
    const tabName = `Untitled ${this.tabs.length + 1}`;
    
    // Create tab element
    const tabElement = document.createElement('div');
    dom.addClass(tabElement, 'blocklyTab');
    tabElement.dataset.tabId = tabId;
    
    // Create tab name element
    const tabNameElement = document.createElement('div');
    dom.addClass(tabNameElement, 'blocklyTabName');
    tabNameElement.textContent = tabName;
    tabElement.appendChild(tabNameElement);
    
    // Create tab close button
    const tabCloseButton = document.createElement('div');
    dom.addClass(tabCloseButton, 'blocklyTabCloseButton');
    tabCloseButton.innerHTML = '×';
    tabCloseButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.closeTab(tabId);
    });
    tabElement.appendChild(tabCloseButton);
    
    // Create workspace container
    const workspaceContainer = document.createElement('div');
    dom.addClass(workspaceContainer, 'blocklyWorkspaceContainer');
    workspaceContainer.dataset.tabId = tabId;
    
    // Create workspace options
    const options = new Options(opt_options || ({} as BlocklyOptions));
    
    // Create and initialize workspace
    const workspace = new WorkspaceSvg(options);
    
    // Create tab object
    const tab: Tab = {
      id: tabId,
      name: tabName,
      element: tabElement,
      container: workspaceContainer,
      workspace: workspace
    };
    
    // Add tab to list
    this.tabs.push(tab);
    
    // Add tab to DOM
    this.tabContainer.appendChild(tabElement);
    this.contentContainer.appendChild(workspaceContainer);
    
    // Set up tab click handler
    tabElement.addEventListener('click', () => this.setActiveTab(tab));
    
    // Set up tab rename on double click
    tabNameElement.addEventListener('dblclick', () => this.renameTab(tab));
    
    // Save initial workspace state
    this.saveWorkspaceState(workspace);
    
    // Set new tab as active
    this.setActiveTab(tab);
    
    return tab;
  }

  /**
   * Close a tab.
   * @param tabId The ID of the tab to close.
   */
  closeTab(tabId: string): void {
    const tabIndex = this.tabs.findIndex(tab => tab.id === tabId);
    if (tabIndex === -1) return;
    
    const tab = this.tabs[tabIndex];
    
    // Check if tab has unsaved changes
    if (this.hasUnsavedChanges(tab)) {
      const confirmClose = confirm('This tab has unsaved changes. Do you want to close it?');
      if (!confirmClose) return;
    }
    
    // Dispose workspace
    tab.workspace.dispose();
    
    // Remove from DOM
    tab.element.remove();
    tab.container.remove();
    
    // Remove from list
    this.tabs.splice(tabIndex, 1);
    
    // Update active tab if needed
    if (this.activeTabIndex === tabIndex) {
      const newActiveIndex = Math.max(0, tabIndex - 1);
      if (this.tabs.length > 0) {
        this.setActiveTab(this.tabs[newActiveIndex]);
      }
    } else if (this.activeTabIndex > tabIndex) {
      this.activeTabIndex--;
    }
  }

  /**
   * Set a tab as active.
   * @param tab The tab to set as active.
   */
  setActiveTab(tab: Tab): void {
    // Save current workspace state
    if (this.tabs[this.activeTabIndex]) {
      this.saveWorkspaceState(this.tabs[this.activeTabIndex].workspace);
    }
    
    // Update active tab index
    this.activeTabIndex = this.tabs.indexOf(tab);
    
    // Update DOM classes
    this.tabs.forEach(t => {
      dom.removeClass(t.element, 'blocklyActiveTab');
      dom.removeClass(t.container, 'blocklyActiveWorkspace');
    });
    dom.addClass(tab.element, 'blocklyActiveTab');
    dom.addClass(tab.container, 'blocklyActiveWorkspace');
    
    // Load workspace state
    this.loadWorkspaceState(tab.workspace);
    
    // Call callback
    this.onTabChange(tab);
  }

  /**
   * Rename a tab.
   * @param tab The tab to rename.
   */
  renameTab(tab: Tab): void {
    const newName = prompt('Enter new tab name:', tab.name);
    if (newName && newName.trim() !== '') {
      tab.name = newName.trim();
      const tabNameElement = tab.element.querySelector('.blocklyTabName');
      if (tabNameElement) {
        tabNameElement.textContent = tab.name;
      }
      this.saveTabState(tab);
    }
  }

  /**
   * Save workspace state to localStorage.
   * @param workspace The workspace to save.
   */
  private saveWorkspaceState(workspace: WorkspaceSvg): void {
    const xml = domToText(Xml.workspaceToDom(workspace));
    localStorage.setItem(`blockly_workspace_${workspace.id}`, xml);
  }

  /**
   * Load workspace state from localStorage.
   * @param workspace The workspace to load into.
   */
  private loadWorkspaceState(workspace: WorkspaceSvg): void {
    const xmlText = localStorage.getItem(`blockly_workspace_${workspace.id}`);
    if (xmlText) {
      const xml = textToDom(xmlText);
      Xml.domToWorkspace(xml, workspace);
    }
  }

  /**
   * Save tab state to localStorage.
   * @param tab The tab to save.
   */
  private saveTabState(tab: Tab): void {
    const tabState = {name: tab.name};
    localStorage.setItem(`blockly_tab_${tab.id}`, JSON.stringify(tabState));
  }

  /**
   * Check if a tab has unsaved changes.
   * @param tab The tab to check.
   * @returns True if tab has unsaved changes, false otherwise.
   */
  private hasUnsavedChanges(tab: Tab): boolean {
    // TODO: Implement proper unsaved changes detection
    return false;
  }

  /**
   * Add keyboard event listeners for tab navigation.
   */
  private addKeyboardListeners(): void {
    document.addEventListener('keydown', (e) => {
      // Ctrl+Tab: Next tab
      if (e.ctrlKey && e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault();
        this.nextTab();
      }
      // Ctrl+Shift+Tab: Previous tab
      else if (e.ctrlKey && e.key === 'Tab' && e.shiftKey) {
        e.preventDefault();
        this.previousTab();
      }
      // Ctrl+1 to Ctrl+9: Go to tab 1-9
      else if (e.ctrlKey && e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        const tabIndex = parseInt(e.key) - 1;
        if (tabIndex < this.tabs.length) {
          this.setActiveTab(this.tabs[tabIndex]);
        }
      }
    });
  }

  /**
   * Switch to the next tab.
   */
  private nextTab(): void {
    const nextIndex = (this.activeTabIndex + 1) % this.tabs.length;
    this.setActiveTab(this.tabs[nextIndex]);
  }

  /**
   * Switch to the previous tab.
   */
  private previousTab(): void {
    const prevIndex = (this.activeTabIndex - 1 + this.tabs.length) % this.tabs.length;
    this.setActiveTab(this.tabs[prevIndex]);
  }

  /**
   * Get the active tab.
   * @returns The active tab.
   */
  getActiveTab(): Tab | null {
    return this.tabs[this.activeTabIndex] || null;
  }

  /**
   * Get all tabs.
   * @returns Array of all tabs.
   */
  getAllTabs(): Tab[] {
    return this.tabs;
  }
}

/**
 * Interface representing a tab.
 */
export interface Tab {
  id: string;
  name: string;
  element: HTMLElement;
  container: HTMLElement;
  workspace: WorkspaceSvg;
}