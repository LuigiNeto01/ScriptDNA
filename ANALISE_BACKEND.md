# ScriptDNA Backend - Como a IA Funciona

## Resumo

O backend usa **7 agentes de IA**, todos rodando **GPT-4o** (exceto transcrição que usa Whisper). O sistema forma um ciclo fechado: **gerar roteiro → publicar → medir métricas → analisar performance → aprender → gerar melhor**.

---

## Stack

| Componente | Tecnologia |
|------------|-----------|
| API | FastAPI + Python 3.11 |
| Banco | PostgreSQL + pgvector (vetores 1536d) |
| Fila de tarefas | Celery + Redis |
| LLM | OpenAI GPT-4o |
| Transcrição | Whisper-1 |
| Embeddings | text-embedding-3-small (1536 dimensões) |
| Busca semântica | pgvector com distância cosseno |

---

## Os 7 Agentes de IA

### 1. ScriptGeneratorAgent (Gerador de Roteiros)

**Arquivo:** `app/agents/script_generator_agent.py`
**Modelo:** GPT-4o | **Temperature:** 0.7 (criativo)

#### O que o usuário envia:

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|:-----------:|-----------|
| `theme` | string (3-500 chars) | Sim | Tema do vídeo. Ex: "5 hacks de produtividade" |
| `duration` | int (15-600s) | Sim | Duração alvo em segundos |
| `platform` | string | Sim | Default "youtube" |
| `idea` | string (0-2000 chars) | Não | Conceito/ângulo criativo (NÃO é um roteiro pronto) |
| `niche` | string (0-100 chars) | Não | Ex: "produtividade", "finanças", "gaming" |
| `goal` | string (0-300 chars) | Não | Ex: "views", "engajamento", "inscritos" |
| `hook_type` | string | Não | Tipo de gancho desejado |
| `aggressiveness` | int (1-10) | Não | Nível de provocação do roteiro |
| `cta` | string (0-300 chars) | Não | Call-to-action específico |
| `style_profile_id` | UUID | Não | Perfil de estilo a seguir |

#### O que a IA realmente usa para gerar (dados internos):

```
1. TEMA do usuário (obrigatório)

2. IDEIA do usuário (se fornecida — tratada como conceito, não como texto final)

3. TOP 10 VÍDEOS DO NICHO (por views, do banco de dados)
   ├── Transcrições completas com timestamps
   ├── Beats narrativos (hook, setup, conflict, etc.)
   ├── Trechos de fala reais (primeiros 3s, meio, últimos 3s)
   └── Objetivo: REPLICAR o estilo de fala, vocabulário, ritmo, tom emocional

4. BUSCA SEMÂNTICA (se o nicho tem poucos vídeos)
   ├── Gera embedding do tema via text-embedding-3-small
   ├── Busca os 5 segmentos mais similares no banco (cosine distance)
   └── Fallback quando não há vídeos suficientes no nicho

5. INSIGHTS ATIVOS DO CANAL (até 10, ordenados por confiança)
   ├── Categoria (hook, retenção, CTA, narrativa, etc.)
   ├── Sentimento (positivo/negativo)
   ├── Descrição do aprendizado
   └── Número de validações

6. PERFIL DE ESTILO (se style_profile_id fornecido)
   ├── Tom (ex: "energético", "conversacional")
   ├── Ritmo (ex: "rápido", "pausado")
   ├── Hooks comuns
   ├── Regras "do" (o que fazer)
   └── Regras "avoid" (o que evitar)

7. PARÂMETROS OPCIONAIS: hook_type, aggressiveness, cta, goal
```

#### Regras do prompt do agente:
- DEVE replicar o estilo dos vídeos de referência (linguagem, vocabulário, gírias, ritmo, tom)
- "Idea" é um conceito — deve ser desenvolvida, não copiada
- Só usa estas funções narrativas: `hook`, `setup`, `conflict`, `escalation`, `payoff`, `cta`
- Só lista `weak_points` com score abaixo de 7/10

#### O que retorna:

```json
{
  "lines": [
    {
      "start": "0.0",
      "end": "3.0",
      "line": "texto falado",
      "function": "hook",
      "retention_note": "por que esta linha retém o espectador"
    }
  ],
  "analysis": {
    "hook_strength": 0.85,
    "curiosity_gaps": ["pergunta implícita que mantém atenção"],
    "weak_points": ["problema acionável encontrado"]
  }
}
```

#### Fluxo completo:

```
POST /api/generate/script
  └─> ScriptGeneratorAgent.run()
       ├─> _build_niche_style(theme, niche, db)
       │    ├─> SELECT videos WHERE niche=niche ORDER BY views DESC LIMIT 10
       │    ├─> Extrai segmentos de transcrição + beats
       │    ├─> Monta texto de referência com falas reais
       │    └─> _search_similar(theme, db) → busca semântica com pgvector
       │
       ├─> _build_insights_context(niche, theme, db)
       │    └─> SELECT channel_insights WHERE is_active=true ORDER BY confidence DESC LIMIT 10
       │
       ├─> Carrega StyleProfile (se fornecido)
       │    └─> tom, ritmo, hooks comuns, regras do/avoid
       │
       └─> OpenAI GPT-4o(system=GENERATOR_PROMPT, user=briefing completo)
            └─> Retorna JSON estruturado
```

---

### 2. RetentionCriticAgent (Crítico de Retenção)

**Arquivo:** `app/agents/retention_critic_agent.py`
**Modelo:** GPT-4o | **Temperature:** 0.4 (equilibrado)

#### Input:
- `lines`: linhas do roteiro (objetos ou texto puro)
- `goal`: objetivo opcional

#### O que analisa:
- Hook fraco ou genérico ("Nesse vídeo vou falar sobre..." = fraco)
- Payoff revelado cedo demais (mata curiosidade)
- Frases longas (>20 palavras = ruim)
- Falta de curiosity gaps (loops abertos)
- Queda de ritmo (mudanças abruptas)
- Falta de variação emocional
- CTA fraco (sem urgência)

#### Output:
```json
{
  "improved_lines": [/* linhas melhoradas com retention_note */],
  "problems_found": ["problema 1", "problema 2"],
  "analysis": { "hook_strength": 0.9, "curiosity_gaps": [...], "weak_points": [...] }
}
```

**Endpoint:** `POST /api/generate/improve`

---

### 3. TranscriptionAgent (Transcrição)

**Arquivo:** `app/agents/transcription_agent.py`
**Modelo:** Whisper-1

#### Input:
- Arquivo de áudio (máx 25MB) OU texto puro

#### Processamento:
- Envia áudio para Whisper API com `timestamp_granularities=["segment", "word"]`
- **Primeiros 30s**: segmentos de 3-5 segundos (hook é crítico)
- **Após 30s**: segmentos de 10-15 segundos

#### Output:
```json
[
  { "start": 0.0, "end": 5.2, "text": "texto do segmento", "word_count": 15, "position_percent": 5.5 }
]
```

---

### 4. AnalysisAgent (Análise de Beats Narrativos)

**Arquivo:** `app/agents/analysis_agent.py`
**Modelo:** GPT-4o | **Temperature:** 0.3 (determinístico)

#### Input:
- `segments`: segmentos de transcrição com timing

#### O que classifica por segmento:

| Campo | Valores possíveis |
|-------|-------------------|
| `beat_type` | hook, setup, conflict, escalation, payoff, cta |
| `techniques` | curiosity_gap, open_loop, pattern_interrupt, contrast, cliffhanger, specificity, social_proof, urgency, storytelling |
| `emotion` | curiosity, surprise, fear, excitement, relief, urgency |
| `retention_function` | open curiosity, maintain tension, deliver promise |
| `intensity_score` | 0.0 - 1.0 |

#### Quando é chamado:
Parte do pipeline de upload de vídeo (task Celery assíncrona).

---

### 5. PerformanceAnalysisAgent (Análise de Performance)

**Arquivo:** `app/agents/performance_analysis_agent.py`
**Modelo:** GPT-4o | **Temperature:** 0.3

#### O que recebe como input:

```
MÉTRICAS DO SHORT:
├── views, likes, comments, shares, subscribers_gained
├── avg_view_duration_seconds, avg_view_percentage (retenção)
├── impressions, impressions_ctr (CTR)
└── engagement_rate

ROTEIRO USADO (se existir):
└── Linhas do script com funções narrativas

TRANSCRIÇÃO DO VÍDEO:
└── O que foi realmente falado

MÉDIAS DO CANAL (para comparação):
├── avg_views, avg_likes
├── avg_retention, avg_engagement_rate
└── Calculadas de todos os Shorts do usuário

INSIGHTS EXISTENTES:
└── Para validar ou invalidar com novos dados
```

#### 8 dimensões analisadas (score 0-10 cada):

| Dimensão | O que avalia | Métricas usadas |
|----------|-------------|-----------------|
| **Hook** | Gancho verbal/visual dos primeiros 3s | CTR, retenção 0-5s |
| **Ritmo** | Consistência do ritmo ao longo do vídeo | Retenção estável vs quedas abruptas |
| **Curiosidade** | Manutenção de atenção no meio | Retenção mid-video, comentários |
| **Retenção** | Porcentagem média assistida | >70% excelente, 50-70% bom, <50% ruim |
| **Clareza** | Conteúdo claro e valioso | Likes/views ratio |
| **Entrega da Promessa** | Payoff cumpre o que hook prometeu | Retenção até o final |
| **CTA** | Efetividade do call-to-action | Inscritos ganhos, compartilhamentos |
| **Narrativa** | Estrutura suporta o conteúdo | Formato da curva de retenção |

#### Classificação: `above_average` | `average` | `below_average` (vs média do canal)

#### Output inclui:
- Scores por dimensão
- Pontos fortes com evidência
- Pontos fracos com sugestão de melhoria
- Correlação roteiro vs performance (qual linha impactou qual métrica)
- **Aprendizados acionáveis** (alimentam o ciclo de aprendizado)
- Insights validados/invalidados

**Endpoint:** `POST /api/analysis/performance/{short_id}` → retorna task_id (assíncrono)

---

### 6. ChannelStrategyAgent (Estratégia do Canal)

**Arquivo:** `app/agents/channel_strategy_agent.py`
**Modelo:** GPT-4o | **Temperature:** 0.4

#### O que recebe:

```
ÚLTIMOS 50 SHORTS DO CANAL com:
├── id, title, description (200 chars), duration, data de publicação
├── transcript (500 chars)
├── views, likes, comments, shares
├── retention, engagement_rate
└── subscribers_gained

INSIGHTS EXISTENTES DO CANAL

NICHO DO CANAL (opcional)
```

#### O que analisa (top 20% de performance):

- **Tipo de gancho**: pergunta, choque, promessa, história, estatística
- **Temas/assuntos** que performam consistentemente
- **Estruturas narrativas**: problema-solução, lista, storytelling, tutorial
- **Estilo de fala**: rápido, lento, energético, conversacional
- **Duração ideal**
- **Tipos de CTA** que convertem
- **Tipos de curiosidade**: gap de conhecimento, revelação, suspense, paradoxo

#### Gera sugestões em 6 categorias:

| Categoria | Descrição |
|-----------|-----------|
| `high_view_potential` | Replica padrões de vídeos virais do canal |
| `high_retention_potential` | Foca em temas com alta retenção |
| `continuation` | Sequência de vídeo que performou bem |
| `variation` | Ângulo diferente de tema vencedor |
| `experiment` | Tema novo baseado em tendência |
| `brand_reinforcement` | Fortalece posicionamento do canal |

Cada sugestão inclui: título, descrição, justificativa com dados, hook sugerido, estrutura sugerida, duração estimada, score de confiança.

**Endpoint:** `POST /api/suggestions/generate` → task assíncrona

---

### 7. LearningMemoryAgent (Memória/Aprendizado)

**Arquivo:** `app/agents/learning_memory_agent.py`
**Modelo:** GPT-4o | **Temperature:** 0.3

#### O que recebe:
- Últimas 20 análises de performance (`PerformanceAnalysis`)
- Todos os insights existentes do canal

#### O que faz:

```
1. CONSOLIDA PADRÕES
   └── Identifica aprendizados que aparecem em 2+ análises

2. ATUALIZA INSIGHTS EXISTENTES
   ├── Validado novamente? → times_validated++, confidence↑
   ├── Contradito? → confidence↓ (se <0.3, desativa)
   └── Desatualizado? → atualiza descrição

3. DETECTA NOVOS PADRÕES
   ├── Correlação tema-performance
   ├── Correlação estrutura-retenção
   ├── Correlação hook-CTR
   └── Correlação duração-views

4. REGRAS DE CONFIANÇA
   ├── Mínimo 2 evidências para criar insight
   ├── Confiança inicial = 0.5 (5+ evidências → 0.7+)
   ├── Desativado se contradito 3+ vezes OU confiança <0.3
   └── Insights devem ser específicos e acionáveis
```

#### Exemplo de insight gerado:

```json
{
  "category": "hook",
  "sentiment": "positive",
  "title": "Hooks com dados específicos superam hooks com história 2x",
  "description": "Vídeos começando com estatísticas ('73% das pessoas...') têm 65% mais retenção nos primeiros 5s vs aberturas com história pessoal",
  "evidence": [
    {"short_id": "abc123", "metric": "retention_0_5s", "value": 0.92},
    {"short_id": "def456", "metric": "retention_0_5s", "value": 0.88}
  ],
  "confidence": 0.85,
  "times_validated": 4
}
```

**Endpoint:** `POST /api/analysis/patterns` → task assíncrona

---

## O Ciclo Fechado de Aprendizado

```
┌─────────────────────────────────────────────────────────┐
│                                                           │
│   ┌──────────┐    Insights + Estilo + Referências         │
│   │ GERAR    │◄───────────────────────────────────┐      │
│   │ ROTEIRO  │                                     │      │
│   └────┬─────┘                                     │      │
│        │                                           │      │
│        ▼                                           │      │
│   ┌──────────┐                              ┌─────┴────┐│
│   │ PUBLICAR │                              │ APRENDER  ││
│   │ NO YT    │                              │ (Memory   ││
│   └────┬─────┘                              │  Agent)   ││
│        │                                    └─────▲────┘│
│        ▼                                           │      │
│   ┌──────────┐    Scores + Aprendizados     ┌─────┴────┐│
│   │  MEDIR   │───────────────────────────►  │ ANALISAR  ││
│   │ MÉTRICAS │                              │ PERFORM.  ││
│   └──────────┘                              └──────────┘│
│                                                           │
└─────────────────────────────────────────────────────────┘
```

**Cada vez que o ciclo roda:**
1. Insights são atualizados (validados ou invalidados)
2. Novos padrões são descobertos
3. O próximo roteiro é gerado com mais contexto
4. A IA "aprende" o que funciona para ESTE canal específico

---

## Pipeline de Upload de Vídeo

```
POST /api/videos/upload (arquivo)
  │
  ├─ [1] TRANSCRIBING → Whisper API → segmentos com timing
  │
  ├─ [2] ANALYZING → GPT-4o → beats narrativos + técnicas de retenção
  │
  ├─ [3] EMBEDDING → text-embedding-3-small → vetores 1536d no pgvector
  │
  └─ [4] DONE → vídeo disponível para referência na geração de roteiros
```

---

## Banco de Dados (Tabelas Principais)

| Tabela | Propósito |
|--------|-----------|
| `users` | Usuários com tokens OAuth do YouTube |
| `videos` | Vídeos importados para análise de estilo |
| `transcript_segments` | Segmentos transcritos com timing |
| `script_beats` | Classificação narrativa de cada segmento |
| `segment_techniques` | Técnicas de retenção identificadas |
| `scripts` | Roteiros do usuário |
| `script_versions` | Versionamento de cada roteiro |
| `style_profiles` | Perfis de estilo extraídos de vídeos |
| `youtube_shorts` | Shorts importados do canal YouTube |
| `short_metrics` | Métricas de performance (views, retenção, etc.) |
| `channel_insights` | Aprendizados consolidados (com embedding) |
| `video_suggestions` | Sugestões de vídeo geradas pela IA |
| `performance_analyses` | Análises detalhadas de performance |

---

## Configuração de Temperature dos Agentes

| Agente | Temperature | Justificativa |
|--------|:-----------:|--------------|
| ScriptGenerator | 0.7 | Criatividade na escrita |
| RetentionCritic | 0.4 | Equilíbrio criatividade/precisão |
| Analysis | 0.3 | Classificação precisa |
| PerformanceAnalysis | 0.3 | Análise factual baseada em dados |
| ChannelStrategy | 0.4 | Sugestões criativas mas fundamentadas |
| LearningMemory | 0.3 | Consolidação precisa de padrões |

---

## Endpoints da IA

| Endpoint | Agente | Tipo | Retorno |
|----------|--------|------|---------|
| `POST /api/generate/script` | ScriptGenerator | Síncrono | Script JSON |
| `POST /api/generate/improve` | RetentionCritic | Síncrono | Script melhorado |
| `POST /api/generate/hooks` | LLM direto | Síncrono | Array de hooks |
| `POST /api/generate/from-suggestion/{id}` | ScriptGenerator | Síncrono | Script JSON |
| `POST /api/analysis/performance/{id}` | PerformanceAnalysis | Async (202) | task_id |
| `POST /api/analysis/channel` | ChannelStrategy | Async (202) | task_id |
| `POST /api/analysis/patterns` | LearningMemory | Async (202) | task_id |
| `POST /api/insights/generate` | LearningMemory | Async (202) | task_id |
| `POST /api/suggestions/generate` | ChannelStrategy | Async (202) | task_id |
