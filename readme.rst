Conspiracy is a templating/data binding library for cranks and weirdos. It's a tool for building out web component frameworks.

* **<3KB** when minified and gzipped
* Easy to **understand and extend**
* **Plain templating language**: no need to map() when you want to repeat an element
* Selective updates: only changes the page where necessary, **no VDOM and no dirty checking**
* Designed for the future of ES modules

See the `demo page <https://thomaswilburn.github.io/conspiracy/>`_ for an example of a component built with Conspiracy.

Theory
======

Web components provide developers with a toolkit for building blocks of UI that are easy to reason about and compose. However, the current family of APIs has a substantial gap when it comes to populating the contents of components. With the removal of HTML imports, there is no longer an easy way to bundle a ``<template>`` with your custom element definition, and there was never really a built-in method to bind data to parts of that template.

Conspiracy aims to fill that gap, and to do so according to a set of principles that are philosophically consistent with web components. These premises make Conspiracy peculiarly opinionated but (I hope) internally coherent (hence the name). They are:

* The DOM is not something to be avoided or abstracted away. It's the fundamental grain of the platform.
* It's easier to reason about and debug templates that are written as annotations to regular HTML, not as a series of nested function expressions.
* Custom elements are best designed around a flow of properties and attributes flowing "down" the document tree, and events bubbling back up.
* Shadow DOM is most effective in moderation, with a shallow tree. To compose components, it's better to use ``<slot>`` than to nest shadow DOM repeatedly.
* It's easier to create and debug a mutable view object than to manage hooks that hide state behind strictly-ordered function calls.
* Leaning into a full range of language syntax and features makes component design more expressive, not less. For example, we can leverage new syntax and JavaScript building blocks (such as property getters and ``Proxy`` objects) to generate a simpler "view model" of complex internal state.
* Just as we can use JavaScript syntax to streamline our component, the encapsulation guarantees of web components allow us to make class-based syntax easier to understand and predict.
* We should be able to load markup from strings for now, in order to perform well with bundlers like Rollup and baseline ES modules, but aim for a future where module type assertions make single-file components (combining HTML, CSS, and JavaScript) ``import``-able again.

In practice, Conspiracy feels closer to Vue or Svelte than to React or Lit. However, it provides less "sugar" than those frameworks by default (with a corresponding reduction in JavaScript size). For more detailed comparisons, see the section below.

Basic usage
===========

Using Conspiracy is a three stage process. First, we create an instance by passing a template and any options to the ``Conspiracy`` constructor:

.. code:: javascript

  let template = `
    <ul>
      <li :each="item of items">
        <a :attr="item.url"><!-- :item.text --></a>
    </ul>
  `;

  var binding = new Conspiracy(template);

Templates can be strings, a reference to a DOM node that should be cloned and used as a template, or an actual ``<template>`` tag. The first is most convenient now, since it's easier to integrate with JavaScript modules and bundlers. However, the latter is useful for applications built in a single HTML file, plugins that allow importing HTML, or HTML modules when (if?) `import assertions land <https://github.com/tc39/proposal-import-assertions>`_.

The second argument to the constructor can be an object with options for the template:

* ``namespace`` - Adds an optional prefix before the ``:`` in templating annotations (e.g., with a namespace of "area-51", the annotation for a loop would be ``area-51:each``). Can be used to avoid clashes with other frameworks that use a similar annotation format.
* ``unhosted`` - Causes this instance to place itself *after* its root node, instead of inside it. Internally, this is used to render iteration directives.
* ``stripDirectives`` - Removes template annotations from the live DOM nodes. This makes the resulting markup a little cleaner, but does also make it harder to distinguish Conspiracy output from regular page markup.

Once we have a Conspiracy instance, we can attach it to a node on the page, which will cause an initial render. If you provide data as the second argument to ``attach()``, it'll be used to populate the rendered HTML:

.. code:: javascript

  var rootNode = document.querySelector(".root");
  var data = { items: [
    { url: "https://thomaswilburn.net", text: "The Illuminati" },
    { url: "https://timecube.2enp.com/", text: "Four Simultaneous Days" }
  ]};
  binding.attach(rootNode, data);

After a Conspiracy instance is attached, you can re-render with changes by calling the ``update()`` method.

.. code:: javascript

  data.items.push({ url: "https://en.wikipedia.org/wiki/Chemtrail_conspiracy_theory", text: "Wake up sheeple" });
  binding.update(data);

You don't have to call ``update()`` with the same data object--it could be a completely new object with the same structure and some changed values. However, some directives (such as ``:each``) rely on object identity to minimize DOM updates, and may re-render more than expected if references are different from the previous update.

For more details on how Conspiracy renders and how to extend it, see `the source code README <https://github.com/thomaswilburn/conspiracy/blob/main/src/readme.rst>`_. For a demo of a custom elements that use Conspiracy for rendering, see `this page <https://thomaswilburn.github.io/conspiracy/>`_.

Directory of directives
=======================

Directives are (usually) attributes added to elements that indicate how they should be bound to your data. These directives always have the following structure::

  {namespace}:{directiveName}{args}="{text}"

* ``namespace`` - defaults to an empty string, meaning that you can ignore it unless you set the corresponding option when creating your Conspiracy.
* ``directiveName`` - the actual operation to perform. These are listed below.
* ``args`` - an optional, dot-separated list of flags that can change how the directive works. For example, ``:if.not`` or ``:on.click.once``.
* ``text`` - usually a keypath to tell the directive where in the data it should look for updates, but can also be a more complex configuration string.

When a directive talks about a "keypath," it refers to a dot-separated list of properties used to look up a property on the data object passed to ``Conspiracy.update()``. For example, given the object:

.. code:: javascript

  {
    a: {
      b: {
        c: "123",
        d: false
      }
    }
  }

* ``"a.b.c"`` will return the string "123"
* ``"a.b"`` will return the object ``{ c: "123", d: false }``
* ``"a.e"`` will return undefined, since there is no value at that path.

Here are all the directives included with Conspiracy, their options, and how to set their values.

``<!-- :text -->``
------------------

Values can be injected into inline text by marking the insertion point with an HTML comment. The comment should a "directive" attribute string that's just the keypath of the value you want to insert (e.g., calling ``instance.update({ link: { text: "hello" } })`` would replace ``<!-- :link.text -->`` with the string "hello").

``:if``
-------

The attribute text should be a keypath to a value. If the value is equivalent, the marked element will be removed from the DOM. 

``:if.not`` reverses this: the element will only exist in the DOM if the value is false, and will be removed if it is true.

Example:

.. code:: html

  <dialog :if="showModal"></dialog>

``:each``
---------

Generates a copy of the marked element for every item in a collection (an Array, Map, Set, or Object). The attribute text follows the formula ``{itemName} of {collectionKeyPath}`` or ``{itemName}, {indexName} of {collectionKeyPath}``. ``itemName`` and ``indexName`` let you set keys to access each object and its index in the generated DOM. These keys shadow the original data values but do not overwrite them--if you use the same key as an existing property in your loop, it will persist only for the part of the template under ``:each``.

Examples:

.. code:: html

  <ul>
    <li :each="person of credits">
      <!-- :person.name -->, <!-- person.title -->
  </ul>

  <p :each="step, i of instructions">
    Step <!-- i -->: <!-- step.text -->

  <ul>
    <li :each="job, staffer of organizationMap">
      <!-- job.title --> is assigned to <!-- staffer.name -->

Note that in the final example, the collection is a map, which means we can access properties on both the object keys and their linked values.

``:each`` uses reference identity to determine whether there is already an element in the DOM for a given item. As such, if you replace an item with a new item, even if its properties are identical, a fresh element will be created during updates. Performance (and accessibility) will be much better if list items are retained and mutated, not replaced.

``:on.{event}``
---------------

Allows binding an event listener to a given element. The first parameter indicates the type of event you want to listen for, and the attribute text is a custom event type that will be dispatched in response. For example:

.. code:: javascript

  <button :on.click="clickedbutton">Click me</button>

In this code, clicking on the button will dispatch a "clickedbutton" event from the button, up through the DOM. To handle it, you add a listener for that custom event to your web component, like so:

.. code:: javascript

  this.addEventListener("clickedbutton", this.clickedButtonHandler);

The custom event will have the original event as its ``originalEvent`` property, in case you need to access data (such as mouse position). The original event target will also be available as ``dispatchedFrom``.

This is perhaps the greatest difference between Conspiracy and other rendering frameworks, where you would typically provide the listener function directly to the template. However, handling events this way has a few advantages:

1. It means you don't initially have to bind your event listeners to your component instance, since the handler will be called in its own context.
2. It's impossible to generate memory leaks, even when setting listeners in a dynamic list, since there's no closure that connects to the original element.
3. It's possible to set up a web component that dispatches events handled at a higher level in the DOM, without having to manually capture and republish them.
4. Since the custom events always bubble, you can use this to listen for events that *do not* normally propagate up the DOM from their origin, such as media playback or update events.

The ``:on`` directive has a couple of variations for setting the way that it dispatches events:

* ``.on.(event).once`` will set a single-shot listener.
* ``.on.(event).composed`` will cause the event to cross shadow DOM boundaries, which normally halt event propagation.

Both of these can be set at once, as in ``:on.mouseover.once.composed``.

``:attr.{name}``
----------------

Sets a single attribute on the element from the keypath specified. For example, ``:attr.name="item.name"`` will set the "name" attribute. This should automatically handle the casing for SVG attributes, which are case-sensitive.

Some values are special-cased for this directive:

* ``true`` and ``false`` boolean values will toggle the attribute on and off, but do not set a value. If you want the attribute to actually contain the text "true" or "false," such as for many ARIA attributes, make sure to use strings in your data object.
* ``undefined`` and ``null`` will remove the attribute from the element.

``:attributes``
---------------

Sets multiple attributes from an object specified by a keypath. For example, you could set multiple accessibility attributes for a toggle button by providing the object ``{ "aria-pressed": "false", "aria-label": "play audio" }``. Values follow the same special rules here as they do for the single-attribute ``:attr`` directive.

``:classes``
------------

Toggles classes off and on based on an object located at the specified keypath. For example, the following element:

.. code:: html

  <div class="a b" :classes="toggleClasses"></div>

Will have the classes "b" and "c" when the following data object is provided to ``update()``:

.. code:: javascript

  { toggleClasses: { a: false, c: true } }

``:assign``
-----------

Sets properties on the element from the object provided at the keypath. For example:

.. code:: html

  <custom-element :assign="props"></custom-element>

is the equivalent of:

.. code:: javascript

  Object.assign(customElement, data.props);

Use ``:assign`` with caution: it will only set primitive values (strings, numbers, and booleans) if they change between updates, and objects will be checked against the previous value using reference identity, because it's extremely difficult in JavaScript to verify if two objects have deep value equality. If you want to update nested properties on a DOM element, it is probably better to use the ``:element`` directive to get an actual reference to the node.

``:styles``
-----------

Assigns styles from an object at the specified keypath to an element.

``:dataset``
------------

Assigns values from an object at the specified keypath to the element's ``dataset`` property, and thus to its "data-*" attributes.

``:element``
------------

Stores a reference to this element on the Conspiracy instance's ``elements`` property after ``attach()``. This is useful for getting direct access to DOM elements that have their own imperative API, such as media elements. 

Example:

.. code:: html

  <audio :element="media" controls></audio>

The element can then be accessed on your Conspiracy instance as ``instance.elements.media``.

Comparison to other libraries
=============================

Vue
---

Conspiracy is similar to Vue in that both of them share the concept of attribute-based directives based on a persistent data object. However, Conspiracy is not intrinsically reactive the way Vue is: you need to call ``update()`` and pass in a new object in order to re-render in Conspiracy, instead of simply setting a value on the model. This has advantages, in that you are directly in control of render scheduling, and disadvantages, in that you are directly in control of render scheduling.

React/Preact
------------

Of all the frameworks, Conspiracy is least like React. This is unsurprising, since React is my least favorite of the large frameworks, but also because React culturally has always been about abstractions from the browser. For example, it has long used a synthetic event system instead of dispatching events through the DOM, a virtual DOM for computing changes, and it has moved toward functional components and Hooks instead of class-based components. 

Essentially, React wants you to think about UI as the result of long, nested function evaluation, which will be reconciled with the actual DOM at arm's length. Web components, and Conspiracy by extension, have very little abstraction from the underlying platform. They are class-based and stateful. Although it would probably be possible to use Conspiracy and web components to build something that felt a little like React, it's not a natural transition.

lit-html
--------

Conspiracy shares a lot of architectural DNA with lit-html: both of them use ``<template>`` to parse and interpolate their templates, and both handle selective updates through a similar data binding system. However, their API surface is extremely different: lit-html hews much more closely to a React-like ``render()`` function, and its templates are inextricably based on tagged template strings.

lit-html is a good choice for a no-build template system, and it may be familiar for people who have experience with JSX. However, its reliance on functional expressions for features like iteration or event listeners can be difficult for beginners to understand. While Conspiracy also certainly has its share of conceptual quirks, I do think that its templating syntax is easier to grasp.

Template parts
--------------

The `template parts <https://github.com/github/template-parts>`_ polyfill from GitHub is an interesting implementation of functionality that will hopefully soon be a standard part of browsers: being able to pass data to an HTML ``<template>`` and get back an interpolated chunk of DOM.

While promising, template instantiation only handles half the necessary task for building a web app. Although it returns interpolated DOM, you still need to map that DOM to the existing structure, and apply changes. By providing data binding, Conspiracy is a more complete solution--for now, at least.

Questions and lamentations
==========================

This space intentionally left blank.