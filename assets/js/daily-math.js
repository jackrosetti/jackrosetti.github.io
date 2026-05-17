(() => {
  const DAY_MS = 24 * 60 * 60 * 1000;
  const EPOCH = Date.UTC(2026, 0, 1);

  document.addEventListener("DOMContentLoaded", initDailyMath);

  function initDailyMath() {
    const root = document.querySelector("[data-daily-math]");

    if (!root) {
      return;
    }

    const problemTypes = [
      {
        key: "integral",
        label: "Integral",
        countLabel: "integrals",
        format: "math",
        offset: 0,
        bank: buildIntegralBank(),
      },
      {
        key: "diffeq",
        label: "Diff Eq",
        countLabel: "differential equations",
        format: "math",
        offset: 11,
        bank: buildDiffEqBank(),
      },
      {
        key: "real-analysis",
        label: "Real Analysis",
        countLabel: "real analysis proofs",
        format: "proof",
        offset: 23,
        bank: buildRealAnalysisBank(),
      },
      {
        key: "stats-proof",
        label: "Stats Proof",
        countLabel: "stats proofs",
        format: "proof",
        offset: 37,
        bank: buildStatsProofBank(),
      },
    ];
    const dayNumber = Math.floor((startOfToday() - EPOCH) / DAY_MS);
    const dailyIndexes = getDailyIndexes(problemTypes, dayNumber);

    root.querySelector("[data-math-date]").textContent = new Intl.DateTimeFormat(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(new Date());
    root.querySelector("[data-bank-counts]").textContent = problemTypes
      .map((type) => `${type.bank.length} ${type.countLabel}`)
      .join(" / ");

    wireProblemPicker(root, problemTypes, dailyIndexes);
    typesetMath(root);
  }

  function wireProblemPicker(root, problemTypes, dailyIndexes) {
    const card = root.querySelector("[data-problem-card]");
    const buttons = Array.from(root.querySelectorAll("[data-problem-type-option]"));
    const toggle = card.querySelector("[data-solution-toggle]");
    const random = card.querySelector("[data-random-problem]");
    const activeIndexes = Object.assign({}, dailyIndexes);
    let activeType = getInitialType(problemTypes);

    renderActiveProblem();

    toggle.addEventListener("click", () => {
      const solution = card.querySelector("[data-problem-solution]");
      const isHidden = solution.hidden;
      solution.hidden = !isHidden;
      toggle.textContent = isHidden ? "Hide solution" : "Show solution";
      toggle.setAttribute("aria-expanded", String(isHidden));
      typesetMath(card);
    });

    random.addEventListener("click", () => {
      activeIndexes[activeType.key] = Math.floor(Math.random() * activeType.bank.length);
      renderActiveProblem();
    });

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        const nextType = problemTypes.find((type) => type.key === button.dataset.problemTypeOption);

        if (!nextType || nextType.key === activeType.key) {
          return;
        }

        activeType = nextType;
        saveSelectedType(activeType.key);
        renderActiveProblem();
      });
    });

    function renderActiveProblem() {
      renderProblem(card, activeType, activeIndexes[activeType.key]);
      buttons.forEach((button) => {
        const isActive = button.dataset.problemTypeOption === activeType.key;
        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-selected", String(isActive));
        button.tabIndex = isActive ? 0 : -1;
      });
      typesetMath(card);
    }
  }

  function renderProblem(card, type, index) {
    const problem = type.bank[index];
    const solution = card.querySelector("[data-problem-solution]");
    const toggle = card.querySelector("[data-solution-toggle]");
    const isProof = type.format === "proof";

    card.classList.toggle("is-proof", isProof);
    card.querySelector("[data-problem-type-label]").textContent = type.label;
    card.querySelector("[data-problem-index]").textContent = `#${index + 1} of ${type.bank.length}`;
    card.querySelector("[data-problem-topic]").textContent = problem.topic;
    setProblemContent(card.querySelector("[data-problem-prompt]"), problem.prompt, isProof);
    card.querySelector("[data-problem-method]").textContent = problem.method;
    setProblemContent(card.querySelector("[data-problem-answer]"), problem.solution, isProof);

    solution.hidden = true;
    toggle.textContent = "Show solution";
    toggle.setAttribute("aria-expanded", "false");
  }

  function getDailyIndexes(problemTypes, dayNumber) {
    return problemTypes.reduce((indexes, type, typeIndex) => {
      indexes[type.key] = positiveMod(dayNumber * (typeIndex * 4 + 1) + type.offset, type.bank.length);
      return indexes;
    }, {});
  }

  function getInitialType(problemTypes) {
    const savedKey = readSelectedType();
    return problemTypes.find((type) => type.key === savedKey) || problemTypes[0];
  }

  function readSelectedType() {
    try {
      return window.localStorage.getItem("dailyMathProblemType");
    } catch (error) {
      return "";
    }
  }

  function saveSelectedType(typeKey) {
    try {
      window.localStorage.setItem("dailyMathProblemType", typeKey);
    } catch (error) {
      // The picker still works when storage is unavailable.
    }
  }

  function setProblemContent(element, content, isProof) {
    if (isProof) {
      element.innerHTML = content;
      return;
    }

    element.textContent = displayMath(content);
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

  function buildRealAnalysisBank() {
    const bank = [];

    addMany(bank, 50, (i) => {
      const k = (i % 10) + 2;
      const m = k + 7;
      const p = (Math.floor(i / 10) % 5) + 1;
      const q = (Math.floor(i / 5) % 5) + 1;
      const errorNumerator = Math.abs(m * q - k * p);
      return {
        topic: "Sequence limits",
        prompt: proofParagraphs([
          `Prove directly from the epsilon definition that \\(a_n=\\frac{${k}n+${q}}{${m}n+${p}}\\) converges to \\(${frac(k, m)}\\).`,
        ]),
        method: "Compute the exact error and choose N from that bound.",
        solution: proofParagraphs([
          `For \\(n\\ge 1\\), \\(\\left|a_n-${frac(k, m)}\\right|=\\frac{|${m}\\cdot ${q}-${k}\\cdot ${p}|}{${m}(${m}n+${p})}=\\frac{${errorNumerator}}{${m}(${m}n+${p})}\\le \\frac{${errorNumerator}}{${m * m}n}\\).`,
          `Given \\(\\epsilon\\gt 0\\), choose \\(N\\gt ${frac(errorNumerator, m * m)}\\epsilon^{-1}\\). Then \\(n\\ge N\\) implies \\(\\left|a_n-${frac(k, m)}\\right|\\lt\\epsilon\\), so \\(a_n\\to ${frac(k, m)}\\).`,
        ]),
      };
    });

    addMany(bank, 50, (i) => {
      const k = (i % 10) + 1;
      const b = (Math.floor(i / 10) % 5) + 1;
      const p = (Math.floor(i / 5) % 5) + 2;
      const c = (Math.floor(i / 25) % 2) + 1;
      return {
        topic: "Squeeze theorem",
        prompt: proofParagraphs([
          `Prove that \\(a_n=\\frac{\\cos(${k}n)+${b}(-1)^n}{n^{${p}}+${c}}\\) converges to \\(0\\).`,
        ]),
        method: "Bound the oscillating numerator and squeeze the absolute value.",
        solution: proofParagraphs([
          `For every \\(n\\), \\(|\\cos(${k}n)+${b}(-1)^n|\\le ${b + 1}\\), while \\(n^{${p}}+${c}\\ge n^{${p}}\\).`,
          `Thus \\(0\\le |a_n|\\le \\frac{${b + 1}}{n^{${p}}}\\). Since \\(\\frac{${b + 1}}{n^{${p}}}\\to 0\\), the squeeze theorem gives \\(a_n\\to 0\\).`,
        ]),
      };
    });

    addMany(bank, 50, (i) => {
      const shift = i % 10;
      const p = (Math.floor(i / 10) % 5) + 2;
      return {
        topic: "Cauchy criterion",
        prompt: proofParagraphs([
          `Let \\(s_n=\\sum_{j=1}^{n}\\frac{1}{(j+${shift})^{${p}}}\\). Prove that \\((s_n)\\) is Cauchy.`,
        ]),
        method: "Control the tail by an integral estimate.",
        solution: proofParagraphs([
          `If \\(n>m\\), then \\(|s_n-s_m|=\\sum_{j=m+1}^{n}\\frac{1}{(j+${shift})^{${p}}}\\le \\sum_{j=m+1}^{\\infty}\\frac{1}{j^{${p}}}\\).`,
          `The integral test tail bound gives \\(\\sum_{j=m+1}^{\\infty}j^{-${p}}\\le \\int_m^{\\infty}x^{-${p}}\\,dx=\\frac{1}{${p - 1}m^{${p - 1}}}\\). Choose \\(M\\) so this is below \\(\\epsilon\\) whenever \\(m\\ge M\\). Then \\((s_n)\\) is Cauchy.`,
        ]),
      };
    });

    addMany(bank, 50, (i) => {
      const a = (i % 10) + 1;
      const b = (Math.floor(i / 10) % 5) + 1;
      const c = (Math.floor(i / 5) % 5) + 1;
      const d = a * c + b;
      return {
        topic: "Epsilon-delta continuity",
        prompt: proofParagraphs([
          `Prove directly that \\(f(x)=\\frac{1}{${a}x+${b}}\\) is continuous at \\(c=${c}\\).`,
        ]),
        method: "Keep the denominator away from zero, then force the remaining factor small.",
        solution: proofParagraphs([
          `Here \\(${a}c+${b}=${d}\\). If \\(|x-c|\\lt\\delta\\le ${frac(d, 2 * a)}\\), then \\(|${a}x+${b}|\\ge ${frac(d, 2)}\\).`,
          `Also \\(\\left|f(x)-f(c)\\right|=\\frac{${a}|x-c|}{|${a}x+${b}|\\,${d}}\\le \\frac{${2 * a}}{${d * d}}|x-c|\\). Choose \\(\\delta=\\min\\left\\{${frac(d, 2 * a)},\\frac{${d * d}}{${2 * a}}\\epsilon\\right\\}\\).`,
        ]),
      };
    });

    addMany(bank, 50, (i) => {
      const m = (i % 10) + 2;
      const a = (Math.floor(i / 10) % 5) + 1;
      return {
        topic: "Uniform continuity",
        prompt: proofParagraphs([
          `Prove that \\(f(x)=x^2+${a}x\\) is uniformly continuous on \\([-${m},${m}]\\).`,
        ]),
        method: "Use the bounded interval to make one delta work everywhere.",
        solution: proofParagraphs([
          `For \\(x,y\\in[-${m},${m}]\\), \\(|f(x)-f(y)|=|x-y|\\,|x+y+${a}|\\le ${2 * m + a}|x-y|\\).`,
          `Given \\(\\epsilon\\gt 0\\), choose \\(\\delta=\\epsilon/${2 * m + a}\\). Then \\(|x-y|\\lt\\delta\\) implies \\(|f(x)-f(y)|\\lt\\epsilon\\), independent of the point, so the continuity is uniform.`,
        ]),
      };
    });

    addMany(bank, 50, (i) => {
      const k = i + 2;
      return {
        topic: "Supremum",
        prompt: proofParagraphs([
          `Let \\(A=\\{x\\in\\mathbb{R}:x\\ge 0\\text{ and }x^2\\lt ${k}\\}\\). Prove that \\(\\sup A=\\sqrt{${k}}\\).`,
        ]),
        method: "Show that the candidate is an upper bound and can be approached from below.",
        solution: proofParagraphs([
          `If \\(x\\in A\\), then \\(0\\le x\\) and \\(x^2\\lt ${k}\\), so monotonicity of the square root on \\([0,\\infty)\\) gives \\(x\\lt\\sqrt{${k}}\\). Thus \\(\\sqrt{${k}}\\) is an upper bound.`,
          `For any \\(\\epsilon\\gt 0\\), choose \\(y=\\max\\{0,\\sqrt{${k}}-\\epsilon/2\\}\\). Then \\(y\\lt\\sqrt{${k}}\\), so \\(y^2\\lt ${k}\\), hence \\(y\\in A\\), and \\(\\sqrt{${k}}-\\epsilon\\lt y\\). No smaller upper bound is possible.`,
        ]),
      };
    });

    addMany(bank, 50, (i) => {
      const a = (i % 10) + 1;
      const b = (Math.floor(i / 10) % 5) + 1;
      const c = (Math.floor(i / 5) % 5) + 1;
      return {
        topic: "Series comparison",
        prompt: proofParagraphs([
          `Prove that \\(\\sum_{n=1}^{\\infty}\\frac{${a}n+${b}}{n^3+${c}}\\) converges.`,
        ]),
        method: "Compare the positive terms to a constant multiple of \\(1/n^2\\).",
        solution: proofParagraphs([
          `For \\(n\\ge 1\\), \\(0\\le \\frac{${a}n+${b}}{n^3+${c}}\\le \\frac{${a + b}n}{n^3}=\\frac{${a + b}}{n^2}\\).`,
          `Because \\(\\sum 1/n^2\\) converges, the comparison test proves that the given series converges.`,
        ]),
      };
    });

    addMany(bank, 50, (i) => {
      const c = (i % 10) + 1;
      const r = (Math.floor(i / 10) % 5) + 1;
      return {
        topic: "Closed sets",
        prompt: proofParagraphs([
          `Prove that \\(F=\\{x\\in\\mathbb{R}:|x-${c}|\\le ${r}\\}\\) is closed.`,
        ]),
        method: "Use the sequential characterization of closed subsets of \\(\\mathbb{R}\\).",
        solution: proofParagraphs([
          `Let \\((x_n)\\subset F\\) and suppose \\(x_n\\to x\\). Since absolute value is continuous, \\(|x-${c}|=\\lim_{n\\to\\infty}|x_n-${c}|\\).`,
          `Each \\(|x_n-${c}|\\le ${r}\\), so passing to the limit gives \\(|x-${c}|\\le ${r}\\). Hence \\(x\\in F\\), and therefore \\(F\\) is closed.`,
        ]),
      };
    });

    addMany(bank, 50, (i) => {
      const c = (i % 10) + 1;
      const l = (Math.floor(i / 10) % 7) - 3;
      return {
        topic: "Differentiability implies continuity",
        prompt: proofParagraphs([
          `Suppose \\(f\\) is differentiable at \\(c=${c}\\) and \\(f'(${c})=${l}\\). Prove that \\(f\\) is continuous at \\(${c}\\).`,
        ]),
        method: "Factor the difference through the difference quotient.",
        solution: proofParagraphs([
          `For \\(x\\ne ${c}\\), write \\(f(x)-f(${c})=\\left(\\frac{f(x)-f(${c})}{x-${c}}\\right)(x-${c})\\).`,
          `As \\(x\\to ${c}\\), the first factor tends to \\(f'(${c})=${l}\\), so it is bounded near \\(${c}\\); the second factor tends to \\(0\\). Their product tends to \\(0\\), which is exactly continuity at \\(${c}\\).`,
        ]),
      };
    });

    addMany(bank, 50, (i) => {
      const a = i % 10;
      const b = a + (Math.floor(i / 10) % 5) + 1;
      return {
        topic: "Extreme value theorem",
        prompt: proofParagraphs([
          `Let \\(f:[${a},${b}]\\to\\mathbb{R}\\) be continuous. Prove that \\(f\\) is bounded and attains its maximum and minimum on \\([${a},${b}]\\).`,
        ]),
        method: "Use compactness of the interval and continuity of images of convergent subsequences.",
        solution: proofParagraphs([
          `The interval \\([${a},${b}]\\) is compact. If \\(f\\) were unbounded, there would be \\(x_n\\in[${a},${b}]\\) with \\(|f(x_n)|\\ge n\\). A convergent subsequence \\(x_{n_k}\\to x\\in[${a},${b}]\\) would force \\(f(x_{n_k})\\to f(x)\\), contradicting unboundedness.`,
          `Let \\(M=\\sup f([${a},${b}])\\). Choose \\(x_n\\) with \\(f(x_n)>M-1/n\\). A convergent subsequence tends to some \\(x^*\\), and continuity gives \\(f(x^*)=M\\). Apply the same argument to \\(-f\\) for the minimum.`,
        ]),
      };
    });

    return bank;
  }

  function buildStatsProofBank() {
    const bank = [];

    addMany(bank, 50, (i) => {
      const n = i + 2;
      return {
        topic: "Unbiased sample mean",
        prompt: proofParagraphs([
          `Let \\(X_1,\\ldots,X_${n}\\) have common finite mean \\(\\mu\\). Prove that \\(\\bar X_${n}=\\frac{1}{${n}}\\sum_{i=1}^{${n}}X_i\\) is unbiased for \\(\\mu\\).`,
        ]),
        method: "Use linearity of expectation.",
        solution: proofParagraphs([
          `By linearity, \\(E[\\bar X_${n}]=\\frac{1}{${n}}\\sum_{i=1}^{${n}}E[X_i]=\\frac{1}{${n}}\\cdot ${n}\\mu=\\mu\\).`,
          `Therefore the bias \\(E[\\bar X_${n}]-\\mu\\) equals \\(0\\).`,
        ]),
      };
    });

    addMany(bank, 50, (i) => {
      const n = i + 2;
      return {
        topic: "Variance of the mean",
        prompt: proofParagraphs([
          `Let \\(X_1,\\ldots,X_${n}\\) be independent with common variance \\(\\sigma^2\\). Prove that \\(\\operatorname{Var}(\\bar X_${n})=\\sigma^2/${n}\\).`,
        ]),
        method: "Independence removes the covariance terms.",
        solution: proofParagraphs([
          `Since \\(\\bar X_${n}=\\frac{1}{${n}}\\sum_{i=1}^{${n}}X_i\\), \\(\\operatorname{Var}(\\bar X_${n})=\\frac{1}{${n * n}}\\operatorname{Var}\\left(\\sum_{i=1}^{${n}}X_i\\right)\\).`,
          `Independence gives \\(\\operatorname{Var}(\\sum X_i)=\\sum \\operatorname{Var}(X_i)=${n}\\sigma^2\\), so \\(\\operatorname{Var}(\\bar X_${n})=\\sigma^2/${n}\\).`,
        ]),
      };
    });

    addMany(bank, 50, (i) => {
      const n = i + 3;
      return {
        topic: "Unbiased sample variance",
        prompt: proofParagraphs([
          `Let \\(X_1,\\ldots,X_${n}\\) be iid with mean \\(\\mu\\) and variance \\(\\sigma^2\\). Prove that \\(S^2=\\frac{1}{${n - 1}}\\sum_{i=1}^{${n}}(X_i-\\bar X)^2\\) is unbiased for \\(\\sigma^2\\).`,
        ]),
        method: "Use the centered sum-of-squares identity.",
        solution: proofParagraphs([
          `The identity \\(\\sum_{i=1}^{${n}}(X_i-\\bar X)^2=\\sum_{i=1}^{${n}}(X_i-\\mu)^2-${n}(\\bar X-\\mu)^2\\) gives the expectation.`,
          `Taking expectations yields \\(${n}\\sigma^2-${n}\\operatorname{Var}(\\bar X)=${n}\\sigma^2-\\sigma^2=(${n - 1})\\sigma^2\\). Dividing by \\(${n - 1}\\) proves \\(E[S^2]=\\sigma^2\\).`,
        ]),
      };
    });

    addMany(bank, 50, (i) => {
      const n = i + 2;
      return {
        topic: "Chebyshev WLLN",
        prompt: proofParagraphs([
          `Let \\(X_1,\\ldots,X_n\\) be iid with mean \\(\\mu\\) and variance \\(\\sigma^2\\lt\\infty\\). Prove that \\(\\bar X_n\\to\\mu\\) in probability, and state the bound for \\(n=${n}\\).`,
        ]),
        method: "Apply Chebyshev's inequality to the sample mean.",
        solution: proofParagraphs([
          `For every \\(\\epsilon>0\\), Chebyshev gives \\(P(|\\bar X_n-\\mu|>\\epsilon)\\le \\operatorname{Var}(\\bar X_n)/\\epsilon^2=\\sigma^2/(n\\epsilon^2)\\).`,
          `At \\(n=${n}\\), the displayed bound is \\(\\sigma^2/(${n}\\epsilon^2)\\). Since the bound tends to \\(0\\) as \\(n\\to\\infty\\), \\(\\bar X_n\\to\\mu\\) in probability.`,
        ]),
      };
    });

    addMany(bank, 50, (i) => {
      const n = i + 2;
      const sigma2 = (i % 10) + 1;
      return {
        topic: "Normal MLE",
        prompt: proofParagraphs([
          `Let \\(X_1,\\ldots,X_${n}\\stackrel{iid}{\\sim}N(\\mu,${sigma2})\\), where \\(${sigma2}\\) is known. Prove that the MLE of \\(\\mu\\) is \\(\\hat\\mu=\\bar X\\).`,
        ]),
        method: "Differentiate the log-likelihood, or complete the square.",
        solution: proofParagraphs([
          `Ignoring constants, \\(\\ell(\\mu)=-\\frac{1}{${2 * sigma2}}\\sum_{i=1}^{${n}}(x_i-\\mu)^2\\). Maximizing \\(\\ell\\) is equivalent to minimizing the squared-error sum.`,
          `The derivative is \\(\\ell'(\\mu)=\\frac{1}{${sigma2}}\\sum_{i=1}^{${n}}(x_i-\\mu)\\). Setting it equal to \\(0\\) gives \\(\\hat\\mu=\\frac{1}{${n}}\\sum x_i=\\bar x\\), and \\(\\ell''(\\mu)=-${n}/${sigma2}\\lt 0\\).`,
        ]),
      };
    });

    addMany(bank, 50, (i) => {
      const n = i + 2;
      return {
        topic: "Exponential MLE",
        prompt: proofParagraphs([
          `Let \\(X_1,\\ldots,X_${n}\\stackrel{iid}{\\sim}\\operatorname{Exp}(\\lambda)\\), with density \\(\\lambda e^{-\\lambda x}\\) for \\(x\\ge 0\\). Prove that \\(\\hat\\lambda=${n}/\\sum_{i=1}^{${n}}X_i\\).`,
        ]),
        method: "Differentiate the log-likelihood on \\(\\lambda>0\\).",
        solution: proofParagraphs([
          `For observed nonnegative data, \\(\\ell(\\lambda)=${n}\\log\\lambda-\\lambda\\sum_{i=1}^{${n}}x_i\\).`,
          `Then \\(\\ell'(\\lambda)=${n}/\\lambda-\\sum x_i\\), so the critical point is \\(\\hat\\lambda=${n}/\\sum x_i\\). Since \\(\\ell''(\\lambda)=-${n}/\\lambda^2\\lt 0\\), this critical point is the maximum.`,
        ]),
      };
    });

    addMany(bank, 50, (i) => {
      const n = i + 1;
      const sigma2 = (i % 10) + 1;
      const tau2 = (Math.floor(i / 10) % 5) + 1;
      return {
        topic: "Normal-normal posterior",
        prompt: proofParagraphs([
          `Let \\(X_1,\\ldots,X_${n}|\\mu\\stackrel{iid}{\\sim}N(\\mu,${sigma2})\\) and \\(\\mu\\sim N(m_0,${tau2})\\). Derive the posterior distribution of \\(\\mu\\).`,
        ]),
        method: "Collect the quadratic terms in \\(\\mu\\).",
        solution: proofParagraphs([
          `The log posterior, up to constants, is \\(-\\frac{1}{2}\\left[\\frac{1}{${sigma2}}\\sum_{i=1}^{${n}}(x_i-\\mu)^2+\\frac{1}{${tau2}}(\\mu-m_0)^2\\right]\\).`,
          `Collecting powers of \\(\\mu\\) shows that \\(\\mu|x\\sim N(m_n,V_n)\\), where \\(V_n=\\left(${n}/${sigma2}+1/${tau2}\\right)^{-1}\\) and \\(m_n=V_n\\left(${n}\\bar x/${sigma2}+m_0/${tau2}\\right)\\).`,
        ]),
      };
    });

    addMany(bank, 50, (i) => {
      const n = (i % 10) + 8;
      const p = (Math.floor(i / 10) % 5) + 2;
      return {
        topic: "OLS normal equations",
        prompt: proofParagraphs([
          `Let \\(X\\in\\mathbb{R}^{${n}\\times ${p}}\\) have full column rank and let \\(y\\in\\mathbb{R}^{${n}}\\). Prove that the least-squares estimator satisfies \\(\\hat\\beta=(X^TX)^{-1}X^Ty\\) and that the residual is orthogonal to the columns of \\(X\\).`,
        ]),
        method: "Differentiate the quadratic objective.",
        solution: proofParagraphs([
          `Minimize \\(Q(\\beta)=\\|y-X\\beta\\|^2=(y-X\\beta)^T(y-X\\beta)\\). Its gradient is \\(\\nabla Q(\\beta)=-2X^T(y-X\\beta)\\).`,
          `At the minimizer, \\(X^T(y-X\\hat\\beta)=0\\), so \\(X^TX\\hat\\beta=X^Ty\\). Full column rank makes \\(X^TX\\) invertible, giving \\(\\hat\\beta=(X^TX)^{-1}X^Ty\\). The same equation says \\(X^T\\hat e=0\\).`,
        ]),
      };
    });

    addMany(bank, 50, (i) => {
      const n = i + 2;
      const sigma2 = (i % 10) + 1;
      return {
        topic: "Cramer-Rao bound",
        prompt: proofParagraphs([
          `For \\(X_1,\\ldots,X_${n}\\stackrel{iid}{\\sim}N(\\mu,${sigma2})\\) with \\(${sigma2}\\) known, prove the Cramer-Rao lower bound for unbiased estimators of \\(\\mu\\), and show that \\(\\bar X\\) attains it.`,
        ]),
        method: "Compute Fisher information and compare with the variance of \\(\\bar X\\).",
        solution: proofParagraphs([
          `The score for one observation is \\(U_1(\\mu)=(X_1-\\mu)/${sigma2}\\), so \\(I_1(\\mu)=E[U_1(\\mu)^2]=1/${sigma2}\\). For \\(${n}\\) independent observations, \\(I_n(\\mu)=${n}/${sigma2}\\).`,
          `The Cramer-Rao inequality gives \\(\\operatorname{Var}(T)\\ge 1/I_n(\\mu)=${sigma2}/${n}\\) for any unbiased \\(T\\). Since \\(\\operatorname{Var}(\\bar X)=${sigma2}/${n}\\) and \\(E[\\bar X]=\\mu\\), \\(\\bar X\\) is efficient.`,
        ]),
      };
    });

    addMany(bank, 50, (i) => {
      const label = (i % 10) + 1;
      return {
        topic: "Rao-Blackwell",
        prompt: proofParagraphs([
          `Let \\(T_${label}\\) be an unbiased estimator of \\(\\theta\\), and let \\(S\\) be a statistic. Prove that \\(T_${label}^*=E[T_${label}\\mid S]\\) is unbiased and has variance no larger than \\(T_${label}\\).`,
        ]),
        method: "Use the tower property and the law of total variance.",
        solution: proofParagraphs([
          `By iterated expectation, \\(E[T_${label}^*]=E[E[T_${label}\\mid S]]=E[T_${label}]=\\theta\\), so \\(T_${label}^*\\) is unbiased.`,
          `The law of total variance says \\(\\operatorname{Var}(T_${label})=\\operatorname{Var}(E[T_${label}\\mid S])+E[\\operatorname{Var}(T_${label}\\mid S)]\\). The second term is nonnegative, hence \\(\\operatorname{Var}(T_${label}^*)\\le \\operatorname{Var}(T_${label})\\).`,
        ]),
      };
    });

    return bank;
  }

  function proofParagraphs(lines) {
    return lines.map((line) => `<p>${line}</p>`).join("");
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
