let lastMouseMoveTime = performance.now();

const echoLayer = document.getElementById("echoLayer");
const scene = document.getElementById("scene");
const halosRoot = document.getElementById("halos");
const ribbonsRoot = document.getElementById("ribbons");
const contourLayer = document.getElementById("contours");
const textFragmentsContainer = document.getElementById("textFragments");
const stateLabel = document.getElementById("stateLabel");
const shiftBtn = document.getElementById("shiftBtn");
const fragments = [...document.querySelectorAll(".fragment")];

const field = {
  strength: 120,
  radius: 220
};

const viewport = {
  width: window.innerWidth,
  height: window.innerHeight,
};

const mouse = {
  x: viewport.width / 2,
  y: viewport.height / 2,
  targetX: viewport.width / 2,
  targetY: viewport.height / 2,
};

let haloAnimations = [];
let ribbonAnimations = [];

const states = [
  {
    state: "latent",
    tension: 0.12,
    flow: "drifting",
    density: "sparse",
    bias: "center",
    response: "delayed",
    drift: 0.85,
    focus: 0.20,
    opacityMode: "fading",
    visual: {
      colorA: "#1a1a1a",
      colorB: "#2c3e50",
      intensity: 0.15,
      movement: "slow",
      distortion: 0.05
    },
    fragments: ["hollow frequency", "near stillness", "formless weight"]
  },
  {
    state: "scanning",
    tension: 0.48,
    flow: "smooth",
    density: "balanced",
    bias: "top",
    response: "elastic",
    drift: 0.32,
    focus: 0.65,
    opacityMode: "layered",
    visual: {
      colorA: "#0d1117",
      colorB: "#4a5568",
      intensity: 0.40,
      movement: "medium",
      distortion: 0.22
    },
    fragments: ["data trace", "parsing edge", "vector drift"]
  },
  {
    state: "ordered",
    tension: 0.72,
    flow: "tight",
    density: "clustered",
    bias: "right",
    response: "sharp",
    drift: 0.05,
    focus: 0.90,
    opacityMode: "even",
    visual: {
      colorA: "#16161d",
      colorB: "#3d3d5c",
      intensity: 0.65,
      movement: "fast",
      distortion: 0.12
    },
    fragments: ["fixed point", "synced logic", "dense grid"]
  }
];

let currentIndex = 0;
let currentState = states[currentIndex];

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function getBiasOffset(bias) {
  const offset = { x: 0, y: 0 };
  if (bias === "left") offset.x = -160;
  if (bias === "right") offset.x = 160;
  if (bias === "top") offset.y = -120;
  if (bias === "bottom") offset.y = 120;
  return offset;
}

function getMovementDuration(movement) {
  if (movement === "slow") return 18;
  if (movement === "fast") return 7;
  return 11;
}

function getFlowMultiplier(flow) {
  if (flow === "tight") return 0.42;
  if (flow === "smooth") return 0.82;
  if (flow === "erratic") return 1.1;
  return 1.0;
}

function getResponseEase(response) {
  if (response === "delayed") return 0.04;
  if (response === "elastic") return 0.09;
  if (response === "sharp") return 0.14;
  return 0.08;
}

function clearAnimations(list) {
  list.forEach((anim) => anim.cancel());
  list.length = 0;
}

function buildEnvironment() {
  halosRoot.innerHTML = "";
  ribbonsRoot.innerHTML = "";

  for (let i = 0; i < 3; i++) {
    const halo = document.createElement("div");
    halo.className = "halo";
    halosRoot.appendChild(halo);
  }

  for (let i = 0; i < 3; i++) {
    const ribbon = document.createElement("div");
    ribbon.className = "ribbon";
    ribbonsRoot.appendChild(ribbon);
  }
}

function applySceneColors(state) {
  document.documentElement.style.setProperty("--ai-color-a", state.visual.colorA);
  document.documentElement.style.setProperty("--ai-color-b", state.visual.colorB);
}

function applyHalos(state) {
  const halos = [...halosRoot.querySelectorAll(".halo")];
  const duration = getMovementDuration(state.visual.movement);
  const bias = getBiasOffset(state.bias);

  clearAnimations(haloAnimations);

  halos.forEach((halo, index) => {
    const positions = [
      { x: -240, y: -120 },
      { x: 180, y: -20 },
      { x: -40, y: 180 }
    ];

    const base = positions[index];

    let size =
      state.density === "sparse" ? 1.15 :
      state.density === "balanced" ? 0.95 : 0.78;

    let opacity =
      (state.density === "sparse" ? 0.14 : state.density === "balanced" ? 0.18 : 0.22)
      + state.visual.intensity * 0.10;

    if (state.state === "latent") {
      size *= 1.12;
      opacity += 0.04;
    }

    if (state.state === "ordered") {
      size *= 0.82;
      opacity *= 0.7;
    }

    halo.style.left = "50%";
    halo.style.top = "50%";
    halo.style.opacity = String(opacity);
    halo.style.width = `${Math.round(Math.min(viewport.width * 0.56, 820) * size)}px`;
    halo.style.height = halo.style.width;

    const x = base.x + bias.x * 0.35;
    const y = base.y + bias.y * 0.35;

    halo.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;

    let driftX = 20 + state.visual.distortion * 36 + index * 10;
    let driftY = 14 + state.visual.distortion * 24 + index * 8;

    if (state.state === "latent") {
      driftX *= 1.15;
      driftY *= 1.15;
    }

    if (state.state === "ordered") {
      driftX *= 0.45;
      driftY *= 0.45;
    }

    haloAnimations.push(
      halo.animate(
        [
          { transform: `translate(-50%, -50%) translate(${x - driftX}px, ${y - driftY}px)` },
          { transform: `translate(-50%, -50%) translate(${x + driftX}px, ${y + driftY}px)` },
          { transform: `translate(-50%, -50%) translate(${x - driftX}px, ${y - driftY}px)` }
        ],
        {
          duration: duration * 1000 + index * 1200,
          iterations: Infinity,
          easing: "ease-in-out"
        }
      )
    );
  });
}

function applyRibbons(state) {
  const ribbons = [...ribbonsRoot.querySelectorAll(".ribbon")];
  const duration = getMovementDuration(state.visual.movement);
  const bias = getBiasOffset(state.bias);

  clearAnimations(ribbonAnimations);

  ribbons.forEach((ribbon, index) => {
    const spread =
      state.state === "ordered" ? 18 :
      state.state === "latent" ? 128 :
      state.density === "sparse" ? 110 :
      state.density === "balanced" ? 70 : 38;

    const y = (index - 1) * spread + bias.y * 0.2;
    const x = (index % 2 === 0 ? -70 : 70) + bias.x * 0.2;

    let angle = -8 + index * 4;
    if (state.state === "scanning") angle = -24 + index * 8;
    if (state.state === "ordered") angle = 90;
    if (state.state === "latent") angle = -4 + index * 3;

    let ribbonOpacity = 0.10 + state.visual.intensity * 0.11;
    if (state.state === "ordered") ribbonOpacity = 0.18 + state.visual.intensity * 0.08;
    if (state.state === "latent") ribbonOpacity *= 0.55;
    if (state.state === "scanning") ribbonOpacity *= 1.15;

    ribbon.style.opacity = String(ribbonOpacity);
    ribbon.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px) rotate(${angle}deg)`;

    let driftX = 18 + state.visual.distortion * 26;
    let driftY = 10 + state.visual.distortion * 16;

    if (state.state === "ordered") {
      driftX *= 0.4;
      driftY *= 0.35;
    }

    if (state.state === "scanning") {
      driftX *= 1.2;
      driftY *= 1.1;
    }

    ribbonAnimations.push(
      ribbon.animate(
        [
          { transform: `translate(-50%, -50%) translate(${x - driftX}px, ${y - driftY}px) rotate(${angle}deg)` },
          { transform: `translate(-50%, -50%) translate(${x + driftX}px, ${y + driftY}px) rotate(${angle}deg)` },
          { transform: `translate(-50%, -50%) translate(${x - driftX}px, ${y - driftY}px) rotate(${angle}deg)` }
        ],
        {
          duration: duration * 1000 + index * 700,
          iterations: Infinity,
          easing: "ease-in-out"
        }
      )
    );
  });
}

function applyContours(state) {
  let opacity = 0.06 + state.visual.intensity * 0.18;
  let scale = 1.15;

  if (state.state === "latent") {
    opacity *= 0.55;
    scale = 1.18;
  }

  if (state.state === "scanning") {
    opacity *= 1.22;
    scale = 1.08;
  }

  if (state.state === "ordered") {
    opacity *= 1.12;
    scale = 1.02;
  }

  contourLayer.style.opacity = String(opacity);
  contourLayer.style.transform = `scale(${scale})`;
}

function renderTextFragments(state) {
  textFragmentsContainer.innerHTML = "";

  const positions = [
    { left: "10%", top: "24%" },
    { left: "74%", top: "31%" },
    { left: "59%", top: "76%" }
  ];

  state.fragments.forEach((text, index) => {
    const el = document.createElement("div");
    el.className = "text-fragment";
    el.textContent = text;
    el.style.left = positions[index].left;
    el.style.top = positions[index].top;
    textFragmentsContainer.appendChild(el);

    requestAnimationFrame(() => el.classList.add("visible"));
  });
}

function applyFragmentLayout(state) {
  const centerX = viewport.width / 2;
  const centerY = viewport.height / 2;
  const bias = getBiasOffset(state.bias);

  const spreadX =
    state.density === "sparse" ? 270 :
    state.density === "balanced" ? 180 : 112;

  const spreadY =
    state.density === "sparse" ? 170 :
    state.density === "balanced" ? 112 : 72;

  const primaryScale = lerp(1.02, 1.18, state.focus);
  const secondaryScale = lerp(0.92, 1.03, state.focus * 0.7);

  fragments.forEach((fragment, index) => {
    const row = index === 2 ? 1 : 0;
    const col = index === 0 ? -1 : index === 1 ? 1 : 0;

    const x = centerX + bias.x + col * spreadX * 0.5;
    const y = centerY + bias.y + (row === 0 ? -spreadY * 0.2 : spreadY * 0.65);

    const isPrimary = index === 1;
    const scale = isPrimary ? primaryScale : secondaryScale;
    const z = Math.round((index - 1) * 42 + state.focus * 54);

    const opacity =
      state.opacityMode === "even" ? 0.90 - index * 0.05 :
      state.opacityMode === "layered" ? 0.82 - index * 0.08 :
      0.74 - index * 0.10;

    let finalOpacity = opacity;
    if (state.state === "latent" && index === 2) finalOpacity = clamp(opacity * 0.55, 0.18, 0.7);
    if (state.state === "scanning" && index === 0) finalOpacity = clamp(opacity * 1.08, 0.35, 0.95);
    if (state.state === "ordered") finalOpacity = clamp(opacity * 0.92, 0.3, 0.9);

    fragment.style.opacity = String(clamp(finalOpacity, 0.18, 0.95));

    fragment.dataset.baseX = x;
    fragment.dataset.baseY = y;
    fragment.dataset.scale = scale;
    fragment.dataset.z = z;
    fragment.dataset.drift = state.drift;
    fragment.dataset.flow = state.flow;
    fragment.dataset.response = state.response;

    if (state.tension > 0.65) {
      fragment.style.width = isPrimary ? "266px" : "230px";
      fragment.style.height = isPrimary ? "158px" : "144px";
    } else if (state.tension < 0.25) {
      fragment.style.width = isPrimary ? "332px" : "266px";
      fragment.style.height = isPrimary ? "190px" : "162px";
    } else {
      fragment.style.width = isPrimary ? "296px" : "246px";
      fragment.style.height = isPrimary ? "174px" : "152px";
    }

    updateFragmentTransform(fragment, 0, 0);
  });
}

function applyFieldForce(x, y) {
  const dx = mouse.x - x;
  const dy = mouse.y - y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist > field.radius) return { x: 0, y: 0 };

  const force = (1 - dist / field.radius) * field.strength;
  const angle = Math.atan2(dy, dx);

  if (currentState.state === "latent") {
    return {
      x: Math.cos(angle) * force * 0.2,
      y: Math.sin(angle) * force * 0.2
    };
  }

  if (currentState.state === "scanning") {
    return {
      x: Math.cos(angle) * force * 0.6,
      y: Math.sin(angle) * force * 0.6
    };
  }

  if (currentState.state === "ordered") {
    return {
      x: -Math.cos(angle) * force * 0.35,
      y: -Math.sin(angle) * force * 0.35
    };
  }

  return { x: 0, y: 0 };
}

function updateFragmentTransform(fragment, parallaxX, parallaxY) {
  const baseX = parseFloat(fragment.dataset.baseX || 0);
  const baseY = parseFloat(fragment.dataset.baseY || 0);
  const scale = parseFloat(fragment.dataset.scale || 1);
  const z = parseFloat(fragment.dataset.z || 0);

  const fieldForce = applyFieldForce(baseX, baseY);
  const drift = parseFloat(fragment.dataset.drift || 0.25);
  const time = performance.now() * 0.0003;

  const floatX = Math.sin(time + z) * 12 * drift;
  const floatY = Math.cos(time * 1.2 + z) * 10 * drift;

  fragment.style.transform = `
    translate3d(
      ${baseX - fragment.offsetWidth / 2 + parallaxX + fieldForce.x + floatX}px,
      ${baseY - fragment.offsetHeight / 2 + parallaxY + fieldForce.y + floatY}px,
      ${z}px
    )
    scale(${scale})
  `;
}

function createEcho(fragment) {
  const rect = fragment.getBoundingClientRect();

  const echo = document.createElement("div");
  echo.className = "fragment-echo";
  echo.style.left = rect.left + "px";
  echo.style.top = rect.top + "px";
  echo.style.width = rect.width + "px";
  echo.style.height = rect.height + "px";

  if (currentState.state === "latent") {
    echo.style.filter = "blur(2px)";
    echo.style.opacity = "0.18";
  }

  if (currentState.state === "scanning") {
    echo.style.opacity = "0.26";
  }

  if (currentState.state === "ordered") {
    echo.style.opacity = "0.14";
    echo.style.borderColor = "rgba(205, 222, 255, 0.12)";
  }

  echoLayer.appendChild(echo);

  setTimeout(() => {
    echo.remove();
  }, 1600);
}

function createBloom(x, y) {
  const bloom = document.createElement("div");
  bloom.className = "fragment-echo";
  bloom.style.left = `${x - 40}px`;
  bloom.style.top = `${y - 40}px`;
  bloom.style.width = "80px";
  bloom.style.height = "80px";
  bloom.style.borderRadius = "50%";
  bloom.style.border = "1px solid rgba(255,255,255,0.06)";
  bloom.style.background = "radial-gradient(circle, rgba(160,212,255,0.12), transparent 70%)";
  echoLayer.appendChild(bloom);

  setTimeout(() => bloom.remove(), 1600);
}

function updateMouseInertia() {
  const ease = getResponseEase(currentState.response);
  mouse.x += (mouse.targetX - mouse.x) * ease;
  mouse.y += (mouse.targetY - mouse.y) * ease;
}

function applyState(state) {
  stateLabel.textContent = `state: ${state.state}`;
  applySceneColors(state);
  applyHalos(state);
  applyRibbons(state);
  applyContours(state);
  renderTextFragments(state);
  applyFragmentLayout(state);

  document.body.animate(
    [{ filter: "brightness(1.03)" }, { filter: "brightness(1)" }],
    { duration: 180, easing: "ease-out" }
  );
}

function animate() {
  updateMouseInertia();

  const centerX = viewport.width / 2;
  const centerY = viewport.height / 2;
  const normalizedX = (mouse.x - centerX) / centerX;
  const normalizedY = (mouse.y - centerY) / centerY;

  const mouseDistance = Math.sqrt(
    Math.pow(mouse.x - centerX, 2) + Math.pow(mouse.y - centerY, 2)
  );
  const proximity = 1 - Math.min(mouseDistance / Math.max(centerX, centerY), 1);

  const tiltX = (mouse.y - centerY) * -0.007;
  const tiltY = (mouse.x - centerX) * 0.007;

  const now = performance.now();
  const idleDuration = now - lastMouseMoveTime;

  if (idleDuration > 1800 && currentState.state === "scanning") {
    if (Math.random() > 0.985) {
      createBloom(
        viewport.width * (0.35 + Math.random() * 0.3),
        viewport.height * (0.3 + Math.random() * 0.3)
      );
    }
  }

  scene.style.transform = `
    perspective(1400px)
    rotateX(${tiltX * 0.08}deg)
    rotateY(${tiltY * 0.08}deg)
  `;

  if (currentState.state === "scanning") {
    halosRoot.style.transform = `translate(${normalizedX * 10}px, ${normalizedY * 8}px)`;
  } else {
    halosRoot.style.transform = "translate(0px, 0px)";
  }

  [...document.querySelectorAll(".text-fragment")].forEach((el) => {
    const rect = el.getBoundingClientRect();
    const dx = mouse.x - (rect.left + rect.width / 2);
    const dy = mouse.y - (rect.top + rect.height / 2);
    const dist = Math.sqrt(dx * dx + dy * dy);
    const influence = Math.max(0, 1 - dist / 320);

    el.style.opacity = String(0.12 + influence * 0.34);
    el.style.transform = `translateY(0px) scale(${1 + influence * 0.08})`;
    el.style.letterSpacing = currentState.state === "scanning"
      ? `${0.14 + influence * 0.04}em`
      : "0.14em";
  });

  fragments.forEach((fragment) => {
    let parallaxX = normalizedX * 20;
    let parallaxY = normalizedY * 14;

    const baseX = parseFloat(fragment.dataset.baseX || 0);
    const baseY = parseFloat(fragment.dataset.baseY || 0);

    if (currentState.state === "latent") {
      parallaxX *= 0.45;
      parallaxY *= 0.45;
      fragment.style.filter = "blur(0.9px)";
      fragment.style.borderColor = "";
    }

    if (currentState.state === "scanning") {
      const scanBoost = 1 + proximity * 0.55;
      parallaxX *= scanBoost;
      parallaxY *= scanBoost;
      fragment.style.filter = "blur(0px)";
      fragment.style.borderColor = "";
    }

    if (currentState.state === "ordered") {
      const gridSize = 14;
      parallaxX = Math.round(parallaxX / gridSize) * gridSize;
      parallaxY = Math.round(parallaxY / gridSize) * gridSize;

      fragment.style.filter = "contrast(1.06) saturate(0.9)";
      fragment.style.borderColor = "rgba(205, 222, 255, 0.16)";

      const dx = mouse.x - baseX;
      const dy = mouse.y - baseY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const threshold = 220;

      if (dist < threshold) {
        const angle = Math.atan2(dy, dx);
        const resistance = (1 - dist / threshold) * 14;

        parallaxX -= Math.cos(angle) * resistance;
        parallaxY -= Math.sin(angle) * resistance;
      }

      const returnStrength = 0.12;
      parallaxX *= (1 - returnStrength);
      parallaxY *= (1 - returnStrength);
    }

    updateFragmentTransform(fragment, parallaxX, parallaxY);
  });

  requestAnimationFrame(animate);
}

function cycleState() {
  fragments.forEach(f => createEcho(f));
  currentIndex = (currentIndex + 1) % states.length;
  currentState = states[currentIndex];
  applyState(currentState);
}

window.addEventListener("mousemove", (event) => {
  mouse.targetX = event.clientX;
  mouse.targetY = event.clientY;
  lastMouseMoveTime = performance.now();
});

window.addEventListener("resize", () => {
  viewport.width = window.innerWidth;
  viewport.height = window.innerHeight;
  applyState(currentState);
});

fragments.forEach((fragment) => {
  fragment.addEventListener("mouseenter", () => {
    fragment.style.borderColor = "rgba(205, 222, 255, 0.24)";
    if (Math.random() > 0.6) createEcho(fragment);
  });

  fragment.addEventListener("mouseleave", () => {
    fragment.style.borderColor = "";
  });

  fragment.addEventListener("click", () => {
    createEcho(fragment);
    cycleState();
  });
});

shiftBtn.addEventListener("click", cycleState);

buildEnvironment();
applyState(currentState);
animate();