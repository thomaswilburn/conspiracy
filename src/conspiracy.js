import TextPin from "./pins/text.js";

const DEFAULTS = {
  namespace: "", // all directives will start with namespace + ":"
  stripAttributes: true, // removes directive attributes from the live DOM
};

export default class Conspiracy {
  bindings = [];
  root = null;
  template = null;
  rendered = false;
  data = null;
  elements = {};

  constructor(template, config = {}) {
    this.setupTemplate(template);
    this.settings = {...DEFAULTS, ...config};
  }

  setupTemplate(template) {
    if (template instanceof HTMLTemplateElement) {
      this.template = template;
    } else {
      this.template = document.createElement("template");
      if (typeof template == "string") {
        this.template.innerHTML = template;
      } else if ("cloneNode" in template) {
        this.template.content.append(template.cloneNode(true));
      }
    }
    return this.template;
  }

  attach(root, data = {}) {
    this.root = root;
    // walk the dom and set up bindings
    this.bindings = [];
    this.elements = {};
    var matchDirective = new RegExp(`^${this.settings.namespace}:`);
    var walk = (node, to) => {
      var clone = node.cloneNode(false);
      // go ahead and add this in place
      // structural directives can then replace it
      to.append(clone);

      // was this a text comment representing an inline value?
      if (clone instanceof Comment) {
        var data = clone.data.trim();
        if (matchDirective.test(data)) {
          this.addDirective(TextPin, clone, data);
        }
      }

      // check for directives
      if ("attributes" in node) {
        var attributes = Array.from(node.attributes);
        var directives = attributes.filter(a => matchDirective.test(a.name));
        var terminated = false;
        for (var d of directives) {
          var parsed = this.parseDirectiveName(d.name);

          // special handling for references
          if (parsed.directive == "element") {
            this.elements[d.value] = clone;
          }

          if (parsed.directive in Conspiracy.directives) {
            if (terminated && pin.terminal) {
              console.warn("Multiple terminal directives assigned to a single node", node);
            }
            var PinClass = Conspiracy.directives[parsed.directive];
            var pin = this.addDirective(PinClass, clone, parsed.args, d.value);
            terminated = terminated || pin.terminal;
            if (this.settings.stripAttributes) {
              clone.removeAttribute(d.name);
            }
          }
        }
        // if a structural directive indicated that it was terminal, stop processing here
        if (terminated) return;
      }

      // process children
      if ("childNodes" in node && node.childNodes.length) {
        for (var child of node.childNodes) {
          walk(child, clone);
        }
      }
    };
    // walk the initial set of nodes
    for (var top of this.template.content.childNodes) {
      walk(top, this.root);
    }
    // run the initial update
    this.update(data);
  }

  addDirective(Class, element, args, value) {
    var pin = new Class(element, args, value);
    var { path } = pin;
    if (path) {
      this.bindings.push({ path, pin });
    }
    return pin;
  }

  update(data) {
    // remember this for patches
    this.data = data;
    for (var { pin, path } of this.bindings) {
      var value = Conspiracy.getPath(data, path);
      pin.update(value);
    }
  }

  parseDirectiveName(name) {
    // strip off the front
    var [namespace, remains] = name.split(":");
    var [directive, ...args] = remains.split(".");
    return { namespace, directive, args };
  }

  static getPath(object, keyPath) {
    var search = object;
    for (var k of keyPath) {
      if (!(k in search)) {
        return undefined;
      }
      search = search[k];
    }
    return search;
  }

  static setPath(object, keyPath, value) {
    // make a copy and pull off the last item
    keyPath = keyPath.slice();
    var final = keyPath.pop();
    var search = object;
    for (var k of keyPath) {
      if (!(k in search)) {
        search[k] = {};
      }
      search = search[k];
    }
    search[final] = value;
  }

  static directives = {};

  static registerDirective(Class) {
    Conspiracy.directives[Class.name] = Class;
  }
}