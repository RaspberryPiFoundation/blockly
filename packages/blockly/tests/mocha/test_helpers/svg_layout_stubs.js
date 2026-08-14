/**
 * @license
 * Copyright 2026 Raspberry Pi Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Geometry stubs for running the Mocha suite under JSDom.
 *
 * JSDom implements the SVG DOM but not SVG layout: it provides no `getBBox`,
 * `getCTM`, `getScreenCTM` or `createSVGPoint`, and `HTMLCanvasElement` has no
 * 2D context (so text measurement returns 0). Blockly's rendering calls these
 * APIs, so without stubs an injected workspace throws.
 *
 * These stubs provide deterministic, non-zero, internally consistent geometry
 * so that layout math does not divide by zero or dereference null matrices.
 * They are NOT pixel-accurate; tests that assert exact rendered coordinates
 * belong in the webdriver suite under tests/browser instead, where they run
 * against a real browser's layout.
 */

/** Approximate width in px of a single character, for text measurement. */
const CHAR_WIDTH = 8;

/**
 * Size in px reported for the headless viewport.
 */
export const HEADLESS_VIEWPORT_SIZE = {width: 1000, height: 1000};

/**
 * Reads an explicit px size off an element's inline style.
 * @param {!Element} element The element to read.
 * @param {string} property Either 'width' or 'height'.
 * @return {?number} The size in px, or null if not set in px.
 */
function explicitPx(element, property) {
  const value = element.style?.[property];
  if (typeof value !== 'string' || !value.endsWith('px')) return null;
  const px = Number.parseFloat(value);
  return Number.isFinite(px) ? px : null;
}

/**
 * Resolves the layout size of an element for the offset/client size stubs.
 *
 * JSDom performs no layout, so it reports 0 for every offsetWidth/clientWidth.
 * Blockly derives its viewport metrics from those (svgResize() in
 * core/common.ts reads the injection div's offsetWidth), and a zero viewport
 * minus a real toolbox width yields a negative-width scroll region, which makes
 * bumpObjectIntoBounds() unable to ever settle. So resolve a size from the
 * nearest ancestor with an explicit px size — Blockly's own injection div and
 * SVG are sized 100%, and inherit the fixed size given to #blocklyDiv.
 *
 * Elements with no sized ancestor still report 0, as they do today.
 * @param {!Element} element The element to size.
 * @param {string} property Either 'width' or 'height'.
 * @return {number} The resolved size in px.
 */
function resolveLayoutSize(element, property) {
  for (let node = element; node; node = node.parentElement) {
    const px = explicitPx(node, property);
    if (px !== null) return px;
  }
  return 0;
}

/**
 * Defines a size getter that resolves through ancestors, replacing JSDom's
 * always-zero implementation.
 * @param {!Object} proto The prototype to patch.
 * @param {string} name The property to define, e.g. 'offsetWidth'.
 * @param {string} property Either 'width' or 'height'.
 */
function defineSizeGetter(proto, name, property) {
  if (!proto) return;
  Object.defineProperty(proto, name, {
    configurable: true,
    get() {
      return resolveLayoutSize(this, property);
    },
  });
}

/**
 * Minimal 2D affine matrix supporting the operations Blockly performs on the
 * results of getCTM/getScreenCTM (inverse, translate, scale).
 */
class FakeMatrix {
  /**
   * @param {number=} a Horizontal scaling.
   * @param {number=} b Vertical skewing.
   * @param {number=} c Horizontal skewing.
   * @param {number=} d Vertical scaling.
   * @param {number=} e Horizontal translation.
   * @param {number=} f Vertical translation.
   */
  constructor(a = 1, b = 0, c = 0, d = 1, e = 0, f = 0) {
    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;
    this.e = e;
    this.f = f;
  }

  /**
   * @param {!FakeMatrix} m The matrix to multiply by (this * m).
   * @return {!FakeMatrix} The product.
   */
  multiply(m) {
    return new FakeMatrix(
      this.a * m.a + this.c * m.b,
      this.b * m.a + this.d * m.b,
      this.a * m.c + this.c * m.d,
      this.b * m.c + this.d * m.d,
      this.a * m.e + this.c * m.f + this.e,
      this.b * m.e + this.d * m.f + this.f,
    );
  }

  /** @return {!FakeMatrix} The inverse of this affine matrix. */
  inverse() {
    const det = this.a * this.d - this.b * this.c;
    if (!det) {
      // Singular matrix; return identity rather than producing NaNs.
      return new FakeMatrix();
    }
    const a = this.d / det;
    const b = -this.b / det;
    const c = -this.c / det;
    const d = this.a / det;
    return new FakeMatrix(
      a,
      b,
      c,
      d,
      -(a * this.e + c * this.f),
      -(b * this.e + d * this.f),
    );
  }

  /**
   * @param {number} x Horizontal translation.
   * @param {number} y Vertical translation.
   * @return {!FakeMatrix} A new translated matrix.
   */
  translate(x, y) {
    return this.multiply(new FakeMatrix(1, 0, 0, 1, x, y));
  }

  /**
   * @param {number} factor Uniform scale factor.
   * @return {!FakeMatrix} A new scaled matrix.
   */
  scale(factor) {
    return this.multiply(new FakeMatrix(factor, 0, 0, factor, 0, 0));
  }
}

/**
 * @param {!Element} element The element to derive a bounding box for.
 * @return {{x: number, y: number, width: number, height: number}} A
 *     deterministic, non-zero box sized from the element's text content.
 */
function fakeBBox(element) {
  const text = element.textContent || '';
  return {
    x: 0,
    y: 0,
    width: Math.max(text.length * CHAR_WIDTH, 1),
    height: 16,
  };
}

/** Minimal 2D canvas context exposing only what dom.js text measurement uses. */
class FakeCanvasContext {
  constructor() {
    this.font = '';
  }

  /**
   * @param {string} text The text to measure.
   * @return {{width: number}} An approximate text metrics object.
   */
  measureText(text) {
    return {width: (text ? text.length : 0) * CHAR_WIDTH};
  }
}

/**
 * Installs geometry stubs onto the given JSDom window's prototypes. Should be
 * called once during Node harness setup, before any workspace is injected.
 * @param {!Window} window The JSDom window whose prototypes to patch.
 */
export function installSvgLayoutStubs(window) {
  // getBBox/getCTM/getScreenCTM are spec'd on SVGGraphicsElement, but JSDom's
  // SVG class hierarchy is incomplete (e.g. <rect> is a bare SVGElement, not an
  // SVGGraphicsElement), so patch the SVGElement base to cover every element.
  const element = window.Element?.prototype;
  const svgElement = window.SVGElement?.prototype;
  const svg = window.SVGSVGElement?.prototype;
  const canvas = window.HTMLCanvasElement?.prototype;

  // Element.checkVisibility() is a newer DOM API JSDom does not implement.
  // Treat every element as visible in the headless layout.
  if (element && !element.checkVisibility) {
    element.checkVisibility = function () {
      return true;
    };
  }

  // JSDom performs no layout and so provides no scrollIntoView. Blockly calls
  // it to keep a newly focused toolbox item within the toolbox's visible area.
  if (element && !element.scrollIntoView) {
    element.scrollIntoView = function () {};
  }

  // getElementById is only defined on Document/ShadowRoot. Blockly calls it on
  // the result of getRootNode(), which can be a detached SVG element during
  // disposal. Provide a descendant search so those code paths work headless.
  if (element && !element.getElementById) {
    element.getElementById = function (id) {
      const stack = [...this.children];
      while (stack.length) {
        const el = stack.shift();
        if (el.getAttribute && el.getAttribute('id') === id) return el;
        stack.push(...el.children);
      }
      return null;
    };
  }

  // JSDom does not implement HTMLElement.innerText; approximate it with
  // textContent (sufficient for tests that assert on rendered menu text).
  const htmlElement = window.HTMLElement?.prototype;
  if (
    htmlElement &&
    !Object.getOwnPropertyDescriptor(htmlElement, 'innerText')
  ) {
    Object.defineProperty(htmlElement, 'innerText', {
      configurable: true,
      get() {
        return this.textContent;
      },
      set(value) {
        this.textContent = value;
      },
    });
  }

  // JSDom does not implement the <dialog> showModal/show/close methods.
  const dialog = window.HTMLDialogElement?.prototype;
  if (dialog && !dialog.showModal) {
    const open = function () {
      this.open = true;
      this.setAttribute('open', '');
    };
    dialog.showModal = open;
    dialog.show = open;
    dialog.close = function (returnValue) {
      this.open = false;
      this.removeAttribute('open');
      if (returnValue !== undefined) this.returnValue = returnValue;
      this.dispatchEvent(new window.Event('close'));
    };
  }

  // JSDom does not implement submission of a <form method="dialog">, which is
  // how Blockly's built-in alert/confirm/prompt dialogs close (a button click
  // submits the form, closing the dialog with the button's value). Emulate it
  // so those dialogs behave headless as they do in a browser.
  window.document.addEventListener(
    'click',
    (event) => {
      const button = event.target.closest?.('button');
      if (!button || button.type === 'button') return;
      const form = button.closest('form[method="dialog" i]');
      const dialogEl = form?.closest('dialog');
      if (dialogEl) {
        event.preventDefault();
        dialogEl.close(button.value ?? '');
      }
    },
    true,
  );

  if (svgElement && !svgElement.getBBox) {
    svgElement.getBBox = function () {
      return fakeBBox(this);
    };
  }
  if (svgElement && !svgElement.getCTM) {
    svgElement.getCTM = function () {
      return new FakeMatrix();
    };
  }
  if (svgElement && !svgElement.getScreenCTM) {
    svgElement.getScreenCTM = function () {
      return new FakeMatrix();
    };
  }
  if (svg && !svg.createSVGPoint) {
    svg.createSVGPoint = function () {
      return {
        x: 0,
        y: 0,
        matrixTransform(m) {
          return {
            x: m.a * this.x + m.c * this.y + m.e,
            y: m.b * this.x + m.d * this.y + m.f,
          };
        },
      };
    };
  }

  // Viewport size: clientWidth/clientHeight live on Element (the workspace
  // reads them off its parent <svg>), offsetWidth/offsetHeight on HTMLElement.
  // See resolveLayoutSize() for why a zero viewport is not merely inaccurate
  // but actively breaks the in-bounds bump loop.
  defineSizeGetter(element, 'clientWidth', 'width');
  defineSizeGetter(element, 'clientHeight', 'height');
  defineSizeGetter(window.HTMLElement?.prototype, 'offsetWidth', 'width');
  defineSizeGetter(window.HTMLElement?.prototype, 'offsetHeight', 'height');

  // JSDom's canvas has no 2D context (returns null and logs "Not
  // implemented"). Provide a measurement-only context so text widths are
  // non-zero and the noise is silenced.
  if (canvas) {
    const originalGetContext = canvas.getContext;
    canvas.getContext = function (type, ...rest) {
      if (type === '2d') {
        return new FakeCanvasContext();
      }
      return originalGetContext
        ? originalGetContext.call(this, type, ...rest)
        : null;
    };
  }
}
