const autofill = value => {
    const input = document.getElementById('PHONE_NUMBER_or_EMAIL_ADDRESS');
    const button = document.getElementById('forward-button');
    const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input), 'value').set;
  
    setter.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    button.dispatchEvent(new Event('mousedown', { bubbles: true }));
  };

  autofill('janedoe@gmail.com')