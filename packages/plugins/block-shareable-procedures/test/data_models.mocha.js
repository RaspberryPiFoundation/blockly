/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

const chai = require('chai');
const sinon = require('sinon');
const assert = chai.assert;
const eventTestHelpers = require('./event_test_helpers');
const Blockly = require('blockly');
const {ObservableProcedureModel} = require('../src/observable_procedure_model');
const {ObservableParameterModel} = require('../src/observable_parameter_model');
const {ProcedureCreate} = require('../src/events_procedure_create');
const {ProcedureDelete} = require('../src/events_procedure_delete');
const {ProcedureRename} = require('../src/events_procedure_rename');
const {
  ProcedureChangeReturn,
} = require('../src/events_procedure_change_return');
const {ProcedureEnable} = require('../src/events_procedure_enable');
const {
  ProcedureParameterCreate,
} = require('../src/events_procedure_parameter_create');
const {
  ProcedureParameterDelete,
} = require('../src/events_procedure_parameter_delete');
const {
  ProcedureParameterRename,
} = require('../src/events_procedure_parameter_rename');

suite('Procedure data models', function () {
  setup(function () {
    this.workspace = new Blockly.Workspace();
    this.procedureMap = this.workspace.getProcedureMap();
    this.sandbox = sinon.createSandbox();
    this.clock = this.sandbox.useFakeTimers();
  });

  teardown(function () {
    this.workspace.dispose();
    this.clock.runAll();
    this.sandbox.restore();
  });

  suite('triggering block updates', function () {
    setup(function () {
      Blockly.Blocks['procedure_mock'] = {
        init: function () {},
        doProcedureUpdate: function () {},
        getProcedureModel: function () {},
        isProcedureDef: function () {},
      };

      this.procedureBlock = this.workspace.newBlock('procedure_mock');

      this.updateSpy = this.sandbox.spy(
        this.procedureBlock,
        'doProcedureUpdate',
      );
    });

    teardown(function () {
      delete Blockly.Blocks['procedure_mock'];
    });

    suite('procedure map updates', function () {
      test('inserting a procedure does not trigger an update', function () {
        const procedureModel = new ObservableProcedureModel(
          this.workspace,
          'test name',
        );
        this.procedureMap.set(procedureModel.getId(), procedureModel);

        chai.assert.isFalse(
          this.updateSpy.called,
          'Expected no update to be triggered',
        );
      });

      test('adding a procedure does not trigger an update', function () {
        this.procedureMap.add(
          new ObservableProcedureModel(this.workspace, 'test name'),
        );

        chai.assert.isFalse(
          this.updateSpy.called,
          'Expected no update to be triggered',
        );
      });

      test('deleting a procedure triggers an update', function () {
        const procedureModel = new ObservableProcedureModel(
          this.workspace,
          'test name',
        );
        this.procedureMap.add(procedureModel);

        this.procedureMap.delete(procedureModel.getId());

        chai.assert.isTrue(
          this.updateSpy.calledOnce,
          'Expected an update to be triggered',
        );
      });
    });

    suite('procedure model updates', function () {
      test('setting the name triggers an update', function () {
        const procedureModel = new ObservableProcedureModel(
          this.workspace,
          'test name',
        );
        this.procedureMap.add(procedureModel);

        procedureModel.setName('new name');

        assert.isTrue(
          this.updateSpy.calledOnce,
          'Expected an update to be triggered',
        );
      });

      test('setting the return type triggers an update', function () {
        const procedureModel = new ObservableProcedureModel(
          this.workspace,
          'test name',
        );
        this.procedureMap.add(procedureModel);

        procedureModel.setReturnTypes([]);

        assert.isTrue(
          this.updateSpy.calledOnce,
          'Expected an update to be triggered',
        );
      });

      test('removing the return type triggers an update', function () {
        const procedureModel = new ObservableProcedureModel(
          this.workspace,
          'test name',
        ).setReturnTypes([]);
        this.procedureMap.add(procedureModel);
        this.updateSpy.resetHistory();

        procedureModel.setReturnTypes(null);

        assert.isTrue(
          this.updateSpy.calledOnce,
          'Expected an update to be triggered',
        );
      });

      test('disabling the procedure triggers an update', function () {
        const procedureModel = new ObservableProcedureModel(
          this.workspace,
          'test name',
        );
        this.procedureMap.add(procedureModel);

        procedureModel.setEnabled(false);

        assert.isTrue(
          this.updateSpy.calledOnce,
          'Expected an update to be triggered',
        );
      });

      test('enabling the procedure triggers an update', function () {
        const procedureModel = new ObservableProcedureModel(
          this.workspace,
          'test name',
        ).setEnabled(false);
        this.procedureMap.add(procedureModel);
        this.updateSpy.resetHistory();

        procedureModel.setEnabled(true);

        assert.isTrue(
          this.updateSpy.calledOnce,
          'Expected an update to be triggered',
        );
      });

      test('inserting a parameter triggers an update', function () {
        const procedureModel = new ObservableProcedureModel(
          this.workspace,
          'test name',
        );
        this.procedureMap.add(procedureModel);

        procedureModel.insertParameter(
          new ObservableParameterModel(this.workspace, ''),
          0,
        );

        assert.isTrue(
          this.updateSpy.calledOnce,
          'Expected an update to be triggered',
        );
      });

      test('deleting a parameter triggers an update', function () {
        const procedureModel = new ObservableProcedureModel(
          this.workspace,
          'test name',
        ).insertParameter(new ObservableParameterModel(this.workspace, ''), 0);
        this.procedureMap.add(procedureModel);
        this.updateSpy.resetHistory();

        procedureModel.deleteParameter(0);

        assert.isTrue(
          this.updateSpy.calledOnce,
          'Expected an update to be triggered',
        );
      });
    });

    suite('parameter model updates', function () {
      test('setting the name triggers an update', function () {
        const parameterModel = new ObservableParameterModel(
          this.workspace,
          'test1',
        );
        this.procedureMap.add(
          new ObservableProcedureModel(
            this.workspace,
            'test name',
          ).insertParameter(parameterModel, 0),
        );
        this.updateSpy.resetHistory();

        parameterModel.setName('test2');

        chai.assert.isTrue(
          this.updateSpy.calledOnce,
          'Expected an update to be triggered',
        );
      });
    });
  });

  suite('firing events', function () {
    setup(function () {
      this.eventSpy = this.sandbox.spy();
      this.spyData = this.workspace.addChangeListener(this.eventSpy);
    });

    teardown(function () {
      this.workspace.removeChangeListener(this.spyData);
    });

    suite('procedure model creation and destruction', function () {
      test('inserting a procedure model fires a create event', function () {
        const procedure = new ObservableProcedureModel(this.workspace, 'proc');
        this.procedureMap.add(procedure);
        this.clock.runAll();

        eventTestHelpers.assertEventFiredShallow(
          this.eventSpy,
          ProcedureCreate,
          {procedure},
          this.workspace.id,
        );
      });

      test('removing a procedure model fires a delete event', function () {
        const procedure = new ObservableProcedureModel(this.workspace, 'proc');
        this.procedureMap.add(procedure);
        this.clock.runAll();

        this.eventSpy.resetHistory();
        this.procedureMap.delete(procedure.getId());
        this.clock.runAll();

        eventTestHelpers.assertEventFiredShallow(
          this.eventSpy,
          ProcedureDelete,
          {procedure},
          this.workspace.id,
        );
      });
    });

    suite('procedure model changes', function () {
      test('setting the name fires a rename event', function () {
        const procedure = new ObservableProcedureModel(
          this.workspace,
          'old name',
        );
        this.procedureMap.add(procedure);
        this.clock.runAll();

        this.eventSpy.resetHistory();
        procedure.setName('new name');
        this.clock.runAll();

        eventTestHelpers.assertEventFiredShallow(
          this.eventSpy,
          ProcedureRename,
          {
            procedure,
            oldName: 'old name',
            newName: 'new name',
          },
          this.workspace.id,
        );
      });

      test('setting the return type fires a change return event', function () {
        const procedure = new ObservableProcedureModel(
          this.workspace,
          'old name',
        ).setReturnTypes(null);
        this.procedureMap.add(procedure);
        this.clock.runAll();

        this.eventSpy.resetHistory();
        const newTypes = [];
        procedure.setReturnTypes(newTypes);
        this.clock.runAll();

        eventTestHelpers.assertEventFiredShallow(
          this.eventSpy,
          ProcedureChangeReturn,
          {
            procedure,
            oldTypes: null,
            newTypes,
          },
          this.workspace.id,
        );
      });

      test('removing the return type fires a change return event', function () {
        const oldTypes = [];
        const procedure = new ObservableProcedureModel(
          this.workspace,
          'old name',
        ).setReturnTypes(oldTypes);
        this.procedureMap.add(procedure);
        this.clock.runAll();

        this.eventSpy.resetHistory();
        procedure.setReturnTypes(null);
        this.clock.runAll();

        eventTestHelpers.assertEventFiredShallow(
          this.eventSpy,
          ProcedureChangeReturn,
          {
            procedure,
            oldTypes,
            newTypes: null,
          },
          this.workspace.id,
        );
      });

      test('disabling the procedure fires an enable event', function () {
        const procedure = new ObservableProcedureModel(
          this.workspace,
          'old name',
        ).setEnabled(true);
        this.procedureMap.add(procedure);
        this.clock.runAll();

        this.eventSpy.resetHistory();
        procedure.setEnabled(false);
        this.clock.runAll();

        eventTestHelpers.assertEventFiredShallow(
          this.eventSpy,
          ProcedureEnable,
          {
            procedure,
            oldState: true,
            newState: false,
          },
          this.workspace.id,
        );
      });

      test('enabling the procedure fires an enable event', function () {
        const procedure = new ObservableProcedureModel(
          this.workspace,
          'old name',
        ).setEnabled(false);
        this.procedureMap.add(procedure);
        this.clock.runAll();

        this.eventSpy.resetHistory();
        procedure.setEnabled(true);
        this.clock.runAll();

        eventTestHelpers.assertEventFiredShallow(
          this.eventSpy,
          ProcedureEnable,
          {
            procedure,
            oldState: false,
            newState: true,
          },
          this.workspace.id,
        );
      });

      test('inserting a parameter fires a parameter create event', function () {
        const procedure = new ObservableProcedureModel(
          this.workspace,
          'old name',
        );
        this.procedureMap.add(procedure);
        this.clock.runAll();
        const parameter = new ObservableParameterModel(this.workspace, 'param');

        this.eventSpy.resetHistory();
        procedure.insertParameter(parameter, 0);
        this.clock.runAll();

        eventTestHelpers.assertEventFiredShallow(
          this.eventSpy,
          ProcedureParameterCreate,
          {
            procedure,
            parameter,
            index: 0,
          },
          this.workspace.id,
        );
      });

      test('deleting a parameter fires a parameter delete event', function () {
        const parameter = new ObservableParameterModel(this.workspace, 'param');
        const procedure = new ObservableProcedureModel(
          this.workspace,
          'old name',
        ).insertParameter(parameter, 0);
        this.procedureMap.add(procedure);
        this.clock.runAll();

        this.eventSpy.resetHistory();
        procedure.deleteParameter(0);
        this.clock.runAll();

        eventTestHelpers.assertEventFiredShallow(
          this.eventSpy,
          ProcedureParameterDelete,
          {
            procedure,
            parameter,
            index: 0,
          },
          this.workspace.id,
        );
      });
    });

    suite('parameter model changes', function () {
      test('setting the name fires a procedure rename event', function () {
        const parameter = new ObservableParameterModel(
          this.workspace,
          'old name',
        );
        this.procedureMap.add(
          new ObservableProcedureModel(this.workspace, 'proc').insertParameter(
            parameter,
            0,
          ),
        );
        this.clock.runAll();

        this.eventSpy.resetHistory();
        parameter.setName('new name');
        this.clock.runAll();

        eventTestHelpers.assertEventFiredShallow(
          this.eventSpy,
          ProcedureParameterRename,
          {
            parameter,
            oldName: 'old name',
            newName: 'new name',
          },
          this.workspace.id,
        );
      });
    });
  });

  suite('backing variable to parameters', function () {
    test('construction references an existing variable if available', function () {
      const variable = this.workspace.getVariableMap().createVariable('test1');
      const param = new ObservableParameterModel(this.workspace, 'test1');

      chai.assert.equal(
        variable,
        param.getVariableModel(),
        'Expected the parameter model to reference the existing variable',
      );
    });

    test('construction creates a variable if none exists', function () {
      const param = new ObservableParameterModel(this.workspace, 'test1');

      chai.assert.equal(
        this.workspace.getVariableMap().getVariable('test1'),
        param.getVariableModel(),
        'Expected the parameter model to create a variable',
      );
    });

    test('setName references an existing variable if available', function () {
      const variable = this.workspace.getVariableMap().createVariable('test2');
      const param = new ObservableParameterModel(this.workspace, 'test1');

      param.setName('test2');

      chai.assert.equal(
        variable,
        param.getVariableModel(),
        'Expected the parameter model to reference the existing variable',
      );
    });

    test('setName creates a variable if none exits', function () {
      const param = new ObservableParameterModel(this.workspace, 'test1');

      param.setName('test2');

      chai.assert.equal(
        this.workspace.getVariableMap().getVariable('test2'),
        param.getVariableModel(),
        'Expected the parameter model to create a variable',
      );
    });

    test('setTypes is unimplemented', function () {
      const param = new ObservableParameterModel(this.workspace, 'test1');

      chai.assert.throws(() => {
        param.setTypes(['some', 'types']);
      }, 'The built-in ParameterModel does not support typing');
    });
  });
});
