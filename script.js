/* Suggested monthly interest (%) by term */
const suggested = { 0:0, 3:1.5, 6:2, 9:2.5, 12:3, 24:4 };

/* Elements */
const priceEl = document.getElementById('price');
const termEl = document.getElementById('term');
const interestTypeEl = document.getElementById('interestType');
const customToggleEl = document.getElementById('customToggle');
const customInterestEl = document.getElementById('customInterest');

const downToggleEl = document.getElementById('downToggle');
const downPaymentEl = document.getElementById('downPayment');

const calcBtn = document.getElementById('calcBtn');
const clearBtn = document.getElementById('clearBtn');
const breakdownTbody = document.querySelector('#breakdown tbody');
const toast = document.getElementById('toast');
const summaryCard = document.getElementById('summaryCard');
const principalVal = document.getElementById('principalVal');
const monthlyVal = document.getElementById('monthlyVal');

const matrixBtn = document.getElementById('matrixBtn');
const matrixModal = document.getElementById('matrixModal');
const closeMatrix = document.getElementById('closeMatrix');

/* Init states */
customInterestEl.disabled = true;
downPaymentEl.disabled = true;

/* Auto rate */
function updateAutoRate(){
  if (!customToggleEl.checked){
    const t = parseInt(termEl.value,10);
    customInterestEl.value = suggested[t].toFixed(2);
  }
}
termEl.addEventListener('change', updateAutoRate);
updateAutoRate();

/* Toggle custom interest */
customToggleEl.addEventListener('change', () => {
  customInterestEl.disabled = !customToggleEl.checked;
  if (!customToggleEl.checked) updateAutoRate();
});

/* Toggle downpayment */
downToggleEl.addEventListener('change', () => {
  downPaymentEl.disabled = !downToggleEl.checked;
  if (!downToggleEl.checked) downPaymentEl.value = '';
});

/* Toast */
function showToast(msg){
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(()=> toast.classList.remove('show'), 2400);
}

/* Format currency */
function toPHP(n){
  return Number(n).toLocaleString('en-PH', { style:'currency', currency:'PHP' });
}

/* Build table row */
function row(i,begBal,interestAmt,paymentAmt,endBal){
  return `<tr>
    <td>${i}</td>
    <td>${toPHP(begBal)}</td>
    <td>${toPHP(interestAmt)}</td>
    <td>${toPHP(paymentAmt)}</td>
    <td>${toPHP(endBal)}</td>
  </tr>`;
}

/* Calculate */
calcBtn.addEventListener('click', () => {
  let originalPrice = parseFloat(priceEl.value);
  if (isNaN(originalPrice) || originalPrice <= 0){
    alert('Enter a valid item price');
    return;
  }

  const term = parseInt(termEl.value,10);
  const interestType = interestTypeEl.value;

  /* Downpayment */
  let downAmt = 0;
  if (downToggleEl.checked){
    downAmt = parseFloat(downPaymentEl.value);
    if (isNaN(downAmt) || downAmt < 0){
      alert('Enter a valid downpayment');
      return;
    }
    if (downAmt >= originalPrice){
      alert('Downpayment must be less than item price');
      return;
    }
  }

  /* Determine interest rate */
  let ratePct;
  if (customToggleEl.checked){
    ratePct = parseFloat(customInterestEl.value);
    if (isNaN(ratePct) || ratePct < 0){
      alert('Enter a valid custom interest %');
      return;
    }
  } else {
    ratePct = suggested[term];
  }

  const r = ratePct / 100;
  const principal = originalPrice - downAmt;

  breakdownTbody.innerHTML = '';
  let monthlyPayment = 0;
  let totalInterest = 0;

  /* FULL PAYMENT OPTION — TERM = 0 */
  if (term === 0){
  breakdownTbody.insertAdjacentHTML(
    'beforeend',
    row(1, principal, 0, principal, 0)
  );

  monthlyPayment = principal;

  summaryCard.classList.remove('hidden');
  principalVal.textContent = toPHP(principal);
  monthlyVal.textContent = toPHP(principal);

  showToast('Calculation done');
  return;
}

  /* SIMPLE (ADD-ON) */
  if (interestType === 'simple'){
  totalInterest = principal * r * term;
  monthlyPayment = (principal + totalInterest) / term;

  const monthlyPrincipal = principal / term;
  const monthlyInterest = totalInterest / term;

  let payments = Array(term).fill(monthlyPayment);

  let remainingDown = downAmt;

  for (let i = term - 1; i >= 0; i--) {
    if (remainingDown <= 0) break;

    const deduction = Math.min(payments[i], remainingDown);
    payments[i] -= deduction;
    remainingDown -= deduction;
  }

  for (let i = 1; i <= term; i++) {
    const beginning =
      +(principal - monthlyPrincipal * (i - 1));

    const endBal =
      +(principal - monthlyPrincipal * i).toFixed(2);

    breakdownTbody.insertAdjacentHTML(
      'beforeend',
      row(
        i,
        beginning,
        monthlyInterest,
        payments[i - 1],
        Math.max(endBal, 0)
      )
    );
  }
}

  /* AMORTIZED */
  } else if (interestType === 'amortized'){
    monthlyPayment = r===0 ? principal/term : (principal*r)/(1-Math.pow(1+r,-term));
    let remaining = principal;
    for (let i=1;i<=term;i++){
      const interest = +(remaining * r);
      const principalPaid = +(monthlyPayment - interest);
      const endBal = +(remaining - principalPaid);
      breakdownTbody.insertAdjacentHTML('beforeend',
        row(i, remaining, interest, payments[i - 1], Math.max(endBal,0))
      );
      remaining = endBal;
      totalInterest += interest;
    }

  /* FIXED */
  } else if (interestType === 'fixed'){
    const interestAmt = principal * r;
    const monthlyPrincipal = principal / term;
    monthlyPayment = monthlyPrincipal + interestAmt;
    let payments = Array(term).fill(monthlyPayment);

let remainingDown = downAmt;

for (let i = term - 1; i >= 0; i--) {
  if (remainingDown <= 0) break;

  const deduction =
    Math.min(payments[i], remainingDown);

  payments[i] -= deduction;
  remainingDown -= deduction;
    totalInterest = interestAmt * term;
    let balRem = principal;

    for (let i=1;i<=term;i++){
      const beginning = balRem;
      balRem -= monthlyPrincipal;
      breakdownTbody.insertAdjacentHTML('beforeend',
        row(i, beginning, interestAmt, payments[i - 1], Math.max(balRem,0))
      );
    }

  /* COMPOUND */
  } else if (interestType === 'compound'){
    let bal = principal;
    monthlyPayment = principal / term;
    let payments = Array(term).fill(monthlyPayment);

let remainingDown = downAmt;

for (let i = term - 1; i >= 0; i--) {
  if (remainingDown <= 0) break;

  const deduction =
    Math.min(payments[i], remainingDown);

  payments[i] -= deduction;
  remainingDown -= deduction;
}

    for (let i=1;i<=term;i++){
      const interest = +(bal * r);
      const principalPaid = monthlyPayment;
      const endBal = +(bal + interest - principalPaid);

      breakdownTbody.insertAdjacentHTML('beforeend',
        row(i, bal, interest, payments[i - 1], Math.max(endBal,0))
      );

      totalInterest += interest;
      bal = endBal;
    }
  }

  /* SUMMARY OUTPUT */
  summaryCard.classList.remove('hidden');

principalVal.textContent = toPHP(principal);
monthlyVal.textContent = toPHP(monthlyPayment);

showToast('Calculation done');
});

/* CLEAR */
summaryCard.classList.add('hidden');

principalVal.textContent = '—';
monthlyVal.textContent = '—';
});

/* MATRIX MODAL */
matrixBtn.addEventListener('click', ()=> {
  matrixModal.classList.add('active');
});
closeMatrix.addEventListener('click', ()=> {
  matrixModal.classList.remove('active');
});
matrixModal.addEventListener('click', (e) => {
  if (e.target === matrixModal) matrixModal.classList.remove('active');
});