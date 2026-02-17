/**
 * @license
 * Copyright 2026 Raspberry Pi Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

// The draw block contains a stack of statement blocks, each of which
// has a value input to which is connected a value expression block
// which itself has one or two inputs which have (non-shadow) simple
// value blocks connected.  Each statement block will be selected in
// turn and then a move initiated (and then aborted).  This is then
// repeated with the first level value blocks (those that are attached
// to the statement blocks).  The second level value blocks are
// present to verify correct (lack of) heal behaviour.
const moveStartTestBlocks = {
  'blocks': {
    'languageVersion': 0,
    'blocks': [
      {
        'type': 'p5_setup',
        'id': 'p5_setup_1',
        'x': 0,
        'y': 75,
        'deletable': false,
        'inputs': {
          'STATEMENTS': {
            'block': {
              'type': 'p5_canvas',
              'id': 'p5_canvas_1',
              'deletable': false,
              'movable': false,
              'fields': {
                'WIDTH': 400,
                'HEIGHT': 400,
              },
            },
          },
        },
      },
      {
        'type': 'p5_draw',
        'id': 'p5_draw_1',
        'x': 0,
        'y': 332,
        'deletable': false,
        'inputs': {
          'STATEMENTS': {
            'block': {
              'type': 'controls_if',
              'id': 'statement_1',
              'inputs': {
                'IF0': {
                  'block': {
                    'type': 'logic_operation',
                    'id': 'value_1',
                    'fields': {
                      'OP': 'AND',
                    },
                    'inputs': {
                      'A': {
                        'block': {
                          'type': 'logic_boolean',
                          'id': 'value_1_1',
                          'fields': {
                            'BOOL': 'TRUE',
                          },
                        },
                      },
                      'B': {
                        'block': {
                          'type': 'logic_boolean',
                          'id': 'value_1_2',
                          'fields': {
                            'BOOL': 'TRUE',
                          },
                        },
                      },
                    },
                  },
                },
              },
              'next': {
                'block': {
                  'type': 'controls_if',
                  'id': 'statement_2',
                  'inputs': {
                    'IF0': {
                      'block': {
                        'type': 'logic_negate',
                        'id': 'value_2',
                        'inputs': {
                          'BOOL': {
                            'block': {
                              'type': 'logic_boolean',
                              'id': 'value_2_1',
                              'fields': {
                                'BOOL': 'TRUE',
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
                      'id': 'statement_3',
                      'inputs': {
                        'TIMES': {
                          'shadow': {
                            'type': 'math_number',
                            'id': 'shadow_3',
                            'fields': {
                              'NUM': 10,
                            },
                          },
                          'block': {
                            'type': 'math_arithmetic',
                            'id': 'value_3',
                            'fields': {
                              'OP': 'ADD',
                            },
                            'inputs': {
                              'A': {
                                'shadow': {
                                  'type': 'math_number',
                                  'id': 'shadow_3_1',
                                  'fields': {
                                    'NUM': 1,
                                  },
                                },
                                'block': {
                                  'type': 'math_number',
                                  'id': 'value_3_1',
                                  'fields': {
                                    'NUM': 0,
                                  },
                                },
                              },
                              'B': {
                                'shadow': {
                                  'type': 'math_number',
                                  'id': 'shadow_3_2',
                                  'fields': {
                                    'NUM': 1,
                                  },
                                },
                                'block': {
                                  'type': 'math_number',
                                  'id': 'value_3_2',
                                  'fields': {
                                    'NUM': 0,
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
                          'id': 'statement_4',
                          'inputs': {
                            'TIMES': {
                              'shadow': {
                                'type': 'math_number',
                                'id': 'shadow_4',
                                'fields': {
                                  'NUM': 10,
                                },
                              },
                              'block': {
                                'type': 'math_trig',
                                'id': 'value_4',
                                'fields': {
                                  'OP': 'SIN',
                                },
                                'inputs': {
                                  'NUM': {
                                    'shadow': {
                                      'type': 'math_number',
                                      'id': 'shadow_4_1',
                                      'fields': {
                                        'NUM': 45,
                                      },
                                    },
                                    'block': {
                                      'type': 'math_number',
                                      'id': 'value_4_1',
                                      'fields': {
                                        'NUM': 180,
                                      },
                                    },
                                  },
                                },
                              },
                            },
                          },
                          'next': {
                            'block': {
                              'type': 'text_print',
                              'id': 'statement_5',
                              'inputs': {
                                'TEXT': {
                                  'shadow': {
                                    'type': 'text',
                                    'id': 'shadow_5',
                                    'fields': {
                                      'TEXT': 'abc',
                                    },
                                  },
                                  'block': {
                                    'type': 'text_join',
                                    'id': 'value_5',
                                    'extraState': {
                                      'itemCount': 2,
                                    },
                                    'inputs': {
                                      'ADD0': {
                                        'block': {
                                          'type': 'text',
                                          'id': 'value_5_1',
                                          'fields': {
                                            'TEXT': 'test',
                                          },
                                        },
                                      },
                                      'ADD1': {
                                        'block': {
                                          'type': 'text',
                                          'id': 'value_5_2',
                                          'fields': {
                                            'TEXT': 'test',
                                          },
                                        },
                                      },
                                    },
                                  },
                                },
                              },
                              'next': {
                                'block': {
                                  'type': 'text_print',
                                  'id': 'statement_6',
                                  'inputs': {
                                    'TEXT': {
                                      'shadow': {
                                        'type': 'text',
                                        'id': 'shadow_6',
                                        'fields': {
                                          'TEXT': 'abc',
                                        },
                                      },
                                      'block': {
                                        'type': 'text_reverse',
                                        'id': 'value_6',
                                        'inputs': {
                                          'TEXT': {
                                            'shadow': {
                                              'type': 'text',
                                              'id': 'shadow_6_1',
                                              'fields': {
                                                'TEXT': '',
                                              },
                                            },
                                            'block': {
                                              'type': 'text',
                                              'id': 'value_6_1',
                                              'fields': {
                                                'TEXT': 'test',
                                              },
                                            },
                                          },
                                        },
                                      },
                                    },
                                  },
                                  'next': {
                                    'block': {
                                      'type': 'draw_emoji',
                                      'id': 'statement_7',
                                      'fields': {
                                        'emoji': '❤️',
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

// A bunch of statement blocks.  It is intended that statement blocks
// to be moved can be attached to the next connection of p5_canvas,
// and then be (constrained-)moved up, down, left and right to verify
// that they visit all the expected candidate connections.
const moveStatementTestBlocks = {
  'blocks': {
    'languageVersion': 0,
    'blocks': [
      {
        'type': 'p5_setup',
        'id': 'p5_setup',
        'x': 75,
        'y': 75,
        'deletable': false,
        'inputs': {
          'STATEMENTS': {
            'block': {
              'type': 'p5_canvas',
              'id': 'p5_canvas',
              'deletable': false,
              'movable': false,
              'fields': {
                'WIDTH': 400,
                'HEIGHT': 400,
              },
            },
          },
        },
      },
      {
        'type': 'text_print',
        'id': 'text_print',
        'disabledReasons': ['MANUALLY_DISABLED'],
        'x': 75,
        'y': 400,
        'inputs': {
          'TEXT': {
            'shadow': {
              'type': 'text',
              'id': 'shadow_text',
              'fields': {
                'TEXT': 'abc',
              },
            },
          },
        },
        'next': {
          'block': {
            'type': 'controls_if',
            'id': 'controls_if',
            'extraState': {
              'elseIfCount': 1,
              'hasElse': true,
            },
            'inputs': {
              'DO0': {
                'block': {
                  'type': 'controls_repeat_ext',
                  'id': 'controls_repeat_ext',
                  'inputs': {
                    'TIMES': {
                      'shadow': {
                        'type': 'math_number',
                        'id': 'shadow_math_number',
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
      },
      {
        'type': 'p5_draw',
        'id': 'p5_draw',
        'x': 75,
        'y': 950,
        'deletable': false,
      },
    ],
  },
};

const moveValueTestBlocks = {
  'blocks': {
    'languageVersion': 0,
    'blocks': [
      {
        'type': 'p5_setup',
        'id': 'p5_setup',
        'x': 75,
        'y': 75,
        'deletable': false,
        'inputs': {
          'STATEMENTS': {
            'block': {
              'type': 'p5_canvas',
              'id': 'p5_canvas',
              'deletable': false,
              'movable': false,
              'fields': {
                'WIDTH': 400,
                'HEIGHT': 400,
              },
            },
          },
        },
      },
      {
        'type': 'text_join',
        'id': 'join0',
        'x': 75,
        'y': 200,
      },
      {
        'type': 'p5_draw',
        'id': 'p5_draw',
        'x': 75,
        'y': 300,
        'deletable': false,
        'inputs': {
          'STATEMENTS': {
            'block': {
              'type': 'text_print',
              'id': 'print1',
              'next': {
                'block': {
                  'type': 'text_print',
                  'id': 'print2',
                  'inputs': {
                    'TEXT': {
                      'shadow': {
                        'type': 'text',
                        'id': 'shadow_print2',
                        'fields': {
                          'TEXT': 'shadow',
                        },
                      },
                    },
                  },
                  'next': {
                    'block': {
                      'type': 'draw_emoji',
                      'id': 'draw_emoji',
                      'fields': {
                        'emoji': '🐻',
                      },
                      'next': {
                        'block': {
                          'type': 'text_print',
                          'id': 'print3',
                          'inputs': {
                            'TEXT': {
                              'block': {
                                'type': 'text_join',
                                'id': 'join1',
                                'inline': true,
                                'inputs': {
                                  'ADD0': {
                                    'shadow': {
                                      'type': 'text',
                                      'id': 'shadow_join',
                                      'fields': {
                                        'TEXT': 'inline',
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
                              'id': 'controls_repeat_ext',
                              'inputs': {
                                'TIMES': {
                                  'shadow': {
                                    'type': 'math_number',
                                    'id': 'shadow_repeat',
                                    'fields': {
                                      'NUM': 1,
                                    },
                                  },
                                },
                                'DO': {
                                  'block': {
                                    'type': 'text_print',
                                    'id': 'print4',
                                    'inputs': {
                                      'TEXT': {
                                        'block': {
                                          'type': 'text_join',
                                          'id': 'join2',
                                          'inline': false,
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

export {moveStartTestBlocks, moveStatementTestBlocks, moveValueTestBlocks};
