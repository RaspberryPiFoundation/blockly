// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).

import { themes as prismThemes } from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Blockly Docs',
  favicon: 'images/favicon.svg',

  future: {
    v4: true,
  },

  url: 'https://raspberrypifoundation.github.io',
  baseUrl: process.env.BASE_URL || '/docs/',

  // GitHub pages deployment config
  organizationName: 'RaspberryPiFoundation',
  projectName: 'blockly',

  onBrokenLinks: 'warn',
  //onBrokenMarkdownLinks: 'warn',

  markdown: {
    format: 'detect',
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  plugins: [
    [
      '@docusaurus/plugin-client-redirects',
      {
        fromExtensions: ['md', 'mdx'],
        createRedirects(existingPath) {
          if (existingPath.startsWith('/reference/')) {
            return [existingPath.replace('/reference/', '/reference/js/')];
          }
          return undefined;
        },
      },
    ],
  ],

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          routeBasePath: '/',
          sidebarPath: './sidebars.js',
          showLastUpdateTime: true,
          editUrl:
            'https://github.com/RaspberryPiFoundation/blockly/tree/main/packages/docs',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
        // Passed to @docusaurus/plugin-google-tag-manager
        googleTagManager: {
          containerId: 'GTM-NSSCB6XT',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: 'images/blockly_banner.png',
      navbar: {
        title: 'Blockly',
        logo: {
          alt: 'Blockly Logo',
          src: 'images/logo.svg',
          srcDark: 'images/blockly-dark-theme-logo.png',
        },
        items: [
          {
            type: 'dropdown',
            label: 'Guides',
            position: 'left',
            items: [
              {
                label: 'Get started',
                to: 'guides/get-started/what-is-blockly',
              },
              {
                label: 'Design considerations',
                to: 'guides/design/app-overview',
              },
              {
                label: 'Programming considerations',
                to: 'guides/programming/using_blockly_apis',
              },
              {
                label: 'Build your editor',
                to: 'guides/configure/web/configuration_struct',
              },
              {
                label: 'Build your blocks',
                to: 'guides/create-custom-blocks/overview',
              },
              {
                label: 'Build your application',
                to: 'guides/app-integration/run-code',
              },
              {
                label: 'Contribute to Blockly',
                to: 'guides/contribute/index',
              },
            ],
          },
          {
            type: 'docSidebar',
            label: 'Reference',
            sidebarId: 'referenceSidebar',
            position: 'left',
          },
          {
            type: 'docSidebar',
            label: 'Codelabs',
            sidebarId: 'codelabsSidebar',
            position: 'left',
          },
          {
            label: 'Samples',
            href: 'https://raspberrypifoundation.github.io/blockly-samples/',
            position: 'right',
          },
          {
            label: 'GitHub',
            href: 'https://github.com/raspberrypifoundation/blockly',
            position: 'right',
          },
        ],
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
        additionalLanguages: ['bash', 'typescript'],
      },
      algolia: {
        appId: 'JOPASJ603L',
        apiKey: '9a6e9f24a807a1571990048ef66c9438', // safe to expose
        indexName: 'Docusaurus_Website',
        contextualSearch: true,
        searchParameters: {},
        searchPagePath: 'search',
        askAi: {
          indexName: 'markdown-index',
          apiKey: '9a6e9f24a807a1571990048ef66c9438',
          appId: 'JOPASJ603L',
          assistantId: '0JvuvoDNFavC',
        },
      },
      docs: {
        sidebar: {
          hideable: true,
          autoCollapseCategories: true,
        },
      },
      footer: {
        copyright:
          'Blockly is an open source project of the Raspberry Pi Foundation, a UK registered charity (1129409), supported by Google.',
        links: [
          {
            title: 'Docs',
            items: [
              {
                label: 'Guides',
                to: '/guides/get-started/what-is-blockly',
              },
              {
                label: 'Reference',
                to: '/reference',
              },
            ],
          },
          {
            title: 'Learn',
            items: [
              {
                label: 'Codelabs',
                to: '/codelabs',
              },
              {
                label: 'Samples and Demos',
                to: 'https://raspberrypifoundation.github.io/blockly-samples/',
              },
            ],
          },
          {
            title: 'Community',
            items: [
              {
                label: 'Community Forum',
                to: 'https://groups.google.com/g/blockly',
              },
              {
                label: 'Blockly Summit',
                to: 'http://www.blocklysummit.com',
              },
              {
                label: 'YouTube',
                to: 'https://www.youtube.com/@blocklydev',
              },
              {
                label: 'Report Issue',
                to: 'https://github.com/RaspberryPiFoundation/blockly/issues',
              },
            ],
          },
          {
            title: 'About',
            items: [
              {
                label: 'Team',
                to: 'http://blockly.com/team',
              },
              {
                label: 'Contact',
                to: 'mailto:support@blockly.com',
              },
              {
                label: 'Privacy',
                to: 'https://www.raspberrypi.org/privacy/',
              },
              {
                label: 'Cookies',
                to: 'https://www.raspberrypi.org/cookies/',
              },
            ],
          },
        ],
      },
    }),
};

export default config;
