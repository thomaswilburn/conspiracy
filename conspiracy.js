const DEFAULTS = {
  prefix: "c", // all directives will start with prefix + ":"
};

export default class Conspiracy {
  bindings = [];
  root = null;
  template = null;
  rendered = false;
  data = null;

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
    var matchDirective = new RegExp(`^${this.settings.prefix}:`);
    var walk = (node, to) => {
      var clone = node.cloneNode(false);
      // go ahead and add this in place
      // structural directives can then replace it
      to.append(clone);
      // check for directives
      if ("attributes" in node) {
        var attributes = Array.from(node.attributes);
        var directives = attributes.filter(a => a.name.match(matchDirective));
        var terminated = false;
        for (var d of directives) {
          var parsed = this.parseDirectiveName(d.name);
          // process structural directives first
          if (parsed.directive in Conspiracy.directives.structural) {
            if (terminated) {
              console.warn("Multiple structural directives assigned to a single node", node);
            }
            var PinClass = Conspiracy.directives.structural[parsed.directive];
            var pin = this.addDirective(PinClass, clone, parsed.args, d.value);
            terminated = terminated || pin.terminal;
          }
          // process state directives second
          if (parsed.directive in Conspiracy.directives.state) {
            var PinClass = Conspiracy.directives.state[parsed.directive];
            this.addDirective(PinClass, clone, parsed.args, d.value);
          }
        }
        // if a structural directive indicated that it was terminal, continue
        // it will have handled the append and subtree itself
        if (terminated) return;
      }
      // was this a text comment representing an inline value?
      if (clone instanceof Comment) {
        var data = clone.data.trim();
        if (data.match(matchDirective)) {
          var path = this.parseTextPath(data);
          this.addDirective(TextPin, clone, path);
        }
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

  patch(partial) {

  }

  parseTextPath(data) {
    // strip off the front, then break into path segments
    var [_, keys] = data.split(":");
    return keys.split(".");
  }

  parseDirectiveName(name) {
    // strip off the front
    var [prefix, remains] = name.split(":");
    var [directive, ...args] = remains.split(".");
    return { prefix, directive, args };
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

  static lookups = {
    elements: new WeakMap(),
    instances: new WeakMap(),
    data: new WeakMap(),
    link(element, instance) {
      Conspiracy.lookups.elements.set(instance, element);
      Conspiracy.lookups.instances.set(element, instance);
    }
  }

  static directives = {
    structural: {},
    state: {}
  };

  static registerDirective(name, Class) {
    var lookup = Class.structural ? Conspiracy.directives.structural : Conspiracy.directives.state;
    lookup[name] = Class;
  }
}

// import and register pins
import IfPin from "./pins/if.js";
Conspiracy.registerDirective("if", IfPin);
import EventPin from "./pins/event.js";
Conspiracy.registerDirective("on", EventPin);

// text is different, because it's inline comments, not attributes
import TextPin from "./pins/text.js";
