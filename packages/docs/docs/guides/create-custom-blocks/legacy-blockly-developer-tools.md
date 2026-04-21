---
description: How to use Blockly's tools for defining blocks, toolboxes, and workspaces.
title: Legacy Blockly Developer Tools
image: images/blockly_banner.png
---

# Legacy Blockly Developer Tools

:::warning
The tools in this document have been deprecated, but this
documentation is preserved for your reference. The legacy tools are only
compatible with Blockly v10 and earlier. If you want to migrate your block
definitions to Blockly v11+, follow [these instructions][block-factory-import]
to load your block definitions into the new tool.
:::

[Legacy Blockly Developer Tools][legacy-tool] is a web-based developer tool that
automates parts of the Blockly configuration process, including creating custom
blocks, building your toolbox, and configuring your Blockly workspace.

The Blockly developer process using the tool consists of three parts:

- Create custom blocks using Block Factory and Block Exporter.
- Build a toolbox and default workspace using Workspace Factory.
- Configure your workspace using Workspace Factory (currently a web-only
  feature).

## Block Factory Tab

The Block Factory tab helps you create [block
definitions](/guides/create-custom-blocks/define/block-definitions) and
[block-code generators][block-code-generator] for custom blocks. On this tab you
can easily create, modify, and save custom blocks.

### Defining a block

This video walks through the steps of defining a block in detail. The UI is out
date, but the block features it highlights are still accurate.

<iframe width="950" height="534" src="https://www.youtube.com/embed/s2_xaEvcVI0" title="YouTube video player" frameborder="0"  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen>
</iframe>

### Managing the library

Blocks are referenced by their name, so each block you want to create must have
a unique name. The UI enforces this and makes it clear when you are 'saving'
a new block or 'updating' an existing block.

![The Block Factory tab with Save and Delete buttons that include the block
name.](/images/block_save_as.png) ![The Block Factory tab with Update
and Delete buttons that include the block
name.](/images/update_button.png)

You can switch between blocks you've previously saved or create a new empty
block by clicking the Library button. Changing the name of an existing block is
another way to quickly create multiple blocks with similar definitions.

![Block Library dropdown with four entries: "Create New Block" and the names of
three previously created blocks.](/images/blocklib_button.png)

### Exporting and importing a library

Blocks are saved to the browser's local storage. Clearing the browser's local
storage will delete your blocks. To save your blocks indefinitely, you must
download your library. Your Block Library is downloaded as an XML
file that can be imported to set your Block Library to the state it was when
you downloaded the file. Note that importing a Block Library replaces your
current one, so you might want to export first.

The import and export features are also the recommended way to maintain and
share different sets of custom blocks.

![The Clear Library, Import Block Library, and Download Block Library
buttons.](/images/block_manage_buttons.png)

## Block Exporter tab

Once you have designed your blocks you will need to export the block definitions
and generator stubs to use them in an app. This is done on the
Block Exporter tab.

Every block stored in your Block Library will be shown in the Block Selector.
Click on the block to to select or deselect it for export. If you want to select
all the blocks in your library, use the "Select" → "All Stored In Block
Library" option. If you built your toolbox or configured your workspace using
the Workspace Factory tab, you can also select all the blocks you used by
clicking "Select" → "All Used In Workspace Factory".

![The Block Selector area of the Block Exporter tab. This has a Select button to
select all blocks in the block library or select all blocks used in the
Workspace Factory, a Clear Selected button, and a list of blocks that can be
selected individually.](/images/block_exporter_select.png)

The export settings let you choose which generated language you want to target
and whether you want the definitions, the generator stubs, or both for the
selected blocks. Once you've selected these, click 'Export' to download your
files.

![The entire Block Exporter tab. This has a Block Selector area, an Export
Settings area, and an Export Preview
area.](/images/block_exporter_tab.png)

:::note
If using a save dialog on Mac you can only download
[one file at a time](https://github.com/RaspberryPiFoundation/blockly/issues/647)
:::

## Workspace Factory tab

The Workspace Factory makes it easy to configure a toolbox and the default
set of blocks in a workspace. You can switch between editing the toolbox and the
starting workspace with the "Toolbox" and "Workspace" buttons.

![The Toolbox and Workspace buttons.](/images/ws_fac_tb_ws_buttons.png)

### Building a toolbox

This tab helps build the XML for a Toolbox. The material assumes
familiarity with features of a [Toolbox](/guides/configure/web/toolboxes/toolbox).
If you already have XML for a toolbox that you want to edit here, you can
load it by clicking "Load to Edit".

### Toolbox without categories

If you have a few blocks and want to display them without any categories, simply
drag them into the workspace, and you will see your blocks appear in the toolbox
in the preview.

![The Workspace Factory tab with the Toolbox button chosen. There is a Blockly
editor on the left for choosing the blocks in the toolbox, a categories area in
the center for adding categories to the toolbox, and a preview area on the right
to show the toolbox you have constructed. Three blocks have been dragged onto
the workspace on the left. This constructs a flyout toolbox, which is shown on
the right.](/images/workspace_fac_no_cat.png)

### Toolbox with categories

If you want display blocks in categories, click the "+" button and select the
dropdown item for new category. This will add a category to your category list
that you can select and edit. Select "Standard Category" to add an individual
standard Blockly category (Logic, Loops, etc.), or "Standard Toolbox" to add all
standard Blockly categories. Use the arrow buttons to reorder categories.

![The categories area of the Workspace Factory tab. This shows the current list
of categories and buttons to add and delete categories and move them up and down
in the list. The + button has been selected to add a
category.](/images/category_menu.png)

:::note
The standard categories and toolbox include all the blocks in the
[Playground](https://blockly-demo.appspot.com/static/tests/playground.html).
This set of blocks is not appropriate for most apps and should be pruned as
needed. Also, some blocks are not supported on mobile yet.
:::

To change the selected category’s name or color use the "Edit Category"
dropdown. Dragging a block into the workspace will add it to the selected
category.

![The Edit Category dropdown, with fields to change a category's name and
color.](/images/edit_category.png)

### Advanced blocks

By default, you can add any of the standard blocks or any blocks in your library
to the toolbox. If you have blocks defined in JSON that aren't in your library,
you can import them using the "Import Custom Blocks" button.

Some blocks should be used together or include defaults. This is done with
[groups and shadows](/guides/configure/web/toolboxes/preset). Any
blocks that are connected in the editor will be added to the toolbox as a group.
Blocks that are attached to another block can also be changed to shadow blocks
by selecting the child block and clicking the "Make Shadow" button.
:::note
Only child blocks that don't contain a variable may be changed to shadow
blocks.
:::

If you include a variable or function block in their toolbox, include a
"Variables" or "Functions" category in your toolbox to allow users to fully
utilize the block. Learn more about ["Variables" or "Functions"
categories](/guides/configure/web/toolboxes/dynamic#built-in-dynamic-categories).

### Configuring a workspace

To configure different parts of your workspace, go to the "Workspace Factory"
tab and select "Workspace".

#### Choose Workspace Options

Set different values for [configuration
options](/guides/configure/web/configuration_struct#the-options-dictionary)
and see the result in the preview area. Enabling
[grid](/guides/configure/web/grid) or
[zoom](/guides/configure/web/zoom) reveals more options to configure.
Also, switching to using categories usually requires a more complex
workspace; a trashcan and scrollbars are added automatically when you add your
first category.

![The Workspace Factory tab with the Workspace button selected. The categories
area has been replaced with a list of workspace options to choose
from.](/images/configure_workspace.png)

#### Add Pre-loaded Blocks to the Workspace

This is optional but may be necessary if you want to display a set of blocks in
the workspace:

- When the application loads.
- When an event (advancing a level, clicking a help button, etc.) is triggered.

Drag blocks into the editing space to see them in your workspace in the preview.
You can create block groups, disable blocks, and make certain blocks shadow
blocks when you select them.

![The Workspace Factory tab with the Workspace button selected. Blocks have been
dragged onto the workspace of the Blockly editor on the left. These are shown as
pre-loaded blocks in the workspace of the Blockly editor on the
right.](/images/load_workspace_blocks.png)

You can export these blocks as XML (see below). Add them to your workspace with
`Blockly.Xml.domToWorkspace`, immediately after you create your workspace:

```js
var xmlText =
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
  '<block type="math_number"></block></xml>';
Blockly.Xml.domToWorkspace(Blockly.utils.xml.textToDom(xmlText), workspace);
```

This sample code adds a single `math_number` block to the workspace.

### Exporting

Workspace Factory gives you the following export options:

![The Export dropdown at the top of the Workspace Factory tab, with options to
export starter code, the toolbox, the pre-loaded workspace blocks, or all of
these.](/images/workspace_export_opt.png)

- Starter Code: Produces starter html and javascript to inject your customized
  Blockly workspace.
- Toolbox: Produces XML to specify your toolbox.
- Workspace Blocks: Produces XML which can be loaded into a workspace.

[block-code-generator]: /guides/create-custom-blocks/code-generation/overview#block-code-generators
[block-factory-import]: /guides/create-custom-blocks/blockly-developer-tools#import-from-legacy-block-factory
[legacy-tool]: https://blockly-demo.appspot.com/static/demos/blockfactory/index.html
