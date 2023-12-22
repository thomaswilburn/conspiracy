import { Conspiracy } from "./conspiracy.js";

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

function insertAfter(after, node) {
  if (after.nextSibling) {
    after.parentNode.insertBefore(node, after.nextSibling);
  } else {
    after.parentNode.append(node);
  }
}

export class EachPin extends Pin {
  static directive = "each";
  static terminal = true;
  key = null;
  value = null;
  index = "#";
  conspiracy = null;
  nodes = new WeakMap();

  attach(node, params, loop) {
    var { key, index } = loop.match(/((?<index>\w+)\s+in\s+)?(?<key>[\w\.]+$)/).groups;
    this.key = key;
    this.index = index ?? this.index;
    this.node = new Comment(key);
    this.ender = new Comment("/" + key);
    var template = document.createElement("template");
    var clone = node.cloneNode(true);
    clone.removeAttribute(EachPin.directive + ":" + params);
    template.content.append(clone);
    this.conspiracy = new Conspiracy(template);
  }

  update(collection, context) {
    if (!collection) collection = [];
    if (!this.ender.parentElement) {
      insertAfter(this.node, this.ender);
    }
    var cursor = this.node;
    var key = -1;
    for (var value of collection[Symbol.iterator]()) {
      if (collection instanceof Map) {
        var [key, value] = value;
      } else {
        key++;
      }
      var scope;
      var primitive = false;
      // handle primitive values
      if (!(value instanceof Object)) {
        scope = { "#": key, "@": value };
        primitive = true;
      } else {
        scope = {
          [this.index]: key,
          ...context,
          ...value
        };
      }
      var node = this.nodes.get(value);
      if (!node) {
        node = this.conspiracy.clone();
        if (!primitive) this.nodes.set(value, node);
      }
      node.update(scope);
      if (cursor.nextSibling != node.element) {
        // special case single-item removals by checking the next node
        if (cursor?.nextSibling?.nextSibling == node.element) {
          cursor.nextSibling.remove();
        } else {
          insertAfter(cursor, node.element);
        }
      }
      cursor = node.element;
    }
    // erase nodes that weren't in our array
    while (cursor.nextSibling && cursor.nextSibling != this.ender) {
      cursor.nextSibling.remove();
    }
  }
}

export class HandlePin {
  static directive = "handle";
  key = "";
  value = null;

  attach(node, params, value) {
    this.node = node;
    this.events = params.split(".");
  }

  update(_, context) {
    if (this.value) {
      for (var e of this.events) {
        this.node.removeEventListener(e, this.value);
      }
    }
    for (var e of this.events) {
      this.node.addEventListener(e, context);
    }
    this.value = context;
  }
}