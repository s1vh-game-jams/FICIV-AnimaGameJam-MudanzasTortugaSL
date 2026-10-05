# Licensing Notice — Mudanzas Tortuga, S.L.

This repository is a **mixed-license project**.

Different parts of the project are distributed under different terms.  
No single license applies to the repository as a whole.

| Material | License / terms |
|---|---|
| Original game source code and project-authored scripts | MIT License |
| Original graphical artwork | Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International (CC BY-NC-ND 4.0) |
| Audio Hero music, sound effects and production elements | Audio Hero End User License / synchronization license |
| Third-party libraries and dependencies | Their respective upstream licenses |

The sections below define these boundaries in more detail.

---

## 1. Original game source code — MIT License

Unless a file or directory clearly states otherwise, **original source code and project-authored scripts created specifically for Mudanzas Tortuga, S.L.** are licensed under the MIT License.

This includes original TypeScript, JavaScript, HTML, CSS, configuration logic, gameplay systems, tests and project-authored development scripts, where applicable.

The MIT grant **does not automatically extend to**:

- third-party libraries or dependencies;
- graphical artwork;
- music, sound effects or other Audio Hero material;
- third-party assets;
- documentation or other content carrying a different notice;
- any material for which the project does not own or control the relevant rights.

### MIT License

Copyright (c) 2026 Mudanzas Tortuga, S.L. project contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files covered by this section
(the "Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to permit
persons to whom the Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

## 2. Third-party software

Third-party software included, bundled, referenced or installed by this
project is **not relicensed by the project's MIT License**.

Each dependency remains subject to the license chosen by its respective
copyright holders.

Important runtime dependencies currently include:

### PixiJS

PixiJS is distributed by its upstream project under the **MIT License**.

Project:
https://github.com/pixijs/pixijs

The upstream PixiJS copyright and license terms remain applicable to PixiJS
code.

### Rapier / `@dimforge/rapier2d`

Rapier and its official JavaScript/TypeScript bindings are distributed by
Dimforge under the **Apache License 2.0**.

Project:
https://github.com/dimforge/rapier

The upstream Rapier copyright, license and notice requirements remain
applicable to Rapier code.

### Other dependencies

Other direct and transitive dependencies are governed by the license metadata
and license files supplied by their respective upstream packages.

Nothing in this file overrides, replaces or broadens those upstream licenses.

---

## 3. Original graphical artwork — CC BY-NC-ND 4.0

Unless explicitly identified otherwise, the original graphical artwork
created specifically for Mudanzas Tortuga, S.L. during the Ànima Valencia
Game Jam 2026 is:

**© 2026 Argorias Svartha**

Artist profile:

https://www.artstation.com/argorias

The artwork is licensed under:

**Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International**  
**CC BY-NC-ND 4.0**

License deed and legal code:

https://creativecommons.org/licenses/by-nc-nd/4.0/

Under that license, you may share unmodified copies of the covered artwork,
provided that you:

- give appropriate attribution to **Argorias Svartha**;
- include a reference or link to the CC BY-NC-ND 4.0 license;
- do not use the artwork for commercial purposes without separate permission;
- do not distribute modified, remixed, transformed or otherwise adapted
  versions of the artwork without separate permission from the artist.

The artwork is **not** licensed under the MIT License that covers the original
game code.

Permission outside CC BY-NC-ND 4.0, including commercial use or distribution
of adaptations, may be granted separately by the copyright holder.

### Note on ShareAlike and NoDerivatives

Creative Commons does not provide a license containing both the
**ShareAlike (SA)** and **NoDerivatives (ND)** elements.

NoDerivatives prohibits distribution of adaptations, while ShareAlike governs
the license under which adaptations may be distributed. Because the intended
policy for this project is that adaptations must not be distributed without
separate permission, **CC BY-NC-ND 4.0** is used here.

If the project's art policy is later changed to permit non-commercial
adaptations on the condition that they remain under the same license, the
appropriate Creative Commons license would instead be **CC BY-NC-SA 4.0**.

---

## 4. Audio Hero music and sound effects

The music, sound effects and production elements stored under or used from
`public/audio/` originate from **Audio Hero** and were obtained through a
licensed Audio Hero bundle purchase for this project.

These files are **not open-source assets**, are **not public-domain material**
and are **not covered by either the project's MIT License or the artwork's
Creative Commons license**.

Audio Hero retains the applicable copyrights in its music, sound effects and
production elements.

The Audio Hero license grants synchronization rights that allow licensed
tracks to be incorporated into productions including web content, interactive
programs, software applications and computer games. Audio Hero also permits
licensed audio to be modified in length, pitch and/or format as required for
the production.

For bundle purchases, Audio Hero states that the included tracks receive a
permanent, perpetual license and do not require an ongoing subscription.

The applicable Audio Hero End User License Agreement remains controlling:

https://www.audiohero.com/end-user-license-agreement

Audio Hero licensing FAQ:

https://www.audiohero.com/faq

### Restrictions on Audio Hero material

The inclusion of Audio Hero files in Mudanzas Tortuga, S.L. does **not**
transfer ownership of those files to users of this repository and does not
grant a standalone license to extract, reuse, resell, sublicense or
redistribute them as an audio library or asset collection.

Unauthorized resale or redistribution of Audio Hero music and sound effects
outside the licensed synchronized production is prohibited by the Audio Hero
license.

Accordingly:

- the Audio Hero files may be used as synchronized components of this game
  under the project's applicable Audio Hero license;
- recipients of the source code do **not** acquire independent Audio Hero
  rights merely by receiving or cloning this repository;
- anyone wishing to reuse an Audio Hero track outside Mudanzas Tortuga, S.L.
  must obtain the necessary rights from Audio Hero or another authorized
  licensor;
- the original Audio Hero track names, source collections and canonical local
  filenames should remain documented for provenance and license auditing.

The project's detailed audio provenance and implementation mapping is recorded
in:

`/docs/SOUNDS.md`

Nothing in this repository's MIT or Creative Commons notices overrides the
Audio Hero EULA.

---

## 5. Using or redistributing this project

Because this is a mixed-license repository, permission to use one category of
material does not imply permission to use another.

For example:

- you may reuse or modify the original game code under the MIT License;
- that MIT permission does **not** grant commercial or derivative rights to
  the original artwork;
- the artwork may only be reused under CC BY-NC-ND 4.0 unless the artist gives
  separate permission;
- Audio Hero files remain governed by the Audio Hero synchronization license
  and cannot be treated as MIT- or Creative-Commons-licensed assets;
- third-party libraries remain governed by their own upstream licenses.

A developer who wishes to reuse the MIT-licensed code in a project whose
distribution is incompatible with the artwork or audio terms should replace
those assets with material they are independently entitled to use.

---

## 6. Attribution summary

### Original graphical artwork

**Argorias Svartha**  
https://www.artstation.com/argorias  
Licensed, where applicable, under **CC BY-NC-ND 4.0**.

### Audio

Music and sound effects sourced from **Audio Hero** under the applicable
Audio Hero bundle / synchronization license.

Detailed track provenance is maintained in `/docs/SOUNDS.md`.

### Third-party software

Third-party software retains its upstream copyright and license notices,
including PixiJS (MIT) and Rapier (Apache-2.0).

---

## 7. No implied relicensing

If a file carries its own copyright notice, license header or upstream license
file, that specific notice controls for that file.

Nothing in this document should be interpreted as:

- claiming copyright ownership over third-party software or Audio Hero assets;
- relicensing third-party material under MIT or Creative Commons;
- granting rights that the project contributors do not possess;
- removing attribution, notice or other obligations imposed by an upstream
  license.

When in doubt, consult the license attached to the specific dependency or
asset and the authoritative upstream license terms.
