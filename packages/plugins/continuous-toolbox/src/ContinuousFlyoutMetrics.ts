/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import type {ContinuousFlyout} from './ContinuousFlyout';

/** Adds additional padding to the bottom of the flyout if needed. */
export class ContinuousFlyoutMetrics extends Blockly.FlyoutMetricsManager {
  /**
   * Returns the metrics for the scroll area of the continuous flyout's
   * workspace. Adds additional padding to the bottom of the flyout if needed in
   * order to make it possible  to scroll to the top of the last category.
   *
   * @param getWorkspaceCoordinates True to get the scroll metrics in
   *     workspace coordinates, false to get them in pixel coordinates.
   * @param cachedViewMetrics The view metrics if they have been previously
   *     computed.
   * @param cachedContentMetrics The content metrics if they have been
   *     previously computed.
   * @returns The metrics for the scroll container.
   */
  override getScrollMetrics(
    getWorkspaceCoordinates?: boolean,
    cachedViewMetrics?: Blockly.MetricsManager.ContainerRegion,
    cachedContentMetrics?: Blockly.MetricsManager.ContainerRegion,
  ) {
    const scrollMetrics = super.getScrollMetrics(
      getWorkspaceCoordinates,
      cachedViewMetrics,
      cachedContentMetrics,
    );
    const contentMetrics =
      cachedContentMetrics || this.getContentMetrics(getWorkspaceCoordinates);
    const viewMetrics =
      cachedViewMetrics || this.getViewMetrics(getWorkspaceCoordinates);

    if (scrollMetrics) {
      scrollMetrics.height += (
        this.flyout_ as ContinuousFlyout
      ).calculateBottomPadding(contentMetrics, viewMetrics);
    }
    return scrollMetrics;
  }
}
