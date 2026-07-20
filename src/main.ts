import "./style.css";
import { inject, track } from "@vercel/analytics";
import type { AtlasProject, AtlasSceneController } from "./atlas-scene";

const $ = <T extends Element = HTMLElement>(selector: string, root: ParentNode = document) => {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Missing required element: ${selector}`);
  return element;
};

const $$ = <T extends Element = HTMLElement>(selector: string, root: ParentNode = document) =>
  [...root.querySelectorAll<T>(selector)];

const isLocalHost = ["localhost", "127.0.0.1"].includes(window.location.hostname);
const analyticsEnabled = import.meta.env.PROD && !isLocalHost;

if (analyticsEnabled) inject();

function trackEvent(name: string, properties?: Record<string, string | number | boolean>) {
  if (!analyticsEnabled) return;
  try {
    track(name, properties);
  } catch (error) {
    console.warn("Analytics event could not be recorded.", error);
  }
}

for (const target of $$<HTMLElement>("[data-track]")) {
  target.addEventListener("click", () => {
    const name = target.dataset.track;
    if (!name) return;
    const label = target.dataset.trackLabel;
    trackEvent(name, label ? { label } : undefined);
  });
}

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const mobileNav = window.matchMedia("(max-width: 1050px)");
const sceneMount = $("#atlas-scene");

let atlasScene: AtlasSceneController | null = null;

type CapabilityNavigator = Navigator & {
  connection?: { saveData?: boolean; effectiveType?: string };
  deviceMemory?: number;
};

function canStartAtlasScene() {
  const capability = navigator as CapabilityNavigator;
  const connection = capability.connection;
  const constrainedNetwork = connection?.saveData || ["slow-2g", "2g"].includes(connection?.effectiveType || "");
  const constrainedMemory = typeof capability.deviceMemory === "number" && capability.deviceMemory <= 4;
  if (reducedMotion.matches || constrainedNetwork || constrainedMemory) return false;

  const testCanvas = document.createElement("canvas");
  const context = testCanvas.getContext("webgl2") || testCanvas.getContext("webgl");
  context?.getExtension("WEBGL_lose_context")?.loseContext();
  return Boolean(context);
}

function showStaticAtlas() {
  sceneMount.setAttribute("hidden", "");
  document.body.dataset.atlasMode = "static";
}

async function startAtlasScene() {
  try {
    const { createAtlasScene } = await import("./atlas-scene");
    atlasScene = createAtlasScene(sceneMount, {
      initialSection: document.body.dataset.scene || "night",
      reducedMotion: false,
    });
    document.body.dataset.atlasMode = "webgl";
    updatePageState();
  } catch (error) {
    showStaticAtlas();
    console.warn("The decorative atlas scene could not start.", error);
  }
}

if (!canStartAtlasScene()) {
  showStaticAtlas();
} else if ("requestIdleCallback" in window) {
  window.requestIdleCallback(() => void startAtlasScene(), { timeout: 900 });
} else {
  setTimeout(() => void startAtlasScene(), 120);
}

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

const stageNodes = $$<HTMLButtonElement>(".pipeline-node");
const stageReadout = $("#stage-readout");
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

function setPipelineStage(index: number, recordInteraction = false) {
  activeStage = Math.max(0, Math.min(pipelineStages.length - 1, index));
  const stage = pipelineStages[activeStage];
  const displayIndex = String(activeStage + 1).padStart(2, "0");

  stageNodes.forEach((node, nodeIndex) => {
    const active = nodeIndex === activeStage;
    node.classList.toggle("is-active", active);
    node.setAttribute("aria-selected", String(active));
    node.tabIndex = active ? 0 : -1;
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
  stageReadout.setAttribute("aria-labelledby", stageNodes[activeStage].id);
  atlasScene?.focusProject(stage.project);

  if (recordInteraction) trackEvent("pipeline_stage_selected", { stage: activeStage + 1 });
}

stageNodes.forEach((node) => {
  const index = Number(node.getAttribute("data-stage"));
  node.addEventListener("click", () => setPipelineStage(index, true));
  node.addEventListener("focus", () => setPipelineStage(index));
  node.addEventListener("keydown", (event) => {
    let nextIndex: number | null = null;
    if (["ArrowRight", "ArrowDown"].includes(event.key)) nextIndex = (index + 1) % stageNodes.length;
    if (["ArrowLeft", "ArrowUp"].includes(event.key)) nextIndex = (index - 1 + stageNodes.length) % stageNodes.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = stageNodes.length - 1;
    if (nextIndex === null) return;
    event.preventDefault();
    setPipelineStage(nextIndex, true);
    stageNodes[nextIndex].focus();
  });
});

previousStage.addEventListener("click", () => setPipelineStage(activeStage - 1, true));
nextStage.addEventListener("click", () => setPipelineStage(activeStage + 1, true));
setPipelineStage(0);

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

type DiagnosticAnswer = {
  title: string;
  copy: string;
  steps: string[];
};

function buildDiagnostic(source: string, speed: string, record: string): DiagnosticAnswer {
  const sourcePlans: Record<string, string> = {
    calls: "Turn each call or voicemail into a transcript, structured intent, and a named owner.",
    forms: "Keep form, campaign, property, and attribution data attached to the opportunity.",
    mixed: "Route calls, forms, and campaigns through one intake contract before branching the workflow.",
  };
  const recordPlans: Record<string, string> = {
    crm: "Update one CRM record with the source, context, owner, and approved next action.",
    sheets: "Replace spreadsheet and inbox handoffs with one operational record and a defined field set.",
    scattered: "Choose one system of record, then make every other tool read from or write to it deliberately.",
  };
  const speedPlans: Record<string, string> = {
    fast: "Preserve the five-minute response while logging the handoff and its outcome.",
    day: "Send an immediate acknowledgment, then alert the owner before the same-day response window expires.",
    unknown: "Set a response-time target, escalation rule, and measurement before adding more automation.",
  };

  let title = "Connect the source to the next action.";
  let copy = "Your foundation can support a cleaner handoff. Preserve context, ownership, and outcome data as the opportunity moves.";

  if (record !== "crm") {
    title = "Start with one operational record.";
    copy = record === "sheets"
      ? "Spreadsheets can support analysis, but they should not own a live handoff between inquiry and follow-up."
      : "Automation will amplify confusion until every source agrees on where ownership and next actions live.";
  } else if (speed === "unknown") {
    title = "Close the response-time gap first.";
    copy = "The CRM foundation is present. The next gain is making every inquiry visible and owned before interest cools.";
  } else if (speed === "day") {
    title = "Shorten the unowned window.";
    copy = "The opportunity reaches a trusted record, but the response path still needs an immediate acknowledgment and a timed owner alert.";
  } else if (source === "calls") {
    title = "Structure the conversation at entry.";
    copy = "Fast response and a trusted CRM are strong foundations. Preserve what the caller asked for before the conversation becomes another note.";
  } else if (source === "mixed") {
    title = "Unify intake before expanding automation.";
    copy = "The CRM and response speed are working. Standardize how each source enters so attribution and ownership stay consistent.";
  }

  return {
    title,
    copy,
    steps: [
      sourcePlans[source] || sourcePlans.mixed,
      recordPlans[record] || recordPlans.scattered,
      speedPlans[speed] || speedPlans.unknown,
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
  trackEvent("diagnostic_completed");
  diagnosticResult.hidden = false;
  diagnosticResult.focus({ preventScroll: true });
  diagnosticResult.scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth", block: "center" });
});

const contactDialog = $<HTMLDialogElement>("#contact-dialog");
const contactForm = $<HTMLFormElement>("#contact-form");
const contactMessage = $<HTMLTextAreaElement>('textarea[name="message"]', contactForm);
const contactSubmissionId = $<HTMLInputElement>('input[name="submissionId"]', contactForm);
const closeContact = $<HTMLButtonElement>("[data-close-contact]");
const formStatus = $<HTMLElement>("#form-status");
const contactSubmit = $<HTMLButtonElement>('button[type="submit"]', contactForm);
let contactOpener: HTMLElement | null = null;

function prepareContactForm() {
  contactSubmissionId.value = crypto.randomUUID();
}

for (const opener of $$<HTMLButtonElement>("[data-open-contact]")) {
  opener.addEventListener("click", () => {
    contactOpener = opener;
    formStatus.className = "form-status";
    formStatus.textContent = "";
    prepareContactForm();
    if (diagnosticSummary && !contactMessage.value) {
      contactMessage.value = `My pipeline starting map:\n\n${diagnosticSummary}\n\nWhat I want to improve:\n`;
    }
    contactDialog.showModal();
    trackEvent("contact_opened", { source: opener.dataset.contactSource || "unknown" });
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
  let failureMessage = "The form could not send.";
  try {
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        name: String(data.name || ""),
        email: String(data.email || ""),
        company: String(data.company || ""),
        message: String(data.message || ""),
        _honey: String(data._honey || ""),
        submissionId: String(data.submissionId || ""),
      }),
    });
    const result = await response.json().catch(() => ({ error: "" })) as { error?: string };
    if (!response.ok) {
      failureMessage = result.error || failureMessage;
      throw new Error(String(response.status));
    }
    formStatus.className = "form-status success";
    formStatus.textContent = "System brief received. Danilo will reply within one business day.";
    contactForm.reset();
    prepareContactForm();
    trackEvent("contact_submitted");
  } catch {
    formStatus.className = "form-status error";
    formStatus.textContent = `${failureMessage} Email danilo@neurosparkmarketing.com instead.`;
  } finally {
    contactSubmit.disabled = false;
  }
});

$("#current-year").textContent = String(new Date().getFullYear());

window.addEventListener("pagehide", () => {
  atlasScene?.destroy();
}, { once: true });
