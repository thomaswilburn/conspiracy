Conspiracy
==========

A very small library for doing templating in a web component, with minimal abstractions over the DOM.

Theory
------

* Use attributes like Kudzu, try to stay HTML-compatible
* Need a way to set properties, not just attributes
* Directive attribute structure: ``prefix:directiveName(.option)*="value"``
* Prefix is configurable per instance, but starts as ``c:``
* Inline text is injected using ``<!-- c:text.value.path -->``
* Built-in directives:
  - ``c:if``, ``c:if.not``
  - ``c:when.pending``, ``c:when.resolved``, ``c:when.rejected``
  - ``c:each="item, index of iterable on key"``, ``c:each.entries``
  - ``c:reference`` - adds this to the instance for direct access
  - ``c:on.(event)``, ``c:on.(event).once``
  - ``c:attributes``, ``c:attr.(name)``, ``c:attr.(name).toggle`` - base version takes an object to set from
  - ``c:assign`` - takes an object to set properties from
  - ``c:classes`` - takes an object with truthiness to toggle
  - ``c:styles`` - takes an object to assign to the local style
  - ``c:dataset`` - takes an object to add data attributes
* Directive interface:
  - constructor(element, args, attributeValue)
  - update(value)
  - path = keyPath array for checking this pin (not generated automatically because syntax can vary)
  - terminal = true if this directive will manage its own subtree (i.e., loops)
* Initialize a Conspiracy with an HTML string or a template element
* Call update(state) on a Conspiracy to replace state, patch(state) to mutate previous state

Practice
--------

* Event listeners dispatch new custom events--we assume you're listening for those on the element
* Intended primarily for shallow heirarchy, not page-deep templates
* React and Lit want you to think about data as a functional transform
* Conspiracy wants you to think about DOM as a persistent architecture affected by data, not as a side effect