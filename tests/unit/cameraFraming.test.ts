import { describe, expect, it } from 'vitest';
import { createLaboratoryFraming, createLevelCameraFraming } from '../../src/game/config/cameraFraming';
import { createTuning, withTuning } from '../../src/game/config/tuning';

describe('fixed laboratory and level-load framing', () => {
  it.each([0, 20, 40, 45])('reserves %s percent outside each normal movement margin', cameraDeadZonePercent => {
    const tuning = withTuning(createTuning(), { cameraDeadZonePercent });
    const level = createLevelCameraFraming(tuning);
    expect((tuning.cameraBack - level.leftOffset) * level.pixelsPerMetre).toBeCloseTo(level.rearPixel, 10);
    expect((tuning.cameraFront - level.leftOffset) * level.pixelsPerMetre).toBeCloseTo(level.frontPixel, 10);
    expect(level.rearPixel / tuning.viewWidth * 100).toBeCloseTo(cameraDeadZonePercent, 10);
    expect((tuning.viewWidth - level.frontPixel) / tuning.viewWidth * 100).toBeCloseTo(cameraDeadZonePercent, 10);
    expect(level.visibleMetres * level.pixelsPerMetre).toBeCloseTo(tuning.viewWidth, 10);
  });

  it('changes the level field of view while preserving laboratory scale and physical bounds', () => {
    const base = createTuning();
    const wider = withTuning(base, { cameraDeadZonePercent: 45 });
    expect(createLaboratoryFraming(wider)).toEqual(createLaboratoryFraming(base));
    expect(wider.cameraBack).toBe(base.cameraBack);
    expect(wider.cameraFront).toBe(base.cameraFront);
    expect(createLevelCameraFraming(wider).visibleMetres).toBeGreaterThan(createLevelCameraFraming(base).visibleMetres);
    expect(createLevelCameraFraming(wider).zoom).toBeLessThan(createLevelCameraFraming(base).zoom);
  });

  it('recalculates level zoom for changed margins without rescaling laboratory art', () => {
    const base = createTuning();
    const wider = withTuning(base, { cameraFrontPercent: base.cameraFrontPercent + 10 });
    expect(createLevelCameraFraming(wider).visibleMetres).toBeGreaterThan(createLevelCameraFraming(base).visibleMetres);
    expect(createLaboratoryFraming(wider).pixelsPerMetre).toBe(base.worldPixelsPerMetre);
  });

  it('captures an immutable frame at level load even if a later session edits settings', () => {
    const tuning = createTuning();
    const frame = createLevelCameraFraming(tuning);
    const saved = { ...frame };
    tuning.cameraDeadZonePercent = 20;
    tuning.cameraFront += 5;
    tuning.worldPixelsPerMetre += 10;
    expect(Object.isFrozen(frame)).toBe(true);
    expect(frame).toEqual(saved);
    expect(() => Object.assign(frame, { zoom: 99 })).toThrow();
  });
});
