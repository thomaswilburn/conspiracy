export function getPath(target, pathstring) {
  var path = pathstring.split(".");
  for (var segment of path) {
    target = target[segment];
    if (target == undefined) break;
  }
  return target;
}

function eachChild(target, fn) {
  var child = target.firstChild;
  var i = 0;
  while (child) {
    fn(child, i++);
    child = child.nextSibling;
  }
}

export class ConspiracyBinding {
  pins = [];
  refs = {};
  dom = null;
  element = null;

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
        attach(node, params, value) {
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

    for (var { PinClass, path, params, value } of this.paths) {
      var clone = this.findByIndices(dom, path);
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

    var directives = this.getLocalDirectives(refs);

    var crawl = (node, cloneParent, path = []) => {
      var clone = node.cloneNode();
      var terminated = false;
      if (node.nodeType == Node.COMMENT_NODE) {
        // special case text comments
        var [ directive, params ] = node.nodeValue.trim().split(":");
        if (directive == "text") {
          var PinClass = directives[directive];
          var pin = new PinClass();
          pin.attach(null, params);
          clone = pin.node;
          pins.push(pin);
          this.paths.push({ PinClass, params, path });
        }
      } else if (node.nodeType == Node.ELEMENT_NODE) {
        // filter attributes for class matches and sort by terminal status
        var matches = [];
        for (var { name, value} of node.attributes) {
          if (!name.includes(":")) continue;
          var [ d, params ] = name.split(":");
          if (d in directives) matches.push([directives[d], params, value]);
        }
        matches.sort(([a], [b]) => (b.terminal ? 1 : 0) - (a.terminal ? 1 : 0));
        for (var [PinClass, params, value] of matches) {
          var pin = new PinClass();
          if (PinClass.terminal) {
            terminated = true;
            pin.attach(node, params, value);
          } else {
            pin.attach(clone, params, value);
          }
          clone = pin.node;
          if (!PinClass.forget) pins.push(pin);
          this.paths.push({ PinClass, params, value, path });
          if (terminated) break;
        }
      }
      cloneParent.append(clone);
      if (terminated) return;
      eachChild(node, (child, i) => crawl(child, clone, [...path, i++]));
    }

    eachChild(this.template.content, (child, i) => crawl(child, dom, [i]))

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
