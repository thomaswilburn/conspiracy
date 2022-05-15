
import { Conspiracy } from "../src/index.js";

export default class ConspiracyElement extends HTMLElement {

  constructor() {
    super();
    var Class = new.target;
    if (Class.template) {
      var root = this.attachShadow({ mode: "open" });
      this.ui = new Conspiracy(Class.template);
      this.ui.attach(root);
    }
  }

  render() {
    if (this.ui) this.ui.update(this);
  }
}