
var upcase = {};
`
preserveAspectRatio viewBox textContent baseFrequency
baseProfile calcMode clipPathUnits contentScriptType
contentStyleType diffuseConstant edgeMode filterRes
filterUnits gradientTransform gradientUnits kernelMatrix
kernelUnitLength keyPoints keySplines keyTimes 
lengthAdjust limitingConeAngle maskContentUnits
maskUnits numOctaves pathLength patternContentUnits
patternTransform patternUnits pointsAtX pointsAtY
pointsAtZ preserveAlpha primitiveUnits repeatCount
repeatDur requiredFeatures refX refY specularConstant
specularExponent spreadMethod startOffset stdDeviation
stitchTiles surfaceScale systemLanguage tableValues
targetX targetY textLength viewTarget xChannelSelector
yChannelSelector zoomAndPan
`.trim().split(/\s+/)
  .forEach(a => upcase[a.toLowerCase()] = a);

/*

:attributes="attributeObject"

For each key in the attributeObject, sets the corresponding attribute to its value. If the value is undefined or null, removes the attribute instead. Booleans will also toggle the attribute.

*/

export class AttributesPin {

  static name = "attributes";
  
  target = null;
  path = null;
  previous = {};

  attach(original, node, args, value) {
    this.path = value.split(".");
    this.target = node;
    return node;
  }

  update(params) {
    for (var k in params) {
      var v = params[k];
      if (this.previous[k] == v) continue;
      if (k in upcase) k = upcase[k];
      if (typeof v == "undefined" || v == null) {
        this.target.removeAttribute(k);
      } else if (typeof v == "boolean") {
        this.target.toggleAttribute(k, v);
      } else {
        this.target.setAttribute(k, v);
      }
    }
    Object.assign(this.previous, params);
  }
}

/*
  Single attribute setter.
*/


export class AttrPin {
  static name = "attr";

  target = null;
  attributeName = null;
  previous = null;

  attach(original, node, args, value) {
    var [ attr ] = args;
    this.attributeName = attr in upcase ? upcase[attr] : attr;
    this.target = node;
    this.path = value.split(".");
    return node;
  }

  update(value) {
    var attr = this.attributeName;
    if (value == this.previous) return;
    if (typeof value == "undefined" || value == null) {
      this.target.removeAttribute(attr);
    } else if (typeof value == "boolean") {
      this.target.toggleAttribute(attr, value);
    } else {
      this.target.setAttribute(attr, value);
    }
    this.previous = value;
  }

}

/*

Special helper for the class attribute, toggles items off and on

*/

export class ClassPin {
  static name = "classes";

  target = null;
  path = null;

  attach(original, node, args, value) {
    this.path = value.split(".");
    this.target = node;
    return node;
  }

  update(params) {
    for (var k in params) {
      this.target.classList.toggle(k, !!params[k]);
    }
  }
}