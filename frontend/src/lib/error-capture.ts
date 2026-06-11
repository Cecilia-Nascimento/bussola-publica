// Arquivo reconstruido: o original (boilerplate do template Lovable) nao estava
// versionado no repositorio. Captura o ultimo erro nao tratado no servidor para
// que server.ts possa loga-lo quando o h3 engole a excecao em um 500 generico.

let lastCapturedError: unknown;

export function captureError(error: unknown): void {
  lastCapturedError = error;
}

export function consumeLastCapturedError(): unknown {
  const error = lastCapturedError;
  lastCapturedError = undefined;
  return error;
}

// Instala handlers globais quando rodando em ambiente Node (SSR).
// Guarda contra registro duplicado em hot-reload (HMR re-avalia o módulo).
const FLAG = "__bussola_error_capture_registered__";
const g = globalThis as Record<string, unknown>;
const proc = (globalThis as { process?: NodeJS.Process }).process;
if (proc && typeof proc.on === "function" && !g[FLAG]) {
  g[FLAG] = true;
  proc.on("uncaughtException", captureError);
  proc.on("unhandledRejection", captureError);
}
