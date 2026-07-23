# @blockly/create-package [![Built on Blockly](https://tinyurl.com/built-on-blockly)](https://github.com/google/blockly)

A tool for creating a Blockly plugin or application based on a pre-existing template.

## Creating a plugin

A plugin is a library designed to add functionality to Blockly. It is reusable
and can be added to an application that uses Blockly. For more information about
creating plugins in Blockly, see
[the developer documentation](https://developers.google.com/blockly/guides/contribute/samples/add_a_plugin).

This script can be used to create a new Blockly plugin based on a template.

### Usage

```
npx @blockly/create-package plugin my-plugin --type plugin
cd my-plugin
npm start
```

### Available templates

`--type field`: A field template.

`--type block`: A block template.

`--type theme`: A theme template.

`--type plugin`: A generic plugin template. (Default)

### Options

Run `npx @blockly/create-package plugin --help` to see the available options.

### Adding TypeScript

```
npx @blockly/create-package plugin my-plugin --type plugin --typescript
```

## Creating a new application

An application that uses Blockly is a standalone program, unlike a plugin. If
you're just getting started with Blockly, you can create a new application based
on our sample using this script. The app that will be generated contains basic
infrastructure for running, building, testing, etc. that you can use even if you
don't understand how to configure the related tool yet. When your needs outgrow
the functionality provided by it, you can replace the provided configuration or
tool with your own.

### Usage

```
npx @blockly/create-package app hello-world
cd hello-world
npm start
```

See the generated `README.md` file after creation for more information.

### Options

Run `npx @blockly/create-package app --help` to see the available options.

## License

Apache 2.0
