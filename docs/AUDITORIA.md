# Auditoría del sistema — Cuervos de Asgard MC

Fecha: 2 de octubre de 2026 · Base auditada: v1.5.0 (`main` en f746707) · Resultado: v1.6.0
Fuente de reglas: *Cuervos de Asgard Motor Club* (Walhalla Ediciones), capítulos 2 a 7, 9 y las siete fichas pregeneradas del 10.
Método: lectura del manual y de todo el código; pruebas automáticas de cada regla; y un Foundry 13.351 aparte (mundo de pruebas con datos propios) en el que se abrieron las hojas, se ejecutaron tiradas, daño, umbrales, sesión, comunidad y el asistente de creación.

Leyenda: ✅ ya estaba bien · 🔧 corregido en 1.6.0 · ➕ automatismo añadido en 1.6.0 · ⏳ pendiente (con motivo) · ❓ decisión tuya.

---

## 1. Lo más importante

1. ✔ **El repositorio público contiene el texto íntegro del manual** en `_data/manual/manual-sections.json` (751 KB, los diez capítulos extraídos del PDF). Ningún código lo usa y el compendio «CAMC · Reglas y guía» solo lleva un resumen propio y una guía de uso, pero el fichero está en el repositorio público y en el zip de descarga. Decisión de Manu (2 oct 2026): se mantiene tal cual. Queda constancia de que es el punto de mayor riesgo con la editorial.
2. 🔧 **El capítulo 7 (comunidad) no estaba implementado.** La hoja usaba un modelo propio (censo, reputación 0-10, seis recursos) que no está en el libro. Faltaban Moral/Población/Recursos, capítulos, capacidad especial, Mesa presidencial, enemigo jurado y la tabla de sucesos. Hecho.
3. 🔧 **Los talentos eran inventados.** El libro da 21 (tres por cargo, se elige uno); el compendio traía 8 que no aparecen en él. Sustituidos, con el efecto de los que son automatizables.
4. 🔧 **Dos fallos de cálculo que el jugador notaba**: gastar proezas hasta quedarse en 3 las volvía a llenar, y la Salud máxima de un PJ creado a mano no dependía de la FUE (se quedaba en 14).
5. 🔧 **Las penalizaciones de armadura y escudo estaban calculadas pero no se aplicaban nunca.**
6. ⏳ **Las cinco hojas siguen en ApplicationV1**, que Foundry retira en la v16. Es un proyecto aparte (véase §7).

## 2. Reglas del manual: estado capítulo a capítulo

### Cap. 3 — Creación y progresión

| Regla | Antes | Ahora |
|---|---|---|
| Atributos 0, +1, +2, +4, +6 sin repetir | ✅ (selector con intercambio) | ✅ + validación en el asistente |
| Habilidades 4×3D, 8×2D, 12×1D | ✅ solo en el generador | ✅ + validación en el asistente |
| Valores pasivos (Agilidad, Evasión, Aplomo, Perspicacia) | ✅ | ✅ |
| Agilidad + nivel del escudo | ✅ | ✅ |
| Iniciativa = DES + INT (+ modificaciones de moto) | ✅ | ✅ |
| Resistencia Física = 12 − FUE | ✅ | ✅ |
| Proezas = (FUE + INT)/2 + 3 | 🔧 se llenaban solas al gastar | ✅ máximo siempre calculado; gastar no rellena |
| Salud = FUE×2 + 10 + 1D | 🔧 no se recalculaba a mano | ✅ tirada guardada en la ficha |
| Habilidades favorecidas del cargo (+3) | 🔧 Vicepresidente mal | ✅ fijas + libres según cargo |
| Talento: uno de tres por cargo | 🔧 inventados | ✅ 21 del libro |
| Un don por deidad, con su Virtud | ✅ (Odín excluido a propósito) | ✅ |
| Reputación 1-10, rangos, de medio en medio punto | ⏳ solo un número | ➕ rangos, medio punto, aviso de Moral |
| Faltas (3) y castigo de la deidad | ⏳ solo un número | ➕ aviso al DJ al llegar a tres (el castigo lo decide el DJ) |
| Experiencia: 5 / 10 PX por dado, atributo = nuevo valor × 3 | ⏳ solo un contador | ➕ botón «Mejorar» con los costes |
| Aprendizaje con maestro (1D semanas/meses + tirada contra Perspicacia) | ⏳ | ⏳ es narrativo y de tiempo de juego; no se automatiza |
| Equipo inicial por cargo | 🔧 el generador daba armas y armadura al azar iguales para todos | ✅ por cargo (armadura, escudo, raciones, objetos, arma de fuego del Sargento) |
| Pregenerados | 🔧 faltaban deidad, don, talento, favoritas, mods de moto | ✅ según sus fichas |

Nota sobre los pregenerados: la ficha impresa de Munin marca *Información* como favorecida en lugar de *Intimidación* (el Sargento de armas tiene Atletismo, Intimidación, Lucha y Puntería). El sistema ya traía la correcta.

### Cap. 4 — Motor de juego

| Regla | Antes | Ahora |
|---|---|---|
| Tirada 1-3D + atributo (+3 favorecida) | ✅ | ✅ |
| Crítico (2 seises) con proeza ganada; pifia | ✅ | ✅ (Leer el terreno y Urbanita: crítico con un 6) |
| Dificultades 5-25; sin luz +5 | ⏳ el +5 no existía | ➕ casilla «Sin luz» en las habilidades afectadas |
| Acciones combinadas (+2 por colaborador, máx. +10) | ⏳ | ➕ campo «Colaboradores» |
| Ayudar (prestar 1D) | ⏳ | ⏳ se hace con «Dados extra» (−1/+1) a mano; son dos tiradas de dos jugadores distintos |
| Recuerdo cuando… (+2D, incompatible con proezas) | ✅ una casilla | 🔧 contador (dos con Pozo de sabiduría) y reinicio por aventura |
| Defecto grave (−1D, +1 proeza) / leve (1 por sesión) | ✅ | ✅ (+ reinicio del leve en «Nueva sesión») |
| Proezas: repetir dados, +1D, subir pasivos | ✅ | ✅ |
| Proezas: +1D al daño que explota (máx. 2/3) | ⏳ | ➕ botón en la tarjeta de daño |
| Proezas: anular un crítico enemigo | ⏳ | ⏳ el DJ tira por los PNJ solo en combate; se deja a mano |
| Ganar proezas (defecto, crítico, interpretación, Inspirar) | ✅ salvo Inspirar | ➕ Inspirar da la proeza a los compañeros |
| Iniciativa 1D + valor; desempate; 6 = acción extra | ⏳ solo la tirada | ➕ desempate y aviso de acción extra |
| Cogido por sorpresa | ⏳ | ⏳ es una condición que decide el DJ en la escena; Curtido en mil batallas es solo texto |
| Atacar: daño fijo + atributo; crítico ×2 | ✅ | ✅ |
| Apuntar (+1D / +2D sin explotar) | ⏳ el campo existía pero no sumaba | ➕ |
| Noquear (−1D, mitad de daño, RF con −1D) | ⏳ | ➕ (la tirada de RF del objetivo la hace el DJ) |
| Ráfagas (+2 por blanco, sin bono PER, 1D cargador) | ⏳ | ➕ dificultad, daño y cargador (un cartucho por blanco: el libro no da cifra) |
| Cobertura +3 / +6 | ⏳ | ➕ |
| Explosivos 20/40 con reducción por metro | ⏳ | ⏳ el daño base está en el arma; el descenso por distancia es manual |
| Defensa completa, Inmovilizar, Zafarse, Huir | ⏳ | ⏳ acciones del combate sin tirada propia de daño; las tiradas se hacen con las habilidades normales |
| Otras fuentes de daño (asfixia, caídas, hambre, venenos…) | ⏳ | ⏳ se aplican con el botón de Salud; candidatas a una «ficha de peligros» |
| Salud: −1D por debajo de 7, −2D por debajo de 4 | ✅ | ✅ |
| Resistencia Física al bajar de 11, 7, 4, 2 (una vez por partida) | ⏳ a mano | ➕ automática, con desmayo y reinicio en «Nueva sesión» |
| Armadura: resta nivel al daño; penaliza a DES y FUE (mitad del nivel); escudo suma a Agilidad y penaliza | 🔧 la penalización no se aplicaba | ✅ aplicada y visible; piezas compatibles apiladas; kevlar solo vs. fuego |
| Curación (Auxilio 10: 2/4/−1; Curandero) | ✅ sin Curandero | ✅ |
| Curación por descanso (2/día, medicinas, +1 si FUE 4/6) | ⏳ | ⏳ es tiempo de juego entre sesiones; sin automatizar |
| Persecuciones: franjas, terreno, visibilidad, movimiento | ✅ parcial | ✅ |
| Persecuciones: maniobras | 🔧 4 con modificadores mal, faltaban 5 | ✅ las 8 + Arrollar y Cargar |
| Persecuciones: tablero de franjas y daño automático a la Estructura | ⏳ | ⏳ ver §5 |

### Cap. 5 — Equipo

| Regla | Antes | Ahora |
|---|---|---|
| Carga: 6 a pie, +8 alforjas, grande 2 / mediano 1 / pequeño ½ | ✅ | ✅ |
| Tabla de objetos del manual | 🔧 10 sobraban, faltaban 19 | ✅ 30 |
| Tablas de armas, armaduras, vehículos | ✅ (coinciden con el libro) | ✅ |
| Caducidad de objetos reciclados | ⏳ botón suelto en la ficha del objeto | ➕ en «Fin de aventura», con estado «averiado/roto» y repetición con Recursos 3 |
| Búsqueda de equipo (Supervivencia) y disponibilidad | ⏳ | ⏳ es narrativo |
| Tuneado de motos: 2 funcionales (3 con sidecar), tirada de Mecánica 15 / 12 | ✅ | ✅; efectos numéricos en una sola tabla (`vehicle-mods.mjs`) |

### Cap. 6 — El MC

| Regla | Antes | Ahora |
|---|---|---|
| Reputación inicial 6, rangos y su efecto en la Moral | ⏳ | ➕ |
| Tabla de ganancias y pérdidas de Reputación | ⏳ | ⏳ es criterio del DJ; candidata a una ayuda en pantalla |
| Estructura de Mesa presidencial, prospects, tradiciones | ⏳ | ⏳ ambientación |

### Cap. 7 — Comunidad

| Regla | Antes | Ahora |
|---|---|---|
| Moral, Población, Recursos (0-3 / 0-4 / 0-3, 4 en el Oeste) | ⏳ modelo inventado | 🔧 |
| Cinco capítulos y su capacidad especial | ⏳ | 🔧 |
| Reparto inicial de 6 puntos | ⏳ | 🔧 con validación |
| Efectos de cada nivel y en cascada (XP, Población, castigo de Moral) | ⏳ | ➕ |
| Moral 3 / castigo → ±1 proeza por sesión | ⏳ | ➕ «Nueva sesión» |
| Mesa presidencial, enemigo jurado, diario | ⏳ | 🔧 |
| Tabla D66 (36 sucesos), cargo responsable por 1D, salvación 18/14 | ⏳ | ➕ |

### Cap. 9 — Bestiario

Comprobadas por muestreo contra el libro (bandidos, carroñeros y las reglas especiales de cada criatura); coinciden en atributos, pasivos, Salud y Resistencia Física. 🔧 Se añadió que draugar, einherjar, espectros y esqueletos no sufren penalizadores y que los de Resistencia Física «N/A» no tiran. ⏳ Los ataques de los PNJ siguen siendo texto en la ficha, no objetos de arma.

## 3. Contenido (compendios) frente al manual

| Compendio | Estado |
|---|---|
| Armas (13), armaduras y escudos (12), vehículos (10), dones (7) | ✅ coinciden con las tablas del libro |
| Objetos | 🔧 sustituidos por los 30 del libro (más las 15 modificaciones de moto) |
| Talentos | 🔧 21 del libro |
| Modificaciones de moto | ✅ 15 funcionales + 20 estéticas |
| Pregenerados | 🔧 ver §2 |
| Bestiario | ✅ + banderas de la §2 |
| Manual («Reglas y guía») | ✅ solo resumen propio y guía de uso (el texto íntegro está aparte, ver §1) |

Las versiones anteriores ya habían retirado dones y modificaciones inventados; el importador ahora retira también los talentos y objetos sobrantes (por nombre, solo los importados por el sistema).

## 4. Fallos y riesgos técnicos encontrados

| Hallazgo | Estado |
|---|---|
| Proezas se rellenan al gastar hasta el máximo antiguo guardado | 🔧 |
| Salud máxima fija en 14 en PJ creados a mano | 🔧 |
| Penalización de armadura/escudo sin efecto | 🔧 |
| Una repetición con proeza que acierta no calculaba el daño | 🔧 |
| Tres copias de la misma regla de moto (hoja de PJ, de moto, validación) con nombres escritos a mano | 🔧 una tabla compartida |
| Talentos y dones duplicados dentro del generador (se desfasaban de `_data`) | 🔧 catálogo único |
| Dos diálogos de tirada casi idénticos (hoja y moto) | 🔧 uno solo |
| El escudo usa `equipado` y el resto de objetos `equipada` | ⏳ funciona; unificarlo exige migrar documentos existentes |
| El importador **sobrescribía** los objetos del mundo cada vez que subía la versión de contenido | 🔧 ya no pisa nada; solo crea lo que falta (reposición con la macro «Reimportar contenido») |
| El importador escribía en los compendios del sistema en cada arranque de DJ | 🔧 los compendios se compilan al publicar |
| `packs/` en git (binarios LevelDB que cambian con cada apertura de Foundry) | 🔧 fuera de git, compilados con `npm run build` |
| El zip de publicación incluía `docs/` (9 MB de capturas) | 🔧 excluido |
| `assets/patches` pesa 48 MB (PNG de unos 2 MB cada parche) | ⏳ convertir a WebP bajaría el sistema a unos 30 MB; requiere revisión visual |
| `styles/cuervos-de-asgard.css`: 6.400 líneas con capas de `!important` y selectores repetidos | ⏳ riesgo de mantenimiento, no de funcionamiento |
| Metadatos: `verified: 13.351`, V14 sin probar | ⏳ la regresión real en V14 sigue pendiente (`docs/compatibility.md`) |
| Sin `LICENSE` en el repositorio | 🔧 MIT |

## 5. Automatismos: qué se podía automatizar y qué falta

**Ya estaban**: tiradas, valores derivados, daño por arma, munición, penalizador por Salud, curación con Auxilio, carga, efectos de modificaciones de moto, defectos y proezas, generadores, importador.

**Añadidos en 1.6.0**: Resistencia Física automática; protecciones aplicadas; apuntar, noquear, combinados, cobertura, ráfagas, sin luz; proezas en el daño; iniciativa con desempate; talentos con efecto; Nueva sesión y Fin de aventura; caducidad; comunidad completa con sucesos; reputación, faltas, experiencia; creación guiada; memoria de ventanas.

**Pendientes, por orden de rentabilidad**:
1. **Tablero de persecución** (diez franjas, posición de cada participante, orden de iniciativa, daño a la Estructura de los choques). Es el mayor hueco mecánico; necesita una ventana propia.
2. **Ficha de peligros** (caídas por metro, quemaduras, asfixia, hambre y sed por horas, venenos con POT, explosivos con descenso por distancia): una lista de botones que aplica el daño y avisa de la tirada.
3. **Combate**: sorpresa, Defensa completa (+1D y subir en iniciativa), Inmovilizar/Zafarse, Huir con ataque de oportunidad, Digno del Valhalla (dos acciones antes de morir), Estratega.
4. **Dones**: coste en proezas con límite «por combate» (hoy se paga cada vez), Furia de la tormenta que ignora protección y reparte 10/20, Destello cegador y Azote del enemigo con efecto en el objetivo.
5. **Tabla de reputación** como ayuda: elegir pilar y gravedad y aplicar el cambio.
6. **Bestiario**: armas de los PNJ como objetos para que el daño y la munición funcionen como en los PJ.
7. **Descanso y curación** por tiempo de juego.

## 6. Usabilidad

Comprobado en Foundry 13.351: hoja de PJ (resumen y combate), diálogo de tirada, tarjeta de chat con daño y botón de proezas, hoja de comunidad, hoja de moto (pestaña de persecución), ficha de talento, asistente de creación, «Nueva sesión» y suceso de comunidad. No aparecieron errores de consola.

- Ahora el jugador no tiene que recordar reglas sueltas: el diálogo muestra la penalización de armadura, la tarjeta cita cada modificador y la tarjeta de comunidad dice qué cargo tira, qué habilidad y a qué dificultad.
- La creación sigue el orden del libro y no deja avanzar con un reparto inválido.
- Puntos débiles que quedan: la hoja de PJ es densa; las acciones frecuentes de combate (iniciativa, resistencia) están en el pie y no junto a la Salud; los textos de ayuda del menú contextual están sin tildes en varios sitios.
- No se revisaron una por una todas las pestañas de PNJ, objeto y chaleco; la calibración del chaleco sigue siendo exclusiva del DJ.

## 7. «Mejoras de siempre» frente a este sistema

| Mejora | Estado |
|---|---|
| Capa de compatibilidad V13/V14 | ✅ (1.5.0) |
| Formulario de incidencias, página del proyecto | ✅ (1.5.0) |
| Pruebas automáticas y comprobación en cada subida | ➕ `npm test`, `npm run check`, flujo «Comprobar»; la publicación las exige |
| Reglas en funciones puras que citan el libro | ➕ `module/rules/` |
| Ventanas con memoria | ➕ en las hojas actuales (V1) |
| Asistente de creación paso a paso | ➕ |
| Una sola fuente de datos (`_data`) para generadores e importador | ➕ catálogo |
| Hojas en ApplicationV2 | ➕ Comunidad; ⏳ Personaje, PNJ, Moto, Objeto y los diálogos siguen en V1 |
| DataModels en lugar de `template.json` | ⏳ |
| Compendios compilados al publicar (`packs/` fuera de git) | ➕ |
| Accesibilidad de lectura (icono en la cabecera) | ➕ tamaño, contraste, lectura fácil, menos animaciones; ⏳ ajuste fino del contraste hoja a hoja |

Por qué no se migró a V2 ni a DataModels en esta ronda: son cambios que rehacen las cinco hojas (unas 2.200 líneas de JavaScript y 220 KB de CSS escritos para el DOM de V1) y el esquema de datos de todos los mundos existentes. Hacerlo sin que veas el resultado de cada hoja sería arriesgado. Propuesta: una hoja por entrega, empezando por Comunidad (la más sencilla y ya reescrita), con migración de datos probada sobre una copia de un mundo real.

## 8. Decisiones (respondidas el 2 de octubre de 2026)

1. Texto íntegro del manual: se mantiene.
2. Importador: ya no sobrescribe lo editado en el mundo.
3. `packs/` fuera de git y compilados al publicar.
4. Licencia MIT.
5. Armaduras compatibles: confirmada la lectura (se suman a la mejor armadura).
6. Migración a V2: empezada por la hoja de Comunidad. Siguiente propuesta: Objeto, Moto, PNJ y Personaje, por ese orden.
