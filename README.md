# Catalyst

A library to streamline writing Evolv AI experiments

## Goals

The goals for this framework are to provide the following:

1. Maintain classes and references to elements that persist through mutations.
1. Handle idemponency.
1. Sandbox experiments to prevent namespace collisions.
1. Queue functions to run in response to SPA changes or mutations.
1. Experiment specific setTimeout and setInterval calls that handle SPA navigation automatically.
1. Simplify coding and support declarative where possible.
1. Allow simple experiments to remain simple and support more complex tests (model view rendering)
1. Simplify things like Mutation Observer.

## Installation

Add the NPM integration connector `@evolv-delivery/catalyst`.

## Setup

Add the following json config at environment level to enable the framework across a site

```json
{
    "pages": ["/"]
}
```

---

## renderRule

*Deprecated as of 0.6.0, use [catalyst](#catalyst-1) instead*

---

## catalyst

The core Catalyst object containing sandboxes, selectors, instrumentation, global mutation observer, as well as the `store` and `app` repositories for assets and functions that can be shared between variants.

Adding a new property to the `catalyst` object creates a new sandbox allowing for multiple experiments to run on the page simultaneously without collisions.

New syntax provides a different selector for a single element `$` vs. a group of elements `$$`. The `$$` selector used for instrument items prior to `0.6.0` has been renamed to `$i`. For this to work the following should appear at the top the context _and_ each variant so that they all are working within the same sandbox.

```js
var rule = evolv.catalyst.experiment_name;
var store = rule.store;
var $ = rule.select;
var $$ = rule.selectAll;
var $i = rule.selectInstrument;
var log = rule.log;
```

---

### rule.log(), rule.warn(), rule.debug()

*New in 0.6.0* - Safe and enhanced logging to the console. Uses `console.info` or `console.warn` under the hood due to VBG restricting `console.log`, adding the following features:

- Automatically silenced in production so logging can be built into experiment code and revealed by setting the log level in local storage.
- Prefixing with `[evolv-sandbox]` to distinguish logs from multiple simultaneous experiments.
- Optional log color to visually distinguish Catalyst logs from the host site.

| Syntax               | Description     | Notes |
| :------------------- | :-------------- | :---- |
| `log(<arguments>)` | Strings or variables separated by commas, displayed at log level `normal` and `debug`<br>`log('heading:', heading)` | Added in 0.6.0 |
| `warn(<arguments>)` | Strings or variables separated by commas, displayed at log level `normal` and `debug`<br>`warn('Selector not found', selector)` | Added in 0.6.0 |
| `debug(<arguments>)` | Strings or variables separated by commas, displayed at log level `debug`<br>`debug('Selector found after', then - performance.now(), 'ms')` | Added in 0.6.0 |

Log levels are set in two locations, a default for the environment and a local storage key. Log levels can be overridden in experiment code though it is not recommended as **overrides in experiment code will not be silenced in production**.

VCG

| Environment Name | Environment Id | Default log level |
| :--------------- | :------------- | :---------------- |
| Production | `b02d16aa80` | `silent` |
| Staging    | `add8459f1c` | `normal` |
| Development | `55e68a2ba9` | `normal` |
| Prototype | `eee20e49ae` | `normal` |
| verizon qa | `b5d276c11b` | `normal` |

VBG

| Environment Name | Environment Id | Default log level |
| :--------------- | :------------- | :---------------- |
| Production | `13d2e2d4fb` | `silent` |
| QA Testing    | `4271e3bfc8` | `normal` |
| UAT | `6bfb40849e` | `normal` |

Local Storage Options

The key `evolv:catalyst-logs` can be set to `silent`, `normal`, or `debug` with an optional `color` flag.

| key | value | description |
| :-- | :---- | :---------- |
| `evolv:catalyst-logs` | `silent` | Silences all logs |
|                       | `normal` | Displays `log` and `warn` messages |
|                       | `debug`  | Displays `log`, `warn`, and `debug` messages |
|                       | `color`  | Enables color prefixes, `log` and `warn` messages are orange, `debug` messages are light orange<br>Setting `evolv:catalyst-logs` to `debug color` displays all logs and with color prefixes.

Experiment Log Level Override

**Warning: log level overrides in experiment code will not be silenced in production**

```js
const rule = window.evolv.catalyst.xyz;
const { log, warn, debug } = rule;

rule.logs = 'debug';
rule.logColor = true; // Default is false
```
---

### rule.id

*New in 0.6.0* - The id for the current context. Declared at the context level, assigning this value initializes the active key listener for SPA handling. This is an alternative to [rule.isActive()](#ruleisactive).

| Syntax               | Description     | Notes |
| :------------------- | :-------------- | :---- |
| `rule.id = <context id>` | `<context id>`: The id of the current context | Added in 0.6.0 |

Within the context level of an experiment the id can be found attached to the `this` object.

```js
// In this example the context id is 'context_id'
console.log(this.key) // Output: web.context_id

const rule = window.evolv.catalyst.xyz
rule.id = this.key.split('.')[1] // context_id
```

The context id can also be found in the metamodel. If the metamodel was created in the Web Editor `context_id` would be a randomly generated hash, if using a build process like the project scaffold you would manually assign it.

```yml
web:
    context_id:
        _id: context_id
```

The context key also corresponds to the class added to the `html` element when the experiment is active.

```html
<html class="evolv_web_context_id evolv_web_context_id_variable">
```
---

### rule.isActive()

Declared at the context level code, defines criteria for determining whether the current context is active. Assigning this function initializes the active key listener for SPA handling.

| Syntax               | Description     | Notes |
| :------------------- | :-------------- | :---- |
| `rule.isActive = <function>` | `<function>`: A function that returns true when the current context is active | |

The standard method for determining if the current context is active has been to check the `html` element for the context key.

```js
// In this example the context id is 'context_id'

const rule = window.evolv.catalyst.xyz
rule.isActive = () => {
    return Array.from(document.querySelector('html').classList).includes(
        'evolv_web_context_id'
    );
};
```
---

---

### rule.instrument.add()

*New in 0.6.0* - Replaces [rule.store.instrumentDOM()](#rulestoreinstrumentdom). Accepts an instrument key, select function, and options or an array of these inputs and adds an entry in `rule.instrument.queue`.

| Syntax               | Description     | Notes |
| :------------------- | :-------------- | :---- |
| `rule.instrument.add(<key>, <select>, <options>)` | `<key>`: A string for reference, can contain dashes or underscores but no white space<br>`<select>`: A function that returns an ENode<br>`() => $('h1')`<br>`<options>`: and object containing valid options |  |
| `rule.instrument.add(<array>)` | `<array>`: An array containing arrays of arguments (see example below). | |

| Option | Description | Notes |
| :----- | :---------- | :---- |
| `type` | String containing either `single` or `multi`, defaults to `multi`. Specifies whether the instrument should return an ENode containing a single element or multiple. Respected by `rule.selectInstrument` and `rule.whenItem`. Provides a slight performance improvement when set to `single` | |
| `asClass` | String: Replaces the default class name<br>`null`: Disables adding instrument class | |
| `onConnect` | An array of callbacks to be executed whenever a selected element is connected | |
| `onDisconnect` | An array of callbacks to be executed whenever a selected element is disconnected | |

*Note:* Calling `rule.instrument.add()` triggers the processing of the instrumentation, so for instrumenting multiple items the array approach is much more performant than calling successive `rule.instrument.add()` functions.

```js
const rule = window.evolv.catalyst['ab-test']
const $ = rule.select;
const $$ = rule.selectAll;
const $i = rule.selectInstrument;

rule.instrument.add('body', () => $(document.body))

rule.instrument.add([
    ['page', () => $('#page'), {type: 'single'}]
    ['page-heading', () => $i('page').find('h1'), {type: 'single'}],
    ['section-headings', () => $$('h2')],
    ['buttons', () => $$('button'), {asClass: 'button'}], // Applies class 'evolv-button' instead of 'evolv-buttons'
    ['links', () => $$('a'), {asClass: null}], // Applies no class
]);
```
---

### rule.$()

The default `$` selector prior to 0.6.0. Now a proxy for [rule.selectAll()](#ruleselectall).

---

### rule.$$()

The default instrument selector prior to 0.6.0. Now a proxy for [rule.selectInstrument()](#ruleselectinstrument).

---

### rule.select()

*New in 0.6.0* - Typically assigned to `$`, accepts a variety of inputs and returns an ENode containing a **single** element. 

| Syntax               | Description     | Notes |
| :------------------- | :-------------- | :---- |
| `$(<selector>, <context>)` | `<selector>`: String containing CSS selector<br>Context (optional): Element, default is `document`<br>`$('p')`, `$('.some-class')`, `$('.parent > [attr=some-attribute]'` | |
| `$(<XPath>, <context>)`    | Selector: String containing XPath selector<br> Context (optional): Element, default is `document`<br>`$('//p')`, `$('//button[contains(text(),"Go")]')`, `$('//h3[contains(text(),"Heading")]/parent::*/parent::*')` | |
| `$(<ENode>)`             | Another ENode, returns a new ENode containing the first element of the original ENode<br>`var pageHeading = $('h1'); var pageHeadingRef = $(pageHeading) | |
| `$(<element>)`           | A variable referencing an element<br>`$(document.body)` | |
| `$(<array>)`             | An array of elements, returns an ENode containing the first element of the array<br>`var everyLi = Array.from(document.querySelectorAll('li')); $(everyLi)` | |
| `$(<HTML>)`              | Creates a new ENode from an HTML string containing a single parent element<br>`$('<div class="evolv-card"><h3>Heading</h3><p>Some text.</p></div>')`<br>Note: Prior to v.0.6.0`$('<div class="sibling-1"></div><div class="sibling-2"></div>')` would return an ENode only containing the first `div` | |
| `$()`                  | Creates a new empty ENode<br>`var a = $() // a.el: []` | |

---

### rule.selectAll()

*New in 0.6.0* - Typically assigned to `$$`, accepts a variety of inputs and returns an ENode containing all matching elements. 

| Syntax               | Description     | Notes |
| :------------------- | :-------------- | :---- |
| `$(<selector>, <context>)` | Selector: String containing CSS selector<br>Context (optional): Element, default is `document`<br>`$('p')`, `$('.some-class')`, `$('.parent > [attr=some-attribute]'` | |
| `$(<XPath>, <context>)`    | Selector: String containing XPath selector<br> Context (optional): Element, default is `document`<br>`$('//p')`, `$('//button[contains(text(),"Go")]')`, `$('//h3[contains(text(),"Heading")]/parent::*/parent::*')` | |
| `$(<ENode>)`             | Another ENode, returns a new ENode referencing the original ENode<br>`var pageHeading = $('h1'); var pageHeadingRef = $(pageHeading)` | |
| `$(<element>)`           | A variable referencing an element<br>`$(document.body)` | |
| `$(<array>)`             | An array of elements, returns an ENode the array<br>`var everyLi = Array.from(document.querySelectorAll('li')); $(everyLi)` | |
| `$(<HTML>)`              | Creates a new ENode from an HTML string<br>`$('<div class="evolv-card"><h3>Heading</h3><p>Some text.</p></div>')`<br>**Note:** Prior to v.0.6.0`$('<div class="sibling-1"></div><div class="sibling-2"></div>')` would return an ENode only containing the first `div` | |
| `$()`                  | Creates a new empty ENode<br>`var a = $() // a.el: []` | |

---

### rule.selectInstrument()

*New in 0.6.0* - Typically assigned to `$i`, accepts a key for `rule.instrument.queue` and returns the referenced ENode. If the instrument item has the option `{ type: 'single' }` will return an ENode with the first element of the referenced ENode.

| Syntax | Description | Notes |
| :----- | :---------- | :---- |
| `$(<key>)` | String containing a key for `rule.instrument.queue`<br>`$$('page-heading')`, `$$('promo').find('p')`, `$$('product').parent()` | |

```js
var rule = window.evolv.catalyst.ab_test;
var $ = rule.select;
var $i = rule.selectInstrument;

rule.instrument.add('page-heading', () => $('h1'))

var pageHeading = $i('page-heading'); // Output: pageHeading.el Array(1) 0: h1.evolv-page-heading
```

---

### rule.key()

---

### rule.track()

Applies a variant-specific attribute to the `body` to allow you define all the variant CSS at the context level. If multiple variants are active simultaneously they will be space-delimited in the attribute. *New in 0.6.0* - Attribute will be removed with SPA navigation away from the page.

*New in 0.6.0* - Also applies a variant-specific class to the `body` element;

**Note:** With 11 or more variants it's easy to misapply styles because `body[evolv-ab_test*='1-1']` matches `<body evolv-ab_text="11-1">` this can solved by using brackets around your variant identifiers. For example: `rule.track('[1-1]')`. This issue does not exist if you reference the new class instead of the attribute.

| Syntax              | Description                                            | Notes |
| :------------------ | :----------------------------------------------------- | ----- |
| `rule.track(<variant>)` | String containing a variant key<br>`rule.track('1-1')`, `rule.track('c1v1')` | |

Context JS:

```js
var rule = window.evolv.catalyst['ab-test'];
```

Context SASS

```sass
body.evolv-ab-test-c1v1 {
    .evolv {
        &-heading {
            font-size: 3rem;
        }
    }
}

body.evolv-ab-test-c1v2 {
    .evolv {
        &-heading {
            font-size: 4rem;
        }
    }
}
```

Variant C1V1 JS:

```js
var rule = window.evolv.catalyst['ab-test'];
rule.track('c1v1');
```

Variant C2V2 JS:

```js
var rule = window.evolv.catalyst['ab-test'];
rule.track('c1v2');
```

Target HTML where variant C1V1 and C2V2 are active:

```html
<body class="evolv-ab-test-c1v1 evolv-ab-test-c1v2" evolv-ab_test="c1v1 c1v2">
    <h1 class="evolv-heading">Heading</h1>
    <!-- Here the h1 would receives the styles from both variants -->
    ...
</body>
```
---
### rule.whenContext()

*New in 0.6.0* - Listens for `evolv.client.getActiveKeys` and fires a callback when the sandbox state changes to `active` or `inactive`. Useful for SPA cleanup functions.

| Syntax | Description | Notes |
| :----- | :---------- | ----- |
| `rule.whenContext(<state>).then(<callback>)` | `<state>`: String containing `active` or `inactive`<br>`<callback>`: Callback to be added to the `onActivate` or `onDeactivate` queue | |

```js
const rule = window.evolv.catalyst['ab-test'];
const $ = rule.select;

rule.key = 'abtest' // Assigning the context key initiates the active key listener

function makeThings() {
    $('h1').afterMe('<p class="evolv-subheading">New Subheading</p>')
}

function cleanUp() {
    $('.evolv-subheading').el[0].remove();
}

rule.whenContext('active').then(() => makeThings());
rule.whenContext('inactive').then(() => cleanUp());
```
---

### rule.whenMutate()

*New in 0.6.0* - Fires a callback when there is a change detected on the page. More specifically this fires after processing the instrument queue which is debounced, so it doesn't fire on *every* mutation but when a mutation or cluster of mutations happen and then stop for at least 1/60th of a second. Can replace many instances that would have required `rule.watch()` without having to add another mutation observer to the page. Is that better for performance? Nobody knows.

| Syntax | Description | Notes |
| :----- | :---------- | ----- |
| `rule.whenMutate().then(<callback>)` | `<callback>`: Callback to added to the `onMutate` queue | |

```js
// In this example there's a price on the page that can change dynamically so we create a function that updates the price and set it to fire whenever there's a mutation on the page.

const rule = window.evolv.catalyst.xyz;
const $ = rule.select;

function updatePrice() {
    const price = $('.price');
    const priceString = price.text();

    const newPrice = $('.evolv-price');
    const newPriceString = `The price is currently ${price}`;

    price.addClass('evolv-display-none');

    if (!newPrice.exists()) {
        $(`<p class="evolv-price">${newPriceString}</p>`).insertAfter(price)
    } else {
        newPrice.text(newPriceString)
    }
}

updatePrice();

rule.onMutate().then(updatePrice);
```
---

### .whenItem()

The `whenItem()` method will wait for the selector associated with the specified instrument key and passes the found ENode to a callback. Has two options for how callbacks are applied. `rule.whenDOM().then()` applies a callback to an ENode containing each element found individually. `rule.whenDOM().thenInBulk()` applies a callback to an ENode containing a group of elements if they are discovered at one time. *New in 0.6.0* - Does not allow a the same callback to be applied to the same selector more than once, allowing when methods to be nested without creating duplicate listeners.  If the instrument item has the option `{ type: 'single' }` will return an ENode with the first element of the referenced ENode.

| Syntax | Description | Notes |
| :----- | :---------- | :---- |
| `rule.whenItem(<instrument key>)` | String containing a key to the `instrument.queue` object<br>`rule.whenItem('product')` | |
| `.then(ENode => callback(<ENode>))` | Executes a callback on each new element found in the ENode | |
| `.thenInBulk(ENode => callback(<ENode>))` | Executes a callback on the group of elements in the ENode | |

```js
const rule = window.evolv.catalyst['ab-test'];

rule.instrument.add([
    ['page-heading', () => $('h1')],
    ['button', () => $('button')],
    ['h2', () => $('h2')]
]);

rule.whenItem('page-heading').then((pageHeading) =>
    pageHeading.text('New improved heading')
);
// <h1 class="evolv-page-heading">New improved heading</h1>

rule.whenItem('buttons').then(buttons => console.log(buttons));
// Output:
//      ENode {el: [button.evolv-button], length: 1}
//      ENode {el: [button.evolv-button], length: 1}
//      ENode {el: [button.evolv-button], length: 1} 

rule.whenItem('h2').thenInBulk(h2 => console.log(h2));
// Output:
//      ENode {el: [h2.evolv-h2, h2.evolv-h2, h2.evolv-h2], length: 3}
```

---

### rule.whenDOM()

Waits for the specified selector or ENode to be selectable on the page and will apply a callback to each element when found. Has two options for how callbacks are applied. `rule.whenDOM().then()` applies a callback to each element found individually. `rule.whenDOM().thenInBulk()` applies a callback to a group of elements if they are discovered at one time. *New in 0.6.0* - Does not allow a the same callback to be applied to the same selector more than once, allowing when methods to be nested without creating duplicate listeners.

| Syntax | Description | Notes |
| :----- | :---------- | ----- |
| `rule.whenDOM(<selector>)` | String containing CSS selector<br>`rule.whenDOM('.product').then(el => {})` |
| `rule.whenDOM(<ENode>)`    | ENode<br>`rule.whenDOM($('button')).then(button => button.addClass('evolv-button')` | Added in 0.6.0
| `.then(<ENode> => callback(<ENode>))` | Creates an ENode for each new element found and passes them to a callback | |
| `.thenInBulk(<ENode> => callback(<ENode>))` | Creates an ENode containing the group of elements found and passes it to a callback  | |

```js
rule.whenDOM('h1').then((h1) => h1.text('New improved heading'));
```

---

### rule.whenElement()

*New in 0.6.0* - A wrapper for `rule.whenDOM` that executes a callback on the first element (not the ENode) meeting the selection criteria.

| Syntax | Description | Notes |
| :----- | :---------- | ----- |
| `rule.whenElement(<selector>)` | String containing CSS selector<br>`rule.whenElement('.product').then(product => {}).then(<element> => callback(<element>))` | |
| `rule.whenElement(<ENode>)`    | ENode<br>`rule.whenElement($('button')).then(button => button.classList.add('evolv-button').then(<element> => callback(<element>))` | |

```js
const rule = window.evolv.catalyst.xyz;

rule.whenElement('.product img').then(img => img.style.width = '100%');
// Will only adjust the first product image found
```

---

### rule.whenElements()

*New in 0.6.0* - A wrapper for `rule.whenDOM` that executes a callback on each element (not ENode) meeting the selection criteria.

| Syntax | Description | Notes |
| :----- | :---------- | ----- |
| `rule.whenElement(<selector>).then(<element> => <callback(<element>)>)` | String containing CSS selector<br>`rule.whenElement('.product').then(product => {})` | |
| `rule.whenElement(<ENode>)`    | ENode<br>`rule.whenElement($('button')).then(button => button.classList.add('evolv-button').then(<element> => callback(<element>))` | |

```js
const rule = window.evolv.catalyst.xyz;

rule.whenElements('.product img').then(img => img.style.width = '100%');
// Will change the width of every product image found
```

---

### rule.waitUntil()

*New in 0.6.0* - Accepts a condition and passes a the result to a callback when it evaluates truthy. Useful for waiting for a window property to be assigned before running code. Behind the scenes it uses a global interval polling function using `requestAnimationFrame()` that is shared between all sandbox.

| Syntax | Description | Notes |
| :----- | :---------- | ----- |
| `rule.waitUntil(<condition>)` | `<condition>`: a function that returns truthy | |

```js
const rule = window.evolv.catalyst.xyz;
const log = rule.log

rule.waitUntil(() => window.x).then(x => log('x:', x));

setTimeout(() => window.x = 100, 3000);

// After 3 seconds x will be assigned and you will see in the console:
// [evolv-xyz] x: 100
```

### rule.store

A object to house assets, variables, templates, icons, etc to be used in your experiment and shared between variants. It has the benefit of:

-   Only accessible from within the experiment sandbox so it doesn't pollute the global scope
-   Allows assets to be defined in the context and used in variants
-   Contains `.instrumentDOM()` method *Deprecated, use [rule.instrument.add()](#) instead* (add link here)

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

| Syntax                | Description                       | Returns | Notes |
| :-------------------- | :-------------------------------- | :------ | :---- |
| ENode.contains(text)  | String containing text            | ENode   | |
| ENode.contains(regex) | Regular expression                | ENode   | Added in 0.6.0 |

Example:

```html
<button id="learn-more">Learn more</button>
<button id="checkout">Checkout</button>
```

```js
const button = $('button');    // Output: ENode containing [ button#checkout, button#learn-more  ]
button.contains('Checkout');   // Output: ENode containing [ button#checkout ]
button.contains(/Learn more/); // Output: ENode containing [ button#learn-more ]
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

| Syntax           | Description            | Returns      |
| :--------------- | :--------------------- | :----------- |
| ENode.on(event, function) | Event: String containing event tag or multiple event tags separated by a space<br>Function: A function to be fired on the event | ENode (self) |

```html
<button>Continue</button>
```

```js
$('button').on('click', (event) => {
    console.log('test');
});
// Output: Prints "test" to the console every time the button is clicked

// Add multiple event tag example here
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

| Syntax           | Description            | Returns      |
| :--------------- | :--------------------- | :----------- |
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

| Syntax           | Description            | Returns      |
| :--------------- | :--------------------- | :----------- |
| ENode.wait(config).then(callback) | Config: MutationObserver configuration, see defaults below<br>Callback: function of the form `(mutations) => {}` | Callback execution |

Default config:

```js
{
    attributes: false,
    childList: true,
    characterData: false,
    subtree: true,
}
```

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