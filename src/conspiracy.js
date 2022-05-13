import TextPin from "./pins/text.js";

const DEFAULTS = {
  namespace: "", // all directives will start with namespace + ":"
  stripAttributes: true, // removes directive attributes from the live DOM
  unhosted: false // applies items after a marker, not in a container root
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

  appendElement(target, element, after = false) {
    if (after) {
      var marker = target.nextSibling;
      var parent = target.parentNode;
      parent.insertBefore(element, marker);
    } else {
      target.appendChild(element);
    }
  }

  attach(root, data = {}) {
    this.root = root;
    // walk the dom and set up bindings
    this.bindings = [];
    this.elements = {};
    var isDirective = new RegExp(`^${this.settings.namespace}:`);
    var walk = (node, dest, after = false) => {
      var clone = node.cloneNode(false);
      // go ahead and add this in place
      // structural directives can then replace it
      this.appendElement(dest, clone, after);

      // cursor tracks our place in the DOM
      // if a pin replaces the cloned element, it'll return a new cursor value
      // we really only need this for loops, which are "unhosted" roots
      var cursor = clone;

      // was this a text comment representing an inline value?
      if (clone instanceof Comment) {
        var data = clone.data.trim();
        if (isDirective.test(data)) {
          var inline = new TextPin();
          cursor = inline.attach(clone, data);
          this.bindings.push({ path: inline.path, pin: inline });
          // return early, there's no more attributes or subtree for comments
          return cursor;
        }
      }

      // check for directives
      if ("attributes" in node) {
        var attributes = Array.from(node.attributes);
        var directives = attributes.filter(a => isDirective.test(a.name));
        // get flags and element replacement from the processing
        var { terminated, cursor } = this.processDirectives(directives, node, clone);
        // if a structural directive indicated that it was terminal, stop processing here
        if (terminated) return cursor;
      }

      // process children
      if ("childNodes" in node && node.childNodes.length) {
        for (var child of node.childNodes) {
          walk(child, clone);
        }
      }
      // return the latest element added to the DOM
      return cursor;
    };
    // walk the initial set of nodes
    var starter = Array.from(this.template.content.childNodes);
    var root = this.root;
    var { unhosted } = this.settings;
    for (var top of starter) {
      var result = walk(top, root, unhosted);
      // when unhosted, insert each node after the previous
      if (unhosted) {
        root = result;
      }
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

  processDirectives(directives, original, clone) {
    var terminated = false;
    var cursor = clone;
    for (var d of directives) {
      var parsed = this.parseDirectiveName(d.name);

      // special handling for references
      if (parsed.directive == "element") {
        this.elements[d.value] = clone;
        continue;
      }

      if (parsed.directive in Conspiracy.directives) {
        // get the directive class and instantiate it
        var PinClass = Conspiracy.directives[parsed.directive];
        var pin = new PinClass();
        // the pin can replace the element on attachment, in which case we update the cursor
        cursor = pin.attach(clone, parsed.args, d.value);
        if (terminated && pin.terminal) {
          console.warn("Multiple terminal directives assigned to a single node", original);
        }
        var { path } = pin;
        // if the pin is reactive, add it to our bindings list
        if (path) {
          this.bindings.push({ path, pin });
        }
        terminated = terminated || pin.terminal;
        if (this.settings.stripAttributes && "removeAttribute" in clone) {
          clone.removeAttribute(d.name);
        }
      }
    }
    return { terminated, cursor };
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