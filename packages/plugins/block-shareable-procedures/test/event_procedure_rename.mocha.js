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
const {ProcedureRename} = require('../src/events_procedure_rename');

suite('Procedure Rename Event', function () {
  const DEFAULT_NAME = 'default';
  const NON_DEFAULT_NAME = 'non-default';

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
        return new ObservableProcedureModel(this.workspace, DEFAULT_NAME, id);
      };

      this.createEventToState = (procedureModel) => {
        return new ProcedureRename(
          this.workspace,
          procedureModel,
          procedureModel.getName() === DEFAULT_NAME
            ? NON_DEFAULT_NAME
            : DEFAULT_NAME,
        );
      };
    });

    suite('forward', function () {
      test('the procedure with the matching ID is renamed', function () {
        const initial = this.createProcedureModel('test id');
        const final = this.createProcedureModel('test id');
        final.setName(NON_DEFAULT_NAME);
        const event = this.createEventToState(final);
        this.procedureMap.add(initial);

        event.run(/* forward= */ true);
        this.clock.runAll();

        assert.equal(
          initial.getName(),
          final.getName(),
          "Expected the procedure's name to be changed",
        );
      });

      test('renaming a procedure fires a rename event', function () {
        const initial = this.createProcedureModel('test id');
        const final = this.createProcedureModel('test id');
        final.setName(NON_DEFAULT_NAME);
        const event = this.createEventToState(final);
        this.procedureMap.add(initial);

        event.run(/* forward= */ true);
        this.clock.runAll();

        eventTestHelpers.assertEventFiredShallow(
          this.eventSpy,
          ProcedureRename,
          {procedure: initial, oldName: DEFAULT_NAME},
          this.workspace.id,
        );
      });

      test('noop renames do not fire rename events', function () {
        const initial = this.createProcedureModel('test id');
        const final = this.createProcedureModel('test id');
        const event = this.createEventToState(final);
        this.procedureMap.add(initial);

        event.run(/* forward= */ true);
        this.clock.runAll();

        testHelpers.assertEventNotFired(
          this.eventSpy,
          ProcedureRename,
          {},
          this.workspace.id,
        );
      });

      test('attempting to rename a procedure that does not exist throws', function () {
        const final = this.createProcedureModel('test id');
        final.setName(NON_DEFAULT_NAME);
        const event = this.createEventToState(final);

        assert.throws(() => {
          event.run(/* forward= */ true);
        });
      });

      test(
        'attempting to rename a procedure with a different old name ' +
          'does not work',
        function () {
          const otherNonDefaultName = 'other non-default name';
          const final =
            this.createProcedureModel('test id').setName(NON_DEFAULT_NAME);
          const event = this.createEventToState(final);
          const testModel =
            this.createProcedureModel('test id').setName(otherNonDefaultName);
          this.procedureMap.add(testModel);

          event.run(/* forward= */ true);
          this.clock.runAll();

          assert.equal(
            testModel.getName(),
            otherNonDefaultName,
            "Expected the procedure's name to be unchanged",
          );
        },
      );

      test('deserializing the event and running it triggers the effect', function () {
        const initial = this.createProcedureModel('test id');
        const final = this.createProcedureModel('test id');
        final.setName(NON_DEFAULT_NAME);
        const event = this.createEventToState(final);
        this.procedureMap.add(initial);

        const newEvent = Blockly.Events.fromJson(
          event.toJson(),
          this.workspace,
        );
        newEvent.run(/* forward= */ true);
        this.clock.runAll();

        assert.equal(
          initial.getName(),
          final.getName(),
          "Expected the procedure's name to be changed",
        );
      });
    });

    suite('backward', function () {
      test('the procedure with the matching ID is renamed', function () {
        const initial = this.createProcedureModel('test id');
        const undoable = this.createProcedureModel('test id');
        initial.setName(NON_DEFAULT_NAME);
        undoable.setName(NON_DEFAULT_NAME);
        const event = this.createEventToState(undoable);
        this.procedureMap.add(initial);

        event.run(/* forward= */ false);
        this.clock.runAll();

        assert.equal(
          initial.getName(),
          DEFAULT_NAME,
          "Expected the procedure's name to be changed",
        );
      });

      test('renaming a procedure fires a rename event', function () {
        const initial = this.createProcedureModel('test id');
        const undoable = this.createProcedureModel('test id');
        initial.setName(NON_DEFAULT_NAME);
        undoable.setName(NON_DEFAULT_NAME);
        const event = this.createEventToState(undoable);
        this.procedureMap.add(initial);

        event.run(/* forward= */ false);
        this.clock.runAll();

        eventTestHelpers.assertEventFiredShallow(
          this.eventSpy,
          ProcedureRename,
          {procedure: initial, oldName: NON_DEFAULT_NAME},
          this.workspace.id,
        );
      });

      test('noop renames do not fire rename events', function () {
        const initial = this.createProcedureModel('test id');
        const undoable = this.createProcedureModel('test id');
        initial.setName(NON_DEFAULT_NAME);
        const event = this.createEventToState(undoable);
        this.procedureMap.add(initial);

        event.run(/* forward= */ false);
        this.clock.runAll();

        testHelpers.assertEventNotFired(
          this.eventSpy,
          ProcedureRename,
          {},
          this.workspace.id,
        );
      });

      test('attempting to rename a procedure that does not exist throws', function () {
        const undoable = this.createProcedureModel('test id');
        undoable.setName(NON_DEFAULT_NAME);
        const event = this.createEventToState(undoable);

        assert.throws(() => {
          event.run(/* forward= */ false);
        });
      });

      test(
        'attempting to rename a procedure with a different new name ' +
          'does not work',
        function () {
          const otherNonDefaultName = 'other non-default name';
          const undoable = this.createProcedureModel('test id');
          const event = this.createEventToState(undoable);
          const testModel =
            this.createProcedureModel('test id').setName(otherNonDefaultName);
          this.procedureMap.add(testModel);

          event.run(/* forward= */ false);
          this.clock.runAll();

          assert.equal(
            testModel.getName(),
            otherNonDefaultName,
            "Expected the procedure's name to be unchanged",
          );
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
      const origEvent = new ProcedureRename(
        this.workspace,
        model,
        NON_DEFAULT_NAME,
      );

      const json = origEvent.toJson();
      const newEvent = Blockly.Events.fromJson(json, this.workspace);

      assert.deepEqual(newEvent, origEvent);
    });
  });
});
