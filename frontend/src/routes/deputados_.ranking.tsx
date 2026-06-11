import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Trophy, Coins, SlidersHorizontal } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from "recharts";
import { PageHeader } from "@/components/page-header";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/deputados_/ranking")({
  head: () => ({
    meta: [
      { title: "Ranking de gastos — Bússola Pública" },
      { name: "description", content: "Ranking dos deputados que mais gastam, no total e por categoria de despesa." },
    ],
  }),
  component: RankingDeputados,
});

interface DeputadoInfo {
  id: number;
  nome: string;
  sigla_partido: string;
  sigla_uf: string;
  url_foto: string;
}

interface RankItem {
  id: number;
  nome: string;
  sigla_partido: string;
  sigla_uf: string;
  url_foto: string;
  total: number;
  detalhe?: { categoria: string; total: number; fornecedores: { nome: string; total: number }[] }[];
}

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
  "oklch(0.7 0.17 40)",
  "oklch(0.68 0.16 180)",
  "oklch(0.74 0.16 310)",
  "oklch(0.72 0.18 100)",
  "oklch(0.66 0.17 0)",
  "oklch(0.7 0.15 220)",
  "oklch(0.78 0.14 50)",
  "oklch(0.66 0.16 280)",
  "oklch(0.72 0.16 140)",
  "oklch(0.7 0.15 350)",
  "oklch(0.64 0.14 250)",
  "oklch(0.76 0.15 70)",
];

const tooltipStyle = {
  backgroundColor: "oklch(0.22 0.028 240)",
  border: "1px solid oklch(0.32 0.03 245 / 0.6)",
  borderRadius: "10px",
  color: "oklch(0.97 0.01 230)",
  fontSize: 12,
};

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatPct(part: number, total: number) {
  if (!total) return "0%";
  return `${((part / total) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
}

function truncate(s: string, n = 18) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

function getIniciais(nome: string) {
  return nome.split(" ").map((n) => n[0]).slice(0, 2).join("");
}

const TOP_LISTA = 40; // quantos deputados aparecem no ranking

function RankingView({
  items,
  partyColors,
  onSelect,
}: {
  items: RankItem[];
  partyColors: Record<string, string>;
  onSelect: (item: RankItem) => void;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma despesa encontrada.</p>;
  }

  return (
    <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {items.slice(0, TOP_LISTA).map((d, i) => (
        <button
          key={d.id}
          type="button"
          onClick={() => onSelect(d)}
          className="flex w-full cursor-pointer items-center gap-2 rounded-xl border border-border/60 bg-background/30 px-3 py-2 text-left transition-colors hover:border-primary/50 hover:bg-background/50"
        >
          <span className={`w-5 shrink-0 text-center text-sm font-bold ${i < 3 ? "text-warning" : "text-muted-foreground"}`}>
            {i + 1}
          </span>
          <img src={d.url_foto} alt={d.nome} className="h-9 w-9 shrink-0 rounded-full object-cover"
            onError={(e) => {
              const target = e.currentTarget; target.style.display = "none";
              const fallback = target.nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = "flex";
            }}
          />
          <div className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground text-xs font-semibold" aria-hidden>
            {getIniciais(d.nome)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{d.nome}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: partyColors[d.sigla_partido] ?? "oklch(0.6 0.02 240)" }} />
              <span className="truncate">{d.sigla_partido} · {d.sigla_uf}</span>
            </div>
            <div className="text-sm font-semibold text-warning">{formatCurrency(d.total)}</div>
            <div className="text-[10px] text-muted-foreground">
              {(d.total / SALARIO_MINIMO).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} sal. mín.
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

function DetalheDeputado({ item, onClose }: { item: RankItem | null; onClose: () => void }) {
  const total = item?.total ?? 0;
  const nFornecedores = item?.detalhe?.reduce((s, c) => s + c.fornecedores.length, 0) ?? 0;
  const multiplas = (item?.detalhe?.length ?? 0) > 1; // % da categoria só faz sentido com +1 categoria

  return (
    <Dialog open={!!item} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        {item && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">{item.nome}</DialogTitle>
              <p className="text-sm text-muted-foreground">{item.sigla_partido} · {item.sigla_uf}</p>
            </DialogHeader>

            <div className="grid grid-cols-3 gap-3">
              <div className="glass rounded-xl p-3">
                <div className="text-xs text-muted-foreground">Total (filtrado)</div>
                <div className="text-base font-bold text-warning">{formatCurrency(total)}</div>
              </div>
              <div className="glass rounded-xl p-3">
                <div className="text-xs text-muted-foreground">Categorias</div>
                <div className="text-base font-bold">{item.detalhe?.length ?? 0}</div>
              </div>
              <div className="glass rounded-xl p-3">
                <div className="text-xs text-muted-foreground">Fornecedores</div>
                <div className="text-base font-bold">{nFornecedores}</div>
              </div>
            </div>

            <div className="space-y-4">
              {(item.detalhe ?? []).map((c) => (
                <div key={c.categoria} className="rounded-xl border border-border/60 bg-background/30 p-3">
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-primary">{c.categoria}</div>
                    <div className="shrink-0 text-right">
                      <div className="text-sm font-semibold text-warning">{formatCurrency(c.total)}</div>
                      <div className="text-[10px] text-muted-foreground">{formatPct(c.total, total)} do total</div>
                    </div>
                  </div>
                  {/* barra da categoria */}
                  <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-muted/40">
                    <div className="h-full rounded-full bg-primary/70" style={{ width: `${total ? (c.total / total) * 100 : 0}%` }} />
                  </div>
                  <ul className="space-y-1">
                    {c.fornecedores.map((f) => (
                      <li key={f.nome} className="flex items-center justify-between gap-2 text-xs">
                        <span className="min-w-0 flex-1 truncate text-muted-foreground">{f.nome}</span>
                        <span className="shrink-0 font-medium">{formatCurrency(f.total)}</span>
                        {multiplas && (
                          <span className="w-16 shrink-0 text-right text-[10px] text-primary" title="% dentro da categoria">
                            {formatPct(f.total, c.total)} cat.
                          </span>
                        )}
                        <span className="w-16 shrink-0 text-right text-[10px] text-muted-foreground" title="% do total">
                          {formatPct(f.total, total)} total
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function RankingDeputados() {
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [totalPorDep, setTotalPorDep] = useState<Record<number, number>>({});
  const [catPorDep, setCatPorDep] = useState<Record<string, Record<number, number>>>({});
  // deputado -> categoria -> fornecedor -> total
  const [fornByDepCat, setFornByDepCat] = useState<Record<number, Record<string, Record<string, number>>>>({});
  const [deputados, setDeputados] = useState<Record<number, DeputadoInfo>>({});
  const [catsSelecionadas, setCatsSelecionadas] = useState<string[]>([]);
  const [openId, setOpenId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErro("");

      // 1) Mapa de deputados (id -> info)
      const { data: deps, error: depErr } = await supabase
        .from("deputados")
        .select("id, nome, sigla_partido, sigla_uf, url_foto");
      if (cancelled) return;
      if (depErr) { setErro(depErr.message); setLoading(false); return; }
      const depMap: Record<number, DeputadoInfo> = {};
      (deps as DeputadoInfo[] ?? []).forEach((d) => { depMap[d.id] = d; });

      // 2) Todas as despesas (paginação de 1000 em 1000)
      const totais: Record<number, number> = {};
      const porCat: Record<string, Record<number, number>> = {};
      const fornDepCat: Record<number, Record<string, Record<string, number>>> = {};
      const size = 1000;
      let from = 0;
      while (true) {
        const { data, error } = await supabase
          .from("despesas")
          .select("id_deputado, tipo_despesa, valor_liquido, nome_fornecedor")
          .range(from, from + size - 1);
        if (cancelled) return;
        if (error) { setErro(error.message); break; }
        const rows = (data as { id_deputado: number; tipo_despesa: string; valor_liquido: number; nome_fornecedor: string }[]) ?? [];
        for (const r of rows) {
          totais[r.id_deputado] = (totais[r.id_deputado] || 0) + r.valor_liquido;
          const cat = r.tipo_despesa;
          if (!porCat[cat]) porCat[cat] = {};
          porCat[cat][r.id_deputado] = (porCat[cat][r.id_deputado] || 0) + r.valor_liquido;

          const forn = r.nome_fornecedor || "Não informado";
          if (!fornDepCat[r.id_deputado]) fornDepCat[r.id_deputado] = {};
          if (!fornDepCat[r.id_deputado][cat]) fornDepCat[r.id_deputado][cat] = {};
          fornDepCat[r.id_deputado][cat][forn] = (fornDepCat[r.id_deputado][cat][forn] || 0) + r.valor_liquido;
        }
        if (rows.length < size) break;
        from += size;
      }

      if (cancelled) return;
      setDeputados(depMap);
      setTotalPorDep(totais);
      setCatPorDep(porCat);
      setFornByDepCat(fornDepCat);
      setCatsSelecionadas(Object.keys(porCat)); // começa com todas selecionadas
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  // Helper: transforma um mapa {id -> total} em lista ordenada de RankItem
  function toRanking(mapa: Record<number, number>): RankItem[] {
    return Object.entries(mapa)
      .map(([id, total]) => {
        const dep = deputados[Number(id)];
        return {
          id: Number(id),
          nome: dep?.nome ?? `Deputado ${id}`,
          sigla_partido: dep?.sigla_partido ?? "—",
          sigla_uf: dep?.sigla_uf ?? "—",
          url_foto: dep?.url_foto ?? "",
          total,
        };
      })
      .sort((a, b) => b.total - a.total);
  }

  const rankingGeral = useMemo(() => toRanking(totalPorDep), [totalPorDep, deputados]);

  // Mapa estável de cores por partido (partidos que mais gastam recebem cores primeiro),
  // compartilhado entre as duas seções para manter consistência.
  const partyColors = useMemo(() => {
    const totalPorPartido: Record<string, number> = {};
    rankingGeral.forEach((d) => {
      totalPorPartido[d.sigla_partido] = (totalPorPartido[d.sigla_partido] || 0) + d.total;
    });
    const ordenados = Object.keys(totalPorPartido).sort((a, b) => totalPorPartido[b] - totalPorPartido[a]);
    const map: Record<string, string> = {};
    ordenados.forEach((p, i) => { map[p] = CHART_COLORS[i % CHART_COLORS.length]; });
    return map;
  }, [rankingGeral]);

  // Categorias ordenadas pelo gasto total da categoria (para o filtro)
  const categorias = useMemo(() => {
    return Object.entries(catPorDep)
      .map(([tipo, mapa]) => ({ tipo, total: Object.values(mapa).reduce((a, b) => a + b, 0) }))
      .sort((a, b) => b.total - a.total);
  }, [catPorDep]);

  // Começa com todas selecionadas. Estando todas selecionadas, o próximo clique faz
  // seleção única (só aquela categoria); a partir daí, seleção múltipla (toggle).
  function toggleCategoria(tipo: string) {
    setCatsSelecionadas((prev) => {
      const todasSelecionadas = categorias.length > 0 && prev.length === categorias.length;
      if (todasSelecionadas) return [tipo];
      return prev.includes(tipo) ? prev.filter((t) => t !== tipo) : [...prev, tipo];
    });
  }

  // Ranking calculado a partir das categorias selecionadas
  const ranking = useMemo(() => {
    const set = new Set(catsSelecionadas);
    const acc: Record<number, number> = {};
    for (const [cat, mapa] of Object.entries(catPorDep)) {
      if (!set.has(cat)) continue;
      for (const [id, v] of Object.entries(mapa)) {
        acc[Number(id)] = (acc[Number(id)] || 0) + v;
      }
    }
    // Anexa o detalhe de fornecedores agrupado por categoria (dentro das selecionadas)
    return toRanking(acc).map((item) => {
      const byCat = fornByDepCat[item.id] ?? {};
      const detalhe = Object.entries(byCat)
        .filter(([cat]) => set.has(cat))
        .map(([categoria, fmap]) => {
          const fornecedores = Object.entries(fmap)
            .map(([nome, total]) => ({ nome, total }))
            .sort((a, b) => b.total - a.total);
          const total = fornecedores.reduce((s, f) => s + f.total, 0);
          return { categoria, total, fornecedores };
        })
        .sort((a, b) => b.total - a.total);
      return { ...item, detalhe };
    });
  }, [catsSelecionadas, catPorDep, deputados, fornByDepCat]);

  const totalSelecionado = useMemo(
    () => ranking.reduce((a, d) => a + d.total, 0),
    [ranking],
  );

  const aberto = openId == null ? null : ranking.find((r) => r.id === openId) ?? null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link to="/deputados" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar para deputados
        </Link>
      </div>

      <PageHeader
        eyebrow="Cota parlamentar"
        title="Ranking de gastos"
        description="Deputados que mais gastam. Use o filtro para escolher as categorias de despesa. Período: maio/2026."
      />

      {erro && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          Erro ao carregar dados: {erro}
        </div>
      )}

      {/* Filtro de categorias */}
      <section className="glass rounded-2xl p-5 shadow-card">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <SlidersHorizontal className="h-4 w-4 text-primary" /> Gasto por categoria
            </h2>
            <p className="text-xs text-muted-foreground">Clique nas barras para filtrar o ranking abaixo.</p>
          </div>
          {!loading && categorias.length > 0 && (
            <div className="flex items-center gap-3 text-xs">
              <span className="text-muted-foreground">
                {catsSelecionadas.length} de {categorias.length} selecionadas
              </span>
              <button
                onClick={() => setCatsSelecionadas(categorias.map((c) => c.tipo))}
                className="font-medium text-primary hover:underline"
              >
                Todas
              </button>
              <button
                onClick={() => setCatsSelecionadas([])}
                className="font-medium text-muted-foreground hover:text-foreground hover:underline"
              >
                Limpar
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="h-80 rounded-lg bg-muted/40 animate-pulse" />
        ) : (
          <div className="h-80 cursor-pointer">
            <ResponsiveContainer>
              <BarChart
                data={categorias.map((c) => ({ ...c, ativa: catsSelecionadas.includes(c.tipo) }))}
                margin={{ left: -4, right: 8, top: 8, bottom: 4 }}
                onClick={(state: { activeLabel?: string }) => {
                  if (state?.activeLabel) toggleCategoria(state.activeLabel);
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.32 0.03 245 / 0.3)" vertical={false} />
                <XAxis
                  dataKey="tipo"
                  interval={0}
                  angle={-35}
                  textAnchor="end"
                  height={120}
                  tick={{ fontSize: 10, fill: "oklch(0.68 0.025 240)" }}
                  tickFormatter={(t) => truncate(String(t), 16)}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "oklch(0.68 0.025 240)" }}
                  tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`)}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{ fill: "oklch(0.72 0.16 240 / 0.08)" }}
                  formatter={(value) => [formatCurrency(Number(value)), "Total"]}
                  labelStyle={{ color: "oklch(0.97 0.01 230)" }}
                  itemStyle={{ color: "oklch(0.97 0.01 230)" }}
                />
                <Bar
                  dataKey="total"
                  radius={[6, 6, 0, 0]}
                  cursor="pointer"
                  background={{ fill: "oklch(0.72 0.16 240 / 0.06)", radius: 4 }}
                >
                  {categorias.map((c, i) => (
                    <Cell
                      key={c.tipo}
                      cursor="pointer"
                      fill={catsSelecionadas.includes(c.tipo) ? CHART_COLORS[i % CHART_COLORS.length] : "oklch(0.4 0.02 240)"}
                      fillOpacity={catsSelecionadas.includes(c.tipo) ? 1 : 0.5}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* Ranking dos deputados */}
      <section className="glass rounded-2xl p-5 shadow-card">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Trophy className="h-5 w-5 text-warning" /> Quem mais gasta
          </h2>
          {!loading && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Coins className="h-3.5 w-3.5 text-warning" />
              Total filtrado:{" "}
              <span className="font-semibold text-warning">{formatCurrency(totalSelecionado)}</span>
            </span>
          )}
        </div>

        {loading ? (
          <div className="h-72 rounded-xl bg-muted/40 animate-pulse" />
        ) : catsSelecionadas.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Clique nas colunas acima para escolher as categorias e montar o ranking.
          </p>
        ) : (
          <div className="max-h-[460px] overflow-y-auto pr-2">
            <RankingView items={ranking} partyColors={partyColors} onSelect={(it) => setOpenId(it.id)} />
          </div>
        )}
      </section>

      <DetalheDeputado item={aberto} onClose={() => setOpenId(null)} />
    </div>
  );
}
