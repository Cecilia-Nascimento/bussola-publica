# 🧭 Bússola Pública
## Pipeline de Inteligência Legislativa com IA

**Projeto Integrador — Pós-Graduação em Engenharia de Dados**
Cecilia Nascimento | 2026

---

## SLIDE 1 — O Problema

### Hoje na Bússola Pública

> *"Dois analistas lendo o site da Câmara o dia inteiro para montar
> um relatório semanal vendido a R$ 15 mil por mês por cliente."*

**Os gargalos:**

| Problema | Impacto |
|----------|---------|
| Sem base de dados | Analistas trabalham em planilhas pessoais |
| Sem histórico | Tudo consultado se perde |
| Classificação inconsistente | Cada analista usa critério próprio |
| Alertas manuais | Cliente pego de surpresa |
| Zero métricas | Ninguém sabe o volume real de pautas |

**A oportunidade:** A API da Câmara é pública, gratuita e atualizada
diariamente. O problema não é falta de dado — é falta de engenharia.

---

## SLIDE 2 — A Solução

### Pipeline ETL completo com IA em 5 etapas

🏛️ API Câmara
↓
🐍 Extração Python (requests + paginação automática)
↓
🐼 Transformação Pandas (normalização + validação)
↓
🐘 PostgreSQL Supabase (4 tabelas, 16.552 registros)
↓
🤖 Camada IA OpenAI (classificação + resumos)
↓
⚡ n8n (relatório semanal automático por email)

**Resultado:** Pipeline que roda sozinho toda segunda às 6h da manhã
sem nenhum analista envolvido.

---

## SLIDE 3 — Demo: Banco de Dados

### PostgreSQL na nuvem — Supabase

**4 tabelas estruturadas:**

| Tabela | Tipo | Registros |
|--------|------|-----------|
| `deputados` | Dimensão | 513 |
| `partidos` | Dimensão | 21 |
| `proposicoes` | Fato | 14.277 |
| `votacoes` | Fato | 1.741 |
| **Total** | | **16.552** |

**Colunas geradas por IA:**
- `tema` — classificação via embeddings (similaridade de cosseno)
- `resumo_ia` — resumo executivo de 2 linhas via GPT-4o-mini

🔗 **Link:** https://supabase.com/dashboard/project/cbaakbwnwqnelqtdwley

---

## SLIDE 4 — Camada de IA

### O que diferencia esse pipeline de um genérico

**Caminho A — Classificação temática por embeddings**

```python
# 1. Gera embedding da ementa
embedding_ementa = get_embedding(ementa)

# 2. Compara com embedding de cada tema
for tema, embedding_tema in temas.items():
    score = cosine_similarity(embedding_ementa, embedding_tema)

# 3. Tema com maior score = classificação
```

**Temas classificados:**
Saúde | Tributário | Tecnologia | Trabalho | Meio Ambiente
Educação | Segurança Pública | Economia | Infraestrutura | Outros

**Caminho B — Resumo executivo**

Prompt: "Resuma essa proposição em 2 linhas em linguagem
clara para um executivo."
Modelo: gpt-4o-mini
Custo: ~$0.0003 por 20 proposições

**Resultado real:**
> [Tributário] PL 328385 — A proposta visa revogar um artigo da
> Emenda Constitucional nº 41 de 2003, impactando a gestão de
> recursos públicos e políticas sociais.

---

## SLIDE 5 — Demo: Automação n8n

### Workflow publicado — roda todo segunda às 6h

⏰ Schedule Trigger (segunda, 06:00)
↓
🐘 Execute SQL Query (Supabase)
SELECT id, ementa, tema, resumo_ia
FROM proposicoes
WHERE tema IS NOT NULL
ORDER BY data_apresentacao DESC
LIMIT 5
↓
📧 Gmail — Send Message
Para: cliente@empresa.com
Assunto: 🏛️ Bússola Pública — Proposições da Semana
Corpo: HTML formatado com tema + ementa + resumo IA

**Impacto:** Relatório que levava 2 analistas 8h/semana
agora é entregue automaticamente em segundos.

**Custo operacional:** ~$0.01 por semana de embeddings e resumos.

---

## SLIDE 6 — Próximos Passos

### O que viria na versão 2.0

**Curto prazo (1 mês):**
- [ ] Expandir para 1 ano de histórico de proposições
- [ ] Adicionar endpoint de despesas parlamentares
- [ ] Alertas por Telegram quando tema crítico é apresentado
- [ ] Dashboard público para clientes

**Médio prazo (3 meses):**
- [ ] Ingestão incremental diária automática
- [ ] Score de relevância por perfil de cliente
- [ ] API própria para integração com CRMs
- [ ] Análise de votações por partido e tema

**Longo prazo:**
- [ ] Modelo fine-tuned para classificação legislativa brasileira
- [ ] Predição de aprovação de proposições
- [ ] Integração com Senado Federal

---

### Repositório

🔗 GitHub: https://github.com/Cecilia-Nascimento/bussola-publica

🔗 Site interativo: https://cecilia-nascimento.github.io/bussola-publica

🔗 Banco de dados: https://supabase.com/dashboard/project/cbaakbwnwqnelqtdwley

---

*Pipeline construído com: Python 3.11 | Pandas | SQLAlchemy |
PostgreSQL | OpenAI API | n8n | GitHub Pages*