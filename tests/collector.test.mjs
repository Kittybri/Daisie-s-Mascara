import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzePage, collectPageSignals } from '../extension/engine.js';

function collectForm(action, destinations) {
  const form = { getAttribute: name => name === 'action' ? action : null };
  const password = { form };
  Object.defineProperty(password, 'value', { get() { throw new Error('Form values must not be read'); } });
  const controls = destinations.map(destination => ({
    form,
    tagName: 'BUTTON',
    type: 'submit',
    matches: () => false,
    getAttribute: name => name === 'formaction' ? destination : null
  }));
  const previousDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const previousLocation = Object.getOwnPropertyDescriptor(globalThis, 'location');
  Object.defineProperty(globalThis, 'document', { configurable: true, value: {
    baseURI: 'https://example.com/account',
    forms: [form],
    querySelectorAll(selector) {
      if (selector === 'input[type="password"]') return [password];
      if (selector === 'button[formaction], input[formaction]') return controls;
      return [];
    }
  } });
  Object.defineProperty(globalThis, 'location', { configurable: true, value: {
    href: 'https://example.com/account', origin: 'https://example.com'
  } });
  try {
    return collectPageSignals();
  } finally {
    if (previousDocument) Object.defineProperty(globalThis, 'document', previousDocument);
    else delete globalThis.document;
    if (previousLocation) Object.defineProperty(globalThis, 'location', previousLocation);
    else delete globalThis.location;
  }
}

test('malformed form action does not hide a valid submit override', () => {
  const collected = collectForm('http://[', ['http://submit.example/']);
  assert.equal(collected.page.nonWebPasswordForms, 1);
  assert.equal(collected.page.insecurePasswordForms, 1);
  assert.equal(collected.page.crossOriginPasswordForms, 1);
  assert.equal(analyzePage(collected).level, 'high');
});

test('malformed override does not hide later submission destinations', () => {
  const collected = collectForm('/account', ['http://[', 'http://submit.example/', 'https://other.example/']);
  assert.equal(collected.page.nonWebPasswordForms, 1);
  assert.equal(collected.page.insecurePasswordForms, 1);
  assert.equal(collected.page.crossOriginPasswordForms, 2);
  assert.ok(analyzePage(collected).signals.some(signal => signal.id === 'password-destination-http'));
});

test('normal same-origin form remains free of destination findings', () => {
  const collected = collectForm('/account', ['/sign-in']);
  assert.equal(collected.page.passwordCount, 1);
  assert.equal(collected.page.insecurePasswordForms, 0);
  assert.equal(collected.page.crossOriginPasswordForms, 0);
  assert.equal(collected.page.nonWebPasswordForms, 0);
  assert.deepEqual(analyzePage(collected).signals, []);
});
