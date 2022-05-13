/*

Event listener registration - :on.{event}="dispatchType"
Dispatches a custom event with the name you specify
Options:
  .{event} - first option has to be the event to listen for
  .once - this will only fire one time
  .composed - the event will be composed, i.e. it crosses Shadow DOM barriers

TODO: add a way to specify the event name in the attribute for uppercased events

*/

class WrappedEvent extends Event {
  constructor(type, original, options = {}) {
    super(type, { bubbles: true, ...options });
    this.originalEvent = original;
  }
}

export default class EventPin {
  static name = "on";

  attach(template, element, args, custom) {
    var [event, ...rest] = args;
    var composed = args.includes("composed");
    var once = args.includes("once");
    var bubbles = true;
    var listener = function(original) {
      var e = new WrappedEvent(custom, original, { composed });
      element.dispatchEvent(e);
    };
    element.addEventListener(event, listener, { once });
    return element;
  }
  
}