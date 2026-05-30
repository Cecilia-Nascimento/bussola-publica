import { createFileRoute } from "@tanstack/react-router";
import {
  Globe, Download, FileJson, Workflow, Database, Sparkles, Cog, Mail, ChevronRight, CheckCircle2,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { PIPELINE_STEPS } from "@/lib/mock-data";
import { useState } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pipeline")({
  head: () => ({ meta: [{ title: "Arquitetura do Pipeline — Bússola Pública" }, { name: "description", content: "Fluxo end-to-end da ingestão dos dados da Câmara até o relatório por e-mail." }] }),
  component: Pipeline,
});

const iconMap = { Globe, Download, FileJson, Workflow, Database, Sparkles, Cog, Mail } as const;

const statusStyle: Record<string, string> = {
  Concluído:    "border-success/40 bg-success/10 text-success",
  Automatizado: "border-primary/40 bg-primary/10 text-primary",
  Integrado:    "border-accent/40 bg-accent/10 text-accent",
};

function Pipeline() {
  const [active, setActive] = useState(1);
  const current     = PIPELINE_STEPS.find((s) => s.id === active)!;
  const CurrentIcon = iconMap[current.icon as keyof typeof iconMap];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Engenharia de dados"
        title="Arquitetura do Pipeline"
        description="Cada etapa do fluxo end-to-end — da extração dos dados públicos da Câmara à entrega do boletim semanal."
      />

      {/* Flow — grid responsivo em vez de overflow horizontal */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {PIPELINE_STEPS.map((step, idx) => {
          const Icon     = iconMap[step.icon as keyof typeof iconMap];
          const isActive = step.id === active;
          return (
            <div key={step.id} className="flex items-center gap-1">
              <button
                onClick={() => setActive(step.id)}
                className={cn(
                  "glass w-full rounded-xl p-3 text-left transition-all hover:-translate-y-0.5",
                  isActive && "ring-2 ring-primary shadow-glow"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon className="h-4 w-4 text-primary" />
                  <span className={cn("rounded-full border px-1.5 py-0.5 text-[9px]", statusStyle[step.status])}>
                    {step.status}
                  </span>
                </div>
                <h3 className="text-xs font-semibold leading-tight">{step.nome}</h3>
                <p className="mt-0.5 text-[10px] text-muted-foreground">{step.tech}</p>
              </button>
              {idx < PIPELINE_STEPS.length - 1 && (
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground hidden lg:block" />
              )}
            </div>
          );
        })}
      </div>

      {/* Detail */}
      <div className="glass rounded-2xl p-6 shadow-card">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-gradient-primary p-3 shadow-glow shrink-0">
            <CurrentIcon className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-semibold">{current.nome}</h2>
              <span className={cn("rounded-full border px-2 py-0.5 text-xs", statusStyle[current.status])}>
                {current.status}
              </span>
            </div>
            <p className="mt-1 text-sm text-primary">{current.tech}</p>
            <p className="mt-4 text-sm text-muted-foreground">{current.desc}</p>
            <div className="mt-4 inline-flex items-center gap-2 text-xs text-success">
              <CheckCircle2 className="h-4 w-4" /> Etapa monitorada e logada em produção
            </div>
          </div>
        </div>
      </div>

      {/* Métricas — atualizadas */}
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { t: "Frequência",         v: "Semanal",   d: "Disparo via cron toda segunda 06:00" },
          { t: "Volume processado",  v: "~39.9k",    d: "Registros no banco — mar a mai/2026" },
          { t: "Custo médio mensal", v: "< US$ 5",   d: "OpenAI + Supabase free tier + n8n" },
        ].map((m) => (
          <div key={m.t} className="glass rounded-2xl p-5 shadow-card">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{m.t}</p>
            <p className="mt-2 text-2xl font-semibold">{m.v}</p>
            <p className="mt-1 text-xs text-muted-foreground">{m.d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}