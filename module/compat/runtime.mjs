/** Resolve capabilities at call time: game is not ready during module imports. */
export function versionInfo(env = globalThis) {
  const reported = Number(env.game?.release?.generation);
  const generation = Number.isInteger(reported) && reported > 0
    ? reported : Number.parseInt(env.game?.version, 10) || null;
  return { version: env.game?.version ?? "unknown", generation,
    supported: generation === 13 || generation === 14 };
}

export function diagnostic(env = globalThis) {
  return {
    system: env.game?.system?.version ?? "unknown",
    foundry: versionInfo(env),
    capabilities: {
      actorSheet: typeof env.foundry?.appv1?.sheets?.ActorSheet === "function",
      itemSheet: typeof env.foundry?.appv1?.sheets?.ItemSheet === "function",
      dialog: typeof env.foundry?.appv1?.api?.Dialog === "function",
      filePicker: typeof env.foundry?.applications?.apps?.FilePicker === "function",
      chatMode: typeof env.CONFIG?.ChatMessage?.documentClass?.applyMode === "function" ? "messageMode" : "rollMode"
    }
  };
}

export function normalizeHookElement(html) {
  const element = html?.nodeType === 1 ? html : html?.[0];
  return element?.nodeType === 1 && typeof element.querySelector === "function" ? element : null;
}
