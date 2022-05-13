export default class TextPin {

  constructor(marker, path) {
    this.path = this.parseTextPath(path);
    this.node = document.createTextNode("");
    marker.parentNode.replaceChild(this.node, marker);
    this.value = null;
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