import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, User, MessageSquare, Mail, TrendingDown, Wallet, Receipt, Layers, Coins, Trophy } from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from "recharts";
import { PageHeader } from "@/components/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/deputados")({
  head: () => ({
    meta: [
      { title: "Deputados — Bússola Pública" },
      { name: "description", content: "Cards e perfis dos deputados ativos da Câmara." },
    ],
  }),
  component: Deputados,
});

interface Deputado {
  id: number;
  nome: string;
  sigla_partido: string;
  sigla_uf: string;
  id_legislatura: number;
  email: string;
  url_foto: string;
}

interface Despesa {
  tipo_despesa: string;
  valor_liquido: number;
  data_documento: string;
}

const MESES_PT = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

// Salário mínimo vigente em 2026 (decreto que reajustou para R$ 1.621 a partir de 01/01/2026).
const SALARIO_MINIMO = 1621;

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

function truncate(s: string, n = 22) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

function SkeletonCard() {
  return (
    <div className="glass rounded-2xl p-5 shadow-card animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-muted" />
        <div className="space-y-2 flex-1">
          <div className="h-4 w-3/4 rounded bg-muted" />
          <div className="h-3 w-1/2 rounded bg-muted" />
        </div>
      </div>
      <div className="mt-4 h-8 rounded-lg bg-muted" />
      <div className="mt-3 h-8 rounded-lg bg-muted" />
    </div>
  );
}

function getIniciais(nome: string) {
  return nome.split(" ").map((n) => n[0]).slice(0, 2).join("");
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function Deputados() {
  const [q, setQ]                   = useState("");
  const [deputados, setDeputados]   = useState<Deputado[]>([]);
  const [loading, setLoading]       = useState(true);
  const [erro, setErro]             = useState("");
  const [openId, setOpenId]         = useState<number | null>(null);
  const [despesas, setDespesas]     = useState<Despesa[]>([]);
  const [loadingDesp, setLoadingDesp] = useState(false);
  const navigate                    = useNavigate();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    supabase
      .from("deputados")
      .select("id, nome, sigla_partido, sigla_uf, id_legislatura, email, url_foto")
      .order("nome")
      .then(({ data, error }) => {
        if (cancelled) return;
        setLoading(false);
        if (error) { setErro(error.message); return; }
        setDeputados((data as Deputado[]) ?? []);
      });
    return () => { cancelled = true; };
  }, []);

  // Busca despesas quando abre o modal
  useEffect(() => {
    if (!openId) { setDespesas([]); return; }
    setLoadingDesp(true);
    supabase
      .from("despesas")
      .select("tipo_despesa, valor_liquido, data_documento")
      .eq("id_deputado", openId)
      .then(({ data }) => {
        setDespesas((data as Despesa[]) ?? []);
        setLoadingDesp(false);
      });
  }, [openId]);

  const filtered = useMemo(
    () => deputados.filter(
      (d) =>
        d.nome.toLowerCase().includes(q.toLowerCase()) ||
        d.sigla_partido.toLowerCase().includes(q.toLowerCase()) ||
        d.sigla_uf.toLowerCase().includes(q.toLowerCase())
    ),
    [q, deputados]
  );

  // Agrupa despesas por categoria (todas, ordenadas — para o gráfico de barras)
  const categorias = useMemo(() => {
    const map: Record<string, number> = {};
    despesas.forEach(d => {
      map[d.tipo_despesa] = (map[d.tipo_despesa] || 0) + d.valor_liquido;
    });
    return Object.entries(map)
      .map(([tipo, total]) => ({ tipo, total }))
      .sort((a, b) => b.total - a.total);
  }, [despesas]);

  // Agrupa despesas por mês (data_documento) — para o gráfico de linha
  const gastoPorMes = useMemo(() => {
    const map: Record<string, number> = {};
    despesas.forEach(d => {
      const key = (d.data_documento || "").slice(0, 7); // YYYY-MM
      if (!key) return;
      map[key] = (map[key] || 0) + d.valor_liquido;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, total]) => {
        const [ano, mes] = key.split("-");
        return { mes: `${MESES_PT[parseInt(mes, 10) - 1]}/${ano.slice(2)}`, total };
      });
  }, [despesas]);

  const totalGasto = despesas.reduce((acc, d) => acc + d.valor_liquido, 0);
  const salariosMinimos = totalGasto / SALARIO_MINIMO;

  function perguntarSobre(deputado: Deputado) {
    sessionStorage.setItem("chatbot_pergunta", `Quais proposições o deputado ${deputado.nome} (${deputado.sigla_partido}/${deputado.sigla_uf}) apresentou?`);
    setOpenId(null);
    navigate({ to: "/chatbot" });
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Atores políticos" title="Deputados" description="Perfis com dados consolidados de proposições e despesas por parlamentar." />

      <div className="glass rounded-2xl p-4 shadow-card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar por nome, partido ou UF..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9 bg-background/40" />
          </div>
          <Link
            to="/deputados/ranking"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-glow border-0 whitespace-nowrap"
          >
            <Trophy className="h-4 w-4" /> Ranking de gastos
          </Link>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{filtered.length} deputados encontrados</p>
      </div>

      {erro && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          Erro ao carregar deputados: {erro}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {loading && Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}

        {!loading && filtered.map((d) => (
          <div key={d.id} className="glass rounded-2xl p-5 shadow-card hover:-translate-y-0.5 transition-all">
            <div className="flex items-center gap-3">
              <img src={d.url_foto} alt={d.nome} className="h-12 w-12 rounded-full object-cover"
                onError={(e) => {
                  const target = e.currentTarget; target.style.display = "none";
                  const fallback = target.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = "flex";
                }}
              />
              <div className="hidden h-12 w-12 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground font-semibold" aria-hidden>
                {getIniciais(d.nome)}
              </div>
              <div>
                <h3 className="font-semibold leading-tight">{d.nome}</h3>
                <p className="text-xs text-muted-foreground">{d.sigla_partido} · {d.sigla_uf}</p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between rounded-lg border border-border/60 bg-background/30 px-3 py-2 text-xs">
              <span className="text-muted-foreground">Email</span>
              <a href={`mailto:${d.email}`} className="font-semibold text-primary hover:underline truncate max-w-[60%]">{d.email}</a>
            </div>

            <Dialog open={openId === d.id} onOpenChange={(open) => setOpenId(open ? d.id : null)}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="mt-3 w-full border-border/60 bg-background/30">
                  <User className="mr-2 h-3 w-3" /> Ver perfil
                </Button>
              </DialogTrigger>
              <DialogContent className="fixed inset-4 sm:inset-8 block h-auto w-auto max-w-none translate-x-0 translate-y-0 rounded-2xl border p-6 sm:p-8 overflow-y-auto">
                <div className="mx-auto w-full max-w-5xl space-y-6">
                <DialogHeader><DialogTitle className="text-2xl">{d.nome}</DialogTitle></DialogHeader>
                <div className="space-y-5">
                  {/* Cabeçalho do perfil */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <img src={d.url_foto} alt={d.nome} className="h-24 w-24 rounded-full object-cover"
                      onError={(e) => {
                        const target = e.currentTarget; target.style.display = "none";
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = "flex";
                      }}
                    />
                    <div className="hidden h-24 w-24 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground text-2xl font-semibold" aria-hidden>
                      {getIniciais(d.nome)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">{d.sigla_partido} · {d.sigla_uf} · {d.id_legislatura}ª legislatura</p>
                      <p className="mt-1 text-sm flex items-center gap-1">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <a href={`mailto:${d.email}`} className="text-primary hover:underline">{d.email}</a>
                      </p>
                    </div>
                  </div>

                  {/* KPIs de despesas */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="glass rounded-xl p-4">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Wallet className="h-3.5 w-3.5 text-warning" /> Total em despesas</div>
                      <div className="mt-1 text-lg font-bold text-warning">{loadingDesp ? "—" : formatCurrency(totalGasto)}</div>
                    </div>
                    <div className="glass rounded-xl p-4">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Coins className="h-3.5 w-3.5 text-warning" /> Salários mínimos</div>
                      <div className="mt-1 text-lg font-bold text-warning">
                        {loadingDesp ? "—" : salariosMinimos.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}
                      </div>
                      <div className="text-[10px] text-muted-foreground">de R$ {SALARIO_MINIMO.toLocaleString("pt-BR")} (2026)</div>
                    </div>
                    <div className="glass rounded-xl p-4">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Receipt className="h-3.5 w-3.5 text-primary" /> Lançamentos</div>
                      <div className="mt-1 text-lg font-bold">{loadingDesp ? "—" : despesas.length}</div>
                    </div>
                    <div className="glass rounded-xl p-4">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Layers className="h-3.5 w-3.5 text-primary" /> Categorias</div>
                      <div className="mt-1 text-lg font-bold">{loadingDesp ? "—" : categorias.length}</div>
                    </div>
                  </div>

                  {loadingDesp ? (
                    <div className="h-64 rounded-xl bg-muted/40 animate-pulse" />
                  ) : despesas.length === 0 ? (
                    <div className="rounded-xl border border-border/60 bg-background/30 p-6 text-center text-sm text-muted-foreground">
                      Nenhuma despesa registrada para este deputado.
                    </div>
                  ) : (
                    <>
                      {/* Gráfico de barras horizontal — despesas por categoria */}
                      <div className="rounded-xl border border-border/60 bg-background/30 p-4">
                        <h4 className="flex items-center gap-2 text-sm font-semibold mb-3">
                          <TrendingDown className="h-4 w-4 text-warning" /> Despesas por categoria
                        </h4>
                        <div style={{ height: Math.max(200, categorias.length * 38) }}>
                          <ResponsiveContainer>
                            <BarChart data={categorias} layout="vertical" margin={{ left: 10, right: 16 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.32 0.03 245 / 0.3)" />
                              <XAxis
                                type="number"
                                tick={{ fontSize: 11, fill: "oklch(0.68 0.025 240)" }}
                                tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`)}
                              />
                              <YAxis
                                type="category"
                                dataKey="tipo"
                                width={150}
                                tick={{ fontSize: 10, fill: "oklch(0.97 0.01 230)" }}
                                tickFormatter={(t) => truncate(String(t))}
                              />
                              <Tooltip
                                contentStyle={tooltipStyle}
                                cursor={{ fill: "oklch(0.72 0.16 240 / 0.08)" }}
                                formatter={(value) => [formatCurrency(Number(value)), "Total"]}
                                labelStyle={{ color: "oklch(0.97 0.01 230)" }}
                                itemStyle={{ color: "oklch(0.97 0.01 230)" }}
                              />
                              <Bar dataKey="total" radius={[0, 6, 6, 0]}>
                                {categorias.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Gráfico de linha — gasto por mês */}
                      <div className="rounded-xl border border-border/60 bg-background/30 p-4">
                        <h4 className="flex items-center gap-2 text-sm font-semibold mb-3">
                          <Wallet className="h-4 w-4 text-primary" /> Gasto por mês
                        </h4>
                        <div className="h-60">
                          <ResponsiveContainer>
                            <LineChart data={gastoPorMes} margin={{ left: -6, right: 16, top: 8 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.32 0.03 245 / 0.3)" />
                              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "oklch(0.68 0.025 240)" }} />
                              <YAxis
                                tick={{ fontSize: 11, fill: "oklch(0.68 0.025 240)" }}
                                tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`)}
                              />
                              <Tooltip
                                contentStyle={tooltipStyle}
                                formatter={(value) => [formatCurrency(Number(value)), "Gasto"]}
                                labelStyle={{ color: "oklch(0.97 0.01 230)" }}
                                itemStyle={{ color: "oklch(0.97 0.01 230)" }}
                              />
                              <Line
                                type="monotone"
                                dataKey="total"
                                stroke="oklch(0.72 0.16 240)"
                                strokeWidth={2.5}
                                dot={{ r: 4, fill: "oklch(0.72 0.16 240)" }}
                                activeDot={{ r: 6 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </>
                  )}

                  <Button className="w-full bg-gradient-primary text-primary-foreground border-0" onClick={() => perguntarSobre(d)}>
                    <MessageSquare className="mr-2 h-4 w-4" /> Perguntar sobre esse deputado
                  </Button>
                </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        ))}
      </div>
    </div>
  );
}