import {html, render} from 'lit-html';

let STYLESHEETS;

function isObject(value) {
  return value != null &&
    typeof value === 'object' &&
    Array.isArray(value) === false;
}

export class CustomElement extends HTMLElement {

  static defineTag(name) {
    window.customElements.define(name, this);
  }

  constructor(params) {
    super();
    this.html = html;
    this.renderTemplate = render;
    this.root = this;
    this.events = [];
    this.rendered = false;
    if (isObject(params)) {
      this.setShadowRoot(params);
      this.stylesheets = params.stylesheets || [];
    }
  }

  /**
   * Sets a shadow root on the element and attaches styles
   * to the shadow dom
   * @param {object}
   *  {boolean} shadowMode
   *  {boolean} styles
   */
  setShadowRoot({
    shadowMode = 'open',
    styles = false,
  }) {
    this.attachShadow({mode: shadowMode});
    this.root = this.shadowRoot;
    if (styles.substring) {
      this.styles = document.createElement('style');
      this.styles.innerHTML = styles;
    }
  }

  connectedCallback() {
    this.render();
  }

  disconnectedCallback() {
    this.events.forEach(fn => fn());
  }

  /**
   * Sets both an attribute and a value for the
   * property name
   * @param {string} prop
   * @param {mixed} val
   */
  setAttribute(prop, val) {
    super.setAttribute(prop, String(val));
    this[prop] = val;
  }

  /**
   * Sets the tabindex property of the element but only
   * if the tabindex attribute is not set
   * @param {number} val
   */
  setTabindex(val = 0) {
    if (!this.hasAttribute('tabindex')) {
      this.setAttribute('tabindex', val);
    }
  }

  /**
   * Sets the disbaled property of the element but only
   * if the disabled attribute is not set
   * @param {boolean} val
   */
  setDisabled(val = false) {
    if (!this.hasAttribute('disabled')) {
      this.disabled = val;
    }
  }

  /**
   * Returns the deepest element in the composed path
   * of the given event
   * @param {event} e The event
   */
  target(e) {
    return e.composedPath()[0] || e.target;
  }

  /**
   * Returns the tag name of the target in the composed path
   * converted to lower case
   * @param {event} e The event
   */
  targetTagName(e) {
    return this.target(e).tagName;
  }

  // ---------------------------------------------------------
  // Events
  // ---------------------------------------------------------

  /**
   * Adds an event listener to this element or the passed
   * in element. Also sets a remove listener to be called
   * when the element is disconnected
   * @param {event} event
   * @param {HTMLElement} elm
   * @param {function} fn
   * @return {event} A remove event handler for manual deregistering
   */
  on(event, elm, fn) {
    if (!fn) {
      fn = elm;
      elm = this;
    }
    elm.addEventListener(event, fn);
    const off = () => elm.removeEventListener(event, fn);
    this.events.push(off);
    return off;
  }

  off(event, fn) {
    this.removeEventListener(event, fn);
  }

  once(event, elm, fn) {
    if (!fn) {
      fn = elm;
      elm = this;
    }
    const removeListener = this.on(event, elm, () => {
      fn();
      removeListener();
    });
  }

  onNextRender(elm, fn) {
    if (!fn) {
      fn = elm;
      elm = this;
    }
    this.once('rendered', elm, fn);
  }

  dispatch(event, elm, data = false) {
    const e = new CustomEvent(event, {
      composed: true,
      bubbles: true,
      detail: data || elm,
    });
    if (elm instanceof HTMLElement) {
      elm.dispatchEvent(e);
    } else {
      this.dispatchEvent(e);
    }
  }

  // ---------------------------------------------------------
  // Query Selectors
  // ---------------------------------------------------------
  selector(selector) {
    return this.root.querySelector(selector);
  }

  selectorAll(selector) {
    return this.root.querySelectorAll(selector);
  }

  selectorAllArray(selector) {
    return [...this.root.querySelectorAll(selector)];
  }

  setContent(content) {
    this.innerHTML = content;
    this.render();
  }

  getSlotElements(parent) {
    return parent
      .querySelector('slot')
      .assignedNodes()
      .filter(node => node.nodeType === 1); // nodeType element
  }

  buildStylesheets() {
    // have no stylesheets or already rendered
    if (!this.stylesheets || this.selector('link')) {
      return void 0;
    }
    this.stylesheets.map(stylesheet => {
      const elm = document.createElement('link');
      elm.setAttribute('rel', 'stylesheet');
      elm.setAttribute('href', STYLESHEETS[stylesheet]);
      this.root.appendChild(elm);
    });
  }

  preRenderCheck() {
    return true;
  }

  /**
   * The render method for the element.
   * It adds styles and stylesheet links if they exist
   */
  render() {
    if (!this.preRenderCheck()) {
      return ``;
    }
    this.beforeRender();
    const tpl = this.template() || this.html``;
    this.renderTemplate(tpl, this.root);
    this.buildStylesheets();
    if (this.styles) {
      if (!this.selector('style')) {
        this.root.appendChild(this.styles);
      }
    }
    setTimeout(() => {
      if (!this.rendered) {
        this.onFirstRender();
        this.rendered = true;
      }
      this.onRender();
      this.dispatch('rendered');
    }, 200); // allow for 100ms in store update
  }

  /**
   * called before the element is rendered
   */
  beforeRender() {}

  /**
   * Called after each time the element is rendered
   */
  onRender() {}

  /**
   * Called on the first render of the element
   */
  onFirstRender() {}

  template() {}

}

CustomElement.setStylesheets = stylesheets => {
  STYLESHEETS = stylesheets;
};
