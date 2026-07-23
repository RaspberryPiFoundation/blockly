/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Tests for the rename script.
 */

import {assert} from 'chai';
import {getDatabase, Renamer} from '../bin/rename.js';
import {stub} from 'sinon';

suite('Rename', function () {
  // Integration-ish test meant to test multiple things.
  test('a javascript program with multiple renames works correctly', function () {
    const database = {
      '1.0.0': [
        {
          oldName: 'Blockly',
          exports: {},
        },
        {
          oldName: 'Blockly.moduleA',
          newName: 'Blockly.newModuleA',
          exports: {
            exportA: {
              newExport: 'newExportA',
            },
            exportB: {
              newExport: 'newExportB',
            },
            exportC: {
              newExport: 'someOtherName',
              newPath: 'Blockly.moduleA.exportC',
            },
          },
        },
        {
          oldName: 'Blockly.moduleB',
          newName: 'Blockly.newModuleB',
          newPath: 'Blockly.moduleB',
        },
        {
          oldName: 'Blockly.moduleC',
          newExport: 'ClassC',
        },
        {
          oldName: 'Blockly.moduleD',
          newExport: 'ClassD',
        },
      ],
    };
    const oldString = `
import * as Blockly from 'blockly';

class SubClass extends Blockly.moduleC {
  constructor() {
    this.propertyA = Blockly.moduleA.exportA();
    Blockly.moduleA.exportB(null);
    this.propertyC = Blockly.moduleA.exportC;
  }

  methodA() {
    // A comment containing Blockly.moduleA.exportA with some following.
    methodB(Blockly.moduleB.suffix(), this.propertyA);
  }

  /**
   * @param {number}
   * @param {Blockly.moduleA.exportC}
   * @returns {Blockly.moduleA.exportA}
   */
  methodB(paramA, paramB) {
    const thing = /** @type {Blockly.moduleD} */ (new Blockly.moduleE());
    return thing.someMethod(paramA, paramB);
  }
};`;

    const newString = new Renamer(database, '0.0.0', '1.0.0').rename(oldString);

    const expectedString = `
import * as Blockly from 'blockly';

class SubClass extends Blockly.moduleC.ClassC {
  constructor() {
    this.propertyA = Blockly.newModuleA.newExportA();
    Blockly.newModuleA.newExportB(null);
    this.propertyC = Blockly.moduleA.exportC;
  }

  methodA() {
    // A comment containing Blockly.newModuleA.newExportA with some following.
    methodB(Blockly.moduleB.suffix(), this.propertyA);
  }

  /**
   * @param {number}
   * @param {Blockly.moduleA.exportC}
   * @returns {Blockly.newModuleA.newExportA}
   */
  methodB(paramA, paramB) {
    const thing = /** @type {Blockly.moduleD.ClassD} */ (new Blockly.moduleE());
    return thing.someMethod(paramA, paramB);
  }
};`;
    assert.deepEqual(newString, expectedString);
  });

  suite('Database', function () {
    test('getDatabase retrieves renamings.json5', async function () {
      const database = await getDatabase();

      // Sanity check example entry.
      assert.isObject(database);
      assert.isTrue('0.0.0' in database);
      assert.isArray(database['0.0.0']);
    });
  });

  suite('Exports', function () {
    setup(function () {
      this.errSpy = stub(process.stderr, 'write');
    });

    teardown(function () {
      this.errSpy.restore();
    });

    test('exports without new paths are renamed to the new export', function () {
      const database = {
        '1.0.0': [
          {
            oldName: 'module',
            exports: {
              oldExportName: {
                newExport: 'newExportName',
              },
            },
          },
        ],
      };
      const oldString = 'module.oldExportName';

      const newString = new Renamer(database, '0.0.0', '1.0.0').rename(
        oldString,
      );

      assert.deepEqual(newString, 'module.newExportName');
    });

    test('exports with new paths are renamed to the new path', function () {
      const database = {
        '1.0.0': [
          {
            oldName: 'module',
            exports: {
              oldExportName: {
                newName: 'someOtherName',
                newPath: 'otherModule.newExportName',
              },
            },
          },
        ],
      };
      const oldString = 'module.oldExportName';

      const newString = new Renamer(database, '0.0.0', '1.0.0').rename(
        oldString,
      );

      assert.deepEqual(newString, 'otherModule.newExportName');
    });

    test('suffixes on renamed exports without a new path are kept', function () {
      const database = {
        '1.0.0': [
          {
            oldName: 'module',
            exports: {
              oldExportName: {
                newExport: 'newExportName',
              },
            },
          },
        ],
      };
      const oldString = 'module.oldExportName.suffix';

      const newString = new Renamer(database, '0.0.0', '1.0.0').rename(
        oldString,
      );

      assert.deepEqual(newString, 'module.newExportName.suffix');
    });

    test('suffixes on renamed exports with a new path are kept', function () {
      const database = {
        '1.0.0': [
          {
            oldName: 'module',
            exports: {
              oldExportName: {
                newName: 'someOtherName',
                newPath: 'otherModule.newExportName',
              },
            },
          },
        ],
      };
      const oldString = 'module.oldExportName.suffix';

      const newString = new Renamer(database, '0.0.0', '1.0.0').rename(
        oldString,
      );

      assert.deepEqual(newString, 'otherModule.newExportName.suffix');
    });

    test('exports that are now properties are renamed properly', function () {
      const database = {
        '1.0.0': [
          {
            oldName: 'module',
            exports: {
              oldExportName: {
                newExport: 'new.export.name',
              },
            },
          },
        ],
      };
      const oldString = 'module.oldExportName';

      const newString = new Renamer(database, '0.0.0', '1.0.0').rename(
        oldString,
      );

      assert.deepEqual(newString, 'module.new.export.name');
    });

    test('suffixes on exports that are now properties are kept', function () {
      const database = {
        '1.0.0': [
          {
            oldName: 'module',
            exports: {
              oldExportName: {
                newExport: 'new.export.name',
              },
            },
          },
        ],
      };
      const oldString = 'module.oldExportName.suffix';

      const newString = new Renamer(database, '0.0.0', '1.0.0').rename(
        oldString,
      );

      assert.deepEqual(newString, 'module.new.export.name.suffix');
    });

    test('properties that are now exports are renamed properly', function () {
      const database = {
        '1.0.0': [
          {
            oldName: 'module',
            exports: {
              'old.property.name': {
                newExport: 'newExportName',
              },
            },
          },
        ],
      };
      const oldString = 'module.old.property.name';

      const newString = new Renamer(database, '0.0.0', '1.0.0').rename(
        oldString,
      );

      assert.deepEqual(newString, 'module.newExportName');
    });

    test('suffixes on properties that are now exports are kept', function () {
      const database = {
        '1.0.0': [
          {
            oldName: 'module',
            exports: {
              'old.property.name': {
                newExport: 'newExportName',
              },
            },
          },
        ],
      };
      const oldString = 'module.old.property.name.suffix';

      const newString = new Renamer(database, '0.0.0', '1.0.0').rename(
        oldString,
      );

      assert.deepEqual(newString, 'module.newExportName.suffix');
    });

    test(
      'properties on renamed exports which are moved to new properties ' +
        'are renamed properly',
      function () {
        const database = {
          '1.0.0': [
            {
              oldName: 'module',
              exports: {
                'export.property': {
                  newExport: 'newExport',
                },
                'export': {
                  newExport: 'newNameForExistingExport',
                },
              },
            },
          ],
        };
        const oldString = `
const foo = module.export.property;
const bar = module.export;`;

        const newString = new Renamer(database, '0.0.0', '1.0.0').rename(
          oldString,
        );

        const expectedString = `
const foo = module.newExport;
const bar = module.newNameForExistingExport;`;
        assert.deepEqual(newString, expectedString);
      },
    );

    test('exports with get methods are changed to use get methods', function () {
      const database = {
        '1.0.0': [
          {
            oldName: 'module',
            exports: {
              oldExportName: {
                getMethod: 'getExport',
              },
            },
          },
        ],
      };
      const oldString = 'const foo = module.oldExportName.suffix;';

      const newString = new Renamer(database, '0.0.0', '1.0.0').rename(
        oldString,
      );

      assert.deepEqual(newString, 'const foo = module.getExport().suffix;');
    });

    test('exports with get+set methods are changed to include FIXME comment', function () {
      const database = {
        '1.0.0': [
          {
            oldName: 'module',
            exports: {
              oldExportName: {
                getMethod: 'getExport',
                setMethod: 'setExport',
              },
            },
          },
        ],
      };
      const oldString = 'const foo = module.oldExportName;';

      const newString = new Renamer(database, '0.0.0', '1.0.0').rename(
        oldString,
      );

      assert.match(newString, /FIXME/, 'contains FIXME comment');
      assert.match(newString, /module\.getExport\(/, 'contains get example');
      assert.match(newString, /module\.setExport\(/, 'contains set example');
    });

    test('exports with set methods trigger console output', function () {
      const database = {
        '1.0.0': [
          {
            oldName: 'module',
            exports: {
              oldExportName: {
                setMethod: 'setExport',
              },
            },
          },
        ],
      };
      const oldString = 'module.oldExportName = foo;';

      new Renamer(database, '0.0.0', '1.0.0').rename(oldString);

      assert.isTrue(
        this.errSpy.calledWith(
          '    - Call module.setExport(' +
            '/* new value */) instead of setting it.\n',
        ),
      );
    });

    test('renamed exports in renamed modules get properly renamed', function () {
      const database = {
        '1.0.0': [
          {
            oldName: 'oldModule',
            newName: 'newModule',
            exports: {
              oldExport: {
                newExport: 'newExport',
              },
            },
          },
        ],
      };
      const oldString = 'oldModule.oldExport';

      const newString = new Renamer(database, '0.0.0', '1.0.0').rename(
        oldString,
      );

      assert.deepEqual(newString, 'newModule.newExport');
    });

    test(
      'renamed exports on renamed modules with backwards compatible new ' +
        'paths do not have their modules renamed',
      function () {
        const database = {
          '1.0.0': [
            {
              oldName: 'oldModule',
              newName: 'newModule',
              newPath: 'oldModule',
              exports: {
                oldExport: {
                  newExport: 'newExport',
                },
              },
            },
          ],
        };
        const oldString = 'oldModule.oldExport';

        const newString = new Renamer(database, '0.0.0', '1.0.0').rename(
          oldString,
        );

        assert.deepEqual(newString, 'oldModule.newExport');
      },
    );

    test('exports with new modules are "moved" to new modules', function () {
      const database = {
        '1.0.0': [
          {
            oldName: 'oldModule',
            exports: {
              exportName: {
                newModule: 'newModule',
              },
            },
          },
        ],
      };
      const oldString = 'oldModule.exportName';

      const newString = new Renamer(database, '0.0.0', '1.0.0').rename(
        oldString,
      );

      assert.deepEqual(newString, 'newModule.exportName');
    });

    test(
      'exports moved to the old version of renamed modules are renamed ' +
        'properly',
      function () {
        const database = {
          '1.0.0': [
            {
              oldName: 'moduleA',
              exports: {
                exportName: {
                  newModule: 'moduleB',
                },
              },
            },
            {
              oldName: 'moduleB',
              newName: 'moduleC',
            },
          ],
        };
        const oldString = 'moduleA.exportName';

        const newString = new Renamer(database, '0.0.0', '1.0.0').rename(
          oldString,
        );

        assert.deepEqual(newString, 'moduleB.exportName');
      },
    );

    test(
      'exports moved to the new version of renamed modules are renamed ' +
        'properly',
      function () {
        const database = {
          '1.0.0': [
            {
              oldName: 'moduleA',
              exports: {
                exportName: {
                  newModule: 'moduleC',
                },
              },
            },
            {
              oldName: 'moduleB',
              newName: 'moduleC',
            },
          ],
        };
        const oldString = 'moduleA.exportName';

        const newString = new Renamer(database, '0.0.0', '1.0.0').rename(
          oldString,
        );

        assert.deepEqual(newString, 'moduleC.exportName');
      },
    );

    test(
      'exports which are renamed in consecutive versions get the most ' +
        'recent rename',
      function () {
        const database = {
          '1.0.0': [
            {
              oldName: 'moduleA',
              exports: {
                exportA1: {
                  newExport: 'exportA2',
                },
              },
            },
          ],
          '2.0.0': [
            {
              oldName: 'moduleA',
              exports: {
                exportA2: {
                  newExport: 'exportA3',
                },
              },
            },
          ],
        };
        const oldString = 'moduleA.exportA1';

        const newString = new Renamer(database, '0.0.0', '2.0.0').rename(
          oldString,
        );

        assert.deepEqual(newString, 'moduleA.exportA3');
      },
    );

    test(
      'exports which are renamed and then reexported at their old path ' +
        'in a newer version are not renamed',
      function () {
        const database = {
          '1.0.0': [
            {
              oldName: 'moduleA',
              exports: {
                exportA1: {
                  newExport: 'exportA2',
                },
              },
            },
          ],
          '2.0.0': [
            {
              oldName: 'moduleA',
              exports: {
                exportA2: {
                  newPath: 'moduleA.exportA1',
                },
              },
            },
          ],
        };
        const oldString = 'moduleA.exportA1';

        const newString = new Renamer(database, '0.0.0', '2.0.0').rename(
          oldString,
        );

        assert.deepEqual(newString, 'moduleA.exportA1');
      },
    );
  });

  suite('Modules', function () {
    test('modules without new paths are renamed to the new name', function () {
      const database = {
        '1.0.0': [
          {
            oldName: 'base.oldModuleName',
            newName: 'base.newModuleName',
          },
        ],
      };
      const oldString = 'base.oldModuleName';

      const newString = new Renamer(database, '0.0.0', '1.0.0').rename(
        oldString,
      );

      assert.deepEqual(newString, 'base.newModuleName');
    });

    test('modules with new paths are renamed to the new path', function () {
      const database = {
        '1.0.0': [
          {
            oldName: 'base.oldModuleName',
            newName: 'base.someOtherName',
            newPath: 'base.newModuleName',
          },
        ],
      };
      const oldString = 'base.oldModuleName';

      const newString = new Renamer(database, '0.0.0', '1.0.0').rename(
        oldString,
      );

      assert.deepEqual(newString, 'base.newModuleName');
    });

    test('suffixes on renamed modules without new exports are kept', function () {
      const database = {
        '1.0.0': [
          {
            oldName: 'base.oldModuleName',
            newName: 'base.newModuleName',
          },
        ],
      };
      const oldString = 'base.oldModuleName.suffix';

      const newString = new Renamer(database, '0.0.0', '1.0.0').rename(
        oldString,
      );

      assert.deepEqual(newString, 'base.newModuleName.suffix');
    });

    test(
      'suffixes on renamed modules without new exports but with new paths ' +
        'are kept',
      function () {
        const database = {
          '1.0.0': [
            {
              oldName: 'base.oldModuleName',
              newName: 'base.someOtherName',
              newPath: 'base.newModuleName',
            },
          ],
        };

        const oldString = 'base.oldModuleName.suffix';

        const newString = new Renamer(database, '0.0.0', '1.0.0').rename(
          oldString,
        );

        assert.deepEqual(newString, 'base.newModuleName.suffix');
      },
    );

    test('modules with new exports and without new paths gain the new export', function () {
      const database = {
        '1.0.0': [
          {
            oldName: 'base.moduleName',
            newExport: 'newExport',
          },
        ],
      };
      const oldString = 'base.moduleName';

      const newString = new Renamer(database, '0.0.0', '1.0.0').rename(
        oldString,
      );

      assert.deepEqual(newString, 'base.moduleName.newExport');
    });

    test('modules with new exports with new paths are renamed to the new path', function () {
      const database = {
        '1.0.0': [
          {
            oldName: 'base.moduleName',
            newExport: 'someOtherName',
            newPath: 'base.newModuleName.newExport',
          },
        ],
      };
      const oldString = 'base.moduleName';

      const newString = new Renamer(database, '0.0.0', '1.0.0').rename(
        oldString,
      );

      assert.deepEqual(newString, 'base.newModuleName.newExport');
    });

    test('suffixes on modules with new exports are kept', function () {
      const database = {
        '1.0.0': [
          {
            oldName: 'base.moduleName',
            newExport: 'newExport',
          },
        ],
      };
      const oldString = 'base.moduleName.suffix';

      const newString = new Renamer(database, '0.0.0', '1.0.0').rename(
        oldString,
      );

      assert.deepEqual(newString, 'base.moduleName.newExport.suffix');
    });

    test('modules with new exports and new names are renamed properly', function () {
      const database = {
        '1.0.0': [
          {
            oldName: 'base.oldModuleName',
            newName: 'base.newModuleName',
            newExport: 'newExport',
          },
        ],
      };
      const oldString = 'base.oldModuleName';

      const newString = new Renamer(database, '0.0.0', '1.0.0').rename(
        oldString,
      );

      assert.deepEqual(newString, 'base.newModuleName.newExport');
    });

    test(
      'modules which are renamed in consecutive versions get the most ' +
        'recent rename',
      function () {
        const database = {
          '1.0.0': [
            {
              oldName: 'base.moduleA1',
              newName: 'base.moduleA2',
            },
          ],
          '2.0.0': [
            {
              oldName: 'base.moduleA2',
              newName: 'base.moduleA3',
            },
          ],
        };
        const oldString = 'base.moduleA1';

        const newString = new Renamer(database, '0.0.0', '2.0.0').rename(
          oldString,
        );

        assert.deepEqual(newString, 'base.moduleA3');
      },
    );

    test(
      'modules which are renamed and then reexported at their old path ' +
        'in a newer version are not renamed',
      function () {
        const database = {
          '1.0.0': [
            {
              oldName: 'base.moduleA1',
              newName: 'base.moduleA2',
            },
          ],
          '2.0.0': [
            {
              oldName: 'base.moduleA2',
              newPath: 'base.moduleA1',
            },
          ],
        };
        const oldString = 'base.moduleA1';

        const newString = new Renamer(database, '0.0.0', '2.0.0').rename(
          oldString,
        );

        assert.deepEqual(newString, 'base.moduleA1');
      },
    );

    test('partial matches are ignored', function () {
      const database = {
        '1.0.0': [
          {
            oldname: 'moduleA',
            newname: 'moduleB',
          },
        ],
      };
      const oldString = 'moduleAA';

      const newString = new Renamer(database, '0.0.0', '2.0.0').rename(
        oldString,
      );

      assert.deepEqual(newString, 'moduleAA');
    });
  });

  suite('Versions', function () {
    test('renames below the lower bound of the version range are not applied', function () {
      const database = {
        '2.0.0': [
          {
            oldName: 'module',
            exports: {
              oldExportName: {
                newExport: 'newExportName',
              },
            },
          },
        ],
      };
      const oldString = 'module.oldExportName';

      const newString = new Renamer(database, '3.0.0', '4.0.0').rename(
        oldString,
      );

      assert.deepEqual(newString, 'module.oldExportName');
    });

    test('renames in the lower bound of the version range are not applied', function () {
      const database = {
        '2.0.0': [
          {
            oldName: 'module',
            exports: {
              oldExportName: {
                newExport: 'newExportName',
              },
            },
          },
        ],
      };
      const oldString = 'module.oldExportName';

      const newString = new Renamer(database, '2.0.0', '3.0.0').rename(
        oldString,
      );

      assert.deepEqual(newString, 'module.oldExportName');
    });

    test('renames in the upper bound of the version range are applied', function () {
      const database = {
        '2.0.0': [
          {
            oldName: 'module',
            exports: {
              oldExportName: {
                newExport: 'newExportName',
              },
            },
          },
        ],
      };
      const oldString = 'module.oldExportName';

      const newString = new Renamer(database, '1.0.0', '2.0.0').rename(
        oldString,
      );

      assert.deepEqual(newString, 'module.newExportName');
    });

    test('renames in the middle of the version range are applied', function () {
      const database = {
        '2.0.0': [
          {
            oldName: 'module',
            exports: {
              oldExportName: {
                newExport: 'newExportName',
              },
            },
          },
        ],
      };
      const oldString = 'module.oldExportName';

      const newString = new Renamer(database, '1.0.0', '3.0.0').rename(
        oldString,
      );

      assert.deepEqual(newString, 'module.newExportName');
    });

    test('renames above the upper bound of the version range are not applied', function () {
      const database = {
        '2.0.0': [
          {
            oldName: 'module',
            exports: {
              oldExportName: {
                newExport: 'newExportName',
              },
            },
          },
        ],
      };
      const oldString = 'module.oldExportName';

      const newString = new Renamer(database, '0.0.0', '1.0.0').rename(
        oldString,
      );

      assert.deepEqual(newString, 'module.oldExportName');
    });

    test('from-version assumes the earliest matching version', function () {
      const database = {
        '1.0.0': [
          {
            oldName: 'module',
            exports: {
              exportA: {
                newExport: 'newExportA',
              },
            },
          },
        ],
        '1.1.0': [
          {
            oldName: 'module',
            exports: {
              exportB: {
                newExport: 'newExportB',
              },
            },
          },
        ],
      };
      const oldString = 'module.exportA; module.exportB';

      const newString = new Renamer(database, '1', '2.0.0').rename(oldString);

      assert.deepEqual(newString, 'module.exportA; module.newExportB');
    });

    test('to-version assumes the latest matching version', function () {
      const database = {
        '2.0.0': [
          {
            oldName: 'module',
            exports: {
              exportA: {
                newExport: 'newExportA',
              },
            },
          },
        ],
        '2.1.0': [
          {
            oldName: 'module',
            exports: {
              exportB: {
                newExport: 'newExportB',
              },
            },
          },
        ],
      };
      const oldString = 'module.exportA; module.exportB';

      const newString = new Renamer(database, '1.0.0', '2').rename(oldString);

      assert.deepEqual(newString, 'module.newExportA; module.newExportB');
    });

    test('the develop version is outside all ranges', function () {
      const database = {
        develop: [
          {
            oldName: 'base.oldModule',
            newName: 'base.newModule',
          },
        ],
      };
      const oldString = 'base.oldModule';

      const newString = new Renamer(database, '0.0.0', '1.0.0').rename(
        oldString,
      );

      assert.deepEqual(newString, 'base.oldModule');
    });

    test('the develop version works if directly targeted', function () {
      const database = {
        develop: [
          {
            oldName: 'base.oldModule',
            newName: 'base.newModule',
          },
        ],
      };
      const oldString = 'base.oldModule';

      const newString = new Renamer(database, '0.0.0', 'develop').rename(
        oldString,
      );

      assert.deepEqual(newString, 'base.newModule');
    });
  });
});
