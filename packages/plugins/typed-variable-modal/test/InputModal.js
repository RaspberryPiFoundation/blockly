import {TypedVariableModal} from '../src/TypedVariableModal.js';

/**
 * A test input modal.
 */
export class InputModal extends TypedVariableModal {
  /**
   * The element holding the input type.
   * @override
   */
  createVariableTypeContainer_(types) {
    const selectDiv = document.createElement('select');
    for (let i = 0; i < types.length; i++) {
      const type = types[i];
      const displayName = type[0];
      const typeName = type[1];
      const option = document.createElement('option');
      option.classList.add('input-modal-type');
      option.value = typeName;
      option.innerText = displayName;
      selectDiv.appendChild(option);
    }
    this.firstTypeInput_ = selectDiv.querySelector('.input-modal-type');
    return selectDiv;
  }

  /**
   * Get the selected type.
   * @returns {string} The selected type.
   * @override
   */
  getSelectedType_() {
    const selectDiv = this.variableTypesDiv_;
    return selectDiv.options[selectDiv.selectedIndex].value;
  }

  /**
   * Get the first type in the list.
   * @override
   */
  resetModalInputs_() {
    super.resetModalInputs_();
    this.firstTypeInput_.selected = true;
  }

  /**
   * @override
   */
  renderFooter_(footerContainer) {
    footerContainer.appendChild(this.createConfirmBtn_());
    const randomBtn = document.createElement('button');
    randomBtn.className = 'blocklyModalBtn';
    randomBtn.innerText = 'Create random name';
    this.addEvent_(randomBtn, 'click', this, () => this.randomName());
    footerContainer.appendChild(randomBtn);
    footerContainer.appendChild(this.createCancelBtn_());
  }

  /**
   * Create a random name for the variable.
   */
  randomName() {
    this.variableNameInput_.value = 'Random Name';
  }
}
