/**
 * @license
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.Xml

import type {Block} from './block.js';
import type {BlockSvg} from './block_svg.js';
import {RenderedWorkspaceComment} from './comments/rendered_workspace_comment.js';
import {WorkspaceComment} from './comments/workspace_comment.js';
import type {Connection} from './connection.js';
import {MANUALLY_DISABLED} from './constants.js';
import {EventType} from './events/type.js';
import * as eventUtils from './events/utils.js';
import type {Field} from './field.js';
import {IconType} from './icons/icon_types.js';
import {inputTypes} from './inputs/input_types.js';
import type {
  IVariableModel,
  IVariableState,
} from './interfaces/i_variable_model.js';
import * as renderManagement from './render_management.js';
import {Coordinate} from './utils/coordinate.js';
import * as dom from './utils/dom.js';
import {Size} from './utils/size.js';
import * as utilsXml from './utils/xml.js';
import * as Variables from './variables.js';
import type {Workspace} from './workspace.js';
import {WorkspaceSvg} from './workspace_svg.js';

/**
 * Encode a block tree as XML.
 *
 * @param workspace The workspace containing blocks.
 * @param skipId True if the encoder should skip the block IDs. False by
 *     default.
 * @returns XML DOM element.
 */
export function workspaceToDom(workspace: Workspace, skipId = false): Element {
  const treeXml = utilsXml.createElement('xml');
  const variablesElement = variablesToDom(
    Variables.allUsedVarModels(workspace),
  );
  if (variablesElement.hasChildNodes()) {
    treeXml.appendChild(variablesElement);
  }
  for (const comment of workspace.getTopComments()) {
    treeXml.appendChild(saveWorkspaceComment(comment, skipId));
  }
  const blocks = workspace.getTopBlocks(true);
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    treeXml.appendChild(blockToDomWithXY(block, skipId));
  }
  return treeXml;
}

/** Serializes the given workspace comment to XML. */
export function saveWorkspaceComment(
  comment: WorkspaceComment,
  skipId = false,
): Element {
  const elem = utilsXml.createElement('comment');
  if (!skipId) elem.setAttribute('id', comment.id);

  const workspace = comment.workspace;
  const loc = comment.getRelativeToSurfaceXY().clone();
  loc.x = workspace.RTL ? workspace.getWidth() - loc.x : loc.x;
  elem.setAttribute('x', `${loc.x}`);
  elem.setAttribute('y', `${loc.y}`);
  elem.setAttribute('w', `${comment.getSize().width}`);
  elem.setAttribute('h', `${comment.getSize().height}`);

  if (comment.getText()) elem.textContent = comment.getText();
  if (comment.isCollapsed()) elem.setAttribute('collapsed', 'true');
  if (!comment.isOwnEditable()) elem.setAttribute('editable', 'false');
  if (!comment.isOwnMovable()) elem.setAttribute('movable', 'false');
  if (!comment.isOwnDeletable()) elem.setAttribute('deletable', 'false');

  return elem;
}

/**
 * Encode a list of variables as XML.
 *
 * @param variableList List of all variable models.
 * @returns Tree of XML elements.
 */
export function variablesToDom(
  variableList: IVariableModel<IVariableState>[],
): Element {
  const variables = utilsXml.createElement('variables');
  for (let i = 0; i < variableList.length; i++) {
    const variable = variableList[i];
    const element = utilsXml.createElement('variable');
    element.appendChild(utilsXml.createTextNode(variable.getName()));
    if (variable.getType()) {
      element.setAttribute('type', variable.getType());
    }
    element.id = variable.getId();
    variables.appendChild(element);
  }
  return variables;
}

/**
 * Encode a block subtree as XML with XY coordinates.
 *
 * @param block The root block to encode.
 * @param opt_noId True if the encoder should skip the block ID.
 * @returns Tree of XML elements or an empty document fragment if the block was
 *     an insertion marker.
 */
export function blockToDomWithXY(
  block: Block,
  opt_noId?: boolean,
): Element | DocumentFragment {
  if (block.isInsertionMarker()) {
    // Skip over insertion markers.
    block = block.getChildren(false)[0];
    if (!block) {
      // Disappears when appended.
      return new DocumentFragment();
    }
  }

  let width = 0; // Not used in LTR.
  if (block.workspace.RTL) {
    width = block.workspace.getWidth();
  }

  const element = blockToDom(block, opt_noId);
  if (isElement(element)) {
    const xy = block.getRelativeToSurfaceXY();
    element.setAttribute(
      'x',
      String(Math.round(block.workspace.RTL ? width - xy.x : xy.x)),
    );
    element.setAttribute('y', String(Math.round(xy.y)));
  }
  return element;
}

/**
 * Encode a field as XML.
 *
 * @param field The field to encode.
 * @returns XML element, or null if the field did not need to be serialized.
 */
function fieldToDom(field: Field): Element | null {
  if (field.isSerializable()) {
    const container = utilsXml.createElement('field');
    container.setAttribute('name', field.name || '');
    return field.toXml(container);
  }
  return null;
}

/**
 * Encode all of a block's fields as XML and attach them to the given tree of
 * XML elements.
 *
 * @param block A block with fields to be encoded.
 * @param element The XML element to which the field DOM should be attached.
 */
function allFieldsToDom(block: Block, element: Element) {
  for (const field of block.getFields()) {
    const fieldDom = fieldToDom(field);
    if (fieldDom) {
      element.appendChild(fieldDom);
    }
  }
}

/**
 * Encode a block subtree as XML.
 *
 * @param block The root block to encode.
 * @param opt_noId True if the encoder should skip the block ID.
 * @returns Tree of XML elements or an empty document fragment if the block was
 *     an insertion marker.
 */
export function blockToDom(
  block: Block,
  opt_noId?: boolean,
): Element | DocumentFragment {
  // Skip over insertion markers.
  if (block.isInsertionMarker()) {
    const child = block.getChildren(false)[0];
    if (child) {
      return blockToDom(child);
    } else {
      // Disappears when appended.
      return new DocumentFragment();
    }
  }

  const element = utilsXml.createElement(block.isShadow() ? 'shadow' : 'block');
  element.setAttribute('type', block.type);
  if (!opt_noId) {
    element.id = block.id;
  }
  if (block.mutationToDom) {
    // Custom data for an advanced block.
    const mutation = block.mutationToDom();
    if (mutation && (mutation.hasChildNodes() || mutation.hasAttributes())) {
      element.appendChild(mutation);
    }
  }

  allFieldsToDom(block, element);

  const commentText = block.getCommentText();
  if (commentText) {
    const comment = block.getIcon(IconType.COMMENT)!;
    const size = comment.getBubbleSize();
    const pinned = comment.bubbleIsVisible();
    const location = comment.getBubbleLocation();

    const commentElement = utilsXml.createElement('comment');
    commentElement.appendChild(utilsXml.createTextNode(commentText));
    commentElement.setAttribute('pinned', `${pinned}`);
    commentElement.setAttribute('h', `${size.height}`);
    commentElement.setAttribute('w', `${size.width}`);
    if (location) {
      commentElement.setAttribute(
        'x',
        `${
          block.workspace.RTL
            ? block.workspace.getWidth() - (location.x + size.width)
            : location.x
        }`,
      );
      commentElement.setAttribute('y', `${location.y}`);
    }

    element.appendChild(commentElement);
  }

  if (block.data) {
    const dataElement = utilsXml.createElement('data');
    dataElement.appendChild(utilsXml.createTextNode(block.data));
    element.appendChild(dataElement);
  }

  for (let i = 0; i < block.inputList.length; i++) {
    const input = block.inputList[i];
    let container: Element;
    let empty = true;
    if (input.type === inputTypes.DUMMY || input.type === inputTypes.END_ROW) {
      continue;
    } else {
      const childBlock = input.connection!.targetBlock();
      if (input.type === inputTypes.VALUE) {
        container = utilsXml.createElement('value');
      } else if (input.type === inputTypes.STATEMENT) {
        container = utilsXml.createElement('statement');
      }
      const childShadow = input.connection!.getShadowDom();
      if (childShadow && (!childBlock || !childBlock.isShadow())) {
        container!.appendChild(cloneShadow(childShadow, opt_noId));
      }
      if (childBlock) {
        const childElem = blockToDom(childBlock, opt_noId);
        if (childElem.nodeType === dom.NodeType.ELEMENT_NODE) {
          container!.appendChild(childElem);
          empty = false;
        }
      }
    }
    container!.setAttribute('name', input.name);
    if (!empty) {
      element.appendChild(container!);
    }
  }
  if (
    block.inputsInline !== undefined &&
    block.inputsInline !== block.inputsInlineDefault
  ) {
    element.setAttribute('inline', String(block.inputsInline));
  }
  if (block.isCollapsed()) {
    element.setAttribute('collapsed', 'true');
  }
  if (!block.isEnabled()) {
    // Set the value of the attribute to a comma-separated list of reasons.
    // Use encodeURIComponent to escape commas in the reasons so that they
    // won't be confused with separator commas.
    element.setAttribute(
      'disabled-reasons',
      Array.from(block.getDisabledReasons()).map(encodeURIComponent).join(','),
    );
  }
  if (!block.isOwnDeletable()) {
    element.setAttribute('deletable', 'false');
  }
  if (!block.isOwnMovable()) {
    element.setAttribute('movable', 'false');
  }
  if (!block.isOwnEditable()) {
    element.setAttribute('editable', 'false');
  }

  const nextBlock = block.getNextBlock();
  let container: Element;
  if (nextBlock) {
    const nextElem = blockToDom(nextBlock, opt_noId);
    if (nextElem.nodeType === dom.NodeType.ELEMENT_NODE) {
      container = utilsXml.createElement('next');
      container.appendChild(nextElem);
      element.appendChild(container);
    }
  }
  const nextShadow =
    block.nextConnection && block.nextConnection.getShadowDom();
  if (nextShadow && (!nextBlock || !nextBlock.isShadow())) {
    container!.appendChild(cloneShadow(nextShadow, opt_noId));
  }

  return element;
}

/**
 * Deeply clone the shadow's DOM so that changes don't back-wash to the block.
 *
 * @param shadow A tree of XML elements.
 * @param opt_noId True if the encoder should skip the block ID.
 * @returns A tree of XML elements.
 */
function cloneShadow(shadow: Element, opt_noId?: boolean): Element {
  shadow = shadow.cloneNode(true) as Element;
  // Walk the tree looking for whitespace.  Don't prune whitespace in a tag.
  let node: Node | null = shadow;
  let textNode;
  while (node) {
    if (opt_noId && node.nodeName === 'shadow') {
      // Strip off IDs from shadow blocks.  There should never be a 'block' as
      // a child of a 'shadow', so no need to check that.
      (node as Element).removeAttribute('id');
    }
    if (node.firstChild) {
      node = node.firstChild;
    } else {
      while (node && !node.nextSibling) {
        textNode = node;
        node = node.parentNode;
        if (
          textNode.nodeType === dom.NodeType.TEXT_NODE &&
          (textNode as Text).data.trim() === '' &&
          node?.firstChild !== textNode
        ) {
          // Prune whitespace after a tag.
          dom.removeNode(textNode);
        }
      }
      if (node) {
        textNode = node;
        node = node.nextSibling;
        if (
          textNode.nodeType === dom.NodeType.TEXT_NODE &&
          (textNode as Text).data.trim() === ''
        ) {
          // Prune whitespace before a tag.
          dom.removeNode(textNode);
        }
      }
    }
  }
  return shadow;
}

/**
 * Converts a DOM structure into plain text.
 * Currently the text format is fairly ugly: all one line with no whitespace,
 * unless the DOM itself has whitespace built-in.
 *
 * @param dom A tree of XML nodes.
 * @returns Text representation.
 */
export function domToText(dom: Node): string {
  const text = utilsXml.domToText(dom);
  // Unpack self-closing tags.  These tags fail when embedded in HTML.
  // <block name="foo"/> -> <block name="foo"></block>
  return text.replace(/<(\w+)([^<]*)\/>/g, '<$1$2></$1>');
}

/**
 * Converts a DOM structure into properly indented text.
 *
 * @param dom A tree of XML elements.
 * @returns Text representation.
 */
export function domToPrettyText(dom: Node): string {
  // This function is not guaranteed to be correct for all XML.
  // But it handles the XML that Blockly generates.
  const blob = domToText(dom);
  // Place every open and close tag on its own line.
  const lines = blob.split('<');
  // Indent every line.
  let indent = '';
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (line[0] === '/') {
      indent = indent.substring(2);
    }
    lines[i] = indent + '<' + line;
    if (line[0] !== '/' && line.slice(-2) !== '/>') {
      indent += '  ';
    }
  }
  // Pull simple tags back together.
  // E.g. <foo></foo>
  let text = lines.join('\n');
  text = text.replace(/(<(\w+)\b[^>]*>[^\n]*)\n *<\/\2>/g, '$1</$2>');
  // Trim leading blank line.
  return text.replace(/^\n/, '');
}

/**
 * Clear the given workspace then decode an XML DOM and
 * create blocks on the workspace.
 *
 * @param xml XML DOM.
 * @param workspace The workspace.
 * @returns An array containing new block IDs.
 */
export function clearWorkspaceAndLoadFromXml(
  xml: Element,
  workspace: WorkspaceSvg,
): string[] {
  workspace.setResizesEnabled(false);
  workspace.clear();
  const blockIds = domToWorkspace(xml, workspace);
  workspace.setResizesEnabled(true);
  return blockIds;
}

/**
 * Decode an XML DOM and create blocks on the workspace.
 *
 * @param xml XML DOM.
 * @param workspace The workspace.
 * @returns An array containing new block IDs.
 */
export function domToWorkspace(xml: Element, workspace: Workspace): string[] {
  let width = 0; // Not used in LTR.
  if (workspace.RTL) {
    width = workspace.getWidth();
  }
  const newBlockIds = []; // A list of block IDs added by this call.
  dom.startTextWidthCache();
  const existingGroup = eventUtils.getGroup();
  if (!existingGroup) {
    eventUtils.setGroup(true);
  }

  // Disable workspace resizes as an optimization.
  // Assume it is rendered so we can check.
  if ((workspace as WorkspaceSvg).setResizesEnabled) {
    (workspace as WorkspaceSvg).setResizesEnabled(false);
  }
  let variablesFirst = true;
  try {
    for (let i = 0, xmlChild; (xmlChild = xml.childNodes[i]); i++) {
      const name = xmlChild.nodeName.toLowerCase();
      const xmlChildElement = xmlChild as Element;
      if (
        name === 'block' ||
        (name === 'shadow' && !eventUtils.getRecordUndo())
      ) {
        // Allow top-level shadow blocks if recordUndo is disabled since
        // that means an undo is in progress.  Such a block is expected
        // to be moved to a nested destination in the next operation.
        const block = domToBlockInternal(xmlChildElement, workspace);
        newBlockIds.push(block.id);
        const blockX = parseInt(xmlChildElement.getAttribute('x') ?? '10', 10);
        const blockY = parseInt(xmlChildElement.getAttribute('y') ?? '10', 10);
        if (!isNaN(blockX) && !isNaN(blockY)) {
          block.moveBy(workspace.RTL ? width - blockX : blockX, blockY, [
            'create',
          ]);
        }
        variablesFirst = false;
      } else if (name === 'shadow') {
        throw TypeError('Shadow block cannot be a top-level block.');
      } else if (name === 'comment') {
        loadWorkspaceComment(xmlChildElement, workspace);
      } else if (name === 'variables') {
        if (variablesFirst) {
          domToVariables(xmlChildElement, workspace);
        } else {
          throw Error(
            "'variables' tag must exist once before block and " +
              'shadow tag elements in the workspace XML, but it was found in ' +
              'another location.',
          );
        }
        variablesFirst = false;
      }
    }
  } finally {
    eventUtils.setGroup(existingGroup);
    if ((workspace as WorkspaceSvg).setResizesEnabled) {
      (workspace as WorkspaceSvg).setResizesEnabled(true);
    }
    if (workspace.rendered) renderManagement.triggerQueuedRenders();
    dom.stopTextWidthCache();
  }
  // Re-enable workspace resizing.
  eventUtils.fire(new (eventUtils.get(EventType.FINISHED_LOADING))(workspace));
  return newBlockIds;
}

/** Deserializes the given comment state into the given workspace. */
export function loadWorkspaceComment(
  elem: Element,
  workspace: Workspace,
): WorkspaceComment {
  const id = elem.getAttribute('id') ?? undefined;
  const comment = workspace.rendered
    ? new RenderedWorkspaceComment(workspace as WorkspaceSvg, id)
    : new WorkspaceComment(workspace, id);

  comment.setText(elem.textContent ?? '');

  let x = parseInt(elem.getAttribute('x') ?? '', 10);
  const y = parseInt(elem.getAttribute('y') ?? '', 10);
  if (!isNaN(x) && !isNaN(y)) {
    x = workspace.RTL ? workspace.getWidth() - x : x;
    comment.moveTo(new Coordinate(x, y));
  }

  const w = parseInt(elem.getAttribute('w') ?? '', 10);
  const h = parseInt(elem.getAttribute('h') ?? '', 10);
  if (!isNaN(w) && !isNaN(h)) comment.setSize(new Size(w, h));

  if (elem.getAttribute('collapsed') === 'true') comment.setCollapsed(true);
  if (elem.getAttribute('editable') === 'false') comment.setEditable(false);
  if (elem.getAttribute('movable') === 'false') comment.setMovable(false);
  if (elem.getAttribute('deletable') === 'false') comment.setDeletable(false);

  return comment;
}

/**
 * Decode an XML DOM and create blocks on the workspace. Position the new
 * blocks immediately below prior blocks, aligned by their starting edge.
 *
 * @param xml The XML DOM.
 * @param workspace The workspace to add to.
 * @returns An array containing new block IDs.
 */
export function appendDomToWorkspace(
  xml: Element,
  workspace: WorkspaceSvg,
): string[] {
  // First check if we have a WorkspaceSvg, otherwise the blocks have no shape
  // and the position does not matter.
  // Assume it is rendered so we can check.
  if (!(workspace as WorkspaceSvg).getBlocksBoundingBox) {
    return domToWorkspace(xml, workspace);
  }

  const bbox = (workspace as WorkspaceSvg).getBlocksBoundingBox();
  // Load the new blocks into the workspace and get the IDs of the new blocks.
  const newBlockIds = domToWorkspace(xml, workspace);
  if (bbox && bbox.top !== bbox.bottom) {
    // Check if any previous block.
    let offsetY = 0; // Offset to add to y of the new block.
    let offsetX = 0;
    const farY = bbox.bottom; // Bottom position.
    const topX = workspace.RTL ? bbox.right : bbox.left; // X of bounding box.
    // Check position of the new blocks.
    let newLeftX = Infinity; // X of top left corner.
    let newRightX = -Infinity; // X of top right corner.
    let newY = Infinity; // Y of top corner.
    const ySeparation = 10;
    for (let i = 0; i < newBlockIds.length; i++) {
      const blockXY = workspace
        .getBlockById(newBlockIds[i])!
        .getRelativeToSurfaceXY();
      if (blockXY.y < newY) {
        newY = blockXY.y;
      }
      if (blockXY.x < newLeftX) {
        // if we left align also on x
        newLeftX = blockXY.x;
      }
      if (blockXY.x > newRightX) {
        // if we right align also on x
        newRightX = blockXY.x;
      }
    }
    offsetY = farY - newY + ySeparation;
    offsetX = workspace.RTL ? topX - newRightX : topX - newLeftX;
    for (let i = 0; i < newBlockIds.length; i++) {
      const block = workspace.getBlockById(newBlockIds[i]);
      block!.moveBy(offsetX, offsetY, ['create']);
    }
  }
  return newBlockIds;
}

/**
 * Decode an XML block tag and create a block (and possibly sub blocks) on the
 * workspace.
 *
 * @param xmlBlock XML block element.
 * @param workspace The workspace.
 * @returns The root block created.
 */
export function domToBlock(xmlBlock: Element, workspace: Workspace): Block {
  const block = domToBlockInternal(xmlBlock, workspace);
  if (workspace.rendered) renderManagement.triggerQueuedRenders();
  return block;
}

/**
 * Decode an XML block tag and create a block (and possibly sub blocks) on the
 * workspace.
 *
 * This is defined internally so that it doesn't trigger an immediate render,
 * which we do want to happen for external calls.
 *
 * @param xmlBlock XML block element.
 * @param workspace The workspace.
 * @returns The root block created.
 * @internal
 */
export function domToBlockInternal(
  xmlBlock: Element,
  workspace: Workspace,
): Block {
  // Create top-level block.
  eventUtils.disable();
  const variablesBeforeCreation = workspace.getVariableMap().getAllVariables();
  let topBlock;
  try {
    topBlock = domToBlockHeadless(xmlBlock, workspace);
    // Generate list of all blocks.
    if (workspace.rendered) {
      const topBlockSvg = topBlock as BlockSvg;
      const blocks = topBlock.getDescendants(false);
      topBlockSvg.setConnectionTracking(false);
      // Render each block.
      for (let i = blocks.length - 1; i >= 0; i--) {
        (blocks[i] as BlockSvg).initSvg();
      }
      for (let i = blocks.length - 1; i >= 0; i--) {
        (blocks[i] as BlockSvg).queueRender();
      }
      // Populating the connection database may be deferred until after the
      // blocks have rendered.
      setTimeout(function () {
        if (!topBlockSvg.disposed) {
          topBlockSvg.setConnectionTracking(true);
        }
      }, 1);
      // Allow the scrollbars to resize and move based on the new contents.
      // TODO(@picklesrus): #387. Remove when domToBlock avoids resizing.
      (workspace as WorkspaceSvg).resizeContents();
    } else {
      const blocks = topBlock.getDescendants(false);
      for (let i = blocks.length - 1; i >= 0; i--) {
        blocks[i].initModel();
      }
    }
  } finally {
    eventUtils.enable();
  }
  if (eventUtils.isEnabled()) {
    const newVariables = Variables.getAddedVariables(
      workspace,
      variablesBeforeCreation,
    );
    // Fire a VarCreate event for each (if any) new variable created.
    for (let i = 0; i < newVariables.length; i++) {
      const thisVariable = newVariables[i];
      eventUtils.fire(new (eventUtils.get(EventType.VAR_CREATE))(thisVariable));
    }
    // Block events come after var events, in case they refer to newly created
    // variables.
    eventUtils.fire(new (eventUtils.get(EventType.BLOCK_CREATE))(topBlock));
  }
  return topBlock;
}

/**
 * Decode an XML list of variables and add the variables to the workspace.
 *
 * @param xmlVariables List of XML variable elements.
 * @param workspace The workspace to which the variable should be added.
 */
export function domToVariables(xmlVariables: Element, workspace: Workspace) {
  for (let i = 0; i < xmlVariables.children.length; i++) {
    const xmlChild = xmlVariables.children[i];
    const type = xmlChild.getAttribute('type');
    const id = xmlChild.getAttribute('id');
    const name = xmlChild.textContent;

    if (!name) return;
    workspace.getVariableMap().createVariable(name, type ?? undefined, id);
  }
}

/** A mapping of nodeName to node for child nodes of xmlBlock. */
interface childNodeTagMap {
  mutation: Element[];
  comment: Element[];
  data: Element[];
  field: Element[];
  input: Element[];
  next: Element[];
}

/**
 * Creates a mapping of childNodes for each supported XML tag for the provided
 * xmlBlock. Logs a warning for any encountered unsupported tags.
 *
 * @param xmlBlock XML block element.
 * @returns The childNode map from nodeName to node.
 */
function mapSupportedXmlTags(xmlBlock: Element): childNodeTagMap {
  const childNodeMap = {
    mutation: new Array<Element>(),
    comment: new Array<Element>(),
    data: new Array<Element>(),
    field: new Array<Element>(),
    input: new Array<Element>(),
    next: new Array<Element>(),
  };
  for (let i = 0; i < xmlBlock.children.length; i++) {
    const xmlChild = xmlBlock.children[i];
    if (xmlChild.nodeType === dom.NodeType.TEXT_NODE) {
      // Ignore any text at the <block> level.  It's all whitespace anyway.
      continue;
    }
    switch (xmlChild.nodeName.toLowerCase()) {
      case 'mutation':
        childNodeMap.mutation.push(xmlChild);
        break;
      case 'comment':
        childNodeMap.comment.push(xmlChild);
        break;
      case 'data':
        childNodeMap.data.push(xmlChild);
        break;
      case 'title':
      // Titles were renamed to field in December 2013.
      // Fall through.
      case 'field':
        childNodeMap.field.push(xmlChild);
        break;
      case 'value':
      case 'statement':
        childNodeMap.input.push(xmlChild);
        break;
      case 'next':
        childNodeMap.next.push(xmlChild);
        break;
      default:
        // Unknown tag; ignore.  Same principle as HTML parsers.
        console.warn('Ignoring unknown tag: ' + xmlChild.nodeName);
    }
  }
  return childNodeMap;
}

/**
 * Applies mutation tag child nodes to the given block.
 *
 * @param xmlChildren Child nodes.
 * @param block The block to apply the child nodes on.
 * @returns True if mutation may have added some elements that need
 *     initialization (requiring initSvg call).
 */
function applyMutationTagNodes(xmlChildren: Element[], block: Block): boolean {
  let shouldCallInitSvg = false;
  for (let i = 0; i < xmlChildren.length; i++) {
    const xmlChild = xmlChildren[i];
    // Custom data for an advanced block.
    if (block.domToMutation) {
      block.domToMutation(xmlChild);
      if ((block as BlockSvg).initSvg) {
        // Mutation may have added some elements that need initializing.
        shouldCallInitSvg = true;
      }
    }
  }
  return shouldCallInitSvg;
}

/**
 * Applies comment tag child nodes to the given block.
 *
 * @param xmlChildren Child nodes.
 * @param block The block to apply the child nodes on.
 */
function applyCommentTagNodes(xmlChildren: Element[], block: Block) {
  for (let i = 0; i < xmlChildren.length; i++) {
    const xmlChild = xmlChildren[i];
    const text = xmlChild.textContent;
    const pinned = xmlChild.getAttribute('pinned') === 'true';
    const width = parseInt(xmlChild.getAttribute('w') ?? '50', 10);
    const height = parseInt(xmlChild.getAttribute('h') ?? '50', 10);
    let x = parseInt(xmlChild.getAttribute('x') ?? '', 10);
    const y = parseInt(xmlChild.getAttribute('y') ?? '', 10);

    block.setCommentText(text);
    const comment = block.getIcon(IconType.COMMENT)!;
    if (!isNaN(width) && !isNaN(height)) {
      comment.setBubbleSize(new Size(width, height));
    }
    // Set the pinned state of the bubble.
    comment.setBubbleVisible(pinned);

    // Actually show the bubble after the block has been rendered.
    setTimeout(() => {
      if (!isNaN(x) && !isNaN(y)) {
        x = block.workspace.RTL ? block.workspace.getWidth() - (x + width) : x;
        comment.setBubbleLocation(new Coordinate(x, y));
      }
      comment.setBubbleVisible(pinned);
    }, 1);
  }
}

/**
 * Applies data tag child nodes to the given block.
 *
 * @param xmlChildren Child nodes.
 * @param block The block to apply the child nodes on.
 */
function applyDataTagNodes(xmlChildren: Element[], block: Block) {
  for (let i = 0; i < xmlChildren.length; i++) {
    const xmlChild = xmlChildren[i];
    block.data = xmlChild.textContent;
  }
}

/**
 * Applies field tag child nodes to the given block.
 *
 * @param xmlChildren Child nodes.
 * @param block The block to apply the child nodes on.
 */
function applyFieldTagNodes(xmlChildren: Element[], block: Block) {
  for (let i = 0; i < xmlChildren.length; i++) {
    const xmlChild = xmlChildren[i];
    const nodeName = xmlChild.getAttribute('name');
    if (!nodeName) {
      console.warn(`Ignoring unnamed field in block ${block.type}`);
      continue;
    }
    domToField(block, nodeName, xmlChild);
  }
}

/**
 * Finds any enclosed blocks or shadows within this XML node.
 *
 * @param xmlNode The XML node to extract child block info from.
 * @returns Any found child block.
 */
function findChildBlocks(xmlNode: Element): {
  childBlockElement: Element | null;
  childShadowElement: Element | null;
} {
  let childBlockElement: Element | null = null;
  let childShadowElement: Element | null = null;
  for (let i = 0; i < xmlNode.childNodes.length; i++) {
    const xmlChild = xmlNode.childNodes[i];
    if (isElement(xmlChild)) {
      if (xmlChild.nodeName.toLowerCase() === 'block') {
        childBlockElement = xmlChild;
      } else if (xmlChild.nodeName.toLowerCase() === 'shadow') {
        childShadowElement = xmlChild;
      }
    }
  }
  return {childBlockElement, childShadowElement};
}
/**
 * Applies input child nodes (value or statement) to the given block.
 *
 * @param xmlChildren Child nodes.
 * @param workspace The workspace containing the given block.
 * @param block The block to apply the child nodes on.
 * @param prototypeName The prototype name of the block.
 */
function applyInputTagNodes(
  xmlChildren: Element[],
  workspace: Workspace,
  block: Block,
  prototypeName: string,
) {
  for (let i = 0; i < xmlChildren.length; i++) {
    const xmlChild = xmlChildren[i];
    const nodeName = xmlChild.getAttribute('name');
    const input = nodeName ? block.getInput(nodeName) : null;
    if (!input) {
      console.warn(
        'Ignoring non-existent input ' +
          nodeName +
          ' in block ' +
          prototypeName,
      );
      break;
    }
    const childBlockInfo = findChildBlocks(xmlChild);
    if (childBlockInfo.childBlockElement) {
      if (!input.connection) {
        throw TypeError('Input connection does not exist.');
      }
      domToBlockHeadless(
        childBlockInfo.childBlockElement,
        workspace,
        input.connection,
        false,
      );
    }
    // Set shadow after so we don't create a shadow we delete immediately.
    if (childBlockInfo.childShadowElement) {
      input.connection?.setShadowDom(childBlockInfo.childShadowElement);
    }
  }
}

/**
 * Applies next child nodes to the given block.
 *
 * @param xmlChildren Child nodes.
 * @param workspace The workspace containing the given block.
 * @param block The block to apply the child nodes on.
 */
function applyNextTagNodes(
  xmlChildren: Element[],
  workspace: Workspace,
  block: Block,
) {
  for (let i = 0; i < xmlChildren.length; i++) {
    const xmlChild = xmlChildren[i];
    const childBlockInfo = findChildBlocks(xmlChild);
    if (childBlockInfo.childBlockElement) {
      if (!block.nextConnection) {
        throw TypeError('Next statement does not exist.');
      }
      // If there is more than one XML 'next' tag.
      if (block.nextConnection.isConnected()) {
        throw TypeError('Next statement is already connected.');
      }
      // Create child block.
      domToBlockHeadless(
        childBlockInfo.childBlockElement,
        workspace,
        block.nextConnection,
        true,
      );
    }
    // Set shadow after so we don't create a shadow we delete immediately.
    if (childBlockInfo.childShadowElement && block.nextConnection) {
      block.nextConnection.setShadowDom(childBlockInfo.childShadowElement);
    }
  }
}

/**
 * Decode an XML block tag and create a block (and possibly sub blocks) on the
 * workspace.
 *
 * @param xmlBlock XML block element.
 * @param workspace The workspace.
 * @param parentConnection The parent connection to connect this block to
 *     after instantiating.
 * @param connectedToParentNext Whether the provided parent connection is a next
 *     connection, rather than output or statement.
 * @returns The root block created.
 */
function domToBlockHeadless(
  xmlBlock: Element,
  workspace: Workspace,
  parentConnection?: Connection,
  connectedToParentNext?: boolean,
): Block {
  let block = null;
  const prototypeName = xmlBlock.getAttribute('type');
  if (!prototypeName) {
    throw TypeError('Block type unspecified: ' + xmlBlock.outerHTML);
  }
  const id = xmlBlock.getAttribute('id') ?? undefined;
  block = workspace.newBlock(prototypeName, id);

  // Preprocess childNodes so tags can be processed in a consistent order.
  const xmlChildNameMap = mapSupportedXmlTags(xmlBlock);

  const shouldCallInitSvg = applyMutationTagNodes(
    xmlChildNameMap.mutation,
    block,
  );
  applyCommentTagNodes(xmlChildNameMap.comment, block);
  applyDataTagNodes(xmlChildNameMap.data, block);

  // Connect parent after processing mutation and before setting fields.
  if (parentConnection) {
    if (connectedToParentNext) {
      if (block.previousConnection) {
        parentConnection.connect(block.previousConnection);
      } else {
        throw TypeError('Next block does not have previous statement.');
      }
    } else {
      if (block.outputConnection) {
        parentConnection.connect(block.outputConnection);
      } else if (block.previousConnection) {
        parentConnection.connect(block.previousConnection);
      } else {
        throw TypeError(
          'Child block does not have output or previous statement.',
        );
      }
    }
  }

  applyFieldTagNodes(xmlChildNameMap.field, block);
  applyInputTagNodes(xmlChildNameMap.input, workspace, block, prototypeName);
  applyNextTagNodes(xmlChildNameMap.next, workspace, block);

  if (shouldCallInitSvg) {
    // This shouldn't even be called here
    // (ref: https://github.com/google/blockly/pull/4296#issuecomment-884226021
    // But the XML serializer/deserializer is iceboxed so I'm not going to fix
    // it.
    (block as BlockSvg).initSvg();
  }

  const inline = xmlBlock.getAttribute('inline');
  if (inline) {
    block.setInputsInline(inline === 'true');
  }
  const disabled = xmlBlock.getAttribute('disabled');
  if (disabled) {
    // Before May 2024 we just used 'disabled', with no reasons.
    // Contiune to support this syntax.
    block.setDisabledReason(
      disabled === 'true' || disabled === 'disabled',
      MANUALLY_DISABLED,
    );
  }
  const disabledReasons = xmlBlock.getAttribute('disabled-reasons');
  if (disabledReasons !== null) {
    for (const reason of disabledReasons.split(',')) {
      // Use decodeURIComponent to restore characters that were encoded in the
      // value, such as commas.
      block.setDisabledReason(true, decodeURIComponent(reason));
    }
  }
  const deletable = xmlBlock.getAttribute('deletable');
  if (deletable) {
    block.setDeletable(deletable === 'true');
  }
  const movable = xmlBlock.getAttribute('movable');
  if (movable) {
    block.setMovable(movable === 'true');
  }
  const editable = xmlBlock.getAttribute('editable');
  if (editable) {
    block.setEditable(editable === 'true');
  }
  const collapsed = xmlBlock.getAttribute('collapsed');
  if (collapsed) {
    block.setCollapsed(collapsed === 'true');
  }
  if (xmlBlock.nodeName.toLowerCase() === 'shadow') {
    // Ensure all children are also shadows.
    const children = block.getChildren(false);
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (!child.isShadow()) {
        throw TypeError('Shadow block not allowed non-shadow child.');
      }
    }

    block.setShadow(true);
  }
  return block;
}

/**
 * Decode an XML field tag and set the value of that field on the given block.
 *
 * @param block The block that is currently being deserialized.
 * @param fieldName The name of the field on the block.
 * @param xml The field tag to decode.
 */
function domToField(block: Block, fieldName: string, xml: Element) {
  const field = block.getField(fieldName);
  if (!field) {
    console.warn(
      'Ignoring non-existent field ' + fieldName + ' in block ' + block.type,
    );
    return;
  }
  field.fromXml(xml);
}

/**
 * Remove any 'next' block (statements in a stack).
 *
 * @param xmlBlock XML block element or an empty DocumentFragment if the block
 *     was an insertion marker.
 */
export function deleteNext(xmlBlock: Element | DocumentFragment) {
  for (let i = 0; i < xmlBlock.childNodes.length; i++) {
    const child = xmlBlock.childNodes[i];
    if (child.nodeName.toLowerCase() === 'next') {
      xmlBlock.removeChild(child);
      break;
    }
  }
}

function isElement(node: Node): node is Element {
  return node.nodeType === dom.NodeType.ELEMENT_NODE;
}
