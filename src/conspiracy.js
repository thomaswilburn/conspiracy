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
    var isDirective = new RegExp(`^${this.settings.namespace}:`);
    var walk = (node, to) => {
      var clone = node.cloneNode(false);
      // go ahead and add this in place
      // structural directives can then replace it
      to.append(clone);

      // was this a text comment representing an inline value?
      if (clone instanceof Comment) {
        var data = clone.data.trim();
        if (isDirective.test(data)) {
          var inline = new TextPin(clone, data);
          this.bindings.push({ path: inline.path, pin: inline });
        }
      }

      // check for directives
      if ("attributes" in node) {
        var attributes = Array.from(node.attributes);
        var directives = attributes.filter(a => isDirective.test(a.name));
        var terminated = this.processDirectives(directives, node, clone);
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

  update(data) {
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

  processDirectives(directives, node, clone) {
    var terminated = false;
    for (var d of directives) {
      var parsed = this.parseDirectiveName(d.name);

      // special handling for references
      if (parsed.directive == "element") {
        this.elements[d.value] = clone;
        continue;
      }

      if (parsed.directive in Conspiracy.directives) {
        if (terminated && pin.terminal) {
          console.warn("Multiple terminal directives assigned to a single node", node);
        }
        // get the directive class and instantiate it
        var PinClass = Conspiracy.directives[parsed.directive];
        var pin = new PinClass(clone, parsed.args, d.value);
        var { path } = pin;
        // if the pin is reactive, add it to our bindings list
        if (path) {
          this.bindings.push({ path, pin });
        }
        terminated = terminated || pin.terminal;
        if (this.settings.stripAttributes) {
          clone.removeAttribute(d.name);
        }
      }
    }
    return terminated;
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