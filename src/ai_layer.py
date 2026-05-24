# src/ai_layer.py
# ─────────────────────────────────────────────────────────────
# Etapa 4 — Camada de IA
# Responsável: classificar proposições por tema via embeddings
# e gerar resumos executivos via LLM
# ─────────────────────────────────────────────────────────────

import os
import time
import logging
import numpy as np
import pandas as pd
from dotenv import load_dotenv
from openai import OpenAI
from sqlalchemy import create_engine, text

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger(__name__)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


# ─────────────────────────────────────────────────────────────
# Temas para classificação
# ─────────────────────────────────────────────────────────────
TEMAS = {
    "Saúde":             "saúde pública, medicamentos, hospitais, SUS, doenças, médicos, enfermagem",
    "Tributário":        "impostos, tributos, taxas, receita federal, ICMS, IR, reforma tributária",
    "Tecnologia":        "tecnologia, inteligência artificial, internet, dados, software, inovação digital",
    "Trabalho":          "trabalho, emprego, CLT, salário mínimo, previdência, aposentadoria, trabalhadores",
    "Meio Ambiente":     "meio ambiente, sustentabilidade, clima, desmatamento, biodiversidade, poluição",
    "Educação":          "educação, escolas, universidades, ensino, MEC, professores, alunos",
    "Segurança Pública": "segurança pública, polícia, crime, violência, presídios, drogas",
    "Economia":          "economia, finanças, banco central, juros, inflação, PIB, orçamento",
    "Infraestrutura":    "infraestrutura, obras, rodovias, saneamento, habitação, transporte",
    "Outros":            "assuntos gerais, homenagens, denominações, datas comemorativas",
}


# ─────────────────────────────────────────────────────────────
# Função 1 — Gerar embedding de um texto
# ─────────────────────────────────────────────────────────────
def get_embedding(text: str, attempt: int = 1) -> list | None:
    """
    Gera embedding de um texto usando text-embedding-3-small.
    Retorna lista de floats ou None em caso de falha.
    """
    try:
        response = client.embeddings.create(
            model="text-embedding-3-small",
            input=text[:8000]   # limite de tokens do modelo
        )
        return response.data[0].embedding

    except Exception as e:
        logger.warning(f"Erro no embedding (tentativa {attempt}): {e}")
        if attempt < 3:
            time.sleep(2 ** attempt)
            return get_embedding(text, attempt + 1)
        return None


# ─────────────────────────────────────────────────────────────
# Função 2 — Similaridade de cosseno
# ─────────────────────────────────────────────────────────────
def cosine_similarity(a: list, b: list) -> float:
    """
    Calcula similaridade de cosseno entre dois vetores.
    Retorna valor entre 0 e 1 — quanto maior, mais similar.
    """
    a = np.array(a)
    b = np.array(b)
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))


# ─────────────────────────────────────────────────────────────
# Função 3 — Classificar tema por similaridade
# ─────────────────────────────────────────────────────────────
def classify_tema(ementa: str, temas_embeddings: dict) -> str:
    """
    Classifica uma proposição no tema mais similar.
    Compara o embedding da ementa com os embeddings dos temas.
    """
    emb_ementa = get_embedding(ementa)
    if emb_ementa is None:
        return "Outros"

    melhor_tema  = "Outros"
    melhor_score = -1

    for tema, emb_tema in temas_embeddings.items():
        score = cosine_similarity(emb_ementa, emb_tema)
        if score > melhor_score:
            melhor_score = score
            melhor_tema  = tema

    return melhor_tema


# ─────────────────────────────────────────────────────────────
# Função 4 — Gerar resumo executivo via LLM
# ─────────────────────────────────────────────────────────────
def generate_resumo(ementa: str, attempt: int = 1) -> str | None:
    """
    Gera resumo executivo de uma proposição via GPT.
    """
    prompt = f"""Você é um analista de inteligência legislativa.
Resuma a proposição abaixo em exatamente 2 linhas, em linguagem clara para um executivo.
Seja direto e objetivo. Não use jargão jurídico desnecessário.

Proposição: {ementa}

Resumo:"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=150,
            temperature=0.3
        )
        return response.choices[0].message.content.strip()

    except Exception as e:
        logger.warning(f"Erro no resumo (tentativa {attempt}): {e}")
        if attempt < 3:
            time.sleep(2 ** attempt)
            return generate_resumo(ementa, attempt + 1)
        return None


# ─────────────────────────────────────────────────────────────
# Função 5 — Estimar custo antes de rodar tudo
# ─────────────────────────────────────────────────────────────
def estimate_cost(n_proposicoes: int) -> None:
    """
    Estima o custo de rodar embeddings e resumos.
    text-embedding-3-small: $0.02 por 1M tokens
    gpt-4o-mini:            $0.15 por 1M tokens input
    """
    tokens_por_ementa    = 100   # média estimada
    custo_embedding      = (n_proposicoes * tokens_por_ementa / 1_000_000) * 0.02
    custo_resumo         = (n_proposicoes * tokens_por_ementa / 1_000_000) * 0.15
    custo_total          = custo_embedding + custo_resumo

    logger.info(f"Estimativa de custo para {n_proposicoes} proposições:")
    logger.info(f"  Embeddings: ~${custo_embedding:.4f}")
    logger.info(f"  Resumos:    ~${custo_resumo:.4f}")
    logger.info(f"  Total:      ~${custo_total:.4f}")


# ─────────────────────────────────────────────────────────────
# Execução principal
# ─────────────────────────────────────────────────────────────
if __name__ == "__main__":

    logger.info("=" * 55)
    logger.info("BÚSSOLA PÚBLICA — Iniciando camada de IA")
    logger.info("=" * 55)

    # Conexão com o banco
    engine = create_engine(os.getenv("DATABASE_URL"))

    # Carregar proposições do banco
    df = pd.read_sql("SELECT id, ementa FROM proposicoes LIMIT 20", engine)
    logger.info(f"Proposições carregadas para teste: {len(df)}")

    # Estimar custo antes de rodar tudo
    estimate_cost(len(df))

    # ── Passo 1: Gerar embeddings dos temas ──────────────────
    logger.info("Gerando embeddings dos temas...")
    temas_embeddings = {}
    for tema, descricao in TEMAS.items():
        temas_embeddings[tema] = get_embedding(descricao)
        logger.info(f"  ✅ Tema '{tema}' processado")

    # ── Passo 2: Classificar proposições ─────────────────────
    logger.info("Classificando proposições por tema...")
    temas_resultado = []

    for i, row in df.iterrows():
        tema = classify_tema(row["ementa"], temas_embeddings)
        temas_resultado.append(tema)
        logger.info(f"  [{i+1}/{len(df)}] {tema} | {row['ementa'][:60]}...")
        time.sleep(0.1)   # evitar rate limit

    df["tema"] = temas_resultado

    # ── Passo 3: Gerar resumos executivos ────────────────────
    logger.info("Gerando resumos executivos...")
    resumos = []

    for i, row in df.iterrows():
        resumo = generate_resumo(row["ementa"])
        resumos.append(resumo)
        logger.info(f"  [{i+1}/{len(df)}] Resumo gerado")
        time.sleep(0.2)

    df["resumo_ia"] = resumos

    # ── Passo 4: Salvar no banco ──────────────────────────────
    logger.info("Salvando resultados no banco...")

    with engine.connect() as conn:
        for _, row in df.iterrows():
            conn.execute(text("""
                UPDATE proposicoes
                SET tema      = :tema,
                    resumo_ia = :resumo
                WHERE id = :id
            """), {
                "tema":   row["tema"],
                "resumo": row["resumo_ia"],
                "id":     row["id"]
            })
        conn.commit()

    logger.info("✅ Temas e resumos salvos no banco!")

    # ── Passo 5: Mostrar resultado ────────────────────────────
    print("\n=== RESULTADO DA CLASSIFICAÇÃO ===")
    for _, row in df.iterrows():
        print(f"\n📋 ID: {row['id']}")
        print(f"   Tema:   {row['tema']}")
        print(f"   Ementa: {row['ementa'][:80]}...")
        print(f"   Resumo: {row['resumo_ia']}")

    print("\n=== DISTRIBUIÇÃO POR TEMA ===")
    print(df["tema"].value_counts().to_string())

    logger.info("=" * 55)
    logger.info("Camada de IA concluída!")
    logger.info("=" * 55)