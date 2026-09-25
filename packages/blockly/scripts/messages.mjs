/**
 * @license
 * Copyright 2026 Raspberry Pi Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Functions for generating message files
 */

import {execSync} from 'child_process';
import * as path from 'path';

import {PYTHON} from './build_constants.mjs';

/**
 * This task regenerates msg/json/en.js and msg/json/qqq.js from
 * msg/messages.js.
 */
export function messages() {
  // Run js_to_json.py
  const jsToJsonCmd = `${PYTHON} scripts/i18n/js_to_json.py \
      --input_file ${path.join('msg', 'messages.js')} \
      --output_dir ${path.join('msg', 'json')} \
      --quiet`;
  execSync(jsToJsonCmd, {stdio: 'inherit'});

  console.log(`
Regenerated several flies in msg/json/.  Now run

    git diff msg/json/*.json

and check that operation has not overwritten any modifications made to
hints, etc. by the TranslateWiki volunteers.  If it has, backport
their changes to msg/messages.js and re-run 'npm run messages'.

Once you are satisfied that any new hints have been backported you may
go ahead and commit the changes, but note that the messages script
will have removed the translator credits - be careful not to commit
this removal!
`);
}

messages();
