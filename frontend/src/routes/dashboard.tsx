import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FileText, Users, Vote, Database, Sparkles, Clock } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
  LineChart, Line, CartesianGrid, Legend,
} from "recharts";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { VOTACOES_STATUS, EVOLUCAO_MENSAL } from "@/lib/mock-data";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Bússola Pública" }, { name: "description", content: "KPIs e gráficos analíticos sobre proposições, deputados e votações." }] }),
  component: Dashboard,
});

const CHART_COLORS = [
  "oklch(0.72 0.16 240)",
  "oklch(0.72 0.17 160)",
  "oklch(0.68 0.18 290)",
  "oklch(0.8 0.16 80)",
  "oklch(0.65 0.18 20)",
  "oklch(0.7 0.16 200)",
  "oklch(0.75 0.15 330)",
  "oklch(0.7 0.15 130)",
  "oklch(0.75 0.15 60)",
  "oklch(0.6 0.1 260)",
];

const tooltipStyle = {
  backgroundColor: "oklch(0.22 0.028 240)",
  border: "1px solid oklch(0.32 0.03 245 / 0.6)",
  borderRadius: "10px",
  color: "oklch(0.97 0.01 230)",
  fontSize: 12,
};

function ChartCard({ title, subtitle, children, className = "" }: { title: string; subtitle?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`glass rounded-2xl p-5 shadow-card ${className}`}>
      <div className="mb-4">
        <h3 className="font-semibold">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="h-64">{children}</div>
    </div>
  );
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted/40 ${className}`} />;
}

type TemaRow = { nome: string; total: number };
type PartidoRow = { sigla: string; deputados: number };

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ proposicoes: 0, deputados: 0, votacoes: 0, classificadas: 0 });
  const [temas, setTemas] = useState<TemaRow[]>([]);
  const [partidos, setPartidos] = useState<PartidoRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [propCount, depCount, votCount, classCount, temasRes, depsRes] = await Promise.all([
        supabase.from("proposicoes").select("*", { count: "exact", head: true }),
        supabase.from("deputados").select("*", { count: "exact", head: true }),
        supabase.from("votacoes").select("*", { count: "exact", head: true }),
        supabase.from("proposicoes").select("*", { count: "exact", head: true }).not("tema", "is", null),
        supabase.from("proposicoes").select("tema").not("tema", "is", null),
        supabase.from("deputados").select("sigla_partido"),
      ]);

      if (cancelled) return;

      setStats({
        proposicoes: propCount.count ?? 0,
        deputados: depCount.count ?? 0,
        votacoes: votCount.count ?? 0,
        classificadas: classCount.count ?? 0,
      });

      const temaMap = ((temasRes.data ?? []) as { tema: string | null }[]).reduce<Record<string, number>>((acc, r) => {
        const k = (r.tema ?? "").trim();
        if (!k) return acc;
        acc[k] = (acc[k] ?? 0) + 1;
        return acc;
      }, {});
      setTemas(
        Object.entries(temaMap)
          .map(([nome, total]) => ({ nome, total }))
          .sort((a, b) => b.total - a.total)
      );

      const partidoMap = ((depsRes.data ?? []) as { sigla_partido: string | null }[]).reduce<Record<string, number>>((acc, r) => {
        const k = (r.sigla_partido ?? "").trim();
        if (!k) return acc;
        acc[k] = (acc[k] ?? 0) + 1;
        return acc;
      }, {});
      setPartidos(
        Object.entries(partidoMap)
          .map(([sigla, deputados]) => ({ sigla, deputados }))
          .sort((a, b) => b.deputados - a.deputados)
          .slice(0, 10)
      );

      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const totalRegistros = stats.proposicoes + stats.deputados + stats.votacoes;
  const pctClassificadas = stats.proposicoes ? Math.round((stats.classificadas / stats.proposicoes) * 100) : 0;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Visão executiva"
        title="Dashboard analítico"
        description="Panorama geral dos dados coletados, transformados e classificados pelo pipeline."
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Proposições" value={loading ? "…" : stats.proposicoes.toLocaleString("pt-BR")} icon={FileText} accent="primary" />
        <StatCard label="Deputados ativos" value={loading ? "…" : stats.deputados.toLocaleString("pt-BR")} icon={Users} accent="success" />
        <StatCard label="Votações" value={loading ? "…" : stats.votacoes.toLocaleString("pt-BR")} icon={Vote} accent="accent" />
        <StatCard label="Registros totais" value={loading ? "…" : totalRegistros.toLocaleString("pt-BR")} icon={Database} accent="warning" />
        <StatCard label="Classificadas por IA" value={loading ? "…" : stats.classificadas.toLocaleString("pt-BR")} hint={loading ? undefined : `${pctClassificadas}% do total`} icon={Sparkles} accent="accent" />
        <StatCard label="Última atualização" value="06:00" hint="Hoje" icon={Clock} accent="primary" />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Proposições por tema" subtitle="Classificação automática via embeddings">
          {loading ? (
            <Skeleton className="h-full w-full" />
          ) : (
            <ResponsiveContainer>
              <BarChart data={temas} margin={{ left: -10, right: 10, top: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.32 0.03 245 / 0.3)" />
                <XAxis dataKey="nome" tick={{ fontSize: 10, fill: "oklch(0.68 0.025 240)" }} angle={-25} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11, fill: "oklch(0.68 0.025 240)" }} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "oklch(0.72 0.16 240 / 0.08)" }} />
                <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                  {temas.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Evolução mensal de proposições" subtitle="Últimos 11 meses">
          <ResponsiveContainer>
            <LineChart data={EVOLUCAO_MENSAL}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.32 0.03 245 / 0.3)" />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "oklch(0.68 0.025 240)" }} />
              <YAxis tick={{ fontSize: 11, fill: "oklch(0.68 0.025 240)" }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="total" stroke="oklch(0.72 0.16 240)" strokeWidth={3} dot={{ fill: "oklch(0.68 0.18 290)", r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Deputados por partido" subtitle="Top 10 bancadas">
          {loading ? (
            <Skeleton className="h-full w-full" />
          ) : (
            <ResponsiveContainer>
              <BarChart data={partidos} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.32 0.03 245 / 0.3)" />
                <XAxis type="number" tick={{ fontSize: 11, fill: "oklch(0.68 0.025 240)" }} />
                <YAxis type="category" dataKey="sigla" tick={{ fontSize: 11, fill: "oklch(0.68 0.025 240)" }} width={80} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "oklch(0.72 0.16 240 / 0.08)" }} />
                <Bar dataKey="deputados" fill="oklch(0.72 0.17 160)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Votações por status" subtitle="Distribuição percentual">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={VOTACOES_STATUS} dataKey="total" nameKey="status" innerRadius={55} outerRadius={90} paddingAngle={3}>
                {VOTACOES_STATUS.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11, color: "oklch(0.68 0.025 240)" }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>
    </div>
  );
}
