import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clampSignalProgress,
  createFrameScheduler,
  createSignalRun,
  getSignalChapter,
  getSignalMode,
  getSignalPoint,
  getSignalVisualState,
  isSignalHandoffAccessible,
} from "./signal-run";

class FakeElement {
  readonly attributes = new Map<string, string>();
  readonly dataset: Record<string, string> = {};
  textContent = "";
  blur = vi.fn();
  focus = vi.fn();

  setAttribute(name: string, value: string) {
    this.attributes.set(name, value);
  }

  removeAttribute(name: string) {
    this.attributes.delete(name);
  }

  getAttribute(name: string) {
    return this.attributes.get(name) ?? null;
  }
}

function createSignalRunHarness(options: { getContextError?: Error; drawError?: Error } = {}) {
  const windowListeners = new Map<string, Set<EventListener>>();
  const mediaListeners = new Set<EventListener>();
  const canvasListeners = new Map<string, Set<EventListener>>();
  const frames = new Map<number, FrameRequestCallback>();
  const style = new Map<string, string>();
  const classes = new Set<string>();
  const beats = Array.from({ length: 4 }, () => new FakeElement());
  const stations = Array.from({ length: 6 }, () => new FakeElement());
  const counter = new FakeElement();
  const handoff = new FakeElement();
  let activeElement: FakeElement | null = null;
  handoff.focus.mockImplementation(() => { activeElement = handoff; });
  handoff.blur.mockImplementation(() => {
    if (activeElement === handoff) activeElement = null;
  });
  const context = {
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    clearRect: vi.fn(() => {
      if (options.drawError) throw options.drawError;
    }),
    save: vi.fn(),
    setLineDash: vi.fn(),
    strokeRect: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    restore: vi.fn(),
    setTransform: vi.fn(),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    fillRect: vi.fn(),
  };
  const canvas = {
    clientWidth: 1200,
    clientHeight: 800,
    width: 0,
    height: 0,
    getContext: vi.fn(() => {
      if (options.getContextError) throw options.getContextError;
      return context;
    }),
    addEventListener(type: string, listener: EventListener) {
      const listeners = canvasListeners.get(type) ?? new Set<EventListener>();
      listeners.add(listener);
      canvasListeners.set(type, listeners);
    },
    removeEventListener(type: string, listener: EventListener) {
      canvasListeners.get(type)?.delete(listener);
    },
  };
  const section = {
    dataset: {} as Record<string, string>,
    style: { setProperty: (name: string, value: string) => style.set(name, value) },
    classList: {
      add: (name: string) => classes.add(name),
      remove: (name: string) => classes.delete(name),
    },
    offsetHeight: 4000,
    top: 0,
    getBoundingClientRect() {
      return { top: this.top };
    },
    removeAttribute(name: string) {
      const datasetKey = name.replace(/^data-/, "").replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
      delete this.dataset[datasetKey];
    },
    querySelector(selector: string) {
      if (selector === "#signal-run-canvas") return canvas;
      if (selector === "#signal-run-counter") return counter;
      if (selector === ".signal-run-handoff") return handoff;
      return null;
    },
    querySelectorAll(selector: string) {
      if (selector === "[data-signal-beat]") return beats;
      if (selector === "[data-station]") return stations;
      return [];
    },
  };
  const media = {
    matches: false,
    addEventListener: (_type: string, listener: EventListener) => mediaListeners.add(listener),
    removeEventListener: (_type: string, listener: EventListener) => mediaListeners.delete(listener),
  };
  let nextFrame = 1;
  const fakeWindow = {
    innerWidth: 1200,
    innerHeight: 1000,
    devicePixelRatio: 1,
    matchMedia: () => media,
    addEventListener(type: string, listener: EventListener) {
      const listeners = windowListeners.get(type) ?? new Set<EventListener>();
      listeners.add(listener);
      windowListeners.set(type, listeners);
    },
    removeEventListener(type: string, listener: EventListener) {
      windowListeners.get(type)?.delete(listener);
    },
  };
  const fakeDocument = {
    get activeElement() {
      return activeElement;
    },
  };

  vi.stubGlobal("window", fakeWindow);
  vi.stubGlobal("document", fakeDocument);
  vi.stubGlobal("navigator", { connection: { saveData: false } });
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    const frame = nextFrame++;
    frames.set(frame, callback);
    return frame;
  });
  vi.stubGlobal("cancelAnimationFrame", (frame: number) => frames.delete(frame));

  return {
    beats,
    canvas,
    classes,
    counter,
    frames,
    handoff,
    document: fakeDocument,
    section,
    window: fakeWindow,
    dispatch(type: string) {
      windowListeners.get(type)?.forEach((listener) => listener(new Event(type)));
    },
    dispatchCanvas(type: string, event: Event) {
      canvasListeners.get(type)?.forEach((listener) => listener(event));
    },
    canvasListenerCount(type: string) {
      return canvasListeners.get(type)?.size ?? 0;
    },
    flushFrame() {
      const pending = [...frames.entries()];
      frames.clear();
      pending.forEach(([, callback]) => callback(0));
    },
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("clampSignalProgress", () => {
  it("keeps signal progress within the complete scroll range", () => {
    expect(clampSignalProgress(-0.25)).toBe(0);
    expect(clampSignalProgress(0.42)).toBe(0.42);
    expect(clampSignalProgress(1.25)).toBe(1);
  });
});

describe("getSignalChapter", () => {
  it("selects one of four ordered beats from scroll progress", () => {
    expect(getSignalChapter(0)).toBe(0);
    expect(getSignalChapter(0.249)).toBe(0);
    expect(getSignalChapter(0.25)).toBe(1);
    expect(getSignalChapter(0.5)).toBe(2);
    expect(getSignalChapter(0.75)).toBe(3);
    expect(getSignalChapter(1.4)).toBe(3);
  });
});

describe("getSignalVisualState", () => {
  it("maps only the canvas handoff progress from the final scroll window", () => {
    expect(getSignalVisualState(0.92)).toEqual({ handoffProgress: 0.2 });
    expect(getSignalVisualState(0.949)).toEqual({ handoffProgress: 0.49 });
    expect(getSignalVisualState(0.95)).toEqual({ handoffProgress: 0.5 });
    expect(getSignalVisualState(0.995)).toEqual({ handoffProgress: 0.95 });
  });
});

describe("isSignalHandoffAccessible", () => {
  it("keeps the handoff out of the accessibility tree until it is nearly opaque", () => {
    expect(isSignalHandoffAccessible(0.5)).toBe(false);
    expect(isSignalHandoffAccessible(0.9499)).toBe(false);
    expect(isSignalHandoffAccessible(0.95)).toBe(true);
    expect(isSignalHandoffAccessible(1)).toBe(true);
  });
});

describe("getSignalMode", () => {
  it("uses a static non-looping experience for constrained visitors", () => {
    expect(getSignalMode({ reducedMotion: true, saveData: false, viewportWidth: 1440 })).toBe("static");
    expect(getSignalMode({ reducedMotion: false, saveData: true, viewportWidth: 1440 })).toBe("static");
    expect(getSignalMode({ reducedMotion: false, saveData: false, viewportWidth: 640 })).toBe("static");
    expect(getSignalMode({ reducedMotion: false, saveData: false, viewportWidth: 1440 })).toBe("cinematic");
  });
});

describe("getSignalPoint", () => {
  it("returns deterministic route endpoints for a given drawing area", () => {
    const area = { width: 1000, height: 600 };

    expect(getSignalPoint(0, area)).toEqual({ x: 100, y: 456 });
    expect(getSignalPoint(1, area)).toEqual({ x: 900, y: 132 });
    expect(getSignalPoint(0.47, area)).toEqual(getSignalPoint(0.47, area));
  });
});

describe("createFrameScheduler", () => {
  it("coalesces pending renders and cancels the frame during cleanup", () => {
    let requests = 0;
    const cancelled: number[] = [];
    const scheduler = createFrameScheduler(
      () => undefined,
      () => {
        requests += 1;
        return 17;
      },
      (frame) => cancelled.push(frame),
    );

    scheduler.schedule();
    scheduler.schedule();
    scheduler.destroy();

    expect(requests).toBe(1);
    expect(cancelled).toEqual([17]);
  });
});

describe("createSignalRun", () => {
  it("resynchronizes chapter semantics and clears obsolete foreground state", () => {
    const harness = createSignalRunHarness();
    harness.section.dataset.signalUpperForeground = "dark";
    harness.section.dataset.signalLowerForeground = "dark";
    harness.section.dataset.signalLowerTreatment = "none";
    const controller = createSignalRun(harness.section as unknown as HTMLElement);
    harness.flushFrame();

    expect(harness.counter.textContent).toBe("01 / 04");
    expect(harness.beats[0].getAttribute("aria-current")).toBe("step");
    expect(harness.section.dataset.signalUpperForeground).toBeUndefined();
    expect(harness.section.dataset.signalLowerForeground).toBeUndefined();
    expect(harness.section.dataset.signalLowerTreatment).toBeUndefined();

    harness.window.innerWidth = 700;
    harness.dispatch("resize");
    expect(harness.counter.textContent).toBe("04 / 04");
    expect(harness.beats.every((beat) => !beat.getAttribute("aria-current"))).toBe(true);
    expect(harness.section.dataset.signalUpperForeground).toBeUndefined();
    expect(harness.section.dataset.signalLowerForeground).toBeUndefined();

    harness.window.innerWidth = 1200;
    harness.dispatch("resize");
    harness.flushFrame();

    expect(harness.counter.textContent).toBe("01 / 04");
    expect(harness.beats[0].getAttribute("aria-current")).toBe("step");
    controller.destroy();
  });

  it("does not schedule scroll frames while the static layout is active", () => {
    const harness = createSignalRunHarness();
    harness.window.innerWidth = 700;
    const controller = createSignalRun(harness.section as unknown as HTMLElement);

    expect(harness.frames.size).toBe(0);
    harness.dispatch("scroll");
    expect(harness.frames.size).toBe(0);
    controller.destroy();
  });

  it("falls back to the semantic static experience when canvas context creation throws", () => {
    const harness = createSignalRunHarness({ getContextError: new Error("context unavailable") });
    const controller = createSignalRun(harness.section as unknown as HTMLElement);

    expect(() => harness.flushFrame()).not.toThrow();
    expect(harness.section.dataset.signalMode).toBe("static");
    expect(harness.counter.textContent).toBe("04 / 04");
    controller.destroy();
  });

  it("falls back to the semantic static experience when drawing throws", () => {
    const harness = createSignalRunHarness({ drawError: new Error("draw failed") });
    const controller = createSignalRun(harness.section as unknown as HTMLElement);

    expect(() => harness.flushFrame()).not.toThrow();
    expect(harness.section.dataset.signalMode).toBe("static");
    expect(harness.counter.textContent).toBe("04 / 04");
    controller.destroy();
  });

  it("latches context loss across resize, then restores cinematic mode and removes both listeners", () => {
    const harness = createSignalRunHarness();
    const controller = createSignalRun(harness.section as unknown as HTMLElement);
    harness.flushFrame();
    const contextLost = new Event("contextlost", { cancelable: true });

    harness.dispatchCanvas("contextlost", contextLost);
    expect(contextLost.defaultPrevented).toBe(true);
    expect(harness.section.dataset.signalMode).toBe("static");
    expect(harness.counter.textContent).toBe("04 / 04");
    expect(harness.classes.has("canvas-failed")).toBe(true);

    harness.dispatch("resize");
    harness.flushFrame();
    expect(harness.section.dataset.signalMode).toBe("static");
    expect(harness.classes.has("canvas-failed")).toBe(true);
    expect(harness.canvas.getContext).toHaveBeenCalledTimes(1);

    harness.dispatchCanvas("contextrestored", new Event("contextrestored"));
    expect(harness.canvas.getContext).toHaveBeenCalledTimes(2);
    expect(harness.section.dataset.signalMode).toBe("cinematic");
    expect(harness.classes.has("canvas-failed")).toBe(false);
    harness.flushFrame();

    controller.destroy();
    expect(harness.canvasListenerCount("contextlost")).toBe(0);
    expect(harness.canvasListenerCount("contextrestored")).toBe(0);
  });

  it("exposes the handoff only after it is visibly present and hides it again when scrolling upward", () => {
    const harness = createSignalRunHarness();
    const controller = createSignalRun(harness.section as unknown as HTMLElement);
    harness.flushFrame();

    expect(harness.handoff.getAttribute("aria-hidden")).toBe("true");
    expect(harness.handoff.getAttribute("tabindex")).toBe("-1");

    harness.section.top = -0.994 * 3000;
    harness.dispatch("scroll");
    harness.flushFrame();
    expect(harness.handoff.getAttribute("aria-hidden")).toBe("true");
    expect(harness.handoff.getAttribute("tabindex")).toBe("-1");

    harness.section.top = -0.995 * 3000;
    harness.dispatch("scroll");
    harness.flushFrame();
    expect(harness.handoff.getAttribute("aria-hidden")).toBeNull();
    expect(harness.handoff.getAttribute("tabindex")).toBeNull();

    harness.section.top = -0.994 * 3000;
    harness.dispatch("scroll");
    harness.flushFrame();
    expect(harness.handoff.getAttribute("aria-hidden")).toBe("true");
    expect(harness.handoff.getAttribute("tabindex")).toBe("-1");

    harness.window.innerWidth = 700;
    harness.dispatch("resize");
    expect(harness.handoff.getAttribute("aria-hidden")).toBeNull();
    expect(harness.handoff.getAttribute("tabindex")).toBeNull();
    controller.destroy();
  });

  it("blurs a focused handoff before upward scroll hides it", () => {
    const harness = createSignalRunHarness();
    const controller = createSignalRun(harness.section as unknown as HTMLElement);
    harness.flushFrame();

    harness.section.top = -0.995 * 3000;
    harness.dispatch("scroll");
    harness.flushFrame();
    harness.handoff.focus();
    expect(harness.document.activeElement).toBe(harness.handoff);

    harness.section.top = -0.994 * 3000;
    harness.dispatch("scroll");
    harness.flushFrame();

    expect(harness.handoff.blur).toHaveBeenCalledTimes(1);
    expect(harness.document.activeElement).toBeNull();
    expect(harness.handoff.getAttribute("aria-hidden")).toBe("true");
    expect(harness.handoff.getAttribute("tabindex")).toBe("-1");
    controller.destroy();
  });
});
