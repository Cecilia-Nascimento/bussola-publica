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
)

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────
# Conexão com o banco
# ─────────────────────────────────────────────────────────────
def get_engine():
    url = os.getenv("DATABASE_URL")
    if not url:
        raise ValueError("DATABASE_URL não encontrada no .env")
    return create_engine(url)


# ─────────────────────────────────────────────────────────────
# Criar tabelas
# ─────────────────────────────────────────────────────────────
def create_tables(engine):
    """
    Cria as tabelas no PostgreSQL se não existirem.
    Ordem importa: dimensões antes das fatos.
    """
    sql = """
    -- Dimensão: partidos
    CREATE TABLE IF NOT EXISTS partidos (
        id      INTEGER PRIMARY KEY,
        sigla   VARCHAR(20),
        nome    VARCHAR(200)
    );

    -- Dimensão: deputados
    CREATE TABLE IF NOT EXISTS deputados (
        id              INTEGER PRIMARY KEY,
        nome            VARCHAR(200),
        sigla_partido   VARCHAR(20),
        sigla_uf        VARCHAR(5),
        id_legislatura  INTEGER,
        email           VARCHAR(200),
        url_foto        VARCHAR(500)
    );

    -- Fato: proposicoes
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

    -- Fato: votacoes
    CREATE TABLE IF NOT EXISTS votacoes (
        id                  VARCHAR(50) PRIMARY KEY,
        data                DATE,
        data_hora_registro  TIMESTAMP,
        descricao           TEXT,
        aprovacao           SMALLINT,
        sigla_orgao         VARCHAR(50)
    );
    """

    with engine.connect() as conn:
        conn.execute(text(sql))
        conn.commit()

    logger.info("✅ Tabelas criadas com sucesso!")


# ─────────────────────────────────────────────────────────────
# Carregar DataFrame no banco
# ─────────────────────────────────────────────────────────────
def load_table(df, table_name: str, engine, if_exists: str = "replace"):
    """
    Carrega um DataFrame no PostgreSQL.

    if_exists:
        'replace' — apaga e recria (ideal para desenvolvimento)
        'append'  — adiciona sem apagar (ideal para produção incremental)
    """
    logger.info(f"Carregando tabela: {table_name} ({len(df)} registros)...")

    df.to_sql(
        name=table_name,
        con=engine,
        if_exists=if_exists,
        index=False,
        method="multi",    # insere em lote — muito mais rápido
        chunksize=500      # 500 registros por vez
    )

    logger.info(f"✅ {table_name}: {len(df)} registros carregados!")


# ─────────────────────────────────────────────────────────────
# Verificar carga no banco
# ─────────────────────────────────────────────────────────────
def verify_load(engine):
    """
    Verifica quantos registros foram carregados em cada tabela.
    """
    tabelas = ["partidos", "deputados", "proposicoes", "votacoes"]

    logger.info("=" * 55)
    logger.info("VERIFICAÇÃO DA CARGA:")
    with engine.connect() as conn:
        for tabela in tabelas:
            result = conn.execute(text(f"SELECT COUNT(*) FROM {tabela}"))
            count  = result.fetchone()[0]
            logger.info(f"  {tabela}: {count} registros")
    logger.info("=" * 55)


# ─────────────────────────────────────────────────────────────
# Execução principal
# ─────────────────────────────────────────────────────────────
if __name__ == "__main__":

    logger.info("=" * 55)
    logger.info("BÚSSOLA PÚBLICA — Iniciando carga no PostgreSQL")
    logger.info("=" * 55)

    engine = get_engine()

    # 1. Criar tabelas
    create_tables(engine)

    # 2. Transformar dados
    df_dep  = transform_deputados()
    df_part = transform_partidos()
    df_prop = transform_proposicoes()
    df_vot  = transform_votacoes()

    # 3. Carregar no banco
    # Dimensões primeiro, depois fatos
    load_table(df_part, "partidos",    engine)
    load_table(df_dep,  "deputados",   engine)
    load_table(df_prop, "proposicoes", engine)
    load_table(df_vot,  "votacoes",    engine)

    # 4. Verificar
    verify_load(engine)

    logger.info("Carga concluída com sucesso!")