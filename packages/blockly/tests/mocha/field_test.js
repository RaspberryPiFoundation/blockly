/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from '../../build/src/core/blockly.js';
import {assert} from '../../node_modules/chai/index.js';
import {
  addBlockTypeToCleanup,
  addMessageToCleanup,
  sharedTestSetup,
  sharedTestTeardown,
  workspaceTeardown,
} from './test_helpers/setup_teardown.js';

suite('Abstract Fields', function () {
  setup(function () {
    sharedTestSetup.call(this);
  });

  teardown(function () {
    sharedTestTeardown.call(this);
  });

  suite('Is Serializable', function () {
    // Both EDITABLE and SERIALIZABLE are default.
    class FieldDefault extends Blockly.Field {
      constructor() {
        super();
        this.name = 'NAME';
      }
    }

    // EDITABLE is false and SERIALIZABLE is default.
    class FieldFalseDefault extends Blockly.Field {
      constructor() {
        super();
        this.name = 'NAME';
        this.EDITABLE = false;
      }
    }

    // EDITABLE is default and SERIALIZABLE is true.
    class FieldDefaultTrue extends Blockly.Field {
      constructor() {
        super();
        this.name = 'NAME';
        this.SERIALIZABLE = true;
      }
    }

    // EDITABLE is false and SERIALIZABLE is true.
    class FieldFalseTrue extends Blockly.Field {
      constructor() {
        super();
        this.name = 'NAME';
        this.EDITABLE = false;
        this.SERIALIZABLE = true;
      }
    }

    /* Test Backwards Compatibility */
    test('Editable Default(true), Serializable Default(false)', function () {
      // An old default field should be serialized.
      const field = new FieldDefault();
      const stub = sinon.stub(console, 'warn');
      assert.isTrue(field.isSerializable());
      sinon.assert.calledOnce(stub);
      stub.restore();
    });
    test('Editable False, Serializable Default(false)', function () {
      // An old non-editable field should not be serialized.
      const field = new FieldFalseDefault();
      assert.isFalse(field.isSerializable());
    });
    /* Test Other Cases */
    test('Editable Default(true), Serializable True', function () {
      // A field that is both editable and serializable should be serialized.
      const field = new FieldDefaultTrue();
      assert.isTrue(field.isSerializable());
    });
    test('Editable False, Serializable True', function () {
      // A field that is not editable, but overrides serializable to true
      // should be serialized (e.g. field_label_serializable)
      const field = new FieldFalseTrue();
      assert.isTrue(field.isSerializable());
    });
  });

  suite('Serialization', function () {
    class DefaultSerializationField extends Blockly.Field {
      constructor(value, validator = undefined, config = undefined) {
        super(value, validator, config);
        this.SERIALIZABLE = true;
      }
    }

    class CustomXmlField extends Blockly.Field {
      constructor(value, validator = undefined, config = undefined) {
        super(value, validator, config);
        this.SERIALIZABLE = true;
      }

      toXml(fieldElement) {
        fieldElement.textContent = 'custom value';
        return fieldElement;
      }

      fromXml(fieldElement) {
        this.someProperty = fieldElement.textContent;
      }
    }

    class CustomXmlCallSuperField extends Blockly.Field {
      constructor(value, validator = undefined, config = undefined) {
        super(value, validator, config);
        this.SERIALIZABLE = true;
      }

      toXml(fieldElement) {
        super.toXml(fieldElement);
        fieldElement.setAttribute('attribute', 'custom value');
        return fieldElement;
      }

      fromXml(fieldElement) {
        super.fromXml(fieldElement);
        this.someProperty = fieldElement.getAttribute('attribute');
      }
    }

    class CustomJsoField extends Blockly.Field {
      constructor(value, validator = undefined, config = undefined) {
        super(value, validator, config);
        this.SERIALIZABLE = true;
      }

      saveState() {
        return 'custom value';
      }

      loadState(state) {
        this.someProperty = state;
      }
    }

    class CustomJsoCallSuperField extends Blockly.Field {
      constructor(value, validator = undefined, config = undefined) {
        super(value, validator, config);
        this.SERIALIZABLE = true;
      }

      saveState() {
        return {
          default: super.saveState(),
          val: 'custom value',
        };
      }

      loadState(state) {
        super.loadState(state.default);
        this.someProperty = state.val;
      }
    }

    class CustomXmlAndJsoField extends Blockly.Field {
      constructor(value, validator = undefined, config = undefined) {
        super(value, validator, config);
        this.SERIALIZABLE = true;
      }

      toXml(fieldElement) {
        fieldElement.textContent = 'custom value';
        return fieldElement;
      }

      fromXml(fieldElement) {
        this.someProperty = fieldElement.textContent;
      }

      saveState() {
        return 'custom value';
      }

      loadState(state) {
        this.someProperty = state;
      }
    }

    suite('Save', function () {
      suite('JSO', function () {
        test('No implementations', function () {
          const field = new DefaultSerializationField('test value');
          const value = field.saveState();
          assert.equal(value, 'test value');
        });

        test('Xml implementations', function () {
          const field = new CustomXmlField('test value');
          const value = field.saveState();
          assert.equal(value, '<field name="">custom value</field>');
        });

        test('Xml super implementation', function () {
          const field = new CustomXmlCallSuperField('test value');
          const value = field.saveState();
          assert.equal(
            value,
            '<field name="" attribute="custom value">test value</field>',
          );
        });

        test('JSO implementations', function () {
          const field = new CustomJsoField('test value');
          const value = field.saveState();
          assert.equal(value, 'custom value');
        });

        test('JSO super implementations', function () {
          const field = new CustomJsoCallSuperField('test value');
          const value = field.saveState();
          assert.deepEqual(value, {
            default: 'test value',
            val: 'custom value',
          });
        });

        test('Xml and JSO implementations', function () {
          const field = new CustomXmlAndJsoField('test value');
          const value = field.saveState();
          assert.equal(value, 'custom value');
        });
      });

      suite('Xml', function () {
        test('No implementations', function () {
          const field = new DefaultSerializationField('test value');
          const element = document.createElement('field');
          const value = Blockly.Xml.domToText(field.toXml(element));
          assert.equal(
            value,
            '<field xmlns="http://www.w3.org/1999/xhtml">test value</field>',
          );
        });

        test('Xml implementations', function () {
          const field = new CustomXmlField('test value');
          const element = document.createElement('field');
          const value = Blockly.Xml.domToText(field.toXml(element));
          assert.equal(
            value,
            '<field xmlns="http://www.w3.org/1999/xhtml">custom value</field>',
          );
        });

        test('Xml super implementation', function () {
          const field = new CustomXmlCallSuperField('test value');
          const element = document.createElement('field');
          const value = Blockly.Xml.domToText(field.toXml(element));
          assert.equal(
            value,
            '<field xmlns="http://www.w3.org/1999/xhtml" ' +
              'attribute="custom value">test value</field>',
          );
        });

        test('Xml and JSO implementations', function () {
          const field = new CustomXmlAndJsoField('test value');
          const element = document.createElement('field');
          const value = Blockly.Xml.domToText(field.toXml(element));
          assert.equal(
            value,
            '<field xmlns="http://www.w3.org/1999/xhtml">custom value</field>',
          );
        });
      });
    });

    suite('Load', function () {
      suite('JSO', function () {
        test('No implementations', function () {
          const field = new DefaultSerializationField('');
          field.loadState('test value');
          assert.equal(field.getValue(), 'test value');
        });

        test('Xml implementations', function () {
          const field = new CustomXmlField('');
          field.loadState('<field name="">custom value</field>');
          assert.equal(field.someProperty, 'custom value');
        });

        test('Xml super implementation', function () {
          const field = new CustomXmlCallSuperField('');
          field.loadState(
            '<field attribute="custom value" name="">test value</field>',
          );
          assert.equal(field.getValue(), 'test value');
          assert.equal(field.someProperty, 'custom value');
        });

        test('JSO implementations', function () {
          const field = new CustomJsoField('');
          field.loadState('custom value');
          assert.equal(field.someProperty, 'custom value');
        });

        test('JSO super implementations', function () {
          const field = new CustomJsoCallSuperField('');
          field.loadState({default: 'test value', val: 'custom value'});
          assert.equal(field.getValue(), 'test value');
          assert.equal(field.someProperty, 'custom value');
        });

        test('Xml and JSO implementations', function () {
          const field = new CustomXmlAndJsoField('');
          field.loadState('custom value');
          assert.equal(field.someProperty, 'custom value');
        });
      });

      suite('Xml', function () {
        test('No implementations', function () {
          const field = new DefaultSerializationField('');
          field.fromXml(
            Blockly.utils.xml.textToDom('<field name="">test value</field>'),
          );
          assert.equal(field.getValue(), 'test value');
        });

        test('Xml implementations', function () {
          const field = new CustomXmlField('');
          field.fromXml(
            Blockly.utils.xml.textToDom('<field name="">custom value</field>'),
          );
          assert.equal(field.someProperty, 'custom value');
        });

        test('Xml super implementation', function () {
          const field = new CustomXmlCallSuperField('');
          field.fromXml(
            Blockly.utils.xml.textToDom(
              '<field attribute="custom value" name="">test value</field>',
            ),
          );
          assert.equal(field.getValue(), 'test value');
          assert.equal(field.someProperty, 'custom value');
        });

        test('XML andd JSO implementations', function () {
          const field = new CustomXmlAndJsoField('');
          field.fromXml(
            Blockly.utils.xml.textToDom('<field name="">custom value</field>'),
          );
          assert.equal(field.someProperty, 'custom value');
        });
      });
    });
  });

  suite('setValue', function () {
    function addSpies(field, excludeSpies = []) {
      if (!excludeSpies.includes('doValueInvalid_')) {
        sinon.spy(field, 'doValueInvalid_');
      }
      if (!excludeSpies.includes('doValueUpdate_')) {
        sinon.spy(field, 'doValueUpdate_');
      }
      if (!excludeSpies.includes('forceRerender')) {
        sinon.spy(field, 'forceRerender');
      }
    }
    function stubDoValueInvalid(field, isDirty) {
      sinon.stub(field, 'doValueInvalid_').callsFake(function (newValue) {
        this.isDirty_ = isDirty;
      });
    }
    function stubDoValueUpdate(field, isDirty) {
      sinon.stub(field, 'doValueUpdate_').callsFake(function (newValue) {
        this.isDirty_ = isDirty;
      });
    }
    function setLocalValidatorWithReturn(field, value) {
      field.setValidator(function () {
        return value;
      });
    }
    function setLocalValidator(field, isValid) {
      if (isValid) {
        field.setValidator(function (newValue) {
          return newValue;
        });
      } else {
        setLocalValidatorWithReturn(field, null);
      }
    }
    function stubClassValidatorWithReturn(field, value) {
      sinon.stub(field, 'doClassValidation_').returns(value);
    }
    function stubClassValidator(field, isValid) {
      if (isValid) {
        sinon.stub(field, 'doClassValidation_').callsFake(function (newValue) {
          return newValue;
        });
      } else {
        stubClassValidatorWithReturn(field, null);
      }
    }
    setup(function () {
      this.field = new Blockly.Field();
      this.field.isDirty_ = false;
    });
    test('Null', function () {
      addSpies(this.field);
      this.field.setValue(null);
      sinon.assert.notCalled(this.field.doValueInvalid_);
      sinon.assert.notCalled(this.field.doValueUpdate_);
      sinon.assert.notCalled(this.field.forceRerender);
    });
    test('No Validators, Dirty (Default)', function () {
      addSpies(this.field);
      this.field.setValue('value');
      sinon.assert.notCalled(this.field.doValueInvalid_);
      sinon.assert.calledOnce(this.field.doValueUpdate_);
      sinon.assert.calledOnce(this.field.forceRerender);
    });
    test('No Validators, Not Dirty', function () {
      stubDoValueUpdate(this.field, false);
      addSpies(this.field, ['doValueUpdate_']);
      this.field.setValue('value');
      sinon.assert.notCalled(this.field.doValueInvalid_);
      sinon.assert.calledOnce(this.field.doValueUpdate_);
      sinon.assert.notCalled(this.field.forceRerender);
    });
    test('Class Validator Returns Invalid, Not Dirty (Default)', function () {
      stubClassValidator(this.field, false);
      addSpies(this.field);
      this.field.setValue('value');
      sinon.assert.calledOnce(this.field.doValueInvalid_);
      sinon.assert.notCalled(this.field.doValueUpdate_);
      sinon.assert.notCalled(this.field.forceRerender);
    });
    test('Class Validator Returns Invalid, Dirty', function () {
      stubClassValidator(this.field, false);
      stubDoValueInvalid(this.field, true);
      addSpies(this.field, ['doValueInvalid_']);
      this.field.setValue('value');
      sinon.assert.calledOnce(this.field.doValueInvalid_);
      sinon.assert.notCalled(this.field.doValueUpdate_);
      sinon.assert.calledOnce(this.field.forceRerender);
    });
    test('Class Validator Returns Valid, Not Dirty', function () {
      stubClassValidator(this.field, true);
      stubDoValueUpdate(this.field, false);
      addSpies(this.field, ['doValueUpdate_']);
      this.field.setValue('value');
      sinon.assert.notCalled(this.field.doValueInvalid_);
      sinon.assert.calledOnce(this.field.doValueUpdate_);
      sinon.assert.notCalled(this.field.forceRerender);
    });
    test('Class Validator Returns Valid, Dirty (Default)', function () {
      stubClassValidator(this.field, true);
      addSpies(this.field);
      this.field.setValue('value');
      sinon.assert.notCalled(this.field.doValueInvalid_);
      sinon.assert.calledOnce(this.field.doValueUpdate_);
      sinon.assert.calledOnce(this.field.forceRerender);
    });
    test('Local Validator Returns Invalid, Not Dirty (Default)', function () {
      setLocalValidator(this.field, false);
      addSpies(this.field);
      this.field.setValue('value');
      sinon.assert.calledOnce(this.field.doValueInvalid_);
      sinon.assert.notCalled(this.field.doValueUpdate_);
      sinon.assert.notCalled(this.field.forceRerender);
    });
    test('Local Validator Returns Invalid, Dirty', function () {
      stubDoValueInvalid(this.field, true);
      setLocalValidator(this.field, false);
      addSpies(this.field, ['doValueInvalid_']);
      this.field.setValue('value');
      sinon.assert.calledOnce(this.field.doValueInvalid_);
      sinon.assert.notCalled(this.field.doValueUpdate_);
      sinon.assert.calledOnce(this.field.forceRerender);
    });
    test('Local Validator Returns Valid, Not Dirty', function () {
      stubDoValueUpdate(this.field, false);
      setLocalValidator(this.field, true);
      addSpies(this.field, ['doValueUpdate_']);
      this.field.setValue('value');
      sinon.assert.notCalled(this.field.doValueInvalid_);
      sinon.assert.calledOnce(this.field.doValueUpdate_);
      sinon.assert.notCalled(this.field.forceRerender);
    });
    test('Local Validator Returns Valid, Dirty (Default)', function () {
      setLocalValidator(this.field, true);
      addSpies(this.field);
      this.field.setValue('value');
      sinon.assert.notCalled(this.field.doValueInvalid_);
      sinon.assert.calledOnce(this.field.doValueUpdate_);
      sinon.assert.calledOnce(this.field.forceRerender);
    });
    test('New Value Matches Old Value', function () {
      this.field.setValue('value');
      addSpies(this.field);
      this.field.setValue('value');
      sinon.assert.notCalled(this.field.doValueInvalid_);
      sinon.assert.calledOnce(this.field.doValueUpdate_);
      sinon.assert.notCalled(this.field.forceRerender);
    });
    test('New Value (Class)Validates to Old Value', function () {
      this.field.setValue('value');
      stubClassValidatorWithReturn(this.field, 'value');
      addSpies(this.field);
      this.field.setValue('notValue');
      sinon.assert.notCalled(this.field.doValueInvalid_);
      sinon.assert.calledOnce(this.field.doValueUpdate_);
      sinon.assert.notCalled(this.field.forceRerender);
    });
    test('New Value (Local)Validates to Old Value', function () {
      this.field.setValue('value');
      setLocalValidatorWithReturn(this.field, 'value');
      addSpies(this.field);
      this.field.setValue('notValue');
      sinon.assert.notCalled(this.field.doValueInvalid_);
      sinon.assert.calledOnce(this.field.doValueUpdate_);
      sinon.assert.notCalled(this.field.forceRerender);
    });
    test('New Value (Class)Validates to not Old Value', function () {
      this.field.setValue('value');
      stubClassValidatorWithReturn(this.field, 'notValue');
      addSpies(this.field);
      this.field.setValue('value');
      sinon.assert.notCalled(this.field.doValueInvalid_);
      sinon.assert.calledOnce(this.field.doValueUpdate_);
    });
    test('New Value (Local)Validates to not Old Value', function () {
      this.field.setValue('value');
      setLocalValidatorWithReturn(this.field, 'notValue');
      addSpies(this.field);
      this.field.setValue('value');
      sinon.assert.notCalled(this.field.doValueInvalid_);
      sinon.assert.calledOnce(this.field.doValueUpdate_);
    });
    test('Class Validator Returns Null', function () {
      stubClassValidatorWithReturn(this.field, null);
      addSpies(this.field);
      this.field.setValue('value');
      sinon.assert.calledOnce(this.field.doValueInvalid_);
      sinon.assert.notCalled(this.field.doValueUpdate_);
    });
    test('Class Validator Returns Same', function () {
      sinon
        .stub(this.field, 'doClassValidation_')
        .callsFake(function (newValue) {
          return newValue;
        });
      addSpies(this.field);
      this.field.setValue('value');
      sinon.assert.notCalled(this.field.doValueInvalid_);
      sinon.assert.calledOnce(this.field.doValueUpdate_);
    });
    test('Class Validator Returns Different', function () {
      stubClassValidatorWithReturn(this.field, 'differentValue');
      addSpies(this.field);
      this.field.setValue('value');
      sinon.assert.notCalled(this.field.doValueInvalid_);
      sinon.assert.calledOnce(this.field.doValueUpdate_);
    });
    test('Class Validator Returns Undefined', function () {
      stubClassValidatorWithReturn(this.field, undefined);
      addSpies(this.field);
      this.field.setValue('value');
      assert.equal(this.field.getValue(), 'value');
      sinon.assert.notCalled(this.field.doValueInvalid_);
      sinon.assert.calledOnce(this.field.doValueUpdate_);
    });
    test('Local Validator Returns Null', function () {
      setLocalValidatorWithReturn(this.field, null);
      addSpies(this.field);
      this.field.setValue('value');
      sinon.assert.calledOnce(this.field.doValueInvalid_);
      sinon.assert.notCalled(this.field.doValueUpdate_);
    });
    test('Local Validator Returns Same', function () {
      this.field.setValidator(function (newValue) {
        return newValue;
      });
      addSpies(this.field);
      this.field.setValue('value');
      sinon.assert.notCalled(this.field.doValueInvalid_);
      sinon.assert.calledOnce(this.field.doValueUpdate_);
    });
    test('Local Validator Returns Different', function () {
      setLocalValidatorWithReturn(this.field, 'differentValue');
      addSpies(this.field);
      this.field.setValue('value');
      sinon.assert.notCalled(this.field.doValueInvalid_);
      sinon.assert.calledOnce(this.field.doValueUpdate_);
    });
    test('Local Validator Returns Undefined', function () {
      setLocalValidatorWithReturn(this.field, undefined);
      addSpies(this.field);
      this.field.setValue('value');
      assert.equal(this.field.getValue(), 'value');
      sinon.assert.notCalled(this.field.doValueInvalid_);
      sinon.assert.calledOnce(this.field.doValueUpdate_);
    });
  });

  suite('Customization', function () {
    // All this field does is wrap the abstract field.
    class CustomField extends Blockly.Field {
      constructor(opt_config) {
        super('value', null, opt_config);
      }

      static fromJson(options) {
        return new CustomField(options);
      }
    }

    suite('Tooltip', function () {
      test('JS Constructor', function () {
        const field = new Blockly.Field('value', null, {
          tooltip: 'test tooltip',
        });
        assert.equal(field.getTooltip(), 'test tooltip');
      });
      test('JS Constructor - Dynamic', function () {
        const returnTooltip = function () {
          return 'dynamic tooltip text';
        };
        const field = new Blockly.Field('value', null, {
          tooltip: returnTooltip,
        });
        assert.equal(field.getTooltip(), returnTooltip());
      });
      test('JSON Definition', function () {
        const field = CustomField.fromJson({
          tooltip: 'test tooltip',
        });
        assert.equal(field.getTooltip(), 'test tooltip');
      });
      suite('W/ Msg References', function () {
        setup(function () {
          addMessageToCleanup(this.sharedCleanup, 'TOOLTIP');
          Blockly.Msg['TOOLTIP'] = 'test tooltip';
        });
        test('JS Constructor', function () {
          const field = new Blockly.Field('value', null, {
            tooltip: '%{BKY_TOOLTIP}',
          });
          assert.equal(field.getTooltip(), 'test tooltip');
        });
        test('JSON Definition', function () {
          const field = CustomField.fromJson({
            tooltip: '%{BKY_TOOLTIP}',
          });
          assert.equal(field.getTooltip(), 'test tooltip');
        });
      });
      suite('setTooltip', function () {
        setup(function () {
          this.workspace = new Blockly.WorkspaceSvg(new Blockly.Options({}));
          this.workspace.createDom();
        });
        teardown(function () {
          workspaceTeardown.call(this, this.workspace);
        });
        test('Before Append', function () {
          addBlockTypeToCleanup(this.sharedCleanup, 'tooltip');
          Blockly.Blocks['tooltip'] = {
            init: function () {
              const field = new Blockly.FieldTextInput('default');
              field.setTooltip('tooltip');
              this.appendDummyInput().appendField(field, 'TOOLTIP');
            },
          };
          const block = Blockly.Xml.domToBlock(
            Blockly.utils.xml.textToDom(
              '<xml xmlns="https://developers.google.com/blockly/xml">' +
                '  <block type="tooltip"></block>' +
                '</xml>',
            ).children[0],
            this.workspace,
          );
          const field = block.getField('TOOLTIP');
          assert.equal(field.getClickTarget_().tooltip, 'tooltip');
        });
        test('After Append', function () {
          addBlockTypeToCleanup(this.sharedCleanup, 'tooltip');
          Blockly.Blocks['tooltip'] = {
            init: function () {
              const field = new Blockly.FieldTextInput('default');
              this.appendDummyInput().appendField(field, 'TOOLTIP');
              field.setTooltip('tooltip');
            },
          };
          const block = Blockly.Xml.domToBlock(
            Blockly.utils.xml.textToDom(
              '<xml xmlns="https://developers.google.com/blockly/xml">' +
                '  <block type="tooltip"></block>' +
                '</xml>',
            ).children[0],
            this.workspace,
          );
          const field = block.getField('TOOLTIP');
          assert.equal(field.getClickTarget_().tooltip, 'tooltip');
        });
        test('After Block Creation', function () {
          addBlockTypeToCleanup(this.sharedCleanup, 'tooltip');
          Blockly.Blocks['tooltip'] = {
            init: function () {
              const field = new Blockly.FieldTextInput('default');
              this.appendDummyInput().appendField(field, 'TOOLTIP');
            },
          };
          const block = Blockly.Xml.domToBlock(
            Blockly.utils.xml.textToDom(
              '<xml xmlns="https://developers.google.com/blockly/xml">' +
                '  <block type="tooltip"></block>' +
                '</xml>',
            ).children[0],
            this.workspace,
          );
          const field = block.getField('TOOLTIP');
          field.setTooltip('tooltip');
          assert.equal(field.getClickTarget_().tooltip, 'tooltip');
        });
        test('Dynamic Function', function () {
          addBlockTypeToCleanup(this.sharedCleanup, 'tooltip');
          Blockly.Blocks['tooltip'] = {
            init: function () {
              const field = new Blockly.FieldTextInput('default');
              field.setTooltip(this.tooltipFunc);
              this.appendDummyInput().appendField(field, 'TOOLTIP');
            },

            tooltipFunc: function () {
              return this.getFieldValue('TOOLTIP');
            },
          };
          const block = Blockly.Xml.domToBlock(
            Blockly.utils.xml.textToDom(
              '<xml xmlns="https://developers.google.com/blockly/xml">' +
                '  <block type="tooltip"></block>' +
                '</xml>',
            ).children[0],
            this.workspace,
          );
          const field = block.getField('TOOLTIP');
          assert.equal(field.getClickTarget_().tooltip, block.tooltipFunc);
        });
        test('Element', function () {
          addBlockTypeToCleanup(this.sharedCleanup, 'tooltip');
          Blockly.Blocks['tooltip'] = {
            init: function () {
              const field = new Blockly.FieldTextInput('default');
              field.setTooltip(this.element);
              this.appendDummyInput().appendField(field, 'TOOLTIP');
            },
            element: {
              tooltip: 'tooltip',
            },
          };
          const block = Blockly.Xml.domToBlock(
            Blockly.utils.xml.textToDom(
              '<xml xmlns="https://developers.google.com/blockly/xml">' +
                '  <block type="tooltip"></block>' +
                '</xml>',
            ).children[0],
            this.workspace,
          );
          const field = block.getField('TOOLTIP');
          assert.equal(field.getClickTarget_().tooltip, block.element);
        });
        test('Null', function () {
          addBlockTypeToCleanup(this.sharedCleanup, 'tooltip');
          Blockly.Blocks['tooltip'] = {
            init: function () {
              const field = new Blockly.FieldTextInput('default');
              field.setTooltip(null);
              this.appendDummyInput().appendField(field, 'TOOLTIP');
            },
          };
          const block = Blockly.Xml.domToBlock(
            Blockly.utils.xml.textToDom(
              '<xml xmlns="https://developers.google.com/blockly/xml">' +
                '  <block type="tooltip"></block>' +
                '</xml>',
            ).children[0],
            this.workspace,
          );
          const field = block.getField('TOOLTIP');
          assert.equal(field.getClickTarget_().tooltip, block);
        });
        test('Undefined', function () {
          addBlockTypeToCleanup(this.sharedCleanup, 'tooltip');
          Blockly.Blocks['tooltip'] = {
            init: function () {
              const field = new Blockly.FieldTextInput('default');
              this.appendDummyInput().appendField(field, 'TOOLTIP');
            },
          };
          const block = Blockly.Xml.domToBlock(
            Blockly.utils.xml.textToDom(
              '<xml xmlns="https://developers.google.com/blockly/xml">' +
                '  <block type="tooltip"></block>' +
                '</xml>',
            ).children[0],
            this.workspace,
          );
          const field = block.getField('TOOLTIP');
          assert.equal(field.getClickTarget_().tooltip, block);
        });
      });
    });
  });

  suite('Aria', function () {
    class TestField extends Blockly.Field {
      constructor(value, config = undefined) {
        super(value, null, config);
      }
    }

    suite('getAriaTypeName', function () {
      test('Default returns null', function () {
        const field = new TestField();
        assert.isNull(field.getAriaTypeName());
      });

      test('Returns configured ariaTypeName (JS)', function () {
        const field = new TestField('value', {ariaTypeName: 'number'});
        assert.equal(field.getAriaTypeName(), 'number');
      });

      test('Returns configured ariaTypeName (JSON)', function () {
        class CustomField extends Blockly.Field {
          constructor(opt_config) {
            super('value', null, opt_config);
          }

          static fromJson(options) {
            return new CustomField(options);
          }
        }

        const field = CustomField.fromJson({ariaTypeName: 'text input'});
        assert.equal(field.getAriaTypeName(), 'text input');
      });
    });

    suite('getAriaValue', function () {
      test('Returns string value', function () {
        const field = new TestField('hello');
        assert.equal(field.getAriaValue(), 'hello');
      });

      test('Returns stringified number', function () {
        const field = new TestField(123);
        assert.equal(field.getAriaValue(), '123');
      });

      test('Returns null for null value', function () {
        const field = new TestField(null);
        assert.isNull(field.getAriaValue());
      });

      test('Returns null for undefined value', function () {
        const field = new TestField(undefined);
        assert.isNull(field.getAriaValue());
      });

      test('Returns empty string for empty text value', function () {
        const field = new TestField('');
        assert.equal(field.getAriaValue(), '');
      });
    });

    suite('computeAriaLabel', function () {
      test('Value only (default)', function () {
        const field = new TestField('hello');
        assert.equal(field.computeAriaLabel(), 'hello');
      });

      test('Value only when includeTypeInfo=false', function () {
        const field = new TestField('hello', {ariaTypeName: 'text'});
        assert.equal(field.computeAriaLabel(false), 'hello');
      });

      test('Type and value when includeTypeInfo=true', function () {
        const field = new TestField('hello', {ariaTypeName: 'text'});
        assert.equal(field.computeAriaLabel(true), 'text: hello');
      });

      test('Type and placeholder when value is null', function () {
        const field = new TestField(null, {ariaTypeName: 'text'});
        assert.equal(
          field.computeAriaLabel(true),
          `text: ${Blockly.Msg['FIELD_LABEL_EMPTY']}`,
        );
      });

      test('Placeholder when when value is null and no type', function () {
        const field = new TestField(null);
        assert.equal(
          field.computeAriaLabel(true),
          Blockly.Msg['FIELD_LABEL_EMPTY'],
        );
      });

      test('Placeholder when value is empty string', function () {
        const field = new TestField('');
        assert.equal(
          field.computeAriaLabel(true),
          Blockly.Msg['FIELD_LABEL_EMPTY'],
        );
      });

      test('Type and placeholder when value is empty string', function () {
        const field = new TestField('', {ariaTypeName: 'text'});
        assert.equal(
          field.computeAriaLabel(true),
          `text: ${Blockly.Msg['FIELD_LABEL_EMPTY']}`,
        );
      });

      test('Handles missing type with includeTypeInfo=true', function () {
        const field = new TestField('hello');
        assert.equal(field.computeAriaLabel(true), 'hello');
      });
    });

    suite('Subclass overrides', function () {
      test('Override returning empty string still results in placeholder', function () {
        class EmptyOverrideField extends TestField {
          getAriaValue() {
            return '';
          }
        }

        const field = new EmptyOverrideField();
        assert.equal(
          field.computeAriaLabel(),
          Blockly.Msg['FIELD_LABEL_EMPTY'],
        );
      });

      class CustomValueField extends TestField {
        getAriaValue() {
          return 'custom value';
        }
      }

      class CustomTypeField extends TestField {
        getAriaTypeName() {
          return 'custom type';
        }
      }

      class FullCustomField extends TestField {
        getAriaValue() {
          return 'custom value';
        }
        getAriaTypeName() {
          return 'custom type';
        }
      }

      test('Uses overridden getAriaValue', function () {
        const field = new CustomValueField('ignored');
        assert.equal(field.computeAriaLabel(), 'custom value');
      });

      test('Uses overridden getAriaTypeName', function () {
        const field = new CustomTypeField('value');
        assert.equal(field.computeAriaLabel(true), 'custom type: value');
      });

      test('Uses both overrides', function () {
        const field = new FullCustomField();
        assert.equal(field.computeAriaLabel(true), 'custom type: custom value');
      });
    });

    suite('Field text elements are hidden', function () {
      test('Field text element has aria-hidden=true', function () {
        const field = new TestField();
        field.constants_ = {FIELD_BORDER_RECT_RADIUS: 5};
        field.initView();
        assert(field.getTextElement().ariaHidden === 'true');
      });
    });
  });
});
