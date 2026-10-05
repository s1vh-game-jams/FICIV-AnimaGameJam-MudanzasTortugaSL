/** Presentation thresholds in m/s; never alter physical tuning or replay versions.
 * Real 600-tick full-load traces produce support delta-v below 1.94 on flat
 * ground, roughly 6.3 over rock slopes, and below 1.52 on cushioned water entry.
 * The light threshold clears normal stack-support impulses at the current scale.
 */
export const AUDIO_PHYSICS_TUNING = Object.freeze({
  cargoLightDeltaV: 2.1,
  cargoMediumDeltaV: 3.5,
  cargoHeavyDeltaV: 5,
  landingMinimumSpeed: 0.5,
  landingHardSpeed: 4,
  waterLargeEntrySpeed: 4,
  pineconeMinimumDeltaV: 0.9,
});
