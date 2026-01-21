/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Node.js script to run Automated tests in Chrome, via webdriver.
 */

import * as chai from 'chai';
import {Key} from 'webdriverio';
import {
  clickBlock,
  getAllBlocks,
  PAUSE_TIME,
  testFileLocations,
  testSetup,
} from './test_setup.mjs';

suite('This tests loading Large Configuration and Deletion', function (done) {
  // Setting timeout to unlimited as the webdriver takes a longer time to run than most mocha test
  this.timeout(0);

  // Setup Selenium for all of the tests
  suiteSetup(async function () {
    this.browser = await testSetup(testFileLocations.PLAYGROUND);
  });

  test('loading from JSON results in the correct number of blocks', async function () {
    const blockNum = await testingJSONLoad(this.browser);
    chai.assert.equal(blockNum, 13);
  });

  test('deleting block results in the correct number of blocks', async function () {
    await clickBlock(this.browser, 'E8bF[-r:B~cabGLP#QYd', {button: 1});
    await this.browser.keys([Key.Delete]);
    await this.browser.pause(PAUSE_TIME);
    const allBlocks = await getAllBlocks(this.browser);
    chai.assert.equal(allBlocks.length, 10);
  });

  test('undoing delete block results in the correct number of blocks', async function () {
    await this.browser.keys([Key.Ctrl, 'z']);
    await this.browser.pause(PAUSE_TIME);
    const allBlocks = await getAllBlocks(this.browser);
    chai.assert.equal(allBlocks.length, 13);
  });
});

async function testingJSONLoad(browser) {
  return await browser.execute(() => {
    const myWorkspace = Blockly.getMainWorkspace();
    const state = {
      'blocks': {
        'languageVersion': 0,
        'blocks': [
          {
            'type': 'controls_if',
            'id': 'O]NpXoWXyz9okeD.PxV0',
            'x': 112,
            'y': 38,
            'extraState': {
              'elseIfCount': 1,
              'hasElse': true,
            },
            'inputs': {
              'DO0': {
                'block': {
                  'type': 'controls_repeat_ext',
                  'id': ',8#9eTr9hCrD3nR|uW1L',
                  'inputs': {
                    'TIMES': {
                      'shadow': {
                        'type': 'math_number',
                        'id': '(6!seVzJ[5W=!M_s@s=I',
                        'fields': {
                          'NUM': 4,
                        },
                      },
                    },
                  },
                },
              },
              'DO1': {
                'block': {
                  'type': 'controls_repeat_ext',
                  'id': ']X9#sM4FJiVrRP;y0m6H',
                  'inputs': {
                    'TIMES': {
                      'shadow': {
                        'type': 'math_number',
                        'id': '%k#p|;f+Y*#.8DX].a6Y',
                        'fields': {
                          'NUM': -10,
                        },
                      },
                    },
                  },
                },
              },
              'ELSE': {
                'block': {
                  'type': 'controls_repeat_ext',
                  'id': '`ZOj01@KGMQ?+MMcLKZ:',
                  'inputs': {
                    'TIMES': {
                      'shadow': {
                        'type': 'math_number',
                        'id': 'IIK8IHzVCoUpTfx[j=^9',
                        'fields': {
                          'NUM': 10,
                        },
                      },
                      'block': {
                        'type': 'logic_ternary',
                        'id': '!$UboN.F)peh:!o]D48-',
                        'inputs': {
                          'IF': {
                            'block': {
                              'type': 'logic_boolean',
                              'id': '|?-zstzEVy,Ec%%dJZM{',
                              'fields': {
                                'BOOL': 'FALSE',
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            'next': {
              'block': {
                'type': 'controls_repeat_ext',
                'id': 'E8bF[-r:B~cabGLP#QYd',
                'inputs': {
                  'TIMES': {
                    'shadow': {
                      'type': 'math_number',
                      'id': 'vOb`Us7f.bIuXRGd(K.e',
                      'fields': {
                        'NUM': 10,
                      },
                    },
                    'block': {
                      'type': 'logic_ternary',
                      'id': 'AyS?@78RwAtQ$?aU[-$L',
                      'inputs': {
                        'IF': {
                          'block': {
                            'type': 'logic_boolean',
                            'id': 'K@$Ewnj*Y6JcKR`mycf8',
                            'fields': {
                              'BOOL': 'FALSE',
                            },
                          },
                        },
                      },
                    },
                  },
                },
                'next': {
                  'block': {
                    'type': 'controls_repeat_ext',
                    'id': 'XFO4v:Cf@2~rgH9CQZ]/',
                    'inputs': {
                      'TIMES': {
                        'shadow': {
                          'type': 'math_number',
                          'id': 'jf)XYgvoi!c.3V[u@h+-',
                          'fields': {
                            'NUM': 10,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        ],
      },
    };
    Blockly.serialization.workspaces.load(state, myWorkspace);
    return myWorkspace.getAllBlocks(false).length;
  });
}
