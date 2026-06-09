// mock-data.ts
// Apenas dados estáticos que não vêm do banco
// Dados de proposicoes, deputados, temas e partidos
// vêm do Supabase em tempo real nas respectivas rotas

// Mantido apenas para compatibilidade com pipeline e apresentação
export const STATS = {
  proposicoes: 15562,
  deputados: 512,
  votacoes: 1532,
  despesas: 7430,
  total: 25117,
  classificadas: 15248,
  ultimaAtualizacao: "2026-06-08 06:00",
};

export const TEMAS: { nome: string; total: number; color: string }[] = [];
export const PARTIDOS: { sigla: string; deputados: number }[] = [];
export const VOTACOES_STATUS: { status: string; total: number }[] = [];
export const EVOLUCAO_MENSAL: { mes: string; total: number }[] = [];
export const PROPOSICOES: { id: string; tipo: string; ementa: string; tema: string; data: string; status: string; resumo: string; autor: string }[] = [];
export const DEPUTADOS: { id: number; nome: string; partido: string; uf: string; proposicoes: number }[] = [];

export const PIPELINE_STEPS = [
  { id: 1, nome: "API Câmara dos Deputados", tech: "REST API pública", desc: "Coleta de proposições, votações, despesas e deputados via endpoints oficiais dadosabertos.camara.leg.br. Paginação automática com retry e backoff exponencial.", status: "Integrado", icon: "Globe" },
  { id: 2, nome: "Extração Python", tech: "Python · Requests", desc: "Script src/extractor.py com paginação automática, retry com backoff exponencial (2s, 4s, 8s) e salvamento dos JSONs brutos com timestamp.", status: "Automatizado", icon: "Download" },
  { id: 3, nome: "JSON bruto", tech: "Data Lake local", desc: "JSONs salvos em data/raw/ com timestamp antes de qualquer transformação. Garante que falhas no transform não exijam nova chamada à API.", status: "Concluído", icon: "FileJson" },
  { id: 4, nome: "Transformação Pandas", tech: "Python · Pandas", desc: "Script src/transformer.py — normaliza campos aninhados com json_normalize(), valida nulos, remove duplicatas e converte tipos. Zero registros inválidos.", status: "Automatizado", icon: "Workflow" },
  { id: 5, nome: "PostgreSQL / Supabase", tech: "PostgreSQL 17", desc: "Banco relacional na nuvem com 5 tabelas: deputados, partidos (dimensão) e proposicoes, votacoes, despesas (fato). 25.117 registros — maio/2026.", status: "Integrado", icon: "Database" },
  { id: 6, nome: "Camada IA — OpenAI", tech: "Embeddings + GPT-4o-mini", desc: "Script src/ai_layer.py — embeddings text-embedding-3-small classificam proposições por tema via similaridade de cosseno. GPT-4o-mini gera resumos executivos. 15.562 proposições classificadas.", status: "Integrado", icon: "Sparkles" },
  { id: 7, nome: "Orquestração n8n", tech: "n8n Cloud", desc: "Workflow publicado no n8n cloud — dispara toda segunda às 6h, consulta SQL no Supabase, formata relatório em HTML e envia por email via Gmail.", status: "Automatizado", icon: "Cog" },
  { id: 8, nome: "Relatório por e-mail", tech: "Gmail SMTP", desc: "Boletim semanal HTML com 5 proposições classificadas por tema e resumo IA. Entregue toda segunda às 6h automaticamente sem intervenção humana.", status: "Concluído", icon: "Mail" },
];