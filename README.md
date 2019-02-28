# Reactive Custom Element

A custom element wrapper that uses `lit-html` for rendering and binds the element to `reactive-data-store`. This allows for decoupling of elements from each other with regard to re-rendering.

## Element Updating and Rendering

### Store Subscriptions

This library is different to component systems that pass data down from parent to child to granchild etc. Instead, all child descendent elements directly subscribe to the data store and manage their own updates and re-rendering.

The data communication that can happen from the parent is therefore by way of setting a definition of what the child should subscribe to via a string path.

Conceptually then, all elements are on the same hierarchical level with each other with relation to the data store as they all have a direct one to one relationship with the store.

A major benefit of the element subscribing directly to properties on the data in a store is that it will only have it's update function called if those properties change, not if other properties on the store change. This means checking whether an element should update when it's data stream updates is generally redundant. So if a parent gets updated, a child will not be updated along with but rather independently via it's own subscription. Therefore, consceptually this library decouples elements for updating and re-rendering purposes.

### Props

It may be overkill to subscribe a child element to a store. In this instance by updating attributes on the child the child will rerender.

> *Example of passing a simple data change from parent to child via an attribute*
```javascript
class ParentElement extends ReactiveCustomElement {
  ...
  template() {
    return this.html`
      <div>
        <child-element data-title=${this.props.title}></child-element>
      </div>
    `;
  }
  ...
}
```

Child custom elements will only rerender if their slots change or if they subscribe to atttibute changes.

Alternatively the parent can call render on the child in one of it's own lifecycle methods.


## Note

Because of the fact the base custom element uses an observed attribute hook you always need to spread the observed attributes like so...
```javascript
static get observedAttributes() {
  return [...super.observedAttributes, 'tag'];
}
```

...or instead remember to add `data-store` to the list...

```javascript
static get observedAttributes() {
  return ['data-store', 'tag'];
}
```

## License

MIT - see LICENSE.md
