import { ENDLESS } from '../../config/endless';
import { createLevelCameraFraming } from '../../config/cameraFraming';
import type { Tuning } from '../../config/tuning';
import { PHYSICS_GEOMETRY as G } from '../../config/tuning';
import { CARGO } from '../../content/cargo';
import type { Biome } from '../../content/scenarios';
import type { SimulationSnapshot } from '../../physics/simulation';
import type { HazardSnapshot, WorldChunk } from '../../physics/worldContent';
import { EndlessGenerator } from './generator';
import type { ModuleInstance } from './modules';
import type { Pennant } from './score';

interface ResidentWorld {
  addWorldChunk(chunk: WorldChunk): void;
  removeWorldChunk(id: string): void;
  hazardSnapshots(): readonly HazardSnapshot[];
}

/** Cover the full captured frame at the initial camera origin, including its rear dead zone. */
export function protectedOpeningStart(tuning: Tuning): number {
  const origin = -(tuning.cameraBack + tuning.cameraFront) / 2;
  return Math.min(-ENDLESS.prologueBackMetres, origin + createLevelCameraFraming(tuning).leftOffset - 5);
}

function shiftModule(module: ModuleInstance, dx: number, dy: number): ModuleInstance {
  return { ...module, startX: module.startX - dx, endX: module.endX - dx,
    startHeight: module.startHeight - dy, endHeight: module.endHeight - dy,
    terrain: module.terrain.map(terrain => ({ ...terrain,
      bottom: terrain.bottom === undefined ? undefined : terrain.bottom - dy,
      points: terrain.points.map(point => ({ x: point.x - dx, y: point.y - dy })),
    })),
    water: module.water?.map(region => ({ left: region.left - dx, right: region.right - dx,
      surface: region.surface - dy, bottom: region.bottom - dy })),
    traps: module.traps.map(trap => ({ ...trap, x: trap.x - dx, y: trap.y - dy })),
  };
}

/** Resident geometry remains local. Index/seed continuity survives cleanup and rebasing. */
export class EndlessStream {
  private resident: ModuleInstance[] = [];
  private flags: Pennant[] = [];
  private nextIndex = 1;
  private nextX: number;
  private nextHeight = 0;
  private nextBiome: Biome = 'grass';
  private prologueResident = true;
  private prologueEnd: number;
  private prologueStart: number;
  private prologueHeight = 0;
  private readonly framing;
  private readonly fullLoadImmersionMetres: number;
  constructor(private readonly world: ResidentWorld, readonly generator: EndlessGenerator,
    tuning: Tuning, prologueLength: number) {
    this.nextX = prologueLength;
    this.prologueEnd = prologueLength;
    this.prologueStart = protectedOpeningStart(tuning);
    this.framing = createLevelCameraFraming(tuning);
    this.fullLoadImmersionMetres = tuning.waterBaseDepth + CARGO.reduce((sum, cargo) => sum + cargo.mass, 0) * tuning.waterDepthPerKg;
  }

  get modules(): readonly ModuleInstance[] { return this.resident; }
  get pennants(): readonly Pennant[] { return this.flags; }
  get prologue(): WorldChunk | null {
    return this.prologueResident ? { id: 'diagnostic-base', terrain: [{ biome: 'grass',
      bottom: this.prologueHeight - 9,
      points: [{ x: this.prologueStart, y: this.prologueHeight }, { x: this.prologueEnd, y: this.prologueHeight }],
    }] } : null;
  }

  ensureAhead(snapshot: SimulationSnapshot): void {
    const visibleRight = snapshot.cameraX + this.framing.leftOffset + this.framing.visibleMetres;
    const cargoRight = Math.max(snapshot.turtle.x, ...snapshot.cargo.filter(item => item.state !== 'lost').map(item => item.x));
    const horizon = Math.max(visibleRight, cargoRight) + ENDLESS.preloadReachMarginMetres;
    while (this.nextX <= horizon) {
      const module = this.generator.generate(this.nextIndex, this.nextBiome, this.nextX, this.nextHeight);
      this.world.addWorldChunk(module);
      this.resident.push(module);
      const exitWater = module.water?.find(region => region.right === module.endX);
      const flagHeight = module.exitBiome === 'water' && exitWater ?
        Math.max(exitWater.bottom + G.turtleHalfHeight + G.waterBottomClearance,
          module.endHeight - this.fullLoadImmersionMetres) - G.turtleHalfHeight : module.endHeight;
      this.flags.push({ id: `pennant-${module.index}`, moduleIndex: module.index,
        x: module.endX, y: flagHeight, crossed: false });
      this.nextIndex++;
      this.nextX = module.endX;
      this.nextHeight = module.endHeight;
      this.nextBiome = module.exitBiome;
    }
  }

  retireBehind(snapshot: SimulationSnapshot): void {
    const visibleLeft = snapshot.cameraX + this.framing.leftOffset;
    const cargoLeft = Math.min(snapshot.turtle.x, ...snapshot.cargo.filter(item => item.state !== 'lost').map(item => item.x));
    const behind = Math.min(visibleLeft, cargoLeft) - ENDLESS.retirementMarginMetres;
    const pending = this.world.hazardSnapshots().filter(hazard => hazard.phase === 'triggered' || hazard.phase === 'active');
    const removable = this.resident.filter(module => module.endX < behind &&
      !pending.some(hazard => module.traps.some(trap => trap.id === hazard.id)));
    for (const module of removable) this.world.removeWorldChunk(module.id);
    const ids = new Set(removable.map(module => module.id));
    this.resident = this.resident.filter(module => !ids.has(module.id));
    this.flags = this.flags.filter(flag => flag.x >= behind);
    if (this.prologueResident && this.prologueEnd < behind) {
      this.world.removeWorldChunk('diagnostic-base');
      this.prologueResident = false;
    }
  }

  rebase(dx: number, dy = 0): void {
    this.nextX -= dx;
    this.nextHeight -= dy;
    this.prologueEnd -= dx;
    this.prologueStart -= dx;
    this.prologueHeight -= dy;
    this.resident = this.resident.map(module => shiftModule(module, dx, dy));
    this.flags = this.flags.map(flag => ({ ...flag, x: flag.x - dx, y: flag.y - dy }));
  }
}
