// Added November 2022 after discovering that a number of orgs were hot-linking
// their Blockly applications to https://blockly-demo.appspot.com/
// Delete this file in early 2024.
var msg = 'Compiled Blockly files should be loaded from https://unpkg.com/blockly/\n' +
    'For help, contact https://groups.google.com/g/blockly';
console.log(msg);
try {
  alert(msg);
} catch {
  // Can't alert?  Probably node.js.
}
