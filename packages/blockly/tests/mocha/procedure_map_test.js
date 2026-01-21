/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {assert} from '../../node_modules/chai/index.js';
import {MockProcedureModel} from './test_helpers/procedures.js';
import {
  sharedTestSetup,
  sharedTestTeardown,
} from './test_helpers/setup_teardown.js';

suite('Procedure Map', function () {
  setup(function () {
    sharedTestSetup.call(this);
    this.workspace = new Blockly.Workspace();
    this.procedureMap = this.workspace.getProcedureMap();
  });

  teardown(function () {
    sharedTestTeardown.call(this);
  });

  suite('publishing', function () {
    test('inserting a procedure tells it to start publishing', function () {
      const procedureModel = new MockProcedureModel();
      const spy = sinon.spy(procedureModel, 'startPublishing');
      this.procedureMap.set(procedureModel.getId(), procedureModel);

      assert.isTrue(spy.called, 'Expected the model to start publishing');
    });

    test('adding a procedure tells it to start publishing', function () {
      const procedureModel = new MockProcedureModel();
      const spy = sinon.spy(procedureModel, 'startPublishing');
      this.procedureMap.add(procedureModel);

      assert.isTrue(spy.called, 'Expected the model to start publishing');
    });

    test('deleting a procedure tells it to stop publishing', function () {
      const procedureModel = new MockProcedureModel();
      const spy = sinon.spy(procedureModel, 'stopPublishing');
      this.procedureMap.add(procedureModel);

      this.procedureMap.delete(procedureModel.getId());

      assert.isTrue(spy.calledOnce, 'Expected the model stop publishing');
    });
  });
});
