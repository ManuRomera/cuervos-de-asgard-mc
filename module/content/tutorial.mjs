/**
 * Tutorial del sistema: un diario con un capítulo por página y ejercicios para hacer en el mundo.
 * Se compila en el compendio «CAMC · Reglas y guía» y el importador lo copia al mundo.
 * Sin Foundry: lo usan scripts/build.mjs y el importador. Al cambiar la interfaz, revisar estos textos.
 */
export const NOMBRE_TUTORIAL = "CAMC · Tutorial del sistema";

const ejercicio = (pasos) => `<aside class="camc-tuto-ejercicio"><h4>Pruébalo ahora</h4><ol>${pasos.map(p => `<li>${p}</li>`).join("")}</ol></aside>`;
const nota = texto => `<aside class="camc-tuto-nota"><p>${texto}</p></aside>`;

export const PAGINAS_TUTORIAL = [
  ["1. Bienvenida", `
<h1>Bienvenida a Cuervos de Asgard MC</h1>
<p>Este tutorial enseña a usar el sistema en Foundry: crear personajes, tirar dados, combatir, ir en moto, llevar la comunidad y cerrar sesiones y aventuras. No sustituye al manual: explica <strong>dónde está cada regla en la pantalla</strong> y qué hace el sistema por ti.</p>
<p>Cada capítulo termina con un recuadro <em>Pruébalo ahora</em>. Lo mejor es hacerlo en un mundo de pruebas, con este diario abierto a un lado.</p>
<h2>Cómo está organizado</h2>
<ol>
<li>Bienvenida (esta página).</li>
<li>Primeros pasos del DJ.</li>
<li>Crear un personaje.</li>
<li>La hoja de personaje.</li>
<li>Tiradas.</li>
<li>Combate.</li>
<li>Motos y persecuciones.</li>
<li>Equipo y carga.</li>
<li>La comunidad.</li>
<li>Ritmo de campaña: sesiones, aventuras y progreso.</li>
<li>PNJ y bestiario.</li>
<li>Accesibilidad, ajustes y chuleta.</li>
</ol>
${nota("Puedes volver a este tutorial cuando quieras: está en el compendio <strong>CAMC · Reglas y guía</strong>, en la carpeta del mismo nombre del Diario y en el botón <strong>Tutorial</strong> de la pestaña de Actores.")}
`],
  ["2. Primeros pasos del DJ", `
<h1>Primeros pasos del DJ</h1>
<h2>El contenido del sistema</h2>
<p>La primera vez que el DJ abre el mundo, el sistema copia en él armas, armaduras, objetos, dones, talentos, parches, motos, pregenerados y bestiario, cada cosa en su carpeta <em>CAMC · …</em>. Lo mismo está en los <strong>compendios CAMC</strong> (pestaña Compendios), que no se tocan nunca.</p>
<ul>
<li>Lo que edites en el mundo es tuyo: las actualizaciones del sistema no lo pisan.</li>
<li>Si quieres volver al contenido original, ejecuta la macro <strong>CAMC · Reimportar contenido</strong>.</li>
<li>Si no quieres que se copie nada al mundo, desactiva <em>Importar contenido automáticamente</em> en los ajustes del sistema.</li>
</ul>
<h2>Botones del DJ</h2>
<p>En la parte superior de la pestaña de <strong>Actores</strong> tienes <strong>Nueva sesión</strong> y <strong>Fin de aventura</strong> (capítulo 10) y este <strong>Tutorial</strong>.</p>
<h2>Ajustes que conviene mirar</h2>
<ul>
<li><strong>Tirada de Resistencia Física automática</strong>: solo PJ (por defecto), todos o ninguno.</li>
<li><strong>Hojas compactas</strong> y modo de imagen de PJ y PNJ.</li>
<li><strong>Accesibilidad</strong>: cada jugador elige la suya (capítulo 12).</li>
</ul>
${ejercicio(["Abre la pestaña Compendios y despliega «CAMC · Personajes pregenerados».", "Arrastra a Leon «Viejo Cráneo» Cremscy al directorio de Actores.", "Si quieres probar con dos usuarios, dáselo a un jugador (clic derecho sobre el actor → permisos de propiedad)."])}
`],
  ["3. Crear un personaje", `
<h1>Crear un personaje</h1>
<p>Hay tres caminos. Todos dejan la ficha lista para jugar: los valores derivados se calculan solos.</p>
<h2>Creación guiada (recomendada)</h2>
<p>Crea un actor de tipo <em>Personaje</em>, ábrelo y pulsa <strong>Creación guiada</strong> en la cabecera. Sigue el orden del capítulo 3 del manual en ocho pasos:</p>
<ol>
<li><strong>Identidad</strong>: nombre, jugador, cita, motivación, entorno de nacimiento, edad y descripción.</li>
<li><strong>Cargo y talento</strong>: el cargo da cuatro habilidades favorecidas (+3) y elige uno de sus tres talentos. El Presidente elige sus cuatro favorecidas; el Vicepresidente, una.</li>
<li><strong>Deidad</strong>: su Virtud y su don.</li>
<li><strong>Atributos</strong>: reparte 0, +1, +2, +4 y +6. El botón <em>Sugerir según el cargo</em> te propone un reparto.</li>
<li><strong>Habilidades</strong>: cuatro a 3D, ocho a 2D y doce a 1D. El asistente cuenta por ti.</li>
<li><strong>Defectos</strong>: uno grave y uno leve.</li>
<li><strong>Equipo</strong>: el del cargo (armadura, raciones…), un arma que no sea de fuego, los objetos libres y la moto con su modificación gratuita.</li>
<li><strong>Resumen</strong> y <strong>Crear personaje</strong>. La Salud se tira (1D) al crear.</li>
</ol>
<p>Si algo no cumple las reglas, el asistente no te deja avanzar y te dice por qué.</p>
<h2>Generar PJ</h2>
<p>El botón <strong>Generar PJ</strong> crea un personaje al azar respetando las reglas, con su equipo de cargo, talento, don y moto. Útil para PNJ de la Mesa presidencial o para empezar rápido.</p>
<h2>Pregenerados</h2>
<p>Los siete personajes del libro están en el compendio <em>CAMC · Personajes pregenerados</em>, con su talento, don y modificaciones de moto.</p>
${ejercicio(["Crea un actor Personaje llamado «Prospect».", "Pulsa Creación guiada y llega hasta el paso de Atributos.", "Elige dos veces el mismo bonificador y pulsa Siguiente: verás el aviso.", "Termina el asistente y observa la ficha resultante."])}
`],
  ["4. La hoja de personaje", `
<h1>La hoja de personaje</h1>
<p>La cabecera muestra cargo, deidad, Virtud y talento, la <strong>Salud</strong> y las <strong>proezas</strong> con sus botones − y +, la Resistencia Física y la Iniciativa (pulsa para tirarla).</p>
<h2>Pestañas</h2>
<ul>
<li><strong>Resumen</strong>: atributos, habilidades favorecidas, equipo activo, talentos y tu moto (<em>Mi montura</em>).</li>
<li><strong>Habilidades</strong>: las 24 habilidades. Pulsa el nombre para tirar. La estrella marca las favorecidas. Los rombos son los dados; para cambiarlos, desbloquea con la llave inglesa.</li>
<li><strong>Combate</strong>: armas, protección (con el total de protección y penalización), dones.</li>
<li><strong>Equipo</strong>: carga a pie y en alforjas, inventario y vehículos.</li>
<li><strong>Chaleco</strong>: los parches. El de cargo y el de deidad se ponen solos; los demás se eligen hueco a hueco.</li>
<li><strong>Biografía</strong>: descripción, historia, cita, defectos, Recuerdo cuando… y la tirada de Salud inicial.</li>
</ul>
<h2>El pie de la hoja</h2>
<p><strong>Rep.</strong> (Reputación, con su rango), <strong>Faltas</strong>, <strong>PX total</strong>, <strong>Mejorar</strong> (gastar Experiencia), <strong>Iniciativa</strong> y <strong>Resistencia</strong>.</p>
${nota("Lo que el sistema calcula solo (Agilidad, Evasión, Aplomo, Perspicacia, Salud máxima, proezas máximas, protección) no se escribe a mano. Pasa el ratón por encima para ver la fórmula, o haz clic derecho sobre casi cualquier elemento para leer una ayuda.")}
${ejercicio(["Abre la pestaña Habilidades de tu PJ.", "Haz clic derecho sobre «Atletismo» para ver su ayuda.", "En la cabecera, pulsa − en Proezas y luego +: el máximo no cambia, solo el valor actual."])}
`],
  ["5. Tiradas", `
<h1>Tiradas</h1>
<p>Una tirada es <strong>tantos D6 como dados tengas en la habilidad</strong> + el bonificador del atributo (+3 si es favorecida). Hay que igualar o superar la dificultad (de 5 a 25; lo normal, 9-10).</p>
<h2>El diálogo de tirada</h2>
<p>Al pulsar una habilidad se abre un diálogo. Lo más habitual:</p>
<ul>
<li><strong>Dificultad</strong> de la lista o una a mano. Si marcaste un objetivo (ratón sobre su token y tecla T) al atacar, se rellena con su Agilidad.</li>
<li><strong>Proezas para +1D</strong>: gastas proezas antes de tirar para añadir dados.</li>
<li><strong>Dados sacrificados (apuntar)</strong> y <strong>colaboradores</strong> (+2 por cada uno, acciones combinadas).</li>
<li><strong>Recuerdo cuando…</strong>: +2D una vez por aventura; no se combina con proezas.</li>
<li>Casillas según el caso: <em>Sin luz</em> (+5), cobertura, ráfaga, noquear, talentos como Voz o Regatear, o «Llegó montado en su moto».</li>
</ul>
<p>La penalización de armadura y escudo a las habilidades de DES y FUE, y el penalizador por heridas, se aplican solos. <strong>Alt + clic</strong> tira sin abrir el diálogo.</p>
<h2>En el chat</h2>
<ul>
<li><strong>Crítico</strong> (dos seises): éxito automático y ganas una proeza. <strong>Pifia</strong>: todos los dados en 1.</li>
<li>Si fallas: <strong>Gastar proeza · repetir dados</strong> te deja elegir qué dados repetir (ya no puede salir crítico).</li>
<li>El DJ tiene <strong>DJ · aplicar defecto</strong>: grave (repites con 1D menos y ganas una proeza) o leve (una vez por sesión). Tú pulsas <strong>Tirar dados</strong> cuando lo hayas interpretado.</li>
</ul>
${ejercicio(["Tira Conversación a dificultad 9 desde la pestaña Habilidades.", "Si fallas, pulsa «Gastar proeza · repetir dados» y elige un dado.", "Como DJ, en otra tirada pulsa «DJ · aplicar defecto»."])}
`],
  ["6. Combate", `
<h1>Combate</h1>
<h2>Iniciativa</h2>
<p>1D + Iniciativa (DES + INT), una sola vez por combate. Puedes tirarla desde la ficha o con <em>Tirar todos</em> en el rastreador: los empates se resuelven solos (DES, INT, PER, Agilidad). Con un 6 en el dado la tarjeta te avisa de la acción extra. Las modificaciones de moto que suman a la iniciativa solo cuentan yendo en la moto: la tarjeta muestra ese total aparte.</p>
<h2>Atacar</h2>
<ol>
<li>Marca al enemigo como objetivo: pasa el ratón sobre su token y pulsa <strong>T</strong>.</li>
<li>En la pestaña <strong>Combate</strong>, pulsa el nombre del arma (o «Desarmado»).</li>
<li>Si aciertas, la tarjeta calcula el daño: fijo del arma + atributo, dados por apuntar, ×2 si es crítico, la mitad si noqueas.</li>
<li><strong>Gastar proeza · +1D que explota</strong> suma dados de daño (hasta dos, o tres con armas de fuego).</li>
<li><strong>Aplicar daño</strong> lo resta de la Salud del objetivo marcado, descontando su armadura. Si el objetivo no es tuyo, el DJ lo aplica por ti.</li>
</ol>
<h2>Heridas</h2>
<ul>
<li>Por debajo de 7 de Salud tiras con −1D; por debajo de 4, con −2D.</li>
<li>La primera vez que bajas de 11, 7, 4 y 2 se tira <strong>Resistencia Física</strong> automáticamente; si se falla, caes inconsciente (se puede repetir con una proeza).</li>
<li><strong>Auxilio</strong> en modo «Curar» cura 2 (4 con crítico) al objetivo marcado.</li>
</ul>
${ejercicio(["Saca a la escena tu PJ y un «Bandido de las Llanuras Yermas» del bestiario.", "Marca al bandido (ratón sobre su token y T) y ataca con un arma.", "Pulsa «Aplicar daño» y mira cómo su armadura resta 1.", "Haz que el bandido ataque a tu PJ desde su hoja."])}
`],
  ["7. Motos y persecuciones", `
<h1>Motos y persecuciones</h1>
<h2>Tu moto</h2>
<p>La moto es un actor propio. En la pestaña Resumen del PJ, la tarjeta <strong>Mi montura</strong> permite <strong>Crear moto</strong>, <strong>Generar</strong> una al azar o arrastrar una moto existente sobre la ficha para vincularla. Desde ahí la abres, tiras Conducir, la reparas o la dañas.</p>
<h2>La hoja de moto</h2>
<ul>
<li><strong>Mecánica</strong>: Estructura, dados de daño y Maniobrabilidad. Con la mitad de Estructura, +3 a la dificultad; a 0, inutilizada.</li>
<li><strong>Tuneado</strong>: dos modificaciones funcionales (tres con sidecar). Instalar pide Mecánica a 15; retirar, a 12. Sus efectos se aplican solos.</li>
<li><strong>Alforjas</strong>: 8 espacios (16 con Alforjas extra). Arrastra objetos aquí para guardarlos.</li>
<li><strong>Persecución</strong>: elige terreno y visibilidad, escribe la <em>Evasión rival</em> y pulsa la acción. La dificultad se calcula sola, con la Maniobrabilidad y los bonos de las modificaciones (Suspensión mejorada, Estribos de combate…).</li>
</ul>
<h2>Cómo se juega una persecución</h2>
<p>Hay entre 5 y 10 franjas; los perseguidores buscan llegar a la franja del perseguido y este, a la franja de huida. Cada turno: primero movimiento (Mantener, Cambiar de posición, Obstaculizar, Quemar rueda) y luego maniobra (Atacar, Abordar, Chocar, Embestir, Evadirse, Sacar de la carretera). Anota la franja de cada uno en la hoja de moto.</p>
${ejercicio(["En la ficha de tu PJ pulsa «Generar» en Mi montura.", "Abre la moto, ve a Persecución, elige terreno Desafiante y visibilidad Reducida.", "Pulsa «Quemar rueda / Darlo todo»: la dificultad será 13 + 2 + 4 = 19."])}
`],
  ["8. Equipo y carga", `
<h1>Equipo y carga</h1>
<ul>
<li>A pie llevas hasta <strong>6 espacios</strong>: grande 2, mediano 1, pequeño ½. Las alforjas de la moto suman 8 (16 con Alforjas extra).</li>
<li>Cada objeto tiene una ubicación: <em>Mochila / encima</em>, <em>Alforjas</em> o <em>Guardado</em> (en la comunidad). Si no cabe, el sistema no te deja moverlo.</li>
<li>Equipa armas, armaduras y escudos con el icono de la fila. Varias armaduras no se suman, salvo las <em>compatibles</em> (casco, gabán); el kevlar solo protege contra armas de fuego.</li>
<li>Los objetos <strong>Reciclados (R)</strong> pueden averiarse: la tirada de caducidad se hace en «Fin de aventura» o desde la ficha del objeto.</li>
<li>El botiquín da +2 a Auxilio; las herramientas, +2 a Mecánica, si están equipados.</li>
</ul>
${ejercicio(["Arrastra «Prismáticos» desde el compendio de objetos a tu PJ.", "Cambia su ubicación a Alforjas.", "Equipa una segunda armadura normal y mira el total de protección en la pestaña Combate: solo cuenta la mejor."])}
`],
  ["9. La comunidad", `
<h1>La comunidad</h1>
<p>Crea un actor de tipo <em>Comunidad</em>. Representa a los supervivientes que protege vuestro MC (capítulo 7 del manual).</p>
<ul>
<li><strong>Capítulo</strong>: Norte, Sur, Central, Oeste o Este. Cada uno da una capacidad especial.</li>
<li><strong>Reparto inicial (6 puntos)</strong>: Moral, Población y Recursos (1-2-3, 2-2-2 o 1-1-4). El botón valida el reparto y suma la capacidad del capítulo.</li>
<li>Los botones − y + aplican las consecuencias del manual: Moral o Recursos a 0 hacen perder Población; ganar estando al máximo da Experiencia a todos los PJ.</li>
<li><strong>Mesa presidencial</strong>: los siete cargos; <em>Rellenar con los PJ</em> pone los nombres.</li>
<li><strong>Sucesos</strong>: <em>Tirar suceso (D66)</em> saca un acontecimiento. Si es adverso, la tarjeta dice qué cargo tira, qué habilidad y a qué dificultad (18, o 14 si el cargo es de un PJ). El DJ pulsa <em>Superada</em> o <em>Fallada</em> y la comunidad se actualiza.</li>
</ul>
${nota("Con Moral 3 cada PJ empieza la sesión con una proeza más; «Nueva sesión» lo aplica solo.")}
${ejercicio(["Crea una comunidad y pulsa Reparto inicial: prueba 1-1-4.", "Ve a Sucesos y pulsa «Tirar suceso (D66)».", "Pulsa «Fallada» y mira el diario de acontecimientos."])}
`],
  ["10. Ritmo de campaña", `
<h1>Ritmo de campaña</h1>
<h2>Nueva sesión</h2>
<p>Al empezar cada sesión, el DJ pulsa <strong>Nueva sesión</strong> en la pestaña de Actores. Cada PJ marcado vuelve a sus proezas iniciales (las sobrantes se pierden) con el ajuste de Moral de la comunidad, recupera su defecto leve y sus talentos de «una vez por sesión», y se reinician los umbrales de Resistencia Física.</p>
<h2>Fin de aventura</h2>
<p><strong>Fin de aventura</strong> reparte Experiencia, reinicia el Recuerdo cuando… y los talentos «por aventura», tira la caducidad de los objetos reciclados que marques y tira el suceso de la comunidad.</p>
<h2>Progreso</h2>
<ul>
<li><strong>Mejorar</strong> (pie de la hoja): subir una habilidad de 1D a 2D cuesta 5 PX; de 2D a 3D, 10; un atributo, nuevo valor × 3 (de punto en punto).</li>
<li><strong>Reputación</strong>: de 1 a 10, de medio en medio punto. Empiezas en 6 (Respetado). Por debajo de 4 o por encima de 7 afecta a la Moral; el DJ recibe un aviso.</li>
<li><strong>Faltas</strong>: cada desviación de la Virtud de tu dios. Con tres, el dios castiga (lo decide el DJ).</li>
</ul>
${ejercicio(["Gasta una proeza en tu PJ y pulsa «Nueva sesión»: vuelve al máximo.", "Pulsa «Fin de aventura», da 5 PX y luego usa «Mejorar» para subir una habilidad de 1D a 2D."])}
`],
  ["11. PNJ y bestiario", `
<h1>PNJ y bestiario</h1>
<ul>
<li>El compendio <em>CAMC · PNJ y bestiario</em> tiene las criaturas del capítulo 9, con sus armas, su armadura y sus reglas especiales (los muertos sin reposo no sufren penalizadores ni tiran Resistencia Física).</li>
<li>La hoja de PNJ es más simple: atributos, valores pasivos, cinco habilidades clave, armas y notas. El DJ solo tira por los PNJ en combate y persecuciones; el resto de veces los PJ tiran contra sus valores pasivos.</li>
<li><strong>Generar PNJ</strong>, en la cabecera de su hoja, crea uno al azar (de menor a élite).</li>
</ul>
${ejercicio(["Saca a la escena un «Motero del 1 % (vivo)».", "Marca a tu PJ (ratón sobre su token y T) y ataca con la carabina desde la hoja del PNJ."])}
`],
  ["12. Accesibilidad, ajustes y chuleta", `
<h1>Accesibilidad, ajustes y chuleta</h1>
<h2>Accesibilidad</h2>
<p>El icono de accesibilidad de la cabecera de cada hoja (y la entrada <em>Accesibilidad</em> de los ajustes) permite elegir tamaño del texto, mayor contraste, lectura fácil y menos animaciones. Es un ajuste de cada navegador. Las hojas recuerdan además su posición, tamaño y pestaña.</p>
<h2>Chuleta</h2>
<table>
<tr><th>Quiero…</th><th>Dónde</th></tr>
<tr><td>Tirar una habilidad</td><td>Pestaña Habilidades, clic en el nombre (Alt + clic: rápida)</td></tr>
<tr><td>Atacar</td><td>Ratón sobre el token enemigo y T → pestaña Combate → nombre del arma</td></tr>
<tr><td>Repetir una tirada fallida</td><td>Tarjeta del chat → Gastar proeza · repetir dados</td></tr>
<tr><td>Más daño</td><td>Tarjeta del chat → Gastar proeza · +1D que explota</td></tr>
<tr><td>Aplicar daño</td><td>Marca el objetivo → Aplicar daño</td></tr>
<tr><td>Curar</td><td>Auxilio → modo Curar, con el herido marcado</td></tr>
<tr><td>Usar un don</td><td>Pestaña Combate → Dones disponibles (paga las proezas)</td></tr>
<tr><td>Usar un talento</td><td>Pestaña Resumen → Talentos (cuenta los usos)</td></tr>
<tr><td>Empezar sesión / cerrar aventura</td><td>Pestaña Actores → Nueva sesión / Fin de aventura</td></tr>
<tr><td>Subir de nivel</td><td>Pie de la hoja → Mejorar</td></tr>
<tr><td>Persecución</td><td>Hoja de moto → Persecución</td></tr>
<tr><td>Suceso de comunidad</td><td>Hoja de comunidad → Sucesos</td></tr>
</table>
<p>¡Buena ruta, Cuervo!</p>
`]
];

/** Documento de diario del tutorial (páginas de texto HTML). */
export function documentoTutorial() {
  return {
    name: NOMBRE_TUTORIAL,
    ownership: { default: 2 },
    pages: PAGINAS_TUTORIAL.map(([name, content], i) => ({
      name,
      type: "text",
      sort: (i + 1) * 10,
      title: { show: false, level: 1 },
      text: { format: 1, content: content.trim() }
    }))
  };
}
