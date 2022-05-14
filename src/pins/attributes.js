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
  Single attribute setter. Usable only for lower-case attributes at this time.
  TODO: add support for upcase using the code from Kudzu.
*/

export class AttrPin {
  static name = "attr";

  target = null;
  attributeName = null;
  previous = null;

  attach(original, node, args, value) {
    var [ attr ] = args;
    this.attributeName = attr;
    this.target = node;
    this.path = value.split(".");
    return node;
  }

  update(value) {
    var attr = this.attributeName;
    if (value == this.previous) return;
    if (typeof value == "undefined" || value == null) {
      this.target.removeAttribute(attr);
    } else if (typeof value == "boolean") {
      this.target.toggleAttribute(attr, value);
    } else {
      this.target.setAttribute(attr, value);
    }
    this.previous = value;
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