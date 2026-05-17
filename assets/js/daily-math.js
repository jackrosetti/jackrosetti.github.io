(() => {
  const DAY_MS = 24 * 60 * 60 * 1000;
  const EPOCH = Date.UTC(2026, 0, 1);

  document.addEventListener("DOMContentLoaded", initDailyMath);

  function initDailyMath() {
    const root = document.querySelector("[data-daily-math]");

    if (!root) {
      return;
    }

    const integrals = buildIntegralBank();
    const diffEqs = buildDiffEqBank();
    const dayNumber = Math.floor((startOfToday() - EPOCH) / DAY_MS);
    const integralIndex = positiveMod(dayNumber, integrals.length);
    const diffEqIndex = positiveMod(dayNumber * 7 + 11, diffEqs.length);

    root.querySelector("[data-math-date]").textContent = new Intl.DateTimeFormat(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(new Date());
    root.querySelector("[data-bank-counts]").textContent = `${integrals.length} integrals / ${diffEqs.length} differential equations`;

    wireCard(root, "integral", integrals, integralIndex);
    wireCard(root, "diffeq", diffEqs, diffEqIndex);
    typesetMath(root);
  }

  function wireCard(root, type, bank, dailyIndex) {
    const card = root.querySelector(`[data-problem-card="${type}"]`);
    const toggle = card.querySelector("[data-solution-toggle]");
    const random = card.querySelector("[data-random-problem]");
    let activeIndex = dailyIndex;

    renderProblem(card, bank, activeIndex);

    toggle.addEventListener("click", () => {
      const solution = card.querySelector("[data-problem-solution]");
      const isHidden = solution.hidden;
      solution.hidden = !isHidden;
      toggle.textContent = isHidden ? "Hide solution" : "Show solution";
      toggle.setAttribute("aria-expanded", String(isHidden));
      typesetMath(card);
    });

    random.addEventListener("click", () => {
      activeIndex = Math.floor(Math.random() * bank.length);
      renderProblem(card, bank, activeIndex);
      typesetMath(card);
    });
  }

  function renderProblem(card, bank, index) {
    const problem = bank[index];
    const solution = card.querySelector("[data-problem-solution]");
    const toggle = card.querySelector("[data-solution-toggle]");

    card.querySelector("[data-problem-index]").textContent = `#${index + 1} of ${bank.length}`;
    card.querySelector("[data-problem-topic]").textContent = problem.topic;
    card.querySelector("[data-problem-prompt]").textContent = displayMath(problem.prompt);
    card.querySelector("[data-problem-method]").textContent = problem.method;
    card.querySelector("[data-problem-answer]").textContent = displayMath(problem.solution);

    solution.hidden = true;
    toggle.textContent = "Show solution";
    toggle.setAttribute("aria-expanded", "false");
  }

  function buildIntegralBank() {
    const bank = [];

    addMany(bank, 50, (i) => {
      const a = (i % 5) + 1;
      const b = Math.floor(i / 5) + 1;
      return {
        topic: "Exponential-trig",
        prompt: `\\int e^{${a}x}\\sin(${b}x)\\,dx`,
        method: "Integrate by parts twice, or solve for the original integral.",
        solution: `\\int e^{${a}x}\\sin(${b}x)\\,dx=\\frac{e^{${a}x}\\left(${a}\\sin(${b}x)-${b}\\cos(${b}x)\\right)}{${a * a + b * b}}+C`,
      };
    });

    addMany(bank, 50, (i) => {
      const a = (i % 5) + 1;
      const b = Math.floor(i / 5) + 1;
      return {
        topic: "Exponential-trig",
        prompt: `\\int e^{${a}x}\\cos(${b}x)\\,dx`,
        method: "Integrate by parts twice, or use the complex exponential shortcut.",
        solution: `\\int e^{${a}x}\\cos(${b}x)\\,dx=\\frac{e^{${a}x}\\left(${a}\\cos(${b}x)+${b}\\sin(${b}x)\\right)}{${a * a + b * b}}+C`,
      };
    });

    addMany(bank, 50, (i) => {
      const a = (i % 10) + 1;
      const c = Math.floor(i / 10) + 1;
      return {
        topic: "Repeated parts",
        prompt: `\\int ${coeff(c, `x^2e^{${a}x}`)}\\,dx`,
        method: "Use integration by parts twice.",
        solution: `\\int ${coeff(c, `x^2e^{${a}x}`)}\\,dx=${coeff(c, `e^{${a}x}`)}\\left(${frac(1, a)}x^2-${frac(2, a * a)}x+${frac(2, a * a * a)}\\right)+C`,
      };
    });

    addMany(bank, 50, (i) => {
      const a = (i % 5) + 1;
      const b = Math.floor(i / 5) + 1;
      const u = linear(a, b);
      return {
        topic: "Logarithmic parts",
        prompt: `\\int x\\ln(${u})\\,dx`,
        method: `Let u=${u}, or integrate by parts with dv=x\\,dx.`,
        solution: `\\int x\\ln(${u})\\,dx=${frac(1, a * a)}\\left(\\frac{(${u})^2}{2}\\ln(${u})-\\frac{(${u})^2}{4}-${b}\\left((${u})\\ln(${u})-(${u})\\right)\\right)+C`,
      };
    });

    addMany(bank, 50, (i) => {
      const p = (i % 10) + 1;
      const q = p + (Math.floor(i / 10) % 5) + 1;
      const a = (Math.floor(i / 5) % 5) + 1;
      const b = (Math.floor(i / 25) % 2) + 2;
      const numerator = `${a + b}x+${a * q + b * p}`;
      return {
        topic: "Partial fractions",
        prompt: `\\int \\frac{${numerator}}{(x+${p})(x+${q})}\\,dx`,
        method: `Decompose as \\frac{${a}}{x+${p}}+\\frac{${b}}{x+${q}}.`,
        solution: `\\int \\frac{${numerator}}{(x+${p})(x+${q})}\\,dx=${a}\\ln|x+${p}|+${b}\\ln|x+${q}|+C`,
      };
    });

    addMany(bank, 50, (i) => {
      const a = (i % 10) + 1;
      const m = (Math.floor(i / 10) % 5) + 1;
      const n = (Math.floor(i / 5) % 5) + 1;
      return {
        topic: "Log + arctan split",
        prompt: `\\int \\frac{${m}x+${n}}{x^2+${a * a}}\\,dx`,
        method: "Split the numerator into a derivative-of-denominator part and an arctangent part.",
        solution: `\\int \\frac{${m}x+${n}}{x^2+${a * a}}\\,dx=${frac(m, 2)}\\ln(x^2+${a * a})+${frac(n, a)}\\arctan\\left(\\frac{x}{${a}}\\right)+C`,
      };
    });

    addMany(bank, 50, (i) => {
      const a = (i % 10) + 2;
      const c = Math.floor(i / 10) + 1;
      return {
        topic: "Trig substitution",
        prompt: `\\int ${coeff(c, `\\sqrt{${a * a}-x^2}`)}\\,dx`,
        method: `Use x=${a}\\sin\\theta, or recall the circular-segment antiderivative.`,
        solution: `\\int ${coeff(c, `\\sqrt{${a * a}-x^2}`)}\\,dx=${c}\\left(\\frac{x}{2}\\sqrt{${a * a}-x^2}+\\frac{${a * a}}{2}\\arcsin\\left(\\frac{x}{${a}}\\right)\\right)+C`,
      };
    });

    addMany(bank, 50, (i) => {
      const a = (i % 10) + 2;
      const c = Math.floor(i / 10) + 1;
      return {
        topic: "Trig substitution",
        prompt: `\\int \\frac{${coeff(c, "x^2")}}{\\sqrt{${a * a}-x^2}}\\,dx`,
        method: `Use x=${a}\\sin\\theta and convert back.`,
        solution: `\\int \\frac{${coeff(c, "x^2")}}{\\sqrt{${a * a}-x^2}}\\,dx=${c}\\left(\\frac{${a * a}}{2}\\arcsin\\left(\\frac{x}{${a}}\\right)-\\frac{x}{2}\\sqrt{${a * a}-x^2}\\right)+C`,
      };
    });

    addMany(bank, 50, (i) => {
      const a = (i % 10) + 1;
      const c = Math.floor(i / 10) + 1;
      return {
        topic: "Reduction formula",
        prompt: `\\int ${coeff(c, `\\sec^3(${a}x)`)}\\,dx`,
        method: "Use the standard secant reduction or integrate by parts.",
        solution: `\\int ${coeff(c, `\\sec^3(${a}x)`)}\\,dx=${frac(c, 2 * a)}\\left(\\sec(${a}x)\\tan(${a}x)+\\ln|\\sec(${a}x)+\\tan(${a}x)|\\right)+C`,
      };
    });

    addMany(bank, 50, (i) => {
      const a = (i % 10) + 1;
      const c = Math.floor(i / 10) + 1;
      return {
        topic: "Inverse trig parts",
        prompt: `\\int ${coeff(c, `x\\arctan(${a}x)`)}\\,dx`,
        method: "Use integration by parts with u=arctan(ax).",
        solution: `\\int ${coeff(c, `x\\arctan(${a}x)`)}\\,dx=${c}\\left(\\left(\\frac{x^2}{2}+${frac(1, 2 * a * a)}\\right)\\arctan(${a}x)-${frac(1, 2 * a)}x\\right)+C`,
      };
    });

    return bank;
  }

  function buildDiffEqBank() {
    const bank = [];

    addMany(bank, 50, (i) => {
      const a = (i % 5) + 1;
      const c = (Math.floor(i / 5) % 5) + 6;
      const b = Math.floor(i / 25) + 1;
      return {
        topic: "Bernoulli",
        prompt: `\\frac{dy}{dx}+${a}y=${b}e^{${c}x}y^2`,
        method: "Set v=y^{-1}, which turns it into a linear equation.",
        solution: `y=\\frac{1}{Ce^{${a}x}${signedCoeffTerm(-b, c - a, `e^{${c}x}`)}}`,
      };
    });

    addMany(bank, 50, (i) => {
      const a = (i % 5) + 1;
      const m = a + (Math.floor(i / 5) % 5) + 1;
      const b = Math.floor(i / 25) + 1;
      return {
        topic: "Bernoulli-Cauchy",
        prompt: `\\frac{dy}{dx}+\\frac{${a}}{x}y=${coeff(b, xPow(m))}y^2,\\quad x>0`,
        method: "Set v=y^{-1}; the transformed equation has integrating factor x^{-a}.",
        solution: `y=\\frac{1}{C${xPow(a)}${signedCoeffTerm(-b, m - a + 1, xPow(m + 1))}}`,
      };
    });

    addMany(bank, 50, (i) => {
      const a = (i % 5) + 2;
      const b = (Math.floor(i / 5) % 5) + 2;
      const p = Math.floor(i / 25) + 1;
      return {
        topic: "Exact equation",
        prompt: `\\left(${coeff(a, `${xPow(a - 1)}y`)}+${coeff(p, yPow(b))}\\right)dx+\\left(${xPow(a)}+${coeff(p * b, `x${yPow(b - 1)}`)}\\right)dy=0`,
        method: `Recognize d\\left(${xPow(a)}y+${coeff(p, `x${yPow(b)}`)}\\right)=0.`,
        solution: `${xPow(a)}y+${coeff(p, `x${yPow(b)}`)}=C`,
      };
    });

    addMany(bank, 50, (i) => {
      const k = i + 1;
      return {
        topic: "Homogeneous nonlinear",
        prompt: `\\frac{dy}{dx}=\\frac{y}{x}+${k}\\left(\\frac{y}{x}\\right)^2,\\quad x>0`,
        method: "Set v=y/x, so y'=v+xv'.",
        solution: `y=-\\frac{x}{${k}\\ln x+C}`,
      };
    });

    addMany(bank, 50, (i) => {
      const a = (i % 5) + 1;
      const m = (Math.floor(i / 5) % 5) + 1;
      const n = m + (Math.floor(i / 25) % 2) + 2;
      const b = (Math.floor(i / 10) % 5) + 1;
      const c = (i % 4) + 2;
      return {
        topic: "Linear Cauchy",
        prompt: `\\frac{dy}{dx}+\\frac{${a}}{x}y=${coeff(b, xPow(m))}+${coeff(c, xPow(n))},\\quad x>0`,
        method: `Use integrating factor x^{${a}}.`,
        solution: `y=${frac(b, m + a + 1)}${xPow(m + 1)}+${frac(c, n + a + 1)}${xPow(n + 1)}+C${xPow(-a)}`,
      };
    });

    addMany(bank, 50, (i) => {
      const r1 = (i % 10) + 1;
      const r2 = r1 + (Math.floor(i / 10) % 5) + 1;
      const alpha = 1 - r1 - r2;
      const beta = r1 * r2;
      return {
        topic: "Cauchy-Euler",
        prompt: `x^2y''${signedCoeffTerm(alpha, 1, "xy'")}${signedCoeffTerm(beta, 1, "y")}=0`,
        method: "Try y=x^r and solve the indicial equation.",
        solution: `y=C_1${xPow(r1)}+C_2${xPow(r2)}`,
      };
    });

    addMany(bank, 50, (i) => {
      const u = (i % 5) + 1;
      const v = u + (Math.floor(i / 5) % 5) + 1;
      const c = Math.floor(i / 25) + 1;
      return {
        topic: "Forced second order",
        prompt: `y''+${u + v}y'+${u * v}y=e^{${c}x}`,
        method: "Solve the characteristic equation, then try A e^{cx}.",
        solution: `y=C_1e^{-${u}x}+C_2e^{-${v}x}+${frac(1, (c + u) * (c + v))}e^{${c}x}`,
      };
    });

    addMany(bank, 50, (i) => {
      const a = (Math.floor(i / 25) % 2) + 1;
      const w = (Math.floor(i / 5) % 10) + 2;
      const k = w + (i % 5) + 1;
      return {
        topic: "Forced oscillator",
        prompt: `y''+${w * w}y=${a}\\sin(${k}x)`,
        method: "Use undetermined coefficients; k is not resonant.",
        solution: `y=C_1\\cos(${w}x)+C_2\\sin(${w}x)${signedCoeffTerm(a, w * w - k * k, `\\sin(${k}x)`)}`,
      };
    });

    addMany(bank, 50, (i) => {
      const p = (i % 10) + 1;
      const q = p + (Math.floor(i / 10) % 5) + 1;
      const a = (Math.floor(i / 5) % 5) + 1;
      return {
        topic: "Nonlinear separable",
        prompt: `\\frac{dy}{dx}=${a}(y-${p})(y-${q})`,
        method: "Separate and use partial fractions.",
        solution: `\\frac{y-${p}}{y-${q}}=Ce^{${a * (p - q)}x}`,
      };
    });

    addMany(bank, 50, (i) => {
      const r1 = (i % 5) + 1;
      const r2 = r1 + (Math.floor(i / 5) % 5) + 1;
      const alpha = 1 - r1 - r2;
      const beta = r1 * r2;
      const m = r2 + (Math.floor(i / 25) % 2) + 1;
      const b = (Math.floor(i / 10) % 5) + 1;
      return {
        topic: "Forced Cauchy-Euler",
        prompt: `x^2y''${signedCoeffTerm(alpha, 1, "xy'")}${signedCoeffTerm(beta, 1, "y")}=${coeff(b, xPow(m))}`,
        method: "Use y=x^r for the homogeneous part and try A x^m for the forcing term.",
        solution: `y=C_1${xPow(r1)}+C_2${xPow(r2)}${signedCoeffTerm(b, (m - r1) * (m - r2), xPow(m))}`,
      };
    });

    return bank;
  }

  function addMany(bank, count, createProblem) {
    for (let index = 0; index < count; index += 1) {
      bank.push(createProblem(index));
    }
  }

  function startOfToday() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  }

  function positiveMod(value, divisor) {
    return ((value % divisor) + divisor) % divisor;
  }

  function displayMath(tex) {
    return `\\[${tex}\\]`;
  }

  function typesetMath(root) {
    if (window.MathJax && typeof window.MathJax.typesetPromise === "function") {
      window.MathJax.typesetPromise([root]).catch(() => {});
    }
  }

  function linear(a, b) {
    const xTerm = a === 1 ? "x" : `${a}x`;
    return b ? `${xTerm}+${b}` : xTerm;
  }

  function xPow(n) {
    return n === 1 ? "x" : `x^{${n}}`;
  }

  function yPow(n) {
    return n === 1 ? "y" : `y^{${n}}`;
  }

  function coeff(c, expression) {
    return c === 1 ? expression : `${c}${expression}`;
  }

  function signedCoeffTerm(numerator, denominator, expression) {
    if (numerator === 0) {
      return "";
    }

    const isNegative = numerator * denominator < 0;
    const magnitude = frac(Math.abs(numerator), Math.abs(denominator));
    const term = magnitude === "1" ? expression : `${magnitude}${expression}`;

    return `${isNegative ? "-" : "+"}${term}`;
  }

  function frac(numerator, denominator) {
    const sign = numerator * denominator < 0 ? "-" : "";
    let top = Math.abs(numerator);
    let bottom = Math.abs(denominator);
    const factor = gcd(top, bottom);
    top /= factor;
    bottom /= factor;

    if (bottom === 1) {
      return `${sign}${top}`;
    }

    return `${sign}\\frac{${top}}{${bottom}}`;
  }

  function gcd(a, b) {
    let left = a;
    let right = b;

    while (right !== 0) {
      const next = left % right;
      left = right;
      right = next;
    }

    return left || 1;
  }
})();
