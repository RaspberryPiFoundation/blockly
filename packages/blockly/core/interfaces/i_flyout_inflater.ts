import type {FlyoutItem} from '../flyout_item.js';
import type {IFlyout} from './i_flyout.js';

export interface IFlyoutInflater {
  /**
   * Loads the object represented by the given state onto the workspace.
   *
   * Note that this method's interface is identical to that in ISerializer, to
   * allow for code reuse.
   *
   * @param state A JSON representation of an element to inflate on the flyout.
   * @param flyout The flyout on whose workspace the inflated element
   *    should be created. If the inflated element is an `IRenderedElement` it
   *    itself or the inflater should append it to the workspace; the flyout
   *    will not do so itself. The flyout is responsible for positioning the
   *    element, however.
   * @returns The newly inflated flyout element.
   */
  load(state: object, flyout: IFlyout): FlyoutItem;

  /**
   * Returns the amount of spacing that should follow the element corresponding
   * to the given JSON representation.
   *
   * @param state A JSON representation of the element preceding the gap.
   * @param defaultGap The default gap for elements in this flyout.
   * @returns The gap that should follow the given element.
   */
  gapForItem(state: object, defaultGap: number): number;

  /**
   * Disposes of the given element.
   *
   * If the element in question resides on the flyout workspace, it should remove
   * itself. Implementers are not otherwise required to fully dispose of the
   * element; it may be e.g. cached for performance purposes.
   *
   * @param element The flyout element to dispose of.
   */
  disposeItem(item: FlyoutItem): void;

  /**
   * Returns the type of items that this inflater is responsible for inflating.
   * This should be the same as the name under which this inflater registers
   * itself, as well as the value returned by `getType()` on the `FlyoutItem`
   * objects returned by `load()`.
   *
   * @returns The type of items this inflater creates.
   */
  getType(): string;
}
