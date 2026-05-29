import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Compass,
  BarChart3,
  Workflow,
  MessageSquare,
  Sparkles,
  Bot,
  Mail,
  Database,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { STATS } from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bússola Pública — Inteligência legislativa com IA" },
      { name: "description", content: "Monitoramento de proposições, deputados e votações da Câmara dos Deputados com IA." },
    ],
  }),
  component: Index,
});

const valueCards = [
  { icon: Bot, title: "Redução do trabalho manual", desc: "Pipeline 100% automatizado da coleta ao relatório semanal.", accent: "text-primary" },
  { icon: Sparkles, title: "Classificação automática por IA", desc: "Embeddings + GPT-4o-mini categorizam cada proposição por tema.", accent: "text-accent" },
  { icon: Mail, title: "Relatórios semanais automatizados", desc: "Boletim executivo entregue toda segunda-feira às 6h via n8n.", accent: "text-success" },
  { icon: Database, title: "Dados estruturados em PostgreSQL", desc: "Modelo dimensional no Supabase pronto para BI e analytics.", accent: "text-warning" },
];

function Index() {
  return (
    <div className="space-y-16">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-hero px-6 py-16 md:px-12 md:py-24">
        <div className="absolute inset-0 -z-10 opacity-40" style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, oklch(0.72 0.16 240 / 0.3), transparent 40%), radial-gradient(circle at 80% 60%, oklch(0.68 0.18 290 / 0.3), transparent 45%)",
        }} />
        <div className="mx-auto max-w-4xl text-center space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-muted-foreground backdrop-blur">
            <Compass className="h-3.5 w-3.5 text-primary" />
            Plataforma acadêmica · Pipeline de dados públicos
          </span>
          <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
            <span className="gradient-text">Bússola Pública</span>
          </h1>
          <p className="mx-auto max-w-2xl text-base text-muted-foreground md:text-lg">
            Inteligência legislativa com IA para monitoramento de{" "}
            <strong className="text-foreground">proposições</strong>,{" "}
            <strong className="text-foreground">deputados</strong> e{" "}
            <strong className="text-foreground">votações</strong> da Câmara dos Deputados.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="bg-gradient-primary text-primary-foreground shadow-glow border-0 hover:opacity-90">
              <Link to="/dashboard"><BarChart3 className="mr-2 h-4 w-4" /> Ver Dashboard</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-border/80 bg-card/60 backdrop-blur">
              <Link to="/pipeline"><Workflow className="mr-2 h-4 w-4" /> Explorar Pipeline</Link>
            </Button>
            <Button asChild size="lg" variant="ghost">
              <Link to="/chatbot"><MessageSquare className="mr-2 h-4 w-4" /> Consultar IA</Link>
            </Button>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 pt-6 text-xs text-muted-foreground">
            <span>📊 {STATS.total.toLocaleString("pt-BR")} registros</span>
            <span>🏛️ {STATS.deputados} deputados</span>
            <span>📜 {STATS.proposicoes.toLocaleString("pt-BR")} proposições</span>
            <span>🗳️ {STATS.votacoes.toLocaleString("pt-BR")} votações</span>
          </div>
        </div>
      </section>

      {/* VALUE PROPS */}
      <section>
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-semibold md:text-3xl">O que a plataforma entrega</h2>
          <p className="mt-2 text-sm text-muted-foreground">Quatro pilares para transformar dados públicos em decisão.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {valueCards.map((c) => (
            <div key={c.title} className="glass rounded-2xl p-6 shadow-card hover:-translate-y-1 transition-all">
              <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border/60 bg-background/40 ${c.accent}`}>
                <c.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold">{c.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{c.desc}</p>
              <div className="mt-4 inline-flex items-center gap-1 text-xs text-success">
                <CheckCircle2 className="h-3.5 w-3.5" /> Em produção
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* QUICK LINKS */}
      <section className="grid gap-4 md:grid-cols-3">
        {[
          { to: "/dashboard", icon: BarChart3, title: "Dashboard executivo", desc: "KPIs, gráficos e distribuição temática." },
          { to: "/proposicoes", icon: Sparkles, title: "Proposições", desc: "Tabela filtrável com tema e resumo IA." },
          { to: "/apresentacao", icon: Compass, title: "Apresentação do projeto", desc: "Problema, solução e próximos passos." },
        ].map((l) => (
          <Link key={l.to} to={l.to} className="glass rounded-2xl p-6 shadow-card group hover:border-primary/50 transition-colors">
            <div className="flex items-center justify-between">
              <l.icon className="h-6 w-6 text-primary" />
              <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
            </div>
            <h3 className="mt-4 font-semibold">{l.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{l.desc}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
