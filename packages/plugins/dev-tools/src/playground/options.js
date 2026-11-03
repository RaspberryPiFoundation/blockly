/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview A helper to use the dat.GUI interface for configuring Blockly
 * workspace options.
 * @author samelh@google.com (Sam El-Husseini)
 */
import * as Blockly from 'blockly/core';
import * as dat from 'dat.gui';
import assign from 'lodash.assign';
import merge from 'lodash.merge';
import darkTheme from '@blockly/theme-dark';
import deuteranopiaTheme from '@blockly/theme-deuteranopia';
import themeTritanopia from '@blockly/theme-tritanopia';
import highContrastTheme from '@blockly/theme-highcontrast';

import {DebugDrawer} from '../debugDrawer.js';
import {registerDebugRendererFromName, debugRendererName} from '../debug.js';
import {disableLogger, enableLogger} from '../logger.js';
import {HashState} from './hash_state.js';
import {populateRandom} from '../populateRandom.js';
import {spaghetti} from '../spaghetti.js';
import {id} from './id.js';
import toolboxCategories from '../toolboxCategories.js';
import toolboxSimple from '../toolboxSimple.js';

/**
 * @typedef {Blockly.utils.toolbox.ToolboxDefinition} BlocklyToolbox
 */

/**
 * @typedef {Object} GUIConfig
 * @property {boolean} [disableResize] Whether or not to disable automatically
 *     resizing the GUI control.
 * @property {Object<string,BlocklyToolbox>} [toolboxes] The toolbox registry.
 */

/**
 * Use dat.GUI to add controls to adjust configuration of a Blockly workspace.
 * @param {function(!Blockly.BlocklyOptions):Blockly.WorkspaceSvg} genWorkspace
 *     A workspace creation method called every time the toolbox is
 *     re-configured.
 * @param {Blockly.BlocklyOptions} defaultOptions The default workspace options
 *     to use.
 * @param {GUIConfig=} config Optional GUI config.
 * @returns {dat.GUI} The dat.GUI instance.
 */
export function addGUIControls(genWorkspace, defaultOptions, config = {}) {
  // Initialize state.
  const guiState = loadGUIState();

  // Initialize toolboxes.
  const toolboxes =
    /** @type {Object<string,Blockly.utils.toolbox.ToolboxDefinition>} */ (
      config.toolboxes || {
        categories: toolboxCategories,
        simple: toolboxSimple,
      }
    );
  const defaultToolboxName = initDefaultToolbox(defaultOptions, toolboxes);
  guiState.toolboxName = guiState.toolboxName || defaultToolboxName;
  guiState.options.toolbox = toolboxes[guiState.toolboxName];

  // Initialize themes.
  const themes = getThemes(defaultOptions);
  const defaultThemeName = defaultOptions.theme
    ? /** @type {!Blockly.Theme} */ (defaultOptions.theme).name
    : 'classic';
  guiState.themeName = guiState.themeName || defaultThemeName;
  guiState.options.theme = themes[guiState.themeName];

  const defaultRendererName = defaultOptions.renderer
    ? defaultOptions.renderer
    : 'geras';
  guiState.renderer = guiState.renderer || defaultRendererName;
  guiState.debugEnabled = guiState.debugEnabled || false;

  // Merge default and saved state.
  const saveOptions = /** @type {!Blockly.BlocklyOptions} */ ({
    ...defaultOptions,
    ...guiState.options,
  });
  initDebugRenderer(guiState);

  let workspace = genWorkspace(saveOptions);
  const resizeEnabled = !config.disableResize;

  const gui = new dat.GUI({
    autoPlace: false,
    closeOnTop: true,
    width: 250,
    load: guiState.guiObject || {},
  });

  const guiElement = gui.domElement;
  guiElement.style.position = 'absolute';
  guiElement.style.zIndex = '1000';
  guiElement.onclick = () => {
    // Save the GUI state locally.
    guiState.guiObject = gui.getSaveObject();
    saveGUIState(guiState, defaultToolboxName, defaultThemeName);
  };

  const onResize = () => {
    const metrics = workspace.getMetrics();
    if (workspace.RTL) {
      guiElement.style.left = metrics.absoluteLeft + 'px';
      guiElement.style.right = 'auto';
    } else {
      guiElement.style.left = 'auto';
      if (metrics.toolboxPosition === Blockly.TOOLBOX_AT_RIGHT) {
        guiElement.style.right = metrics.toolboxWidth + 'px';
      } else {
        guiElement.style.right = '0';
      }
    }
    guiElement.style.top = metrics.absoluteTop + 'px';
  };
  if (resizeEnabled) {
    onResize();
  }

  const container = /** @type {!HTMLElement} */ (
    workspace.getInjectionDiv().parentNode
  );
  container.style.position = 'relative';
  container.appendChild(guiElement);

  const options = Object.assign({}, workspace.options);

  const onChangeInternal = () => {
    // Serialize current workspace state.
    const state = Blockly.serialization.workspaces.save(workspace);
    // Dispose of the current workspace
    workspace.dispose();
    // Create a new workspace with options.
    workspace = genWorkspace(saveOptions);
    // Deserialize state into workspace.
    Blockly.serialization.workspaces.load(state, workspace);
    // Resize the gui.
    if (resizeEnabled) {
      onResize();
    }
    // Save the GUI state locally.
    guiState.guiObject = gui.getSaveObject();
    saveGUIState(guiState, defaultToolboxName, defaultThemeName);
    // Update options.
    merge(saveOptions, workspace.options);
    gui.updateDisplay();
  };

  const onChange = (key, value) => {
    saveOptions[key] = value;
    guiState.options[key] = value;
    onChangeInternal();
  };

  const reset = () => {
    // Reset saved options.
    Object.keys(saveOptions).forEach((k) => delete saveOptions[k]);
    assign(saveOptions, defaultOptions);
    Object.keys(guiState.options).forEach((k) => delete guiState.options[k]);
    // Reset debug options.
    guiState.renderer = defaultRendererName;
    initDebugRenderer(guiState, true);
    updateDebugFolder(debugOptionsFolder, false);

    // Reset toolbox selection.
    guiState.toolboxName = defaultToolboxName;
    guiState.themeName = defaultThemeName;

    // Close all folders.
    Object.values(gui.__folders).forEach((f) => f.close());

    onChangeInternal();
  };

  gui.add(
    {
      Reset: reset,
    },
    'Reset',
  );

  // Options folder.
  const optionsFolder = gui.addFolder('Options');
  setTooltip(
    optionsFolder,
    'Options that affect the appearance of the workspace.',
  );
  openFolderIfOptionSelected(optionsFolder, guiState, guiState.options, [
    'rtl',
    'renderer',
    'toolboxPosition',
    'horizontalLayout',
  ]);

  setTooltip(
    optionsFolder
      .add(options, 'RTL')
      .name('rtl')
      .onChange((value) => onChange('rtl', value)),
    'If true, mirror the editor (for Arabic or Hebrew locales).',
  );

  // Renderer.
  populateRendererOption(optionsFolder, guiState, onChange);

  // Theme.
  populateThemeOption(
    optionsFolder,
    guiState,
    themes,
    defaultThemeName,
    onChange,
  );

  // Toolbox.
  populateToolboxOption(
    optionsFolder,
    guiState,
    toolboxes,
    defaultToolboxName,
    onChange,
  );
  populateToolboxSidesOption(
    optionsFolder,
    options,
    saveOptions,
    guiState,
    onChangeInternal,
  );

  // Basic options.
  const basicFolder = optionsFolder.addFolder('Basic');
  setTooltip(basicFolder, 'Basic options like sound, comment etc...');
  populateBasicOptions(basicFolder, options, guiState, onChange);

  // Move options.
  const moveFolder = optionsFolder.addFolder('Move');
  setTooltip(moveFolder, 'Move options like scrollbars, drag etc...');
  populateMoveOptions(moveFolder, options, saveOptions, onChange);
  openFolderIfOptionSelected(moveFolder, guiState, guiState.options, ['move']);

  // Zoom options.
  const zoomFolder = optionsFolder.addFolder('Zoom');
  setTooltip(zoomFolder, 'Zoom options like controls, startScale etc...');
  populateZoomOptions(zoomFolder, options, saveOptions, onChange);
  openFolderIfOptionSelected(moveFolder, guiState, guiState.options, ['zoom']);

  // Grid options.
  const gridFolder = optionsFolder.addFolder('Grid');
  setTooltip(gridFolder, 'Grid options like spacing, length etc...');
  populateGridOptions(gridFolder, options, saveOptions, onChange);
  openFolderIfOptionSelected(moveFolder, guiState, guiState.options, ['grid']);

  // Debug renderer.
  const debugFolder = gui.addFolder('Debug');
  // Adds the checkbox to toggle using the debug renderer.
  const debugController = debugFolder.add(guiState, 'debugEnabled');
  // Folder with all the debug options. Hidden if the debugger is not enabled.
  const debugOptionsFolder = debugFolder.addFolder('Debug Options');

  setTooltip(debugFolder, 'Rendering debug configuration.');
  populateDebugFolder(debugController, debugOptionsFolder, guiState, onChange);
  populateDebugOptionsFolder(debugOptionsFolder, guiState, onChangeInternal);

  // GUI actions.
  const actionsFolder = gui.addFolder('Actions');
  const actionSubFolders = {};
  const actions = {};

  /**
   * Get the current workspace.
   * @returns {!Blockly.WorkspaceSvg} The Blockly workspace.
   */
  const getWorkspace = () => {
    return workspace;
  };

  /**
   * Add a custom action to the list of playground actions.
   * @param {string} name The action label.
   * @param {function(!Blockly.Workspace):void} callback The callback to call
   *     when the action is clicked.
   * @param {string=} folderName Optional folder to place the action under.
   * @param {string=} tooltip Optional tooltip to set.
   * @returns {dat.GUIController} The GUI controller.
   */
  const addAction = (name, callback, folderName, tooltip) => {
    actions[name] = () => {
      callback(workspace);
    };
    let folder = actionsFolder;
    if (folderName) {
      if (actionSubFolders[folderName]) {
        folder = actionSubFolders[folderName];
      } else {
        folder = actionsFolder.addFolder(folderName);
        folder.open();
        actionSubFolders[folderName] = folder;
      }
    }
    const controller = folder.add(actions, name);
    tooltip && setTooltip(controller, tooltip);
    name && controller.name(name);
    return controller;
  };

  /**
   * Add a custom checkbox action to the list of playground actions.
   * @param {string} name The action label.
   * @param {function(!Blockly.Workspace,boolean):void} callback The callback to
   *     call when the action is clicked.
   * @param {string=} folderName Optional folder to place the action under.
   * @param {boolean=} defaultValue Default value.
   * @param {string=} tooltip Optional tooltip to set.
   * @returns {dat.GUIController} The GUI controller.
   */
  const addCheckboxAction = (
    name,
    callback,
    folderName,
    defaultValue,
    tooltip,
  ) => {
    actions[name] = !!defaultValue;
    let folder = actionsFolder;
    if (folderName) {
      if (actionSubFolders[folderName]) {
        folder = actionSubFolders[folderName];
      } else {
        folder = actionsFolder.addFolder(folderName);
        folder.open();
        actionSubFolders[folderName] = folder;
      }
    }
    const controller = folder.add(actions, name);
    tooltip && setTooltip(controller, tooltip);
    name && controller.name(name);
    controller.listen().onFinishChange((value) => {
      callback(workspace, value);
    });

    return controller;
  };

  const devGui = /** @type {?} */ (gui);
  devGui.addCheckboxAction = addCheckboxAction;
  devGui.addAction = addAction;
  devGui.getWorkspace = getWorkspace;

  addActions(devGui, workspace);

  return devGui;
}

/**
 * Save the GUI state to local storage and the window hash.
 * @param {Object} guiState The GUI State.
 * @param {string} defaultToolboxName The default toolbox name.
 * @param {string} defaultThemeName The default theme name.
 */
function saveGUIState(guiState, defaultToolboxName, defaultThemeName) {
  // Don't save toolbox and theme, as we'll save their names instead.
  delete guiState.options['toolbox'];
  delete guiState.options['theme'];

  if (guiState.debugEnabled) {
    // In this case guiState.options.renderer is 'debugRenderer'. Storing this
    // is not helpful, so instead store the actual name of the renderer.
    guiState.options.renderer = guiState.renderer;
  }

  // Save GUI control options to local storage.
  const guiStateKey = `guiState_${id}`;
  localStorage.setItem(guiStateKey, JSON.stringify(guiState));

  // Save GUI state into the URL:
  const hashGuiState = Object.assign({}, guiState.options);
  if (guiState.toolboxName !== defaultToolboxName) {
    hashGuiState.toolbox = guiState.toolboxName;
  }
  if (guiState.themeName !== defaultThemeName) {
    hashGuiState.theme = guiState.themeName;
  }

  // Save whether the debug is enabled.
  hashGuiState.debugEnabled = guiState.debugEnabled;
  window.location.hash = HashState.save(hashGuiState);
}

/**
 * Load the GUI state from local storage and the window hash.
 * @returns {Object} The GUI state.
 */
function loadGUIState() {
  const defaultState = {options: {}, debug: {}, debugEnabled: false};
  const guiStateKey = `guiState_${id}`;
  const guiState =
    JSON.parse(localStorage.getItem(guiStateKey)) || defaultState;
  if (window.location.hash) {
    HashState.parse(window.location.hash, guiState.options);
  }
  // Move GUI toolbox state out of options, as it refers to the toolbox name
  // and not the toolbox value.
  if (guiState.options.toolbox) {
    guiState.toolboxName = guiState.options.toolbox;
    delete guiState.options.toolbox;
  }
  // Move GUI theme state out of options, as it refers to the theme name
  // and not the theme object.
  if (guiState.options.theme) {
    guiState.themeName = guiState.options.theme;
    delete guiState.options.theme;
  }
  // If we end up using the 'debugRenderer' we still need to store the name of
  // the original renderer.
  guiState.renderer = guiState.options.renderer;

  // Use the debug renderer.
  if (guiState.debugEnabled) {
    guiState.options.renderer = debugRendererName;
  }

  return guiState;
}

/**
 * Open a dat.GUI folder and all of its parents if one of the options is present
 * in the GUI state.
 * @param {dat.GUI} folder The GUI folder.
 * @param {Object} guiState GUI state.
 * @param {Object} mainObj The main object to check options against.
 * @param {Array<string>} options The options to check.
 */
function openFolderIfOptionSelected(folder, guiState, mainObj, options) {
  if (guiState.guiObject) {
    // The GUI state is controlling the folder state.
    return;
  }
  options.forEach((option) => {
    if (mainObj[option] != undefined) {
      folder.open();
      while (folder.parent) {
        folder = folder.parent;
        folder.open();
      }
    }
  });
}

/**
 * Initialize the default toolbox.  If the default toolbox is not in the list of
 * toolboxes, add a "default" option to the toolbox list.
 * @param {Blockly.BlocklyOptions} defaultOptions Default Blockly options.
 * @param {Object<string,Blockly.utils.toolbox.ToolboxDefinition>} toolboxes The
 *     registered toolboxes.
 * @returns {string} The default toolbox name.
 */
function initDefaultToolbox(defaultOptions, toolboxes) {
  const defaultToolbox = defaultOptions.toolbox;
  const isDefaultInToolboxes = Object.keys(toolboxes).filter(
    (k) => toolboxes[k] == defaultToolbox,
  );
  if (defaultToolbox && !isDefaultInToolboxes.length) {
    // Default toolbox not in the toolbox list.  Add a "default" option.
    toolboxes['default'] = defaultToolbox;
    return 'default';
  } else if (isDefaultInToolboxes.length) {
    // Get the
    return isDefaultInToolboxes[0];
  } else {
    // No default toolbox set, choose the first one.
    return Object.keys(toolboxes)[0];
  }
}

/**
 * Populate basic options.
 * @param {dat.GUI} basicFolder The dat.GUI basic folder.
 * @param {Blockly.Options} options Blockly options.
 * @param {Object} guiState The GUI state.
 * @param {function(string, *):void} onChange On Change method.
 */
function populateBasicOptions(basicFolder, options, guiState, onChange) {
  setTooltip(
    basicFolder
      .add(options, 'readOnly')
      .onChange((value) => onChange('readOnly', value)),
    'If true, prevent the user from editing. Suppresses the toolbox and' +
      ' trashcan.',
  );
  setTooltip(
    basicFolder
      .add(options, 'hasTrashcan')
      .name('trashCan')
      .onChange((value) => onChange('trashcan', value)),
    'Displays or hides the trashcan.',
  );
  setTooltip(
    basicFolder
      .add(options, 'hasSounds')
      .name('sounds')
      .onChange((value) => onChange('sounds', value)),
    `If false, don't play sounds (e.g. click and delete).`,
  );
  setTooltip(
    basicFolder
      .add(options, 'disable')
      .onChange((value) => onChange('disable', value)),
    'Allows blocks to be disabled. ',
  );
  setTooltip(
    basicFolder
      .add(options, 'collapse')
      .onChange((value) => onChange('collapse', value)),
    'Allows blocks to be collapsed or expanded.',
  );
  setTooltip(
    basicFolder
      .add(options, 'comments')
      .onChange((value) => onChange('comments', value)),
    'Allows blocks to have comments.',
  );

  openFolderIfOptionSelected(basicFolder, guiState, guiState.options, [
    'readOnly',
    'trashcan',
    'sounds',
    'disable',
    'collapse',
    'comments',
  ]);
}

/**
 * Populate the renderer option.
 * @param {dat.GUI} folder The dat.GUI folder.
 * @param {Object} guiState The GUI state.
 * @param {function(string, *):void} onChange On Change method.
 */
function populateRendererOption(folder, guiState, onChange) {
  // Get the list of renderers. Previous versions of Blockly used the
  // rendererMap_, whereas newer versions that use the global registry get their
  // list of renderers from somewhere else.
  const renderers =
    Blockly.blockRendering.rendererMap_ ||
    (Blockly.registry && Blockly.registry.getAllItems('renderer'));
  const publicRenderers = Object.keys(renderers).filter(
    (name) => name !== debugRendererName.toLowerCase(),
  );
  setTooltip(
    folder.add(guiState, 'renderer', publicRenderers).onChange((value) => {
      guiState.renderer = value;
      registerDebugRendererFromName(value);
      onChange('renderer', guiState.debugEnabled ? debugRendererName : value);
    }),
    'The renderer used by Blockly.',
  );
}

/**
 * Populate the toolbox option.
 * @param {dat.GUI} folder The dat.GUI folder.
 * @param {Object} guiState The GUI state.
 * @param {Object<string,Blockly.utils.toolbox.ToolboxDefinition>} toolboxes The
 *     registered toolboxes.
 * @param {string} defaultToolboxName The default toolbox name.
 * @param {function(string, *):void} onChange On Change method.
 */
function populateToolboxOption(
  folder,
  guiState,
  toolboxes,
  defaultToolboxName,
  onChange,
) {
  setTooltip(
    folder
      .add(guiState, 'toolboxName')
      .options(Object.keys(toolboxes))
      .name('toolbox')
      .onChange((value) => {
        guiState.toolboxName = value;
        onChange('toolbox', toolboxes[value]);
      }),
    'The toolbox used by Blockly.',
  );
  if (guiState.toolboxName !== defaultToolboxName) {
    openFolderIfOptionSelected(folder, guiState, guiState.options, ['toolbox']);
  }
}

/**
 * Populate the toolbox sides option.
 * @param {dat.GUI} folder The dat.GUI folder.
 * @param {Blockly.Options} options Blockly options.
 * @param {Blockly.BlocklyOptions} saveOptions Saved Blockly options.
 * @param {Object} guiState GUI state.
 * @param {function():void} onChangeInternal Internal on change method.
 */
function populateToolboxSidesOption(
  folder,
  options,
  saveOptions,
  guiState,
  onChangeInternal,
) {
  const toolboxSides = {top: 0, bottom: 1, left: 2, right: 3};
  setTooltip(
    folder
      .add(options, 'toolboxPosition', toolboxSides)
      .name('toolboxPosition')
      .onChange((value) => {
        const side = Object.keys(toolboxSides).find(
          (key) => toolboxSides[key] == value,
        );
        saveOptions['horizontalLayout'] = side == 'top' || side == 'bottom';
        saveOptions['toolboxPosition'] =
          side == 'top' || side == 'left' ? 'start' : 'end';
        guiState.options['toolboxPosition'] = saveOptions['toolboxPosition'];
        guiState.options['horizontalLayout'] = saveOptions['horizontalLayout'];
        onChangeInternal();
      }),
    'The toolbox position.',
  );
}

/**
 * Get the list of Blockly themes.
 * @param {Blockly.BlocklyOptions} defaultOptions Default Blockly options.
 * @returns {Object<string,Blockly.Theme>} The list of registered themes.
 */
function getThemes(defaultOptions) {
  let themes;
  if (Blockly.registry && Blockly.registry.getAllItems('theme')) {
    // Using a version of Blockly that registers themes.
    themes = Blockly.registry.getAllItems('theme');
  } else {
    // Fall back to a pre-set list of themes.
    themes = {
      classic: Blockly.Themes.Classic,
      dark: darkTheme,
      deuteranopia: deuteranopiaTheme,
      tritanopia: themeTritanopia,
      highcontrast: highContrastTheme,
    };
    if (defaultOptions.theme) {
      themes[/** @type {!Blockly.Theme} */ (defaultOptions.theme).name] =
        defaultOptions.theme;
    }
  }
  return themes;
}

/**
 * Populate the theme option.
 * @param {dat.GUI} folder The dat.GUI folder.
 * @param {Object} guiState The GUI state.
 * @param {Object<string,Blockly.Theme>} themes The list of
 *     themes.
 * @param {string} defaultThemeName Default Theme name.
 * @param {function(string, *):void} onChange On Change method.
 */
function populateThemeOption(
  folder,
  guiState,
  themes,
  defaultThemeName,
  onChange,
) {
  setTooltip(
    folder
      .add(guiState, 'themeName')
      .options(Object.keys(themes))
      .name('theme')
      .onChange((value) => {
        guiState.themeName = value;
        onChange('theme', themes[value]);
      }),
    'The theme used by Blockly.',
  );
  if (guiState.themeName !== defaultThemeName) {
    openFolderIfOptionSelected(folder, guiState, guiState.options, ['theme']);
  }
}

/**
 * Populate move options.
 * @param {dat.GUI} moveFolder The dat.GUI move options folder.
 * @param {Blockly.Options} options Blockly options.
 * @param {Blockly.BlocklyOptions} saveOptions Saved Blockly options.
 * @param {function(string, *):void} onChange On Change method.
 */
function populateMoveOptions(moveFolder, options, saveOptions, onChange) {
  setTooltip(
    moveFolder.add(options.moveOptions, 'scrollbars').onChange((value) =>
      onChange('move', {
        ...saveOptions.move,
        scrollbars: value,
      }),
    ),
    'True if the workspace has scrollbars.',
  );
  setTooltip(
    moveFolder.add(options.moveOptions, 'wheel').onChange((value) =>
      onChange('move', {
        ...saveOptions.move,
        wheel: value,
      }),
    ),
    'True if the workspace can be scrolled with the mouse wheel.',
  );
  setTooltip(
    moveFolder.add(options.moveOptions, 'drag').onChange((value) =>
      onChange('move', {
        ...saveOptions.move,
        drag: value,
      }),
    ),
    'True if the workspace can be dragged with the mouse.',
  );
}

/**
 * Populate zoom options.
 * @param {dat.GUI} zoomFolder The dat.GUI zoom options folder.
 * @param {Blockly.Options} options Blockly options.
 * @param {Blockly.BlocklyOptions} saveOptions Saved Blockly options.
 * @param {function(string, *):void} onChange On Change method.
 */
function populateZoomOptions(zoomFolder, options, saveOptions, onChange) {
  setTooltip(
    zoomFolder.add(options.zoomOptions, 'controls').onChange((value) =>
      onChange('zoom', {
        ...saveOptions.zoom,
        controls: value,
      }),
    ),
    'Set to true to show zoom-centre, zoom-in, and zoom-out buttons.',
  );
  setTooltip(
    zoomFolder.add(options.zoomOptions, 'wheel').onChange((value) =>
      onChange('zoom', {
        ...saveOptions.zoom,
        wheel: value,
      }),
    ),
    'Set to true to allow the mouse wheel to zoom.',
  );
  setTooltip(
    zoomFolder
      .add(options.zoomOptions, 'startScale', 0.1, 4)
      .onChange((value) =>
        onChange('zoom', {
          ...saveOptions.zoom,
          startScale: value,
        }),
      ),
    'Initial magnification factor. For applications with multiple levels,' +
      ' startScale is often set to a higher value on the first level, then' +
      ' incrementally decreased as subsequent levels become more complex.',
  );
  setTooltip(
    zoomFolder
      .add(options.zoomOptions, 'maxScale', 1, 20)
      .onChange((value) =>
        onChange('zoom', {
          ...saveOptions.zoom,
          maxScale: value,
        }),
      )
      .step(1),
    'Maximum multiplication factor for how far one can zoom in.',
  );
  setTooltip(
    zoomFolder
      .add(options.zoomOptions, 'minScale', 0.1, 1)
      .onChange((value) =>
        onChange('zoom', {
          ...saveOptions.zoom,
          minScale: value,
        }),
      )
      .step(0.05),
    'Minimum multiplication factor for how far one can zoom out.',
  );
}

/**
 * Populate grid options.
 * @param {dat.GUI} gridFolder The dat.GUI grid options folder.
 * @param {Blockly.Options} options Blockly options.
 * @param {Blockly.BlocklyOptions} saveOptions Saved Blockly options.
 * @param {function(string, *):void} onChange On Change method.
 */
function populateGridOptions(gridFolder, options, saveOptions, onChange) {
  setTooltip(
    gridFolder.add(options.gridOptions, 'spacing', 0, 50).onChange((value) =>
      onChange('grid', {
        ...saveOptions.grid,
        spacing: value,
      }),
    ),
    `The distance between the grid's points.`,
  );
  setTooltip(
    gridFolder.add(options.gridOptions, 'length', 0, 30).onChange((value) =>
      onChange('grid', {
        ...saveOptions.grid,
        length: value,
      }),
    ),
    'The shape of the grid points. A length of 0 results in an invisible' +
      ' grid (but still one that may be snapped to), a length of 1 (the' +
      ' default value) results in dots, a longer length results in crosses, ' +
      'and a length equal or greater than the spacing results in graph paper.',
  );
  setTooltip(
    gridFolder.addColor(options.gridOptions, 'colour').onChange((value) =>
      onChange('grid', {
        ...saveOptions.grid,
        colour: value,
      }),
    ),
    'The colour of the grid points.',
  );
  setTooltip(
    gridFolder.add(options.gridOptions, 'snap').onChange((value) =>
      onChange('grid', {
        ...saveOptions.grid,
        snap: value,
      }),
    ),
    'Whether blocks should snap to the nearest grid point when placed on' +
      ' the workspace.',
  );
}

/**
 * Set a tooltip on a GUI folder or controller.
 * @param {dat.GUI|dat.GUIController} controller GUI folder or controller.
 * @param {string} tooltip Tooltip string.
 */
function setTooltip(controller, tooltip) {
  const parentElement = controller.domElement.parentElement;
  parentElement.setAttribute('title', tooltip);
}

/**
 * Initialize debug renderer.
 * @param {!Object} guiState The GUI State.
 * @param {boolean=} reset Whether or not to reset the renderer config.
 */
function initDebugRenderer(guiState, reset) {
  const guiDebugState = guiState.debug;
  registerDebugRendererFromName(guiState.renderer);
  Object.keys(DebugDrawer.config).map((key) => {
    if (guiDebugState[key] == undefined || reset) {
      guiDebugState[key] = false;
    }
    DebugDrawer.config[key] = guiDebugState[key];
  });

  if (reset) {
    guiState.debugEnabled = false;
  }
}

/**
 * Populate the parent folder that holds the debug enabled button and the
 * folder with all the debug options in it. When debug is enabled it should
 * open the folder holding all the debug options.
 * @param {dat.GUIController} debugController The GUI controller.
 * @param {dat.GUI} debugOptionsFolder The folder that holds all the debug
 *     options.
 * @param {Object} guiState The GUI State.
 * @param {function(string, *):void} onChange On Change method.
 */
function populateDebugFolder(
  debugController,
  debugOptionsFolder,
  guiState,
  onChange,
) {
  updateDebugFolder(debugOptionsFolder, guiState.debugEnabled);

  debugController.onChange((value) => {
    guiState.debugEnabled = value;
    onChange('renderer', value ? debugRendererName : guiState.renderer);
    updateDebugFolder(debugOptionsFolder, guiState.debugEnabled);
  });
}

/**
 * Updates the debug folder to be hidden/displayed based on whether the
 * rendering debugger is enabled.
 * @param {dat.GUI} folder The folder that holds all the debug
 *     options.
 * @param {boolean} isEnabled True if the debugger is enabled, false otherwise.
 */
function updateDebugFolder(folder, isEnabled) {
  if (isEnabled) {
    folder.show();
    folder.open();
  } else {
    folder.hide();
  }
}

/**
 * Populates the folder holding all the debug renderer options.
 * @param {dat.GUI} debugOptionsFolder The folder that holds all the debug
 *     options.
 * @param {Object} guiState The GUI State.
 * @param {function():void} onChangeInternal Internal on change method.
 */
function populateDebugOptionsFolder(
  debugOptionsFolder,
  guiState,
  onChangeInternal,
) {
  const debugState = guiState.debug;
  Object.keys(DebugDrawer.config).map((key) => {
    debugOptionsFolder.add(debugState, key, 0, 50).onChange((value) => {
      debugState[key] = value;
      DebugDrawer.config[key] = debugState[key];
      onChangeInternal();
    });
  });
}

/**
 * Add default actions to the GUI instance.
 * @param {?} gui The GUI instance.
 * @param {!Blockly.WorkspaceSvg} workspace The Blockly workspace.
 */
function addActions(gui, workspace) {
  // Visibility actions.
  gui.addAction(
    'Show',
    (workspace) => {
      workspace.setVisible(true);
    },
    'Visibility',
    'Show the workspace.',
  );
  gui.addAction(
    'Hide',
    (workspace) => {
      workspace.setVisible(false);
    },
    'Visibility',
    'Hide the workspace.',
  );

  // Block actions.
  gui.addAction(
    'Clear',
    (workspace) => {
      workspace.clear();
    },
    'Blocks',
    'Clear all the blocks from the workspace.',
  );
  gui.addAction(
    'Format',
    (workspace) => {
      workspace.cleanUp();
    },
    'Blocks',
    'Format the blocks on the workspace.',
  );

  // Undo/Redo actions.
  gui.addAction(
    'Undo',
    (workspace) => {
      workspace.undo();
    },
    'Undo/Redo',
    'Undo last action.',
  );
  gui.addAction(
    'Redo',
    (workspace) => {
      workspace.undo(true);
    },
    'Undo/Redo',
    'Redo last action.',
  );
  gui.addAction(
    'Clear Undo Stack',
    (workspace) => {
      workspace.clearUndo();
    },
    'Undo/Redo',
    'Clear the undo stack.',
  );

  // Scale actions.
  gui.addAction(
    'Zoom reset',
    (workspace) => {
      workspace.setScale(workspace.options.zoomOptions.startScale);
      workspace.scrollCenter();
    },
    'Scale',
    'Reset zoom.',
  );
  gui.addAction(
    'Zoom center',
    (workspace) => {
      workspace.scrollCenter();
    },
    'Scale',
    'Center the workspace.',
  );
  gui.addAction(
    'Zoom to Fit',
    (workspace) => {
      workspace.zoomToFit();
    },
    'Scale',
    'Zoom the blocks to fit in the workspace if possible.',
  );

  // Stress Test.
  gui.addAction(
    'Random Blocks',
    (workspace) => {
      populateRandom(workspace, 100);
    },
    'Stress Test',
    'Populate the workspace with a random set of blocks, for testing.',
  );
  gui.addAction(
    'Spaghetti!',
    (workspace) => {
      spaghetti(workspace, 8);
    },
    'Stress Test',
    'Populate the workspace with nested if-statement blocks, for testing.',
  );

  // Logging.
  gui.addCheckboxAction(
    'Log Events',
    function (workspace, value) {
      if (value) {
        enableLogger(workspace);
      } else {
        disableLogger(workspace);
      }
    },
    'Logging',
    false,
    'Toggle console logging of workspace events.',
  );
  gui.addCheckboxAction(
    'Log Flyout Events',
    function (workspace, value) {
      if (value) {
        if (workspace.getFlyout()) {
          enableLogger(workspace.getFlyout().getWorkspace());
        }
      } else {
        if (workspace.getFlyout()) {
          disableLogger(workspace.getFlyout().getWorkspace());
        }
      }
    },
    'Logging',
    false,
    'Toggle console logging of flyout events.',
  );
}
