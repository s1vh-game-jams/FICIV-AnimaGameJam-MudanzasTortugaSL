import type { Tuning } from '../config/tuning';
const clamp = (v: number, low: number, high: number) => Math.max(low, Math.min(high, v));
export function approach(value: number, target: number, change: number): number {
  return value + clamp(target - value, -change, change);
}
/** Blend towards camera speed before reaching the safe-window boundaries. */
export function targetSpeed(input: number, screenX: number, tuning: Tuning, current = 0): number {
  const desired = (input > 0 ? tuning.maxSpeed : input < 0 ? tuning.minSpeed : tuning.baseSpeed) + current;
  const rear = clamp((screenX - tuning.cameraBack) / tuning.cameraPressureWidth, 0, 1);
  const front = clamp((tuning.cameraFront - screenX) / tuning.cameraPressureWidth, 0, 1);
  const positional = desired < tuning.cameraSpeed ? rear : front;
  return tuning.cameraSpeed + (desired - tuning.cameraSpeed) * positional;
}
export function nextShellAngle(angle: number, angularSpeed: number, input: number, dt: number, t: Tuning): { angle: number; speed: number } {
  const speed = approach(angularSpeed, input * t.shellAngularSpeed, t.shellAngularDamping * dt);
  const next = clamp(angle + speed * dt, -t.shellMaxAngle, t.shellMaxAngle);
  return { angle: next, speed: next === t.shellMaxAngle || next === -t.shellMaxAngle ? 0 : speed };
}
