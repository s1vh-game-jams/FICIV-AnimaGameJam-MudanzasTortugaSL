export type Difficulty = 'easy' | 'normal' | 'hard';
export type TrapProbabilityVector = readonly [number, number, number, number];

/** Counts are sampled statistically; no short-run quotas alter these probabilities. */
export const ENDLESS_DIFFICULTIES: Readonly<Record<Difficulty, {
  label: string; base: TrapProbabilityVector; limit: TrapProbabilityVector;
}>> = {
  easy: { label: 'Fácil', base: [0.505, 0.49, 0.005, 0], limit: [0.005, 0.99, 0.005, 0] },
  normal: { label: 'Normal', base: [0.405, 0.445, 0.145, 0.005], limit: [0.15, 0.455, 0.39, 0.005] },
  hard: { label: 'Difícil', base: [0.1, 0.4, 0.4, 0.1], limit: [0, 0.2, 0.6, 0.2] },
};

export const ENDLESS = {
  poolVersion: 'jam-six-1', generatorVersion: 'seeded-log-1', physicsVersion: 'endless-physics-urgent-1',
  safeModulesMin: 5, safeModulesMax: 10, progressionScaleModules: 10,
  prologueMetres: 40, prologueBackMetres: 12,
  preloadReachMarginMetres: 14, retirementMarginMetres: 10,
  rebaseThresholdMetres: 1024, rebaseVerticalThresholdMetres: 256,
  /** A recoverable recess exists only underneath a selected cracked-branch cover. */
  branchPitHalfWidthMetres: 1.8, branchPitDepthMetres: 0.65,
} as const;
