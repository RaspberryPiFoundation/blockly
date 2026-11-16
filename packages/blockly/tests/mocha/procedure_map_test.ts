/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from '#core/blockly.js';
import {assert} from 'chai';
import sinon from 'sinon';
import {MockProcedureModel} from './test_helpers/procedures.ts';
import {
  sharedTestSetup,
  sharedTestTeardown,
} from './test_helpers/setup_teardown.js';

suite('Procedure Map', function () {
  let workspace: Blockly.Workspace;

  setup(function (this: Mocha.Context) {
    sharedTestSetup.call(this);
    workspace = new Blockly.Workspace();
  });

  teardown(function (this: Mocha.Context) {
    sharedTestTeardown.call(this, workspace);
  });

  suite('publishing', function () {
    test('inserting a procedure tells it to start publishing', function () {
      const procedureModel = new MockProcedureModel();
      const spy = sinon.spy(procedureModel, 'startPublishing');
      workspace.getProcedureMap().set(procedureModel.getId(), procedureModel);

      assert.isTrue(spy.called, 'Expected the model to start publishing');
    });

    test('adding a procedure tells it to start publishing', function () {
      const procedureModel = new MockProcedureModel();
      const spy = sinon.spy(procedureModel, 'startPublishing');
      workspace.getProcedureMap().add(procedureModel);

      assert.isTrue(spy.called, 'Expected the model to start publishing');
    });

    test('deleting a procedure tells it to stop publishing', function () {
      const procedureModel = new MockProcedureModel();
      const spy = sinon.spy(procedureModel, 'stopPublishing');
      workspace.getProcedureMap().add(procedureModel);

      workspace.getProcedureMap().delete(procedureModel.getId());

      assert.isTrue(spy.calledOnce, 'Expected the model stop publishing');
    });
  });
});
