/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from '../../build/src/core/blockly.js';
import {assert} from '../../node_modules/chai/index.js';
import {
  TestCase,
  TestSuite,
  runTestCases,
  runTestSuites,
} from './test_helpers/common.js';
import {
  sharedTestSetup,
  sharedTestTeardown,
  workspaceTeardown,
} from './test_helpers/setup_teardown.js';

// TODO: Move this into samples as part of the dev-tools package.
// TODO: Fix up typing of SerializerTestCase & SerializerTestSuite to match
//     decision in google/blockly-samples#819.
/**
 * Constructs a serializer test.
 * @param {string} title The title of this testcase.
 * @param {string} xml The XML to use for the round-trip test.
 * @constructor
 * @implements {TestCase}
 */
function SerializerTestCase(title, xml) {
  this.title = title;
  this.xml = xml;
}
SerializerTestCase.prototype = new TestCase();

/**
 * The XML we want to ensure round-trips through the serializer.
 */
SerializerTestCase.prototype.xml = '';

/**
 * Constructs a serializer test suite.
 * @param {string} title The title of this test suite.
 * @extends {TestSuite<SerializerTestCase, SerializerTestSuite>}
 */
function SerializerTestSuite(title) {
  this.title = title;
}
SerializerTestSuite.prototype = new TestSuite();

const Serializer = new SerializerTestSuite('Serializer');

// TODO: Make sure all of these properties are documented ad exported properly.
Serializer.Empty = new SerializerTestCase(
  'Empty',
  '<xml xmlns="https://developers.google.com/blockly/xml"></xml>',
);
Serializer.Data = new SerializerTestCase(
  'Data',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="logic_negate" id="id******************" x="42" y="42">' +
    '<data>test data</data>' +
    '</block>' +
    '</xml>',
);
Serializer.testCases = [Serializer.Empty, Serializer.Data];

Serializer.Attributes = new SerializerTestSuite('Attributes');
Serializer.Attributes.Basic = new SerializerTestCase(
  'Basic',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="logic_negate" id="id******************" x="42" y="42"></block>' +
    '</xml>',
);
Serializer.Attributes.Collapsed = new SerializerTestCase(
  'Collapsed',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="logic_negate" id="id******************" collapsed="true" x="42" y="42"></block>' +
    '</xml>',
);
Serializer.Attributes.Disabled = new SerializerTestCase(
  'Disabled',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="logic_negate" id="id******************" disabled-reasons="test%20reason,another%20reason" x="42" y="42"></block>' +
    '</xml>',
);
Serializer.Attributes.DisabledWithEncodedComma = new SerializerTestCase(
  'DisabledWithEncodedComma',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="logic_negate" id="id******************" disabled-reasons="test%2Creason" x="42" y="42"></block>' +
    '</xml>',
);
Serializer.Attributes.NotDeletable = new SerializerTestCase(
  'Deletable',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="logic_negate" id="id******************" deletable="false" x="42" y="42"></block>' +
    '</xml>',
);
Serializer.Attributes.NotMovable = new SerializerTestCase(
  'Movable',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="logic_negate" id="id******************" movable="false" x="42" y="42"></block>' +
    '</xml>',
);
Serializer.Attributes.NotEditable = new SerializerTestCase(
  'Editable',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="logic_negate" id="id******************" editable="false" x="42" y="42"></block>' +
    '</xml>',
);
Serializer.Attributes.testCases = [
  Serializer.Attributes.Basic,
  Serializer.Attributes.Collapsed,
  Serializer.Attributes.Disabled,
  Serializer.Attributes.DisabledWithEncodedComma,
  Serializer.Attributes.NotDeletable,
  Serializer.Attributes.NotMovable,
  Serializer.Attributes.NotEditable,
];

Serializer.Attributes.Inline = new SerializerTestSuite('Inline');
Serializer.Attributes.Inline.True = new SerializerTestCase(
  'True',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="logic_negate" id="id******************" inline="true" x="42" y="42"></block>' +
    '</xml>',
);
Serializer.Attributes.Inline.False = new SerializerTestCase(
  'False',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="logic_negate" id="id******************" inline="false" x="42" y="42"></block>' +
    '</xml>',
);
Serializer.Attributes.Inline.testCases = [
  Serializer.Attributes.Inline.True,
  Serializer.Attributes.Inline.False,
];

Serializer.Attributes.Coordinates = new SerializerTestSuite('Coordinates');
Serializer.Attributes.Coordinates.Simple = new SerializerTestCase(
  'Simple',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="logic_negate" id="id******************" x="42" y="42"></block>' +
    '</xml>',
);
Serializer.Attributes.Coordinates.Negative = new SerializerTestCase(
  'Negative',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="logic_negate" id="id******************" x="-42" y="-42"></block>' +
    '</xml>',
);
Serializer.Attributes.Coordinates.Zero = new SerializerTestCase(
  'Zero',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="logic_negate" id="id******************" x="0" y="0"></block>' +
    '</xml>',
);
Serializer.Attributes.Coordinates.testCases = [
  Serializer.Attributes.Coordinates.Simple,
  Serializer.Attributes.Coordinates.Negative,
  Serializer.Attributes.Coordinates.Zero,
];

Serializer.Attributes.Id = new SerializerTestSuite('Ids');

Serializer.Attributes.Id.Length = new SerializerTestSuite('Length');
Serializer.Attributes.Id.Length.Short = new SerializerTestCase(
  'Short',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="logic_negate" id="id******************" x="42" y="42"></block>' +
    '</xml>',
);
Serializer.Attributes.Id.Length.Long = new SerializerTestCase(
  'Long',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="logic_negate" id="id***********************" x="42" y="42">' +
    '</block>' +
    '</xml>',
);
Serializer.Attributes.Id.Length.testCases = [
  Serializer.Attributes.Id.Length.Short,
  Serializer.Attributes.Id.Length.Long,
];

Serializer.Attributes.Id.Chars = new SerializerTestSuite('Chars');
Serializer.Attributes.Id.Chars.Symbols = new SerializerTestCase(
  'Symbols',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="logic_negate" id="!#$%()*+,-./:;=?@[]^" x="42" y="42"></block>' +
    '<block type="logic_negate" id="_`{|}~!!!!!!!!!!!!!!" x="42" y="42"></block>' +
    '</xml>',
);
Serializer.Attributes.Id.Chars.Uppercase = new SerializerTestCase(
  'Uppercase',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="logic_negate" id="ABCDEFGHIJKLMNOPQRST" x="42" y="42"></block>' +
    '<block type="logic_negate" id="TUVWXYZAAAAAAAAAAAAA" x="42" y="42"></block>' +
    '</xml>',
);
Serializer.Attributes.Id.Chars.Lowercase = new SerializerTestCase(
  'Lowercase',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="logic_negate" id="abcdefghijklmnopqrst" x="42" y="42"></block>' +
    '<block type="logic_negate" id="tuvwxyzaaaaaaaaaaaaa" x="42" y="42"></block>' +
    '</xml>',
);
Serializer.Attributes.Id.Chars.Numbers = new SerializerTestCase(
  'Numbers',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="logic_negate" id="01234567890000000000" x="42" y="42"></block>' +
    '</xml>',
);
Serializer.Attributes.Id.Chars.testCases = [
  Serializer.Attributes.Id.Chars.Symbols,
  Serializer.Attributes.Id.Chars.Uppercase,
  Serializer.Attributes.Id.Chars.Lowercase,
  Serializer.Attributes.Id.Chars.Numbers,
];

Serializer.Attributes.Id.testSuites = [
  Serializer.Attributes.Id.Length,
  Serializer.Attributes.Id.Chars,
];

Serializer.Attributes.testSuites = [
  Serializer.Attributes.Inline,
  Serializer.Attributes.Coordinates,
  Serializer.Attributes.Id,
];

Serializer.Fields = new SerializerTestSuite('Fields');

Serializer.Fields.Checkbox = new SerializerTestSuite('Checkbox');
Serializer.Fields.Checkbox.True = new SerializerTestCase(
  'True',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="test_fields_checkbox" id="id******************" x="42" y="42">' +
    '<field name="CHECKBOX">TRUE</field>' +
    '</block>' +
    '</xml>',
);
Serializer.Fields.Checkbox.False = new SerializerTestCase(
  'False',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="test_fields_checkbox" id="id******************" x="42" y="42">' +
    '<field name="CHECKBOX">FALSE</field>' +
    '</block>' +
    '</xml>',
);
Serializer.Fields.Checkbox.testCases = [
  Serializer.Fields.Checkbox.True,
  Serializer.Fields.Checkbox.False,
];

Serializer.Fields.Dropdown = new SerializerTestSuite('Dropdown');
Serializer.Fields.Dropdown.Default = new SerializerTestCase(
  'Default',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="test_dropdowns_long" id="id******************" x="42" y="42">' +
    '<field name="FIELDNAME">ITEM1</field>' +
    '</block>' +
    '</xml>',
);
Serializer.Fields.Dropdown.NotDefault = new SerializerTestCase(
  'NotDefault',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="test_dropdowns_long" id="id******************" x="42" y="42">' +
    '<field name="FIELDNAME">ITEM32</field>' +
    '</block>' +
    '</xml>',
);
Serializer.Fields.Dropdown.Dynamic = new SerializerTestCase(
  'Dynamic',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="test_dropdowns_dynamic_random" id="id******************" x="42" y="42">' +
    '<field name="OPTIONS">0</field>' +
    '</block>' +
    '</xml>',
);
Serializer.Fields.Dropdown.testCases = [
  Serializer.Fields.Dropdown.Default,
  Serializer.Fields.Dropdown.NotDefault,
  Serializer.Fields.Dropdown.Dynamic,
];

Serializer.Fields.LabelSerializable = new SerializerTestSuite(
  'LabelSerializable',
);
Serializer.Fields.LabelSerializable.Simple = new SerializerTestCase(
  'Simple',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="test_fields_label_serializable" id="id******************" x="42" y="42">' +
    '<field name="LABEL">test</field>' +
    '</block>' +
    '</xml>',
);
Serializer.Fields.LabelSerializable.Symbols = new SerializerTestCase(
  'Symbols',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="test_fields_label_serializable" id="id******************" x="42" y="42">' +
    '<field name="LABEL">~`!@#$%^*()_+-={[}]|\\:;,.?/</field>' +
    '</block>' +
    '</xml>',
);
Serializer.Fields.LabelSerializable.EscapedSymbols = new SerializerTestCase(
  'EscapedSymbols',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="test_fields_label_serializable" id="id******************" x="42" y="42">' +
    '<field name="LABEL">&amp;&lt;&gt;</field>' +
    '</block>' +
    '</xml>',
);
Serializer.Fields.LabelSerializable.SingleQuotes = new SerializerTestCase(
  'SingleQuotes',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="test_fields_label_serializable" id="id******************" x="42" y="42">' +
    '<field name="LABEL">\'test\'</field>' +
    '</block>' +
    '</xml>',
);
Serializer.Fields.LabelSerializable.DoubleQuotes = new SerializerTestCase(
  'DoubleQuotes',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="test_fields_label_serializable" id="id******************" x="42" y="42">' +
    '<field name="LABEL">"test"</field>' +
    '</block>' +
    '</xml>',
);
Serializer.Fields.LabelSerializable.Numbers = new SerializerTestCase(
  'Numbers',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="test_fields_label_serializable" id="id******************" x="42" y="42">' +
    '<field name="LABEL">1234567890a123a123a</field>' +
    '</block>' +
    '</xml>',
);
Serializer.Fields.LabelSerializable.Emoji = new SerializerTestCase(
  'Emoji',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="test_fields_label_serializable" id="id******************" x="42" y="42">' +
    '<field name="LABEL">😀👋🏿👋🏾👋🏽👋🏼👋🏻😀❤❤❤</field>' +
    '</block>' +
    '</xml>',
);
Serializer.Fields.LabelSerializable.Russian = new SerializerTestCase(
  'Russian',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="test_fields_label_serializable" id="id******************" x="42" y="42">' +
    '<field name="LABEL">ты любопытный кот</field>' +
    '</block>' +
    '</xml>',
);
Serializer.Fields.LabelSerializable.Japanese = new SerializerTestCase(
  'Japanese',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="test_fields_label_serializable" id="id******************" x="42" y="42">' +
    '<field name="LABEL">あなたは好奇心旺盛な猫です</field>' +
    '</block>' +
    '</xml>',
);
Serializer.Fields.LabelSerializable.Zalgo = new SerializerTestCase(
  'Zalgo',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="test_fields_label_serializable" id="id******************" x="42" y="42">' +
    '<field name="LABEL">z̴̪͈̲̜͕̽̈̀͒͂̓̋̉̍a̸̧̧̜̻̘̤̫̱̲͎̞̻͆̋ļ̸̛̖̜̳͚̖͔̟̈́͂̉̀͑̑͑̎ǵ̸̫̳̽̐̃̑̚̕o̶͇̫͔̮̼̭͕̹̘̬͋̀͆̂̇̋͊̒̽</field>' +
    '</block>' +
    '</xml>',
);
Serializer.Fields.LabelSerializable.ControlChars = new SerializerTestCase(
  'ControlChars',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="test_fields_label_serializable" id="id******************" x="42" y="42">' +
    '<field name="LABEL">&#01;&#a1;</field>' +
    '</block>' +
    '</xml>',
);
Serializer.Fields.LabelSerializable.testCases = [
  Serializer.Fields.LabelSerializable.Simple,
  Serializer.Fields.LabelSerializable.Symbols,
  Serializer.Fields.LabelSerializable.EscapedSymbols,
  Serializer.Fields.LabelSerializable.SingleQuotes,
  Serializer.Fields.LabelSerializable.DoubleQuotes,
  Serializer.Fields.LabelSerializable.Numbers,
  Serializer.Fields.LabelSerializable.Emoji,
  Serializer.Fields.LabelSerializable.Russian,
  Serializer.Fields.LabelSerializable.Japanese,
  Serializer.Fields.LabelSerializable.Zalgo,
  // TODO: Uncoment once #4945 is merged.
  // Serializer.Fields.LabelSerializable.ControlChars,
];

Serializer.Fields.Number = new SerializerTestSuite('Number');
Serializer.Fields.Number.Simple = new SerializerTestCase(
  'Simple',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="test_numbers_float" id="id******************" x="42" y="42">' +
    '<field name="NUM">123</field>' +
    '</block>' +
    '</xml>',
);
Serializer.Fields.Number.Negative = new SerializerTestCase(
  'Negative',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="test_numbers_float" id="id******************" x="42" y="42">' +
    '<field name="NUM">-123</field>' +
    '</block>' +
    '</xml>',
);
Serializer.Fields.Number.PosInfinity = new SerializerTestCase(
  'PosInfinity',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="test_numbers_float" id="id******************" x="42" y="42">' +
    '<field name="NUM">Infinity</field>' +
    '</block>' +
    '</xml>',
);
Serializer.Fields.Number.NegInfinity = new SerializerTestCase(
  'NegInfinity',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="test_numbers_float" id="id******************" x="42" y="42">' +
    '<field name="NUM">-Infinity</field>' +
    '</block>' +
    '</xml>',
);
Serializer.Fields.Number.Decimals = new SerializerTestCase(
  'Decimals',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="test_numbers_float" id="id******************" x="42" y="42">' +
    '<field name="NUM">1.5</field>' +
    '</block>' +
    '</xml>',
);
Serializer.Fields.Number.Smallest = new SerializerTestCase(
  'Smallest',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="test_numbers_float" id="id******************" x="42" y="42">' +
    '<field name="NUM">5e-324</field>' +
    '</block>' +
    '</xml>',
);
Serializer.Fields.Number.Largest = new SerializerTestCase(
  'Largest',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="test_numbers_float" id="id******************" x="42" y="42">' +
    '<field name="NUM">1.7976931348623157e+308</field>' +
    '</block>' +
    '</xml>',
);
Serializer.Fields.Number.MaxPrecisionSmall = new SerializerTestCase(
  'MaxPrecisionSmall',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="test_numbers_float" id="id******************" x="42" y="42">' +
    '<field name="NUM">1.000000000000001</field>' +
    '</block>' +
    '</xml>',
);
Serializer.Fields.Number.MaxPrecisionLarge = new SerializerTestCase(
  'MaxPrecisionLarge',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="test_numbers_float" id="id******************" x="42" y="42">' +
    '<field name="NUM">1000000000000001</field>' +
    '</block>' +
    '</xml>',
);
Serializer.Fields.Number.testCases = [
  Serializer.Fields.Number.Simple,
  Serializer.Fields.Number.Negative,
  Serializer.Fields.Number.PosInfinity,
  Serializer.Fields.Number.NegInfinity,
  Serializer.Fields.Number.Decimals,
  Serializer.Fields.Number.Smallest,
  Serializer.Fields.Number.Largest,
  Serializer.Fields.Number.MaxPrecisionSmall,
  Serializer.Fields.Number.MaxPrecisionLarge,
];

Serializer.Fields.TextInput = new SerializerTestSuite('TextInput');
Serializer.Fields.TextInput.Simple = new SerializerTestCase(
  'Simple',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="test_fields_text_input" id="id******************" x="42" y="42">' +
    '<field name="TEXT_INPUT">test</field>' +
    '</block>' +
    '</xml>',
);
Serializer.Fields.TextInput.Tabs = new SerializerTestCase(
  'Tabs',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="test_fields_text_input" id="id******************" x="42" y="42">' +
    '<field name="TEXT_INPUT">line1&amp;#x9line2&amp;#x9line3</field>' +
    '</block>' +
    '</xml>',
);
Serializer.Fields.TextInput.Symbols = new SerializerTestCase(
  'Symbols',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="test_fields_text_input" id="id******************" x="42" y="42">' +
    '<field name="TEXT_INPUT">~`!@#$%^*()_+-={[}]|\\:;,.?/</field>' +
    '</block>' +
    '</xml>',
);
Serializer.Fields.TextInput.EscapedSymbols = new SerializerTestCase(
  'EscapedSymbols',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="test_fields_text_input" id="id******************" x="42" y="42">' +
    '<field name="TEXT_INPUT">&amp;&lt;&gt;</field>' +
    '</block>' +
    '</xml>',
);
Serializer.Fields.TextInput.SingleQuotes = new SerializerTestCase(
  'SingleQuotes',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="test_fields_text_input" id="id******************" x="42" y="42">' +
    '<field name="TEXT_INPUT">\'test\'</field>' +
    '</block>' +
    '</xml>',
);
Serializer.Fields.TextInput.DoubleQuotes = new SerializerTestCase(
  'DoubleQuotes',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="test_fields_text_input" id="id******************" x="42" y="42">' +
    '<field name="TEXT_INPUT">"test"</field>' +
    '</block>' +
    '</xml>',
);
Serializer.Fields.TextInput.Numbers = new SerializerTestCase(
  'Numbers',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="test_fields_text_input" id="id******************" x="42" y="42">' +
    '<field name="TEXT_INPUT">1234567890a123a123a</field>' +
    '</block>' +
    '</xml>',
);
Serializer.Fields.TextInput.Emoji = new SerializerTestCase(
  'Emoji',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="test_fields_text_input" id="id******************" x="42" y="42">' +
    '<field name="TEXT_INPUT">😀👋🏿👋🏾👋🏽👋🏼👋🏻😀❤❤❤</field>' +
    '</block>' +
    '</xml>',
);
Serializer.Fields.TextInput.Russian = new SerializerTestCase(
  'Russian',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="test_fields_text_input" id="id******************" x="42" y="42">' +
    '<field name="TEXT_INPUT">ты любопытный кот</field>' +
    '</block>' +
    '</xml>',
);
Serializer.Fields.TextInput.Japanese = new SerializerTestCase(
  'Japanese',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="test_fields_text_input" id="id******************" x="42" y="42">' +
    '<field name="TEXT_INPUT">あなたは好奇心旺盛な猫です</field>' +
    '</block>' +
    '</xml>',
);
Serializer.Fields.TextInput.Zalgo = new SerializerTestCase(
  'Zalgo',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="test_fields_text_input" id="id******************" x="42" y="42">' +
    '<field name="TEXT_INPUT">z̴̪͈̲̜͕̽̈̀͒͂̓̋̉̍a̸̧̧̜̻̘̤̫̱̲͎̞̻͆̋ļ̸̛̖̜̳͚̖͔̟̈́͂̉̀͑̑͑̎ǵ̸̫̳̽̐̃̑̚̕o̶͇̫͔̮̼̭͕̹̘̬͋̀͆̂̇̋͊̒̽</field>' +
    '</block>' +
    '</xml>',
);
Serializer.Fields.TextInput.ControlChars = new SerializerTestCase(
  'ControlChars',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="test_fields_text_input" id="id******************" x="42" y="42">' +
    '<field name="TEXT_INPUT">&#01;&#a1;</field>' +
    '</block>' +
    '</xml>',
);
Serializer.Fields.TextInput.testCases = [
  Serializer.Fields.TextInput.Simple,
  Serializer.Fields.TextInput.Tabs,
  Serializer.Fields.TextInput.Symbols,
  Serializer.Fields.TextInput.EscapedSymbols,
  Serializer.Fields.TextInput.SingleQuotes,
  Serializer.Fields.TextInput.DoubleQuotes,
  Serializer.Fields.TextInput.Numbers,
  Serializer.Fields.TextInput.Emoji,
  Serializer.Fields.TextInput.Russian,
  Serializer.Fields.TextInput.Japanese,
  Serializer.Fields.TextInput.Zalgo,
  // TODO: Uncoment once #4945 is merged.
  // Serializer.Fields.TextInput.ControlChars,
];

Serializer.Fields.Variable = new SerializerTestSuite('Variable');
Serializer.Fields.Variable.Simple = new SerializerTestCase(
  'Simple',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<variables>' +
    '<variable id="aaaaaaaaaaaaaaaaaaaa">test</variable>' +
    '</variables>' +
    '<block type="variables_get" id="id******************" x="42" y="42">' +
    '<field name="VAR" id="aaaaaaaaaaaaaaaaaaaa">test</field>' +
    '</block>' +
    '</xml>',
);
Serializer.Fields.Variable.Types = new SerializerTestCase(
  'Types',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<variables>' +
    '<variable type="String" id="aaaaaaaaaaaaaaaaaaaa">test</variable>' +
    '<variable type="Number" id="bbbbbbbbbbbbbbbbbbbb">test2</variable>' +
    '<variable type="Colour" id="cccccccccccccccccccc">test3</variable>' +
    '</variables>' +
    '<block type="variables_get_dynamic" id="id******************" x="42" y="42">' +
    '<field name="VAR" id="aaaaaaaaaaaaaaaaaaaa" variabletype="String">test</field>' +
    '</block>' +
    '<block type="variables_get_dynamic" id="id2*****************" x="42" y="84">' +
    '<field name="VAR" id="bbbbbbbbbbbbbbbbbbbb" variabletype="Number">test2</field>' +
    '</block>' +
    '<block type="variables_get_dynamic" id="id3*****************" x="42" y="106">' +
    '<field name="VAR" id="cccccccccccccccccccc" variabletype="Colour">test3</field>' +
    '</block>' +
    '</xml>',
);
Serializer.Fields.Variable.Tabs = new SerializerTestCase(
  'Tabs',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<variables>' +
    '<variable id="aaaaaaaaaaaaaaaaaaaa">line1&amp;#x9line2&amp;#x9line3</variable>' +
    '</variables>' +
    '<block type="variables_get" id="id******************" x="42" y="42">' +
    '<field name="VAR" id="aaaaaaaaaaaaaaaaaaaa">line1&amp;#x9line2&amp;#x9line3</field>' +
    '</block>' +
    '</xml>',
);
Serializer.Fields.Variable.Symbols = new SerializerTestCase(
  'Symbols',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<variables>' +
    '<variable id="aaaaaaaaaaaaaaaaaaaa">~`!@#$%^*()_+-={[}]|\\:;,.?/</variable>' +
    '</variables>' +
    '<block type="variables_get" id="id******************" x="42" y="42">' +
    '<field name="VAR" id="aaaaaaaaaaaaaaaaaaaa">~`!@#$%^*()_+-={[}]|\\:;,.?/</field>' +
    '</block>' +
    '</xml>',
);
Serializer.Fields.Variable.EscapedSymbols = new SerializerTestCase(
  'EscapedSymbols',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<variables>' +
    '<variable id="aaaaaaaaaaaaaaaaaaaa">&amp;&lt;&gt;</variable>' +
    '</variables>' +
    '<block type="variables_get" id="id******************" x="42" y="42">' +
    '<field name="VAR" id="aaaaaaaaaaaaaaaaaaaa">&amp;&lt;&gt;</field>' +
    '</block>' +
    '</xml>',
);
Serializer.Fields.Variable.SingleQuotes = new SerializerTestCase(
  'SingleQuotes',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<variables>' +
    '<variable id="aaaaaaaaaaaaaaaaaaaa">\'test\'</variable>' +
    '</variables>' +
    '<block type="variables_get" id="id******************" x="42" y="42">' +
    '<field name="VAR" id="aaaaaaaaaaaaaaaaaaaa">\'test\'</field>' +
    '</block>' +
    '</xml>',
);
Serializer.Fields.Variable.DoubleQuotes = new SerializerTestCase(
  'DoubleQuotes',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<variables>' +
    '<variable id="aaaaaaaaaaaaaaaaaaaa">"test"</variable>' +
    '</variables>' +
    '<block type="variables_get" id="id******************" x="42" y="42">' +
    '<field name="VAR" id="aaaaaaaaaaaaaaaaaaaa">"test"</field>' +
    '</block>' +
    '</xml>',
);
Serializer.Fields.Variable.Numbers = new SerializerTestCase(
  'Numbers',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<variables>' +
    '<variable id="aaaaaaaaaaaaaaaaaaaa">1234567890a123a123a</variable>' +
    '</variables>' +
    '<block type="variables_get" id="id******************" x="42" y="42">' +
    '<field name="VAR" id="aaaaaaaaaaaaaaaaaaaa">1234567890a123a123a</field>' +
    '</block>' +
    '</xml>',
);
Serializer.Fields.Variable.Emoji = new SerializerTestCase(
  'Emoji',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<variables>' +
    '<variable id="aaaaaaaaaaaaaaaaaaaa">😀👋🏿👋🏾👋🏽👋🏼👋🏻😀❤❤❤</variable>' +
    '</variables>' +
    '<block type="variables_get" id="id******************" x="42" y="42">' +
    '<field name="VAR" id="aaaaaaaaaaaaaaaaaaaa">😀👋🏿👋🏾👋🏽👋🏼👋🏻😀❤❤❤</field>' +
    '</block>' +
    '</xml>',
);
Serializer.Fields.Variable.Russian = new SerializerTestCase(
  'Russian',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<variables>' +
    '<variable id="aaaaaaaaaaaaaaaaaaaa">ты любопытный кот</variable>' +
    '</variables>' +
    '<block type="variables_get" id="id******************" x="42" y="42">' +
    '<field name="VAR" id="aaaaaaaaaaaaaaaaaaaa">ты любопытный кот</field>' +
    '</block>' +
    '</xml>',
);
Serializer.Fields.Variable.Japanese = new SerializerTestCase(
  'Japanese',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<variables>' +
    '<variable id="aaaaaaaaaaaaaaaaaaaa">あなたは好奇心旺盛な猫です</variable>' +
    '</variables>' +
    '<block type="variables_get" id="id******************" x="42" y="42">' +
    '<field name="VAR" id="aaaaaaaaaaaaaaaaaaaa">あなたは好奇心旺盛な猫です</field>' +
    '</block>' +
    '</xml>',
);
Serializer.Fields.Variable.Zalgo = new SerializerTestCase(
  'Zalgo',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<variables>' +
    '<variable id="aaaaaaaaaaaaaaaaaaaa">z̴̪͈̲̜͕̽̈̀͒͂̓̋̉̍a̸̧̧̜̻̘̤̫̱̲͎̞̻͆̋ļ̸̛̖̜̳͚̖͔̟̈́͂̉̀͑̑͑̎ǵ̸̫̳̽̐̃̑̚̕o̶͇̫͔̮̼̭͕̹̘̬͋̀͆̂̇̋͊̒̽</variable>' +
    '</variables>' +
    '<block type="variables_get" id="id******************" x="42" y="42">' +
    '<field name="VAR" id="aaaaaaaaaaaaaaaaaaaa">z̴̪͈̲̜͕̽̈̀͒͂̓̋̉̍a̸̧̧̜̻̘̤̫̱̲͎̞̻͆̋ļ̸̛̖̜̳͚̖͔̟̈́͂̉̀͑̑͑̎ǵ̸̫̳̽̐̃̑̚̕o̶͇̫͔̮̼̭͕̹̘̬͋̀͆̂̇̋͊̒̽</field>' +
    '</block>' +
    '</xml>',
);
Serializer.Fields.Variable.ControlChars = new SerializerTestCase(
  'ControlChars',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<variables>' +
    '<variable id="aaaaaaaaaaaaaaaaaaaa">&#01;&#a1;</variable>' +
    '</variables>' +
    '<block type="variables_get" id="id******************" x="42" y="42">' +
    '<field name="VAR" id="aaaaaaaaaaaaaaaaaaaa">&#01;&#a1;</field>' +
    '</block>' +
    '</xml>',
);
Serializer.Fields.Variable.testCases = [
  Serializer.Fields.Variable.Simple,
  Serializer.Fields.Variable.Types,
  Serializer.Fields.Variable.Tabs,
  Serializer.Fields.Variable.Symbols,
  Serializer.Fields.Variable.EscapedSymbols,
  Serializer.Fields.Variable.SingleQuotes,
  Serializer.Fields.Variable.DoubleQuotes,
  Serializer.Fields.Variable.Numbers,
  Serializer.Fields.Variable.Emoji,
  Serializer.Fields.Variable.Russian,
  Serializer.Fields.Variable.Japanese,
  Serializer.Fields.Variable.Zalgo,
  // TODO: Uncoment once #4945 is merged.
  // Serializer.Fields.Variable.ControlChars,
];

Serializer.Fields.Variable.Id = new SerializerTestSuite('Id');

Serializer.Fields.Variable.Id.Length = new SerializerTestSuite('Length');
Serializer.Fields.Variable.Id.Length.Short = new SerializerTestCase(
  'Short',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<variables>' +
    '<variable id="id">test</variable>' +
    '</variables>' +
    '<block type="variables_get" id="id******************" x="42" y="42">' +
    '<field name="VAR" id="id">test</field>' +
    '</block>' +
    '</xml>',
);
Serializer.Fields.Variable.Id.Length.Long = new SerializerTestCase(
  'Long',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<variables>' +
    '<variable id="id***********************">test</variable>' +
    '</variables>' +
    '<block type="variables_get" id="id******************" x="42" y="42">' +
    '<field name="VAR" id="id***********************">test</field>' +
    '</block>' +
    '</xml>',
);
Serializer.Fields.Variable.Id.Length.testCases = [
  Serializer.Fields.Variable.Id.Length.Short,
  Serializer.Fields.Variable.Id.Length.Long,
];

Serializer.Fields.Variable.Id.Chars = new SerializerTestSuite('Chars');
Serializer.Fields.Variable.Id.Chars.Symbols = new SerializerTestCase(
  'Symbols',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<variables>' +
    '<variable id="!#$%()*+,-./:;=?@[]^">test</variable>' +
    '<variable id="_`{|}~!!!!!!!!!!!!!!">test2</variable>' +
    '</variables>' +
    '<block type="variables_get" id="id******************" x="42" y="42">' +
    '<field name="VAR" id="!#$%()*+,-./:;=?@[]^">test</field>' +
    '</block>' +
    '<block type="variables_get" id="id1*****************" x="42" y="42">' +
    '<field name="VAR" id="_`{|}~!!!!!!!!!!!!!!">test2</field>' +
    '</block>' +
    '</xml>',
);
Serializer.Fields.Variable.Id.Chars.Uppercase = new SerializerTestCase(
  'Uppercase',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<variables>' +
    '<variable id="ABCDEFGHIJKLMNOPQRST">test</variable>' +
    '<variable id="TUVWXYZAAAAAAAAAAAAA">test2</variable>' +
    '</variables>' +
    '<block type="variables_get" id="id******************" x="42" y="42">' +
    '<field name="VAR" id="ABCDEFGHIJKLMNOPQRST">test</field>' +
    '</block>' +
    '<block type="variables_get" id="id1*****************" x="42" y="42">' +
    '<field name="VAR" id="TUVWXYZAAAAAAAAAAAAA">test2</field>' +
    '</block>' +
    '</xml>',
);
Serializer.Fields.Variable.Id.Chars.Lowercase = new SerializerTestCase(
  'Lowercase',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<variables>' +
    '<variable id="abcdefghijklmnopqrst">test</variable>' +
    '<variable id="tuvwxyzaaaaaaaaaaaaa">test2</variable>' +
    '</variables>' +
    '<block type="variables_get" id="id******************" x="42" y="42">' +
    '<field name="VAR" id="abcdefghijklmnopqrst">test</field>' +
    '</block>' +
    '<block type="variables_get" id="id1*****************" x="42" y="42">' +
    '<field name="VAR" id="tuvwxyzaaaaaaaaaaaaa">test2</field>' +
    '</block>' +
    '</xml>',
);
Serializer.Fields.Variable.Id.Chars.Numbers = new SerializerTestCase(
  'Numbers',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<variables>' +
    '<variable id="01234567890000000000">test</variable>' +
    '</variables>' +
    '<block type="variables_get" id="id******************" x="42" y="42">' +
    '<field name="VAR" id="01234567890000000000">test</field>' +
    '</block>' +
    '</xml>',
);
Serializer.Fields.Variable.Id.Chars.testCases = [
  Serializer.Fields.Variable.Id.Chars.Symbols,
  Serializer.Fields.Variable.Id.Chars.Uppercase,
  Serializer.Fields.Variable.Id.Chars.Lowercase,
  Serializer.Fields.Variable.Id.Chars.Numbers,
];

Serializer.Fields.Variable.Id.testSuites = [
  Serializer.Fields.Variable.Id.Length,
  Serializer.Fields.Variable.Id.Chars,
];

Serializer.Fields.Variable.testSuites = [Serializer.Fields.Variable.Id];

Serializer.Fields.testSuites = [
  Serializer.Fields.Checkbox,
  Serializer.Fields.Dropdown,
  Serializer.Fields.LabelSerializable,
  Serializer.Fields.Number,
  Serializer.Fields.TextInput,
  Serializer.Fields.Variable,
];

Serializer.Icons = new SerializerTestSuite('Icons');

Serializer.Icons.Comment = new SerializerTestSuite('Comment');
Serializer.Icons.Comment.Basic = new SerializerTestCase(
  'Basic',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="logic_negate" id="id******************" x="42" y="42">' +
    '<comment pinned="false" h="80" w="160">test</comment>' +
    '</block>' +
    '</xml>',
);

Serializer.Icons.Comment.Size = new SerializerTestSuite('Size');
Serializer.Icons.Comment.Size.Different = new SerializerTestCase(
  'Different',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="logic_negate" id="id******************" x="42" y="42">' +
    '<comment pinned="false" h="160" w="80">test</comment>' +
    '</block>' +
    '</xml>',
);
Serializer.Icons.Comment.Size.Large = new SerializerTestCase(
  'Large',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="logic_negate" id="id******************" x="42" y="42">' +
    '<comment pinned="false" h="10000" w="10000">test</comment>' +
    '</block>' +
    '</xml>',
);
Serializer.Icons.Comment.Size.testCases = [
  Serializer.Icons.Comment.Size.Different,
  Serializer.Icons.Comment.Size.Large,
];

Serializer.Icons.Comment.Pinned = new SerializerTestSuite('Pinned');
Serializer.Icons.Comment.Pinned.True = new SerializerTestCase(
  'True',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="logic_negate" id="id******************" x="42" y="42">' +
    '<comment pinned="true" h="80" w="160">test</comment>' +
    '</block>' +
    '</xml>',
);
Serializer.Icons.Comment.Pinned.False = new SerializerTestCase(
  'False',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="logic_negate" id="id******************" x="42" y="42">' +
    '<comment pinned="false" h="80" w="160">test</comment>' +
    '</block>' +
    '</xml>',
);
Serializer.Icons.Comment.Pinned.testCases = [
  Serializer.Icons.Comment.Pinned.True,
  Serializer.Icons.Comment.Pinned.False,
];

Serializer.Icons.Comment.Text = new SerializerTestSuite('Text');
Serializer.Icons.Comment.Text.Symbols = new SerializerTestCase(
  'Symbols',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="logic_negate" id="id******************" x="42" y="42">' +
    '<comment pinned="false" h="80" w="160">~`!@#$%^*()_+-={[}]|\\:;,.?/</comment>' +
    '</block>' +
    '</xml>',
);
Serializer.Icons.Comment.Text.EscapedSymbols = new SerializerTestCase(
  'EscapedSymbols',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="logic_negate" id="id******************" x="42" y="42">' +
    '<comment pinned="false" h="80" w="160">&amp;&lt;&gt;</comment>' +
    '</block>' +
    '</xml>',
);
Serializer.Icons.Comment.Text.SingleQuotes = new SerializerTestCase(
  'SingleQuotes',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="logic_negate" id="id******************" x="42" y="42">' +
    '<comment pinned="false" h="80" w="160">\'test\'</comment>' +
    '</block>' +
    '</xml>',
);
Serializer.Icons.Comment.Text.DoubleQuotes = new SerializerTestCase(
  'DoubleQuotes',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="logic_negate" id="id******************" x="42" y="42">' +
    '<comment pinned="false" h="80" w="160">"test"</comment>' +
    '</block>' +
    '</xml>',
);
Serializer.Icons.Comment.Text.Numbers = new SerializerTestCase(
  'Numbers',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="logic_negate" id="id******************" x="42" y="42">' +
    '<comment pinned="false" h="80" w="160">1234567890a123a123a</comment>' +
    '</block>' +
    '</xml>',
);
Serializer.Icons.Comment.Text.Emoji = new SerializerTestCase(
  'Emoji',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="logic_negate" id="id******************" x="42" y="42">' +
    '<comment pinned="false" h="80" w="160">😀👋🏿👋🏾👋🏽👋🏼👋🏻😀❤❤❤</comment>' +
    '</block>' +
    '</xml>',
);
Serializer.Icons.Comment.Text.Russian = new SerializerTestCase(
  'Russian',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="logic_negate" id="id******************" x="42" y="42">' +
    '<comment pinned="false" h="80" w="160">ты любопытный кот</comment>' +
    '</block>' +
    '</xml>',
);
Serializer.Icons.Comment.Text.Japanese = new SerializerTestCase(
  'Japanese',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="logic_negate" id="id******************" x="42" y="42">' +
    '<comment pinned="false" h="80" w="160">あなたは好奇心旺盛な猫です</comment>' +
    '</block>' +
    '</xml>',
);
Serializer.Icons.Comment.Text.Zalgo = new SerializerTestCase(
  'Zalgo',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="logic_negate" id="id******************" x="42" y="42">' +
    '<comment pinned="false" h="80" w="160">z̴̪͈̲̜͕̽̈̀͒͂̓̋̉̍a̸̧̧̜̻̘̤̫̱̲͎̞̻͆̋ļ̸̛̖̜̳͚̖͔̟̈́͂̉̀͑̑͑̎ǵ̸̫̳̽̐̃̑̚̕o̶͇̫͔̮̼̭͕̹̘̬͋̀͆̂̇̋͊̒̽</comment>' +
    '</block>' +
    '</xml>',
);
Serializer.Icons.Comment.Text.ControlChars = new SerializerTestCase(
  'ControlChars',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="logic_negate" id="id******************" x="42" y="42">' +
    '<comment pinned="false" h="80" w="160">&#01;&#a1;</comment>' +
    '</block>' +
    '</xml>',
);
Serializer.Icons.Comment.Text.testCases = [
  Serializer.Icons.Comment.Text.Symbols,
  Serializer.Icons.Comment.Text.EscapedSymbols,
  Serializer.Icons.Comment.Text.SingleQuotes,
  Serializer.Icons.Comment.Text.DoubleQuotes,
  Serializer.Icons.Comment.Text.Numbers,
  Serializer.Icons.Comment.Text.Emoji,
  Serializer.Icons.Comment.Text.Russian,
  Serializer.Icons.Comment.Text.Japanese,
  Serializer.Icons.Comment.Text.Zalgo,
  // TODO: Uncoment once #4945 is merged.
  // Serializer.Icons.Comment.Text.ControlChars,
];

Serializer.Icons.Comment.testSuites = [
  Serializer.Icons.Comment.Size,
  Serializer.Icons.Comment.Pinned,
  Serializer.Icons.Comment.Text,
];

Serializer.Icons.Comment.testCases = [Serializer.Icons.Comment.Basic];

Serializer.Icons.testSuites = [Serializer.Icons.Comment];

Serializer.Connections = new SerializerTestSuite('Connections');

Serializer.Connections.Child = new SerializerTestSuite('Child');
Serializer.Connections.Child.Value = new SerializerTestCase(
  'Value',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="logic_negate" id="id******************" x="42" y="42">' +
    '<value name="BOOL">' +
    '<block type="logic_boolean" id="id2*****************">' +
    '<field name="BOOL">TRUE</field>' +
    '</block>' +
    '</value>' +
    '</block>' +
    '</xml>',
);
Serializer.Connections.Child.Statement = new SerializerTestCase(
  'Statement',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="controls_repeat_ext" id="id******************" x="42" y="42">' +
    '<statement name="DO">' +
    '<block type="text_print" id="id2*****************"></block>' +
    '</statement>' +
    '</block>' +
    '</xml>',
);
Serializer.Connections.Child.Next = new SerializerTestCase(
  'Next',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="text_print" id="id******************" x="42" y="42">' +
    '<next>' +
    '<block type="text_print" id="id2*****************"></block>' +
    '</next>' +
    '</block>' +
    '</xml>',
);
Serializer.Connections.Child.Row = new SerializerTestCase(
  'Row',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="logic_negate" id="id******************" x="42" y="42">' +
    '<value name="BOOL">' +
    '<block type="logic_negate" id="id2*****************">' +
    '<value name="BOOL">' +
    '<block type="logic_boolean" id="id3*****************">' +
    '<field name="BOOL">TRUE</field>' +
    '</block>' +
    '</value>' +
    '</block>' +
    '</value>' +
    '</block>' +
    '</xml>',
);
Serializer.Connections.Child.Nested = new SerializerTestCase(
  'Nested',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="controls_repeat_ext" id="id******************" x="42" y="42">' +
    '<statement name="DO">' +
    '<block type="controls_repeat_ext" id="id2*****************">' +
    '<statement name="DO">' +
    '<block type="text_print" id="id3*****************"></block>' +
    '</statement>' +
    '</block>' +
    '</statement>' +
    '</block>' +
    '</xml>',
);
Serializer.Connections.Child.Stack = new SerializerTestCase(
  'Stack',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="text_print" id="id******************" x="42" y="42">' +
    '<next>' +
    '<block type="text_print" id="id2*****************">' +
    '<next>' +
    '<block type="text_print" id="id3*****************"></block>' +
    '</next>' +
    '</block>' +
    '</next>' +
    '</block>' +
    '</xml>',
);
Serializer.Connections.Child.testCases = [
  Serializer.Connections.Child.Value,
  Serializer.Connections.Child.Statement,
  Serializer.Connections.Child.Next,
  Serializer.Connections.Child.Row,
  Serializer.Connections.Child.Nested,
  Serializer.Connections.Child.Stack,
];

Serializer.Connections.Shadow = new SerializerTestSuite('Shadow');
Serializer.Connections.Shadow.Value = new SerializerTestCase(
  'Value',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="logic_negate" id="id******************" x="42" y="42">' +
    '<value name="BOOL">' +
    '<shadow type="logic_boolean" id="id2*****************">' +
    '<field name="BOOL">TRUE</field>' +
    '</shadow>' +
    '</value>' +
    '</block>' +
    '</xml>',
);
Serializer.Connections.Shadow.Statement = new SerializerTestCase(
  'Statement',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="controls_repeat_ext" id="id******************" x="42" y="42">' +
    '<statement name="DO">' +
    '<shadow type="text_print" id="id2*****************"></shadow>' +
    '</statement>' +
    '</block>' +
    '</xml>',
);
Serializer.Connections.Shadow.Next = new SerializerTestCase(
  'Next',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="text_print" id="id******************" x="42" y="42">' +
    '<next>' +
    '<shadow type="text_print" id="id2*****************"></shadow>' +
    '</next>' +
    '</block>' +
    '</xml>',
);
Serializer.Connections.Shadow.Row = new SerializerTestCase(
  'Row',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="logic_negate" id="id******************" x="42" y="42">' +
    '<value name="BOOL">' +
    '<shadow type="logic_negate" id="id2*****************">' +
    '<value name="BOOL">' +
    '<shadow type="logic_boolean" id="id3*****************">' +
    '<field name="BOOL">TRUE</field>' +
    '</shadow>' +
    '</value>' +
    '</shadow>' +
    '</value>' +
    '</block>' +
    '</xml>',
);
Serializer.Connections.Shadow.Nested = new SerializerTestCase(
  'Nested',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="controls_repeat_ext" id="id******************" x="42" y="42">' +
    '<statement name="DO">' +
    '<shadow type="controls_repeat_ext" id="id2*****************">' +
    '<statement name="DO">' +
    '<shadow type="text_print" id="id3*****************"></shadow>' +
    '</statement>' +
    '</shadow>' +
    '</statement>' +
    '</block>' +
    '</xml>',
);
Serializer.Connections.Shadow.Stack = new SerializerTestCase(
  'Stack',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="text_print" id="id******************" x="42" y="42">' +
    '<next>' +
    '<shadow type="text_print" id="id2*****************">' +
    '<next>' +
    '<shadow type="text_print" id="id3*****************"></shadow>' +
    '</next>' +
    '</shadow>' +
    '</next>' +
    '</block>' +
    '</xml>',
);
Serializer.Connections.Shadow.testCases = [
  Serializer.Connections.Shadow.Value,
  Serializer.Connections.Shadow.Statement,
  Serializer.Connections.Shadow.Next,
  Serializer.Connections.Shadow.Row,
  Serializer.Connections.Shadow.Nested,
  Serializer.Connections.Shadow.Stack,
];

Serializer.Connections.OverwrittenShadow = new SerializerTestSuite(
  'OverwrittenShadow',
);
Serializer.Connections.OverwrittenShadow.Value = new SerializerTestCase(
  'Value',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="logic_negate" id="id******************" x="42" y="42">' +
    '<value name="BOOL">' +
    '<shadow type="logic_boolean" id="id2*****************">' +
    '<field name="BOOL">TRUE</field>' +
    '</shadow>' +
    '<block type="logic_boolean" id="id3*****************">' +
    '<field name="BOOL">TRUE</field>' +
    '</block>' +
    '</value>' +
    '</block>' +
    '</xml>',
);
Serializer.Connections.OverwrittenShadow.Statement = new SerializerTestCase(
  'Statement',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="controls_repeat_ext" id="id******************" x="42" y="42">' +
    '<statement name="DO">' +
    '<shadow type="text_print" id="id2*****************"></shadow>' +
    '<block type="text_print" id="id3*****************"></block>' +
    '</statement>' +
    '</block>' +
    '</xml>',
);
Serializer.Connections.OverwrittenShadow.Next = new SerializerTestCase(
  'Next',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="text_print" id="id******************" x="42" y="42">' +
    '<next>' +
    '<block type="text_print" id="id2*****************"></block>' +
    '<shadow type="text_print" id="id3*****************"></shadow>' +
    '</next>' +
    '</block>' +
    '</xml>',
);
Serializer.Connections.OverwrittenShadow.Row = new SerializerTestCase(
  'Row',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="logic_negate" id="id******************" x="42" y="42">' +
    '<value name="BOOL">' +
    '<shadow type="logic_negate" id="id2*****************">' +
    '<value name="BOOL">' +
    '<shadow type="logic_boolean" id="id3*****************">' +
    '<field name="BOOL">TRUE</field>' +
    '</shadow>' +
    '</value>' +
    '</shadow>' +
    '<block type="logic_boolean" id="id4*****************">' +
    '<field name="BOOL">TRUE</field>' +
    '</block>' +
    '</value>' +
    '</block>' +
    '</xml>',
);
Serializer.Connections.OverwrittenShadow.Nested = new SerializerTestCase(
  'Nested',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="controls_repeat_ext" id="id******************" x="42" y="42">' +
    '<statement name="DO">' +
    '<shadow type="controls_repeat_ext" id="id2*****************">' +
    '<statement name="DO">' +
    '<shadow type="text_print" id="id3*****************"></shadow>' +
    '</statement>' +
    '</shadow>' +
    '<block type="text_print" id="id4*****************"></block>' +
    '</statement>' +
    '</block>' +
    '</xml>',
);
Serializer.Connections.OverwrittenShadow.Stack = new SerializerTestCase(
  'Stack',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="text_print" id="id******************" x="42" y="42">' +
    '<next>' +
    '<block type="text_print" id="id2*****************"></block>' +
    '<shadow type="text_print" id="id3*****************">' +
    '<next>' +
    '<shadow type="text_print" id="id4*****************"></shadow>' +
    '</next>' +
    '</shadow>' +
    '</next>' +
    '</block>' +
    '</xml>',
);
Serializer.Connections.OverwrittenShadow.testCases = [
  Serializer.Connections.OverwrittenShadow.Value,
  Serializer.Connections.OverwrittenShadow.Statement,
  Serializer.Connections.OverwrittenShadow.Next,
  Serializer.Connections.OverwrittenShadow.Row,
  Serializer.Connections.OverwrittenShadow.Nested,
  Serializer.Connections.OverwrittenShadow.Stack,
];

Serializer.Connections.testSuites = [
  Serializer.Connections.Child,
  Serializer.Connections.Shadow,
  Serializer.Connections.OverwrittenShadow,
];

Serializer.Mutations = new SerializerTestSuite('Mutations');
Serializer.Mutations.ListGetIndex = new SerializerTestCase(
  'ListGetIndex',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="lists_getIndex" id="id" x="42" y="42">' +
    '<mutation statement="true" at="false"></mutation>' +
    '<field name="MODE">REMOVE</field>' +
    '<field name="WHERE">LAST</field>' +
    '</block>' +
    '</xml>',
);
Serializer.Mutations.ListSetIndex = new SerializerTestCase(
  'ListSetIndex',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="lists_setIndex" id="id" x="42" y="42">' +
    '<mutation at="false"></mutation>' +
    '<field name="MODE">SET</field>' +
    '<field name="WHERE">LAST</field>' +
    '</block>' +
    '</xml>',
);
Serializer.Mutations.ListGetSublist = new SerializerTestCase(
  'ListGetSublist',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="lists_getSublist" id="id" x="42" y="42">' +
    '<mutation at1="false" at2="false"></mutation>' +
    '<field name="WHERE1">FIRST</field>' +
    '<field name="WHERE2">LAST</field>' +
    '</block>' +
    '</xml>',
);
Serializer.Mutations.MathNumberProperty = new SerializerTestCase(
  'MathNumberProperty',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="math_number_property" id="id" x="42" y="42">' +
    '<mutation divisor_input="true"></mutation>' +
    '<field name="PROPERTY">DIVISIBLE_BY</field>' +
    '</block>' +
    '</xml>',
);
Serializer.Mutations.MathOnList = new SerializerTestCase(
  'MathOnList',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="math_on_list" id="id" x="42" y="42">' +
    '<mutation op="MODE"></mutation>' +
    '<field name="OP">MODE</field>' +
    '</block>' +
    '</xml>',
);
Serializer.Mutations.TextJoin = new SerializerTestCase(
  'TextJoin',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="text_join" id="id" x="42" y="42">' +
    '<mutation items="10"></mutation>' +
    '</block>' +
    '</xml>',
);
Serializer.Mutations.TextCharAt = new SerializerTestCase(
  'TextCharAt',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="text_charAt" id="id" x="42" y="42">' +
    '<mutation at="false"></mutation>' +
    '<field name="WHERE">FIRST</field>' +
    '</block>' +
    '</xml>',
);
Serializer.Mutations.TextGetSubstring = new SerializerTestCase(
  'TextGetSubstring',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="text_getSubstring" id="id" x="42" y="42">' +
    '<mutation at1="true" at2="false"></mutation>' +
    '<field name="WHERE1">FROM_START</field>' +
    '<field name="WHERE2">LAST</field>' +
    '</block>' +
    '</xml>',
);
Serializer.Mutations.TextPromptExt = new SerializerTestCase(
  'TextPromptExt',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="text_prompt_ext" id="id" x="42" y="42">' +
    '<mutation type="NUMBER"></mutation>' +
    '<field name="TYPE">NUMBER</field>' +
    '</block>' +
    '</xml>',
);
Serializer.Mutations.TextPrompt = new SerializerTestCase(
  'TextPrompt',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="text_prompt" id="id" x="42" y="42">' +
    '<mutation type="NUMBER"></mutation>' +
    '<field name="TYPE">NUMBER</field>' +
    '<field name="TEXT"></field>' +
    '</block>' +
    '</xml>',
);
Serializer.Mutations.testCases = [
  Serializer.Mutations.ListGetIndex,
  Serializer.Mutations.ListSetIndex,
  Serializer.Mutations.ListGetSublist,
  Serializer.Mutations.MathNumberProperty,
  Serializer.Mutations.MathOnList,
  Serializer.Mutations.TextJoin,
  Serializer.Mutations.TextCharAt,
  Serializer.Mutations.TextGetSubstring,
  Serializer.Mutations.TextPromptExt,
  Serializer.Mutations.TextPrompt,
];

Serializer.Mutations.ControlsIf = new SerializerTestSuite('ControlsIf');
Serializer.Mutations.ControlsIf.NoMutation = new SerializerTestCase(
  'NoMutation',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="controls_if" id="id******************" x="42" y="42"></block>' +
    '</xml>',
);
Serializer.Mutations.ControlsIf.ElseIfAndElse = new SerializerTestCase(
  'ElseIfAndElse',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="controls_if" id="id******************" x="42" y="42">' +
    '<mutation elseif="1" else="1"></mutation>' +
    '</block>' +
    '</xml>',
);
Serializer.Mutations.ControlsIf.MultipleElseIfs = new SerializerTestCase(
  'MultipleElseIfs',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="controls_if" id="id******************" x="42" y="42">' +
    '<mutation elseif="3"></mutation>' +
    '</block>' +
    '</xml>',
);
Serializer.Mutations.ControlsIf.MutlipleElseIfsAndElse = new SerializerTestCase(
  'MutlipleElseIfsAndElse',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="controls_if" id="id******************" x="42" y="42">' +
    '<mutation elseif="3" else="1"></mutation>' +
    '</block>' +
    '</xml>',
);
Serializer.Mutations.ControlsIf.testCases = [
  Serializer.Mutations.ControlsIf.NoMutation,
  Serializer.Mutations.ControlsIf.ElseIfAndElse,
  Serializer.Mutations.ControlsIf.MultipleElseIfs,
  Serializer.Mutations.ControlsIf.MutlipleElseIfsAndElse,
];

Serializer.Mutations.ControlsIf.ElseIf = new SerializerTestSuite('ElseIf');
Serializer.Mutations.ControlsIf.ElseIf.NoChild = new SerializerTestCase(
  'NoChild',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="controls_if" id="id******************" x="42" y="42">' +
    '<mutation elseif="1"></mutation>' +
    '</block>' +
    '</xml>',
);
Serializer.Mutations.ControlsIf.ElseIf.Child = new SerializerTestCase(
  'Child',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="controls_if" id="id******************" x="42" y="42">' +
    '<mutation elseif="1"></mutation>' +
    '<statement name="DO1">' +
    '<block type="text_print" id="id2*****************"></block>' +
    '</statement>' +
    '</block>' +
    '</xml>',
);
Serializer.Mutations.ControlsIf.ElseIf.Shadow = new SerializerTestCase(
  'Shadow',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="controls_if" id="id******************" x="42" y="42">' +
    '<mutation elseif="1"></mutation>' +
    '<statement name="DO1">' +
    '<shadow type="text_print" id="id2*****************"></shadow>' +
    '</statement>' +
    '</block>' +
    '</xml>',
);
Serializer.Mutations.ControlsIf.ElseIf.OverwrittenShadow =
  new SerializerTestCase(
    'OverwrittenShadow',
    '<xml xmlns="https://developers.google.com/blockly/xml">' +
      '<block type="controls_if" id="id******************" x="42" y="42">' +
      '<mutation elseif="1"></mutation>' +
      '<statement name="DO1">' +
      '<shadow type="text_print" id="id2*****************"></shadow>' +
      '<block type="text_print" id="id3*****************"></block>' +
      '</statement>' +
      '</block>' +
      '</xml>',
  );
Serializer.Mutations.ControlsIf.ElseIf.testCases = [
  Serializer.Mutations.ControlsIf.ElseIf.NoChild,
  Serializer.Mutations.ControlsIf.ElseIf.Child,
  Serializer.Mutations.ControlsIf.ElseIf.Shadow,
  Serializer.Mutations.ControlsIf.ElseIf.OverwrittenShadow,
];

Serializer.Mutations.ControlsIf.Else = new SerializerTestSuite('Else');
Serializer.Mutations.ControlsIf.Else.NoChild = new SerializerTestCase(
  'NoChild',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="controls_if" id="id******************" x="42" y="42">' +
    '<mutation else="1"></mutation>' +
    '</block>' +
    '</xml>',
);
Serializer.Mutations.ControlsIf.Else.Child = new SerializerTestCase(
  'Child',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="controls_if" id="id******************" x="42" y="42">' +
    '<mutation else="1"></mutation>' +
    '<statement name="ELSE">' +
    '<block type="text_print" id="id2*****************"></block>' +
    '</statement>' +
    '</block>' +
    '</xml>',
);
Serializer.Mutations.ControlsIf.Else.Shadow = new SerializerTestCase(
  'Shadow',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="controls_if" id="id******************" x="42" y="42">' +
    '<mutation else="1"></mutation>' +
    '<statement name="ELSE">' +
    '<shadow type="text_print" id="id2*****************"></shadow>' +
    '</statement>' +
    '</block>' +
    '</xml>',
);
Serializer.Mutations.ControlsIf.Else.OverwrittenShadow = new SerializerTestCase(
  'OverwrittenShadow',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="controls_if" id="id******************" x="42" y="42">' +
    '<mutation else="1"></mutation>' +
    '<statement name="ELSE">' +
    '<shadow type="text_print" id="id2*****************"></shadow>' +
    '<block type="text_print" id="id3*****************"></block>' +
    '</statement>' +
    '</block>' +
    '</xml>',
);
Serializer.Mutations.ControlsIf.Else.testCases = [
  Serializer.Mutations.ControlsIf.Else.NoChild,
  Serializer.Mutations.ControlsIf.Else.Child,
  Serializer.Mutations.ControlsIf.Else.Shadow,
  Serializer.Mutations.ControlsIf.Else.OverwrittenShadow,
];

Serializer.Mutations.ControlsIf.testSuites = [
  Serializer.Mutations.ControlsIf.ElseIf,
  Serializer.Mutations.ControlsIf.Else,
];

Serializer.Mutations.ListCreate = new SerializerTestSuite('ListCreate');
Serializer.Mutations.ListCreate.Default = new SerializerTestCase(
  'Default',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="lists_create_with" id="id******************" x="42" y="42">' +
    '<mutation items="3"></mutation>' +
    '</block>' +
    '</xml>',
);
Serializer.Mutations.ListCreate.ZeroInputs = new SerializerTestCase(
  'ZeroInputs',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="lists_create_with" id="id******************" x="42" y="42">' +
    '<mutation items="0"></mutation>' +
    '</block>' +
    '</xml>',
);
Serializer.Mutations.ListCreate.MultipleInputs = new SerializerTestCase(
  'MultipleInputs',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="lists_create_with" id="id******************" x="42" y="42">' +
    '<mutation items="10"></mutation>' +
    '</block>' +
    '</xml>',
);
Serializer.Mutations.ListCreate.testCases = [
  Serializer.Mutations.ListCreate.Default,
  Serializer.Mutations.ListCreate.ZeroInputs,
  Serializer.Mutations.ListCreate.MultipleInputs,
];

Serializer.Mutations.ListCreate.OneInput = new SerializerTestSuite('OneIput');
Serializer.Mutations.ListCreate.OneInput.NoChild = new SerializerTestCase(
  'NoChild',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="lists_create_with" id="id******************" x="42" y="42">' +
    '<mutation items="1"></mutation>' +
    '</block>' +
    '</xml>',
);
Serializer.Mutations.ListCreate.OneInput.Child = new SerializerTestCase(
  'Child',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="lists_create_with" id="id******************" x="42" y="42">' +
    '<mutation items="1"></mutation>' +
    '<value name="ADD0">' +
    '<block type="math_random_float" id="id2*****************"></block>' +
    '</value>' +
    '</block>' +
    '</xml>',
);
Serializer.Mutations.ListCreate.OneInput.Shadow = new SerializerTestCase(
  'Shadow',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="lists_create_with" id="id******************" x="42" y="42">' +
    '<mutation items="1"></mutation>' +
    '<value name="ADD0">' +
    '<shadow type="math_random_float" id="id2*****************"></shadow>' +
    '</value>' +
    '</block>' +
    '</xml>',
);
Serializer.Mutations.ListCreate.OneInput.OverwrittenShadow =
  new SerializerTestCase(
    'OverwrittenShadow',
    '<xml xmlns="https://developers.google.com/blockly/xml">' +
      '<block type="lists_create_with" id="id******************" x="42" y="42">' +
      '<mutation items="1"></mutation>' +
      '<value name="ADD0">' +
      '<shadow type="math_random_float" id="id2*****************"></shadow>' +
      '<block type="math_random_float" id="id3*****************"></block>' +
      '</value>' +
      '</block>' +
      '</xml>',
  );
Serializer.Mutations.ListCreate.OneInput.testCases = [
  Serializer.Mutations.ListCreate.OneInput.NoChild,
  Serializer.Mutations.ListCreate.OneInput.Child,
  Serializer.Mutations.ListCreate.OneInput.Shadow,
  Serializer.Mutations.ListCreate.OneInput.OverwrittenShadow,
];

Serializer.Mutations.ListCreate.testSuites = [
  Serializer.Mutations.ListCreate.OneInput,
];

Serializer.Mutations.Procedure = new SerializerTestSuite('Procedure');
Serializer.Mutations.Procedure.NoMutation = new SerializerTestCase(
  'NoMutation',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="procedures_defreturn" id="id******************" x="42" y="42">' +
    '<field name="NAME">do something</field>' +
    '</block>' +
    '</xml>',
);
Serializer.Mutations.Procedure.Variables = new SerializerTestCase(
  'Variables',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<variables>' +
    '<variable id="aaaaaaaaaaaaaaaaaaaa">x</variable>' +
    '<variable id="bbbbbbbbbbbbbbbbbbbb">y</variable>' +
    '<variable id="cccccccccccccccccccc">z</variable>' +
    '</variables>' +
    '<block type="procedures_defreturn" id="id******************" x="42" y="42">' +
    '<mutation>' +
    '<arg name="x" varid="aaaaaaaaaaaaaaaaaaaa"></arg>' +
    '<arg name="y" varid="bbbbbbbbbbbbbbbbbbbb"></arg>' +
    '<arg name="z" varid="cccccccccccccccccccc"></arg>' +
    '</mutation>' +
    '<field name="NAME">do something</field>' +
    '</block>' +
    '</xml>',
);
Serializer.Mutations.Procedure.NoStatements = new SerializerTestCase(
  'NoStatements',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="procedures_defreturn" id="id******************" x="42" y="42">' +
    '<mutation statements="false"></mutation>' +
    '<field name="NAME">do something</field>' +
    '</block>' +
    '</xml>',
);
Serializer.Mutations.Procedure.IfReturn = new SerializerTestCase(
  'IfReturn',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="procedures_defnoreturn" id="id" x="42" y="42">' +
    '<field name="NAME">do something</field>' +
    '<statement name="STACK">' +
    '<block type="procedures_ifreturn" id="id2">' +
    '<mutation value="0"></mutation>' +
    '</block>' +
    '</statement>' +
    '</block>' +
    '</xml>',
);
Serializer.Mutations.Procedure.Caller = new SerializerTestCase(
  'Caller',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<variables>' +
    '<variable id="aaaaaaaaaaaaaaaaaaaa">x</variable>' +
    '<variable id="bbbbbbbbbbbbbbbbbbbb">y</variable>' +
    '</variables>' +
    '<block type="procedures_defreturn" id="id2*****************" x="42" y="42">' +
    '<mutation>' +
    '<arg name="x" varid="aaaaaaaaaaaaaaaaaaaa"></arg>' +
    '<arg name="y" varid="bbbbbbbbbbbbbbbbbbbb"></arg>' +
    '</mutation>' +
    '<field name="NAME">do something</field>' +
    '</block>' +
    '<block type="procedures_callreturn" id="id******************" x="52" y="52">' +
    '<mutation name="do something">' +
    '<arg name="x"></arg>' +
    '<arg name="y"></arg>' +
    '</mutation>' +
    '</block>' +
    '</xml>',
);
Serializer.Mutations.Procedure.CollapsedProceduresCallreturn =
  new SerializerTestCase(
    'CollapsedProceduresCallreturn',
    '<xml xmlns="https://developers.google.com/blockly/xml">' +
      '<variables>' +
      '<variable id="aaaaaaaaaaaaaaaaaaaa">x</variable>' +
      '</variables>' +
      '<block type="procedures_defreturn" id="id******************" x="42" y="42">' +
      '<mutation>' +
      '<arg name="x" varid="aaaaaaaaaaaaaaaaaaaa"></arg>' +
      '</mutation>' +
      '<field name="NAME">do something</field>' +
      '<comment pinned="false" h="80" w="160">Describe this function...</comment>' +
      '</block>' +
      '<block type="procedures_callreturn" id="id1*****************" collapsed="true" x="52" y="52">' +
      '<mutation name="do something">' +
      '<arg name="x"></arg>' +
      '</mutation>' +
      '</block>' +
      '</xml>',
  );
Serializer.Mutations.Procedure.CollapsedProceduresCallnoreturn =
  new SerializerTestCase(
    'CollapsedProceduresCallnoreturn',
    '<xml xmlns="https://developers.google.com/blockly/xml">' +
      '<variables>' +
      '<variable id="aaaaaaaaaaaaaaaaaaaa">x</variable>' +
      '</variables>' +
      '<block type="procedures_defnoreturn" id="id******************" x="42" y="42">' +
      '<mutation>' +
      '<arg name="x" varid="aaaaaaaaaaaaaaaaaaaa"></arg>' +
      '</mutation>' +
      '<field name="NAME">do something</field>' +
      '<comment pinned="false" h="80" w="160">Describe this function...</comment>' +
      '</block>' +
      '<block type="procedures_callnoreturn" id="id1*****************" collapsed="true" x="52" y="52">' +
      '<mutation name="do something">' +
      '<arg name="x"></arg>' +
      '</mutation>' +
      '</block>' +
      '</xml>',
  );
Serializer.Mutations.Procedure.testCases = [
  Serializer.Mutations.Procedure.NoMutation,
  Serializer.Mutations.Procedure.Variables,
  Serializer.Mutations.Procedure.NoStatements,
  Serializer.Mutations.Procedure.IfReturn,
  Serializer.Mutations.Procedure.Caller,
  Serializer.Mutations.Procedure.CollapsedProceduresCallreturn,
  Serializer.Mutations.Procedure.CollapsedProceduresCallnoreturn,
];

Serializer.Mutations.Procedure.Names = new SerializerTestSuite('Names');
Serializer.Mutations.Procedure.Names.Symbols = new SerializerTestCase(
  'Symbols',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="procedures_defreturn" id="id******************" x="42" y="42">' +
    '<field name="NAME">~`!@#$%^*()_+-={[}]|\\:;,.?/</field>' +
    '</block>' +
    '</xml>',
);
Serializer.Mutations.Procedure.Names.EscapedSymbols = new SerializerTestCase(
  'EscapedSymbols',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="procedures_defreturn" id="id******************" x="42" y="42">' +
    '<field name="NAME">&amp;&lt;&gt;</field>' +
    '</block>' +
    '</xml>',
);
Serializer.Mutations.Procedure.Names.SingleQuotes = new SerializerTestCase(
  'SingleQuotes',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="procedures_defreturn" id="id******************" x="42" y="42">' +
    '<field name="NAME">\'test\'</field>' +
    '</block>' +
    '</xml>',
);
Serializer.Mutations.Procedure.Names.DoubleQuotes = new SerializerTestCase(
  'DoubleQuotes',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="procedures_defreturn" id="id******************" x="42" y="42">' +
    '<field name="NAME">"test"</field>' +
    '</block>' +
    '</xml>',
);
Serializer.Mutations.Procedure.Names.Numbers = new SerializerTestCase(
  'Numbers',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="procedures_defreturn" id="id******************" x="42" y="42">' +
    '<field name="NAME">1234567890a123a123a</field>' +
    '</block>' +
    '</xml>',
);
Serializer.Mutations.Procedure.Names.Emoji = new SerializerTestCase(
  'Emoji',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="procedures_defreturn" id="id******************" x="42" y="42">' +
    '<field name="NAME">😀👋🏿👋🏾👋🏽👋🏼👋🏻😀❤❤❤</field>' +
    '</block>' +
    '</xml>',
);
Serializer.Mutations.Procedure.Names.Russian = new SerializerTestCase(
  'Russian',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="procedures_defreturn" id="id******************" x="42" y="42">' +
    '<field name="NAME">ты любопытный кот</field>' +
    '</block>' +
    '</xml>',
);
Serializer.Mutations.Procedure.Names.Japanese = new SerializerTestCase(
  'Japanese',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="procedures_defreturn" id="id******************" x="42" y="42">' +
    '<field name="NAME">あなたは好奇心旺盛な猫です</field>' +
    '</block>' +
    '</xml>',
);
Serializer.Mutations.Procedure.Names.Zalgo = new SerializerTestCase(
  'Zalgo',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="procedures_defreturn" id="id******************" x="42" y="42">' +
    '<field name="NAME">z̴̪͈̲̜͕̽̈̀͒͂̓̋̉̍a̸̧̧̜̻̘̤̫̱̲͎̞̻͆̋ļ̸̛̖̜̳͚̖͔̟̈́͂̉̀͑̑͑̎ǵ̸̫̳̽̐̃̑̚̕o̶͇̫͔̮̼̭͕̹̘̬͋̀͆̂̇̋͊̒̽</field>' +
    '</block>' +
    '</xml>',
);
Serializer.Mutations.Procedure.Names.ControlChars = new SerializerTestCase(
  'ControlChars',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="procedures_defreturn" id="id******************" x="42" y="42">' +
    '<field name="NAME">&#01;&#a1;</field>' +
    '</block>' +
    '</xml>',
);
Serializer.Mutations.Procedure.Names.testCases = [
  Serializer.Mutations.Procedure.Names.Symbols,
  Serializer.Mutations.Procedure.Names.EscapedSymbols,
  Serializer.Mutations.Procedure.Names.SingleQuotes,
  Serializer.Mutations.Procedure.Names.DoubleQuotes,
  Serializer.Mutations.Procedure.Names.Numbers,
  Serializer.Mutations.Procedure.Names.Emoji,
  Serializer.Mutations.Procedure.Names.Russian,
  Serializer.Mutations.Procedure.Names.Japanese,
  Serializer.Mutations.Procedure.Names.Zalgo,
  // TODO: Uncoment once #4945 is merged.
  // Serializer.Mutations.Procedure.Names.ControlChars,
];

Serializer.Mutations.Procedure.testSuites = [
  Serializer.Mutations.Procedure.Names,
];

Serializer.Mutations.testSuites = [
  Serializer.Mutations.ControlsIf,
  Serializer.Mutations.ListCreate,
  Serializer.Mutations.Procedure,
];

Serializer.Comments = new SerializerTestSuite('Comments');

Serializer.Comments.Coordinates = new SerializerTestSuite('Coordinates');
Serializer.Comments.Coordinates.Basic = new SerializerTestCase(
  'Basic',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<comment id="id******************" x="42" y="42" w="42" h="42">' +
    '</comment>' +
    '</xml>',
);
Serializer.Comments.Coordinates.Negative = new SerializerTestCase(
  'Negative',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<comment id="id******************" x="-42" y="-42" w="42" h="42">' +
    '</comment>' +
    '</xml>',
);
Serializer.Comments.Coordinates.Zero = new SerializerTestCase(
  'Zero',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<comment id="id******************" x="0" y="0" w="42" h="42">' +
    '</comment>' +
    '</xml>',
);
Serializer.Comments.Coordinates.testCases = [
  Serializer.Comments.Coordinates.Basic,
  Serializer.Comments.Coordinates.Negative,
  Serializer.Comments.Coordinates.Zero,
];

Serializer.Comments.Size = new SerializerTestSuite('Size');
Serializer.Comments.Size.Basic = new SerializerTestCase(
  'Basic',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<comment id="id******************" x="42" y="42" w="42" h="42">' +
    '</comment>' +
    '</xml>',
);
Serializer.Comments.Size.testCases = [Serializer.Comments.Size.Basic];

Serializer.Comments.Text = new SerializerTestSuite('Text');
Serializer.Comments.Text.Symbols = new SerializerTestCase(
  'Symbols',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<comment id="id******************" x="42" y="42" w="42" h="42">' +
    '~`!@#$%^*()_+-={[}]|\\:;,.?/' +
    '</comment>' +
    '</xml>',
);
Serializer.Comments.Text.EscapedSymbols = new SerializerTestCase(
  'EscapedSymbols',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<comment id="id******************" x="42" y="42" w="42" h="42">' +
    '&amp;&lt;&gt;' +
    '</comment>' +
    '</xml>',
);
Serializer.Comments.Text.SingleQuotes = new SerializerTestCase(
  'SingleQuotes',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<comment id="id******************" x="42" y="42" w="42" h="42">' +
    "'test'" +
    '</comment>' +
    '</xml>',
);
Serializer.Comments.Text.DoubleQuotes = new SerializerTestCase(
  'DoubleQuotes',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<comment id="id******************" x="42" y="42" w="42" h="42">' +
    '"test"' +
    '</comment>' +
    '</xml>',
);
Serializer.Comments.Text.Numbers = new SerializerTestCase(
  'Numbers',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<comment id="id******************" x="42" y="42" w="42" h="42">' +
    '1234567890a123a123a' +
    '</comment>' +
    '</xml>',
);
Serializer.Comments.Text.Emoji = new SerializerTestCase(
  'Emoji',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<comment id="id******************" x="42" y="42" w="42" h="42">' +
    '😀👋🏿👋🏾👋🏽👋🏼👋🏻😀❤❤❤' +
    '</comment>' +
    '</xml>',
);
Serializer.Comments.Text.Russian = new SerializerTestCase(
  'Russian',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<comment id="id******************" x="42" y="42" w="42" h="42">' +
    'ты любопытный кот' +
    '</comment>' +
    '</xml>',
);
Serializer.Comments.Text.Japanese = new SerializerTestCase(
  'Japanese',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<comment id="id******************" x="42" y="42" w="42" h="42">' +
    'あなたは好奇心旺盛な猫です' +
    '</comment>' +
    '</xml>',
);
Serializer.Comments.Text.Zalgo = new SerializerTestCase(
  'Zalgo',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<comment id="id******************" x="42" y="42" w="42" h="42">' +
    'z̴̪͈̲̜͕̽̈̀͒͂̓̋̉̍a̸̧̧̜̻̘̤̫̱̲͎̞̻͆̋ļ̸̛̖̜̳͚̖͔̟̈́͂̉̀͑̑͑̎ǵ̸̫̳̽̐̃̑̚̕o̶͇̫͔̮̼̭͕̹̘̬͋̀͆̂̇̋͊̒̽' +
    '</comment>' +
    '</xml>',
);
Serializer.Comments.Text.testCases = [
  Serializer.Comments.Text.Symbols,
  Serializer.Comments.Text.EscapedSymbols,
  Serializer.Comments.Text.SingleQuotes,
  Serializer.Comments.Text.DoubleQuotes,
  Serializer.Comments.Text.Numbers,
  Serializer.Comments.Text.Emoji,
  Serializer.Comments.Text.Russian,
  Serializer.Comments.Text.Japanese,
  Serializer.Comments.Text.Zalgo,
];

Serializer.Comments.Attributes = new SerializerTestSuite('Attributes');
Serializer.Comments.Attributes.Collapsed = new SerializerTestCase(
  'Collapsed',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<comment id="id******************" x="42" y="42" w="42" h="42" collapsed="true">' +
    '</comment>' +
    '</xml>',
);
Serializer.Comments.Attributes.NotEditable = new SerializerTestCase(
  'NotEditable',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<comment id="id******************" x="42" y="42" w="42" h="42" editable="false">' +
    '</comment>' +
    '</xml>',
);
Serializer.Comments.Attributes.NotMovable = new SerializerTestCase(
  'NotMovable',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<comment id="id******************" x="42" y="42" w="42" h="42" movable="false">' +
    '</comment>' +
    '</xml>',
);
Serializer.Comments.Attributes.NotDeletable = new SerializerTestCase(
  'NotDeletable',
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<comment id="id******************" x="42" y="42" w="42" h="42" deletable="false">' +
    '</comment>' +
    '</xml>',
);
Serializer.Comments.Attributes.testCases = [
  Serializer.Comments.Attributes.Collapsed,
  Serializer.Comments.Attributes.NotEditable,
  Serializer.Comments.Attributes.NotMovable,
  Serializer.Comments.Attributes.NotDeletable,
];

Serializer.Comments.testSuites = [
  Serializer.Comments.Coordinates,
  Serializer.Comments.Size,
  Serializer.Comments.Text,
  Serializer.Comments.Attributes,
];

Serializer.testSuites = [
  Serializer.Attributes,
  Serializer.Fields,
  Serializer.Icons,
  Serializer.Connections,
  Serializer.Mutations,
  Serializer.Comments,
];

const runSerializerTestSuite = (serializer, deserializer, testSuite) => {
  const workspaces = Blockly.serialization.workspaces;

  const createTestFunction = function (test) {
    return function () {
      Blockly.Xml.domToWorkspace(
        Blockly.utils.xml.textToDom(test.xml),
        this.workspace,
      );
      if (serializer && deserializer) {
        const save = serializer(workspaces.save(this.workspace));
        this.workspace.clear();
        workspaces.load(deserializer(save), this.workspace);
      }
      const newXml = Blockly.Xml.workspaceToDom(this.workspace);
      assert.equal(Blockly.Xml.domToText(newXml), test.xml);
    };
  };

  // This takes in a suite, but we don't care.
  const createTestCaseFunction = function (_) {
    return createTestFunction;
  };

  let suiteCall = testSuite.skip ? suite.skip : suite;
  suiteCall = testSuite.only ? suite.only : suiteCall;

  suiteCall(testSuite.title, function () {
    setup(function () {
      sharedTestSetup.call(this, {fireEventsNow: false});
      this.workspace = new Blockly.Workspace();
    });

    teardown(function () {
      workspaceTeardown.call(this, this.workspace);
      sharedTestTeardown.call(this);
    });

    runTestSuites(testSuite.testSuites, createTestCaseFunction);
    runTestCases(testSuite.testCases, createTestFunction);
  });
};

runSerializerTestSuite(null, null, Serializer);
runSerializerTestSuite(
  (state) => state,
  (state) => state,
  Serializer,
);
