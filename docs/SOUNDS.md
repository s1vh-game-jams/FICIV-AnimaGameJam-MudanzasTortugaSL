# Mudanzas Tortuga, S.L. — Sound Design & Implementation

**Status:** Game Jam implementation specification  
**Date:** 2026-10-05  
**Stack:** Vite + TypeScript + PixiJS 8 + Rapier2D  
**Target:** browser / GitHub Pages  
**Source library:** Audio Hero — Ultimate Game Audio Bundle  
**Jam audio footprint:** ~112 MB  
**Physical runtime assets:** 21 files total = 3 BGM + 18 SFX/ambient  
**Current formats:** 19 WAV + 2 MP3

---

## 1. Purpose and authority

This document replaces the earlier audio-search/triage version of `SOUNDS.md`.

The audio selection is now closed for the jam. Codex should implement the assets listed here rather than search for new sounds or invent placeholder paths.

The main implementation principle is:

> **Do not sonify the simulation. Sonify the physical story the player perceives.**

Rapier may produce many contacts in a single physical event. The player should hear the meaningful accident, impact, transition or notification — not every solver callback.

### Jam constraints

- Do **not** convert WAV files before the jam.
- Do **not** introduce Git LFS for the runtime audio used by GitHub Pages.
- Do **not** duplicate one physical audio file just because it has several gameplay roles.
- Do **not** add a new audio dependency unless the existing code genuinely requires it.
- Do **not** hardcode root-absolute `/audio/...` URLs throughout the codebase.
- Reuse the project's existing public-asset URL helper / `import.meta.env.BASE_URL` strategy so audio also works under the GitHub Pages repository subpath.
- No additional asset is required to ship the jam build unless human playtesting identifies a blocking problem.

---

# 2. Physical directory layout

```text
public/
└── audio/
    ├── bgm/
    │   ├── fixing-the-farmers-car.wav
    │   ├── patio-party.wav
    │   └── just-kidding.wav
    │
    ├── sfx/
    │   ├── ui-move.wav
    │   ├── feedback-positive.wav
    │   ├── feedback-toggle.wav
    │   ├── feedback-negative.wav
    │   ├── ui-notification.wav
    │   ├── client-call.wav
    │   ├── impact-dull-low.wav
    │   ├── water-splash-small.wav
    │   ├── water-splash-large.wav
    │   ├── cargo-impact-light.wav
    │   ├── impact-debris-medium.wav
    │   ├── cargo-impact-heavy.wav
    │   ├── trap-branch-creak.wav
    │   ├── trap-pinecone-rustle.mp3
    │   └── trap-pinecone-fall.wav
    │
    └── ambient/
        ├── turtle-dry-movement.mp3
        ├── turtle-water-movement.wav
        └── forest-ambience.wav
```

Only these two runtime files are MP3 in the jam build:

```text
public/audio/ambient/turtle-dry-movement.mp3
public/audio/sfx/trap-pinecone-rustle.mp3
```

All other files listed above are WAV.

---

# 3. Canonical physical asset inventory

A physical Audio Hero recording is stored **once**, even when several semantic events reuse it.

## 3.1 BGM

| Original title | Physical project path | Use |
|---|---|---|
| `Fixing the Farmer's Car` | `public/audio/bgm/fixing-the-farmers-car.wav` | title + menu flow |
| `Patio Party` | `public/audio/bgm/patio-party.wav` | physics laboratory + credits |
| `Just Kidding` | `public/audio/bgm/just-kidding.wav` | Endless Run |

These three tracks are final for the jam. Do not search for replacements.

## 3.2 SFX and ambient

| Original Audio Hero title | Pack | Canonical physical path | Logical uses |
|---|---|---|---|
| `ButtonPushClick PE1090101` | Button Masters | `public/audio/sfx/ui-move.wav` | menu selection movement |
| `ButtonSpringSmlS SDT2039702` | Button Masters | `public/audio/sfx/feedback-positive.wav` | confirm, contextual-help appearance, pause open, checkpoint/pennant, score feedback |
| `ButtonThinTurnOn SDT2039201` | Button Masters | `public/audio/sfx/feedback-toggle.wav` | back/cancel, stump trigger |
| `el interface error 04 hpx` | UI Shaping | `public/audio/sfx/feedback-negative.wav` | disabled option, definitive cargo loss, last-object loss |
| `ComputInterfa GFX045201` | UI Shaping | `public/audio/sfx/ui-notification.wav` | client text notification |
| `BellPulsatingChime SE030302` | Sonic Crafting | `public/audio/sfx/client-call.wav` | client call |
| `ImpactDrumDullLo SDT2016605` | Sonic Crafting | `public/audio/sfx/impact-dull-low.wav` | soft/hard landing, stump hit, pinecone hit |
| `TURTLE, MOVEMENTS ON DIRT` | Animals: Reptiles | `public/audio/ambient/turtle-dry-movement.mp3` | dry locomotion on grass/rock |
| `Foley: Feet Water Wade` | Water | `public/audio/ambient/turtle-water-movement.wav` | water locomotion/swimming |
| `Water, Splash` | Water | `public/audio/sfx/water-splash-small.wav` | small water entry, water exit |
| `WATER, SPLASH` | Water | `public/audio/sfx/water-splash-large.wav` | strong water entry |
| `METAL, BEND` | Crash, Smash, Break! | `public/audio/sfx/cargo-impact-light.wav` | light cargo impact |
| `DebrisWoodMetalWoo PE283301` | Crash, Smash, Break! | `public/audio/sfx/impact-debris-medium.wav` | medium cargo impact, branch break |
| `Crash: Metal & Wood Crash With Debris` | Crash, Smash, Break! | `public/audio/sfx/cargo-impact-heavy.wav` | heavy cargo impact |
| `DoorBreaksBreakDow FS022601` | Crash, Smash, Break! | `public/audio/sfx/trap-branch-creak.wav` | cracked-branch warning/creak |
| `Flock Of Birds Taking Off, Wings Flapping, Foley` | Animals: Flock of Birds | `public/audio/sfx/trap-pinecone-rustle.mp3` | tree/pinecone warning rustle |
| `WHOOSHES, TURBULENT SHOT` | Sonic Crafting | `public/audio/sfx/trap-pinecone-fall.wav` | pinecone fall |
| `JungleAmbLightDayt APS10149` | Africa & Jungles | `public/audio/ambient/forest-ambience.wav` | light gameplay forest ambience |

---

# 4. Critical distinction: physical assets vs. semantic events

The names in section 3 are **physical files**.

Gameplay code should use semantic names. Several semantic names may resolve to the same physical file.

For example:

```text
landingSoft ─────┐
landingHard ─────┤
stumpHit ────────┼──> impact-dull-low.wav
pineconeHit ─────┘
```

Do **not** create four copies of the WAV.

The same rule applies to all aliases below.

---

# 5. Semantic audio manifest

Use one central manifest/module.

Adapt its exact location/name to the architecture already present in the repository. If there is already an asset registry or public URL helper, extend it instead of creating a competing system.

The example below uses `publicAssetUrl(...)` as a **placeholder name** for the project's existing BASE_URL-aware helper. Codex must locate and reuse the real helper rather than blindly introduce this exact function name.

```ts
export const AUDIO_FILES = {
  bgm: {
    menu: "audio/bgm/fixing-the-farmers-car.wav",
    physicsLab: "audio/bgm/patio-party.wav",
    credits: "audio/bgm/patio-party.wav",
    endless: "audio/bgm/just-kidding.wav",
  },

  ui: {
    move: "audio/sfx/ui-move.wav",

    // Same physical file, intentional aliases:
    confirm: "audio/sfx/feedback-positive.wav",
    helpPop: "audio/sfx/feedback-positive.wav",
    pauseOpen: "audio/sfx/feedback-positive.wav",

    back: "audio/sfx/feedback-toggle.wav",
    disabled: "audio/sfx/feedback-negative.wav",

    notification: "audio/sfx/ui-notification.wav",
    clientCall: "audio/sfx/client-call.wav",
  },

  scoring: {
    checkpoint: "audio/sfx/feedback-positive.wav",
    scorePop: "audio/sfx/feedback-positive.wav",
  },

  turtle: {
    movementDry: "audio/ambient/turtle-dry-movement.mp3",
    movementWater: "audio/ambient/turtle-water-movement.wav",

    landingSoft: "audio/sfx/impact-dull-low.wav",
    landingHard: "audio/sfx/impact-dull-low.wav",
  },

  cargo: {
    impactLight: "audio/sfx/cargo-impact-light.wav",
    impactMedium: "audio/sfx/impact-debris-medium.wav",
    impactHeavy: "audio/sfx/cargo-impact-heavy.wav",

    lost: "audio/sfx/feedback-negative.wav",
    lastObjectLost: "audio/sfx/feedback-negative.wav",
  },

  water: {
    entrySmall: "audio/sfx/water-splash-small.wav",
    entryLarge: "audio/sfx/water-splash-large.wav",
    exit: "audio/sfx/water-splash-small.wav",
  },

  hazards: {
    branchCreak: "audio/sfx/trap-branch-creak.wav",
    branchBreak: "audio/sfx/impact-debris-medium.wav",

    stumpTrigger: "audio/sfx/feedback-toggle.wav",
    stumpHit: "audio/sfx/impact-dull-low.wav",

    pineconeRustle: "audio/sfx/trap-pinecone-rustle.mp3",
    pineconeFall: "audio/sfx/trap-pinecone-fall.wav",
    pineconeHit: "audio/sfx/impact-dull-low.wav",
  },

  ambient: {
    forest: "audio/ambient/forest-ambience.wav",
  },
} as const;
```

At the integration boundary, resolve these repository-relative public paths using the existing BASE_URL-aware asset helper.

Conceptually:

```ts
const url = publicAssetUrl(AUDIO_FILES.ui.confirm);
```

Not:

```ts
const url = "/audio/sfx/feedback-positive.wav";
```

The root-absolute form can break when deployed to a GitHub Pages repository subpath.

---

# 6. BGM behavior

## 6.1 Title and menus

Use:

```text
Fixing the Farmer's Car
public/audio/bgm/fixing-the-farmers-car.wav
```

Requirements:

- begin only after browser audio has been unlocked by a valid user interaction;
- keep the track alive across menu screens when feasible;
- do not restart it merely because the user moves between title/mode/difficulty menus.

## 6.2 Physics laboratory

Use:

```text
Patio Party
public/audio/bgm/patio-party.wav
```

## 6.3 Credits

Use the same physical track:

```text
Patio Party
public/audio/bgm/patio-party.wav
```

Do not duplicate the file for Credits.

## 6.4 Endless Run

Use:

```text
Just Kidding
public/audio/bgm/just-kidding.wav
```

Recommended transition from menu:

```text
menu music fade out: ~300 ms
switch
game music fade in: ~300 ms
```

This is tuning, not a hard gameplay constant.

## 6.5 Pause

When paused:

- preserve BGM playback position;
- lower music volume to about 60–70% of its normal game value;
- stop generation of gameplay SFX/locomotion;
- keep UI SFX available;
- restore music smoothly on resume;
- never queue paused gameplay sounds to play later.

---

# 7. UI and presentation events

## 7.1 Move selection

Semantic event:

```text
ui.move
```

Physical file:

```text
public/audio/sfx/ui-move.wav
```

Play only when the actual selected item changes.

Do not play repeatedly when:

- the user holds a key but selection cannot move farther;
- focus remains on the same option.

## 7.2 Confirm

Semantic event:

```text
ui.confirm
```

Physical file:

```text
public/audio/sfx/feedback-positive.wav
```

Use for a valid confirmed action.

## 7.3 Back / cancel

Semantic event:

```text
ui.back
```

Physical file:

```text
public/audio/sfx/feedback-toggle.wav
```

## 7.4 Disabled option

Semantic event:

```text
ui.disabled
```

Physical file:

```text
public/audio/sfx/feedback-negative.wav
```

Example:

```text
Nivel personalizado — Próximamente
```

Only fire when the player actually tries to activate the disabled option.

## 7.5 Contextual help

Semantic event:

```text
ui.helpPop
```

Physical file:

```text
public/audio/sfx/feedback-positive.wav
```

One playback when a contextual-help card appears.

Do not loop or repeat during its 3–5 second display lifetime.

## 7.6 Pause open

Semantic event:

```text
ui.pauseOpen
```

Physical file:

```text
public/audio/sfx/feedback-positive.wav
```

One playback when the pause screen opens.

Resume/back may use the ordinary confirm/back events rather than requiring another physical asset.

## 7.7 Client text message

Semantic event:

```text
ui.notification
```

Physical file:

```text
public/audio/sfx/ui-notification.wav
```

## 7.8 Client call

Semantic event:

```text
ui.clientCall
```

Physical file:

```text
public/audio/sfx/client-call.wav
```

Use one short playback per grouped accident notification.

Do not make it ring indefinitely.

---

# 8. Checkpoints / pennants / score

The pennant is the important perceived event.

Semantic event:

```text
scoring.checkpoint
```

Physical file:

```text
public/audio/sfx/feedback-positive.wav
```

Trigger exactly once when the pennant crossing actually awards the score.

`scorePop` may remain a semantic alias for future UI animation, but for the jam:

> **Do not play checkpoint + scorePop simultaneously if both resolve to the same physical sample.**

One positive sound per awarded pennant is enough.

---

# 9. Cargo loss

## 9.1 Definitive loss only

Semantic event:

```text
cargo.lost
```

Physical file:

```text
public/audio/sfx/feedback-negative.wav
```

Do not play it when an object merely becomes temporarily separated.

Only fire when game state confirms the equivalent of:

```text
temporary separation -> definitively lost
```

The exact names must follow the existing cargo-state implementation.

## 9.2 Group simultaneous losses

Several objects can be lost as part of one accident.

Use the same accident grouping already used by client notifications.

Starting audio grouping window:

```text
~250–400 ms
```

Example:

```text
TV lost
lamp lost 90 ms later
glass lost 130 ms later

=> one negative sound
=> one grouped client notification
```

Do not play one error sound per object.

## 9.3 Last object / run end

Semantic alias:

```text
cargo.lastObjectLost
```

Same physical file:

```text
public/audio/sfx/feedback-negative.wav
```

Do not layer the same sample twice for `lost` + `lastObjectLost`.

When the final object ends the run, use one loss playback and let the game-state transition/results screen provide the additional weight.

---

# 10. Cargo impacts

Physical assets:

```text
light  -> public/audio/sfx/cargo-impact-light.wav
medium -> public/audio/sfx/impact-debris-medium.wav
heavy  -> public/audio/sfx/cargo-impact-heavy.wav
```

## 10.1 Classification

Use the most reliable physical magnitude already exposed by the current implementation:

- contact impulse;
- relative normal velocity;
- or an existing equivalent impact metric.

Do not introduce a second physics model just for sound.

Conceptually:

```text
below audible threshold -> silence
light range             -> cargo.impactLight
medium range            -> cargo.impactMedium
heavy range             -> cargo.impactHeavy
```

Threshold values must be tuned against the game's real Rapier scale.

Do not hardcode arbitrary values from this document.

## 10.2 Contact aggregation

One visible crash may create many Rapier callbacks.

Recommended initial aggregation window:

```text
80–150 ms
```

Within that window, emit at most the strongest meaningful cargo impact.

Example:

```text
light + light + medium + light
=> play one medium
```

## 10.3 Cooldown

Starting point:

```text
~100–150 ms per impact family
```

This is only to prevent solver chatter and may be tuned by ear.

## 10.4 No fake variation files

There is only one physical file per impact tier.

Do not create:

```text
cargo-impact-light-01.wav
cargo-impact-light-02.wav
...
```

If repetition becomes distracting, use subtle runtime variation instead.

Suggested optional range:

```text
playbackRate ≈ 0.97–1.03
small gain variation
```

Keep the variation restrained.

---

# 11. Turtle landings

Both landing events use:

```text
public/audio/sfx/impact-dull-low.wav
```

Semantic roles:

```text
turtle.landingSoft
turtle.landingHard
```

Starting mix:

| Event | Relative gain | Optional playbackRate |
|---|---:|---:|
| soft landing | ~0.55 | ~1.03 |
| hard landing | ~0.90 | ~0.98 |

These values are tuning defaults only.

A normal grounded movement contact is not a landing event.

The landing detector should require a meaningful return to support after an airborne/falling state or equivalent existing state transition.

---

# 12. Dry locomotion

Physical file:

```text
public/audio/ambient/turtle-dry-movement.mp3
```

Original:

```text
TURTLE, MOVEMENTS ON DIRT
```

Jam use:

```text
grass
rock
```

Sand is not part of the current jam biome set and has no dedicated jam audio requirement.

The same physical file intentionally covers both current dry materials.

## Activation

Only audible while Don Tortuga is:

- supported/grounded;
- actually moving;
- on dry terrain.

Stop or fade it when:

- airborne;
- entering water;
- physically blocked and no longer advancing;
- gameplay pauses;
- run ends.

Do not trigger it directly from every contact callback.

The implementation may use looping or distance/cadence playback depending on the actual sample duration. Prefer the simpler result that sounds natural in playtesting.

---

# 13. Water

## 13.1 Water movement

Physical file:

```text
public/audio/ambient/turtle-water-movement.wav
```

Semantic role:

```text
turtle.movementWater
```

Active while Don Tortuga is meaningfully moving/swimming in water.

Do not add breathing, drowning or distress audio. Don Tortuga cannot drown.

## 13.2 Small entry

Physical file:

```text
public/audio/sfx/water-splash-small.wav
```

Semantic role:

```text
water.entrySmall
```

Use for ordinary/low-energy water entry.

## 13.3 Large entry

Physical file:

```text
public/audio/sfx/water-splash-large.wav
```

Semantic role:

```text
water.entryLarge
```

Use for a clearly stronger fall/jump into water.

The small/large threshold is tuning based on the existing physical velocity/impact scale.

## 13.4 Exit

Semantic role:

```text
water.exit
```

Reuse:

```text
public/audio/sfx/water-splash-small.wav
```

Do not copy this file as `water-exit.wav`.

## 13.5 Surface jitter

Water-state transitions must not spam splashes if the collider oscillates around the surface.

Reuse or add a small transition debounce/hysteresis compatible with the current water-state implementation.

One physical entry/exit should sound like one entry/exit.

---

# 14. Hazards

Hazard SFX complement visual telegraphing. They never replace the required visual warning.

## 14.1 Cracked branch

### Warning / creak

Semantic event:

```text
hazards.branchCreak
```

Physical file:

```text
public/audio/sfx/trap-branch-creak.wav
```

Play once when the branch enters its warning/cracking phase.

### Break

Semantic event:

```text
hazards.branchBreak
```

Reuse:

```text
public/audio/sfx/impact-debris-medium.wav
```

Play once when the support actually breaks/is removed.

Do not duplicate it as `trap-branch-break.wav`.

## 14.2 Rising stump

### Trigger

Semantic event:

```text
hazards.stumpTrigger
```

Reuse:

```text
public/audio/sfx/feedback-toggle.wav
```

One playback when the trap activates.

### Hit / lift impact

Semantic event:

```text
hazards.stumpHit
```

Reuse:

```text
public/audio/sfx/impact-dull-low.wav
```

Recommended starting gain:

```text
~1.00
```

Do not repeatedly trigger it while the kinematic mechanism remains in contact.

There is no dedicated `stump-rise` file in the jam selection.

## 14.3 Pinecone tree

### Warning / rustle

Semantic event:

```text
hazards.pineconeRustle
```

Physical file:

```text
public/audio/sfx/trap-pinecone-rustle.mp3
```

Play once during the visual pre-drop warning.

### Fall

Semantic event:

```text
hazards.pineconeFall
```

Physical file:

```text
public/audio/sfx/trap-pinecone-fall.wav
```

Play once when the visible falling phase starts.

Do not restart it every simulation tick.

### Impact

Semantic event:

```text
hazards.pineconeHit
```

Reuse:

```text
public/audio/sfx/impact-dull-low.wav
```

Starting gain:

```text
~0.75
```

Only the first meaningful impact needs the dedicated hit feedback. Ignore minor bounce chatter.

---

# 15. Forest ambience

Physical file:

```text
public/audio/ambient/forest-ambience.wav
```

Original:

```text
JungleAmbLightDayt APS10149
```

Semantic role:

```text
ambient.forest
```

Use as a quiet background bed during gameplay if it improves the mix.

Starting relative ambient level:

```text
~0.20–0.30
```

BGM should remain dominant.

Do not restart the ambience at every procedural module boundary.

---

# 16. Audio system implementation requirements

## 16.1 First-interaction unlock

Browsers may block autoplay.

The first valid user interaction may initialize/resume audio:

```text
click
Enter
Space
valid navigation key
```

No gameplay flow should fail because audio was initially locked.

## 16.2 Do not add a heavy dependency by default

For the jam, prefer:

1. an existing project audio abstraction, if one exists;
2. otherwise native browser audio with a small central manager.

Do not add an audio library solely to implement features already achievable simply.

## 16.3 Long WAV files and memory

The jam build currently contains ~112 MB of audio, mostly WAV.

Do not eagerly decode every WAV into Web Audio buffers during initial page load.

Prefer lazy/on-demand loading and reuse cached/created elements.

Long BGM/ambient assets should not force the title screen to wait for every gameplay SFX.

## 16.4 Initial loading strategy

Title-critical first:

```text
fixing-the-farmers-car.wav
ui-move.wav
feedback-positive.wav
feedback-toggle.wav
feedback-negative.wav
```

Gameplay audio may load during menu/difficulty flow or on demand.

Before starting/while entering Endless, ensure the important gameplay files can be obtained without breaking the run.

A missing/non-ready optional ambience must not block gameplay.

## 16.5 Voice control

Avoid unbounded creation of `Audio` instances.

Use a small reusable pool or equivalent approach for overlapping SFX.

Impact spam protection is more important than supporting a huge number of simultaneous voices.

---

# 17. Logical buses and mix

Maintain at least conceptual categories:

```text
master
music
sfx
ambient
```

Recommended starting multipliers:

```text
master  = 1.00
music   = 0.45
sfx     = 0.80
ambient = 0.30
```

These are starting values, not approved final tuning.

Perceptual priority:

```text
critical UI / cargo loss
>
hazards / strong impacts
>
ordinary impacts
>
locomotion
>
ambience
>
BGM
```

The music should not hide:

- a breaking branch;
- the pinecone warning/fall;
- a definitive cargo loss;
- a client notification;
- a checkpoint award.

---

# 18. Suggested semantic AudioManager API

Exact names may be adapted to current architecture.

Prefer semantic calls such as:

```ts
audio.playUI("move");
audio.playUI("confirm");
audio.playUI("back");

audio.playCargoImpact("light", strength);
audio.playCargoImpact("medium", strength);
audio.playCargoImpact("heavy", strength);

audio.playLanding("soft");
audio.playLanding("hard");

audio.setDryMovement(active);
audio.setWaterMovement(active);

audio.playWaterEntry("small");
audio.playWaterEntry("large");
audio.playWaterExit();

audio.playHazard("branchCreak");
audio.playHazard("branchBreak");
audio.playHazard("stumpTrigger");
audio.playHazard("stumpHit");
audio.playHazard("pineconeRustle");
audio.playHazard("pineconeFall");
audio.playHazard("pineconeHit");

audio.notifyCargoLoss({ isLastObject, groupedCount });

audio.setMusicContext("menu");
audio.setMusicContext("physicsLab");
audio.setMusicContext("credits");
audio.setMusicContext("endless");
```

Gameplay systems should not know the Audio Hero titles.

Ideally they should not know physical filenames either.

---

# 19. Suggested centralized tuning

Keep audio tuning in one place instead of scattering constants.

Example:

```ts
export const AUDIO_TUNING = {
  masterVolume: 1.0,
  musicVolume: 0.45,
  sfxVolume: 0.8,
  ambientVolume: 0.3,

  musicFadeMs: 300,
  pauseMusicMultiplier: 0.65,

  impactGroupWindowMs: 120,
  impactCooldownMs: 120,
  cargoLossGroupWindowMs: 300,

  landingSoftGain: 0.55,
  landingHardGain: 0.9,

  stumpHitGain: 1.0,
  pineconeHitGain: 0.75,

  variationPlaybackRateMin: 0.97,
  variationPlaybackRateMax: 1.03,
} as const;
```

Do not treat these numbers as physics constants.

Impact thresholds should be tuned against real observed values from the existing implementation.

---

# 20. Explicitly absent jam assets

The following concepts appeared in the earlier sound-design plan but **do not have dedicated physical files in the final jam selection**:

```text
jump-charge
jump-release
trap-stump-rise
water-current
results-stamp

separate grass/rock movement files
separate impact variants -01/-02
separate swim variants -01/-02

dedicated cargo-lost file
dedicated last-object-lost file
dedicated checkpoint file
dedicated score-pop file
dedicated help-pop file
dedicated pause-open file
dedicated water-exit file
dedicated branch-break file
dedicated stump-hit file
dedicated pinecone-hit file
```

This is intentional.

Codex must not introduce 404 references or silent placeholder assets for them.

Where a semantic alias exists, use the mapped physical file from this document.

Where no mapping exists (`jump-charge`, `jump-release`, `stump-rise`, etc.), ship without that sound for the jam.

---

# 21. Integration order for Codex

## P0-A — infrastructure

- [ ] Inspect existing asset URL helper and reuse it for `public/audio`.
- [ ] Add/extend one central audio manifest.
- [ ] Add/extend one central audio manager.
- [ ] Implement first-interaction audio unlock.
- [ ] Ensure WAV and MP3 both load correctly.
- [ ] Avoid eager loading/decoding of the full ~112 MB audio set.
- [ ] Ensure pause/run-end cannot accumulate delayed SFX.

## P0-B — BGM and menus

- [ ] menu BGM: `fixing-the-farmers-car.wav`.
- [ ] laboratory BGM: `patio-party.wav`.
- [ ] credits BGM: `patio-party.wav`.
- [ ] Endless BGM: `just-kidding.wav`.
- [ ] menu move / confirm / back / disabled.
- [ ] preserve menu BGM between menu screens where possible.

## P0-C — gameplay fundamentals

- [ ] cargo impact light / medium / heavy.
- [ ] impact aggregation and cooldown.
- [ ] soft / hard landing aliases.
- [ ] definitive cargo-loss feedback only.
- [ ] group simultaneous cargo losses.
- [ ] client call/text SFX.

## P0-D — terrain and water

- [ ] dry movement.
- [ ] water movement.
- [ ] small / large water entry.
- [ ] water exit alias.
- [ ] suppress water-surface jitter spam.

## P0-E — hazards and scoring

- [ ] cracked branch warning + break.
- [ ] stump trigger + hit.
- [ ] pinecone warning + fall + hit.
- [ ] pennant/checkpoint positive feedback once per award.

## P1 — polish if time remains

- [ ] forest ambience.
- [ ] subtle playbackRate/gain variation.
- [ ] refine crossfades.
- [ ] refine per-event gains by human playtesting.

---

# 22. Acceptance checklist

The jam audio implementation is acceptable when:

1. [ ] production build has no audio 404s;
2. [ ] both WAV and MP3 assets play in the target browsers used for submission testing;
3. [ ] Pages/subpath asset URLs are resolved through the existing BASE_URL-safe mechanism;
4. [ ] no physical asset is duplicated merely to provide another semantic name;
5. [ ] the title/menu does not wait for all ~112 MB before becoming usable;
6. [ ] browser autoplay restrictions do not break navigation or game start;
7. [ ] menu music does not restart unnecessarily between menu screens;
8. [ ] Endless switches to `Just Kidding`;
9. [ ] laboratory/credits use `Patio Party`;
10. [ ] one physical crash does not become a machine-gun burst of Rapier contact sounds;
11. [ ] small cargo wobble is usually silent;
12. [ ] light/medium/heavy impacts are perceptibly differentiated;
13. [ ] temporary cargo separation does not play loss feedback;
14. [ ] definitive cargo loss does;
15. [ ] grouped simultaneous losses create one readable audio event;
16. [ ] entering/exiting water cannot spam splash sounds around the surface boundary;
17. [ ] dry locomotion stops when airborne/blocked/in water;
18. [ ] water movement stops after leaving water;
19. [ ] each hazard phase fires once at its meaningful transition;
20. [ ] a checkpoint/pennant awards one positive sound, not duplicate alias playback;
21. [ ] pause prevents new gameplay SFX but keeps UI feedback;
22. [ ] resume does not replay events that happened while paused;
23. [ ] run end does not layer duplicate `lost` and `lastObjectLost` samples;
24. [ ] BGM/ambience do not mask hazard warnings or cargo-loss feedback;
25. [ ] no code references obsolete planned filenames from the previous `SOUNDS.md`.

---

# 23. Provenance / licensing record

The Audio Hero assets remain third-party copyrighted assets used under the Audio Hero/bundle license.

They are not relicensed under the source-code license.

Preserve:

- Humble Bundle purchase/receipt;
- applicable Audio Hero license/EULA;
- original Audio Hero title;
- source pack;
- canonical local filename;
- gameplay use.

This document provides the current title/pack/local-path mapping for the 18 SFX/ambient assets.

Renaming a file for project clarity does not replace provenance tracking.

---

# 24. Post-jam optimization

The current mixed WAV/MP3 set is intentionally accepted for the jam to avoid last-minute conversion risk.

Post-jam backlog work should:

1. convert WAV runtime assets to appropriately compressed MP3 (or reconsider a better web delivery format if desired at that time);
2. update manifest extensions atomically;
3. remove obsolete WAV runtime copies after verification;
4. compare audible quality;
5. verify loops/transitions;
6. measure deployed-size reduction;
7. preserve the provenance mapping.

Until that task is completed, **the `.wav` and `.mp3` extensions in this document are authoritative**.

---

# 25. Final implementation rule

> **One physical recording, one physical file. Many gameplay meanings may alias it.**

And:

> **The player should hear decisions, accidents and state changes — not Rapier doing mathematics.**
