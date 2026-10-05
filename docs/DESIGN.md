## This is a placeholder DESIGN.md ##
---
# Tokens de interfaz legibles por máquina. La prosa de abajo explica cómo usarlos.
reference_stage: { width: 1280, height: 720 }
color:
  ui:                          # Material de mudanza
    ink: "#172228"             # tinta: contorno y texto (misma tinta que el arte; nunca negro puro)
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
    brand_green: "#1F4D3A"     # banda de cabecera de la empresa (portada, bandas laterales)
font:                          # confirmadas por Clara (ver §5)
  display: "Fredoka"           # títulos, botones, sellos, números grandes
  ui: "Nunito"                 # HUD, avisos, texto corto
  marker: "Permanent Marker"   # solo etiquetas de 1–2 palabras sobre cajas
size_px_at_reference:
  gameplay_min_text: 28
  menu_body: 24
  menu_button: 32
  screen_title: 64
  key_cap: 64                  # teclas dibujadas bajo Don Tortuga
stroke_px_at_reference:
  ui_outline: 3
  sticker_border: 4            # borde de papel alrededor del contorno de la UI
  focus_ring: 5
radius_px: { button: 12, panel: 18, card: 12, key_cap: 12 }
spacing_px: { xs: 4, s: 8, m: 16, l: 24, xl: 40, safe_margin: 24 }
motion_ms: { tap: 100, ui_in: 200, ui_out: 150, stamp: 350, notification_hold: 3500 }
---

# DESIGN.md — Mudanzas Tortuga, S.L.

> Dirección de **interfaz** para agentes de código (Claude, Codex) y para personas.
> **Responsable:** Clara (dirección de arte y UX). **Estado:** v0.3 para la Anima Valencia Game Jam 2026.
> Léelo antes de cualquier tarea que toque menús, HUD, textos en pantalla, botones, avisos, resultados, tipografía o movimiento de la interfaz.
> Los nombres de los tokens están en inglés o sin tildes para usarlos en código; la prosa está en español, como el resto de la documentación.

---

## 0. Dónde encaja este documento

| Documento | Decide |
|---|---|
| `GDD.md` | *Qué* pasa: reglas, pantallas, flujo, textos, mensajes de ayuda, tramos de los sellos. Nadie lo contradice. |
| **`DESIGN.md`** (este) | *Cómo se ve y se comporta la interfaz*: material, colores de UI, tipografía, componentes, zonas de pantalla, movimiento de la UI y accesibilidad. |
| `ART.md` | La estética del juego: Don Tortuga, mundo, corporación, carga, biomas, paletas de arte y estilo de dibujo. |
| `ASSETS.md` | Cómo se exportan, nombran, escalan y colocan los assets en el juego (escenario, puntos de registro, animación). |
| `PRD.md` y `AGENTS.md` | La arquitectura. |

- Si una regla de aquí es técnicamente imposible, anota el conflicto en `BACKLOG.md` y pregunta; no la elimines en silencio.
- Si algo no está cubierto: **usa el patrón existente más parecido, mantenlo sencillo y anótalo en «Preguntas de diseño abiertas» del backlog.** No inventes colores, fuentes ni motivos visuales nuevos.

---

## 1. Norte

**La interfaz es el material impreso de una pequeña empresa de mudanzas, orgullosa y algo absurda, para niños de 6 a 12 años.**

Tres preguntas para cada decisión de interfaz:

1. **¿Lo entiende un niño de 6 años en medio segundo y sin leer?**
2. **¿Parece algo que tendría una empresa de mudanzas?** (cartón, cinta, etiquetas, albaranes, sellos, un teléfono).
3. **¿Deja en paz a la tortuga y a la carga?**

**El mínimo texto posible.** Los iconos, las teclas dibujadas y la animación explican; el texto es la guinda para quien ya sabe leer. El humor de la marca va en los textos; la forma siempre es amable.

---

## 2. Color de la interfaz

- La interfaz usa **solo** los tokens de `color.ui`. Las paletas del mundo, de la corporación y de Don Tortuga (`ART.md`) no se usan para la interfaz, salvo dentro de iconos que reproduzcan el arte de la carga.
- **La tinta `#172228` es el contorno y el texto de toda la interfaz**, igual que en el arte. **Nunca se usa negro puro.**
- **Nunca codifiques significado solo con color.** Perdido = apagado **y** tachado. Seleccionado = cinta **y** flecha ► **y** cambio de tamaño.
- **Colores nuevos:** requieren aprobación de Clara. Para un placeholder, usa estos tokens.

### 2.1 Texto sobre superficies (contraste comprobado)

`ink` sobre `paper` 13,7:1 · `ink` sobre `tape` 9,7:1 · `ink` sobre `kraft_light` 8,2:1 · `ink` sobre `kraft` 6,1:1 · `paper` sobre `brand_green` 8,1:1 · `carbon_blue` sobre `paper` 6,7:1 · `ink_muted` sobre `paper` 6,7:1 · `stamp_red` sobre `paper` 4,2:1 (**solo texto grande**, ≥ 28 px en negrita).

- `ink_muted` sobre `kraft` no llega (3,0:1): úsalo solo sobre `paper` o `kraft_light`.
- Nunca pongas texto sobre `kraft_edge`.

---

## 3. Lenguaje de la interfaz: «material de mudanza»

Toda la interfaz está hecha de cosas que llevaría una empresa de mudanzas. Eso es lo que la hace *nuestra*.

| Elemento | Material | Tratamiento |
|---|---|---|
| Paneles de menú | Caja de cartón (`kraft`) | Bisel (`kraft_light` arriba, `kraft_edge` abajo) y una tira de `tape` cruzando la parte superior |
| Botones | Etiqueta de caja | Relleno `kraft` o `paper`, contorno de tinta de 3 px, 4–6 px de grosor inferior en `kraft_edge` |
| Botón seleccionado | Cinta de embalar | Relleno `tape` (ver §6.1) |
| Portada | Cartel publicitario | Banda `brand_green`, composición del GDD §6.5 |
| Resultados | **Albarán de entrega** | `paper` con líneas `paper_line`, campos en `carbon_blue`, sello de goma (§6.5) |
| Pausa | Caja de cartón precintada | Panel `kraft` con tira de `tape`; opciones como etiquetas de `paper` |
| HUD de la carga | **Lista de embalaje** | Tira de `paper` con el icono de cada objeto |
| Cronómetro | Etiqueta redonda | Relleno `tape`, números grandes |
| Quejas del cliente | Llamada o SMS | Ver §6.4 |
| Modo desactivado | Caja precintada | Cartón apagado con cinta rayada «Próximamente» |

- **La luz viene siempre de arriba a la izquierda:** bisel claro arriba, borde oscuro abajo, sombra dura hacia abajo.
- **Cinta rayada con tinta** (`tape` + rayas `ink`): solo para «Próximamente» y avisos. La cinta lisa es la de selección.

### 3.1 Regla de la pegatina (obligatoria)

Todo panel, botón o elemento del HUD que se dibuje **sobre el mundo** lleva, por fuera del contorno de tinta, un **borde de `paper` de 4 px** (`sticker_border`), como una pegatina troquelada, más una sombra dura hacia abajo.

Motivo: el mundo usa valores unificados, así que el cartón tiene casi la misma luminosidad que la hierba, el caparazón y la madera (contraste de unos 1,1–1,2:1), y sobre la roca la tinta sola se pierde. El borde de papel garantiza que la interfaz se lea sobre cualquier bioma.

**Textura:** se permite un grano muy sutil en cartón y papel (en CSS/SVG o una imagen pequeña en mosaico). El texto va siempre sobre zona plana y limpia. Sin texturas fotográficas.

---

## 4. Zonas de pantalla (durante la partida)

A la referencia de 1280×720, con margen de seguridad de 24 px:

```text
┌──────────────────────────────────────────────────────────────┐
│ [LISTA DE EMBALAJE ······] [01:23]                           │  ← HUD: franja superior izquierda, ≤ 80 px de alto
│                                                              │
│                                      ┌─────────────────────┐ │
│          Don Tortuga + carga         │  DERECHA ~40 %:      │ │  ← terreno, trampas y
│          [ ← → velocidad ]           │  SIN NADA DE UI      │ │    bifurcaciones llegan por aquí
│           (ayuda de controles)       └─────────────────────┘ │
│ [llamada / SMS del cliente]                                  │  ← quejas: abajo a la izquierda
└──────────────────────────────────────────────────────────────┘
```

- Las ayudas de controles (GDD §41.7) van **ancladas debajo de Don Tortuga** y lo acompañan; nunca centradas en pantalla.
- Nada tapa el ~40 % derecho del área de juego, salvo el arte del mundo.
- La interfaz se diseña a 1280×720 y escala con el juego (el escalado lo describe `ASSETS.md`).
- La colocación final se confirma con los mockups (GDD §41.6).

---

## 5. Tipografía (confirmada por Clara)

Las tres son Google Fonts con soporte completo de español (á é í ó ú ñ ¿ ¡). Se pueden alojar en el proyecto o cargar desde Google Fonts según `AGENTS.md`.

| Rol | Fuente | Uso |
|---|---|---|
| Display | Fredoka (600–700) | Títulos, botones, sellos, números grandes del albarán y del cronómetro |
| UI | Nunito (700–800) | HUD, avisos, textos cortos |
| Rotulador | Permanent Marker | Solo etiquetas de 1–2 palabras «escritas sobre cajas» (FRÁGIL, PAUSA). Nunca para instrucciones ni nada que un niño tenga que leer |

Tamaños a la referencia: texto en partida **≥ 28 px**, cuerpo de menú 24 px, botones 32 px, títulos 64 px. Cronómetro y puntuaciones con números tabulares. **Texto en partida: máximo 2–3 palabras** (GDD §41.7).

---

## 6. Componentes

### 6.1 Botón (menús)

| Estado | Aspecto |
|---|---|
| Normal | Etiqueta `kraft` (o `paper` dentro de paneles), contorno de tinta de 3 px, grosor inferior en `kraft_edge` |
| **Seleccionado / con foco** | Relleno `tape`, flecha ► a la izquierda, escala 1,04–1,06 y giro de −2°. **Las tres señales juntas.** |
| Pulsado | Baja 3 px y desaparece el grosor inferior (la caja se aplasta) |
| Desactivado | Cartón apagado, cinta rayada diagonal con «Próximamente», no responde a Enter |

Primero el teclado (GDD §41.4): ↑/↓ para moverse, Enter para confirmar, Esc para volver. Cada pantalla se abre con la opción más probable ya seleccionada. El ratón también funciona; pasar por encima equivale a seleccionar.

### 6.2 Ayuda de controles con teclas dibujadas

Teclas de teclado dibujadas (64 px, relleno `paper`, tinta de 3 px, grosor inferior de 4–5 px) con flechas, más una palabra en la fuente de UI. Aparece en 200 ms. Cuando el jugador pulsa la tecla correspondiente, la tecla dibujada se hunde. Desaparece al cumplirse o tras el tiempo máximo de tuning.

### 6.3 Lista de embalaje (HUD de la carga)

| Estado | Aspecto |
|---|---|
| En carga | Icono a todo color sobre la tira de `paper` |
| Separación temporal (opcional) | El icono se tambalea ±6°, 2 ciclos por segundo |
| **Perdido** | Icono apagado **y** tachado en `stamp_red`; sacudida de 250 ms al perderse |

Los iconos son siluetas simplificadas del arte de la carga (`ART.md`), no dibujos nuevos.

### 6.4 Queja del cliente (llamada o SMS)

Según el GDD §41.8, el cliente unas veces **llama** y otras **escribe un SMS**:

- **Llamada:** retrato redondo del cliente con borde de pegatina y un bocadillo de `paper`.
- **SMS:** tarjeta tipo notificación de móvil con el avatar del cliente.

En ambos casos, **lo primero que se lee es la cara del cliente reaccionando y el icono del objeto tachado en rojo**; el texto corto es secundario. Abajo a la izquierda. Entra en 200 ms, se mantiene unos 3,5 s y sale en 150 ms. Uno por accidente, nunca más de uno a la vez, nunca bloquea el control.

### 6.5 Albarán (resultados) y sellos

Un albarán de entrega sobre `paper` ligeramente girado: cabecera con el nombre de la empresa, campos rellenos en `carbon_blue`, objetos entregados como iconos (los perdidos apagados y tachados), desglose de puntos y total en la fuente display. Botones: **Reintentar** (seleccionado por defecto) y **Menú**.

El **sello** cae el último: escala de 1,4 a 1,0 con un leve giro, 350 ms, con un pequeño golpe de pantalla. Textos y tramos según el GDD §41.5.5. Para que un niño de 6 años entienda la nota **sin leer**, cada sello lleva una fila de cajas:

| Tramo | Cajas llenas | Tinta del sello |
|---|---|---|
| 100 % | 5 | `stamp_green` |
| 90–99 % | 4 | `stamp_red` |
| 60–89 % | 3 | `stamp_red` |
| 40–59 % | 2 | `stamp_red` |
| 10–39 % | 1 | `stamp_red` |
| 0–9 % | 0 (en su lugar, la silueta de Don Tortuga solo) | `stamp_blue` |

Las cajas vacías se dibujan con contorno discontinuo. El sello lleva doble borde.

### 6.6 Confirmación (pausa → reiniciar / salir)

Nota pequeña con cinta: pregunta de ≤ 5 palabras, dos botones, foco por defecto en la opción **segura** (cancelar).

---

## 7. Movimiento de la interfaz

- Breve y físico: las cosas se **pegan con cinta, se sellan, se deslizan y se aplastan**, como objetos y no como una web. Entradas con ease-out, salidas con ease-in. Duraciones en los tokens.
- Respeta `prefers-reduced-motion`: se mantiene la información (objeto tachado, sello presente), pero se quitan sacudidas, golpes de pantalla y bamboleos.

---

## 8. Accesibilidad (mínimo para la jam)

- Jugable entero solo con teclado; ratón opcional en menús.
- Foco siempre visible en los menús (§6.1).
- Contraste de texto ≥ 4,5:1 (≥ 3:1 para texto de ≥ 28 px en negrita); formas de interfaz ≥ 3:1 contra su fondo (de ahí la regla de la pegatina, §3.1).
- Nada de significado solo por color (§2).
- Ningún parpadeo de más de 3 veces por segundo.
- Las instrucciones nunca dependen de leer una frase: teclas dibujadas y 1–2 palabras.

---

## 9. Reglas para agentes

**Sí**
- Usa los tokens de este documento y refiérete a ellos por su nombre en el código (propiedades CSS personalizadas y un objeto TS `designTokens` generado a partir de los mismos valores).
- Mantén los placeholders honestos: formas sólidas en colores de los tokens más una etiqueta de texto, como describe AGENTS §8.2.
- Si algo de aquí choca con el código o falta, anótalo en «Preguntas de diseño abiertas» de `BACKLOG.md` y sigue con la opción más conservadora.

**No**
- No añadas colores, fuentes, degradados, sombras difusas, glassmorphism, emojis como iconos ni adornos genéricos de «UI de videojuego».
- No uses negro puro (`#000000`) en ningún contorno ni texto: usa la tinta `#172228`.
- No pongas interfaz en el ~40 % derecho del área de juego durante la partida.
- No escribas instrucciones de más de 2–3 palabras durante la partida ni añadas personajes que paren la acción para explicar (GDD §41.1).

---

## 10. Decisiones de interfaz

- [x] Composición de la portada (GDD §6.5): pizarra «7 · Portada» del canvas de diseño. El logotipo es el rótulo «MUDANZAS TORTUGA, S.L.» en Fredoka sobre `brand_green`. Usa el Don Tortuga final de Clara, con ramita.
- [x] Iconos de la lista de embalaje para los cuatro objetos de la jam (sofá, TV, vaso, lámpara): 64×64, trazo de 3 px.
- [x] Avatares de los clientes para la llamada y el SMS: ardilla, cierva y búho, de peluche de retales (estilo en `ART.md` §4.1). El arte se hará cuando las criaturas estén implementadas en el juego.
- [x] Material de la interfaz y regla de la pegatina (§3).
- [x] Tinta `#172228` para contornos y texto, sin negro puro (§2).
- [x] Fuentes: Fredoka + Nunito + Permanent Marker (§5).
- [x] `brand_green` para la portada (§3).
