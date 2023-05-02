
## Explanation
The Uber login web application is built using the [React](https://react.dev/) UI library; and as a consequence, most of the elements on the DOM tree are the result of rendering React components. A simple proof of this is the observation that every DOM element rendered in the React root container has been augmented with React specific properties. For example, inspecting the React root container element (**`div#root`**) will show that a React specific property (that looks like _`__reactContainer$osaqh3qzn3`_) has been added to the DOM element.

The `autofill()` function takes as its argument, `value` (preferably a string representing a valid email address or phone number), that should be programmatically set as the value of the login input element; and then goes ahead to trigger a form submission as though the login form has been interacted with by a real user.

The behaviour of the `autofill()` function can be summarized in the following steps:
1. Get references for the text input and button elements
2. Simulate updating the text input element's value with the value passed as argument
3. Simulate clicking the button element

### Get references for the elements
The application's login form has two (2) visible elements of interest:
- a text input element with an `id` attribute of `PHONE_NUMBER_or_EMAIL_ADDRESS`
- a "Continue" submit button element with an `id` attribute of `forward-button`

Since these elements have unique IDs, it is convenient to target them directly using the `document.getElementById()` method. The first 2 lines of the `autofill()` function does just that in order to obtain references to the elements.

```js
const input = document.getElementById('PHONE_NUMBER_or_EMAIL_ADDRESS');
const button = document.getElementById('forward-button');
```

### Simulate updating the text input
The first and obvious instinct is to do a simple assignment that updates `input.value` with the specified `value` that was passed as argument like so:
```js
input.value = value;
```

This actually does update the text input element with the specified value. However, it is undone when followed with the logic to simulate the button click (which is very strange). Sadly, this behaviour is a consequence of how React keeps track of value changes in controlled input elements as can be found [here](https://github.com/facebook/react/issues/11488).

Based on a [proposed solution](https://github.com/facebook/react/issues/11488#issuecomment-1109772342) to this strange React issue, it appears that updating the value of the `input` element by calling the **set** method of the `HTMLInputElement.prototype.value` _[accessor descriptor](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty#description)_ falls outside the scope of React's input value tracking system — causing React to behave as expected.

That said, the first task, following the proposed solution mentioned above, will be to obtain a reference to the **set** method of the `HTMLInputElement.prototype.value` accessor descriptor. That is exactly what line 3 of the `autofill()` function is doing:
```js
const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input), 'value').set;
```

Here, the prototype object of the `input` element is obtained by calling `Object.getPrototypeOf(input)` instead of `input.__proto__` as recommended [here](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/proto). Also, the `Object.getOwnPropertyDescriptor()` method is used to obtain the accessor descriptor of the `value` property from the prototype object.

Finally, the **set** method (`setter`) is called passing the `input` element as the `this` argument and the `value` that was passed to the `autofill()` function as the new value of the `input` element, after which an **input** event is then dispatched on the `input` element.

```js
setter.call(input, value);
input.dispatchEvent(new Event('input', { bubbles: true }));
```

### Simulate clicking the button
The first and obvious instinct is to trigger `button.click()` to dispatch a **click** event on the button element. However, this strangely does not work as expected, which only points to the fact that there are no click event listeners registered for the `button` element.

Further inspection of the properties of the `button` element reveals the props that have been passed to the React component that is used to render the button. This is what it looks like:
```js
{
  ...,
  __reactProps$sfrx6cqln4i: {
    className: "dt du cc d7 ae cb aj bx d8 ca d9 da ce db dc dd c2 de df dv dw",
    disabled: false,
    id: "forward-button",
    type: "submit",
    data-test: "forward-button",
    children: {...},
    onMouseDown: f(e)
  },
  ...
}
```

From the above snippet, the closest thing to an event listener is the `onMouseDown` prop that has been added to the underlying `button` element. Hence, it is safe to say that the `button` element is only interested in **mousedown** events. It also follows logically that a click event on a target element does not happen in isolation; it is [always preceeded by a couple of other mouse events](https://w3c.github.io/uievents/#events-mouseevent-event-order) (`mousedown [-> mousemove] -> mouseup -> click`) which always begins with a **mousedown** event.

Therefore, the last line of the `augment()` function successfully simulates a click of the button by dispatching a `mousedown` event on the `button` element as shown in the snippet below:
```js
button.dispatchEvent(new Event('mousedown', { bubbles: true }));
```

Here, the `bubbles` property of the dispatched mousedown event is set to `true`, because the mousedown event listener that has been registered on the `button` element is set to only be triggered if the `eventPhase` of the event is `BUBBLING_PHASE`. A simple confirmation of this will be to set the `bubbles` property to `false` or to not set it at all —  for which the expected click behaviour of the button no longer happens.
