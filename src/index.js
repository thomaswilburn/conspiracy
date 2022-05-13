import Conspiracy from "./conspiracy.js";

import IfPin from "./pins/if.js";
import EventPin from "./pins/event.js";

[IfPin, EventPin].forEach(Pin => Conspiracy.registerDirective(Pin));

export { Conspiracy };