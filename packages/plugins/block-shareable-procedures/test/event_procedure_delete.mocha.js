/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

const chai = require('chai');
const sinon = require('sinon');
const assert = chai.assert;
const Blockly = require('blockly');
const eventTestHelpers = require('./event_test_helpers');
const {testHelpers} = require('@blockly/dev-tools');
const {ObservableProcedureModel} = require('../src/observable_procedure_model');
const {ProcedureDelete} = require('../src/events_procedure_delete');
const {ProcedureCreate} = require('../src/events_procedure_create');

suite('Procedure Delete Event', function () {
  setup(function () {
    this.sandbox = sinon.createSandbox();
    this.clock = this.sandbox.useFakeTimers();
    this.workspace = new Blockly.Workspace();
    this.procedureMap = this.workspace.getProcedureMap();
    this.eventSpy = sinon.spy();
    this.workspace.addChangeListener(this.eventSpy);
  });

  teardown(function () {
    this.sandbox.restore();
  });

  suite('running', function () {
    setup(function () {
      this.createProcedureModel = (name, id) => {
        return new ObservableProcedureModel(this.workspace, name, id);
      };

      this.createEventToState = (procedureModel) => {
        return new ProcedureDelete(this.workspace, procedureModel);
      };
    });

    suite('forward', function () {
      test('a procedure model is deleted if a model with a matching ID exists', function () {
        const model = this.createProcedureModel('test name', 'test id');
        const event = this.createEventToState(model);
        this.procedureMap.add(model);

        event.run(/* forward= */ true);
        this.clock.runAll();

        assert.isUndefined(
          this.procedureMap.get('test id'),
          'Expected the procedure to be deleted',
        );
      });

      test('deleting a model fires a delete event', function () {
        const model = this.createProcedureModel('test name', 'test id');
        const event = this.createEventToState(model);
        this.procedureMap.add(model);

        this.eventSpy.resetHistory();
        event.run(/* forward= */ true);
        this.clock.runAll();

        eventTestHelpers.assertEventFiredShallow(
          this.eventSpy,
          ProcedureDelete,
          {procedure: model},
          this.workspace.id,
        );
      });

      test('not deleting a model does not fire a delete event', function () {
        const model = this.createProcedureModel('test name', 'test id');
        const event = this.createEventToState(model);

        this.eventSpy.resetHistory();
        event.run(/* forward= */ true);
        this.clock.runAll();

        testHelpers.assertEventNotFired(
          this.eventSpy,
          ProcedureDelete,
          {},
          this.workspace.id,
        );
      });
    });

    suite('backward', function () {
      test('a procedure model is created if it does not exist', function () {
        const model = this.createProcedureModel('test name', 'test id');
        const event = this.createEventToState(model);

        event.run(/* forward= */ false);
        this.clock.runAll();

        const createdProc = this.procedureMap.get('test id');
        assert.isDefined(createdProc, 'Expected the procedure to exist');
        assert.equal(
          createdProc.getName(),
          model.getName(),
          "Expected the procedure's name to match the model",
        );
        assert.equal(
          createdProc.getId(),
          model.getId(),
          "Expected the procedure's id to match the model",
        );
      });

      test('creating a procedure model fires a create event', function () {
        const model = this.createProcedureModel('test name', 'test id');
        const event = this.createEventToState(model);

        this.eventSpy.resetHistory();
        event.run(/* forward= */ false);
        this.clock.runAll();

        eventTestHelpers.assertEventFiredShallow(
          this.eventSpy,
          ProcedureCreate,
          {procedure: this.procedureMap.get('test id')},
          this.workspace.id,
        );
      });

      test(
        'a procedure model is not created if a model with a ' +
          'matching ID exists',
        function () {
          const model = this.createProcedureModel('test name', 'test id');
          const event = this.createEventToState(model);
          this.procedureMap.add(model);

          event.run(/* forward= */ false);
          this.clock.runAll();

          assert.equal(
            this.procedureMap.get('test id'),
            model,
            'Expected the model in the procedure map to be the same ' +
              'as the original model',
          );
        },
      );

      test('not creating a model does not fire a create event', function () {
        const model = this.createProcedureModel('test name', 'test id');
        const event = this.createEventToState(model);
        this.procedureMap.add(model);

        this.clock.runAll();
        this.eventSpy.resetHistory();
        event.run(/* forward= */ false);
        this.clock.runAll();

        testHelpers.assertEventNotFired(
          this.eventSpy,
          ProcedureCreate,
          {},
          this.workspace.id,
        );
      });
    });
  });

  suite('serialization', function () {
    test('events round-trip through JSON', function () {
      const model = new ObservableProcedureModel(
        this.workspace,
        'test name',
        'test id',
      );
      this.procedureMap.add(model);
      const origEvent = new ProcedureDelete(this.workspace, model);

      const json = origEvent.toJson();
      const newEvent = Blockly.Events.fromJson(json, this.workspace);

      assert.deepEqual(newEvent, origEvent);
    });
  });
});
