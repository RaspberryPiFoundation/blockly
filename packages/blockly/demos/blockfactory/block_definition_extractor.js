/**
 * Copyright 2017 Juan Carlos Orozco Arena
 * Apache License Version 2.0
 */

/**
 * @fileoverview
 * The BlockDefinitionExtractor is a class that generates a workspace DOM
 * suitable for the BlockFactory's block editor, derived from an example
 * Blockly.Block.
 *
 * <code>
 * var workspaceDom = new BlockDefinitionExtractor()
 *     .buildBlockFactoryWorkspace(exampleBlocklyBlock);
 * Blockly.Xml.domToWorkspace(workspaceDom, BlockFactory.mainWorkspace);
 * </code>
 *
 * The <code>exampleBlocklyBlock</code> is usually the block loaded into the
 * preview workspace after manually entering the block definition.
 */
'use strict';

/**
 * Namespace to contain all functions needed to extract block definition from
 * the block preview data structure.
 * @namespace
 */
var BlockDefinitionExtractor = BlockDefinitionExtractor || Object.create(null);

/**
 * Builds a BlockFactory workspace that reflects the block structure of the
 * example block.
 *
 * @param {!Blockly.Block} block The reference block from which the definition
 *     will be extracted.
 * @return {!Element} Returns the root workspace DOM <xml> for the block editor
 *     workspace.
 */
BlockDefinitionExtractor.buildBlockFactoryWorkspace = function(block) {
  var workspaceXml = Blockly.utils.xml.createElement('xml');
  workspaceXml.append(BlockDefinitionExtractor.factoryBase_(block, block.type));
  return workspaceXml;
};

/**
 * Helper function to create a new Element with the provided attributes and
 * inner text.
 *
 * @param {string} name New element tag name.
 * @param {!Object<string, string>=} opt_attrs Optional list of attributes.
 * @param {string=} opt_text Optional inner text.
 * @return {!Element} The newly created element.
 * @private
 */
BlockDefinitionExtractor.newDomElement_ = function(name, opt_attrs, opt_text) {
  // Avoid createDom(..)'s attributes argument for being too HTML specific.
  var elem = Blockly.utils.xml.createElement(name);
  if (opt_attrs) {
    for (var key in opt_attrs) {
      elem.setAttribute(key, opt_attrs[key]);
    }
  }
  if (opt_text) {
    elem.append(opt_text);
  }
  return elem;
};

/**
 * Creates an connection type constraint <block> Element representing the
 * requested type.
 *
 * @param {string} type Type name of desired connection constraint.
 * @return {!Element} The <block> representing the constraint type.
 * @private
 */
BlockDefinitionExtractor.buildBlockForType_ = function(type) {
  switch (type) {
    case 'Null':
      return BlockDefinitionExtractor.typeNull_();
    case 'Boolean':
      return BlockDefinitionExtractor.typeBoolean_();
    case 'Number':
      return BlockDefinitionExtractor.typeNumber_();
    case 'String':
      return BlockDefinitionExtractor.typeString_();
    case 'Array':
      return BlockDefinitionExtractor.typeList_();
    default:
      return BlockDefinitionExtractor.typeOther_(type);
  }
};

/**
 * Constructs a <block> element representing the type constraints of the
 * provided connection.
 *
 * @param {!Blockly.Connection} connection The connection with desired
 *     connection constraints.
 * @return {!Element} The root <block> element of the constraint definition.
 * @private
 */
BlockDefinitionExtractor.buildTypeConstraintBlockForConnection_ =
    function(connection)
{
  var typeBlock;
  if (connection.check_) {
    if (connection.check_.length < 1) {
      typeBlock = BlockDefinitionExtractor.typeNullShadow_();
    } else if (connection.check_.length === 1) {
      typeBlock = BlockDefinitionExtractor.buildBlockForType_(
          connection.check_[0]);
    } else if (connection.check_.length > 1) {
      typeBlock = BlockDefinitionExtractor.typeGroup_(connection.check_);
    }
  } else {
    typeBlock = BlockDefinitionExtractor.typeNullShadow_();
  }
  return typeBlock;
};

/**
 * Creates the root "factory_base" <block> element for the block definition.
 *
 * @param {!Blockly.Block} block The example block from which to extract the
 *     definition.
 * @param {string} name Block name.
 * @return {!Element} The factory_base block element.
 * @private
 */
BlockDefinitionExtractor.factoryBase_ = function(block, name) {
  BlockDefinitionExtractor.src = {root: block, current: block};
  var factoryBaseEl =
      BlockDefinitionExtractor.newDomElement_('block', {type: 'factory_base'});
  factoryBaseEl.append(BlockDefinitionExtractor.newDomElement_(
      'field', {name: 'NAME'}, name));
  factoryBaseEl.append(BlockDefinitionExtractor.buildInlineField_(block));

  BlockDefinitionExtractor.buildConnections_(block, factoryBaseEl);

  var inputsStatement = BlockDefinitionExtractor.newDomElement_(
      'statement', {name: 'INPUTS'});
  inputsStatement.append(BlockDefinitionExtractor.parseInputs_(block));
  factoryBaseEl.append(inputsStatement);

  var tooltipValue =
      BlockDefinitionExtractor.newDomElement_('value', {name: 'TOOLTIP'});
  tooltipValue.append(BlockDefinitionExtractor.text_(block.tooltip));
  factoryBaseEl.append(tooltipValue);

  var helpUrlValue =
      BlockDefinitionExtractor.newDomElement_('value', {name: 'HELPURL'});
  helpUrlValue.append(BlockDefinitionExtractor.text_(block.helpUrl));
  factoryBaseEl.append(helpUrlValue);

  // Convert colour_ to hue value 0-360 degrees
  var colour_hue = block.getHue();  // May be null if not set via hue.
  if (colour_hue) {
    var colourBlock = BlockDefinitionExtractor.colourBlockFromHue_(colour_hue);
    var colourInputValue =
        BlockDefinitionExtractor.newDomElement_('value', {name: 'COLOUR'});
    colourInputValue.append(colourBlock);
    factoryBaseEl.append(colourInputValue);
  } else {
    // Editor will not have a colour block and preview will render black.
    // TODO: Support RGB colours in the block editor.
  }
  return factoryBaseEl;
};

/**
 * Generates the appropriate <field> element for the block definition's
 * CONNECTIONS field, which determines the next, previous, and output
 * connections.
 *
 * @param {!Blockly.Block} block The example block from which to extract the
 *     definition.
 * @param {!Element} factoryBaseEl The root of the block definition.
 * @private
 */
BlockDefinitionExtractor.buildConnections_ = function(block, factoryBaseEl) {
  var connections = 'NONE';
  if (block.outputConnection) {
    connections = 'LEFT';
  } else {
    if (block.previousConnection) {
      if (block.nextConnection) {
        connections = 'BOTH';
      } else {
        connections = 'TOP';
      }
    } else if (block.nextConnection) {
      connections = 'BOTTOM';
    }
  }
  factoryBaseEl.append(BlockDefinitionExtractor.newDomElement_(
      'field', {name: 'CONNECTIONS'}, connections));

  if (connections === 'LEFT') {
    var inputValue =
        BlockDefinitionExtractor.newDomElement_('value', {name: 'OUTPUTTYPE'});
    inputValue.append(
        BlockDefinitionExtractor.buildTypeConstraintBlockForConnection_(
            block.outputConnection));
    factoryBaseEl.append(inputValue);
  } else {
    if (connections === 'UP' || connections === 'BOTH') {
      var inputValue =
          BlockDefinitionExtractor.newDomElement_('value', {name: 'TOPTYPE'});
      inputValue.append(
          BlockDefinitionExtractor.buildTypeConstraintBlockForConnection_(
              block.previousConnection));
      factoryBaseEl.append(inputValue);
    }
    if (connections === 'DOWN' || connections === 'BOTH') {
      var inputValue = BlockDefinitionExtractor.newDomElement_(
          'value', {name: 'BOTTOMTYPE'});
      inputValue.append(
          BlockDefinitionExtractor.buildTypeConstraintBlockForConnection_(
              block.nextConnection));
      factoryBaseEl.append(inputValue);
    }
  }
};

/**
 * Generates the appropriate <field> element for the block definition's INLINE
 * field.
 *
 * @param {!Blockly.Block} block The example block from which to extract the
 *     definition.
 * @return {Element} The INLINE <field> with value 'AUTO', 'INT' (internal) or
 *     'EXT' (external).
 * @private
 */
BlockDefinitionExtractor.buildInlineField_ = function(block) {
  var inline = 'AUTO'; // When block.inputsInlineDefault === undefined
  if (block.inputsInlineDefault === true) {
    inline = 'INT';
  } else if (block.inputsInlineDefault === false) {
    inline = 'EXT';
  }
  return BlockDefinitionExtractor.newDomElement_(
      'field', {name: 'INLINE'}, inline);
};

/**
 * Constructs a sequence of <block> elements that represent the inputs of the
 * provided block.
 *
 * @param {!Blockly.Block} block The source block to copy the inputs of.
 * @return {Element} The fist <block> element of the sequence
 *     (and the root of the constructed DOM).
 * @private
 */
BlockDefinitionExtractor.parseInputs_ = function(block) {
  var firstInputDefElement = null;
  var lastInputDefElement = null;
  for (var i = 0; i < block.inputList.length; i++) {
    var input = block.inputList[i];
    var align = 'LEFT'; // Left alignment is the default.
    if (input.align === Blockly.ALIGN_CENTRE) {
      align = 'CENTRE';
    } else if (input.align === Blockly.ALIGN_RIGHT) {
      align = 'RIGHT';
    }

    var inputDefElement = BlockDefinitionExtractor.input_(input, align);
    if (lastInputDefElement) {
      var next = BlockDefinitionExtractor.newDomElement_('next');
      next.append(inputDefElement);
      lastInputDefElement.append(next);
    } else {
      firstInputDefElement = inputDefElement;
    }
    lastInputDefElement = inputDefElement;
  }
  return firstInputDefElement;
};

/**
 * Creates a <block> element representing a block input.
 *
 * @param {!Blockly.Input} input The input object.
 * @param {string} align Can be left, right or centre.
 * @return {!Element} The <block> element that defines the input.
 * @private
 */
BlockDefinitionExtractor.input_ = function(input, align) {
  var hasConnector = (input.type === Blockly.inputs.inputTypes.VALUE || input.type === Blockly.inputs.inputTypes.STATEMENT);
  var inputTypeAttr =
      input.type === Blockly.inputs.inputTypes.DUMMY ? 'input_dummy' :
      input.type === Blockly.inputs.inputTypes.END_ROW ? 'input_end_row' :
      input.type === Blockly.inputs.inputTypes.VALUE ? 'input_value' :
      'input_statement';
  var inputDefBlock =
      BlockDefinitionExtractor.newDomElement_('block', {type: inputTypeAttr});

  if (hasConnector) {
    inputDefBlock.append(BlockDefinitionExtractor.newDomElement_(
        'field', {name: 'INPUTNAME'}, input.name));
  }
  inputDefBlock.append(BlockDefinitionExtractor.newDomElement_(
      'field', {name: 'ALIGN'}, align));

  var fieldsDef = BlockDefinitionExtractor.newDomElement_(
      'statement', {name: 'FIELDS'});
  var fieldsXml = BlockDefinitionExtractor.buildFields_(input.fieldRow);
  fieldsDef.append(fieldsXml);
  inputDefBlock.append(fieldsDef);

  if (hasConnector) {
    var typeValue = BlockDefinitionExtractor.newDomElement_(
        'value', {name: 'TYPE'});
    typeValue.append(
        BlockDefinitionExtractor.buildTypeConstraintBlockForConnection_(
            input.connection));
    inputDefBlock.append(typeValue);
  }

  return inputDefBlock;
};

/**
 * Constructs a sequence <block> elements representing the field definition.
 * @param {Array<Blockly.Field>} fieldRow A list of fields in a Blockly.Input.
 * @return {Element} The fist <block> element of the sequence
 *     (and the root of the constructed DOM).
 * @private
 */
BlockDefinitionExtractor.buildFields_ = function(fieldRow) {
  var firstFieldDefElement = null;
  var lastFieldDefElement = null;

  for (var i = 0; i < fieldRow.length; i++) {
    var field = fieldRow[i];
    var fieldDefElement = BlockDefinitionExtractor.buildFieldElement_(field);

    if (lastFieldDefElement) {
      var next = BlockDefinitionExtractor.newDomElement_('next');
      next.append(fieldDefElement);
      lastFieldDefElement.append(next);
    } else {
      firstFieldDefElement = fieldDefElement;
    }
    lastFieldDefElement = fieldDefElement;
  }

  return firstFieldDefElement;
};

/**
 * Constructs a <field> element that describes the provided Blockly.Field.
 * @param {!Blockly.Field} field The field from which the definition is copied.
 * @param {!Element} A <field> for the Field definition.
 * @private
 */
BlockDefinitionExtractor.buildFieldElement_ = function(field) {
  if (field instanceof Blockly.FieldLabel) {
    return BlockDefinitionExtractor.buildFieldLabel_(field.text_);
  } else if (field instanceof Blockly.FieldTextInput) {
     return BlockDefinitionExtractor.buildFieldInput_(field.name, field.text_);
  } else if (field instanceof Blockly.FieldNumber) {
    return BlockDefinitionExtractor.buildFieldNumber_(
        field.name, field.text_, field.min_, field.max_, field.presicion_);
  } else if (field instanceof Blockly.FieldAngle) {
    return BlockDefinitionExtractor.buildFieldAngle_(field.name, field.text_);
  } else if (field instanceof Blockly.FieldCheckbox) {
    return BlockDefinitionExtractor.buildFieldCheckbox_(field.name, field.state_);
  } else if (field instanceof Blockly.FieldColour) {
    return BlockDefinitionExtractor.buildFieldColour_(field.name, field.colour_);
  } else if (field instanceof Blockly.FieldImage) {
    return BlockDefinitionExtractor.buildFieldImage_(
        field.src_, field.width_, field.height_, field.text_);
  } else if (field instanceof Blockly.FieldVariable) {
    // FieldVariable must be before FieldDropdown, because FieldVariable is a
    // subclass.
    return BlockDefinitionExtractor.buildFieldVariable_(field.name, field.text_);
  } else if (field instanceof Blockly.FieldDropdown) {
    return BlockDefinitionExtractor.buildFieldDropdown_(field);
  }
  throw Error('Unrecognized field class: ' + field.constructor.name);
};


/**
 * Creates a <block> element representing a FieldLabel definition.
 * @param {string} text
 * @return {Element} The XML for FieldLabel definition.
 * @private
 */
BlockDefinitionExtractor.buildFieldLabel_ = function(text) {
  var fieldBlock =
      BlockDefinitionExtractor.newDomElement_('block', {type: 'field_static'});
  fieldBlock.append(
      BlockDefinitionExtractor.newDomElement_('field', {name: 'TEXT'}, text));
  return fieldBlock;
};

/**
 * Creates a <block> element representing a FieldInput (text input) definition.
 *
 * @param {string} fieldName The identifying name of the field.
 * @param {string} text The default text string.
 * @return {Element} The XML for FieldInput definition.
 * @private
 */
BlockDefinitionExtractor.buildFieldInput_ = function(fieldName, text) {
  var fieldInput =
      BlockDefinitionExtractor.newDomElement_('block', {type: 'field_input'});
  fieldInput.append(
      BlockDefinitionExtractor.newDomElement_('field', {name: 'TEXT'}, text));
  fieldInput.append(BlockDefinitionExtractor.newDomElement_(
      'field', {name: 'FIELDNAME'}, fieldName));
  return fieldInput;
};

/**
 * Creates a <block> element representing a FieldNumber definition.
 *
 * @param {string} fieldName The identifying name of the field.
 * @param {number} value The field's default value.
 * @param {number} min The minimum allowed value, or negative infinity.
 * @param {number} max The maximum allowed value, or positive infinity.
 * @param {number} precision The precision allowed for the number.
 * @return {Element} The XML for FieldNumber definition.
 * @private
 */
BlockDefinitionExtractor.buildFieldNumber_ =
  function(fieldName, value, min, max, precision)
{
  var fieldNumber =
      BlockDefinitionExtractor.newDomElement_('block', {type: 'field_number'});
  fieldNumber.append(BlockDefinitionExtractor.newDomElement_(
      'field', {name: 'VALUE'}, value));
  fieldNumber.append(BlockDefinitionExtractor.newDomElement_(
      'field', {name: 'FIELDNAME'}, fieldName));
  fieldNumber.append(BlockDefinitionExtractor.newDomElement_(
      'field', {name: 'MIN'}, min));
  fieldNumber.append(BlockDefinitionExtractor.newDomElement_(
      'field', {name: 'MAX'}, max));
  fieldNumber.append(BlockDefinitionExtractor.newDomElement_(
      'field', {name: 'PRECISION'}, precision));
  return fieldNumber;
};

/**
 * Creates a <block> element representing a FieldAngle definition.
 *
 * @param {string} fieldName The identifying name of the field.
 * @param {number} angle The field's default value.
 * @return {Element} The XML for FieldAngle definition.
 * @private
 */
BlockDefinitionExtractor.buildFieldAngle_ = function(angle, fieldName) {
  var fieldAngle =
      BlockDefinitionExtractor.newDomElement_('block', {type: 'field_angle'});
  fieldAngle.append(BlockDefinitionExtractor.newDomElement_(
      'field', {name: 'ANGLE'}, angle));
  fieldAngle.append(BlockDefinitionExtractor.newDomElement_(
      'field', {name: 'FIELDNAME'}, fieldName));
  return fieldAngle;
};

/**
 * Creates a <block> element representing a FieldDropdown definition.
 *
 * @param {Blockly.FieldDropdown} dropdown
 * @return {Element} The <block> element representing a similar FieldDropdown.
 * @private
 */
BlockDefinitionExtractor.buildFieldDropdown_ = function(dropdown) {
  var menuGenerator = dropdown.menuGenerator_;
  if (typeof menuGenerator === 'function') {
    var options = menuGenerator();
  } else if (Array.isArray(menuGenerator)) {
    var options = menuGenerator;
  } else {
    throw Error('Unrecognized type of menuGenerator: ' + menuGenerator);
  }

  var fieldDropdown = BlockDefinitionExtractor.newDomElement_(
      'block', {type: 'field_dropdown'});
  var optionsStr = '[';

  var mutation = BlockDefinitionExtractor.newDomElement_('mutation');
  fieldDropdown.append(mutation);
  fieldDropdown.append(BlockDefinitionExtractor.newDomElement_(
      'field', {name: 'FIELDNAME'}, dropdown.name));
  for (var i=0; i<options.length; i++) {
    var option = options[i];
    if (typeof option[0] === "string") {
      optionsStr += '"text",'
      fieldDropdown.append(BlockDefinitionExtractor.newDomElement_(
          'field', {name: 'USER'+i}, option[0]));
    } else {
      optionsStr += '"image",';
      fieldDropdown.append(
          BlockDefinitionExtractor.newDomElement_(
          'field', {name: 'SRC'+i}, option[0].src));
      fieldDropdown.append(BlockDefinitionExtractor.newDomElement_(
          'field', {name: 'WIDTH'+i}, option[0].width));
      fieldDropdown.append(BlockDefinitionExtractor.newDomElement_(
          'field', {name: 'HEIGHT'+i}, option[0].height));
      fieldDropdown.append(BlockDefinitionExtractor.newDomElement_(
          'field', {name: 'ALT'+i}, option[0].alt));
    }
    fieldDropdown.append(BlockDefinitionExtractor.newDomElement_(
        'field', {name: 'CPU'+i}, option[1]));
  }
  optionsStr = optionsStr.slice(0,-1); // Drop last comma
  optionsStr += ']';
  mutation.setAttribute('options', optionsStr);

  return fieldDropdown;
};

/**
 * Creates a <block> element representing a FieldCheckbox definition.
 *
 * @param {string} fieldName The identifying name of the field.
 * @param {string} checked The field's default value, true or false.
 * @return {Element} The XML for FieldCheckbox definition.
 * @private
 */
BlockDefinitionExtractor.buildFieldCheckbox_ =
  function(fieldName, checked)
{
  var fieldCheckbox = BlockDefinitionExtractor.newDomElement_(
      'block', {type: 'field_checkbox'});
  fieldCheckbox.append(BlockDefinitionExtractor.newDomElement_(
      'field', {name: 'CHECKED'}, checked));
  fieldCheckbox.append(BlockDefinitionExtractor.newDomElement_(
      'field', {name: 'FIELDNAME'}, fieldName));
  return fieldCheckbox;
};

/**
 * Creates a <block> element representing a FieldColour definition.
 *
 * @param {string} fieldName The identifying name of the field.
 * @param {string} colour The field's default value as a string.
 * @return {Element} The XML for FieldColour definition.
 * @private
 */
BlockDefinitionExtractor.buildFieldColour_ =
    function(fieldName, colour)
{
  var fieldColour = BlockDefinitionExtractor.newDomElement_(
      'block', {type: 'field_colour'});
  fieldColour.append(BlockDefinitionExtractor.newDomElement_(
      'field', {name: 'COLOUR'}, colour));
  fieldColour.append(BlockDefinitionExtractor.newDomElement_(
      'field', {name: 'FIELDNAME'}, fieldName));
  return fieldColour;
};

/**
 * Creates a <block> element representing a FieldVariable definition.
 *
 * @param {string} fieldName The identifying name of the field.
 * @param {string} varName The variables
 * @return {Element} The <block> element representing the FieldVariable.
 * @private
 */
BlockDefinitionExtractor.buildFieldVariable_ = function(fieldName, varName) {
  var fieldVar = BlockDefinitionExtractor.newDomElement_(
      'block', {type: 'field_variable'});
  fieldVar.append(BlockDefinitionExtractor.newDomElement_(
      'field', {name: 'FIELDNAME'}, fieldName));
  fieldVar.append(BlockDefinitionExtractor.newDomElement_(
      'field', {name: 'TEXT'}, varName));
  return fieldVar;
};

/**
 * Creates a <block> element representing a FieldImage definition.
 *
 * @param {string} src The URL of the field image.
 * @param {number} width The pixel width of the source image
 * @param {number} height The pixel height of the source image.
 * @param {string} alt Alternate text to describe image.
 * @private
 */
BlockDefinitionExtractor.buildFieldImage_ =
  function(src, width, height, alt)
{
  var block1 = BlockDefinitionExtractor.newDomElement_(
      'block', {type: 'field_image'});
  block1.append(BlockDefinitionExtractor.newDomElement_(
      'field', {name: 'SRC'}, src));
  block1.append(BlockDefinitionExtractor.newDomElement_(
      'field', {name: 'WIDTH'}, width));
  block1.append(BlockDefinitionExtractor.newDomElement_(
      'field', {name: 'HEIGHT'}, height));
  block1.append(BlockDefinitionExtractor.newDomElement_(
      'field', {name: 'ALT'}, alt));
};

/**
 * Creates a <block> element a group of allowed connection constraint types.
 *
 * @param {Array<string>} types List of type names in this group.
 * @return {Element} The <block> element representing the group, with child
 *     types attached.
 * @private
 */
BlockDefinitionExtractor.typeGroup_ = function(types) {
  var typeGroupBlock = BlockDefinitionExtractor.newDomElement_(
      'block', {type: 'type_group'});
  typeGroupBlock.append(BlockDefinitionExtractor.newDomElement_(
      'mutation', {types:types.length}));
  for (var i=0; i<types.length; i++) {
    var typeBlock = BlockDefinitionExtractor.buildBlockForType_(types[i]);
    var valueBlock = BlockDefinitionExtractor.newDomElement_(
        'value', {name:'TYPE'+i});
    valueBlock.append(typeBlock);
    typeGroupBlock.append(valueBlock);
  }
  return typeGroupBlock;
};

/**
 * Creates a <shadow> block element representing the default null connection
 * constraint.
 * @return {Element} The <block> element representing the "null" type
 *     constraint.
 * @private
 */
BlockDefinitionExtractor.typeNullShadow_ = function() {
  return BlockDefinitionExtractor.newDomElement_(
      'shadow', {type: 'type_null'});
};

/**
 * Creates a <block> element representing null in a connection constraint.
 * @return {Element} The <block> element representing the "null" type
 *     constraint.
 * @private
 */
BlockDefinitionExtractor.typeNull_ = function() {
  return BlockDefinitionExtractor.newDomElement_('block', {type: 'type_null'});
};

/**
 * Creates a <block> element representing the a boolean in a connection
 * constraint.
 * @return {Element} The <block> element representing the "boolean" type
 *     constraint.
 * @private
 */
BlockDefinitionExtractor.typeBoolean_ = function() {
  return BlockDefinitionExtractor.newDomElement_(
      'block', {type: 'type_boolean'});
};

/**
 * Creates a <block> element representing the a number in a connection
 * constraint.
 * @return {Element} The <block> element representing the "number" type
 *     constraint.
 * @private
 */
BlockDefinitionExtractor.typeNumber_ = function() {
  return BlockDefinitionExtractor.newDomElement_(
      'block', {type: 'type_number'});
};

/**
 * Creates a <block> element representing the a string in a connection
 * constraint.
 * @return {Element} The <block> element representing the "string" type
 *     constraint.
 * @private
 */
BlockDefinitionExtractor.typeString_ = function() {
  return BlockDefinitionExtractor.newDomElement_(
      'block', {type: 'type_string'});
};

/**
 * Creates a <block> element representing the a list in a connection
 * constraint.
 * @return {Element} The <block> element representing the "list" type
 *     constraint.
 * @private
 */
BlockDefinitionExtractor.typeList_ = function() {
  return BlockDefinitionExtractor.newDomElement_('block', {type: 'type_list'});
};

/**
 * Creates a <block> element representing the given custom connection
 * constraint type name.
 *
 * @param {string} type The connection constraint type name.
 * @return {Element} The <block> element representing a custom input type
 *     constraint.
 * @private
 */
BlockDefinitionExtractor.typeOther_ = function(type) {
  var block = BlockDefinitionExtractor.newDomElement_(
      'block', {type: 'type_other'});
  block.append(BlockDefinitionExtractor.newDomElement_(
      'field', {name: 'TYPE'}, type));
  return block;
};

/**
 * Creates a block Element for the colour_hue block, with the given hue.
 * @param hue {number} The hue value, from 0 to 360.
 * @return {Element} The <block> Element representing a colour_hue block
 *     with the given hue.
 * @private
 */
BlockDefinitionExtractor.colourBlockFromHue_ = function(hue) {
  var colourBlock = BlockDefinitionExtractor.newDomElement_(
      'block', {type: 'colour_hue'});
  colourBlock.append(BlockDefinitionExtractor.newDomElement_('mutation', {
    colour: Blockly.utils.colour.hueToHex(hue)
  }));
  colourBlock.append(BlockDefinitionExtractor.newDomElement_(
      'field', {name: 'HUE'}, hue.toString()));
  return colourBlock;
};

/**
 * Creates a block Element for a text block with the given text.
 *
 * @param text {string} The text value of the block.
 * @return {Element} The <block> element representing a "text" block.
 * @private
 */
BlockDefinitionExtractor.text_ = function(text) {
  var textBlock =
      BlockDefinitionExtractor.newDomElement_('block', {type: 'text'});
  if (text) {
    textBlock.append(BlockDefinitionExtractor.newDomElement_(
      'field', {name: 'TEXT'}, text));
  } // Else, use empty string default.
  return textBlock;
};
