const priceEl = document.getElementById('price');
const termEl = document.getElementById('term');
const interestTypeEl = document.getElementById('interestType');
const downToggleEl = document.getElementById('downToggle');
const downPaymentEl = document.getElementById('downPayment');
const calcBtn = document.getElementById('calcBtn');
const summaryCard = document.getElementById('summaryCard');
const principalVal = document.getElementById('principalVal');
const monthlyVal = document.getElementById('monthlyVal');
const breakdownTbody = document.querySelector('#breakdown tbody');

downToggleEl.addEventListener('change', () => downPaymentEl.disabled = !downToggleEl.checked);

function toPHP(n) { return Number(n).toLocaleString('en-PH', { style:'currency', currency:'PHP' }); }

calcBtn.addEventListener('click', () => {
  let price = parseFloat(priceEl.value);
  let down = downToggleEl.checked ? parseFloat(downPaymentEl.value) || 0 : 0;
  let term = parseInt(termEl.value);
  let principal = price - down;

  if (principal <= 0) return alert("Invalid amount");

  breakdownTbody.innerHTML = '';
  let monthly = 0;
  let r = 0.02; // Default 2% monthly rate

  if (term === 0) {
    monthly = principal;
    breakdownTbody.insertAdjacentHTML('beforeend', `<tr><td>1</td><td>${toPHP(principal)}</td><td>0</td><td>${toPHP(principal)}</td><td>0</td></tr>`);
  } else if (interestTypeEl.value === 'simple') {
    let totalInterest = principal * r * term;
    monthly = (principal + totalInterest) / term;
    let bal = principal;
    for (let i = 1; i <= term; i++) {
      let prinPart = principal / term;
      let intPart = totalInterest / term;
      let oldBal = bal;
      bal -= prinPart;
      breakdownTbody.insertAdjacentHTML('beforeend', `<tr><td>${i}</td><td>${toPHP(oldBal)}</td><td>${toPHP(intPart)}</td><td>${toPHP(prinPart)}</td><td>${toPHP(Math.max(bal, 0))}</td></tr>`);
    }
  } else {
    // Amortized
    monthly = (principal * r) / (1 - Math.pow(1 + r, -term));
    let bal = principal;
    for (let i = 1; i <= term; i++) {
      let intPart = bal * r;
      let prinPart = monthly - intPart;
      let oldBal = bal;
      bal -= prinPart;
      breakdownTbody.insertAdjacentHTML('beforeend', `<tr><td>${i}</td><td>${toPHP(oldBal)}</td><td>${toPHP(intPart)}</td><td>${toPHP(prinPart)}</td><td>${toPHP(Math.max(bal, 0))}</td></tr>`);
    }
  }

  summaryCard.classList.remove('hidden');
  principalVal.textContent = toPHP(principal);
  monthlyVal.textContent = toPHP(monthly);
});
