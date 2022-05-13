Conspiracy
==========

A very small library for doing templating in a web component, with minimal abstractions over the DOM.

Theory
------

* Use attributes like Kudzu, try to stay HTML-compatible
* Need a way to set properties, not just attributes
* Directive attribute structure: ``namespace?:directiveName(.option)*="value"``
* Inline text is injected using ``<!-- :text.value.path -->``
* Built-in directives:

  - ``:if``, ``:if.not``
  - ``:each="item, index of iterable on key"``, ``:each.entries``
  - ``:element`` - adds this to the instance's ``elements`` property for direct access
  - ``:on.(event)``, ``:on.(event).once``
  - ``:attributes``, ``:attr.(name)``, ``:attr.(name).toggle`` - base version takes an object to set from
  - ``:assign`` - takes an object to set properties from
  - ``:classes`` - takes an object with truthiness to toggle
  - ``:styles`` - takes an object to assign to the local style
  - ``:dataset`` - takes an object to add data attributes
  - ``:html`` - unsafe by default

* Directive interface:

  - constructor(element, args, attributeValue)
  - update(value)
  - path = keyPath array for checking this pin (not generated automatically because syntax can vary)
  - terminal = true if this directive will manage its own subtree (i.e., loops)

* Initialize a Conspiracy with an HTML string or a template element
* Call update(state) on a Conspiracy to change the attached DOM

Practice
--------

* Event listeners dispatch new custom events--we assume you're listening for those on the element
* Intended primarily for shallow heirarchy, not page-deep templates
* React and Lit want you to think about data as a functional transform
* Conspiracy wants you to think about DOM as a persistent architecture affected by data, not as a side effect
* Loads templates from strings for now, but supports templates for when HTML import assertions are available