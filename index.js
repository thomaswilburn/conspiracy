import * as pins from "./pins.js";
import { Conspiracy } from "./conspiracy.js";
import { ConspiracyElement } from "./element.js";

for (var Pin of Object.values(pins)) {
  if (Pin.directive) Conspiracy.registerDirective(Pin);
}

export { Conspiracy, ConspiracyElement };