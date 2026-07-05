/* ════════════════════════════════════════════════════════════════
   DANILO OJEDA — a virtual-scroll camera flight in four acts
   (skyline → street → the work → signal), after the monolith teardown.
   The scrollbar does not exist; progress is scrubbed 0 → 1 and the
   Three.js city is the stage the camera flies through.
   ════════════════════════════════════════════════════════════════ */

import * as THREE from "three";
import "./style.css";

/* ── utils ───────────────────────────────────────────────────── */
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const map = (v: number, a: number, b: number, c: number, d: number) =>
  c + (d - c) * clamp((v - a) / (b - a), 0, 1);
const smooth = (t: number) => t * t * (3 - 2 * t);
const $ = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector(s) as T;
const $$ = <T extends HTMLElement = HTMLElement>(s: string) => [...document.querySelectorAll(s)] as T[];

const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
const TOUCH = matchMedia("(pointer: coarse)").matches;
const MOBILE = matchMedia("(max-width: 760px)");
if (TOUCH) document.body.classList.add("touch");

/* ── scramble text engine ────────────────────────────────────── */
const GLYPHS = "█▓▒░<>/\\|=+*#0123456789ABCDEFX";
class Scramble {
  el: HTMLElement;
  original: string;
  frame = 0;
  constructor(el: HTMLElement) {
    this.el = el;
    this.original = el.textContent ?? "";
  }
  play(duration = 700, delay = 0) {
    cancelAnimationFrame(this.frame);
    const text = this.original, n = text.length;
    const start = performance.now() + delay;
    this.el.style.visibility = "hidden";
    const tick = (now: number) => {
      if (now < start) { this.frame = requestAnimationFrame(tick); return; }
      this.el.style.visibility = "";
      const t = clamp((now - start) / duration, 0, 1);
      const resolved = Math.floor(t * n);
      let out = text.slice(0, resolved);
      for (let i = resolved; i < n; i++) {
        const c = text[i];
        out += (c === " " || c === "\n") ? c
          : (Math.random() < 0.65 ? GLYPHS[(Math.random() * GLYPHS.length) | 0] : c);
      }
      this.el.textContent = out;
      if (t < 1) this.frame = requestAnimationFrame(tick);
      else this.el.textContent = text;
    };
    this.frame = requestAnimationFrame(tick);
  }
  swap(newText: string, duration = 450) {
    this.original = newText;
    this.play(duration);
  }
}
const scrambles = new Map<HTMLElement, Scramble>();
const getScramble = (el: HTMLElement) => {
  if (!scrambles.has(el)) scrambles.set(el, new Scramble(el));
  return scrambles.get(el)!;
};

/* ── audio engine (fully generated — city hum, drone, ticks) ─── */
const Sound = {
  ctx: null as AudioContext | null,
  master: null as GainNode | null,
  on: false,
  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    const ctx = (this.ctx = new AC());
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(ctx.destination);

    // wind between towers: looped noise through a wandering lowpass
    const len = ctx.sampleRate * 4;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {                 // brown-ish noise
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.2;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf; src.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.value = 380; lp.Q.value = 0.4;
    const windGain = ctx.createGain(); windGain.gain.value = 0.5;
    src.connect(lp).connect(windGain).connect(this.master);
    src.start();
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.07;
    const lfoAmp = ctx.createGain(); lfoAmp.gain.value = 170;
    lfo.connect(lfoAmp).connect(lp.frequency);
    lfo.start();

    // drone: deep detuned sines — the grid humming
    ([[55, 0.05], [55.4, 0.03], [82.41, 0.022]] as const).forEach(([f, g]) => {
      const o = ctx.createOscillator(); o.type = "sine"; o.frequency.value = f;
      const og = ctx.createGain(); og.gain.value = g;
      const olp = ctx.createBiquadFilter(); olp.type = "lowpass"; olp.frequency.value = 220;
      o.connect(og).connect(olp).connect(this.master!);
      o.start();
    });
  },
  toggle() {
    this.init();
    if (!this.ctx || !this.master) return false;
    this.ctx.resume();
    this.on = !this.on;
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.linearRampToValueAtTime(this.on ? 0.55 : 0, t + 0.9);
    return this.on;
  },
  tick() {
    if (!this.ctx || !this.master || !this.on) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator(); o.type = "square"; o.frequency.value = 1320;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.04, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
    o.connect(g).connect(this.master);
    o.start(t); o.stop(t + 0.09);
  },
  whoosh() {
    if (!this.ctx || !this.master || !this.on) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const len = ctx.sampleRate * 0.5;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(); src.buffer = buf;
    const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 1.1;
    bp.frequency.setValueAtTime(180, t);
    bp.frequency.exponentialRampToValueAtTime(1900, t + 0.42);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.32, t + 0.07);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    src.connect(bp).connect(g).connect(this.master);
    src.start(t); src.stop(t + 0.55);
  },
};

/* ── virtual scroll ──────────────────────────────────────────── */
const Scroll = {
  target: 0, value: 0, velocity: 0, enabled: false,
  attach() {
    addEventListener("wheel", (e) => {
      if (!this.enabled) return;
      e.preventDefault();
      this.target = clamp(this.target + e.deltaY * 0.00021, 0, 1);
    }, { passive: false });

    let touchY: number | null = null;
    addEventListener("touchstart", (e) => { touchY = e.touches[0].clientY; }, { passive: true });
    addEventListener("touchmove", (e) => {
      if (!this.enabled || touchY == null) return;
      const y = e.touches[0].clientY;
      this.target = clamp(this.target + (touchY - y) * 0.0011, 0, 1);
      touchY = y;
    }, { passive: true });

    addEventListener("keydown", (e) => {
      if (!this.enabled) return;
      const step = ({ ArrowDown: 0.03, PageDown: 0.12, " ": 0.12, ArrowUp: -0.03, PageUp: -0.12, Home: -2, End: 2 } as Record<string, number>)[e.key];
      if (step) { e.preventDefault(); this.target = clamp(this.target + step, 0, 1); }
    });
  },
  update() {
    const prev = this.value;
    this.value += (this.target - this.value) * (REDUCED ? 0.14 : 0.065);
    this.velocity = this.value - prev;
  },
};

/* ── pointer (parallax + cursor) ─────────────────────────────── */
const Pointer = {
  x: innerWidth / 2, y: innerHeight / 2, px: 0, py: 0,
  cx: innerWidth / 2, cy: innerHeight / 2,
  attach() {
    addEventListener("mousemove", (e) => {
      this.x = e.clientX; this.y = e.clientY;
      this.px = (e.clientX / innerWidth - 0.5) * 2;
      this.py = (e.clientY / innerHeight - 0.5) * 2;
      $("#cursor").style.opacity = "1";
    });
    const cursor = $("#cursor");
    document.addEventListener("mouseover", (e) => {
      cursor.classList.toggle("on-hover", !!(e.target as HTMLElement).closest("[data-hover], a, button"));
    });
  },
  update() {
    this.cx = lerp(this.cx, this.x, 0.18);
    this.cy = lerp(this.cy, this.y, 0.18);
    $("#cursor").style.transform = `translate3d(${this.cx.toFixed(1)}px, ${this.cy.toFixed(1)}px, 0)`;
  },
};

/* ── the city stage (Three.js) ───────────────────────────────── */
/* Camera keyframes: p → position / lookAt, blended per segment.  */
const FLIGHT: { p: number; pos: [number, number, number]; look: [number, number, number] }[] = [
  { p: 0.00, pos: [0, 26, 64],   look: [0, 10, -16] },   // aerial skyline
  { p: 0.26, pos: [0, 15, 42],   look: [0, 8, -18] },    // diving toward the seam
  { p: 0.34, pos: [0, 5, 26],    look: [0, 5.5, -20] },  // entering the canyon
  { p: 0.56, pos: [0, 3.2, -2],  look: [0, 6, -34] },    // deep in the street
  { p: 0.64, pos: [2.5, 6, -8],  look: [10, 15, -24] },  // turning to the spire
  { p: 0.78, pos: [3, 13, -11],  look: [10, 21, -24] },  // riding up the rings
  { p: 0.90, pos: [-2, 28, 4],   look: [7, 26, -26] },   // lifting off
  { p: 1.00, pos: [-6, 42, 22],  look: [5, 34, -30] },   // among the stars
];

const City = {
  renderer: null as THREE.WebGLRenderer | null,
  scene: null as THREE.Scene | null,
  camera: null as THREE.PerspectiveCamera | null,
  fog: null as THREE.FogExp2 | null,
  cars: [] as THREE.Mesh[],
  stars: null as THREE.Points | null,
  camY: 26,

  build() {
    const mount = $("#city-mount");
    const scene = (this.scene = new THREE.Scene());
    this.fog = new THREE.FogExp2(0x050403, 0.016);
    scene.fog = this.fog;

    const camera = (this.camera = new THREE.PerspectiveCamera(46, 1, 0.1, 300));
    camera.position.set(0, 26, 64);

    const renderer = (this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }));
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x050403, 1);
    mount.appendChild(renderer.domElement);

    const city = new THREE.Group();
    scene.add(city);

    scene.add(new THREE.AmbientLight(0x3a2014, 4.2));
    const sun = new THREE.DirectionalLight(0xffb36b, 4.5);
    sun.position.set(-14, 28, 20);
    scene.add(sun);
    const glowA = new THREE.PointLight(0xff6a2f, 210, 130);
    glowA.position.set(-28, 22, 8);
    scene.add(glowA);
    const glowB = new THREE.PointLight(0x10b981, 140, 120);
    glowB.position.set(28, 18, -24);
    scene.add(glowB);

    const buildingMat = new THREE.MeshStandardMaterial({
      color: 0x16110d, roughness: 0.58, metalness: 0.42,
      emissive: 0x140803, emissiveIntensity: 0.48,
    });
    const warmWindow = new THREE.MeshBasicMaterial({ color: 0xff8b3d });
    const greenWindow = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x0a0807, roughness: 0.36, metalness: 0.55,
      emissive: 0x100905, emissiveIntensity: 0.45,
    });
    const laneMat = new THREE.MeshBasicMaterial({ color: 0xd96332 });

    for (let x = -7; x <= 7; x += 1) {
      for (let z = -9; z <= 6; z += 1) {
        if (Math.abs(x) < 2 && z > -7) continue;         // keep the boulevard clear
        const hash = Math.abs(Math.sin(x * 12.9898 + z * 78.233));
        const height = 5 + hash * 27;
        const width = 1.15 + (hash % 0.45);
        const depth = 1.1 + ((hash * 1.7) % 0.5);
        const building = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), buildingMat);
        building.position.set(x * 3.1, height / 2 - 4, z * 3.4);
        city.add(building);

        const windowRows = Math.floor(height / 2.2);
        for (let row = 0; row < windowRows; row += 1) {
          if ((row + x + z) % 3 === 0) continue;
          const win = new THREE.Mesh(
            new THREE.BoxGeometry(width * 0.78, 0.08, 0.018),
            (row + x) % 5 === 0 ? greenWindow : warmWindow,
          );
          win.position.set(building.position.x, row * 1.8 + 0.6, building.position.z + depth / 2 + 0.011);
          city.add(win);
        }
      }
    }

    const boulevard = new THREE.Mesh(new THREE.BoxGeometry(8, 0.12, 90), roadMat);
    boulevard.position.set(0, -3.92, -10);
    city.add(boulevard);
    for (const x of [-3.1, 3.1]) {
      const lane = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 86), laneMat);
      lane.position.set(x, -3.82, -10);
      city.add(lane);
    }

    const spireMat = new THREE.MeshStandardMaterial({
      color: 0x1c120d, roughness: 0.32, metalness: 0.72,
      emissive: 0x331006, emissiveIntensity: 0.85,
    });
    const spire = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 3.4, 48, 7), spireMat);
    spire.position.set(10, 20, -24);
    spire.rotation.y = 0.32;
    city.add(spire);

    const ringMat = new THREE.MeshBasicMaterial({ color: 0xff6a2f, transparent: true, opacity: 0.8 });
    for (let i = 0; i < 3; i += 1) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(8 + i * 2.4, 0.035, 8, 96), ringMat);
      ring.position.set(10, 13 + i * 7, -24);
      ring.rotation.x = Math.PI / 2;
      ring.rotation.z = i * 0.38;
      city.add(ring);
    }

    for (const y of [6, 12, 18]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(54, 0.08, 0.08), greenWindow);
      rail.position.set(0, y, -18 + y * 0.7);
      rail.rotation.y = -0.18;
      city.add(rail);
    }

    const carGeo = new THREE.BoxGeometry(0.9, 0.22, 0.3);
    for (let i = 0; i < 22; i += 1) {
      const car = new THREE.Mesh(carGeo, i % 3 === 0 ? greenWindow : warmWindow);
      car.position.set((i % 2 ? -1 : 1) * (4 + (i % 5) * 2.1), 5 + (i % 4) * 3.6, -42 + i * 4.8);
      car.userData.speed = 0.08 + (i % 5) * 0.018;
      this.cars.push(car);
      city.add(car);
    }

    const starsGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(720);
    for (let i = 0; i < starPositions.length; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 120;
      starPositions[i + 1] = 18 + Math.random() * 60;
      starPositions[i + 2] = -90 + Math.random() * 110;
    }
    starsGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    this.stars = new THREE.Points(
      starsGeo,
      new THREE.PointsMaterial({ color: 0xffb36b, size: 0.05, transparent: true, opacity: 0.55 }),
    );
    scene.add(this.stars);

    this.resize();
    addEventListener("resize", () => this.resize());
  },

  resize() {
    if (!this.renderer || !this.camera) return;
    const mount = $("#city-mount");
    const w = mount.clientWidth || innerWidth;
    const h = mount.clientHeight || innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  },

  /* p: scroll progress · introBack: pre-enter dolly hold (0..1) */
  render(p: number, frame: number, introBack: number) {
    if (!this.renderer || !this.scene || !this.camera) return;

    let i = 0;
    while (i < FLIGHT.length - 2 && p > FLIGHT[i + 1].p) i++;
    const a = FLIGHT[i], b = FLIGHT[i + 1];
    const t = smooth(map(p, a.p, b.p, 0, 1));

    const pos = new THREE.Vector3(
      lerp(a.pos[0], b.pos[0], t),
      lerp(a.pos[1], b.pos[1], t),
      lerp(a.pos[2], b.pos[2], t),
    );
    const look = new THREE.Vector3(
      lerp(a.look[0], b.look[0], t),
      lerp(a.look[1], b.look[1], t),
      lerp(a.look[2], b.look[2], t),
    );

    // gentle drift + pointer parallax + intro dolly
    pos.x += Math.sin(frame * 0.28) * 0.6 + Pointer.px * 1.4;
    pos.y += Math.cos(frame * 0.22) * 0.3 - Pointer.py * 0.8;
    pos.z += introBack * 10;
    look.x += Pointer.px * 4;
    look.y -= Pointer.py * 2;

    this.camera.position.copy(pos);
    this.camera.lookAt(look);
    this.camY = pos.y;

    // haze thickens in the canyon, thins among the stars
    if (this.fog) {
      this.fog.density =
        0.014 + Math.sin(clamp(map(p, 0.3, 0.6, 0, 1), 0, 1) * Math.PI) * 0.014 - map(p, 0.78, 1, 0, 0.006);
    }

    this.cars.forEach((car, index) => {
      car.position.z += car.userData.speed;
      car.position.y += Math.sin(frame * 3 + index) * 0.004;
      if (car.position.z > 34) car.position.z = -48;
    });
    if (this.stars) this.stars.rotation.y += 0.0008;

    this.renderer.render(this.scene, this.camera);
  },
};

/* ── transition spikes (chromatic aberration + warm flash) ───── */
const stage = $("#stage");
const whiteout = $("#whiteout");
const offsets = $$<any>("#aberration feOffset");
let spikeT = -1;
let spikeStrength = 1;

function spike(strength = 1) {
  if (REDUCED) return;
  spikeT = performance.now();
  spikeStrength = strength;
  stage.style.filter = "url(#aberration)";
  stage.classList.add("aberrate");
  $$("[data-scramble]").forEach((el) => {
    const beat = el.closest(".beat") as HTMLElement | null;
    if ((beat && parseFloat(beat.style.opacity || "0") > 0.2) || el.closest("#hud")) {
      el.classList.remove("glitching"); void el.offsetWidth; el.classList.add("glitching");
    }
  });
  Sound.whoosh();
}

function updateSpike(now: number) {
  if (spikeT < 0) return;
  const t = (now - spikeT) / 520;
  if (t >= 1) {
    spikeT = -1;
    stage.style.filter = "";
    stage.classList.remove("aberrate");
    whiteout.style.opacity = "0";
    return;
  }
  const k = Math.sin(Math.PI * clamp(t, 0, 1)) * spikeStrength;
  const dx = 16 * k;
  offsets[0].setAttribute("dx", dx.toFixed(1));
  offsets[2].setAttribute("dx", (-dx).toFixed(1));
  whiteout.style.opacity = (0.92 * k).toFixed(3);
  whiteout.style.backdropFilter = `blur(${(10 * k).toFixed(1)}px)`;
}

/* ── timeline: beat windows, HUD per act ─────────────────────── */
/* skyline [0,.26] · street [.26,.56] · the work [.56,.78] · signal [.78,1] */
type Win = { el: HTMLElement; in0: number; in1: number; out0: number; out1: number; seen: boolean; hasLink: boolean };
const beat = (name: string, in0: number, in1: number, out0: number, out1: number): Win => {
  const el = $(`[data-beat="${name}"]`);
  return { el, in0, in1, out0, out1, seen: false, hasLink: !!el.querySelector("a") };
};
const beats: Record<string, Win> = {
  hero:   beat("hero",   -1,    -1,    0.06,  0.12),
  within: beat("within",  0.30,  0.34,  0.46,  0.50),
  a1:     beat("a1",      0.565, 0.585, 0.625, 0.645),
  a2:     beat("a2",      0.645, 0.665, 0.705, 0.72),
  a3:     beat("a3",      0.72,  0.74,  0.77,  0.785),
  finale: beat("finale",  0.82,  0.87,  2,     3),
};
beats.hero.seen = true;            // scrambled manually at the enter gate

const boundaries = [
  { at: 0.26,  fired: 0, strength: 1 },     // skyline → street
  { at: 0.56,  fired: 0, strength: 0.9 },   // street → the work
  { at: 0.78,  fired: 0, strength: 1 },     // the work → signal
  { at: 0.645, fired: 0, strength: 0.35 },  // artifact 1 → 2 (micro)
  { at: 0.7185, fired: 0, strength: 0.35 }, // artifact 2 → 3 (micro)
];

const hudTR = $(".hud-tr");
const callouts = $("#callouts");
const glowVignette = $("#glow-vignette");
const hintEl = $("#scroll-hint");
const elevVal = $("#elev-val");
let hintMode = 0;     // 0 = enter the city · 1 = end of transmission
let introT = -1;      // hero un-zoom after the gate

function winOpacity(w: { in0: number; in1: number; out0: number; out1: number }, p: number) {
  const fadeIn = w.in1 <= w.in0 ? 1 : map(p, w.in0, w.in1, 0, 1);
  const fadeOut = map(p, w.out0, w.out1, 1, 0);
  return smooth(clamp(Math.min(fadeIn, fadeOut), 0, 1));
}

function updateTimeline(now: number) {
  const p = Scroll.value;

  // intro un-zoom (dolly-back 1 → 0 over 1.7s after enter)
  let introBack = 0;
  if (introT > 0) {
    const t = clamp((now - introT) / 1700, 0, 1);
    introBack = Math.pow(1 - t, 3);
    if (t >= 1) introT = -1;
  } else if (introT === -2) introBack = 1;

  City.render(p, now * 0.001, introBack);

  // beats
  for (const key in beats) {
    const b = beats[key];
    const o = winOpacity(b, p);
    b.el.style.opacity = o.toFixed(3);
    b.el.style.pointerEvents = b.hasLink && o > 0.5 ? "auto" : "none";
    const drift = map(p, Math.max(b.in0, 0), b.out1, 14, -14);
    const centered = key === "within" || key === "finale";
    const base = centered
      ? "translate(-50%, -50%)"
      : b.el.classList.contains("beat-artifact") && MOBILE.matches
        ? "translate(50%, -50%)"
        : "translateY(-50%)";
    b.el.style.transform = `${base} translateY(${drift.toFixed(1)}px)`;
    if (o > 0.35 && !b.seen) {
      b.seen = true;
      b.el.querySelectorAll<HTMLElement>("[data-scramble]").forEach((el, i) => getScramble(el).play(650, i * 90));
    } else if (o < 0.02 && b.seen) b.seen = false;
  }

  // act-aware HUD
  hudTR.style.opacity = map(p, 0.1, 0.2, 1, 0).toFixed(3);
  callouts.style.opacity = (Scroll.enabled ? map(p, 0.12, 0.2, 1, 0) : 0).toFixed(3);
  glowVignette.style.opacity = (Math.sin(clamp(map(p, 0.34, 0.78, 0, 1), 0, 1) * Math.PI) * 0.85).toFixed(3);

  // scroll hint swaps to end-of-transmission near the bottom
  if (p > 0.9 && hintMode === 0) { hintMode = 1; getScramble(hintEl).swap("// End of transmission."); }
  else if (p < 0.85 && hintMode === 1) { hintMode = 0; getScramble(hintEl).swap("Scroll down to enter the city."); }
  hintEl.style.opacity = p > 0.04 && p < 0.9 ? "0.45" : "1";

  // elevation meter rides the camera
  elevVal.textContent = `+${String(Math.round(City.camY * 8)).padStart(4, "0")}M`;

  // transition spikes (both directions)
  for (const b of boundaries) {
    const side = p > b.at ? 1 : -1;
    if (b.fired === 0) b.fired = side;
    else if (side !== b.fired) { b.fired = side; spike(b.strength); }
  }
}

/* ── particles: embers everywhere · swarm in the signal ──────── */
const fx = $<HTMLCanvasElement>("#fx");
const fctx = fx.getContext("2d")!;
let W = 0, H = 0, DPR = 1;

function resizeFx() {
  DPR = Math.min(devicePixelRatio || 1, 2);
  W = fx.width = innerWidth * DPR;
  H = fx.height = innerHeight * DPR;
  fx.style.width = innerWidth + "px";
  fx.style.height = innerHeight + "px";
}
addEventListener("resize", resizeFx);
resizeFx();

const EMBER_COLORS = ["#ffb36b", "#ffb36b", "#ffb36b", "#ff8b3d", "#7ce3bd"];
const embers = Array.from({ length: TOUCH ? 70 : 130 }, (_, i) => ({
  x: Math.random(), y: Math.random(),
  z: 0.3 + Math.random() * 0.7,                      // depth band
  r: 0.5 + Math.random() * 1.6,
  vy: 0.00012 + Math.random() * 0.00028,
  ph: Math.random() * Math.PI * 2,
  c: EMBER_COLORS[i % EMBER_COLORS.length],
}));

/* swarm — particles seeking shape targets, tinted by speed */
const SWARM_N = TOUCH ? 380 : 760;
const swarm = Array.from({ length: SWARM_N }, () => ({
  x: Math.random(), y: Math.random(),
  vx: 0, vy: 0, t: Math.random() * Math.PI * 2,
}));

function shapePoints(kind: string) {
  const pts: [number, number][] = [];
  const n = SWARM_N;
  for (let i = 0; i < n; i++) {
    const t = i / n;
    let x = 0, y = 0;
    if (kind === "slab") {              // the tower silhouette
      const u = i % 4, v = t * Math.PI * 2;
      if (u < 2) { x = (u === 0 ? -1 : 1) * 0.16; y = ((t * 2) % 1 - 0.5) * 1.0; }
      else { y = (u === 2 ? -1 : 1) * 0.5; x = ((t * 2) % 1 - 0.5) * 0.32; }
      x += Math.sin(v * 3) * 0.004;
    } else if (kind === "cross") {
      const arm = i % 2 ? 1 : -1;
      const d = (t - 0.5) * 1.1;
      x = d; y = d * arm;
    } else if (kind === "delta") {
      const e = i % 3, u = (t * 3) % 1;
      const A: [number, number] = [0, -0.52], B: [number, number] = [-0.5, 0.42], C: [number, number] = [0.5, 0.42];
      const [p1, p2] = e === 0 ? [A, B] : e === 1 ? [B, C] : [C, A];
      x = lerp(p1[0], p2[0], u); y = lerp(p1[1], p2[1], u);
    } else {                            // ring
      const a = t * Math.PI * 2;
      const rr = 0.42 + (i % 5 === 0 ? 0.06 : 0);
      x = Math.cos(a) * rr * 1.15; y = Math.sin(a) * rr;
    }
    pts.push([x, y]);
  }
  return pts;
}
const shapes: Record<string, [number, number][]> = {
  slab: shapePoints("slab"), cross: shapePoints("cross"),
  delta: shapePoints("delta"), ring: shapePoints("ring"),
};
let activeShape = "slab";

const COOL = [70, 199, 155], WARMC = [255, 179, 107];

function drawParticles() {
  fctx.clearRect(0, 0, W, H);
  const p = Scroll.value;
  const speedMul = 1 + Math.abs(Scroll.velocity) * 260;

  // embers drift up from the streets
  fctx.globalCompositeOperation = "source-over";
  const emberAlpha = map(p, 0.735, 0.8, 1, 0.25);     // calmer in the signal
  for (const f of embers) {
    f.y -= f.vy * f.z * speedMul * (REDUCED ? 0.5 : 1);
    f.ph += 0.006;
    if (f.y < -0.02) { f.y = 1.02; f.x = Math.random(); }
    const x = (f.x + Math.sin(f.ph) * 0.012 * f.z - Pointer.px * 0.012 * f.z) * W;
    const y = f.y * H;
    fctx.globalAlpha = (0.20 + f.z * 0.4) * emberAlpha;
    fctx.fillStyle = f.c;
    fctx.beginPath();
    fctx.arc(x, y, f.r * f.z * DPR, 0, 7);
    fctx.fill();
  }

  // swarm (signal act only)
  const swarmK = smooth(map(p, 0.76, 0.84, 0, 1));
  if (swarmK > 0.001) {
    fctx.globalCompositeOperation = "lighter";
    const cx = 0.5 * W, cy = 0.40 * H;
    const sc = Math.min(W, H) * 0.42;
    const targets = shapes[activeShape];
    for (let i = 0; i < SWARM_N; i++) {
      const s = swarm[i], tg = targets[i];
      s.t += 0.016;
      const idleX = 0.5 + Math.cos(s.t + i) * (0.18 + (i % 7) * 0.012);
      const idleY = 0.42 + Math.sin(s.t * 0.9 + i * 1.7) * (0.13 + (i % 5) * 0.01);
      const txp = lerp(idleX * W, cx + tg[0] * sc, swarmK);
      const typ = lerp(idleY * H, cy + tg[1] * sc, swarmK);
      const ax = (txp - s.x) * 0.012, ay = (typ - s.y) * 0.012;
      s.vx = (s.vx + ax) * 0.9;
      s.vy = (s.vy + ay) * 0.9;
      s.x += s.vx; s.y += s.vy;
      const sp = clamp(Math.hypot(s.vx, s.vy) / (9 * DPR), 0, 1);
      const r = lerp(COOL[0], WARMC[0], sp) | 0,
            g = lerp(COOL[1], WARMC[1], sp) | 0,
            b2 = lerp(COOL[2], WARMC[2], sp) | 0;
      fctx.globalAlpha = swarmK * (0.25 + sp * 0.65);
      fctx.fillStyle = `rgb(${r},${g},${b2})`;
      fctx.beginPath();
      fctx.arc(s.x, s.y, (1 + sp * 1.6) * DPR, 0, 7);
      fctx.fill();
    }
  }
  fctx.globalAlpha = 1;
}

/* swarm reacts to the finale links */
$$(".finale-links a").forEach((a) => {
  a.addEventListener("mouseenter", () => {
    activeShape = a.dataset.shape || "slab";
    getScramble(a).play(380);
    Sound.tick();
  });
  a.addEventListener("mouseleave", () => { activeShape = "slab"; });
});
$$("[data-rail]").forEach((a) => {
  a.addEventListener("mouseenter", () => Sound.tick());
});

/* ── telemetry ticker ────────────────────────────────────────── */
const co1 = $("#co-1"), co2 = $("#co-2"), sig = $("#sig-val"),
      leads = $("#co-leads"), actv = $("#co-actv");
let calls = 42, score = 7.05;
setInterval(() => {
  if (!Scroll.enabled) return;
  calls = clamp(calls + ((Math.random() * 5) | 0) - 2, 18, 96);
  score = clamp(score + (Math.random() - 0.5) * 0.2, 5, 9.9);
  co1.textContent = `CALLS: ${calls}`;
  co2.textContent = `SCORE: ${score.toFixed(2)}`;
  sig.textContent = `${(99.9 + Math.random() * 0.09).toFixed(2)}%`;
  if (Math.random() < 0.12) leads.textContent = String(80 + ((Math.random() * 9) | 0));
  if (Math.random() < 0.07) actv.textContent = String(1 + ((Math.random() * 3) | 0));
}, 460);

/* ── sound toggle ────────────────────────────────────────────── */
$("#sound-toggle").addEventListener("click", function (this: HTMLElement) {
  const on = Sound.toggle();
  this.setAttribute("aria-pressed", String(on));
  getScramble(this).swap(`(♪) Sound: ${on ? "ON" : "OFF"}`);
});

/* ── boot: preload → gate → enter ────────────────────────────── */
const loaderEl = $("#loader"), countEl = $("#loader-count"),
      barEl = $("#loader-bar-fill"), statusEl = $("#loader-status"),
      enterBtn = $("#loader-enter");

const STATUS_LINES = [
  "// booting voice agents…",
  "// scraping buyer intent…",
  "// syncing the CRM…",
  "// wiring the follow-up…",
  "// listening…",
];
let statusIdx = 0;
const statusTimer = setInterval(() => {
  statusIdx = (statusIdx + 1) % STATUS_LINES.length;
  statusEl.textContent = STATUS_LINES[statusIdx];
}, 1400);

type LoadItem = { weight: number; done: number };
const loadItems: LoadItem[] = [];
const addLoad = (weight: number) => { const it = { weight, done: 0 }; loadItems.push(it); return it; };
const loadProgress = () => {
  let total = 0, done = 0;
  for (const it of loadItems) { total += it.weight; done += it.done * it.weight; }
  return total ? done / total : 1;
};

let shown = 0, realDone = false, gateReady = false;

function loaderTick() {
  const target = loadProgress() * 100;
  shown = Math.min(shown + Math.max(0.9, (target - shown) * 0.08), target);
  countEl.textContent = String(Math.floor(shown)).padStart(3, "0");
  barEl.style.transform = `scaleX(${(shown / 100).toFixed(3)})`;
  if (shown >= 99.4 && realDone && !gateReady) {
    gateReady = true;
    clearInterval(statusTimer);
    countEl.textContent = "100";
    barEl.style.transform = "scaleX(1)";
    statusEl.textContent = "// the city is awake.";
    loaderEl.classList.add("ready");
  }
  if (!gateReady) requestAnimationFrame(loaderTick);
}

async function preload() {
  const fontItem = addLoad(1);
  document.fonts.ready.then(() => { fontItem.done = 1; });

  const buildItem = addLoad(2);
  City.build();
  buildItem.done = 1;

  // warm the pipeline: render the first frames so the gate opens onto a live city
  const warmItem = addLoad(3);
  await new Promise<void>((resolve) => {
    let n = 0;
    const step = () => {
      City.render(0, n * 0.016, 1);
      warmItem.done = ++n / 24;
      if (n < 24) requestAnimationFrame(step);
      else resolve();
    };
    requestAnimationFrame(step);
  });

  await document.fonts.ready.catch(() => {});
  realDone = true;
}

function enter() {
  if (!gateReady) return;
  gateReady = false;
  Sound.init();
  if (Sound.ctx && !Sound.on) {        // sound starts ON — the toggle says so
    Sound.toggle();
    const st = $("#sound-toggle");
    st.setAttribute("aria-pressed", "true");
    st.textContent = "(♪) Sound: ON";
  }
  Sound.whoosh();
  loaderEl.classList.add("away");
  setTimeout(() => loaderEl.remove(), 1100);

  introT = performance.now();
  $("#hud").classList.add("live");
  spike(0.7);

  $$(".scramble-on-enter").forEach((el, i) => getScramble(el).play(700, 280 + i * 130));
  beats.hero.el.querySelectorAll<HTMLElement>("[data-scramble]").forEach((el, i) =>
    getScramble(el).play(800, 420 + i * 130));
  setTimeout(() => { Scroll.enabled = true; }, 650);
}

enterBtn.addEventListener("click", enter);
introT = -2;                            // hold the pre-enter dolly

/* ── main loop ───────────────────────────────────────────────── */
function frame(now: number) {
  Scroll.update();
  Pointer.update();
  updateTimeline(now);
  updateSpike(now);
  drawParticles();
  requestAnimationFrame(frame);
}

Scroll.attach();
Pointer.attach();
preload();
requestAnimationFrame(loaderTick);
requestAnimationFrame(frame);

/* QA hook — lets automated tests scrub the flight */
;(window as any).__flight = {
  scroll: Scroll,
  enter: () => enterBtn.click(),
  setProgress: (p: number) => { Scroll.target = clamp(p, 0, 1); },
};
