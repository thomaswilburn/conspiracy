import * as pins from "./pins.js";
import { Conspiracy } from "./conspiracy.js";
import { ConspiracyElement } from "./element.js";

for (var PinClass of Object.values(pins)) {
  var { directive } = PinClass;
  if (!directive) continue;
  Conspiracy.directives[directive] = PinClass;
}

export { Conspiracy, ConspiracyElement };