import { Application, Assets, Container, Graphics, Matrix, Sprite, Text } from 'pixi.js';
import type { Texture } from 'pixi.js';
import { createLevelCameraFraming } from '../game/config/cameraFraming';
import { HAZARD_TUNING } from '../game/config/hazards';
import type { Tuning } from '../game/config/tuning';
import { CARGO } from '../game/content/cargo';
import type { CargoKind } from '../game/content/cargo';
import type { EndlessSnapshot } from '../game/modes/endless/run';
import { publicAsset } from '../utils/publicAsset';
import { VISUALS } from './visualDefinitions';

const TERRAIN_PATHS = ['sprites/terrain/grass.svg', 'sprites/terrain/rock.svg', 'sprites/terrain/water.svg'];
const HAZARD_PATHS = ['branch-intact', 'branch-broken', 'hatch', 'stump', 'tree', 'pinecone']
  .map(name => 'sprites/hazards/' + name + '.svg');
const FLAG_PATHS = ['sprites/ui/pennant-folded.svg', 'sprites/ui/pennant-deployed.svg'];
const GROUND_SCREEN_Y = 490;
const BODY_VISUAL_OFFSET_Y = 0.21;
const SHELL_VISUAL_OFFSET_Y = 0.12;

/** Normal-run presentation has one immutable framing captured at level load. */
export class EndlessRenderer {
  readonly framing;
  private readonly viewport = new Container();
  private readonly world = new Container();
  private readonly terrain = new Graphics();
  private readonly water = new Graphics();
  private readonly backdrop = new Graphics();
  private readonly hazards = new Container();
  private readonly pennants = new Container();
  private readonly turtle: Sprite;
  private readonly shell: Sprite;
  private readonly cargo = new Map<CargoKind, Sprite>();
  private readonly hazardSprites = new Map<string, Sprite>();
  private readonly pennantSprites = new Map<string, Sprite>();
  private readonly help = new Text({ text: '', style: {
    fontFamily: 'Arial, sans-serif', fontSize: 22, fontWeight: 'bold', fill: 0x173e37,
    stroke: { color: 0xf8faee, width: 5 }, wordWrap: true, wordWrapWidth: 700,
  } });
  private readonly resizeObserver: ResizeObserver;
  private terrainSignature = '';
  private disposed = false;

  static async create(host: HTMLElement, tuning: Tuning): Promise<EndlessRenderer> {
    const app = new Application();
    try {
      await app.init({ width: tuning.viewWidth, height: tuning.viewHeight,
        backgroundColor: 0x173e37, antialias: true,
        resolution: Math.min(window.devicePixelRatio || 1, 2), autoDensity: true,
        autoStart: false, sharedTicker: false, preference: 'webgl' });
      const paths = [...VISUALS.turtle.frames, ...VISUALS.turtle.chargeFrames, VISUALS.shell.path,
        ...CARGO.map(({ id }) => VISUALS[id].path), ...TERRAIN_PATHS, ...HAZARD_PATHS, ...FLAG_PATHS];
      const textures = new Map(await Promise.all(paths.map(async path =>
        [path, await Assets.load<Texture>(publicAsset(path))] as const)));
      return new EndlessRenderer(app, host, tuning, textures);
    } catch (error) {
      if (app.renderer) app.destroy({ removeView: true }, { children: true });
      throw error;
    }
  }

  private constructor(private readonly app: Application, private readonly host: HTMLElement,
    private readonly tuning: Tuning, private readonly textures: ReadonlyMap<string, Texture>) {
    this.framing = createLevelCameraFraming(tuning);
    const ppm = this.framing.pixelsPerMetre;
    app.stage.eventMode = 'none';
    app.stage.addChild(this.viewport);
    const mask = new Graphics().rect(0, 0, tuning.viewWidth, tuning.viewHeight).fill(0xffffff);
    this.viewport.addChild(mask);
    this.viewport.mask = mask;
    this.viewport.addChild(new Graphics().rect(0, 0, tuning.viewWidth, tuning.viewHeight).fill(0xe4efdb));
    for (let i = 0; i < 20; i++) {
      const x = i * 100;
      this.backdrop.rect(x, 250 + (i % 4) * 25, 10, 350).fill({ color: 0x527a60, alpha: 0.12 });
      this.backdrop.circle(x + 5, 250 + (i % 4) * 25, 55 + (i % 3) * 8)
        .fill({ color: 0x729b74, alpha: 0.18 });
    }
    this.viewport.addChild(this.backdrop, this.world);
    this.turtle = this.sprite(VISUALS.turtle.frames[0], VISUALS.turtle.width, VISUALS.turtle.height);
    this.shell = this.sprite(VISUALS.shell.path, VISUALS.shell.width, VISUALS.shell.height);
    this.world.addChild(this.terrain, this.water, this.hazards, this.pennants, this.turtle, this.shell);
    for (const item of CARGO) {
      const visual = VISUALS[item.id];
      const sprite = this.sprite(visual.path, visual.width, visual.height);
      this.cargo.set(item.id, sprite);
      this.world.addChild(sprite);
    }
    this.help.anchor.set(0.5, 0);
    this.help.visible = false;
    this.viewport.addChild(this.help);
    this.app.canvas.setAttribute('role', 'img');
    this.app.canvas.setAttribute('aria-label', 'Don Tortuga transporta la mudanza por el bosque');
    this.app.canvas.style.display = 'block';
    this.host.append(this.app.canvas);
    this.world.scale.set(1);
    this.turtle.width = VISUALS.turtle.width * ppm;
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(host);
    this.resize();
  }

  render(snapshot: EndlessSnapshot, helpText?: string): void {
    if (this.disposed) return;
    const physics = snapshot.physics;
    const ppm = this.framing.pixelsPerMetre;
    const left = physics.cameraX + this.framing.leftOffset;
    this.world.position.set(-left * ppm, GROUND_SCREEN_Y + physics.cameraY * ppm);
    this.backdrop.x = -(((physics.cameraX + snapshot.logicalOffset) * ppm * 0.12) % 600 + 600) % 600;
    const prologue = snapshot.prologue?.terrain[0].points[0];
    const signature = snapshot.modules.map(module => module.id + ':' + module.startX + ':' + module.startHeight).join('|')
      + (prologue ? ':opening:' + prologue.x + ':' + prologue.y : '');
    if (this.terrainSignature !== signature) {
      this.terrainSignature = signature;
      this.drawTerrain(snapshot);
    }
    const logicalFrame = Math.floor(physics.time * VISUALS.turtle.framesPerSecond) % VISUALS.turtle.logicalFrames;
    const frames = physics.turtle.jumpCharging ? VISUALS.turtle.chargeFrames : VISUALS.turtle.frames;
    this.turtle.texture = this.texture(frames[Math.floor(logicalFrame * frames.length / VISUALS.turtle.logicalFrames)]);
    const angle = physics.turtle.bodyAngle;
    this.turtle.position.set((physics.turtle.bodyX - Math.sin(angle) * BODY_VISUAL_OFFSET_Y) * ppm,
      -(physics.turtle.bodyY + Math.cos(angle) * BODY_VISUAL_OFFSET_Y) * ppm);
    this.turtle.rotation = -angle;
    this.shell.position.set((physics.shell.x - Math.sin(physics.shell.angle) * SHELL_VISUAL_OFFSET_Y) * ppm,
      -(physics.shell.y + Math.cos(physics.shell.angle) * SHELL_VISUAL_OFFSET_Y) * ppm);
    this.shell.rotation = -physics.shell.angle;
    for (const sprite of this.cargo.values()) sprite.visible = false;
    for (const item of physics.cargo) {
      const sprite = this.cargo.get(item.id)!;
      sprite.position.set(item.x * ppm, -item.y * ppm);
      sprite.rotation = -item.angle;
      sprite.alpha = item.state === 'lost' ? 0.35 : 1;
      sprite.visible = true;
    }
    this.drawHazards(physics.hazards);
    const flags = new Set<string>();
    for (const flag of snapshot.pennants) {
      flags.add(flag.id);
      let sprite = this.pennantSprites.get(flag.id);
      if (!sprite) {
        sprite = this.sprite(FLAG_PATHS[0], 0.8, 2);
        sprite.anchor.set(0.5, 1);
        this.pennantSprites.set(flag.id, sprite);
        this.pennants.addChild(sprite);
      }
      sprite.texture = this.texture(FLAG_PATHS[flag.crossed ? 1 : 0]);
      sprite.position.set(flag.x * ppm, -flag.y * ppm);
    }
    this.removeStale(this.pennantSprites, flags);
    this.help.visible = !!helpText;
    if (helpText) {
      this.help.text = helpText;
      const screenX = (physics.turtle.x - left) * ppm;
      const half = this.help.width / 2;
      this.help.position.set(Math.max(half + 16, Math.min(this.tuning.viewWidth - half - 16, screenX)),
        Math.min(this.tuning.viewHeight - this.help.height - 20,
          GROUND_SCREEN_Y + (physics.cameraY - physics.turtle.bodyY + 0.24) * ppm + 20));
    }
    this.app.render();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.resizeObserver.disconnect();
    this.app.destroy({ removeView: true }, { children: true, texture: false, textureSource: false });
  }

  private drawTerrain(snapshot: EndlessSnapshot): void {
    const ppm = this.framing.pixelsPerMetre;
    const matrix = new Matrix().scale(ppm / 100, ppm / 100);
    this.terrain.clear(); this.water.clear();
    for (const module of [...(snapshot.prologue ? [snapshot.prologue] : []), ...snapshot.modules]) {
      for (const strip of module.terrain) {
        const first = strip.points[0], last = strip.points[strip.points.length - 1];
        const bottom = strip.bottom ?? Math.min(...strip.points.map(({ y }) => y)) - 8;
        const points = strip.points.flatMap(({ x, y }) => [x * ppm, -y * ppm]);
        this.terrain.poly([...points, last.x * ppm, -bottom * ppm, first.x * ppm, -bottom * ppm])
          .fill(strip.biome === 'grass' ? 0x805b37 : 0x6e7582);
        const band = [...points, ...[...strip.points].reverse().flatMap(({ x, y }) => [x * ppm, -(y - 0.65) * ppm])];
        const surfaceMatrix = new Matrix().scale(ppm / 100, ppm / 100).translate(first.x * ppm, -first.y * ppm);
        this.terrain.poly(band).fill({ texture: this.texture('sprites/terrain/' + strip.biome + '.svg'),
          matrix: surfaceMatrix, textureSpace: 'global' });
        this.terrain.poly(points, false).stroke({ width: 3,
          color: strip.biome === 'grass' ? 0x4c7444 : 0x425750 });
      }
      for (const region of module.water ?? []) {
        this.water.rect(region.left * ppm, -region.surface * ppm,
          (region.right - region.left) * ppm, (region.surface - region.bottom) * ppm)
          .fill({ texture: this.texture(TERRAIN_PATHS[2]), matrix, textureSpace: 'global', alpha: 0.5 });
        this.water.moveTo(region.left * ppm, -region.surface * ppm)
          .lineTo(region.right * ppm, -region.surface * ppm)
          .stroke({ width: 2, color: 0x267d9b, alpha: 0.9 });
      }
    }
  }

  private drawHazards(hazards: EndlessSnapshot['physics']['hazards']): void {
    const visible = new Set<string>();
    const ppm = this.framing.pixelsPerMetre;
    for (const hazard of hazards) {
      if (hazard.kind === 'branch') {
        const sprite = this.hazardSprite(hazard.id, hazard.phase === 'idle' || hazard.phase === 'triggered'
          ? 'branch-intact' : 'branch-broken', HAZARD_TUNING.branchWidth, 0.4);
        sprite.position.set(hazard.x * ppm, -(hazard.y + HAZARD_TUNING.branchThickness / 2) * ppm);
        visible.add(hazard.id);
      } else if (hazard.kind === 'stump') {
        const hatch = this.hazardSprite(hazard.id, 'hatch', HAZARD_TUNING.stumpWidth, 0.3);
        hatch.position.set(hazard.x * ppm, -hazard.y * ppm);
        visible.add(hazard.id);
        if (hazard.lift > 0.01) {
          const stump = this.hazardSprite(hazard.id + '-lift', 'stump', HAZARD_TUNING.stumpWidth, Math.max(0.15, hazard.lift));
          stump.position.set(hazard.x * ppm, -(hazard.y + hazard.lift / 2) * ppm);
          visible.add(hazard.id + '-lift');
        }
      } else {
        const tree = this.hazardSprite(hazard.id, 'tree', 2.8, 5.5);
        tree.anchor.set(0.5, 1);
        tree.position.set(hazard.x * ppm, -hazard.y * ppm);
        visible.add(hazard.id);
        const cone = hazard.cone;
        if (cone) {
          const sprite = this.hazardSprite(hazard.id + '-cone', 'pinecone', 0.6, 0.9);
          sprite.position.set(cone.x * ppm, -cone.y * ppm);
          sprite.rotation = -cone.angle;
          visible.add(hazard.id + '-cone');
        } else if (hazard.phase === 'idle' || hazard.phase === 'triggered') {
          const sprite = this.hazardSprite(hazard.id + '-cone', 'pinecone', 0.6, 0.9);
          sprite.position.set(hazard.x * ppm, -(hazard.y + HAZARD_TUNING.coneHeight) * ppm);
          visible.add(hazard.id + '-cone');
        }
      }
    }
    this.removeStale(this.hazardSprites, visible);
  }

  private hazardSprite(id: string, name: string, width: number, height: number): Sprite {
    let sprite = this.hazardSprites.get(id);
    const path = 'sprites/hazards/' + name + '.svg';
    if (!sprite) {
      sprite = this.sprite(path, width, height);
      this.hazardSprites.set(id, sprite);
      this.hazards.addChild(sprite);
    }
    sprite.texture = this.texture(path);
    sprite.width = width * this.framing.pixelsPerMetre;
    sprite.height = height * this.framing.pixelsPerMetre;
    return sprite;
  }

  private sprite(path: string, width: number, height: number): Sprite {
    const sprite = new Sprite(this.texture(path));
    sprite.anchor.set(0.5, 0.5);
    sprite.width = width * this.framing.pixelsPerMetre;
    sprite.height = height * this.framing.pixelsPerMetre;
    return sprite;
  }

  private texture(path: string): Texture {
    const texture = this.textures.get(path);
    if (!texture) throw new Error('Missing Endless texture: ' + path);
    return texture;
  }

  private removeStale(sprites: Map<string, Sprite>, visible: Set<string>): void {
    for (const [id, sprite] of sprites) {
      if (!visible.has(id)) { sprite.destroy({ texture: false, textureSource: false }); sprites.delete(id); }
    }
  }

  private resize(): void {
    if (this.disposed) return;
    const bounds = this.host.getBoundingClientRect();
    const width = Math.max(1, Math.round(bounds.width)), height = Math.max(1, Math.round(bounds.height));
    this.app.renderer.resize(width, height);
    const scale = Math.min(width / this.tuning.viewWidth, height / this.tuning.viewHeight);
    this.viewport.scale.set(scale);
    this.viewport.position.set((width - this.tuning.viewWidth * scale) / 2, (height - this.tuning.viewHeight * scale) / 2);
    this.help.style.fontSize = 22 / Math.min(1, scale);
    this.help.style.wordWrapWidth = Math.min(900, this.tuning.viewWidth - 48);
    this.app.render();
  }
}
