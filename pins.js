export class TextPin {
  static directive = "text";

  constructor() {
    this.node = new Text();
  }

  attach(node, params, attrValue) {
    this.key = params || attrValue;
    return this.node;
  }

  update(v) {
    if (v == this.value) return;
    this.node.nodeValue = this.value = v;
  }
}

export class AttributePin {
  static directive = "attr";

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

export class ClassPin {
  static directive = "class";

  attach(node, params, attrValue) {
    this.key = attrValue;
    var [name, ...options] = params.split(".");
    this.className = name;
    this.options = Object.fromEntries(options.map(o => [o, true]));
    this.node = node;
  }

  update(v) {
    if (this.options.not) {
      v = !v;
    }
    this.node.classList.toggle(this.className, v);
  }
}

export class EventPin {
  static directive = "on";
  node = null;
  type = null;
  value = null;

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

export class PropertyPin {
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