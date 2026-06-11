// Arquivo reconstruido: o original (telemetria de erros do template Lovable) nao
// estava versionado no repositorio. Stub local que apenas registra o erro no
// console — sem enviar dados para nenhum servico externo.

export function reportLovableError(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  console.error("[lovable-error]", context ?? {}, error);
}
