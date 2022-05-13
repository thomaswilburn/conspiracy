import Conspiracy from "./conspiracy.js";

import IfPin from "./pins/if.js";
import EventPin from "./pins/event.js";
import EachPin from "./pins/each.js";

[IfPin, EventPin, EachPin].forEach(Pin => Conspiracy.registerDirective(Pin));

export { Conspiracy };