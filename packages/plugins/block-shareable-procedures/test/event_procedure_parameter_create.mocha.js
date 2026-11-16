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
const {ObservableParameterModel} = require('../src/observable_parameter_model');
const {
  ProcedureParameterCreate,
} = require('../src/events_procedure_parameter_create');
const {
  ProcedureParameterDelete,
} = require('../src/events_procedure_parameter_delete');

suite('Procedure Parameter Create Event', function () {
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
      this.createProcedureModel = (name, id, workspace) => {
        return new ObservableProcedureModel(
          workspace ?? this.workspace,
          name,
          id,
        );
      };

      this.createProcedureAndParameter = (
        procName,
        procId,
        paramName,
        paramId,
      ) => {
        const param = new ObservableParameterModel(
          this.workspace,
          paramName,
          paramId,
        );
        const proc = new ObservableProcedureModel(
          this.workspace,
          procName,
          procId,
        ).insertParameter(param, 0);
        return {param, proc};
      };

      this.createEventToState = (procedureModel, parameterModel) => {
        return new ProcedureParameterCreate(
          this.workspace,
          procedureModel,
          parameterModel,
          0,
        );
      };
    });

    suite('forward', function () {
      test('a parameter is inserted if it does not exist', function () {
        const {param: modelParam, proc: modelProc} =
          this.createProcedureAndParameter(
            'test name',
            'test id',
            'test param name',
            'test param id',
          );
        const event = this.createEventToState(modelProc, modelParam);
        const actualProc = this.createProcedureModel('test name', 'test id');
        this.procedureMap.add(actualProc);

        event.run(/* forward= */ true);
        this.clock.runAll();

        const createdParam = actualProc.getParameter(0);
        assert.isDefined(createdParam, 'Expected the parameter to exist');
        assert.equal(
          createdParam.getName(),
          modelParam.getName(),
          "Expected the parameter's name to match the model",
        );
        assert.equal(
          createdParam.getId(),
          modelParam.getId(),
          "Expected the parameter's id to match the model",
        );
      });

      test('inserting a parameter fires a create event', function () {
        const {param: modelParam, proc: modelProc} =
          this.createProcedureAndParameter(
            'test name',
            'test id',
            'test param name',
            'test param id',
          );
        const event = this.createEventToState(modelProc, modelParam);
        const actualProc = this.createProcedureModel('test name', 'test id');
        this.procedureMap.add(actualProc);

        this.eventSpy.resetHistory();
        event.run(/* forward= */ true);
        this.clock.runAll();

        eventTestHelpers.assertEventFiredShallow(
          this.eventSpy,
          ProcedureParameterCreate,
          {
            procedure: actualProc,
            parameter: actualProc.getParameter(0),
            index: 0,
          },
          this.workspace.id,
        );
      });

      test(
        'a parameter is not created if a parameter with a ' +
          'matching ID and index already exists',
        function () {
          const {param: modelParam, proc: modelProc} =
            this.createProcedureAndParameter(
              'test name',
              'test id',
              'test param name',
              'test param id',
            );
          const event = this.createEventToState(modelProc, modelParam);
          this.procedureMap.add(modelProc);

          this.eventSpy.resetHistory();
          event.run(/* forward= */ true);
          this.clock.runAll();

          const actualProc = this.procedureMap.get('test id');
          assert.equal(
            actualProc,
            modelProc,
            'Expected the procedure in the procedure map to not ' +
              'have changed',
          );
          assert.equal(
            actualProc.getParameter(0),
            modelParam,
            'Expected the parameter to not have changed',
          );
        },
      );

      test('not creating a parameter model does not fire a create event', function () {
        const {param: modelParam, proc: modelProc} =
          this.createProcedureAndParameter(
            'test name',
            'test id',
            'test param name',
            'test param id',
          );
        const event = this.createEventToState(modelProc, modelParam);
        this.procedureMap.add(modelProc);

        this.eventSpy.resetHistory();
        event.run(/* forward= */ true);
        this.clock.runAll();

        testHelpers.assertEventNotFired(
          this.eventSpy,
          ProcedureParameterCreate,
          {},
          this.workspace.id,
        );
      });

      test(
        'deserializing the event into a different workspace creates ' +
          'an identical parameter (including variable ID)',
        function () {
          const otherWorkspace = new Blockly.Workspace();
          const otherProcedureMap = otherWorkspace.getProcedureMap();

          const {param: modelParam, proc: modelProc} =
            this.createProcedureAndParameter(
              'test name',
              'test id',
              'test param name',
              'test param id',
            );
          const event = this.createEventToState(modelProc, modelParam);
          const actualProc = this.createProcedureModel(
            'test name',
            'test id',
            otherWorkspace,
          );
          otherProcedureMap.add(actualProc);

          const otherEvent = Blockly.Events.fromJson(
            event.toJson(),
            otherWorkspace,
          );
          otherEvent.run(/* forward= */ true);
          this.clock.runAll();

          const createdParam = actualProc.getParameter(0);
          assert.isDefined(createdParam, 'Expected the parameter to exist');
          assert.equal(
            createdParam.getName(),
            modelParam.getName(),
            "Expected the parameter's name to match the model",
          );
          assert.equal(
            createdParam.getId(),
            modelParam.getId(),
            "Expected the parameter's id to match the model",
          );
          assert.equal(
            createdParam.getVariableModel().getId(),
            modelParam.getVariableModel().getId(),
            "Expected the parameter's variable's id to match the model",
          );
        },
      );
    });

    suite('backward', function () {
      test('a parameter is removed if it exists', function () {
        const {param, proc} = this.createProcedureAndParameter(
          'test name',
          'test id',
          'test param name',
          'test param id',
        );
        const event = this.createEventToState(proc, param);
        this.procedureMap.add(proc);

        event.run(/* forward= */ false);
        this.clock.runAll();

        assert.isUndefined(
          proc.getParameter(0),
          'Expected the parameter to be deleted',
        );
      });

      test('removing a parameter fires a delete event', function () {
        const {param, proc} = this.createProcedureAndParameter(
          'test name',
          'test id',
          'test param name',
          'test param id',
        );
        const event = this.createEventToState(proc, param);
        this.procedureMap.add(proc);

        this.eventSpy.resetHistory();
        event.run(/* forward= */ false);
        this.clock.runAll();

        eventTestHelpers.assertEventFiredShallow(
          this.eventSpy,
          ProcedureParameterDelete,
          {
            procedure: proc,
            parameter: param,
            index: 0,
          },
          this.workspace.id,
        );
      });

      test(
        'running the event throws if a parameter with a ' +
          'matching ID and index does not exist',
        function () {
          // TODO: Figure out what we want to do in this case.
          const {param, proc} = this.createProcedureAndParameter(
            'test name',
            'test id',
            'test param name',
            'test param id',
          );
          const event = this.createEventToState(proc, param);

          this.eventSpy.resetHistory();
          chai.assert.throws(() => {
            event.run(/* forward= */ false);
          });
        },
      );

      test('not removing a parameter does not fire a delete event', function () {
        const {param, proc} = this.createProcedureAndParameter(
          'test name',
          'test id',
          'test param name',
          'test param id',
        );
        const event = this.createEventToState(proc, param);
        this.procedureMap.add(proc);
        proc.deleteParameter(0);

        this.eventSpy.resetHistory();
        event.run(/* forward= */ false);
        this.clock.runAll();

        testHelpers.assertEventNotFired(
          this.eventSpy,
          ProcedureParameterDelete,
          {},
          this.workspace.id,
        );
      });
    });
  });

  suite('serialization', function () {
    test('events round-trip through JSON', function () {
      const param = new ObservableParameterModel(
        this.workspace,
        'test param name',
        'test param id',
      );
      const model = new ObservableProcedureModel(
        this.workspace,
        'test name',
        'test id',
      );
      this.procedureMap.add(model);
      const origEvent = new ProcedureParameterCreate(
        this.workspace,
        model,
        param,
        0,
      );

      const json = origEvent.toJson();
      const newEvent = Blockly.Events.fromJson(json, this.workspace);

      assert.deepEqual(newEvent, origEvent);
    });
  });
});
