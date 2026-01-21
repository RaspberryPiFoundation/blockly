/**
 * @license
 * Copyright 2016 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview FactoryUtils is a namespace that holds block starter code
 * generation functions shared by the Block Factory, Workspace Factory, and
 * Exporter applications within Blockly Factory. Holds functions to generate
 * block definitions and generator stubs and to create and download files.
 *
 * (Juan Carlos Orozco)
 */
'use strict';

/**
 * Namespace for FactoryUtils.
 */
var FactoryUtils = FactoryUtils || Object.create(null);

/**
 * Get block definition code for the current block.
 * @param {string} blockType Type of block.
 * @param {!Blockly.Block} rootBlock RootBlock from main workspace in which
 *    user uses Block Factory Blocks to create a custom block.
 * @param {string} format 'JSON' or 'JavaScript'.
 * @param {!Blockly.Workspace} workspace Where the root block lives.
 * @return {string} Block definition.
 */
FactoryUtils.getBlockDefinition = function(blockType, rootBlock, format, workspace) {
  blockType = FactoryUtils.cleanBlockType(blockType);
  switch (format) {
    case 'JSON':
      var code = FactoryUtils.formatJson_(blockType, rootBlock);
      break;
    case 'JavaScript':
      var code = FactoryUtils.formatJavaScript_(blockType, rootBlock, workspace);
      break;
  }
  return code;
};

/**
 * Convert invalid block name to a valid one. Replaces whitespace
 * and prepend names that start with a digit with an '_'.
 * @param {string} blockType Type of block.
 * @return {string} Cleaned up block type.
 */
FactoryUtils.cleanBlockType = function(blockType) {
  if (!blockType) {
    return '';
  }
  return blockType.replace(/\W/g, '_').replace(/^(\d)/, '_$1');
};

/**
 * Get the generator code for a given block.
 * @param {!Blockly.Block} block Rendered block in preview workspace.
 * @param {string} generatorLanguage 'JavaScript', 'Python', 'PHP', 'Lua',
 *     or 'Dart'.
 * @return {string} Generator code for multiple blocks.
 */
FactoryUtils.getGeneratorStub = function(block, generatorLanguage) {
  // Build factory blocks from block
  if (BlockFactory.updateBlocksFlag) {  // TODO: Move this to updatePreview()
    BlockFactory.mainWorkspace.clear();
    var xml = BlockDefinitionExtractor.buildBlockFactoryWorkspace(block);
    Blockly.Xml.domToWorkspace(xml, BlockFactory.mainWorkspace);
    // Calculate timer to avoid infinite update loops
    // TODO(#1267): Remove the global variables and any infinite loops.
    BlockFactory.updateBlocksFlag = false;
    setTimeout(
        function() {BlockFactory.updateBlocksFlagDelayed = false;}, 3000);
  }
  BlockFactory.lastUpdatedBlock = block; // Variable to share the block value.

  function makeVar(root, name) {
    name = name.toLowerCase().replace(/\W/g, '_');
    return '  var ' + root + '_' + name;
  }
  // The makevar function lives in the original update generator.
  var language = generatorLanguage.toLowerCase();
  var code = [];
  code.push(`${language}.${language}Generator.forBlock['${block.type}'] = ` +
            'function(block, generator) {');

  // Generate getters for any fields or inputs.
  for (var i = 0, input; input = block.inputList[i]; i++) {
    for (var j = 0, field; field = input.fieldRow[j]; j++) {
      var name = field.name;
      if (!name) {
        continue;
      }
      if (field instanceof Blockly.FieldVariable) {
        // FieldVariable is subclass of FieldDropdown; must test first.
        code.push(`${makeVar('variable', name)} = ` +
                  `generator.nameDB_.getName(block.getFieldValue('${name}'), ` +
                  `Blockly.Variables.NAME_TYPE);`);
      } else if (field instanceof Blockly.FieldCheckbox) {
        code.push(`${makeVar('checkbox', name)} = ` +
                  `block.getFieldValue('${name}') === 'TRUE';`);
      } else {
        let prefix =
            // Angle is subclass of FieldTextInput; must test first.
            field instanceof Blockly.FieldAngle ? 'angle' :
            field instanceof Blockly.FieldColour ? 'colour' :
            field instanceof Blockly.FieldDropdown ? 'dropdown' :
            field instanceof Blockly.FieldNumber ? 'number' :
            field instanceof Blockly.FieldTextInput ? 'text' :
            'field';  // Default if subclass not found.
        code.push(`${makeVar(prefix, name)} = block.getFieldValue('${name}');`);
      }
    }
    var name = input.name;
    if (name) {
      if (input.type === Blockly.INPUT_VALUE) {
        code.push(`${makeVar('value', name)} = ` +
                  `generator.valueToCode(block, '${name}', ` +
                  `${language}.Order.ATOMIC);`);
      } else if (input.type === Blockly.NEXT_STATEMENT) {
        code.push(`${makeVar('statements', name)} = ` +
                  `generator.statementToCode(block, '${name}');`);
      }
    }
  }
  // Most languages end lines with a semicolon.  Python & Lua do not.
  var lineEnd = {
    'JavaScript': ';',
    'Python': '',
    'PHP': ';',
    'Lua': '',
    'Dart': ';'
  };
  code.push("  // TODO: Assemble " + language + " into code variable.");
  if (block.outputConnection) {
    code.push("  var code = '...';");
    code.push("  // TODO: Change ORDER_NONE to the correct strength.");
    code.push("  return [code, Blockly." + language + ".ORDER_NONE];");
  } else {
    code.push("  var code = '..." + (lineEnd[language] || '') + "\\n';");
    code.push("  return code;");
  }
  code.push("};");

  return code.join('\n');
};

/**
 * Update the language code as JSON.
 * @param {string} blockType Name of block.
 * @param {!Blockly.Block} rootBlock Factory_base block.
 * @return {string} Generated language code.
 * @private
 */
FactoryUtils.formatJson_ = function(blockType, rootBlock) {
  var JS = {};
  // Type is not used by Blockly, but may be used by a loader.
  JS.type = blockType;
  // Generate inputs.
  var message = [];
  var args = [];
  var contentsBlock = rootBlock.getInputTargetBlock('INPUTS');
  var lastInput = null;
  while (contentsBlock) {
    if (contentsBlock.isEnabled() && !contentsBlock.getInheritedDisabled()) {
      var fields = FactoryUtils.getFieldsJson_(
          contentsBlock.getInputTargetBlock('FIELDS'));
      for (var i = 0; i < fields.length; i++) {
        if (typeof fields[i] === 'string') {
          message.push(fields[i].replace(/%/g, '%%'));
        } else {
          args.push(fields[i]);
          message.push('%' + args.length);
        }
      }

      var input = {type: contentsBlock.type};
      // Dummy inputs don't have names.  Other inputs do.
      if (contentsBlock.type !== 'input_dummy' &&
          contentsBlock.type !== 'input_end_row') {
        input.name = contentsBlock.getFieldValue('INPUTNAME');
      }
      var check = JSON.parse(
          FactoryUtils.getOptTypesFrom(contentsBlock, 'TYPE') || 'null');
      if (check) {
        input.check = check;
      }
      var align = contentsBlock.getFieldValue('ALIGN');
      if (align !== 'LEFT') {
        input.align = align;
      }
      args.push(input);
      message.push('%' + args.length);
      lastInput = contentsBlock;
    }
    contentsBlock = contentsBlock.nextConnection &&
        contentsBlock.nextConnection.targetBlock();
  }
  // Remove last input if dummy and not empty.
  if (lastInput && lastInput.type === 'input_dummy') {
    var fields = lastInput.getInputTargetBlock('FIELDS');
    if (fields && FactoryUtils.getFieldsJson_(fields).join('').trim() !== '') {
      var align = lastInput.getFieldValue('ALIGN');
      if (align !== 'LEFT') {
        JS.implicitAlign0 = align;
      }
      args.pop();
      message.pop();
    }
  }
  JS.message0 = message.join(' ');
  if (args.length) {
    JS.args0 = args;
  }
  // Generate inline/external switch.
  if (rootBlock.getFieldValue('INLINE') === 'EXT') {
    JS.inputsInline = false;
  } else if (rootBlock.getFieldValue('INLINE') === 'INT') {
    JS.inputsInline = true;
  }
  // Generate output, or next/previous connections.
  switch (rootBlock.getFieldValue('CONNECTIONS')) {
    case 'LEFT':
      JS.output =
          JSON.parse(
              FactoryUtils.getOptTypesFrom(rootBlock, 'OUTPUTTYPE') || 'null');
      break;
    case 'BOTH':
      JS.previousStatement =
          JSON.parse(
              FactoryUtils.getOptTypesFrom(rootBlock, 'TOPTYPE') || 'null');
      JS.nextStatement =
          JSON.parse(
              FactoryUtils.getOptTypesFrom(rootBlock, 'BOTTOMTYPE') || 'null');
      break;
    case 'TOP':
      JS.previousStatement =
          JSON.parse(
              FactoryUtils.getOptTypesFrom(rootBlock, 'TOPTYPE') || 'null');
      break;
    case 'BOTTOM':
      JS.nextStatement =
          JSON.parse(
              FactoryUtils.getOptTypesFrom(rootBlock, 'BOTTOMTYPE') || 'null');
      break;
  }
  // Generate colour.
  var colourBlock = rootBlock.getInputTargetBlock('COLOUR');
  if (colourBlock && colourBlock.isEnabled()) {
    var hue = parseInt(colourBlock.getFieldValue('HUE'), 10);
    JS.colour = hue;
  }

  JS.tooltip = FactoryUtils.getTooltipFromRootBlock_(rootBlock);
  JS.helpUrl = FactoryUtils.getHelpUrlFromRootBlock_(rootBlock);

  return JSON.stringify(JS, null, '  ');
};

/**
 * Update the language code as JavaScript.
 * @param {string} blockType Name of block.
 * @param {!Blockly.Block} rootBlock Factory_base block.
 * @param {!Blockly.Workspace} workspace Where the root block lives.
 * @return {string} Generated language code.
 * @private
 */
FactoryUtils.formatJavaScript_ = function(blockType, rootBlock, workspace) {
  var code = [];
  code.push("Blockly.Blocks['" + blockType + "'] = {");
  code.push("  init: function() {");
  // Generate inputs.
  var TYPES = {'input_value': 'appendValueInput',
               'input_statement': 'appendStatementInput',
               'input_dummy': 'appendDummyInput',
               'input_end_row': 'appendEndRowInput'};
  var contentsBlock = rootBlock.getInputTargetBlock('INPUTS');
  while (contentsBlock) {
    if (contentsBlock.isEnabled() && !contentsBlock.getInheritedDisabled()) {
      var name = '';
      // Dummy inputs don't have names.  Other inputs do.
      if (contentsBlock.type !== 'input_dummy' &&
          contentsBlock.type !== 'input_end_row') {
        name =
            JSON.stringify(contentsBlock.getFieldValue('INPUTNAME'));
      }
      code.push('    this.' + TYPES[contentsBlock.type] + '(' + name + ')');
      var check = FactoryUtils.getOptTypesFrom(contentsBlock, 'TYPE');
      if (check) {
        code.push('        .setCheck(' + check + ')');
      }
      var align = contentsBlock.getFieldValue('ALIGN');
      if (align !== 'LEFT') {
        code.push('        .setAlign(Blockly.ALIGN_' + align + ')');
      }
      var fields = FactoryUtils.getFieldsJs_(
          contentsBlock.getInputTargetBlock('FIELDS'));
      for (var i = 0; i < fields.length; i++) {
        code.push('        .appendField(' + fields[i] + ')');
      }
      // Add semicolon to last line to finish the statement.
      code[code.length - 1] += ';';
    }
    contentsBlock = contentsBlock.nextConnection &&
        contentsBlock.nextConnection.targetBlock();
  }
  // Generate inline/external switch.
  if (rootBlock.getFieldValue('INLINE') === 'EXT') {
    code.push('    this.setInputsInline(false);');
  } else if (rootBlock.getFieldValue('INLINE') === 'INT') {
    code.push('    this.setInputsInline(true);');
  }
  // Generate output, or next/previous connections.
  switch (rootBlock.getFieldValue('CONNECTIONS')) {
    case 'LEFT':
      code.push(FactoryUtils.connectionLineJs_('setOutput', 'OUTPUTTYPE', workspace));
      break;
    case 'BOTH':
      code.push(
          FactoryUtils.connectionLineJs_('setPreviousStatement', 'TOPTYPE', workspace));
      code.push(
          FactoryUtils.connectionLineJs_('setNextStatement', 'BOTTOMTYPE', workspace));
      break;
    case 'TOP':
      code.push(
          FactoryUtils.connectionLineJs_('setPreviousStatement', 'TOPTYPE', workspace));
      break;
    case 'BOTTOM':
      code.push(
          FactoryUtils.connectionLineJs_('setNextStatement', 'BOTTOMTYPE', workspace));
      break;
  }
  // Generate colour.
  var colourBlock = rootBlock.getInputTargetBlock('COLOUR');
  if (colourBlock && colourBlock.isEnabled()) {
    var hue = parseInt(colourBlock.getFieldValue('HUE'), 10);
    if (!isNaN(hue)) {
      code.push('    this.setColour(' + hue + ');');
    }
  }

  var tooltip = FactoryUtils.getTooltipFromRootBlock_(rootBlock);
  var helpUrl = FactoryUtils.getHelpUrlFromRootBlock_(rootBlock);
  code.push(' this.setTooltip(' + JSON.stringify(tooltip) + ');');
  code.push(' this.setHelpUrl(' + JSON.stringify(helpUrl) + ');');
  code.push('  }');
  code.push('};');
  return code.join('\n');
};

/**
 * Create JS code required to create a top, bottom, or value connection.
 * @param {string} functionName JavaScript function name.
 * @param {string} typeName Name of type input.
 * @param {!Blockly.Workspace} workspace Where the root block lives.
 * @return {string} Line of JavaScript code to create connection.
 * @private
 */
FactoryUtils.connectionLineJs_ = function(functionName, typeName, workspace) {
  var type = FactoryUtils.getOptTypesFrom(
      FactoryUtils.getRootBlock(workspace), typeName);
  if (type) {
    type = ', ' + type;
  } else {
    type = '';
  }
  return '    this.' + functionName + '(true' + type + ');';
};

/**
 * Returns field strings and any config.
 * @param {!Blockly.Block} block Input block.
 * @return {!Array<string>} Field strings.
 * @private
 */
FactoryUtils.getFieldsJs_ = function(block) {
  var fields = [];
  while (block) {
    if (block.isEnabled() && !block.getInheritedDisabled()) {
      switch (block.type) {
        case 'field_static':
          // Result: 'hello'
          fields.push(JSON.stringify(block.getFieldValue('TEXT')));
          break;
        case 'field_label_serializable':
          // Result: new Blockly.FieldLabelSerializable('Hello'), 'GREET'
          fields.push('new Blockly.FieldLabelSerializable(' +
              JSON.stringify(block.getFieldValue('TEXT')) + '), ' +
              JSON.stringify(block.getFieldValue('FIELDNAME')));
          break;
        case 'field_input':
          // Result: new Blockly.FieldTextInput('Hello'), 'GREET'
          fields.push('new Blockly.FieldTextInput(' +
              JSON.stringify(block.getFieldValue('TEXT')) + '), ' +
              JSON.stringify(block.getFieldValue('FIELDNAME')));
          break;
        case 'field_number':
          // Result: new Blockly.FieldNumber(10, 0, 100, 1), 'NUMBER'
          var args = [
            Number(block.getFieldValue('VALUE')),
            Number(block.getFieldValue('MIN')),
            Number(block.getFieldValue('MAX')),
            Number(block.getFieldValue('PRECISION'))
          ];
          // Remove any trailing arguments that aren't needed.
          if (args[3] === 0) {
            args.pop();
            if (args[2] === Infinity) {
              args.pop();
              if (args[1] === -Infinity) {
                args.pop();
              }
            }
          }
          fields.push('new Blockly.FieldNumber(' + args.join(', ') + '), ' +
              JSON.stringify(block.getFieldValue('FIELDNAME')));
          break;
        case 'field_angle':
          // Result: new Blockly.FieldAngle(90), 'ANGLE'
          fields.push('new Blockly.FieldAngle(' +
              Number(block.getFieldValue('ANGLE')) + '), ' +
              JSON.stringify(block.getFieldValue('FIELDNAME')));
          break;
        case 'field_checkbox':
          // Result: new Blockly.FieldCheckbox('TRUE'), 'CHECK'
          fields.push('new Blockly.FieldCheckbox(' +
              JSON.stringify(block.getFieldValue('CHECKED')) +
               '), ' +
              JSON.stringify(block.getFieldValue('FIELDNAME')));
          break;
        case 'field_colour':
          // Result: new Blockly.FieldColour('#ff0000'), 'COLOUR'
          fields.push('new Blockly.FieldColour(' +
              JSON.stringify(block.getFieldValue('COLOUR')) +
              '), ' +
              JSON.stringify(block.getFieldValue('FIELDNAME')));
          break;
        case 'field_variable':
          // Result: new Blockly.FieldVariable('item'), 'VAR'
          var varname
              = JSON.stringify(block.getFieldValue('TEXT') || null);
          fields.push('new Blockly.FieldVariable(' + varname + '), ' +
              JSON.stringify(block.getFieldValue('FIELDNAME')));
          break;
        case 'field_dropdown':
          // Result:
          // new Blockly.FieldDropdown([['yes', '1'], ['no', '0']]), 'TOGGLE'
          var options = [];
          for (var i = 0; i < block.optionList_.length; i++) {
            options[i] = JSON.stringify([block.getUserData(i),
                                         block.getFieldValue('CPU' + i)]);
          }
          if (options.length) {
            fields.push('new Blockly.FieldDropdown([' +
                options.join(', ') + ']), ' +
                JSON.stringify(block.getFieldValue('FIELDNAME')));
          }
          break;
        case 'field_image':
          // Result: new Blockly.FieldImage('http://...', 80, 60, '*')
          var src = JSON.stringify(block.getFieldValue('SRC'));
          var width = Number(block.getFieldValue('WIDTH'));
          var height = Number(block.getFieldValue('HEIGHT'));
          var alt = JSON.stringify(block.getFieldValue('ALT'));
          var flipRtl = JSON.stringify(block.getFieldValue('FLIP_RTL'));
          fields.push('new Blockly.FieldImage(' +
              src + ', ' + width + ', ' + height +
              ', { alt: ' + alt + ', flipRtl: ' + flipRtl + ' })');
          break;
      }
    }
    block = block.nextConnection && block.nextConnection.targetBlock();
  }
  return fields;
};

/**
 * Returns field strings and any config.
 * @param {!Blockly.Block} block Input block.
 * @return {!Array<string|!Object>} Array of static text and field configs.
 * @private
 */
FactoryUtils.getFieldsJson_ = function(block) {
  var fields = [];
  while (block) {
    if (block.isEnabled() && !block.getInheritedDisabled()) {
      switch (block.type) {
        case 'field_static':
          // Result: 'hello'
          fields.push(block.getFieldValue('TEXT'));
          break;
        case 'field_label_serializable':
          fields.push({
            type: block.type,
            name: block.getFieldValue('FIELDNAME'),
            text: block.getFieldValue('TEXT')
          });
          break;
        case 'field_input':
          fields.push({
            type: block.type,
            name: block.getFieldValue('FIELDNAME'),
            text: block.getFieldValue('TEXT')
          });
          break;
        case 'field_number':
          var obj = {
            type: block.type,
            name: block.getFieldValue('FIELDNAME'),
            value: Number(block.getFieldValue('VALUE'))
          };
          var min = Number(block.getFieldValue('MIN'));
          if (min > -Infinity) {
            obj.min = min;
          }
          var max = Number(block.getFieldValue('MAX'));
          if (max < Infinity) {
            obj.max = max;
          }
          var precision = Number(block.getFieldValue('PRECISION'));
          if (precision) {
            obj.precision = precision;
          }
          fields.push(obj);
          break;
        case 'field_angle':
          fields.push({
            type: block.type,
            name: block.getFieldValue('FIELDNAME'),
            angle: Number(block.getFieldValue('ANGLE'))
          });
          break;
        case 'field_checkbox':
          fields.push({
            type: block.type,
            name: block.getFieldValue('FIELDNAME'),
            checked: block.getFieldValue('CHECKED') === 'TRUE'
          });
          break;
        case 'field_colour':
          fields.push({
            type: block.type,
            name: block.getFieldValue('FIELDNAME'),
            colour: block.getFieldValue('COLOUR')
          });
          break;
        case 'field_variable':
          fields.push({
            type: block.type,
            name: block.getFieldValue('FIELDNAME'),
            variable: block.getFieldValue('TEXT') || null
          });
          break;
        case 'field_dropdown':
          var options = [];
          for (var i = 0; i < block.optionList_.length; i++) {
            options[i] = [block.getUserData(i),
                block.getFieldValue('CPU' + i)];
          }
          if (options.length) {
            fields.push({
              type: block.type,
              name: block.getFieldValue('FIELDNAME'),
              options: options
            });
          }
          break;
        case 'field_image':
          fields.push({
            type: block.type,
            src: block.getFieldValue('SRC'),
            width: Number(block.getFieldValue('WIDTH')),
            height: Number(block.getFieldValue('HEIGHT')),
            alt: block.getFieldValue('ALT'),
            flipRtl: block.getFieldValue('FLIP_RTL') === 'TRUE'
          });
          break;
      }
    }
    block = block.nextConnection && block.nextConnection.targetBlock();
  }
  return fields;
};

/**
 * Fetch the type(s) defined in the given input.
 * Format as a string for appending to the generated code.
 * @param {!Blockly.Block} block Block with input.
 * @param {string} name Name of the input.
 * @return {?string} String defining the types.
 */
FactoryUtils.getOptTypesFrom = function(block, name) {
  var types = FactoryUtils.getTypesFrom_(block, name);
  if (types.length === 0) {
    return undefined;
  } else if (types.includes('null')) {
    return 'null';
  } else if (types.length === 1) {
    return types[0];
  } else {
    return '[' + types.join(', ') + ']';
  }
};


/**
 * Fetch the type(s) defined in the given input.
 * @param {!Blockly.Block} block Block with input.
 * @param {string} name Name of the input.
 * @return {!Array<string>} List of types.
 * @private
 */
FactoryUtils.getTypesFrom_ = function(block, name) {
  var typeBlock = block.getInputTargetBlock(name);
  var types;
  if (!typeBlock || !typeBlock.isEnabled()) {
    types = [];
  } else if (typeBlock.type === 'type_other') {
    types = [JSON.stringify(typeBlock.getFieldValue('TYPE'))];
  } else if (typeBlock.type === 'type_group') {
    types = [];
    for (var n = 0; n < typeBlock.typeCount_; n++) {
      types = types.concat(FactoryUtils.getTypesFrom_(typeBlock, 'TYPE' + n));
    }
    // Remove duplicates.
    var hash = Object.create(null);
    for (var n = types.length - 1; n >= 0; n--) {
      if (hash[types[n]]) {
        types.splice(n, 1);
      }
      hash[types[n]] = true;
    }
  } else {
    types = [JSON.stringify(typeBlock.valueType)];
  }
  return types;
};

/**
 * Return the uneditable container block that everything else attaches to in
 * given workspace.
 * @param {!Blockly.Workspace} workspace Where the root block lives.
 * @return {Blockly.Block} Root block.
 */
FactoryUtils.getRootBlock = function(workspace) {
  var blocks = workspace.getTopBlocks(false);
  for (var i = 0, block; block = blocks[i]; i++) {
    if (block.type === 'factory_base') {
      return block;
    }
  }
  return null;
};

// TODO(quachtina96): Move hide, show, makeInvisible, and makeVisible to a new
// AppView namespace.

/**
 * Hides element so that it's invisible and doesn't take up space.
 * @param {string} elementID ID of element to hide.
 */
FactoryUtils.hide = function(elementID) {
  document.getElementById(elementID).style.display = 'none';
};

/**
 * Un-hides an element.
 * @param {string} elementID ID of element to hide.
 */
FactoryUtils.show = function(elementID) {
  document.getElementById(elementID).style.display = 'block';
};

/**
 * Hides element so that it's invisible but still takes up space.
 * @param {string} elementID ID of element to hide.
 */
FactoryUtils.makeInvisible = function(elementID) {
  document.getElementById(elementID).visibility = 'hidden';
};

/**
 * Makes element visible.
 * @param {string} elementID ID of element to hide.
 */
FactoryUtils.makeVisible = function(elementID) {
  document.getElementById(elementID).visibility = 'visible';
};

/**
 * Create a file with the given attributes and download it.
 * @param {string} contents The contents of the file.
 * @param {string} filename The name of the file to save to.
 * @param {string} fileType The type of the file to save.
 */
FactoryUtils.createAndDownloadFile = function(contents, filename, fileType) {
  var data = new Blob([contents], {type: 'text/' + fileType});
  var clickEvent = new MouseEvent("click", {
    "view": window,
    "bubbles": true,
    "cancelable": false
  });

  var a = document.createElement('a');
  a.href = window.URL.createObjectURL(data);
  a.download = filename;
  a.textContent = 'Download file!';
  a.dispatchEvent(clickEvent);
};

/**
 * Get Blockly Block by rendering pre-defined block in workspace.
 * @param {!Element} blockType Type of block that has already been defined.
 * @param {!Blockly.Workspace} workspace Workspace on which to render
 *    the block.
 * @return {!Blockly.Block} The Blockly.Block of desired type.
 */
FactoryUtils.getDefinedBlock = function(blockType, workspace) {
  workspace.clear();
  return workspace.newBlock(blockType);
};

/**
 * Parses a block definition get the type of the block it defines.
 * @param {string} blockDef A single block definition.
 * @return {string} Type of block defined by the given definition.
 */
FactoryUtils.getBlockTypeFromJsDefinition = function(blockDef) {
  var indexOfStartBracket = blockDef.indexOf('[\'');
  var indexOfEndBracket = blockDef.indexOf('\']');
  if (indexOfStartBracket !== -1 && indexOfEndBracket !== -1) {
    return blockDef.substring(indexOfStartBracket + 2, indexOfEndBracket);
  } else {
    throw Error('Could not parse block type out of JavaScript block ' +
        'definition. Brackets normally enclosing block type not found.');
  }
};

/**
 * Generates a category containing blocks of the specified block types.
 * @param {!Array<!Blockly.Block>} blocks Blocks to include in the category.
 * @param {string} categoryName Name to use for the generated category.
 * @return {!Element} Category XML containing the given block types.
 */
FactoryUtils.generateCategoryXml = function(blocks, categoryName) {
  // Create category DOM element.
  var categoryElement = Blockly.utils.xml.createElement('category');
  categoryElement.setAttribute('name', categoryName);

  // For each block, add block element to category.
  for (var i = 0, block; block = blocks[i]; i++) {

    // Get preview block XML.
    var blockXml = Blockly.Xml.blockToDom(block);
    blockXml.removeAttribute('id');

    // Add block to category and category to XML.
    categoryElement.appendChild(blockXml);
  }
  return categoryElement;
};

/**
 * Parses a string containing JavaScript block definition(s) to create an array
 * in which each element is a single block definition.
 * @param {string} blockDefsString JavaScript block definition(s).
 * @return {!Array<string>} Array of block definitions.
 */
FactoryUtils.parseJsBlockDefinitions = function(blockDefsString) {
  var blockDefArray = [];
  var defStart = blockDefsString.indexOf('Blockly.Blocks');

  while (blockDefsString.includes('Blockly.Blocks', defStart)) {
    var nextStart = blockDefsString.indexOf('Blockly.Blocks', defStart + 1);
    if (nextStart === -1) {
      // This is the last block definition.
      nextStart = blockDefsString.length;
    }
    var blockDef = blockDefsString.substring(defStart, nextStart);
    blockDefArray.push(blockDef);
    defStart = nextStart;
  }
  return blockDefArray;
};

/**
 * Parses a string containing JSON block definition(s) to create an array
 * in which each element is a single block definition. Expected input is
 * one or more block definitions in the form of concatenated, stringified
 * JSON objects.
 * @param {string} blockDefsString String containing JSON block
 *    definition(s).
 * @return {!Array<string>} Array of block definitions.
 */
FactoryUtils.parseJsonBlockDefinitions = function(blockDefsString) {
  var blockDefArray = [];
  var unbalancedBracketCount = 0;
  var defStart = 0;
  // Iterate through the blockDefs string. Keep track of whether brackets
  // are balanced.
  for (var i = 0; i < blockDefsString.length; i++) {
    var currentChar = blockDefsString[i];
    if (currentChar === '{') {
      unbalancedBracketCount++;
    }
    else if (currentChar === '}') {
      unbalancedBracketCount--;
      if (unbalancedBracketCount === 0 && i > 0) {
        // The brackets are balanced. We've got a complete block definition.
        var blockDef = blockDefsString.substring(defStart, i + 1);
        blockDefArray.push(blockDef);
        defStart = i + 1;
      }
    }
  }
  return blockDefArray;
};

/**
 * Define blocks from imported block definitions.
 * @param {string} blockDefsString Block definition(s).
 * @param {string} format Block definition format ('JSON' or 'JavaScript').
 * @return {!Array<!Element>} Array of block types defined.
 */
FactoryUtils.defineAndGetBlockTypes = function(blockDefsString, format) {
  var blockTypes = [];

  // Define blocks and get block types.
  if (format === 'JSON') {
    var blockDefArray = FactoryUtils.parseJsonBlockDefinitions(blockDefsString);

    // Populate array of blocktypes and define each block.
    for (var i = 0, blockDef; blockDef = blockDefArray[i]; i++) {
      var json = JSON.parse(blockDef);
      blockTypes.push(json.type);

      // Define the block.
      Blockly.Blocks[json.type] = {
        init: function() {
          this.jsonInit(json);
        }
      };
    }
  } else if (format === 'JavaScript') {
    var blockDefArray = FactoryUtils.parseJsBlockDefinitions(blockDefsString);

    // Populate array of block types.
    for (var i = 0, blockDef; blockDef = blockDefArray[i]; i++) {
      var blockType = FactoryUtils.getBlockTypeFromJsDefinition(blockDef);
      blockTypes.push(blockType);
    }

    // Define all blocks.
    eval(blockDefsString);
  }

  return blockTypes;
};

/**
 * Inject code into a pre tag, with syntax highlighting.
 * Safe from HTML/script injection.
 * @param {string} code Lines of code.
 * @param {string} id ID of <pre> element to inject into.
 */
FactoryUtils.injectCode = function(code, id) {
  var pre = document.getElementById(id);
  pre.textContent = code;
  // Remove the 'prettyprinted' class, so that Prettify will recalculate.
  pre.className = pre.className.replace('prettyprinted', '');
  PR.prettyPrint();
};

/**
 * Returns whether or not two blocks are the same based on their XML. Expects
 * XML with a single child node that is a factory_base block, the XML found on
 * Block Factory's main workspace.
 * @param {!Element} blockXml1 An XML element with a single child node that
 *    is a factory_base block.
 * @param {!Element} blockXml2 An XML element with a single child node that
 *    is a factory_base block.
 * @return {boolean} Whether or not two blocks are the same based on their XML.
 */
FactoryUtils.sameBlockXml = function(blockXml1, blockXml2) {
  // Each XML element should contain a single child element with a 'block' tag
  if (blockXml1.tagName.toLowerCase() !== 'xml' ||
      blockXml2.tagName.toLowerCase() !== 'xml') {
    throw Error('Expected two XML elements, received elements with tag ' +
        'names: ' + blockXml1.tagName + ' and ' + blockXml2.tagName + '.');
  }

  // Compare the block elements directly. The XML tags may include other meta
  // information we want to ignore.
  var blockElement1 = blockXml1.getElementsByTagName('block')[0];
  var blockElement2 = blockXml2.getElementsByTagName('block')[0];

  if (!(blockElement1 && blockElement2)) {
    throw Error('Could not get find block element in XML.');
  }

  var cleanBlockXml1 = FactoryUtils.cleanXml(blockElement1);
  var cleanBlockXml2 = FactoryUtils.cleanXml(blockElement2);

  var blockXmlText1 = Blockly.Xml.domToText(cleanBlockXml1);
  var blockXmlText2 = Blockly.Xml.domToText(cleanBlockXml2);

  // Strip white space.
  blockXmlText1 = blockXmlText1.replace(/\s+/g, '');
  blockXmlText2 = blockXmlText2.replace(/\s+/g, '');

  // Return whether or not changes have been saved.
  return blockXmlText1 === blockXmlText2;
};

/**
 * Strips the provided xml of any attributes that don't describe the
 * 'structure' of the blocks (i.e. block order, field values, etc).
 * @param {Node} xml The xml to clean.
 * @return {Node}
 */
FactoryUtils.cleanXml = function(xml) {
  var newXml = xml.cloneNode(true);
  var node = newXml;
  while (node) {
    // Things like text inside tags are still treated as nodes, but they
    // don't have attributes (or the removeAttribute function) so we can
    // skip removing attributes from them.
    if (node.removeAttribute) {
      node.removeAttribute('xmlns');
      node.removeAttribute('x');
      node.removeAttribute('y');
      node.removeAttribute('id');
    }

    // Try to go down the tree
    var nextNode = node.firstChild || node.nextSibling;
    // If we can't go down, try to go back up the tree.
    if (!nextNode) {
      nextNode = node.parentNode;
      while (nextNode) {
        // We are valid again!
        if (nextNode.nextSibling) {
          nextNode = nextNode.nextSibling;
          break;
        }
        // Try going up again. If parentNode is null that means we have
        // reached the top, and we will break out of both loops.
        nextNode = nextNode.parentNode;
      }
    }
    node = nextNode;
  }
  return newXml;
};

/**
 * Checks if a block has a variable field. Blocks with variable fields cannot
 * be shadow blocks.
 * @param {Blockly.Block} block The block to check if a variable field exists.
 * @return {boolean} True if the block has a variable field, false otherwise.
 */
FactoryUtils.hasVariableField = function(block) {
  if (!block) {
    return false;
  }
  return block.getVars().length > 0;
};

/**
 * Checks if a block is a procedures block. If procedures block names are
 * ever updated or expanded, this function should be updated as well (no
 * other known markers for procedure blocks beyond name).
 * @param {Blockly.Block} block The block to check.
 * @return {boolean} True if the block is a procedure block, false otherwise.
 */
FactoryUtils.isProcedureBlock = function(block) {
  return block &&
      (block.type === 'procedures_defnoreturn' ||
      block.type === 'procedures_defreturn' ||
      block.type === 'procedures_callnoreturn' ||
      block.type === 'procedures_callreturn' ||
      block.type === 'procedures_ifreturn');
};

/**
 * Returns whether or not a modified block's changes has been saved to the
 * Block Library.
 * TODO(quachtina96): move into the Block Factory Controller once made.
 * @param {!BlockLibraryController} blockLibraryController Block Library
 *    Controller storing custom blocks.
 * @return {boolean} True if all changes made to the block have been saved to
 *    the given Block Library.
 */
FactoryUtils.savedBlockChanges = function(blockLibraryController) {
  if (BlockFactory.isStarterBlock()) {
    return true;
  }
  var blockType = blockLibraryController.getCurrentBlockType();
  var currentXml = Blockly.Xml.workspaceToDom(BlockFactory.mainWorkspace);

  if (blockLibraryController.has(blockType)) {
    // Block is saved in block library.
    var savedXml = blockLibraryController.getBlockXml(blockType);
    return FactoryUtils.sameBlockXml(savedXml, currentXml);
  }
  return false;
};

/**
 * Given the root block of the factory, return the tooltip specified by the user
 * or the empty string if no tooltip is found.
 * @param {!Blockly.Block} rootBlock Factory_base block.
 * @return {string} The tooltip for the generated block, or the empty string.
 */
FactoryUtils.getTooltipFromRootBlock_ = function(rootBlock) {
  var tooltipBlock = rootBlock.getInputTargetBlock('TOOLTIP');
  if (tooltipBlock && tooltipBlock.isEnabled()) {
    return tooltipBlock.getFieldValue('TEXT');
  }
  return '';
};

/**
 * Given the root block of the factory, return the help url specified by the
 * user or the empty string if no tooltip is found.
 * @param {!Blockly.Block} rootBlock Factory_base block.
 * @return {string} The help url for the generated block, or the empty string.
 */
FactoryUtils.getHelpUrlFromRootBlock_ = function(rootBlock) {
  var helpUrlBlock = rootBlock.getInputTargetBlock('HELPURL');
  if (helpUrlBlock && helpUrlBlock.isEnabled()) {
    return helpUrlBlock.getFieldValue('TEXT');
  }
  return '';
};
