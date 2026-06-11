// Arquivo reconstruido: o original (boilerplate do template Lovable) nao estava
// versionado no repositorio. Retorna uma pagina HTML simples de erro 500.

export function renderErrorPage(): string {
  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Erro 500 — Bússola Pública</title>
    <style>
      body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
        font-family: system-ui, -apple-system, sans-serif; background: #0b1120; color: #e2e8f0; }
      .card { max-width: 32rem; padding: 2rem; text-align: center; }
      h1 { font-size: 1.5rem; margin: 0 0 .5rem; }
      p { color: #94a3b8; line-height: 1.5; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>Algo deu errado</h1>
      <p>Ocorreu um erro inesperado no servidor. Verifique o terminal do <code>npm run dev</code> para detalhes.</p>
    </div>
  </body>
</html>`;
}
