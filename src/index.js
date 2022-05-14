import Conspiracy from "./conspiracy.js";

import { IfPin, EachPin } from "./pins/structure.js";
import { EventPin } from "./pins/event.js";
import { ClassPin, AttributesPin, AttrPin } from "./pins/attributes.js";
import { AssignPin, StylePin, DatasetPin } from "./pins/properties.js";

var all = [IfPin, EachPin, EventPin, ClassPin, AttributesPin, AttrPin, AssignPin, StylePin, DatasetPin];
all.forEach(Pin => Conspiracy.registerDirective(Pin));

export { Conspiracy };