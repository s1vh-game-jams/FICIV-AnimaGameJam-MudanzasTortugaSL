import type { Tuning } from '../config/tuning';
import { NO_CONTROLS, type Controls } from '../core/input';
import { PhysicsSimulation, type LoadPreset, type SimulationSnapshot } from '../physics/simulation';
import type { Scenario } from './scenarios';

/** One authored route, not a certificate for every branch or cargo configuration. */
export interface JumpTraversalCase {
  /** Begin charging after the carrier reaches this world X on dry ground. */
  chargeAtX: number;
  /** The first grounded landing after the full-charge launch must reach this world X. */
  landingX: number;
  /** Hard simulation-time budget, including approach and charging. */
  maxSeconds: number;
  load: LoadPreset;
  /** Constant authored speed/shell input; jump edges are supplied by the validator. */
  controls?: Pick<Controls, 'horizontal' | 'vertical'>;
}

export type JumpTraversalOutcome =
  'passed' | 'timeout' | 'ineligible-charge' | 'charge-canceled' | 'launch-blocked' | 'landing-short' | 'non-finite-state';

export interface JumpTraversalResult {
  passed: boolean;
  outcome: JumpTraversalOutcome;
  scenarioId: string;
  load: LoadPreset;
  launchSpeed: number;
  gravity: number;
  chargeSeconds: number;
  launched: boolean;
  elapsedSeconds: number;
  maximumHeight: number;
  final: SimulationSnapshot;
}

function finiteSnapshot(snapshot: SimulationSnapshot): boolean {
  return [snapshot.cameraX, snapshot.cameraY, snapshot.turtle.x, snapshot.turtle.y,
    snapshot.turtle.bodyX, snapshot.turtle.bodyY, snapshot.turtle.speed, snapshot.turtle.verticalSpeed,
    snapshot.turtle.angle, snapshot.turtle.bodyAngle, snapshot.shell.x, snapshot.shell.y,
    snapshot.shell.angle, ...snapshot.cargo.flatMap(item => [item.x, item.y, item.angle])].every(Number.isFinite);
}

/**
 * Exercise real collision geometry with the caller's current settings. Rapier must
 * already be available, exactly as for PhysicsSimulation. No ballistic-height
 * formula can replace the observed full release and grounded landing required here.
 * Future modules need authored cases for each mandatory route and relevant load,
 * rerun after geometry, controller or tuning changes, plus human playtesting.
 */
export function validateJumpTraversal(
  scenario: Scenario, tuning: Tuning, route: JumpTraversalCase,
): JumpTraversalResult {
  const maxTicks = Math.floor(route.maxSeconds * tuning.physicsHz);
  if (![route.chargeAtX, route.landingX, route.maxSeconds].every(Number.isFinite) ||
      route.chargeAtX < scenario.startX || route.landingX <= route.chargeAtX ||
      route.landingX > scenario.endX || route.maxSeconds <= 0 || !Number.isSafeInteger(maxTicks)) {
    throw new RangeError('Jump traversal requires finite ordered route positions and a positive time budget.');
  }
  const controls = route.controls ?? NO_CONTROLS;
  if (![controls.horizontal, controls.vertical].every(value => Number.isFinite(value) && Math.abs(value) <= 1) ||
      !['empty', 'light', 'full'].includes(route.load)) {
    throw new RangeError('Jump traversal requires a supported load and bounded controls.');
  }
  const simulation = new PhysicsSimulation(scenario, tuning, route.load);
  let phase: 'approach' | 'charging' | 'airborne' = 'approach';
  let launched = false, chargeSeconds = 0;
  let final = simulation.snapshot();
  let maximumHeight = final.turtle.y;
  const result = (outcome: JumpTraversalOutcome): JumpTraversalResult => ({
    passed: outcome === 'passed', outcome, scenarioId: scenario.id, load: route.load,
    launchSpeed: tuning.jumpMaxLaunchSpeed, gravity: tuning.gravity, chargeSeconds,
    launched, elapsedSeconds: final.time, maximumHeight, final,
  });
  try {
    for (let tick = 0; tick < maxTicks; tick++) {
      if (!finiteSnapshot(final)) return result('non-finite-state');
      let input: Controls = { ...controls };
      let releasing = false;
      if (phase === 'approach' && final.turtle.x >= route.chargeAtX) {
        if (!final.turtle.grounded || final.turtle.biome === 'water') return result('ineligible-charge');
        phase = 'charging';
        input = { ...controls, jumpPressed: true, jumpHeld: true };
      } else if (phase === 'charging') {
        if (!final.turtle.jumpCharging) return result('charge-canceled');
        if (final.turtle.jumpChargeSeconds >= tuning.jumpMaxChargeSeconds) {
          chargeSeconds = final.turtle.jumpChargeSeconds;
          releasing = true;
          input = { ...controls, jumpReleased: true };
        } else input = { ...controls, jumpHeld: true };
      }
      simulation.step(input);
      final = simulation.snapshot();
      maximumHeight = Math.max(maximumHeight, final.turtle.y);
      if (!finiteSnapshot(final)) return result('non-finite-state');
      if (releasing) {
        // Autostep, reaching an endpoint while charging or an obstructed release
        // cannot be mistaken for a successful jump over the proposed geometry.
        launched = !final.turtle.grounded && final.turtle.verticalSpeed > 0;
        if (!launched) return result('launch-blocked');
        phase = 'airborne';
      }
      if (launched && final.turtle.grounded) {
        // Finishing the approach by walking after an insufficient jump must not
        // certify reachability. Stop on the first landing, successful or short.
        return result(final.turtle.x >= route.landingX ? 'passed' : 'landing-short');
      }
    }
    return result('timeout');
  } finally {
    simulation.dispose();
  }
}
