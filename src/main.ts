import "./style.css";
import type { AtlasProject, AtlasSceneController } from "./atlas-scene";
import { createSignalRun, getSignalMode } from "./signal-run";
import { createAtlasModeController, createPagehideCleanup } from "./signal-run-lifecycle";

const $ = <T extends Element = HTMLElement>(selector: string, root: ParentNode = document) => {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Missing required element: ${selector}`);
  return element;
};

const $$ = <T extends Element = HTMLElement>(selector: string, root: ParentNode = document) =>
  [...root.querySelectorAll<T>(selector)];

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const mobileNav = window.matchMedia("(max-width: 1050px)");
const sceneMount = $("#atlas-scene");
const saveData = Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData);
const getCurrentSignalMode = () => getSignalMode({
  reducedMotion: reducedMotion.matches,
  saveData,
  viewportWidth: window.innerWidth,
});
const initialSignalMode = getCurrentSignalMode();
const signalRun = createSignalRun($("#signal-run"));

let atlasScene: AtlasSceneController | null = null;
const atlasMode = createAtlasModeController<AtlasSceneController>({
  mount: sceneMount,
  load: async () => {
    const { createAtlasScene } = await import("./atlas-scene");
    return () => createAtlasScene(sceneMount, {
      initialSection: document.body.dataset.scene || "night",
      reducedMotion: reducedMotion.matches,
    });
  },
  onSceneChange: (scene) => {
    atlasScene = scene;
    if (scene) updatePageState();
  },
  onError: (error) => {
    console.warn("The decorative atlas scene could not start.", error);
  },
});
const syncAtlasMode = () => atlasMode.sync(getCurrentSignalMode());

if (initialSignalMode === "cinematic") {
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(syncAtlasMode, { timeout: 700 });
  } else {
    setTimeout(syncAtlasMode, 80);
  }
} else {
  syncAtlasMode();
}
window.addEventListener("resize", syncAtlasMode, { passive: true });
reducedMotion.addEventListener("change", syncAtlasMode);

type PipelineStage = {
  status: string;
  title: string;
  description: string;
  action: string;
  proof: string;
  project: AtlasProject | null;
};

const pipelineStages: PipelineStage[] = [
  {
    status: "Signal received",
    title: "A prospect raises a hand.",
    description: "A call, form, or property question enters one visible queue with its source and context intact.",
    action: "Capture and timestamp the inquiry",
    proof: "No fabricated activity counters",
    project: null,
  },
  {
    status: "Conversation active",
    title: "The system answers with context.",
    description: "A voice agent handles the first exchange, records what matters, and keeps the experience clear for the caller.",
    action: "Capture the request, property, and next step",
    proof: "Voice workflow inside WYN Intelligence",
    project: "wyn",
  },
  {
    status: "Intent structured",
    title: "Language becomes usable intent.",
    description: "The conversation is reduced to the fields a broker needs, without losing the original transcript or source.",
    action: "Classify intent and preserve the evidence",
    proof: "Buyer-intent routing into the shared workflow",
    project: "wyn",
  },
  {
    status: "Record updated",
    title: "The CRM becomes the source of truth.",
    description: "The lead, property context, owner, and next action land in one operational record instead of another inbox.",
    action: "Create or update the correct CRM record",
    proof: "WYN command center in production",
    project: "wyn",
  },
  {
    status: "Next action running",
    title: "Follow-up starts while intent is fresh.",
    description: "The right sequence begins with an owner, a reason, and a visible stop condition. Automation does not hide accountability.",
    action: "Route, notify, and start the approved sequence",
    proof: "Connected nurture path on Miguel Closes",
    project: "miguel",
  },
  {
    status: "Handoff complete",
    title: "A conversation reaches the calendar.",
    description: "The pipeline closes the loop with a booked meeting and a complete record of how the opportunity arrived.",
    action: "Book the meeting and preserve attribution",
    proof: "Live booking flow on MiguelCloses.com",
    project: "miguel",
  },
];

const stageNodes = $$(".pipeline-node");
const stageIndex = $("#stage-index");
const stageStatus = $("#stage-status");
const stageTitle = $("#stage-title");
const stageDescription = $("#stage-description");
const stageAction = $("#stage-action");
const stageProof = $("#stage-proof");
const stageProgress = $("#stage-progress");
const route = $("#pipeline-route");
const previousStage = $<HTMLButtonElement>("#stage-prev");
const nextStage = $<HTMLButtonElement>("#stage-next");
let activeStage = 0;

function setPipelineStage(index: number, announce = true) {
  activeStage = Math.max(0, Math.min(pipelineStages.length - 1, index));
  const stage = pipelineStages[activeStage];
  const displayIndex = String(activeStage + 1).padStart(2, "0");

  stageNodes.forEach((node, nodeIndex) => {
    const active = nodeIndex === activeStage;
    node.classList.toggle("is-active", active);
    node.setAttribute("aria-pressed", String(active));
  });

  stageIndex.textContent = `Stage ${displayIndex} / 06`;
  stageStatus.textContent = stage.status;
  stageTitle.textContent = stage.title;
  stageDescription.textContent = stage.description;
  stageAction.textContent = stage.action;
  stageProof.textContent = stage.proof;
  stageProgress.style.transform = `scaleX(${(activeStage + 1) / pipelineStages.length})`;
  route.style.setProperty("--route-offset", String(1 - (activeStage + 1) / pipelineStages.length));
  previousStage.disabled = activeStage === 0;
  nextStage.disabled = activeStage === pipelineStages.length - 1;
  nextStage.textContent = activeStage === pipelineStages.length - 1 ? "Pipeline complete" : "Next stage";
  atlasScene?.focusProject(stage.project);

  if (announce) stageTitle.setAttribute("data-updated", String(Date.now()));
}

stageNodes.forEach((node) => {
  const index = Number(node.getAttribute("data-stage"));
  node.addEventListener("click", () => setPipelineStage(index));
  node.addEventListener("pointerenter", () => setPipelineStage(index, false));
  node.addEventListener("focus", () => setPipelineStage(index, false));
});

previousStage.addEventListener("click", () => setPipelineStage(activeStage - 1));
nextStage.addEventListener("click", () => setPipelineStage(activeStage + 1));
setPipelineStage(0, false);

const projectTargets = $$<HTMLElement>("[data-project], [data-project-card]");
for (const target of projectTargets) {
  const project = (target.dataset.project || target.dataset.projectCard) as AtlasProject;
  const focus = () => atlasScene?.focusProject(project);
  const clear = (event: Event) => {
    if (event.type === "focusout" && target.contains((event as FocusEvent).relatedTarget as Node | null)) return;
    atlasScene?.focusProject(null);
  };
  target.addEventListener("pointerenter", focus);
  target.addEventListener("pointerleave", clear);
  target.addEventListener("focusin", focus);
  target.addEventListener("focusout", clear);
}

const menuButton = $<HTMLButtonElement>("#menu-toggle");
const primaryNav = $<HTMLElement>("#primary-nav");
const mainContent = $<HTMLElement>("#main");
const siteFooter = $<HTMLElement>(".site-footer");
let menuOpen = false;

function syncMenu() {
  const open = menuOpen && mobileNav.matches;
  document.body.classList.toggle("nav-open", open);
  menuButton.setAttribute("aria-expanded", String(open));
  primaryNav.inert = mobileNav.matches && !menuOpen;
  mainContent.inert = open;
  siteFooter.inert = open;
}

function closeMenu(restoreFocus = false) {
  const wasOpen = menuOpen;
  menuOpen = false;
  syncMenu();
  if (restoreFocus && wasOpen) menuButton.focus();
}

menuButton.addEventListener("click", () => {
  menuOpen = !menuOpen;
  syncMenu();
});

primaryNav.addEventListener("click", (event) => {
  const link = (event.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
  if (!link) return;
  const destination = document.querySelector<HTMLElement>(link.hash);
  const shouldMoveFocus = mobileNav.matches;
  closeMenu();
  if (shouldMoveFocus && destination) {
    requestAnimationFrame(() => {
      destination.tabIndex = -1;
      destination.focus({ preventScroll: true });
      destination.addEventListener("blur", () => destination.removeAttribute("tabindex"), { once: true });
    });
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && menuOpen) {
    closeMenu(true);
    return;
  }
  if (event.key !== "Tab" || !menuOpen || !mobileNav.matches) return;

  const focusable = [
    $<HTMLAnchorElement>(".site-header .brand"),
    menuButton,
    ...$$<HTMLAnchorElement>("a", primaryNav),
  ];
  const activeIndex = focusable.indexOf(document.activeElement as HTMLAnchorElement | HTMLButtonElement);
  if (event.shiftKey && activeIndex <= 0) {
    event.preventDefault();
    focusable[focusable.length - 1].focus();
  } else if (!event.shiftKey && activeIndex === focusable.length - 1) {
    event.preventDefault();
    focusable[0].focus();
  }
});

mobileNav.addEventListener("change", () => {
  menuOpen = false;
  syncMenu();
});
syncMenu();

const revealItems = $$(".reveal");
if (reducedMotion.matches || !("IntersectionObserver" in window)) {
  revealItems.forEach((item) => item.classList.add("is-visible"));
} else {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    }
  }, { rootMargin: "0px 0px -12%", threshold: 0.08 });
  revealItems.forEach((item) => revealObserver.observe(item));
}

const sceneSections = $$(".scene-section");
const navigationLinks = $$<HTMLAnchorElement>("#primary-nav a[href^='#']");
const pageProgress = $("#page-progress-bar");
let scrollFrame = 0;
let currentScene = "night";

function updatePageState() {
  scrollFrame = 0;
  const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  const progress = Math.min(1, Math.max(0, window.scrollY / maxScroll));
  pageProgress.style.transform = `scaleX(${progress})`;

  const viewportAnchor = window.innerHeight * 0.44;
  let closestSection = sceneSections[0];
  let closestDistance = Number.POSITIVE_INFINITY;
  for (const section of sceneSections) {
    const rect = section.getBoundingClientRect();
    const distance = Math.abs(rect.top + Math.min(rect.height, window.innerHeight) * 0.35 - viewportAnchor);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestSection = section;
    }
  }

  const nextScene = closestSection.getAttribute("data-scene") || "night";
  if (nextScene !== currentScene) {
    currentScene = nextScene;
    document.body.dataset.scene = currentScene;
  }

  const currentId = closestSection.id;
  for (const link of navigationLinks) {
    const isCurrent = link.hash === `#${currentId}`;
    if (isCurrent) link.setAttribute("aria-current", "true");
    else link.removeAttribute("aria-current");
  }

  atlasScene?.update(progress, currentScene);
}

function requestPageUpdate() {
  if (!scrollFrame) scrollFrame = requestAnimationFrame(updatePageState);
}

window.addEventListener("scroll", requestPageUpdate, { passive: true });
window.addEventListener("resize", requestPageUpdate, { passive: true });
updatePageState();

const soundToggle = $<HTMLButtonElement>("#sound-toggle");
let audioContext: AudioContext | null = null;
let soundMaster: GainNode | null = null;
let soundOn = false;

function initializeSound() {
  if (audioContext) return;
  const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return;
  audioContext = new AudioContextClass();
  soundMaster = audioContext.createGain();
  soundMaster.gain.value = 0;
  soundMaster.connect(audioContext.destination);

  const filter = audioContext.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 360;
  filter.Q.value = 0.7;
  filter.connect(soundMaster);

  [55, 82.41, 110].forEach((frequency, index) => {
    const oscillator = audioContext!.createOscillator();
    oscillator.type = index === 0 ? "sine" : "triangle";
    oscillator.frequency.value = frequency;
    oscillator.detune.value = index === 1 ? -5 : index === 2 ? 4 : 0;
    const gain = audioContext!.createGain();
    gain.gain.value = index === 0 ? 0.05 : 0.018;
    oscillator.connect(gain).connect(filter);
    oscillator.start();
  });
}

soundToggle.addEventListener("click", async () => {
  initializeSound();
  if (!audioContext || !soundMaster) {
    soundToggle.textContent = "Ambient sound unavailable";
    return;
  }
  await audioContext.resume();
  soundOn = !soundOn;
  const now = audioContext.currentTime;
  soundMaster.gain.cancelScheduledValues(now);
  soundMaster.gain.setValueAtTime(soundMaster.gain.value, now);
  soundMaster.gain.linearRampToValueAtTime(soundOn ? 0.55 : 0, now + 0.6);
  soundToggle.setAttribute("aria-pressed", String(soundOn));
  soundToggle.innerHTML = `<span aria-hidden="true">♪</span> Ambient sound ${soundOn ? "on" : "off"}`;
});

type DiagnosticAnswer = {
  title: string;
  copy: string;
  steps: string[];
};

function buildDiagnostic(source: string, speed: string, record: string): DiagnosticAnswer {
  if (record !== "crm") {
    return {
      title: "Start with one operational record.",
      copy: "Automation will amplify confusion if ownership, context, and next actions still live across inboxes and spreadsheets.",
      steps: [
        "Define the fields and owner for every new opportunity.",
        "Route each entry source into one shared record.",
        speed === "fast" ? "Preserve your response speed while making the handoff visible." : "Add an immediate acknowledgment and a timed owner alert.",
      ],
    };
  }

  if (speed === "unknown") {
    return {
      title: "Close the response-time gap first.",
      copy: "You already have a system of record. The next gain is making every inquiry visible and owned before interest cools.",
      steps: [
        `Capture ${source === "calls" ? "calls and voicemails" : "every lead source"} in the CRM automatically.`,
        "Set a clear response window and escalation rule.",
        "Measure the handoff before expanding the nurture sequence.",
      ],
    };
  }

  return {
    title: source === "calls" ? "Structure the conversation at entry." : "Connect the source to the next action.",
    copy: "Your foundation is stronger than most. Focus on preserving intent and attribution as the opportunity moves into follow-up.",
    steps: [
      source === "calls" ? "Turn each call into structured intent and a complete transcript." : "Keep source and campaign context attached to the lead.",
      "Assign the correct owner and approved next action.",
      "Close the loop with booking status and outcome data.",
    ],
  };
}

const diagnosticForm = $<HTMLFormElement>("#pipeline-diagnostic");
const diagnosticResult = $<HTMLElement>("#diagnostic-result");
const resultTitle = $("#result-title");
const resultCopy = $("#result-copy");
const resultSteps = $<HTMLOListElement>("#result-steps");
let diagnosticSummary = "";

diagnosticForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!diagnosticForm.reportValidity()) return;
  const formData = new FormData(diagnosticForm);
  const source = String(formData.get("source"));
  const speed = String(formData.get("speed"));
  const record = String(formData.get("record"));
  const answer = buildDiagnostic(source, speed, record);

  resultTitle.textContent = answer.title;
  resultCopy.textContent = answer.copy;
  resultSteps.replaceChildren(...answer.steps.map((step) => {
    const item = document.createElement("li");
    item.textContent = step;
    return item;
  }));
  diagnosticSummary = `${answer.title}\n\n${answer.steps.map((step, index) => `${index + 1}. ${step}`).join("\n")}`;
  diagnosticResult.hidden = false;
  diagnosticResult.focus({ preventScroll: true });
  diagnosticResult.scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth", block: "center" });
});

const contactDialog = $<HTMLDialogElement>("#contact-dialog");
const contactForm = $<HTMLFormElement>("#contact-form");
const contactMessage = $<HTMLTextAreaElement>('textarea[name="message"]', contactForm);
const closeContact = $<HTMLButtonElement>("[data-close-contact]");
const formStatus = $<HTMLElement>("#form-status");
const contactSubmit = $<HTMLButtonElement>('button[type="submit"]', contactForm);
let contactOpener: HTMLElement | null = null;

for (const opener of $$<HTMLButtonElement>("[data-open-contact]")) {
  opener.addEventListener("click", () => {
    contactOpener = opener;
    if (diagnosticSummary && !contactMessage.value) {
      contactMessage.value = `My pipeline starting map:\n\n${diagnosticSummary}\n\nWhat I want to improve:\n`;
    }
    contactDialog.showModal();
  });
}

closeContact.addEventListener("click", () => contactDialog.close());
contactDialog.addEventListener("close", () => {
  contactOpener?.focus();
  contactOpener = null;
});

contactForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!contactForm.reportValidity()) return;
  const data = Object.fromEntries(new FormData(contactForm).entries());
  if (data._honey) return;

  contactSubmit.disabled = true;
  formStatus.className = "form-status";
  formStatus.textContent = "Sending your system brief...";
  try {
    const response = await fetch("https://formsubmit.co/ajax/danilo@neurosparkmarketing.com", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        name: data.name,
        email: data.email,
        company: data.company || "Not provided",
        message: data.message,
        _subject: "New system review request from daniloojeda.com",
        _template: "table",
      }),
    });
    if (!response.ok) throw new Error(String(response.status));
    formStatus.className = "form-status success";
    formStatus.textContent = "System brief received. Danilo will reply within one business day.";
    contactForm.reset();
  } catch {
    formStatus.className = "form-status error";
    formStatus.textContent = "The form could not send. Email danilo@neurosparkmarketing.com instead.";
  } finally {
    contactSubmit.disabled = false;
  }
});

$("#current-year").textContent = String(new Date().getFullYear());

createPagehideCleanup(window, () => {
  window.removeEventListener("resize", syncAtlasMode);
  reducedMotion.removeEventListener("change", syncAtlasMode);
  signalRun.destroy();
  atlasMode.destroy();
  if (audioContext) void audioContext.close();
});
