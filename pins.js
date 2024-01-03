import { Conspiracy } from "./conspiracy.js";

export class Pin {
  key;
  value;
  node;

  constructor(node, key) {
    this.node = node;
    this.key = key;
  }

  destroy() {
    this.value = null;
    this.node = null;
  }
}

export class TextPin extends Pin {
  static directive = "text";

  constructor(_, params, attrValue) {
    var node = new Text();
    super(node, params || attrValue);
  }

  update(v) {
    if (v == this.value) return;
    this.node.nodeValue = this.value = v;
  }
}

export class AttributePin extends Pin {
  static directive = "attr";
  options = {};
  name;

  constructor(node, params = "", key = "") {
    super(node, key);
    var [ name, ...options ] = params.split(".");
    this.name = name;
    this.options = Object.fromEntries(options.map(o => [o, true]));
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
  options = {};
  name;

  constructor(node, params, key) {
    super(node, key);
    var [name, ...options] = params.split(".");
    this.name = name;
    this.options = Object.fromEntries(options.map(o => [o, true]));
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
  event;

  handleEvent(e) {
    if (this.value) {
      this.value.call(this.node, e);
    }
  }

  constructor(node, params, key) {
    super(node, key);
    var [ event, ...args ] = params.split(".");
    this.event = event;
    var options = Object.fromEntries(args.map(s => [s, true]));
    this.node.addEventListener(event, this, options);
  }

  update(v) {
    if (v == this.value) return;
    this.value = v;
  }

  destroy() {
    this.node.removeEventListener(this.event, this);
    super.destroy();
  }
}

export class PropertyPin extends Pin {
  static directive = "prop";
  static pattern = /((?<prop>\w+)\s*=\s*)?(?<key>[\w\.]+)/;

  constructor(node, params, keypath) {
    var { key, prop } = keypath.match(PropertyPin.pattern).groups;
    super(node, key);
    this.property = prop || params;
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
  static pattern = /((?<index>\w+)\s+in\s+)?(?<key>[\w\.]+$)/;
  index = "#";
  nodes = new WeakMap();
  conspiracy;

  constructor(node, params, loop) {
    var { key, index } = loop.match(EachPin.pattern).groups;
    super(new Comment(key), key);
    this.index = index ?? this.index;
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

export class HandlePin extends Pin {
  static directive = "handle";

  constructor(node, params, value) {
    super(node);
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