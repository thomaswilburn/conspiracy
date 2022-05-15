Conspiracy: Behind the Curtain
==============================

Conspiracy is built on a two-phase architecture: a (relatively) expensive ``attach()`` call that sets up the DOM and its bindings, and a much lighter ``update()`` that applies data to those bindings.

Directives and Pins
-------------------

We refer to the annotation attributes in templates, like ``:if`` or ``on.click`` as "directives." Internally, each of these corresponds with a ``Pin`` class (so called because they represent the connection between data and document, like the pushpins tied to red string on a conspiracy wall).

Pins do not share a subclass, but they do have a duck-typed interface that Conspiracy expects to use:

* ``constructor(settings, conspiracy)`` - the Conspiracy will pass its settings and itself to the constructor (most Pins ignore this)
* ``static name`` - the directive name for this Pin (e.g., "each", "if", "styles")
* ``terminal`` - a boolean that flags whether the Pin will take over managing its own subtree. Used for directives that substantially alter the DOM, such as ``:each``.
* ``attach(templateNode, liveNode, directiveOptions, attributeValue, attributeNode)`` - Used to connect a binding. This function must return a cursor node for traversal, which is usually just ``liveNode``.
* ``update(value, scope)`` - called with a value and the complete Conspiracy data object for re-rendering.
* ``path`` - a keypath array that tells Conspiracy which data value this Pin wants to monitor. For example, a Pin that injects a value from ``data.flags.mobile`` would have a path property of ``["data", "flags", "mobile"]``. If the Pin instance does not have a path property, it will be attached but will not be notified for rendering.

If you want to add your own directives, you should create a class that follows this interface, then call ``Conspiracy.registerDirective()`` with your class to add it to the directive lookup.

Initialization
--------------

When you pass HTML to ``new Conspiracy(template)``, regardless of the format, the result is a ``<template>`` element. Template elements have the special property that their contents are inert DOM: they do not load images, run scripts, apply styles, or count for layout. However, you can still access the template's DocumentFragment for traversal, and change it using standard DOM methods. 

The template is then stored until the instance is attached to a root node.

Attachment
----------

When ``attach()`` is called, Conspiracy performs a depth-first walk through all the nodes of its template document (including comment and text nodes). For each node, the following steps are run:

1. Clone the node and add it to the corresponding place of the live DOM.
#. If the node is a Comment, check to see if it matches the pattern for a text directive. If so, attach a TextPin instance to it, which will replace the comment with a Text DOM node.
#. If the node has attributes, filter for those that match the ``namespace:directiveName`` pattern.
#. Process directives by creating the corresponding Pin and calling its ``attach()`` method. If the Pin has a ``path`` property, add it to our list of data bindings.
#. Update our DOM position if any of the directives replaced the clone or appending new Nodes after it.
#. If one of the processed directives was marked as ``terminal``, stop descent and move on.

At the end of this process, the instance should have produced a new section of live DOM that duplicates the structure of the template, and an array of Pins that represent bindings between DOM nodes and data locations.

Update
------

When you call ``update()`` on a Conspiracy, it loops through its array of Pins from the attachment phase, uses the keypath to get a value from the data object, and passes that value to the Pin.

For most Pins, applying updates is relatively straightforward. For example, here's the complete code for the Pin that handles ``:attr.disabled="button.disabled"``:

.. code:: javascript

  update(value) {
    // pulled from the directiveOptions during attach()
    var attr = this.attributeName;
    // check to see if the value has changed
    if (value == this.previous) return;
    if (typeof value == "undefined" || value == null) {
      // remove attributes on null or undefined
      this.target.removeAttribute(attr);
    } else if (typeof value == "boolean") {
      // toggle on true or false
      this.target.toggleAttribute(attr, value);
    } else {
      this.target.setAttribute(attr, value);
    }
    // cache for the next update()
    this.previous = value;
  }

Because the Pin knows what value was last applied, and contains code to change the DOM directly, Conspiracy updates can be extremely selective. In the optimal case, if you call ``update()`` with the same object twice, or an object with identical properties, it will not make any changes at all.

The exception: ``:each``
------------------------

There are three structural directives included with Conspiracy, so-called because they mutate the DOM output during the attach phase. Two of these (``:if`` and text nodes) are uncomplicated: the IfPin inserts a placeholder Comment node after its target to anchor it, and the TextPin replaces its target comment with an actual Text node that it can update.

Iteration, however, is more complicated. Because elements marked with ``:each`` can be situated in the middle of other markup, we can't simply append to the parent element. We also would like to only add or remove elements that change--if a list inserts an item, ideally only one element will be created and placed in response.

To solve the first problem, during ``attach()``, the target element is removed from the DOM and replaced with two Comment nodes that mark the beginning and end of the "zone" controlled by the Pin. The sub-template problem is solved by creating miniature Conspiracy instances for each element, and passing them an updated data object to match.

Finally, to minimize the number of DOM changes that are made, EachPin's update algorithm looks like this:

1. Walk from the start node to the end node, collecting any elements between them.
#. Convert the update value into a list of ``[index, item]`` entries.
#. Look each entry up in a WeakMap to see if there is already an element and a Conspiracy for it. If so, update it in place. At the end of this, we should have an array of objects containing the data, index, element, and Conspiracy for each item in the original collection.
#. Remove any elements that didn't have associated items in the entry list, and update our "existing" array of elements.
#. Iterate through the array of joined entries, creating new elements and Conspiracy instances for any that are missing.
#. Compare each element against the first item in the existing element array. If it's the same, the order is correct for that item, so shift that element off the array. If not, move the element up in the DOM to match its position in the collection.