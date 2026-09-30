# MUDANZAS TORTUGA, S.L.

## Game Design Document

**Título de trabajo:** *Mudanzas Tortuga, S.L.*  
**Nombre diegético del servicio:** *Servicio de Mudanzas de Don Tortuga para criaturillas del bosque desahuciadas*  
**Formato:** videojuego 2D para navegador  
**Género:** juego de físicas simplificadas / *endless runner* lento / equilibrio y conducción de carga  
**Dirección visual:** vector art 2D, cartoon  
**Público:** infantil y familiar  
**Estado del documento:** versión de diseño para Game Jam  
**Naturaleza del documento:** documento vivo; los valores numéricos de físicas señalados como parámetros de *tuning* podrán modificarse a partir del prototipo y los *playtests* sin alterar las reglas fundamentales aquí descritas.

---

# 1. HIGH CONCEPT

**Un juego de físicas 2D en el que una tortuga experta en mudanzas avanza sin descanso por un bosque cada vez más difícil, intentando que la disparatada pila de pertenencias que transporta sobre el caparazón llegue a destino con ella.**

La Tortuga no puede morir, recibir daño ni fracasar por accidente físico. El peligro recae exclusivamente sobre la mudanza.

Cada irregularidad del terreno, frenazo, aceleración, inclinación, choque o accidente pone a prueba el equilibrio de la carga. Perder un objeto no termina la partida: sencillamente significa que ese pedazo de la mudanza se queda por el camino.

El objetivo no es llegar intacto.

El objetivo es **llegar con todo lo que todavía sea posible salvar**.

---

# 2. FANTASÍA DEL JUGADOR

La fantasía central es la de ser el empleado estrella —y probablemente único— del servicio de mudanzas más peculiar del bosque.

Una gran corporación está destruyendo progresivamente el hábitat de las criaturas del bosque y sus habitantes necesitan trasladarse a un nuevo lugar. Para ello recurren al mayor experto en transportar una vivienda de un sitio a otro:

**una Tortuga que lleva toda la vida haciéndolo.**

La situación tiene un trasfondo ecologista reconocible, pero no se plantea como una lección moral ni como el centro discursivo de la experiencia. El juego no pretende detener la acción para explicar al público infantil qué debe pensar sobre la destrucción del bosque.

El conflicto ecológico funciona como contexto.

La mudanza, las físicas, los accidentes y la personalidad imperturbable de Don Tortuga llevan el protagonismo.

El tono debe ser primeramente divertido, y luego educativo.

---

# 3. PILARES DE DISEÑO

## 3.1. La tortuga tiene que importar mecánicamente

La temática no puede sustituirse por una furgoneta, un coche o cualquier otro personaje sin cambiar sustancialmente el juego.

La Tortuga determina:

- la velocidad deliberadamente lenta;
- el caparazón curvo que sirve como plataforma física;
- la inclinación del caparazón como herramienta de equilibrio;
- la imposibilidad de detenerse completamente;
- su carácter resistente e indestructible;
- la relación entre lentitud, anticipación y compromiso con las decisiones;
- la broma narrativa de que el mejor profesional de mudanzas es alguien que siempre lleva su propia casa a cuestas.

---

## 3.2. Fácil de entender, difícil de dominar

Las reglas fundamentales deben poder comprenderse jugando.

No se plantea un tutorial textual largo ni una explicación exhaustiva previa.

El vocabulario de control es pequeño:

- avanzar un poco más rápido;
- dejar que la Tortuga avance algo más despacio;
- inclinar el caparazón;
- en el agua, nadar verticalmente.

La profundidad aparece al combinar esas pocas acciones con:

- inercia;
- peso;
- centros de gravedad;
- geometría;
- diferentes superficies;
- desniveles;
- obstáculos;
- accidentes;
- composiciones de carga cada vez más comprometidas.

---

## 3.3. Fracaso parcial antes que fracaso binario

No existe una barra de vida.

La Tortuga no muere.

La Tortuga no se rompe.

La Tortuga no queda incapacitada.

La principal unidad de pérdida es **cada objeto individual de la mudanza**.

Un mal golpe puede hacer caer un vaso sin hacer caer el sofá.

Otro puede llevarse media torre.

Otro puede no causar ningún problema.

Una partida no debe convertirse automáticamente en un desastre total por el primer error.

La física estará modulada deliberadamente para favorecer pérdidas parciales y situaciones recuperables.

---

## 3.4. El jugador debe entender por qué ha ocurrido algo

El juego puede ser caótico.

No debe ser arbitrario.

Las trampas, accidentes y cambios importantes del terreno tienen que poder leerse antes de que afecten a la Tortuga.

Después de perder un objeto, la reacción deseable es:

**«Tenía que haber frenado / acelerado / inclinado antes.»**

No:

**«¿Y cómo se suponía que iba a saberlo?»**

---

## 3.5. Física divertida antes que física realista

El sistema no pretende simular de forma rigurosa una mudanza real.

Los objetos tendrán masa, geometría y centros de gravedad coherentes, pero la respuesta final estará orientada al *game feel*.

Especialmente importante será el **grip artificial de la carga sobre el caparazón**.

Los objetos deben resultar suficientemente estables para permitir construir una partida alrededor de pequeñas correcciones, sin quedar pegados de forma artificial hasta el punto de eliminar el desafío.

---

# 4. TONO

La referencia emocional no es la violencia absurda de *Happy Wheels*, sino su capacidad para convertir un sistema de físicas relativamente sencillo en pequeñas historias emergentes.

La comedia debe proceder de cosas como:

- un objeto ridículamente delicado sobreviviendo durante medio nivel;
- un armario rodando majestuosamente montaña abajo;
- una pila inclinándose de manera imposible y recuperándose en el último momento;
- perder media mudanza y continuar como si nada;
- llegar a meta únicamente con un objeto absurdo que nadie esperaba salvar;
- atravesar una sección terrible con un vaso de cóctel todavía perfectamente vertical.

La Tortuga es estoica.

No dramatiza.

Continúa.

Esa imperturbabilidad debe funcionar como contrapunto a todo lo que sucede encima de ella.

---

# 5. STORYTELLING Y CONTEXTO

## 5.1. Premisa

Una gran corporación está destruyendo el bosque.

Sus habitantes necesitan mudarse.

Don Tortuga ofrece un servicio de transporte adaptado específicamente a las necesidades de las criaturillas del bosque.

La actividad aparentemente cotidiana de una mudanza se convierte así en una aventura física a través del propio entorno.

---

## 5.2. El ecologismo como contrapunto

La destrucción del bosque proporciona una razón comprensible para que todos los animales estén trasladando sus pertenencias.

No debe convertirse en una sucesión de mensajes pedagógicos.

La historia puede funcionar principalmente mediante:

- el propio contexto del servicio de mudanzas;
- los escenarios;
- carteles;
- elementos ambientales;
- clientes;
- destino y procedencia de las mudanzas;
- pequeños textos humorísticos.

La prioridad sigue siendo que el jugador esté deseando descubrir qué objeto absurdo conseguirá salvar en la siguiente sección.

---

## 5.3. Don Tortuga

Don Tortuga es un profesional.

Lento, pero profesional.

Su comportamiento debe comunicar seguridad y constancia.

No necesita reaccionar con terror a cada accidente. Precisamente resulta más divertido que el mundo pueda convertirse en un caos mientras él sigue avanzando con determinación hacia la derecha.

Sus animaciones pueden reflejar:

- esfuerzo;
- concentración;
- correcciones de postura;
- natación;
- pequeñas reacciones ante grandes impactos;

pero nunca sufrimiento físico.

---

# 6. MARCA: MUDANZAS TORTUGA

## 6.1. Identidad

La presentación del juego debe apropiarse del lenguaje de una empresa de mudanzas.

No se trata solamente de que el personaje haga mudanzas.

**El propio juego se presenta como el servicio.**

El título corto y reconocible es:

# MUDANZAS TORTUGA, S.L.

La denominación larga utilizada en cartelería puede ser:

### Servicio de Mudanzas de Don Tortuga para criaturillas del bosque desahuciadas

La pantalla de portada puede presentarse directamente como un cartel publicitario de la empresa.

---

## 6.2. Voz de marca

La empresa habla como un pequeño negocio local extremadamente orgulloso de un servicio objetivamente poco ortodoxo.

La voz combina:

- seguridad;
- familiaridad;
- optimismo;
- profesionalidad exagerada;
- juegos de palabras relacionados con lentitud, caparazones, cargas y hogares;
- una aceptación absoluta de que transportar un piano sobre una tortuga es una actividad empresarial razonable.

Nunca debe sonar cínica respecto a los animales que pierden su hogar.

El humor se dirige hacia:

- el propio servicio;
- Don Tortuga;
- la logística;
- las dificultades del recorrido;
- la grandilocuencia publicitaria.

---

## 6.3. Ideas de copy

### Mensajes principales

> **Te llevamos a tu nuevo hogar con la casa a cuestas.**

> **Alcanza un nuevo estilo de vida a paso firme pero seguro.**

> **Mudanzas Tortuga: lento no significa tarde.**

> **Si cabe sobre el caparazón, cabe en la mudanza.**

> **Rapidez no, lo siguiente.**

> **Especialistas en mudanzas que se hacen cuesta arriba.**

> **Su hogar está en buenas patas.**

> **Con cuidado, con cariño y con un centro de gravedad relativamente bajo.**

---

## 6.4. Filosofía del lenguaje

Los textos deben ser:

- breves;
- comprensibles;
- visualmente grandes;
- prescindibles para entender las reglas;
- capaces de funcionar como chiste incluso sin contexto adicional.

La comunicación mecánica importante no debe depender de leer un párrafo.

Las instrucciones fundamentales tienen que poder expresarse mediante:

- iconos;
- animación;
- flechas;
- señales del entorno;
- comportamiento físico.

---

## 6.5. Posible estructura de la portada

```text
╔══════════════════════════════════════════════════╗
║                                                  ║
║                 MUDANZAS TORTUGA                 ║
║                                                  ║
║        SERVICIO DE MUDANZAS DE DON TORTUGA       ║
║      PARA CRIATURILLAS DEL BOSQUE DESAHUCIADAS   ║
║                                                  ║
║      «Te llevamos a tu nuevo hogar               ║
║             con la casa a cuestas»               ║
║                                                  ║
║                    [DON TORTUGA]                  ║
║           [MONTAÑA ABSURDA DE MUEBLES]            ║
║                                                  ║
║               ► EMPEZAR MUDANZA                  ║
║                                                  ║
╚══════════════════════════════════════════════════╝
```

La portada debe parecer más un anuncio del servicio que una pantalla genérica de videojuego.

---

# 7. CORE LOOP

```mermaid
flowchart LR
    A[Leer terreno y carga] --> B[Anticipar obstáculo]
    B --> C[Regular velocidad]
    C --> D[Inclinar / estabilizar]
    D --> E[Atravesar accidente o desnivel]
    E --> F{¿Se mantiene la carga?}
    F -->|Sí| G[Continuar]
    F -->|Parcialmente| H[Perder algunos objetos]
    H --> G
    G --> A
```

En niveles diseñados:

```mermaid
flowchart LR
    A[Inicio] --> B[Transportar]
    B --> C[Superar secciones]
    C --> D[Conservar objetos]
    D --> E[Cruzar meta]
    E --> F[Tiempo + carga + bonus perfecto]
```

En Carrera Infinita:

```mermaid
flowchart LR
    A[Inicio] --> B[Superar módulo]
    B --> C[Banderín]
    C --> D[Sumar puntos de carga x multiplicador]
    D --> E{¿Quedan objetos?}
    E -->|Sí| F[Generar siguiente módulo]
    F --> B
    E -->|No| G[Fin de la run]
```

---

# 8. CONTROL DEL JUGADOR

## 8.1. Principio general

La Tortuga avanza siempre hacia la derecha.

El juego funciona como un *endless runner* lento:

- la cámara tiene un avance constante;
- la Tortuga nunca se detiene por completo;
- la Tortuga nunca retrocede por el nivel;
- el jugador modifica su velocidad relativa;
- la Tortuga dispone de una pequeña ventana horizontal dentro de la pantalla.

---

## 8.2. Controles en terreno seco

### Flecha derecha

Aumenta la velocidad de avance dentro del rango permitido.

Consecuencias:

- desplaza la Tortuga hacia la zona delantera de su ventana;
- aumenta la inercia;
- puede ayudar a colocar el caparazón debajo de una estructura que cae hacia delante;
- puede empeorar una situación si provoca un cambio brusco de aceleración.

---

### Flecha izquierda

Reduce la velocidad de avance.

No permite retroceder.

No permite detenerse completamente.

Consecuencias:

- hace que la Tortuga se desplace hacia la parte trasera de su ventana respecto a la cámara;
- permite preparar descensos;
- ayuda a compensar determinadas inclinaciones;
- una frenada brusca puede transferir movimiento a la carga.

---

### Flecha arriba

Inclina progresivamente la parte frontal del caparazón hacia arriba.

---

### Flecha abajo

Inclina progresivamente la parte frontal del caparazón hacia abajo.

---

## 8.3. Ángulo del caparazón

El ángulo máximo estará dentro de un rango aproximado de:

**30°–45°.**

El valor definitivo se decidirá durante el *tuning*.

La inclinación máxima del terreno deberá coincidir con el máximo que la Tortuga pueda compensar razonablemente.

Esto evita situaciones en las que la geometría del escenario exija una orientación que el sistema de control no puede reproducir.

---

## 8.4. Retorno y velocidad angular

La velocidad de inclinación, aceleración angular y amortiguación son parámetros de *tuning*.

El control debe ser:

- suficientemente rápido para corregir;
- suficientemente lento para impedir movimientos instantáneos;
- legible visualmente;
- compatible con el carácter pesado de Don Tortuga.

---

# 9. CONTRATO ENTRE CÁMARA Y TORTUGA

La cámara avanza horizontalmente a velocidad constante.

La Tortuga ocupa una ventana horizontal dentro de pantalla.

```text
┌─────────────────────────────────────────────────┐
│                                                 │
│      ZONA                                       │
│      TRASERA           TORTUGA        ZONA       │
│      │                    🐢          DELANTERA   │
│      ▼                                ▼          │
│   [──────────── VENTANA SEGURA ─────────────]   │
│                                                 │
└─────────────────────────────────────────────────┘
                     → cámara
```

La velocidad de Don Tortuga puede variar dentro de un rango, pero el sistema nunca debe permitir:

- quedarse atrás de la cámara;
- retroceder por el nivel;
- adelantarse indefinidamente.

Los límites deben sentirse como restricciones de velocidad, no como teletransportes o correcciones bruscas de posición.

Al aproximarse al límite trasero:

- la capacidad de seguir frenando desaparece progresivamente;
- la velocidad mínima vuelve a ser suficiente para acompañar la cámara.

Al aproximarse al límite delantero:

- la aceleración deja progresivamente de proporcionar ventaja posicional.

Esto evita *clamps* violentos que podrían transmitir impulsos artificiales a la estructura.

---

# 10. LA MUDANZA

## 10.1. Composición

Cada partida comienza con una estructura de objetos colocada de antemano sobre el caparazón.

En la versión de Game Jam existirá una única configuración inicial.

No existe una fase de construcción o colocación manual de la carga antes de empezar.

---

## 10.2. Atributos de cada objeto

Todo objeto transportable dispone de:

1. **Valor en puntos.**
2. **Peso / masa.**
3. **Centro de gravedad.**
4. **Forma visual.**
5. **Hitbox o geometría física.**

El centro de gravedad puede estar desplazado respecto al centro geométrico.

Ejemplo:

Un candelabro alto puede tener una geometría relativamente estrecha pero un centro de gravedad colocado de forma que resulte particularmente inestable.

---

## 10.3. Valor de los objetos

La regla general es:

> **A menor estabilidad y mayor dificultad de conservación, mayor puntuación.**

No se intenta representar su valor económico real.

Un sofá grande puede valer poco porque es fácil de mantener.

Un vaso de cóctel puede valer muchísimo porque sobrevivir con él supone una pequeña heroicidad logística.

El valor se ajustará mediante *playtesting*.

No necesita estar perfectamente balanceado durante la jam.

Sí debe percibirse claramente que:

**los objetos más difíciles de conservar merecen más puntos.**

---

# 11. FÍSICA DE LA CARGA

## 11.1. Grip asistido

Los objetos no utilizan una simulación completamente realista.

Existe una asistencia física que favorece que permanezcan sobre el caparazón.

El objetivo es evitar que una pequeña irregularidad desencadene sistemáticamente el colapso completo de la estructura.

El grip puede implementarse mediante la combinación que resulte más estable en el motor elegido:

- fricción;
- amortiguación;
- modificación de fuerzas;
- asistencia de contacto;
- correcciones físicas suaves.

La solución técnica concreta no forma parte de la fantasía del jugador.

Lo importante es el resultado.

---

## 11.2. Resultado deseado

Un golpe moderado debería producir:

- bamboleo;
- desplazamiento;
- correcciones necesarias;
- ocasional pérdida de uno o varios elementos.

Un golpe severo puede provocar:

- reacción en cadena;
- pérdida de una parte importante de la estructura.

No debería ocurrir de forma habitual:

- colapso total por pequeñas irregularidades;
- objetos completamente pegados;
- estructuras que se comporten como un único cuerpo rígido.

---

# 12. DEFINICIÓN DE CARGA ACTIVA

Para evitar ambigüedades físicas, la estructura se considera como una red de contactos cuyo origen es el caparazón.

Un objeto sigue perteneciendo a la mudanza mientras exista una cadena física razonable que lo conecte con el caparazón.

```text
        [VASO]
           │
        contacto
           │
        [CAJA]
           │
        contacto
           │
       CAPARAZÓN
```

El vaso no necesita tocar directamente el caparazón para seguir contando.

Pertenece a la estructura porque está apoyado sobre la caja y la caja está apoyada sobre el caparazón.

---

## 12.1. Separaciones momentáneas

No se debe declarar perdido un objeto porque durante un único instante físico deje de tocar la estructura.

Los pequeños rebotes forman parte del juego.

La implementación utilizará una pequeña tolerancia o histéresis para diferenciar:

- un objeto bamboleándose o rebotando;
- un objeto definitivamente perdido.

El valor exacto se ajustará durante el prototipo.

---

## 12.2. Objeto definitivamente perdido

Cuando el sistema determina que un objeto ha abandonado definitivamente la estructura:

- deja de poder recuperarse;
- deja de afectar físicamente a Don Tortuga;
- deja de poder bloquear el camino;
- deja de provocar tropiezos;
- deja de poder reincorporarse a la mudanza.

Puede continuar existiendo visualmente y completar su caída para conservar el efecto cómico.

Su comportamiento posterior no debe volver a modificar la partida.

---

# 13. PÉRDIDA Y FRACASO

## 13.1. Don Tortuga

Don Tortuga:

- no tiene vida;
- no recibe daño;
- no muere;
- no puede romperse;
- no puede ahogarse;
- no puede quedar atrapado permanentemente.

---

## 13.2. Objetos

Los objetos son la verdadera reserva de éxito de la partida.

Perder objetos:

- reduce la puntuación potencial;
- modifica la distribución de peso;
- puede hacer más fácil mantener el resto;
- puede alterar el comportamiento de Don Tortuga en determinados terrenos.

---

## 13.3. Filosofía de fracaso

Una mala partida debería poder terminar con:

Don Tortuga cruzando la meta perfectamente sano.

Solo.

Con toda la mudanza repartida por el bosque.

Eso sigue siendo una partida válida.

---

# 14. MODO 1 — NIVEL DISEÑADO

## 14.1. Estructura

Un nivel diseñado tiene:

- recorrido fijo;
- módulos colocados en orden fijo;
- configuración inicial de mudanza fija;
- línea de inicio;
- línea de meta;
- tiempo cronometrado;
- puntuación;
- leaderboard asociado a esa versión concreta del nivel.

---

## 14.2. Condición de finalización

La partida termina cuando Don Tortuga cruza la línea de meta.

Puede terminar el recorrido aunque no conserve ningún objeto.

En ese caso recibirá exclusivamente la parte de puntuación correspondiente al tiempo.

---

## 14.3. Objetos salvados

Un objeto se considera salvado si:

- forma parte de la estructura cuando Don Tortuga cruza;
- o ha cruzado previamente la línea de meta por sus propios medios.

Esto permite situaciones en las que un objeto salga despedido, atraviese la meta antes que Don Tortuga y aun así cuente como entregado.

---

# 15. PUNTUACIÓN DE NIVEL DISEÑADO

Sean:

- `V₀` = suma del valor de todos los objetos iniciales.
- `Vₑ` = suma del valor de los objetos salvados.
- `Tref` = tiempo de referencia del nivel.
- `t` = tiempo realizado.

---

## 15.1. Puntos por tiempo

```text
PuntosTiempo = V₀ × min(1.5, Tref / t)
```

El multiplicador temporal está limitado a `1.5`.

Esto evita que una ruta extremadamente rápida convierta el tiempo en una fuente desproporcionada de puntos.

---

## 15.2. Puntos por carga

```text
PuntosCarga = Vₑ
```

---

## 15.3. Bonus de mudanza perfecta

Si todos los objetos llegan:

```text
PerfectBonus = 0.5 × V₀
```

En cualquier otro caso:

```text
PerfectBonus = 0
```

---

## 15.4. Puntuación final

```text
PuntuaciónFinal =
round(
    PuntosTiempo
    + PuntosCarga
    + PerfectBonus
)
```

---

## 15.5. Propiedad importante de la fórmula

Abandonar deliberadamente toda la carga para correr no puede convertirse en la estrategia óptima absoluta.

Con cero objetos:

```text
Puntuación máxima =
1.5 × V₀
```

Una mudanza perfecta ya recibe:

```text
V₀ + 0.5 × V₀ =
1.5 × V₀
```

antes de añadir siquiera los puntos por tiempo.

Por tanto:

**una entrega perfecta siempre puede superar a una run que sacrifica deliberadamente toda la mudanza.**

---

## 15.6. Ejemplo

Mudanza inicial:

```text
V₀ = 2000
```

Objetos salvados:

```text
Vₑ = 1500
```

Tiempo de referencia:

```text
Tref = 120 s
```

Tiempo realizado:

```text
t = 100 s
```

Entonces:

```text
PuntosTiempo =
2000 × (120 / 100)
= 2400

PuntosCarga =
1500

PerfectBonus =
0

TOTAL =
3900
```

---

## 15.7. Leaderboard

Cada nivel diseñado tiene su propia clasificación.

Orden:

1. mayor puntuación;
2. en empate, menor tiempo.

Cada leaderboard deberá quedar asociado a una versión concreta del nivel y de sus parámetros de físicas relevantes.

Un cambio sustancial en:

- geometría;
- valores;
- físicas;
- carga inicial;

puede justificar una nueva versión de clasificación.

---

# 16. MODO 2 — CARRERA INFINITA

## 16.1. Idea general

El escenario se genera progresivamente concatenando módulos compatibles.

La run continúa mientras quede al menos un objeto perteneciente a la carga activa.

---

## 16.2. Inicio

En la versión de Game Jam existe una única configuración inicial de Don Tortuga y su mudanza.

El nivel se construye a partir de una seed.

---

## 16.3. Fin

La Carrera Infinita termina cuando:

```text
ObjetosActivos = 0
```

El tiempo se registra, pero no modifica la puntuación.

---

# 17. PUNTUACIÓN DE CARRERA INFINITA

Cada conector entre módulos contiene un banderín.

Los banderines actúan como multiplicadores crecientes.

En el banderín `n`:

```text
PuntosGanados =
n × suma(valor de objetos activos)
```

La puntuación total es acumulativa.

---

## 17.1. Fórmula

```text
Score(n) =
Score(n-1)
+
n × Σ(VobjetosActivos)
```

---

## 17.2. Ejemplo

Carga:

```text
Sofá = 100
Candelabro = 500
```

### Banderín 1

Ambos sobreviven:

```text
(100 + 500) × 1 = 600
TOTAL = 600
```

El candelabro cae.

### Banderín 2

Solo queda el sofá:

```text
100 × 2 = 200
TOTAL = 800
```

### Banderín 3

El sofá continúa:

```text
100 × 3 = 300
TOTAL = 1100
```

---

## 17.3. Filosofía

La puntuación puede crecer de forma exagerada.

Es deliberado.

La Carrera Infinita no pretende proporcionar una clasificación global perfectamente comparable entre runs generadas de forma distinta.

Su puntuación funciona principalmente como:

- récord personal;
- marcador de supervivencia;
- celebración de objetos que han conseguido aguantar mucho más de lo esperado.

---

# 18. NARRATIVA EMERGENTE DE LOS OBJETOS

Un objeto delicado que sobrevive múltiples banderines debería adquirir importancia emocional aunque carezca de cualquier historia escrita.

Ejemplo:

Un vaso de cóctel de 500 puntos que sobrevive seis módulos se convierte de manera natural en:

**«EL VASO.»**

El sistema debe favorecer este tipo de pequeñas historias.

---

# 19. SISTEMA DE BIOMAS

Existen cuatro materiales fundamentales:

| Código | Bioma |
|---|---|
| A | Agua |
| B | Hierba |
| C | Arena |
| D | Roca |

La letra representa la compatibilidad modular.

Los biomas también alteran la respuesta física de Don Tortuga y la mudanza.

---

# 20. AGUA

El agua es el bioma especial del sistema.

## 20.1. Impactos

El agua amortigua completamente las caídas importantes.

Don Tortuga puede caer desde cualquier altura al agua sin que el impacto de entrada desestabilice la mudanza de manera significativa.

---

## 20.2. Inercia

Es el terreno con mayor conservación de movimiento.

La sensación debe ser deslizante y fluida.

---

## 20.3. Flotación

Don Tortuga flota.

Puede permanecer bajo el agua indefinidamente.

No existe oxígeno ni peligro de ahogamiento.

---

## 20.4. Peso

Cuanta más carga conserva:

- mayor masa total;
- mayor profundidad alcanzada;
- mayor tiempo necesita para regresar naturalmente hacia la superficie.

---

## 20.5. Corrientes

La corriente avanza hacia la derecha.

Su fuerza aumenta con la profundidad.

Por tanto:

**conservar más carga puede dar acceso a corrientes más rápidas.**

Esto invierte temporalmente la relación habitual:

```text
MÁS PESO
   ↓
MÁS PROFUNDIDAD
   ↓
CORRIENTE MÁS FUERTE
   ↓
POSIBLE RUTA VENTAJOSA
```

---

## 20.6. Caminos alternativos

Ejemplo:

Una caída desemboca en un lago.

Tortuga ligera:

```text
entra
→ flota rápidamente
→ sale cerca de superficie
→ atraviesa colina complicada
```

Tortuga pesada:

```text
entra
→ se hunde más
→ alcanza corriente profunda
→ entra en gruta submarina
→ avanza rápidamente
```

La ruta profunda funciona como recompensa sistémica a la conservación de la carga.

---

## 20.7. Controles en agua

En agua:

- ← / → siguen regulando el avance horizontal;
- ↑ / ↓ dejan de inclinar manualmente el caparazón;
- ↑ / ↓ controlan la natación vertical.

El agua no ejerce fuerzas laterales directas sobre los objetos de la carga.

Su función principal es modificar el movimiento de Don Tortuga.

---

# 21. HIERBA

La hierba es el terreno seco más permisivo.

Características:

- impactos verticales moderados;
- impactos horizontales moderados;
- grip moderado;
- conservación de inercia moderada;
- comportamiento relativamente indulgente.

Funciona como referencia base para aprender la conducción.

---

# 22. ARENA

La arena combina amortiguación vertical con fuertes frenadas horizontales.

Características:

- caída sobre suelo relativamente amortiguada;
- choque contra pared más seco;
- grip firme;
- poca conservación de inercia;
- la carga total reduce la velocidad;
- la Tortuga se hunde visualmente ligeramente cuando transporta mucho peso.

No existen arenas movedizas.

La arena no puede utilizarse como una forma de fracaso inevitable.

---

# 23. ROCA

La roca es el material más duro.

Características:

- impactos verticales fuertes;
- impactos horizontales fuertes;
- grip firme;
- poca pérdida de tracción;
- el peso transportado no reduce la velocidad.

La dificultad procede de la transferencia de energía a la carga, no de un control resbaladizo.

---

# 24. FILOSOFÍA DE LOS BIOMAS

Los terrenos no necesitan poseer todos un gran truco.

La estructura deseada es:

**Hierba → comportamiento permisivo.**

**Arena → buena amortiguación vertical, malas colisiones laterales.**

**Roca → impactos duros y gran control.**

**Agua → excepción sistémica y pequeña sorpresa estratégica.**

El agua funciona como el *plot twist* del sistema.

No se pretende convertir cada bioma en un minijuego diferente.

---

# 25. SISTEMA MODULAR DE NIVELES

Cada módulo se comporta como una pieza de dominó.

Posee:

- bioma de entrada;
- bioma de salida;
- altura relativa de entrada;
- altura relativa de salida;
- geometría interna;
- contenido;
- posibles trampas;
- posibles elementos pertenecientes a otros biomas.

---

## 25.1. Tipos abstractos

Con cuatro biomas existen hasta dieciséis combinaciones:

```text
AA AB AC AD
BA BB BC BD
CA CB CC CD
DA DB DC DD
```

Esto representa **tipos**, no módulos individuales.

Puede haber:

- varios AB;
- cinco CC;
- ningún AD;
- dos BA;

etc.

---

# 26. REGLA DE COMPATIBILIDAD

Si un módulo termina en `C`, el siguiente debe empezar en `C`.

Ejemplo:

```text
AB → BC → CD → DA
```

es válido.

```text
AB → DD
```

no lo es.

---

## 26.1. Diagrama

```mermaid
flowchart LR
    AB[AB] --> BC[BC]
    BC --> CD[CD]
    CD --> DA[DA]
    DA --> AB
```

Una biblioteca:

```text
AB
BC
CD
DA
```

ya permitiría construir una secuencia infinita, aunque repetitiva.

Una biblioteca:

```text
AB BC CD DA
AD DC CB BA
```

permitiría muchas más combinaciones.

---

# 27. ALTURA DE LOS CONECTORES

Cada extremo del módulo posee también una altura relativa.

El siguiente módulo se desplaza verticalmente hasta que su punto de entrada coincide con la salida anterior.

```text
MÓDULO 1                       MÓDULO 2

─────────────\
              \
               ────●       ●───────
                   │       │
                   └───────┘
                    conectar
```

La altura absoluta del nivel puede cambiar indefinidamente.

El módulo no necesita construirse pensando en una coordenada global concreta.

---

# 28. ZONA HORIZONTAL DE CONEXIÓN

La zona exacta donde dos módulos se conectan será perfectamente horizontal.

Puede ser muy corta.

Solo necesita proporcionar una unión limpia.

En Carrera Infinita, el banderín se sitúa en esa zona.

---

# 29. FONDO Y PARALLAX

El fondo visual no sigue la altura acumulada de la geometría jugable.

Se mantiene colocado respecto a cámara.

Esto permite:

- reutilizar módulos a diferentes alturas;
- evitar grandes discontinuidades visuales;
- desacoplar escenario jugable y composición artística del fondo.

---

# 30. CONTENIDO INTERNO DEL MÓDULO

La pareja de biomas solo define los extremos.

Un módulo `BA` puede contener:

- hierba al inicio;
- roca;
- pequeños charcos;
- una laguna;
- arena;
- agua en la salida.

Solo importa que:

- empiece correctamente en `B`;
- termine correctamente en `A`;
- el cambio hacia el módulo siguiente resulte visualmente continuo.

---

# 31. METADATOS DE MÓDULO

Para permitir crecimiento futuro sin rediseñar el sistema, cada módulo podrá almacenar metadatos como:

- identificador;
- bioma inicial;
- bioma final;
- altura de entrada;
- altura de salida;
- dificultad estimada;
- trampas presentes;
- presencia de bifurcación;
- espacio vertical requerido;
- longitud.

Los metadatos adicionales no son necesarios para que funcione la primera versión del generador.

Sirven para que el sistema pueda escalar posteriormente.

---

# 32. CONDICIÓN DE SEGURIDAD DEL POOL INFINITO

Para poder generar indefinidamente:

> Todo bioma que pueda aparecer como salida debe disponer de al menos un módulo que empiece por ese mismo bioma.

Formalmente:

```text
Si existe X→B
debe existir al menos B→Y
```

para cualquier salida que el generador pueda seleccionar.

Esto evita callejones sin salida en la generación procedural.

---

# 33. TRAMPAS Y ACCIDENTES

Ejemplos previstos:

- ramas que sujetan bolas de piedra;
- troncos que caen al soportar peso;
- piñas que caen de árboles;
- desniveles;
- paredes;
- caídas;
- accidentes producidos por la propia geometría.

Las trampas:

- no dañan a Don Tortuga;
- no pueden matarlo;
- no pueden bloquearlo permanentemente;
- están diseñadas para desequilibrar la mudanza.

---

# 34. TELEGRAPHING

Toda amenaza relevante debe anunciarse.

El jugador debe poder:

1. verla;
2. entender qué zona afectará;
3. decidir;
4. empezar a ejecutar esa decisión.

---

## 34.1. Regla inicial para la Game Jam

Como punto de partida:

> **Toda amenaza debe ser inequívocamente legible al menos 3 segundos antes de poder impactar a Don Tortuga si éste se encuentra avanzando a su velocidad máxima permitida.**

Usar la velocidad máxima como referencia garantiza que cualquier jugador más lento disponga de igual o más tiempo.

---

## 34.2. Situaciones complejas

Si el jugador necesita además:

- elegir entre rutas;
- preparar una gran corrección;
- combinar velocidad e inclinación;

la anticipación deberá acercarse a **4 segundos o más**.

Estos valores son una base coherente de prototipo.

Deben ajustarse tras observación de jugadores.

---

## 34.3. Señales posibles

Según la trampa:

- sombra en el suelo;
- objeto visible preparando su caída;
- rama doblándose;
- línea de trayectoria;
- movimiento anticipatorio;
- partículas;
- vibración ambiental;
- composición clara del escenario.

No se debe depender exclusivamente de texto.

---

# 35. REGLA DE ORO DE LAS TRAMPAS

Una trampa puede ser difícil.

No puede ser secreta.

---

# 36. DISEÑO DE CÁMARA

La cámara utiliza zoom fijo.

No existe control manual de zoom en esta versión.

La composición debe equilibrar:

- tamaño grande de Don Tortuga;
- lectura clara de la carga;
- anticipación de accidentes;
- lectura de bifurcaciones;
- campo visual suficiente hacia la derecha.

---

## 36.1. Perspectiva

La cámara debe sentirse cercana a Don Tortuga.

No se pretende una vista panorámica del nivel.

La sensación buscada es:

**ver el mundo desde el ritmo de la Tortuga.**

---

## 36.2. Restricción de diseño

Toda geometría, trampa o bifurcación debe poder leerse con el zoom estándar.

No se diseñarán situaciones que requieran alejar la cámara.

---

# 37. DIRECCIÓN VISUAL

## 37.1. Estilo

- 2D;
- vector art;
- cartoon;
- siluetas claras;
- objetos grandes;
- formas fácilmente identificables;
- prioridad de lectura sobre detalle.

---

## 37.2. Don Tortuga

Debe ocupar una parte visual importante de la pantalla.

El caparazón debe funcionar simultáneamente como:

- elemento de personaje;
- plataforma física;
- referencia visual del equilibrio.

Su inclinación debe resultar evidente.

---

## 37.3. Los objetos

Los objetos pueden ser absurdos, variados y domésticos.

Ejemplos del vocabulario:

- sofás;
- mesas;
- cajas;
- candelabros;
- vasos;
- tartas;
- plantas;
- lámparas;
- instrumentos;
- muebles;
- cachivaches propios de criaturas del bosque.

La variedad visual puede ser mucho mayor que la variedad física.

Un objeto complejo visualmente puede utilizar una colisión sencilla.

---

# 38. FEEDBACK DE FÍSICAS

La simulación debe exagerar suficientemente:

- inclinaciones;
- bamboleos;
- pérdida progresiva del equilibrio;
- impactos;
- aterrizajes;
- recuperación.

La finalidad no es representar físicamente cada vibración.

La finalidad es permitir que un niño vea una torre y piense:

**«Eso se está cayendo hacia allí.»**

---

# 39. EXPERIENCIA INFANTIL

El juego debe poder aprenderse principalmente mediante interacción.

Principios:

- pocos botones;
- consecuencias visuales;
- ausencia de daño;
- pérdida gradual;
- reinicio sencillo;
- trampas anunciadas;
- objetos reconocibles;
- humor físico.

El jugador no necesita comprender conceptos como:

- masa;
- momento angular;
- centro de gravedad;
- fricción estática.

Debe poder comprender intuitivamente:

- «si freno de golpe, se mueve todo»;
- «si inclino hacia allí, puedo salvarlo»;
- «esa piedra va a caer»;
- «llevo demasiado peso»;
- «el vaso sigue vivo».

---

# 40. ONBOARDING

No se contempla un tratado de reglas.

La primera parte del recorrido debe enseñar mediante situaciones sencillas.

Orden conceptual:

```text
AVANZAR / FRENAR
        ↓
NOTAR INERCIA
        ↓
INCLINAR CAPARAZÓN
        ↓
CORREGIR CARGA
        ↓
VER UNA AMENAZA
        ↓
ANTICIPAR
        ↓
COMBINAR TODO
```

Las primeras secciones deberán evitar exigir simultáneamente todos los sistemas antes de que el jugador haya tenido oportunidad de experimentar con ellos.

---

# 41. SOFTLOCKS

La Tortuga siempre debe poder continuar.

Está prohibido diseñar:

- pozos sin salida;
- rocas que bloqueen permanentemente el camino;
- geometría que atrape al personaje;
- situaciones que requieran retroceder;
- trampas que exijan detenerse completamente;
- elementos caídos que puedan convertirse en un muro permanente.

Los objetos perdidos dejan de interferir con el desplazamiento precisamente para evitar estas situaciones.

---

# 42. NIVEL DE GAME JAM

La versión inicial contará con:

- un único nivel diseñado;
- una única configuración inicial de Tortuga y mudanza;
- sistema de cuatro biomas;
- suficientes módulos para producir un recorrido variado;
- sin obligación de cubrir las dieciséis combinaciones posibles;
- mínimo dos trampas o accidentes distintos;
- objetivo deseable de tres tipos de trampas;
- puntuación por tiempo;
- puntuación por carga;
- bonus de mudanza perfecta;
- leaderboard del nivel.

---

# 43. CARRERA INFINITA EN LA JAM

La Carrera Infinita se considera objetivo de implementación condicionado a que el núcleo principal quede funcionando correctamente.

Si se implementa:

- utiliza todos los módulos compatibles disponibles;
- utiliza la única configuración inicial existente;
- utiliza seed procedural;
- utiliza banderines;
- termina al perder toda la carga;
- no utiliza ranking competitivo global.

---

# 44. CONFIGURACIONES FUTURAS DE TORTUGA

Después de la Game Jam podrán existir varias configuraciones iniciales.

Cada una podrá combinar:

- una Tortuga;
- una determinada estructura inicial;
- determinados objetos;
- diferentes perfiles de dificultad.

La selección de configuración se realiza **antes de crear la seed del nivel**.

Esto permite que el generador pueda tener en cuenta la configuración escogida en futuras versiones.

---

# 45. CONTENIDO COMUNITARIO FUTURO

La arquitectura modular está concebida para evolucionar hacia:

- editor de niveles;
- niveles creados por jugadores;
- publicación y compartición;
- selección de módulos;
- colocación libre de elementos del pool general;
- leaderboards específicos por nivel.

Los niveles comunitarios no tendrán necesariamente que respetar la lógica procedural de dominó en cada elemento colocado manualmente.

La lógica de módulos sirve como estructura base, no como limitación absoluta del editor futuro.

---

# 46. MODELO DE DATOS CONCEPTUAL

## 46.1. CargoItem

```text
CargoItem
├── id
├── scoreValue
├── mass
├── centerOfMassOffset
├── collider
├── visual
└── state
```

---

## 46.2. Module

```text
Module
├── id
├── startBiome
├── endBiome
├── startHeight
├── endHeight
├── length
├── geometry
├── hazards
└── optionalMetadata
```

---

## 46.3. Biome

```text
Biome
├── horizontalGrip
├── horizontalImpactResponse
├── verticalImpactResponse
├── inertiaConservation
├── weightSpeedInfluence
└── specialBehaviour
```

---

# 47. ESTADOS CONCEPTUALES DE UN OBJETO

```mermaid
stateDiagram-v2
    [*] --> EnCarga

    EnCarga --> SeparacionTemporal: pierde conexión
    SeparacionTemporal --> EnCarga: reconecta
    SeparacionTemporal --> Perdido: supera condición de pérdida

    EnCarga --> Salvado: cruza meta
    Perdido --> Salvado: cruza meta antes del fin del nivel

    Perdido --> [*]
    Salvado --> [*]
```

La separación temporal evita que un pequeño rebote sea interpretado inmediatamente como pérdida definitiva.

---

# 48. ESTADO DEL NIVEL DISEÑADO

```mermaid
stateDiagram-v2
    [*] --> Preparado
    Preparado --> Jugando
    Jugando --> Finalizado: Tortuga cruza meta
    Finalizado --> Resultados
    Resultados --> [*]
```

No existe estado de muerte.

---

# 49. ESTADO DE CARRERA INFINITA

```mermaid
stateDiagram-v2
    [*] --> Jugando
    Jugando --> Jugando: supera banderín
    Jugando --> Fin: carga activa = 0
    Fin --> Resultados
    Resultados --> [*]
```

---

# 50. GAME FEEL

La Tortuga debe sentirse:

- pesada;
- constante;
- lenta;
- controlable;
- deliberada.

No debe sentirse:

- torpe por culpa de *input lag*;
- arbitrariamente resbaladiza;
- incapaz de responder.

La carga debe sentirse:

- físicamente independiente;
- ligeramente ayudada;
- vulnerable;
- recuperable;
- capaz de producir situaciones inesperadas.

---

# 51. PARÁMETROS DE TUNING PRINCIPALES

Los siguientes valores deberán permanecer expuestos y fáciles de modificar durante el prototipo:

### Don Tortuga

- velocidad base;
- velocidad mínima;
- velocidad máxima;
- aceleración;
- frenada;
- ancho de ventana respecto a cámara;
- velocidad angular;
- inclinación máxima;
- amortiguación angular.

### Carga

- gravedad;
- fricción;
- asistencia de grip;
- amortiguación;
- tolerancia antes de declarar pérdida;
- respuesta a impactos.

### Biomas

- fricción;
- amortiguación;
- multiplicador de impacto horizontal;
- multiplicador de impacto vertical;
- influencia del peso;
- flotación;
- intensidad de corriente.

### Diseño

- telegraph mínimo;
- velocidad de cámara;
- longitud media de módulos;
- altura máxima razonable de estructura.

---

# 52. CRITERIOS DE TUNING

Las pruebas deben buscar principalmente:

## 52.1. Pérdida parcial

¿Los errores pequeños tienden a costar uno o pocos objetos en vez de destruirlo todo?

## 52.2. Lectura

¿Puede identificarse hacia dónde está cayendo la carga?

## 52.3. Agencia

¿Una buena corrección salva realmente objetos?

## 52.4. Anticipación

¿El jugador entiende las amenazas antes del impacto?

## 52.5. Ritmo

¿La lentitud genera tensión y no aburrimiento?

## 52.6. Agua

¿Conservar carga produce una ventaja perceptible sin convertir automáticamente la ruta profunda en la única ruta correcta?

---

# 53. PRUEBAS CRÍTICAS DE GAME JAM

El primer prototipo funcional debe comprobar:

1. que una estructura de varios objetos pueda mantenerse sobre el caparazón;
2. que acelerar y frenar produzcan movimiento comprensible;
3. que inclinar el caparazón permita corregir;
4. que los objetos puedan perderse individualmente;
5. que un objeto perdido deje de bloquear a Don Tortuga;
6. que los cuatro materiales produzcan comportamientos perceptiblemente diferentes;
7. que el agua responda al peso;
8. que dos módulos puedan encadenarse con bioma y altura;
9. que las trampas puedan telegrapharse con antelación;
10. que la cámara no produzca correcciones físicas bruscas.

---

# 54. PLAN DE PRODUCCIÓN RECOMENDADO

## Fase 1 — Vertical Slice física

Solo:

- Don Tortuga;
- caparazón;
- cámara;
- varios bloques de prueba;
- aceleración;
- frenada;
- inclinación;
- pérdida de objetos.

Sin arte final.

La pregunta es:

**¿Es divertido intentar conservar una pila mientras avanzas?**

---

## Fase 2 — Biomas

Implementar:

- hierba;
- arena;
- roca;
- agua.

Comprobar diferencias.

---

## Fase 3 — Sistema modular

Implementar:

- tipo de entrada;
- tipo de salida;
- alturas;
- alineación;
- conectores horizontales;
- carga y descarga de módulos.

---

## Fase 4 — Trampas

Implementar al menos dos.

Objetivo ideal:

tres.

Priorizar trampas claramente distintas entre sí.

---

## Fase 5 — Nivel diseñado

Montar el nivel fijo de Game Jam utilizando el sistema modular.

Añadir:

- inicio;
- meta;
- cronómetro;
- puntuación;
- pantalla de resultados.

---

## Fase 6 — Presentación

Añadir:

- arte vectorial final;
- marca Mudanzas Tortuga, S.L.;
- portada;
- comunicación;
- feedback visual;
- interfaz.

---

## Fase 7 — Carrera Infinita

Solo cuando el resto se encuentre suficientemente estable.

Añadir:

- seed;
- selector procedural;
- banderines;
- multiplicador;
- condición de fin.

---

# 55. REPARTO FUNCIONAL DEL EQUIPO

La producción parte de tres fuentes principales de trabajo:

- diseño de juego y programación;
- arte y diseño gráfico;
- asistencia de agente de IA para implementación pesada, iteración y testeo.

La capacidad adicional de implementación debe utilizarse principalmente para:

- estabilizar físicas;
- automatizar pruebas;
- validar compatibilidad modular;
- detectar casos límite;
- iterar más rápidamente;

y no como justificación para multiplicar mecánicas innecesarias.

---

# 56. TESTEO AUTOMATIZABLE

El sistema modular permite pruebas especialmente útiles.

Ejemplos:

### Compatibilidad

```text
Para cada módulo:
    comprobar que startBiome y endBiome son válidos
    comprobar alturas
    comprobar conectores
```

### Pool infinito

```text
Para cada bioma de salida:
    verificar que existe al menos una entrada compatible
```

### Generación

```text
Generar secuencias largas
verificar que nunca aparece una transición incompatible
```

### Softlocks

```text
Comprobar límites de collider
comprobar que objetos perdidos no bloqueen a Tortuga
```

---

# 57. PRINCIPIOS DE PERFORMANCE

Plataforma principal:

**navegador.**

Objetivo:

- acceso directo;
- sin instalación previa;
- carga ligera;
- sin depender de librerías innecesariamente pesadas;
- físicas simples;
- hitboxes simplificadas.

El detalle visual no debe obligar a utilizar geometrías físicas complejas.

Un candelabro precioso puede seguir siendo físicamente:

```text
rectángulo + centro de gravedad desplazado
```

---

# 58. LO QUE NO ES EL JUEGO

*Mudanzas Tortuga, S.L.* no es:

- un simulador realista de mudanzas;
- un juego de construcción de torres;
- un juego de destrucción;
- un juego de supervivencia violenta;
- un juego educativo sobre ecología;
- un plataformas tradicional;
- un juego de reacción instantánea;
- un *endless runner* de velocidad.

---

# 59. LO QUE SÍ ES EL JUEGO

Es un juego sobre:

- equilibrio;
- anticipación;
- inercia;
- compromiso;
- conservación parcial;
- pequeñas catástrofes;
- objetos absurdos;
- una Tortuga que jamás deja de avanzar.

---

# 60. FUTURO DEL PROYECTO

Después de la Game Jam, el sistema queda preparado conceptualmente para crecer mediante:

- más módulos;
- más trampas;
- más objetos;
- más configuraciones de Tortuga;
- más niveles diseñados;
- editor;
- publicación comunitaria;
- leaderboards por nivel;
- reglas avanzadas de selección procedural.

El crecimiento debe producirse principalmente aumentando **contenido combinable**, no aumentando continuamente el número de botones o reglas básicas.

---

# 61. FRASE GUÍA DE PRODUCCIÓN

Cuando aparezca una nueva idea, debe poder responder favorablemente al menos a una de estas preguntas:

> ¿Hace más divertido transportar la mudanza?

> ¿Hace más interesante anticipar el terreno?

> ¿Hace más gracioso perder o salvar un objeto?

> ¿Hace que Don Tortuga sea más Don Tortuga?

Si la respuesta es no, probablemente no pertenece al núcleo del juego.

---

# 62. RESUMEN EJECUTIVO

**Mudanzas Tortuga, S.L.** es un juego 2D de físicas simplificadas para navegador protagonizado por una Tortuga que ayuda a las criaturas de un bosque amenazado a trasladar sus pertenencias.

La Tortuga avanza constantemente hacia la derecha.

El jugador regula su velocidad y la inclinación del caparazón para conservar una estructura precaria de muebles, objetos delicados y cachivaches.

El personaje es indestructible.

La verdadera medida del éxito es cuánta mudanza consigue sobrevivir.

Los recorridos utilizan módulos conectables mediante bioma y altura.

Cuatro materiales alteran el movimiento:

- agua;
- hierba;
- arena;
- roca.

El agua añade una capa estratégica especial en la que transportar más peso puede proporcionar acceso a corrientes profundas ventajosas.

Existen dos modos:

**Nivel Diseñado:** recorrido fijo, tiempo, puntuación por objetos y leaderboard.

**Carrera Infinita:** módulos procedurales, banderines multiplicadores y final únicamente cuando ya no queda ningún objeto.

La comunicación se presenta como la publicidad de un servicio de mudanzas ficticio:

# MUDANZAS TORTUGA, S.L.

### Servicio de Mudanzas de Don Tortuga para criaturillas del bosque desahuciadas.

> **Te llevamos a tu nuevo hogar con la casa a cuestas.**

El resultado debe sentirse como una comedia física amable: caos sin violencia, dificultad sin crueldad y una Tortuga absolutamente decidida a completar su trabajo aunque detrás de ella quede un bosque entero cubierto de muebles.
