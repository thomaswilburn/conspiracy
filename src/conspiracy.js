import TextPin from "./pins/text.js";

const DEFAULTS = {
  namespace: "", // all directives will start with namespace + ":"
  unhosted: false, // applies items after a marker, not in a container root
  stripDirectives: false // remove directive attributes from the output
};

export const LIVE = Symbol("Conspiracy live value");

export class Conspiracy {
  bindings = [];
  root = null;
  template = null;
  elements = {};
  previous = null;
  publishers = new WeakMap();
  subscriptions = new WeakMap();

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
          var inline = new TextPin(this.settings, this);
          cursor = inline.attach(node, clone, data);
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
    var created = [];
    for (var top of starter) {
      var result = walk(top, root, unhosted);
      // when unhosted, insert each node after the previous
      if (unhosted) {
        root = result;
      }
      created.push(result);
    }
    // run the initial update
    this.update(data);
    // return elements for later association (see: loops)
    return created;
  }

  update(data) {
    for (var { pin, path } of this.bindings) {
      var chain = Conspiracy.getPathChain(data, path);
      var value = chain.at(-1);
      var pub = chain.findLast(link => link instanceof Object && LIVE in link);
      if (pub) {
        var pathFromPub = path.slice(chain.lastIndexOf(pub));
        this.watch(pin, pub, pathFromPub);
      }
      pin.update(value, data);
    }
    this.previous = data;
  }

  watch(pin, publisher, path) {
    var watching = this.subscriptions.get(pin);
    // nothing to do
    if (watching && publisher == watching.publisher) return;
    if (watching) {
      // unsubscribe and remove pin from publisher dependency list
      var ex = watching.publisher[LIVE];
      watching.publisher.removeEventListener(ex, this);
      var deps = this.publishers.get(watching.publisher)
      deps.delete(pin);
    }
    this.subscriptions.set(pin, {
      publisher,
      pin,
      path: path.slice(path.lastIndexOf(publisher) + 1)
    });
    var dependencies = this.publishers.get(publisher);
    if (!dependencies) {
      dependencies = new Set();
      this.publishers.set(publisher, dependencies);
    }
    dependencies.add(pin);
    publisher.addEventListener(publisher[LIVE], this);
  }

  handleEvent(e) {
    var source = e.target;
    var dependencies = this.publishers.get(source);
    for (var pin of dependencies) {
      var sub = this.subscriptions.get(pin);
      var value = Conspiracy.getPath(source, sub.path);
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
    var terminated = [];
    var cursor = clone;
    for (var d of directives) {
      var parsed = this.parseDirectiveName(d.name);

      // special handling for references
      if (parsed.directive == "element") {
        this.elements[d.value] = clone;
        if (this.settings.stripDirectives) {
          clone.attributes.removeNamedItem(d.name);
        }
        continue;
      }

      if (parsed.directive in Conspiracy.directives) {
        // get the directive class and instantiate it
        var PinClass = Conspiracy.directives[parsed.directive];
        var pin = new PinClass(this.settings, this);
        if (pin.terminal) {
          // track these
          terminated.push(PinClass.name);
        }
        // remove attributes from the clone
        if (this.settings.stripDirectives) {
          clone.attributes.removeNamedItem(d.name);
        }
        // the pin can replace the element on attachment, in which case we update the cursor
        cursor = pin.attach(original, clone, parsed.args, d.value, d);
        
        var { path } = pin;
        // if the pin is reactive, add it to our bindings list
        if (path) {
          this.bindings.push({ path, pin });
        }
      }
    }
    // since terminal directives "own" their subtrees, you should only have one per node
    if (terminated.length > 1) {
      console.warn(`Multiple terminal directives (${terminated.join(", ")} on a single node`);
    }
    terminated = terminated.length > 0;
    return { terminated, cursor };
  }

  static getPathChain(object, keyPath) {
    var search = object;
    var links = [search];
    var terminal = keyPath.at(-1);
    for (var i = 0; i < keyPath.length - 1; i++) {
      var k = keyPath[i];
      if (!(k in search)) {
        links.push(undefined);
        return links;
      }
      search = search[k];
      links.push(search);
    }
    links.push(search[terminal]);
    return links;
  }

  static getPath(object, keyPath) {
    return Conspiracy.getPathChain(object, keyPath).at(-1);
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