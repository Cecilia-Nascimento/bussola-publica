import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, User, MessageSquare, Mail } from "lucide-react";
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

function Deputados() {
  const [q, setQ]                     = useState("");
  const [deputados, setDeputados]     = useState<Deputado[]>([]);
  const [loading, setLoading]         = useState(true);
  const [erro, setErro]               = useState("");
  const [openId, setOpenId]           = useState<number | null>(null);
  const navigate                      = useNavigate();

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

  const filtered = useMemo(
    () => deputados.filter(
      (d) =>
        d.nome.toLowerCase().includes(q.toLowerCase()) ||
        d.sigla_partido.toLowerCase().includes(q.toLowerCase()) ||
        d.sigla_uf.toLowerCase().includes(q.toLowerCase())
    ),
    [q, deputados]
  );

  function perguntarSobre(deputado: Deputado) {
    // Salva o contexto no sessionStorage para o chatbot ler
    sessionStorage.setItem("chatbot_pergunta", `Quais proposições o deputado ${deputado.nome} (${deputado.sigla_partido}/${deputado.sigla_uf}) apresentou?`);
    setOpenId(null);
    navigate({ to: "/chatbot" });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Atores políticos"
        title="Deputados"
        description="Perfis com dados consolidados de proposições por parlamentar."
      />

      <div className="glass rounded-2xl p-4 shadow-card">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, partido ou UF..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9 bg-background/40"
          />
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
              <img
                src={d.url_foto}
                alt={d.nome}
                className="h-12 w-12 rounded-full object-cover"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.style.display = "none";
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
              <a href={`mailto:${d.email}`} className="font-semibold text-primary hover:underline truncate max-w-[60%]">
                {d.email}
              </a>
            </div>

            <Dialog open={openId === d.id} onOpenChange={(open) => setOpenId(open ? d.id : null)}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="mt-3 w-full border-border/60 bg-background/30">
                  <User className="mr-2 h-3 w-3" /> Ver perfil
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl">
                <DialogHeader>
                  <DialogTitle>{d.nome}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={d.url_foto}
                      alt={d.nome}
                      className="h-20 w-20 rounded-full object-cover"
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.style.display = "none";
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = "flex";
                      }}
                    />
                    <div className="hidden h-20 w-20 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground text-xl font-semibold" aria-hidden>
                      {getIniciais(d.nome)}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{d.sigla_partido} · {d.sigla_uf}</p>
                      <p className="mt-1 text-sm flex items-center gap-1">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <a href={`mailto:${d.email}`} className="text-primary hover:underline">{d.email}</a>
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="glass rounded-lg p-3">
                      <div className="text-xs text-muted-foreground">Partido</div>
                      <div className="font-semibold">{d.sigla_partido}</div>
                    </div>
                    <div className="glass rounded-lg p-3">
                      <div className="text-xs text-muted-foreground">UF</div>
                      <div className="font-semibold">{d.sigla_uf}</div>
                    </div>
                    <div className="glass rounded-lg p-3">
                      <div className="text-xs text-muted-foreground">Legislatura</div>
                      <div className="font-semibold text-primary">{d.id_legislatura}ª</div>
                    </div>
                  </div>

                  <Button
                    className="w-full bg-gradient-primary text-primary-foreground border-0"
                    onClick={() => perguntarSobre(d)}
                  >
                    <MessageSquare className="mr-2 h-4 w-4" /> Perguntar sobre esse deputado
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        ))}
      </div>
    </div>
  );
}