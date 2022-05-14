Conspiracy is a templating/data binding library for cranks and weirdos. Intended to be a small, fast solution for building web components.

* <3KB when minified and gzipped
* Easy to understand and extend
* Plain templating language: no need to map() when you want to repeat an element
* Selective updates: only changes the page where necessary, without a VDOM
* Designed for the future of ES modules

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

This space intentionally left blank.

Directory of directives
=======================

This space intentionally left blank.

``:if``
-------

``:each``
---------

``:on.{event}``
---------------

``:attributes``
---------------

``:classes``
------------

``:assign``
-----------

``:styles``
-----------

``:dataset``
------------

Custom directives
=================

This space intentionally left blank.

Comparison to other libraries
=============================

This space intentionally left blank.

- Vue
- Lit
- JSX/Preact
- Template parts

