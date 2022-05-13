/*

Event listener registration - :on.{event}="dispatchType"
Dispatches a custom event with the name you specify
Options:
  .{event} - first option has to be the event to listen for
  .once - this will only fire one time
  .composed - the event will be composed, i.e. it crosses Shadow DOM barriers

TODO: add a way to specify the event name in the attribute for uppercased events

*/

export default class EventPin {
  static name = "on";

  attach(element, args, attribute) {
    var [event, ...rest] = args;
    var composed = args.includes("composed");
    var once = args.includes("once");
    var bubbles = true;
    var listener = function() {
      var e = new CustomEvent(attribute, { bubbles, composed });
      element.dispatchEvent(e);
    };
    element.addEventListener(event, listener, { once });
    return element;
  }
  
}