import { createFileRoute } from "@tanstack/react-router";
import { Clock, Database, FileText, Mail, Send, CheckCircle2, Cog } from "lucide-react";
import { PageHeader } from "@/components/page-header";

export const Route = createFileRoute("/automacao")({
  head: () => ({ meta: [{ title: "Automação n8n — Bússola Pública" }, { name: "description", content: "Fluxo de orquestração semanal no n8n." }] }),
  component: Automacao,
});

const timeline = [
  { icon: Clock, hora: "06:00 - Segunda", titulo: "Schedule Trigger", desc: "Cron semanal dispara o workflow no n8n Cloud." },
  { icon: Database, hora: "06:00:02", titulo: "Query SQL no Supabase", desc: "SELECT das proposições da semana ordenadas por relevância." },
  { icon: FileText, hora: "06:00:05", titulo: "Seleção de 5 proposições", desc: "Top 5 mais relevantes filtradas pela camada de IA." },
  { icon: Mail, hora: "06:00:08", titulo: "Geração de e-mail HTML", desc: "Template responsivo populado com resumos da IA." },
  { icon: Send, hora: "06:00:10", titulo: "Envio via Gmail", desc: "Boletim entregue à lista de assinantes." },
];

const beneficios = [
  { titulo: "Relatório automático", desc: "Zero ação manual após o setup." },
  { titulo: "Menos trabalho manual", desc: "Substitui 4h+ de curadoria semanal." },
  { titulo: "Entrega recorrente", desc: "Compromisso editorial garantido." },
  { titulo: "Baixo custo operacional", desc: "Menos de US$ 5 por mês de execução." },
];

function Automacao() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Orquestração"
        title="Automação n8n"
        description="Workflow agendado que conecta o banco de dados à entrega do boletim executivo semanal."
      />

      <div className="glass rounded-2xl p-6 shadow-card">
        <div className="mb-6 flex items-center gap-2">
          <Cog className="h-5 w-5 text-primary animate-spin" style={{ animationDuration: "8s" }} />
          <h3 className="font-semibold">Fluxo semanal</h3>
        </div>
        <ol className="relative space-y-6 border-l border-border/60 pl-6">
          {timeline.map((step, i) => (
            <li key={i} className="relative">
              <div className="absolute -left-[34px] flex h-8 w-8 items-center justify-center rounded-full bg-gradient-primary shadow-glow">
                <step.icon className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="glass rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">{step.titulo}</h4>
                  <span className="text-[10px] text-muted-foreground">{step.hora}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">Benefícios</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {beneficios.map((b) => (
            <div key={b.titulo} className="glass rounded-xl p-5 shadow-card">
              <CheckCircle2 className="mb-3 h-5 w-5 text-success" />
              <h4 className="font-semibold text-sm">{b.titulo}</h4>
              <p className="mt-1 text-xs text-muted-foreground">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
