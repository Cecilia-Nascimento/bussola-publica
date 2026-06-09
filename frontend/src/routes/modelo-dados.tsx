import { createFileRoute } from "@tanstack/react-router";
import { Database, Sparkles, KeyRound, Hash, Calendar, FileText, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/page-header";

export const Route = createFileRoute("/modelo-dados")({
  head: () => ({ meta: [{ title: "Modelo de Dados — Bússola Pública" }, { name: "description", content: "Modelo dimensional do banco PostgreSQL/Supabase." }] }),
  component: ModeloDados,
});

type Col = { nome: string; tipo: string; pk?: boolean; fk?: boolean; ai?: boolean };

const tables: { nome: string; tipo: "Dimensão" | "Fato"; registros: number; cols: Col[] }[] = [
  {
    nome: "deputados", tipo: "Dimensão", registros: 512,
    cols: [
      { nome: "id", tipo: "bigint", pk: true },
      { nome: "nome", tipo: "text" },
      { nome: "sigla_partido", tipo: "varchar(20)" },
      { nome: "sigla_uf", tipo: "varchar(5)" },
      { nome: "id_legislatura", tipo: "integer" },
      { nome: "email", tipo: "text" },
      { nome: "url_foto", tipo: "varchar(500)" },
    ],
  },
  {
    nome: "partidos", tipo: "Dimensão", registros: 21,
    cols: [
      { nome: "id", tipo: "bigint", pk: true },
      { nome: "sigla", tipo: "varchar(20)" },
      { nome: "nome", tipo: "text" },
    ],
  },
  {
    nome: "proposicoes", tipo: "Fato", registros: 15562,
    cols: [
      { nome: "id", tipo: "bigint", pk: true },
      { nome: "sigla_tipo", tipo: "varchar(20)" },
      { nome: "numero", tipo: "integer" },
      { nome: "ano", tipo: "integer" },
      { nome: "ementa", tipo: "text" },
      { nome: "data_apresentacao", tipo: "date" },
      { nome: "tema", tipo: "varchar(100)", ai: true },
      { nome: "resumo_ia", tipo: "text", ai: true },
    ],
  },
  {
    nome: "votacoes", tipo: "Fato", registros: 1532,
    cols: [
      { nome: "id", tipo: "varchar(50)", pk: true },
      { nome: "data", tipo: "date" },
      { nome: "data_hora_registro", tipo: "timestamp" },
      { nome: "descricao", tipo: "text" },
      { nome: "aprovacao", tipo: "smallint" },
      { nome: "sigla_orgao", tipo: "varchar(50)" },
    ],
  },
  {
    nome: "despesas", tipo: "Fato", registros: 7430,
    cols: [
      { nome: "id", tipo: "serial", pk: true },
      { nome: "id_deputado", tipo: "integer", fk: true },
      { nome: "ano", tipo: "integer" },
      { nome: "mes", tipo: "integer" },
      { nome: "tipo_despesa", tipo: "varchar(200)" },
      { nome: "nome_fornecedor", tipo: "varchar(300)" },
      { nome: "valor_documento", tipo: "numeric(12,2)" },
      { nome: "valor_liquido", tipo: "numeric(12,2)" },
      { nome: "data_documento", tipo: "timestamp" },
      { nome: "num_documento", tipo: "varchar(100)" },
      { nome: "url_documento", tipo: "varchar(500)" },
    ],
  },
];

function ModeloDados() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Modelagem"
        title="Modelo de Dados"
        description="Esquema dimensional no PostgreSQL/Supabase: duas tabelas de dimensão e três tabelas de fato, enriquecidas pela camada de IA."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {tables.map((t) => (
          <div key={t.nome} className="glass rounded-2xl p-5 shadow-card">
            <div className="flex items-center justify-between">
              <Database className={t.tipo === "Fato" ? "h-5 w-5 text-accent" : "h-5 w-5 text-primary"} />
              <span className={`rounded-full border px-2 py-0.5 text-[10px] ${t.tipo === "Fato" ? "border-accent/40 bg-accent/10 text-accent" : "border-primary/40 bg-primary/10 text-primary"}`}>{t.tipo}</span>
            </div>
            <h3 className="mt-3 font-mono text-sm font-semibold">{t.nome}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{t.registros.toLocaleString("pt-BR")} registros</p>
          </div>
        ))}
      </div>

      {/* ERD */}
      <div className="glass rounded-2xl p-6 shadow-card overflow-x-auto">
        <h3 className="mb-4 font-semibold">Diagrama de relacionamento</h3>
        <div className="grid min-w-[700px] grid-cols-3 items-center gap-4 text-center text-xs">
          <div className="rounded-xl border border-primary/40 bg-primary/10 p-3 font-mono">partidos</div>
          <div className="flex items-center justify-center"><ArrowRight className="h-4 w-4 text-muted-foreground" /><span className="text-muted-foreground">1:N</span><ArrowRight className="h-4 w-4 text-muted-foreground" /></div>
          <div className="rounded-xl border border-primary/40 bg-primary/10 p-3 font-mono">deputados</div>

          <div />
          <div className="flex items-center justify-center text-muted-foreground">↓ 1:N</div>
          <div />

          <div className="rounded-xl border border-accent/40 bg-accent/10 p-3 font-mono col-span-3 mx-auto w-fit px-8">proposicoes</div>

          <div />
          <div className="flex items-center justify-center text-muted-foreground">↓ 1:N</div>
          <div />

          <div className="rounded-xl border border-accent/40 bg-accent/10 p-3 font-mono col-span-3 mx-auto w-fit px-10">votacoes</div>

          <div />
          <div className="flex items-center justify-center text-muted-foreground">↓ 1:N</div>
          <div />

          <div className="rounded-xl border border-accent/40 bg-accent/10 p-3 font-mono col-span-3 mx-auto w-fit px-10">despesas</div>
        </div>
      </div>

      {/* Schemas */}
      <div className="grid gap-4 lg:grid-cols-2">
        {tables.map((t) => (
          <div key={t.nome} className="glass rounded-2xl p-5 shadow-card">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-mono text-sm font-semibold">{t.nome}</h3>
              <span className="text-xs text-muted-foreground">{t.cols.length} colunas</span>
            </div>
            <div className="space-y-1 text-xs">
              {t.cols.map((c) => (
                <div key={c.nome} className="flex items-center justify-between rounded-md border border-border/40 bg-background/30 px-3 py-2">
                  <div className="flex items-center gap-2 font-mono">
                    {c.pk && <KeyRound className="h-3 w-3 text-warning" />}
                    {c.fk && <Hash className="h-3 w-3 text-primary" />}
                    {c.ai && <Sparkles className="h-3 w-3 text-accent" />}
                    {!c.pk && !c.fk && !c.ai && (c.tipo.includes("date") || c.tipo.includes("time") ? <Calendar className="h-3 w-3 text-muted-foreground" /> : <FileText className="h-3 w-3 text-muted-foreground" />)}
                    <span>{c.nome}</span>
                    {c.ai && <span className="ml-1 rounded-full border border-accent/40 bg-accent/10 px-1.5 py-0.5 text-[9px] uppercase text-accent">gerado por IA</span>}
                  </div>
                  <span className="text-muted-foreground">{c.tipo}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="glass rounded-2xl p-5 shadow-card">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-accent" />
          <div>
            <h4 className="font-semibold">Colunas geradas por IA na tabela <code className="font-mono text-accent">proposicoes</code></h4>
            <p className="mt-1 text-sm text-muted-foreground">
              <code className="font-mono text-foreground">tema</code> classifica cada proposição em 10 categorias via similaridade de embeddings.
              <code className="font-mono text-foreground"> resumo_ia</code> é o resumo executivo gerado por GPT-4o-mini.
              <strong className="text-foreground"> 15.248 de 15.562 proposições classificadas (98%).</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}