# src/transformer.py
# ─────────────────────────────────────────────────────────────
# Etapa 3 — Transformação com Pandas
# Responsável: ler JSONs brutos, normalizar e validar os dados
# ─────────────────────────────────────────────────────────────

import pandas as pd
import json
import os
import logging
from glob import glob

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger(__name__)

RAW_DIR = "data/raw"


# ─────────────────────────────────────────────────────────────
# Função auxiliar — carregar o JSON mais recente de um tipo
# ─────────────────────────────────────────────────────────────
def load_latest_json(name: str) -> list:
    """
    Carrega o arquivo JSON mais recente de data/raw/
    para um determinado tipo (ex: 'deputados', 'proposicoes')
    """
    pattern = os.path.join(RAW_DIR, f"{name}_*.json")
    files   = sorted(glob(pattern))

    if not files:
        raise FileNotFoundError(f"Nenhum arquivo encontrado para: {name}")

    latest = files[-1]
    logger.info(f"Carregando: {latest}")

    with open(latest, "r", encoding="utf-8") as f:
        return json.load(f)


# ─────────────────────────────────────────────────────────────
# Transformação 1 — Deputados
# ─────────────────────────────────────────────────────────────
def transform_deputados() -> pd.DataFrame:
    """
    Transforma os dados brutos de deputados.
    Seleciona campos, renomeia e valida.
    """
    data = load_latest_json("deputados")
    df   = pd.DataFrame(data)

    logger.info(f"Deputados brutos: {df.shape}")

    # Selecionar apenas os campos necessários
    colunas = ["id", "nome", "siglaPartido", "siglaUf",
               "idLegislatura", "email", "urlFoto"]
    df = df[colunas].copy()

    # Renomear para snake_case — padrão do banco
    df = df.rename(columns={
        "siglaPartido":  "sigla_partido",
        "siglaUf":       "sigla_uf",
        "idLegislatura": "id_legislatura",
        "urlFoto":       "url_foto"
    })

    # Validações
    antes = len(df)
    df = df.dropna(subset=["id", "nome"])           # obrigatórios
    df = df.drop_duplicates(subset=["id"])           # sem duplicatas
    logger.info(f"Removidos {antes - len(df)} registros inválidos")

    # Tipos corretos
    df["id"]             = df["id"].astype(int)
    df["id_legislatura"] = df["id_legislatura"].astype(int)

    logger.info(f"Deputados transformados: {df.shape}")
    return df


# ─────────────────────────────────────────────────────────────
# Transformação 2 — Partidos
# ─────────────────────────────────────────────────────────────
def transform_partidos() -> pd.DataFrame:
    """
    Transforma os dados brutos de partidos.
    """
    data = load_latest_json("partidos")
    df   = pd.DataFrame(data)

    logger.info(f"Partidos brutos: {df.shape}")

    # Selecionar campos
    df = df[["id", "sigla", "nome"]].copy()

    # Validações
    df = df.dropna(subset=["id", "sigla"])
    df = df.drop_duplicates(subset=["id"])
    df["id"] = df["id"].astype(int)

    logger.info(f"Partidos transformados: {df.shape}")
    return df


# ─────────────────────────────────────────────────────────────
# Transformação 3 — Proposições
# ─────────────────────────────────────────────────────────────
def transform_proposicoes() -> pd.DataFrame:
    """
    Transforma os dados brutos de proposições.
    Normaliza campos aninhados e valida.
    """
    data = load_latest_json("proposicoes")
    df   = pd.json_normalize(data)   # achata dicts aninhados

    logger.info(f"Proposições brutas: {df.shape}")
    logger.info(f"Colunas disponíveis: {list(df.columns)}")

    # Mapear colunas disponíveis — json_normalize cria nomes com ponto
    colunas_map = {
        "id":                "id",
        "siglaTipo":         "sigla_tipo",
        "numero":            "numero",
        "ano":               "ano",
        "ementa":            "ementa",
        "dataApresentacao":  "data_apresentacao",
    }

    # Adicionar campos aninhados se existirem
    if "statusProposicao.descricaoSituacao" in df.columns:
        colunas_map["statusProposicao.descricaoSituacao"] = "situacao"
    if "statusProposicao.regime" in df.columns:
        colunas_map["statusProposicao.regime"] = "regime"
    if "keywords" in df.columns:
        colunas_map["keywords"] = "keywords"

    # Selecionar e renomear
    colunas_existentes = {k: v for k, v in colunas_map.items() if k in df.columns}
    df = df[list(colunas_existentes.keys())].copy()
    df = df.rename(columns=colunas_existentes)

    # Validações
    antes = len(df)
    df = df.dropna(subset=["id", "ementa"])
    df = df.drop_duplicates(subset=["id"])
    logger.info(f"Removidos {antes - len(df)} registros inválidos")

    # Tipos corretos
    df["id"]     = df["id"].astype(int)
    df["numero"] = pd.to_numeric(df["numero"], errors="coerce")
    df["ano"]    = pd.to_numeric(df["ano"], errors="coerce")

    # Data no formato correto
    df["data_apresentacao"] = pd.to_datetime(
        df["data_apresentacao"], errors="coerce"
    )

    logger.info(f"Proposições transformadas: {df.shape}")
    return df


# ─────────────────────────────────────────────────────────────
# Transformação 4 — Votações
# ─────────────────────────────────────────────────────────────
def transform_votacoes() -> pd.DataFrame:
    """
    Transforma os dados brutos de votações.
    """
    data = load_latest_json("votacoes")
    df   = pd.json_normalize(data)

    logger.info(f"Votações brutas: {df.shape}")

    colunas_map = {
        "id":                "id",
        "data":              "data",
        "dataHoraRegistro":  "data_hora_registro",
        "descricao":         "descricao",
        "aprovacao":         "aprovacao",
        "siglaOrgao":        "sigla_orgao",
    }

    # Selecionar apenas colunas que existem
    colunas_existentes = {k: v for k, v in colunas_map.items() if k in df.columns}
    df = df[list(colunas_existentes.keys())].copy()
    df = df.rename(columns=colunas_existentes)

    # Validações
    antes = len(df)
    df = df.dropna(subset=["id"])
    df = df.drop_duplicates(subset=["id"])
    logger.info(f"Removidos {antes - len(df)} registros inválidos")

    # Tipos
    df["data"]             = pd.to_datetime(df["data"], errors="coerce")
    df["data_hora_registro"] = pd.to_datetime(df["data_hora_registro"], errors="coerce")
    df["aprovacao"]        = pd.to_numeric(df["aprovacao"], errors="coerce")

    logger.info(f"Votações transformadas: {df.shape}")
    return df


# ─────────────────────────────────────────────────────────────
# Execução principal — teste das transformações
# ─────────────────────────────────────────────────────────────
if __name__ == "__main__":

    logger.info("=" * 55)
    logger.info("BÚSSOLA PÚBLICA — Iniciando transformações")
    logger.info("=" * 55)

    df_dep   = transform_deputados()
    df_part  = transform_partidos()
    df_prop  = transform_proposicoes()
    df_vot   = transform_votacoes()

    print("\n=== DEPUTADOS ===")
    print(df_dep.head(3).to_string())
    print(f"\nShape: {df_dep.shape}")

    print("\n=== PARTIDOS ===")
    print(df_part.head(3).to_string())

    print("\n=== PROPOSIÇÕES ===")
    print(df_prop.head(3).to_string())
    print(f"\nShape: {df_prop.shape}")

    print("\n=== VOTAÇÕES ===")
    print(df_vot.head(3).to_string())
    print(f"\nShape: {df_vot.shape}")

    logger.info("=" * 55)
    logger.info("Transformações concluídas!")
    logger.info("=" * 55)