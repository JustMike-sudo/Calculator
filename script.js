// UI layer — all maths lives in calculator.js (window.Calc).
(function () {
  "use strict";

  const OPERATORS = "+-*/";
  const SYMBOLS = { "*": "×", "/": "÷", "-": "−" };
  const HISTORY_LIMIT = 20;

  const expressionEl = document.getElementById("expression");
  const previewEl = document.getElementById("preview");
  const historyEl = document.getElementById("history");
  const historyList = document.getElementById("historyList");
  const historyEmpty = document.getElementById("historyEmpty");
  const historyToggle = document.getElementById("historyToggle");

  let expr = "";
  let justEvaluated = false;
  let history = load("calc-history", []);

  // localStorage can be unavailable (private mode, blocked storage).
  function load(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  }
  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
  }

  const pretty = (s) => s.replace(/[*/-]/g, (c) => SYMBOLS[c]);
  const lastChar = () => expr.slice(-1);
  const currentNumber = () => (expr.match(/[0-9.]*$/) || [""])[0];

  function input(key) {
    if (justEvaluated) {
      // Typing a number after "=" starts fresh; an operator continues from the result.
      if (/[0-9.(]/.test(key)) expr = "";
      justEvaluated = false;
    }

    if (/[0-9]/.test(key)) {
      if (currentNumber() === "0") expr = expr.slice(0, -1);
      if (lastChar() === ")" || lastChar() === "%") expr += "*";
      expr += key;
    } else if (key === ".") {
      if (currentNumber().includes(".")) return;
      if (lastChar() === ")" || lastChar() === "%") expr += "*";
      if (!/[0-9]/.test(lastChar())) expr += "0";
      expr += ".";
    } else if (OPERATORS.includes(key)) {
      if (expr === "" && key !== "-") expr = "0";
      // Replace a trailing operator rather than stacking them ("5+*" -> "5*"),
      // but allow a negative sign after × or ÷ ("5*-2").
      if (OPERATORS.includes(lastChar())) {
        if (key === "-" && "*/".includes(lastChar())) { expr += key; render(); return; }
        expr = expr.replace(/[+\-*/]+$/, "");
        if (expr === "") expr = key === "-" ? "" : "0";
      }
      if (lastChar() === "(" && key !== "-") return;
      expr += key;
    } else if (key === "%") {
      if (/[0-9)]/.test(lastChar())) expr += "%";
    } else if (key === "(") {
      if (/[0-9)%]/.test(lastChar())) expr += "*";
      expr += "(";
    } else if (key === ")") {
      const open = (expr.match(/\(/g) || []).length;
      const close = (expr.match(/\)/g) || []).length;
      if (open > close && /[0-9)%]/.test(lastChar())) expr += ")";
    }
    render();
  }

  function backspace() {
    justEvaluated = false;
    expr = expr.slice(0, -1);
    render();
  }

  function clearAll() {
    expr = "";
    justEvaluated = false;
    render();
  }

  // Auto-closes open brackets so "(2+3" still evaluates.
  function closed(s) {
    const missing = (s.match(/\(/g) || []).length - (s.match(/\)/g) || []).length;
    return s + ")".repeat(Math.max(0, missing));
  }

  function equals() {
    if (expr === "" || justEvaluated) return;
    try {
      const value = Calc.evaluate(closed(expr));
      const result = pretty(Calc.format(value));
      addHistory(pretty(closed(expr)), result, value);
      expr = String(value);
      justEvaluated = true;
      render();
      previewEl.textContent = "";
    } catch (err) {
      flashError(err.message);
    }
  }

  function flashError(message) {
    previewEl.textContent = message;
    previewEl.classList.add("error");
    expressionEl.classList.remove("shake");
    void expressionEl.offsetWidth; // restart the animation
    expressionEl.classList.add("shake");
  }

  function render() {
    expressionEl.textContent = expr === "" ? "0" : pretty(expr);
    expressionEl.classList.toggle("result", justEvaluated);
    expressionEl.classList.toggle("long", expr.length > 12);
    expressionEl.scrollLeft = expressionEl.scrollWidth;
    previewEl.classList.remove("error");

    // Live preview of the answer while typing.
    previewEl.textContent = "";
    if (!justEvaluated && /[+\-*/%(]/.test(expr)) {
      try { previewEl.textContent = "= " + pretty(Calc.format(Calc.evaluate(closed(expr)))); } catch { /* incomplete */ }
    }
  }

  // ---------- History ----------
  function addHistory(expression, result, value) {
    history.unshift({ expression, result, value });
    history = history.slice(0, HISTORY_LIMIT);
    save("calc-history", history);
    renderHistory();
  }

  function renderHistory() {
    historyList.replaceChildren(...history.map((item) => {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.className = "history-item";
      btn.title = "Use this result";
      const e = document.createElement("span");
      e.className = "h-expr";
      e.textContent = item.expression;
      const r = document.createElement("span");
      r.className = "h-result";
      r.textContent = "= " + item.result;
      btn.append(e, r);
      btn.addEventListener("click", () => {
        expr = String(item.value);
        justEvaluated = true;
        render();
      });
      li.append(btn);
      return li;
    }));
    historyEmpty.hidden = history.length > 0;
  }

  historyToggle.addEventListener("click", () => {
    const open = historyEl.hidden;
    historyEl.hidden = !open;
    historyToggle.setAttribute("aria-expanded", String(open));
  });
  document.getElementById("clearHistory").addEventListener("click", () => {
    history = [];
    save("calc-history", history);
    renderHistory();
  });

  // ---------- Theme ----------
  const themeToggle = document.getElementById("themeToggle");
  const savedTheme = load("calc-theme", null);
  if (savedTheme) document.documentElement.dataset.theme = savedTheme;
  themeToggle.addEventListener("click", () => {
    const isDark = document.documentElement.dataset.theme === "dark" ||
      (!document.documentElement.dataset.theme && matchMedia("(prefers-color-scheme: dark)").matches);
    const next = isDark ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    save("calc-theme", next);
  });

  // ---------- Input wiring ----------
  document.querySelector(".keys").addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    if (btn.dataset.key) input(btn.dataset.key);
    else if (btn.dataset.action === "clear") clearAll();
    else if (btn.dataset.action === "delete") backspace();
    else if (btn.dataset.action === "equals") equals();
  });

  const KEY_ALIASES = { x: "*", X: "*", "×": "*", "÷": "/", ",": "." };
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const key = KEY_ALIASES[e.key] || e.key;
    let target = null;
    if (/^[0-9.+\-*/%()]$/.test(key)) { input(key); target = `[data-key="${key}"]`; }
    else if (key === "Enter" || key === "=") { equals(); target = '[data-action="equals"]'; }
    else if (key === "Backspace") { backspace(); target = '[data-action="delete"]'; }
    else if (key === "Escape" || key === "Delete") { clearAll(); target = '[data-action="clear"]'; }
    else return;
    e.preventDefault();
    // Briefly show the matching on-screen key as pressed.
    const btn = document.querySelector(target);
    if (btn) { btn.classList.add("pressed"); setTimeout(() => btn.classList.remove("pressed"), 120); }
  });

  render();
  renderHistory();
})();
