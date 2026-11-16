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
const {
  ProcedureChangeReturn,
} = require('../src/events_procedure_change_return');

suite('Procedure Change Return Event', function () {
  const DEFAULT_TYPES = null;
  const NON_DEFAULT_TYPES = [];

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
        const event = new ProcedureChangeReturn(
          this.workspace,
          procedureModel,
          procedureModel.getReturnTypes() === DEFAULT_TYPES
            ? NON_DEFAULT_TYPES
            : DEFAULT_TYPES,
        );
        return event;
      };
    });

    suite('forward (redo)', function () {
      test('the procedure with the matching ID has its return set', function () {
        const initial = this.createProcedureModel('test id');
        const final = this.createProcedureModel('test id');
        final.setReturnTypes(NON_DEFAULT_TYPES);
        const event = this.createEventToState(final);
        this.procedureMap.add(initial);

        event.run(/* forward= */ true);
        this.clock.runAll();

        assert.equal(
          initial.getReturnTypes(),
          final.getReturnTypes(),
          "Expected the procedure's return type to be toggled",
        );
      });

      test('one changing the return fires a change return event', function () {
        const initial = this.createProcedureModel('test id');
        const final = this.createProcedureModel('test id');
        final.setReturnTypes(NON_DEFAULT_TYPES);
        const event = this.createEventToState(final);
        this.procedureMap.add(initial);

        this.eventSpy.resetHistory();
        event.run(/* forward= */ true);
        this.clock.runAll();

        eventTestHelpers.assertEventFiredShallow(
          this.eventSpy,
          ProcedureChangeReturn,
          {
            procedure: initial,
            oldTypes: DEFAULT_TYPES,
          },
          this.workspace.id,
        );
      });

      test('noop return changes do not fire change return events', function () {
        const initial = this.createProcedureModel('test id');
        const final = this.createProcedureModel('test id');
        const event = this.createEventToState(final);
        this.procedureMap.add(initial);

        this.eventSpy.resetHistory();
        event.run(/* forward= */ true);
        this.clock.runAll();

        testHelpers.assertEventNotFired(
          this.eventSpy,
          ProcedureChangeReturn,
          {},
          this.workspace.id,
        );
      });

      test(
        'attempting to change the return of a procedure that ' +
          'does not exist in the map throws',
        function () {
          const final = this.createProcedureModel('test id');
          const event = this.createEventToState(final);

          assert.throws(() => {
            event.run(/* forward= */ true);
          });
        },
      );
    });

    suite('backward (undo)', function () {
      test('the procedure with the matching ID has its return set', function () {
        const initial = this.createProcedureModel('test id');
        const undoable = this.createProcedureModel('test id');
        initial.setReturnTypes(NON_DEFAULT_TYPES);
        undoable.setReturnTypes(NON_DEFAULT_TYPES);
        const event = this.createEventToState(undoable);
        this.procedureMap.add(initial);

        event.run(/* forward= */ false);
        this.clock.runAll();

        assert.equal(
          initial.getReturnTypes(),
          DEFAULT_TYPES,
          "Expected the procedure's return type to be toggled",
        );
      });

      test('changing the return fires a change return event', function () {
        const initial = this.createProcedureModel('test id');
        const undoable = this.createProcedureModel('test id');
        initial.setReturnTypes(NON_DEFAULT_TYPES);
        undoable.setReturnTypes(NON_DEFAULT_TYPES);
        const event = this.createEventToState(undoable);
        this.procedureMap.add(initial);

        this.eventSpy.resetHistory();
        event.run(/* forward= */ false);
        this.clock.runAll();

        eventTestHelpers.assertEventFiredShallow(
          this.eventSpy,
          ProcedureChangeReturn,
          {
            procedure: initial,
            oldTypes: NON_DEFAULT_TYPES,
          },
          this.workspace.id,
        );
      });

      test('noop return changes do not fire change return events', function () {
        const initial = this.createProcedureModel('test id');
        const undoable = this.createProcedureModel('test id');
        undoable.setReturnTypes(NON_DEFAULT_TYPES);
        const event = this.createEventToState(undoable);
        this.procedureMap.add(initial);

        this.eventSpy.resetHistory();
        event.run(/* forward= */ false);
        this.clock.runAll();

        testHelpers.assertEventNotFired(
          this.eventSpy,
          ProcedureChangeReturn,
          {},
          this.workspace.id,
        );
      });

      test(
        'attempting to change the return of a procedure that ' +
          'does not exist throws',
        function () {
          const initial = this.createProcedureModel('test id');
          const undoable = this.createProcedureModel('test id');
          initial.setReturnTypes(NON_DEFAULT_TYPES);
          undoable.setReturnTypes(NON_DEFAULT_TYPES);
          const event = this.createEventToState(undoable);

          assert.throws(() => {
            event.run(/* forward= */ false);
          });
        },
      );
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
      const origEvent = new ProcedureChangeReturn(
        this.workspace,
        model,
        NON_DEFAULT_TYPES,
      );

      const json = origEvent.toJson();
      const newEvent = Blockly.Events.fromJson(json, this.workspace);

      assert.deepEqual(newEvent, origEvent);
    });
  });
});
