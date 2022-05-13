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
    // create the scope object for templating
    var itemData = Object.create(scope);
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
    // if we find them, go ahead and update
    var joined = entries.map(entry => {
      var [ index, item ] = entry;
      var element = this.elements.get(item);
      var conspiracy = undefined;
      if (element) {
        conspiracy = this.conspiracies.get(element);
        matchedElements.add(element);
      }
      if (conspiracy) {
        itemData[itemName] = item;
        itemData[indexName] = index;
        conspiracy.update(itemData)
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
    // iterate through joined objects
    // if they don't match the correct element at this index, we'll insert it
    joined.forEach((join, i) => {
      var { index, item, element, conspiracy } = join;
      itemData[itemName] = item;
      itemData[indexName] = index;
      // if there's no element, create a conspiracy to generate it
      if (!element) {
        conspiracy = new Conspiracy(this.template, { unhosted: true });
        [ element ] = conspiracy.attach(this.start, itemData);
        this.elements.set(item, element);
        this.conspiracies.set(element, conspiracy);
      }
      // if this is the correct place, remove from the existing items
      if (element == existing[0]) {
        existing.shift();
      } else {
        var before = existing[0] || this.end;
        var parent = this.start.parentNode;
        parent.insertBefore(element, before);
      }
    });
  }

}