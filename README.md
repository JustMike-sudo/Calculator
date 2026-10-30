# Neumorphic Calculator

A soft-UI calculator built with plain HTML, CSS and JavaScript — no frameworks, no build step.

**Live demo:** https://justmike-sudo.github.io/Calculator/

## Features

- **Safe expression engine.** A hand-written recursive-descent parser ([`calculator.js`](calculator.js)) replaces `eval()`, so only numbers and maths operators are ever evaluated.
- **Correct operator precedence and brackets.** `2 + 3 × 4 = 14`, `(2 + 3) × 4 = 20`.
- **Phone-style percent.** `200 + 10% = 220`, `200 × 10% = 20`, `50% = 0.5`.
- **No floating-point noise.** `0.1 + 0.2` shows `0.3`, not `0.30000000000000004`.
- **Live preview** of the answer while you type, plus clear error messages (e.g. "Can't divide by 0").
- **History panel.** Your last 20 calculations are saved in the browser; tap one to reuse its result.
- **Keyboard support.** Digits, `+ - * / % ( )`, `Enter` or `=` to calculate, `Backspace` to delete, `Esc` to clear.
- **Light and dark themes.** Follows your system setting, with a toggle that remembers your choice.
- **Accessible.** Labelled buttons, visible focus rings, a live region for results, and reduced-motion support.
- **Responsive.** Works on phones down to 320px wide.

## Run it

Open `index.html` in any browser. That's it.

## Tests

The engine has unit tests that use Node's built-in test runner (Node 18+):

```bash
node --test
```

## Project structure

```
index.html        Markup for the calculator
style.css         Neumorphic styles and light/dark themes
calculator.js     Tokenizer + parser (pure, no DOM; also loadable from Node)
script.js         UI: input handling, keyboard, history, theme
tests/            Unit tests for calculator.js
```

## How the parser works

The input is first split into tokens (numbers, operators, brackets), then parsed with this grammar:

```
expression := term (("+" | "-") term)*
term       := unary (("*" | "/") unary)*
unary      := ("+" | "-") unary | postfix
postfix    := primary "%"*
primary    := number | "(" expression ")"
```

Each grammar rule is one function, so precedence falls out naturally: `term` binds tighter than `expression`, so `*` and `/` are applied before `+` and `-`.
