import * as pins from "./pins.js";
var { TextPin } = pins;

export function getPath(target, pathstring) {
  var path = pathstring.split(".");
  for (var segment of path) {
    target = target[segment];
    if (target == undefined) {
      return undefined;
    }
  }
  return target;
}

export class ConspiracyFragment {
  constructor(result) {
    Object.assign(this, result);
    this.element = this.dom.firstElementChild;
  }

  populate(target, data) {
    target.replaceChildren(this.dom);
    this.dom = null;
    if (data) this.update(data);
  }

  update(data) {
    for (var pin of this.pins) {
      var { key } = pin;
      var value = getPath(data, key);
      pin.update(value);
    }
  }
}

export class Conspiracy {
  static directives = {};
  paths = [];
  template = null;
  targets = new WeakMap();

  constructor(template) {
    this.template = template;
    // trim text nodes from the start and end
    var child = template.content.firstChild;
    while (child.nodeType == Node.TEXT_NODE && !child.nodeValue.trim()) {
      var next = child.nextSibling;
      child.remove();
      child = next;
    }
    child = template.content.lastChild;
    while (child.nodeType == Node.TEXT_NODE && !child.nodeValue.trim()) {
      var previous = child.previousSibling;
      child.remove();
      child = previous;
    }
  }

  generateElementPin(elements) {
    return {
      ...Conspiracy.directives,
      ref: class ElementPin {
        static forget = true;
        attach(node, params) {
          elements[params] = node;
        }
      }
    };
  }

  cloneFromPaths() {
    var dom = new DocumentFragment();
    var refs = {};
    var pins = [];

    var directives = this.generateElementPin(refs);

    dom.append(this.template.content.cloneNode(true));

    for (var { directive, path, params, value } of this.paths) {
      var clone = this.findByIndices(dom, path);
      var PinClass = directives[directive];
      var pin = new PinClass();
      pin.attach(clone, params, value);
      if (!PinClass.forget) pins.push(pin);
      if (pin.node && pin.node != clone) {
        clone.parentNode.replaceChild(pin.node, clone);
      }
    }

    return { dom, pins, refs };
  }

  cloneFromTemplate() {
    var dom = new DocumentFragment();
    var refs = {};
    var pins = [];

    var directives = this.generateElementPin(refs);

    var crawl = (node, cloneParent, path = []) => {
      var clone = node.cloneNode();
      if (node.nodeType == Node.COMMENT_NODE) {
        // special case text comments
        var [ directive, params ] = node.nodeValue.trim().split(":");
        if (directive == "text") {
          var pin = new TextPin();
          pin.attach(null, params);
          clone = pin.node;
          pins.push(pin);
          this.paths.push({ directive, params, path });
        }
      } else if (node.nodeType == Node.ELEMENT_NODE) {
        for (var attr of node.attributes) {
          var { name, value } = attr;
          if (!name.match(/:/)) continue;
          var [ directive, params ] = name.split(":");
          if (directive in directives) {
            var PinClass = directives[directive];
            var pin = new PinClass();
            pin.attach(clone, params, value);
            clone = pin.node ?? clone;
            if (!PinClass.forget) pins.push(pin);
            this.paths.push({ directive, params, value, path });
          }
        }
      }
      cloneParent.append(clone);
      var child = node.firstChild;
      var i = 0;
      while (child) {
        crawl(child, clone, [...path, i++]);
        child = child.nextSibling;
      }
    }

    var child = this.template.content.firstChild;
    var top = 0;
    while (child) {
      crawl(child, dom, [top++]);
      child = child.nextSibling;
    }

    return { dom, pins, refs };
  }

  findByIndices(target, path) {
    var node = target;
    for (var index of path) {
      node = node.childNodes[index];
    }
    return node;
  }

  clone() {
    var result = this.paths == 0 ? this.cloneFromTemplate() : this.cloneFromPaths();
    return new ConspiracyFragment(result);
  }

  renderTo(target, data) {
    var fragment = this.clone();
    fragment.populate(target, data);
    return fragment;
  }
}

for (var PinClass of Object.values(pins)) {
  var { directive } = PinClass;
  if (!directive) continue;
  Conspiracy.directives[directive] = PinClass;
}