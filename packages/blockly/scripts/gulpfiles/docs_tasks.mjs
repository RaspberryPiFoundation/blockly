import {execSync} from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as gulp from 'gulp';
import replace from 'gulp-replace';
import rename from 'gulp-rename';

const DOCS_DIR = '../docs/docs/reference';
const REFERENCE_SIDEBAR_DIR = DOCS_DIR;

/**
 * Run API Extractor to generate the intermediate json file.
 */
const generateApiJson = function(done) {
  execSync('api-extractor run --local', {stdio: 'inherit'});
  done();
}

/**
 * API Extractor output spuriously renames some functions. Undo that.
 * See https://github.com/microsoft/rushstack/issues/2534
 */
const removeRenames = function() {
  return gulp.src('temp/blockly.api.json')
      .pipe(replace('_2', ''))
      .pipe(gulp.dest('temp/'));
}

/**
 * Run API Documenter to generate the raw docs files.
 */
const generateDocs = function(done) {
  if (!fs.existsSync(DOCS_DIR)) {
    fs.mkdirSync(DOCS_DIR, {recursive: true});
  }
  execSync(
      `api-documenter markdown --input-folder temp --output-folder ${DOCS_DIR}`,
      {stdio: 'inherit'});
  done();
}

/**
 * Extracts the title from the H2 heading in the content.
 * Falls back to filename-based title if H2 not found.
 */
const extractTitleFromContent = function(content, filename) {
  // Remove frontmatter if exists
  let cleanContent = content.replace(/^---[\s\S]*?---\n\n/, '');
  
  // Remove MDX comments
  cleanContent = cleanContent.replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
  
  // Find the first ## heading
  const headingMatch = cleanContent.match(/##\s+(.+)/);
  if (headingMatch) {
    // Get the full H2 heading text
    let fullTitle = headingMatch[1].trim();
    // Remove markdown links
    fullTitle = fullTitle.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    // Remove inline code backticks
    fullTitle = fullTitle.replace(/`([^`]+)`/g, '$1');
    
    // Simplify title: "BlocklyOptions.comments property" -> "Comments property"
    // Extract the last part after the last dot
    const parts = fullTitle.split('.');
    if (parts.length > 1) {
      // Get everything after the last dot
      return parts[parts.length - 1];
    }
    
    return fullTitle;
  }
  
  // Fallback to filename-based title
  return extractTitle(filename);
};

/**
 * Extracts a clean title from the filename.
 * Example: "blockly.block_class" -> "Block class"
 * Example: "blockly.block_class.addicon_1_method" -> "Addicon method"
 */
const extractTitle = function(filename) {
  const nameWithoutExt = filename.replace('.mdx', '').replace('.md', '');
  const parts = nameWithoutExt.split('.');
  
  if (parts.length === 2) {
    // Top-level page: blockly.block_class -> "Block class"
    let name = parts[1];
    // Remove suffixes like _class, _namespace, etc.
    const suffix = name.match(/_(class|namespace|interface|enum|type|variable)$/);
    name = name.replace(/_(class|namespace|interface|enum|type|variable)$/, '');
    
    // Split by underscores and capitalize each word
    const words = name.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    );
    
    // Add back the suffix with proper spacing
    if (suffix) {
      words.push(suffix[1]);
    }
    
    return words.join(' ');
  } else if (parts.length > 2) {
    // Sub-page: blockly.block_class.addicon_1_method -> "Addicon method"
    let name = parts[parts.length - 1];
    // Remove number suffixes and type suffixes
    name = name.replace(/_\d+_(method|property|constructor|function|variable)$/, ' $1');
    name = name.replace(/^_constructor__\d+_constructor$/, 'Constructor');
    // Replace double underscores with space, but keep single underscores
    name = name.replace(/__/g, ' ');
    name = name.trim();
    // Capitalize first letter only
    return name.charAt(0).toUpperCase() + name.slice(1);
  }
  
  // Fallback: capitalize first letter
  return nameWithoutExt.charAt(0).toUpperCase() + nameWithoutExt.slice(1);
};

/**
 * Extracts description from the content.
 * Gets the first paragraph after the heading, up to the first code block or newline.
 * If no paragraph is found, generates a generic fallback description.
 */
const extractDescription = function(content, filename) {
  // Remove frontmatter if exists
  content = content.replace(/^---[\s\S]*?---\n\n/, '');
  
  // Remove MDX comments
  content = content.replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
  
  // Find the first ## heading (usually the main title)
  const headingMatch = content.match(/##\s+(.+)/);
  if (!headingMatch) {
    const title = extractTitle(filename);
    return `Blockly - usage reference for the ${title}`;
  }
  
  // Get the full H2 heading for fallback description
  let fullTitle = headingMatch[1].trim();
  fullTitle = fullTitle.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  fullTitle = fullTitle.replace(/`([^`]+)`/g, '$1');
    
  // Get content after the heading
  const afterHeading = content.substring(content.indexOf(headingMatch[0]) + headingMatch[0].length);
  
  // Look for the first non-empty text after the heading
  // It might have 1 or 2 newlines before the description paragraph
  const paragraphMatch = afterHeading.match(/\n+([^\n]+(?:\n(?!\n|\*\*|```|##|<table>)[^\n]+)*)/);
  
  if (paragraphMatch) {
    // Clean up the description
    let description = paragraphMatch[1].trim();
    
    // Remove markdown links but keep the text
    description = description.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    
    // Remove inline code backticks
    description = description.replace(/`([^`]+)`/g, '$1');
    
    // Remove extra whitespace and newlines
    description = description.replace(/\s+/g, ' ');
    
    // Skip if it's empty after cleaning
    if (!description) {
      return `Blockly - usage reference for the ${fullTitle}`;
    }
    
    // Limit to first sentence or 160 characters
    const firstSentence = description.match(/^[^.!?]+[.!?]/);
    if (firstSentence) {
      description = firstSentence[0];
    }
    
    if (description.length > 160) {
      description = description.substring(0, 157) + '...';
    }
    
    return description;
  }
  
  // Fallback: Generate generic description using full H2 heading title
  return `Blockly - usage reference for the ${fullTitle}`;
};

/**
 * Prepends frontmatter to MDX files with title, description, and sidebar config.
 */
const prependFrontmatter = function(done) {
  const files = fs.readdirSync(DOCS_DIR);
  
  for (const file of files) {
    if (!file.endsWith('.mdx')) continue;
    
    const filePath = path.join(DOCS_DIR, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Remove existing frontmatter if present
    if (content.startsWith('---\n')) {
      const endOfFrontmatter = content.indexOf('---\n', 4);
      if (endOfFrontmatter !== -1) {
        content = content.substring(endOfFrontmatter + 4).trim() + '\n\n';
      }
    }
    
    const title = extractTitleFromContent(content, file);
    const description = extractDescription(content, file);
    
    let frontmatter = '---\n';
    frontmatter += 'displayed_sidebar: referenceSidebar\n';
    frontmatter += 'hide_title: true\n';
    frontmatter += `title: "${title}"\n`;
    frontmatter += `description: ${JSON.stringify(description)}\n`;
    frontmatter += '---\n\n';
    
    // Write the file with frontmatter
    fs.writeFileSync(filePath, frontmatter + content);
  }
  
  done();
};

/**
 * Converts .md files to .mdx for Docusaurus.
 */
/**
 * Post-process MDX files to fix problematic patterns
 */
const fixMdxIssues = function(done) {
  const files = fs.readdirSync(DOCS_DIR).filter(f => f.endsWith('.mdx'));
  
  for (const file of files) {
    const filePath = path.join(DOCS_DIR, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    const lines = content.split('\n');
    let inCodeBlock = false;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        continue;
      }
      if (inCodeBlock) continue;
      
      // Remove all MDX comments (artifacts from HTML comment conversion)
      lines[i] = lines[i].replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
      
      // Remove unnecessary markdown escapes for underscores and brackets
      lines[i] = lines[i].replace(/\\_/g, '_');
      lines[i] = lines[i].replace(/\\\[/g, '[');
      lines[i] = lines[i].replace(/\\\]/g, ']');
      
      // Escape HTML tags (with or without attributes) outside of table markup
      const isTableMarkup = /^<\/?(table|thead|tbody|tr|th|td)[\s>]/.test(lines[i].trim());
      if (!isTableMarkup) {
        lines[i] = lines[i].replace(/<([a-z]+)(\s[^>]*)?>/g, '`$&`');
        lines[i] = lines[i].replace(/<\/([a-z]+)>/g, '`$&`');
      }
      
      // Escape curly braces so MDX doesn't parse them as JSX expressions.
      // First undo any backslash-escaping from api-documenter, then re-escape.
      lines[i] = lines[i].replace(/\\\{/g, '{').replace(/\\\}/g, '}');
      lines[i] = lines[i].replace(/\{/g, '\\{').replace(/\}/g, '\\}');
    }
    
    content = lines.join('\n');
    fs.writeFileSync(filePath, content, 'utf8');
  }
  
  done();
};

const convertToMdx = function() {
  return gulp.src(`${DOCS_DIR}/*.md`)
      // Convert HTML comments to MDX comments
      .pipe(replace(/<!--\s*([\s\S]*?)\s*-->/g, '{/* $1 */}'))
      // Fix malformed markdown links: [text][/path](https://developers.google.com/path) -> [text](/path)
      .pipe(replace(/\[([^\]]+)\]\[([^\]]+)\]\(https:\/\/developers\.google\.com([^)]+)\)/g, '[$1]($2)'))
      // Fix all internal links: remove .md extension and convert ./filename to /reference/filename
      .pipe(replace(/\]\(\.\/([^)]+)\.md\)/g, '](/reference/$1)'))
      // Replace developers.google.com links with relative paths
      .pipe(replace(/https:\/\/developers\.google\.com(\/blockly\/[^)\s"']+)/g, '$1'))
      // Replace developers.devsite.google.com links with relative paths
      .pipe(replace(/https:\/\/developers\.devsite\.google\.com(\/blockly\/[^)\s"']+)/g, '$1'))

      // Fix underscore to hyphen in URL fragments
      .pipe(replace(/(\/blockly\/[^)\s"'#]*#[^)\s"']*)_([^)\s"']*)/g, function(match) {
        return match.replace(/_/g, '-');
      }))
      // Remove %5C (URL-encoded backslash) and literal backslash before anchor tags
      .pipe(replace(/(%5C|\\)(#[^)\s"']*)/g, '$2'))
      // Fix breadcrumb "Home" link to point to the overview page
      .pipe(replace(/\[Home\]\(\/reference\/index\)/g, '[Home](/reference/blockly)'))
      // Convert <code>text</code> to markdown backtick code
      .pipe(replace(/<code>([^<]*)<\/code>/g, '`$1`'))
      // Convert paragraph breaks to spaces (for table cells) and remove remaining p tags
      .pipe(replace(/<\/p><p>/g, ' '))
      .pipe(replace(/<\/?p>/g, ''))
      .pipe(rename({ extname: '.mdx' }))
      .pipe(gulp.dest(DOCS_DIR));
}

/**
 * Delete original .md files after conversion to .mdx
 */
const cleanMdFiles = function(done) {
  const files = fs.readdirSync(DOCS_DIR);
  for (const file of files) {
    if (file.endsWith('.md')) {
      fs.unlinkSync(path.join(DOCS_DIR, file));
    }
  }
  done();
}

/**
 * Creates a map of top-level pages to sub-pages, e.g. a mapping
 * of `block_class` to every page associated with that class.
 * This is needed to create an accurate table of contents.
 * @param {string[]} allFiles All files in docs directory.
 * @returns {Map<string, string[]>}
 */
const buildAlternatePathsMap = function(allFiles) {
  let map = new Map();
  for (let file of allFiles) {
    if (!file.endsWith('.mdx') || file === 'blockly.mdx' || file === '_reference.js') continue;
    
    // Remove extension
    const nameWithoutExt = file.replace('.mdx', '');
    
    // Get the name of the class/namespace/etc., i.e. the top-level page
    // Example: blockly.block_class._constructor__1.mdx -> block_class
    // Example: blockly.block_class.mdx -> block_class
    const parts = nameWithoutExt.split('.');
    
    if (parts.length === 2) {
      // This is a top-level page (e.g., blockly.block_class)
      const topLevelName = parts[1];
      if (!map.has(topLevelName)) {
        map.set(topLevelName, []);
      }
    } else if (parts.length > 2) {
      // This is a sub-page (e.g., blockly.block_class._constructor__1_constructor)
      const topLevelName = parts[1];
      if (!map.has(topLevelName)) {
        map.set(topLevelName, []);
      }
      // Add the full name without extension
      map.get(topLevelName).push(nameWithoutExt);
    }
  }
  
  // Sort sub-pages: constructors first, then alphabetically
  for (const [key, value] of map.entries()) {
    value.sort((a, b) => {
      const aIsConstructor = a.includes('._constructor');
      const bIsConstructor = b.includes('._constructor');
      if (aIsConstructor && !bIsConstructor) return -1;
      if (!aIsConstructor && bIsConstructor) return 1;
      return a.localeCompare(b);
    });
  }
  
  return map;
}

/**
 * Parse HTML tables from the blockly.md file to extract classes, interfaces, etc.
 * @param {string} fileContent The content of blockly.md
 * @returns {Object} Object with sections as keys and arrays of {name, path} as values
 */
const parseHtmlTables = function(fileContent) {
  const result = {};
  
  // Split by ## headings
  const sections = fileContent.split('##');
  
  for (let section of sections) {
    const lines = section.split('\n');
    const sectionName = lines[0].trim();
    
    if (!sectionName || sectionName === 'blockly package') continue;
    
    // Match links in markdown pipe tables: |  [Name](/reference/path) | ...
    const tableRowRegex = /\|\s*\[([^\]]+)\]\(\/reference\/([^\)]+)\)/g;
    const items = [];
    
    let match;
    while ((match = tableRowRegex.exec(section)) !== null) {
      const name = match[1];
      const href = match[2];
      items.push({ name, path: href });
    }
    
    if (items.length > 0) {
      result[sectionName] = items;
    }
  }
  
  return result;
}

/**
 * Create the _reference.js file for Docusaurus sidebar.
 * This file is generated from the contents of `blockly.mdx` which contains links
 * to the other top-level API pages (each class, namespace, etc.).
 */
const createReferenceSidebar = function(done) {
  const fileContent = fs.readFileSync(`${DOCS_DIR}/blockly.mdx`, 'utf8');
  const files = fs.readdirSync(DOCS_DIR);
  const map = buildAlternatePathsMap(files);
  
  // Parse HTML tables from the file
  const sections = parseHtmlTables(fileContent);
  
  let sidebarContent = 'export const referenceSidebar = [\n';
  
  // Add overview
  sidebarContent += '  {\n';
  sidebarContent += '    "type": "doc",\n';
  sidebarContent += '    "label": "Overview",\n';
  sidebarContent += '    "id": "reference/blockly"\n';
  sidebarContent += '  },\n';
  
  // Process each section (Classes, Interfaces, Functions, etc.)
  for (const [sectionName, items] of Object.entries(sections)) {
    sidebarContent += '  {\n';
    sidebarContent += '    "type": "category",\n';
    sidebarContent += `    "label": "${sectionName}",\n`;
    sidebarContent += '    "collapsible": true,\n';
    sidebarContent += '    "className": "hide-level-3",\n';

    sidebarContent += '    "items": [\n';
    
    // Add items for this section
    for (const item of items) {
      const itemName = item.name;
      const itemPath = item.path.replace('.md', '').replace('.mdx', '');
      const baseName = itemPath.replace('blockly.', '');
      
      // Check if this item has sub-pages
      const subPages = map.get(baseName);
      
      if (subPages && subPages.length > 0) {
        // Item with sub-pages - create a category
        sidebarContent += '      {\n';
        sidebarContent += '        "type": "category",\n';
        sidebarContent += `        "label": "${itemName}",\n`;
        sidebarContent += '        "link": {\n';
        sidebarContent += '          "type": "doc",\n';
        sidebarContent += `          "id": "reference/${itemPath}"\n`;
        sidebarContent += '        },\n';
        sidebarContent += '        "items": [\n';
        
        // Add sub-pages
        for (const subPage of subPages) {
          const subPageId = subPage.replace('blockly.', '');
          sidebarContent += '          {\n';
          sidebarContent += '            "type": "doc",\n';
          sidebarContent += `            "label": "${subPage}",\n`;
          sidebarContent += `            "id": "reference/${subPage}"\n`;
          sidebarContent += '          },\n';
        }
        
        sidebarContent += '        ],\n';
        
        if (sectionName === 'Classes' || sectionName === 'Abstract Classes') {
          sidebarContent += '        "className": "hide-from-sidebar"\n';
        }
        
        sidebarContent += '      },\n';
      } else {
        // Simple item without sub-pages
        sidebarContent += '      {\n';
        sidebarContent += '        "type": "doc",\n';
        sidebarContent += `        "label": "${itemName}",\n`;
        sidebarContent += `        "id": "reference/${itemPath}"\n`;
        sidebarContent += '      },\n';
      }
    }
    
    sidebarContent += '    ]\n';
    sidebarContent += '  },\n';
  }
  
  sidebarContent += '];\n';
  
  // Write the file to the reference directory
  if (!fs.existsSync(REFERENCE_SIDEBAR_DIR)) {
    fs.mkdirSync(REFERENCE_SIDEBAR_DIR, { recursive: true });
  }
  fs.writeFileSync(`${REFERENCE_SIDEBAR_DIR}/_reference.js`, sidebarContent);
  
  done();
}

export const docs = gulp.series(
    generateApiJson, removeRenames, generateDocs, convertToMdx, cleanMdFiles, fixMdxIssues, prependFrontmatter, createReferenceSidebar);
