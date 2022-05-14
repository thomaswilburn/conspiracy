/*

:attributes="attributeObject"

For each key in the attributeObject, sets the corresponding attribute to its value. If the value is undefined or null, removes the attribute instead. Booleans will also toggle the attribute.

*/

export class AttributesPin {

  static name = "attributes";
  
  target = null;
  path = null;
  previous = {};

  attach(original, node, args, value) {
    this.path = value.split(".");
    this.target = node;
    return node;
  }

  update(params) {
    for (var k in params) {
      var v = params[k];
      if (this.previous[k] == v) continue;
      if (typeof v == "undefined" || v == null) {
        this.target.removeAttribute(k);
      } else if (typeof v == "boolean") {
        this.target.toggleAttribute(k, v);
      } else {
        this.target.setAttribute(k, v);
      }
    }
    Object.assign(this.previous, params);
  }
}

/*

Special helper for the class attribute, toggles items off and on

*/

export class ClassPin {
  static name = "classes";

  target = null;
  path = null;

  attach(original, node, args, value) {
    this.path = value.split(".");
    this.target = node;
    return node;
  }

  update(params) {
    for (var k in params) {
      this.target.classList.toggle(k, !!params[k]);
    }
  }
}