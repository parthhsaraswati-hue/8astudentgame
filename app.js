const PRIZES = [
  { label: "Prize 1", img: "chrome (1).png", color: "#ff7675" },
  { label: "Prize 2", img: "google (1).png", color: "#74b9ff" },
  {
    label: "Prize 3",
    img: "google-calendar.png",
    color: "#55efc4",
  },
  { label: "Prize 4", img: "google-drive.png", color: "#ffeaa7" },
  { label: "Prize 5", img: "google-play.png", color: "#a29bfe" },
  { label: "Prize 6", img: "communicatio.png", color: "#fdcb6e" },
  { label: "Prize 7", img: "logo.png", color: "#81ecec" },
  { label: "Prize 8", img: "sheets.png", color: "#fab1a0" },
];

const wheelEl = document.getElementById("wheel");
const spinBtn = document.getElementById("spinBtn");
const ariaLive = document.getElementById("aria-live");
const playsCountEl = document.getElementById("playsCount");
const historyListEl = document.getElementById("historyList");
const modal = document.getElementById("modal");
const modalIcon = document.getElementById("modalIcon");
const modalPrize = document.getElementById("modalPrize");
let isSpinning = false;
let currentRotation = 0;
const LS_KEY = "spinwin2";
function getLS() {
  try {
    return (
      JSON.parse(localStorage.getItem(LS_KEY)) || { plays: 0, history: [] }
    );
  } catch {
    return { plays: 0, history: [] };
  }
}
function setLS(d) {
  localStorage.setItem(LS_KEY, JSON.stringify(d));
}
function pushHistory(i) {
  const d = getLS();
  d.history.unshift(i);
  d.history = d.history.slice(0, 10);
  setLS(d);
  renderMeta();
}
function incPlays() {
  const d = getLS();
  d.plays += 1;
  setLS(d);
  renderMeta();
}
function renderMeta() {
  const d = getLS();
  playsCountEl.textContent = d.plays;
  historyListEl.textContent = d.history.join(" • ");
}
renderMeta();
function buildWheel() {
  const size = 500,
    radius = size / 2,
    svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("viewBox", `0 0 ${size} ${size}`);
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", "100%");
  const group = document.createElementNS(svgNS, "g");
  group.setAttribute("transform", `translate(${radius},${radius})`);
  const sliceAngle = 360 / PRIZES.length,
    rOuter = radius - 4,
    rInner = 80;

  for (let i = 0; i < PRIZES.length; i++) {
    const start = ((i * sliceAngle - 90) * Math.PI) / 180,
      end = (((i + 1) * sliceAngle - 90) * Math.PI) / 180,
      x1 = Math.cos(start) * rOuter,
      y1 = Math.sin(start) * rOuter,
      x2 = Math.cos(end) * rOuter,
      y2 = Math.sin(end) * rOuter;
    const largeArc = sliceAngle > 180 ? 1 : 0;
    const pathData = [
      `M ${Math.cos(start) * rInner} ${Math.sin(start) * rInner}`,
      `L ${x1} ${y1}`,
      `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${Math.cos(end) * rInner} ${Math.sin(end) * rInner}`,
      `A ${rInner} ${rInner} 0 ${largeArc} 0 ${Math.cos(start) * rInner} ${
        Math.sin(start) * rInner
      }`,
      "Z",
    ].join(" ");
    const path = document.createElementNS(svgNS, "path");
    path.setAttribute("d", pathData);
    path.setAttribute("fill", PRIZES[i].color || "#ccc");
    group.appendChild(path);

    const mid = (i + 0.5) * sliceAngle - 90,
      tx =
        Math.cos((mid * Math.PI) / 180) * (rInner + (rOuter - rInner) * 0.62),
      ty =
        Math.sin((mid * Math.PI) / 180) * (rInner + (rOuter - rInner) * 0.62);

    const fo = document.createElementNS(svgNS, "foreignObject");
    fo.setAttribute("x", tx - 40);
    fo.setAttribute("y", ty - 40);
    fo.setAttribute("width", 80);
    fo.setAttribute("height", 80);

    const div = document.createElement("div");
    div.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
    div.style.display = "flex";
    div.style.justifyContent = "center";
    div.style.alignItems = "center";

    const img = document.createElement("img");
    img.src = PRIZES[i].img;

    img.style.width = "65px"; // increased size
    img.style.height = "65px"; // increased size
    img.style.objectFit = "contain";

    div.appendChild(img);
    fo.appendChild(div);
    group.appendChild(fo);
  }

  svg.appendChild(group);
  wheelEl.innerHTML = "";
  wheelEl.appendChild(svg);
}

buildWheel();
function weightedIndex(items) {
  const t = items.length;
  return Math.floor(Math.random() * t);
}
function spin() {
  if (isSpinning) return;
  isSpinning = true;
  spinBtn.disabled = true;
  const sliceAngle = 360 / PRIZES.length,
    idx = weightedIndex(PRIZES),
    target = idx * sliceAngle + sliceAngle / 2;
  const normalize = (d) => ((d % 360) + 360) % 360;
  const baseRot = 360 * 3,
    curMod = normalize(currentRotation % 360),
    delta = normalize(360 - target - curMod),
    finalDelta = baseRot + delta + (Math.random() * 8 - 4);
  const dur = 4500,
    start = performance.now(),
    startRot = currentRotation,
    endRot = currentRotation + finalDelta;
  function ease(t) {
    return 1 - Math.pow(1 - t, 3);
  }
  function frame(now) {
    const t = Math.min(1, (now - start) / dur),
      e = ease(t),
      angle = startRot + (endRot - startRot) * e;
    currentRotation = angle;
    wheelEl.style.transform = `rotate(${angle}deg)`;
    if (t < 1) requestAnimationFrame(frame);
    else {
      currentRotation = endRot;
      onEnd(idx);
    }
  }
  requestAnimationFrame(frame);
}
function onEnd(i) {
  isSpinning = false;
  spinBtn.disabled = false;
  const p = PRIZES[i];
  announce("Result: " + p.label);
  incPlays();
  pushHistory(p.label);
  openModal(p);
  fireConfetti();
}
function announce(t) {
  ariaLive.textContent = "";
  setTimeout(() => {
    ariaLive.textContent = t;
  }, 20);
}
function openModal(p) {
  modalPrize.textContent = p.label;
  modalIcon.innerHTML = "";
  const img = document.createElement("img");
  img.src = p.img;

  img.style.width = "80px";
  img.style.height = "80px";
  modalIcon.appendChild(img);
  modal.hidden = false;
}
function closeModal() {
  modal.hidden = true;
}
document.getElementById("closeModal").addEventListener("click", closeModal);
document.getElementById("playAgain").addEventListener("click", () => {
  closeModal();
  spinBtn.focus();
});
const confettiCanvas = document.getElementById("confetti"),
  ctx = confettiCanvas.getContext("2d");
let confettiPieces = [];
function fireConfetti() {
  const w = (confettiCanvas.width = window.innerWidth),
    h = (confettiCanvas.height = window.innerHeight);
  confettiPieces = Array.from({ length: 150 }, () => ({
    x: Math.random() * w,
    y: -20 - Math.random() * h * 0.2,
    vx: (Math.random() - 0.5) * 3,
    vy: 2 + Math.random() * 3,
    size: 5 + Math.random() * 6,
    rot: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.2,
    color: `hsl(${Math.floor(Math.random() * 360)},85%,60%)`,
  }));
  let t = 0;
  function loop() {
    t++;
    ctx.clearRect(0, 0, w, h);
    confettiPieces.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    });
    if (t < 200) requestAnimationFrame(loop);
    else ctx.clearRect(0, 0, w, h);
  }
  loop();
}
window.addEventListener("resize", () => {
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
});
spinBtn.addEventListener("click", spin);
document.addEventListener("keydown", (e) => {
  if (e.code === "Space" || e.code === "Enter") {
    e.preventDefault();
    if (!isSpinning) spin();
  }
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !modal.hidden) {
    closeModal();
  }
});
wheelEl.style.willChange = "transform";
wheelEl.style.transform = "rotate(0deg)";
