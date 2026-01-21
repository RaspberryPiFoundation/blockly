/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {IFocusableNode} from './interfaces/i_focusable_node.js';
import type {IFocusableTree} from './interfaces/i_focusable_tree.js';
import * as dom from './utils/dom.js';
import {FocusableTreeTraverser} from './utils/focusable_tree_traverser.js';

/**
 * Type declaration for returning focus to FocusManager upon completing an
 * ephemeral UI flow (such as a dialog).
 *
 * See FocusManager.takeEphemeralFocus for more details.
 */
export type ReturnEphemeralFocus = () => void;

/**
 * Represents an IFocusableTree that has been registered for focus management in
 * FocusManager.
 */
class TreeRegistration {
  /**
   * Constructs a new TreeRegistration.
   *
   * @param tree The tree being registered.
   * @param rootShouldBeAutoTabbable Whether the tree should have automatic
   *     top-level tab management.
   */
  constructor(
    readonly tree: IFocusableTree,
    readonly rootShouldBeAutoTabbable: boolean,
  ) {}
}

/**
 * A per-page singleton that manages Blockly focus across one or more
 * IFocusableTrees, and bidirectionally synchronizes this focus with the DOM.
 *
 * Callers that wish to explicitly change input focus for select Blockly
 * components on the page should use the focus functions in this manager.
 *
 * The manager is responsible for handling focus events from the DOM (which may
 * may arise from users clicking on page elements) and ensuring that
 * corresponding IFocusableNodes are clearly marked as actively/passively
 * highlighted in the same way that this would be represented with calls to
 * focusNode().
 */
export class FocusManager {
  /**
   * The CSS class assigned to IFocusableNode elements that presently have
   * active DOM and Blockly focus.
   *
   * This should never be used directly. Instead, rely on FocusManager to ensure
   * nodes have active focus (either automatically through DOM focus or manually
   * through the various focus* methods provided by this class).
   *
   * It's recommended to not query using this class name, either. Instead, use
   * FocusableTreeTraverser or IFocusableTree's methods to find a specific node.
   */
  static readonly ACTIVE_FOCUS_NODE_CSS_CLASS_NAME = 'blocklyActiveFocus';

  /**
   * The CSS class assigned to IFocusableNode elements that presently have
   * passive focus (that is, they were the most recent node in their relative
   * tree to have active focus--see ACTIVE_FOCUS_NODE_CSS_CLASS_NAME--and will
   * receive active focus again if their surrounding tree is requested to become
   * focused, i.e. using focusTree below).
   *
   * See ACTIVE_FOCUS_NODE_CSS_CLASS_NAME for caveats and limitations around
   * using this constant directly (generally it never should need to be used).
   */
  static readonly PASSIVE_FOCUS_NODE_CSS_CLASS_NAME = 'blocklyPassiveFocus';

  private focusedNode: IFocusableNode | null = null;
  private previouslyFocusedNode: IFocusableNode | null = null;
  private registeredTrees: Array<TreeRegistration> = [];

  private currentlyHoldsEphemeralFocus: boolean = false;
  private lockFocusStateChanges: boolean = false;
  private recentlyLostAllFocus: boolean = false;
  private isUpdatingFocusedNode: boolean = false;

  constructor(
    addGlobalEventListener: (type: string, listener: EventListener) => void,
  ) {
    // Note that 'element' here is the element *gaining* focus.
    const maybeFocus = (element: Element | EventTarget | null) => {
      // Skip processing the event if the focused node is currently updating.
      if (this.isUpdatingFocusedNode) return;

      this.recentlyLostAllFocus = !element;
      let newNode: IFocusableNode | null | undefined = null;
      if (element instanceof HTMLElement || element instanceof SVGElement) {
        // If the target losing or gaining focus maps to any tree, then it
        // should be updated. Per the contract of findFocusableNodeFor only one
        // tree should claim the element, so the search can be exited early.
        for (const reg of this.registeredTrees) {
          const tree = reg.tree;
          newNode = FocusableTreeTraverser.findFocusableNodeFor(element, tree);
          if (newNode) break;
        }
      }

      if (newNode && newNode.canBeFocused()) {
        const newTree = newNode.getFocusableTree();
        const oldTree = this.focusedNode?.getFocusableTree();
        if (newNode === newTree.getRootFocusableNode() && newTree !== oldTree) {
          // If the root of the tree is the one taking focus (such as due to
          // being tabbed), try to focus the whole tree explicitly to ensure the
          // correct node re-receives focus.
          this.focusTree(newTree);
        } else {
          this.focusNode(newNode);
        }
      } else {
        this.defocusCurrentFocusedNode();
      }
    };

    // Register root document focus listeners for tracking when focus leaves all
    // tracked focusable trees. Note that focusin and focusout can be somewhat
    // overlapping in the information that they provide. This is fine because
    // they both aim to check for focus changes on the element gaining or having
    // received focus, and maybeFocus should behave relatively deterministic.
    addGlobalEventListener('focusin', (event) => {
      if (!(event instanceof FocusEvent)) return;

      // When something receives focus, always use the current active element as
      // the source of truth.
      maybeFocus(document.activeElement);
    });
    addGlobalEventListener('focusout', (event) => {
      if (!(event instanceof FocusEvent)) return;

      // When something loses focus, it seems that document.activeElement may
      // not necessarily be correct. Instead, use relatedTarget.
      maybeFocus(event.relatedTarget);
    });
  }

  /**
   * Registers a new IFocusableTree for automatic focus management.
   *
   * If the tree currently has an element with DOM focus, it will not affect the
   * internal state in this manager until the focus changes to a new,
   * now-monitored element/node.
   *
   * This function throws if the provided tree is already currently registered
   * in this manager. Use isRegistered to check in cases when it can't be
   * certain whether the tree has been registered.
   *
   * The tree's registration can be customized to configure automatic tab stops.
   * This specifically provides capability for the user to be able to tab
   * navigate to the root of the tree but only when the tree doesn't hold active
   * focus. If this functionality is disabled then the tree's root will
   * automatically be made focusable (but not tabbable) when it is first focused
   * in the same way as any other focusable node.
   *
   * @param tree The IFocusableTree to register.
   * @param rootShouldBeAutoTabbable Whether the root of this tree should be
   *     added as a top-level page tab stop when it doesn't hold active focus.
   */
  registerTree(
    tree: IFocusableTree,
    rootShouldBeAutoTabbable: boolean = false,
  ): void {
    this.ensureManagerIsUnlocked();
    if (this.isRegistered(tree)) {
      throw Error(`Attempted to re-register already registered tree: ${tree}.`);
    }
    this.registeredTrees.push(
      new TreeRegistration(tree, rootShouldBeAutoTabbable),
    );
    const rootElement = tree.getRootFocusableNode().getFocusableElement();
    if (!rootElement.id || rootElement.id === 'null') {
      throw Error(
        `Attempting to register a tree with a root element that has an ` +
          `invalid ID: ${tree}.`,
      );
    }
    if (rootShouldBeAutoTabbable) {
      rootElement.tabIndex = 0;
    }
  }

  /**
   * Returns whether the specified tree has already been registered in this
   * manager using registerTree and hasn't yet been unregistered using
   * unregisterTree.
   */
  isRegistered(tree: IFocusableTree): boolean {
    return !!this.lookUpRegistration(tree);
  }

  /**
   * Returns the TreeRegistration for the specified tree, or null if the tree is
   * not currently registered.
   */
  private lookUpRegistration(tree: IFocusableTree): TreeRegistration | null {
    return this.registeredTrees.find((reg) => reg.tree === tree) ?? null;
  }

  /**
   * Unregisters a IFocusableTree from automatic focus management.
   *
   * If the tree had a previous focused node, it will have its highlight
   * removed. This function does NOT change DOM focus.
   *
   * This function throws if the provided tree is not currently registered in
   * this manager.
   *
   * This function will reset the tree's root element tabindex if the tree was
   * registered with automatic tab management.
   */
  unregisterTree(tree: IFocusableTree): void {
    this.ensureManagerIsUnlocked();
    if (!this.isRegistered(tree)) {
      throw Error(`Attempted to unregister not registered tree: ${tree}.`);
    }
    const treeIndex = this.registeredTrees.findIndex(
      (reg) => reg.tree === tree,
    );
    const registration = this.registeredTrees[treeIndex];
    this.registeredTrees.splice(treeIndex, 1);

    const focusedNode = FocusableTreeTraverser.findFocusedNode(tree);
    const root = tree.getRootFocusableNode();
    if (focusedNode) this.removeHighlight(focusedNode);
    if (this.focusedNode === focusedNode || this.focusedNode === root) {
      this.updateFocusedNode(null);
    }
    this.removeHighlight(root);

    if (registration.rootShouldBeAutoTabbable) {
      tree
        .getRootFocusableNode()
        .getFocusableElement()
        .removeAttribute('tabindex');
    }
  }

  /**
   * Returns the current IFocusableTree that has focus, or null if none
   * currently do.
   *
   * Note also that if ephemeral focus is currently captured (e.g. using
   * takeEphemeralFocus) then the returned tree here may not currently have DOM
   * focus.
   */
  getFocusedTree(): IFocusableTree | null {
    return this.focusedNode?.getFocusableTree() ?? null;
  }

  /**
   * Returns the current IFocusableNode with focus (which is always tied to a
   * focused IFocusableTree), or null if there isn't one.
   *
   * Note that this function will maintain parity with
   * IFocusableTree.getFocusedNode(). That is, if a tree itself has focus but
   * none of its non-root children do, this will return null but
   * getFocusedTree() will not.
   *
   * Note also that if ephemeral focus is currently captured (e.g. using
   * takeEphemeralFocus) then the returned node here may not currently have DOM
   * focus.
   */
  getFocusedNode(): IFocusableNode | null {
    return this.focusedNode;
  }

  /**
   * Focuses the specific IFocusableTree. This either means restoring active
   * focus to the tree's passively focused node, or focusing the tree's root
   * node.
   *
   * Note that if the specified tree already has a focused node then this will
   * not change any existing focus (unless that node has passive focus, then it
   * will be restored to active focus).
   *
   * See getFocusedNode for details on how other nodes are affected.
   *
   * @param focusableTree The tree that should receive active
   *     focus.
   */
  focusTree(focusableTree: IFocusableTree): void {
    this.ensureManagerIsUnlocked();
    if (!this.isRegistered(focusableTree)) {
      throw Error(`Attempted to focus unregistered tree: ${focusableTree}.`);
    }
    const currNode = FocusableTreeTraverser.findFocusedNode(focusableTree);
    const nodeToRestore = focusableTree.getRestoredFocusableNode(currNode);
    const rootFallback = focusableTree.getRootFocusableNode();
    this.focusNode(nodeToRestore ?? currNode ?? rootFallback);
  }

  /**
   * Focuses DOM input on the specified node, and marks it as actively focused.
   *
   * Any previously focused node will be updated to be passively highlighted (if
   * it's in a different focusable tree) or blurred (if it's in the same one).
   *
   * **Important**: If the provided node is not able to be focused (e.g. its
   * canBeFocused() method returns false), it will be ignored and any existing
   * focus state will remain unchanged.
   *
   * Note that this may update the specified node's element's tabindex to ensure
   * that it can be properly read out by screenreaders while focused.
   *
   * The focused node will not be automatically scrolled into view.
   *
   * @param focusableNode The node that should receive active focus.
   */
  focusNode(focusableNode: IFocusableNode): void {
    this.ensureManagerIsUnlocked();
    const mustRestoreUpdatingNode = !this.currentlyHoldsEphemeralFocus;
    if (mustRestoreUpdatingNode) {
      // Disable state syncing from DOM events since possible calls to focus()
      // below will loop a call back to focusNode().
      this.isUpdatingFocusedNode = true;
    }

    // Double check that state wasn't desynchronized in the background. See:
    // https://github.com/google/blockly-keyboard-experimentation/issues/87.
    // This is only done for the case where the same node is being focused twice
    // since other cases should automatically correct (due to the rest of the
    // routine running as normal).
    const prevFocusedElement = this.focusedNode?.getFocusableElement();
    const hasDesyncedState = prevFocusedElement !== document.activeElement;
    if (this.focusedNode === focusableNode && !hasDesyncedState) {
      if (mustRestoreUpdatingNode) {
        // Reenable state syncing from DOM events.
        this.isUpdatingFocusedNode = false;
      }
      return; // State is unchanged.
    }

    if (!focusableNode.canBeFocused()) {
      // This node can't be focused.
      console.warn("Trying to focus a node that can't be focused.");

      if (mustRestoreUpdatingNode) {
        // Reenable state syncing from DOM events.
        this.isUpdatingFocusedNode = false;
      }
      return;
    }

    const nextTree = focusableNode.getFocusableTree();
    if (!this.isRegistered(nextTree)) {
      throw Error(`Attempted to focus unregistered node: ${focusableNode}.`);
    }

    const focusableNodeElement = focusableNode.getFocusableElement();
    if (!focusableNodeElement.id || focusableNodeElement.id === 'null') {
      // Warn that the ID is invalid, but continue execution since an invalid ID
      // will result in an unmatched (null) node. Since a request to focus
      // something was initiated, the code below will attempt to find the next
      // best thing to focus, instead.
      console.warn('Trying to focus a node that has an invalid ID.');
    }

    // Safety check for ensuring focusNode() doesn't get called for a node that
    // isn't actually hooked up to its parent tree correctly. This usually
    // happens when calls to focusNode() interleave with asynchronous clean-up
    // operations (which can happen due to ephemeral focus and in other cases).
    // Fall back to a reasonable default since there's no valid node to focus.
    const matchedNode = FocusableTreeTraverser.findFocusableNodeFor(
      focusableNodeElement,
      nextTree,
    );
    const prevNodeNextTree = FocusableTreeTraverser.findFocusedNode(nextTree);
    let nodeToFocus = focusableNode;
    if (matchedNode !== focusableNode) {
      const nodeToRestore = nextTree.getRestoredFocusableNode(prevNodeNextTree);
      const rootFallback = nextTree.getRootFocusableNode();
      nodeToFocus = nodeToRestore ?? prevNodeNextTree ?? rootFallback;
    }

    const prevNode = this.focusedNode;
    const prevTree = prevNode?.getFocusableTree();
    if (prevNode) {
      this.passivelyFocusNode(prevNode, nextTree);
    }

    // If there's a focused node in the new node's tree, ensure it's reset.
    const nextTreeRoot = nextTree.getRootFocusableNode();
    if (prevNodeNextTree) {
      this.removeHighlight(prevNodeNextTree);
    }
    // For caution, ensure that the root is always reset since getFocusedNode()
    // is expected to return null if the root was highlighted, if the root is
    // not the node now being set to active.
    if (nextTreeRoot !== nodeToFocus) {
      this.removeHighlight(nextTreeRoot);
    }

    if (!this.currentlyHoldsEphemeralFocus) {
      // Only change the actively focused node if ephemeral state isn't held.
      this.activelyFocusNode(nodeToFocus, prevTree ?? null);
    }
    this.updateFocusedNode(nodeToFocus);
    if (mustRestoreUpdatingNode) {
      // Reenable state syncing from DOM events.
      this.isUpdatingFocusedNode = false;
    }
  }

  /**
   * Ephemerally captures focus for a specific element until the returned lambda
   * is called. This is expected to be especially useful for ephemeral UI flows
   * like dialogs.
   *
   * IMPORTANT: the returned lambda *must* be called, otherwise automatic focus
   * will no longer work anywhere on the page. It is highly recommended to tie
   * the lambda call to the closure of the corresponding UI so that if input is
   * manually changed to an element outside of the ephemeral UI, the UI should
   * close and automatic input restored. Note that this lambda must be called
   * exactly once and that subsequent calls will throw an error.
   *
   * Note that the manager will continue to track DOM input signals even when
   * ephemeral focus is active, but it won't actually change node state until
   * the returned lambda is called. Additionally, only 1 ephemeral focus context
   * can be active at any given time (attempting to activate more than one
   * simultaneously will result in an error being thrown).
   *
   * This method does not scroll the ephemerally focused element into view.
   */
  takeEphemeralFocus(
    focusableElement: HTMLElement | SVGElement,
  ): ReturnEphemeralFocus {
    this.ensureManagerIsUnlocked();
    if (this.currentlyHoldsEphemeralFocus) {
      throw Error(
        `Attempted to take ephemeral focus when it's already held, ` +
          `with new element: ${focusableElement}.`,
      );
    }
    this.currentlyHoldsEphemeralFocus = true;

    if (this.focusedNode) {
      this.passivelyFocusNode(this.focusedNode, null);
    }
    focusableElement.focus({preventScroll: true});

    let hasFinishedEphemeralFocus = false;
    return () => {
      if (hasFinishedEphemeralFocus) {
        throw Error(
          `Attempted to finish ephemeral focus twice for element: ` +
            `${focusableElement}.`,
        );
      }
      hasFinishedEphemeralFocus = true;
      this.currentlyHoldsEphemeralFocus = false;

      if (this.focusedNode) {
        this.activelyFocusNode(this.focusedNode, null);

        // Even though focus was restored, check if it's lost again. It's
        // possible for the browser to force focus away from all elements once
        // the ephemeral element disappears. This ensures focus is restored.
        const capturedNode = this.focusedNode;
        setTimeout(() => {
          // These checks are set up to minimize the risk that a legitimate
          // focus change occurred within the delay that this would override.
          if (
            !this.focusedNode &&
            this.previouslyFocusedNode === capturedNode &&
            this.recentlyLostAllFocus
          ) {
            this.focusNode(capturedNode);
          }
        }, 0);
      }
    };
  }

  /**
   * @returns whether something is currently holding ephemeral focus
   */
  ephemeralFocusTaken(): boolean {
    return this.currentlyHoldsEphemeralFocus;
  }

  /**
   * Ensures that the manager is currently allowing operations that change its
   * internal focus state (such as via focusNode()).
   *
   * If the manager is currently not allowing state changes, an exception is
   * thrown.
   */
  private ensureManagerIsUnlocked(): void {
    if (this.lockFocusStateChanges) {
      throw Error(
        'FocusManager state changes cannot happen in a tree/node focus/blur ' +
          'callback.',
      );
    }
  }

  /**
   * Updates the internally tracked focused node to the specified node, or null
   * if focus is being lost. This also updates previous focus tracking.
   *
   * @param newFocusedNode The new node to set as focused.
   */
  private updateFocusedNode(newFocusedNode: IFocusableNode | null) {
    this.previouslyFocusedNode = this.focusedNode;
    this.focusedNode = newFocusedNode;
  }

  /**
   * Defocuses the current actively focused node tracked by the manager, iff
   * there's a node being tracked and the manager doesn't have ephemeral focus.
   */
  private defocusCurrentFocusedNode(): void {
    // The current node will likely be defocused while ephemeral focus is held,
    // but internal manager state shouldn't change since the node should be
    // restored upon exiting ephemeral focus mode.
    if (this.focusedNode && !this.currentlyHoldsEphemeralFocus) {
      this.passivelyFocusNode(this.focusedNode, null);
      this.updateFocusedNode(null);
    }
  }

  /**
   * Marks the specified node as actively focused, also calling related
   * lifecycle callback methods for both the node and its parent tree. This
   * ensures that the node is properly styled to indicate its active focus.
   *
   * This does not change the manager's currently tracked node, nor does it
   * change any other nodes.
   *
   * @param node The node to be actively focused.
   * @param prevTree The tree of the previously actively focused node, or null
   *     if there wasn't a previously actively focused node.
   */
  private activelyFocusNode(
    node: IFocusableNode,
    prevTree: IFocusableTree | null,
  ): void {
    // Note that order matters here. Focus callbacks are allowed to change
    // element visibility which can influence focusability, including for a
    // node's focusable element (which *is* allowed to be invisible until the
    // node needs to be focused).
    this.lockFocusStateChanges = true;
    const tree = node.getFocusableTree();
    const elem = node.getFocusableElement();
    const nextTreeReg = this.lookUpRegistration(tree);
    const treeIsTabManaged = nextTreeReg?.rootShouldBeAutoTabbable;
    if (tree !== prevTree) {
      tree.onTreeFocus(node, prevTree);

      if (treeIsTabManaged) {
        // If this node's tree has its tab auto-managed, ensure that it's no
        // longer tabbable now that it holds active focus.
        tree.getRootFocusableNode().getFocusableElement().tabIndex = -1;
      }
    }
    node.onNodeFocus();
    this.lockFocusStateChanges = false;

    // The tab index should be set in all cases where:
    // - It doesn't overwrite an pre-set tab index for the node.
    // - The node is part of a tree whose tab index is unmanaged.
    // OR
    // - The node is part of a managed tree but this isn't the root. Managed
    //   roots are ignored since they are always overwritten to have a tab index
    //   of -1 with active focus so that they cannot be tab navigated.
    //
    // Setting the tab index ensures that the node's focusable element can
    // actually receive DOM focus.
    if (!treeIsTabManaged || node !== tree.getRootFocusableNode()) {
      if (!elem.hasAttribute('tabindex')) elem.tabIndex = -1;
    }

    this.setNodeToVisualActiveFocus(node);
    elem.focus({preventScroll: true});
  }

  /**
   * Marks the specified node as passively focused, also calling related
   * lifecycle callback methods for both the node and its parent tree. This
   * ensures that the node is properly styled to indicate its passive focus.
   *
   * This does not change the manager's currently tracked node, nor does it
   * change any other nodes.
   *
   * @param node The node to be passively focused.
   * @param nextTree The tree of the node receiving active focus, or null if no
   *     node will be actively focused.
   */
  private passivelyFocusNode(
    node: IFocusableNode,
    nextTree: IFocusableTree | null,
  ): void {
    this.lockFocusStateChanges = true;
    const tree = node.getFocusableTree();
    if (tree !== nextTree) {
      tree.onTreeBlur(nextTree);

      const reg = this.lookUpRegistration(tree);
      if (reg?.rootShouldBeAutoTabbable) {
        // If this node's tree has its tab auto-managed, ensure that it's now
        // tabbable since it no longer holds active focus.
        tree.getRootFocusableNode().getFocusableElement().tabIndex = 0;
      }
    }
    node.onNodeBlur();
    this.lockFocusStateChanges = false;

    if (tree !== nextTree) {
      this.setNodeToVisualPassiveFocus(node);
    }
  }

  /**
   * Updates the node's styling to indicate that it should have an active focus
   * indicator.
   *
   * @param node The node to be styled for active focus.
   */
  private setNodeToVisualActiveFocus(node: IFocusableNode): void {
    const element = node.getFocusableElement();
    dom.addClass(element, FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME);
    dom.removeClass(element, FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME);
  }

  /**
   * Updates the node's styling to indicate that it should have a passive focus
   * indicator.
   *
   * @param node The node to be styled for passive focus.
   */
  private setNodeToVisualPassiveFocus(node: IFocusableNode): void {
    const element = node.getFocusableElement();
    dom.removeClass(element, FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME);
    dom.addClass(element, FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME);
  }

  /**
   * Removes any active/passive indicators for the specified node.
   *
   * @param node The node which should have neither passive nor active focus
   *     indication.
   */
  private removeHighlight(node: IFocusableNode): void {
    const element = node.getFocusableElement();
    dom.removeClass(element, FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME);
    dom.removeClass(element, FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME);
  }

  private static focusManager: FocusManager | null = null;

  /**
   * Returns the page-global FocusManager.
   *
   * The returned instance is guaranteed to not change across function calls,
   * but may change across page loads.
   */
  static getFocusManager(): FocusManager {
    if (!FocusManager.focusManager) {
      FocusManager.focusManager = new FocusManager(document.addEventListener);
    }
    return FocusManager.focusManager;
  }
}

/** Convenience function for FocusManager.getFocusManager. */
export function getFocusManager(): FocusManager {
  return FocusManager.getFocusManager();
}
