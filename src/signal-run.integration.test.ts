import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Signal Run markup", () => {
  it("keeps every beat and the atlas handoff available without canvas", () => {
    const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");

    expect(html).toContain('id="signal-run"');
    expect(html).toContain('id="signal-run-canvas"');
    expect(html).toContain("Signal received");
    expect(html).toContain("Context assembled");
    expect(html).toContain("Handoffs connected");
    expect(html).toContain("Conversation booked");
    expect(html).toContain('class="signal-run-handoff" href="#atlas"');
  });

  it("defines cinematic enhancement and a readable static fallback", () => {
    const styles = readFileSync(new URL("./style.css", import.meta.url), "utf8");

    expect(styles).toContain('.signal-run[data-signal-mode="cinematic"]');
    expect(styles).toContain('.signal-run[data-signal-mode="static"]');
    expect(styles).toContain(".signal-run.canvas-failed");
  });

  it("uses permanent localized contrast fields without foreground switch selectors", () => {
    const styles = readFileSync(new URL("./style.css", import.meta.url), "utf8");
    const signalRun = readFileSync(new URL("./signal-run.ts", import.meta.url), "utf8");
    const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");

    expect(styles).toContain(`.signal-run[data-signal-mode="cinematic"] .signal-run-intro,
.signal-run[data-signal-mode="cinematic"] .signal-run-stations li,
.signal-run[data-signal-mode="cinematic"] .signal-run-readout {
  color: var(--ink);
}`);
    expect(styles).toContain(`.signal-run[data-signal-mode="cinematic"] .signal-run-intro::before {
  content: "";
  position: absolute;
  z-index: -1;
  inset: -18px -112px -20px -22px;
  background: linear-gradient(90deg, rgba(9, 11, 10, 0.96) 0%, rgba(9, 11, 10, 0.94) calc(100% - 112px), rgba(9, 11, 10, 0) 100%);
  pointer-events: none;
}`);
    expect(styles).toMatch(/\.signal-run-stations li::before[\s\S]*rgba\(9, 11, 10, 0\.94\)/);
    expect(styles).toMatch(/\.signal-run-readout::before[\s\S]*rgba\(9, 11, 10, 0\.94\)/);
    expect(styles).toContain(`.signal-run[data-signal-mode="cinematic"] .signal-run-beats::before {
  content: "";`);
    expect(styles).toMatch(/\.signal-run-beats::before[\s\S]*rgba\(9, 11, 10, 0\.94\)/);
    expect(styles).toMatch(/\.signal-run-handoff::before[\s\S]*rgba\(231, 227, 216, 0\.99\)/);
    expect(styles).not.toContain("data-signal-upper-foreground");
    expect(styles).not.toContain("data-signal-lower-foreground");
    expect(styles).not.toContain("data-signal-lower-treatment");
    expect(signalRun).not.toContain("signalUpperForeground");
    expect(signalRun).not.toContain("signalLowerForeground");
    expect(signalRun).not.toContain("signalLowerTreatment");
    expect(html).not.toContain("data-signal-upper-foreground");
    expect(html).not.toContain("data-signal-lower-foreground");
    expect(html).not.toContain("data-signal-lower-treatment");
    expect(styles).not.toContain(`#signal-run-canvas {
  background: var(--survey);`);
    expect(styles).toContain(`.signal-run[data-signal-mode="cinematic"] .signal-run-handoff {
  position: absolute;`);
    expect(styles).toContain("color: var(--asphalt);");
  });

  it("preserves the canvas route and survey-light handoff gradient", () => {
    const signalRun = readFileSync(new URL("./signal-run.ts", import.meta.url), "utf8");

    expect(signalRun).toContain("drawRoute(context, area, progress);");
    expect(signalRun).toContain("const gradient = context.createLinearGradient(0, height, 0, 0);");
    expect(signalRun).toContain("gradient.addColorStop(0.56");
  });

  it("starts and destroys the chapter through the page lifecycle", () => {
    const main = readFileSync(new URL("./main.ts", import.meta.url), "utf8");
    const signalRun = readFileSync(new URL("./signal-run.ts", import.meta.url), "utf8");

    expect(signalRun).toContain("export function createSignalRun");
    expect(main).toContain("createSignalRun");
    expect(main).toContain("signalRun.destroy()");
  });

  it("does not request the large decorative atlas scene in static mode", () => {
    const main = readFileSync(new URL("./main.ts", import.meta.url), "utf8");

    expect(main).toContain("getSignalMode");
    expect(main).toContain('if (initialSignalMode === "cinematic")');
  });
});
