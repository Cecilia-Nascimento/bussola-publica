# src/loader.py
# ─────────────────────────────────────────────────────────────
# Etapa 3 — Carga no PostgreSQL (Supabase)
# Responsável: criar tabelas e carregar os DataFrames
# ─────────────────────────────────────────────────────────────

import os
import logging
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from transformer import (
    transform_deputados,
    transform_partidos,
    transform_proposicoes,
    transform_votacoes,
    transform_despesas,
)

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger(__name__)


def get_engine():
    url = os.getenv("DATABASE_URL")
    if not url:
        raise ValueError("DATABASE_URL não encontrada no .env")
    return create_engine(url)


def create_tables(engine):
    sql = """
    CREATE TABLE IF NOT EXISTS partidos (
        id      INTEGER PRIMARY KEY,
        sigla   VARCHAR(20),
        nome    VARCHAR(200)
    );

    CREATE TABLE IF NOT EXISTS deputados (
        id              INTEGER PRIMARY KEY,
        nome            VARCHAR(200),
        sigla_partido   VARCHAR(20),
        sigla_uf        VARCHAR(5),
        id_legislatura  INTEGER,
        email           VARCHAR(200),
        url_foto        VARCHAR(500)
    );

    CREATE TABLE IF NOT EXISTS proposicoes (
        id                  INTEGER PRIMARY KEY,
        sigla_tipo          VARCHAR(20),
        numero              INTEGER,
        ano                 INTEGER,
        ementa              TEXT,
        data_apresentacao   TIMESTAMP,
        situacao            VARCHAR(200),
        regime              VARCHAR(200),
        keywords            TEXT,
        tema                VARCHAR(100),
        resumo_ia           TEXT
    );

    CREATE TABLE IF NOT EXISTS votacoes (
        id                  VARCHAR(50) PRIMARY KEY,
        data                DATE,
        data_hora_registro  TIMESTAMP,
        descricao           TEXT,
        aprovacao           SMALLINT,
        sigla_orgao         VARCHAR(50)
    );

    CREATE TABLE IF NOT EXISTS despesas (
        id              SERIAL PRIMARY KEY,
        id_deputado     INTEGER,
        ano             INTEGER,
        mes             INTEGER,
        tipo_despesa    VARCHAR(200),
        nome_fornecedor VARCHAR(300),
        valor_documento NUMERIC(12,2),
        valor_liquido   NUMERIC(12,2),
        data_documento  TIMESTAMP,
        num_documento   VARCHAR(100),
        url_documento   VARCHAR(500)
    );
    """
    with engine.connect() as conn:
        conn.execute(text(sql))
        conn.commit()
    logger.info("✅ Tabelas criadas com sucesso!")


def load_table(df, table_name: str, engine, if_exists: str = "replace"):
    logger.info(f"Carregando tabela: {table_name} ({len(df)} registros)...")
    df.to_sql(
        name=table_name,
        con=engine,
        if_exists=if_exists,
        index=False,
        method="multi",
        chunksize=500
    )
    logger.info(f"✅ {table_name}: {len(df)} registros carregados!")


def verify_load(engine):
    tabelas = ["partidos", "deputados", "proposicoes", "votacoes", "despesas"]
    logger.info("=" * 55)
    logger.info("VERIFICAÇÃO DA CARGA:")
    with engine.connect() as conn:
        for tabela in tabelas:
            result = conn.execute(text(f"SELECT COUNT(*) FROM {tabela}"))
            count  = result.fetchone()[0]
            logger.info(f"  {tabela}: {count} registros")
    logger.info("=" * 55)


if __name__ == "__main__":

    logger.info("=" * 55)
    logger.info("BÚSSOLA PÚBLICA — Carga no PostgreSQL")
    logger.info("=" * 55)

    engine = get_engine()

    # 1. Criar tabelas
    create_tables(engine)

    # 2. Dimensões — replace
    df_dep  = transform_deputados()
    df_part = transform_partidos()
    load_table(df_dep,  "deputados", engine, if_exists="replace")
    load_table(df_part, "partidos",  engine, if_exists="replace")

    # 3. Proposições maio/2026 — replace total
    df_prop = transform_proposicoes()
    load_table(df_prop, "proposicoes", engine, if_exists="replace")

    # 4. Votações maio/2026 — replace total
    df_vot = transform_votacoes()
    load_table(df_vot, "votacoes", engine, if_exists="replace")

    # 5. Despesas maio/2026 — replace total
    df_desp = transform_despesas()
    load_table(df_desp, "despesas", engine, if_exists="replace")

    # 6. Garantir colunas de IA
    with engine.connect() as conn:
        conn.execute(text(
            "ALTER TABLE proposicoes ADD COLUMN IF NOT EXISTS tema VARCHAR(100)"
        ))
        conn.execute(text(
            "ALTER TABLE proposicoes ADD COLUMN IF NOT EXISTS resumo_ia TEXT"
        ))
        conn.commit()

    # 7. Verificar
    verify_load(engine)

    logger.info("Carga concluída com sucesso!")