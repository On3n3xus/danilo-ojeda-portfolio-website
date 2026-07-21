import { describe, expect, it, vi } from "vitest";
import { createAtlasModeController, createPagehideCleanup } from "./signal-run-lifecycle";

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("createAtlasModeController", () => {
  it("starts once in cinematic mode and ignores a stale dynamic import after becoming static", async () => {
    const mount = {
      hidden: false,
      setAttribute: vi.fn(() => { mount.hidden = true; }),
      removeAttribute: vi.fn(() => { mount.hidden = false; }),
    };
    let resolveLoad: ((factory: () => { destroy: () => void }) => void) | undefined;
    const destroy = vi.fn();
    const load = vi.fn(() => new Promise<() => { destroy: () => void }>((resolve) => {
      resolveLoad = resolve;
    }));
    const controller = createAtlasModeController({ mount, load });

    controller.sync("cinematic");
    controller.sync("cinematic");
    expect(load).toHaveBeenCalledTimes(1);
    expect(mount.hidden).toBe(false);

    controller.sync("static");
    expect(mount.hidden).toBe(true);
    resolveLoad?.(() => ({ destroy }));
    await flushPromises();

    expect(controller.getScene()).toBeNull();
    expect(destroy).not.toHaveBeenCalled();
  });

  it("destroys and hides in static mode, then creates only one replacement on return", async () => {
    const mount = {
      hidden: false,
      setAttribute: vi.fn(() => { mount.hidden = true; }),
      removeAttribute: vi.fn(() => { mount.hidden = false; }),
    };
    const firstDestroy = vi.fn();
    const secondDestroy = vi.fn();
    const factories = [
      vi.fn(() => ({ destroy: firstDestroy })),
      vi.fn(() => ({ destroy: secondDestroy })),
    ];
    const load = vi.fn(async () => factories.shift()!);
    const controller = createAtlasModeController({ mount, load });

    controller.sync("cinematic");
    await flushPromises();
    expect(controller.getScene()).not.toBeNull();

    controller.sync("static");
    expect(firstDestroy).toHaveBeenCalledTimes(1);
    expect(controller.getScene()).toBeNull();
    expect(mount.hidden).toBe(true);

    controller.sync("cinematic");
    controller.sync("cinematic");
    await flushPromises();
    expect(load).toHaveBeenCalledTimes(2);
    expect(controller.getScene()).not.toBeNull();
    expect(mount.hidden).toBe(false);
  });

  it("restarts after a stale import when cinematic mode returns before that import resolves", async () => {
    const mount = {
      hidden: false,
      setAttribute: vi.fn(() => { mount.hidden = true; }),
      removeAttribute: vi.fn(() => { mount.hidden = false; }),
    };
    let resolveFirst: ((factory: () => { destroy: () => void }) => void) | undefined;
    const replacement = { destroy: vi.fn() };
    const load = vi.fn()
      .mockImplementationOnce(() => new Promise<() => { destroy: () => void }>((resolve) => {
        resolveFirst = resolve;
      }))
      .mockResolvedValueOnce(() => replacement);
    const controller = createAtlasModeController({ mount, load });

    controller.sync("cinematic");
    controller.sync("static");
    controller.sync("cinematic");
    resolveFirst?.(() => ({ destroy: vi.fn() }));
    await flushPromises();
    await flushPromises();

    expect(load).toHaveBeenCalledTimes(2);
    expect(controller.getScene()).toBe(replacement);
    expect(mount.hidden).toBe(false);
  });
});

describe("createPagehideCleanup", () => {
  it("retains resources and its listener for bfcache, then cleans up once on a later unload", () => {
    const listeners = new Set<(event: { persisted: boolean }) => void>();
    const target = {
      addEventListener: (_type: string, listener: (event: { persisted: boolean }) => void) => listeners.add(listener),
      removeEventListener: (_type: string, listener: (event: { persisted: boolean }) => void) => listeners.delete(listener),
    };
    const cleanup = vi.fn();
    createPagehideCleanup(target, cleanup);

    [...listeners].forEach((listener) => listener({ persisted: true }));
    expect(cleanup).not.toHaveBeenCalled();
    expect(listeners.size).toBe(1);

    [...listeners].forEach((listener) => listener({ persisted: false }));
    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(listeners.size).toBe(0);
  });
});
