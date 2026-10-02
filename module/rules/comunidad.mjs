/**
 * Comunidad de supervivientes (cap. 7, pp. 122-131): Moral, Población y Recursos,
 * capítulos territoriales y tabla de sucesos (D66) con tirada de salvación.
 */
import { clamp } from "./reglas.mjs";

export const ATRIBUTOS = ["moral", "poblacion", "recursos"];

/** Capítulos territoriales y su capacidad especial (p. 124). */
export const CAPITULOS = {
  norte: { label: "Norte", especial: "1 punto gratuito de Población", bono: { poblacion: 1 } },
  sur: { label: "Sur", especial: "1 punto gratuito de Moral", bono: { moral: 1 } },
  central: { label: "Central", especial: "1 punto gratuito de Recursos", bono: { recursos: 1 } },
  oeste: { label: "Oeste", especial: "Un espacio extra en el contador de Recursos (máximo 4)", bono: {}, maxRecursos: 4 },
  este: { label: "Este", especial: "1 punto gratuito en el atributo que elijan los jugadores", bono: "elegir" }
};

export const maximo = (atributo, capitulo) =>
  atributo === "poblacion" ? 4 : (atributo === "recursos" && CAPITULOS[capitulo]?.maxRecursos) || 3;

/** Reparto inicial: 6 puntos, al menos 1 en cada atributo, sin pasar del máximo (p. 126). */
export function repartoComunidadValido({ moral, poblacion, recursos }, capitulo) {
  return moral >= 1 && poblacion >= 1 && recursos >= 1
    && moral + poblacion + recursos === 6
    && moral <= maximo("moral", capitulo) && poblacion <= 4 && recursos <= maximo("recursos", capitulo);
}

/**
 * Cambia un atributo y devuelve los efectos en cascada que describe el manual (pp. 124-126).
 * `estado.castigoMoral` es verdadero desde que se pierde un punto de Moral estando ya en 0: los PJ
 * empiezan las sesiones con 1 proeza menos hasta que la Moral vuelva a subir.
 */
export function cambiarAtributo(estado, atributo, delta, capitulo) {
  const max = maximo(atributo, capitulo);
  const actual = estado[atributo];
  const nuevo = clamp(actual + delta, 0, max);
  const efectos = { xpParaTodos: 0, poblacion: 0, proezasPJ: 0, notas: [] };
  const siguiente = { ...estado, [atributo]: nuevo };
  const perderPoblacion = () => { efectos.poblacion = -1; siguiente.poblacion = clamp(siguiente.poblacion - 1, 0, 4); };
  if (delta > 0 && actual === max) {
    efectos.xpParaTodos = 1;
    efectos.notas.push(`${etiqueta(atributo)} ya estaba al máximo: cada PJ obtiene 1 punto de Experiencia extra.`);
  }
  if (atributo === "moral" && delta > 0 && nuevo > 0) siguiente.castigoMoral = false;
  if (delta < 0 && atributo !== "poblacion") {
    if (actual > 0 && nuevo === 0) {
      perderPoblacion();
      efectos.notas.push(atributo === "moral"
        ? "La Moral llega a 0: la gente abandona la comunidad (−1 Población)."
        : "Los Recursos llegan a 0: crisis de subsistencia (−1 Población).");
    } else if (actual === 0) {
      perderPoblacion();
      if (atributo === "moral") {
        siguiente.castigoMoral = true;
        efectos.proezasPJ = -1;
        efectos.notas.push("Moral ya en 0: cada PJ empieza las sesiones con 1 proeza menos y se pierde otro punto de Población.");
      } else efectos.notas.push("Recursos ya en 0: se repiten las tiradas de caducidad si salió 6, 5 o 4, y se pierde otro punto de Población.");
    }
  }
  if (siguiente.poblacion === 0) efectos.notas.push("Población 0: la comunidad se extingue y la misión del MC fracasa.");
  return { estado: siguiente, efectos };
}

const etiqueta = a => ({ moral: "La Moral", poblacion: "La Población", recursos: "Los Recursos" })[a];

/** Efectos permanentes según el nivel actual (pp. 124-126). */
export function efectosVigentes({ moral, poblacion, recursos, castigoMoral }) {
  if (castigoMoral) return [...efectosVigentes({ moral, poblacion, recursos }), "Castigo de Moral: cada PJ empieza las sesiones con 1 proeza menos."];
  const lista = [];
  if (moral >= 3) lista.push("Moral 3: cada PJ empieza cada sesión con 1 proeza adicional.");
  if (moral <= 0) lista.push("Moral 0: la comunidad ha perdido la confianza. Si pierde otro punto, cada PJ empezará las sesiones con 1 proeza menos.");
  if (poblacion >= 4) lista.push("Población 4: los sucesos adversos con cargo responsable no jugador se tratan como si fuese PJ (dificultad 14).");
  if (poblacion <= 0) lista.push("Población 0: la comunidad se ha extinguido.");
  if (recursos >= 3)
    lista.push("Recursos 3+: los jugadores pueden repetir una vez las tiradas de caducidad de objetos reciclados (se queda el nuevo resultado).");
  if (recursos <= 0) lista.push("Recursos 0: crisis de subsistencia.");
  return lista;
}

/** Ajuste a las proezas con las que cada PJ empieza la sesión (pp. 124-125). */
export const proezasPorMoral = ({ moral, castigoMoral }) => moral >= 3 ? 1 : castigoMoral ? -1 : 0;

/** Rangos de Población (p. 125). */
export const CENSO = ["Extinta", "150-250 personas (unos 15 Cuervos)", "250-400 personas (unos 25 Cuervos)", "400-600 personas (unos 40 Cuervos)", "600-1000 personas (unos 60 Cuervos)"];

/* ---------- Tabla de sucesos (D66) ---------- */

/** Cargo responsable según 1D (p. 128). 1 = Presidente o Vicepresidente (a elegir). */
export const CARGO_POR_D6 = ["presidente_o_vicepresidente", "secretario", "tesorero", "sargento_armas", "capitan_rutas", "mecanico_jefe"];
export const dificultadSalvacion = cargoEsPJ => cargoEsPJ ? 14 : 18;

/** Convierte dos d6 en la clave D66: decenas y unidades (p. 127). */
export const d66 = (a, b) => a * 10 + b;

export const SUCESOS = {
  11: { nombre: "Brote de enfermedad", atributo: "moral", texto: "Una infección se ha extendido por la comunidad y afecta especialmente a los mayores. La caravana ha tenido que interrumpir su viaje para que los enfermos intenten descansar y reponerse.", riesgo: [2, 1], habilidad: "auxilio" },
  12: { nombre: "Enfrentamiento entre familias", atributo: "moral", texto: "Un encontronazo provoca que la tensa relación entre dos familias de la comunidad estalle y derive en un enfrentamiento abierto. Uno de sus miembros ha quedado herido.", riesgo: [1, 0], habilidad: "psicologia" },
  13: { nombre: "Plaga", atributo: "moral", texto: "El grano proveniente de la primera cosecha cultivada o adquirida en años ha acabado corrompiéndose por una plaga de insectos que ha puesto sus huevos en ella.", riesgo: [1, 0], habilidad: "supervivencia" },
  14: { nombre: "Augurio infausto", atributo: "moral", texto: "Una de las ancianas más respetadas asegura haber soñado con desgracias que afectarán a la comunidad. Muchos se toman muy en serio estas visiones premonitorias.", riesgo: [1, 0], habilidad: "conversacion" },
  15: { nombre: "Robo y chismes", atributo: "moral", texto: "Alguien ha sustraído algún tipo de medicamento del botiquín de la comunidad. Se han empezado a lanzar todo tipo de acusaciones que provocan malestar e incluso algún enfrentamiento.", riesgo: [1, 0], habilidad: "observacion" },
  16: { nombre: "¡Victoria!", atributo: "moral", texto: "La comunidad sale victoriosa de un ataque por sorpresa. Las bajas han sido mínimas (solamente un par de heridos). Un sentimiento de euforia se apodera de todo el mundo.", favorable: 1 },
  21: { nombre: "Niño perdido", atributo: "moral", texto: "Uno de los pequeños de la comunidad ha desaparecido. Su búsqueda durante largas horas resulta infructuosa, lo que provoca el profundo pesar de la familia y el resto de integrantes. Es un duro golpe, ya que los niños y niñas son el bien más preciado.", riesgo: [2, 1], habilidad: "rastreo" },
  22: { nombre: "Masacre", atributo: "moral", texto: "Una comunidad de supervivientes con la que se ha tenido contacto anteriormente y con la que se habían empezado a establecer lazos de amistad aparece totalmente masacrada.", riesgo: [1, 0], habilidad: "supervivencia" },
  23: { nombre: "Movimiento de tropas enemigas", atributo: "moral", texto: "En los últimos días la comunidad se ha tenido que desplazar constantemente por la amenaza que suponen los movimientos de las tropas del enemigo presentes en la zona. La sensación de inseguridad se ha apoderado de la comunidad.", riesgo: [1, 0], habilidad: "entorno" },
  24: { nombre: "Mal fario", atributo: "moral", texto: "Un eclipse de luna o de sol se produce durante un parto en el que madre e hijo fallecen. Varios supervivientes lo interpretan como un mal presagio y extienden su inquietud al resto.", riesgo: [1, 0], habilidad: "psicologia" },
  25: { nombre: "Tormenta de arena", atributo: "moral", texto: "Una tormenta de arena que hace imposible seguir en ruta obliga a la caravana a refugiarse durante bastantes días en un sistema cavernario, unas ruinas del Viejo Mundo o algún cañón estrecho y profundo. El aburrimiento y la imposibilidad de realizar ninguna tarea provocan frustración.", riesgo: [1, 0], habilidad: "cultura" },
  26: { nombre: "¡Bendición de Freya!", atributo: "moral", texto: "De forma inesperada, Freya (o cualquier otra deidad) se aparece a la comunidad para transmitirle su apoyo y su bendición y recordar el compromiso que los dioses mantienen con los mortales.", favorable: 1 },
  31: { nombre: "Perdidos", atributo: "poblacion", texto: "Una tormenta de arena especialmente dura divide a la caravana y varios vehículos se pierden en un infierno de arena y viento.", riesgo: [2, 1], habilidad: "supervivencia" },
  32: { nombre: "Treta de Loki", atributo: "poblacion", texto: "Loki utiliza su habilidad de cambiaformas y usurpa la identidad del Presidente para engañar y llevarse consigo a una parte de la comunidad. (Si el MC ya había sufrido este acontecimiento antes, hay que repetir la tirada.)", riesgo: [1, 0], habilidad: "intimidacion", unico: true },
  33: { nombre: "Capturados", atributo: "poblacion", texto: "Una encerrona de un grupo de troles de las montañas le permite capturar a varios miembros de la comunidad y aislarlos del resto después de haber provocado un desprendimiento en el paso por el que estaban transitando.", riesgo: [1, 0], habilidad: "entorno" },
  34: { nombre: "Miedo al enemigo", atributo: "poblacion", texto: "Una familia de la que forma parte un excelente mecánico duda seriamente si seguir en la comunidad, ya que piensa que los Cuervos de Asgard tienen demasiados enemigos, y sopesa la idea de alejarse de lo que considera un peligro.", riesgo: [1, 0], habilidad: "conversacion" },
  35: { nombre: "Emboscada", atributo: "poblacion", texto: "Una emboscada nocturna ha pillado por sorpresa a la comunidad. Solo aquellos que están más o menos despiertos pueden reaccionar a tiempo y evitar que los enemigos se lleven a alguien consigo.", riesgo: [1, 0], habilidad: "lucha" },
  36: { nombre: "¡Nuevas familias!", atributo: "poblacion", texto: "Un grupo de nuevas familias nómadas decide unirse a la comunidad para disfrutar de la protección de los Cuervos de Asgard.", favorable: 1 },
  41: { nombre: "Terremoto", atributo: "poblacion", texto: "La tierra ha empezado a temblar con gran intensidad justo en la zona en la que se encuentra la comunidad, lo que provoca desprendimientos y grandes grietas en el suelo por las que caen algunos supervivientes.", riesgo: [2, 1], habilidad: "supervivencia" },
  42: { nombre: "Liderazgo en disputa", atributo: "poblacion", texto: "Varios supervivientes ponen en entredicho el liderazgo de la Mesa presidencial y abogan por marcharse y fundar su propia comunidad. La idea parece haber calado entre varias familias.", riesgo: [1, 0], habilidad: "conversacion" },
  43: { nombre: "Contagio", atributo: "poblacion", texto: "Una enfermedad se transmite rápidamente en la comunidad, sin tiempo de realizar cuarentenas preventivas.", riesgo: [1, 0], habilidad: "auxilio" },
  44: { nombre: "Peregrinos", atributo: "poblacion", texto: "Un sector de la comunidad decide realizar una peregrinación hasta un lugar «santo» para demostrar su devoción hacia los dioses de Asgard y atraer mejor fortuna. La peregrinación implica la escisión de la comunidad durante meses.", riesgo: [1, 0], habilidad: "psicologia" },
  45: { nombre: "Envenenados", atributo: "poblacion", texto: "El enemigo ha logrado infiltrarse en la caravana de la comunidad de alguna manera y ha envenenado parte de las provisiones. Muchos de los supervivientes caen bajo sus crueles efectos, y algunos agonizan.", riesgo: [1, 0], habilidad: "entorno" },
  46: { nombre: "¡Rescate!", atributo: "poblacion", texto: "Un exitoso asalto de los Cuervos de Asgard a un enclave de bandidos permite liberar a una multitud de supervivientes esclavizados.", favorable: 1 },
  51: { nombre: "Tormenta destructiva", atributo: "recursos", texto: "Una descomunal tormenta de arena alcanza a la comunidad y provoca que un fino polvo arcilloso se filtre en los depósitos de combustible y en las reservas de agua.", riesgo: [2, 1], habilidad: "supervivencia" },
  52: { nombre: "Huida nocturna", atributo: "recursos", texto: "Algunos supervivientes de la comunidad han decidido abandonarla durante la noche llevándose consigo una importante cantidad de víveres.", riesgo: [1, 0], habilidad: "rastreo" },
  53: { nombre: "Comida en mal estado", atributo: "recursos", texto: "Las temperaturas extremas de las Llanuras Yermas (calor sofocante por el día y frío por la noche) provocan que parte de los víveres perecederos de la comunidad se echen a perder.", riesgo: [1, 0], habilidad: "supervivencia" },
  54: { nombre: "Agua en mal estado", atributo: "recursos", texto: "Un pequeño accidente durante las labores de mantenimiento en los depósitos de agua provoca que algo de aceite hidráulico se filtre en ellos y contamine el agua que contienen.", riesgo: [1, 0], habilidad: "mecanica" },
  55: { nombre: "Incendio en las cocinas", atributo: "recursos", texto: "La explosión de un pequeño hornillo provoca un incendio en las cocinas que rápidamente se extiende a la zona donde se almacenan los víveres.", riesgo: [1, 0], habilidad: "supervivencia" },
  56: { nombre: "¡Fuente de agua!", atributo: "recursos", texto: "La comunidad se topa con una fuente de agua dulce y limpia que le proporciona un importante respiro.", favorable: 1 },
  61: { nombre: "Explosión en un depósito de combustible", atributo: "recursos", texto: "Durante una reparación en los depósitos de combustible de la comunidad, una chispa producida durante los trabajos de soldadura que se estaban realizando provoca una deflagración en uno de ellos.", riesgo: [2, 1], habilidad: "mecanica" },
  62: { nombre: "Baterías agotadas", atributo: "recursos", texto: "Un inventario pone de manifiesto que un par de baterías que se creían en buen estado en realidad se encuentran agotadas, lo que provoca que uno de los camiones quede inoperativo.", riesgo: [1, 0], habilidad: "observacion" },
  63: { nombre: "Manantial seco", atributo: "recursos", texto: "Una de las fuentes naturales de agua dulce de las que se provee la comunidad de vez en cuando aparece seca. Se encuentra en medio de la ruta que la caravana sigue actualmente, lo que obliga a racionar el consumo de agua hasta llegar al próximo punto de abastecimiento.", riesgo: [1, 0], habilidad: "memoria" },
  64: { nombre: "Cálculo erróneo", atributo: "recursos", texto: "Un inventario saca a la luz que las reservas de combustible son menores de lo esperado por un fallo de cálculo en su control o fugas no detectadas.", riesgo: [1, 0], habilidad: "cultura" },
  65: { nombre: "Desprendimiento", atributo: "recursos", texto: "La vanguardia de la caravana es víctima de un desprendimiento al atravesar un pequeño cañón. Uno de los camiones que transporta parte de los víveres es el más afectado.", riesgo: [1, 0], habilidad: "mecanica" },
  66: { nombre: "¡Almacén intacto!", atributo: "recursos", texto: "Contra todo pronóstico, la comunidad encuentra un almacén de víveres en un antiguo refugio nuclear casero intacto. Las latas y otros envases que hay en él están en perfecto estado.", favorable: 1 }
};

/**
 * Resuelve un suceso. `salvacion` es null si el suceso es favorable.
 * Devuelve el cambio que sufre el atributo (negativo si es una pérdida, positivo si es una ganancia).
 */
export function resolverSuceso(clave, salvado) {
  const s = SUCESOS[clave];
  if (!s) return null;
  if (s.favorable) return { suceso: s, delta: s.favorable };
  return { suceso: s, delta: 0 - (salvado ? s.riesgo[1] : s.riesgo[0]) || 0 };
}

/** Resumen de lo que significa cada nivel (pp. 124-126), para mostrarlo en la hoja. */
export const NIVELES = {
  moral: [
    "La comunidad ha perdido la confianza en sí misma; algunos la abandonan.",
    "Ánimo en un mal momento: ambiente gris y pesimista.",
    "El ánimo fluctúa, pero hay confianza en la Mesa presidencial.",
    "Moral alta y sólida: los PJ empiezan cada sesión con 1 proeza más."
  ],
  poblacion: [
    "La comunidad se disgrega o es diezmada: fin del MC.",
    "Entre 150 y 250 personas, unos 15 Cuervos full patch.",
    "Entre 250 y 400 personas, unos 25 Cuervos.",
    "Entre 400 y 600 personas, unos 40 Cuervos.",
    "Entre 600 y 1000 personas, unos 60 Cuervos: los sucesos adversos se resuelven como si el cargo fuera de un PJ."
  ],
  recursos: [
    "Situación crítica: hambre y penurias; crisis de subsistencia.",
    "Racionamiento: hay escasez y hace falta encontrar nuevas fuentes.",
    "Se subsiste con cierta comodidad a corto plazo, sin bajar la guardia.",
    "Cierto desahogo: se pueden repetir las tiradas de caducidad de objetos reciclados."
  ]
};

/** Todos los repartos iniciales válidos (6 puntos, mínimo 1 en cada atributo) para el capítulo dado. */
export function repartosValidos(capitulo) {
  const lista = [];
  for (let m = 1; m <= 4; m++) for (let p = 1; p <= 4; p++) for (let r = 1; r <= 4; r++) {
    if (repartoComunidadValido({ moral: m, poblacion: p, recursos: r }, capitulo)) lista.push({ moral: m, poblacion: p, recursos: r });
  }
  return lista;
}
