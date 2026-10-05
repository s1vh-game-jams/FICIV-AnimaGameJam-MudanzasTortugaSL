# Asset Contract — Mudanzas Tortuga, S.L.

**Scope:** Prototype 1 and Endless jam placeholder visuals and the handoff to the artist.
**Visual metadata:** [visualDefinitions.ts](../src/rendering/visualDefinitions.ts)
**Renderers:** [playgroundRenderer.ts](../src/rendering/playgroundRenderer.ts), [endlessRenderer.ts](../src/rendering/endlessRenderer.ts)
**Requirements:** [PRD, section 7](PRD.md#7-prototype-asset-strategy)
**Licensing authority:** [LICENSE.md](../LICENSE.md)

## 1. Source files and provenance

Static sprite source files live in `public/sprites/`. Vite copies these files into the production build; there is no second asset copy under `src/`.

The original nine turtle/cargo SVGs are repository-specific placeholders authored by OpenAI Codex, with subagent provenance `/root/placeholder_assets`. Eleven original Endless terrain/hazard/pennant SVGs were added by `/root/assets_validation` on 2026-10-04. They use simple rectangles, ellipses, circles and paths with solid fills, readable silhouettes and descriptive SVG titles. No third-party images, icon packs, textures or font files were imported. Printed text references the system font family `Arial, sans-serif`; the files contain no external image/font URLs or scripts.

The original laboratory gear icon was authored by OpenAI Codex subagent `/root/ui_game` on 2026-10-05 using eight rectangular teeth and a ring path. It contains no imported artwork, fonts, external references or scripts.

Interface fonts (Fredoka, Nunito, Permanent Marker; DESIGN.md §5) are imported third-party files: self-hosted Latin subsets downloaded from Google Fonts on 2026-10-05 into `src/assets/fonts/`, bundled by Vite through `src/styles/fonts.css`. Fredoka and Nunito are under the SIL Open Font License 1.1 and Permanent Marker under the Apache License 2.0; the license texts and a provenance table sit next to the files. They style the HTML UI and in-run help text only; sprite SVGs still reference their own system font.

Original creative assets remain governed by the project's provisional licensing notice. This document does not change that notice or select a final license. Future imported assets must record their source, creator, license and required attribution before inclusion.

## 2. Dimensions and anchors

All source SVGs have a transparent background. Their declared width and height match their `viewBox`, which starts at `0 0`. Source coordinates point right and down. World assets use 100 SVG units per visual metre; HTML menu icons have their own pixel-sized canvas and CSS display size.

Turtle/cargo normalized sprite anchors are `(0.5, 0.5)`, except the shell's `(0.5, 0.30 / 0.68)` registration. The centre below is measured in source SVG units. The Endless table specifies its own anchors.

| Metadata key | Source path under `public/` | SVG dimensions | Visual size in metres | Source centre |
|---|---|---|---|---|
| `sofa` | `sprites/cargo/sofa/sofa.svg` | 220 × 65 | 2.2 × 0.65 | 110, 32.5 |
| `television` | `sprites/cargo/tv/tv.svg` | 80 × 90 | 0.8 × 0.9 | 40, 45 |
| `cocktailGlass` | `sprites/cargo/cocktail-glass/cocktail-glass.svg` | 40 × 70 | 0.4 × 0.7 | 20, 35 |
| `floorLamp` | `sprites/cargo/floor-lamp/floor-lamp.svg` | 55 × 160 | 0.55 × 1.6 | 27.5, 80 |
| `turtle.frames` | `sprites/turtle/walk-01.svg`, `sprites/turtle/walk-02.svg` | 240 × 90 each | 2.4 × 0.9 | 120, 45 |
| `turtle.chargeFrames` | `sprites/turtle/charge-walk-01.svg`, `sprites/turtle/charge-walk-02.svg` | 240 × 90 each | 2.4 × 0.9 | 120, 45 |
| `shell` | `sprites/turtle/shell.svg` | 170 × 71 | 2.0 × 0.68 | 85, 35.5 |

The laboratory render scale is fixed at 76 logical pixels per metre. Its 1280 × 720 logical scene scales uniformly to fit the host with letterboxing. Normal-level framing derives a separate scale from the physical movement corridor and configured outer dead zones at level load, then freezes that frame. Resizing uniformly scales the captured composition; asset dimensions remain in metres. The laboratory does not necessarily display the same apparent character size as a normal level.

Runtime asset paths pass through [publicAsset.ts](../src/utils/publicAsset.ts), which uses Vite's `BASE_URL`. Asset metadata contains paths relative to `public/`, without a leading slash.

## 3. Visual placement and physics

Physics coordinates point right and up. The renderer converts physical `y` to screen `-y`, and physical angles to screen `-angle`. Sprites mirror snapshots; their transforms never drive Rapier.

Cargo sprites are centred on each object's geometric pose origin. A configured centre of mass may be offset from that origin. The artwork must not compensate for that offset: physical dimensions and mass properties belong to [cargo.ts](../src/game/content/cargo.ts) and the physics implementation.

Don Tortuga is split into two parts:

- The walking body excludes the shell and stays right-facing. Its visual centre is 0.21 m above the corrected body origin (snapshot.turtle.bodyX/bodyY) in the body's local coordinates, placing its feet at the body's lower boundary. The body follows the simulation-owned corrected body origin and terrain pitch, rather than the fixed locomotion proxy's centre.
- The shell has its own container at the simulation-owned physical shell pivot. Its local upward offset from that corrected body origin is the adjustable `shellPivotY`, rotated with terrain pitch. The default is restored to the original 0.30 m; the previous 0.42 m registration remains available as a tuning candidate. The sprite registration point is a further 0.12 m above that pivot in shell-local coordinates. Shell rotation combines terrain pitch and manual compensation; the renderer mirrors the physical shell pose.

The 2026-10-05 urgent visual revision shortens the shell from 2.2 m to 2.0 m and increases its displayed height from 0.60 m to 0.68 m, giving the existing artwork a fuller dome and a shorter front. The source SVG remains unchanged. Its vertical anchor is `0.30 / 0.68`, so the upper outline stays 0.42 m above the shell pivot, matching the support's maximum height; the image centre now sits 0.08 m above that pivot. Both renderers use the same visual anchor. This presentation adjustment changes no collider, physical pivot, cargo layout or tuning value.

`settings.txt` owns the pivot-height value; [tuning.ts](../src/game/config/tuning.ts) owns the unchanged collider shape and the original cargo-layout reference of 0.30 m. Initial cargo placement shifts by `shellPivotY - 0.30` before settling. Editing the support height does not add padding, resize artwork or alter collider geometry.

The broad sofa combines a back, seat, arms and feet. The television combines a screen/body and feet. The cocktail glass uses a cup, narrow stem and base. The lamp combines a shade, pole and base. These composed silhouettes convey the objects without requiring detailed physical geometry.

## 4. Walking animation

The walking cycle lasts one second and contains 60 logical frames at 60 FPS.

Each state reuses two unique source images:

| Logical frame range | Walking | Charging jump |
|---|---|---|
| 0–29 | `walk-01.svg` | `charge-walk-01.svg` |
| 30–59 | `walk-02.svg` | `charge-walk-02.svg` |

The renderer selects the frame from simulation time, rather than elapsed wall time. Pausing simulation freezes logical animation time; canceling jump charge restores the neutral head pose. The two walking frames use the same canvas, anchor, body/head placement and scale; their leg poses differ.

While the authoritative snapshot reports `jumpCharging`, the renderer selects `chargeFrames` at the same logical animation slot. Each charging variant preserves its matching walking frame's body, neck, tail, paws, label and anchor. Only the head moves down by 13 SVG units (0.13 m), with a narrowed eye and angled brow conveying concentration. Releasing or canceling the charge returns to the walking images.

The character pose is the only player-facing charge feedback. Do not add a GUI charge bar, percentage or meter. The shell remains a separate unchanged source image; adjustable shell height is physical registration, not additional paint or padding.

Future in-betweens can replace this reuse by extending the metadata's `frames` array while retaining the one-second, 60-logical-frame contract. Do not create duplicate image files for unused slots.

## 5. Artist repaint contract

The artist can replace or paint over these placeholders while physics work continues.

1. Preserve each canvas size, transparent background, normalized anchor and meaningful silhouette placement.
2. Keep the walking body and shell separate. Preserve identical registration between walking and charging frames so animation or charging does not move the character's origin. Maintain the lowered-head/concentrated pose while charging; paw motion follows the corresponding walking keyframe. Check the default 0.30 m shell height before relying on additional leg room from higher tuning candidates.
3. Preserve broad, low support for the sofa; a compact television; a narrow glass; and a tall lamp. Internal visual detail may increase while colliders remain simple.
4. Keep artwork within the canvas. If additional padding is needed, coordinate an explicit metadata/placement change so the sprite does not silently change scale or alignment.
5. Replace the files at their existing paths for a direct SVG swap. A change of format or filename also requires updating the corresponding metadata path.
6. Review replacements in the playground with collider debug enabled. Artwork must communicate the existing contact surfaces without requiring pixel-perfect matching.

Embedded labels are prototype scaffolding and may give way to final artwork. The playground also renders upright cargo-name callouts independently of the textures, with a minimum 14-pixel screen font size. Lost cargo is dimmed and marked `×`; temporarily separated cargo is marked `↔`. These presentation cues do not change physical state.

The laboratory terrain, water, simple parallax trees and diagnostic markers use Pixi Graphics. Menu and tuning controls use HTML/CSS. Endless terrain/material tiles and new entities have replaceable static source files below; physical geometry remains authored independently.

### HTML menu icons

| Source path under `public/` | SVG dimensions | HTML display | Placement |
|---|---|---|---|
| `sprites/ui/laboratory.svg` | 32 × 32 | 1 × 1 rem | Decorative gear before the secondary **Laboratorio de físicas** title entry. |

The laboratory icon has no collider or world-space anchor. Its HTML image uses `publicAsset`, an empty `alt` and `aria-hidden="true"`; the adjacent button label provides the accessible name. Replace the file at the same path while preserving its transparent 32 × 32 canvas and centred silhouette.

### Endless terrain, hazards and pennants

All paths below are relative to `public/`. Frame pairs preserve matching canvases and registration. Terrain tiles communicate material and can be scaled/tiled independently of physical polygon boundaries. Hazard artwork may be scaled to its authored socket geometry: the branch cover is 3.6 m wide, the hatch/stump is 2.8 m wide, and the stump's displayed rise follows its authoritative moving surface. These deliberate visual sizes do not redefine collider thickness.

| Source path | SVG dimensions | Source size at 100 units/m | Anchor | Registration / frames |
|---|---|---|---|---|
| `sprites/terrain/grass.svg` | 400 × 100 | 4 × 1 m | renderer tile origin | Top edge is the grass surface; brown earth below. |
| `sprites/terrain/rock.svg` | 400 × 100 | 4 × 1 m | renderer tile origin | Top edge is the rock surface. |
| `sprites/terrain/water.svg` | 400 × 100 | 4 × 1 m | renderer tile origin | Translucent fill and bright surface ripples. |
| `sprites/hazards/branch-intact.svg`, `branch-broken.svg` | 320 × 40 each | 3.2 × 0.4 m | `(0.5, 0.5)` | Same canvas; central crack becomes a broken opening. |
| `sprites/hazards/hatch.svg` | 320 × 30 | 3.2 × 0.3 m | `(0.5, 0.5)` | Yellow upward chevron telegraphs the lift. |
| `sprites/hazards/stump.svg` | 280 × 115 | 2.8 × 1.15 m | `(0.5, 0.5)` | Wood/ring silhouette; display tracks current lift height. |
| `sprites/hazards/tree.svg` | 280 × 550 | 2.8 × 5.5 m | `(0.5, 1)` | Ground at canvas bottom; visible cone high in canopy. |
| `sprites/hazards/pinecone.svg` | 60 × 90 | 0.6 × 0.9 m | `(0.5, 0.5)` | Scale-marked pinecone; independent projectile pose. |
| `sprites/ui/pennant-folded.svg`, `pennant-deployed.svg` | 100 × 250 each | 1 × 2.5 m | `(0.5, 1)` | Pole base at canvas bottom; square flag/check only in deployed frame. |

Pennants have no physical geometry. Their runtime height is 2 m, above the body/shell and roughly halfway up the initial stack; their base follows the visible connector. Deployment changes the frame once horizontal distance crosses the boundary. The SVG titles name small hazards accessibly without relying on text that would become illegible at normal-run scale. Hazard state frames mirror simulation-owned state. Asset loading uses `publicAsset` and remains separate from colliders, just like the turtle/cargo art.

## 6. Verification

The urgent shell presentation revision was applied without tests or browser verification at the human's explicit request to publish before the jam deadline. Its visual feel and collider-overlay comparison remain pending human review.

The original turtle/cargo SVGs and eleven Endless SVGs were parsed as XML. Dimensions, descriptive titles, paths without external dependencies and matching frame canvases were checked. Walking/charging pairs preserve distinct leg poses and matching body/paw registration. Runtime visibility and root/subpath loading require integrated browser smoke verification; its result belongs in DEPLOYMENT/BACKLOG.

The laboratory gear was also parsed as XML with its 32 × 32 dimensions, matching `viewBox` and descriptive title verified. The 2026-10-05 browser smoke confirms its smaller secondary-menu appearance and successful root/subpath loading; DEPLOYMENT/BACKLOG record the integrated checks.

After replacing assets, verify:

- direct playground access through `?mode=physics`;
- stable registration during the walking cycle, charge-pose changes, terrain pitch and shell tilt;
- changing shell height moves support/cargo registration coherently without changing source-image or collider shapes;
- readable silhouettes and external labels at the normal viewport;
- high jumps can place cargo outside the visible frame without changing its physical behavior;
- alignment against the actual collider debug display;
- loading from a production build at both the site root and a deployment subpath.

Build and subpath procedures belong to [DEPLOYMENT.md](DEPLOYMENT.md).
