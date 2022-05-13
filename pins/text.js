export default class TextPin {
  constructor(startMarker, path) {
    this.start = startMarker;
    this.path = path;
    this.node = document.createTextNode("");
    this.start.parentNode.insertBefore(this.node, this.start.nextSibling);
    this.value = null;
  }

  update(text) {
    if (text == this.value) return;
    this.node.data = String(text);
    this.value = text;
  }
}