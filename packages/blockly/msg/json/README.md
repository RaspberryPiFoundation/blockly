# Blockly

## Messages

This directory contains "messages" files, which are JSON-format files
containing human-translated strings that are needed by Blockly.

### Translating

**We do not accept pull requests for files in this directory**.
Instead, we use [Translatewiki](https://translatewiki.net/) to manage
translations for Blockly.  Please refer to [the detailed instructions
on how to help us translate Blockly](
https://developers.google.com/blockly/guides/contribute/core/translating)
on the Blockly Developers site.

There is one notable exception: because the language is not supported
by Translatewiki, contributors to the [Klingon translation](
https://developers.google.com/blockly/guides/contribute/core/klingon)
may submit PRs making changes to [`tlh.json`](tlh.json) directly.

### Building

Blockly cannot use the files in this directory directly.  Instead,
they must first be converted into executable `.js` files we call
"langfiles".  This is done automatically as needed by the build
system, but you can also run this build step manually by invoking `npm
run langfiles`; the output will be found in `build/msg/`.

## Additional Information

For more information about Blockly, see [the main Blockly README](
../../README.md).
