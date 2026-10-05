# MUDANZAS TORTUGA, S.L. — SOUNDS

**Documento:** diseño de sonido + guía de implementación  
**Versión:** Game Jam 2026  
**Stack:** Vite + PixiJS + Rapier2D  
**Plataforma:** navegador  
**Fuente principal:** Audio Hero — *Ultimate Game Audio Bundle*  
**Formato preferido de entrega:** MP3, salvo que una necesidad concreta de edición/loop aconseje conservar WAV como máster.

---

## 1. Objetivo

El sonido debe reforzar la fantasía de **comedia física amable** de *Mudanzas Tortuga, S.L.*:

- Don Tortuga es pesado, lento, constante e imperturbable.
- La carga es vulnerable y produce pequeños desastres legibles.
- Los golpes deben resultar claros y graciosos, no violentos.
- El jugador debe oír que algo importante ha ocurrido sin que cada contacto de Rapier produzca ruido.
- El audio complementa el feedback visual y nunca sustituye el *telegraphing* de las trampas.
- No existen sonidos de daño, dolor, muerte, ahogamiento o sufrimiento.

El objetivo de jam es **pocos sonidos muy reutilizables**, bien escogidos y con reglas claras de disparo.

---

# 2. Estructura de directorios

Los ficheros viven en:

```text
public/
└── audio/
    ├── bgm/
    ├── sfx/
    └── ambient/
```

Vite sirve `public/` desde la raíz, por lo que:

```text
public/audio/sfx/cargo-impact-medium.mp3
```

se carga en runtime como:

```text
/audio/sfx/cargo-impact-medium.mp3
```

**Nunca usar `/public/` en la URL de runtime.**

---

# 3. Convenciones de nombres

- minúsculas;
- ASCII;
- `kebab-case`;
- extensión `.mp3`;
- variantes terminadas en `-01`, `-02`, etc.;
- el nombre describe el **evento de juego**, no el nombre comercial del clip de Audio Hero.

Ejemplo:

```text
Audio Hero original:
"WOOD CRACK ..."

Repositorio:
public/audio/sfx/trap-branch-crack-01.mp3
```

Esto desacopla el código de los nombres internos de la librería.

---

# 4. Prioridades de jam

| Nivel | Significado |
|---|---|
| **P0** | Imprescindible para que la build tenga una capa sonora completa. |
| **P1** | Mucho valor por poco trabajo; añadir si P0 está estable. |
| **P2** | Pulido/post-jam. No retrasar la entrega. |
| **NO** | No merece la pena revisar ese pack para esta jam. |

---

# 5. Triage de los packs del Humble Bundle

## 5.1. P0 — revisar primero

Estos packs deberían cubrir prácticamente toda la versión de jam.

| Pack del bundle | Prioridad | Qué buscamos |
|---|---:|---|
| **Crash, Smash, Break!** | **P0** | golpes de muebles, madera, objetos domésticos, roturas, caídas, impactos duros |
| **Water** | **P0** | entrada/salida del agua, salpicaduras, nado, slosh, corriente/agua ambiental |
| **Celebrations & Cartoons** | **P0** | pops, boings, golpes cartoon, pequeños stings, feedback cómico |
| **Household** | **P0** | cristal, platos, cajas, muebles y objetos domésticos con timbres específicos |
| **Dynamic Swishes** | **P0** | objetos cayendo, piña descendiendo, desplazamientos rápidos, pequeños whooshes |
| **Button Masters** | **P0** | mover selección, confirmar, cancelar, notificaciones |
| **UI Shaping** | **P0** | alternativa/segunda familia para UI, alertas y feedback corto |
| **Children & Play** | **P0** | sonidos suaves, juguetones y apropiados para público infantil |

### Orden recomendado de escucha

```text
1. Crash, Smash, Break!
2. Water
3. Celebrations & Cartoons
4. Household
5. Button Masters
6. UI Shaping
7. Dynamic Swishes
8. Children & Play
```

Con una buena selección de estos ocho packs debería ser posible cerrar **todo el P0** sin explorar nada más.

---

## 5.2. P1 — segunda pasada

| Pack del bundle | Prioridad | Uso potencial |
|---|---:|---|
| **Wacky World** | P1 | acentos cartoon más exagerados, resultado de run, objeto perdido |
| **Essential Creator Toolkit** | P1 | transiciones, stings y elementos generales que falten |
| **Sonic Crafting** | P1 | capas abstractas o *sweeteners* para diseñar sonidos compuestos |
| **Celebration & Festivity** | P1 | banderines, récord o feedback positivo si `Celebrations & Cartoons` no basta |
| **Animals: Flock of Birds** | P1 | ambiente ligero de bosque |
| **Weather Wounds** | P1 | viento/ambiente exterior muy sutil |
| **Africa & Jungles** | P1 | fondo natural; usar solo elementos que suenen compatibles con nuestro bosque |
| **Mechanical** | P1 | solo si encontramos una capa útil para la trampilla/tocón |
| **Industrial & Mechanical** | P1 | alternativa para mecanismos; probablemente demasiado industrial |
| **Underground & Caves** | P1/P2 | futura gruta o ruta profunda; poco importante para la jam |
| **Animals: Small Mammals** | P1/P2 | pequeños detalles de fauna; no necesarios para gameplay |

---

## 5.3. P2 — curiosidad / post-jam

| Pack | Motivo |
|---|---|
| **Animals: Reptiles** | Puede ser divertido inspeccionarlo, pero contiene principalmente ranas, serpientes, cocodrilos, etc. Don Tortuga no necesita vocalizaciones. |
| **Cozy & Safe** | Puede aportar textura ambiental, pero la BGM ya cubre gran parte del tono. |
| **Musical Elements** | Útil para stings si faltan, pero no prioritario. |
| **On The Road** | El juego es una mudanza, pero no queremos que Don Tortuga suene como un vehículo. |
| **Transportation & Motion** | Igual: solo buscar aquí si necesitamos una textura concreta de movimiento. |
| **The Director's Audiences** | Aplausos/reacciones podrían servir para resultados futuros; no necesarios. |
| **Classic Console** | El juego no tiene una dirección retro/8-bit. Evitar mezclar estilos salvo decisión artística consciente. |

---

## 5.4. NO — ignorar durante la jam

No invertir tiempo en estos packs salvo que aparezca una necesidad nueva muy concreta:

```text
Explosions Zone
Fight Club
Conflict & Battle
Cyber Warfare
Natural Disasters
Vulcanoes
Dolby Atmos Vol 1
Dolby Atmos Vol 2
Glitch Dominion
Space Oddyssey
Sci-fi / espacio / horror / guerra
Voice Packs: Adult Female
Voice Packs: Adult Male
Voice Packs: Children
Voice Packs: Teenagers
```

Las voces grabadas tampoco encajan bien con un juego en castellano si no existe un diseño explícito de doblaje.

---

# 6. BGM seleccionada

## 6.1. Rutas definitivas

| Pantalla / modo | Pista | Archivo | Ruta runtime |
|---|---|---|---|
| Portada y menús | **Fixing the Farmer's Car** | `fixing-the-farmers-car.mp3` | `/audio/bgm/fixing-the-farmers-car.mp3` |
| Laboratorio de físicas | **Patio Party** | `patio-party.mp3` | `/audio/bgm/patio-party.mp3` |
| Créditos | **Patio Party** | `patio-party.mp3` | `/audio/bgm/patio-party.mp3` |
| Carrera Infinita | **Just Kidding** | `just-kidding.mp3` | `/audio/bgm/just-kidding.mp3` |

Archivos:

```text
public/audio/bgm/fixing-the-farmers-car.mp3
public/audio/bgm/patio-party.mp3
public/audio/bgm/just-kidding.mp3
```

## 6.2. Reglas BGM

- La música solo debe iniciarse después de una interacción válida del usuario si el navegador todavía no ha desbloqueado audio.
- `Fixing the Farmer's Car` continúa entre las pantallas de menú para evitar reinicios constantes.
- Al entrar en Carrera Infinita:
  - fade out del menú: ~300 ms;
  - cambiar a `Just Kidding`;
  - fade in: ~300 ms.
- En pausa:
  - mantener posición;
  - reducir volumen aproximadamente un 30–40 %.
- Al reanudar:
  - restaurar volumen suavemente.
- Laboratorio y créditos utilizan `Patio Party`.
- Al volver a portada desde resultados/créditos/laboratorio, restaurar `Fixing the Farmer's Car`.

---

# 7. SFX — interfaz

## 7.1. P0

### `ui-move.mp3`

```text
public/audio/sfx/ui-move.mp3
/audio/sfx/ui-move.mp3
```

**Evento:** cambiar realmente la opción seleccionada.

**Buscar primero en:**

1. `Button Masters`
2. `UI Shaping`
3. `Children & Play`

**Perfil:** click/pop de 30–120 ms, agradable y poco tonal.

---

### `ui-confirm.mp3`

```text
public/audio/sfx/ui-confirm.mp3
/audio/sfx/ui-confirm.mp3
```

**Evento:** Enter/click sobre una opción válida.

**Buscar:**

1. `Button Masters`
2. `UI Shaping`
3. `Celebrations & Cartoons`

**Perfil:** corto, claramente positivo, sin sonar futurista.

---

### `ui-back.mp3`

```text
public/audio/sfx/ui-back.mp3
/audio/sfx/ui-back.mp3
```

**Evento:** Esc / volver atrás.

**Buscar:**

1. `Button Masters`
2. `UI Shaping`

**Perfil:** más apagado/descendente que `ui-confirm`.

---

### `ui-disabled.mp3`

```text
public/audio/sfx/ui-disabled.mp3
/audio/sfx/ui-disabled.mp3
```

**Evento:** intentar activar `Nivel personalizado — Próximamente` u otra acción deshabilitada.

**Buscar:**

1. `Celebrations & Cartoons`
2. `Children & Play`
3. `Button Masters`

**Perfil:** pequeño “nope”, *bonk* o pop amable. Nunca buzzer agresivo.

---

### `ui-notification.mp3`

```text
public/audio/sfx/ui-notification.mp3
/audio/sfx/ui-notification.mp3
```

**Evento:** mensaje de texto del cliente.

**Buscar:**

1. `Button Masters`
2. `UI Shaping`
3. `Essential Creator Toolkit`

---

### `ui-call.mp3`

```text
public/audio/sfx/ui-call.mp3
/audio/sfx/ui-call.mp3
```

**Evento:** aparición de llamada del cliente.

**Buscar:**

1. `Household`
2. `Essential Creator Toolkit`
3. `Button Masters`

**Perfil:** 1–2 timbres breves. No reproducir un ringtone largo.

---

## 7.2. P1

### `ui-help-pop.mp3`

```text
public/audio/sfx/ui-help-pop.mp3
```

Al aparecer una ayuda contextual.

**Pack:** `Children & Play` → `Celebrations & Cartoons`.

### `ui-pause-open.mp3`

```text
public/audio/sfx/ui-pause-open.mp3
```

Puede reutilizar `ui-confirm` si no encontramos algo claramente mejor.

### `results-stamp.mp3`

```text
public/audio/sfx/results-stamp.mp3
```

Golpe de sello/papel para resultados.

**Pack:** `Household`.

---

# 8. SFX — Don Tortuga y movimiento

## 8.1. Salto

### `jump-charge.mp3` — P0

```text
public/audio/sfx/jump-charge.mp3
```

**Evento:** comenzar a mantener Espacio estando apoyado.

**Buscar:**

1. `Celebrations & Cartoons`
2. `Children & Play`
3. `Sonic Crafting`

**Perfil:** pequeño sonido de tensión/preparación, no un loop.

La animación/postura sigue comunicando la carga; el audio solo la refuerza.

---

### `jump-release.mp3` — P0

```text
public/audio/sfx/jump-release.mp3
```

**Evento:** soltar Espacio y despegar.

**Buscar:**

1. `Celebrations & Cartoons`
2. `Dynamic Swishes`
3. `Children & Play`

**Perfil:** impulso blando/cartoon. No “rocket”, no sonido de combate.

---

## 8.2. Aterrizaje

### `landing-soft.mp3` — P0

```text
public/audio/sfx/landing-soft.mp3
```

**Buscar:**

1. `Crash, Smash, Break!`
2. `Household`
3. `Children & Play`

Sonido pesado pero acolchado.

### `landing-hard.mp3` — P0

```text
public/audio/sfx/landing-hard.mp3
```

**Buscar:**

1. `Crash, Smash, Break!`
2. `Household`

Debe comunicar **energía transferida a la carga**, no dolor.

### Regla

Usar velocidad/impulso vertical para seleccionar:

```text
impact < softThreshold        -> nada o landing-soft a volumen bajo
softThreshold..hardThreshold  -> landing-soft
impact >= hardThreshold       -> landing-hard
```

Cooldown recomendado:

```text
~120–200 ms
```

para evitar múltiples disparos por rebotes de Rapier.

---

# 9. AMBIENT — contacto con biomas

Estos sonidos representan el desplazamiento de Don Tortuga sobre el terreno.

**No conviene usar un loop MP3 continuo para cada material.**

Para esta jam es preferible disparar **one-shots cortos alternados** según avance/distancia recorrida. Así:

- evitamos seams de MP3;
- variamos naturalmente la textura;
- podemos cambiar de bioma de inmediato;
- el sonido puede acelerar o espaciarse con la velocidad.

## 9.1. Hierba — P0

```text
public/audio/ambient/grass-step-01.mp3
public/audio/ambient/grass-step-02.mp3
```

Runtime:

```text
/audio/ambient/grass-step-01.mp3
/audio/ambient/grass-step-02.mp3
```

**Buscar:**

1. `Children & Play`
2. `Africa & Jungles`
3. `Household`
4. si no aparece una pisada útil, utilizar los cupones/buscador general de Audio Hero con `grass footsteps`, `grass movement`, `rustle grass`.

**Perfil:** roce vegetal suave. Don Tortuga es pesado pero lento.

---

## 9.2. Roca — P0

```text
public/audio/ambient/rock-step-01.mp3
public/audio/ambient/rock-step-02.mp3
```

**Buscar:**

1. `Crash, Smash, Break!`
2. `Household`
3. búsqueda general: `stone footsteps`, `rock step`, `stone scrape`.

**Perfil:** toque seco, corto, sin parecer un martillazo.

---

## 9.3. Arena — P0 si el bioma está en la build de jam

```text
public/audio/ambient/sand-step-01.mp3
public/audio/ambient/sand-step-02.mp3
```

**Buscar:**

1. `Africa & Jungles`
2. `Household`
3. búsqueda general: `sand footsteps`, `sand movement`, `sand scrape`.

**Perfil:** crujido/blando, con menos ataque que roca.

---

## 9.4. Agua / nado — P0 si el agua está en la build

```text
public/audio/ambient/swim-01.mp3
public/audio/ambient/swim-02.mp3
```

**Pack principal:** `Water`.

**Perfil:** slosh pequeño, nunca sonido de alguien ahogándose.

Se puede disparar por distancia/ritmo de natación, alternando variantes.

---

# 10. SFX — agua

## 10.1. Entrada

### `water-entry-small.mp3` — P0

```text
public/audio/sfx/water-entry-small.mp3
```

Entrada suave o desde poca altura.

### `water-entry-large.mp3` — P0

```text
public/audio/sfx/water-entry-large.mp3
```

Entrada con salto/caída importante.

**Pack:** `Water`.

Elegir variante según velocidad vertical al cruzar la superficie.

---

## 10.2. Salida

### `water-exit.mp3` — P0

```text
public/audio/sfx/water-exit.mp3
```

**Pack:** `Water`.

Splash más corto y ligero que `water-entry-large`.

---

## 10.3. Corriente profunda — P1

```text
public/audio/ambient/water-current.mp3
```

**Pack:** `Water`.

Solo si existe una zona profunda/corriente claramente perceptible en la build.

El volumen puede crecer suavemente con la profundidad.

---

## 10.4. Ambiente acuático — P2

```text
public/audio/ambient/water-bed.mp3
```

Pack candidato:

1. `Water`
2. `Underground & Caves`

No es necesario si `Just Kidding` + SFX ya llenan suficientemente la mezcla.

---

# 11. SFX — carga y objetos

Este es el sistema sonoro más importante después del agua.

**No reproducir un SFX por cada manifold/contacto físico.**

El audio debe representar **eventos perceptibles**, no el solver de Rapier.

---

## 11.1. Impactos genéricos

### `cargo-impact-light-01.mp3`
### `cargo-impact-light-02.mp3`

```text
public/audio/sfx/cargo-impact-light-01.mp3
public/audio/sfx/cargo-impact-light-02.mp3
```

Pequeños bamboleos/contactos.

**Pack:**

1. `Household`
2. `Crash, Smash, Break!`

---

### `cargo-impact-medium-01.mp3`
### `cargo-impact-medium-02.mp3`

```text
public/audio/sfx/cargo-impact-medium-01.mp3
public/audio/sfx/cargo-impact-medium-02.mp3
```

Choque claramente visible que todavía no implica desastre.

**Pack principal:** `Crash, Smash, Break!`.

---

### `cargo-impact-heavy-01.mp3`
### `cargo-impact-heavy-02.mp3`

```text
public/audio/sfx/cargo-impact-heavy-01.mp3
public/audio/sfx/cargo-impact-heavy-02.mp3
```

Golpe severo o reacción en cadena.

**Pack:**

1. `Crash, Smash, Break!`
2. `Household`

---

## 11.2. Regla de mezcla de impactos

Agrupar colisiones dentro de una ventana aproximada:

```text
80–150 ms
```

y reproducir **un único sonido representativo del impacto más fuerte**.

Ejemplo:

```text
3 objetos chocan casi simultáneamente
→ medir mayor impulso
→ reproducir cargo-impact-medium-02
→ no tres sonidos superpuestos
```

Esto es fundamental para que una pila de muebles no se convierta en ruido blanco.

---

# 12. SFX — materiales especiales de objetos

P1: añadir únicamente si el objeto está realmente presente en la configuración inicial.

## Cristal / vaso

```text
public/audio/sfx/object-glass-hit.mp3
public/audio/sfx/object-glass-break.mp3
```

**Packs:**

1. `Crash, Smash, Break!`
2. `Household`

`object-glass-break` solo debe sonar si la presentación visual implica rotura.  
Si el vaso simplemente se cae y desaparece de la carga, basta con `object-glass-hit` + `cargo-lost`.

---

## Madera / muebles

```text
public/audio/sfx/object-wood-hit.mp3
```

**Pack:** `Crash, Smash, Break!`.

---

## Metal

```text
public/audio/sfx/object-metal-hit.mp3
```

**Pack:** `Crash, Smash, Break!` → `Household`.

Solo si hay un objeto metálico identificable.

---

# 13. SFX — pérdida de objetos

La pérdida definitiva es más importante que un simple choque y necesita firma sonora propia.

## `cargo-lost.mp3` — P0

```text
public/audio/sfx/cargo-lost.mp3
/audio/sfx/cargo-lost.mp3
```

**Evento:** un objeto pasa definitivamente a `Perdido`.

**Buscar:**

1. `Celebrations & Cartoons`
2. `Wacky World`
3. `Children & Play`

**Perfil:** pequeño descenso, plop o sting cómico. No sonido de “game over”.

### Regla

Si se pierden varios objetos dentro del intervalo de agrupación del accidente:

```text
→ reproducir cargo-lost una sola vez
→ lanzar una sola llamada/mensaje
```

coherente con la agrupación de avisos del GDD.

---

## `cargo-last-object-lost.mp3` — P1

```text
public/audio/sfx/cargo-last-object-lost.mp3
```

Marca el final de Carrera Infinita.

**Buscar:**

1. `Celebrations & Cartoons`
2. `Wacky World`
3. `Musical Elements`

Debe ser gracioso y ligeramente resignado, no dramático.

Si no encontramos uno perfecto, reutilizar `cargo-lost.mp3` y dejar que la transición visual comunique el final.

---

# 14. SFX — banderines y puntuación

## `checkpoint-flag.mp3` — P0

```text
public/audio/sfx/checkpoint-flag.mp3
```

**Evento:** Don Tortuga cruza un conector y se despliega el banderín.

**Buscar:**

1. `Celebrations & Cartoons`
2. `Celebration & Festivity`
3. `Children & Play`
4. `Essential Creator Toolkit`

**Perfil:** micro-celebración de menos de ~0,7 s.

No usar fanfarria larga: los banderines aparecen constantemente.

---

## `score-pop.mp3` — P1

```text
public/audio/sfx/score-pop.mp3
```

Pequeño acento al actualizar la puntuación.

Puede omitirse si `checkpoint-flag` ya comunica el evento.

---

# 15. SFX — trampas de la jam

Las trampas nunca dependen exclusivamente del sonido para ser anticipadas.  
El audio es una capa adicional de lectura y comedia.

---

## 15.1. Rama resquebrajada

### `trap-branch-creak.mp3` — P0

```text
public/audio/sfx/trap-branch-creak.mp3
```

**Uso:** deformación/aviso inmediato al activarse.

**Buscar:**

1. `Crash, Smash, Break!`
2. `Household`

**Perfil:** madera crujiendo, reconocible.

### `trap-branch-break.mp3` — P0

```text
public/audio/sfx/trap-branch-break.mp3
```

**Uso:** momento en que se retira el apoyo.

**Pack:** `Crash, Smash, Break!`.

---

## 15.2. Trampilla + tocón elevador

### `trap-stump-trigger.mp3` — P0

```text
public/audio/sfx/trap-stump-trigger.mp3
```

**Buscar:**

1. `Household`
2. `Mechanical`
3. `Sonic Crafting`

**Perfil:** click/thunk de activación; evitar maquinaria industrial evidente.

### `trap-stump-rise.mp3` — P1

```text
public/audio/sfx/trap-stump-rise.mp3
```

**Buscar:**

1. `Dynamic Swishes`
2. `Crash, Smash, Break!`
3. `Mechanical`

Puede omitirse y dejar solo activación + impacto.

### `trap-stump-hit.mp3` — P0

```text
public/audio/sfx/trap-stump-hit.mp3
```

**Pack:** `Crash, Smash, Break!`.

Golpe de madera grave/redondo.

---

## 15.3. Árbol + piña

### `trap-pinecone-rustle.mp3` — P0

```text
public/audio/sfx/trap-pinecone-rustle.mp3
```

**Uso:** aviso inmediatamente previo a la caída.

**Buscar:**

1. `Africa & Jungles`
2. `Children & Play`
3. `Household`

Puede ser hojas/ramas moviéndose.

### `trap-pinecone-fall.mp3` — P0

```text
public/audio/sfx/trap-pinecone-fall.mp3
```

**Pack principal:** `Dynamic Swishes`.

Whoosh corto, suave y fácilmente localizable.

### `trap-pinecone-hit.mp3` — P0

```text
public/audio/sfx/trap-pinecone-hit.mp3
```

**Buscar:**

1. `Crash, Smash, Break!`
2. `Celebrations & Cartoons`

Puede inclinarse ligeramente hacia un *bonk* cartoon siempre que conserve sensación de peso.

---

# 16. Ambiente general de bosque

## `forest-birds.mp3` — P1

```text
public/audio/ambient/forest-birds.mp3
```

**Pack:** `Animals: Flock of Birds`.

Volumen muy bajo.

La BGM debe seguir siendo dominante.

---

## `forest-air.mp3` — P2

```text
public/audio/ambient/forest-air.mp3
```

**Pack:**

1. `Weather Wounds`
2. `Africa & Jungles`

Usar únicamente si aporta profundidad sin ensuciar la mezcla.

No necesitamos un paisaje sonoro realista: el fondo es estilizado/cartoon.

---

# 17. Pack `Animals: Reptiles`

**Prioridad: P2 / curiosidad.**

Aunque temáticamente sea irresistible por Don Tortuga, el pack contiene principalmente grabaciones de:

- ranas;
- serpientes;
- cocodrilos/caimanes;
- anfibios;
- siseos y croares.

No asignar automáticamente ningún sonido a Don Tortuga.

**Regla de personaje:**

> Don Tortuga no necesita “hacer ruido de tortuga”.

Su personalidad se expresa mediante animación, peso, controles y constancia.

Solo usar un clip de `Animals: Reptiles` si aparece una oportunidad genuinamente graciosa y coherente después de escucharlo.

---

# 18. Qué descargar de cada pack

La búsqueda inicial debe ser deliberadamente pequeña.

## `Crash, Smash, Break!`

Descargar candidatos para:

```text
2 × impacto ligero
2 × impacto medio
2 × impacto fuerte
1 × madera crujiendo
1 × madera rompiéndose
1 × cristal
1 × golpe de madera
```

Máximo inicial recomendado: **10 clips**.

---

## `Water`

```text
1 × entrada pequeña
1 × entrada grande
1 × salida
2 × slosh/nado
1 × corriente opcional
```

Máximo: **6 clips**.

---

## `Celebrations & Cartoons`

```text
1 × cargo-lost
1 × checkpoint
1 × ui-disabled
1 × jump-charge
1 × jump-release
1 × bonk opcional
1 × sting de fin opcional
```

Máximo: **7 clips**.

---

## `Household`

Buscar:

```text
1 × teléfono/ringtone
1 × golpe doméstico suave
1 × cristal
1 × madera
1 × papel/sello opcional
1–2 × foley que encajen con objetos concretos
```

Máximo: **7 clips**.

---

## `Button Masters` + `UI Shaping`

Entre ambos necesitamos únicamente:

```text
1 × move
1 × confirm
1 × back
1 × notification
```

Máximo combinado recomendado: **6–8 candidatos**, de los que conservaremos 4.

`UI Shaping` contiene tonos, beeps, swells y button clicks; preferir los sonidos menos sci-fi para mantener la identidad de pequeño negocio del bosque.

---

## `Dynamic Swishes`

```text
1 × pinecone fall
1 × movement/fall alternative
```

Máximo: **3 clips**.

---

## `Children & Play`

Buscar alternativas suaves para:

```text
ui-help
jump
cargo-lost
checkpoint
```

Máximo: **4 candidatos**.

---

# 19. Inventario P0 propuesto

Si queremos terminar rápido, el objetivo mínimo es este:

## BGM — 3 archivos

```text
/audio/bgm/fixing-the-farmers-car.mp3
/audio/bgm/patio-party.mp3
/audio/bgm/just-kidding.mp3
```

## UI — 6 archivos

```text
/audio/sfx/ui-move.mp3
/audio/sfx/ui-confirm.mp3
/audio/sfx/ui-back.mp3
/audio/sfx/ui-disabled.mp3
/audio/sfx/ui-notification.mp3
/audio/sfx/ui-call.mp3
```

## Tortuga — 4 archivos

```text
/audio/sfx/jump-charge.mp3
/audio/sfx/jump-release.mp3
/audio/sfx/landing-soft.mp3
/audio/sfx/landing-hard.mp3
```

## Carga — 7 archivos

```text
/audio/sfx/cargo-impact-light-01.mp3
/audio/sfx/cargo-impact-light-02.mp3
/audio/sfx/cargo-impact-medium-01.mp3
/audio/sfx/cargo-impact-medium-02.mp3
/audio/sfx/cargo-impact-heavy-01.mp3
/audio/sfx/cargo-impact-heavy-02.mp3
/audio/sfx/cargo-lost.mp3
```

## Banderín — 1 archivo

```text
/audio/sfx/checkpoint-flag.mp3
```

## Trampas — 8 archivos

```text
/audio/sfx/trap-branch-creak.mp3
/audio/sfx/trap-branch-break.mp3
/audio/sfx/trap-stump-trigger.mp3
/audio/sfx/trap-stump-hit.mp3
/audio/sfx/trap-pinecone-rustle.mp3
/audio/sfx/trap-pinecone-fall.mp3
/audio/sfx/trap-pinecone-hit.mp3
```

`trap-stump-rise.mp3` queda P1.

## Agua — 3 archivos + movimiento

```text
/audio/sfx/water-entry-small.mp3
/audio/sfx/water-entry-large.mp3
/audio/sfx/water-exit.mp3
/audio/ambient/swim-01.mp3
/audio/ambient/swim-02.mp3
```

## Superficies — 6 archivos

```text
/audio/ambient/grass-step-01.mp3
/audio/ambient/grass-step-02.mp3
/audio/ambient/rock-step-01.mp3
/audio/ambient/rock-step-02.mp3
/audio/ambient/sand-step-01.mp3
/audio/ambient/sand-step-02.mp3
```

Si arena/agua no forman parte finalmente del subconjunto de biomas de la jam, sus sonidos dejan de ser P0.

---

# 20. Audio manifest recomendado

Codex debería centralizar las rutas. Evitar strings repartidos por todo el proyecto.

Ejemplo conceptual:

```ts
export const AUDIO = {
  bgm: {
    menu: "/audio/bgm/fixing-the-farmers-car.mp3",
    physicsLab: "/audio/bgm/patio-party.mp3",
    credits: "/audio/bgm/patio-party.mp3",
    endless: "/audio/bgm/just-kidding.mp3",
  },

  ui: {
    move: "/audio/sfx/ui-move.mp3",
    confirm: "/audio/sfx/ui-confirm.mp3",
    back: "/audio/sfx/ui-back.mp3",
    disabled: "/audio/sfx/ui-disabled.mp3",
    notification: "/audio/sfx/ui-notification.mp3",
    call: "/audio/sfx/ui-call.mp3",
  },

  turtle: {
    jumpCharge: "/audio/sfx/jump-charge.mp3",
    jumpRelease: "/audio/sfx/jump-release.mp3",
    landingSoft: "/audio/sfx/landing-soft.mp3",
    landingHard: "/audio/sfx/landing-hard.mp3",
  },

  cargo: {
    impactLight: [
      "/audio/sfx/cargo-impact-light-01.mp3",
      "/audio/sfx/cargo-impact-light-02.mp3",
    ],
    impactMedium: [
      "/audio/sfx/cargo-impact-medium-01.mp3",
      "/audio/sfx/cargo-impact-medium-02.mp3",
    ],
    impactHeavy: [
      "/audio/sfx/cargo-impact-heavy-01.mp3",
      "/audio/sfx/cargo-impact-heavy-02.mp3",
    ],
    lost: "/audio/sfx/cargo-lost.mp3",
  },

  water: {
    entrySmall: "/audio/sfx/water-entry-small.mp3",
    entryLarge: "/audio/sfx/water-entry-large.mp3",
    exit: "/audio/sfx/water-exit.mp3",
    swim: [
      "/audio/ambient/swim-01.mp3",
      "/audio/ambient/swim-02.mp3",
    ],
  },

  surfaces: {
    grass: [
      "/audio/ambient/grass-step-01.mp3",
      "/audio/ambient/grass-step-02.mp3",
    ],
    rock: [
      "/audio/ambient/rock-step-01.mp3",
      "/audio/ambient/rock-step-02.mp3",
    ],
    sand: [
      "/audio/ambient/sand-step-01.mp3",
      "/audio/ambient/sand-step-02.mp3",
    ],
  },

  hazards: {
    branchCreak: "/audio/sfx/trap-branch-creak.mp3",
    branchBreak: "/audio/sfx/trap-branch-break.mp3",
    stumpTrigger: "/audio/sfx/trap-stump-trigger.mp3",
    stumpHit: "/audio/sfx/trap-stump-hit.mp3",
    pineconeRustle: "/audio/sfx/trap-pinecone-rustle.mp3",
    pineconeFall: "/audio/sfx/trap-pinecone-fall.mp3",
    pineconeHit: "/audio/sfx/trap-pinecone-hit.mp3",
  },

  scoring: {
    checkpoint: "/audio/sfx/checkpoint-flag.mp3",
  },
} as const;
```

El nombre del módulo puede adaptarse a la arquitectura vigente (`audio.ts`, `assets.ts`, `soundManifest.ts`, etc.).

---

# 21. Reglas de implementación para Codex

## 21.1. Desbloqueo de audio

Los navegadores pueden impedir reproducción automática.

El primer:

```text
click
Enter
Space
tecla de navegación válida
```

que corresponda a interacción del usuario puede utilizarse para desbloquear/inicializar el sistema de audio.

No asumir que la BGM puede sonar antes de la primera interacción.

---

## 21.2. Categorías de volumen

Mantener al menos:

```text
masterVolume
musicVolume
sfxVolume
ambientVolume
```

Valores iniciales orientativos:

```text
master  = 1.00
music   = 0.45
sfx     = 0.80
ambient = 0.35
```

Son puntos de partida, no valores de diseño cerrados.

---

## 21.3. No sonificar cada contacto de Rapier

Un evento `collision` no equivale automáticamente a un sonido.

Implementar:

- threshold mínimo de impulso;
- agrupación temporal;
- cooldown;
- selección por intensidad;
- máximo razonable de voces simultáneas.

Especialmente importante para la torre de objetos.

---

## 21.4. Variantes

Para eventos repetitivos usar selección aleatoria entre variantes:

```text
grass-step-01 / 02
rock-step-01 / 02
sand-step-01 / 02
swim-01 / 02
cargo-impact-*-01 / 02
```

Evitar repetir inmediatamente la misma variante cuando haya dos o más disponibles.

---

## 21.5. Pitch y volumen

P1, no necesario para el primer pase.

Se puede aplicar una variación muy pequeña:

```text
pitch/playbackRate ≈ 0.96–1.04
volume ± pequeño margen
```

para reducir repetición mecánica.

No deformar las muestras hasta convertirlas en un efecto distinto.

---

## 21.6. Prioridades de mezcla

Orden conceptual:

```text
UI crítica / pérdida
>
trampas e impactos importantes
>
movimiento
>
ambiente
>
BGM
```

La música nunca debe ocultar:

- una rama rompiéndose;
- una piña cayendo;
- un objeto perdido;
- un banderín;
- una notificación de cliente.

---

## 21.7. Pausa

Al abrir pausa:

- congelar lógica que genera nuevos sonidos de gameplay;
- reducir BGM;
- detener/evitar nuevos sonidos de movimiento/ambiente;
- permitir SFX de UI.

Al continuar:

- no reproducir sonidos acumulados durante la pausa;
- restablecer ambiente según el estado actual;
- restaurar BGM suavemente.

---

## 21.8. Cambio de bioma

Los sonidos de superficie dependen del material actualmente soportando a Don Tortuga.

No utilizar el bioma del módulo como aproximación si el módulo contiene varios materiales.

---

## 21.9. Separación temporal vs. pérdida

No reproducir `cargo-lost.mp3` cuando un objeto entra en `SeparacionTemporal`.

Solo al confirmarse:

```text
SeparacionTemporal -> Perdido
```

Esto preserva la incertidumbre visual del bamboleo y evita feedback falso.

---

# 22. Flujo de implementación recomendado

## Paso 1 — BGM + UI

Implementar:

```text
3 BGM
ui-move
ui-confirm
ui-back
ui-disabled
```

Con esto se valida el sistema de audio y autoplay.

## Paso 2 — física fundamental

Añadir:

```text
jump-charge
jump-release
landing-soft
landing-hard
cargo-impact light/medium/heavy
cargo-lost
```

## Paso 3 — biomas

Añadir únicamente los que estén en la build final de jam:

```text
grass-step
rock-step
sand-step
water-entry
water-exit
swim
```

## Paso 4 — trampas

Añadir los sonidos asociados a:

```text
rama
tocón
piña
```

## Paso 5 — presentación

Añadir:

```text
checkpoint-flag
ui-notification
ui-call
forest-birds
results-stamp
otros P1
```

---

# 23. Checklist de selección manual en Audio Hero

Cuando se escuche un candidato, comprobar:

- [ ] ¿Se entiende en menos de un segundo?
- [ ] ¿Encaja con una estética cartoon infantil?
- [ ] ¿Tiene demasiado reverb incorporado?
- [ ] ¿Tiene una cola demasiado larga?
- [ ] ¿Suena excesivamente cinematográfico?
- [ ] ¿Suena violento?
- [ ] ¿Tiene ruido de fondo innecesario?
- [ ] ¿Se distingue de otros sonidos del mismo sistema?
- [ ] ¿Sigue funcionando a volumen bajo?
- [ ] ¿Podría repetirse muchas veces sin resultar irritante?
- [ ] ¿El MP3 proporcionado suena suficientemente limpio?
- [ ] ¿Necesitamos realmente este sonido o ya cubrimos el evento con otro?

---

# 24. Criterio de poda

Si dos sonidos cumplen la misma función, conservar el más:

1. corto;
2. legible;
3. amable;
4. menos cinematográfico;
5. menos irritante al repetirse;
6. pequeño en bytes, si la diferencia sonora es mínima.

**La jam no necesita demostrar cuántos sonidos hemos comprado.**

Necesita demostrar que cada sonido elegido mejora el juego.

---

# 25. Nota de licencia y repositorio

Los ficheros de Audio Hero:

- conservan el copyright de sus titulares;
- se utilizan bajo la licencia de Audio Hero asociada al bundle;
- no deben declararse bajo la misma licencia open-source que el código;
- deben quedar identificados en la documentación/licencia de terceros del proyecto.

Conservar fuera del flujo normal del repositorio:

```text
- recibo/orden de Humble Bundle
- copia del EULA vigente
- relación de assets de Audio Hero utilizados
- nombre original del archivo descargado
- nombre local asignado en el juego
- pack de procedencia
```

Ejemplo de inventario privado:

```text
source-pack: Crash, Smash, Break!
original-file: <nombre original>
local-file: cargo-impact-heavy-01.mp3
runtime-path: /audio/sfx/cargo-impact-heavy-01.mp3
use: impacto fuerte de la carga
```

---

# 26. Tabla maestra de assets

| Ruta runtime | Evento | Pack recomendado | Prioridad |
|---|---|---|---:|
| `/audio/bgm/fixing-the-farmers-car.mp3` | menú | pista seleccionada | P0 |
| `/audio/bgm/patio-party.mp3` | laboratorio/créditos | pista seleccionada | P0 |
| `/audio/bgm/just-kidding.mp3` | Carrera Infinita | pista seleccionada | P0 |
| `/audio/sfx/ui-move.mp3` | mover selección | Button Masters | P0 |
| `/audio/sfx/ui-confirm.mp3` | confirmar | Button Masters / UI Shaping | P0 |
| `/audio/sfx/ui-back.mp3` | volver | Button Masters / UI Shaping | P0 |
| `/audio/sfx/ui-disabled.mp3` | opción bloqueada | Celebrations & Cartoons | P0 |
| `/audio/sfx/ui-notification.mp3` | mensaje cliente | Button Masters / UI Shaping | P0 |
| `/audio/sfx/ui-call.mp3` | llamada cliente | Household | P0 |
| `/audio/sfx/jump-charge.mp3` | iniciar carga | Celebrations & Cartoons | P0 |
| `/audio/sfx/jump-release.mp3` | salto | Celebrations & Cartoons / Dynamic Swishes | P0 |
| `/audio/sfx/landing-soft.mp3` | aterrizaje suave | Crash, Smash, Break! | P0 |
| `/audio/sfx/landing-hard.mp3` | aterrizaje fuerte | Crash, Smash, Break! | P0 |
| `/audio/sfx/cargo-impact-light-01.mp3` | impacto leve | Household | P0 |
| `/audio/sfx/cargo-impact-light-02.mp3` | impacto leve | Household | P0 |
| `/audio/sfx/cargo-impact-medium-01.mp3` | impacto medio | Crash, Smash, Break! | P0 |
| `/audio/sfx/cargo-impact-medium-02.mp3` | impacto medio | Crash, Smash, Break! | P0 |
| `/audio/sfx/cargo-impact-heavy-01.mp3` | impacto fuerte | Crash, Smash, Break! | P0 |
| `/audio/sfx/cargo-impact-heavy-02.mp3` | impacto fuerte | Crash, Smash, Break! | P0 |
| `/audio/sfx/cargo-lost.mp3` | pérdida definitiva | Celebrations & Cartoons / Wacky World | P0 |
| `/audio/sfx/checkpoint-flag.mp3` | banderín | Celebrations & Cartoons | P0 |
| `/audio/sfx/water-entry-small.mp3` | entrada suave en agua | Water | P0* |
| `/audio/sfx/water-entry-large.mp3` | entrada fuerte en agua | Water | P0* |
| `/audio/sfx/water-exit.mp3` | salir del agua | Water | P0* |
| `/audio/ambient/swim-01.mp3` | nado | Water | P0* |
| `/audio/ambient/swim-02.mp3` | nado | Water | P0* |
| `/audio/ambient/grass-step-01.mp3` | hierba | foley / búsqueda bundle | P0* |
| `/audio/ambient/grass-step-02.mp3` | hierba | foley / búsqueda bundle | P0* |
| `/audio/ambient/rock-step-01.mp3` | roca | Crash / Household | P0* |
| `/audio/ambient/rock-step-02.mp3` | roca | Crash / Household | P0* |
| `/audio/ambient/sand-step-01.mp3` | arena | foley / búsqueda bundle | P0* |
| `/audio/ambient/sand-step-02.mp3` | arena | foley / búsqueda bundle | P0* |
| `/audio/sfx/trap-branch-creak.mp3` | rama avisa | Crash, Smash, Break! | P0 |
| `/audio/sfx/trap-branch-break.mp3` | rama rompe | Crash, Smash, Break! | P0 |
| `/audio/sfx/trap-stump-trigger.mp3` | tocón se activa | Household / Mechanical | P0 |
| `/audio/sfx/trap-stump-hit.mp3` | tocón impacta | Crash, Smash, Break! | P0 |
| `/audio/sfx/trap-pinecone-rustle.mp3` | árbol/piña avisa | Africa & Jungles / foley | P0 |
| `/audio/sfx/trap-pinecone-fall.mp3` | piña cae | Dynamic Swishes | P0 |
| `/audio/sfx/trap-pinecone-hit.mp3` | piña golpea | Crash / Cartoons | P0 |
| `/audio/ambient/forest-birds.mp3` | bosque | Animals: Flock of Birds | P1 |
| `/audio/ambient/water-current.mp3` | corriente profunda | Water | P1 |
| `/audio/sfx/results-stamp.mp3` | resultados | Household | P1 |
| `/audio/sfx/cargo-last-object-lost.mp3` | fin de run | Wacky World / Cartoons | P1 |
| `/audio/sfx/trap-stump-rise.mp3` | movimiento tocón | Dynamic Swishes | P1 |
| `/audio/sfx/ui-help-pop.mp3` | ayuda contextual | Children & Play | P1 |

`P0*`: solo si el bioma correspondiente forma parte del subconjunto implementado en la entrega de jam.

---

# 27. Resultado esperado

La capa sonora mínima debe conseguir que, con los ojos en Don Tortuga y la carga, el jugador pueda reconocer auditivamente:

```text
he navegado por el menú
he saltado
he aterrizado fuerte
la carga acaba de recibir un golpe importante
he perdido algo
he entrado en agua
estoy avanzando sobre otro material
una trampa se ha activado
la piña viene hacia mí
he cruzado otro banderín
la run ha terminado
```

Sin que el juego deje de sentirse ligero, amable y deliberadamente absurdo.

---

# 28. Regla final

> **No sonificar la simulación. Sonificar la historia física que el jugador percibe.**

Rapier puede generar docenas de contactos.

El jugador solo necesita oír los que convierten la mudanza en una pequeña catástrofe memorable.
