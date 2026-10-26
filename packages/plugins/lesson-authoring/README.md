# @blockly/plugin-lesson-authoring [![Built on Blockly](https://tinyurl.com/built-on-blockly)](https://github.com/RaspberryPiFoundation/blockly)

Tools for authoring Blockly lessons

> **Prototype.** This package is private and its API and artifact format will change
> without notice. Lesson files written by earlier versions may not load.

## Installation

### Yarn

```
yarn add @blockly/plugin-lesson-authoring
```

### npm

```
npm install @blockly/plugin-lesson-authoring --save
```

## Usage

```js
import * as Blockly from 'blockly';
import {findMissingRequirements} from '@blockly/plugin-lesson-authoring';

const artifact = JSON.parse(lessonJson);
const missing = findMissingRequirements(artifact, {
  blockTypes: Object.keys(Blockly.Blocks),
});
if (missing.blockTypes.length) {
  throw new Error(`Missing blocks: ${missing.blockTypes.join(', ')}`);
}
```

## API

### `LessonArtifact`

A lesson as portable JSON, currently:

- `title`: the lesson title.
- `toolbox`: a standard JSON toolbox definition (`ToolboxInfo`).
- `initialWorkspaceState`: the starter workspace, as saved by
  `Blockly.serialization.workspaces.save`.

### `getRequirements(artifact)`

Returns the `LessonRequirements` an artifact depends on: currently `blockTypes`,
a sorted list of every block type used in the toolbox and initial workspace state.
Throws if the toolbox contains `blockxml` entries; only JSON block state is supported.

### `findMissingRequirements(artifact, supported)`

Returns the requirements of `artifact` that are not in `supported`. Hosts typically
pass `{blockTypes: Object.keys(Blockly.Blocks)}` (or a smaller subset of types).

## License

Apache 2.0
