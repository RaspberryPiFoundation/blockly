/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {Coordinate} from '../utils/coordinate.js';
import * as dom from '../utils/dom.js';
import {Rect} from '../utils/rect.js';
import {Size} from '../utils/size.js';
import {Svg} from '../utils/svg.js';
import {WorkspaceSvg} from '../workspace_svg.js';
import {Bubble} from './bubble.js';

/**
 * A bubble that displays non-editable text. Used by the warning icon.
 */
export class TextBubble extends Bubble {
  private paragraph: SVGGElement;

  constructor(
    private text: string,
    public readonly workspace: WorkspaceSvg,
    protected anchor: Coordinate,
    protected ownerRect?: Rect,
  ) {
    super(workspace, anchor, ownerRect);
    this.paragraph = this.stringToSvg(text, this.contentContainer);
    this.updateBubbleSize();
    dom.addClass(this.svgRoot, 'blocklyTextBubble');
  }

  /** @returns the current text of this text bubble. */
  getText(): string {
    return this.text;
  }

  /** Sets the current text of this text bubble, and updates the display. */
  setText(text: string) {
    this.text = text;
    dom.removeNode(this.paragraph);
    this.paragraph = this.stringToSvg(text, this.contentContainer);
    this.updateBubbleSize();
  }

  /**
   * Converts the given string into an svg containing that string,
   * broken up by newlines.
   */
  private stringToSvg(text: string, container: SVGGElement) {
    const paragraph = this.createParagraph(container);
    const fragments = this.createTextFragments(paragraph, text);
    if (this.workspace.RTL)
      this.rightAlignTextFragments(paragraph.getBBox().width, fragments);
    return paragraph;
  }

  /** Creates the paragraph container for this bubble's view's text fragments. */
  private createParagraph(container: SVGGElement): SVGGElement {
    return dom.createSvgElement(
      Svg.G,
      {
        'class': 'blocklyText blocklyBubbleText blocklyNoPointerEvents',
        'transform': `translate(0,${Bubble.BORDER_WIDTH})`,
        'style': `direction: ${this.workspace.RTL ? 'rtl' : 'ltr'}`,
      },
      container,
    );
  }

  /** Creates the text fragments visualizing the text of this bubble. */
  private createTextFragments(
    parent: SVGGElement,
    text: string,
  ): SVGTextElement[] {
    let lineNum = 1;
    return text.split('\n').map((line) => {
      const fragment = dom.createSvgElement(
        Svg.TEXT,
        {'y': `${lineNum}em`, 'x': Bubble.BORDER_WIDTH},
        parent,
      );
      const textNode = document.createTextNode(line);
      fragment.appendChild(textNode);
      lineNum += 1;
      return fragment;
    });
  }

  /** Right aligns the given text fragments. */
  private rightAlignTextFragments(
    maxWidth: number,
    fragments: SVGTextElement[],
  ) {
    for (const text of fragments) {
      text.setAttribute('text-anchor', 'start');
      text.setAttribute('x', `${maxWidth + Bubble.BORDER_WIDTH}`);
    }
  }

  /** Updates the size of this bubble to account for the size of the text. */
  private updateBubbleSize() {
    const bbox = this.paragraph.getBBox();
    this.setSize(
      new Size(
        bbox.width + Bubble.BORDER_WIDTH * 2,
        bbox.height + Bubble.BORDER_WIDTH * 2,
      ),
      true,
    );
  }
}
