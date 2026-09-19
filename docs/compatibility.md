# Compatibilidad Foundry V13 / V14 — 1.5.0

Una única distribución mantiene las reglas, documentos y compendios de CAMC en ambas generaciones. La capa `module/compat/` concentra las diferencias de integración.

## Cambios

- APIs explícitas para fichas, diálogos, selector de imágenes y datos de arrastre. No se depende de los alias globales `Dialog`, `FilePicker` o `TextEditor`.
- Registro de las cinco fichas mediante `DocumentSheetConfig`, disponible en V13 y V14.
- Tiradas personalizadas: V13 usa `core.rollMode` y `applyRollMode`; V14 usa `core.messageMode` y `applyMode`. Cada API recibe los valores de su propia generación (`publicroll/gmroll/blindroll/selfroll` frente a `public/gm/blind/self`). Las tiradas que usan `Roll.toMessage` siguen delegando en Foundry.
- Repeticiones con Dice So Nice conservan los destinatarios y el indicador de tirada oculta de la tarjeta original.
- Hooks de chat normalizados para elementos HTML y envoltorios jQuery.
- `game.camc.compatibility()` devuelve versión y capacidades, sin actores, usuarios, mensajes ni contenido privado.

Las fichas y diálogos existentes siguen usando Application V1, todavía disponible aunque obsoleta en V14. Esta actualización no migra su interfaz a ApplicationV2 ni modifica las reglas o los compendios.

## Referencias

Se adapta el enfoque de aislamiento de compatibilidad de Eterno Azul, contrastado con [Storypath Ultra](https://gitlab.com/jabelardo/storypath-ultra-fvtt), revisión `1e1f8cfeb28a6454d7b70a033d7070f7a97a95b3`. No se copia su código de reglas ni su interfaz.

APIs contrastadas con el código instalado de Foundry 13.351 y la documentación oficial V14:

- [ChatMessage.applyMode](https://foundryvtt.com/api/classes/foundry.documents.ChatMessage.html#applyMode-1)
- [ActorSheet V1](https://foundryvtt.com/api/classes/foundry.appv1.sheets.ActorSheet.html)
- [Dialog V1](https://foundryvtt.com/api/classes/foundry.appv1.api.Dialog.html)
- [FilePicker](https://foundryvtt.com/api/classes/foundry.applications.apps.FilePicker.html)
- [TextEditor](https://foundryvtt.com/api/classes/foundry.applications.ux.TextEditor.html)

## Validación

`node --test tests/*.test.mjs` ejecuta 16 pruebas sin dependencias: selección de APIs y ajustes de chat para los cuatro modos en cada generación, preservación del mensaje de entrada, rechazo seguro ante error de privacidad, destinatarios de Dice So Nice, normalización DOM, diagnóstico e importación/registro de fichas sin alias globales antiguos.

Estas pruebas usan dobles de las APIs de Foundry. No certifican el comportamiento visual ni sustituyen una partida de prueba. El manifiesto conserva `verified: 13.351` de la versión anterior; esta nueva versión necesita regresión real. `maximum: 14` conserva el límite de instalación anterior, no acredita una prueba en V14.

| Comprobación manual | V13.351 | V14 |
|---|---|---|
| Instalación limpia y actualización de un mundo existente | Pendiente | Pendiente |
| Abrir, editar y guardar personaje, PNJ, comunidad, moto y objeto | Pendiente | Pendiente |
| Pestañas, retratos, arrastre de objetos y diálogos numéricos | Pendiente | Pendiente |
| Tiradas, daño, proezas y acciones de vehículos | Pendiente | Pendiente |
| Modos público, DJ, oculto y propio con DJ y jugador conectados | Pendiente | Pendiente |
| Repeticiones y defectos con/sin Dice So Nice | Pendiente | Pendiente |
| Importación de compendios y generadores | Pendiente | Pendiente |

Ejecutar las comprobaciones en mundos de prueba independientes para cada generación. Registrar versión exacta, errores de consola y resultados antes de elevar `verified` a V14.
