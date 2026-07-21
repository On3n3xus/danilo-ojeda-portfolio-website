type SignalMode = "cinematic" | "static";

type AtlasScene = {
  destroy: () => void;
};

type AtlasMount = {
  setAttribute: (name: string, value: string) => void;
  removeAttribute: (name: string) => void;
};

type AtlasModeControllerOptions<Scene extends AtlasScene> = {
  mount: AtlasMount;
  load: () => Promise<() => Scene>;
  onSceneChange?: (scene: Scene | null) => void;
  onError?: (error: unknown) => void;
};

export function createAtlasModeController<Scene extends AtlasScene>({
  mount,
  load,
  onSceneChange,
  onError,
}: AtlasModeControllerOptions<Scene>) {
  let scene: Scene | null = null;
  let loading: Promise<void> | null = null;
  let mode: SignalMode = "static";
  let generation = 0;
  let destroyed = false;

  const sync = (nextMode: SignalMode) => {
    if (destroyed) return;
    mode = nextMode;

    if (mode === "static") {
      generation += 1;
      mount.setAttribute("hidden", "");
      if (scene) {
        scene.destroy();
        scene = null;
        onSceneChange?.(null);
      }
      return;
    }

    mount.removeAttribute("hidden");
    if (scene || loading) return;

    const startGeneration = generation;
    const start = load()
      .then((createScene) => {
        if (destroyed || mode !== "cinematic" || generation !== startGeneration) return;
        scene = createScene();
        onSceneChange?.(scene);
      })
      .catch((error: unknown) => {
        if (destroyed || mode !== "cinematic" || generation !== startGeneration) return;
        mount.setAttribute("hidden", "");
        onError?.(error);
      })
      .finally(() => {
        if (loading !== start) return;
        loading = null;
        if (!destroyed && mode === "cinematic" && generation !== startGeneration) sync(mode);
      });
    loading = start;
  };

  return {
    sync,
    getScene: () => scene,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      generation += 1;
      scene?.destroy();
      scene = null;
      loading = null;
      onSceneChange?.(null);
    },
  };
}

type PagehideTarget = {
  addEventListener: (type: "pagehide", listener: (event: PageTransitionEvent) => void) => void;
  removeEventListener: (type: "pagehide", listener: (event: PageTransitionEvent) => void) => void;
};

export function createPagehideCleanup(target: PagehideTarget, cleanup: () => void): () => void {
  let cleaned = false;
  const onPagehide = (event: PageTransitionEvent) => {
    if (event.persisted || cleaned) return;
    cleaned = true;
    target.removeEventListener("pagehide", onPagehide);
    cleanup();
  };

  target.addEventListener("pagehide", onPagehide);
  return () => target.removeEventListener("pagehide", onPagehide);
}
