let result = document.getElementById("result");

function appendValue(val) {
  if (result.innerText === "0") {
    result.innerText = val;
  } else {
    result.innerText += val;
  }
}

function clearDisplay() {
  result.innerText = "0";
}

function deleteLast() {
  if (result.innerText.length === 1) {
    result.innerText = "0";
  } else {
    result.innerText = result.innerText.slice(0, -1);
  }
}

function calculate() {
  try {
    result.innerText = eval(result.innerText);
  } catch {
    result.innerText = "Error";
  }
}
