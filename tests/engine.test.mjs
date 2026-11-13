import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzePage } from '../extension/engine.js';

const check = (url, page = {}) => analyzePage({ url, page }, 123);
test('ordinary HTTPS has no warnings and is not certified safe', () => {
  const result = check('https://example.com/account?secret=abc#token');
  assert.equal(result.level, 'low');
  assert.deepEqual(result.signals, []);
  assert.equal(result.url, 'https://example.com');
  assert.equal(result.checkedAt, 123);
  assert.ok(!JSON.stringify(result).includes('secret'));
});
test('HTTPS alone does not cancel dangerous form behavior', () => {
  const result = check('https://example.com', { insecurePasswordForms: 1 });
  assert.equal(result.level, 'high');
  assert.equal(result.signals[0].id, 'password-destination-http');
});
test('unencrypted password page is high concern; plain HTTP suggests review', () => {
  assert.equal(check('http://example.com', { passwordCount: 1 }).level, 'high');
  assert.equal(check('http://example.com').level, 'medium');
});
test('external form action is explained with legitimate-use caveat', () => {
  const result = check('https://example.com', { crossOriginPasswordForms: 1 });
  assert.equal(result.level, 'medium');
  assert.match(result.signals[0].detail, /legitimate/);
});
test('IPv4 and IPv6 warning never treats normal numeric hostname as IP', () => {
  assert.equal(check('https://192.0.2.1').signals[0].id, 'ip-host');
  assert.equal(check('https://[2001:db8::1]').signals[0].id, 'ip-host');
  assert.deepEqual(check('https://123.example.com').signals, []);
});
test('IDN, misleading links and embedded credentials have explicit warnings', () => {
  assert.equal(check('https://xn--pple-43d.com').signals[0].id, 'international-domain');
  assert.equal(check('https://example.com', { mismatchedLinks: 1 }).signals[0].id, 'mismatched-links');
  const result = check('https://mybank:password@example.com');
  assert.equal(result.signals[0].id, 'url-credentials');
  assert.equal(result.url, 'https://example.com');
});
test('weak evidence does not claim high concern and threshold is inclusive', () => {
  assert.equal(check('https://example.com/' + 'x'.repeat(160)).level, 'low');
  assert.equal(check('https://a.b.c.d.example.com').signals[0].id, 'deep-host');
});
test('unsupported schemes reject', () => {
  for (const url of ['chrome://settings', 'javascript:alert(1)', 'file:///tmp/a', 'data:text/html,hi']) assert.throws(() => check(url));
});
test('coverage exposes limitations and bounded scans', () => {
  const result = check('https://example.com', { linksTruncated: true, embeddedFrames: 2, linksChecked: 500 });
  assert.equal(result.coverage.linksTruncated, true);
  assert.match(result.coverage.limitation, /top-level/);
  assert.equal(analyzePage({ url: 'https://example.com', page: null }).coverage.pageReadable, false);
});
