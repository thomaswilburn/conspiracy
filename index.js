import * as pins from "./pins.js";
import { Conspiracy } from "./conspiracy.js";
import { ConspiracyElement } from "./element.js";

for (var PinClass of Object.values(pins)) {
  Conspiracy.registerDirective(PinClass);
}

export { Conspiracy, ConspiracyElement };