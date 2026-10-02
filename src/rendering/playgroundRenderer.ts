import { Application, Assets, Container, Graphics, Sprite, Text } from 'pixi.js';
import type { Texture } from 'pixi.js';
import { PHYSICS_GEOMETRY } from '../game/config/tuning';
import type { Tuning } from '../game/config/tuning';
import { CARGO } from '../game/content/cargo';
import type { CargoKind } from '../game/content/cargo';
import type { Scenario } from '../game/content/scenarios';
import type { SimulationSnapshot } from '../game/physics/simulation';
import { publicAsset } from '../utils/publicAsset';
import { VISUALS } from './visualDefinitions';

const GROUND_SCREEN_Y = 470;
const BODY_VISUAL_OFFSET_Y = 0.21;
const SHELL_VISUAL_OFFSET_Y = 0.12;
const CARGO_LABEL_SCREEN_SIZE = 14;

interface CargoVisual {
  sprite: Sprite;
  label: Text;
}

/** Pixi mirrors a simulation snapshot. It never controls authoritative bodies. */
export class PlaygroundRenderer {
  private readonly viewport = new Container();
  private readonly world = new Container();
  private readonly terrain = new Graphics();
  private readonly water = new Graphics();
  private readonly farTrees = new Graphics();
  private readonly nearTrees = new Graphics();
  private readonly labelLines = new Graphics();
  private readonly debugWorld = new Graphics();
  private readonly debugGuide = new Graphics();
  private readonly guideLabel = new Text({
    text: 'Ventana de cámara',
    style: { fontFamily: 'Arial, sans-serif', fontSize: 14, fill: 0x365746 },
  });
  private readonly shellContainer = new Container();
  private readonly turtle: Sprite;
  private readonly shell: Sprite;
  private readonly cargoVisuals = new Map<CargoKind, CargoVisual>();
  private readonly resizeObserver: ResizeObserver;
  private viewportScale = 1;
  private disposed = false;

  static async create(host: HTMLElement, tuning: Tuning): Promise<PlaygroundRenderer> {
    const app = new Application();
    try {
      await app.init({
        width: tuning.viewWidth,
        height: tuning.viewHeight,
        backgroundColor: 0x182a22,
        antialias: true,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
        autoDensity: true,
        autoStart: false,
        sharedTicker: false,
        preference: 'webgl',
      });
      const paths = [
        ...VISUALS.turtle.frames,
        VISUALS.shell.path,
        ...CARGO.map(({ id }) => VISUALS[id].path),
      ];
      const textures = new Map(
        await Promise.all(paths.map(async (path) => [
          path, await Assets.load<Texture>(publicAsset(path)),
        ] as const)),
      );
      return new PlaygroundRenderer(app, host, tuning, textures);
    } catch (error) {
      if (app.renderer) app.destroy({ removeView: true }, { children: true });
      throw error;
    }
  }

  private constructor(
    private readonly app: Application,
    private readonly host: HTMLElement,
    private readonly tuning: Tuning,
    private readonly textures: ReadonlyMap<string, Texture>,
  ) {
    const ppm = tuning.worldPixelsPerMetre;
    this.app.stage.eventMode = 'none';
    this.app.stage.addChild(this.viewport);

    const mask = new Graphics()
      .rect(0, 0, tuning.viewWidth, tuning.viewHeight)
      .fill(0xffffff);
    this.viewport.addChild(mask);
    this.viewport.mask = mask;
    this.viewport.addChild(
      new Graphics().rect(0, 0, tuning.viewWidth, tuning.viewHeight).fill(0xe4efdb),
    );
    this.drawBackground();
    this.viewport.addChild(this.farTrees, this.nearTrees, this.world);

    this.turtle = new Sprite(this.texture(VISUALS.turtle.frames[0]));
    this.turtle.anchor.set(VISUALS.turtle.anchorX, VISUALS.turtle.anchorY);
    this.turtle.width = VISUALS.turtle.width * ppm;
    this.turtle.height = VISUALS.turtle.height * ppm;
    this.turtle.visible = false;

    this.shell = new Sprite(this.texture(VISUALS.shell.path));
    this.shell.anchor.set(VISUALS.shell.anchorX, VISUALS.shell.anchorY);
    this.shell.width = VISUALS.shell.width * ppm;
    this.shell.height = VISUALS.shell.height * ppm;
    this.shell.y = -SHELL_VISUAL_OFFSET_Y * ppm;
    this.shellContainer.addChild(this.shell);
    this.shellContainer.visible = false;
    this.world.addChild(this.water, this.terrain, this.turtle, this.shellContainer);

    for (const definition of CARGO) {
      const visual = VISUALS[definition.id];
      const sprite = new Sprite(this.texture(visual.path));
      sprite.anchor.set(visual.anchorX, visual.anchorY);
      sprite.width = visual.width * ppm;
      sprite.height = visual.height * ppm;
      sprite.visible = false;
      const label = new Text({
        text: definition.label,
        style: {
          fontFamily: 'Arial, sans-serif',
          fontSize: CARGO_LABEL_SCREEN_SIZE,
          fontWeight: 'bold',
          fill: 0x253d31,
          stroke: { color: 0xf8f5df, width: 3 },
        },
      });
      label.anchor.set(1, 0.5);
      label.visible = false;
      this.cargoVisuals.set(definition.id, { sprite, label });
      this.world.addChild(sprite);
    }
    this.world.addChild(this.labelLines);
    for (const { label } of this.cargoVisuals.values()) this.world.addChild(label);
    this.world.addChild(this.debugWorld);
    this.guideLabel.anchor.set(0.5, 0.5);
    this.viewport.addChild(this.debugGuide, this.guideLabel);
    this.debugWorld.visible = false;
    this.debugGuide.visible = false;
    this.guideLabel.visible = false;

    this.app.canvas.style.display = 'block';
    this.app.canvas.setAttribute('role', 'img');
    this.app.canvas.setAttribute('aria-label', 'Laboratorio de físicas de Mudanzas Tortuga');
    this.host.appendChild(this.app.canvas);
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.host);
    this.resize();
  }

  setScenario(scenario: Scenario): void {
    if (this.disposed) return;
    const ppm = this.tuning.worldPixelsPerMetre;
    this.terrain.clear();
    this.water.clear();
    for (const strip of scenario.terrain) {
      const first = strip.points[0];
      const last = strip.points[strip.points.length - 1];
      const bottom = Math.min(-20, ...strip.points.map(({ y }) => y - 10));
      const points = strip.points.flatMap(({ x, y }) => [x * ppm, -y * ppm]);
      this.terrain.poly([
        ...points, last.x * ppm, -bottom * ppm, first.x * ppm, -bottom * ppm,
      ]).fill(strip.biome === 'grass' ? 0x91ad61 : 0x87938d);
      this.terrain.poly(points, false).stroke({
        width: 5,
        color: strip.biome === 'grass' ? 0x4c7444 : 0x425750,
      });
    }
    if (scenario.water) {
      const { left, right, surface, bottom } = scenario.water;
      this.water.rect(
        left * ppm, -surface * ppm, (right - left) * ppm, (surface - bottom) * ppm,
      ).fill({ color: 0x4ca6c1, alpha: 0.42 });
      this.water.moveTo(left * ppm, -surface * ppm)
        .lineTo(right * ppm, -surface * ppm)
        .stroke({ width: 3, color: 0x267d9b, alpha: 0.85 });
    }
  }

  render(snapshot: SimulationSnapshot, debugVertices?: Float32Array): void {
    if (this.disposed) return;
    const ppm = this.tuning.worldPixelsPerMetre;
    this.world.position.set(-snapshot.cameraX * ppm, GROUND_SCREEN_Y + snapshot.cameraY * ppm);
    this.farTrees.x = -this.wrappedParallax(snapshot.cameraX * ppm * 0.12);
    this.nearTrees.x = -this.wrappedParallax(snapshot.cameraX * ppm * 0.25);

    const logicalFrame = Math.floor(snapshot.time * VISUALS.turtle.framesPerSecond)
      % VISUALS.turtle.logicalFrames;
    const keyframe = Math.floor(
      logicalFrame * VISUALS.turtle.frames.length / VISUALS.turtle.logicalFrames,
    );
    this.turtle.texture = this.texture(VISUALS.turtle.frames[keyframe]);
    this.turtle.position.set(
      snapshot.turtle.x * ppm, -(snapshot.turtle.y + BODY_VISUAL_OFFSET_Y) * ppm,
    );
    this.turtle.visible = true;
    this.shellContainer.position.set(
      snapshot.turtle.x * ppm,
      -(snapshot.turtle.y + PHYSICS_GEOMETRY.shellPivotY) * ppm,
    );
    this.shellContainer.rotation = -snapshot.turtle.angle;
    this.shellContainer.visible = true;

    this.labelLines.clear();
    for (const visual of this.cargoVisuals.values()) {
      visual.sprite.visible = false;
      visual.label.visible = false;
    }
    for (const item of snapshot.cargo) {
      const visual = this.cargoVisuals.get(item.id);
      if (!visual) throw new Error('Missing cargo visual: ' + item.id);
      const definition = VISUALS[item.id];
      visual.sprite.position.set(item.x * ppm, -item.y * ppm);
      visual.sprite.rotation = -item.angle;
      visual.sprite.alpha = item.state === 'lost' ? 0.3 : 1;
      visual.sprite.visible = true;
      const halfExtent = (
        Math.abs(Math.cos(item.angle)) * definition.width
        + Math.abs(Math.sin(item.angle)) * definition.height
      ) * ppm / 2;
      const labelX = item.x * ppm - halfExtent - 10;
      const labelY = -item.y * ppm;
      visual.label.position.set(labelX, labelY);
      visual.label.text = item.label + (item.state === 'lost' ? ' ×' : item.state === 'separated' ? ' ↔' : '');
      visual.label.style.fill = item.state === 'separated' ? 0x86570d : 0x253d31;
      visual.label.alpha = item.state === 'lost' ? 0.55 : 1;
      visual.label.visible = true;
      this.labelLines.moveTo(labelX + 3, labelY)
        .lineTo(item.x * ppm - halfExtent + 4, labelY)
        .stroke({ width: 1, color: 0x365746, alpha: item.state === 'lost' ? 0.3 : 0.65 });
    }

    this.drawDebug(snapshot, debugVertices);
    this.app.render();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.resizeObserver.disconnect();
    // Assets caches the seven shared textures; scene teardown must preserve them.
    this.app.destroy({ removeView: true }, { children: true, texture: false, textureSource: false });
  }

  private texture(path: string): Texture {
    const texture = this.textures.get(path);
    if (!texture) throw new Error('Missing loaded texture: ' + path);
    return texture;
  }

  private wrappedParallax(offset: number): number {
    return ((offset % this.tuning.viewWidth) + this.tuning.viewWidth) % this.tuning.viewWidth;
  }

  private drawBackground(): void {
    const width = this.tuning.viewWidth;
    for (let tile = 0; tile < 3; tile++) {
      for (let index = 0; index < 12; index++) {
        const x = tile * width + index * width / 12;
        const top = 245 + (index % 4) * 21;
        this.farTrees.rect(x, top, 10, 270).fill({ color: 0x527a60, alpha: 0.13 });
        this.farTrees.circle(x + 5, top, 48 + (index % 3) * 9)
          .fill({ color: 0x729b74, alpha: 0.2 });
      }
      for (let index = 0; index < 8; index++) {
        const x = tile * width + index * width / 8 + 45;
        const top = 320 + (index % 3) * 17;
        this.nearTrees.rect(x, top, 12, 215).fill({ color: 0x446c51, alpha: 0.13 });
        this.nearTrees.circle(x + 6, top, 58)
          .fill({ color: 0x5e8868, alpha: 0.18 });
      }
    }
  }

  private resize(): void {
    if (this.disposed) return;
    const bounds = this.host.getBoundingClientRect();
    const width = Math.max(1, Math.round(bounds.width));
    const height = Math.max(1, Math.round(bounds.height));
    this.app.renderer.resize(width, height);
    this.viewportScale = Math.min(width / this.tuning.viewWidth, height / this.tuning.viewHeight);
    this.viewport.scale.set(this.viewportScale);
    this.viewport.position.set(
      (width - this.tuning.viewWidth * this.viewportScale) / 2,
      (height - this.tuning.viewHeight * this.viewportScale) / 2,
    );
    const labelSize = CARGO_LABEL_SCREEN_SIZE / Math.min(1, this.viewportScale);
    for (const { label } of this.cargoVisuals.values()) label.style.fontSize = labelSize;
    this.guideLabel.style.fontSize = labelSize;
    this.app.render();
  }

  private drawDebug(snapshot: SimulationSnapshot, vertices?: Float32Array): void {
    const enabled = vertices !== undefined;
    this.debugWorld.visible = enabled;
    this.debugGuide.visible = enabled;
    this.guideLabel.visible = enabled;
    this.debugWorld.clear();
    this.debugGuide.clear();
    if (!vertices) return;
    const ppm = this.tuning.worldPixelsPerMetre;

    for (let index = 0; index + 3 < vertices.length; index += 4) {
      this.debugWorld.moveTo(vertices[index] * ppm, -vertices[index + 1] * ppm)
        .lineTo(vertices[index + 2] * ppm, -vertices[index + 3] * ppm);
    }
    this.debugWorld.stroke({ width: 1.5, color: 0x1cb8dc, alpha: 0.9 });

    const positions = new Map<string, { x: number; y: number }>([
      ['shell', { x: snapshot.turtle.x, y: snapshot.turtle.y + PHYSICS_GEOMETRY.shellPivotY }],
    ]);
    for (const item of snapshot.cargo) positions.set(item.id, item);
    for (const contact of snapshot.contacts) {
      const a = positions.get(contact.a);
      const b = positions.get(contact.b);
      if (a && b) this.debugWorld.moveTo(a.x * ppm, -a.y * ppm).lineTo(b.x * ppm, -b.y * ppm);
    }
    this.debugWorld.stroke({ width: 2, color: 0x18a86f, alpha: 0.95 });

    this.drawMassMarker(snapshot.turtle.x, snapshot.turtle.y);
    this.drawMassMarker(snapshot.turtle.x, snapshot.turtle.y + PHYSICS_GEOMETRY.shellPivotY);
    for (const item of snapshot.cargo) {
      const definition = CARGO.find(({ id }) => id === item.id);
      const offset = definition?.centerOfMassY ?? 0;
      this.drawMassMarker(
        item.x - Math.sin(item.angle) * offset,
        item.y + Math.cos(item.angle) * offset,
      );
    }

    for (const x of [this.tuning.cameraBack * ppm, this.tuning.cameraFront * ppm]) {
      for (let y = 148; y < this.tuning.viewHeight - 30; y += 18) {
        this.debugGuide.moveTo(x, y).lineTo(x, y + 8);
      }
    }
    this.debugGuide.stroke({ width: 1, color: 0x365746, alpha: 0.5 });
    this.guideLabel.position.set(
      (this.tuning.cameraBack + this.tuning.cameraFront) * ppm / 2, 130,
    );
  }

  private drawMassMarker(x: number, y: number): void {
    const ppm = this.tuning.worldPixelsPerMetre;
    const px = x * ppm;
    const py = -y * ppm;
    this.debugWorld.circle(px, py, 3).fill(0xdc4583);
    this.debugWorld.moveTo(px - 5, py).lineTo(px + 5, py)
      .moveTo(px, py - 5).lineTo(px, py + 5)
      .stroke({ width: 1, color: 0xdc4583 });
  }
}
