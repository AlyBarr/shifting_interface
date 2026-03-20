const fragments = [...document.querySelectorAll(".fragment")];
const stateLabel = document.getElementById("stateLabel");
const shiftBtn = document.getElementById("shiftBtn");

const viewport = {
  width: window.innerWidth,
  height: window.innerHeight,
};

const mouse = {
  x: viewport.width / 2,
  y: viewport.height / 2,
};

const states = [
  {
    state: "curious",
    tension: 0.32,
    flow: "drifting",
    density: "balanced",
    bias: "center",
    response: "gentle",
    drift: 0.58,
    focus: 0.48,
    opacityMode: "layered"
  },
  {
    state: "focused",
    tension: 0.78,
    flow: "tight",
    density: "clustered",
    bias: "right",
    response: "sharp",
    drift: 0.18,
    focus: 0.84,
    opacityMode: "even"
  },
  {
    state: "wandering",
    tension: 0.24,
    flow: "smooth",
    density: "sparse",
    bias: "left",
    response: "delayed",
    drift: 0.7,
    focus: 0.28,
    opacityMode: "fading"
  },
  {
    state: "settled",
    tension: 0.52,
    flow: "smooth",
    density: "balanced",
    bias: "bottom",
    response: "elastic",
    drift: 0.26,
    focus: 0.62,
    opacityMode: "layered"
  },
  {
    state: "quiet",
    tension: 0.15,
    flow: "drifting",
    density: "sparse",
    bias: "bottom",
    response: "delayed",
    drift: 0.82,
    focus: 0.25,
    opacityMode: "fading"
  },
  {
    state: "searching",
    tension: 0.45,
    flow: "smooth",
    density: "balanced",
    bias: "top",
    response: "elastic",
    drift: 0.35,
    focus: 0.78,
    opacityMode: "layered"
  },
  {
    state: "tense",
    tension: 0.85,
    flow: "erratic",
    density: "clustered",
    bias: "right",
    response: "sharp",
    drift: 0.08,
    focus: 0.92,
    opacityMode: "even"
  },
  {
    state: "settled",
    tension: 0.05,
    flow: "tight",
    density: "balanced",
    bias: "center",
    response: "gentle",
    drift: 0.02,
    focus: 0.45,
    opacityMode: "even"
  }
];

let currentIndex = 0;
let currentState = states[currentIndex];

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getBiasOffset(bias) {
  const offset = { x: 0, y: 0 };
  if (bias === "left") offset.x = -140;
  if (bias === "right") offset.x = 140;
  if (bias === "top") offset.y = -110;
  if (bias === "bottom") offset.y = 110;
  return offset;
}

function getFlowMultiplier(flow) {
  if (flow === "tight") return 0.4;
  if (flow === "smooth") return 0.8;
  if (flow === "erratic") return 1.1;
  return 1.0;
}

function getResponseScale(response) {
  if (response === "elastic") return 1.045;
  if (response === "sharp") return 1.02;
  if (response === "delayed") return 1.015;
  return 1.03;
}

function applyState(state) {
  stateLabel.textContent = `state: ${state.state}`;

  const centerX = viewport.width / 2;
  const centerY = viewport.height / 2;
  const bias = getBiasOffset(state.bias);

  const spreadX = state.density === "sparse" ? 300 : state.density === "balanced" ? 185 : 112;
  const spreadY = state.density === "sparse" ? 220 : state.density === "balanced" ? 132 : 84;

  const primaryScale = lerp(0.97, 1.14, state.focus);
  const secondaryScale = lerp(0.9, 1.02, state.focus * 0.75);
  const baseOpacity = state.opacityMode === "even" ? 0.88 : state.opacityMode === "layered" ? 0.8 : 0.68;

  fragments.forEach((fragment, index) => {
    const row = index < 3 ? 0 : 1;
    const col = index < 3 ? index : index - 3 + 0.5;

    const x = centerX + bias.x + (col - 1) * spreadX;
    const y = centerY + bias.y + (row - 0.5) * spreadY;
    const isPrimary = index === 2;
    const scale = isPrimary ? primaryScale : secondaryScale;
    const z = Math.round((index - 2) * 34 + state.focus * 44);
    const opacity = baseOpacity - index * 0.075;

    fragment.dataset.baseX = x;
    fragment.dataset.baseY = y;
    fragment.dataset.scale = scale;
    fragment.dataset.z = z;
    fragment.dataset.drift = state.drift;
    fragment.dataset.flow = state.flow;
    fragment.dataset.response = state.response;

    fragment.style.opacity = String(
      state.opacityMode === "fading" && index > 2
        ? clamp(0.58 - index * 0.09, 0.24, 0.7)
        : clamp(opacity, 0.35, 0.92)
    );

    if (state.tension > 0.65) {
      fragment.style.width = isPrimary ? "258px" : "220px";
      fragment.style.height = isPrimary ? "160px" : "136px";
    } else if (state.tension < 0.35) {
      fragment.style.width = isPrimary ? "302px" : "248px";
      fragment.style.height = isPrimary ? "184px" : "152px";
    } else {
      fragment.style.width = isPrimary ? "282px" : "236px";
      fragment.style.height = isPrimary ? "172px" : "146px";
    }

    updateFragmentTransform(fragment, 0, 0);
  });
}

function updateFragmentTransform(fragment, parallaxX, parallaxY) {
  const baseX = parseFloat(fragment.dataset.baseX || 0);
  const baseY = parseFloat(fragment.dataset.baseY || 0);
  const scale = parseFloat(fragment.dataset.scale || 1);
  const z = parseFloat(fragment.dataset.z || 0);
  const depth = parseFloat(fragment.dataset.depth || 0.5);
  const drift = parseFloat(fragment.dataset.drift || 0.25);
  const flow = fragment.dataset.flow || "smooth";

  const flowMultiplier = getFlowMultiplier(flow);
  const time = performance.now() * 0.00023;

  const floatX = Math.sin(time * flowMultiplier + depth * 9.5) * 18 * drift;
  const floatY = Math.cos(time * 1.25 * flowMultiplier + depth * 12) * 14 * drift;

  fragment.style.transform = `
    translate3d(
      ${baseX - fragment.offsetWidth / 2 + parallaxX * depth + floatX}px,
      ${baseY - fragment.offsetHeight / 2 + parallaxY * depth + floatY}px,
      ${z}px
    )
    scale(${scale})
  `;
}

function animate() {
  const centerX = viewport.width / 2;
  const centerY = viewport.height / 2;
  const normalizedX = (mouse.x - centerX) / centerX;
  const normalizedY = (mouse.y - centerY) / centerY;

  fragments.forEach((fragment) => {
    const parallaxX = normalizedX * 22;
    const parallaxY = normalizedY * 16;
    updateFragmentTransform(fragment, parallaxX, parallaxY);
  });

  requestAnimationFrame(animate);
}

function cycleState() {
  currentIndex = (currentIndex + 1) % states.length;
  currentState = states[currentIndex];
  applyState(currentState);
}

window.addEventListener("mousemove", (event) => {
  mouse.x = event.clientX;
  mouse.y = event.clientY;
});

window.addEventListener("resize", () => {
  viewport.width = window.innerWidth;
  viewport.height = window.innerHeight;
  applyState(currentState);
});

fragments.forEach((fragment) => {
  fragment.addEventListener("mouseenter", () => {
    const response = fragment.dataset.response || "gentle";
    const hoverScale = getResponseScale(response);
    fragment.style.transform += ` scale(${hoverScale})`;
  });

  fragment.addEventListener("mouseleave", () => {
    updateFragmentTransform(fragment, 0, 0);
  });

  fragment.addEventListener("click", cycleState);
});

shiftBtn.addEventListener("click", cycleState);

applyState(currentState);
animate();

/*
  Replace one of the sample states with Gemini output using the schema below:

  {
    "state": "curious",
    "tension": 0.42,
    "flow": "smooth",
    "density": "balanced",
    "bias": "center",
    "response": "gentle",
    "drift": 0.45,
    "focus": 0.6,
    "opacityMode": "layered"
  }

  Translation mapping:
  - tension: spacing + panel sizing
  - flow: ambient movement feel
  - density: cluster or spread
  - bias: composition direction
  - response: hover feel
  - drift: floating amount
  - focus: primary panel emphasis
  - opacityMode: transparency relationships
*/
