Conspiracy
==========

A very small library for doing templating in a web component, with minimal abstractions over the DOM.

Theory
------

* Use attributes like Kudzu, try to stay HTML-compatible
* Need a way to set properties, not just attributes
* Directive attribute structure: ``namespace?:directiveName(.option)*="value"``
  - namespace is optional, but can be added to avoid conflicts with Vue or something
  - options are provided as a dot-separated list after the directive name
* Inline text is injected using ``<!-- :path.to.value -->``, no directive name
* Built-in directives:

  - ``:if``, ``:if.not``
  - ``:each="item, index of iterable"`` - relies on object identity to match existing elements
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
  - static name = the directiveName when parsing

* Initialize a Conspiracy with an HTML string or a template element
* Call update(state) on a Conspiracy to change the attached DOM

Practice
--------

* Event listeners dispatch new custom events--we assume you're listening for those on the element
* Intended primarily for shallow heirarchy, not page-deep templates
* React and Lit want you to think about data as a functional transform
* Conspiracy wants you to think about DOM as a persistent architecture affected by data, not as a side effect
* Loads templates from strings for now, but supports templates for when HTML import assertions are available
* Preprocessing could add some sugar as an option (e.g., replace ``{text.insertion}`` with the inline comment)