export function clampSignalProgress(progress: number): number {
  return Math.min(1, Math.max(0, progress));
}

export function getSignalChapter(progress: number): number {
  return Math.min(3, Math.floor(clampSignalProgress(progress) * 4));
}

const signalHandoffStart = 0.9;

export function getSignalVisualState(progress: number): {
  handoffProgress: number;
} {
  const handoffProgress = Math.round(
    clampSignalProgress((clampSignalProgress(progress) - signalHandoffStart) / (1 - signalHandoffStart)) * 10_000,
  ) / 10_000;
  return { handoffProgress };
}

export function isSignalHandoffAccessible(handoffProgress: number): boolean {
  return clampSignalProgress(handoffProgress) >= 0.95;
}

type SignalModeOptions = {
  reducedMotion: boolean;
  saveData: boolean;
  viewportWidth: number;
};

export function getSignalMode(options: SignalModeOptions): "cinematic" | "static" {
  return options.reducedMotion || options.saveData || options.viewportWidth <= 760
    ? "static"
    : "cinematic";
}

const routePoints = [
  { x: 0.1, y: 0.76 },
  { x: 0.27, y: 0.58 },
  { x: 0.43, y: 0.62 },
  { x: 0.58, y: 0.4 },
  { x: 0.75, y: 0.43 },
  { x: 0.9, y: 0.22 },
] as const;

type DrawingArea = {
  width: number;
  height: number;
};

export function getSignalPoint(progress: number, area: DrawingArea): { x: number; y: number } {
  const scaledProgress = clampSignalProgress(progress) * (routePoints.length - 1);
  const startIndex = Math.min(routePoints.length - 2, Math.floor(scaledProgress));
  const legProgress = Math.min(1, scaledProgress - startIndex);
  const start = routePoints[startIndex];
  const end = routePoints[startIndex + 1];

  return {
    x: Math.round((start.x + (end.x - start.x) * legProgress) * area.width * 1000) / 1000,
    y: Math.round((start.y + (end.y - start.y) * legProgress) * area.height * 1000) / 1000,
  };
}

type RequestFrame = (callback: FrameRequestCallback) => number;
type CancelFrame = (frame: number) => void;

export function createFrameScheduler(
  render: FrameRequestCallback,
  requestFrame: RequestFrame = requestAnimationFrame,
  cancelFrame: CancelFrame = cancelAnimationFrame,
): { schedule: () => void; destroy: () => void } {
  let pendingFrame = 0;
  let destroyed = false;

  return {
    schedule() {
      if (destroyed || pendingFrame) return;
      pendingFrame = requestFrame((time) => {
        pendingFrame = 0;
        if (!destroyed) render(time);
      });
    },
    destroy() {
      destroyed = true;
      if (!pendingFrame) return;
      cancelFrame(pendingFrame);
      pendingFrame = 0;
    },
  };
}

export type SignalRunController = {
  destroy: () => void;
};

type NavigatorWithConnection = Navigator & {
  connection?: { saveData?: boolean };
};

function drawRoute(
  context: CanvasRenderingContext2D,
  area: DrawingArea,
  endProgress: number,
): void {
  const steps = 90;
  context.beginPath();
  for (let step = 0; step <= steps; step += 1) {
    const point = getSignalPoint((step / steps) * endProgress, area);
    if (step === 0) context.moveTo(point.x, point.y);
    else context.lineTo(point.x, point.y);
  }
  context.stroke();
}

function drawSignalRun(
  context: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  progress: number,
  handoffProgress: number,
): void {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const area = { width, height };
  context.clearRect(0, 0, width, height);

  context.save();
  context.strokeStyle = "rgba(118, 169, 145, 0.13)";
  context.lineWidth = 1;
  context.setLineDash([3, 10]);
  const gridSize = Math.max(48, Math.round(width / 18));
  for (let x = gridSize; x < width; x += gridSize) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, height);
    context.stroke();
  }
  for (let y = gridSize; y < height; y += gridSize) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.stroke();
  }

  context.setLineDash([]);
  context.strokeStyle = "rgba(231, 227, 216, 0.12)";
  const parcels = [
    [0.07, 0.12, 0.3, 0.34],
    [0.3, 0.12, 0.55, 0.28],
    [0.55, 0.12, 0.76, 0.39],
    [0.76, 0.12, 0.94, 0.34],
    [0.07, 0.34, 0.23, 0.84],
    [0.23, 0.34, 0.48, 0.84],
    [0.48, 0.39, 0.7, 0.84],
    [0.7, 0.34, 0.94, 0.84],
  ] as const;
  for (const [left, top, right, bottom] of parcels) {
    context.strokeRect(left * width, top * height, (right - left) * width, (bottom - top) * height);
  }

  context.strokeStyle = "rgba(118, 169, 145, 0.4)";
  context.lineWidth = 1.25;
  drawRoute(context, area, 1);

  context.strokeStyle = "#3657d6";
  context.lineWidth = 3;
  context.lineCap = "round";
  drawRoute(context, area, progress);

  for (let station = 0; station < routePoints.length; station += 1) {
    const stationProgress = station / (routePoints.length - 1);
    const point = getSignalPoint(stationProgress, area);
    context.beginPath();
    context.fillStyle = progress >= stationProgress ? "#e7e3d8" : "#171a19";
    context.strokeStyle = progress >= stationProgress ? "#76a991" : "rgba(231, 227, 216, 0.28)";
    context.lineWidth = 1.5;
    context.arc(point.x, point.y, progress >= stationProgress ? 5 : 3.5, 0, Math.PI * 2);
    context.fill();
    context.stroke();
  }

  const signal = getSignalPoint(progress, area);
  context.beginPath();
  context.fillStyle = "#f6f3e9";
  context.shadowColor = "rgba(54, 87, 214, 0.72)";
  context.shadowBlur = 18;
  context.arc(signal.x, signal.y, 5.5, 0, Math.PI * 2);
  context.fill();
  context.restore();

  if (handoffProgress > 0) {
    const gradient = context.createLinearGradient(0, height, 0, 0);
    gradient.addColorStop(0, `rgba(231, 227, 216, ${handoffProgress})`);
    gradient.addColorStop(0.56, `rgba(231, 227, 216, ${handoffProgress * 0.54})`);
    gradient.addColorStop(1, "rgba(231, 227, 216, 0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
  }
}

export function createSignalRun(section: HTMLElement): SignalRunController {
  const canvas = section.querySelector<HTMLCanvasElement>("#signal-run-canvas");
  const beats = [...section.querySelectorAll<HTMLElement>("[data-signal-beat]")];
  const stations = [...section.querySelectorAll<HTMLElement>("[data-station]")];
  const counter = section.querySelector<HTMLElement>("#signal-run-counter");
  const handoff = section.querySelector<HTMLAnchorElement>(".signal-run-handoff");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const saveData = Boolean((navigator as NavigatorWithConnection).connection?.saveData);
  let context: CanvasRenderingContext2D | null = null;
  let mode: "cinematic" | "static" = "static";
  let lastChapter = -1;
  let contextLost = false;
  let destroyed = false;

  const getMode = () => getSignalMode({
    reducedMotion: reducedMotion.matches,
    saveData,
    viewportWidth: window.innerWidth,
  });

  const restoreHandoffSemantics = () => {
    delete section.dataset.signalHandoffVisible;
    handoff?.removeAttribute("aria-hidden");
    handoff?.removeAttribute("tabindex");
  };

  const clearObsoleteForegroundState = () => {
    section.removeAttribute("data-signal-upper-foreground");
    section.removeAttribute("data-signal-lower-foreground");
    section.removeAttribute("data-signal-lower-treatment");
  };

  const updateCinematicHandoff = (accessible: boolean) => {
    if (accessible) {
      section.dataset.signalHandoffVisible = "true";
      handoff?.removeAttribute("aria-hidden");
      handoff?.removeAttribute("tabindex");
      return;
    }
    delete section.dataset.signalHandoffVisible;
    if (handoff && document.activeElement === handoff) handoff.blur();
    handoff?.setAttribute("aria-hidden", "true");
    handoff?.setAttribute("tabindex", "-1");
  };

  const updateStaticState = () => {
    lastChapter = -1;
    section.style.setProperty("--signal-progress", "1");
    section.style.setProperty("--signal-handoff", "1");
    section.dataset.signalChapter = "3";
    clearObsoleteForegroundState();
    if (counter) counter.textContent = "04 / 04";
    beats.forEach((beat) => beat.removeAttribute("aria-current"));
    stations.forEach((station) => station.dataset.state = "complete");
    restoreHandoffSemantics();
  };

  const prepareCanvas = (): boolean => {
    if (!canvas) return false;
    context ||= canvas.getContext("2d", { alpha: true });
    if (!context) return false;
    const ratio = Math.min(1.75, Math.max(1, window.devicePixelRatio || 1));
    const width = Math.max(1, Math.round(canvas.clientWidth * ratio));
    const height = Math.max(1, Math.round(canvas.clientHeight * ratio));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    return true;
  };

  const failCanvas = () => {
    mode = "static";
    context = null;
    section.dataset.signalMode = mode;
    section.classList.add("canvas-failed");
    updateStaticState();
  };

  const render = () => {
    if (destroyed || mode === "static") return;
    try {
      if (!prepareCanvas()) {
        failCanvas();
        return;
      }

      const bounds = section.getBoundingClientRect();
      const scrollRange = Math.max(1, section.offsetHeight - window.innerHeight);
      const progress = clampSignalProgress(-bounds.top / scrollRange);
      const chapter = getSignalChapter(progress);
      const { handoffProgress } = getSignalVisualState(progress);
      section.style.setProperty("--signal-progress", progress.toFixed(4));
      section.style.setProperty("--signal-handoff", handoffProgress.toFixed(4));
      section.dataset.signalChapter = String(chapter);
      clearObsoleteForegroundState();
      updateCinematicHandoff(isSignalHandoffAccessible(handoffProgress));

      if (chapter !== lastChapter) {
        lastChapter = chapter;
        if (counter) counter.textContent = `${String(chapter + 1).padStart(2, "0")} / 04`;
        beats.forEach((beat, index) => {
          if (index === chapter) beat.setAttribute("aria-current", "step");
          else beat.removeAttribute("aria-current");
        });
      }

      const stationPosition = progress * (stations.length - 1);
      stations.forEach((station, index) => {
        station.dataset.state = index < stationPosition
          ? "complete"
          : index - stationPosition < 0.5
            ? "active"
            : "waiting";
      });
      drawSignalRun(context!, canvas!, progress, handoffProgress);
    } catch {
      failCanvas();
    }
  };

  const scheduler = createFrameScheduler(render);

  const syncMode = () => {
    clearObsoleteForegroundState();
    if (contextLost) {
      mode = "static";
      section.dataset.signalMode = mode;
      section.classList.add("canvas-failed");
      updateStaticState();
      return;
    }
    mode = getMode();
    section.dataset.signalMode = mode;
    section.classList.remove("canvas-failed");
    if (mode === "static") updateStaticState();
    else {
      updateCinematicHandoff(false);
      scheduler.schedule();
    }
  };

  const onScroll = () => {
    if (mode === "cinematic") scheduler.schedule();
  };
  const onResize = () => syncMode();
  const onContextLost = (event: Event) => {
    event.preventDefault();
    contextLost = true;
    failCanvas();
  };
  const onContextRestored = () => {
    contextLost = false;
    context = null;
    if (getMode() === "cinematic") {
      try {
        if (!prepareCanvas()) {
          failCanvas();
          return;
        }
      } catch {
        failCanvas();
        return;
      }
    }
    syncMode();
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize, { passive: true });
  reducedMotion.addEventListener("change", syncMode);
  canvas?.addEventListener("contextlost", onContextLost);
  canvas?.addEventListener("contextrestored", onContextRestored);
  syncMode();

  return {
    destroy() {
      destroyed = true;
      scheduler.destroy();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      reducedMotion.removeEventListener("change", syncMode);
      canvas?.removeEventListener("contextlost", onContextLost);
      canvas?.removeEventListener("contextrestored", onContextRestored);
    },
  };
}
