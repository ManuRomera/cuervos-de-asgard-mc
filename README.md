# Cuervos de Asgard Motor Club para Foundry VTT

> **WIP / Work in Progress.** Este sistema está en desarrollo activo. Ya es usable en mesa, pero las hojas, automatizaciones, generadores y compendios pueden cambiar entre versiones mientras se completa y se revisa contra el manual.

Sistema no oficial para jugar **Cuervos de Asgard Motor Club** en Foundry VTT v13. Implementa hojas nativas, tiradas y automatizaciones sobre una base Ysystem adaptada a carretera postapocalíptica, comunidad, motos, dones divinos y parches de chaleco.

## Vista rápida

![Hojas de personaje, moto, comunidad y compendios del sistema](docs/screenshots/overview.png)

![Compendios incluidos con armas, armaduras, dones, motos, objetos y parches](docs/screenshots/compendiums.png)

![Ajustes del sistema y modo de figura exterior de personaje](docs/screenshots/settings.png)

## Juego premiado

**Cuervos de Asgard Motor Club** fue galardonado como **Mejor juego de rol original en castellano en los Premios HazRol 2025**, según anunció Walhalla Ediciones: https://walhallaediciones.com/cuervos-de-asgard-premios-hazrol-2025

## Instalación directa

En Foundry VTT ve a **Configuración → Sistemas de juego → Instalar sistema** y pega esta URL en **URL del Manifiesto**:

```text
https://raw.githubusercontent.com/ManuRomera/cuervos-de-asgard-mc/main/system.json
```

Foundry descargará el sistema desde la última release y avisará cuando haya actualizaciones.

## Qué incluye

- Hoja de `personaje` con cabecera temática, retrato o figura exterior, deidad, cargo, parches, recursos, atributos, valores derivados, habilidades, combate, equipo, dones, moto vinculada y biografía.
- Hoja de `pnj` rápida para mesa, con atributos, valores derivados, habilidades relevantes, ataque, acción especial, salud y notas.
- Hoja de `comunidad` para población, reputación, recursos, defensas, aliados, amenazas, acontecimientos y situación del asentamiento.
- Hoja de `moto` con estructura, daño, maniobrabilidad, carga, modificaciones, acciones de conducción, tuneado y generador.
- Hoja de `item` para armas, armaduras, escudos, dones, objetos, vehículos, talentos y reglas.
- Chat cards temáticas para tiradas, daño, iniciativa, dones, armas y acciones de vehículo.
- Diseño compacto opcional y calibración visual de parches sobre el chaleco.

## Automatizaciones

- Tiradas iniciales, habilidad, iniciativa, resistencia, daño, dones, persecuciones y acciones rápidas de moto.
- Cálculo de Agilidad, Aplomo, Perspicacia, Salud, Resistencia física, protección, carga y efectos de equipo.
- Equipar y desequipar armas, armaduras, escudos, objetos, parches, dones y modificaciones.
- Control de munición, daño de armas, daño de vehículos, salud de personajes y estructura de motos.
- Consumo y recuperación de proezas.
- Habilidades favorecidas por cargo, con límite y edición controlada.
- Generadores de personaje, PNJ, comunidad y montura; el aleatorio completo de PJ crea también talento, don, equipo inicial y moto vinculada.
- Importador automático de contenido al mundo, configurable desde ajustes.
- Reglas ampliadas de motos opcionales para usar automatismos extra fuera del núcleo estricto del manual.

## Compendios y contenido

El sistema incluye compendios para:

- Armas.
- Armaduras y escudos.
- Dones divinos.
- Talentos.
- Objetos y equipo.
- Parches de chaleco.
- Vehículos y motos.
- Motos base.
- Modificaciones de moto.
- Tablas del generador de motos.
- Personajes pregenerados.
- PNJ y bestiario.
- Reglas y guía.

Además conserva datos fuente estructurados en `_data/` para regenerar o importar contenido: armas, armaduras, bestiario, dones, manual, motos, objetos, parches, personajes, talentos y vehículos.

## Ajustes del sistema

- `Importar contenido automáticamente`: crea contenido de mundo desde los datos integrados.
- `Hojas compactas`: reduce espacio visual en pantalla.
- `Modo de imagen de personaje`: retrato integrado o figura exterior con fondo de deidad.
- `Tamaño de figura exterior`: escala de la figura exterior.
- `Reglas ampliadas de motos`: activa automatizaciones extra de persecución, tuneo y conducción.
- `Calibrar posiciones del chaleco`: herramienta de DJ para ajustar coordenadas y tamaño de parches.

## Compatibilidad

| Versión del sistema | Foundry VTT mínimo | Foundry VTT verificado |
|---|---|---|
| 1.3.12 WIP | v13 | v13.351 |

## Autoría y comunidad

Sistema desarrollado por **Manu Romera**, miembro de **Bruma's Rol**.

Bruma's Rol es un grupo de personas que vive el rol con auténtica pasión: cada historia, cada partida, cada campaña y cada sesión se comparte, se discute y se transforma en nuevas ideas. Muchas de las propuestas que nacen en esa mesa acaban convirtiéndose en aventuras, campañas, sistemas, automatizaciones o pequeños arreglos pensados para que jugar sea más ágil, más bonito y más emocionante.

## Repositorio y releases

- Repositorio: https://github.com/ManuRomera/cuervos-de-asgard-mc
- Releases: https://github.com/ManuRomera/cuervos-de-asgard-mc/releases
- Manifest: https://raw.githubusercontent.com/ManuRomera/cuervos-de-asgard-mc/main/system.json

## Aviso

Este paquete es una implementación no oficial para uso en Foundry VTT. Las reglas, nombres y elementos propios de la obra pertenecen a sus titulares correspondientes. El repositorio contiene código, hojas, datos estructurados y automatizaciones para facilitar el juego en mesa virtual.
