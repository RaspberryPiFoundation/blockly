/**
 * @license
 * Copyright 2026 Raspberry Pi Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Shared DOM fixtures for the Mocha test suites.
 */

export const FIXTURE_HTML = `
  <div id="testFocusableTree1">
    Focusable tree 1
    <div id="testFocusableTree1.node1" style="margin-left: 1em">
      Tree 1 node 1
      <div id="testFocusableTree1.node1.child1" style="margin-left: 2em">
        Tree 1 node 1 child 1
        <div
          id="testFocusableTree1.node1.child1.unregisteredChild1"
          style="margin-left: 3em">
          Tree 1 node 1 child 1 child 1 (unregistered)
        </div>
      </div>
    </div>
    <div id="testFocusableTree1.node2" style="margin-left: 1em">
      Tree 1 node 2
      <div
        id="testFocusableTree1.node2.unregisteredChild1"
        style="margin-left: 2em">
        Tree 1 node 2 child 2 (unregistered)
      </div>
    </div>
    <div id="testFocusableTree1.unregisteredChild1" style="margin-left: 1em">
      Tree 1 child 1 (unregistered)
    </div>
  </div>
  <div id="testFocusableTree2">
    Focusable tree 2
    <div id="testFocusableTree2.node1" style="margin-left: 1em">
      Tree 2 node 1
      <div id="testFocusableNestedTree4" style="margin-left: 2em">
        Nested tree 4
        <div id="testFocusableNestedTree4.node1" style="margin-left: 3em">
          Tree 4 node 1 (nested)
          <div
            id="testFocusableNestedTree4.node1.unregisteredChild1"
            style="margin-left: 4em">
            Tree 4 node 1 child 1 (unregistered)
          </div>
        </div>
      </div>
    </div>
    <div id="testFocusableNestedTree5" style="margin-left: 1em">
      Nested tree 5
      <div id="testFocusableNestedTree5.node1" style="margin-left: 2em">
        Tree 5 node 1 (nested)
      </div>
    </div>
  </div>
  <div id="testUnregisteredFocusableTree3">
    Unregistered tree 3
    <div id="testUnregisteredFocusableTree3.node1" style="margin-left: 1em">
      Tree 3 node 1 (unregistered)
    </div>
  </div>
  <div id="testUnfocusableElement">Unfocusable element</div>
  <div id="nonTreeElementForEphemeralFocus"></div>
  <svg width="250" height="250">
    <g id="testFocusableGroup1">
      <g id="testFocusableGroup1.node1">
        <rect x="0" y="0" width="250" height="30" fill="grey" />
        <text x="10" y="20" class="svgText">Group 1 node 1</text>
        <g id="testFocusableGroup1.node1.child1">
          <rect x="0" y="30" width="250" height="30" fill="lightgrey" />
          <text x="10" y="50" class="svgText">Tree 1 node 1 child 1</text>
        </g>
      </g>
      <g id="testFocusableGroup1.node2">
        <rect x="0" y="60" width="250" height="30" fill="grey" />
        <text x="10" y="80" class="svgText">Group 1 node 2</text>
        <g id="testFocusableGroup1.node2.unregisteredChild1">
          <rect x="0" y="90" width="250" height="30" fill="lightgrey" />
          <text x="10" y="110" class="svgText">
            Tree 1 node 2 child 2 (unregistered)
          </text>
        </g>
      </g>
    </g>
    <g id="testFocusableGroup2">
      <g id="testFocusableGroup2.node1">
        <rect x="0" y="120" width="250" height="30" fill="grey" />
        <text x="10" y="140" class="svgText">Group 2 node 1</text>
      </g>
      <g id="testFocusableNestedGroup4">
        <g id="testFocusableNestedGroup4.node1">
          <rect x="0" y="150" width="250" height="30" fill="lightgrey" />
          <text x="10" y="170" class="svgText">Group 4 node 1 (nested)</text>
        </g>
      </g>
    </g>
    <g id="testUnregisteredFocusableGroup3">
      <g id="testUnregisteredFocusableGroup3.node1">
        <rect x="0" y="180" width="250" height="30" fill="grey" />
        <text x="10" y="200" class="svgText">
          Tree 3 node 1 (unregistered)
        </text>
      </g>
    </g>
    <g id="nonTreeGroupForEphemeralFocus"></g>
  </svg>

  <div id="blocklyDiv"></div>

  <xml
    xmlns="https://developers.google.com/blockly/xml"
    id="toolbox-simple"
    style="display: none">
    <block type="logic_compare">
      <field name="OP">NEQ</field>
      <value name="A">
        <shadow type="math_number">
          <field name="NUM">1</field>
        </shadow>
      </value>
      <value name="B">
        <block type="math_number">
          <field name="NUM">2</field>
        </block>
      </value>
    </block>
    <sep gap="20"></sep>
    <button text="insert" callbackkey="insertConnectionRows"></button>
    <label text="tooltips"></label>
  </xml>

  <xml
    xmlns="https://developers.google.com/blockly/xml"
    id="toolbox-categories"
    style="display: none">
    <category name="First" css-container="something">
      <block type="basic_block">
        <field name="TEXT">FirstCategory-FirstBlock</field>
      </block>
      <block type="basic_block">
        <field name="TEXT">FirstCategory-SecondBlock</field>
      </block>
    </category>
    <category name="Second">
      <block type="basic_block">
        <field name="TEXT">SecondCategory-FirstBlock</field>
      </block>
    </category>
  </xml>

  <xml
    xmlns="https://developers.google.com/blockly/xml"
    id="toolbox-test"
    style="display: none">
    <category name="First" expanded="true" categorystyle="logic_category">
      <sep gap="-1"></sep>
      <button text="insert" callbackkey="insertConnectionRows"></button>
      <block type="stack_block"></block>
      <block type="stack_block"></block>
    </category>
    <category name="Second">
      <block type="stack_block"></block>
    </category>
    <sep toolboxitemid="separator" gap="-1"></sep>
    <category name="Variables" custom="VARIABLE"></category>
    <category name="NestedCategory">
      <category toolboxitemid="nestedCategory" name="NestedItemOne">
        <block type="stack_block"></block>
      </category>
      <block type="stack_block"></block>
    </category>
    <category name="lastItem"></category>
  </xml>

  <xml
    xmlns="https://developers.google.com/blockly/xml"
    id="gesture-test-toolbox"
    style="display: none">
    <block type="test_field_block"></block>
  </xml>
`;

/**
 * Installs the shared test fixtures into the given document's body. Safe to
 * call once per page/document load; calling it again will append a duplicate
 * set of fixtures, so it should only be invoked during initial harness setup.
 * @param {!Document} doc The document to install fixtures into. Defaults to the
 *     ambient `document`.
 */
export function installFixtures(doc = document) {
  doc.body.insertAdjacentHTML('beforeend', FIXTURE_HTML);
}
