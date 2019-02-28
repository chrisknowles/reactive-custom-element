'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var litHtml = require('lit-html');
var reactiveDataStore = require('reactive-data-store');

let STYLESHEETS;

function isObject(value) {
  return value != null &&
    typeof value === 'object' &&
    Array.isArray(value) === false;
}

class CustomElement extends HTMLElement {

  static defineTag(name) {
    window.customElements.define(name, this);
  }

  constructor(params) {
    super();
    this.html = litHtml.html;
    this.renderTemplate = litHtml.render;
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
    this.unsubscribeFromAllStores();
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

  /**
   * The render method for the element.
   * It adds styles and stylesheet links if they exist
   */
  render() {
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
   * Called before the elements data is updated
   */
  beforeUpdate() {}

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

/**
 * Debug mode
 */
let DEBUG = false;

const DATA = Symbol('data');

class ReactiveCustomElement extends CustomElement {

  static get observedAttributes() {
    return ['data-store'];
  }

  constructor(params) {
    super(params);
    this[DATA] = {};
    this.subscriptions = {};
  }

  get data() {
    return this[DATA];
  }

  set data(d) {
    this[DATA] = d;
  }

  get props() {
    return this[DATA];
  }

  attributeChangedCallback(attr) {
    if (attr === 'data-store') {
      this.setStore();
      setTimeout(this.render.bind(this));
    }
  }

  // ---------------------------------------------------------
  // Data
  // ---------------------------------------------------------

  updateData(name) {
    return (data, error, complete) => {
      this.beforeUpdate();
      name
        ? this.data[name] = data
        : this.data = data;
      this.render();
      if (DEBUG) {
        console.log.orange(this.tagName.substr(4).toLowerCase());
      }
    };
  }

  setStore(store) {
    const dorender = Boolean(store);
    const stores = reactiveDataStore.parse(store || this.dataset.store);
    Array.isArray(stores)
      ? stores.map(store => this.subscribeToStore(store, dorender))
      : this.subscribeToStore(stores, dorender);
  }

  /**
   * Subscribes the element to a store with the updateData function.
   *
   * The store can be a store name or a path to a property on a store.
   *
   * If there's just one store and it has no name the subscription
   * will be saved as this.subscriptions[""] but the data will be
   * stored in this.props.
   *
   * If being called by setStore and no names are specified and
   * there is more than one name then it sets the name to be the
   * sams as the store name.
   * This allows for shorthand definitions like data-store='app|user'
   * instead of data-store='app < app|user < user'.
   *
   * @param {String} str
   * @param {Integer} numStores
   * @param {Boolean} dorender
   * @returns void
   */
  subscribeToStore(data, dorender = false) {
    let {name, store, storePath, just, not} = data;
    this.unsubscribeFromStore(name);
    this.subscriptions[name] = reactiveDataStore.Store(store).subscribe({
      callback: this.updateData(name).bind(this),
      storePath,
      just,
      not,
      name,
    });
    if (name) {
      this.data[name] = reactiveDataStore.getDataFromPath({
        storePath,
        just,
        not,
        data: reactiveDataStore.Data(store)
      });
    } else {
      this.data = reactiveDataStore.getDataFromPath({
        storePath,
        just,
        not,
        data: reactiveDataStore.Data(store)
      });
    }
    if (dorender) {
      this.render();
    }
  }

  unsubscribeFromStore(name) {
    if (this.subscriptions[name]) {
      this.subscriptions[name].unsubscribe();
    }
  }

  unsubscribeFromAllStores() {
    if (this.subscriptions.length) {
      this.subscriptions.map(sub => sub.unsubscribe());
      this.subscriptions = [];
    }
  }

}

CustomElement.debug = toDebugOrNotToDebug => {
  DEBUG = toDebugOrNotToDebug;
};

exports.CustomElement = CustomElement;
exports.ReactiveCustomElement = ReactiveCustomElement;
