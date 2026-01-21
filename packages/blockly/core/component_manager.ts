/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Manager for all items registered with the workspace.
 *
 * @class
 */
// Former goog.module ID: Blockly.ComponentManager

import type {IAutoHideable} from './interfaces/i_autohideable.js';
import type {IComponent} from './interfaces/i_component.js';
import type {IDeleteArea} from './interfaces/i_delete_area.js';
import type {IDragTarget} from './interfaces/i_drag_target.js';
import type {IPositionable} from './interfaces/i_positionable.js';
import * as arrayUtils from './utils/array.js';

class Capability<_T> {
  static POSITIONABLE = new Capability<IPositionable>('positionable');
  static DRAG_TARGET = new Capability<IDragTarget>('drag_target');
  static DELETE_AREA = new Capability<IDeleteArea>('delete_area');
  static AUTOHIDEABLE = new Capability<IAutoHideable>('autohideable');
  private readonly name: string;
  /** @param name The name of the component capability. */
  constructor(name: string) {
    this.name = name;
  }

  /**
   * Returns the name of the capability.
   *
   * @returns The name.
   */
  toString(): string {
    return this.name;
  }
}

/**
 * Manager for all items registered with the workspace.
 */
export class ComponentManager {
  static Capability = Capability;

  /**
   * A map of the components registered with the workspace, mapped to id.
   */
  private readonly componentData = new Map<string, ComponentDatum>();

  /** A map of capabilities to component IDs. */
  private readonly capabilityToComponentIds = new Map<string, string[]>();

  /**
   * Adds a component.
   *
   * @param componentInfo The data for the component to register.
   * @param opt_allowOverrides True to prevent an error when overriding an
   *     already registered item.
   */
  addComponent(componentInfo: ComponentDatum, opt_allowOverrides?: boolean) {
    // Don't throw an error if opt_allowOverrides is true.
    const id = componentInfo.component.id;
    if (!opt_allowOverrides && this.componentData.has(id)) {
      throw Error(
        'Plugin "' +
          id +
          '" with capabilities "' +
          this.componentData.get(id)?.capabilities +
          '" already added.',
      );
    }
    this.componentData.set(id, componentInfo);
    const stringCapabilities = [];
    for (let i = 0; i < componentInfo.capabilities.length; i++) {
      const capability = String(componentInfo.capabilities[i]).toLowerCase();
      stringCapabilities.push(capability);
      if (!this.capabilityToComponentIds.has(capability)) {
        this.capabilityToComponentIds.set(capability, [id]);
      } else {
        this.capabilityToComponentIds.get(capability)?.push(id);
      }
    }
    this.componentData.get(id)!.capabilities = stringCapabilities;
  }

  /**
   * Removes a component.
   *
   * @param id The ID of the component to remove.
   */
  removeComponent(id: string) {
    const componentInfo = this.componentData.get(id);
    if (!componentInfo) {
      return;
    }
    for (let i = 0; i < componentInfo.capabilities.length; i++) {
      const capability = String(componentInfo.capabilities[i]).toLowerCase();
      arrayUtils.removeElem(this.capabilityToComponentIds.get(capability)!, id);
    }
    this.componentData.delete(id);
  }

  /**
   * Adds a capability to a existing registered component.
   *
   * @param id The ID of the component to add the capability to.
   * @param capability The capability to add.
   */
  addCapability<T>(id: string, capability: string | Capability<T>) {
    if (!this.getComponent(id)) {
      throw Error(
        'Cannot add capability, "' +
          capability +
          '". Plugin "' +
          id +
          '" has not been added to the ComponentManager',
      );
    }
    if (this.hasCapability(id, capability)) {
      console.warn(
        'Plugin "' + id + 'already has capability "' + capability + '"',
      );
      return;
    }
    capability = `${capability}`.toLowerCase();
    this.componentData.get(id)?.capabilities.push(capability);
    this.capabilityToComponentIds.get(capability)?.push(id);
  }

  /**
   * Removes a capability from an existing registered component.
   *
   * @param id The ID of the component to remove the capability from.
   * @param capability The capability to remove.
   */
  removeCapability<T>(id: string, capability: string | Capability<T>) {
    if (!this.getComponent(id)) {
      throw Error(
        'Cannot remove capability, "' +
          capability +
          '". Plugin "' +
          id +
          '" has not been added to the ComponentManager',
      );
    }
    if (!this.hasCapability(id, capability)) {
      console.warn(
        'Plugin "' +
          id +
          'doesn\'t have capability "' +
          capability +
          '" to remove',
      );
      return;
    }
    capability = `${capability}`.toLowerCase();
    arrayUtils.removeElem(this.componentData.get(id)!.capabilities, capability);
    arrayUtils.removeElem(this.capabilityToComponentIds.get(capability)!, id);
  }

  /**
   * Returns whether the component with this id has the specified capability.
   *
   * @param id The ID of the component to check.
   * @param capability The capability to check for.
   * @returns Whether the component has the capability.
   */
  hasCapability<T>(id: string, capability: string | Capability<T>): boolean {
    capability = `${capability}`.toLowerCase();
    return (
      this.componentData.has(id) &&
      this.componentData.get(id)!.capabilities.includes(capability)
    );
  }

  /**
   * Gets the component with the given ID.
   *
   * @param id The ID of the component to get.
   * @returns The component with the given name or undefined if not found.
   */
  getComponent(id: string): IComponent | undefined {
    return this.componentData.get(id)?.component;
  }

  /**
   * Gets all the components with the specified capability.
   *
   * @param capability The capability of the component.
   * @param sorted Whether to return list ordered by weights.
   * @returns The components that match the specified capability.
   */
  getComponents<T extends IComponent>(
    capability: string | Capability<T>,
    sorted: boolean,
  ): T[] {
    capability = `${capability}`.toLowerCase();
    const componentIds = this.capabilityToComponentIds.get(capability);
    if (!componentIds) {
      return [];
    }
    const components: T[] = [];
    if (sorted) {
      const componentDataList: ComponentDatum[] = [];
      componentIds.forEach((id) => {
        componentDataList.push(this.componentData.get(id)!);
      });
      componentDataList.sort(function (a, b) {
        return a.weight - b.weight;
      });
      componentDataList.forEach(function (componentDatum) {
        components.push(componentDatum.component as T);
      });
    } else {
      componentIds.forEach((id) => {
        components.push(this.componentData.get(id)!.component as T);
      });
    }
    return components;
  }
}

export namespace ComponentManager {
  export enum ComponentWeight {
    // The toolbox weight is lower (higher precedence) than the flyout, so that
    // if both are under the pointer, the toolbox takes precedence even though
    // the flyout's drag target area is large enough to include the toolbox.
    TOOLBOX_WEIGHT = 0,
    FLYOUT_WEIGHT = 1,
    TRASHCAN_WEIGHT = 2,
    ZOOM_CONTROLS_WEIGHT = 3,
  }

  /** An object storing component information. */
  export interface ComponentDatum {
    component: IComponent;
    capabilities: Array<string | Capability<IComponent>>;
    weight: number;
  }
}

export type ComponentWeight = ComponentManager.ComponentWeight;
export const ComponentWeight = ComponentManager.ComponentWeight;
export type ComponentDatum = ComponentManager.ComponentDatum;
