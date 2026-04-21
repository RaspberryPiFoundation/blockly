/**
 * Utility functions for pushing custom events to dataLayer for GA4 tracking via GTM
 */

/**
 * Push custom events to dataLayer for GA4 tracking
 * @param {string} eventName - The name of the event (e.g., 'site_search', 'cta_click', 'copy_code')
 * @param {object} eventParams - Additional parameters to send with the event
 */
export function pushToDataLayer(eventName, eventParams = {}) {
  if (typeof window === 'undefined') {
    return;
  }

  // Ensure dataLayer exists
  if (!window.dataLayer) {
    window.dataLayer = [];
  }

  const eventData = {
    event: eventName,
    ...eventParams,
  };

  window.dataLayer.push(eventData);
}

/**
 * Track site search with query
 * @param {string} searchQuery - The search query entered by the user
 */
export function trackSiteSearch(searchQuery) {
  if (
    !searchQuery ||
    typeof searchQuery !== 'string' ||
    searchQuery.trim() === ''
  ) {
    return;
  }

  const trimmedQuery = searchQuery.trim();

  pushToDataLayer('site_search', {
    search_query: trimmedQuery,
  });
}

/**
 * Track CTA button clicks
 * @param {string} clickUrl - The URL the CTA links to (cta_location)
 * @param {string} clickText - The text/label of the CTA button (cta_label)
 */
export function trackCTAClick(clickUrl, clickText) {
  if (!clickUrl || !clickText) {
    return;
  }

  pushToDataLayer('cta_click', {
    cta_location: clickUrl,
    cta_label: clickText,
  });
}

/**
 * Extract function/method/class/enum name from code
 * @param {string} code - The code content
 * @param {string} language - The programming language (optional, helps with extraction)
 * @returns {string} - The function/method/class/enum name or meaningful identifier
 */
function extractFunctionName(code, language = '') {
  if (!code || typeof code !== 'string') {
    return 'unknown';
  }

  const trimmedCode = code.trim();
  if (trimmedCode.length === 0) {
    return 'unknown';
  }

  // Common keywords and variable names to skip
  const skipNames = new Set([
    'code',
    'let',
    'const',
    'var',
    'import',
    'export',
    'function',
    'preamble',
    'postscript',
    'result',
    'value',
    'data',
    'item',
    'element',
    'obj',
    'arr',
    'str',
    'num',
    'bool',
    'temp',
    'if',
    'for',
    'while',
    'new',
    'return',
    'class',
    'enum',
    'def',
    'try',
    'catch',
    'then',
    'else',
    'async',
    'await',
    'from',
    'as',
  ]);

  // For JSON/XML: Extract meaningful keys or identifiers
  if (language === 'json' || language === 'xml') {
    const jsonKeyPattern = /"([a-zA-Z_$][a-zA-Z0-9_$]{2,})"\s*:/;
    const jsonMatch = trimmedCode.match(jsonKeyPattern);
    if (
      jsonMatch &&
      jsonMatch[1] &&
      !skipNames.has(jsonMatch[1].toLowerCase())
    ) {
      return jsonMatch[1];
    }

    // XML: Extract tag name or attribute
    const xmlTagPattern = /<([a-zA-Z_$][a-zA-Z0-9_$]{2,})/;
    const xmlMatch = trimmedCode.match(xmlTagPattern);
    if (xmlMatch && xmlMatch[1] && !skipNames.has(xmlMatch[1].toLowerCase())) {
      return xmlMatch[1];
    }

    // Fallback: Extract any meaningful identifier
    const identifierPattern = /\b([a-zA-Z_$][a-zA-Z0-9_$]{3,})\b/;
    const identifierMatch = trimmedCode.match(identifierPattern);
    if (
      identifierMatch &&
      identifierMatch[1] &&
      !skipNames.has(identifierMatch[1].toLowerCase())
    ) {
      return identifierMatch[1];
    }

    return 'unknown';
  }

  // Priority 1: Method calls with object (e.g., javascriptGenerator.workspaceToCode())
  const methodCallPattern =
    /([a-zA-Z_$][a-zA-Z0-9_$]*\.)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/;
  const methodMatch = trimmedCode.match(methodCallPattern);
  if (
    methodMatch &&
    methodMatch[2] &&
    !skipNames.has(methodMatch[2].toLowerCase())
  ) {
    return methodMatch[2];
  }

  // Priority 2: Function/Method/Class declarations
  const declPattern =
    /(?:function|const|let|var|class|enum|def)\s+([a-zA-Z_$][a-zA-Z0-9_$]{2,})/;
  const declMatch = trimmedCode.match(declPattern);
  if (declMatch && declMatch[1] && !skipNames.has(declMatch[1].toLowerCase())) {
    return declMatch[1];
  }

  // Priority 3: Function calls without object (e.g., myFunction())
  const functionCallPattern = /\b([a-zA-Z_$][a-zA-Z0-9_$]{3,})\s*\(/;
  const funcMatch = trimmedCode.match(functionCallPattern);
  if (funcMatch && funcMatch[1] && !skipNames.has(funcMatch[1].toLowerCase())) {
    return funcMatch[1];
  }

  // Last resort: First meaningful identifier
  const identifierPattern = /\b([a-zA-Z_$][a-zA-Z0-9_$]{3,})\b/;
  const identifierMatch = trimmedCode.match(identifierPattern);
  if (
    identifierMatch &&
    identifierMatch[1] &&
    !skipNames.has(identifierMatch[1].toLowerCase())
  ) {
    return identifierMatch[1];
  }

  return 'unknown';
}

/**
 * Track code copy events
 * @param {string} functionName
 * @param {string} languageName
 */
export function trackCopyCode(functionName, languageName) {
  if (!functionName || !languageName) {
    return;
  }

  pushToDataLayer('copy_code', {
    function_name: functionName,
    language_name: languageName,
  });
}

export { extractFunctionName };
