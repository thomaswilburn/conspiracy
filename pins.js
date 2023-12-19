import { Conspiracy } from "./index.js";

class Pin {
  key = null;
  value = null;
  node = null;

  destroy() {
    this.value = null;
  }
}

export class TextPin extends Pin {
  static directive = "text";

  attach(node, params, attrValue) {
    this.node = new Text();
    this.key = params || attrValue;
    return this.node;
  }

  update(v) {
    if (v == this.value) return;
    this.node.nodeValue = this.value = v;
  }
}

export class AttributePin extends Pin {
  static directive = "attr";
  name = null;
  options = {};

  attach(node, params, attrValue) {
    this.key = attrValue;
    var [ name, ...options ] = params.split(".");
    this.name = name;
    this.options = Object.fromEntries(options.map(o => [o, true]));
    this.node = node;
  }

  update(v) {
    if (v == this.value) return;
    if (this.options.not) v = !v;
    this.value = v;
    if (!this.options.toggle && (typeof v == "string" || typeof v == "number")) {
      this.node.setAttribute(this.name, v);
    } else {
      this.node.toggleAttribute(this.name, v);
    }
  }
}

export class ClassPin extends Pin {
  static directive = "class";
  name = null;
  options = {};

  attach(node, params, attrValue) {
    this.key = attrValue;
    var [name, ...options] = params.split(".");
    this.name = name;
    this.options = Object.fromEntries(options.map(o => [o, true]));
    this.node = node;
  }

  update(v) {
    if (this.options.not) {
      v = !v;
    }
    this.node.classList.toggle(this.name, v);
  }
}

export class EventPin extends Pin {
  static directive = "on";
  node = null;
  type = null;

  handleEvent(e) {
    if (this.value) {
      this.value.call(this.node, e);
    }
  }

  attach(node, params, key) {
    this.key = key;
    var [ event, ...args ] = params.split(".");
    var options = Object.fromEntries(args.map(s => [s, true]));
    this.node = node;
    this.node.addEventListener(event, this, options);
  }

  update(v) {
    if (v == this.value) return;
    this.value = v;
  }
}

export class PropertyPin extends Pin {
  static directive = "prop";
  value = null;

  attach(node, params, keypath) {
    this.node = node;
    this.key = keypath;
    this.property = params;
  }

  update(v) {
    if (v == this.value) return;
    this.node[this.property] = this.value = v;
  }
}

export class EachPin extends Pin {
  static directive = "each";
  static terminal = true;
  key = null;
  value = null;
  index = "$";
  conspiracy = null;
  nodes = new WeakMap();

  attach(node, params, loop) {
    var { key, index } = loop.match(/((?<index>\w+)\s+in\s+)?(?<key>[\w\.]+$)/).groups;
    this.key = key;
    this.index = index ?? this.index;
    this.node = new Comment(key);
    this.ender = new Comment("/" + key);
    var template = document.createElement("template");
    node.removeAttribute(EachPin.directive + ":" + params);
    template.content.replaceChildren(node);
    this.conspiracy = new Conspiracy(template);
  }

  update(collection, context) {
    if (!collection) collection = [];
    if (!this.ender.parentElement) {
      this.node.parentNode.insertBefore(this.ender, this.node);
    }
    var cursor = this.node;
    var key = -1;
    for (var value of collection[Symbol.iterator]()) {
      if (collection instanceof Map) {
        var [key, value] = value;
      } else {
        key++;
      }
      var node = this.nodes.get(value);
      if (!node) {
        node = this.conspiracy.clone();
        this.nodes.set(value, node);
      }
      var scope = {
        [this.index]: key,
        ...context,
        ...value
      };
      node.update(scope);
      if (cursor.nextSibling != node.element) {
        cursor.parentElement.insertBefore(node.element, cursor.nextSibling);
      }
      cursor = node.element;
    }
    while (cursor.nextSibling && cursor.nextSibling != this.ender) {
      cursor.nextSibling.remove();
    }
  }
}