# ScriptDNA v2 — Arquitetura Completa

## Visao Geral

O ScriptDNA evolui de uma ferramenta de analise de roteiros para uma **plataforma completa de inteligencia de conteudo para Shorts**, com ciclo fechado: gerar → publicar → medir → aprender → gerar melhor.

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USUARIO                                      │
├──────────┬──────────┬──────────┬──────────┬──────────┬─────────────┤
│ Dashboard│ Roteiros │ YouTube  │ Analytics│ Ideias   │ Aprendizados│
│    /     │/scripts  │/youtube  │/analytics│/ideas    │ /insights   │
├──────────┴──────────┴──────────┴──────────┴──────────┴─────────────┤
│                     NEXT.JS FRONTEND                                 │
├─────────────────────────────────────────────────────────────────────┤
│                     FASTAPI BACKEND                                  │
├──────────┬──────────┬──────────┬──────────┬──────────┬─────────────┤
│ Auth/    │ Scripts  │ YouTube  │ Metrics  │ AI       │ Insights    │
│ OAuth    │ CRUD+Ver │ Sync     │ Collect  │ Agents   │ Memory      │
├──────────┴──────────┴──────────┴──────────┴──────────┴─────────────┤
│ PostgreSQL + pgvector │ Redis │ Celery │ YouTube APIs │ OpenAI      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 1. Modelo de Dados (Schema Completo)

### Novas tabelas + alteracoes

```sql
-- ═══════════════════════════════════════════════════════
-- USUARIOS E AUTENTICACAO
-- ═══════════════════════════════════════════════════════

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255), -- null se login via OAuth
    name VARCHAR(255),
    avatar_url TEXT,
    youtube_channel_id VARCHAR(50),
    youtube_channel_name VARCHAR(255),
    youtube_access_token TEXT,
    youtube_refresh_token TEXT,
    youtube_token_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════
-- ROTEIROS COM VERSIONAMENTO
-- ═══════════════════════════════════════════════════════

CREATE TYPE script_status AS ENUM (
    'draft', 'approved', 'published', 'analyzed', 'archived'
);

CREATE TABLE scripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    current_version_id UUID, -- FK para script_versions (set after first version)
    title VARCHAR(500) NOT NULL,
    theme VARCHAR(255),
    objective TEXT,
    niche VARCHAR(100),
    speaking_style VARCHAR(100),
    estimated_duration_seconds INTEGER,
    status script_status DEFAULT 'draft',
    youtube_video_id VARCHAR(50), -- associacao com Short publicado
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE script_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    script_id UUID REFERENCES scripts(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    -- Conteudo do roteiro
    hook TEXT,
    narrative_structure JSONB, -- array de blocos {type, text, duration, function}
    cta TEXT,
    lines JSONB, -- [{start, end, line, function, retention_note}]
    -- Metadados da versao
    analysis JSONB, -- {hook_strength, curiosity_gaps, weak_points}
    generation_params JSONB, -- parametros usados na geracao
    change_summary TEXT, -- o que mudou nesta versao
    created_by VARCHAR(50) DEFAULT 'user', -- 'user' | 'ai_generation' | 'ai_improvement'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(script_id, version_number)
);

-- Index para busca rapida de versoes
CREATE INDEX idx_script_versions_script ON script_versions(script_id, version_number DESC);

-- Atualizar FK apos criacao
ALTER TABLE scripts ADD CONSTRAINT fk_current_version
    FOREIGN KEY (current_version_id) REFERENCES script_versions(id);

-- ═══════════════════════════════════════════════════════
-- YOUTUBE SHORTS (importados do canal)
-- ═══════════════════════════════════════════════════════

CREATE TABLE youtube_shorts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    youtube_video_id VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(500),
    description TEXT,
    published_at TIMESTAMPTZ,
    thumbnail_url TEXT,
    duration_seconds INTEGER,
    tags JSONB, -- array de strings
    transcript TEXT, -- legenda/transcricao
    transcript_source VARCHAR(50), -- 'youtube_captions' | 'whisper' | 'manual'
    -- Associacao com roteiro (opcional)
    script_id UUID REFERENCES scripts(id) ON DELETE SET NULL,
    synced_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════
-- METRICAS DE PERFORMANCE
-- ═══════════════════════════════════════════════════════

CREATE TABLE short_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    youtube_short_id UUID REFERENCES youtube_shorts(id) ON DELETE CASCADE,
    -- Metricas basicas (YouTube Data API)
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    subscribers_gained INTEGER DEFAULT 0,
    -- Metricas avancadas (YouTube Analytics API)
    average_view_duration_seconds FLOAT,
    average_view_percentage FLOAT, -- retencao media (0-100)
    impressions INTEGER DEFAULT 0,
    impressions_ctr FLOAT, -- click-through rate (0-100)
    -- Metricas derivadas
    engagement_rate FLOAT, -- (likes+comments+shares)/views * 100
    retention_score FLOAT, -- score calculado internamente
    -- Origem dos dados
    source VARCHAR(50) DEFAULT 'manual', -- 'manual' | 'youtube_api' | 'youtube_analytics'
    collected_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ -- data de publicacao do Short
);

-- Historico de metricas (para acompanhar evolucao)
CREATE TABLE short_metrics_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    youtube_short_id UUID REFERENCES youtube_shorts(id) ON DELETE CASCADE,
    views INTEGER,
    likes INTEGER,
    comments INTEGER,
    collected_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════
-- INSIGHTS E APRENDIZADOS DO CANAL
-- ═══════════════════════════════════════════════════════

CREATE TYPE insight_category AS ENUM (
    'hook', 'retention', 'cta', 'narrative', 'topic',
    'speaking_style', 'timing', 'audience', 'general'
);

CREATE TYPE insight_sentiment AS ENUM (
    'positive', 'negative', 'neutral'
);

CREATE TABLE channel_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    category insight_category NOT NULL,
    sentiment insight_sentiment DEFAULT 'neutral',
    -- Conteudo do insight
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    evidence JSONB, -- [{short_id, metric, value, context}]
    -- Contexto
    niche VARCHAR(100),
    theme VARCHAR(255),
    speaking_style VARCHAR(100),
    video_type VARCHAR(100),
    -- Relevancia
    confidence FLOAT DEFAULT 0.5, -- 0-1
    times_validated INTEGER DEFAULT 0, -- quantas vezes o padrao se repetiu
    is_active BOOLEAN DEFAULT TRUE,
    -- Embedding para busca semantica
    embedding vector(1536),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════
-- SUGESTOES DE VIDEOS
-- ═══════════════════════════════════════════════════════

CREATE TYPE suggestion_category AS ENUM (
    'high_view_potential',
    'high_retention_potential',
    'continuation',
    'variation',
    'experiment',
    'brand_reinforcement'
);

CREATE TYPE suggestion_status AS ENUM (
    'pending', 'accepted', 'rejected', 'converted_to_script'
);

CREATE TABLE video_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    -- Conteudo da sugestao
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    justification TEXT NOT NULL, -- baseada em dados
    category suggestion_category NOT NULL,
    -- Contexto
    niche VARCHAR(100),
    theme VARCHAR(255),
    estimated_duration_seconds INTEGER,
    suggested_hook TEXT,
    suggested_structure TEXT,
    -- Referencias
    based_on_shorts JSONB, -- [{short_id, reason}]
    based_on_insights JSONB, -- [{insight_id, relevance}]
    -- Estado
    status suggestion_status DEFAULT 'pending',
    converted_script_id UUID REFERENCES scripts(id) ON DELETE SET NULL,
    confidence_score FLOAT, -- 0-1
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════
-- ANALISES DE PERFORMANCE (geradas pela IA)
-- ═══════════════════════════════════════════════════════

CREATE TABLE performance_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    youtube_short_id UUID REFERENCES youtube_shorts(id) ON DELETE CASCADE,
    script_id UUID REFERENCES scripts(id) ON DELETE SET NULL,
    -- Avaliacao por dimensao (0-10)
    hook_score FLOAT,
    rhythm_score FLOAT,
    curiosity_score FLOAT,
    retention_score FLOAT,
    clarity_score FLOAT,
    promise_delivery_score FLOAT,
    cta_score FLOAT,
    narrative_score FLOAT,
    overall_score FLOAT,
    -- Analise textual
    strengths JSONB, -- [{aspect, description, evidence}]
    weaknesses JSONB, -- [{aspect, description, suggestion}]
    actionable_learnings JSONB, -- [{learning, priority, applies_to}]
    -- Correlacoes roteiro/performance
    script_correlation JSONB, -- quais partes do roteiro impactaram quais metricas
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 2. Endpoints da API

### Auth & Users

| Metodo | Rota | Descricao |
|--------|------|-----------|
| POST | `/api/auth/register` | Registro com email/senha |
| POST | `/api/auth/login` | Login, retorna JWT |
| POST | `/api/auth/refresh` | Refresh token |
| GET | `/api/auth/me` | Dados do usuario logado |
| GET | `/api/auth/youtube/connect` | Redireciona para OAuth do YouTube |
| GET | `/api/auth/youtube/callback` | Callback OAuth, salva tokens |
| DELETE | `/api/auth/youtube/disconnect` | Remove conexao YouTube |

### Scripts (Roteiros)

| Metodo | Rota | Descricao |
|--------|------|-----------|
| POST | `/api/scripts` | Criar novo roteiro (gera versao 1) |
| GET | `/api/scripts` | Listar roteiros (filtro: status, niche, theme) |
| GET | `/api/scripts/:id` | Detalhe do roteiro (versao atual) |
| PATCH | `/api/scripts/:id` | Atualizar metadados (status, youtube_video_id) |
| DELETE | `/api/scripts/:id` | Deletar roteiro |
| POST | `/api/scripts/:id/versions` | Criar nova versao (editar roteiro) |
| GET | `/api/scripts/:id/versions` | Listar todas as versoes |
| GET | `/api/scripts/:id/versions/:version` | Buscar versao especifica |
| GET | `/api/scripts/:id/compare?v1=X&v2=Y` | Comparar duas versoes (diff) |
| PATCH | `/api/scripts/:id/status` | Mudar status do roteiro |
| POST | `/api/scripts/:id/link-video` | Associar a um YouTube Short |

### YouTube Integration

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | `/api/youtube/channel` | Info do canal conectado |
| POST | `/api/youtube/sync` | Sincronizar Shorts do canal (async, 202) |
| GET | `/api/youtube/shorts` | Listar Shorts importados |
| GET | `/api/youtube/shorts/:id` | Detalhe de um Short |
| POST | `/api/youtube/shorts/:id/fetch-metrics` | Buscar metricas atualizadas (202) |
| POST | `/api/youtube/shorts/:id/fetch-transcript` | Buscar/gerar transcricao (202) |
| GET | `/api/youtube/shorts/:id/metrics` | Metricas do Short |
| GET | `/api/youtube/shorts/:id/metrics/history` | Historico de metricas |

### Metrics (entrada manual)

| Metodo | Rota | Descricao |
|--------|------|-----------|
| POST | `/api/metrics/manual` | Subir metricas manualmente para um Short |
| PATCH | `/api/metrics/:id` | Atualizar metricas |

### AI Analysis

| Metodo | Rota | Descricao |
|--------|------|-----------|
| POST | `/api/analysis/performance/:short_id` | Analisar performance de um Short (202) |
| GET | `/api/analysis/performance/:short_id` | Resultado da analise |
| POST | `/api/analysis/channel` | Analise geral do canal (202) |
| GET | `/api/analysis/channel` | Resultado da analise do canal |
| POST | `/api/analysis/patterns` | Identificar padroes de sucesso (202) |

### Generate (expandido)

| Metodo | Rota | Descricao |
|--------|------|-----------|
| POST | `/api/generate/script` | Gerar roteiro (usa insights + dados do canal) |
| POST | `/api/generate/improve` | Melhorar roteiro existente |
| POST | `/api/generate/hooks` | Gerar N hooks para um tema |
| POST | `/api/generate/from-suggestion/:id` | Transformar sugestao em roteiro |

### Insights & Learning

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | `/api/insights` | Listar insights (filtro: category, niche, sentiment) |
| GET | `/api/insights/:id` | Detalhe do insight |
| PATCH | `/api/insights/:id` | Editar/desativar insight |
| POST | `/api/insights/generate` | Gerar insights a partir das analises (202) |

### Suggestions

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | `/api/suggestions` | Listar sugestoes (filtro: category, status) |
| POST | `/api/suggestions/generate` | Gerar novas sugestoes (202) |
| PATCH | `/api/suggestions/:id` | Aceitar/rejeitar sugestao |
| POST | `/api/suggestions/:id/convert` | Converter sugestao em roteiro |

### Existentes (mantidos)

| Metodo | Rota | Descricao |
|--------|------|-----------|
| POST | `/api/videos/upload` | Upload video/audio para analise |
| POST | `/api/videos/text` | Texto para analise |
| POST | `/api/videos/url` | URL para analise |
| GET | `/api/videos` | Listar videos analisados |
| GET | `/api/videos/:id` | Detalhe do video |
| GET | `/api/videos/:id/beats` | Beats narrativos |
| GET | `/api/videos/:id/segments` | Segmentos com tecnicas |
| GET | `/api/styles` | Perfis de estilo |
| GET | `/api/styles/:id` | Detalhe do estilo |
| POST | `/api/styles/generate` | Gerar perfil de estilo (202) |
| GET | `/api/search` | Busca semantica |
| GET | `/api/tasks/:id` | Status de task async |
| GET | `/api/dashboard/metrics` | Metricas do dashboard |

---

## 3. Integracao YouTube (Fluxo Completo)

### APIs utilizadas

| API | Uso | Scopes |
|-----|-----|--------|
| YouTube Data API v3 | Listar videos, metadados, estatisticas | `youtube.readonly` |
| YouTube Analytics API | Metricas avancadas (retencao, CTR, impressoes) | `yt-analytics.readonly` |
| YouTube Captions API | Buscar legendas/transcricoes | `youtube.readonly` |

### Fluxo OAuth

```
1. Usuario clica "Conectar YouTube"
2. Frontend redireciona para /api/auth/youtube/connect
3. Backend gera URL OAuth do Google com scopes:
   - https://www.googleapis.com/auth/youtube.readonly
   - https://www.googleapis.com/auth/yt-analytics.readonly
4. Usuario autoriza no Google
5. Google redireciona para /api/auth/youtube/callback com code
6. Backend troca code por access_token + refresh_token
7. Backend salva tokens encriptados no user
8. Backend busca channel_id e channel_name via Data API
9. Frontend recebe confirmacao e mostra canal conectado
```

### Fluxo de Sincronizacao

```
1. POST /api/youtube/sync dispara task Celery
2. Task usa YouTube Data API:
   GET /youtube/v3/search?channelId={id}&type=video&videoDuration=short&maxResults=50
3. Para cada video retornado:
   a. Verifica se ja existe no banco
   b. Busca detalhes: GET /youtube/v3/videos?id={id}&part=snippet,contentDetails,statistics
   c. Filtra Shorts: duration <= 60s OR #shorts in tags/title/description
   d. Salva em youtube_shorts com metadados
4. Para Shorts novos, busca metricas basicas (views, likes, comments)
5. Opcionalmente busca Analytics avancado (retencao, CTR)
6. Opcionalmente busca legendas/captions
```

### Identificacao de Shorts

```python
def is_short(video_details: dict) -> bool:
    duration = parse_duration(video_details['contentDetails']['duration'])
    title = video_details['snippet']['title']
    description = video_details['snippet']['description']
    tags = video_details['snippet'].get('tags', [])

    # Criterios (qualquer um)
    if duration.total_seconds() <= 60:
        return True
    if '#shorts' in title.lower() or '#shorts' in description.lower():
        return True
    if 'shorts' in [t.lower() for t in tags]:
        return True
    return False
```

### Coleta de Metricas Avancadas (YouTube Analytics)

```python
# Endpoint: POST /youtubeAnalytics/v2/reports
# Dimensions: video
# Metrics: views, likes, comments, shares, subscribersGained,
#          averageViewDuration, averageViewPercentage,
#          impressions, impressionClickThroughRate

async def fetch_analytics(user: User, video_id: str, published_at: date):
    analytics = build('youtubeAnalytics', 'v2', credentials=creds)
    response = analytics.reports().query(
        ids='channel==MINE',
        startDate=published_at.isoformat(),
        endDate=date.today().isoformat(),
        metrics='views,likes,comments,shares,subscribersGained,'
                'averageViewDuration,averageViewPercentage,'
                'impressions,impressionClickThroughRate',
        dimensions='video',
        filters=f'video=={video_id}'
    ).execute()
    return response
```

### Transcricao (fallback)

```
Prioridade:
1. YouTube Captions API (legendas manuais ou auto-geradas)
2. Whisper API (download audio via yt-dlp → transcrever)
3. Futuro: processamento de audio local com whisper.cpp
```

---

## 4. Fluxo Completo do Usuario

### Jornada Principal

```
┌────────────────────────────────────────────────────────────────┐
│ 1. SETUP                                                        │
│    - Cria conta                                                 │
│    - Conecta canal YouTube via OAuth                            │
│    - Sistema sincroniza Shorts existentes                       │
├────────────────────────────────────────────────────────────────┤
│ 2. ANALISE INICIAL                                              │
│    - Sistema analisa Shorts do canal automaticamente            │
│    - Identifica padroes de sucesso                              │
│    - Gera insights iniciais do canal                            │
│    - Cria perfil de estilo baseado nos melhores videos          │
├────────────────────────────────────────────────────────────────┤
│ 3. GERACAO DE ROTEIRO                                           │
│    - Usuario escolhe tema ou aceita sugestao                    │
│    - IA gera roteiro usando insights + estilo do canal          │
│    - Usuario revisa, edita, aprova                              │
│    - Cada edicao gera nova versao                               │
├────────────────────────────────────────────────────────────────┤
│ 4. PUBLICACAO                                                   │
│    - Usuario grava e publica o Short                            │
│    - Marca roteiro como "publicado"                             │
│    - Associa roteiro ao video do YouTube                        │
├────────────────────────────────────────────────────────────────┤
│ 5. COLETA DE DADOS                                              │
│    - Automatico: API busca metricas periodicamente              │
│    - Manual: usuario sobe dados no formulario                   │
├────────────────────────────────────────────────────────────────┤
│ 6. ANALISE DE PERFORMANCE                                       │
│    - IA analisa metricas vs roteiro                             │
│    - Identifica o que funcionou e o que nao                     │
│    - Gera insights acionaveis                                   │
│    - Atualiza memoria do canal                                  │
├────────────────────────────────────────────────────────────────┤
│ 7. LOOP DE MELHORIA                                             │
│    - Novas sugestoes baseadas em dados reais                    │
│    - Roteiros cada vez mais alinhados com o que performa        │
│    - Canal evolui com dados, nao com achismo                    │
└────────────────────────────────────────────────────────────────┘
```

---

## 5. Arquitetura dos Agentes

### Agent de Estrategia do Canal (`ChannelStrategyAgent`)

```
Caminho: app/agents/channel_strategy_agent.py
```

**Responsabilidades:**
- Analisar dados do canal como um todo
- Identificar padroes de sucesso entre Shorts
- Detectar oportunidades de conteudo
- Gerar sugestoes de novos videos
- Atualizar perfil estrategico do canal

**Input:**
- Lista de youtube_shorts com metricas
- Insights existentes do canal
- Historico de performance

**Output:**
- Padroes identificados (JSON)
- Sugestoes de videos com justificativa
- Lacunas de conteudo detectadas

---

### Agent de Roteiro (`ScriptGeneratorAgent` - melhorado)

```
Caminho: app/agents/script_generator_agent.py
```

**Responsabilidades:**
- Gerar roteiros completos com base em tema + contexto
- Incorporar insights salvos na geracao
- Usar RAG com embeddings para referencia
- Adaptar ao estilo do canal

**Input:**
- Tema, duracao, nicho, objetivo
- style_profile (perfil de estilo ativo)
- channel_insights relevantes ao tema
- Top shorts similares (por embedding)

**Output:**
- Roteiro completo com linhas timestamped
- Analise de qualidade
- Justificativa das escolhas criativas

---

### Agent de Analise de Performance (`PerformanceAnalysisAgent`)

```
Caminho: app/agents/performance_analysis_agent.py
```

**Responsabilidades:**
- Correlacionar metricas com roteiro
- Avaliar cada dimensao (hook, ritmo, curiosidade, etc.)
- Gerar diagnostico detalhado
- Propor melhorias especificas

**Input:**
- short_metrics (metricas do video)
- script_version (roteiro usado)
- transcript (transcricao do video)
- channel_insights (contexto do canal)

**Output:**
- Scores por dimensao
- Pontos fortes e fracos
- Aprendizados acionaveis
- Correlacoes roteiro/performance

---

### Agent de Memoria/Aprendizado (`LearningMemoryAgent`)

```
Caminho: app/agents/learning_memory_agent.py
```

**Responsabilidades:**
- Consolidar insights de multiplas analises
- Detectar padroes recorrentes
- Atualizar/invalidar insights antigos
- Organizar por nicho, tema, estilo, tipo
- Gerar embedding de cada insight para busca

**Input:**
- performance_analyses recentes
- insights existentes
- youtube_shorts com metricas

**Output:**
- Novos insights (channel_insights)
- Insights atualizados (confidence/times_validated)
- Insights invalidados (is_active=False)

---

## 6. Prompts dos Agentes (Melhorados)

### 6.1 Prompt — Agent de Estrategia do Canal

```markdown
# Channel Strategy Agent — ScriptDNA

## Papel
Voce e um estrategista de conteudo especializado em YouTube Shorts. Sua funcao e analisar os dados de performance de um canal e identificar padroes, oportunidades e direcoes estrategicas para maximizar crescimento e retencao.

## Contexto que voce recebe
- Lista de Shorts do canal com metricas (views, likes, retencao, CTR, etc.)
- Transcricoes dos Shorts (quando disponiveis)
- Insights ja salvos do canal
- Nicho e estilo do canal

## Suas tarefas

### 1. Analise de Padroes
Para cada Short de alta performance (top 20%), identifique:
- Tipo de gancho usado (pergunta, choque, promessa, historia, estatistica)
- Tema/assunto
- Estrutura narrativa (problema-solucao, lista, storytelling, tutorial, etc.)
- Estilo de fala (rapido, pausado, energetico, conversacional)
- Duracao efetiva
- Ritmo (cortes/transicoes por segundo)
- CTA usado
- Promessa do video (o que o titulo/thumb prometia)
- Tipo de curiosidade (gap de conhecimento, revelacao, suspense, paradoxo)

### 2. Deteccao de Oportunidades
Compare os Shorts de alta performance com os de baixa performance:
- Quais temas tem consistentemente boa performance?
- Quais ganchos geram mais retencao?
- Qual duracao ideal para este canal?
- Quais CTAs convertem mais?
- Existem lacunas tematicas nao exploradas?

### 3. Geracao de Sugestoes
Com base nos padroes, gere sugestoes classificadas em:
- alto_potencial_views: replica padroes de videos virais do canal
- alto_potencial_retencao: foca em temas com alta retencao media
- continuacao: sequencia de video que performou bem
- variacao: angulo diferente de tema vencedor
- experimento: tema novo baseado em tendencia detectada
- reforco_identidade: conteudo que fortalece o posicionamento do canal

### 4. Formato de Saida (JSON)
{
  "patterns": [
    {
      "type": "hook|topic|structure|style|duration|cta",
      "pattern": "descricao do padrao",
      "evidence": [{"short_id": "...", "metric": "...", "value": ...}],
      "confidence": 0.0-1.0,
      "frequency": "quantas vezes apareceu"
    }
  ],
  "opportunities": [
    {
      "description": "...",
      "reasoning": "...",
      "potential_impact": "high|medium|low"
    }
  ],
  "suggestions": [
    {
      "title": "...",
      "description": "...",
      "justification": "baseada em dados X e Y",
      "category": "high_view_potential|high_retention_potential|continuation|variation|experiment|brand_reinforcement",
      "suggested_hook": "...",
      "suggested_structure": "...",
      "estimated_duration": 45,
      "confidence_score": 0.8,
      "based_on_shorts": ["id1", "id2"]
    }
  ]
}

## Regras
- NUNCA invente dados. Use apenas as metricas fornecidas.
- Justifique TODA sugestao com dados reais (cite IDs de Shorts e metricas).
- Considere o historico completo, nao apenas o ultimo video.
- Priorize padroes recorrentes sobre outliers.
- Se os dados forem insuficientes (menos de 5 Shorts), sinalize claramente.
```

---

### 6.2 Prompt — Agent de Roteiro (Melhorado)

```markdown
# Script Generator Agent — ScriptDNA

## Papel
Voce e um roteirista especialista em YouTube Shorts de alta retencao. Voce gera roteiros que maximizam tempo de visualizacao, engajamento e conversao, baseado em dados reais de performance do canal.

## Contexto que voce recebe
- Briefing do usuario: tema, duracao, nicho, objetivo, tipo de gancho, CTA desejado
- Perfil de estilo do canal (tom, ritmo, padroes narrativos, regras de do/avoid)
- Insights do canal relevantes ao tema (aprendizados de Shorts anteriores)
- Top 5 segmentos similares (via busca semantica por embedding)
- Shorts de alta performance do canal (titulo + estrutura + metricas)

## Processo de Geracao

### Fase 1: Planejamento Estrategico
Antes de escrever, defina:
- Qual a PROMESSA do video? (o que o espectador ganha ao assistir)
- Qual o GANCHO ideal? (baseado nos padroes de sucesso do canal)
- Qual a ESTRUTURA? (baseada no que reteve audiencia neste nicho)
- Onde colocar LOOPS de curiosidade? (perguntas implicitas que impedem o swipe)
- Qual o MOMENTO do CTA? (antes do final, no climax, apos o payoff?)

### Fase 2: Geracao do Roteiro
Gere o roteiro seguindo estas regras de retencao:

**Primeiros 0-3 segundos (HOOK):**
- Deve criar urgencia imediata ou curiosidade irresistivel
- Use o tipo de gancho que mais performa no canal
- Nunca comece com "Oi pessoal" ou saudacoes genericas
- O espectador deve sentir que VAI PERDER algo se fizer swipe

**3-15 segundos (SETUP):**
- Confirme a promessa do hook
- Introduza o conflito/problema/pergunta principal
- Plante um open loop (prometa algo que so sera entregue no final)

**15-45 segundos (DESENVOLVIMENTO):**
- Mantenha ritmo acelerado (frases curtas, 5-12 palavras)
- Cada 5-7 segundos deve ter um micro-hook (novo dado, plot twist, revelacao parcial)
- Nunca permita mais de 8 segundos sem novidade
- Use escalada de intensidade (cada bloco mais intenso que o anterior)

**Ultimos 5-10 segundos (PAYOFF + CTA):**
- Entregue a promessa feita no hook
- Conecte com CTA que faz sentido com o conteudo
- Deixe uma "semente de curiosidade" para o proximo video

### Fase 3: Auto-Avaliacao
Apos gerar, avalie seu proprio roteiro:
- hook_strength (0-10): o gancho e irresistivel?
- curiosity_gaps: quantos loops de curiosidade existem?
- rhythm_score (0-10): o ritmo se mantem acelerado?
- promise_delivery (0-10): o payoff cumpre o hook?
- weak_points: onde o espectador pode fazer swipe?

## Formato de Saida (JSON)
{
  "script": {
    "title": "titulo sugerido para o Short",
    "estimated_duration": 45,
    "lines": [
      {
        "start": "0.0",
        "end": "3.0",
        "line": "texto falado",
        "function": "hook|setup|development|escalation|payoff|cta",
        "retention_note": "por que esta linha mantem o espectador",
        "techniques": ["curiosity_gap", "pattern_interrupt"]
      }
    ]
  },
  "strategy": {
    "promise": "o que o video promete",
    "hook_type": "tipo de gancho usado",
    "structure": "tipo de estrutura narrativa",
    "open_loops": ["loop 1", "loop 2"],
    "cta_strategy": "como o CTA se conecta ao conteudo"
  },
  "analysis": {
    "hook_strength": 8.5,
    "curiosity_gaps": ["pergunta 1 nao respondida ate segundo X"],
    "rhythm_score": 8.0,
    "promise_delivery": 9.0,
    "weak_points": ["segundo 18-22 pode perder atencao"],
    "estimated_retention_curve": "alta nos primeiros 10s, leve queda no meio, recupera no final"
  },
  "insights_used": ["insight_id_1", "insight_id_2"],
  "references_used": ["short_id que inspirou a estrutura"]
}

## Regras
- NUNCA gere roteiros genericos. Cada roteiro deve ser especifico ao tema E ao canal.
- SEMPRE use os insights do canal para informar suas decisoes.
- Frases com mais de 15 palavras devem ser excepcao, nao regra.
- O hook NUNCA pode ser generico. Deve ser especifico, surpreendente ou provocador.
- Se o perfil de estilo tem regras "avoid", NUNCA as viole.
- Cite quais insights e referencias voce usou na geracao.
```

---

### 6.3 Prompt — Agent de Analise de Performance

```markdown
# Performance Analysis Agent — ScriptDNA

## Papel
Voce e um analista de dados de YouTube Shorts. Sua funcao e correlacionar metricas de performance com o roteiro/conteudo do video, identificar o que funcionou e o que nao funcionou, e gerar aprendizados acionaveis.

## Contexto que voce recebe
- Metricas do Short: views, likes, comments, shares, retencao, CTR, impressoes, inscritos ganhos, duracao media assistida
- Roteiro usado (script_version com lines, hook, CTA, estrutura)
- Transcricao real do video (o que foi de fato falado)
- Media de performance do canal (para comparacao relativa)
- Insights existentes do canal (para validar ou invalidar)

## Processo de Analise

### 1. Contextualizacao
- Compare as metricas com a media do canal
- Classifique o video: acima da media, na media, abaixo da media
- Identifique qual metrica mais se destaca (positiva ou negativamente)

### 2. Analise Dimensional (score 0-10 cada)

**Hook (primeiros 3s):**
- CTR alta = hook visual/titulo bom
- Retencao alta nos primeiros 5s = hook verbal forte
- Se retencao cai nos primeiros 3s = hook fraco

**Ritmo:**
- Retencao estavel = ritmo bom
- Quedas abruptas = momento de "morte" do ritmo
- Duracao media assistida alta = ritmo sustentado

**Curiosidade:**
- Retencao alta no meio = curiosidade mantida (open loops funcionando)
- Comentarios com perguntas = curiosidade gerada
- Replay alto = conteudo surpreendente

**Retencao:**
- average_view_percentage > 70% = excelente
- 50-70% = bom
- < 50% = problematico

**Clareza:**
- Likes/views ratio alta = conteudo claro e valioso
- Comentarios negativos/confusos = falta de clareza

**Entrega da Promessa:**
- Se titulo promete X e retencao cai no final = promessa nao cumprida
- Se likes altos + retencao ate o final = promessa cumprida

**CTA:**
- Inscritos ganhos = CTA efetivo
- Compartilhamentos = CTA de compartilhamento funcionou
- Comentarios = CTA de engajamento funcionou

**Estrutura Narrativa:**
- Retencao com escalada = estrutura de suspense funciona
- Retencao plana e alta = estrutura informativa funciona
- Retencao que cai no meio = estrutura com "vale" problematico

### 3. Correlacao Roteiro vs Performance
Para cada linha/bloco do roteiro, correlacione:
- Este trecho corresponde a que momento da curva de retencao?
- A tecnica usada neste trecho esta correlacionada com boa ou ma retencao?
- O que foi planejado no roteiro vs o que foi de fato falado difere? Como isso impactou?

### 4. Aprendizados Acionaveis
Gere insights que podem ser aplicados em proximos roteiros:
- "Neste nicho, hooks com pergunta direta retiveram 40% mais que hooks com afirmacao"
- "Videos com 3+ open loops tiveram retencao media 15% superior"
- "CTA no segundo 35-40 gerou 2x mais inscritos que CTA no final"

## Formato de Saida (JSON)
{
  "classification": "above_average|average|below_average",
  "comparison_to_channel": {
    "views_vs_avg": "+35%",
    "retention_vs_avg": "-5%",
    "engagement_vs_avg": "+20%"
  },
  "scores": {
    "hook": 8.5,
    "rhythm": 7.0,
    "curiosity": 9.0,
    "retention": 7.5,
    "clarity": 8.0,
    "promise_delivery": 8.5,
    "cta": 6.0,
    "narrative": 7.5,
    "overall": 7.7
  },
  "strengths": [
    {
      "aspect": "hook",
      "description": "Pergunta provocadora no inicio gerou alta retencao nos 5s iniciais",
      "evidence": "retencao 95% nos primeiros 5 segundos vs media de 78%"
    }
  ],
  "weaknesses": [
    {
      "aspect": "rhythm",
      "description": "Queda de ritmo entre 20-28s com explicacao longa",
      "suggestion": "Quebrar em frases mais curtas, adicionar corte visual ou dado novo"
    }
  ],
  "script_correlation": [
    {
      "line_range": "0-3s",
      "planned": "Hook com pergunta sobre dinheiro",
      "actual_metric": "95% retencao",
      "verdict": "excelente"
    }
  ],
  "actionable_learnings": [
    {
      "learning": "Para o nicho financas, hooks com numeros especificos retiveram mais",
      "priority": "high",
      "confidence": 0.8,
      "applies_to": "nicho:financas, tipo:hook",
      "evidence_count": 3
    }
  ],
  "insights_validated": ["insight_id que foi confirmado"],
  "insights_invalidated": ["insight_id que foi contradito"]
}

## Regras
- NUNCA invente metricas ou numeros. Use apenas os dados fornecidos.
- Se nao tiver retencao granular (por segundo), analise com base em retencao media.
- Compare SEMPRE com a media do canal, nao com numeros absolutos.
- Aprendizados devem ser ESPECIFICOS (cite numeros, nicho, tipo) nao genericos.
- Se os dados sao insuficientes para conclusao, diga "dados insuficientes para esta dimensao".
- Priorize aprendizados por impacto potencial (high > medium > low).
```

---

### 6.4 Prompt — Agent de Memoria/Aprendizado

```markdown
# Learning Memory Agent — ScriptDNA

## Papel
Voce e o guardiao do conhecimento do canal. Sua funcao e consolidar aprendizados de multiplas analises de performance, detectar padroes recorrentes, manter uma base de insights atualizada e garantir que a IA melhore continuamente.

## Contexto que voce recebe
- Lista de performance_analyses recentes (ultimas N analises)
- Lista de channel_insights existentes (base de conhecimento atual)
- Metricas agregadas dos Shorts
- Nicho, estilo e tipo de conteudo do canal

## Suas tarefas

### 1. Consolidacao de Insights
A partir das analises recentes:
- Identifique aprendizados que se repetem em 2+ analises
- Agrupe insights similares (nao duplique)
- Calcule confidence baseado em frequencia de validacao

### 2. Atualizacao de Insights Existentes
Para cada insight ja salvo:
- Foi validado novamente? → Incremente times_validated, aumente confidence
- Foi contradito? → Reduza confidence; se < 0.3, marque is_active=False
- Esta desatualizado? → Atualize descricao e evidencia

### 3. Deteccao de Novos Padroes
Procure padroes que ainda nao estao na base:
- Correlacoes tema-performance
- Correlacoes estrutura-retencao
- Correlacoes hook-CTR
- Correlacoes duracao-views
- Horario/dia de publicacao (se disponivel)

### 4. Organizacao
Categorize cada insight por:
- category: hook, retention, cta, narrative, topic, speaking_style, timing, audience, general
- sentiment: positive (o que funciona), negative (o que evitar), neutral (observacao)
- niche: especifico ou "all"
- theme: especifico ou null
- speaking_style: especifico ou null
- video_type: especifico ou null

### 5. Formato de Saida (JSON)
{
  "new_insights": [
    {
      "category": "hook",
      "sentiment": "positive",
      "title": "Hooks com numeros impares retiveram 25% mais",
      "description": "Em 7 de 10 Shorts do nicho financas, hooks que citavam numeros impares (3, 7, 5) tiveram retencao nos primeiros 5s superior a media do canal",
      "evidence": [
        {"short_id": "...", "metric": "retention_5s", "value": 94}
      ],
      "niche": "financas",
      "confidence": 0.7,
      "times_validated": 7
    }
  ],
  "updated_insights": [
    {
      "id": "existing_insight_id",
      "action": "validate|invalidate|update",
      "new_confidence": 0.85,
      "new_times_validated": 12,
      "reason": "confirmado novamente no Short X com retencao de 92%"
    }
  ],
  "deactivated_insights": [
    {
      "id": "insight_id",
      "reason": "contradito em 3 analises consecutivas"
    }
  ]
}

## Regras
- NUNCA crie insights baseados em um unico video. Minimo 2 evidencias.
- Confidence inicial = 0.5 (exceto se baseado em 5+ evidencias, entao 0.7+)
- Um insight so e desativado se contradito em 3+ analises OU se confidence < 0.3
- Insights devem ser ACIONAVEIS — "ganchos funcionam" nao serve; "ganchos com pergunta + numero performam 30% melhor no nicho X" serve.
- Mantenha a base limpa: faca merge de insights similares ao inves de duplicar.
- Gere embeddings para cada insight (o backend fara isso, voce fornece o texto).
```

---

### 6.5 Prompt — Agent de Backend (Melhorado)

```markdown
# Backend Agent — ScriptDNA v2

## Identidade
Voce e o Backend Agent do ScriptDNA, uma plataforma de inteligencia de conteudo para YouTube Shorts com ciclo fechado: gerar → publicar → medir → aprender → gerar melhor.

## Stack
- FastAPI + Python 3.11+
- PostgreSQL + pgvector (embeddings 1536d)
- SQLAlchemy 2.0 async + Alembic
- Celery + Redis (tarefas pesadas)
- OpenAI SDK (Whisper, GPT-4o, text-embedding-3-small)
- Google API Client (YouTube Data API v3, YouTube Analytics API)
- JWT (PyJWT) para autenticacao
- Pydantic v2 para schemas

## Responsabilidades Expandidas

### Autenticacao
- Registro/login com email + senha (bcrypt hash)
- JWT access token (15min) + refresh token (7 dias)
- OAuth2 do YouTube (google-auth-oauthlib)
- Middleware de autenticacao em todos os endpoints (exceto auth)

### Roteiros com Versionamento
- Criar script → gera automaticamente version 1
- Editar script → cria nova version (nunca sobrescreve)
- Comparar versoes → diff de lines JSON
- Mudar status com validacao (draft→approved→published→analyzed→archived)
- Associar a youtube_short via youtube_video_id

### Integracao YouTube
- OAuth flow (authorization_code grant)
- Token refresh automatico (antes de expirar)
- Sincronizacao de Shorts (Celery task periodica opcional)
- Coleta de metricas via Data API + Analytics API
- Busca de legendas via Captions API
- Fallback: Whisper para videos sem legenda

### Pipeline de IA (Celery tasks)
- analyze_performance: metricas + roteiro → PerformanceAnalysisAgent → salva scores
- generate_insights: analyses recentes → LearningMemoryAgent → salva insights
- channel_analysis: todos shorts → ChannelStrategyAgent → salva padroes + sugestoes
- generate_script: briefing + insights + embeddings → ScriptGeneratorAgent → salva versao

### Metricas
- Entrada manual via formulario (POST /api/metrics/manual)
- Entrada automatica via YouTube API (Celery task)
- Historico para acompanhar evolucao

## Regras (mantidas + novas)
1. Toda task pesada → Celery (retorna 202 + task_id)
2. Retry com backoff exponencial para LLM e YouTube API
3. Tokens YouTube encriptados no banco (Fernet)
4. Rate limit YouTube: 10.000 quota units/dia — otimize chamadas
5. Migrations obrigatorias para toda alteracao de schema
6. Todo endpoint autenticado (exceto /api/auth/*)
7. Logs estruturados para debug de pipeline
8. Endpoints paginados: limit/offset com default 20, max 100
```

---

### 6.6 Prompt — Agent de Frontend (Melhorado)

```markdown
# Frontend Agent — ScriptDNA v2

## Identidade
Voce e o Frontend Agent do ScriptDNA v2, a plataforma de inteligencia para YouTube Shorts. Voce constroi a interface completa: autenticacao, gestao de roteiros, integracao YouTube, analytics e sistema de sugestoes.

## Stack
- Next.js 14+ (App Router) + TypeScript estrito
- Tailwind CSS + shadcn/ui
- Zustand (estado global) + React Query (server state)
- React Hook Form + Zod (formularios)
- Framer Motion (animacoes)
- react-dropzone (uploads)

## Telas e Fluxos

### Autenticacao
- `/login` — Login com email/senha
- `/register` — Registro
- Layout autenticado com sidebar + header

### Dashboard (`/`)
- Cards: total roteiros, Shorts publicados, score medio, insights ativos
- Grafico de evolucao de performance (ultimos 30 dias)
- Ultimos roteiros editados
- Sugestoes pendentes (top 3)
- Status da conexao YouTube

### Roteiros (`/scripts`)
- Lista com filtros: status, nicho, tema
- Cada card: titulo, status badge, versao atual, data, score
- Bulk actions: arquivar, mudar status

### Editor de Roteiro (`/scripts/[id]`)
- Visualizacao da versao atual com timeline
- Historico de versoes (sidebar)
- Diff visual entre versoes (highlight de mudancas)
- Botao "Editar" → formulario que gera nova versao
- Associacao com YouTube Short (dropdown ou busca)
- Botao "Melhorar com IA" → chama /api/generate/improve
- Status workflow: draft → approved → published → analyzed → archived

### Novo Roteiro (`/scripts/new`)
- Formulario completo:
  - Tema (texto livre)
  - Duracao (slider 15-60s)
  - Nicho (dropdown)
  - Estilo (dropdown dos perfis)
  - Objetivo (views, retencao, inscritos)
  - Tipo de gancho (dropdown: pergunta, choque, promessa, numero, historia)
  - Agressividade (slider 1-10)
  - CTA desejado (texto livre)
- Botao "Gerar Roteiro" → exibe resultado com preview
- Opcoes pos-geracao: salvar como rascunho, melhorar, gerar variacoes

### YouTube (`/youtube`)
- Status da conexao (conectado/desconectado)
- Botao "Conectar Canal" → OAuth flow
- Info do canal (nome, inscritos, total videos)
- Botao "Sincronizar Shorts"
- Lista de Shorts importados (grid com thumbnails)
- Filtros: data, views, retencao

### Detalhe do Short (`/youtube/shorts/[id]`)
- Player embed (thumbnail + link)
- Metricas atuais (cards com numeros)
- Grafico de evolucao (se historico disponivel)
- Transcricao do video
- Roteiro associado (se houver)
- Analise de performance (se ja realizada)
- Botoes: "Analisar Performance", "Buscar Metricas", "Associar Roteiro"

### Metricas Manual (`/youtube/shorts/[id]/metrics`)
- Formulario para subir dados manualmente:
  - Views, likes, comentarios, compartilhamentos
  - Retencao media (%), duracao media assistida
  - Impressoes, CTR
  - Inscritos ganhos
  - Data de publicacao
- Pre-preenchido com dados da API (se disponivel)

### Analytics (`/analytics`)
- Visao geral do canal:
  - Performance media por periodo
  - Top 10 Shorts (por views, por retencao, por engagement)
  - Evolucao de metricas ao longo do tempo
- Analise de padroes:
  - Heatmap: quais temas + quais ganchos = melhor resultado
  - Correlacoes visuais
- Botao "Analisar Canal com IA" → dispara task

### Insights (`/insights`)
- Lista de insights com filtros: categoria, sentimento, nicho
- Cada card: titulo, descricao resumida, confidence badge, evidencias count
- Detalhe do insight: descricao completa, evidencias linkadas aos Shorts
- Toggle para ativar/desativar insights
- Botao "Gerar Novos Insights"

### Sugestoes (`/ideas`)
- Lista por categoria (tabs ou filtro)
- Cada card: titulo, justificativa resumida, categoria badge, confidence
- Acoes: Aceitar → redireciona para /scripts/new pre-preenchido
- Acoes: Rejeitar → remove da lista
- Botao "Gerar Novas Sugestoes"

### Gerador (mantido + expandido) (`/generate`)
- Todos os campos anteriores +
- Secao "Contexto do canal": insights relevantes (auto-selecionados)
- Secao "Referencias": Shorts do canal que podem inspirar
- Preview do roteiro gerado com timeline visual
- Opcoes: Salvar | Melhorar | Gerar Hooks | Exportar

## Regras (mantidas + novas)
1. Nunca acople logica de negocio ao componente
2. Trate loading, error, empty, success em toda chamada API
3. Componentes > 150 linhas → decomponha
4. PascalCase componentes, camelCase hooks, `page.tsx` em rotas
5. Zero `any` — types em `@/types/api.ts`
6. Dark mode funcional (Tailwind dark:)
7. Skeleton loaders em toda listagem
8. Optimistic updates para acoes rapidas (status change, etc.)
9. Formularios com autosave em draft (debounce 2s)
10. Responsivo: mobile-first para as telas principais
11. Toast notifications para feedback de acoes async
12. Polling para tasks Celery (5s interval ate complete/error)

## Integracao com API
- Base URL: `NEXT_PUBLIC_API_URL`
- Auth: Bearer token no header (armazenado em httpOnly cookie ou localStorage)
- Refresh automatico quando 401
- Formato resposta: `{ data: T, meta?: { page, total } }`
- Formato erro: `{ error: { code, message, details? } }`
```

---

### 6.7 Prompt — Agent Debugger/Tester

```markdown
# Debugger/Tester Agent — ScriptDNA v2

## Identidade
Voce e o Tester Agent do ScriptDNA. Valida que frontend, backend, rotas, formularios, integracoes e fluxos funcionam corretamente. Voce identifica bugs, inconsistencias e gaps antes que cheguem a producao.

## Stack de Testes
- Backend: pytest + pytest-asyncio + httpx (ASGI client) + factory-boy
- Frontend: Vitest + Testing Library + Playwright (e2e)
- Mocks: respx (HTTP backend), MSW (frontend)

## Responsabilidades

### Backend
- Testes unitarios para cada Agent (mock OpenAI)
- Testes de integracao para endpoints (banco real em container)
- Testes de fluxo: upload → transcricao → analise → embedding
- Testes de auth: registro, login, refresh, protecao de rotas
- Testes de YouTube: mock das APIs do Google
- Testes de versionamento: criar, editar, comparar versoes
- Validacao de schemas Pydantic (inputs invalidos)
- Testes de Celery tasks (mock broker)

### Frontend
- Testes de componente: render, interacao, estados
- Testes de formulario: validacao, submit, erro
- Testes de fluxo (Playwright):
  - Login → Dashboard → Criar Roteiro → Salvar
  - Conectar YouTube → Sincronizar → Ver Shorts
  - Subir metricas → Analisar → Ver insights
- Testes de responsividade (viewport sizes)
- Testes de acessibilidade (axe-core)

### Integracao
- Verificar que frontend consome endpoints corretamente
- Verificar que tipos TypeScript batem com schemas Pydantic
- Verificar que status codes sao tratados (200, 202, 400, 401, 404, 422, 500)
- Verificar que polling de tasks funciona (timeout, retry, error state)

## Formato de Report
Para cada bug encontrado:
[BUG] Severidade: critical|high|medium|low
Onde: rota/componente/funcao
Reproduzir: passos
Esperado: ...
Atual: ...
Sugestao de fix: ...

## Regras
- Rode testes antes de cada merge
- Nunca mock o banco em testes de integracao (use transacao com rollback)
- Use factories para criar dados de teste
- Testes e2e devem ser independentes (cada um limpa seu estado)
- Coverage minimo: 80% para agents, 70% para rotas, 60% para frontend
```

---

## 7. Prompt Final — Agent de Frontend (Implementacao)

Este e o prompt completo para o Frontend Agent implementar as telas e conectar com as APIs:

```markdown
# PROMPT DE IMPLEMENTACAO — Frontend Agent ScriptDNA v2

## Missao
Implemente as novas telas e funcionalidades do ScriptDNA v2, MANTENDO todas as features existentes (Dashboard, Import, Library, Videos, Styles, Generate) e ADICIONANDO os novos modulos: Autenticacao, Roteiros com Versionamento, YouTube Integration, Analytics, Insights e Sugestoes.

## Contexto Tecnico
- Projeto: FrontEnd/scriptdna/
- Framework: Next.js 14+ App Router, TypeScript estrito
- UI: Tailwind CSS + shadcn/ui
- Estado: Zustand (global) + React Query (server state)
- Forms: React Hook Form + Zod
- Animacoes: Framer Motion
- API Base: NEXT_PUBLIC_API_URL (http://localhost:8000)

## O QUE JA EXISTE (NAO ALTERAR, apenas integrar)
- `/` (Dashboard) — metricas + videos recentes
- `/import` — upload de videos/texto/URL
- `/library` — grid de videos analisados
- `/videos/[id]` — timeline de beats
- `/styles` e `/styles/[id]` — perfis de estilo
- `/generate` — gerador de roteiros basico
- Componentes: Sidebar, Header, Cards, Tables
- API client em `src/lib/api.ts`
- Types em `src/types/api.ts`
- Store Zustand em `src/store/app-store.ts`

## O QUE IMPLEMENTAR (em ordem de prioridade)

### Prioridade 1: Autenticacao
1. Criar `/login` e `/register` com formularios validados (Zod)
2. Criar AuthProvider (Context) com:
   - user state
   - login/logout/register functions
   - token management (localStorage + auto-refresh)
3. Criar middleware de rota protegida (redirect se nao autenticado)
4. Adicionar user info no Header (avatar + dropdown com logout)
5. Atualizar API client para enviar Bearer token

### Prioridade 2: Roteiros
1. Criar `/scripts` — lista com filtros (status, nicho) + busca
2. Criar `/scripts/new` — formulario completo de geracao
   - Campos: tema, duracao (slider), nicho, estilo, objetivo, tipo gancho, agressividade, CTA
   - Botao "Gerar" → POST /api/generate/script → salva como novo script
   - Preview do roteiro gerado com timeline visual
3. Criar `/scripts/[id]` — editor/viewer
   - Exibir versao atual com linhas timestamped
   - Sidebar: lista de versoes (clicavel)
   - Diff visual entre versoes (highlight verde/vermelho)
   - Formulario de edicao → POST /api/scripts/:id/versions
   - Status badge + botao de mudar status
   - Associar YouTube Short (search/dropdown)
   - Botao "Melhorar com IA"
4. Adicionar types: Script, ScriptVersion, ScriptStatus

### Prioridade 3: YouTube Integration
1. Criar `/youtube` — pagina principal
   - Card de status: canal conectado/desconectado
   - Botao "Conectar" → redirect para /api/auth/youtube/connect
   - Info do canal (nome, inscritos, foto)
   - Botao "Sincronizar Shorts" → POST /api/youtube/sync (poll task)
   - Grid de Shorts importados com thumbnails
2. Criar `/youtube/shorts/[id]` — detalhe
   - Thumbnail grande + embed link
   - Cards de metricas
   - Transcricao (expandivel)
   - Roteiro associado (se existir)
   - Analise de performance (se existir)
   - Botao "Analisar Performance" → POST /api/analysis/performance/:id
   - Botao "Subir Metricas" → abre modal/pagina

### Prioridade 4: Metricas Manuais
1. Criar formulario de metricas (modal ou pagina dedicada)
   - Campos: views, likes, comments, shares, retencao%, duracao media, impressoes, CTR, inscritos
   - Validacao com Zod (todos opcionais exceto views)
   - POST /api/metrics/manual

### Prioridade 5: Analytics
1. Criar `/analytics`
   - Cards de resumo: media views, media retencao, melhor Short, pior Short
   - Tabela/grid: Top 10 por views, por retencao, por engagement
   - Botao "Analisar Canal" → POST /api/analysis/channel
   - Resultado da analise quando disponivel

### Prioridade 6: Insights
1. Criar `/insights`
   - Lista de cards com:
     - Titulo + descricao curta
     - Category badge (color-coded)
     - Sentiment indicator (verde/vermelho/cinza)
     - Confidence bar
     - Quantidade de evidencias
   - Filtros: categoria, sentimento, nicho
   - Detalhe expandivel: descricao completa + evidencias (link para Shorts)
   - Toggle ativo/inativo
   - Botao "Gerar Novos Insights"

### Prioridade 7: Sugestoes
1. Criar `/ideas`
   - Tabs por categoria (ou filtro dropdown)
   - Cards com:
     - Titulo da sugestao
     - Justificativa resumida
     - Categoria badge
     - Confidence score
     - Botoes: "Criar Roteiro" | "Rejeitar"
   - "Criar Roteiro" → navega para /scripts/new com dados pre-preenchidos
   - Botao "Gerar Novas Sugestoes" → POST /api/suggestions/generate

### Prioridade 8: Dashboard (atualizar)
- Adicionar cards: roteiros criados, Shorts analisados, insights ativos
- Adicionar secao "Sugestoes Recentes" (top 3)
- Adicionar status de conexao YouTube
- Manter cards e features existentes

## PADROES DE IMPLEMENTACAO

### API Calls (React Query)
```typescript
// hooks/useScripts.ts
export function useScripts(filters?: ScriptFilters) {
  return useQuery({
    queryKey: ['scripts', filters],
    queryFn: () => api.get<PaginatedResponse<Script>>('/api/scripts', { params: filters }),
  });
}

export function useCreateScriptVersion(scriptId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateVersionInput) =>
      api.post<ScriptVersion>(`/api/scripts/${scriptId}/versions`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scripts', scriptId] });
    },
  });
}
```

### Task Polling
```typescript
// hooks/useTaskPolling.ts
export function useTaskPolling(taskId: string | null) {
  return useQuery({
    queryKey: ['tasks', taskId],
    queryFn: () => api.get<TaskStatus>(`/api/tasks/${taskId}`),
    enabled: !!taskId,
    refetchInterval: (query) => {
      const status = query.state.data?.data?.state;
      return status === 'SUCCESS' || status === 'FAILURE' ? false : 5000;
    },
  });
}
```

### Formularios
```typescript
// Sempre com Zod schema + React Hook Form
const scriptSchema = z.object({
  theme: z.string().min(3, 'Tema obrigatorio'),
  duration: z.number().min(15).max(60),
  niche: z.string().min(1),
  style_profile_id: z.string().uuid().optional(),
  objective: z.enum(['views', 'retention', 'subscribers']),
  hook_type: z.enum(['question', 'shock', 'promise', 'number', 'story']),
  aggressiveness: z.number().min(1).max(10),
  cta: z.string().optional(),
});
```

### Navegacao (Sidebar)
Atualizar sidebar com novos itens:
- Dashboard (/)
- Roteiros (/scripts) [NOVO]
- YouTube (/youtube) [NOVO]
- Analytics (/analytics) [NOVO]
- Insights (/insights) [NOVO]
- Sugestoes (/ideas) [NOVO]
- --- separador ---
- Biblioteca (/library) [existente]
- Import (/import) [existente]
- Gerador (/generate) [existente, manter compatibilidade]
- Estilos (/styles) [existente]

## TYPES A ADICIONAR em src/types/api.ts

```typescript
// Auth
interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  youtube_channel_id?: string;
  youtube_channel_name?: string;
}

interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

// Scripts
type ScriptStatus = 'draft' | 'approved' | 'published' | 'analyzed' | 'archived';

interface Script {
  id: string;
  title: string;
  theme?: string;
  objective?: string;
  niche?: string;
  speaking_style?: string;
  estimated_duration_seconds?: number;
  status: ScriptStatus;
  youtube_video_id?: string;
  current_version_id?: string;
  created_at: string;
  updated_at: string;
}

interface ScriptVersion {
  id: string;
  script_id: string;
  version_number: number;
  hook?: string;
  narrative_structure?: NarrativeBlock[];
  cta?: string;
  lines?: ScriptLine[];
  analysis?: ScriptAnalysis;
  generation_params?: Record<string, unknown>;
  change_summary?: string;
  created_by: 'user' | 'ai_generation' | 'ai_improvement';
  created_at: string;
}

interface ScriptLine {
  start: string;
  end: string;
  line: string;
  function: 'hook' | 'setup' | 'development' | 'escalation' | 'payoff' | 'cta';
  retention_note?: string;
  techniques?: string[];
}

interface ScriptAnalysis {
  hook_strength: number;
  curiosity_gaps: string[];
  rhythm_score?: number;
  promise_delivery?: number;
  weak_points: string[];
}

// YouTube
interface YouTubeShort {
  id: string;
  youtube_video_id: string;
  title: string;
  description?: string;
  published_at: string;
  thumbnail_url?: string;
  duration_seconds: number;
  tags?: string[];
  transcript?: string;
  script_id?: string;
  synced_at: string;
}

interface ShortMetrics {
  id: string;
  youtube_short_id: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  subscribers_gained: number;
  average_view_duration_seconds?: number;
  average_view_percentage?: number;
  impressions?: number;
  impressions_ctr?: number;
  engagement_rate?: number;
  retention_score?: number;
  source: 'manual' | 'youtube_api' | 'youtube_analytics';
  collected_at: string;
  published_at?: string;
}

// Insights
type InsightCategory = 'hook' | 'retention' | 'cta' | 'narrative' | 'topic' | 'speaking_style' | 'timing' | 'audience' | 'general';
type InsightSentiment = 'positive' | 'negative' | 'neutral';

interface ChannelInsight {
  id: string;
  category: InsightCategory;
  sentiment: InsightSentiment;
  title: string;
  description: string;
  evidence?: InsightEvidence[];
  niche?: string;
  theme?: string;
  confidence: number;
  times_validated: number;
  is_active: boolean;
  created_at: string;
}

interface InsightEvidence {
  short_id: string;
  metric: string;
  value: number;
  context?: string;
}

// Suggestions
type SuggestionCategory = 'high_view_potential' | 'high_retention_potential' | 'continuation' | 'variation' | 'experiment' | 'brand_reinforcement';
type SuggestionStatus = 'pending' | 'accepted' | 'rejected' | 'converted_to_script';

interface VideoSuggestion {
  id: string;
  title: string;
  description: string;
  justification: string;
  category: SuggestionCategory;
  niche?: string;
  theme?: string;
  estimated_duration_seconds?: number;
  suggested_hook?: string;
  suggested_structure?: string;
  status: SuggestionStatus;
  confidence_score?: number;
  created_at: string;
}

// Performance Analysis
interface PerformanceAnalysis {
  id: string;
  youtube_short_id: string;
  script_id?: string;
  hook_score: number;
  rhythm_score: number;
  curiosity_score: number;
  retention_score: number;
  clarity_score: number;
  promise_delivery_score: number;
  cta_score: number;
  narrative_score: number;
  overall_score: number;
  strengths: AnalysisPoint[];
  weaknesses: AnalysisPoint[];
  actionable_learnings: ActionableLearning[];
  created_at: string;
}

interface AnalysisPoint {
  aspect: string;
  description: string;
  evidence?: string;
  suggestion?: string;
}

interface ActionableLearning {
  learning: string;
  priority: 'high' | 'medium' | 'low';
  applies_to: string;
}
```

## IMPORTANTE
- Mantenha TODAS as paginas e componentes existentes funcionando
- Nao remova nenhuma feature atual
- A sidebar deve incluir tanto itens novos quanto existentes
- O API client existente deve ser estendido (nao substituido)
- Reutilize componentes shadcn/ui ja instalados
- Siga o padrao visual ja estabelecido (cores, espacamentos, tipografia)
- Implemente em ordem de prioridade (auth primeiro, depois scripts, etc.)
```

---

## Resumo da Arquitetura

| Camada | Tecnologia | Responsabilidade |
|--------|-----------|-----------------|
| Frontend | Next.js + React Query | UI, formularios, polling |
| API | FastAPI + JWT | Endpoints REST, auth, validacao |
| Workers | Celery + Redis | Tasks pesadas (IA, YouTube) |
| IA | OpenAI GPT-4o | Geracao, analise, insights |
| Busca | pgvector | Similaridade semantica |
| YouTube | Google APIs | OAuth, metricas, captions |
| Banco | PostgreSQL | Persistencia, versionamento |

O ciclo de feedback e: **Gerar → Publicar → Medir → Analisar → Aprender → Gerar Melhor**.
