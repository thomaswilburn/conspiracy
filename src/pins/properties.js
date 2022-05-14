import Conspiracy from "../conspiracy.js";
var { setPath } = Conspiracy;

export class AssignPin {
  static name = "assign";

  target = null;
  path = null;
  previous = {};

  attach(original, node, args, value) {
    this.target = node;
    this.path = value.split(".");
    return node;
  }

  update(props) {
    for (var k in props) {
      var path = k.split(".");
      setPath(this.target, path, props[k]);
    }
  }
}

export class StylePin extends AssignPin {
  static name = "styles";

  attach(original, node, args, value) {
    super.attach(original, node.style, args, value);
    return node;
  }
}

export class DatasetPin extends AssignPin {
  static name = "dataset";

  attach(original, node, args, value) {
    super.attach(original, node.dataset, args, value);
    return node;
  }
}