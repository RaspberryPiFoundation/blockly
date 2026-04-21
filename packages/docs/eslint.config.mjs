import * as mdx from 'eslint-plugin-mdx';

export default [
  {
    ...mdx.flat,
    files: ['**/*.mdx'],
    rules: {
      ...mdx.flat.rules,
      'mdx/remark': 'off',
    },
  },
  {
    ...mdx.flat,
    files: ['**/*.md'],
    ...mdx.flatCodeBlocks,
    rules: {
      ...mdx.flat.rules,
      ...mdx.flatCodeBlocks.rules,
      'mdx/remark': 'off',
    },
  },
  {
    ignores: [
      'docs/reference/**',
      'build/**',
      '.docusaurus/**',
      'node_modules/**',
    ],
  },
];
