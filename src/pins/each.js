/*

:each="item, index of iterable on key"

Easily the most complicated directive, this terminal class provides looping for iterable collections. If the collection doesn't have Symbol.iterator, Object.entries() will be used to loop over its key/value pairs. The "on key" syntax lets you specify a property that is used to match elements to their data, preventing needless DOM churn.

*/

import Conspiracy from "../conspiracy.js";

var elementFromKey = new WeakMap();
var conspiracyFromElement = new WeakMap();

export default class EachPin {
  static name = "each";

  terminal = true;
  template = null;

  attach(element, args, value) {
    var parsed = this.parseAttribute(value);
    this.path = parsed.path;
    this.config = parsed;
    this.start = document.createComment(value);
    this.end = document.createComment("end " + value);
    element.parentNode.replaceChild(this.end, element);
    this.end.parentNode.insertBefore(this.start, this.end);
    this.template = document.createElement("template");
    this.template.content.appendChild(element.cloneNode(true));
    return this.end;
  }

  parseAttribute(text) {
    // match parts with named regex
    var re = /(?<item>\w+)(,\s*(?<index>\w+))?\s+of\s+(?<keyPath>[\w\.]+)(\s+on\s+(?<key>\w+))?/;
    var matches = text.match(re);
    if (!matches) throw `Unable to parse iteration statement "${text}"`;
    var { item, index, key } = matches.groups;
    var path = matches.groups.keyPath.split(".");
    return { item, index, key, path };
  }

  update(value) {
    // collect all elements between the two markers
    // attempt to match them against data, keyed elements first
    // remove elements that didn't have any matches
    // create/load a Conspiracy for each item and apply it to the cloned element
  }

}