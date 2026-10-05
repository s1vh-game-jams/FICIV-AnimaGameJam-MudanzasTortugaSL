/** Metres, seconds, kg. Shared fixed-step hazard tuning; difficulty never alters physics. */
export const HAZARD_TUNING = Object.freeze({
  branchWidth: 3.6,
  branchThickness: 0.12,
  branchDelaySeconds: 0.16,
  stumpWidth: 2.8,
  stumpHeight: 0.65,
  stumpRise: 1.15,
  stumpRiseSeconds: 0.28,
  stumpHoldSeconds: 0.7,
  stumpRetractSeconds: 0.9,
  treeTouchWidth: 2.5,
  treeDelaySeconds: 0.32,
  coneHeight: 4.4,
  coneRadius: 0.28,
  coneMass: 1.6,
  coneLifetimeSeconds: 3,
  lostCargoRetireDistance: 35,
});
