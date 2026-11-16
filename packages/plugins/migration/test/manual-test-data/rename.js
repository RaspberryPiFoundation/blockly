// Manual test data for the renamings migration.
// Run using:
//   node ./bin/migrate rename --from <version> ./test/manual-test-data/rename.txt

import Blockly from 'blockly';

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
    const thingA = /** @type {Blockly.moduleD} */ (new Blockly.moduleE());
    return thingA.someMethod(paramA, paramB);
  }
}
