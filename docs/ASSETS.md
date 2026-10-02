# Asset Contract — Mudanzas Tortuga, S.L.

**Scope:** Prototype 1 placeholder visuals and the handoff to the artist.
**Visual metadata:** [visualDefinitions.ts](../src/rendering/visualDefinitions.ts)
**Renderer:** [playgroundRenderer.ts](../src/rendering/playgroundRenderer.ts)
**Requirements:** [PRD, section 7](PRD.md#7-prototype-asset-strategy)
**Licensing authority:** [LICENSE.md](../LICENSE.md)

## 1. Source files and provenance

Static sprite source files live in `public/sprites/`. Vite copies these files into the production build; there is no second asset copy under `src/`.

The current seven SVGs are original, repository-specific placeholders authored by OpenAI Codex, with subagent provenance `/root/placeholder_assets`. They use simple rectangles, ellipses, circles and paths with solid fills and labels. No third-party images, icon packs, textures or font files were imported. The SVGs reference the system font family `Arial, sans-serif`; they contain no external image/font URLs or scripts.

Original creative assets remain governed by the project's provisional licensing notice. This document does not change that notice or select a final license. Future imported assets must record their source, creator, license and required attribution before inclusion.

## 2. Dimensions and anchors

All source SVGs have a transparent background. Their declared width and height match their `viewBox`, which starts at `0 0`. Source coordinates point right and down. Each asset currently uses 100 SVG units per visual metre.

All normalized sprite anchors are `(0.5, 0.5)`. The centre below is measured in source SVG units.

| Metadata key | Source path under `public/` | SVG dimensions | Visual size in metres | Source centre |
|---|---|---|---|---|
| `sofa` | `sprites/cargo/sofa/sofa.svg` | 220 × 65 | 2.2 × 0.65 | 110, 32.5 |
| `television` | `sprites/cargo/tv/tv.svg` | 80 × 90 | 0.8 × 0.9 | 40, 45 |
| `cocktailGlass` | `sprites/cargo/cocktail-glass/cocktail-glass.svg` | 40 × 70 | 0.4 × 0.7 | 20, 35 |
| `floorLamp` | `sprites/cargo/floor-lamp/floor-lamp.svg` | 55 × 160 | 0.55 × 1.6 | 27.5, 80 |
| `turtle` | `sprites/turtle/walk-01.svg`, `sprites/turtle/walk-02.svg` | 240 × 90 each | 2.4 × 0.9 | 120, 45 |
| `shell` | `sprites/turtle/shell.svg` | 220 × 60 | 2.2 × 0.6 | 110, 30 |

The render scale comes from `Tuning.worldPixelsPerMetre`, currently 76 logical pixels per metre. The logical scene is 1280 × 720 and scales uniformly to fit its host with letterboxing. Asset dimensions remain in metres when the browser viewport changes.

Runtime asset paths pass through [publicAsset.ts](../src/utils/publicAsset.ts), which uses Vite's `BASE_URL`. Asset metadata contains paths relative to `public/`, without a leading slash.

## 3. Visual placement and physics

Physics coordinates point right and up. The renderer converts physical `y` to screen `-y`, and physical angles to screen `-angle`. Sprites mirror snapshots; their transforms never drive Rapier.

Cargo sprites are centred on each object's geometric pose origin. A configured centre of mass may be offset from that origin. The artwork must not compensate for that offset: physical dimensions and mass properties belong to [cargo.ts](../src/game/content/cargo.ts) and the physics implementation.

Don Tortuga is split into two parts:

- The walking body excludes the shell and stays right-facing. Its visual centre is 0.21 m above the physical body centre, placing its feet at the body's lower boundary.
- The shell has its own container at the physical shell pivot, 0.30 m above the body centre. The sprite centre is a further 0.12 m above that pivot. Rotation applies to the container, so the shell tilts independently of the walking body.

With the current 0.6 m shell image height, its upper centre is 0.42 m above the shell pivot, matching the support's maximum height. The pivot and collider definitions remain canonical in [tuning.ts](../src/game/config/tuning.ts).

The broad sofa combines a back, seat, arms and feet. The television combines a screen/body and feet. The cocktail glass uses a cup, narrow stem and base. The lamp combines a shade, pole and base. These composed silhouettes convey the objects without requiring detailed physical geometry.

## 4. Walking animation

The walking cycle lasts one second and contains 60 logical frames at 60 FPS.

Only two unique source images exist:

| Logical frame range | Source image |
|---|---|
| 0–29 | `walk-01.svg` |
| 30–59 | `walk-02.svg` |

The renderer selects the frame from simulation time, rather than elapsed wall time. Pausing simulation freezes the displayed posture. Both frames use the same canvas, anchor, body/head placement and scale; their leg poses differ.

Future in-betweens can replace this reuse by extending the metadata's `frames` array while retaining the one-second, 60-logical-frame contract. Do not create duplicate image files for unused slots.

## 5. Artist repaint contract

The artist can replace or paint over these placeholders while physics work continues.

1. Preserve each canvas size, transparent background, normalized anchor and meaningful silhouette placement.
2. Keep the walking body and shell separate. Preserve identical registration between walking frames so animation does not move the character's origin.
3. Preserve broad, low support for the sofa; a compact television; a narrow glass; and a tall lamp. Internal visual detail may increase while colliders remain simple.
4. Keep artwork within the canvas. If additional padding is needed, coordinate an explicit metadata/placement change so the sprite does not silently change scale or alignment.
5. Replace the files at their existing paths for a direct SVG swap. A change of format or filename also requires updating the corresponding metadata path.
6. Review replacements in the playground with collider debug enabled. Artwork must communicate the existing contact surfaces without requiring pixel-perfect matching.

Embedded labels are prototype scaffolding and may give way to final artwork. The playground also renders upright cargo-name callouts independently of the textures, with a minimum 14-pixel screen font size. Lost cargo is dimmed and marked `×`; temporarily separated cargo is marked `↔`. These presentation cues do not change physical state.

Terrain, water, simple parallax trees and diagnostic markers currently use Pixi Graphics. Menu and tuning controls use HTML/CSS. They have no additional sprite files to repaint in this milestone.

## 6. Verification

The original seven SVGs were parsed as XML and their dimensions, labels and two distinct walking postures were checked.

After replacing assets, verify:

- direct playground access through `?mode=physics`;
- stable registration during the walking cycle and shell tilt;
- readable silhouettes and external labels at the normal viewport;
- alignment against the actual collider debug display;
- loading from a production build at both the site root and a deployment subpath.

Build and subpath procedures belong to [DEPLOYMENT.md](DEPLOYMENT.md).
