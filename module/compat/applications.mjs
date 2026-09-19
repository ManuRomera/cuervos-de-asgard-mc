// Namespaced APIs exist in both generations. V1 sheets/dialogs remain supported
// in v14; retaining them preserves CAMC's forms, tabs and jQuery listeners.
export const ActorSheetV1 = foundry.appv1.sheets.ActorSheet;
export const ItemSheetV1 = foundry.appv1.sheets.ItemSheet;
export const Dialog = foundry.appv1.api.Dialog;
export const FilePicker = foundry.applications.apps.FilePicker;
export const TextEditor = foundry.applications.ux.TextEditor;
export const DocumentSheetConfig = foundry.applications.apps.DocumentSheetConfig;
