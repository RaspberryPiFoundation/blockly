# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [13.3.0](https://github.com/RaspberryPiFoundation/blockly/compare/blockly-v13.2.1...blockly-v13.3.0) (2026-09-10)

### Features

* add toolbox and flyout navigation to the optional jump shortcuts ([#10215](https://github.com/RaspberryPiFoundation/blockly/issues/10215)) ([a5d3a24](https://github.com/RaspberryPiFoundation/blockly/commit/a5d3a24fc8e92343c6f8e2c0044c0186c79eeb24)), closes [#10187](https://github.com/RaspberryPiFoundation/blockly/issues/10187)
* Allow unsetting a custom tooltip ([#10385](https://github.com/RaspberryPiFoundation/blockly/issues/10385)) ([a7f49c7](https://github.com/RaspberryPiFoundation/blockly/commit/a7f49c7a2a75ef8dd0f2e9183a97eb92f1bc3108))
* build reference docs from latest release ([#10418](https://github.com/RaspberryPiFoundation/blockly/issues/10418)) ([b305706](https://github.com/RaspberryPiFoundation/blockly/commit/b305706bc8e213a60a02d018b42d95245932635a))
* generate API docs with TypeDoc ([#10398](https://github.com/RaspberryPiFoundation/blockly/issues/10398)) ([3aa5f85](https://github.com/RaspberryPiFoundation/blockly/commit/3aa5f85846ce3076d01b76aadf05f37dd4e07f13))
* Relax access restrictions on &#x60;BlockDragStrategy&#x60; ([#10273](https://github.com/RaspberryPiFoundation/blockly/issues/10273)) ([deec995](https://github.com/RaspberryPiFoundation/blockly/commit/deec995fc40df6e04580a3dc2b732257fd24f1b6))
* Sdd optional shortcuts for scrolling workspace ([#10293](https://github.com/RaspberryPiFoundation/blockly/issues/10293)) ([e69b0df](https://github.com/RaspberryPiFoundation/blockly/commit/e69b0df639f987322c4ddc3ec902261c42ba251f))
* **workspace-search:** Add screen reader support ([#10316](https://github.com/RaspberryPiFoundation/blockly/issues/10316)) ([1aa51c0](https://github.com/RaspberryPiFoundation/blockly/commit/1aa51c0ec48f73ca1214397fa70d141ac47a57fe))
* **workspace-search:** UI Improvements ([#10391](https://github.com/RaspberryPiFoundation/blockly/issues/10391)) ([93856f8](https://github.com/RaspberryPiFoundation/blockly/commit/93856f86b93406a2bbcc5220372ccee4ed727069))

### Bug Fixes

* add comma to block labels except on Apple devices ([#10279](https://github.com/RaspberryPiFoundation/blockly/issues/10279)) ([55f62a0](https://github.com/RaspberryPiFoundation/blockly/commit/55f62a0d4433b91a44366668eca0ba22dfeeae61))
* Clamp transforms to sensible levels of precision ([#10268](https://github.com/RaspberryPiFoundation/blockly/issues/10268)) ([965c1a3](https://github.com/RaspberryPiFoundation/blockly/commit/965c1a3ef7cb3a4955c28af473eecd9e26d59024))
* Do not re-announce moves that stay on the same connection target ([#10308](https://github.com/RaspberryPiFoundation/blockly/issues/10308)) ([b340469](https://github.com/RaspberryPiFoundation/blockly/commit/b340469545d44f2dbd4585ecbaae211095dbc8e4))
* drop IFocusableNode from trash and zoom ([#10272](https://github.com/RaspberryPiFoundation/blockly/issues/10272)) ([9af3629](https://github.com/RaspberryPiFoundation/blockly/commit/9af36295f020e6926d4b3c90a2242c991634912a))
* Fix a bug that could cause unexpected block movement when inserting blocks from the toolbox ([#10289](https://github.com/RaspberryPiFoundation/blockly/issues/10289)) ([966d29b](https://github.com/RaspberryPiFoundation/blockly/commit/966d29bc817bbc6733f3dacfa6e6b7883234c189))
* Fix bug that could cause dragged blocks to connect to and delete others ([#10285](https://github.com/RaspberryPiFoundation/blockly/issues/10285)) ([7aba030](https://github.com/RaspberryPiFoundation/blockly/commit/7aba03071f76eb2bd57315e73eb77937e78d9dce))
* Fix bug that could cause renders to clobber the undo stack ([#10227](https://github.com/RaspberryPiFoundation/blockly/issues/10227)) ([d130ef8](https://github.com/RaspberryPiFoundation/blockly/commit/d130ef89c33879ebebb017a6277a010fd8076946))
* Fix bug that made some keyboard shortcuts non-idempotent ([#10286](https://github.com/RaspberryPiFoundation/blockly/issues/10286)) ([8946e47](https://github.com/RaspberryPiFoundation/blockly/commit/8946e47f04c8b37672609c7ca1aadcc84b960eed))
* Fix exception when disposing blocks with focused connections ([#10387](https://github.com/RaspberryPiFoundation/blockly/issues/10387)) ([fbf197d](https://github.com/RaspberryPiFoundation/blockly/commit/fbf197da5da16573b10c92bf27103b17ea5a2039))
* Improve block placement when inserting from flyout via keyboard ([#10318](https://github.com/RaspberryPiFoundation/blockly/issues/10318)) ([1477ab1](https://github.com/RaspberryPiFoundation/blockly/commit/1477ab1a295a777ad8b5f99bf11dc3b017c09c4b))
* Improve performance of &#x60;WorkspaceSvg.getNestedTrees()&#x60; ([#10236](https://github.com/RaspberryPiFoundation/blockly/issues/10236)) ([2763f38](https://github.com/RaspberryPiFoundation/blockly/commit/2763f3836828b071e2efa2aced74cc363fb8396a))
* keep tall field corners inside round caps with zelos ([#10214](https://github.com/RaspberryPiFoundation/blockly/issues/10214)) ([38a3b80](https://github.com/RaspberryPiFoundation/blockly/commit/38a3b807d10ef16840a37e74f3345449ac601a2b))
* Make IDs of comment bar buttons consistent ([#10280](https://github.com/RaspberryPiFoundation/blockly/issues/10280)) ([e3b6810](https://github.com/RaspberryPiFoundation/blockly/commit/e3b6810dcdb75deb3e76407fa562cdf857459d6d))
* Make reverting block drags from the flyout delete the dragged block ([#10290](https://github.com/RaspberryPiFoundation/blockly/issues/10290)) ([082bc31](https://github.com/RaspberryPiFoundation/blockly/commit/082bc312de899b4431103c755e4ea6d523635076))
* Prevent registering a keyboard shortcut under the same key combo multiple times ([#10386](https://github.com/RaspberryPiFoundation/blockly/issues/10386)) ([ac5bf48](https://github.com/RaspberryPiFoundation/blockly/commit/ac5bf48b03ce99df8ea93915635c10a3509e2004))
* restore focus on toast dismiss ([#10260](https://github.com/RaspberryPiFoundation/blockly/issues/10260)) ([844dd25](https://github.com/RaspberryPiFoundation/blockly/commit/844dd250cd12bc3ed38a9b53afc550c48ce0eb21))
* scroll field into view after window resize instead of bumping block ([#10373](https://github.com/RaspberryPiFoundation/blockly/issues/10373)) ([d366715](https://github.com/RaspberryPiFoundation/blockly/commit/d36671579478bd5abd1b70dbad92a66bbd504b24))
* wrong css prop ([#10257](https://github.com/RaspberryPiFoundation/blockly/issues/10257)) ([30e9b8d](https://github.com/RaspberryPiFoundation/blockly/commit/30e9b8d86b4f8215a51f2a577451df2ee9810344))
