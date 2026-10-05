## This is a placeholder DESIGN.md ##
---
# Tokens de diseño legibles por máquina. La prosa de abajo explica cómo usarlos.
# Los valores marcados como "propuesta" en la prosa están pendientes de confirmación por Clara.
reference_stage: { width: 1280, height: 720 }
color:
  art:
    outline: "#172228"         # contorno de TODO el arte (nunca negro puro)
    detail_dark: "#544441"     # trazos interiores oscuros (costuras, arrugas)
    detail_light: "#BDA370"    # trazos interiores claros (costuras claras, brillos)
  turtle:                      # Don Tortugo: peluche de retales (paleta adaptada)
    lino:          { luz: "#DBCCBD", sombra: "#C9B29C" }   # cuerpo, cabeza, patas
    verde_cuadros: { luz: "#65B655", sombra: "#4E9640" }
    salvia:        { luz: "#B1B655", sombra: "#919640" }
    oliva:         { luz: "#B69D55", sombra: "#967F40" }
    burdeos:       { luz: "#B65D55", sombra: "#964740" }
    mostaza:       { luz: "#C88543", sombra: "#A66A30" }
    marino:        { luz: "#4395C8", sombra: "#3078A6" }
  world:                       # Mundo de Don Tortuga (bosque, criaturas, skins de objetos)
    lima:         { luz: "#7CC24A", sombra: "#509641" }
    esmeralda:    { luz: "#4AC272", sombra: "#309669" }
    verde_bosque: { luz: "#41A762", sombra: "#2A7B59" }
    turquesa:     { luz: "#4AB8C2", sombra: "#308CB9" }
    petroleo:     { luz: "#419EA7", sombra: "#2A729E" }
    violeta:      { luz: "#833DB5", sombra: "#5427AC" }
    magenta:      { luz: "#B53D8D", sombra: "#742784" }
    rojo_teja:    { luz: "#BE6158", sombra: "#7A3E4F" }
  corp:                        # Huella de la corporación antagonista
    niebla:           { luz: "#CDD3D7", sombra: "#ACBAC8" }
    hormigon:         { luz: "#ADB3BA", sombra: "#919BAC" }
    acero:            { luz: "#8D9FAE", sombra: "#768CA0" }
    azul_corporativo: { luz: "#7999C1", sombra: "#6684AC" }
    pizarra:          { luz: "#7999C1", sombra: "#6F7D8E" }
    naranja:          { luz: "#D78315", sombra: "#B2711E" }   # único acento cálido de la corporación
  ui:                          # Material de mudanza (también base neutra de los objetos)
    ink: "#172228"             # mismo que el contorno del arte: une la UI con el mundo
    ink_muted: "#6B4A2A"       # texto secundario; solo sobre paper o kraft_light
    kraft: "#C8955C"           # cartón: paneles y botones
    kraft_shade: "#B07E48"     # sombra suave del cartón (caras laterales)
    kraft_light: "#DDB07A"     # bisel claro del cartón
    kraft_edge: "#8A5A2B"      # canto del cartón, grosor inferior de botones
    paper: "#F6EBD3"           # albarán, notas, notificaciones, borde de pegatina
    paper_line: "#D8CFB8"      # líneas pautadas y separadores sobre papel
    tape: "#F2C230"            # cinta de embalar; selección activa
    tape_stripe: "#E5B220"     # rayado de la cinta
    stamp_red: "#C8402E"       # sello del albarán, tachado de objeto perdido
    stamp_green: "#2F7D3A"     # sello «¡MUDANZA PERFECTA!»
    stamp_blue: "#3D5A80"      # sello del tramo más bajo
    carbon_blue: "#2F4F8F"     # campos «escritos a mano» del albarán
    brand_green: "#1F4D3A"     # banda de cabecera de la empresa (portada)
font:                          # confirmadas por Clara (ver §6)
  display: "Fredoka"           # títulos, botones, sellos, números grandes
  ui: "Nunito"                 # HUD, avisos, texto corto
  marker: "Permanent Marker"   # solo etiquetas de 1–2 palabras sobre cajas
size_px_at_reference:
  gameplay_min_text: 28
  menu_body: 24
  menu_button: 32
  screen_title: 64
  key_cap: 64                  # teclas dibujadas bajo Don Tortugo
stroke_px_at_reference:
  art_outline: 4
  ui_outline: 3
  sticker_border: 4            # borde de papel alrededor del contorno de la UI
  focus_ring: 5
radius_px: { button: 12, panel: 18, card: 12, key_cap: 12 }
spacing_px: { xs: 4, s: 8, m: 16, l: 24, xl: 40, safe_margin: 24 }
motion_ms: { tap: 100, ui_in: 200, ui_out: 150, stamp: 350, notification_hold: 3500 }
---

# DESIGN.md — Mudanzas Tortuga, S.L.

> Dirección visual y de interfaz para agentes de código (Claude, Codex) y para personas.
> **Responsable:** Clara (dirección de arte y UX). **Estado:** v0.2 para la Anima Valencia Game Jam 2026.
> Léelo antes de cualquier tarea que toque sprites, colores, tipografía, menús, HUD, feedback, animación o carga de assets.
> Los nombres de los tokens están en inglés o sin tildes para usarlos en código; la prosa está en español, como el resto de la documentación.

---

## 0. Dónde encaja este documento

- **`/docs/GDD.md` decide *qué* pasa:** reglas, pantallas, flujo, textos, mensajes de ayuda, tramos de los sellos. Este documento nunca lo contradice.
- **Este documento decide *cómo se ve, cómo se mueve y cómo se monta*:** paleta, tipografía, materiales de la UI, estados de los componentes, animación, pipeline de assets y accesibilidad.
- **`/docs/PRD.md` y `AGENTS.md`** deciden la arquitectura. Si una regla de diseño de aquí es técnicamente imposible, anota el conflicto en `/docs/BACKLOG.md` y pregunta; no la elimines en silencio.
- Si algo no está cubierto aquí: **usa el patrón existente más parecido, mantenlo sencillo y anótalo en «Preguntas de diseño abiertas» del backlog.** No inventes colores, fuentes ni motivos visuales nuevos.

---

## 1. Norte

**El juego es el material impreso de una pequeña empresa de mudanzas, orgullosa y algo absurda, en un bosque, para niños de 6 a 12 años.**

Tres preguntas para cada decisión visual:

1. **¿Lo entiende un niño de 6 años en medio segundo y sin leer?**
2. **¿Parece algo que tendría una empresa de mudanzas?** (cartón, cinta, etiquetas, albaranes, sellos, un teléfono).
3. **¿Deja en paz a la tortuga y a la carga?**

**El mínimo texto posible.** Los iconos, las teclas dibujadas y la animación explican; el texto es la guinda para quien ya sabe leer.

Referencias de ambiente, nunca para copiar: *Bluey* (formas planas, cálidas y legibles; humor para niños y adultos a la vez), *Agallas, el perro cobarde* (paisajes algo extraños, reservado a la huella de la corporación y siempre suave) y *Happy Tree Friends* (comedia física de dibujo animado, **sin ninguna violencia, herida ni gore**).

---

## 2. Sistema de color

### 2.1 Principios (decisión de Clara)

1. **Parejas de luz y sombra.** Cada color existe como pareja: `luz` para la cara iluminada y `sombra` para la cara en sombra. Se modela con la pareja; **no se usan negros ni grises para sombrear.**
2. **Valor unificado.** Los rellenos viven en una franja estrecha de luminosidad. Los niños leen mejor paletas saturadas con poco contraste de valor entre rellenos: **el contraste fuerte lo pone la línea de tinta (`outline`), no los rellenos.**
3. **Sin oscuros en los rellenos.** Lo único oscuro de la escena son la tinta y los detalles interiores.
4. **Método de comprobación:** desaturar la imagen (luminosidad HSL, como en el programa de dibujo de Clara) y comprobar que los rellenos quedan en dos valores próximos. Esa es la referencia; no la sustituyas por otra fórmula de luminancia.
5. **La tinta `#172228` es el contorno de todo el arte** (personajes, carga, terreno, trampas e interfaz). **Nunca se usa negro puro** para contornos ni para texto: la tinta es la base común de todo el juego.

### 2.2 Las cuatro familias

| Familia | Tokens | Uso | Carácter |
|---|---|---|---|
| Don Tortugo | `color.turtle` | Solo el personaje y su caparazón | Retales de peluche, saturación contenida |
| Mundo | `color.world` | Bosque, criaturas, skins de objetos | Saturado, afín y complementario, valores medios |
| Corporación | `color.corp` | Zonas taladas, maquinaria, carteles de la empresa antagonista | Fría y casi sin color; el `naranja` es su único acento |
| Material de mudanza | `color.ui` | Toda la interfaz y la base neutra de los objetos | Cartón, papel, cinta, tinta y sellos |

- **El villano se reconoce por el color, sin palabras:** el mundo de Don Tortugo es cálido y saturado; la huella de la corporación es fría, desaturada y rectilínea (esquinas rectas, formas geométricas).
- **Los objetos de la mudanza** tienen una versión base en los colores de `ui` (cartón, papel, cinta) y **skins** hechas con parejas de `world`. Una skin cambia colores y estampado (lunares, rayas, capitoné…), **nunca la geometría ni el collider**.
- **Colores nuevos:** requieren aprobación de Clara. Para un placeholder, usa estos tokens.

### 2.3 Texto sobre superficies (contraste comprobado)

`ink` sobre `paper` 13,7:1 · `ink` sobre `tape` 9,7:1 · `ink` sobre `kraft_light` 8,2:1 · `ink` sobre `kraft` 6,1:1 · `carbon_blue` sobre `paper` 6,7:1 · `ink_muted` sobre `paper` 6,7:1 · `stamp_red` sobre `paper` 4,2:1 (**solo texto grande**, ≥ 28 px en negrita).

- `ink_muted` sobre `kraft` no llega (3,0:1): úsalo solo sobre `paper` o `kraft_light`.
- Nunca pongas texto sobre `kraft_edge`.
- **Nunca codifiques significado solo con color.** Perdido = apagado **y** tachado. Seleccionado = cinta **y** flecha ► **y** cambio de tamaño.

---

## 3. Arte del mundo

### 3.1 Reglas de estilo

- Vector 2D, cartoon, rellenos planos con **una pareja de luz y sombra** por superficie.
- **Contorno:** `outline` (`#172228`, nunca negro puro), **4 px a la referencia de 1280×720**, extremos y uniones redondeados. Los detalles interiores son más finos y usan `detail_dark` / `detail_light`.
- Un ligero **biselado** es bienvenido en objetos e interfaz. **La luz viene siempre de arriba a la izquierda**: borde claro arriba, borde oscuro abajo.
- **La silueta primero.** Cada objeto de la carga debe reconocerse solo por su silueta rellena. El detalle visual nunca exige detalle en el collider (GDD §37.3).

### 3.2 Capas de profundidad (de atrás hacia delante)

| Capa | Contorno | Contraste / saturación | Notas |
|---|---|---|---|
| Fondo lejano (parallax) | ninguno | el más bajo; algo más frío y pálido | Fijo a la cámara (GDD §29). Nunca compite con el juego. |
| Fondo medio | ninguno o 2 px suave | bajo | Árboles, carteles. Aquí vive la señalética de la marca y de la corporación. |
| **Capa jugable** | **4 px de tinta** | **el más alto** | Superficie del terreno, Don Tortugo, carga, trampas. |
| Feedback / efectos | según necesidad | alto y breve | Polvo, salpicaduras, líneas de bamboleo. |
| Interfaz | 3 px de tinta + borde de papel | alto | HUD, ayudas, notificaciones. |

Regla: **todo aquello con lo que el jugador puede chocar lleva contorno; lo que no, no.** Es la forma principal en que un niño distingue «suelo» de «decorado».

### 3.3 Biomas (propuesta)

Los biomas se distinguen por **tono y textura, no por oscuridad**, para respetar el valor unificado y que se lean también sin color:

| Bioma | Textura | Color |
|---|---|---|
| Agua | ondas horizontales y una banda de superficie visible | pareja `turquesa` |
| Hierba | briznas y matas en el borde | pareja `lima` |
| Arena | puntos y borde blando redondeado | pendiente (Clara) |
| Roca | facetas angulosas y grietas | pendiente (Clara) |

### 3.4 Trampas y anticipación

Las señales de aviso (GDD §34) combinan **movimiento, forma y color**, nunca solo color: sombra en el suelo, rama que se dobla, tambaleo antes de caer, línea de trayectoria discontinua. La **cinta amarilla rayada con tinta** se reserva para «aquí va a pasar algo» y para el precinto de «Próximamente». No la uses como decoración.

### 3.5 Don Tortugo (el personaje)

- **Es un peluche hecho de retales, entero:** cuerpo de lino y caparazón, cuello, patas y cabeza cosidos con telas distintas y costuras visibles (`detail_dark` / `detail_light`). Paleta: `color.turtle`.
- **Accesorios aprobados:** gorra y **una ramita en la boca** (sustituye a la pipa; no se usa la pipa).
- **Estoico, nunca angustiado** (GDD §5.3). Expresiones de tranquilo a concentrado. Sin dolor, miedo ni lágrimas.
- **El caparazón es el escenario:** debe ser la forma más grande y clara de la pantalla, y su inclinación tiene que verse.
- **Contorno superior del caparazón y collider:** la carga se apoya en la parte de arriba del caparazón. Si el contorno visible y la plataforma física no coinciden, los muebles parecerán flotar o atravesarlo. Cuando cambie uno de los dos, revisa el otro o anótalo en el backlog.
- **Skins del personaje:** se hacen cambiando retales (colores y estampados de las piezas), sin tocar la geometría.

---

## 4. Lenguaje de la interfaz: «material de mudanza»

Toda la interfaz está hecha de cosas que llevaría una empresa de mudanzas. Eso es lo que la hace *nuestra*.

| Elemento | Material | Tratamiento |
|---|---|---|
| Paneles de menú | Caja de cartón (`kraft`) | Bisel (`kraft_light` arriba, `kraft_edge` abajo) y una tira de `tape` cruzando la parte superior |
| Botones | Etiqueta de caja | Relleno `kraft` o `paper`, contorno de tinta de 3 px, 4–6 px de grosor inferior en `kraft_edge` |
| Botón seleccionado | Cinta de embalar | Relleno `tape` (ver §7.1) |
| Portada | Cartel publicitario | Banda `brand_green`, composición del GDD §6.5 |
| Resultados | **Albarán de entrega** | `paper` con líneas `paper_line`, campos en `carbon_blue`, sello de goma (§7.5) |
| Pausa | Caja de cartón precintada | Panel `kraft` con tira de `tape`; opciones como etiquetas de `paper` |
| HUD de la carga | **Lista de embalaje** | Tira de `paper` con el icono de cada objeto |
| Cronómetro | Etiqueta redonda | Relleno `tape`, números grandes |
| Quejas del cliente | Llamada o SMS | Ver §7.4 |
| Modo desactivado | Caja precintada | Cartón apagado con cinta rayada «Próximamente» |

### 4.1 Regla de la pegatina (obligatoria)

Todo panel, botón o elemento del HUD que se dibuje **sobre el mundo** lleva, por fuera del contorno de tinta, un **borde de `paper` de 4 px** (`sticker_border`), como una pegatina troquelada, más una sombra dura hacia abajo.

Motivo: con valores unificados, el cartón tiene casi la misma luminosidad que la hierba, el caparazón y la madera (contraste de unos 1,1–1,2:1), y sobre la roca la tinta sola se pierde. El borde de papel garantiza que la interfaz se lea sobre cualquier bioma.

**Textura:** se permite un grano muy sutil en cartón y papel (en CSS/SVG o una imagen pequeña en mosaico). El texto va siempre sobre zona plana y limpia. Sin texturas fotográficas.

---

## 5. Zonas de pantalla (durante la partida)

A la referencia de 1280×720, con margen de seguridad de 24 px:

```text
┌──────────────────────────────────────────────────────────────┐
│ [LISTA DE EMBALAJE ······] [01:23]                           │  ← HUD: franja superior izquierda, ≤ 80 px de alto
│                                                              │
│                                      ┌─────────────────────┐ │
│          Don Tortugo + carga         │  DERECHA ~40 %:      │ │  ← terreno, trampas y
│          [ ← → velocidad ]           │  SIN NADA DE UI      │ │    bifurcaciones llegan por aquí
│           (ayuda de controles)       └─────────────────────┘ │
│ [llamada / SMS del cliente]                                  │  ← quejas: abajo a la izquierda
└──────────────────────────────────────────────────────────────┘
```

- Las ayudas de controles (GDD §41.7) van **ancladas debajo de Don Tortugo** y lo acompañan; nunca centradas en pantalla.
- Nada tapa el ~40 % derecho del área de juego, salvo el arte del mundo.
- La colocación final se confirma con los mockups (GDD §41.6).

---

## 6. Tipografía (confirmada por Clara)

Las tres son Google Fonts con soporte completo de español (á é í ó ú ñ ¿ ¡). Se pueden alojar en el proyecto o cargar desde Google Fonts según `AGENTS.md`.

| Rol | Fuente | Uso |
|---|---|---|
| Display | Fredoka (600–700) | Títulos, botones, sellos, números grandes del albarán y del cronómetro |
| UI | Nunito (700–800) | HUD, avisos, textos cortos |
| Rotulador | Permanent Marker | Solo etiquetas de 1–2 palabras «escritas sobre cajas» (FRÁGIL, PAUSA). Nunca para instrucciones ni nada que un niño tenga que leer |

Tamaños a la referencia: texto en partida **≥ 28 px**, cuerpo de menú 24 px, botones 32 px, títulos 64 px. Cronómetro y puntuaciones con números tabulares. **Texto en partida: máximo 2–3 palabras** (GDD §41.7). Todo escala con el escenario (§8).

---

## 7. Componentes

### 7.1 Botón (menús)

| Estado | Aspecto |
|---|---|
| Normal | Etiqueta `kraft` (o `paper` dentro de paneles), contorno de tinta de 3 px, grosor inferior en `kraft_edge` |
| **Seleccionado / con foco** | Relleno `tape`, flecha ► a la izquierda, escala 1,04–1,06 y giro de −2°. **Las tres señales juntas.** |
| Pulsado | Baja 3 px y desaparece el grosor inferior (la caja se aplasta) |
| Desactivado | Cartón apagado, cinta rayada diagonal con «Próximamente», no responde a Enter |

Primero el teclado (GDD §41.4): ↑/↓ para moverse, Enter para confirmar, Esc para volver. Cada pantalla se abre con la opción más probable ya seleccionada. El ratón también funciona; pasar por encima equivale a seleccionar.

### 7.2 Ayuda de controles con teclas dibujadas

Teclas de teclado dibujadas (64 px, relleno `paper`, tinta de 3 px, grosor inferior de 4–5 px) con flechas, más una palabra en la fuente de UI. Aparece en 200 ms. Cuando el jugador pulsa la tecla correspondiente, la tecla dibujada se hunde. Desaparece al cumplirse o tras el tiempo máximo de tuning.

### 7.3 Lista de embalaje (HUD de la carga)

| Estado | Aspecto |
|---|---|
| En carga | Icono a todo color sobre la tira de `paper` |
| Separación temporal (opcional) | El icono se tambalea ±6°, 2 ciclos por segundo |
| **Perdido** | Icono apagado **y** tachado en `stamp_red`; sacudida de 250 ms al perderse |

Los iconos son siluetas simplificadas del arte de la carga, no dibujos nuevos.

### 7.4 Queja del cliente (llamada o SMS)

Según el GDD §41.8, el cliente unas veces **llama** y otras **escribe un SMS**:

- **Llamada:** retrato redondo del cliente con borde de pegatina y un bocadillo de `paper`.
- **SMS:** tarjeta tipo notificación de móvil con el avatar del cliente.

En ambos casos, **lo primero que se lee es la cara del cliente reaccionando y el icono del objeto tachado en rojo**; el texto corto es secundario. Abajo a la izquierda. Entra en 200 ms, se mantiene unos 3,5 s y sale en 150 ms. Uno por accidente, nunca más de uno a la vez, nunca bloquea el control.

### 7.5 Albarán (resultados) y sellos

Un albarán de entrega sobre `paper` ligeramente girado: cabecera con el nombre de la empresa, campos rellenos en `carbon_blue`, objetos entregados como iconos (los perdidos apagados y tachados), desglose de puntos y total en la fuente display. Botones: **Reintentar** (seleccionado por defecto) y **Menú**.

El **sello** cae el último: escala de 1,4 a 1,0 con un leve giro, 350 ms, con un pequeño golpe de pantalla. Textos y tramos según el GDD §41.5.5. Para que un niño de 6 años entienda la nota **sin leer**, cada sello lleva una fila de cajas:

| Tramo | Cajas llenas | Tinta del sello |
|---|---|---|
| 100 % | 5 | `stamp_green` |
| 90–99 % | 4 | `stamp_red` |
| 60–89 % | 3 | `stamp_red` |
| 40–59 % | 2 | `stamp_red` |
| 10–39 % | 1 | `stamp_red` |
| 0–9 % | 0 (en su lugar, la silueta de Don Tortugo solo) | `stamp_blue` |

Las cajas vacías se dibujan con contorno discontinuo. El sello lleva doble borde.

### 7.6 Confirmación (pausa → reiniciar / salir)

Nota pequeña con cinta: pregunta de ≤ 5 palabras, dos botones, foco por defecto en la opción **segura** (cancelar).

---

## 8. Escenario, escalado y pipeline de assets

**Esta sección existe porque el caparazón se veía demasiado pequeño y desplazado en el playground.** Causa: el SVG del caparazón se exporta sobre el **escenario completo de Moho de 1280×720**, y el dibujo ocupa solo una parte; el código encajaba el *lienzo entero* en el hueco del caparazón, así que el dibujo encogía y se desplazaba.

### 8.1 Reglas

1. **Todas las piezas de Don Tortugo comparten un mismo escenario.** Cada exportación (fotogramas del cuerpo, del salto y el caparazón) es un lienzo de 1280×720 de la misma escena de Moho. Las piezas encajan porque comparten ese lienzo. **No recortes, ajustes ni recentres las exportaciones de la tortuga por separado.**
2. **Nunca encajes un SVG en un collider, hueco o caja.** Cárgalo a su tamaño nativo y aplica **una única escala global**: `stagePixelsPerMetre` (fuente única de verdad en `/src/game/config/`).
3. **La colocación usa un punto de registro**, no el centro ni la esquina de la imagen. Cada familia de assets de la tortuga declara, en píxeles del escenario, dónde está el origen físico de su cuerpo (por ejemplo, el pivote del caparazón sobre el cuerpo). Guárdalo en un manifiesto pequeño, por ejemplo `/src/game/content/art/turtle.manifest.ts`:
   ```ts
   export const turtleArt = {
     stage: { width: 1280, height: 720 },
     stagePixelsPerMetre: /* se ajusta una vez contra el collider */,
     bodyOrigin: { x: /* px del escenario */, y: /* px del escenario */ },  // origen físico del cuerpo
     shellPivot: { x: /* px del escenario */, y: /* px del escenario */ },  // pivote físico del caparazón
     frames: { walk: ['walk-01.svg', 'walk-02.svg'], jump: ['jump-01.svg', 'jump-02.svg'], shell: 'shell.svg' },
   } as const;
   ```
   El pivote del sprite de Pixi es el punto de registro; el sprite sigue al cuerpo de Rapier. Visual y collider siguen desacoplados (AGENTS §8.2).
4. **Carga, trampas e iconos de UI** se exportan **recortados a su dibujo** (mesa de trabajo ajustada al arte), con el pivote abajo en el centro salvo que su manifiesto diga otra cosa. No comparten el escenario de la tortuga.
5. **Nombres de archivo:** minúsculas, kebab-case, solo ASCII; sin espacios, tildes ni ñ (rompen las URLs en GitHub Pages). Mapea los nombres de origen de Clara en el manifiesto: `Don Tortugo Caparazón.svg` → `public/sprites/turtle/shell.svg`, `…Animation p1.svg` → `walk-01.svg`, `…salto1.svg` → `jump-01.svg`.
6. **Formato:** SVG mientras el arte esté en iteración. Si el SVG da problemas de rendimiento, rasteriza en el build al doble del tamaño en pantalla; no cambies el arte.
7. **Vista de depuración:** la capa de colliders del playground también debe dibujar los puntos de registro, para ver los desajustes de un vistazo.
8. **Antes de exportar desde Moho,** comprueba que no quede activa ninguna capa de referencia ni ninguna capa con opacidad reducida.

### 8.2 Escalado del lienzo

Se diseña a 1280×720. El juego entero se escala de forma uniforme para caber en la ventana (bandas laterales en `brand_green` o con textura de cartón; nunca estirar). Los tamaños de interfaz de este documento son a la referencia y escalan con ella.

### 8.3 Animación

- Se anima en Moho a **24 fps**; el juego funciona a **60 fotogramas lógicos por segundo** (AGENTS §8.3). Los fotogramas se asignan a los huecos lógicos por tiempo; nunca se duplican archivos para rellenar huecos.
- Prototipo: 2 fotogramas de caminar y 2 de salto. Más intermedios pueden sustituir huecos lógicos más adelante sin tocar código.
- La animación de Don Tortugo refleja esfuerzo y concentración, nunca sufrimiento (GDD §5.3).

---

## 9. Movimiento y feedback

- El movimiento de la interfaz es breve y físico: las cosas se **pegan con cinta, se sellan, se deslizan y se aplastan**, como objetos y no como una web. Entradas con ease-out, salidas con ease-in. Duraciones en los tokens.
- El feedback del mundo exagera la física para que se lea (GDD §38): aplastamiento al aterrizar, líneas de bamboleo en pilas inestables, polvo en los impactos, salpicadura al entrar en el agua. El feedback debe **señalar hacia dónde se cae la carga**.
- Don Tortugo permanece tranquilo mientras todo lo que lleva encima es un caos. Ese contraste es el chiste.
- Respeta `prefers-reduced-motion`: se mantiene la información (objeto tachado, sello presente), pero se quitan sacudidas, golpes de pantalla y bamboleos.

---

## 10. Accesibilidad (mínimo para la jam)

- Jugable entero solo con teclado; ratón opcional en menús.
- Foco siempre visible en los menús (§7.1).
- Contraste de texto ≥ 4,5:1 (≥ 3:1 para texto de ≥ 28 px en negrita); formas de interfaz ≥ 3:1 contra su fondo (de ahí la regla de la pegatina, §4.1).
- Nada de significado solo por color (§2.3). Las señales de aviso combinan movimiento y forma.
- Ningún parpadeo de más de 3 veces por segundo.
- Las instrucciones nunca dependen de leer una frase: teclas dibujadas y 1–2 palabras.

---

## 11. Reglas para agentes

**Sí**
- Usa los tokens de este documento y refiérete a ellos por su nombre en el código (propiedades CSS personalizadas y un objeto TS `designTokens` generado a partir de los mismos valores).
- Mantén los placeholders honestos: formas sólidas en colores de los tokens más una etiqueta de texto, como describe AGENTS §8.2.
- Respeta el arte de Clara exactamente: mismos colores, mismos trazos, mismas proporciones.
- Si algo de aquí choca con el código o falta, anótalo en «Preguntas de diseño abiertas» de `/docs/BACKLOG.md` y sigue con la opción más conservadora.

**No**
- No añadas colores, fuentes, degradados, sombras difusas, glassmorphism, emojis como iconos ni adornos genéricos de «UI de videojuego».
- No uses negros ni grises para sombrear: usa la pareja `sombra` del color (§2.1).
- No escales, recortes ni recolorees el arte para encajarlo en un collider (§8).
- No pongas interfaz en el ~40 % derecho del área de juego durante la partida.
- No escribas instrucciones de más de 2–3 palabras durante la partida ni añadas personajes que paren la acción para explicar (GDD §41.1).
- No representes daño, miedo ni heridas en ningún personaje.
- No pongas pipas, tabaco ni nada parecido en ningún personaje: el público es infantil.
- No uses negro puro (`#000000`) en ningún contorno ni texto: usa la tinta `#172228`.

---

## 12. Decisiones abiertas (Clara)

- [ ] Colores de arena y roca (§3.3).
- [ ] Puntos de registro del escenario de la tortuga (§8.1, regla 3): Clara los marca en Moho o Miguel los mide en la capa de depuración del playground.
- [ ] Avatares de los clientes: qué criaturas del bosque y con qué estilo.
- [ ] Composición final de la portada (GDD §6.5) y logotipo.
- [ ] Iconos de los cuatro objetos de la jam (sofá, TV, vaso, lámpara) y sus skins.
- [x] Paletas del mundo, de la corporación y de Don Tortugo (§2).
- [x] Material de la interfaz y regla de la pegatina (§4).
- [x] Ramita en la boca en lugar de pipa (§3.5).
- [x] Tinta `#172228` como contorno de todo el arte, sin negro puro (§2.1).
- [x] Fuentes: Fredoka + Nunito + Permanent Marker (§6).
- [x] `brand_green` para la portada (§4).
