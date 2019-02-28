import {Store, Data, parse, getDataFromPath} from 'reactive-data-store';
import {CustomElement} from './custom-element';

/**
 * Debug mode
 */
let DEBUG = false;

const DATA = Symbol('data');

export class ReactiveCustomElement extends CustomElement {

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

  disconnectedCallback() {
    super.disconnectedCallback();
    this.unsubscribeFromAllStores();
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

  /**
   * Called before the elements data is updated
   */
  beforeUpdate() {}

  updateData(name) {
    return (data, error, complete) => {
      this.beforeUpdate();
      name
        ? this.data[name] = data
        : this.data = data;
      this.render();
      if (DEBUG) {
        setTimeout(() => {
          console.log(`%c🍊  ${this.tagName.toLowerCase()} re-rendered`, `color: #E67E22;line-height:1;`);
        }, 1100);
      }
    };
  }

  setStore(store) {
    const dorender = Boolean(store);
    const stores = parse(store || this.dataset.store);
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
    const tagname = this.tagName.replace('-', '');
    this.unsubscribeFromStore(name || tagname);
    this.subscriptions[name || tagname] = Store(store).subscribe({
      callback: this.updateData(name).bind(this),
      storePath,
      just,
      not,
      name,
    });
    if (name) {
      this.data[name] = getDataFromPath({
        storePath,
        just,
        not,
        data: Data(store)
      });
    } else {
      this.data = getDataFromPath({
        storePath,
        just,
        not,
        data: Data(store)
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
    if (Object.keys(this.subscriptions)) {
      Object.values(this.subscriptions).map(sub => {
        sub.unsubscribe();
      });
      this.subscriptions = {};
    }
  }

}

CustomElement.debug = toDebugOrNotToDebug => {
  DEBUG = toDebugOrNotToDebug;
};
