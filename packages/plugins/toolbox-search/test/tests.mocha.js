import {assert} from 'chai';
import * as Blockly from 'blockly';
import * as sinon from 'sinon';
import {ToolboxSearchCategory} from '../src/toolbox_search';
import {BlockSearcher} from '../src/block_searcher';

suite('Toolbox search', () => {
  test('registers itself as a toolbox item', () => {
    assert(
      Blockly.registry.hasItem(
        Blockly.registry.Type.TOOLBOX_ITEM,
        ToolboxSearchCategory.SEARCH_CATEGORY_KIND,
      ),
    );
  });
});

suite('ToolboxSearchCategory', () => {
  /**
   * @param {!Blockly.WorkspaceSvg} workspace The workspace to inspect.
   * @returns {!Array<string>} The types of the blocks now in the flyout.
   */
  function flyoutBlockTypes(workspace) {
    return workspace
      .getFlyout()
      .getWorkspace()
      .getTopBlocks(false)
      .map((block) => block.type);
  }

  setup(function () {
    this.jsdomCleanup = require('jsdom-global')(
      '<!DOCTYPE html><div id="blocklyDiv"></div>',
    );
    this.clock = sinon.useFakeTimers();
    this.workspace = Blockly.inject('blocklyDiv', {
      media: 'media/',
      toolbox: {
        kind: 'categoryToolbox',
        contents: [
          {
            kind: 'category',
            name: 'Logic',
            contents: [{kind: 'block', type: 'controls_if'}],
          },
          {kind: 'category', name: 'Variables', custom: 'VARIABLE'},
          {kind: 'search', name: 'Search', contents: []},
        ],
      },
    });
    // See https://github.com/RaspberryPiFoundation/blockly-samples/issues/2528.
    global.SVGElement = window.SVGElement;
    global.requestAnimationFrame = (callback) => setTimeout(callback, 0);
    this.searchCategory = this.workspace
      .getToolbox()
      .getToolboxItems()
      .find((item) => item instanceof ToolboxSearchCategory);

    /**
     * Types into the search field the way a user would, so the category's own
     * input listener drives the flyout.
     * @param {string} query The text to search for.
     */
    this.search = (query) => {
      const field = this.searchCategory.searchField;
      this.searchCategory
        .getParentToolbox()
        .setSelectedItem(this.searchCategory);
      field.value = query;
      field.dispatchEvent(new window.Event('input'));
      this.clock.runAll();
    };
  });

  teardown(function () {
    this.workspace.dispose();
    this.clock.runAll();
    this.clock.restore();
    this.jsdomCleanup();
  });

  test('shows matching blocks in the flyout', function () {
    this.search('controls if');

    assert.deepEqual(flyoutBlockTypes(this.workspace), ['controls_if']);
  });

  test('updates flyout blocks to the variable that was searched for', function () {
    this.workspace.getVariableMap().createVariable('score');
    this.clock.runAll();

    this.search('score');

    const blocks = this.workspace
      .getFlyout()
      .getWorkspace()
      .getTopBlocks(false);
    assert.deepEqual(
      blocks.map((block) => block.type),
      ['variables_set', 'math_change', 'variables_get'],
    );
    blocks.forEach((block) => {
      assert.equal(block.getVarModels()[0].getName(), 'score');
    });
  });

  test('keeps the flyout current as variables are created', function () {
    this.search('score');
    assert.isEmpty(flyoutBlockTypes(this.workspace));

    this.workspace.getVariableMap().createVariable('score');
    this.clock.runAll();

    assert.include(flyoutBlockTypes(this.workspace), 'variables_get');
  });
});

suite('BlockSearcher', () => {
  let workspace;

  setup(() => {
    workspace = new Blockly.Workspace();
  });

  teardown(() => {
    workspace.dispose();
  });

  /**
   * Creates the named variables on the workspace and returns the block
   * definitions the VARIABLE category would create for them.
   * @param {!Array<string>} names The variables to create.
   * @returns {!Array<!Object>} A setter, a change block and one getter each.
   */
  function createVariableBlocks(names) {
    names.forEach((name) => workspace.getVariableMap().createVariable(name));
    return Blockly.Variables.jsonFlyoutCategoryBlocks(
      workspace,
      workspace.getVariableMap().getVariablesOfType(''),
      true,
    );
  }

  test('generateTrigrams handles empty and short input', () => {
    const searcher = new BlockSearcher();
    const generateTrigrams = searcher.generateTrigrams.bind(searcher);

    assert.deepEqual(generateTrigrams(''), []);
    assert.deepEqual(generateTrigrams('a'), ['a']);
    assert.deepEqual(generateTrigrams('abc'), ['abc']);
  });

  test('indexes the default value of dropdown fields', () => {
    const searcher = new BlockSearcher();
    const blocks = [
      {
        kind: 'block',
        type: 'lists_sort',
      },
      {
        kind: 'block',
        type: 'lists_split',
      },
    ];
    // Text on these:
    // lists_sort: sort <numeric> <ascending>
    // lists_split: make <list from text> with delimiter ,
    searcher.indexBlocks(blocks, workspace);

    const numericMatches = searcher.blockTypesMatching('numeric');
    assert.sameMembers(numericMatches, [blocks[0]]);

    const listFromTextMatches = searcher.blockTypesMatching('list from text');
    assert.sameMembers(listFromTextMatches, [blocks[1]]);
  });

  test('is not case-sensitive', () => {
    const searcher = new BlockSearcher();
    const listCreateWithBlock = {
      kind: 'block',
      type: 'lists_create_with',
    };
    searcher.indexBlocks([listCreateWithBlock], workspace);

    const lowercaseMatches = searcher.blockTypesMatching('create list');
    assert.sameMembers(lowercaseMatches, [listCreateWithBlock]);

    const uppercaseMatches = searcher.blockTypesMatching('CREATE LIST');
    assert.sameMembers(uppercaseMatches, [listCreateWithBlock]);

    const ransomNoteMatches = searcher.blockTypesMatching('cReATe LiST');
    assert.sameMembers(ransomNoteMatches, [listCreateWithBlock]);
  });

  test('requires the final trigram when matching longer queries', () => {
    const searcher = new BlockSearcher();
    const mathConstrainBlock = {
      kind: 'block',
      type: 'math_constrain',
    };
    searcher.indexBlocks([mathConstrainBlock], workspace);

    const matches = searcher.blockTypesMatching('conso');

    assert.notInclude(
      matches,
      mathConstrainBlock,
      'query missing trailing trigram should not match',
    );
  });

  test('normalizes underscores in block types to spaces', () => {
    if (!Blockly.Blocks['searcher_underscore_block']) {
      Blockly.defineBlocksWithJsonArray([
        {
          type: 'searcher_underscore_block',
          message0: 'custom block with underscore',
        },
      ]);
    }

    const searcher = new BlockSearcher();
    const blockInfo = {
      kind: 'block',
      type: 'searcher_underscore_block',
    };
    searcher.indexBlocks([blockInfo], workspace);

    assert.sameMembers(
      searcher.blockTypesMatching('searcher underscore block'),
      [blockInfo],
    );
    assert.isEmpty(searcher.blockTypesMatching('searcher_underscore_block'));
  });

  test('longer queries disambiguate similar blocks', () => {
    if (!Blockly.Blocks['searcher_charlie']) {
      Blockly.defineBlocksWithJsonArray([
        {
          type: 'searcher_charlie',
          message0: 'alpha bravo charlie',
        },
        {
          type: 'searcher_delta',
          message0: 'alpha bravo delta',
        },
      ]);
    }

    const searcher = new BlockSearcher();
    const blockA = {kind: 'block', type: 'searcher_charlie'};
    const blockB = {kind: 'block', type: 'searcher_delta'};

    searcher.indexBlocks([blockA, blockB], workspace);

    const broadQueryMatches = searcher.blockTypesMatching('alpha bravo');
    assert.sameMembers(broadQueryMatches, [blockA, blockB]);

    const specificQueryMatches = searcher.blockTypesMatching(
      'alpha bravo charlie',
    );
    assert.sameMembers(specificQueryMatches, [blockA]);
  });

  test('indexes dropdown alt text options', () => {
    if (!Blockly.Blocks['searcher_dropdown_alt']) {
      Blockly.defineBlocksWithJsonArray([
        {
          type: 'searcher_dropdown_alt',
          message0: 'weather %1',
          args0: [
            {
              type: 'field_dropdown',
              name: 'WEATHER',
              options: [
                [
                  {
                    src: '',
                    width: 1,
                    height: 1,
                    alt: 'Sunny',
                  },
                  'SUN',
                ],
                [
                  {
                    src: '',
                    width: 1,
                    height: 1,
                    alt: 'Cloudy',
                  },
                  'CLOUD',
                ],
              ],
            },
          ],
        },
      ]);
    }

    const searcher = new BlockSearcher();
    const blockInfo = {kind: 'block', type: 'searcher_dropdown_alt'};
    searcher.indexBlocks([blockInfo], workspace);

    assert.sameMembers(searcher.blockTypesMatching('sunny'), [blockInfo]);
    // 'cloudy' wasn't the selected option, but it should be set with the matching option if found.
    const cloudyMatches = searcher.blockTypesMatching('cloudy');
    assert.lengthOf(cloudyMatches, 1);
    assert.deepEqual(cloudyMatches[0], {
      ...blockInfo,
      fields: {WEATHER: 'CLOUD'},
    });
  });

  test('returns an empty list when no matches are found', () => {
    const searcher = new BlockSearcher();
    assert.isEmpty(searcher.blockTypesMatching('abc123'));
  });

  test('returns preset blocks', () => {
    const searcher = new BlockSearcher();
    const blocks = [
      {
        kind: 'block',
        type: 'text_replace',
        inputs: {
          FROM: {
            shadow: {
              type: 'text',
            },
          },
          TO: {
            shadow: {
              type: 'text',
            },
          },
          TEXT: {
            shadow: {
              type: 'text',
            },
          },
        },
      },
    ];

    searcher.indexBlocks(blocks, workspace);

    const matches = searcher.blockTypesMatching('replace');
    assert.sameMembers(matches, [blocks[0]]);
  });

  test('indexes field values from the block definition', () => {
    const searcher = new BlockSearcher();
    const numberBlock = {
      kind: 'block',
      type: 'math_number',
      fields: {NUM: 250},
    };
    const printBlock = {
      kind: 'block',
      type: 'text_print',
      inputs: {TEXT: {shadow: {type: 'text', fields: {TEXT: 'abc'}}}},
    };
    searcher.indexBlocks([numberBlock, printBlock], workspace);

    assert.sameMembers(searcher.blockTypesMatching('250'), [numberBlock]);
    // The value lives on a shadow block, not on the block itself.
    assert.sameMembers(searcher.blockTypesMatching('abc'), [printBlock]);
  });

  test('binds variable blocks to every matching variable', () => {
    const searcher = new BlockSearcher();
    searcher.indexBlocks(
      createVariableBlocks(['alpha', 'alphabet', 'beta']),
      workspace,
    );

    const matches = searcher.blockTypesMatching('alpha');
    assert.sameMembers(
      matches.map((match) => `${match.type}(${match.fields.VAR.name})`),
      [
        'variables_set(alpha)',
        'variables_set(alphabet)',
        'math_change(alpha)',
        'math_change(alphabet)',
        'variables_get(alpha)',
        'variables_get(alphabet)',
      ],
    );
  });

  test("leaves matches unchanged when the query doesn't name a variable", () => {
    const searcher = new BlockSearcher();
    const blocks = createVariableBlocks(['alpha']);
    searcher.indexBlocks(blocks, workspace);

    const setter = blocks.find((block) => block.type === 'variables_set');
    assert.include(searcher.blockTypesMatching('set'), setter);
  });

  test('does not index variable rename and delete options', () => {
    const searcher = new BlockSearcher();
    searcher.indexBlocks(createVariableBlocks(['alpha']), workspace);

    assert.isEmpty(searcher.blockTypesMatching('rename'));
    assert.isEmpty(searcher.blockTypesMatching('delete the'));
  });

  test('sets dropdowns to the option that matched', () => {
    const searcher = new BlockSearcher();
    const sortBlock = {kind: 'block', type: 'lists_sort'};
    searcher.indexBlocks([sortBlock], workspace);

    // 'numeric' is already selected, so the indexed block is returned as-is.
    assert.sameMembers(searcher.blockTypesMatching('numeric'), [sortBlock]);
    assert.sameDeepMembers(
      searcher.blockTypesMatching('alphabetic').map((match) => match.fields),
      [{TYPE: 'TEXT'}, {TYPE: 'IGNORE_CASE'}],
    );
  });

  test('varies one dropdown at a time', () => {
    const searcher = new BlockSearcher();
    // Both WHERE1 and WHERE2 offer '# from end'.
    searcher.indexBlocks(
      [{kind: 'block', type: 'lists_getSublist'}],
      workspace,
    );

    assert.sameDeepMembers(
      searcher.blockTypesMatching('from end').map((match) => match.fields),
      [{WHERE1: 'FROM_END'}, {WHERE2: 'FROM_END'}],
    );
  });

  test('indexes procedure names from extra state', () => {
    const searcher = new BlockSearcher();
    const callBlock = {
      kind: 'block',
      type: 'procedures_callnoreturn',
      extraState: {name: 'draw sprites', params: []},
    };
    searcher.indexBlocks([callBlock], workspace);

    assert.sameMembers(searcher.blockTypesMatching('draw sprites'), [
      callBlock,
    ]);
  });

  test('does not match trigrams pooled from different strings', () => {
    const searcher = new BlockSearcher();
    // 'controls flow statements' supplies 'tem' and 'next iteration' supplies
    // 'ite', but the block never says 'item'.
    searcher.indexBlocks(
      [{kind: 'block', type: 'controls_flow_statements'}],
      workspace,
    );

    assert.isEmpty(searcher.blockTypesMatching('item'));
  });

  test('replaces the previous index when reindexing', () => {
    const searcher = new BlockSearcher();
    searcher.indexBlocks([{kind: 'block', type: 'text_print'}], workspace);

    // Reindexing should forget the previous pass entirely, not add to it.
    const negate = {kind: 'block', type: 'logic_negate'};
    searcher.indexBlocks([negate], workspace);

    assert.isEmpty(searcher.blockTypesMatching('print'));
    assert.sameMembers(searcher.blockTypesMatching('not'), [negate]);
  });
});
