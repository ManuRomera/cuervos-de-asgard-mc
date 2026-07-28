# Historial de cambios — Cuervos de Asgard Motor Club para Foundry VTT

Todos los cambios relevantes de este proyecto se documentan en este archivo.

## [1.4.4] — 2026-07-28

### Corregido
- Refuerzo "a machete" del fondo oscuro y el texto claro en Personaje, PNJ y Objetos: este archivo CSS tiene muchísimos bloques duplicados de rondas de diseño anteriores (fondos y colores repetidos con `!important` a distinta especificidad), y los parches selector-a-selector de las versiones 1.4.0 a 1.4.3 no siempre ganaban la cascada frente a esos duplicados. En vez de perseguir cada selector suelto otra vez, se sube deliberadamente la especificidad (repitiendo la clase de la ficha) para ganar de forma garantizada a cualquier combinación de 2-3 clases que quedara sin cubrir, tanto en fondos como en color de texto e inputs.

### Nota
- Si tras esta versión sigue habiendo texto o fondo que no coincide con lo esperado, lo más probable es que haya algo en la cadena de estilos (posiblemente del propio Foundry, no de este sistema) que no se puede diagnosticar más sin inspeccionar el elemento en vivo (clic derecho → Inspeccionar, en el navegador o en Foundry si tiene DevTools habilitado) y ver qué regla concreta está ganando.

## [1.4.3] — 2026-07-28

### Corregido
- Las tarjetas de Salud/Proezas/Resistencia física/Iniciativa de la cabecera de Personaje se habían quedado sin corregir en la v1.4.2 (solo se arreglaron los paneles de las pestañas): seguían usando la textura de pergamino de siempre. Corregido.
- El pie de página (Reputación/Faltas/PX) también tenía esa misma textura suelta; corregido.
- Varias etiquetas de campo (p. ej. "Entorno de nacimiento") se leían en tinta oscura sobre el fondo ya oscuro, prácticamente invisibles; corregido el color de las etiquetas en general.

### Cambiado
- **La ficha de PNJ y la de objetos (armas, armaduras, dones, talentos, vehículos...) reciben ahora el mismo tratamiento oscuro que la de Personaje**: sin fondos de pergamino ni texturas, texto e iconos en claro, conservando el acento de color que ya tenían (deidad en PNJ, color por tipo de objeto en la ficha de objetos).

### Nota técnica
- En modo de retrato "standee" del PNJ, se ha excluido a propósito el refuerzo de `display:flex` que se añadió en la v1.4.1 para el redimensionado vertical: ese modo depende de un posicionamiento absoluto ya delicado (con varias reglas superpuestas de antes de esta serie de cambios) y es la sospecha más probable de por qué el retrato dejaba de verse en ese modo. En modo de retrato enmarcado el refuerzo se mantiene.
- Este es el tercer ajuste seguido sobre el mismo cambio de fondo; si algo se sigue viendo distinto a lo esperado en PNJ u objetos (menos probado que Personaje, al ser la primera vez que se les aplica este tratamiento), lo mejor es una captura concreta de qué falla.

## [1.4.2] — 2026-07-28

### Corregido
- **Fondo real unificado en la ficha de Personaje**, tras ver que la v1.4.1 seguía sin parecerse al diseño acordado: se quita el fondo de pergamino de todos los paneles internos (Armas, Protección, Dones, etc.), que ahora quedan sin fondo propio sobre el degradado oscuro de la ficha, con el texto en color hueso/claro en vez de tinta oscura. El acento de color de la deidad patrona se conserva donde ya estaba (pestañas, botones de acción, dados activos).
- Se elimina el adorno decorativo de "lomo" en el borde izquierdo de la ficha de Personaje (una franja con un patrón entretejido en tono papel claro): con el fondo ya oscuro no encajaba y el hueco que reservaba tampoco hacía falta.
- Se corrigen varios iconos que se habían quedado invisibles (color de tinta oscura fijo sobre fondo ahora oscuro): equipar, editar, borrar, favorito, crear objeto, usar don, cambiar imagen.
- **Nota:** este ajuste se limita a la ficha de Personaje; la de PNJ mantiene su pergamino claro de siempre (no se ha tocado en esta vuelta).

## [1.4.1] — 2026-07-28

### Corregido
- El cuerpo de la ficha de Personaje (el área de las pestañas) se había quedado con el fondo de pergamino claro de siempre, mientras que solo la cabecera pasó al cromo oscuro del rediseño de la v1.4.0; el resultado no se parecía a la maqueta aprobada. Ahora el cuerpo de la ficha usa el mismo cromo oscuro, y cada panel se muestra como una tarjeta de pergamino independiente encima (que es como se veía en la maqueta), no al revés.
- En la pestaña Habilidades, el selector de atributo (DES/FUE/INT/PER/CAR) se quedaba sin sitio en el diseño de 3 columnas y se solapaba con los rombos de dado. Se han reajustado los anchos de columna para que quepan los dos sin pisarse.
- La casilla de especialización de "Idioma mítico" se apretujaba junto al selector de atributo, rompiendo la alineación del resto de habilidades; ahora aparece en su propia línea, debajo del nombre de la habilidad, sin descuadrar las demás filas.
- El selector de atributo de cada habilidad se podía cambiar libremente en cualquier momento; ahora respeta el mismo candado que ya usan los rombos de dado (el botón de llave inglesa de la pestaña Habilidades): bloqueado por defecto, editable solo si se desbloquea.
- La ficha de PNJ no se dejaba encoger en vertical y no aparecía barra de scroll al intentarlo. La causa real: en modo de retrato "standee", una regla existente ponía `overflow:visible` en toda la ventana (necesario para que el retrato pudiera sobresalir por el lateral), pero eso también anulaba el recorte vertical que permite que el contenido de la pestaña activa haga scroll. Ahora ese `overflow:visible` solo se aplica al eje horizontal; el vertical seguía necesitando recorte para poder encoger y hacer scroll. Además se añade a la ficha de PNJ el mismo refuerzo de altura (`height:100%` / `min-height:0` en cascada) que ya tenía la de Personaje, que no se había replicado nunca para PNJ.

## [1.4.0] — 2026-07-28

### Cambiado
- **Primera pasada del rediseño visual de la ficha de Personaje y PNJ**, tras varias rondas de maqueta aprobadas: cabecera de Personaje más compacta y con acabado de cromo oscuro (remaches, franja de "cinta de peligro", textura de cuero) en vez del banner de pergamino anterior; paneles y filas de armas/protección/habilidades más densos (menos relleno, texto más pequeño) para aprovechar mejor el espacio; pestaña de Habilidades en 3 columnas (convención habitual de Ysystem) en vez de 1; los dados de habilidad pasan a mostrarse como rombos en lugar de cuadrados. Se añade un divisor rúnico decorativo a la ficha de Personaje (la de PNJ ya tenía uno). El acento de color de la deidad patrona se refuerza en la cabecera y en el panel de Dones.
- La ficha de PNJ mantiene su fondo de pergamino claro ya existente (no se le aplica el cromo oscuro del Personaje: no había ninguna maqueta de PNJ revisada para ese cambio); recibe la misma pasada de densidad en paneles y filas.

### Añadido
- La ficha de PNJ ahora muestra la penalización por Salud (p. ej. "-1D por Salud 4-6"), con los mismos colores de aviso que ya tenía la ficha de Personaje. El dato ya se calculaba (`getPenalizadorSalud()`) pero no se mostraba en ningún sitio de la ficha de PNJ.

### Nota técnica
- Este cambio se ha implementado casi por completo en CSS (más una línea de contexto y una de plantilla para el aviso de Salud del PNJ), reutilizando exactamente los mismos nombres de clase de los que dependen los manejadores de clic ya existentes (`.skill-die`, `.item-equip`, `.roll-unarmed`, `.item-primary-action`, `.mount-*`, `.vest-*`, etc.) para no romper ninguna de las correcciones de las versiones 1.3.31 a 1.3.37. No se ha tocado el redimensionado de la ventana (ya soportaba ancho y alto, con scroll interno propio en `.camc-body`), ni el interruptor de retrato enmarcado/standee (ajuste ya existente del sistema), ni el chaleco de parches, ni la vinculación de moto.

## [1.3.37] — 2026-07-28

### Añadido
- "Desarmado" ahora se puede pulsar en la pestaña de Combate (y en el panel de equipo activo del Resumen) de la ficha de Personaje, y en el panel de Armas de la ficha de PNJ cuando no lleva ninguna: se comporta como un arma más (tirada de Lucha, con su propio diálogo de dificultad/proezas en el caso del PJ), pero con sus propias reglas de daño (1 + FUE/2, ya implementadas y ahora también mostradas correctamente en la ficha en vez del "1" fijo que aparecía antes).

### Eliminado
- Se retira el botón "Tiradas iniciales" de la ficha de Personaje: ya no aporta nada porque el generador de personajes calcula y tira automáticamente la Salud y las Proezas iniciales al crear el PJ, y las Proezas máximas siempre se recalculan solas a partir de FUE e INT. Para un PJ creado a mano, la Salud máxima se puede seguir ajustando directamente en su propio campo numérico de la ficha.

## [1.3.36] — 2026-07-28

### Añadido
- El generador aleatorio de PNJ ahora reparte equipo de verdad (armas, armaduras, escudos y objetos varios) en vez de dejar siempre al PNJ sin nada. La probabilidad y calidad del equipo dependen de la dificultad elegida (menor/normal/duro/élite): un PNJ menor puede perfectamente venir desarmado y sin protección, mientras que uno de élite casi siempre viene armado, protegido con una armadura de nivel alto y, a veces, con escudo y un arma secundaria. Se han añadido también tres armas nuevas al reparto (bate con clavos, machete de matarife, escopeta recortada) para variar más el resultado.
- Se ha añadido un panel de "Objetos" a la ficha de PNJ (junto a Armas, Protección y Dones/rasgos), que antes no existía aunque el propio código ya agrupaba los objetos por tipo; ahora los objetos que trae un PNJ generado (o que se le añadan a mano) se pueden ver y editar desde la ficha.

### Corregido
- El equipo generado para un PNJ se aplicaba con `actor.update()` pero nunca se creaban los ítems correspondientes (`delete data.items` los descartaba sin más); ahora se crean de verdad como ítems del Actor, igual que ya ocurre con los PJ generados.

## [1.3.35] — 2026-07-28

### Corregido
- El fallo de la versión 1.3.33 (armadura/escudo recién equipado sin protección hasta desmarcar y volver a marcar la casilla) seguía dándose en los PJ creados con el generador de personajes, aunque `#calcularProteccion()` ya calculaba bien el nivel a partir del ítem equipado. La causa real estaba en el orden de la creación en lote: al generar un PJ, el sistema crea de golpe todos sus objetos iniciales (incluida la armadura de serie, ya marcada como "equipada") con `createEmbeddedDocuments`, y en ese camino concreto de creación masiva Foundry no siempre vuelve a preparar los datos derivados del Actor (incluida la protección) antes de que la ficha se dibuje por primera vez. El siguiente cambio manual sobre cualquier ítem (como desmarcar/marcar la armadura) sí disparaba ese recálculo y "arreglaba" la protección, dando la falsa impresión de que había que tocar la casilla. Ahora, justo después de crear el equipo inicial del PJ generado, se fuerza explícitamente un recálculo de los datos derivados del Actor antes de dibujar la ficha, así que la protección de la armadura o el escudo de serie aparece correcta desde el primer render, sin tener que tocar nada.
- Los iconos de las filas de objetos (equipar, editar, borrar, tirar dado, etc.) prácticamente no se veían en la ficha de PNJ: el color de fondo oscuro de esos botones y el color casi negro forzado para el icono (pensados para funcionar juntos en un botón claro) solo tenían su contraste corregido para la ficha de Personaje (clase `.camc-character`), y nunca se había extendido esa corrección a la ficha de PNJ (clase `.camc-npc`), que se quedaba con la combinación oscuro-sobre-oscuro. Se ha añadido en el CSS la misma corrección de contraste (fondo claro, icono oscuro) también para `.camc-npc`, en los mismos puntos donde ya existía para `.camc-character`, así que ahora los botones de las filas de armas, protecciones, dones, etc. se ven igual de bien en ambas fichas.

## [1.3.34] — 2026-07-28

### Añadido
- Retrato genérico por defecto para PJ y PNJ, en vez del icono estándar de Foundry ("mystery man"), hasta que se le ponga a cada uno su imagen definitiva. Se aplica en dos casos: al crear un Personaje o un PNJ en blanco desde la barra lateral, y al generar uno con el asistente del sistema. Solo sustituye la imagen si el actor no tenía ya una propia (para no pisar un retrato elegido a mano, uno duplicado o el de un PJ/PNJ concreto ya generado).

## [1.3.33] — 2026-07-27

### Corregido
- Una armadura o escudo recién equipado (por ejemplo, el que trae de serie un PJ recién hecho con el generador) podía no aplicar su protección hasta desmarcar y volver a marcar la casilla "equipada" en la ficha. `#calcularProteccion()` calculaba el nivel de protección con `arma_equipada?.nivel ?? valor_anterior_ya_guardado ?? 0`: si el ítem recién creado aún no tenía su nivel resuelto en ese instante concreto, la fórmula caía al valor anterior (0 para un PJ nuevo) en vez de al nivel real del arma. Ahora, si hay una armadura o escudo equipado, su nivel se calcula siempre directamente desde ese ítem (con el mismo valor por defecto que ya usa la ficha del objeto), sin depender de un cálculo anterior. Si no hay nada equipado, se sigue respetando el valor ya guardado en la ficha (necesario para los PNJ del bestiario, que tienen su protección anotada directamente sin un ítem de armadura de por medio).

## [1.3.32] — 2026-07-27

### Corregido
- **Los compendios del sistema (armas, protecciones, dones, talentos, objetos, modificaciones de moto, parches, vehículos, motos y personajes pregenerados) llevaban congelados desde muy al principio del proyecto (versión de contenido 1.6.3), sin recibir ninguna de las correcciones aplicadas en las versiones 1.3.21 a 1.3.31.** Esto no dependía de nada de lo que se tocó en esa ronda de arreglos: los compendios que se guardan en el propio paquete del sistema (`packs/`) nunca se habían vuelto a generar desde entonces, así que cualquiera que instalase o actualizase el sistema recibía compendios con los dones inventados, el bestiario duplicado, el daño de armas antiguo, etc. — y, en concreto, con las imágenes e iconos de esa época, distintos a los que ya llevaba tiempo usando el resto del sistema. El sistema seguía «autocurándose» en cada partida ya abierta gracias a la sincronización en marcha del importador, pero los propios compendios base del paquete, tal cual se descargan, se habían quedado atrás.
- Se han regenerado los 11 compendios de objetos/actores directamente a partir de los archivos `_data/*.json` actuales (con la herramienta oficial `@foundryvtt/foundryvtt-cli`), de modo que el paquete que se descarga o instala como actualización ya incluye, desde el primer arranque, todos los arreglos de esta serie de versiones: los 7 dones reales (con sus imágenes correctas), las 15 modificaciones de moto reales, el bestiario sin duplicados y con las estadísticas corregidas, el daño de armas correcto, las armaduras corregidas y las fichas completas de los 7 PJ pregenerados.
- Se ha verificado uno por uno el contenido de los 11 compendios regenerados (nombres, número de documentos, imágenes, atributos) contra los archivos de datos actuales antes de publicar esta versión.

**Nota técnica:** el proyecto no tenía ningún proceso para mantener los compendios (`packs/`) sincronizados con los datos fuente (`_data/*.json`); se generaron una vez al principio y nunca se habían vuelto a compilar. Sería recomendable añadir un script de compilación (con `@foundryvtt/foundryvtt-cli`) que se ejecute antes de cada release para que esto no se repita.

## [1.3.31] — 2026-07-27

### Añadido
- Los 7 PJ pregenerados del capítulo 10 del manual (Leon, Thomas, Absenta, Benzina, Munin, Bomani, Managarm) solo traían su biografía; ahora tienen también sus atributos, sus 24 habilidades (repartidas en 4×3D/8×2D/12×1D), su equipo (armas y armaduras) y, donde se pudo confirmar, su deidad patrona y su don. El resto de valores (Agilidad, Evasión, Aplomo, Perspicacia, Proezas, Salud, Resistencia Física, Iniciativa) no hace falta guardarlos: la ficha de PJ ya los recalcula automáticamente a partir de esos datos, y se ha verificado uno a uno que el resultado coincide exactamente con la ficha real del manual.
- El daño de las armas de cada pregenerado no se ha copiado como un número fijo, sino como la categoría de arma correcta; así el sistema sigue calculándolo en vivo a partir de la FUE/PER real del personaje, igual que con cualquier otra arma del sistema.

### Corregido
- La Virtud de Freya que tenía Munin en su biografía («Liderazgo») se había quedado desactualizada tras el arreglo de Virtudes de la 1.3.28; ahora dice «Responsabilidad», la correcta.

**Notas para quien revise esta versión:**
- En 3 de los 7 repartos de habilidades que se me facilitaron, el recuento no sumaba exactamente 4×3D/8×2D/12×1D (se pasaban por uno en un sentido y faltaba uno en otro). Para cumplir la regla exacta del manual, en Leon se subió Información de 1D a 2D, en Thomas se subió Observación de 1D a 2D y en Benzina se bajó Lucha de 2D a 1D. Son ajustes razonables pero no verificados contra el original; si tienes la ficha a mano y alguno debería ser otro, dímelo y se corrige.
- Munin lleva tres protecciones a la vez (cota de malla, casco y escudo) pero el sistema actual solo aplica el nivel de la PRIMERA armadura equipada que encuentra (no las suma). Se ha dejado la cota de malla (nivel 3, la más protectora) como equipada y el casco como poseído pero no equipado, para que la ficha no aplique un número engañoso; sumar varias armaduras a la vez requeriría un cambio de sistema aparte, no cubierto en esta versión.
- La deidad patrona solo se ha podido confirmar para Thomas (Tyr, ya lo indicaba la ficha), Munin (Freya, ya indicado) y Managarm (Idunn, deducida de que su protección es literalmente el don de Idunn, la Cota de Draupnir). Para Leon, Absenta, Benzina y Bomani no había datos suficientes para confirmarla, así que se dejan sin definir en vez de inventarla.

## [1.3.30] — 2026-07-27

### Corregido
- El «Casco de fútbol americano» (nivel 2) tenía penalización 0 a las tiradas de DES/FUE, cuando el manual fija esa penalización en el nivel de la armadura dividido entre dos y redondeado hacia abajo (floor(2/2)=1). El resto de las 12 armaduras y escudos del catálogo ya coincidían con el manual y no se han tocado.
- Las 15 modificaciones funcionales de moto del catálogo (`_data/motos/modificaciones-moto.json`, carpeta «CAMC · Modificaciones de moto») no se correspondían en absoluto con la «Lista de modificaciones para motos» del manual: tenían nombres, efectos y requisitos inventados (p. ej. "Blindaje improvisado", "Torreta de sidecar: requiere sidecar"...). Se sustituyen por las 15 modificaciones reales (Acelerador trucado, Alforjas extra, Chasis reforzado, Chasis ultrarreforzado, Configuración ofensiva, Dispensador de aceite, Estribos de combate, Manillar adaptado, Mejora del sistema de transmisión, Motor potenciado, Obra maestra, Ruedas reforzadas, Sidecar, Suspensión mejorada, Tubo de escape tuneado), con el efecto exacto de cada una. Las 20 modificaciones puramente estéticas del catálogo quedan intactas, tal y como permite el manual (no tienen impacto en las reglas).
- El generador aleatorio de motos (`generateRandomMount`) tenía su propia lista interna de 15 modificaciones funcionales inventadas, completamente distinta a la del catálogo y a la lista canónica de `CAMC.modificacionesMoto`. Como el sistema solo aplica el efecto mecánico de una modificación si su nombre coincide con esa lista canónica, ninguna moto generada aleatoriamente con estas modificaciones inventadas veía realmente aplicado el bonus que su descripción prometía (por ejemplo, una moto con "Blindaje improvisado" no ganaba en realidad esos +5 de Estructura). Se sustituye por las 14 modificaciones reales aplicables por sorteo (Sidecar queda fuera de este reparto porque ya se decide como parte de la plantilla base del vehículo).
- El importador limpia en partidas ya existentes las 15 modificaciones de moto inventadas retiradas en esta versión, igual que ya hacía con el bestiario y los dones.

**Nota:** si alguna moto ya generada en una partida existente tiene una de estas modificaciones inventadas equipada directamente sobre su ficha (no en el catálogo, sino ya instalada), esta actualización no la toca automáticamente; habría que revisarla y sustituirla a mano.

## [1.3.29] — 2026-07-27

### Corregido
- El equipo inicial de armas que da el asistente de creación de PJ no seguía la tabla de daño del manual: usaba categorías de arma inventadas ("Arma blanca", "Contundente", "Arma de fuego"...) que no existen en el sistema, un componente de dado ("1D") que Ysystem no usa en el daño de armas, y valores de daño fijo distintos a los reales (el cuchillo inicial hacía 1 en vez de 3, la pistola 0 en vez de 7, el arpón 7 en vez de 3...). Se corrigen las 6 armas iniciales generadas (Cuchillo de carretera, Llave pesada, Cadena de arrastre, Arpón, Pistola reciclada, Ballesta de taller) para que usen las categorías exactas del sistema y el daño fijo + atributo que indica el manual, igual que ya se corrigió para el resto de armas del sistema en la 1.3.26.
- De paso, se corrige un bug en la normalización de categoría de arma (`#normalizeWeaponCategory`) que hacía que cualquier arma cuya categoría incluyera literalmente el texto "no de fuego" (como la etiqueta oficial "Armas a distancia no de fuego") se clasificase por error como cuerpo a cuerpo, porque la comprobación buscaba que el texto NO contuviera "fuego" sin tener en cuenta que "no de fuego" sí lo contiene.

## [1.3.28] — 2026-07-27

### Corregido
- La Virtud de 5 de las 7 deidades patronas no era la que indica el manual: Thor pasa de «Valor» a **Coraje**, Freya de «Liderazgo» a **Responsabilidad**, Tyr de «Honor» a **Disciplina**, Heimdall de «Vigilancia» a **Lealtad** y Balder de «Esperanza» a **Bondad** (Frigg y Idunn ya estaban bien). Contrastado línea a línea con la ficha propia que el manual dedica a cada deidad patrona.
- Odín aparecía como una octava deidad patrona seleccionable, con una Virtud («Sacrificio») que no figura en ningún sitio del manual. El manual solo desarrolla ficha de Virtud y don para 7 deidades —una por cada uno de los 7 cargos de la Mesa presidencial—; Odín es «El Perdido», el dios que se sacrificó y que el propio texto dice que no volverá a pisar los Nueve Reinos, así que no reparte dones. Se retira como opción del generador de PJ y del selector de la ficha (sigue existiendo como icono de reserva para cuando aún no se ha elegido deidad).
- Los dones divinos no coincidían con los del manual en absoluto: cada deidad tenía entre 2 y 3 dones inventados para elegir (con nombre, coste y hasta efecto de juego distintos a los reales), Balder no tenía ningún don, y dos nombres reales del manual («Azote del Enemigo», el don de Freya, y «Guerrero Legendario», el de Tyr) estaban mal asignados a Thor. El manual da un único don fijo por deidad, no una lista para escoger. Se sustituyen los 18 dones inventados por los 7 reales (uno por deidad, con su coste y efecto exactos), tanto en el catálogo de objetos como en el generador de PJ.
- Una moto con la estructura a 0 debía quedar «inutilizada» según el manual, pero el sistema solo le aplicaba la misma penalización de +3 a la dificultad que a una moto dañada (a la mitad de estructura), sin impedir seguir conduciéndola. Ahora el botón de Conducir se bloquea con un aviso mientras la moto siga a 0 de estructura.
- El importador borra ahora también, en partidas ya existentes, los 5 duplicados del bestiario y los 14 dones inventados retirados en esta versión (antes se quedaban huérfanos en el mundo y el compendio).

**Nota:** si algún PJ ya en juego tiene equipado uno de los dones inventados o a Odín como deidad, esta actualización no lo toca automáticamente (para no borrar nada que ya estéis usando en mesa); habría que corregirlo a mano desde la ficha del PJ.

## [1.3.27] — 2026-07-27

### Corregido
- El bestiario tenía 5 monstruos duplicados con nombre en singular y en plural (Bandido/Bandidos, Carroñero/Carroñeros, Cuervo de Asgard/Cuervos de Asgard, Demonio de Fuego/Demonios de Fuego, Draug/Draugar de Helheim). Las versiones en plural eran una invención con estadísticas distintas a las del manual; se retiran y solo queda una ficha por criatura, con las estadísticas verificadas línea a línea contra la «Tabla de concreción del daño» y las fichas de combate del capítulo del bestiario.
- Las 14 fichas de monstruos restantes (Einherjar, Elfos de la Luz, Elfos Oscuros, Enanos, Espectros, Esqueletos, los tres tipos de Gigantes, Huargos, Supervivientes, Trasgos, Troles y Valquirias) tenían atributos, valores pasivos, Salud, iniciativa y armadura que no coincidían con los que da el manual para esa criatura (en algunos casos, con diferencias de varios puntos). Se han reescrito por completo con los valores exactos del manual y se ha añadido el texto de sus reglas especiales de combate (por ejemplo, el ataque de área de los gigantes y los troles, el susto letal de los espectros, o la inmunidad a las armas de fuego de los no muertos).
- La Puntería del Bandido de las Llanuras Yermas estaba a 2D en vez de a 3D, como indica la fórmula de daño de sus armas a distancia en el manual.
- La iniciativa y la Resistencia Física de los PNJ se recalculaban siempre con la fórmula estándar en cada `prepareData()`, descartando el valor propio de la ficha del bestiario si era distinto (el mismo problema que ya se corrigió para la Agilidad en la 1.3.25, pero que no se había extendido a estos dos campos). Por ejemplo, el Demonio de Fuego tiene Resistencia Física 4 en el manual pese a su FUE 7, pero el sistema la recalculaba a 5. Ahora solo se usa la fórmula como valor por defecto si la ficha no trae ya uno propio.
- Al eliminar las 5 fichas duplicadas de `_data/bestiario/enemigos.json`, el sistema ahora también borra automáticamente esas mismas fichas «huérfanas» del directorio de Actores y del compendio del bestiario en las partidas ya existentes (antes, quitar una entrada de los datos no borraba la ficha ya importada).

## [1.3.26] — 2026-07-27

### Corregido
- El daño de las armas cuerpo a cuerpo y de las armas improvisadas se calculaba con la mitad del bonificador de FUE (la fórmula pensada solo para el daño desarmado), en vez de la FUE íntegra que marca el manual; y las armas a dos manos no aplicaban el multiplicador x1,5 sobre FUE que les corresponde. Se corrige el cálculo por categoría de arma y se revisan también los valores de daño fijo de las 13 armas que trae el sistema (varias tenían el número equivocado, p. ej. los cuchillos y espadas de una mano estaban a 5 en vez de a 3).
- Un ataque de Lucha o Puntería que impactaba con crítico no doblaba el daño fusionado en la propia tirada, al contrario que el resto de críticos del sistema.
- Los ataques de Lucha sin arma equipada («desarmado») no generaban ningún daño automático al impactar. Ahora se calcula como indica el manual: 1 punto fijo + la mitad del bonificador de FUE (redondeado hacia abajo), doblado si es crítico.
- El generador de PJ repartía 4 dados a las habilidades favorecidas del cargo, confundiendo «favorecida» (un +3 fijo al tirar, según el manual) con el reparto real de dados de creación (4 habilidades a 3D, 8 a 2D y el resto a 1D, independiente de cuáles sean las favorecidas). Ahora reparte los dados correctamente y prioriza que las favorecidas caigan en el tramo de 3D cuando es posible, sin que eso cambie las reglas de tirada.
- El checkbox «Aplicar penalizador de Salud» del diálogo de tirada (PJ y motos) no estaba marcado por defecto, así que había que acordarse de activarlo en cada tirada para que la penalización por Salud baja se aplicase de verdad; ahora sale marcado por defecto (también al tirar rápido con Alt + clic).
- El bonus del botiquín de primeros auxilios solo daba el +2 a la tirada de Auxilio, pero no el punto extra de Salud recuperada que también indica su descripción. Ahora Auxilio-Curar añade ese punto extra cuando quien cura lleva un botiquín equipado.
- La ficha de PNJ sumaba el nivel del escudo al indicador de «Armadura», cuando en realidad el escudo no reduce daño (solo sube la Agilidad, ya corregido en la 1.3.25): ahora el indicador muestra solo la armadura real y añade una nota aparte con el bonus de Agilidad del escudo si lo tiene.
- Se retira el modificador «contextual» de tuneados de moto: era un stub que siempre devolvía 0 y nunca llegó a implementarse, así que no cambiaba ninguna tirada; se limpia también de la tarjeta de chat.

## [1.3.25] — 2026-07-27

### Corregido
- La Agilidad (y Evasión, Aplomo, Perspicacia) de los PNJ del bestiario se sobrescribía siempre con la fórmula estándar de PJ (3× dados de Atletismo + DES), descartando el valor concreto importado del manual para ese monstruo en particular. El manual permite explícitamente que algunos PNJ tengan valores superiores a los que daría la fórmula (por ejemplo, la Valquiria: Agilidad 13 en el manual, pero la fórmula daba 15); ahora esos valores importados o escritos a mano se respetan, y la fórmula solo se usa como valor por defecto si la ficha no tiene ninguno definido. Esto es lo que causaba que un PNJ recién arrastrado a la escena mostrara una Agilidad distinta a la de su ficha en el directorio de Actores: no era aleatorio ni un problema de arrastrar tokens, sino que el valor "correcto" que veías dependía de qué copia de los datos se hubiera recalculado más recientemente.
- De paso, se corrige que un escudo equipado restara puntos a la Agilidad en vez de sumarlos (el manual dice que el nivel del escudo aumenta la Agilidad) y que la penalización de la armadura se restara de la Agilidad en vez de no afectarla en absoluto (esa penalización es solo para tiradas de DES/FUE, algo que este sistema todavía no aplica en ningún otro sitio, así que no se ha tocado).

## [1.3.24] — 2026-07-27

### Corregido
- Los PNJ solo impactaban en combate si sacaban un crítico: su tirada de ataque nunca tenía dificultad asignada (no existía diálogo de opciones para ellos). Ahora, si hay un objetivo marcado, usan su Agilidad como dificultad, igual que los PJ.
- El botón «DJ · aplicar defecto» ya no aparece en tiradas de PNJ: los defectos son exclusivos de los PJ, los PNJ nunca los tienen.

### Cambiado
- El daño de un ataque de Lucha o Puntería que impacta se calcula ya en la propia tirada (el daño es esencialmente fijo por arma) y aparece junto al resultado con su botón «Aplicar daño», en vez de exigir una tirada de daño aparte. Se retira el botón «Tirar daño» que añadía ese paso extra.

### Añadido
- Auxilio ahora distingue entre «Diagnosticar / tratar» (tirada normal, sin efecto automático) y «Curar (primeros auxilios)», que fija la dificultad en 10, cura 2 puntos de Salud al PJ o PNJ marcado como objetivo (4 si es crítico) y resta 1 punto adicional en caso de pifia, tal y como indica el manual. Recuerda en la tarjeta de chat que solo se puede intentar una vez por herida concreta (la DJ debe llevar la cuenta, el sistema no registra heridas individuales).

## [1.3.23] — 2026-07-26

### Corregido
- Los botones de la tarjeta de tirada (gastar proeza, DJ · aplicar defecto, tirar daño) no aparecían nunca: el script que ocultaba la fila de acciones cuando estaba vacía usaba una comprobación de visibilidad (`:visible`) que depende de que el elemento ya esté dibujado en pantalla, y en el momento en que se ejecuta el mensaje de chat aún no lo está, así que la fila se ocultaba siempre por error, tuviera botones o no. Ahora se comprueba directamente si algún botón sigue sin `display:none`, sin depender del renderizado.

**Nota para quien pruebe esta versión**: tras actualizar el sistema (por git o por el instalador de Foundry), hay que recargar del todo la pestaña o reiniciar Foundry — los cambios de código y estilos no se aplican en caliente a una sesión que ya estaba abierta.

## [1.3.22] — 2026-07-26

### Añadido
- Botón «Gastar proeza · repetir dados» en las tarjetas de tirada falladas: abre un diálogo con los dados de la tirada (con sus pips, como un dado real) para elegir cuáles se repiten y cuáles se mantienen. Gasta 1 proeza del personaje y, como marca la regla, la tirada repetida ya no puede ser crítico.
- Botón «DJ · aplicar defecto», visible solo para la Dirección de Juego, para forzar la repetición de una tirada por el Defecto grave (repite con 1D menos y da 1 proeza) o el Defecto leve (repite igual, sin proeza) del PJ, mostrando el texto de cada defecto para juzgar si aplica.
- El Defecto leve queda limitado a una vez por sesión por PJ: si ya se usó, el DJ ve un aviso claro y la opción queda bloqueada en el diálogo. Se reinicia manualmente desde la ficha (como ya ocurría con Recuerdo cuando), con un nuevo checkbox «Defecto leve ya usado esta sesión».

- El botón «Tirar daño» aparece directamente en la tarjeta de tirada de Lucha o Puntería que impacta, para encadenar el daño sin volver a la ficha del arma.

### Cambiado
- Las tarjetas de tirada guardan ahora el contexto necesario (dados, dificultad, modificadores) en el propio mensaje de chat, para poder recalcular el resultado tras una repetición sin perder ningún modificador aplicado en la tirada original.
- El diálogo de opciones de tirada rellena la dificultad automáticamente: «Media» (9) por defecto en cualquier tirada, o la Agilidad del objetivo marcado si se ataca con un arma (mostrando su nombre y valor), siempre editable a mano.
- El botón «DJ · aplicar defecto» ya no depende de que la tirada tenga dificultad asignada: la Dirección de Juego puede forzar la repetición de cualquier tirada de habilidad.
- «Aplicar daño» ahora funciona también para quien no controla al objetivo (p. ej. un jugador dañando a un PNJ del DJ): la petición se retransmite automáticamente a la Dirección de Juego activa, que es quien aplica el cambio.

### Corregido
- El botón de gastar proeza y el de aplicar defecto no aparecían en la práctica porque casi ninguna tirada llevaba dificultad asignada (ver el cambio del diálogo de opciones más arriba).
- La ficha de PNJ no se podía reducir en altura: el modo de figura exterior forzaba `overflow: visible` en la ventana incluso en el modo de retrato normal, impidiendo recortar o hacer scroll del contenido al redimensionar.
- Diálogo «Opciones de tirada»: las casillas (penalizador de Salud, Recuerdo cuando, desenfundar) se veían partidas en dos líneas por una regla de estilo que trataba esas casillas como los demás campos; ahora se muestran en una sola línea, y el diálogo es más ancho y ordenado.

## [1.3.21] — 2026-07-25

### Añadido
- Identidad visual por tipo de objeto (arma/armadura/escudo con marco de metal remachado, don con medallón del color de su deidad, vehículo con retrato panorámico).
- Tarjeta de tirada: retrato del actor con anillo del color de su deidad, dados con relieve de cuero/hueso y sello distintivo para crítico/pifia.
- Marco troquelado y marca de agua del emblema del club en la ficha de PNJ, a la par de la de personaje.
- Separador rúnico reutilizable (`camc-rune-divider`), aplicado también a las fichas de objeto y PNJ.
- Fuente `Oswald` empaquetada localmente (`styles/fonts/`) para los títulos, en vez de depender de que el sistema operativo tenga Impact instalada.

### Cambiado
- Consolidados en un único bloque los ~7 "pases finales" de la paleta de la ficha de personaje y los ~6 de la tarjeta de chat, repartidos antes por todo el CSS; los tonos de deidad ya visibles (p. ej. Thor en azul-gris) quedan fijados como la fuente de verdad.
- Los tokens de color por deidad (`--camc-deity`) ya no dependen de `.camc-character`: los reutilizan también la tarjeta de chat y la ficha de objeto.
- Retirado el acento cian de neón fuera de la ficha de personaje; objetos, PNJ y chat pasan a la misma paleta de cuero/pergamino/latón.

### Corregido
- Variable `--camc-paper-2` (con guion) que nunca se aplicaba por una errata de nombre; el segundo tono de pergamino usa ahora `--camc-paper2` de forma consistente.

## [1.3.20] — 2026-07-25

### Añadido
- Macro `CAMC · Escalar token visual` para ajustar tamaño visual, ocultar nombre/barras, bloquear rotación y normalizar la base del token.
- Icono propio para la macro de escala de tokens.

### Cambiado
- El importador del sistema actualiza las macros base y coloca la macro de escala en la posición 1 de la barra rápida del DJ.

## [1.3.19] — 2026-07-24

### Añadido
- Escena base `Cuervos de Asgard MC` con fondo 16:9 a 1920x1080, sin rejilla, sin visión de ficha y sin exploración de niebla.
- Importación automática de escenas al mundo desde los datos integrados.

## [1.3.18] — 2026-07-24

### Añadido
- Ajustes independientes para modo de imagen, tamaño de figura exterior y tamaño de bandera en PJ y PNJ.

### Cambiado
- Las figuras exteriores de PNJ usan el mismo tamaño base que las de PJ; la diferencia de escala pasa a depender de los ajustes de PNJ.
- La escala de la bandera de fondo es independiente de la escala de la imagen del actor.

## [1.3.17] — 2026-07-24

### Añadido
- Controles +/− sobre el retrato de cada PJ y PNJ para ajustar el tamaño de esa imagen individual sin afectar al resto.

### Cambiado
- La cabecera de PNJ reparte sus métricas en una fila propia para evitar solapes con nombres largos.
- El sistema vuelve al modo estricto de motos: se eliminan de ajustes el interruptor y el menú de reglas ampliadas.

## [1.3.16] — 2026-07-24

### Añadido
- Banderas de fondo específicas para PJ sin deidad y para PNJ.
- Menú de configuración detallada para reglas ampliadas de motos.

### Cambiado
- El modo de imagen configurado en ajustes se aplica también a fichas de PNJ.
- Las reglas ampliadas de motos pueden activarse por separado: tuneos funcionales generados, efectos de piezas no manuales, modificadores contextuales y acción Forzar motor.

## [1.3.15] — 2026-07-24

### Añadido
- Actores de bestiario para todas las imágenes incluidas en `assets/actors/manual-bestiario/`.

### Cambiado
- Cada imagen de personaje, PNJ o criatura incluida en el sistema queda asignada a una ficha concreta.
- Versión de contenido actualizada a `1.7.2` para reimportar los compendios en mundos existentes.

## [1.3.14] — 2026-07-24

### Añadido
- Imágenes específicas para los personajes pregenerados y PNJ/enemigos incluidos en los compendios base.
- Imágenes preparadas del bestiario ampliado del manual en `assets/actors/manual-bestiario/`.
- Documento de prompts para regenerar o ampliar imágenes de personajes y bestiario.

### Cambiado
- Los datos fuente de personajes y bestiario apuntan ahora a las nuevas imágenes incluidas en el sistema.
- Versión de contenido actualizada a `1.7.1` para forzar la actualización de compendios en mundos existentes.

## [1.3.13] — 2026-07-23

### Añadido
- Fallback de idioma inglés (`lang/en.json`) y declaración del idioma en el manifest para evitar problemas cuando Foundry no está en español.
- Claves localizadas para etiquetas de hojas y ajustes principales del sistema.
- Aviso legal indicando que código, imágenes y textos de apoyo han sido creados o asistidos mediante IA con revisión humana.

## [1.3.12] — 2026-07-22

### Cambiado
- El control de Alforjas extra pasa a la hoja de moto, en la pestaña Alforjas, porque la capacidad pertenece a la montura vinculada.
- El resumen de carga del PJ lee la capacidad real de la moto vinculada y deja de mezclar el flag antiguo del personaje con la capacidad de la moto.
- README actualizado con la mención al galardón HazRol 2025 y limpieza de texto obsoleto sobre persecuciones.

### Corregido
- Al desactivar Alforjas extra desde la moto se bloquea el cambio si la carga actual supera la nueva capacidad.
- Los cambios de sidecar o Alforjas extra refrescan también la ficha del propietario vinculado.

## [1.3.11] — 2026-07-22

### Añadido
- Iconografía propia para armas, armaduras, equipo, vehículos, modificaciones de moto y dones por deidad.
- Especialización editable para Idioma mítico.

### Cambiado
- Los compendios base, objetos nuevos y generadores usan los iconos del sistema en lugar de iconos genéricos de Foundry.
- Las habilidades favorecidas de cargos con lista fija se marcan automáticamente al elegir cargo.

### Corregido
- Alforjas extra sincroniza su capacidad con la moto vinculada y evita doble conteo.
- Retirado el seguimiento visual de persecución de la ficha de moto.

## [1.3.10] — 2026-07-20

### Añadido
- Rastro visual de persecución en la ficha de moto con 10 franjas, perseguidor, objetivo, punto de huida y controles +/−.
- La generación aleatoria completa de PJ crea equipo inicial: talento de cargo, don de deidad cuando existe en datos, armas, armadura, objetos y moto vinculada.

### Corregido
- El parche grande de espalda ya puede escalarse con sus controles +/−; se eliminó el bloqueo de tamaño por CSS.

## [1.3.9] — 2026-07-20

### Cambiado
- El generador de PJ tiene botón directo <strong>Aleatorio</strong> en el primer paso y aplica el personaje completo sin pasos intermedios.
- Los controles +/− de tamaño de parches pasan al panel izquierdo, junto a las etiquetas de cada parche.
- La sección Vehículos de la ficha de PJ muestra la moto vinculada como Actor y ya no permite crear vehículos como Item.

## [1.3.8] — 2026-07-20

### Añadido
- Opción de aleatorio completo en el asistente de PJ: nombre, edad, cargo, deidad y enfoque.
- Tablas ampliadas de nombres, apodos, conceptos, motivaciones, citas, orígenes y defectos para reducir repeticiones.

### Cambiado
- Los botones +/− de tamaño de parches aparecen a la izquierda de cada hueco del chaleco.

### Corregido
- Restaurado el parche de deidad en el chaleco.

## [1.3.7] — 2026-07-20

### Añadido
- Botón de Tiradas iniciales en la hoja de PJ: tira Salud, recalcula Proezas y deja constancia en chat de valores anteriores y nuevos si se repite.
- Pestaña Persecución en la hoja de moto con terreno, visibilidad, Evasión rival, franja y acciones de movimiento/maniobras.
- Controles +/− para escalar parches durante la calibración del chaleco.

### Corregido
- El parche de deidad ya no se muestra en el hueco interior del cuello del chaleco.
- La vinculación de moto con PJ refresca ambas hojas y usa una ruta de respaldo para resolver el UUID.
- El interruptor Alforjas extra suma capacidad aunque haya moto vinculada.
- El asistente de PJ ya no se corta horizontalmente al abrirlo.
- Mejorado el contraste de campos de Marca, Modelo, Tipo y Apodo en la hoja de moto.

## [1.3.6] — 2026-07-20

### Añadido
- Asistente paso a paso para generar PJ desde la hoja: identidad, cargo, deidad, enfoque de atributos, cuatro habilidades favorecidas, tirada de Salud inicial y opción de moto inicial.
- Marcado WIP / Work in Progress en README y manifest para dejar claro que el sistema está en desarrollo activo.

## [1.3.5] — 2026-07-20

### Corregido
- Añadida edad en la ficha de PJ y eliminado Concepto del encabezado.
- Corregidos los cálculos iniciales de Proezas y Salud, con tirada visible para Salud inicial.
- Añadida la mecánica Recuerdo cuando en las opciones de tirada.
- Corregidas las tiradas de Mecánica desde la ficha de moto para que muestren opciones y sumen proezas críticas por encima del máximo inicial.
- Corregida la capacidad de alforjas y el efecto de alforjas extra.

### Cambiado
- Habilidades destacadas pasa a Habilidades favorecidas y solo muestra habilidades marcadas.
- Dones y talentos se pueden crear, editar y eliminar desde Resumen y Equipo.
- Los datos técnicos de motos usan campos autoajustables.

## [1.3.4] — 2026-06-08

### Cambiado
- Añadida documentación completa de instalación por manifest, hojas, automatizaciones, compendios, ajustes y contenido incluido.
- Configurado el manifest para instalación directa desde GitHub.
- Añadido flujo de GitHub Actions para generar releases con ZIP instalable.

## [1.3.3] — 2026-06-02

### Cambiado
- Versión local con contenido importable, compendios, generadores, hojas compactas, motos, comunidad, parches y automatizaciones de Ysystem adaptadas a Cuervos de Asgard Motor Club.
