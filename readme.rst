Conspiracy is an extremely minimal templating library intended for use with web components.

* Uses markup from ``<template>`` so it's faster than parsing HTML from strings
* Allows for selective updates of rendered DOM, so it's fast and non-destructive
* Templating language based on attributes and comments
* Dynamic value positions are cached and used to speed up template instantiation after the first run
* Designed for the future of ES import attributes (e.g., ``import document from "./template.html" with { type: "html" }``).

Getting started
===============

Create a Conspiracy template by either passing a template tag to the constructor, or calling the ``fromString()`` static method.

.. code:: javascript
  
  // use an existing <template> tag
  var tag = document.querySelector(`template#demo`);
  var template = new Conspiracy(tag);

  // use a template string
  var contents = await fetch("template.html").then(r => r.text())
  var template = Conspiracy.fromString(contents);

You only need to create one Conspiracy per template. Once it's initialized, you can clone it to create a new ConspiracyBinding for the DOM section you want to populate. The binding object provides access to the rendered DOM, as well as methods that can be used to update it.

.. code:: javascript

    var template = Conspiracy.fromString(`
      <div ref:container>
        <!-- text:greeting --> World
      </div>
    `);
    var binding = template.clone({ greeting: "Hello" });

    // add this to the page
    document.body.append(binding.dom);
    // you can also access binding.element for its first child node
    // this is more useful for creating instances during iteration
    document.body.append(binding.element);
    
    // let's change the live contents
    // update() selectively mutates the binding's DOM nodes
    // you don't have to reattach or re-clone
    binding.update({ greeting: "Salutations" });

    // we can access specific tagged elements as well
    console.log(binding.refs.container); // the outer <div>

ConspiracyElement
=================

A base class is provided that uses Conspiracy for shadow DOM templating. Any static ``template`` property declared on a subclass of ``ConspiracyElement`` will be used to generate a shadow root, populate it, and queue a render. Rendering uses the element itself as the base data object passed to the Conspiracy instance, so anything you attach to the element class will be available to the template keypaths.

.. code:: javascript

    class ClockFace extends ConspiracyElement {

      // the template can be a string or a <template>
      // strings may be easier in the current JS environment
      static template = `
      <!-- text:formattedTime.hours --> :
      <!-- text:formattedTime.minutes --> :
      <!-- text:formattedTime.seconds -->
      <span if:="formattedTime.pm">PM</span>
      <span if.not:"formattedTime.pm">AM</span>
      `

      connectedCallback() {
        this.disconnectedCallback();
        this.interval = setInterval(this.render, 1000);
        this.render();
      }

      disconnectedCallback() {
        if (this.interval) {
          clearInterval(this.interval);
          this.interval = null;
        }
      }

      get formattedTime() {
        var time = Date.now()
        var hours = time.getHours();
        var pm = hours > 11;
        if (hours == 0) hours = 12;
        if (hours > 12) {
          hours -= 12;
        }
        return {
          hours,
          minutes: String(time.getMinutes()).padStart(2, "0"),
          seconds: String(time.getSeconds()).padStart(2, "0"),
          pm
        }
      }
    }

The ``render()`` function is also debounced to a microtask, so you can call it as often as you want without triggering excessive DOM thrashing. The template will be cached based on the constructor function, so subsequent element instances benefit from Conspiracy's cloning fast path. Subclasses of ``ConspiracyElement`` can also access their binding object via ``this.ui``.

Templating
==========

Conspiracy's template code will look familiar to anyone who has used Vue: it's mostly a set of directive attributes in the form of ``command:type.option="path"``. The path is usually a keypath inside the data object passed into ``Conspiracy.clone()`` or ``ConspiracyBinding.update()``. For example, on the following object::

  { 
    a: {
      b: {
        c: "value"
      }
    }
    d: true
  }

You'd see the following values for these keypaths:

* "a.b.c" = ``"value"``
* "a.b" = ``{ c: "value " }``
* "d" = ``true``
* "a.e" = ``undefined``

Text sections
-------------

Text placeholders can be registered using a comment::

    <!-- text:path.to.text -->

The comment will be replaced with your text value whenever you update. You can also use a ``text:path`` attribute, but the element you apply this to will be replace with a text node, so you should use a void element that won't be missed. I recommended the classic embed tag::

    <embed text:replaced.by.something >

When using the element directive form, you can specify the key either in the attribute name, or in the value, depending on your preference::

    <embed text:="replaced.by.something" >

If your keypath contains capital letters, the latter is probably more useful, since HTML attributes are forcibly lower-cased by the parser.

Iteration
---------

You can loop over an array, Map, or Set (or anything else that implements ``Symbol.iterator``) using the ``each:`` directive::

    <ul>
      <li each:="scope.listItems">
        <a attr:href="url"><!-- text:label --></a>
      </li>
    </ul>

Looped chunks are extracted from the template and converted into another Conspiracy instance. Each one has access to the outer context, but by default keys will be scoped to the item in the collection (e.g., in the example above, each item in the "scope.listItems" array is assumed to have properties for "url" and "label").

If you need access to the keys, you can use the "key in collection" form of the ``each:`` attribute value::

    <div each:="index in array">
      Key: <!-- text:index -->
    </div>

When the key isn't specified, it'll be available by default as ``#`` on the scope object for each item. If you're looping over primitive values, like numbers, those will be available as ``@``. For example, to loop over an array of letters and display their index and their value::

    <ul>
      <li each:=letters>
        index: <!-- text:# -->,
        value: <!-- text:@ -->
    </ul>

Attributes
----------

You can change an attribute on an element using this directive. If the ``.toggle`` option is provided, or if the value at the keypath is something other than a string or number, it'll be used to add or remove the attribute instead. You can invert a toggle by adding the ``.not`` option::

    <a
      attr:href="link.url"
      attr:hidden.toggle="link.url"
    >
      <!-- text:link.label -->
    </a>

There's a special helper for toggling classes as well. This code would add a "faded" class to the div only when the ``active`` value is not true::

    <div class:faded.not="active"></div>

Events
------

Use a ``event:`` directive to specify the keypath to a callback function for an event::

    <button on:click="handleClick">Click me</button>

Listeners are called like like a regular DOM event listener, in the ``this`` context of where the listener was attached. To have access to the current context, bind your listeners or use arrow functions.

You can also register a listener with the standard options after the event name. For exmaple, to fire your listener only once::

    <input on:input.once="firstTimeOnly">

A pattern that's sometimes used with custom elements is to pass the element itself to the event listener and implement ``handleEvent()``, which will be called in the correct context. The "handle:" directive supports this, and is well-suited for things like media elements, which dispatch a number of events without much internal state::

    <audio handle:loaded.canplay.play.pause.timeupdate.ended ></audio>

References
----------

If you need access to an element, such as for populating a list, you can tag it with a ``ref:`` directive and it will be available on the ConspiracyBinding object::

    <main ref:outer>
      <section ref:="innerSection">
        <img ref:portrait>
      </section>
    </main>

    // when the following is cloned:
    // binding.refs = { outer: <main>, innerSection: <section>, portrait: <img> }

Properties
----------

Custom elements may take in JavaScript values directly using properties, and these can also be set and updated using Conspiracy using the ``prop`` directive::

    <input prop:value="rating">

These bindings are one-way only -- they set the property, but in order to read it or react to changes, you'll need to set an event listener or use a reference.

Because HTML attributes are case-insensitive, the property directive also supports an alternative syntax inside the attribute value itself, in the form of "property = key.path". For example, if you need to set the ``currentTime`` property on a media element::

    <!-- this won't work, because it will be normalized to "currenttime" during parsing -->
    <audio prop:currentTime="ui.seekInput.value"></audio>

    <!-- use the attribute value to assign the property instead -->
    <audio prop:="currentTime = ui.seekInput.value"></audio>

Custom Directives
=================

Internally, directives are just classes that implement the Pin interface::

    class Pin {
      // make this available for `pin:` attributes
      static directive = "pin";
      // stop parsing the subtree when this directive is processed?
      static terminal = false;
      // ignore this pin after attachment?
      static forget = false;
      // the keypath for updates
      key = "key.path";
      // the node this is attached to
      node = null;

      // called during cloning with values from pin:params="path"
      attach(node, params, path) { }

      // called during render with the current data value for its keypath
      // as well as the root data object
      update(value, data) { }
    }

During parsing, Conspiracy will call ``attach()`` for any matching attributes. If the Pin's ``node`` property is different from the node that was passed in, it will be used as a replacement in the output DOM. If your pin does not need to update with values during rendering, set the static ``forget`` class field to ``true`` (this is used for the ``refs`` lookup on the binding object). Pins marked ``terminal`` are processed first and stop the parser from descending further, which is primarily useful for structural directives like iteration.

To add a pin, call ``Conspiracy.registerDirective()`` and pass in your class.