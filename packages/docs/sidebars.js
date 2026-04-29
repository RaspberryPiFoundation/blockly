// @ts-nocheck

let referenceSidebar = [];
try {
  referenceSidebar = require('./docs/reference/_reference.js').referenceSidebar;
} catch {
  console.warn(
    'Reference sidebar not found — run "npm run docs" in packages/blockly to generate it.',
  );
}

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
- render a sidebar for each doc of that group
- provide next/previous navigation

The sidebars can be generated from the filesystem, or explicitly defined here.

Create as many sidebars as you want.

@type {import('@docusaurus/plugin-content-docs').SidebarsConfig}
*/
const sidebars = {
  codelabsSidebar: [
    {
      type: 'doc',
      label: 'Codelabs',
      id: 'codelabs/index',
    },
    {
      type: 'category',
      label: 'Getting started with Blockly',
      items: [
        {
          type: 'doc',
          label: '1. Codelab-overview',
          id: 'codelabs/getting-started/codelab-overview',
        },
        {
          type: 'doc',
          label: '2. Setup',
          id: 'codelabs/getting-started/setup',
        },
        {
          type: 'doc',
          label: '3. Explore the app',
          id: 'codelabs/getting-started/explore-the-app',
        },
        {
          type: 'doc',
          label: '4. Add Blockly libraries',
          id: 'codelabs/getting-started/add-blockly-libraries',
        },
        {
          type: 'doc',
          label: '5. Create a Blockly workspace',
          id: 'codelabs/getting-started/create-a-blockly-workspace',
        },
        {
          type: 'doc',
          label: '6. Create a custom block',
          id: 'codelabs/getting-started/create-a-custom-block',
        },
        {
          type: 'doc',
          label: '7. Save/load workspace',
          id: 'codelabs/getting-started/save-load-workspace',
        },
        {
          type: 'doc',
          label: '8. Generate JavaScript code',
          id: 'codelabs/getting-started/generate-javaScript-code',
        },
        {
          type: 'doc',
          label: '9. Run generated code',
          id: 'codelabs/getting-started/run-generated-code',
        },
        {
          type: 'doc',
          label: '10. The End',
          id: 'codelabs/getting-started/the-end',
        },
      ],
    },
    {
      type: 'category',
      label: 'Customizing a Blockly toolbox',
      items: [
        {
          type: 'doc',
          label: '1. Codelab-overview',
          id: 'codelabs/custom-toolbox/codelab-overview',
        },
        {
          type: 'doc',
          label: '2. Setup',
          id: 'codelabs/custom-toolbox/setup',
        },
        {
          type: 'doc',
          label: '3. Change the look of a category',
          id: 'codelabs/custom-toolbox/change-the-look-of-a-category',
        },
        {
          type: 'doc',
          label: '4. Change the look of a selected category',
          id: 'codelabs/custom-toolbox/change-the-look-of-a-selected-category',
        },
        {
          type: 'doc',
          label: '5. Add an icon to your category',
          id: 'codelabs/custom-toolbox/add-an-icon-to-your-category',
        },
        {
          type: 'doc',
          label: '6. Change the category HTML',
          id: 'codelabs/custom-toolbox/change-the-category-HTML',
        },
        {
          type: 'doc',
          label: '7. Adding a custom toolbox item',
          id: 'codelabs/custom-toolbox/adding-a-custom-toolbox-item',
        },
        {
          type: 'doc',
          label: '8. Summary',
          id: 'codelabs/custom-toolbox/summary',
        },
      ],
    },
    {
      type: 'category',
      label: 'Customizing your themes',
      items: [
        {
          type: 'doc',
          label: '1. Codelab-overview',
          id: 'codelabs/theme-extension-identifier/codelab-overview',
        },
        {
          type: 'doc',
          label: '2. Setup',
          id: 'codelabs/theme-extension-identifier/setup',
        },
        {
          type: 'doc',
          label: '3. Workspace Theme',
          id: 'codelabs/theme-extension-identifier/workspace-theme',
        },
        {
          type: 'doc',
          label: '4. Customize Components',
          id: 'codelabs/theme-extension-identifier/customize-components',
        },
        {
          type: 'doc',
          label: '5. Customize Category Styles',
          id: 'codelabs/theme-extension-identifier/customize-category-styles',
        },
        {
          type: 'doc',
          label: '6. Customize Block Styles',
          id: 'codelabs/theme-extension-identifier/customize-block-styles',
        },
        {
          type: 'doc',
          label: '7. Summary',
          id: 'codelabs/theme-extension-identifier/summary',
        },
      ],
    },
    {
      type: 'category',
      label: 'Customizing context menus',
      items: [
        {
          type: 'doc',
          label: '1. Codelab-overview',
          id: 'codelabs/context-menu-option/codelab-overview',
        },
        {
          type: 'doc',
          label: '2. Setup',
          id: 'codelabs/context-menu-option/setup',
        },
        {
          type: 'doc',
          label: '3. Add a context menu item',
          id: 'codelabs/context-menu-option/add-a-context-menu-item',
        },
        {
          type: 'doc',
          label: '4. Precondition: Node type',
          id: 'codelabs/context-menu-option/precondition-node-type',
        },
        {
          type: 'doc',
          label: '5. Precondition: External state',
          id: 'codelabs/context-menu-option/precondition-external-state',
        },
        {
          type: 'doc',
          label: '6. Precondition: Blockly state',
          id: 'codelabs/context-menu-option/precondition-blockly-state',
        },
        {
          type: 'doc',
          label: '7. Callback',
          id: 'codelabs/context-menu-option/callback',
        },
        {
          type: 'doc',
          label: '8. Display text',
          id: 'codelabs/context-menu-option/display-text',
        },
        {
          type: 'doc',
          label: '9. Weight and id',
          id: 'codelabs/context-menu-option/weight-and-id',
        },
        {
          type: 'doc',
          label: '10. Separators',
          id: 'codelabs/context-menu-option/separators',
        },
        {
          type: 'doc',
          label: '11. Summary',
          id: 'codelabs/context-menu-option/summary',
        },
      ],
    },
    {
      type: 'category',
      label: 'Block validation and warnings',
      items: [
        {
          type: 'doc',
          label: '1. Codelab-overview',
          id: 'codelabs/validation-and-warnings/codelab-overview',
        },
        {
          type: 'doc',
          label: '2. Setup',
          id: 'codelabs/validation-and-warnings/setup',
        },
        {
          type: 'doc',
          label: '3. Validating blocks',
          id: 'codelabs/validation-and-warnings/validating-blocks',
        },
        {
          type: 'doc',
          label: '4. Displaying warnings',
          id: 'codelabs/validation-and-warnings/displaying-warnings',
        },
        {
          type: 'doc',
          label: '5. Summary',
          id: 'codelabs/validation-and-warnings/summary',
        },
      ],
    },
    {
      type: 'category',
      label: 'Use CSS in Blockly',
      items: [
        {
          type: 'doc',
          label: '1. Codelab-overview',
          id: 'codelabs/css/codelab-overview',
        },
        {
          type: 'doc',
          label: '2. Setup',
          id: 'codelabs/css/setup',
        },
        {
          type: 'doc',
          label: "3. A tour of Blockly's elements",
          id: 'codelabs/css/tour',
        },
        {
          type: 'doc',
          label: '4. Components',
          id: 'codelabs/css/components',
        },
        {
          type: 'doc',
          label: '5. Toolbox categories',
          id: 'codelabs/css/categories',
        },
        {
          type: 'doc',
          label: '6. Blocks',
          id: 'codelabs/css/blocks',
        },
        {
          type: 'doc',
          label: '7. Summary',
          id: 'codelabs/css/summary',
        },
      ],
    },
    {
      type: 'category',
      label: 'Build a custom generator',
      items: [
        {
          type: 'doc',
          label: '1. Codelab-overview',
          id: 'codelabs/custom-generator/codelab-overview',
        },
        {
          type: 'doc',
          label: '2. Setup',
          id: 'codelabs/custom-generator/setup',
        },
        {
          type: 'doc',
          label: '3. The basics',
          id: 'codelabs/custom-generator/the-basics',
        },
        {
          type: 'doc',
          label: '4. Block generator overview',
          id: 'codelabs/custom-generator/block-generator-overview',
        },
        {
          type: 'doc',
          label: '5. Value block generators',
          id: 'codelabs/custom-generator/value-block-generators',
        },
        {
          type: 'doc',
          label: '6. Member block generator',
          id: 'codelabs/custom-generator/member-block-generator',
        },
        {
          type: 'doc',
          label: '7. Array block generator',
          id: 'codelabs/custom-generator/array-block-generator',
        },
        {
          type: 'doc',
          label: '8. Object block generator',
          id: 'codelabs/custom-generator/object-block-generator',
        },
        {
          type: 'doc',
          label: '9. Generating a stack',
          id: 'codelabs/custom-generator/generating-a-stack',
        },
        {
          type: 'doc',
          label: '10. Summary',
          id: 'codelabs/custom-generator/summary',
        },
      ],
    },
    {
      type: 'category',
      label: 'Build custom renderers',
      items: [
        {
          type: 'doc',
          label: '1. Codelab-overview',
          id: 'codelabs/custom-renderer/codelab-overview',
        },
        {
          type: 'doc',
          label: '2. Setup',
          id: 'codelabs/custom-renderer/setup',
        },
        {
          type: 'doc',
          label: '3. Observe the built-in renderers',
          id: 'codelabs/custom-renderer/observe-the-built-in-renderers',
        },
        {
          type: 'doc',
          label: '4. Define and register a custom renderer',
          id: 'codelabs/custom-renderer/define-and-register-a-custom-renderer',
        },
        {
          type: 'doc',
          label: '5. Override constants',
          id: 'codelabs/custom-renderer/override-constants',
        },
        {
          type: 'doc',
          label: '6. Understand connection shapes',
          id: 'codelabs/custom-renderer/understand-connection-shapes',
        },
        {
          type: 'doc',
          label: '7. Change connection shapes',
          id: 'codelabs/custom-renderer/change-connection-shapes',
        },
        {
          type: 'doc',
          label: '8. Typed connection shapes',
          id: 'codelabs/custom-renderer/typed-connection-shapes',
        },
        {
          type: 'doc',
          label: '9. Summary',
          id: 'codelabs/custom-renderer/summary',
        },
      ],
    },
  ],
  guidesSidebar: [
    {
      type: 'category',
      label: 'Get started',
      items: [
        {
          type: 'doc',
          label: 'What Is Blockly',
          id: 'guides/get-started/what-is-blockly',
        },
        {
          type: 'doc',
          label: 'Why Blockly',
          id: 'guides/get-started/why-blockly',
        },
        {
          type: 'doc',
          label: 'Get The Code',
          id: 'guides/get-started/get-the-code',
        },
        {
          type: 'doc',
          label: 'Visual glossary',
          id: 'guides/get-started/workspace-anatomy',
        },
        {
          type: 'category',
          label: 'Basic steps',
          items: [
            {
              type: 'doc',
              label: 'Create a workspace',
              id: 'guides/get-started/workspace-creation',
            },
            {
              type: 'doc',
              label: 'Add a toolbox',
              id: 'guides/get-started/toolbox',
            },
            {
              type: 'doc',
              label: 'Define custom blocks',
              id: 'guides/get-started/blocks',
            },
            {
              type: 'doc',
              label: 'Generate code',
              id: 'guides/get-started/code-generation',
            },
            {
              type: 'doc',
              label: 'Save and load',
              id: 'guides/get-started/save-and-load',
            },
          ],
        },
        {
          type: 'category',
          label: 'Try Blockly',
          items: [
            {
              type: 'link',
              label: 'Get started codelab',
              href: '/codelabs/getting-started/codelab-overview',
            },
            {
              type: 'link',
              label: 'Blockly Playground',
              href: 'https://blockly-demo.appspot.com/static/tests/playground.html',
            },
            {
              type: 'link',
              label: 'Block Factory',
              href: 'https://raspberrypifoundation.github.io/blockly-samples/examples/developer-tools/index.html',
            },
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'Design considerations',
      items: [
        {
          type: 'doc',
          label: 'Introduction to Blockly applications',
          id: 'guides/design/app-overview',
        },
        {
          type: 'doc',
          label: 'Application design',
          id: 'guides/design/applications',
        },
        {
          type: 'doc',
          label: 'Educational applications',
          id: 'guides/design/education',
        },
        {
          type: 'doc',
          label: 'Block design',
          id: 'guides/design/blocks',
        },
        {
          type: 'doc',
          label: 'Block- vs text-based languages',
          id: 'guides/design/languages',
        },
        {
          type: 'doc',
          label: 'Block appearance',
          id: 'guides/design/appearance',
        },
      ],
    },
    {
      type: 'category',
      label: 'Programming considerations',
      items: [
        {
          type: 'doc',
          label: 'API visibility',
          id: 'guides/programming/using_blockly_apis',
        },
        {
          type: 'doc',
          label: 'Plugins',
          id: 'guides/programming/plugin_overview',
        },
        {
          type: 'doc',
          label: 'Fork Blockly',
          id: 'guides/programming/forking_blockly',
        },
        {
          type: 'doc',
          label: 'Unfork Blockly',
          id: 'guides/programming/unforking_blockly',
        },
      ],
    },
    {
      type: 'category',
      label: 'Build your editor',
      items: [
        {
          type: 'category',
          label: 'Workspaces',
          items: [
            {
              type: 'category',
              label: 'Create a workspace',
              items: [
                {
                  type: 'doc',
                  label: 'Create a workspace',
                  id: 'guides/configure/web/configuration_struct',
                },
                {
                  type: 'doc',
                  label: 'Grid option',
                  id: 'guides/configure/web/grid',
                },
                {
                  type: 'doc',
                  label: 'Media folder option',
                  id: 'guides/configure/web/media',
                },
                {
                  type: 'doc',
                  label: 'Move option',
                  id: 'guides/configure/web/move',
                },
                {
                  type: 'doc',
                  label: 'Zoom option',
                  id: 'guides/configure/web/zoom',
                },
              ],
            },
            {
              type: 'category',
              label: 'Workspace size',
              items: [
                {
                  type: 'doc',
                  label: 'Fixed-size workspace',
                  id: 'guides/configure/web/fixed-size',
                },
                {
                  type: 'doc',
                  label: 'Resizable workspace',
                  id: 'guides/configure/web/resizable',
                },
                {
                  type: 'doc',
                  label: 'Metrics Manager',
                  id: 'guides/configure/web/metrics_manager',
                },
              ],
            },
          ],
        },
        {
          type: 'category',
          label: 'Toolboxes',
          items: [
            {
              type: 'doc',
              label: 'Overview',
              id: 'guides/configure/web/toolboxes/toolbox',
            },
            {
              type: 'category',
              label: 'Flyout toolboxes',
              items: [
                {
                  type: 'doc',
                  label: 'Define a flyout toolbox',
                  id: 'guides/configure/web/toolboxes/flyout',
                },
              ],
            },
            {
              type: 'category',
              label: 'Category toolboxes',
              items: [
                {
                  type: 'doc',
                  label: 'Define a category toolbox',
                  id: 'guides/configure/web/toolboxes/category',
                },
                {
                  type: 'doc',
                  label: 'Nested categories',
                  id: 'guides/configure/web/toolboxes/nested',
                },
                {
                  type: 'doc',
                  label: 'Dynamic categories',
                  id: 'guides/configure/web/toolboxes/dynamic',
                },
                {
                  type: 'doc',
                  label: 'Disable, hide, or expand categories',
                  id: 'guides/configure/web/toolboxes/disable-categories',
                },
                {
                  type: 'doc',
                  label: 'Category appearance',
                  id: 'guides/configure/web/toolboxes/appearance',
                },
                {
                  type: 'doc',
                  label: 'Programmatic access',
                  id: 'guides/configure/web/toolboxes/programmatic',
                },
              ],
            },
            {
              type: 'doc',
              label: 'Preset blocks',
              id: 'guides/configure/web/toolboxes/preset',
            },
            {
              type: 'doc',
              label: 'Separators',
              id: 'guides/configure/web/toolboxes/separators',
            },
            {
              type: 'doc',
              label: 'Buttons and labels',
              id: 'guides/configure/web/toolboxes/buttons',
            },
            {
              type: 'doc',
              label: 'Modify toolboxes',
              id: 'guides/configure/web/toolboxes/modify',
            },
          ],
        },
        {
          type: 'category',
          label: 'Appearance',
          items: [
            {
              type: 'doc',
              label: 'Themes',
              id: 'guides/configure/web/appearance/themes',
            },
            {
              type: 'doc',
              label: 'Colour formats',
              id: 'guides/configure/web/appearance/colour-formats',
            },
            {
              type: 'doc',
              label: 'Block colours',
              id: 'guides/configure/web/appearance/block-colour',
            },
            {
              type: 'doc',
              label: 'Style with CSS',
              id: 'guides/configure/web/appearance/css',
            },
          ],
        },
        {
          type: 'doc',
          label: 'Save and load',
          id: 'guides/configure/web/serialization',
        },
        {
          type: 'doc',
          label: 'Events',
          id: 'guides/configure/web/events',
        },
        {
          type: 'category',
          label: 'Shortcuts and context menus',
          items: [
            {
              type: 'doc',
              label: 'Keyboard shortcuts',
              id: 'guides/configure/web/keyboard-shortcuts',
            },
            {
              type: 'doc',
              label: 'Copy and paste',
              id: 'guides/configure/web/copy-paste',
            },
            {
              type: 'doc',
              label: 'Context menus',
              id: 'guides/configure/web/context-menus',
            },
          ],
        },
        {
          type: 'category',
          label: 'Drag and drop',
          items: [
            {
              type: 'doc',
              label: 'Custom draggables',
              id: 'guides/configure/web/dragging/draggable',
            },
            {
              type: 'doc',
              label: 'Custom block drag strategies',
              id: 'guides/configure/web/dragging/block-drag-strategies',
            },
            {
              type: 'doc',
              label: 'Custom draggers',
              id: 'guides/configure/web/dragging/dragger',
            },
          ],
        },
        {
          type: 'category',
          label: 'Comments',
          items: [
            {
              type: 'doc',
              label: 'Workspace comments',
              id: 'guides/configure/web/workspace_comment',
            },
            {
              type: 'doc',
              label: 'Block comments',
              id: 'guides/configure/web/block_comment',
            },
          ],
        },
        {
          type: 'doc',
          label: 'Localization',
          id: 'guides/configure/web/translations',
        },
        {
          type: 'doc',
          label: 'Focus system',
          id: 'guides/configure/web/focus',
        },
        {
          type: 'doc',
          label: 'Advanced customization',
          id: 'guides/configure/web/customization',
        },
        {
          type: 'category',
          label: 'Accessibility',
          items: [
            {
              type: 'doc',
              label: 'Keyboard navigation',
              id: 'guides/configure/web/keyboard-nav',
            },
            {
              type: 'doc',
              label: 'Colour and accessibility',
              id: 'guides/configure/web/colour-a11y',
            },
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'Build your blocks',
      items: [
        {
          type: 'doc',
          label: 'Overview',
          id: 'guides/create-custom-blocks/overview',
        },
        {
          type: 'category',
          label: 'Block definitions',
          items: [
            {
              type: 'doc',
              label: "What's a block definition?",
              id: 'guides/create-custom-blocks/define/block-definitions',
            },
            {
              type: 'category',
              label: 'Ways to define blocks',
              items: [
                {
                  type: 'doc',
                  label: 'Blockly Developer Tools',
                  id: 'guides/create-custom-blocks/blockly-developer-tools',
                },
                {
                  type: 'doc',
                  label: 'JSON and JavaScript',
                  id: 'guides/create-custom-blocks/define/json-and-js',
                },
                {
                  type: 'doc',
                  label: 'Extensions and mixins',
                  id: 'guides/create-custom-blocks/define/extensions',
                },
                {
                  type: 'doc',
                  label: 'Modify block definitions',
                  id: 'guides/create-custom-blocks/define/modify-definitions',
                },
              ],
            },
            {
              type: 'category',
              label: 'Block structure',
              items: [
                {
                  type: 'doc',
                  label: 'Anatomy of a block',
                  id: 'guides/create-custom-blocks/define/block-anatomy',
                },
                {
                  type: 'doc',
                  label: 'Top-level connections',
                  id: 'guides/create-custom-blocks/define/top-level-connections',
                },
                {
                  type: 'doc',
                  label: 'Block structure in JSON',
                  id: 'guides/create-custom-blocks/define/structure-json',
                },
                {
                  type: 'doc',
                  label: 'Block structure in JavaScript',
                  id: 'guides/create-custom-blocks/define/structure-js',
                },
                {
                  type: 'doc',
                  label: 'Inline vs external inputs',
                  id: 'guides/create-custom-blocks/define/inline-vs-external',
                },
              ],
            },
            {
              type: 'doc',
              label: 'Block state',
              id: 'guides/create-custom-blocks/define/block-state',
            },
            {
              type: 'doc',
              label: 'Destroy hook',
              id: 'guides/create-custom-blocks/define/destroy',
            },
            {
              type: 'doc',
              label: 'Block help',
              id: 'guides/create-custom-blocks/define/block-help',
            },
          ],
        },
        {
          type: 'category',
          label: 'Code generation',
          items: [
            {
              type: 'doc',
              label: 'Overview',
              id: 'guides/create-custom-blocks/code-generation/overview',
            },
            {
              type: 'doc',
              label: 'Block-code generators',
              id: 'guides/create-custom-blocks/code-generation/block-code',
            },
            {
              type: 'doc',
              label: 'Transform field values',
              id: 'guides/create-custom-blocks/code-generation/fields',
            },
            {
              type: 'doc',
              label: 'Add parentheses',
              id: 'guides/create-custom-blocks/code-generation/operator-precedence',
            },
            {
              type: 'doc',
              label: 'Cache inner value block code',
              id: 'guides/create-custom-blocks/code-generation/caching-arguments',
            },
          ],
        },
        {
          type: 'category',
          label: 'Connections',
          items: [
            {
              type: 'doc',
              label: 'Connection checks',
              id: 'guides/create-custom-blocks/inputs/connection-checks',
            },
            {
              type: 'doc',
              label: 'Connection check playbook',
              id: 'guides/create-custom-blocks/inputs/connection-check-playbook',
            },
            {
              type: 'doc',
              label: 'Custom connection checkers',
              id: 'guides/create-custom-blocks/inputs/connection_checker',
            },
            {
              type: 'doc',
              label: 'Connection previewers',
              id: 'guides/create-custom-blocks/inputs/connection-previews',
            },
          ],
        },
        {
          type: 'category',
          label: 'Inputs',
          items: [
            {
              type: 'doc',
              label: 'Create custom inputs',
              id: 'guides/create-custom-blocks/inputs/creating-custom-inputs',
            },
          ],
        },
        {
          type: 'category',
          label: 'Fields',
          items: [
            {
              type: 'doc',
              label: 'Overview',
              id: 'guides/create-custom-blocks/fields/overview',
            },
            {
              type: 'doc',
              label: 'Fields vs icons',
              id: 'guides/create-custom-blocks/fields/fields-vs-icons',
            },
            {
              type: 'doc',
              label: 'Anatomy of a field',
              id: 'guides/create-custom-blocks/fields/anatomy-of-a-field',
            },
            {
              type: 'doc',
              label: 'Validators',
              id: 'guides/create-custom-blocks/fields/validators',
            },
            {
              type: 'category',
              label: 'Built-in fields',
              items: [
                {
                  type: 'doc',
                  label: 'Overview',
                  id: 'guides/create-custom-blocks/fields/built-in-fields/overview',
                },
                {
                  type: 'doc',
                  label: 'Checkbox',
                  id: 'guides/create-custom-blocks/fields/built-in-fields/checkbox',
                },
                {
                  type: 'doc',
                  label: 'Dropdown',
                  id: 'guides/create-custom-blocks/fields/built-in-fields/dropdown',
                },
                {
                  type: 'doc',
                  label: 'Image',
                  id: 'guides/create-custom-blocks/fields/built-in-fields/image',
                },
                {
                  type: 'doc',
                  label: 'Label',
                  id: 'guides/create-custom-blocks/fields/built-in-fields/label',
                },
                {
                  type: 'doc',
                  label: 'Label (serializable)',
                  id: 'guides/create-custom-blocks/fields/built-in-fields/label-serializable',
                },
                {
                  type: 'doc',
                  label: 'Number',
                  id: 'guides/create-custom-blocks/fields/built-in-fields/number',
                },
                {
                  type: 'doc',
                  label: 'Text input',
                  id: 'guides/create-custom-blocks/fields/built-in-fields/text-input',
                },
                {
                  type: 'doc',
                  label: 'Variable',
                  id: 'guides/create-custom-blocks/fields/built-in-fields/variable',
                },
              ],
            },
            {
              type: 'category',
              label: 'Custom fields',
              items: [
                {
                  type: 'doc',
                  label: 'Overview',
                  id: 'guides/create-custom-blocks/fields/customizing-fields/overview',
                },
                {
                  type: 'doc',
                  label: 'Extend an existing field',
                  id: 'guides/create-custom-blocks/fields/customizing-fields/extending',
                },
                {
                  type: 'doc',
                  label: 'Create a custom field',
                  id: 'guides/create-custom-blocks/fields/customizing-fields/creating',
                },
                {
                  type: 'doc',
                  label: 'Upgrade a custom field',
                  id: 'guides/create-custom-blocks/fields/customizing-fields/upgrading',
                },
              ],
            },
          ],
        },
        {
          type: 'doc',
          label: 'Variables',
          id: 'guides/create-custom-blocks/variables',
        },
        {
          type: 'category',
          label: 'Procedures',
          items: [
            {
              type: 'doc',
              label: 'Overview',
              id: 'guides/create-custom-blocks/procedures/overview',
            },
            {
              type: 'doc',
              label: 'Use built-in procedure blocks',
              id: 'guides/create-custom-blocks/procedures/using-procedures',
            },
            {
              type: 'doc',
              label: 'Create custom procedure blocks',
              id: 'guides/create-custom-blocks/procedures/creating-custom-procedure-blocks',
            },
            {
              type: 'doc',
              label: 'Create custom procedure data models',
              id: 'guides/create-custom-blocks/procedures/creating-custom-procedure-data-models',
            },
          ],
        },
        {
          type: 'category',
          label: 'Icons',
          items: [
            {
              type: 'doc',
              label: 'Overview',
              id: 'guides/create-custom-blocks/icons/overview',
            },
            {
              type: 'doc',
              label: 'Fields vs icons',
              id: 'guides/create-custom-blocks/fields/fields-vs-icons',
            },
            {
              type: 'doc',
              label: 'Override comment icon',
              id: 'guides/create-custom-blocks/icons/creating-custom-icons/override-built-in',
            },
            {
              type: 'category',
              label: 'Create custom icons',
              items: [
                {
                  type: 'doc',
                  label: 'Overview',
                  id: 'guides/create-custom-blocks/icons/creating-custom-icons/basic-implementation',
                },
                {
                  type: 'doc',
                  label: 'Save and load icons',
                  id: 'guides/create-custom-blocks/icons/creating-custom-icons/save-and-load',
                },
                {
                  type: 'doc',
                  label: 'Use pop-up bubbles',
                  id: 'guides/create-custom-blocks/icons/creating-custom-icons/use-bubbles',
                },
                {
                  type: 'doc',
                  label: 'Create custom bubbles',
                  id: 'guides/create-custom-blocks/icons/creating-custom-icons/creating-custom-bubbles',
                },
                {
                  type: 'doc',
                  label: 'Use custom icons',
                  id: 'guides/create-custom-blocks/icons/creating-custom-icons/use-custom-icons',
                },
              ],
            },
          ],
        },
        {
          type: 'category',
          label: 'Block shape',
          items: [
            {
              type: 'doc',
              label: 'Mutators',
              id: 'guides/create-custom-blocks/mutators',
            },
            {
              type: 'category',
              label: 'Renderers',
              items: [
                {
                  type: 'doc',
                  label: 'Overview',
                  id: 'guides/create-custom-blocks/renderers/overview',
                },
                {
                  type: 'category',
                  label: 'Concepts',
                  items: [
                    {
                      type: 'doc',
                      label: 'Overview',
                      id: 'guides/create-custom-blocks/renderers/concepts/overview',
                    },
                    {
                      type: 'doc',
                      label: 'Renderer',
                      id: 'guides/create-custom-blocks/renderers/concepts/renderer',
                    },
                    {
                      type: 'doc',
                      label: 'Constant provider',
                      id: 'guides/create-custom-blocks/renderers/concepts/constants',
                    },
                    {
                      type: 'doc',
                      label: 'Render info',
                      id: 'guides/create-custom-blocks/renderers/concepts/info',
                    },
                    {
                      type: 'doc',
                      label: 'Path object',
                      id: 'guides/create-custom-blocks/renderers/concepts/path-object',
                    },
                    {
                      type: 'doc',
                      label: 'Drawer',
                      id: 'guides/create-custom-blocks/renderers/concepts/drawer',
                    },
                    {
                      type: 'doc',
                      label: 'Rows',
                      id: 'guides/create-custom-blocks/renderers/concepts/rows',
                    },
                    {
                      type: 'doc',
                      label: 'Elements',
                      id: 'guides/create-custom-blocks/renderers/concepts/elements',
                    },
                  ],
                },
                {
                  type: 'doc',
                  label: 'Create custom renderers',
                  id: 'guides/create-custom-blocks/renderers/create-custom-renderers/basic-implementation',
                },
                {
                  type: 'doc',
                  label: 'Connection shapes',
                  id: 'guides/create-custom-blocks/renderers/create-custom-renderers/connection-shapes',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'Build your application',
      items: [
        {
          type: 'category',
          label: 'Generate and run code',
          items: [
            {
              type: 'doc',
              label: 'Generate and run code',
              id: 'guides/app-integration/run-code',
            },
            {
              type: 'doc',
              label: 'Generate and run JavaScript',
              id: 'guides/app-integration/running-javascript',
            },
          ],
        },
        {
          type: 'doc',
          label: 'Attribute Blockly',
          id: 'guides/app-integration/attribution',
        },
      ],
    },
    {
      type: 'category',
      label: 'Contribute to Blockly',
      items: [
        {
          type: 'doc',
          label: 'Overview',
          id: 'guides/contribute/index',
        },
        {
          type: 'category',
          label: 'Get started',
          items: [
            {
              type: 'doc',
              label: 'Overview',
              id: 'guides/contribute/get-started/index',
            },
            {
              type: 'doc',
              label: 'Development tools',
              id: 'guides/contribute/get-started/development_tools',
            },
            {
              type: 'doc',
              label: 'Write a good issue',
              id: 'guides/contribute/get-started/write_a_good_issue',
            },
            {
              type: 'doc',
              label: 'Write a good pull request',
              id: 'guides/contribute/get-started/write_a_good_pr',
            },
            {
              type: 'doc',
              label: 'Commit message guide',
              id: 'guides/contribute/get-started/commits',
            },
            {
              type: 'doc',
              label: 'Code review process',
              id: 'guides/contribute/get-started/pr_review_process',
            },
            {
              type: 'doc',
              label: 'Issue labels',
              id: 'guides/contribute/get-started/issue_labels',
            },
            {
              type: 'doc',
              label: 'Use the playground',
              id: 'guides/contribute/get-started/playground',
            },
          ],
        },
        {
          type: 'category',
          label: 'Contribute to core',
          items: [
            {
              type: 'doc',
              label: 'Overview',
              id: 'guides/contribute/core/index',
            },
            {
              type: 'category',
              label: 'Core architecture',
              items: [
                {
                  type: 'doc',
                  label: 'Render management',
                  id: 'guides/contribute/core-architecture/render-management',
                },
              ],
            },
            {
              type: 'doc',
              label: 'Style guide',
              id: 'guides/contribute/core/style_guide',
            },
            {
              type: 'doc',
              label: 'Build scripts',
              id: 'guides/contribute/core/building',
            },
            {
              type: 'doc',
              label: 'Advanced compilation',
              id: 'guides/contribute/core/advanced',
            },
            {
              type: 'category',
              label: 'Localization',
              items: [
                {
                  type: 'doc',
                  label: 'Add a new localization token',
                  id: 'guides/contribute/core/add_localization_token',
                },
                {
                  type: 'doc',
                  label: 'Translate text',
                  id: 'guides/contribute/core/translating',
                },
                {
                  type: 'doc',
                  label: 'Klingon',
                  id: 'guides/contribute/core/klingon',
                },
              ],
            },
            {
              type: 'doc',
              label: 'Unit tests',
              id: 'guides/contribute/core/unit_testing',
            },
            {
              type: 'doc',
              label: 'Write a codelab',
              id: 'guides/contribute/core/write_a_codelab',
            },
          ],
        },
        {
          type: 'category',
          label: 'Contribute to samples',
          items: [
            {
              type: 'doc',
              label: 'Overview',
              id: 'guides/contribute/samples/index',
            },
            {
              type: 'doc',
              label: 'Repository structure',
              id: 'guides/contribute/samples/repository_structure',
            },
            {
              type: 'category',
              label: 'Plugins',
              items: [
                {
                  type: 'doc',
                  label: 'Add a plugin',
                  id: 'guides/contribute/samples/add_a_plugin',
                },
                {
                  type: 'doc',
                  label: 'Plugin naming conventions',
                  id: 'guides/contribute/samples/naming',
                },
                {
                  type: 'doc',
                  label: 'Debug plugins',
                  id: 'guides/contribute/samples/debugging',
                },
                {
                  type: 'doc',
                  label: 'Publish block libraries',
                  id: 'guides/contribute/samples/block_libraries',
                },
                {
                  type: 'doc',
                  label: 'Add a plugin field to Block Factory',
                  id: 'guides/contribute/samples/block_factory',
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  referenceSidebar: referenceSidebar,
};

export default sidebars;
