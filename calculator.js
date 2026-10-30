/*
  Calculator engine — a small recursive-descent parser.
  Replaces eval(): only numbers, + - * / %, and parentheses are accepted.

  Grammar:
    expression := term (("+" | "-") term)*
    term       := unary (("*" | "/") unary)*
    unary      := ("+" | "-") unary | postfix
    postfix    := primary "%"*
    primary    := number | "(" expression ")"

  Percent works like a phone calculator:
    50%       -> 0.5
    200 + 10% -> 220   (10% of the left-hand side)
    200 * 10% -> 20
*/
(function (root) {
  "use strict";

  function tokenize(input) {
    const tokens = [];
    let i = 0;
    while (i < input.length) {
      const ch = input[i];
      if (ch === " ") { i++; continue; }
      if (/[0-9.]/.test(ch)) {
        let num = "";
        while (i < input.length && /[0-9.]/.test(input[i])) num += input[i++];
        // Exponent part, so a result like "1e+21" can be reused in a new calculation.
        const exp = input.slice(i).match(/^e[+-]?[0-9]+/);
        if (exp) { num += exp[0]; i += exp[0].length; }
        if (num === "." || (num.match(/\./g) || []).length > 1) {
          throw new Error("Invalid number");
        }
        tokens.push({ type: "num", value: parseFloat(num) });
        continue;
      }
      if ("+-*/%()".includes(ch)) {
        tokens.push({ type: "op", value: ch });
        i++;
        continue;
      }
      throw new Error("Unexpected character: " + ch);
    }
    return tokens;
  }

  function parse(tokens) {
    let pos = 0;
    const peek = () => tokens[pos];
    const isOp = (v) => peek() && peek().type === "op" && peek().value === v;

    // Each parse step returns { value, percent } — `percent` marks a bare
    // "x%" term so that "a + x%" can be read as "a + a*x/100".
    function expression() {
      let left = term().value;
      while (isOp("+") || isOp("-")) {
        const op = tokens[pos++].value;
        const right = term();
        const rhs = right.percent ? left * right.value : right.value;
        left = op === "+" ? left + rhs : left - rhs;
      }
      return { value: left, percent: false };
    }

    function term() {
      let result = unary();
      while (isOp("*") || isOp("/")) {
        const op = tokens[pos++].value;
        const right = unary().value;
        if (op === "/" && right === 0) throw new Error("Can't divide by 0");
        result = { value: op === "*" ? result.value * right : result.value / right, percent: false };
      }
      return result;
    }

    function unary() {
      if (isOp("-")) { pos++; const r = unary(); return { value: -r.value, percent: r.percent }; }
      if (isOp("+")) { pos++; return unary(); }
      return postfix();
    }

    function postfix() {
      let result = primary();
      while (isOp("%")) {
        pos++;
        result = { value: result.value / 100, percent: true };
      }
      return result;
    }

    function primary() {
      const tok = peek();
      if (!tok) throw new Error("Incomplete expression");
      if (tok.type === "num") { pos++; return { value: tok.value, percent: false }; }
      if (isOp("(")) {
        pos++;
        const inner = expression();
        if (!isOp(")")) throw new Error("Missing )");
        pos++;
        return inner;
      }
      throw new Error("Unexpected " + tok.value);
    }

    const result = expression();
    if (pos < tokens.length) throw new Error("Unexpected " + tokens[pos].value);
    return result.value;
  }

  // Rounds away floating-point noise (0.1 + 0.2 -> 0.3).
  function round(value) {
    if (!isFinite(value)) throw new Error("Number too large");
    return Number(value.toPrecision(12));
  }

  function evaluate(input) {
    const tokens = tokenize(input);
    if (tokens.length === 0) return 0;
    return round(parse(tokens));
  }

  function format(value) {
    const abs = Math.abs(value);
    if (abs !== 0 && (abs >= 1e15 || abs < 1e-9)) return value.toExponential(6).replace(/\.?0+e/, "e");
    return String(value);
  }

  const api = { tokenize, evaluate, format };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Calc = api;
})(this);
