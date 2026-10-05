/** Selected recordings are stored once; semantic roles intentionally share paths. */
export const AUDIO_FILES = {
  bgm: {
    menu: 'audio/bgm/fixing-the-farmers-car.wav',
    physicsLab: 'audio/bgm/patio-party.wav',
    credits: 'audio/bgm/patio-party.wav',
    endless: 'audio/bgm/just-kidding.wav',
  },
  ui: {
    move: 'audio/sfx/ui-move.wav',
    confirm: 'audio/sfx/feedback-positive.wav',
    helpPop: 'audio/sfx/feedback-positive.wav',
    pauseOpen: 'audio/sfx/feedback-positive.wav',
    back: 'audio/sfx/feedback-toggle.wav',
    disabled: 'audio/sfx/feedback-negative.wav',
    notification: 'audio/sfx/ui-notification.wav',
    clientCall: 'audio/sfx/client-call.wav',
  },
  scoring: { checkpoint: 'audio/sfx/feedback-positive.wav', scorePop: 'audio/sfx/feedback-positive.wav' },
  turtle: {
    movementDry: 'audio/ambient/turtle-dry-movement.mp3',
    movementWater: 'audio/ambient/turtle-water-movement.wav',
    landingSoft: 'audio/sfx/impact-dull-low.wav', landingHard: 'audio/sfx/impact-dull-low.wav',
  },
  cargo: {
    impactLight: 'audio/sfx/cargo-impact-light.wav',
    impactMedium: 'audio/sfx/impact-debris-medium.wav',
    impactHeavy: 'audio/sfx/cargo-impact-heavy.wav',
    lost: 'audio/sfx/feedback-negative.wav', lastObjectLost: 'audio/sfx/feedback-negative.wav',
  },
  water: {
    entrySmall: 'audio/sfx/water-splash-small.wav', entryLarge: 'audio/sfx/water-splash-large.wav',
    exit: 'audio/sfx/water-splash-small.wav',
  },
  hazards: {
    branchCreak: 'audio/sfx/trap-branch-creak.wav', branchBreak: 'audio/sfx/impact-debris-medium.wav',
    stumpTrigger: 'audio/sfx/feedback-toggle.wav', stumpHit: 'audio/sfx/impact-dull-low.wav',
    pineconeRustle: 'audio/sfx/trap-pinecone-rustle.mp3', pineconeFall: 'audio/sfx/trap-pinecone-fall.wav',
    pineconeHit: 'audio/sfx/impact-dull-low.wav',
  },
  ambient: { forest: 'audio/ambient/forest-ambience.wav' },
} as const;

export const AUDIO_TIMING = {
  impactGroupSeconds: 0.12,
  impactCooldownSeconds: 0.12,
  lossGroupSeconds: 0.3,
  waterStableSeconds: 0.15,
  waterCooldownSeconds: 0.5,
  movementMinimumMetresPerSecond: 0.08,
  staleEffectMs: 250,
  maxEffectVoices: 12,
  maxVoicesPerFile: 2,
} as const;
