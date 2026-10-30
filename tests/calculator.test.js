// Run with: node --test
const test = require("node:test");
const assert = require("node:assert/strict");
const { evaluate, format } = require("../calculator.js");

test("basic arithmetic", () => {
  assert.equal(evaluate("2+3"), 5);
  assert.equal(evaluate("10-4"), 6);
  assert.equal(evaluate("6*7"), 42);
  assert.equal(evaluate("9/3"), 3);
});

test("operator precedence and parentheses", () => {
  assert.equal(evaluate("2+3*4"), 14);
  assert.equal(evaluate("(2+3)*4"), 20);
  assert.equal(evaluate("2*(3+(4-1))"), 12);
});

test("unary minus", () => {
  assert.equal(evaluate("-5+2"), -3);
  assert.equal(evaluate("3*-2"), -6);
  assert.equal(evaluate("-(2+3)"), -5);
});

test("floating point noise is rounded away", () => {
  assert.equal(evaluate("0.1+0.2"), 0.3);
  assert.equal(evaluate("1.1*3"), 3.3);
});

test("percent behaves like a phone calculator", () => {
  assert.equal(evaluate("50%"), 0.5);
  assert.equal(evaluate("200+10%"), 220);
  assert.equal(evaluate("200-10%"), 180);
  assert.equal(evaluate("200*10%"), 20);
});

test("errors", () => {
  assert.throws(() => evaluate("5/0"), /divide by 0/);
  assert.throws(() => evaluate("2+"), /Incomplete/);
  assert.throws(() => evaluate("(2+3"), /Missing \)/);
  assert.throws(() => evaluate("1.2.3"), /Invalid number/);
  assert.throws(() => evaluate("alert(1)"), /Unexpected character/);
});

test("exponent results can be reused", () => {
  assert.equal(evaluate("1e+21*2"), 2e21);
  assert.equal(evaluate("1e-7+1"), 1.0000001);
});

test("format", () => {
  assert.equal(format(42), "42");
  assert.equal(format(1e20), "1e+20");
  assert.equal(format(0), "0");
});
