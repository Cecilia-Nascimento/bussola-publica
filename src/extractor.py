# src/extractor.py
# ─────────────────────────────────────────────────────────────
# Etapa 2 — Extração com Python e requests
# Responsável: capturar dados da API da Câmara e salvar em JSON
# ─────────────────────────────────────────────────────────────

import requests
import json
import os
import time
import logging
from datetime import datetime

# ─── Configuração de logging ──────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger(__name__)

# ─── Constantes ───────────────────────────────────────────────
BASE_URL        = "https://dadosabertos.camara.leg.br/api/v2"
RAW_DIR         = "data/raw"
MAX_RETRIES     = 3
SLEEP_BETWEEN   = 0.5   # segundos entre páginas — respeitar a API
ITEMS_PER_PAGE  = 100   # máximo permitido pela API


# ─────────────────────────────────────────────────────────────
# Função 1 — Chamada HTTP com retry automático
# ─────────────────────────────────────────────────────────────
def _make_request(url: str, params: dict, attempt: int = 1) -> dict | None:
    """
    Faz uma única chamada HTTP com retry e backoff exponencial.
    Retorna o JSON ou None se falhar após MAX_RETRIES tentativas.
    """
    try:
        response = requests.get(url, params=params, timeout=15)
        response.raise_for_status()
        return response.json()

    except requests.exceptions.Timeout:
        logger.warning(f"Timeout na tentativa {attempt} | URL: {url}")

    except requests.exceptions.HTTPError as e:
        logger.error(f"Erro HTTP {e.response.status_code} | URL: {url}")

    except requests.exceptions.ConnectionError:
        logger.warning(f"Erro de conexão na tentativa {attempt}")

    except Exception as e:
        logger.error(f"Erro inesperado: {e}")

    # Retry com backoff exponencial: 2s, 4s, 8s
    if attempt < MAX_RETRIES:
        wait = 2 ** attempt
        logger.info(f"Aguardando {wait}s antes de tentar novamente...")
        time.sleep(wait)
        return _make_request(url, params, attempt + 1)

    logger.error(f"Falhou após {MAX_RETRIES} tentativas. Abortando.")
    return None


# ─────────────────────────────────────────────────────────────
# Função 2 — Extração com paginação automática
# ─────────────────────────────────────────────────────────────
def extract_endpoint(endpoint: str, extra_params: dict = {}) -> list:
    """
    Extrai todos os dados de um endpoint com paginação automática.

    Parâmetros:
        endpoint:     caminho relativo, ex: '/proposicoes'
        extra_params: filtros adicionais, ex: {'dataInicio': '2024-11-01'}

    Retorna:
        Lista com todos os registros de todas as páginas.
    """
    url      = f"{BASE_URL}{endpoint}"
    all_data = []
    page     = 1

    logger.info(f"Iniciando extração: {endpoint}")

    while True:
        params = {
            "pagina":     page,
            "itens":      ITEMS_PER_PAGE,
            "ordem":      "ASC",
            "ordenarPor": "id",
            **extra_params
        }

        logger.info(f"  Página {page} ...")
        result = _make_request(url, params)

        # API falhou após retries
        if result is None:
            logger.error("Extração interrompida por falha na API.")
            break

        # Trata dados nulos ou vazios — fim da paginação
        dados = result.get("dados") or []

        if not dados:
            logger.info(f"  Fim da paginação na página {page}.")
            logger.info(f"  Total extraído: {len(all_data)} registros.")
            break

        all_data.extend(dados)
        logger.info(f"  +{len(dados)} registros | Acumulado: {len(all_data)}")

        page += 1
        time.sleep(SLEEP_BETWEEN)

    return all_data


# ─────────────────────────────────────────────────────────────
# Função 3 — Salvar JSON bruto com timestamp
# ─────────────────────────────────────────────────────────────
def save_raw(data: list, name: str) -> str:
    """
    Salva os dados brutos em JSON com timestamp no nome.
    Garante rastreabilidade de cada extração.

    Retorna o caminho do arquivo salvo.
    """
    os.makedirs(RAW_DIR, exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename  = f"{name}_{timestamp}.json"
    filepath  = os.path.join(RAW_DIR, filename)

    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    logger.info(f"Salvo: {filepath} ({len(data)} registros)")
    return filepath


# ─────────────────────────────────────────────────────────────
# Execução principal
# ─────────────────────────────────────────────────────────────
if __name__ == "__main__":

    logger.info("=" * 55)
    logger.info("BÚSSOLA PÚBLICA — Extração maio/2026")
    logger.info("=" * 55)

    # Dimensões
    deputados = extract_endpoint("/deputados")
    save_raw(deputados, "deputados")

    partidos = extract_endpoint("/partidos")
    save_raw(partidos, "partidos")

    # Proposições — maio/2026
    proposicoes = extract_endpoint(
        endpoint="/proposicoes",
        extra_params={
            "dataInicio": "2026-05-01",
            "dataFim":    "2026-05-31",
        }
    )
    save_raw(proposicoes, "proposicoes_maio2026")

    # Votações — maio/2026
    votacoes = extract_endpoint(
        endpoint="/votacoes",
        extra_params={
            "dataInicio": "2026-05-01",
            "dataFim":    "2026-05-31",
        }
    )
    save_raw(votacoes, "votacoes_maio2026")

    # Despesas — maio/2026 (uma chamada por deputado)
    import time as _time
    logger.info("Iniciando extração de despesas — maio/2026")
    todas_despesas = []

    for dep in deputados:
        dep_id = dep["id"]
        url = f"{BASE_URL}/deputados/{dep_id}/despesas"
        params = {"ano": 2026, "mes": 5, "itens": 100}
        pagina = 1
        while True:
            params["pagina"] = pagina
            result = _make_request(url, params)
            if result is None:
                break
            dados = result.get("dados") or []
            if not dados:
                break
            for d in dados:
                d["id_deputado"] = dep_id
            todas_despesas.extend(dados)
            pagina += 1
            _time.sleep(0.2)
        _time.sleep(0.3)

    save_raw(todas_despesas, "despesas_maio2026")
    logger.info(f"Total despesas extraídas: {len(todas_despesas)}")

    logger.info("=" * 55)
    logger.info("Extração concluída!")
    logger.info("=" * 55)