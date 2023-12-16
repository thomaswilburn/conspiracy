Conspiracy is an extremely minimal templating library intended for use with web components.

* Uses markup from ``<template>`` so it's faster than parsing HTML from strings
* Allows for selective updates of rendered DOM, so it's fast and non-destructive
* Templating language based on attributes and comments
* Designed for the future of ES import attributes (e.g., ``import document from "./template.html" with { type: "html" }``).

Getting started
===============

Create a Conspiracy template by either passing a template tag to the constructor, or calling the ``fromString()`` static method.

.. code:: javascript
  
  // use an existing <template> tag
  var tag = document.querySelector(`template#demo`);
  var template = new Conspiracy(templateTag);

  // use a template string
  var templateContents = await fetch("template.html").then(r => r.text())
  var template = Conspiracy.fromString(templateContents);

Once a Conspiracy object is created, you can clone it to create a new ConspiracyBinding. The fragment provides access to the new DOM, as well as a stable object that can be used to update it.

.. code:: javascript

    var template = Conspiracy.fromString(`
      <div ref:container>
        <!-- text:greeting --> World
        <ul ref:links></ul>
      </div>
    `);
    var fragment = template.clone({ greeting: "Hello" });

    // add this to the page
    document.body.append(fragment.dom);
    // you can also access fragment.element for a single node
    
    // let's change it
    fragment.update({ greeting: "Salutations" });

    // we can access specific tagged elements as well
    console.log(fragment.refs.container); // the outer <div>

Conspiracy doesn't provide any support for looping on its own, but it's easy enough to implement using the standard ``replaceChildren()`` method.

.. code:: javascript

    var listItem = Conspiracy.fromString(`
      <li> <a attr:href="url"><!-- text:label --></a>
    `);

    var links = [
      { label: "Portfolio", url: "https://thomaswilburn.net" },
      { label: "Blog", url: "https://milezero.org" }
    ];

    fragment.refs.links.replaceChildren(links.map(item => listItem.renderElement(item)));

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
* "d" = ``true``
* "a.e" = ``undefined``

Text sections
-------------

Text placeholders can be registered using a comment::

    <!-- text:path.to.text -->

The comment will be replaced with your text value whenever you update. You can also use a ``text:path`` attribute, but the element you apply this to will be replace with a text node, so you should use a void element that won't be missed. I recommended the classic embed tag::

    <embed text:replaced.by.something >

Attributes
----------

You can change an attribute on an element using this directive. If the ``.toggle`` option is provided, or if the value at the keypath is something other than a string or number, it'll be used to add or remove the attribute instead. You can invert this by adding the ``.not`` option::

    <a
      attr:href="link.url"
      attr:hidden.toggle="link.url"
    >
      <!-- text:link.label -->
    </a>

There's a special helper for toggling classes as well. This code would add a "faded" class to the div only when the ``ifFaded`` value is not true::

    <div class:faded.not="ifFaded"></div>

Events
------

Events in Conspiracy are a little different. Rather than letting you directly bind a listener to an element, the ``on:`` directive lets you choose a custom event to fire for that element::

    <button on:click="clicked-button">Click me!</button>

In this case, clicking the button will dispatch a "clicked-button" event from it. By default, these events bubble, but they are not cancelable or composed. You can set those options if you want to use, if you want to use them in shadow DOM for example::

    <input type="color" on:input.composed="color-through-shadow"></input>

Dispatching custom events may seem odd, but it means you cannot leak memory via these listeners, and it works well if your custom event registers for multiple listeners through ``handleEvent()`` instead of individual methods.

References
----------

If you need access to an element, such as for populating a list, you can tag it with a ``ref:`` directive and it will be available on the ConspiracyBinding object::

    <main ref:outer>
      <section ref:inner>
        <img ref:portrait>
      </section>
    </main>

    // when the following is cloned:
    // fragment.refs = { outer: <main>, inner: <section>, portrait: <img> }