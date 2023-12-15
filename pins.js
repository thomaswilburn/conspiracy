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
  static forget = true;

  attach(node, params, dispatch) {
    var [ event, ...args ] = params.split(".");
    var options = {
      bubbles: true,
      ...Object.fromEntries(args.map(s => [s, true]))
    }
    node.addEventListener(event, function(e) {
      e.target.dispatchEvent(new Event(dispatch, options));
    }, options);
  }
}