# PSF Data Aggregator

Serviço Python independente que coleta sinais de problemas globais não resolvidos, classifica via IA e grava no Firestore para revisão do admin.

---

## Início Rápido

```bash
cd data-aggregator
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Preencher as credenciais no .env (veja Seção 2)
python run.py --dry-run   # sem gravar no Firestore
python run.py             # execução real
```

---

## 1. Arquitetura do Pipeline

```
[Collectors] → [Deduplicator] → [Classifier] → [Scorer] → [Writer]
     ↓               ↓               ↓             ↓          ↓
  138 sinais      47 únicos       38 válidos    38 ranked   Firestore
```

### Fluxo detalhado

1. **Collectors** — cada fonte roda de forma independente e retorna uma lista de dicts `{title, raw_text, source, url, published_at}`
2. **Deduplicator** — calcula `SHA-256(title.lower().strip())`. Verifica cache local (`.seen_hashes.json`) e depois Firestore (`aggregator_seen`). Descarta duplicatas.
3. **Classifier** — envia batches de 10 itens ao Groq (Llama 3). Retorna `domain, severity, country, is_actionable`. Descarta `is_actionable: false`.
4. **Scorer** — fórmula determinística (sem I/O): `score = severity_weight + reach_weight + novelty_weight`
5. **Writer** — grava os top N no Firestore com `status: "pending"`. Admin revisa antes de publicar.

### Princípios de design

- **Falha isolada**: se um collector falha, o pipeline continua com os demais.
- **Idempotente**: rodar duas vezes não duplica dados (dedup por hash).
- **Sem estado em memória**: tudo o que precisa persistir vai pro Firestore.
- **Sem dependências entre collectors**: cada um é independente, fácil de adicionar ou remover.

---

## 2. Credenciais

### Groq (IA gratuita)

1. Criar conta em [console.groq.com](https://console.groq.com)
2. Gerar API key em **API Keys**
3. Copiar para `.env`: `GROQ_API_KEY=gsk_...`

Modelo usado: `llama3-8b-8192` (free tier, ~6000 req/dia)

### Reddit

1. Acessar [reddit.com/prefs/apps](https://www.reddit.com/prefs/apps)
2. Criar app → tipo **script** → redirect URI: `http://localhost:8080`
3. Copiar `client_id` (embaixo do nome do app) e `client_secret`
4. Preencher no `.env`

### Firebase

Já configurado. O arquivo `backend/serviceAccountKey.json` é reutilizado:

```env
FIREBASE_KEY_PATH=../backend/serviceAccountKey.json
```

---

## 3. Estrutura de Arquivos

```
data-aggregator/
├── run.py                     # Entry point
├── orchestrator.py            # Coordena o pipeline
├── classifier.py              # Groq — classifica em batches
├── scorer.py                  # Fórmula de score (sem I/O)
├── deduplicator.py            # SHA-256 + cache local + Firestore
├── firestore_writer.py        # Grava problems + aggregator_seen
├── config.py                  # Constantes: feeds, pesos, domínios
├── requirements.txt
├── .env.example
├── .seen_hashes.json          # Cache local (gitignored)
├── collectors/
│   ├── __init__.py
│   ├── rss_collector.py       # GDELT, BBC, Reuters, UN
│   ├── arxiv_collector.py     # arXiv API
│   ├── worldbank_collector.py # World Bank API
│   └── reddit_collector.py    # PRAW
└── utils/
    ├── __init__.py
    └── logging_config.py
```

---

## 4. Schema do Firestore

### Collection: `problems`

Estes campos devem bater exatamente com o que o admin UI espera (ver `backend/src/views/admin/problems.ejs`).

```python
{
  # --- Campos obrigatórios (admin UI depende deles) ---
  "title":          str,           # Título do problema
  "description":    str,           # Descrição de 2-3 frases
  "knowledgeField": str,           # Ver domínios válidos abaixo
  "urgency":        str,           # "low" | "medium" | "high"
  "status":         "pending",     # Sempre pending — admin aprova

  # --- Identificação da fonte ---
  "submittedBy":    "data-aggregator",  # Sentinel — não aparece no "my problems"
  "source":         str,           # "rss" | "arxiv" | "worldbank" | "reddit"
  "sourceUrl":      str,           # URL original do item

  # --- Localização ---
  "country":        str,           # País ou "Global"
  "city":           str | None,    # Cidade (opcional)

  # --- Score de impacto ---
  "impactScore":    float,         # 0.0 a 1.0
  "severity":       int,           # 1-5 (vem do classifier)

  # --- Metadados ---
  "createdAt":      timestamp,
  "publishedAt":    timestamp,     # Data original da fonte
  "aggregatorHash": str,           # SHA-256 do título (para dedup)
}
```

### Domínios válidos para `knowledgeField`

```python
KNOWLEDGE_FIELDS = [
  "Technology", "Healthcare", "Education", "Environment",
  "Social Issues", "Economics", "Infrastructure",
  "Agriculture", "Energy", "Transportation", "Other"
]
```

> **Atenção**: qualquer valor fora desta lista vai quebrar os filtros do admin UI.

### Collection: `aggregator_seen`

Usada para dedup cross-machine. Cada doc é o hash do título.

```python
{
  "hash":      str,       # SHA-256 do título
  "title":     str,       # Para debug
  "seenAt":    timestamp,
  "source":    str,
}
```

---

## 5. Fórmula de Score

```python
# scorer.py
def calculate_score(item: dict) -> float:
    severity  = item["severity"] / 5          # 0.2 → 1.0
    reach     = 1.0 if item["country"] == "Global" else 0.6
    novelty   = 1.0                           # sempre 1.0 após dedup

    return (severity * 0.4) + (reach * 0.4) + (novelty * 0.2)
```

### Como ajustar os pesos

Os pesos `0.4 / 0.4 / 0.2` estão em `config.py`:

```python
SCORE_WEIGHTS = {
    "severity": 0.4,
    "reach":    0.4,
    "novelty":  0.2,
}
```

Mude conforme a missão evoluir. Exemplo: se quiser priorizar problemas locais sobre globais, aumente `severity` e reduza `reach`.

---

## 6. Prompt do Classifier

O prompt está em `classifier.py`. É o ponto mais importante para qualidade dos dados.

**Prompt atual:**

```
Você é um classificador de problemas globais. Dado o seguinte conjunto de textos,
retorne um JSON array onde cada item contém:
- title: título limpo e factual (max 100 chars)
- description: 2-3 frases explicando o problema e por que é importante
- domain: um de [Technology, Healthcare, Education, Environment, Social Issues,
          Economics, Infrastructure, Agriculture, Energy, Transportation, Other]
- severity: inteiro 1-5 (1=baixo impacto, 5=crítico/emergência)
- country: país afetado ou "Global"
- city: cidade se mencionada, null se não
- is_actionable: true se é um problema que pode ser resolvido por voluntários,
                 false se é apenas notícia ou evento pontual

Retorne apenas o JSON array, sem texto adicional.

Textos:
{batch}
```

### Como melhorar o prompt

Adicione exemplos (few-shot) para aumentar consistência:

```
Exemplo de is_actionable: false → "Terremoto atinge cidade X" (evento, não problema crônico)
Exemplo de is_actionable: true  → "Falta de acesso a água potável em Y" (problema estrutural)
```

---

## 7. Adicionando um Novo Collector

Cada collector é um arquivo independente com uma única função pública: `collect() -> list[dict]`.

**Template:**

```python
# collectors/meu_collector.py

import requests
from utils.logging_config import get_logger

log = get_logger(__name__)

def collect() -> list[dict]:
    results = []
    try:
        # ... lógica de coleta ...
        results.append({
            "title":        str,   # obrigatório
            "raw_text":     str,   # texto bruto para o classifier
            "source":       "meu_collector",
            "url":          str,
            "published_at": str,   # ISO 8601 ou None
        })
    except Exception as e:
        log.warning(f"meu_collector falhou: {e}")
    return results
```

**Registrar em `orchestrator.py`:**

```python
from collectors.meu_collector import collect as collect_meu

collectors = [
    collect_rss,
    collect_arxiv,
    collect_worldbank,
    collect_reddit,
    collect_meu,   # ← adicionar aqui
]
```

Isso é tudo. O pipeline cuida do resto automaticamente.

---

## 8. Evoluindo a Arquitetura de Dados

O schema atual é o **v1** — funcional e simples. Abaixo está o caminho de evolução natural.

### v1 → v2: Inteligência Semântica

Adicionar campos que a IA já produz mas ainda não são gravados:

```python
# Novos campos no doc do Firestore
"cluster":       str | None,   # Nome do cluster semântico ("Antimicrobial Resistance")
"clusterId":     str | None,   # ID do cluster para agrupar no dashboard
"causalParent":  str | None,   # ID do problema raiz (se for efeito downstream)
"tags":          list[str],    # Tags livres geradas pelo classifier
"sources":       list[str],    # Lista de fontes que mencionaram o mesmo problema
"sourceCount":   int,          # len(sources) — quanto maior, mais urgente
```

Impacto no pipeline: o `classifier.py` já pede esses campos, só precisa gravar.

### v2 → v3: Tendências Temporais

Adicionar coleção separada para histórico de runs:

```
aggregator_runs/
  {runId}/
    startedAt:    timestamp
    finishedAt:   timestamp
    collected:    int
    deduplicated: int
    written:      int
    avgScore:     float
    topDomains:   {Healthcare: 12, Environment: 8, ...}
    digest:       str   # texto gerado pela IA
```

Isso habilita o gráfico de tendências no dashboard (problemas por semana por domínio).

### v3 → v4: Match Volunteer × Problema

Adicionar campo no perfil do usuário:

```python
# users/{userId}
"skills": ["Healthcare", "Data Science", "Education"]
```

E no problema:

```python
# problems/{problemId}
"matchedVolunteers": []   # preenchido por Cloud Function ou pelo aggregator
```

O aggregator pode gerar esse match ao gravar: para cada problema, buscar usuários com `skills` compatíveis com `knowledgeField`.

### v4 → v5: Automação Parcial

Mover de execução manual para agendada, sem mudar o código Python:

- **Opção A**: GitHub Actions com `schedule: cron: '0 8 * * *'`
- **Opção B**: Cloud Run Job com trigger do Cloud Scheduler
- **Opção C**: Vercel Cron Job (se migrar para JS)

---

## 9. Variáveis de Ambiente

```env
# Firebase
FIREBASE_KEY_PATH=../backend/serviceAccountKey.json

# Groq
GROQ_API_KEY=gsk_...

# Reddit
REDDIT_CLIENT_ID=...
REDDIT_CLIENT_SECRET=...
REDDIT_USER_AGENT=psf-aggregator/1.0

# Pipeline
MAX_PROBLEMS_PER_RUN=50   # quantos gravar por execução
BATCH_SIZE=10              # itens por chamada ao Groq
DRY_RUN=false              # true = não grava no Firestore
```

---

## 10. Verificação Pós-Execução

```bash
python run.py --dry-run
# Esperado: log de problemas classificados, sem gravação

python run.py
# Esperado: "Done — X problems written, Y duplicates skipped"
```

Depois:

1. Abrir o admin PSF → Problems → filtrar por `status: pending`
2. Verificar se os problemas apareceram com os campos corretos
3. Aprovar um e verificar se aparece em `/problems` no site público
4. Rodar duas vezes seguidas — a segunda deve gravar 0 problemas novos (dedup funcionando)

---

## 11. BigQuery — Camada Analítica

O Firestore resolve o operacional (leitura em tempo real, admin UI, site público). O BigQuery resolve o analítico: queries SQL sobre todo o histórico, sem impactar performance do site.

### Quando faz sentido adicionar

- Você quer rodar queries como "quantos problemas de Healthcare foram coletados por mês nos últimos 6 meses"
- O Firestore está com mais de 10.000 docs e queries compostas ficando lentas
- Você quer cruzar dados de problemas + soluções + usuários em uma única query

### Arquitetura com BigQuery

```
[Collectors] → [Classifier] → [Scorer]
                                  ↓
                          ┌───────┴───────┐
                          ↓               ↓
                      Firestore        BigQuery
                   (operacional)      (analítico)
                   status, admin      histórico, trends,
                   site público       gap analysis, clusters
```

O `firestore_writer.py` escreve nos dois simultaneamente. Se o BigQuery falhar, o Firestore segue normalmente.

### Schema da tabela `problems` no BigQuery

```sql
CREATE TABLE psf.problems (
  id              STRING NOT NULL,
  title           STRING,
  description     STRING,
  knowledge_field STRING,
  urgency         STRING,        -- low | medium | high
  severity        INT64,         -- 1-5
  impact_score    FLOAT64,
  country         STRING,
  source          STRING,        -- rss | arxiv | worldbank | reddit
  source_url      STRING,
  cluster         STRING,
  cluster_id      STRING,
  source_count    INT64,         -- quantas fontes mencionaram
  causal_parent   STRING,        -- problema raiz (se downstream)
  status          STRING,        -- pending | approved | rejected
  run_id          STRING,        -- qual execução gerou este registro
  published_at    TIMESTAMP,
  created_at      TIMESTAMP
);
```

### Tabela `aggregator_runs` no BigQuery

```sql
CREATE TABLE psf.aggregator_runs (
  run_id          STRING NOT NULL,
  started_at      TIMESTAMP,
  finished_at     TIMESTAMP,
  collected       INT64,
  deduplicated    INT64,
  written         INT64,
  avg_score       FLOAT64,
  top_domain      STRING,
  digest          STRING
);
```

### Exemplo de query — Gap Analysis por domínio

```sql
SELECT
  p.knowledge_field,
  COUNT(p.id)                                      AS total_problems,
  COUNT(s.problem_id)                              AS total_solutions,
  ROUND(COUNT(s.problem_id) / COUNT(p.id), 2)     AS resolution_rate
FROM psf.problems p
LEFT JOIN psf.solutions s ON s.problem_id = p.id
WHERE p.status = 'approved'
GROUP BY p.knowledge_field
ORDER BY total_problems DESC;
```

### Exemplo de query — Tendência semanal

```sql
SELECT
  DATE_TRUNC(created_at, WEEK) AS week,
  knowledge_field,
  COUNT(*)                     AS problems_collected
FROM psf.problems
GROUP BY 1, 2
ORDER BY 1 DESC;
```

### Integração no `firestore_writer.py`

```python
from google.cloud import bigquery

bq = bigquery.Client()
TABLE = "problem-solver-foundation.psf.problems"

def write_to_bigquery(problems: list[dict]):
    rows = [_to_bq_row(p) for p in problems]
    errors = bq.insert_rows_json(TABLE, rows)
    if errors:
        log.warning(f"BigQuery insert errors: {errors}")
```

A função `write_to_bigquery` é chamada logo após `write_to_firestore`. Se falhar, loga o erro mas não interrompe o pipeline.

### Requisitos

- Conta Google Cloud com billing habilitado (cartão cadastrado, mas free tier cobre bastante: 10 GB storage + 1 TB queries/mês)
- `pip install google-cloud-bigquery`
- Dataset `psf` criado no projeto `problem-solver-foundation`
- Mesmas credenciais do `serviceAccountKey.json` (adicionar role **BigQuery Data Editor**)

### Quando NÃO usar BigQuery ainda

Se o volume de dados ainda é pequeno (< 5.000 problemas), o Firestore com índices compostos resolve bem. BigQuery adiciona complexidade de setup e billing. Adicione quando as queries do dashboard começarem a demorar ou quando precisar de análises históricas que o Firestore não suporta nativamente.

---

## 12. Gitignore

Adicionar ao `.gitignore` raiz:

```
data-aggregator/.seen_hashes.json
data-aggregator/__pycache__/
data-aggregator/venv/
data-aggregator/.env
```
