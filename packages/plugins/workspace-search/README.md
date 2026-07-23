# @blockly/plugin-workspace-search [![Built on Blockly](https://tinyurl.com/built-on-blockly)](https://github.com/google/blockly)

A [Blockly](https://www.npmjs.com/package/blockly) plugin that adds workspace search support.

## Installation

```
npm install @blockly/plugin-workspace-search --save
```

## Usage

### ES6 Imports

```js
import * as Blockly from 'blockly';
import {WorkspaceSearch} from '@blockly/plugin-workspace-search';

const workspace = Blockly.inject('blocklyDiv');
const workspaceSearch = new WorkspaceSearch(workspace);

workspaceSearch.init();
```

### Script Tag

```js
<script src="./node_modules/@blockly/plugin-workspace-search/dist/index.js"></script>
```

To open workspace search use either command + f or control + f. To close the search bar hit escape or the 'x' in the top right corner.

## API

- `init`: Initializes the workspace search bar.
- `dispose`: Disposes of workspace search.
- `open`: Opens the search bar.
- `close`: Closes the search bar.
- `previous`: Selects the previous block.
- `next`: Selects the next block.
- `setSearchPlaceholder`: Sets the placeholder text for the search bar text input.
- `addActionBtn`: Add a button to the action div. This must be called after the init function has been called.
- `clearBlocks`: Clears the selection group and current block.
- `searchAndHighlight`: Searches the workspace for the current search term and highlights matching blocks.

## Styling

The generated search bar looks like:

```html
<div class="ws-search'>
  <div class="ws-search-container'>
    <div class="ws-search-content'>
      <div class="ws-search-input'>
        [... text input goes here ...]
      </div>
      [... actions div goes here ...]
    </div>
    [... close button goes here ...]
  </div>
</div>
```

Here are additional CSS classes to style your search bar:

- `blockly-ws-search`: Applies to the outer-most div.
  - Default styling:
    ```css
    '.blockly-ws-search {',
      'background: white;',
      'border: solid lightgrey 0.5px;',
      'box-shadow: 0px 10px 20px grey;',
      'justify-content: center;',
      'padding: 0.25em;',
      'position: absolute;',
      'z-index: 70;',
    '}'
    ```
- `blockly-ws-search-container`: Applies to the search container.
- `blockly-ws-search-content`: Applies to the search content.
- `blockly-ws-search-input`: Applies to the input wrapper. (Default: `border: none;`)
- `blockly-ws-search-actions`: Applies to the action div.
- `blockly-ws-search-current`: Highlights the provided block as the "current selection". (Default: `fill: grey;`)
- `blockly-ws-search-highlight`: Adds highlight to the provided blocks. (Default: `fill: black;`)

## License

Apache 2.0
