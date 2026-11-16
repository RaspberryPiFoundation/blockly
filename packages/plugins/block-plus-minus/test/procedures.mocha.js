/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

const chai = require('chai');
const sinon = require('sinon');
const Blockly = require('blockly');
const {testHelpers} = require('@blockly/dev-tools');
const procedureTestHelpers = require('./procedures_test_helpers.mocha');
const {dartGenerator} = require('blockly/dart');
const {javascriptGenerator} = require('blockly/javascript');
const {luaGenerator} = require('blockly/lua');
const {phpGenerator} = require('blockly/php');
const {pythonGenerator} = require('blockly/python');

require('../src/index');

const assert = chai.assert;
const {
  CodeGenerationTestSuite,
  runCodeGenerationTestSuites,
  runSerializationTestSuite,
  SerializationTestCase,
} = testHelpers;
const {
  assertDefBlockStructure,
  assertCallBlockStructure,
  assertProcBlocksStructure,
  createProcDefBlock,
  createProcCallBlock,
} = procedureTestHelpers;

suite('Procedure blocks', function () {
  setup(function () {
    this.workspace = new Blockly.Workspace();
    this.clock = sinon.useFakeTimers();
  });

  teardown(function () {
    // We have to make sure the procedure call gets the change event before
    // we teardown. Otherwise we get a race condition where it tries to create
    // a new def.
    this.clock.tick(100);
    this.workspace.dispose();
    sinon.restore();
  });

  const testSuites = [
    {
      title: 'with return',
      hasReturn: true,
      defType: 'procedures_defreturn',
      callType: 'procedures_callreturn',
    },
    {
      title: 'no return',
      hasReturn: false,
      defType: 'procedures_defnoreturn',
      callType: 'procedures_callnoreturn',
    },
  ];

  testSuites.forEach((testSuite) => {
    suite(testSuite.title, function () {
      suite('Structure', function () {
        test('Definition block', function () {
          const defBlock = this.workspace.newBlock(testSuite.defType);
          assertDefBlockStructure(defBlock, testSuite.hasReturn);
        });

        test('Call block', function () {
          this.workspace.newBlock(testSuite.defType);
          const callBlock = this.workspace.newBlock(testSuite.callType);
          assertCallBlockStructure(callBlock);
        });
      });

      suite('Code generation', function () {
        const createBlockFn = (numArgs) => {
          return (workspace) => {
            const block = createProcDefBlock(workspace, testSuite.hasReturn);
            for (let i = 0; i < numArgs; i++) {
              block.plus();
            }
            return block;
          };
        };

        /**
         * Test suites for code generation test.
         * @type {Array<CodeGenerationTestSuite>}
         */
        const codeGenerationTestSuites = [
          {
            title: 'Dart',
            generator: dartGenerator,
            testCases: [
              {
                title: 'No arguments',
                useWorkspaceToCode: true,
                expectedCode:
                  'void proc_name() {\n' + '}\n\n\n' + 'main() {\n' + '}',
                createBlock: createBlockFn(0),
              },
              {
                title: 'One argument',
                useWorkspaceToCode: true,
                expectedCode:
                  'var x;\n\n' +
                  'void proc_name(x) {\n' +
                  '}\n\n\n' +
                  'main() {\n' +
                  '}',
                createBlock: createBlockFn(1),
              },
            ],
          },
          {
            title: 'JavaScript',
            generator: javascriptGenerator,
            testCases: [
              {
                title: 'No arguments',
                useWorkspaceToCode: true,
                expectedCode: 'function proc_name() {\n' + '}\n',
                createBlock: createBlockFn(0),
              },
              {
                title: 'One argument',
                useWorkspaceToCode: true,
                expectedCode:
                  'var x;\n\n' + 'function proc_name(x) {\n' + '}\n',
                createBlock: createBlockFn(1),
              },
            ],
          },
          {
            title: 'Lua',
            generator: luaGenerator,
            testCases: [
              {
                title: 'No arguments',
                useWorkspaceToCode: true,
                expectedCode: 'function proc_name()\n' + 'end\n',
                createBlock: createBlockFn(0),
              },
              {
                title: 'One argument',
                useWorkspaceToCode: true,
                expectedCode: 'function proc_name(x)\n' + 'end\n',
                createBlock: createBlockFn(1),
              },
            ],
          },
          {
            title: 'PHP',
            generator: phpGenerator,
            testCases: [
              {
                title: 'No arguments',
                useWorkspaceToCode: true,
                expectedCode: 'function proc_name() {\n' + '}\n',
                createBlock: createBlockFn(0),
              },
              {
                title: 'One argument',
                useWorkspaceToCode: true,
                expectedCode: 'function proc_name($x) {\n' + '}\n',
                createBlock: createBlockFn(1),
              },
            ],
          },
          {
            title: 'Python',
            generator: pythonGenerator,
            testCases: [
              {
                title: 'No arguments',
                useWorkspaceToCode: true,
                expectedCode: 'def proc_name():\n' + '  pass\n',
                createBlock: createBlockFn(0),
              },
              {
                title: 'One argument',
                useWorkspaceToCode: true,
                expectedCode:
                  'x = None\n\n' + 'def proc_name(x):\n' + '  pass\n',
                createBlock: createBlockFn(1),
              },
            ],
          },
        ];

        runCodeGenerationTestSuites(codeGenerationTestSuites);
      });

      suite('Xml', function () {
        /**
         * Test cases for serialization tests.
         * @type {Array<SerializationTestCase>}
         */
        const testCases = [
          {
            title: 'Minimal definition',
            xml: '<block type="' + testSuite.defType + '"/>',
            expectedXml:
              '<block xmlns="https://developers.google.com/blockly/xml" ' +
              'type="' +
              testSuite.defType +
              '" id="1">\n' +
              '  <field name="NAME"></field>\n' +
              '</block>',
            assertBlockStructure: (block) => {
              assertDefBlockStructure(block, testSuite.hasReturn);
            },
          },
          {
            title: 'Common definition',
            xml:
              '<block type="' +
              testSuite.defType +
              '">' +
              '  <field name="NAME">do something</field>' +
              '</block>',
            expectedXml:
              '<block xmlns="https://developers.google.com/blockly/xml" ' +
              'type="' +
              testSuite.defType +
              '" id="1">\n' +
              '  <field name="NAME">do something</field>\n' +
              '</block>',
            assertBlockStructure: (block) => {
              assertDefBlockStructure(block, testSuite.hasReturn);
            },
          },
          {
            title: 'With vars definition',
            xml:
              '<block type="' +
              testSuite.defType +
              '">\n' +
              '  <mutation>\n' +
              '    <arg name="x" varid="arg1"></arg>\n' +
              '    <arg name="y" varid="arg2"></arg>\n' +
              '  </mutation>\n' +
              '  <field name="NAME">do something</field>\n' +
              '</block>',
            expectedXml:
              '<block xmlns="https://developers.google.com/blockly/xml" ' +
              'type="' +
              testSuite.defType +
              '" id="1">\n' +
              '  <mutation>\n' +
              '    <arg name="x" varid="arg1" argid="1"></arg>\n' +
              '    <arg name="y" varid="arg2" argid="1"></arg>\n' +
              '  </mutation>\n' +
              '  <field name="NAME">do something</field>\n' +
              '  <field name="1">x</field>\n' + // Because genUID is stubbed.
              '  <field name="1">y</field>\n' +
              '</block>',
            assertBlockStructure: (block) => {
              assertDefBlockStructure(block, testSuite.hasReturn, ['x', 'y']);
            },
          },
          {
            title: 'No statements definition',
            xml:
              '<block type="procedures_defreturn">\n' +
              '  <mutation statements="false"></mutation>\n' +
              '  <field name="NAME">do something</field>\n' +
              '</block>',
            expectedXml:
              '<block xmlns="https://developers.google.com/blockly/xml" ' +
              'type="procedures_defreturn" id="1">\n' +
              '  <mutation statements="false"></mutation>\n' +
              '  <field name="NAME">do something</field>\n' +
              '</block>',
            assertBlockStructure: (block) => {
              assertDefBlockStructure(block, true, [], false);
            },
          },
          {
            title: 'Minimal caller',
            xml: '<block type="' + testSuite.callType + '"/>',
            expectedXml:
              '<block xmlns="https://developers.google.com/blockly/xml" ' +
              'type="' +
              testSuite.callType +
              '" id="1">\n' +
              '  <mutation name=""></mutation>\n' +
              '</block>',
            assertBlockStructure: (block) => {
              assertCallBlockStructure(block);
            },
          },
          {
            title: 'Common caller',
            xml:
              '<block type="' +
              testSuite.callType +
              '">\n' +
              '  <mutation name="do something"/>\n' +
              '</block>',
            expectedXml:
              '<block xmlns="https://developers.google.com/blockly/xml" ' +
              'type="' +
              testSuite.callType +
              '" id="1">\n' +
              '  <mutation name="do something"></mutation>\n' +
              '</block>',
            assertBlockStructure: (block) => {
              assertCallBlockStructure(block);
            },
          },
          {
            title: 'With vars caller',
            xml:
              '<block type="' +
              testSuite.callType +
              '">\n' +
              '  <mutation name="do something">\n' +
              '    <arg name="x"></arg>\n' +
              '    <arg name="y"></arg>\n' +
              '  </mutation>\n' +
              '</block>',
            expectedXml:
              '<block xmlns="https://developers.google.com/blockly/xml" ' +
              'type="' +
              testSuite.callType +
              '" id="1">\n' +
              '  <mutation name="do something">\n' +
              '    <arg name="x"></arg>\n' +
              '    <arg name="y"></arg>\n' +
              '  </mutation>\n' +
              '</block>',
            assertBlockStructure: (block) => {
              assertCallBlockStructure(block, ['x', 'y']);
            },
          },
        ];
        runSerializationTestSuite(testCases, Blockly);
      });

      suite('Json', function () {
        /**
         * Test cases for serialization tests.
         * @type {Array<SerializationTestCase>}
         */
        const testCases = [
          {
            title: 'Minimal definition',
            json: {
              type: testSuite.defType,
            },
            expectedJson: {
              type: testSuite.defType,
              id: '1',
              fields: {
                NAME: '',
              },
            },
            assertBlockStructure: (block) => {
              assertDefBlockStructure(block, testSuite.hasReturn);
            },
          },
          {
            title: 'Common definition',
            json: {
              type: testSuite.defType,
              fields: {
                NAME: 'do something',
              },
            },
            expectedJson: {
              type: testSuite.defType,
              id: '1',
              fields: {
                NAME: 'do something',
              },
            },
            assertBlockStructure: (block) => {
              assertDefBlockStructure(block, testSuite.hasReturn);
            },
          },
          {
            title: 'With vars definition',
            json: {
              type: testSuite.defType,
              fields: {
                NAME: 'do something',
              },
              extraState: {
                params: [
                  {
                    name: 'x',
                    id: 'id1',
                    argId: 'arg1',
                  },
                  {
                    name: 'y',
                    id: 'id2',
                    argId: 'arg2',
                  },
                ],
              },
            },
            expectedJson: {
              type: testSuite.defType,
              id: '1',
              fields: {
                NAME: 'do something',
                arg1: 'x',
                arg2: 'y',
              },
              extraState: {
                params: [
                  {
                    name: 'x',
                    id: 'id1',
                    argId: 'arg1',
                  },
                  {
                    name: 'y',
                    id: 'id2',
                    argId: 'arg2',
                  },
                ],
              },
            },
            assertBlockStructure: (block) => {
              assertDefBlockStructure(block, testSuite.hasReturn, ['x', 'y']);
            },
          },
          {
            title: 'No statements definition',
            json: {
              type: testSuite.defType,
              fields: {
                NAME: 'do something',
              },
              extraState: {
                hasStatements: false,
              },
            },
            expectedJson: {
              type: testSuite.defType,
              id: '1',
              fields: {
                NAME: 'do something',
              },
              extraState: {
                hasStatements: false,
              },
            },
            assertBlockStructure: (block) => {
              assertDefBlockStructure(block, testSuite.hasReturn, [], false);
            },
          },
          {
            title: 'Minimal caller',
            json: {
              type: testSuite.callType,
            },
            expectedJson: {
              type: testSuite.callType,
              id: '1',
              extraState: {
                name: '',
              },
            },
            assertBlockStructure: (block) => {
              assertCallBlockStructure(block);
            },
          },
          {
            title: 'Common caller',
            json: {
              type: testSuite.callType,
              extraState: {
                name: 'do something',
              },
            },
            expectedJson: {
              type: testSuite.callType,
              id: '1',
              extraState: {
                name: 'do something',
              },
            },
            assertBlockStructure: (block) => {
              assertCallBlockStructure(block);
            },
          },
          {
            title: 'With vars caller',
            json: {
              type: testSuite.callType,
              extraState: {
                name: 'do something',
                params: ['x', 'y'],
              },
            },
            expectedJson: {
              type: testSuite.callType,
              id: '1',
              extraState: {
                name: 'do something',
                params: ['x', 'y'],
              },
            },
            assertBlockStructure: (block) => {
              assertCallBlockStructure(block, ['x', 'y']);
            },
          },
        ];
        runSerializationTestSuite(testCases, Blockly);
      });

      suite('Adding and removing inputs', function () {
        setup(function () {
          this.def = createProcDefBlock(this.workspace, testSuite.hasReturn);
          this.call = createProcCallBlock(this.workspace, testSuite.hasReturn);
        });

        test('Add', function () {
          assertProcBlocksStructure(this.def, this.call, testSuite.hasReturn);
          this.def.plus();
          assertProcBlocksStructure(this.def, this.call, testSuite.hasReturn, [
            'x',
          ]);
        });

        test('Add many', function () {
          assertProcBlocksStructure(this.def, this.call, testSuite.hasReturn);
          for (let i = 0; i < 5; i++) {
            this.def.plus();
          }
          assertProcBlocksStructure(this.def, this.call, testSuite.hasReturn, [
            'x',
            'y',
            'z',
            'a',
            'b',
          ]);
        });

        if (testSuite.hasReturn) {
          test('Add, no stack', function () {
            this.def = createProcDefBlock(
              this.workspace,
              true,
              'proc name2',
              false,
            );
            this.call = createProcCallBlock(this.workspace, true, 'proc name2');
            assertProcBlocksStructure(this.def, this.call, true, [], false);
            this.def.plus();
            assertProcBlocksStructure(this.def, this.call, true, ['x'], false);
          });
        }

        test('Remove', function () {
          assertProcBlocksStructure(this.def, this.call, testSuite.hasReturn);
          this.def.plus();
          this.def.minus(this.def.argData_[0].argId);
          assertProcBlocksStructure(this.def, this.call, testSuite.hasReturn);
        });

        test('Remove many', function () {
          assertProcBlocksStructure(this.def, this.call, testSuite.hasReturn);
          for (let i = 0; i < 10; i++) {
            this.def.plus();
          }
          // Remove every other input. Must do it backwards so that the array
          // doesn't get out of whack.
          for (let i = 9; i > 0; i -= 2) {
            this.def.minus(this.def.argData_[i].argId);
          }
          assertProcBlocksStructure(this.def, this.call, testSuite.hasReturn, [
            'x',
            'z',
            'b',
            'd',
            'f',
          ]);
        });

        test('Remove too many (w/ no args)', function () {
          this.def.minus('whatevs');
          assertProcBlocksStructure(this.def, this.call, testSuite.hasReturn);
        });

        test('Remove bad arg', function () {
          this.def.plus();
          this.def.minus('whatevs');
          assertProcBlocksStructure(this.def, this.call, testSuite.hasReturn, [
            'x',
          ]);
        });
      });

      suite('Vars', function () {
        setup(function () {
          this.assertVars = function (constsArray) {
            const constNames = this.workspace
              .getVariableMap()
              .getVariablesOfType('')
              .map((model) => model.name);
            assert.sameMembers(constNames, constsArray);
          };
        });
        teardown(function () {
          delete this.assertVars;
        });

        suite('Renaming args', function () {
          setup(function () {
            this.def = createProcDefBlock(this.workspace, testSuite.hasReturn);
            this.call = createProcCallBlock(
              this.workspace,
              testSuite.hasReturn,
            );
          });
          test('Simple Rename', function () {
            this.def.plus();
            const field = this.def.inputList[1].fieldRow[2];
            field.setValue('newName');
            assertProcBlocksStructure(
              this.def,
              this.call,
              testSuite.hasReturn,
              ['newName'],
            );
            this.assertVars(['x', 'newName']);
          });
          test('Change Case', function () {
            this.def.plus();
            const field = this.def.inputList[1].fieldRow[2];
            field.setValue('X');
            assertProcBlocksStructure(
              this.def,
              this.call,
              testSuite.hasReturn,
              ['X'],
            );
            this.assertVars(['X']);
          });
          test('Empty', function () {
            this.def.plus();
            const field = this.def.inputList[1].fieldRow[2];
            field.setValue('');
            assertProcBlocksStructure(
              this.def,
              this.call,
              testSuite.hasReturn,
              ['x'],
            );
            this.assertVars(['x']);
          });
          test('Whitespace', function () {
            this.def.plus();
            const field = this.def.inputList[1].fieldRow[2];
            field.setValue('  newName   ');
            assertProcBlocksStructure(
              this.def,
              this.call,
              testSuite.hasReturn,
              ['newName'],
            );
            this.assertVars(['x', 'newName']);
          });
          test('Duplicate', function () {
            this.def.plus();
            this.def.plus();
            const field = this.def.inputList[1].fieldRow[2];
            field.setValue('y');
            assertProcBlocksStructure(
              this.def,
              this.call,
              testSuite.hasReturn,
              ['x', 'y'],
            );
            this.assertVars(['x', 'y']);
          });
          test('Duplicate Different Case', function () {
            this.def.plus();
            this.def.plus();
            const field = this.def.inputList[1].fieldRow[2];
            field.setValue('Y');
            assertProcBlocksStructure(
              this.def,
              this.call,
              testSuite.hasReturn,
              ['x', 'y'],
            );
            this.assertVars(['x', 'y']);
          });
          test('Match Existing', function () {
            this.workspace.getVariableMap().createVariable('test', '');
            this.def.plus();
            const field = this.def.inputList[1].fieldRow[2];
            field.setValue('test');
            assertProcBlocksStructure(
              this.def,
              this.call,
              testSuite.hasReturn,
              ['test'],
            );
            this.assertVars(['x', 'test']);
            assert.equal(
              this.def.argData_[0].model.getId(),
              this.workspace.getVariableMap().getVariable('test', '').getId(),
            );
          });
        });
        suite('Vars Renamed Elsewhere', function () {
          setup(function () {
            this.def = createProcDefBlock(this.workspace, testSuite.hasReturn);
            this.call = createProcCallBlock(
              this.workspace,
              testSuite.hasReturn,
            );
          });
          test('Simple Rename', function () {
            this.def.plus();
            const Variable = this.workspace
              .getVariableMap()
              .getVariable('x', '');
            this.workspace.getVariableMap().renameVariable(Variable, 'test');
            assertProcBlocksStructure(
              this.def,
              this.call,
              testSuite.hasReturn,
              ['test'],
            );
            this.assertVars(['test']);
          });
          // Don't know how we want to react here.
          test.skip('Duplicate', function () {
            this.def.plus();
            this.def.plus();
            const Variable = this.workspace
              .getVariableMap()
              .getVariable('x', '');
            this.workspace.getVariableMap().renameVariable(Variable, 'y');
            // Don't know what we want to have happen.
          });
          test('Change Case', function () {
            this.def.plus();
            const Variable = this.workspace
              .getVariableMap()
              .getVariable('x', '');
            this.workspace.getVariableMap().renameVariable(Variable, 'X');
            assertProcBlocksStructure(
              this.def,
              this.call,
              testSuite.hasReturn,
              ['X'],
            );
            this.assertVars(['X']);
          });
          test('Coalesce Change Case', function () {
            const variable = this.workspace
              .getVariableMap()
              .createVariable('test');
            this.def.plus();
            this.workspace.getVariableMap().renameVariable(variable, 'X');
            assertProcBlocksStructure(
              this.def,
              this.call,
              testSuite.hasReturn,
              ['X'],
            );
            this.assertVars(['X']);
          });
        });
      });
    });
  });
});
