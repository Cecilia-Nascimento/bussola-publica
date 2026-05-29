import { createFileRoute } from "@tanstack/react-router";
import { Sparkles, Brain, FileText, Database, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { TEMAS } from "@/lib/mock-data";

export const Route = createFileRoute("/ia")({
  head: () => ({ meta: [{ title: "Camada de IA — Bússola Pública" }, { name: "description", content: "Classificação temática e resumo executivo de proposições com OpenAI." }] }),
  component: IAPage,
});

const steps = [
  { icon: FileText, title: "1. Ementa bruta", desc: "Texto original da proposição é tokenizado e limpo." },
  { icon: Brain, title: "2. Embedding OpenAI", desc: "text-embedding-3-small gera vetor de 1536 dimensões." },
  { icon: Sparkles, title: "3. Similaridade de cosseno", desc: "Compara com vetores dos 10 temas pré-definidos." },
  { icon: Database, title: "4. Persistência", desc: "Tema + resumo_ia salvos na tabela proposicoes." },
];

function IAPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Inteligência artificial"
        title="Camada de IA"
        description="Pipeline cognitivo que enriquece cada proposição com classificação temática e resumo executivo gerados por modelos da OpenAI."
      />

      {/* Flow */}
      <div className="grid gap-3 md:grid-cols-4">
        {steps.map((s, i) => (
          <div key={i} className="glass relative rounded-2xl p-5 shadow-card">
            <s.icon className="mb-3 h-6 w-6 text-accent" />
            <h3 className="text-sm font-semibold">{s.title}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{s.desc}</p>
            {i < steps.length - 1 && (
              <ArrowRight className="absolute -right-3 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-muted-foreground md:block" />
            )}
          </div>
        ))}
      </div>

      {/* Techniques */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass rounded-2xl p-6 shadow-card">
          <h3 className="flex items-center gap-2 font-semibold"><Brain className="h-4 w-4 text-primary" /> Classificação por embeddings</h3>
          <p className="mt-2 text-sm text-muted-foreground">Cada tema é representado por um vetor médio de descrições canônicas. A ementa é convertida em vetor e atribuída ao tema com maior similaridade de cosseno.</p>
          <pre className="mt-4 overflow-x-auto rounded-lg border border-border/60 bg-background/40 p-3 text-[11px] leading-relaxed text-muted-foreground"><code>{`# pseudo-código
v_ementa = embed(proposicao.ementa)
scores = {t: cosine(v_ementa, v_tema[t]) for t in TEMAS}
tema, confianca = max(scores.items(), key=lambda x: x[1])`}</code></pre>
        </div>

        <div className="glass rounded-2xl p-6 shadow-card">
          <h3 className="flex items-center gap-2 font-semibold"><Sparkles className="h-4 w-4 text-accent" /> Resumo executivo com GPT-4o-mini</h3>
          <p className="mt-2 text-sm text-muted-foreground">Modelo recebe ementa + metadados e retorna resumo de ~2 frases em português, neutro e voltado a tomada de decisão.</p>
          <pre className="mt-4 overflow-x-auto rounded-lg border border-border/60 bg-background/40 p-3 text-[11px] leading-relaxed text-muted-foreground"><code>{`resumo = openai.chat.completions.create(
  model="gpt-4o-mini",
  messages=[
    {"role":"system","content":"Resuma a proposição em 2 frases."},
    {"role":"user","content": proposicao.ementa}
  ]
).choices[0].message.content`}</code></pre>
        </div>
      </div>

      {/* Themes */}
      <div>
        <h3 className="mb-4 text-lg font-semibold">Temas disponíveis</h3>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          {TEMAS.map((t) => (
            <div key={t.nome} className="glass rounded-xl p-4 shadow-card">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Tema</div>
              <div className="mt-1 font-semibold">{t.nome}</div>
              <div className="mt-2 text-xs text-primary">{t.total.toLocaleString("pt-BR")} classificadas</div>
            </div>
          ))}
        </div>
      </div>

      {/* Example */}
      <div className="glass rounded-2xl p-6 shadow-card">
        <h3 className="flex items-center gap-2 font-semibold"><Sparkles className="h-4 w-4 text-accent" /> Exemplo de proposição classificada</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Código</p>
            <p className="mt-1 font-mono text-base">PL 2210/2025</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Tema identificado</p>
            <p className="mt-1"><span className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-sm text-accent">Tecnologia</span></p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Score de confiança</p>
            <div className="mt-2 flex items-center gap-2">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-background/50">
                <div className="h-full bg-gradient-primary" style={{ width: "91%" }} />
              </div>
              <span className="text-sm font-semibold">0.91</span>
            </div>
          </div>
        </div>
        <div className="mt-6 rounded-xl border border-border/60 bg-background/40 p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Resumo executivo gerado pela IA</p>
          <p className="mt-2 text-sm leading-relaxed">
            Projeto estabelece um marco regulatório nacional para o uso de IA generativa em órgãos públicos, com supervisão pela ANPD e exigências de transparência algorítmica. Define sanções graduais para descumprimento e cria um sandbox regulatório para experimentação controlada.
          </p>
        </div>
      </div>
    </div>
  );
}
