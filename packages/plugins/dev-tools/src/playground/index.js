/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Entry point for the Blockly playground.
 * @author samelh@google.com (Sam El-Husseini)
 */

import {toolboxTestBlocks, toolboxTestBlocksInit} from '@blockly/block-test';
import {dartGenerator} from 'blockly/dart';
import {javascriptGenerator} from 'blockly/javascript';
import {luaGenerator} from 'blockly/lua';
import {phpGenerator} from 'blockly/php';
import {pythonGenerator} from 'blockly/python';

import {downloadWorkspaceScreenshot} from '../screenshot.js';
import toolboxCategories from '../toolboxCategories.js';
import toolboxSimple from '../toolboxSimple.js';

import {id} from './id.js';
import {addCodeEditor} from './monaco.js';
import {addGUIControls} from './options.js';
import {LocalStorageState} from './state.js';
import {
  renderButton,
  renderCheckbox,
  renderCodeTab,
  renderPlayground,
} from './ui.js';

/**
 * @typedef {function(!HTMLElement,!Blockly.BlocklyOptions):
 *     Blockly.WorkspaceSvg}
 */
let CreateWorkspaceFn;

/**
 * @typedef {{
 *     generate: function(): void,
 *     state: ?,
 *     tabElement: !HTMLElement
 * }}
 */
let PlaygroundTab;

/**
 * @typedef {Blockly.utils.toolbox.ToolboxDefinition} BlocklyToolbox
 */

/**
 * @typedef {Object} PlaygroundConfig
 * @property {boolean} [auto] Whether or not to automatically import, and run
 *     the XML and code generators.
 * @property {Object<string,BlocklyToolbox>} [toolboxes] The toolbox registry.
 */

/**
 * @typedef {{
 *     state: ?,
 *     addAction:function(string,function(!Blockly.Workspace):void,string=):
 *         dat.GUI,
 *     addCheckboxAction:function(string,
 *         function(!Blockly.Workspace,boolean):void,string=,boolean=):dat.GUI,
 *     addGenerator: function(string,!Blockly.Generator,string=):void,
 *     getCurrentTab: function():!PlaygroundTab,
 *     getGUI: function():!dat.GUI,
 *     getWorkspace: function():!Blockly.WorkspaceSvg
 * }}
 */
let PlaygroundAPI;

/**
 * Create the Blockly playground.
 * @param {!HTMLElement} container Container element.
 * @param {CreateWorkspaceFn=} createWorkspace A workspace creation method
 *     called every time the toolbox is re-configured.
 * @param {Blockly.BlocklyOptions=} defaultOptions The default workspace options
 *     to use.
 * @param {PlaygroundConfig=} config Optional Playground config.
 * @param {string=} vsEditorPath Optional editor path.
 * @returns {Promise<PlaygroundAPI>} A promise to the playground API.
 */
export function createPlayground(
  container,
  createWorkspace = Blockly.inject,
  defaultOptions = {
    toolbox: toolboxCategories,
  },
  config = {},
  vsEditorPath,
) {
  const {
    blocklyDiv,
    minimizeButton,
    monacoDiv,
    guiContainer,
    playgroundDiv,
    tabButtons,
    tabsDiv,
  } = renderPlayground(container);

  const monacoOptions = {
    model: null,
    language: 'xml',
    minimap: {
      enabled: false,
    },
    theme: 'vs-dark',
    scrollBeyondLastLine: false,
    automaticLayout: true,
  };

  // Load the code editor.
  return addCodeEditor(monacoDiv, monacoOptions, vsEditorPath).then(
    (editor) => {
      let workspace;

      // Create a model for displaying errors.
      const errorModel = window.monaco.editor.createModel('');
      const editorXmlContextKey = editor.createContextKey('isEditorXml', true);
      const editorJsonContextKey = editor.createContextKey(
        'isEditorJson',
        true,
      );

      // Load / Save playground state.
      // setting active tab as JSON
      const playgroundState = new LocalStorageState(`playgroundState_${id}`, {
        activeTab: 'JSON',
        playgroundOpen: true,
        autoGenerate: config && config.auto != undefined ? config.auto : true,
        workspaceJson: '',
      });
      playgroundState.load();

      /**
       * Register a generator and create a new code tab for it.
       * @param {string} name The generator label.
       * @param {string} language The monaco language to use.
       * @param {function(Blockly.WorkspaceSvg):string} generator
       *     The Blockly generator.
       * @param {boolean=} isReadOnly Whether the editor should be set to
       *     read-only mode.
       * @returns {!PlaygroundTab} An object that represents the newly created
       *     tab.
       */
      function registerGenerator(name, language, generator, isReadOnly) {
        const tabElement = renderCodeTab(name);
        tabElement.setAttribute('data-tab', name);
        tabsDiv.appendChild(tabElement);

        // Create a monaco editor model for each tab.
        const model = window.monaco.editor.createModel('', language);
        const state = {
          name,
          model,
          language,
          viewState: undefined,
        };

        /**
         * Call the generator, displaying an error message if it fails.
         */
        function generate() {
          let text;
          let generateModel = model;
          try {
            text = generator(workspace);
          } catch (e) {
            console.error(e);
            text = e.message;
            generateModel = errorModel;
            editor.updateOptions({
              wordWrap: true,
            });
          }
          if (
            generateModel.getValue() === text &&
            editor.getModel() === generateModel
          ) {
            return;
          }
          generateModel.pushEditOperations(
            [],
            [{range: generateModel.getFullModelRange(), text}],
            () => null,
          );
          editor.setModel(generateModel);
          editor.setSelection(new window.monaco.Range(0, 0, 0, 0));
        }

        const tab = {
          generate,
          state,
          tabElement,
        };
        return tab;
      }

      /**
       * Set the active tab.
       * @param {!PlaygroundTab} tab The new tab.
       */
      const setActiveTab = (tab) => {
        currentTab = tab;
        currentGenerate = tab.generate;
        const isXml = tab.state.name == 'XML';
        const isJson = tab.state.name == 'JSON';
        editor.setModel(currentTab.state.model);
        editor.updateOptions({
          readOnly: !isXml && !isJson,
          wordWrap: false,
        });

        // Update tab UI.
        Object.values(tabs).forEach(
          (t) =>
            (t.tabElement.style.background =
              t.tabElement == tab.tabElement ? '#1E1E1E' : '#2D2D2D'),
        );
        // Update editor state.
        editorXmlContextKey.set(isXml);
        editorJsonContextKey.set(isJson);
        updateImportButtonDisplay();
        playgroundState.set('activeTab', tab.state.name);
        playgroundState.save();
      };

      /**
       * Call the current generate method if we are in 'auto' mode. In
       * addition, persist the current workspace xml regardless of which tab
       * we are in.
       */
      const updateEditor = () => {
        if (playgroundState.get('autoGenerate')) {
          if (initialWorkspaceJson && isFirstLoad) {
            isFirstLoad = false;
            try {
              Blockly.serialization.workspaces.load(
                JSON.parse(initialWorkspaceJson),
                workspace,
              );
            } catch (e) {
              console.warn('Failed to auto import.', e);
            }
          }

          if (currentGenerate) {
            currentGenerate();
          }

          let code = '';
          try {
            code = JSON.stringify(
              Blockly.serialization.workspaces.save(workspace),
              null,
              2,
            );
          } catch (e) {
            console.warn('Failed to auto save.', e);
          }
          playgroundState.set('workspaceJson', code);
          playgroundState.save();
        }
      };

      // Register default tabs.
      const tabs = {
        JSON: registerGenerator('JSON', 'json', (ws) => {
          return JSON.stringify(
            Blockly.serialization.workspaces.save(ws),
            null,
            2,
          );
        }),
        XML: registerGenerator('XML', 'xml', (ws) => {
          return Blockly.Xml.domToPrettyText(Blockly.Xml.workspaceToDom(ws));
        }),
        JavaScript: registerGenerator(
          'JavaScript',
          'javascript',
          (ws) =>
            (javascriptGenerator || Blockly.JavaScript).workspaceToCode(ws),
          true,
        ),
        Python: registerGenerator(
          'Python',
          'python',
          (ws) => (pythonGenerator || Blockly.Python).workspaceToCode(ws),
          true,
        ),
        Dart: registerGenerator(
          'Dart',
          'dart',
          (ws) => (dartGenerator || Blockly.Dart).workspaceToCode(ws),
          true,
        ),
        Lua: registerGenerator(
          'Lua',
          'lua',
          (ws) => (luaGenerator || Blockly.Lua).workspaceToCode(ws),
          true,
        ),
        PHP: registerGenerator(
          'PHP',
          'php',
          (ws) => (phpGenerator || Blockly.PHP).workspaceToCode(ws),
          true,
        ),
      };

      // Handle tab click.
      tabsDiv.addEventListener('click', (e) => {
        const target = /** @type {HTMLElement} */ (e.target);
        const tabName = target.getAttribute('data-tab');
        if (!tabName) {
          // Not a tab.
          return;
        }
        const tab = tabs[tabName];

        // Save current tab state (eg: scroll position).
        currentTab.state.viewState = editor.saveViewState();

        setActiveTab(tab);
        updateEditor();

        // Restore tab state (eg: scroll position).
        editor.restoreViewState(currentTab.state.viewState);
        editor.focus();
      });

      // Initialized saved JSON and bind change listener.
      const initialWorkspaceJson = playgroundState.get('workspaceJson') || '';
      const jsonTab = tabs['JSON'];
      const jsonModel = jsonTab.state.model;
      let isFirstLoad = true;
      jsonModel.setValue(initialWorkspaceJson);
      jsonModel.onDidChangeContent(() => {
        playgroundState.set('workspaceJson', jsonModel.getValue());
        playgroundState.save();
      });

      // Create a button to import state from the editor tab to the workspace.
      const importButton = renderButton('Import');
      tabButtons.appendChild(importButton);
      importButton.addEventListener('click', (e) => {
        if (editorXmlContextKey.get()) {
          editor.getAction('import-xml').run();
        }
        if (editorJsonContextKey.get()) {
          editor.getAction('import-json').run();
        }
      });
      const updateImportButtonDisplay = function () {
        // The import button is only relevant for the XML and JSON tabs.
        if (editorXmlContextKey.get() || editorJsonContextKey.get()) {
          importButton.style.display = '';
        } else {
          importButton.style.display = 'none';
        }
      };

      // Set the initial tab as active.
      const activeTab = playgroundState.get('activeTab');
      let currentTab = tabs[activeTab];
      let currentGenerate;
      if (currentTab) {
        setActiveTab(currentTab);
      }

      // Load the GUI controls.
      const gui = addGUIControls(
        (options) => {
          workspace = createWorkspace(blocklyDiv, options);

          // Initialize the test toolbox.
          toolboxTestBlocksInit(
            /** @type {!Blockly.WorkspaceSvg} */ (workspace),
          );

          // Add download screenshot option.
          const prevConfigureContextMenu = workspace.configureContextMenu;
          workspace.configureContextMenu = (menuOptions, e) => {
            prevConfigureContextMenu &&
              prevConfigureContextMenu.call(null, menuOptions, e);

            const screenshotOption = {
              text: 'Download Screenshot',
              enabled: workspace.getTopBlocks().length,
              callback: function () {
                downloadWorkspaceScreenshot(workspace);
              },
            };
            menuOptions.push(screenshotOption);
          };

          updateEditor();
          workspace.addChangeListener((e) => {
            if (e.type !== 'ui' && e.type !== 'viewport_change') {
              updateEditor();
            }
          });
          return workspace;
        },
        defaultOptions,
        {
          disableResize: true,
          toolboxes: config.toolboxes || {
            'categories': toolboxCategories,
            'simple': toolboxSimple,
            'test blocks': toolboxTestBlocks,
          },
        },
      );

      // Move the GUI Element to the gui container.
      const guiElement = gui.domElement;
      guiElement.removeChild(guiElement.firstChild);
      guiElement.style.position = 'relative';
      guiElement.style.minWidth = '100%';
      guiContainer.appendChild(guiElement);

      // Click handler to toggle the playground.
      const togglePlayground = (e) => {
        const shouldOpen = playgroundDiv.style.display === 'none';
        if (shouldOpen) {
          playgroundDiv.style.display = 'flex';
          minimizeButton.textContent = 'Collapse';
        } else {
          playgroundDiv.style.display = 'none';
          minimizeButton.textContent = 'Expand';
        }
        playgroundState.set('playgroundOpen', shouldOpen);
        playgroundState.save();
        Blockly.svgResize(workspace);
      };
      minimizeButton.addEventListener('click', togglePlayground);

      // Start minimized if the playground was previously closed.
      if (playgroundState.get('playgroundOpen') === false) {
        togglePlayground();
      }

      // Playground API.

      /**
       * Get the current GUI controls.
       * @returns {!dat.GUI} The GUI controls.
       */
      const getGUI = function () {
        return gui;
      };

      /**
       * Get the current workspace.
       * @returns {!Blockly.WorkspaceSvg} The Blockly workspace.
       */
      const getWorkspace = function () {
        return workspace;
      };

      /**
       * Get the current tab.
       * @returns {!PlaygroundTab} The current tab.
       */
      const getCurrentTab = function () {
        return currentTab;
      };

      /**
       * Add a generator tab.
       * @param {string} label The label of the generator tab.
       * @param {Blockly.Generator} generator The Blockly generator.
       * @param {string=} language Optional editor language, defaults to
       *     'javascript'.
       */
      const addGenerator = function (label, generator, language) {
        if (!label || !generator) {
          throw Error('usage: addGenerator(label, generator, language?);');
        }
        tabs[label] = registerGenerator(
          label,
          language || 'javascript',
          (ws) => generator.workspaceToCode(ws),
          true,
        );
        if (activeTab === label) {
          // Set the new generator as the current tab if it is currently
          // active. This occurs when a dynamically added generator is active
          // and the page is reloaded.
          setActiveTab(tabs[label]);
        }
      };

      /**
       * Removes a generator tab.
       * @param {string} label The label of the generator tab to remove.
       */
      const removeGenerator = function (label) {
        if (!label) {
          throw Error('usage: removeGenerator(label);');
        }
        if (!(label in tabs)) {
          throw Error('removeGenerator called on invalid label: ' + label);
        }
        const tab = tabs[label];
        tabsDiv.removeChild(tab.tabElement);
        delete tabs[label];
        const tabsKeys = Object.keys(tabs);
        if (activeTab === label && tabsKeys.length) {
          // Set the active tab to another tab if the active tab corresponded
          // to a removed generator.
          setActiveTab(tabs[tabsKeys[0]]);
        }
      };

      const playground = {
        state: playgroundState,
        addAction: /** @type {?} */ (gui).addAction,
        addCheckboxAction: /** @type {?} */ (gui).addCheckboxAction,
        addGenerator,
        getCurrentTab,
        getGUI,
        getWorkspace,
        removeGenerator,
      };

      // Add tab buttons.
      registerTabButtons(editor, playground, tabButtons, updateEditor);

      // Register editor commands.
      registerEditorCommands(editor, playground);

      return playground;
    },
  );
}

/**
 * Register tab buttons.
 * @param {monaco.editor.IStandaloneCodeEditor} editor The monaco editor.
 * @param {PlaygroundAPI} playground The current playground.
 * @param {!HTMLElement} tabButtons Tab buttons element wrapper.
 * @param {function():void} updateEditor Update Editor method.
 */
function registerTabButtons(editor, playground, tabButtons, updateEditor) {
  const [autoGenerateCheckbox, autoGenerateLabel] = renderCheckbox(
    'autoGenerate',
    'Auto',
  );
  /** @type {HTMLInputElement} */ (autoGenerateCheckbox).checked =
    playground.state.get('autoGenerate');
  autoGenerateCheckbox.addEventListener('change', (e) => {
    const inputTarget = /** @type {HTMLInputElement} */ (e.target);
    playground.state.set('autoGenerate', !!inputTarget.checked);
    playground.state.save();

    updateEditor();
  });
  tabButtons.appendChild(autoGenerateCheckbox);
  tabButtons.appendChild(autoGenerateLabel);
}

/**
 * Register editor commands / shortcuts.
 * @param {monaco.editor.IStandaloneCodeEditor} editor The monaco editor.
 * @param {PlaygroundAPI} playground The current playground.
 */
function registerEditorCommands(editor, playground) {
  const loadXml = () => {
    const xml = editor.getModel().getValue();
    const workspace = playground.getWorkspace();
    try {
      Blockly.Xml.clearWorkspaceAndLoadFromXml(
        Blockly.utils.xml.textToDom(xml),
        workspace,
      );
    } catch {
      // If this fails that's fine.
      return false;
    }
    return true;
  };
  const loadJson = () => {
    const json = editor.getModel().getValue();
    const workspace = playground.getWorkspace();
    try {
      Blockly.serialization.workspaces.load(JSON.parse(json), workspace);
    } catch {
      // If this fails fall back to trying to load XML instead.
      return loadXml();
    }
    return true;
  };
  const save = () => {
    playground.getCurrentTab().generate();
  };

  // Add XMl Import action (only available on the XML tab).
  editor.addAction({
    id: 'import-xml',
    label: 'Import from XML',
    keybindings: [window.monaco.KeyMod.CtrlCmd | window.monaco.KeyCode.Enter],
    precondition: 'isEditorXml',
    contextMenuGroupId: 'playground',
    contextMenuOrder: 0,
    run: loadXml,
  });
  // Add XMl Export action (only available on the XML tab).
  editor.addAction({
    id: 'export-xml',
    label: 'Export to XML',
    keybindings: [window.monaco.KeyMod.CtrlCmd | window.monaco.KeyCode.KEY_S],
    precondition: 'isEditorXml',
    contextMenuGroupId: 'playground',
    contextMenuOrder: 1,
    run: save,
  });
  // Add Clean XML action (only available on the XML tab).
  editor.addAction({
    id: 'clean-xml',
    label: 'Clean XML',
    precondition: 'isEditorXml',
    contextMenuGroupId: 'playground',
    contextMenuOrder: 2,
    run: () => {
      const model = editor.getModel();
      const text = model.getValue().replace(/ (x|y|id)="[^"]*"/gim, '');
      model.pushEditOperations(
        [],
        [{range: model.getFullModelRange(), text}],
        () => null,
      );
      editor.setSelection(new window.monaco.Range(0, 0, 0, 0));
    },
  });
  // Add JSON Import action (only available on the JSON tab).
  editor.addAction({
    id: 'import-json',
    label: 'Import from JSON',
    keybindings: [window.monaco.KeyMod.CtrlCmd | window.monaco.KeyCode.Enter],
    precondition: 'isEditorJson',
    contextMenuGroupId: 'playground',
    contextMenuOrder: 0,
    run: loadJson,
  });
  // Add a Generator generate action.
  editor.addAction({
    id: 'generate',
    label: 'Generate',
    keybindings: [window.monaco.KeyMod.CtrlCmd | window.monaco.KeyCode.KEY_S],
    precondition: '!isEditorXml',
    contextMenuGroupId: 'playground',
    contextMenuOrder: 1,
    run: save,
  });
}
