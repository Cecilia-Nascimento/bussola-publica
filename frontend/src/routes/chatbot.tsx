import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Bot, User, KeyRound, Loader2 } from "lucide-react";
import OpenAI from "openai";
import { PageHeader } from "@/components/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

async function sendRealMessage(texto: string, apiKey: string): Promise<string> {
  const { data: props } = await supabase
    .from("proposicoes")
    .select("id, sigla_tipo, ementa, tema, resumo_ia")
    .not("tema", "is", null)
    .limit(30);

  const { data: deps } = await supabase
    .from("deputados")
    .select("nome, sigla_partido, sigla_uf")
    .limit(20);

  const contexto = `Você é assistente de inteligência legislativa da Bússola Pública.
Responda em português, de forma clara e objetiva.

PROPOSIÇÕES NO BANCO:
${(props || []).map((p: any) => `[${p.tema}] ${p.sigla_tipo} ${p.id}: ${(p.ementa || '').substring(0, 80)}. Resumo: ${(p.resumo_ia || '').substring(0, 60)}`).join('\n')}

DEPUTADOS (amostra):
${(deps || []).map((d: any) => `${d.nome} (${d.sigla_partido}/${d.sigla_uf})`).join(', ')}

Pergunta: ${texto}`;

  const openai = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true,
  });

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: contexto }],
    max_tokens: 400,
  });

  return completion.choices[0].message.content || "Não consegui obter resposta.";
}

export const Route = createFileRoute("/chatbot")({
  head: () => ({ meta: [{ title: "Chatbot Legislativo IA — Bússola Pública" }, { name: "description", content: "Pergunte sobre proposições, partidos e votações." }] }),
  component: Chatbot,
});

type Msg = { role: "assistant" | "user"; content: string };

const suggestions = [
  "Quais proposições de Saúde foram apresentadas?",
  "Quais partidos têm mais deputados?",
  "Resumo das proposições tributárias",
  "Quais votações recentes foram aprovadas?",
];

const fakeAnswers: Record<string, string> = {
  saúde: "Foram apresentadas 2.145 proposições de Saúde, com destaque para a PL 1234/2025 (telemedicina rural) e PL 2055/2025 (isenção de medicamentos de alto custo).",
  partidos: "As três maiores bancadas atualmente são PL (92), PT (68) e União Brasil (59 deputados).",
  tributárias: "Existem 1.832 proposições tributárias. Em destaque: PL 0987/2025 cria CIDE-Digital de 3% sobre big techs estrangeiras.",
  votações: "Das 1.741 votações registradas, 1.024 foram aprovadas (~58%). A mais recente aprovada trata da CIDE-Digital.",
};

function answerFor(q: string) {
  const lower = q.toLowerCase();
  for (const k of Object.keys(fakeAnswers)) if (lower.includes(k)) return fakeAnswers[k];
  return "Esta é uma resposta simulada. Conecte uma chave OpenAI para obter respostas contextualizadas em tempo real a partir dos 16.552 registros do banco.";
}

function Chatbot() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Olá! Sou o assistente da Bússola Pública. Posso responder sobre proposições, deputados, partidos e votações da Câmara. O que você quer saber hoje?" },
  ]);
  const [input, setInput] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    setMessages((m) => [...m, { role: "user", content: text }]);
    setInput("");

    if (apiKey.trim()) {
      setLoading(true);
      try {
        const resposta = await sendRealMessage(text, apiKey.trim());
        setMessages((m) => [...m, { role: "assistant", content: resposta }]);
      } catch (err: any) {
        setMessages((m) => [...m, { role: "assistant", content: `Erro ao chamar OpenAI: ${err?.message || err}` }]);
      } finally {
        setLoading(false);
      }
    } else {
      setTimeout(() => {
        setMessages((m) => [...m, { role: "assistant", content: answerFor(text) }]);
      }, 700);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Assistente"
        title="Chatbot Legislativo IA"
        description="Converse em linguagem natural com a base de dados estruturada da Câmara dos Deputados."
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        {/* Chat */}
        <div className="glass flex h-[600px] flex-col rounded-2xl shadow-card overflow-hidden">
          <div className="flex items-center gap-3 border-b border-border/60 bg-background/40 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-primary">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold">Assistente Bússola</h3>
              <div className="flex items-center gap-1.5 text-[10px] text-success">
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" /> Online · GPT-4o-mini
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${m.role === "user" ? "bg-accent/20 text-accent" : "bg-primary/20 text-primary"}`}>
                  {m.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${m.role === "user" ? "bg-gradient-primary text-primary-foreground" : "glass border-border/60"}`}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="glass border-border/60 max-w-[75%] rounded-2xl px-4 py-2.5 text-sm flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Consultando OpenAI...
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); send(input); }}
            className="border-t border-border/60 bg-background/40 p-3"
          >
            <div className="flex gap-2">
              <Input placeholder="Pergunte sobre proposições, deputados, partidos..." value={input} onChange={(e) => setInput(e.target.value)} disabled={loading} className="bg-background/40" />
              <Button type="submit" size="icon" disabled={loading} className="bg-gradient-primary text-primary-foreground border-0">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</Button>
            </div>
          </form>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="glass rounded-2xl p-4 shadow-card">
            <h4 className="flex items-center gap-2 text-sm font-semibold"><KeyRound className="h-4 w-4 text-warning" /> Chave OpenAI (opcional)</h4>
            <Input type="password" placeholder="sk-..." value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="mt-3 bg-background/40 text-xs" />
            <p className="mt-2 text-[11px] text-muted-foreground">Sem chave, respostas são simuladas a partir de dados mockados.</p>
          </div>

          <div className="glass rounded-2xl p-4 shadow-card">
            <h4 className="text-sm font-semibold mb-3">Sugestões</h4>
            <div className="space-y-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="w-full rounded-lg border border-border/60 bg-background/30 px-3 py-2 text-left text-xs hover:border-primary/50 hover:bg-primary/5 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
