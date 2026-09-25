/**
 * @license
 * Copyright 2026 Raspberry Pi Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Script to clean the workspace of old build/package/etc. files.
 */

import {cleanBuildDir, cleanReleaseDir} from './lib/fs_utils.mjs';

await cleanBuildDir();
await cleanReleaseDir();
