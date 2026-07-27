# Historial de cambios — Cuervos de Asgard Motor Club para Foundry VTT

Todos los cambios relevantes de este proyecto se documentan en este archivo.

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
