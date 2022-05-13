export default class EventPin {

  constructor(element, args, attribute) {
    var [event, ...rest] = args;
    var options = new Set(rest);
    var composed = options.has("composed");
    var once = options.has("once");
    var bubbles = true;
    var listener = function() {
      var e = new CustomEvent(attribute, { bubbles, once, composed });
      element.dispatchEvent(e);
    };
    element.addEventListener(event, listener, { once });
  }
  
}