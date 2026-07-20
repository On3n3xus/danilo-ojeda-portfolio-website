import {
  ACESFilmicToneMapping,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Color,
  CylinderGeometry,
  DirectionalLight,
  Fog,
  HemisphereLight,
  IcosahedronGeometry,
  InstancedMesh,
  Line,
  LineBasicMaterial,
  LineDashedMaterial,
  LineSegments,
  Material,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  OctahedronGeometry,
  PerspectiveCamera,
  PlaneGeometry,
  Points,
  PointsMaterial,
  Scene,
  SRGBColorSpace,
  StaticDrawUsage,
  TorusGeometry,
  Vector3,
  WebGLRenderer,
} from "three";

export type AtlasProject = "wyn" | "miguel" | "micro";

export interface AtlasSceneOptions {
  initialSection?: string;
  maxPixelRatio?: number;
  reducedMotion?: boolean;
}

export interface AtlasSceneController {
  update(scrollProgress: number, section: string): void;
  focusProject(project: AtlasProject | null): void;
  resize(): void;
  destroy(): void;
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const easeTo = (current: number, target: number, speed: number, delta: number) =>
  current + (target - current) * (1 - Math.exp(-speed * delta));

const sectionPalette = (section: string, progress: number) => {
  const id = section.toLowerCase();
  if (id.includes("contact") || id.includes("final") || id.includes("survey") || id.includes("signal")) return 1;
  if (id.includes("work") || id.includes("project") || id.includes("case")) return 0.78;
  if (id.includes("record") || id.includes("proof")) return 0.68;
  if (id.includes("pipeline") || id.includes("system") || id.includes("process")) return 0.42;
  if (id.includes("hero") || id.includes("home") || id.includes("intro") || id.includes("night")) return 0;
  return clamp01(progress);
};

interface ProjectTower {
  key: AtlasProject;
  x: number;
  z: number;
  mesh: Mesh<BufferGeometry, MeshStandardMaterial>;
  cap: Mesh<BufferGeometry, MeshBasicMaterial>;
  material: MeshStandardMaterial;
  capMaterial: MeshBasicMaterial;
  night: Color;
  survey: Color;
  focus: number;
  spin: number;
}

/** A lightweight CRE signal atlas. The canvas is decorative and never captures input. */
export function createAtlasScene(
  mount: HTMLElement,
  options: AtlasSceneOptions = {},
): AtlasSceneController {
  const mediaReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const reducedMotion = options.reducedMotion ?? mediaReduced;
  const allowPointer = window.matchMedia("(pointer: fine)").matches && !reducedMotion;
  const maxPixelRatio = Math.max(1, options.maxPixelRatio ?? 1.75);

  const scene = new Scene();
  const camera = new PerspectiveCamera(34, 1, 0.1, 160);
  camera.position.set(-25, 22, 28);

  const renderer = new WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: "default",
  });
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.92;
  renderer.domElement.setAttribute("aria-hidden", "true");
  renderer.domElement.setAttribute("role", "presentation");
  renderer.domElement.tabIndex = -1;
  Object.assign(renderer.domElement.style, {
    display: "block",
    position: "absolute",
    inset: "0",
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    userSelect: "none",
  });
  mount.append(renderer.domElement);

  const palette = {
    night: {
      clear: new Color("#050403"),
      ground: new Color("#090908"),
      mass: new Color("#171a19"),
      marker: new Color("#76a991"),
      grid: new Color("#3657d6"),
      route: new Color("#b8643e"),
      light: new Color("#d7d9d1"),
    },
    survey: {
      clear: new Color("#e7e5dc"),
      ground: new Color("#d5d2c7"),
      mass: new Color("#a8aaa2"),
      marker: new Color("#3657d6"),
      grid: new Color("#3657d6"),
      route: new Color("#a94f32"),
      light: new Color("#fffdf4"),
    },
  };
  const colorScratch = new Color();
  const lookTarget = new Vector3();
  const resources: Array<BufferGeometry | Material> = [];

  const fog = new Fog(palette.night.clear, 18, 76);
  scene.fog = fog;

  const hemisphere = new HemisphereLight(palette.night.light, palette.night.clear, 2.1);
  const keyLight = new DirectionalLight(palette.night.light, 2.7);
  keyLight.position.set(-16, 28, 12);
  scene.add(hemisphere, keyLight);

  const groundGeometry = new PlaneGeometry(110, 110);
  const groundMaterial = new MeshStandardMaterial({
    color: palette.night.ground,
    roughness: 0.96,
    metalness: 0.02,
  });
  const ground = new Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.08;
  scene.add(ground);
  resources.push(groundGeometry, groundMaterial);

  const gridPositions = new Float32Array(31 * 4 * 3);
  let gridCursor = 0;
  for (let index = 0; index < 31; index += 1) {
    const offset = -45 + index * 3;
    gridPositions[gridCursor++] = -45;
    gridPositions[gridCursor++] = 0;
    gridPositions[gridCursor++] = offset;
    gridPositions[gridCursor++] = 45;
    gridPositions[gridCursor++] = 0;
    gridPositions[gridCursor++] = offset;
    gridPositions[gridCursor++] = offset;
    gridPositions[gridCursor++] = 0;
    gridPositions[gridCursor++] = -45;
    gridPositions[gridCursor++] = offset;
    gridPositions[gridCursor++] = 0;
    gridPositions[gridCursor++] = 45;
  }
  const gridGeometry = new BufferGeometry();
  gridGeometry.setAttribute("position", new BufferAttribute(gridPositions, 3));
  const gridMaterial = new LineBasicMaterial({
    color: palette.night.grid,
    transparent: true,
    opacity: 0.13,
    depthWrite: false,
  });
  const grid = new LineSegments(gridGeometry, gridMaterial);
  grid.position.y = 0.01;
  scene.add(grid);
  resources.push(gridGeometry, gridMaterial);

  const buildingCount = 100;
  const windowsPerBuilding = 4;
  const markerPositions = new Float32Array(buildingCount * windowsPerBuilding * 3);
  const buildingGeometry = new BoxGeometry(1, 1, 1);
  const buildingMaterial = new MeshStandardMaterial({
    color: palette.night.mass,
    roughness: 0.78,
    metalness: 0.16,
  });
  const buildings = new InstancedMesh(buildingGeometry, buildingMaterial, buildingCount);
  buildings.instanceMatrix.setUsage(StaticDrawUsage);
  const matrixObject = new Object3D();
  const reserved = new Set([28, 32, 65]);
  let markerCursor = 0;
  const noise = (seed: number) => {
    const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
    return value - Math.floor(value);
  };

  for (let index = 0; index < buildingCount; index += 1) {
    const column = index % 10;
    const row = Math.floor(index / 10);
    const isProjectParcel = reserved.has(index);
    const x = (column - 4.5) * 3.2 + (isProjectParcel ? 0 : (noise(index) - 0.5) * 0.34);
    const z = (row - 4.5) * 3.2 + (isProjectParcel ? 0 : (noise(index + 31) - 0.5) * 0.34);
    const width = isProjectParcel ? 2.55 : 1.35 + noise(index + 61) * 0.92;
    const depth = isProjectParcel ? 2.55 : 1.35 + noise(index + 91) * 0.92;
    const height = isProjectParcel ? 0.24 : 1.4 + noise(index + 121) * 7.2;

    matrixObject.position.set(x, height * 0.5, z);
    matrixObject.rotation.set(0, isProjectParcel ? 0 : (noise(index + 151) - 0.5) * 0.09, 0);
    matrixObject.scale.set(width, height, depth);
    matrixObject.updateMatrix();
    buildings.setMatrixAt(index, matrixObject.matrix);

    for (let marker = 0; marker < windowsPerBuilding; marker += 1) {
      const front = marker % 2 === 0;
      markerPositions[markerCursor++] = front
        ? x + (marker === 0 ? -0.2 : 0.2) * width
        : x + width * 0.51;
      markerPositions[markerCursor++] = Math.max(0.16, height * (0.2 + marker * 0.18));
      markerPositions[markerCursor++] = front
        ? z + depth * 0.51
        : z + (marker === 1 ? -0.2 : 0.2) * depth;
    }
  }
  buildings.instanceMatrix.needsUpdate = true;
  buildings.computeBoundingSphere();
  scene.add(buildings);
  resources.push(buildingGeometry, buildingMaterial);

  const markerGeometry = new BufferGeometry();
  markerGeometry.setAttribute("position", new BufferAttribute(markerPositions, 3));
  const markerMaterial = new PointsMaterial({
    color: palette.night.marker,
    size: 0.13,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
  });
  const markers = new Points(markerGeometry, markerMaterial);
  scene.add(markers);
  resources.push(markerGeometry, markerMaterial);

  const towers: ProjectTower[] = [];
  const addTower = (
    key: AtlasProject,
    x: number,
    z: number,
    height: number,
    geometry: BufferGeometry,
    capGeometry: BufferGeometry,
    night: string,
    survey: string,
    spin: number,
  ) => {
    const material = new MeshStandardMaterial({
      color: night,
      emissive: night,
      emissiveIntensity: 0.32,
      roughness: 0.46,
      metalness: 0.34,
    });
    const capMaterial = new MeshBasicMaterial({ color: night });
    const mesh = new Mesh(geometry, material);
    const cap = new Mesh(capGeometry, capMaterial);
    mesh.position.set(x, height * 0.5 + 0.24, z);
    cap.position.set(x, height + 0.48, z);
    scene.add(mesh, cap);
    resources.push(geometry, capGeometry, material, capMaterial);
    towers.push({
      key,
      x,
      z,
      mesh,
      cap,
      material,
      capMaterial,
      night: new Color(night),
      survey: new Color(survey),
      focus: 0,
      spin,
    });
  };

  const wynBody = new CylinderGeometry(1.45, 1.78, 11.5, 6);
  const wynCap = new IcosahedronGeometry(0.52, 0);
  addTower("wyn", -8, -4.8, 11.5, wynBody, wynCap, "#76a991", "#3657d6", 0.32);

  const miguelBody = new BoxGeometry(2.35, 8.8, 2.35);
  const miguelCap = new TorusGeometry(0.76, 0.1, 6, 24);
  miguelBody.rotateY(Math.PI * 0.25);
  miguelCap.rotateX(Math.PI * 0.5);
  addTower("miguel", 1.6, 4.8, 8.8, miguelBody, miguelCap, "#b8643e", "#a94f32", -0.42);

  const microBody = new CylinderGeometry(0.92, 1.48, 7.3, 4);
  const microCap = new OctahedronGeometry(0.56, 0);
  microBody.rotateY(Math.PI * 0.25);
  addTower("micro", 11.2, -8, 7.3, microBody, microCap, "#7799a6", "#76a991", 0.56);

  const routeGeometry = new BufferGeometry().setFromPoints([
    new Vector3(-18, 0.18, 9.5),
    new Vector3(-12.5, 0.18, 3.4),
    new Vector3(-8, 0.18, -4.8),
    new Vector3(-2.1, 0.18, -0.8),
    new Vector3(1.6, 0.18, 4.8),
    new Vector3(7.4, 0.18, 0.2),
    new Vector3(11.2, 0.18, -8),
    new Vector3(18, 0.18, -12),
  ]);
  const routeMaterial = new LineDashedMaterial({
    color: palette.night.route,
    dashSize: 0.9,
    gapSize: 0.55,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
  });
  const route = new Line(routeGeometry, routeMaterial);
  route.computeLineDistances();
  route.renderOrder = 3;
  scene.add(route);
  resources.push(routeGeometry, routeMaterial);

  let scrollTarget = 0;
  let scrollCurrent = 0;
  let paletteTarget = sectionPalette(options.initialSection ?? "hero", 0);
  let paletteCurrent = paletteTarget;
  let focusedProject: AtlasProject | null = null;
  let focusX = 0;
  let focusZ = 0;
  let pointerTargetX = 0;
  let pointerTargetY = 0;
  let pointerX = 0;
  let pointerY = 0;
  let width = 1;
  let height = 1;
  let desiredPixelRatio = 1;
  let pixelRatio = 1;
  let qualityTime = 0;
  let qualityFrames = 0;
  let destroyed = false;
  let animationFrame = 0;
  let lastTime = performance.now();

  const getAdaptivePixelRatio = () => {
    const lowPower = (navigator.hardwareConcurrency || 8) <= 4;
    const deviceCap = lowPower ? 1.25 : width < 720 ? 1.35 : maxPixelRatio;
    return Math.max(1, Math.min(window.devicePixelRatio || 1, deviceCap, maxPixelRatio));
  };

  const resize = () => {
    if (destroyed) return;
    width = Math.max(1, mount.clientWidth || window.innerWidth);
    height = Math.max(1, mount.clientHeight || window.innerHeight);
    desiredPixelRatio = getAdaptivePixelRatio();
    pixelRatio = desiredPixelRatio;
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    if (reducedMotion) start();
  };

  const onPointerMove = (event: PointerEvent) => {
    pointerTargetX = event.clientX / Math.max(1, window.innerWidth) * 2 - 1;
    pointerTargetY = 1 - event.clientY / Math.max(1, window.innerHeight) * 2;
  };

  const render = (now: number) => {
    animationFrame = 0;
    if (destroyed || document.hidden) return;
    const delta = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
    lastTime = now;
    const motionSpeed = reducedMotion ? 10000 : 5.5;

    scrollCurrent = easeTo(scrollCurrent, scrollTarget, motionSpeed, delta);
    paletteCurrent = easeTo(paletteCurrent, paletteTarget, motionSpeed * 0.8, delta);
    pointerX = easeTo(pointerX, pointerTargetX, 4.2, delta);
    pointerY = easeTo(pointerY, pointerTargetY, 4.2, delta);

    let desiredFocusX = 0;
    let desiredFocusZ = 0;
    for (const tower of towers) {
      const selected = focusedProject === null ? 0 : tower.key === focusedProject ? 1 : -0.28;
      tower.focus = easeTo(tower.focus, selected, reducedMotion ? 10000 : 8, delta);
      tower.material.emissiveIntensity = 0.3 + Math.max(0, tower.focus) * 1.7;
      tower.capMaterial.opacity = 0.72 + Math.max(0, tower.focus) * 0.28;
      tower.capMaterial.transparent = tower.capMaterial.opacity < 1;
      if (!reducedMotion) tower.cap.rotation.y += delta * tower.spin * (1 + Math.max(0, tower.focus));
      if (tower.key === focusedProject) {
        desiredFocusX = tower.x;
        desiredFocusZ = tower.z;
      }
      tower.material.color.copy(tower.night).lerp(tower.survey, paletteCurrent);
      tower.material.emissive.copy(tower.material.color);
      tower.capMaterial.color.copy(tower.night).lerp(tower.survey, paletteCurrent);
    }
    focusX = easeTo(focusX, desiredFocusX, reducedMotion ? 10000 : 4.5, delta);
    focusZ = easeTo(focusZ, desiredFocusZ, reducedMotion ? 10000 : 4.5, delta);

    const angle = -0.72 + scrollCurrent * 0.95;
    const radius = 38 - scrollCurrent * 10;
    const cameraX = Math.sin(angle) * radius + pointerX * 1.55;
    const cameraY = 22 - scrollCurrent * 5.4 + pointerY * 0.9;
    const cameraZ = Math.cos(angle) * radius;
    camera.position.x = easeTo(camera.position.x, cameraX, motionSpeed, delta);
    camera.position.y = easeTo(camera.position.y, cameraY, motionSpeed, delta);
    camera.position.z = easeTo(camera.position.z, cameraZ, motionSpeed, delta);
    lookTarget.set(focusX * 0.34, 2.4 + scrollCurrent * 1.8, focusZ * 0.34);
    camera.lookAt(lookTarget);

    colorScratch.copy(palette.night.clear).lerp(palette.survey.clear, paletteCurrent);
    renderer.setClearColor(colorScratch, 1);
    fog.color.copy(colorScratch);
    fog.near = 18 + paletteCurrent * 8;
    fog.far = 76 + paletteCurrent * 22;
    groundMaterial.color.copy(palette.night.ground).lerp(palette.survey.ground, paletteCurrent);
    buildingMaterial.color.copy(palette.night.mass).lerp(palette.survey.mass, paletteCurrent);
    markerMaterial.color.copy(palette.night.marker).lerp(palette.survey.marker, paletteCurrent);
    gridMaterial.color.copy(palette.night.grid).lerp(palette.survey.grid, paletteCurrent);
    routeMaterial.color.copy(palette.night.route).lerp(palette.survey.route, paletteCurrent);
    hemisphere.color.copy(palette.night.light).lerp(palette.survey.light, paletteCurrent);
    hemisphere.groundColor.copy(palette.night.clear).lerp(palette.survey.ground, paletteCurrent);
    keyLight.color.copy(palette.night.light).lerp(palette.survey.light, paletteCurrent);
    gridMaterial.opacity = 0.13 + paletteCurrent * 0.12;
    markerMaterial.opacity = 0.68 + paletteCurrent * 0.2;
    routeMaterial.opacity = reducedMotion ? 0.9 : 0.76 + Math.sin(now * 0.0022) * 0.16;

    renderer.render(scene, camera);

    qualityTime += delta;
    qualityFrames += 1;
    if (qualityTime > 2.5 && qualityFrames > 30) {
      const averageFrame = qualityTime / qualityFrames;
      let nextRatio = pixelRatio;
      if (averageFrame > 1 / 45) nextRatio = Math.max(1, pixelRatio - 0.25);
      else if (averageFrame < 1 / 58) nextRatio = Math.min(desiredPixelRatio, pixelRatio + 0.125);
      if (nextRatio !== pixelRatio) {
        pixelRatio = nextRatio;
        renderer.setPixelRatio(pixelRatio);
        renderer.setSize(width, height, false);
      }
      qualityTime = 0;
      qualityFrames = 0;
    }
    if (!reducedMotion) animationFrame = requestAnimationFrame(render);
  };

  const start = () => {
    if (destroyed || document.hidden || animationFrame) return;
    lastTime = performance.now();
    animationFrame = requestAnimationFrame(render);
  };

  const onVisibilityChange = () => {
    if (document.hidden) {
      cancelAnimationFrame(animationFrame);
      animationFrame = 0;
    } else {
      start();
    }
  };

  const update = (scrollProgress: number, section: string) => {
    scrollTarget = clamp01(Number.isFinite(scrollProgress) ? scrollProgress : 0);
    paletteTarget = sectionPalette(section, scrollTarget);
    if (reducedMotion) start();
  };

  const focusProject = (project: AtlasProject | null) => {
    focusedProject = project;
    if (reducedMotion) start();
  };

  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    cancelAnimationFrame(animationFrame);
    resizeObserver?.disconnect();
    window.removeEventListener("resize", resize);
    if (allowPointer) window.removeEventListener("pointermove", onPointerMove);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    for (const resource of resources) resource.dispose();
    scene.clear();
    renderer.renderLists.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement.remove();
  };

  const resizeObserver = typeof ResizeObserver === "undefined"
    ? null
    : new ResizeObserver(resize);
  resizeObserver?.observe(mount);
  window.addEventListener("resize", resize, { passive: true });
  if (allowPointer) window.addEventListener("pointermove", onPointerMove, { passive: true });
  document.addEventListener("visibilitychange", onVisibilityChange);
  resize();
  start();

  return { update, focusProject, resize, destroy };
}
