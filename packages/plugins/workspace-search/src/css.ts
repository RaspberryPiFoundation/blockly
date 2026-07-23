/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Styling for workspace search.
 * @author aschmiedt@google.com (Abby Schmiedt)
 * @author kozbial@google.com (Monica Kozbial)
 */

/**
 * Base64 encoded data uri for close icon.
 */
const closeSvgDataUri =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC' +
  '9zdmciIGhlaWdodD0iMTQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjE0Ij48cGF0aC' +
  'BkPSJNMTkgNi40MUwxNy41OSA1IDEyIDEwLjU5IDYuNDEgNSA1IDYuNDEgMTAuNTkgMTIgNS' +
  'AxNy41OSA2LjQxIDE5IDEyIDEzLjQxIDE3LjU5IDE5IDE5IDE3LjU5IDEzLjQxIDEyeiIvPj' +
  'xwYXRoIGQ9Ik0wIDBoMjR2MjRIMHoiIGZpbGw9Im5vbmUiLz48L3N2Zz4=';

/**
 * Base64 encoded data uri for keyboard arrow down icon.
 */
const arrowDownSvgDataUri =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC' +
  '9zdmciIGhlaWdodD0iMTQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjE0Ij48cGF0aC' +
  'BkPSJNNy40MSA4LjU5TDEyIDEzLjE3bDQuNTktNC41OEwxOCAxMGwtNiA2LTYtNiAxLjQxLT' +
  'EuNDF6Ii8+PHBhdGggZD0iTTAgMGgyNHYyNEgwVjB6IiBmaWxsPSJub25lIi8+PC9zdmc+';

/**
 * Base64 encoded data uri for keyboard arrow up icon.
 */
const arrowUpSvgDataUri =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC' +
  '9zdmciIGhlaWdodD0iMTQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjE0Ij48cGF0aC' +
  'BkPSJNNy40MSAxNS40MUwxMiAxMC44M2w0LjU5IDQuNThMMTggMTRsLTYtNi02IDZ6Ii8+PH' +
  'BhdGggZD0iTTAgMGgyNHYyNEgweiIgZmlsbD0ibm9uZSIvPjwvc3ZnPg==';

/**
 * CSS for workspace search.
 */
const cssContent = `path.blocklyPath.blockly-ws-search-highlight {
    fill: #000;
  }
  path.blocklyPath.blockly-ws-search-highlight.blockly-ws-search-current {
    fill: grey;
  }
  .blockly-ws-search-close-btn {
    background: url(${closeSvgDataUri}) no-repeat top left;
  }
  .blockly-ws-search-next-btn {
    background: url(${arrowDownSvgDataUri}) no-repeat top left;
  }
  .blockly-ws-search-previous-btn {
    background: url(${arrowUpSvgDataUri}) no-repeat top left;
  }
  .blockly-ws-search {
    background: #fff;
    border: solid lightgrey 0.5px;
    box-shadow: 0px 10px 20px grey;
    justify-content: center;
    padding: 0.25em;
    position: absolute;
    z-index: 70;
  }
  .blockly-ws-search-input input {
    border: none;
  }
  .blockly-ws-search button {
    border: none;
    padding-left: 6px;
    padding-right: 6px;
  }
  .blockly-ws-search-actions {
    display: flex;
  }
  .blockly-ws-search-container {
    display: flex;
  }
  .blockly-ws-search-content {
    display: flex;
  }`;

/**
 * Injects CSS for workspace search.
 */
export const injectSearchCss = (function () {
  let executed = false;
  return function () {
    // Only inject the CSS once.
    if (executed) {
      return;
    }
    executed = true;
    // Inject CSS tag at start of head.
    const cssNode = document.createElement('style');
    cssNode.id = 'blockly-ws-search-style';
    const cssTextNode = document.createTextNode(cssContent);
    cssNode.appendChild(cssTextNode);
    document.head.insertBefore(cssNode, document.head.firstChild);
  };
})();
