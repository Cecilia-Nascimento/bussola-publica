import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Lightbulb, Workflow, TrendingUp, Heart, Rocket, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/page-header";

export const Route = createFileRoute("/apresentacao")({
  head: () => ({ meta: [{ title: "Apresentação — Bússola Pública" }, { name: "description", content: "Storytelling acadêmico: problema, solução, arquitetura e impacto." }] }),
  component: Apresentacao,
});

const sections = [
  { icon: AlertTriangle, accent: "text-warning", title: "Problema", body: "Acompanhar a produção legislativa da Câmara é custoso: 14k+ proposições/ano, em formato textual disperso, sem categorização temática nativa e sem priorização baseada em relevância." },
  { icon: Lightbulb, accent: "text-info", title: "Solução", body: "Pipeline automatizado que coleta dados oficiais, normaliza no PostgreSQL, classifica com IA por tema, gera resumos executivos e entrega um boletim semanal." },
  { icon: Workflow, accent: "text-primary", title: "Arquitetura", body: "Python (ingestão) → Pandas (transformação) → Supabase (storage) → OpenAI (IA) → n8n (orquestração) → Gmail (entrega). Tudo modular e versionado." },
{ icon: TrendingUp, accent: "text-success", title: "Resultado", body: "16.552 registros consolidados, 12.834 proposições classificadas por IA, boletim semanal automático e dashboard analítico em produção." },
  { icon: Heart, accent: "text-accent", title: "Impacto", body: "Democratiza o acesso à informação legislativa para pesquisadores, jornalistas, ONGs e cidadãos — reduzindo a barreira entre dado bruto e insight acionável." },
];

const nextSteps = [
  "Histórico de 1 ano completo",
  "Ingestão incremental diária",
  "Alertas por Telegram",
  "Score de relevância por cliente",
  "API própria para CRMs",
  "Integração com Senado Federal",
];

function Apresentacao() {
  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Storytelling"
        title="Apresentação do Projeto"
        description="Narrativa completa para banca acadêmica e portfólio profissional."
      />

      <div className="space-y-4">
        {sections.map((s, i) => (
          <div key={s.title} className="glass rounded-2xl p-6 shadow-card">
            <div className="flex gap-4">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-background/40 ${s.accent}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Capítulo {i + 1}</div>
                <h2 className="mt-1 text-xl font-semibold">{s.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="glass rounded-2xl p-6 shadow-card">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
            <Rocket className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Roadmap</div>
            <h2 className="text-xl font-semibold">Próximos passos</h2>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {nextSteps.map((step) => (
            <div key={step} className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/30 px-4 py-3 text-sm">
              <ArrowRight className="h-4 w-4 text-primary shrink-0" />
              <span>{step}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-primary/30 bg-gradient-hero p-8 text-center shadow-card">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Bússola Pública v1.0</p>
        <h3 className="mt-2 text-2xl font-semibold gradient-text">Inteligência legislativa, automatizada.</h3>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">Da API pública ao e-mail executivo — em um único pipeline reprodutível, monitorável e de baixo custo.</p>
      </div>
    </div>
  );
}
