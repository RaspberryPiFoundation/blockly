import {assert} from 'chai';
import * as Blockly from 'blockly';
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

suite('BlockSearcher', () => {
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
    searcher.indexBlocks(blocks);

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
    searcher.indexBlocks([listCreateWithBlock]);

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
    searcher.indexBlocks([mathConstrainBlock]);

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
    searcher.indexBlocks([blockInfo]);

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

    searcher.indexBlocks([blockA, blockB]);

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
    searcher.indexBlocks([blockInfo]);

    assert.sameMembers(searcher.blockTypesMatching('sunny'), [blockInfo]);
    assert.sameMembers(searcher.blockTypesMatching('cloudy'), [blockInfo]);
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

    searcher.indexBlocks(blocks);

    const matches = searcher.blockTypesMatching('replace');
    assert.sameMembers(matches, [blocks[0]]);
  });
});
