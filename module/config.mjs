export const CAMC = {};

CAMC.systemId = "cuervos-de-asgard-mc";
CAMC.contentVersion = "1.7.0";

CAMC.atributos = {
  car: { label: "Carisma", short: "CAR" },
  des: { label: "Destreza", short: "DES" },
  fue: { label: "Fuerza", short: "FUE" },
  int: { label: "Inteligencia", short: "INT" },
  per: { label: "Percepción", short: "PER" }
};

CAMC.idiomasMiticos = [
  "Asgardiano",
  "Dvergar",
  "Élfico de la luz",
  "Élfico oscuro",
  "Jotun",
  "Lengua de Muspelheim",
  "Lengua de Niflheim",
  "Lengua de Helheim",
  "Vanir",
  "Runas antiguas"
];

CAMC.habilidades = {
  atletismo: { label: "Atletismo", atributo: "des", descripcion: "Acciones fisicas de movimiento: correr, saltar, trepar, nadar, mantener equilibrio o atravesar terreno dificil. En competiciones fisicas suele enfrentarse a Agilidad." },
  auxilio: { label: "Auxilio", atributo: "int", descripcion: "Conocimiento sanitario practico: diagnosticar, estabilizar heridas, aplicar primeros auxilios y valorar estados de salud. Sustituye a Observacion cuando el objetivo es medico." },
  conducir: { label: "Conducir", atributo: "des", descripcion: "Manejo de motos y vehiculos, especialmente en persecuciones, maniobras arriesgadas, terreno peligroso y situaciones de combate sobre ruedas." },
  conversacion: { label: "Conversación", atributo: "car", descripcion: "Argumentar, negociar, regatear y obtener informacion de forma franca. La dificultad suele compararse con el Aplomo del interlocutor." },
  cultura: { label: "Cultura", atributo: "int", descripcion: "Conocimientos generales y academicos que no cubren habilidades mas concretas como Entorno, Idiomas, Informacion o Memoria." },
  entorno: { label: "Entorno", atributo: "per", descripcion: "Conocimiento local, social y geografico de una zona conocida: rutas, grupos, costumbres, peligros y datos publicos del lugar." },
  fuerza_bruta: { label: "Fuerza Bruta", atributo: "fue", descripcion: "Acciones de vigor puro: romper, levantar, empujar, arrastrar, forzar y forcejear. En competiciones fisicas suele enfrentarse a Agilidad." },
  idioma_extranjero: { label: "Idioma extranjero", atributo: "int", descripcion: "Leer, escribir y hablar lenguas humanas no nativas. Se tira para conversaciones sostenidas, textos largos o comunicacion bajo presion." },
  idioma_mitico: { label: "Idioma mítico", atributo: "int", descripcion: "Comprender lenguas no humanas o miticas. Con 2D se alcanza alfabetizacion y comprension oral basica de esa lengua." },
  informacion: { label: "Información", atributo: "int", descripcion: "Extraer datos utiles de fuentes escritas, archivos, registros, mapas o textos. Tiempo disponible, idioma y calidad de la fuente modifican la dificultad." },
  intimidacion: { label: "Intimidación", atributo: "car", descripcion: "Imponer miedo, presion o obediencia mediante amenazas, presencia o violencia implicita. La dificultad suele ser el Aplomo del objetivo." },
  lucha: { label: "Lucha", atributo: "des", descripcion: "Ataques cuerpo a cuerpo, con o sin armas de melee. En combate se enfrenta normalmente a la Agilidad del objetivo." },
  mecanica: { label: "Mecánica", atributo: "int", descripcion: "Usar, reparar y manipular maquinas, herramientas, cerraduras, mecanismos y vehiculos cuando hay equipo adecuado." },
  memoria: { label: "Memoria", atributo: "int", descripcion: "Recordar caras, nombres, lugares, referencias y detalles ya conocidos que no encajan mejor en Cultura o Entorno." },
  observacion: { label: "Observación", atributo: "per", descripcion: "Buscar de forma activa, examinar una escena, encontrar trampas o detectar algo oculto. Si alguien se esconde, suele enfrentarse a su Ocultacion." },
  ocultacion: { label: "Ocultación", atributo: "des", descripcion: "Ocultar objetos o esconderse cuando hay cobertura, preparacion o un lugar adecuado. La dificultad suele compararse con Perspicacia." },
  oido: { label: "Oído", atributo: "per", descripcion: "Escuchar, identificar sonidos, distinguir susurros o estimar distancia y direccion. Puede oponerse al Sigilo de quien se acerca." },
  psicologia: { label: "Psicología", atributo: "per", descripcion: "Interpretar intenciones, detectar mentiras, leer emociones, calmar, consolar o entender el estado mental de alguien." },
  punteria: { label: "Puntería", atributo: "per", descripcion: "Precision y ataques a distancia. En combate suele enfrentarse a Agilidad; contra vehiculos puede enfrentarse a Evasion." },
  rastreo: { label: "Rastreo", atributo: "per", descripcion: "Seguir huellas, marcas, rastros, pisadas o rodadas y deducir informacion a partir de ellas." },
  seduccion: { label: "Seducción", atributo: "car", descripcion: "Generar atraccion, simpatia o interes personal. La dificultad suele ser el Aplomo del objetivo y puede requerir tiradas posteriores." },
  sigilo: { label: "Sigilo", atributo: "des", descripcion: "Moverse sin ser detectado, evitar ruido, acercarse a alguien o sustraer algo. La dificultad suele ser la Perspicacia de quien podria advertirlo." },
  subterfugio: { label: "Subterfugio", atributo: "car", descripcion: "Mentir, disfrazarse, engañar, sonsacar rumores o secretos sin levantar sospechas. La dificultad suele compararse con Perspicacia." },
  supervivencia: { label: "Supervivencia", atributo: "per", descripcion: "Cazar, pescar, recolectar, encontrar refugio, fuego o agua y reconocer olores, sabores o recursos en un entorno hostil." }
};

CAMC.cargos = {
  presidente: { label: "Presidente", talento: "Autoridad de carretera", habilidades: [], nota: "Escoge cuatro habilidades favorecidas." },
  vicepresidente: { label: "Vicepresidente", talento: "Mano derecha", habilidades: [], nota: "Escoge cuatro habilidades favorecidas." },
  secretario: { label: "Secretario", talento: "Inspirar", habilidades: ["cultura", "idioma_mitico", "informacion", "memoria"] },
  tesorero: { label: "Tesorero", talento: "Cuentas claras", habilidades: ["auxilio", "ocultacion", "oido", "supervivencia"] },
  sargento_armas: { label: "Sargento de armas", talento: "Nadie pasa", habilidades: ["atletismo", "intimidacion", "lucha", "punteria"] },
  capitan_rutas: { label: "Capitán de rutas", talento: "Ruta segura", habilidades: ["entorno", "observacion", "rastreo", "sigilo"] },
  mecanico_jefe: { label: "Mecánico jefe", talento: "Arreglo de emergencia", habilidades: ["conducir", "conversacion", "fuerza_bruta", "mecanica"] },
  full_patch: { label: "Full Patch", talento: "Full Patch", habilidades: [] }
};

CAMC.dioses = {
  thor: { label: "Thor", virtud: "Valor", color: "#32414e", color2: "#617585", metal: "#c6d0d7" },
  freya: { label: "Freya", virtud: "Liderazgo", color: "#6d5339", color2: "#b69165", metal: "#ded2bd" },
  tyr: { label: "Tyr", virtud: "Honor", color: "#381d1d", color2: "#8d4b42", metal: "#d2c3bd" },
  heimdall: { label: "Heimdall", virtud: "Vigilancia", color: "#8b7c6d", color2: "#c4b094", metal: "#e1d8bd" },
  frigg: { label: "Frigg", virtud: "Sabiduría", color: "#30374a", color2: "#65718d", metal: "#d1d5de" },
  idunn: { label: "Idunn", virtud: "Perseverancia", color: "#7f6946", color2: "#b99e6f", metal: "#ded3bd" },
  balder: { label: "Balder", virtud: "Esperanza", color: "#685946", color2: "#ae9371", metal: "#e4dac8" },
  odin: { label: "Odín", virtud: "Sacrificio", color: "#403226", color2: "#897462", metal: "#d2c8bd" }
};

CAMC.assets = {
  logo: `systems/${CAMC.systemId}/assets/ui/icon-camc.webp`,
  background: `systems/${CAMC.systemId}/assets/ui/sheet-background.webp`,
  vest: `systems/${CAMC.systemId}/assets/ui/chaleco.webp`,
  deityFallback: `systems/${CAMC.systemId}/assets/deities/none.svg`,
  patchFallback: `systems/${CAMC.systemId}/assets/patches/none.svg`
};

CAMC.itemIcons = {
  arma: `systems/${CAMC.systemId}/assets/icons/items/armas.webp`,
  armadura: `systems/${CAMC.systemId}/assets/icons/items/armaduras-escudos.webp`,
  escudo: `systems/${CAMC.systemId}/assets/icons/items/armaduras-escudos.webp`,
  donFallback: `systems/${CAMC.systemId}/assets/icons/items/dones-odin.webp`,
  talento: `systems/${CAMC.systemId}/assets/icons/items/objetos-equipo.webp`,
  objeto: `systems/${CAMC.systemId}/assets/icons/items/objetos-equipo.webp`,
  vehiculo: `systems/${CAMC.systemId}/assets/icons/items/motos-vehiculos.webp`,
  moto: `systems/${CAMC.systemId}/assets/icons/items/motos-vehiculos.webp`,
  modificacionMoto: `systems/${CAMC.systemId}/assets/icons/items/modificaciones-moto.webp`,
  dones: {
    odin: `systems/${CAMC.systemId}/assets/icons/items/dones-odin.webp`,
    freya: `systems/${CAMC.systemId}/assets/icons/items/dones-freya.webp`,
    thor: `systems/${CAMC.systemId}/assets/icons/items/dones-thor.webp`,
    tyr: `systems/${CAMC.systemId}/assets/icons/items/dones-tyr.webp`,
    heimdall: `systems/${CAMC.systemId}/assets/icons/items/dones-heimdall.webp`,
    balder: `systems/${CAMC.systemId}/assets/icons/items/dones-balder.webp`,
    frigg: `systems/${CAMC.systemId}/assets/icons/items/dones-frigg.webp`,
    idunn: `systems/${CAMC.systemId}/assets/icons/items/dones-idunn.webp`
  }
};

CAMC.deityBanners = {
  odin: `systems/${CAMC.systemId}/assets/deities/odin.webp`,
  freya: `systems/${CAMC.systemId}/assets/deities/freya.webp`,
  thor: `systems/${CAMC.systemId}/assets/deities/thor.webp`,
  tyr: `systems/${CAMC.systemId}/assets/deities/tyr.webp`,
  heimdall: `systems/${CAMC.systemId}/assets/deities/heimdall.webp`,
  balder: `systems/${CAMC.systemId}/assets/deities/balder.webp`,
  frigg: `systems/${CAMC.systemId}/assets/deities/frigg.webp`,
  idunn: `systems/${CAMC.systemId}/assets/deities/idunn.webp`
};

CAMC.patches = {
  presidente: { label: "Presidente", group: "cargo", img: `systems/${CAMC.systemId}/assets/patches/overlay/presidente.png`, efecto: "Autoridad del capítulo. Escoge cuatro habilidades favorecidas y dirige decisiones de mesa." },
  vicepresidente: { label: "Vicepresidente", group: "cargo", img: `systems/${CAMC.systemId}/assets/patches/overlay/vicepresidente.png`, efecto: "Sostén de la Mesa Presidencial. Escoge cuatro habilidades favorecidas y reemplaza al Presidente cuando haga falta." },
  secretario: { label: "Secretario", group: "cargo", img: `systems/${CAMC.systemId}/assets/patches/overlay/secretario.png`, efecto: "Habilidades favorecidas: Cultura, Idioma mítico, Información y Memoria." },
  tesorero: { label: "Tesorero", group: "cargo", img: `systems/${CAMC.systemId}/assets/patches/overlay/tesorero.png`, efecto: "Habilidades favorecidas: Auxilio, Ocultación, Oído y Supervivencia." },
  sargento_armas: { label: "Sargento de armas", group: "cargo", img: `systems/${CAMC.systemId}/assets/patches/overlay/sargento_armas.png`, efecto: "Habilidades favorecidas: Atletismo, Intimidación, Lucha y Puntería." },
  capitan_rutas: { label: "Capitán de rutas", group: "cargo", img: `systems/${CAMC.systemId}/assets/patches/overlay/capitan_rutas.png`, efecto: "Habilidades favorecidas: Entorno, Observación, Rastreo y Sigilo." },
  mecanico_jefe: { label: "Mecánico jefe", group: "cargo", img: `systems/${CAMC.systemId}/assets/patches/overlay/mecanico_jefe.png`, efecto: "Habilidades favorecidas: Conducir, Conversación, Fuerza bruta y Mecánica." },
  odin: { label: "Odín", group: "deidad", img: `systems/${CAMC.systemId}/assets/patches/odin.webp`, efecto: "Virtud: Sacrificio. Sus dones premian pagar un precio para cambiar el destino." },
  freya: { label: "Freya", group: "deidad", img: `systems/${CAMC.systemId}/assets/patches/freya.webp`, efecto: "Virtud: Liderazgo. Sus dones protegen, inspiran y sostienen a la comunidad." },
  thor: { label: "Thor", group: "deidad", img: `systems/${CAMC.systemId}/assets/patches/thor.webp`, efecto: "Virtud: Valor. Sus dones favorecen la fuerza, el daño y la resistencia bajo presión." },
  tyr: { label: "Tyr", group: "deidad", img: `systems/${CAMC.systemId}/assets/patches/tyr.webp`, efecto: "Virtud: Honor. Sus dones ordenan el combate y castigan la cobardía." },
  heimdall: { label: "Heimdall", group: "deidad", img: `systems/${CAMC.systemId}/assets/patches/heimdall.webp`, efecto: "Virtud: Vigilancia. Sus dones mejoran alerta, rastreo y percepción del peligro." },
  balder: { label: "Balder", group: "deidad", img: `systems/${CAMC.systemId}/assets/patches/balder.webp`, efecto: "Virtud: Esperanza. Sus dones mitigan heridas, temor y desesperación." },
  frigg: { label: "Frigg", group: "deidad", img: `systems/${CAMC.systemId}/assets/patches/frigg.webp`, efecto: "Virtud: Sabiduría. Sus dones favorecen memoria, consejo y anticipación." },
  idunn: { label: "Idunn", group: "deidad", img: `systems/${CAMC.systemId}/assets/patches/idunn.webp`, efecto: "Virtud: Perseverancia. Sus dones ayudan a recuperarse y resistir desgaste." },
  correcaminos: { label: "Correcaminos", group: "merito", img: `systems/${CAMC.systemId}/assets/patches/correcaminos.webp`, efecto: "Reconoce dominio de rutas, velocidad y conducción bajo presión." },
  embajador: { label: "Embajador", group: "merito", img: `systems/${CAMC.systemId}/assets/patches/embajador.webp`, efecto: "Reconoce diplomacia, pactos y trato con comunidades ajenas." },
  explorador: { label: "Explorador", group: "merito", img: `systems/${CAMC.systemId}/assets/patches/explorador.webp`, efecto: "Reconoce exploración, supervivencia y descubrimiento de lugares seguros." },
  matademonios: { label: "Matademonios", group: "merito", img: `systems/${CAMC.systemId}/assets/patches/matademonios.webp`, efecto: "Reconoce victorias contra criaturas demoníacas o de Muspelheim." },
  matagigantes: { label: "Matagigantes", group: "merito", img: `systems/${CAMC.systemId}/assets/patches/matagigantes.webp`, efecto: "Reconoce gestas contra gigantes y amenazas descomunales." },
  matatroles: { label: "Matatroles", group: "merito", img: `systems/${CAMC.systemId}/assets/patches/matatroles.webp`, efecto: "Reconoce experiencia contra troles y horrores de emboscada." },
  paladin: { label: "Paladín", group: "merito", img: `systems/${CAMC.systemId}/assets/patches/paladin.webp`, efecto: "Reconoce defensa de inocentes, juramentos cumplidos y honor probado." },
  pateador: { label: "Pateador", group: "merito", img: `systems/${CAMC.systemId}/assets/patches/pateador.webp`, efecto: "Reconoce dureza en peleas, intimidación y presencia física." },
  pony_express: { label: "Pony Express", group: "merito", img: `systems/${CAMC.systemId}/assets/patches/pony_express.webp`, efecto: "Reconoce mensajería, entrega de recursos y travesías urgentes." },
  trotamundos: { label: "Trotamundos", group: "merito", img: `systems/${CAMC.systemId}/assets/patches/trotamundos.webp`, efecto: "Reconoce viajes largos, conocimiento de rutas y contactos lejanos." },
  veterano: { label: "Veterano", group: "merito", img: `systems/${CAMC.systemId}/assets/patches/veterano.webp`, efecto: "Reconoce cicatrices, experiencia de combate y sangre fría." },
  espalda_berserkers: { label: "Berserkers", group: "espalda", img: `systems/${CAMC.systemId}/assets/patches/back/Parche_Grande_Trasero_Berserkers.webp`, efecto: "Parche grande de espalda." },
  espalda_central: { label: "Central", group: "espalda", img: `systems/${CAMC.systemId}/assets/patches/back/Parche_Grande_Trasero_Central.webp`, efecto: "Parche grande de espalda." },
  espalda_este: { label: "Este", group: "espalda", img: `systems/${CAMC.systemId}/assets/patches/back/Parche_Grande_Trasero_Este.webp`, efecto: "Parche grande de espalda." },
  espalda_norte: { label: "Norte", group: "espalda", img: `systems/${CAMC.systemId}/assets/patches/back/Parche_Grande_Trasero_Norte.webp`, efecto: "Parche grande de espalda." },
  espalda_oeste: { label: "Oeste", group: "espalda", img: `systems/${CAMC.systemId}/assets/patches/back/Parche_Grande_Trasero_Oeste.webp`, efecto: "Parche grande de espalda." },
  espalda_sur: { label: "Sur", group: "espalda", img: `systems/${CAMC.systemId}/assets/patches/back/Parche_Grande_Trasero_Sur.webp`, efecto: "Parche grande de espalda." },
  espalda_valkirias: { label: "Valkirias", group: "espalda", img: `systems/${CAMC.systemId}/assets/patches/back/Parche_Grande_Trasero_Valkirias.webp`, efecto: "Parche grande de espalda." }
};

CAMC.patchSlots = {
  cargo: { label: "Cargo frontal", source: "cargo", allowedGroup: "cargo", x: 60.5, y: 33.8, w: 13.0, h: 3.8 },
  deidad: { label: "Rombo de deidad", source: "deidad", allowedGroup: "deidad", x: 58.8, y: 22.4, w: 7.1, h: 7.1 },
  merito_izq_1: { label: "Bolsillo frontal izquierdo alto", source: "manual", allowedGroup: "merito", x: 60.4, y: 59.8, w: 13.2, h: 4.0 },
  merito_der_1: { label: "Bolsillo frontal derecho alto", source: "manual", allowedGroup: "merito", x: 86.0, y: 59.8, w: 13.2, h: 4.0 },
  merito_izq_2: { label: "Bolsillo frontal izquierdo medio", source: "manual", allowedGroup: "merito", x: 60.4, y: 68.0, w: 13.2, h: 4.0 },
  merito_der_2: { label: "Bolsillo frontal derecho medio", source: "manual", allowedGroup: "merito", x: 86.0, y: 68.0, w: 13.2, h: 4.0 },
  merito_izq_3: { label: "Bolsillo frontal izquierdo bajo", source: "manual", allowedGroup: "merito", x: 60.4, y: 76.2, w: 13.2, h: 4.0 },
  merito_der_3: { label: "Bolsillo frontal derecho bajo", source: "manual", allowedGroup: "merito", x: 86.0, y: 76.2, w: 13.2, h: 4.0 },
  parche_espalda: { label: "Parche grande de espalda", source: "manual", allowedGroup: "espalda", x: 27.6, y: 58.2, w: 39.5, h: 9.0 }
};

CAMC.dificultades = [
  { value: 5, label: "Muy fácil" },
  { value: 7, label: "Fácil" },
  { value: 9, label: "Media" },
  { value: 11, label: "Desafiante" },
  { value: 14, label: "Difícil" },
  { value: 18, label: "Muy difícil" },
  { value: 22, label: "Extrema" }
];

CAMC.tamanos = {
  pequeno: "Pequeño",
  mediano: "Mediano",
  grande: "Grande",
  no_equipable: "No equipable"
};

CAMC.cargaPorTamano = {
  pequeno: 0.5,
  mediano: 1,
  grande: 2,
  no_equipable: 0
};

CAMC.categoriasArma = {
  cuerpo_a_cuerpo: { label: "Armas cuerpo a cuerpo", habilidad: "lucha", atributoDano: "fue_mitad", resumen: "Ataque con Lucha. Daño fijo del arma + la mitad de FUE." },
  cuerpo_a_cuerpo_dos_manos: { label: "Armas cuerpo a cuerpo a dos manos", habilidad: "lucha", atributoDano: "fue_mitad", resumen: "Ataque con Lucha. Requiere ambas manos. Daño fijo del arma + la mitad de FUE." },
  distancia_no_fuego: { label: "Armas a distancia no de fuego", habilidad: "punteria", atributoDano: "per", resumen: "Ataque con Puntería. Daño fijo del arma + PER." },
  fuego_cortas: { label: "Armas de fuego cortas", habilidad: "punteria", atributoDano: "per", resumen: "Ataque con Puntería. Consume munición. Daño fijo del arma + PER." },
  fuego_largas: { label: "Armas de fuego largas", habilidad: "punteria", atributoDano: "per", resumen: "Ataque con Puntería. Consume munición. Daño fijo del arma + PER." },
  fuego_mortiferas: { label: "Armas de fuego mortíferas", habilidad: "punteria", atributoDano: "per", resumen: "Ataque con Puntería. Consume munición. Daño fijo del arma + PER; puede incluir reglas especiales como ráfagas." },
  explosivo: { label: "Explosivos", habilidad: "punteria", atributoDano: "", resumen: "Daño fijo por explosión. La distancia puede reducir el daño según el explosivo." },
  improvisada: { label: "Improvisada", habilidad: "lucha", atributoDano: "fue_mitad", resumen: "Ataque improvisado con Lucha. Daño fijo + la mitad de FUE si procede." }
};

CAMC.ubicacionesCarga = {
  mochila: "Mochila / encima",
  alforjas: "Alforjas",
  comunidad: "Guardado"
};

CAMC.modificacionesMoto = {
  acelerador_trucado: { label: "Acelerador trucado", resumen: "+5 a la iniciativa en persecuciones." },
  alforjas_extra: { label: "Alforjas extra", resumen: "+8 espacios de alforjas; la carga a pie sigue limitada a 6." },
  chasis_reforzado: { label: "Chasis reforzado", resumen: "+5 Estructura." },
  chasis_ultrarreforzado: { label: "Chasis ultrarreforzado", resumen: "+5 Estructura adicional; permite maniobras ofensivas contra cualquier vehículo; -1 Maniobrabilidad." },
  configuracion_ofensiva: { label: "Configuración ofensiva", resumen: "+1D a los Dados de daño de la moto." },
  dispensador_aceite: { label: "Dispensador de aceite", resumen: "+3 a la dificultad de perseguidores durante este turno y el siguiente, hasta dos veces por persecución." },
  estribos_combate: { label: "Estribos de combate", resumen: "+3 a Embestir y Sacar de la carretera contra otras motos." },
  manillar_adaptado: { label: "Manillar adaptado", resumen: "+1 Iniciativa y +1 Maniobrabilidad." },
  transmision_mejorada: { label: "Mejora del sistema de transmisión", resumen: "Una vez por persecución cambia un fallo de Conducir por éxito normal." },
  motor_potenciado: { label: "Motor potenciado", resumen: "Una vez por persecución cambia de posición en una franja." },
  obra_maestra: { label: "Obra maestra", resumen: "+3 a Conversación si el personaje llega montado en su moto." },
  ruedas_reforzadas: { label: "Ruedas reforzadas", resumen: "+1 Estructura y +1 Maniobrabilidad." },
  sidecar: { label: "Sidecar", resumen: "+1 ocupante; -1 Maniobrabilidad; permite tres modificaciones funcionales." },
  suspension_mejorada: { label: "Suspensión mejorada", resumen: "+1 Maniobrabilidad y +3 a Evadirse." },
  escape_tuneado: { label: "Tubo de escape tuneado", resumen: "+3 a Intimidación si el personaje llega montado en su moto." }
};

CAMC.persecucion = {
  terrenos: [
    { key: "facil", label: "Fácil", dificultad: 8 },
    { key: "media", label: "Media", dificultad: 10 },
    { key: "desafiante", label: "Desafiante", dificultad: 13 },
    { key: "dificil", label: "Difícil", dificultad: 16 },
    { key: "muy_dificil", label: "Muy difícil", dificultad: 20 }
  ],
  visibilidad: [
    { key: "normal", label: "Normal", mod: 0, signed: "+0" },
    { key: "mala", label: "Mala", mod: 2, signed: "+2" },
    { key: "pesima", label: "Pésima", mod: 4, signed: "+4" }
  ],
  movimiento: [
    { key: "cambiar_posicion", label: "Cambiar de posición", mod: 0, summary: "Avanza 1 franja; 2 con crítico." },
    { key: "mantener_posicion", label: "Mantener posición", mod: null, summary: "No requiere tirada; conserva la franja." },
    { key: "obstaculizar", label: "Obstaculizar", mod: 2, summary: "Si vas 1 franja por delante, dificulta al perseguidor." },
    { key: "quemar_rueda", label: "Quemar rueda", mod: 4, summary: "Avanza 2 franjas; 3 con crítico." }
  ],
  maniobras: [
    { key: "embestir", label: "Embestir", mod: 0, summary: "Tirada enfrentada contra Evasión; causa daño de moto." },
    { key: "arrollar", label: "Arrollar", mod: 0, summary: "Contra objetivo a pie; usa daño de moto." },
    { key: "sacar_carretera", label: "Sacar de la carretera", mod: 3, summary: "Fuerza al rival a perder control o abandonar." },
    { key: "evadirse", label: "Evadirse", mod: 0, summary: "Usa Conducir para ganar espacio o cortar persecución." }
  ]
};

CAMC.deterioro = {
  C: "Consumible",
  M: "Manufacturado",
  R: "Reciclado",
  V: "Viejo Mundo"
};

CAMC.itemFolders = {
  armas: { label: "CAMC · Armas", type: "Item" },
  armaduras: { label: "CAMC · Armaduras y escudos", type: "Item" },
  dones: { label: "CAMC · Dones divinos", type: "Item" },
  talentos: { label: "CAMC · Talentos", type: "Item" },
  objetos: { label: "CAMC · Objetos y equipo", type: "Item" },
  modificacionesMoto: { label: "CAMC · Modificaciones de moto", type: "Item" },
  parches: { label: "CAMC · Parches de chaleco", type: "Item" },
  vehiculos: { label: "CAMC · Vehículos", type: "Item" },
  motos: { label: "CAMC · Motos base", type: "Actor" },
  personajes: { label: "CAMC · Personajes pregenerados", type: "Actor" },
  bestiario: { label: "CAMC · PNJ y bestiario", type: "Actor" },
  manual: { label: "CAMC · Reglas y guía", type: "JournalEntry" }
};
