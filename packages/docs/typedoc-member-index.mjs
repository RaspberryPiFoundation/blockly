// Adds Properties and Methods index tables to each generated reference page.
//
// This needs a custom theme because the plugin will only insert an index if we
// make every child have its own document, and we'd rather keep them all on the
// same page but still have an index.

import { MarkdownTheme, MarkdownThemeContext } from 'typedoc-plugin-markdown';

/** Sections that get an index table, in the order the tables appear. */
const INDEXED_SECTIONS = ['Properties', 'Methods'];

class MemberIndexContext extends MarkdownThemeContext {
  constructor(theme, page, options) {
    super(theme, page, options);
    const base = { ...this.partials };

    this.partials = {
      ...base,
      body: (model, opts) => {
        // Override the default body partial to add index tables
        const blocks = this.indexTables(model.groups ?? [], opts.headingLevel);
        blocks.push(base.body(model, opts));
        return blocks.join('\n\n');
      },
    };
  }

  /**
   * A heading and a table for each of INDEXED_SECTIONS, as separate markdown
   * blocks. Empty when there is nothing to index.
   */
  indexTables(allGroups, headingLevel) {
    const blocks = [];

    for (const title of INDEXED_SECTIONS) {
      const group = allGroups.find((g) => g.title === title);

      if (!group) continue;
      if (this.isOwnPages(group)) continue;

      // "Properties index" not "Properties", so the slug doesn't collide
      blocks.push(`${'#'.repeat(headingLevel)} ${title} index`);
      blocks.push(this.partials.groupIndex(group));
    }

    return blocks;
  }

  isOwnPages(group) {
    return group.children.every((child) => this.router.hasOwnDocument(child));
  }
}

class MemberIndexTheme extends MarkdownTheme {
  getRenderContext(page) {
    return new MemberIndexContext(this, page, this.application.options);
  }
}

export function load(app) {
  app.renderer.defineTheme('member-index', MemberIndexTheme);
}
