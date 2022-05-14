Conspiracy
==========

A templating/data binding library for cranks and weirdos. Intended to be a small, fast solution for building web components.

* <3KB when minified and gzipped
* Easy to understand and extend
* Plain templating language: no need to map() when you want to repeat an element
* Selective updates: only changes the page where necessary, without a VDOM
* Designed for the future of ES modules

Theory
======

Web components provide developers with a toolkit for building blocks of UI that are easy to reason about and compose. However, the current family of APIs has a substantial gap when it comes to populating the contents of components. With the removal of HTML imports, there is no longer an easy way to bundle a ``<template>`` with your custom element definition, and there was never really a built-in method to bind data to parts of that template.

Conspiracy aims to fill that gap, and to do so according to a set of premises that are philosophically congruent with web components. These premises make Conspiracy, like its namesake, peculiarly opinionated but (I hope) internally coherent. They are:

* The DOM is not something to be avoided or abstracted away. It's the fundamental grain of the platform.
* It's easier to reason about and debug templates that are written as annotations to regular HTML, not as a series of nested function expressions.
* It's easier to create and debug a mutable view object than to manage hooks that hide state behind a chain of functions.
* New syntax and JavaScript building blocks (such as property getters and ``Proxy`` objects) allow us to generate a simpler view object from a complex internal state.
* Custom elements are best designed around a flow of properties and attributes flowing "down" the document tree, and events bubbling back up.
* Encapsulation guarantees from custom elements and shadow DOM mean that we can incorporate patterns that make class-based JavaScript easier to understand.
* Shadow DOM is most effective in moderation, with a shallow tree. To compose components, it's better to use ``<slot>`` than to nest shadow DOM repeatedly.
* We should be able to load markup from strings for now, in order to perform well with bundlers like Rollup and baseline ES modules, but aim for a future where module type assertions make single-file components (combining HTML, CSS, and JavaScript) ``import``-able again.

In practice, Conspiracy feels closer to Vue or Svelte than to React or Lit. However, it provides less "sugar" than those frameworks by default. For more detailed comparisons, see the section below.

Basic usage
===========



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

