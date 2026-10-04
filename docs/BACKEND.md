# Jam service foundation — Mudanzas Tortuga, S.L.

The human approved a **static published catalog and browser-local Top 100** on 2026-10-03. This phase supplies functioning data/persistence adapters and the boundary for a later remote backend. It introduces no HTTP API, database, account creation or level editor. Vite builds/serves the client; GitHub Pages will serve its static output. A future remote API/auth provider is a separate deployment.

## Current composition

`src/services/contracts.ts` owns serializable content and ranking contracts. `createJamServices` composes a validated `StaticLevelCatalog`, `LocalLeaderboardService` and `AnonymousSessionService`; `createBrowserJamServices` safely obtains browser storage. `src/app/services.ts` keeps one shared service instance for application screens. Bootstrap validates and reads public catalog/session data without sign-in. The current playground retains its diagnostics and does not submit scores.

The seed `src/game/content/jamCatalog.ts` contains an official maintainer profile, references to existing body/cargo archetypes, one full-load turtle configuration derived from `CARGO`, the six shared grass/rock/water module definitions and three hazard definitions (`branch`, `stump`, `tree`). **There are no published designed levels.** Endless consumes that shared pool directly; a diagnostic or a procedural run does not become a fabricated designed level merely to populate this service.

## Published content contract

Catalog/content schema version starts at `1`, separately from the physics settings schema. IDs identify entities; exact `id`/`version` references identify immutable revisions. Repeating an ID with a different revision does not create a different level identity. Do not change the meaning of an existing published revision.

| Level requirement | Representation |
|---|---|
| Unique level identity | `id` and explicit `version` |
| Name | `name` |
| Optional thumbnail | `thumbnail`, relative public asset path; resolve through `publicAsset` |
| Geometry | Module placements and hazard placements, each with a unique `instanceId`, exact definition reference and world `x`/`y` |
| Turtle and initial load | Exact `turtleConfiguration` reference; configuration binds a body archetype and individually identified cargo instances with positions/angles |
| Top 100 | `leaderboard.maxEntries=100`, `physicsVersion`; records partitioned by level ID, level revision and physics revision |
| Author ownership | Required `authorUserId` resolving to an author profile |

Modules store connector biomes/heights, length, local terrain/water geometry and optional module-local hazard placements. The additive schema-1 fields `terrain.bottom`, `sockets` and `jumps` describe finite solid thickness, compatible trap locations and authored full-charge traversal targets. Primary ground strips join continuously; later finite islands may overlap them. Dry connector heights match ground; water connectors reference a matching water surface with a cleared bed beneath it. Existing definitions without these optional fields preserve their single-exit behavior. Level placements use world coordinates; module-local hazard coordinates are relative to their module. Hazards store versioned kind/parameter definitions; their fixed-step physical behavior remains in the game implementation. Archetype registries reference game definitions instead of duplicating collider/mass data. The same cargo archetype may appear several times with distinct instance IDs. Initial cargo coordinates follow the existing ground-relative `CARGO` registration; a future level spawn adds its origin and applies the existing shell-height registration adjustment.

The catalog validates schema versions, IDs/references, supported values and finite geometry before exposing defensive frozen snapshots. `listPublishedLevels` and `getPublishedLevel(id, version)` are anonymous reads. Revision lookup is exact; there is no guessed “latest” version. The public catalog contains published records only, with no draft/private data or write operation.

Validation of data is **not** certification of module joins, jump traversal, onboarding or completion. Before adding playable content, satisfy the GDD/PRD module-validation requirements with current settings and real Rapier traversal. Future renderer/controller integration must explicitly support the referenced archetypes and hazard kinds.

To author the jam catalog, edit repository content on an auxiliary branch, add the matching versioned definitions/references, test them, build and complete human verification before promotion. An optional image belongs under `public/`; its catalog path omits both `public/` and a leading slash. Runtime definitions reside in the shared module pool; catalog registration references them rather than copying their geometry.

## Local ranking behavior

`LeaderboardService.submitScore` accepts a run ID, display name, optional player user ID, integer score/time/timestamp and the full version partition. `getTopScores` requires all three partition fields; its optional limit cannot return more than 100. Scores sort descending, then shorter completion time, earlier timestamp and stable run ID. Identical retries are idempotent while retained; conflicting reused run IDs reject.

The local adapter persists schema-versioned records under a namespaced key per partition. It validates loaded entries, isolates revisions and copies records so callers cannot mutate stored state. It rereads current storage before operations to incorporate already-persisted additions from another instance; localStorage is not an atomic multi-tab database.

Missing/blocked storage, quota failures, corrupt envelopes or unsupported future storage versions switch that adapter instance to memory. The game remains usable; memory-only records disappear when the page reloads. Corrupt/future envelopes are preserved rather than overwritten. `persistenceStatus` and `persistenceReason` on the local adapter distinguish persistence from this fallback. Records are local to the browser origin/profile, so changing host/port or clearing site data changes the available ranking. This is not a shared global leaderboard or score verification system.

The designed-level service stores final scores supplied by gameplay; it does not implement the GDD score formula. Endless calculates its own cumulative pennant score and frozen results and does not submit those records to the designed-level Top 100 adapter.

## Endless integration

The approved 2026-10-04 jam implementation supplies six grass/rock/water modules, each with three compatible sockets. The complete content contract retains sand. [ENDLESS_PLAN.md](ENDLESS_PLAN.md) records the implementation sequence and verification gates. The static catalog includes those six reusable definitions and the three traps; it keeps `levels` empty because the jam's playable mode is Endless. Additive optional fields preserve schema version 1 and exact existing references.

Run reproduction descriptors capture seed, difficulty, initial safe-module count, pool/generator/physics versions and a hash of the captured settings. Single exits remove route ambiguity; different settings or future exit choices require their own replay context. Gameplay and results work anonymously without persistence. Optional Endless personal records remain deferred and require a distinct mode/difficulty/pool/generator/physics partition using the existing robust storage/fallback approach. Designed-level Top 100 rules, including time tie-breaks, remain their own contract; time is not an Endless score component.

## Anonymous play and future accounts

The jam session always returns `status: 'anonymous'`; it fabricates no guest account and stores no password/email. Published-level reads, normal play and Endless Run remain available anonymously. An author profile is attribution metadata, not a login. Optional `playerUserId` on a local score is likewise metadata, not proof of identity.

The future account phase must provide email/password and Google sign-in through a chosen auth provider. Keep provider credentials/password hashes out of public catalog, browser storage and the client bundle. A stable application user ID maps provider identities to authors; changing sign-in method must not require rewriting published level IDs or owner references.

Future create/update/publish APIs must require a verified session and derive/check ownership server-side. Client-supplied author IDs or an `authenticated` session-shaped object are insufficient. Playing already-published levels must remain a public read. Community drafts, uploads, publication validation and moderation are future authenticated operations; no permissive stub exists in this phase.

## Non-destructive migration

1. Keep stable entity IDs, explicit content revisions and exact references. Introduce a new schema version with a reviewed migration when record structure changes; reject unknown versions rather than guessing.
2. Implement remote catalog/ranking adapters behind the existing contracts. Swap application composition without rewriting physics or score calculation. Plan offline/failure behavior separately from publication writes.
3. Keep local rankings separate from verified remote rankings. Any import must be explicit and labelled unverified; do not automatically upload local names/user metadata or manufacture authenticated records.
4. Partition remote rankings by level/physics revisions too. Decide retention, ownership rules, API validation and score-trust policy before enabling public submissions.
5. Choose remote hosting/auth/storage only when that phase is authorized; static Pages cannot execute that API. Account/editor work remains post-jam.

Deployment and the inactive Actions template are documented in [DEPLOYMENT.md](DEPLOYMENT.md). The PRD owns scope; BACKLOG tracks UI/content/auth/remote follow-ups.
