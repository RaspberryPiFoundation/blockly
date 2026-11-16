import * as Blockly from 'blockly';
import {ChildOptionMapping, FieldDependentDropdown} from '../src/index';

Blockly.defineBlocksWithJsonArray([
  {
    type: 'dependent_dropdown_test',
    message0: 'Parent %1 Child %2 Grandchild %3',
    args0: [
      {
        type: 'field_dropdown',
        name: 'PARENT_FIELD',
        options: [
          ['A', 'a'],
          ['B', 'b'],
        ],
      },
      {
        type: 'field_dependent_dropdown',
        name: 'CHILD_FIELD',
        parentName: 'PARENT_FIELD',
        optionMapping: {
          a: [
            ['A1', 'a1'],
            ['A2', 'a2'],
            ['Shared', 'shared'],
          ],
          b: [
            ['B1', 'b1'],
            ['B2', 'b2'],
            ['Shared', 'shared'],
          ],
        },
      },
      {
        type: 'field_dependent_dropdown',
        name: 'GRANDCHILD_FIELD',
        parentName: 'CHILD_FIELD',
        optionMapping: {
          a1: [
            ['A11', 'a11'],
            ['A12', 'a12'],
          ],
          a2: [
            ['A21', 'a21'],
            ['A22', 'a22'],
          ],
          b1: [
            ['B11', 'b11'],
            ['B12', 'b12'],
          ],
          b2: [
            ['B21', 'b21'],
            ['B22', 'b22'],
          ],
          shared: [['Only', 'only']],
        },
      },
    ],
    colour: 100,
  },
  {
    type: 'dependent_dropdown_default_options_test',
    message0: 'Parent %1 Child %2',
    args0: [
      {
        type: 'field_input',
        name: 'PARENT_FIELD',
      },
      {
        type: 'field_dependent_dropdown',
        name: 'CHILD_FIELD',
        parentName: 'PARENT_FIELD',
        optionMapping: {
          a: [
            ['A1', 'a1'],
            ['A2', 'a2'],
          ],
        },
        defaultOptions: [['Default Option', 'defaultOption']],
      },
    ],
    colour: 100,
  },
]);

Blockly.Blocks['dependent_dropdown_validation_test'] = {
  init: function () {
    const parentFieldName = 'PARENT_FIELD';
    const childFieldName = 'CHILD_FIELD';
    const parentOptions: Blockly.MenuOption[] = [
      ['Initial', 'initial'],
      ['Invalid', 'invalid'],
      ['Valid', 'valid'],
    ];
    const dependentOptions: ChildOptionMapping = {
      initial: [
        ['Initial1', 'initial1'],
        ['Initial2', 'initial2'],
      ],
      invalid: [
        ['Invalid1', 'invalid1'],
        ['Invalid2', 'invalid2'],
      ],
      valid: [
        ['Valid1', 'valid1'],
        ['Valid2', 'valid2'],
      ],
    };
    const parentValidator: Blockly.FieldDropdownValidator = function (
      newValue,
    ) {
      if (newValue == 'invalid') {
        return 'valid';
      }
      return undefined;
    };
    this.appendDummyInput()
      .appendField('Parent')
      .appendField(
        new Blockly.FieldDropdown(parentOptions, parentValidator),
        parentFieldName,
      )
      .appendField('Child')
      .appendField(
        new FieldDependentDropdown(parentFieldName, dependentOptions),
        childFieldName,
      );
    this.setColour(100);
  },
};
