export default class IfPin {
  static name = "if";

  constructor(element, args, attribute) {
    var comment = document.createComment(` if=${attribute} `);
    this.element = element;
    this.placeholder = comment;
    this.path = attribute.split(".");
    element.parentNode.replaceChild(comment, element);
  }

  update(value) {
    var { element, placeholder } = this;
    if (value) {
      placeholder.parentNode.insertBefore(element, placeholder);
    } else {
      element.remove();
    }
  }
}