import { Conspiracy } from "./conspiracy.js";

var instances = new WeakMap();

export class ConspiracyElement extends HTMLElement {
  #scheduled = false;

  constructor() {
    super();
    this.render = this.render.bind(this);
    var Class = new.target;
    if (Class.template) {
      this.attachShadow({ mode: "open" });
      var conspiracy = instances.get(Class);
      if (!conspiracy) {
        conspiracy = Class.template instanceof HTMLElement ?
          new Conspiracy(Class.template) :
          Conspiracy.fromString(Class.template);
        instances.set(Class, conspiracy)
      }
      this.ui = conspiracy.renderTo(this.shadowRoot);
      queueMicrotask(this.render);
    }
  }

  render() {
    if (this.#scheduled) return;
    this.#scheduled = true;
    queueMicrotask(() => {
      this.#scheduled = false;
      this.ui.update(this);
    });
  }
}