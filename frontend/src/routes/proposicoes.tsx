import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, Filter, Eye, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/proposicoes")({
  head: () => ({
    meta: [
      { title: "Proposições — Bússola Pública" },
      { name: "description", content: "Tabela filtrável de proposições com classificação e resumo IA." },
    ],
  }),
  component: Proposicoes,
});

interface Proposicao {
  id: number;
  sigla_tipo: string;
  ementa: string;
  tema: string;
  resumo_ia: string;
  data_apresentacao: string;
}

function SkeletonRow() {
  return (
    <tr className="border-b border-border/30">
      <td className="px-4 py-3"><div className="h-3 w-16 rounded bg-muted animate-pulse" /></td>
      <td className="px-4 py-3"><div className="h-3 w-10 rounded bg-muted animate-pulse" /></td>
      <td className="px-4 py-3 max-w-md"><div className="h-3 w-full rounded bg-muted animate-pulse" /></td>
      <td className="px-4 py-3"><div className="h-3 w-16 rounded bg-muted animate-pulse" /></td>
      <td className="px-4 py-3"><div className="h-3 w-20 rounded bg-muted animate-pulse" /></td>
      <td className="px-4 py-3 text-right"><div className="h-6 w-8 rounded bg-muted animate-pulse ml-auto" /></td>
    </tr>
  );
}

function Proposicoes() {
  const [tema, setTema] = useState("todos");
  const [tipo, setTipo] = useState("todos");
  const [q, setQ] = useState("");
  const [proposicoes, setProposicoes] = useState<Proposicao[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    supabase
      .from("proposicoes")
      .select("id, sigla_tipo, ementa, tema, resumo_ia, data_apresentacao")
      .not("tema", "is", null)
      .order("id", { ascending: false })
      .limit(100)
      .then(({ data, error }) => {
        if (cancelled) return;
        setLoading(false);
        if (error) {
          setErro(error.message);
          return;
        }
        setProposicoes((data as Proposicao[]) ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const temas = useMemo(
    () => [...new Set(proposicoes.map((p) => p.tema).filter(Boolean))].sort(),
    [proposicoes]
  );

  const tipos = useMemo(
    () => [...new Set(proposicoes.map((p) => p.sigla_tipo).filter(Boolean))].sort(),
    [proposicoes]
  );

  const filtered = useMemo(() => {
    return proposicoes.filter((p) => {
      if (tema !== "todos" && p.tema !== tema) return false;
      if (tipo !== "todos" && p.sigla_tipo !== tipo) return false;
      if (
        q &&
        !(
          p.ementa.toLowerCase().includes(q.toLowerCase()) ||
          String(p.id).toLowerCase().includes(q.toLowerCase())
        )
      )
        return false;
      return true;
    });
  }, [tema, tipo, q, proposicoes]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Acervo"
        title="Proposições"
        description="Explore as proposições classificadas pela IA. Filtre por tema, tipo, palavra-chave ou autor."
      />

      {/* Filters */}
      <div className="glass rounded-2xl p-4 shadow-card">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por ID ou ementa..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9 bg-background/40"
            />
          </div>
          <Select value={tema} onValueChange={setTema}>
            <SelectTrigger className="bg-background/40"><SelectValue placeholder="Tema" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os temas</SelectItem>
              {temas.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={tipo} onValueChange={setTipo}>
            <SelectTrigger className="bg-background/40"><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os tipos</SelectItem>
              {tipos.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Filter className="h-3 w-3" /> {filtered.length} de {proposicoes.length} proposições
        </div>
      </div>

      {erro && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          Erro ao carregar proposições: {erro}
        </div>
      )}

      {/* Table */}
      <div className="glass rounded-2xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-background/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 font-medium">ID</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Ementa</th>
                <th className="px-4 py-3 font-medium">Tema</th>
                <th className="px-4 py-3 font-medium">Data</th>
                <th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading && Array.from({ length: 10 }).map((_, i) => <SkeletonRow key={i} />)}

              {!loading &&
                filtered.map((p) => (
                  <tr key={p.id} className="border-b border-border/30 hover:bg-primary/5">
                    <td className="px-4 py-3 font-mono text-xs">{p.id}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
                        {p.sigla_tipo}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-md text-muted-foreground line-clamp-2">{p.ementa}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[10px] text-accent">
                        {p.tema}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {p.data_apresentacao ? new Date(p.data_apresentacao).toLocaleDateString("pt-BR") : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="ghost"><Eye className="h-4 w-4" /></Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle className="font-mono">{p.id}</DialogTitle>
                            <DialogDescription>
                              Tipo: {p.sigla_tipo} · Tema: {p.tema}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 text-sm">
                            <div>
                              <p className="text-xs uppercase tracking-wider text-muted-foreground">Ementa</p>
                              <p className="mt-1">{p.ementa}</p>
                            </div>
                            <div className="rounded-xl border border-accent/30 bg-accent/5 p-4">
                              <p className="flex items-center gap-2 text-xs uppercase tracking-wider text-accent">
                                <Sparkles className="h-3 w-3" /> Resumo gerado por IA
                              </p>
                              <p className="mt-2">{p.resumo_ia}</p>
                            </div>
                            <div className="flex gap-4 text-xs">
                              <div>
                                <span className="text-muted-foreground">Data:</span>{" "}
                                {p.data_apresentacao
                                  ? new Date(p.data_apresentacao).toLocaleDateString("pt-BR")
                                  : "—"}
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </td>
                  </tr>
                ))}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">Nenhuma proposição encontrada com os filtros atuais.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
