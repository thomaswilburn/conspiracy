/*

Text pins create and update inline text nodes

*/

export default class TextPin {
  value = null;
  node = document.createTextNode("");

  attach(template, marker, path) {
    this.path = this.parseTextPath(path);
    marker.parentNode.replaceChild(this.node, marker);
    return this.node;
  }

  update(text) {
    if (text == this.value) return;
    this.node.data = String(text);
    this.value = text;
  }

  parseTextPath(data) {
    var [namespace, rest] = data.split(":");
    var path = rest.split(".");
    return path;
  }

}