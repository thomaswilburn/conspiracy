/*

:each="item, index of iterable on key"

Easily the most complicated directive, this terminal class provides looping for iterable collections. If the collection doesn't have Symbol.iterator, Object.entries() will be used to loop over its key/value pairs. The "on key" syntax lets you specify a property that is used to match elements to their data, preventing needless DOM churn.

*/

import Conspiracy from "../conspiracy.js";

export default class EachPin {
  static name = "each";

  terminal = true;
  template = null;
  elements = new WeakMap();
  conspiracies = new WeakMap();

  attach(template, element, args, value) {
    var parsed = this.parseAttribute(value);
    this.path = parsed.path;
    this.config = parsed;
    this.start = document.createComment(value);
    this.end = document.createComment("end " + value);
    element.parentNode.replaceChild(this.end, element);
    this.end.parentNode.insertBefore(this.start, this.end);
    this.template = document.createElement("template");
    var cloned = template.cloneNode(true);
    this.template.content.appendChild(cloned);
    return this.end;
  }

  parseAttribute(text) {
    // match parts with named regex
    var re = /(?<itemName>\w+)(,\s*(?<indexName>\w+))?\s+of\s+(?<keyPath>[\w\.]+)(\s+on\s+(?<keyName>\w+))?/;
    var matches = text.match(re);
    if (!matches) throw `Unable to parse iteration statement "${text}"`;
    var { itemName, indexName, keyName } = matches.groups;
    var path = matches.groups.keyPath.split(".");
    return { itemName, indexName, keyName, path };
  }

  update(collection, scope) {
    var { itemName, indexName } = this.config;
    // get existing elements between the two markers
    var existing = [];
    var cursor = this.start;
    while (cursor != this.end) {
      if (cursor instanceof HTMLElement) {
        existing.push(cursor);
      }
      cursor = cursor.nextSibling;
    }
    // convert collection into a uniform entry list
    var entries = "entries" in collection ? [...collection.entries()] : Object.entries(collection);
    var matchedElements = new Set();
    // assemble elements and conspiracies to match items
    var joined = entries.map(entry => {
      var [ index, item ] = entry;
      var element = this.elements.get(item);
      var conspiracy = undefined;
      if (element) {
        conspiracy = this.conspiracies.get(element);
        matchedElements.add(element);
      }
      return { index, item, element, conspiracy }
    });
    // remove unmatched elements
    existing = existing.filter(e => {
      var matched = matchedElements.has(e);
      if (!matched) {
        e.remove();
      }
      return matched;
    });
    // create the scope object for templating
    var itemData = Object.create(scope);
    // iterate through joined objects, adding/updated elements
    joined.forEach(function(join, i) {
      var cursor = existing[i];
      var { index, item, element, conspiracy } = join;
      // if there's no conspiracy, make one
      // if there's no element, render the conspiracy to generate it
      // if the element doesn't match the current cursor, insert it and modify existing
    });
  }

}