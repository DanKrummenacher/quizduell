// Web components can end up registered twice when test bundles include them via
// more than one entry point. Make registration idempotent, as Storybook does.
const define = customElements.define.bind(customElements);
customElements.define = (name, constructor, options) => {
  if (!customElements.get(name)) {
    define(name, constructor, options);
  }
};
