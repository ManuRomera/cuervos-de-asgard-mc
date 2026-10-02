// Namespaced APIs exist in both generations. V1 sheets/dialogs remain supported
// in v14; retaining them preserves CAMC's forms, tabs and jQuery listeners.
import { ConMemoria } from "./memoria.mjs";

// Las hojas recuerdan posición, tamaño y pestaña (módulo compat/memoria.mjs).
export const CoreActorSheetV1 = foundry.appv1.sheets.ActorSheet;
export const CoreItemSheetV1 = foundry.appv1.sheets.ItemSheet;
export const ActorSheetV1 = ConMemoria(CoreActorSheetV1);
export const ItemSheetV1 = ConMemoria(CoreItemSheetV1);
export const Dialog = foundry.appv1.api.Dialog;
export const FilePicker = foundry.applications.apps.FilePicker;
export const TextEditor = foundry.applications.ux.TextEditor;
export const DocumentSheetConfig = foundry.applications.apps.DocumentSheetConfig;

// ApplicationV2: la hoja de Comunidad ya es V2; el resto sigue en V1 (véase docs/AUDITORIA.md §7).
export const ActorSheetV2 = foundry.applications.sheets.ActorSheetV2;
export const HandlebarsApplicationMixin = foundry.applications.api.HandlebarsApplicationMixin;
