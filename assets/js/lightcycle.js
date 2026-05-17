(() => {
  const SECRET = "tron";
  const STEP_MS = 72;
  const BOOST_STEP_MS = 44;
  const BOOST_DURATION_MS = 950;
  const BOOST_COOLDOWN_MS = 2600;
  const MAX_DPR = 2;
  const DIRECTIONS = {
    up: { x: 0, y: -1 },
    right: { x: 1, y: 0 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
  };
  const KEY_DIRECTIONS = {
    arrowup: DIRECTIONS.up,
    w: DIRECTIONS.up,
    arrowright: DIRECTIONS.right,
    d: DIRECTIONS.right,
    arrowdown: DIRECTIONS.down,
    s: DIRECTIONS.down,
    arrowleft: DIRECTIONS.left,
    a: DIRECTIONS.left,
  };
  const AI_PROFILES = [
    {
      name: "AGGRESSIVE",
      lookAhead: 12,
      spaceLimit: 34,
      straightBias: 0.6,
      chaseWeight: 2.4,
      distanceWeight: -0.015,
      spaceWeight: 0.04,
      centerWeight: 0.2,
      wallWeight: 0.03,
      jitter: 1.1,
    },
    {
      name: "DEFENSIVE",
      lookAhead: 22,
      spaceLimit: 78,
      straightBias: 1.9,
      chaseWeight: -0.7,
      distanceWeight: 0.08,
      spaceWeight: 0.18,
      centerWeight: 0.15,
      wallWeight: 0.18,
      jitter: 0.45,
    },
    {
      name: "STRATEGIC",
      lookAhead: 18,
      spaceLimit: 62,
      straightBias: 1.15,
      chaseWeight: 0.85,
      distanceWeight: 0.02,
      spaceWeight: 0.13,
      centerWeight: 0.38,
      wallWeight: 0.1,
      jitter: 0.65,
    },
  ];

  let overlay;
  let canvas;
  let ctx;
  let scoreEl;
  let profileEl;
  let boostEl;
  let statusEl;
  let exitButton;
  let previousFocus;
  let animationFrame;
  let active = false;
  let running = false;
  let roundOver = false;
  let lastStep = 0;
  let boostUntil = 0;
  let boostReadyAt = 0;
  let resetTimer;
  let typed = "";
  let cols = 0;
  let rows = 0;
  let cell = 12;
  let offsetX = 0;
  let offsetY = 0;
  let player;
  let cpu;
  let occupied;
  let score = { player: 0, cpu: 0 };
  let touchStart;

  document.addEventListener("DOMContentLoaded", initLightcycle);

  function initLightcycle() {
    document.addEventListener("keydown", handleKeydown);

    if (window.location.hash.toLowerCase() === "#tron") {
      window.setTimeout(openGame, 250);
    }
  }

  function handleKeydown(event) {
    if (active) {
      handleGameKeydown(event);
      return;
    }

    if (event.metaKey || event.ctrlKey || event.altKey || event.key.length !== 1 || isTypingField(event.target)) {
      return;
    }

    typed = `${typed}${event.key.toLowerCase()}`.slice(-SECRET.length);
    if (typed === SECRET) {
      event.preventDefault();
      openGame();
    }
  }

  function isTypingField(target) {
    if (!target) {
      return false;
    }

    const tagName = target.tagName ? target.tagName.toLowerCase() : "";
    return tagName === "input" || tagName === "textarea" || tagName === "select" || target.isContentEditable;
  }

  function handleGameKeydown(event) {
    const key = event.key.toLowerCase();

    if (key === "escape") {
      event.preventDefault();
      closeGame();
      return;
    }

    if (key === " " || event.code === "Space") {
      event.preventDefault();
      startRound();
      return;
    }

    if (key === "enter") {
      event.preventDefault();
      triggerBoost();
      return;
    }

    const direction = KEY_DIRECTIONS[key];
    if (direction) {
      event.preventDefault();
      if (!running && roundOver) {
        resetRound(statusEl.textContent);
      }
      turnPlayer(direction);
      if (!running) {
        startRound();
      }
    }
  }

  function createOverlay() {
    if (overlay) {
      return;
    }

    overlay = document.createElement("div");
    overlay.id = "lightcycle-game";
    overlay.className = "lightcycle";
    overlay.tabIndex = -1;
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Light cycle game");
    overlay.innerHTML = `
      <canvas class="lightcycle__canvas" aria-hidden="true"></canvas>
      <div class="lightcycle__hud">
        <div class="lightcycle__brand">LIGHT CYCLE</div>
        <div class="lightcycle__readout">
          <div class="lightcycle__score" data-lightcycle-score>YOU 0 / CPU 0</div>
          <div class="lightcycle__meta">
            <span data-lightcycle-profile>CPU STRATEGIC</span>
            <span data-lightcycle-boost>BOOST READY</span>
          </div>
        </div>
        <button class="lightcycle__exit" type="button" data-lightcycle-exit>EXIT</button>
      </div>
      <div class="lightcycle__status" data-lightcycle-status>SPACE TO START</div>
    `;
    document.body.appendChild(overlay);

    canvas = overlay.querySelector("canvas");
    ctx = canvas.getContext("2d");
    scoreEl = overlay.querySelector("[data-lightcycle-score]");
    profileEl = overlay.querySelector("[data-lightcycle-profile]");
    boostEl = overlay.querySelector("[data-lightcycle-boost]");
    statusEl = overlay.querySelector("[data-lightcycle-status]");
    exitButton = overlay.querySelector("[data-lightcycle-exit]");

    exitButton.addEventListener("click", closeGame);
    overlay.addEventListener("touchstart", handleTouchStart, { passive: true });
    overlay.addEventListener("touchend", handleTouchEnd, { passive: false });
  }

  function openGame() {
    if (active) {
      return;
    }

    createOverlay();
    previousFocus = document.activeElement;
    active = true;
    running = false;
    roundOver = false;
    lastStep = 0;
    boostUntil = 0;
    boostReadyAt = 0;
    score = { player: 0, cpu: 0 };
    document.body.classList.add("lightcycle-active");
    overlay.classList.add("is-visible");
    window.addEventListener("resize", handleResize);
    setupCanvas();
    resetRound("SPACE TO START - ENTER BOOSTS - ESC EXITS");
    overlay.focus({ preventScroll: true });
    animationFrame = window.requestAnimationFrame(loop);
  }

  function closeGame() {
    if (!active) {
      return;
    }

    active = false;
    running = false;
    roundOver = false;
    window.clearTimeout(resetTimer);
    window.cancelAnimationFrame(animationFrame);
    window.removeEventListener("resize", handleResize);
    document.body.classList.remove("lightcycle-active");
    overlay.classList.remove("is-visible");

    if (window.location.hash.toLowerCase() === "#tron") {
      history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    }

    if (previousFocus && typeof previousFocus.focus === "function") {
      previousFocus.focus({ preventScroll: true });
    }
  }

  function handleResize() {
    setupCanvas();
    resetRound("SCREEN RESYNCED - SPACE TO START");
  }

  function setupCanvas() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    cell = Math.max(10, Math.min(16, Math.floor(Math.min(width, height) / 44)));
    cols = Math.max(24, Math.floor(width / cell));
    rows = Math.max(18, Math.floor(height / cell));
    offsetX = Math.floor((width - cols * cell) / 2);
    offsetY = Math.floor((height - rows * cell) / 2);
  }

  function resetRound(message) {
    occupied = new Set();
    player = createCycle(Math.floor(cols * 0.22), Math.floor(rows * 0.5), DIRECTIONS.right, "#2fffff");
    cpu = createCycle(Math.floor(cols * 0.78), Math.floor(rows * 0.5), DIRECTIONS.left, "#ff2bd6", randomCpuProfile());
    occupy(player);
    occupy(cpu);
    running = false;
    roundOver = false;
    boostUntil = 0;
    boostReadyAt = 0;
    updateScore();
    updateBoostHud(performance.now());
    setStatus(message || "SPACE TO START");
    draw(performance.now());
  }

  function createCycle(x, y, direction, color, profile) {
    return {
      x,
      y,
      direction,
      nextDirection: direction,
      color,
      profile,
      trail: [{ x, y }],
      crash: null,
    };
  }

  function randomCpuProfile() {
    return AI_PROFILES[Math.floor(Math.random() * AI_PROFILES.length)];
  }

  function startRound() {
    if (running) {
      return;
    }

    if (roundOver) {
      resetRound(statusEl.textContent);
    }

    player.crash = null;
    cpu.crash = null;
    running = true;
    lastStep = performance.now();
    setStatus("");
  }

  function triggerBoost() {
    if (!running) {
      startRound();
    }

    const now = performance.now();
    if (now < boostReadyAt) {
      return;
    }

    boostUntil = now + BOOST_DURATION_MS;
    boostReadyAt = now + BOOST_COOLDOWN_MS;
    updateBoostHud(now);
  }

  function turnPlayer(direction) {
    if (!isReverse(player.direction, direction)) {
      player.nextDirection = direction;
    }
  }

  function loop(time) {
    if (!active) {
      return;
    }

    const stepMs = isBoosting(time) ? BOOST_STEP_MS : STEP_MS;
    while (running && time - lastStep >= stepMs) {
      step();
      lastStep += stepMs;
    }

    draw(time);
    animationFrame = window.requestAnimationFrame(loop);
  }

  function step() {
    player.direction = player.nextDirection;
    cpu.nextDirection = pickCpuDirection();
    cpu.direction = cpu.nextDirection;

    const nextPlayer = nextCell(player);
    const nextCpu = nextCell(cpu);
    const sameCell = nextPlayer.x === nextCpu.x && nextPlayer.y === nextCpu.y;
    const playerCrash = sameCell || hitsWall(nextPlayer) || occupied.has(keyFor(nextPlayer.x, nextPlayer.y));
    const cpuCrash = sameCell || hitsWall(nextCpu) || occupied.has(keyFor(nextCpu.x, nextCpu.y));

    if (playerCrash || cpuCrash) {
      player.crash = playerCrash ? nextPlayer : null;
      cpu.crash = cpuCrash ? nextCpu : null;
      finishRound(playerCrash, cpuCrash);
      return;
    }

    moveCycle(player, nextPlayer);
    moveCycle(cpu, nextCpu);
  }

  function finishRound(playerCrash, cpuCrash) {
    running = false;
    roundOver = true;

    if (playerCrash && cpuCrash) {
      setStatus("GRIDLOCK - SPACE TO RUN IT BACK");
    } else if (cpuCrash) {
      score.player += 1;
      setStatus("YOU WIN - SPACE TO RIDE AGAIN");
    } else {
      score.cpu += 1;
      setStatus("CPU WINS - SPACE TO TRY AGAIN");
    }

    updateScore();
    window.clearTimeout(resetTimer);
    resetTimer = window.setTimeout(() => {
      if (active && !running && roundOver) {
        resetRound(statusEl.textContent);
      }
    }, 850);
  }

  function pickCpuDirection() {
    const profile = cpu.profile || AI_PROFILES[2];
    const playerNext = {
      x: player.x + player.nextDirection.x,
      y: player.y + player.nextDirection.y,
    };
    const currentDistance = distanceBetween(cpu, player);
    const options = Object.values(DIRECTIONS)
      .filter((direction) => !isReverse(cpu.direction, direction))
      .map((direction) => {
        const next = {
          x: cpu.x + direction.x,
          y: cpu.y + direction.y,
        };
        const nextDistance = distanceBetween(next, playerNext);
        const approach = currentDistance - nextDistance;
        const centerPull = 1 - (Math.abs(next.x - cols / 2) / cols + Math.abs(next.y - rows / 2) / rows);
        const wallPadding = Math.min(next.x, cols - next.x - 1, next.y, rows - next.y - 1);
        let scoreValue = scorePath(cpu, direction, profile.lookAhead)
          + scoreOpenSpace(next, profile.spaceLimit) * profile.spaceWeight
          + approach * profile.chaseWeight
          + nextDistance * profile.distanceWeight
          + centerPull * profile.centerWeight
          + wallPadding * profile.wallWeight
          + (direction === cpu.direction ? profile.straightBias : 0)
          + Math.random() * profile.jitter;

        if (hitsWall(next) || occupied.has(keyFor(next.x, next.y))) {
          scoreValue -= 1000;
        }

        return {
          direction,
          score: scoreValue,
        };
      })
      .sort((a, b) => b.score - a.score);

    return options[0] ? options[0].direction : cpu.direction;
  }

  function scorePath(cycle, direction, lookAhead) {
    let x = cycle.x;
    let y = cycle.y;
    let scoreValue = 0;

    for (let i = 0; i < lookAhead; i += 1) {
      x += direction.x;
      y += direction.y;

      if (hitsWall({ x, y }) || occupied.has(keyFor(x, y))) {
        break;
      }

      const centerPull = 1 - (Math.abs(x - cols / 2) / cols + Math.abs(y - rows / 2) / rows);
      scoreValue += 1 + centerPull * 0.15;
    }

    return scoreValue;
  }

  function scoreOpenSpace(start, limit) {
    if (hitsWall(start) || occupied.has(keyFor(start.x, start.y))) {
      return 0;
    }

    const seen = new Set([keyFor(start.x, start.y)]);
    const queue = [start];
    let openCells = 0;

    while (queue.length && openCells < limit) {
      const current = queue.shift();
      openCells += 1;

      Object.values(DIRECTIONS).forEach((direction) => {
        const next = {
          x: current.x + direction.x,
          y: current.y + direction.y,
        };
        const nextKey = keyFor(next.x, next.y);

        if (!seen.has(nextKey) && !hitsWall(next) && !occupied.has(nextKey)) {
          seen.add(nextKey);
          queue.push(next);
        }
      });
    }

    return openCells;
  }

  function distanceBetween(first, second) {
    return Math.abs(first.x - second.x) + Math.abs(first.y - second.y);
  }

  function nextCell(cycle) {
    return {
      x: cycle.x + cycle.direction.x,
      y: cycle.y + cycle.direction.y,
    };
  }

  function moveCycle(cycle, next) {
    cycle.x = next.x;
    cycle.y = next.y;
    cycle.trail.push({ x: next.x, y: next.y });
    occupy(cycle);
  }

  function occupy(cycle) {
    occupied.add(keyFor(cycle.x, cycle.y));
  }

  function hitsWall(cellToCheck) {
    return cellToCheck.x < 0 || cellToCheck.x >= cols || cellToCheck.y < 0 || cellToCheck.y >= rows;
  }

  function keyFor(x, y) {
    return `${x},${y}`;
  }

  function isReverse(current, next) {
    return current.x + next.x === 0 && current.y + next.y === 0;
  }

  function updateScore() {
    scoreEl.textContent = `YOU ${score.player} / CPU ${score.cpu}`;
    if (profileEl && cpu && cpu.profile) {
      profileEl.textContent = `CPU ${cpu.profile.name}`;
    }
  }

  function updateBoostHud(time) {
    if (!boostEl) {
      return;
    }

    if (running && isBoosting(time)) {
      boostEl.textContent = "BOOST ACTIVE";
    } else if (time < boostReadyAt) {
      boostEl.textContent = `BOOST ${Math.ceil((boostReadyAt - time) / 1000)}`;
    } else {
      boostEl.textContent = "BOOST READY";
    }
  }

  function isBoosting(time) {
    return running && time < boostUntil;
  }

  function setStatus(message) {
    statusEl.textContent = message;
    statusEl.classList.toggle("is-hidden", !message);
  }

  function handleTouchStart(event) {
    const touch = event.changedTouches[0];
    touchStart = { x: touch.clientX, y: touch.clientY };
  }

  function handleTouchEnd(event) {
    if (!touchStart) {
      return;
    }

    const touch = event.changedTouches[0];
    const dx = touch.clientX - touchStart.x;
    const dy = touch.clientY - touchStart.y;
    touchStart = null;

    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) {
      startRound();
      return;
    }

    event.preventDefault();
    const direction = Math.abs(dx) > Math.abs(dy)
      ? (dx > 0 ? DIRECTIONS.right : DIRECTIONS.left)
      : (dy > 0 ? DIRECTIONS.down : DIRECTIONS.up);
    turnPlayer(direction);

    if (!running) {
      startRound();
    }
  }

  function draw(time) {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const hue = (220 + time / 90) % 360;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = `hsl(${hue}, 70%, 4%)`;
    ctx.fillRect(0, 0, width, height);
    updateBoostHud(time);
    drawGrid(time);
    drawTrail(cpu, time, false);
    drawTrail(player, time, isBoosting(time));
    drawCrash(player);
    drawCrash(cpu);
  }

  function drawGrid(time) {
    const width = cols * cell;
    const height = rows * cell;
    const pulse = 0.05 + Math.sin(time / 260) * 0.025;

    ctx.save();
    ctx.lineWidth = 1;
    ctx.strokeStyle = `rgba(47, 255, 255, ${pulse})`;

    for (let x = 0; x <= cols; x += 1) {
      const px = offsetX + x * cell + 0.5;
      ctx.beginPath();
      ctx.moveTo(px, offsetY);
      ctx.lineTo(px, offsetY + height);
      ctx.stroke();
    }

    ctx.strokeStyle = `rgba(255, 43, 214, ${pulse * 0.8})`;
    for (let y = 0; y <= rows; y += 1) {
      const py = offsetY + y * cell + 0.5;
      ctx.beginPath();
      ctx.moveTo(offsetX, py);
      ctx.lineTo(offsetX + width, py);
      ctx.stroke();
    }

    ctx.strokeStyle = "rgba(234, 252, 255, 0.28)";
    ctx.strokeRect(offsetX + 0.5, offsetY + 0.5, width - 1, height - 1);
    ctx.restore();
  }

  function drawTrail(cycle, time, boosted) {
    const glow = 12 + Math.sin(time / 140) * 3 + (boosted ? 10 : 0);

    ctx.save();
    ctx.shadowBlur = glow;
    ctx.shadowColor = cycle.color;
    cycle.trail.forEach((cellToDraw, index) => {
      const age = index / Math.max(1, cycle.trail.length - 1);
      ctx.globalAlpha = 0.48 + age * 0.52;
      ctx.fillStyle = cycle.color;
      ctx.fillRect(
        offsetX + cellToDraw.x * cell + 1,
        offsetY + cellToDraw.y * cell + 1,
        cell - 2,
        cell - 2,
      );
    });
    ctx.globalAlpha = 1;
    ctx.shadowBlur = glow * 1.4;
    ctx.fillStyle = boosted ? "#ffec7a" : "#ffffff";
    ctx.fillRect(offsetX + cycle.x * cell + 3, offsetY + cycle.y * cell + 3, cell - 6, cell - 6);
    ctx.restore();
  }

  function drawCrash(cycle) {
    if (!cycle.crash || hitsWall(cycle.crash)) {
      return;
    }

    ctx.save();
    ctx.shadowBlur = 22;
    ctx.shadowColor = "#ffffff";
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(offsetX + cycle.crash.x * cell, offsetY + cycle.crash.y * cell, cell, cell);
    ctx.restore();
  }
})();
