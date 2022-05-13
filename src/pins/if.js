/*

:if adds or removes an element from the DOM based on the truthiness of its input
:if.not to reverse

*/

export default class IfPin {
  static name = "if";

  attach(element, args = [], attribute = "") {
    var comment = document.createComment(` if=${attribute} `);
    this.element = element;
    this.placeholder = comment;
    this.path = attribute.split(".");
    this.reverse = args.includes("not");
    element.parentNode.replaceChild(comment, element);
    return comment;
  }

  update(value) {
    var { element, placeholder } = this;
    if (this.reverse) value = !value;
    if (value) {
      placeholder.parentNode.insertBefore(element, placeholder);
    } else {
      element.remove();
    }
  }
}