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
const {ProcedureEnable} = require('../src/events_procedure_enable');

suite('Procedure Enable Event', function () {
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
      this.createProcedureModel = (id) => {
        return new ObservableProcedureModel(this.workspace, 'test name', id);
      };

      this.createEventToState = (procedureModel) => {
        return new ProcedureEnable(this.workspace, procedureModel);
      };
    });

    suite('forward', function () {
      test('the procedure with the matching ID is toggled', function () {
        const initial = this.createProcedureModel('test id');
        const final = this.createProcedureModel('test id');
        final.setEnabled(!final.getEnabled()); // Set it to the non-default.
        const event = this.createEventToState(final);
        this.procedureMap.add(initial);

        event.run(/* forward= */ true);
        this.clock.runAll();

        assert.equal(
          initial.getEnabled(),
          final.getEnabled(),
          "Expected the procedure's enabled state to be flipped",
        );
      });

      test('toggling a procedure fires an enable event', function () {
        const initial = this.createProcedureModel('test id');
        const final = this.createProcedureModel('test id');
        final.setEnabled(!final.getEnabled()); // Set it to the non-default.
        const event = this.createEventToState(final);
        this.procedureMap.add(initial);

        this.eventSpy.resetHistory();
        event.run(/* forward= */ true);
        this.clock.runAll();

        eventTestHelpers.assertEventFiredShallow(
          this.eventSpy,
          ProcedureEnable,
          {procedure: initial},
          this.workspace.id,
        );
      });

      test('noop toggles do not fire enable events', function () {
        const initial = this.createProcedureModel('test id');
        const final = this.createProcedureModel('test id');
        const event = this.createEventToState(final);
        this.procedureMap.add(initial);

        this.eventSpy.resetHistory();
        event.run(/* forward= */ true);
        this.clock.runAll();

        testHelpers.assertEventNotFired(
          this.eventSpy,
          ProcedureEnable,
          this.workspace.id,
        );
      });

      test('attempting to toggle a procedure that does not exist throws', function () {
        const final = this.createProcedureModel('test id');
        final.setEnabled(!final.getEnabled()); // Set it to the non-default.
        const event = this.createEventToState(final);

        assert.throws(() => {
          event.run(/* forward= */ true);
        });
      });

      test('deserializing the event and running it triggers the effect', function () {
        const initial = this.createProcedureModel('test id');
        const final = this.createProcedureModel('test id');
        final.setEnabled(!final.getEnabled()); // Set it to the non-default.
        const event = this.createEventToState(final);
        this.procedureMap.add(initial);

        const newEvent = Blockly.Events.fromJson(
          event.toJson(),
          this.workspace,
        );
        newEvent.run(/* forward= */ true);
        this.clock.runAll();

        assert.equal(
          initial.getEnabled(),
          final.getEnabled(),
          "Expected the procedure's enabled state to be flipped",
        );
      });
    });

    suite('backward', function () {
      test('the procedure with the matching ID is toggled', function () {
        const initial = this.createProcedureModel('test id');
        const undoable = this.createProcedureModel('test id');
        // Set them to be non-default.
        const defaultEnabled = initial.getEnabled();
        initial.setEnabled(!defaultEnabled);
        undoable.setEnabled(!defaultEnabled);
        const event = this.createEventToState(undoable);
        this.procedureMap.add(initial);

        event.run(/* forward= */ false);
        this.clock.runAll();

        assert.equal(
          initial.getEnabled(),
          defaultEnabled,
          "Expected the procedure's enabled state to be flipped",
        );
      });

      test('toggling a procedure fires an enable event', function () {
        const initial = this.createProcedureModel('test id');
        const undoable = this.createProcedureModel('test id');
        // Set them to be non-default.
        const defaultEnabled = initial.getEnabled();
        initial.setEnabled(!defaultEnabled);
        undoable.setEnabled(!defaultEnabled);
        const event = this.createEventToState(undoable);
        this.procedureMap.add(initial);

        this.eventSpy.resetHistory();
        event.run(/* forward= */ false);
        this.clock.runAll();

        eventTestHelpers.assertEventFiredShallow(
          this.eventSpy,
          ProcedureEnable,
          {procedure: initial},
          this.workspace.id,
        );
      });

      test('noop toggles do not fire enable events', function () {
        const initial = this.createProcedureModel('test id');
        const undoable = this.createProcedureModel('test id');
        // Set them to be non-default.
        const defaultEnabled = initial.getEnabled();
        undoable.setEnabled(!defaultEnabled);
        const event = this.createEventToState(undoable);
        this.procedureMap.add(initial);

        this.eventSpy.resetHistory();
        event.run(/* forward= */ false);
        this.clock.runAll();

        testHelpers.assertEventNotFired(
          this.eventSpy,
          ProcedureEnable,
          {},
          this.workspace.id,
        );
      });

      test('attempting to toggle a procedure that does not exist throws', function () {
        const initial = this.createProcedureModel('test id');
        const undoable = this.createProcedureModel('test id');
        // Set them to be non-default.
        const defaultEnabled = initial.getEnabled();
        initial.setEnabled(!defaultEnabled);
        undoable.setEnabled(!defaultEnabled);
        const event = this.createEventToState(undoable);

        assert.throws(() => {
          event.run(/* forward= */ false);
        });
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
      const origEvent = new ProcedureEnable(this.workspace, model);

      const json = origEvent.toJson();
      const newEvent = Blockly.Events.fromJson(json, this.workspace);

      assert.deepEqual(newEvent, origEvent);
    });
  });
});
