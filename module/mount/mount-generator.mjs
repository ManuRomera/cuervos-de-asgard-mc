import { CAMC } from "../config.mjs";
import { mulberry32, hashSeed, pick } from "../utils/random.mjs";

export const CAMCMountTables = {
  brands: [
    "Hrafn-Kustom Works", "Midgard Motors", "Dvergar Ironworks", "Valkyria Roadworks", "Yggdrasil Choppers",
    "Aska Heavy Bikes", "Gjallarhorn Engines", "Nornir Scrapworks", "Bifröst Garage", "Fólkvangr Customs",
    "Mímir Motor Foundry", "Sleipnir Road Machines", "Fenris Rebuilds", "Jötun Wreckworks", "Ravenclaw Mechanics",
    "Old World Remnants", "Black Fjord Cycles", "Iron Rune Motors", "Thunder Goat Garage", "Valknut Choppers"
  ],
  models: [
    "Tempestad 1200", "Cuervo Negro MK-II", "Valknut 900", "Draupnir Roadster", "Hugin Scout", "Munin Scout",
    "Sleipnir Eight-Road", "Mjölnir Breaker", "Fólkvangr Nomad", "Berserker 1310", "Gjallarhorn Howler",
    "Niflheim Coldstart", "Muspel Burnline", "Midgard Drifter", "Dvergar Ratchet", "Bifröst Runner",
    "Aska Widowmaker", "Nornir Longroad", "Fenris Fang", "Skuld Last Mile", "Urd Dust Queen",
    "Verdandi Rust Saint", "Thunder Goat Puller", "Black Raven Chopper", "Wasteland Saint", "Bone Road Deluxe",
    "Helheim Whisper", "Iron Saga", "Crow Nest Special", "Last Oath"
  ],
  types: [
    "Chopper", "Bobber", "Cruiser", "Scrambler", "Rat-bike", "Moto de guerra", "Moto con sidecar",
    "Trike artesanal", "Moto exploradora", "Moto de mensajería", "Moto de asalto", "Moto ceremonial",
    "Moto de largo recorrido", "Moto dvergar", "Moto de capítulo", "Moto reliquia del Viejo Mundo"
  ],
  engines: [
    "Bicilíndrico en V 900 cc", "Bicilíndrico en V 1200 cc", "Bicilíndrico en V 1310 cc",
    "Monocilíndrico reforzado 650 cc", "Tricilíndrico recuperado 900 cc", "Motor bóxer de preguerra 1000 cc",
    "Motor híbrido de generador agrícola", "Motor militar reconstruido", "Motor de competición remendado",
    "Motor dvergar de compresión brutal", "Motor de gasolina sucia", "Motor adaptado a etanol",
    "Motor adaptado a biodiésel", "Motor de arranque imposible", "Motor silencioso de patrulla",
    "Motor rugiente de guerra", "Motor sobrealimentado inestable", "Motor de baja cilindrada pero muy fiable",
    "Motor viejo con alma de bestia", "Motor injertado de una máquina industrial"
  ],
  colors: [
    "Negro mate", "Negro aceite", "Gris ceniza", "Rojo óxido", "Rojo sangre seca", "Verde militar envejecido",
    "Azul tormenta", "Blanco hueso", "Amarillo quemado", "Cobre viejo", "Bronce sucio", "Acero desnudo",
    "Plata rayada", "Marrón cuero", "Naranja combustible", "Azul noche", "Gris humo",
    "Negro con runas blancas", "Negro con detalles rojos", "Metal desnudo con cicatrices"
  ],
  finishes: [
    "Pintura desconchada", "Depósito repintado a mano", "Runas grabadas", "Marcas de batalla",
    "Salpicaduras de barro seco", "Cromo ennegrecido", "Huesos atados al manillar", "Placas remachadas",
    "Cuero viejo en el asiento", "Cadenas decorativas", "Amuletos de carretera", "Cráneos pequeños en el guardabarros",
    "Plumas negras de cuervo", "Insignia del capítulo", "Nombre pintado en el depósito"
  ],
  noises: [
    "Truena como una tormenta atrapada en una mina.", "Ronronea bajo, como un animal grande antes de atacar.",
    "Tose antes de rugir.", "Suena limpia y afilada, casi demasiado bien para el Yermo.",
    "Tiene un traqueteo metálico que nunca desaparece.", "Aúlla cuando pasa de tercera.", "Petardea al reducir.",
    "Vibra como si quisiera desmontarse y seguir sola.", "Su escape parece un cuerno de guerra.",
    "Suena como una motosierra rezando a Odín."
  ],
  origins: [
    "Fue rescatada de una autopista sepultada bajo ceniza.", "Perteneció a una Cuerva que nunca regresó.",
    "Se reconstruyó con piezas de tres motos distintas.", "La encontró el PJ dentro de un camión volcado.",
    "Fue ganada en una carrera ritual.", "Fue heredada de un mentor muerto.", "Fue arrebatada a un enemigo del 1%.",
    "La reparó un mecánico dvergar a cambio de un juramento.", "Se montó pieza a pieza durante un invierno entero.",
    "Fue hallada en el interior de una iglesia usada como garaje.", "Tiene una pieza que nadie sabe fabricar ya.",
    "Su motor arrancó solo durante una tormenta.", "Fue la moto de una Capitana de rutas legendaria.",
    "Fue reconstruida para una misión suicida.", "Los enemigos la reconocen por el ruido."
  ],
  oaths: [
    "Nunca arranca si el piloto ha mentido a un hermano.", "No se lava después de una victoria.",
    "Lleva una tuerca por cada camarada caído.", "Antes de cada viaje se toca el depósito con dos dedos.",
    "Jamás se deja mirando hacia el norte.", "Nadie salvo su piloto puede girar la llave.",
    "Si una pluma negra cae sobre el asiento, ese día no se viaja.",
    "El primer trago de gasolina recuperada siempre es para su depósito.",
    "Si se cala antes de salir, se interpreta como mal augurio.", "Lleva bajo el asiento una carta que nadie debe leer."
  ],
  names: [
    "Hija del Trueno", "La Última Promesa", "Cuervo de Hierro", "Santa Chatarra", "Diente de Fenrir",
    "La Viuda Negra", "Corazón de Gasolina", "Martillo Roto", "La Despiadada", "Plegaria de Acero",
    "La Novia del Yermo", "Sombra de Hugin", "Recuerdo de Munin", "Sangre de Motor", "Reina del Polvo",
    "La Que No Se Cala", "Furia de Asgard", "La Negra", "Colmillo de Carretera", "Ceniza Bendita",
    "La Enterradora", "Runa Torcida", "Mala Señal", "La Devota", "Rugido Viejo", "La Desenterrada",
    "Juramento de Cuero", "La Rompedientes", "La Crujedientes", "La Matagigantes"
  ],
  // Las 14 modificaciones funcionales reales del manual (Sidecar queda fuera de este
  // reparto aleatorio porque ya se decide como parte de la plantilla base del vehículo,
  // vía la opción withSidecar, no como una modificación más a elegir).
  functionalMods: [
    { name: "Acelerador trucado", descripcion: "+5 a la tirada de iniciativa en persecuciones.", efecto: {} },
    { name: "Alforjas extra", descripcion: "+8 espacios de alforjas. El máximo de carga a pie sigue siendo 6.", efecto: { alforjasMax: 8 } },
    { name: "Chasis reforzado", descripcion: "+5 puntos de Estructura.", efecto: { estructura: 5 } },
    { name: "Chasis ultrarreforzado", descripcion: "Requiere Chasis reforzado. +5 Estructura adicional; permite Embestir y Sacar de la carretera contra cualquier vehículo; -1 Maniobrabilidad.", efecto: { estructura: 5, maniobrabilidad: -1 } },
    { name: "Configuración ofensiva", descripcion: "+1D a los Dados de daño de la moto.", efecto: { dadosDano: 1 } },
    { name: "Dispensador de aceite", descripcion: "Hasta dos veces por persecución: +3 a la dificultad de los perseguidores durante ese turno y el siguiente.", efecto: {} },
    { name: "Estribos de combate", descripcion: "+3 a Embestir y Sacar de la carretera frente a otras motos.", efecto: {} },
    { name: "Manillar adaptado", descripcion: "+1 a iniciativa y +1 a Maniobrabilidad.", efecto: { maniobrabilidad: 1 } },
    { name: "Mejora del sistema de transmisión", descripcion: "Una vez por persecución, cambia un fallo de Conducir por un éxito normal (incluida una pifia).", efecto: {} },
    { name: "Motor potenciado", descripcion: "Una vez por persecución, permite cambiar la posición de la moto una franja.", efecto: {} },
    { name: "Obra maestra", descripcion: "+3 a Conversación en escenas montado en la moto. No exige tirada de Mecánica.", efecto: {} },
    { name: "Ruedas reforzadas", descripcion: "+1 Estructura y +1 Maniobrabilidad.", efecto: { estructura: 1, maniobrabilidad: 1 } },
    { name: "Suspensión mejorada", descripcion: "+1 Maniobrabilidad y +3 a la maniobra Evadirse.", efecto: { maniobrabilidad: 1 } },
    { name: "Tubo de escape tuneado", descripcion: "+3 a Intimidación en escenas montado en la moto.", efecto: {} }
  ],
  cosmeticMods: [
    "Runas grabadas en el depósito", "Dos cuervos pintados a mano", "Cráneo de bestia en el faro",
    "Cadenas colgantes", "Plumas negras", "Manillar alto", "Guardabarros recortado",
    "Asiento de cuero cosido", "Trofeos de guerra", "Reliquia del Viejo Mundo atada al chasis",
    "Símbolo del capítulo", "Pintura de llamas", "Nombre escrito en letras torcidas",
    "Amuletos de carretera", "Matrícula antigua", "Campanilla ritual", "Espejo roto",
    "Insignia de una comunidad salvada", "Marca de una batalla", "Parche viejo cosido al asiento"
  ]
};

export function generateRandomMount(options = {}) {
  const rng = mulberry32(hashSeed(options.seed));
  const withSidecar = Boolean(options.withSidecar);
  const maxFunctionalMods = Number(options.maxFunctionalMods ?? (withSidecar ? 3 : 2));
  const includeFunctionalMods = options.includeFunctionalMods !== false;
  const name = pick(CAMCMountTables.names, rng);
  const brand = pick(CAMCMountTables.brands, rng);
  const model = pick(CAMCMountTables.models, rng);
  const type = withSidecar ? "Moto con sidecar" : pick(CAMCMountTables.types.filter(t => t !== "Moto con sidecar"), rng);
  const engine = pick(CAMCMountTables.engines, rng);
  const color = pick(CAMCMountTables.colors, rng);
  const finish = pick(CAMCMountTables.finishes, rng);
  const functionalPool = CAMCMountTables.functionalMods.filter(mod => !mod.requiereSidecar || withSidecar);
  const functionalMods = [];
  if (includeFunctionalMods) {
    while (functionalMods.length < Math.min(maxFunctionalMods, functionalPool.length) && rng() > 0.28) {
      const mod = pick(functionalPool, rng);
      if (!functionalMods.some(entry => entry.name === mod.name)) functionalMods.push({ ...mod, tipo: "funcional", ocupaRanura: true, dificultadInstalacion: 15, dificultadRetirada: 12 });
    }
  }
  const cosmeticMods = Array.from({ length: 2 }, () => pick(CAMCMountTables.cosmeticMods, rng))
    .filter((value, index, list) => list.indexOf(value) === index)
    .map(value => ({ name: value, tipo: "estetica", descripcion: value, ocupaRanura: false }));
  const items = [
    ...functionalMods.map(mod => ({
      name: mod.name,
      type: "objeto",
      img: CAMC.itemIcons.modificacionMoto,
      system: {
        tipo: "modificacion_moto",
        tamano: "no_equipable",
        cantidad: 1,
        especial: mod.descripcion,
        descripcion: mod.descripcion,
        efecto: mod.efecto ?? {},
        requiereSidecar: Boolean(mod.requiereSidecar),
        ocupaRanura: true,
        equipada: true,
        dificultadInstalacion: 15,
        dificultadRetirada: 12,
        carga: { ubicacion: "comunidad", espacios: 0 }
      }
    })),
    ...cosmeticMods.map(mod => ({
      name: mod.name,
      type: "objeto",
      img: CAMC.itemIcons.modificacionMoto,
      system: {
        tipo: "modificacion_estetica_moto",
        tamano: "no_equipable",
        cantidad: 1,
        especial: "Detalle estético. No ocupa ranura funcional.",
        descripcion: mod.descripcion,
        ocupaRanura: false,
        equipada: true,
        carga: { ubicacion: "comunidad", espacios: 0 }
      }
    }))
  ];

  return {
    name,
    type: "moto",
    img: CAMC.itemIcons.moto,
    items,
    system: {
      identidad: {
        marca: brand,
        modelo: model,
        apodo: name,
        tipo: type,
        anio: "Viejo Mundo reconstruida",
        origen: pick(CAMCMountTables.origins, rng),
        antiguo_dueno: options.ownerRole ? `Antiguo ${options.ownerRole}` : "",
        historia: pick(CAMCMountTables.origins, rng),
        juramento: pick(CAMCMountTables.oaths, rng),
        detalles_visuales: `${color}; ${finish}.`
      },
      tecnica: {
        motor: engine,
        cilindrada: engine.match(/\d+\s*cc/i)?.[0] ?? "",
        refrigeracion: pick(["Aire", "Aceite", "Líquida remendada", "Improvisada"], rng),
        combustible: pick(["Gasolina sucia", "Etanol", "Biodiésel", "Mezcla recuperada"], rng),
        transmision: pick(["Cadena reforzada", "Correa vieja", "Cardán recuperado", "Transmisión remendada"], rng),
        chasis: withSidecar ? "Chasis con sidecar reforzado" : pick(["Tubular soldado", "Viejo Mundo", "Dvergar remachado", "Rat-bike reforzado"], rng),
        suspension: pick(["Dura", "De largo recorrido", "Rebajada", "Remendada"], rng),
        ruedas: pick(["Mixtas", "Garra", "Asfalto gastado", "Barro y hielo"], rng),
        deposito: pick(["Normal", "Ampliado", "Abollado", "Doble depósito"], rng),
        escape: pick(["Libre", "Atronador", "Silenciado", "Remendado"], rng),
        autonomia: pick(["Corta", "Media", "Larga", "Caprichosa"], rng),
        ruido: pick(CAMCMountTables.noises, rng),
        particularidad: pick(["Arranca a la tercera.", "Pierde aceite pero nunca se rinde.", "Vibra al acercarse una tormenta.", "El faro parpadea como una señal."], rng)
      },
      reglas: {
        dados_dano: withSidecar ? "3D" : "2D",
        estructura: { value: withSidecar ? 20 : 15, max: withSidecar ? 20 : 15 },
        maniobrabilidad: withSidecar ? 1 : 2,
        sidecar: withSidecar,
        plazas: withSidecar ? 2 : 1,
        alforjas: { value: 0, max: withSidecar ? 12 : 8 },
        mods_funcionales_max: maxFunctionalMods,
        penalizador_dano_grave: 3,
        mantenimiento: "Operativa"
      },
      mods: { funcionales: [], esteticas: [] },
      carga: { items: [], notas: "" },
      vinculo: { ownerUuid: "", ownerName: "" },
      notas: options.chapter ? `Capítulo: ${options.chapter}` : ""
    }
  };
}
