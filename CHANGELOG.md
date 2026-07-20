# Historial de cambios — Cuervos de Asgard Motor Club para Foundry VTT

Todos los cambios relevantes de este proyecto se documentan en este archivo.

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
