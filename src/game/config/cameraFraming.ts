import type { Tuning } from './tuning';

export interface CameraFraming {
  readonly pixelsPerMetre: number;
  readonly leftOffset: number;
  readonly visibleMetres: number;
  readonly rearPixel: number;
  readonly frontPixel: number;
  readonly zoom: number;
}

/** The laboratory always keeps the same character scale and reference viewport. */
export function createLaboratoryFraming(tuning: Tuning): Readonly<CameraFraming> {
  return Object.freeze({
    pixelsPerMetre: tuning.worldPixelsPerMetre, leftOffset: 0,
    visibleMetres: tuning.viewWidth / tuning.worldPixelsPerMetre,
    rearPixel: tuning.cameraBack * tuning.worldPixelsPerMetre,
    frontPixel: tuning.cameraFront * tuning.worldPixelsPerMetre,
    zoom: 1,
  });
}

/** Capture once when loading a normal level. Resize scales this frame, never its world span.
 * Each dead zone occupies the configured percentage outside the movement margin.
 * Camera X remains the simulation's corridor origin; leftOffset locates the visible left edge.
 */
export function createLevelCameraFraming(tuning: Tuning): Readonly<CameraFraming> {
  const deadFraction = tuning.cameraDeadZonePercent / 100;
  const visibleMetres = (tuning.cameraFront - tuning.cameraBack) / (1 - 2 * deadFraction);
  const pixelsPerMetre = tuning.viewWidth / visibleMetres;
  return Object.freeze({
    pixelsPerMetre, visibleMetres,
    leftOffset: tuning.cameraBack - visibleMetres * deadFraction,
    rearPixel: tuning.viewWidth * deadFraction,
    frontPixel: tuning.viewWidth * (1 - deadFraction),
    zoom: pixelsPerMetre / tuning.worldPixelsPerMetre,
  });
}
