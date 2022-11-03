# Catalyst

An Evolv **Environment Integration** to support the renderRule framework.

## Goals

The goals for this framework are to provide the following:

1. Group all brittle site selectors in one place. This makes it easy to find the selectors based on customer's DOM that may be volatile.
2. Handle idemponency.
3. Easily identify which parts of the page are experimented on. This could support tooling, support, and debugging.
4. Experiment specific setTimeout and setInterval calls. These are impacted by spa page navigation. Ideally these would be wrapped in APIs that handle navigation automatically.
5. Simplify coding and support declarative where possible.
6. Allow simple experiments to remain simple and support more complex tests (model view rendering)
7. Simplify things like Mutation Observer.

## Installation

Add the NPM integration connector `@evolv-delivery/catalyst`.

## Setup

Add the following json config at environment level to enable the framework across a site

```json
{
    "pages": ["/"]
}
```

## Usage

For comprehensive examples see the Examples section at the bottom.

## renderRule

The core Catalyst object containing essential methods, `$` selectors, as well as the `store` and `app` repositories for assets and functions that can be shared between variants.

Adding a new property to the `renderRule` object creates a new sandbox with all of the properties of the original `renderRule` which allows for multiple experiments to run on the page simultaneously without collisions.

Typically the following will appear at the top the context _and_ each variant so that they all are working within the same sandbox.

```js
var rule = evolv.renderRule.new_sandbox;
var store = rule.store;
var $ = rule.$;
var $$ = rule.$$;
```

---

### $()

The `$()` selector accepts a variety of inputs and returns an ENode.

| Syntax               | Description                                                                                                                                                                                                                                                                                                         |
| :------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| $(selector, context) | Selector: String containing CSS selector<br>Context (optional): Element, default is `document`<br>`$('p')`, `$('.some-class')`, `$('.parent > [attr=some-attribute]'`                                                                                                                                               |
| $(XPath, context)    | Selector: String containing XPath selector (coming soon!)<br> Context (optional): Element, default is `document`<br>`$('//p')`, `$('//button[contains(text(),"Go")]')`, `$('//h3[contains(text(),"Heading")]/parent::*/parent::*')`                                                                                 |
| $(ENode)             | Another ENode, returns a new ENode that references the original<br>`var pageHeading = $('h1'); var pageHeadingRef = $(pageHeading)`                                                                                                                                                                                 |
| $(element)           | A variable referencing an element<br>`$(document.body)`                                                                                                                                                                                                                                                             |
| $(array)             | An array of elements<br>`var everyLi = Array.from(document.querySelectorAll('li')); $(everyLi)`                                                                                                                                                                                                                     |
| $(HTML)              | Creates a new ENode from an HTML string containing a single parent element<br>`$('<div class="evolv-card"><h3>Heading</h3><p>Some text.</p></div>')`<br>Note: `$('<div class="sibling-1"></div><div class="sibling-2"></div>')` will return an ENode only containing the first `div` (a bug ticket exists for this) |
| $()                  | Creates a new empty ENode<br>`var a = $() // a.el: []`                                                                                                                                                                                                                                                              |

---

### $$()

The `$$()` selector accepts a key for `store.instrumentDOM` and returns the referenced ENode

| Syntax | Description                                                                                                                   |
| :----- | :---------------------------------------------------------------------------------------------------------------------------- |
| $(key) | String containing `store.instrumentDOM` object key<br>`$$('page-heading')`, `$$('promo').find('p')`, `$$('product').parent()` |

```js
var rule = window.evolv.renderRule.ab_test;
var store = rule.store;
var $ = rule.$;
var $$ = rule.$$;

store.instrumentDOM({
    'page-heading': {
        get dom() {
            return $('h1');
        },
    },
});

var pageHeading = $$('page-heading'); // Output: pageHeading.el Array(1) 0: h1.evolv-page-heading
```

---

### rule.track()

Applies a variant-specific attribute to the `body` to allow you define all the variant CSS at the Context level. If multiple variants are active simultaneously they will be space-delimited in the attribute.

**Note:** With 11 or more variants it's easy to misapply styles because `body[evolv-ab_test*='1-1']` matches `<body evolv-ab_text="11-1">` this can solved by using brackets around your variant identifiers. For example: `rule.track('[1-1]')`.

| Syntax              | Description                                            |
| :------------------ | :----------------------------------------------------- |
| rule.track(variant) | String containing a variant key<br>`rule.track('1-1')` |

Context JS:

```js
var rule = window.evolv.renderRule.ab_test;
```

Context SASS

```sass
body[evolv-ab_test*='1-1'] {
    .evolv {
        &-heading {
            font-size: 3rem;
        }
    }
}

body[evolv-ab_test*='2-2'] {
    .evolv {
        &-heading {
            color: rebeccapurple;
        }
    }
}
```

Variant C1V1 JS:

```js
var rule = window.evolv.renderRule.ab_test;
rule.track('1-1');
```

Variant C2V2 JS:

```js
var rule = window.evolv.renderRule.ab_test;
rule.track('2-2');
```

Target HTML where variant C1V1 and C2V2 are active:

```html
<body evolv-ab_test="1-1 2-2">
    <h1 class="evolv-heading">Heading</h1>
    <!-- Here the h1 would receives the styles from both variants -->
    ...
</body>
```

---

### rule.whenDOM()

The `whenDOM()` method will wait for the specified selector to be created or selectable on the page and will return a Promise. The Promise can then be used to apply further methods.

| Syntax                 | Description                                                                 |
| :--------------------- | :-------------------------------------------------------------------------- |
| rule.whenDOM(selector) | String containing CSS selector<br>`rule.whenDOM('.product').then(el => {})` |

```js
rule.whenDOM('h1').then((h1) => h1.text('New improved heading'));
```

---

### rule.whenItem()

The `whenItem()` method will wait for the specified instrument key to be created or selectable on the page and will return a Promise object. The Promise object can then be used to apply further methods.

| Syntax                        | Description                                                                               |
| :---------------------------- | :---------------------------------------------------------------------------------------- |
| rule.whenItem(instrument key) | String containing a key to the `store.instrumentDOM` object<br>`rule.whenItem('product')` |

```js
var rule = window.evolv.renderRule.ab_test;
var store = rule.store;

store.instrumentDOM({
    'page-heading': {
        get dom() {
            return $('h1');
        },
    },
});

rule.whenItem('page-heading').then((pageHeading) =>
    pageHeading.text('New improved heading')
);
```

---

### rule.store

A persistent object to house assets, variables, templates, icons, anything to be used in your experiment and shared between variants. It has the benefit of:

-   Only accessible from within the experiment sandbox so it doesn't pollute the global scope
-   Allows assets to be defined in the context and used in variants
-   Contains instrumentDOM() method

Context:

```js
var rule = evolv.renderRule.ab_test;
var store = rule.store;

store.icons = {
    circle: `<svg width="100" height="100"><circle cx="50" cy="50" r="50" /></svg>`,
};
```

Variant:

```js
$('#circle-text').prepend($(store.icons.circle));
```

---

### rule.store.instrumentDOM()

The `instrumentDOM()` method finds the elements passed into it, caches them, and applies classes. Instrumented objects can accessed by their associated key using the `rule.$$()` or `rule.whenItem()` methods.

```js
store.instrumentDOM({
    'devices-section': {
        get dom() {
            return $('#devicesSection');
        },
        asClass: 'devices', // Optional, applies class 'evolv-devices' to the element instead of the default 'evolv-devices-section' from the key
    },
    'pod-parent': {
        get dom() {
            return $$('devices-section')
                .find('[id*=mvo_ovr_devices]')
                .first()
                .parent();
        },
    },
});
```

## ENodes

A jQuery-like object for selecting and manipulating DOM elements. Every ENode stores elements in an array named `el` and contains a suite of methods.

```js
var products = $('.product');
console.log(products.el); // [ div.product, div.product, div.product ]
```

---

### filter()

The `filter()` method creates a new array containing all of the elements that match the provided selector. Internally it uses the Array.prototype.matches() method to evaluate the elements.

| Syntax                 | Description                    | Returns |
| :--------------------- | :----------------------------- | :------ |
| ENode.filter(selector) | String containing CSS selector | ENode   |

Example:

```html
<h2 class="heading heading-1">Heading 1</h2>
<h2 class="heading heading-2">Heading 2</h2>
<h2 class="heading heading-3">Heading 3</h2>
```

```js
$('.heading').filter(':not(.heading-3)');

// Expected output: ENode containing [ h2.heading-1, h2.heading-2 ]
```

---

### contains()

The `contains()` method returns the elements in an ENode that contain the specified string. The method is case sensitive.

| Syntax                | Description                       | Returns |
| :-------------------- | :-------------------------------- | :------ |
| ENode.contains(text)  | String containing text            | ENode   |
| ENode.contains(regex) | Regular expression (coming soon!) | ENode   |

Example:

```html
<button id="learn-more">Learn more</button>
<button id="checkout">Checkout</button>
```

```js
$('button').contains('Checkout'); // Output: ENode containing [ button#checkout ]
$('button').contains(/Learn more/); // Coming soon! Output: ENode containing [ button#learn-more ]
```

---

### find()

The `find()` method returns the all elements that match the specified child selector.

| Syntax               | Description                    | Returns |
| :------------------- | :----------------------------- | :------ |
| ENode.find(selector) | String containing CSS selector | ENode   |

Example:

```html
<ul id="sidebar">
    <li>Lorum ipsum</li>
    <li>Lorum ipsum</li>
    <li>Lorum ipsum</li>
    <li>Lorum ipsum</li>
    <li>Lorum ipsum</li>
</ul>
```

```js
$('#sidebar').find('li');
// Output: ENode containing [ li, li, li, li, li ]
```

---

### closest()

The `closest()` method returns the nearest ancestor element found that matches the specified selector.

| Syntax                  | Description                    | Returns |
| :---------------------- | :----------------------------- | :------ |
| ENode.closest(selector) | String containing CSS selector | ENode   |

```html
<div id="sidebar-wrap">
    <ul id="sidebar">
        <li>Lorum ipsum</li>
        <li>Lorum ipsum</li>
        <li>Lorum ipsum</li>
        <li>Lorum ipsum</li>
        <li>Lorum ipsum</li>
    </ul>
</div>
```

```js
$('li').closest('#sidebar-wrap');
// Output: ENode containing [ div#sidebar-wrap ]
```

---

### parent()

The `parent()` method returns the parent element(s) of the associated ENode.

| Syntax         | Description  | Returns |
| :------------- | :----------- | :------ |
| ENode.parent() | No arguments | ENode   |

```html
<ul id="list-1">
    <li>Lorum ipsum</li>
    <li>Lorum ipsum</li>
    <li>Lorum ipsum</li>
    <li>Lorum ipsum</li>
    <li>Lorum ipsum</li>
</ul>
<ul id="list-2">
    <li>Lorum ipsum</li>
    <li>Lorum ipsum</li>
    <li>Lorum ipsum</li>
</ul>
```

```js
$('li').parent();
// Output: ENode containing [ ul#list-1, ul#list-2 ]
```

---

### children()

The `children()` method returns the child elements of the associated ENode. If passed a selector it will filter the results to match.

| Syntax                   | Description                    | Returns |
| :----------------------- | :----------------------------- | :------ |
| ENode.children()         | No arguments                   | ENode   |
| ENode.children(selector) | String containing CSS selector | ENode   |

```html
<ul id="sidebar">
    <li>Lorum ipsum</li>
    <li>Lorum ipsum</li>
    <li>Lorum ipsum</li>
    <li>Lorum ipsum</li>
    <li>Lorum ipsum</li>
</ul>
```

```js
$('ul').children();
// Output: ENode containing [ li, li, li, li, li ]

$('ul').children(':not(:last-child)');
// Output: ENode containing [ li, li, li, li ]
```

### addClass()

The `addClass()` method adds classes to elements in the associated ENode.

| Syntax           | Description                                       | Returns |
| :--------------- | :------------------------------------------------ | :------ |
| ENode.addClass() | String containing list of space-separated classes | ENode   |

```html
<ul id="sidebar">
    <li>Lorum ipsum</li>
    <li>Lorum ipsum</li>
    <li>Lorum ipsum</li>
</ul>
```

```js
$('ul').addClass('evolv-sidebar');
// Output: ENode containing [ ul#sidebar.evolv-sidebar ]

$('li:first-child').addClass('evolv-first-item evolv-margin-0');
// Output: ENode containing [ li.evolv-first-item.evolv-margin-0, li, li ]
```

---

### removeClass()

The `removeClass()` method removes classes of on the specified selector. Unlike `addClass()` remove class only accepts a single class name.

| Syntax              | Description                         | Returns |
| :------------------ | :---------------------------------- | :------ |
| ENode.removeClass() | String containing single class name | ENode   |

```html
<ul id="sidebar" class="evolv-sidebar">
    <li>Lorum ipsum</li>
    <li>Lorum ipsum</li>
    <li>Lorum ipsum</li>
    <li>Lorum ipsum</li>
    <li>Lorum ipsum</li>
</ul>
```

```js
$('ul').removeClass('evolv-sidebar');
// Output: ENode containing [ ul#sidebar ]
```

---

### append()

The `append()` method attaches elements before the end of the first element of the associated ENode. It returns the original ENode.

| Syntax                 | Description                                         |
| :--------------------- | :-------------------------------------------------- |
| ENode.append(selector) | String containing CSS selector                      |
| ENode.append(XPath)    | String containing XPath selector (coming soon!)     |
| ENode.append(ENode)    | Another ENode                                       |
| ENode.append(element)  | A variable referencing a DOM element                |
| ENode.append(array)    | An array of DOM elements                            |
| ENode.append(HTML)     | String containing HTML with a single parent element |

```html
<ul id="sidebar">
    <li>Lorum ipsum</li>
    <li>Lorum ipsum</li>
    <li>Lorum ipsum</li>
    <li>Lorum ipsum</li>
</ul>
```

```js
$('ul').append('<li class="evolv-new-list-item">Lorum ipsum</li>');
```

Output:

```html
<ul id="sidebar">
    <li>Lorum ipsum</li>
    <li>Lorum ipsum</li>
    <li>Lorum ipsum</li>
    <li>Lorum ipsum</li>
    <li class="evolv-new-list-item">Lorum ipsum</li>
</ul>
```

---

### prepend()

The `prepend()` method attaches elements after the beginning of the first element of the associated ENode. It returns the original ENode.

| Syntax                  | Description                                         |
| :---------------------- | :-------------------------------------------------- |
| ENode.prepend(selector) | String containing CSS selector                      |
| ENode.prepend(XPath)    | String containing XPath selector (coming soon!)     |
| ENode.prepend(ENode)    | Another ENode                                       |
| ENode.prepend(element)  | A variable referencing a DOM element                |
| ENode.prepend(array)    | An array of DOM elements                            |
| ENode.prepend(HTML)     | String containing HTML with a single parent element |

```html
<ul id="sidebar">
    <li>Lorum ipsum</li>
    <li>Lorum ipsum</li>
    <li>Lorum ipsum</li>
    <li>Lorum ipsum</li>
</ul>
```

```js
$('ul').prepend('<li class="evolv-new-list-item">Lorum ipsum</li>');
```

Output:

```html
<ul id="sidebar">
    <li class="evolv-new-list-item">Lorum ipsum</li>
    <li>Lorum ipsum</li>
    <li>Lorum ipsum</li>
    <li>Lorum ipsum</li>
    <li>Lorum ipsum</li>
</ul>
```

---

### beforeMe()

The `beforeMe()` method attaches elements as siblings before the beginning of the first element of the associated ENode. It returns the original ENode.

| Syntax                   | Description                    |
| :----------------------- | :----------------------------- |
| ENode.beforeMe(selector) | String containing CSS selector |
| ENode.beforeMe(ENode)    | Another ENode                  |

```html
<ul id="sidebar">
    <li>Lorum ipsum</li>
    <li>Lorum ipsum</li>
    <li>Lorum ipsum</li>
    <li>Lorum ipsum</li>
</ul>
```

```js
$('ul').beforeMe('<div class="evolv-above-sidebar">Above sidebar</div>');
```

Output:

```html
<div class="evolv-above-sidebar">Above sidebar</div>
<ul id="sidebar">
    <li>Lorum ipsum</li>
    <li>Lorum ipsum</li>
    <li>Lorum ipsum</li>
    <li>Lorum ipsum</li>
</ul>
```

---

### afterMe()

The `afterMe()` method attaches elements as siblings after the end of the first element of the associated ENode. It returns the original ENode.

| Syntax                  | Description                    |
| :---------------------- | :----------------------------- |
| ENode.afterMe(selector) | String containing CSS selector |
| ENode.afterMe(ENode)    | Another ENode                  |

```html
<ul id="sidebar">
    <li>Lorum ipsum</li>
    <li>Lorum ipsum</li>
    <li>Lorum ipsum</li>
    <li>Lorum ipsum</li>
</ul>
```

```js
$('ul').afterMe('<div class="evolv-below-sidebar">Below sidebar</div>');
```

Output:

```html
<ul id="sidebar">
    <li>Lorum ipsum</li>
    <li>Lorum ipsum</li>
    <li>Lorum ipsum</li>
    <li>Lorum ipsum</li>
</ul>
<div class="evolv-below-sidebar">Below sidebar</div>
```

---

### insertBefore()

The `insertBefore()` method attaches the first element in the associated ENode as a sibling before the passed element. It returns the original ENode.

| Syntax                       | Description                    |
| :--------------------------- | :----------------------------- |
| ENode.insertBefore(selector) | String containing CSS selector |
| ENode.insertBefore(ENode)    | Another ENode                  |

```html
<ul id="sidebar">
    <li>Lorum ipsum</li>
    <li>Lorum ipsum</li>
    <li>Lorum ipsum</li>
    <li>Lorum ipsum</li>
</ul>
```

```js
$('ul > :first-child').insertBefore($('<li>New first child</li>'));
```

Output:

```html
<ul id="sidebar">
    <li>New first child</li>
    <li>Lorum ipsum</li>
    <li>Lorum ipsum</li>
    <li>Lorum ipsum</li>
    <li>Lorum ipsum</li>
</ul>
```

---

### insertAfter()

The `insertAfter()` method attaches the first element in the associated ENode as a sibling after the passed element. It returns the original ENode.

| Syntax                      | Description                    |
| :-------------------------- | :----------------------------- |
| ENode.insertAfter(selector) | String containing CSS selector |
| ENode.insertAfter(ENode)    | Another ENode                  |

```html
<ul id="sidebar">
    <li>Lorum ipsum</li>
    <li>Lorum ipsum</li>
    <li>Lorum ipsum</li>
    <li>Lorum ipsum</li>
</ul>
```

```js
$('ul > :last-child').insertAfter($('<li>New last child</li>'));
```

Output:

```html
<ul id="sidebar">
    <li>Lorum ipsum</li>
    <li>Lorum ipsum</li>
    <li>Lorum ipsum</li>
    <li>Lorum ipsum</li>
    <li>New last child</li>
</ul>
```

---

### wrap()

Wraps each element of an ENode with the specified element. Returns the original ENode.

| Syntax           | Description                       | Returns      |
| :--------------- | :-------------------------------- | :----------- |
| ENode.wrap(HTML) | String containing an HTML element | ENode (self) |

```html
<div class="item">Item</div>
<div class="item">Item</div>
<div class="item">Item</div>
<div class="item">Item</div>
```

```js
$('div').wrap('<div class="evolv-item-wrap"></div>');
```

Output:

```html
<div class="evolv-item-wrap">
    <div class="item">Item</div>
</div>
<div class="evolv-item-wrap">
    <div class="item">Item</div>
</div>
<div class="evolv-item-wrap">
    <div class="item">Item</div>
</div>
<div class="evolv-item-wrap">
    <div class="item">Item</div>
</div>
```

---

### wrapAll()

Wraps all of the elements of an ENode with the specified element. Returns the original ENode.

| Syntax           | Description                       | Returns      |
| :--------------- | :-------------------------------- | :----------- |
| ENode.wrap(HTML) | String containing an HTML element | ENode (self) |

```html
<div class="item">Item</div>
<div class="item">Item</div>
<div class="item">Item</div>
<div class="item">Item</div>
```

```js
$('div').wrapAll('<div class="evolv-item-wrap"></div>');
```

Output:

```html
<div class="evolv-item-wrap">
    <div class="item">Item</div>
    <div class="item">Item</div>
    <div class="item">Item</div>
    <div class="item">Item</div>
</div>
```

---

### markOnce()

Returns a new ENode filtered to remove elements containing the specified attribute, then adds the attribute to the remaining elements. Useful for ensuring code only executes once on a desired element.

| Syntax                    | Description                 | Returns   |
| :------------------------ | :-------------------------- | :-------- |
| ENode.markOnce(attribute) | String containing attribute | new ENode |

```html
<ul id="sidebar">
    <li evolv="true">First list item</li>
    <li evolv="true">Second list item</li>
    <li evolv="true">Third list item</li>
    <li>Fourth list item</li>
</ul>
```

```js
$('li').markOnce('evolv');
// Output: ENode.el: Array(1) 0: <li evolv="true">Fourth list item</li>
```

---

### on()

The `on()` method adds event listeners to the specified selector.

| Syntax                    | Description                                                                     | Returns      |
| :------------------------ | :------------------------------------------------------------------------------ | :----------- |
| ENode.on(event, function) | Event: String containing event<br>Function: A function to be fired on the event | ENode (self) |

```html
<button>Continue</button>
```

```js
$('button').on('click', (event) => {
    console.log('test');
});
// Output: Prints "test" to the console every time the button is clicked
```

---

### html()

Returns a string of the inner HTML of the associated ENode. If the ENode contains multiple elements this method will return a single concatenated string of the inner HTML of all the elements. If a parameter is provided, it will set the inner HTML of the associated ENode.

| Syntax           | Description            | Returns      |
| :--------------- | :--------------------- | :----------- |
| ENode.html()     | Empty                  | String       |
| ENode.html(HTML) | String containing HTML | ENode (self) |

```html
<button><span>Continue</span></button>

<ul id="sidebar">
    <li><span>First</span></li>
    <li><span>Second</span></li>
    <li><span>Third</span></li>
</ul>
```

```js
$('button').html();
// Output: "<span>Continue</span>"

$('button').html('<span>Pre-order</span>');
// Output: ENode.el: Array(1) 0: <button><span>Pre-order</span></button>

$('li').html();
// Output: "<li><span>First</span></li><li><span>Second</span></li><li><span>Third</span></li>"

$('li').html('<span>List item</span>');
// Output: ENode.el: Array(3)
//           0: <li><span>List item</span></li>
//           1: <li><span>List item</span></li>
//           2: <li><span>List item</span></li>
```

---

### text()

Returns the text of the associated ENode. If the ENode contains multiple elements this method will return a single space-separated concatenated string of the text content of all the elements. If a parameter is provided, it will set the text content for the associated ENode.

| Syntax           | Description            | Returns      |
| :--------------- | :--------------------- | :----------- |
| ENode.text()     | Empty                  | String       |
| ENode.text(text) | String containing text | ENode (self) |

```html
<button>Continue</button>

<ul id="sidebar">
    <li>First</li>
    <li>Second</li>
    <li>Third</li>
</ul>
```

```js
$('button').text();
// Output: "Continue"

$('button').text('Pre-order');
// Output: ENode.el: Array(1) 0: <button>Pre-order</button>

$('li').text();
// Output: "First Second Third"

$('li').text('List item');
// Output: ENode.el: Array(3)
//           0: <li>List item</li>
//           1: <li>List item</li>
//           2: <li>List item</li>
```

---

### attr()

Returns the specified attribute on the associated ENode. If the ENode contains multiple elements it will return a space-separated concatenated string of all the attribute values. If a parameter is provided, it will set the attribute content.

| Syntax             | Description                           | Returns      |
| :----------------- | :------------------------------------ | :----------- |
| ENode.attr()       | Empty                                 | String       |
| ENode.attr(object) | Object of format { attribute: value } | ENode (self) |

```html
<button aria-label="Continue">Continue</button>

<ul id="sidebar">
    <li data-testid="first">First</li>
    <li data-testid="second">Second</li>
    <li data-testid="third">Third</li>
</ul>
```

```js
$('button').attr('aria-label');
// Output: "Continue"

$('button').attr({ 'aria-label': 'Pre-order' });
// Output: ENode.el: Array(1) 0: <button aria-label="Pre-order">Continue</button>

$('li').attr('data-testid');
// Output: "first second third"

$('li').attr({ 'data-testid': 'list-item' });
// Output: ENode.el: Array(3)
//           0: <li data-testid="list-item">First</li>
//           1: <li data-testid="list-item">Second</li>
//           2: <li data-testid="list-item">Third</li>
```

---

### each()

Iterates over each element in an ENode and executes a callback function. Returns the original ENode.

| Syntax               | Description                                                                                         | Returns      |
| :------------------- | :-------------------------------------------------------------------------------------------------- | :----------- |
| ENode.each(callback) | Callback function of the form `(ENode) => {}`. Optional `index` and `array` parameters coming soon! | ENode (self) |

```html
<ul id="sidebar">
    <li>First</li>
    <li>Second</li>
    <li>Third</li>
</ul>
```

```js
$('li').each((item) => {
    var itemText = item.text();
    item.text(itemText + 'item');
});
```

Output:

```html
<ul id="sidebar">
    <li>First item</li>
    <li>Second item</li>
    <li>Third item</li>
</ul>
```

---

### watch()

Waits for changes on the associated ENode before executing the callback function.

| Syntax                            | Description                                                                                                      | Returns            |
| :-------------------------------- | :--------------------------------------------------------------------------------------------------------------- | :----------------- |
| ENode.wait(config).then(callback) | Config: MutationObserver configuration, see defaults below<br>Callback: function of the form `(mutations) => {}` | Callback execution |

```html
<ul id="sidebar">
    <li>First</li>
    <li>Second</li>
    <li>Third</li>
</ul>
```

```js
$('#sidebar').watch(() =>{
  $("li").each( elem => {
    elem.text("test");
  }
});
// Output: will change all the li elements to have the text "test" when the contents of the ul are modified in anyway
```

---

### firstDom()

Returns the first element in the ENode. Equivalent to `ENode.el[0]`.

| Syntax           | Description   | Returns      |
| :--------------- | :------------ | :----------- |
| ENode.firstDom() | No parameters | HTML Element |

```html
<ul id="sidebar">
    <li>First</li>
    <li>Second</li>
    <li>Third</li>
</ul>
```

```js
$('li').firstDom();
// Output: <li>First</li>
```

---

### lastDom()

Returns the last element in the ENode. Equivalent to `ENode.el.slice(-1)`.

| Syntax          | Description   | Returns      |
| :-------------- | :------------ | :----------- |
| ENode.lastDom() | No parameters | HTML Element |

```html
<ul id="sidebar">
    <li>First</li>
    <li>Second</li>
    <li>Third</li>
</ul>
```

```js
$('li').lastDom();
// Output: <li>Third</li>
```

---

### first()

Returns an ENode containing the first child element in the ENode.

| Syntax        | Description   | Returns   |
| :------------ | :------------ | :-------- |
| ENode.first() | No parameters | New ENode |

```html
<ul id="sidebar">
    <li>First</li>
    <li>Second</li>
    <li>Third</li>
</ul>
```

```js
$('li').first();
// Output: ENode.el: Array(1) 0: <li>First</li>
```

---

### last()

Returns an ENode containing the last child element in the ENode.

| Syntax       | Description   | Returns   |
| :----------- | :------------ | :-------- |
| ENode.last() | No parameters | New ENode |

```html
<ul id="sidebar">
    <li>First</li>
    <li>Second</li>
    <li>Third</li>
</ul>
```

```js
$('li').last();
// Output: ENode.el: Array(1) 0: <li>Third</li>
```

---

## Examples

Once the integration is configured, you can setup context javascript.

## Example 1 - Instrumentation

### Context

```js
// This is where you initialize the `rule` sandbox. Note the sandbox name appended at the end of the `renderRule`
var rule = window.evolv.renderRule.my_sandbox_1;

// Getting a reference to the store. This is where shared variables related to the current render are stored.
var store = rule.store;

// Rename so it doesn't collide with jQuery. This is a basic selector function for catalyst.
var $ = rule.$;

/*
instrumentDOM defines classes to keys. Those classes are then added to the one or more elements returned by the selectors. 
By default, instrumentDOM prefixes the class name with `evolv-` and uses the property name as the suffix to the class.
Each element is also tagged with a unique attribute to handle idempotency (prevent an element from being manipulated more than once).
*/
store.instrumentDOM({
    'device-tile': {
        get dom() {
            return $('.device-tile, .byod-device-tile');
        },
    },
    'pod-parent': {
        get dom() {
            return $('.evolv-deviceTile [id*=mvo_ovr_devices]')
                .first()
                .parent();
        },
    },
    'button-parent': {
        get dom() {
            return $('button.addALine)').parent();
        },
        asClass: 'my-unique-button-class', // Will apply class of 'evolv-my-unique-button-class' instead of 'evolv-button-parent'
    },
});
```

## Example 2

### Target page before

```html
<main>
    <form>
        <fieldset>
            <legend>User Info</legend>
            <ul>
                <li>
                    <label for="firstName">First Name</label>
                    <input type="text" id="firstName" name="firstName" />
                </li>
                <li>
                    <label for="lastName">Last Name</label>
                    <input type="text" id="lastName" name="lastName" />
                </li>
                <li>
                    <label for="telNumber">Tel Number</label>
                    <input type="tel" id="telNumber" name="telNumber" />
                </li>
            </ul>
        </fieldset>
    </form>
</main>
```

### Context

```js
var rule = window.evolv.renderRule.visible_homepage_1;
var store = rule.store;
var $ = rule.$;
var $$ = rule.$$;

store.instrumentDOM({
    'form-input': {
        get dom() {
            return $('form fieldset input');
        },
    },
    'form-label': {
        get dom() {
            return $('form fieldset label');
        },
    },
});

rule.whenDOM('.evolv-form-input').then((input) => {
    var label = input.prev();
    input.attr({ placeholder: label.text() });
});
```

Alternatively use `whenItem` to reference the property name that was instrumented.

```js
rule.whenItem('form-input').then((input) => {
    var label = input.prev();
    input.attr({ placeholder: label.text() });
});
```

### Context SASS

```sass
.evolv {
  &-form-label {
    display: none;
  }
}
```

### Target page after

```html
<!-- Note: all labels now are hidden by CSS -->
<main>
    <form>
        <fieldset>
            <legend>User Info</legend>
            <ul>
                <li>
                    <label for="firstName" class="evolv-form-label"
                        >First Name</label
                    >
                    <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        class="evolv-form-input"
                        placeholder="First Name"
                    />
                </li>
                <li>
                    <label for="lastName" class="evolv-form-label"
                        >Last Name</label
                    >
                    <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        class="evolv-form-input"
                        placeholder="Last Name"
                    />
                </li>
                <li>
                    <label for="telNumber" class="evolv-form-label"
                        >Tel Number</label
                    >
                    <input
                        type="tel"
                        id="telNumber"
                        name="telNumber"
                        class="evolv-form-input"
                        placeholder="Tel Number"
                    />
                </li>
            </ul>
        </fieldset>
    </form>
</main>
```

You can use `whenItem('buttonParent')`, `whenItem(store.buttonParent)` to select specific elements of a page for manipulation like jQuery. One more similar option utilizes `whenDOM('.evolv-buttonParent')`

```js
rule.app.createMainButton = function(){
  rule
    .whenDOM('.evolv-buttonParent')
    .then(function(buttonParent){
      buttonParent.append(...);
    }
};
```
