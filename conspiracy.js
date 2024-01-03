export function getPath(target, pathstring) {
  var path = pathstring.split(".");
  for (var segment of path) {
    if (!segment) continue;
    target = target[segment];
    if (target == undefined) break;
  }
  return target;
}

function* childNodes(target) {
  var child = target.firstChild;
  var i = 0;
  while (child) {
    yield [child, i++];
    child = child.nextSibling;
  }
}

export class ConspiracyBinding {
  pins = [];
  refs = {};
  dom;
  element;

  constructor(result, data) {
    Object.assign(this, result);
    this.element = this.dom.firstElementChild;
    if (data) this.update(data);
  }

  update(data) {
    for (var pin of this.pins) {
      var value = getPath(data, pin.key);
      pin.update(value, data);
    }
  }

  destroy() {
    for (var pin of this.pins) {
      pin.destroy();
    }
    this.pins = null;
    this.refs = null;
    this.dom = null;
    this.elements = null;
  }
}

export class Conspiracy {
  static registry = {};
  paths = [];
  template = null;
  targets = new WeakMap();

  static fromString(source) {
    var template = document.createElement("template");
    template.innerHTML = source.trim();
    return new Conspiracy(template);
  }

  constructor(template) {
    this.template = template;
  }

  getLocalDirectives(elements) {
    return {
      ...Conspiracy.registry,
      ref: class ElementPin {
        static forget = true;
        constructor(node, params, value) {
          this.node = node;
          elements[params || value] = node;
        }
      }
    };
  }

  cloneFromPaths() {
    var dom = new DocumentFragment();
    var refs = {};
    var pins = [];

    var directives = this.getLocalDirectives(refs);

    dom.append(this.template.content.cloneNode(true));

    for (var { Pin, path, params, value } of this.paths) {
      var clone = this.findByIndices(dom, path);
      var pin = new Pin(clone, params, value);
      if (!Pin.forget) pins.push(pin);
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

    var directives = this.getLocalDirectives(refs);

    var crawl = (node, cloneParent, path = []) => {
      var clone = node.cloneNode();
      var matches = [];
      if (node.nodeType == Node.COMMENT_NODE) {
        // special case text comments
        var [ directive, params ] = node.nodeValue.trim().split(":");
        if (directive == "text") {
          matches.push([directives.text, params, value]);
        }
      } else if (node.nodeType == Node.ELEMENT_NODE) {
        // filter attributes for class matches and sort by terminal status
        for (var { name, value} of node.attributes) {
          if (!name.includes(":")) continue;
          var [ d, params ] = name.split(":");
          if (d in directives) matches.push([directives[d], params, value]);
        }
        matches.sort(([a], [b]) => (b.terminal ? 1 : 0) - (a.terminal ? 1 : 0));
      }
      for (var [Pin, params, value] of matches) {
        var pin = new Pin(Pin.terminal ? node : clone, params, value);
        clone = pin.node;
        if (!Pin.forget) pins.push(pin);
        this.paths.push({ Pin, params, value, path });
        if (Pin.terminal) {
          cloneParent.append(clone);
          return;
        }
      }
      cloneParent.append(clone);
      for (var [child, i] of childNodes(node)) {
        crawl(child, clone, [...path, i++])
      }
    }

    for (var [child, i] of childNodes(this.template.content)) {
      crawl(child, dom, [i])
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

  clone(data) {
    var result = this.paths == 0 ? this.cloneFromTemplate() : this.cloneFromPaths();
    return new ConspiracyBinding(result, data);
  }

  renderTo(target, data) {
    var fragment = this.clone();
    target.replaceChildren(fragment.dom);
    if (data) fragment.update(data);
    return fragment;
  }

  static registerDirective(Class) {
    this.registry[Class.directive] = Class;
  }
}
