# Fase 8B — Inteligencia Avancada: Comentarios, Titulos, Experimentos, Estrategia

## Resumo

A Fase 8B adiciona camadas de inteligencia avancada ao ScriptDNA:

- **Analise de comentarios** — fetch, analise de sentimento/intencao, integracao com learning loop
- **Titulo e thumbnail** — geracao de titulos e briefings visuais via IA
- **Experimentos A/B** — modelo e CRUD para comparar roteiros
- **Agente estrategico semanal** — relatorio semanal com tendencias internas
- **Deteccao de tendencias** — analise temporal de views, engajamento e retencao

## Modelos Criados

| Modelo | Tabela | Descricao |
|---|---|---|
| `YouTubeShortComment` | `youtube_short_comments` | Comentarios do YouTube com campos de analise (sentiment, intent, topics) |
| `ScriptExperiment` | `script_experiments` | Experimentos A/B com variantes, hipotese, vencedor |

## Agentes IA Criados

| Agente | Arquivo | Descricao |
|---|---|---|
| `CommentAnalysisAgent` | `agents/comment_analysis_agent.py` | Analisa sentimento, intencao, topicos e insights acionaveis de comentarios |
| `WeeklyStrategyAgent` | `agents/weekly_strategy_agent.py` | Gera relatorio estrategico semanal com plano de acao |

## Servicos Criados

| Servico | Arquivo | Descricao |
|---|---|---|
| `TrendDetectionService` | `services/trend_detection_service.py` | Detecta tendencias internas (views, engajamento, retencao) comparando semanas |

## Endpoints Criados

### Comentarios

| Endpoint | Metodo | Descricao |
|---|---|---|
| `/api/comments/short/:id` | GET | Lista comentarios com filtros (sentiment, intent, limit) |
| `/api/comments/short/:id/fetch` | POST | Busca comentarios do YouTube via API (async) |
| `/api/comments/short/:id/analyze` | POST | Analisa comentarios com IA (async) |
| `/api/comments/short/:id/summary` | GET | Resumo agregado (sentimento, intencao) |

### Geracao

| Endpoint | Metodo | Descricao |
|---|---|---|
| `/api/generate/titles` | POST | Gera titulos com estrategia e CTR previsto |
| `/api/generate/thumbnail-ideas` | POST | Gera briefings de thumbnail (texto, sem imagem) |

### Experimentos A/B

| Endpoint | Metodo | Descricao |
|---|---|---|
| `/api/experiments` | GET | Lista experimentos do usuario |
| `/api/experiments` | POST | Cria novo experimento |
| `/api/experiments/:id` | GET | Detalhe de um experimento |
| `/api/experiments/:id` | PATCH | Atualiza experimento |
| `/api/experiments/:id/complete` | POST | Finaliza com vencedor |

### Estrategia

| Endpoint | Metodo | Descricao |
|---|---|---|
| `/api/strategy/weekly` | POST | Gera relatorio semanal (async) |
| `/api/strategy/trends` | GET | Tendencias internas do canal |

## Tasks Celery Criadas

| Task | Descricao |
|---|---|
| `fetch_short_comments` | Busca comentarios do YouTube Data API (max 500) |
| `analyze_short_comments` | Analisa comentarios com CommentAnalysisAgent + learning loop |
| `generate_weekly_strategy` | Gera relatorio estrategico semanal com WeeklyStrategyAgent |

## Integracao com Learning Loop

Quando >= 5 comentarios sao analisados, o `LearningLoopService.maybe_learn_from_comments()`:
- Cria insights de `content_strengths` (categoria: audience, sentimento: positive)
- Cria insights de `content_weaknesses` (categoria: audience, sentimento: negative)
- Cria insights de `audience_requests` (categoria: topic, sentimento: positive)
- Aplica `comment_confidence_modifier = 0.6` para impacto moderado vs analise de performance

## Schemas Pydantic Adicionados

```python
TitlesInput         # theme, script_lines?, niche?, count, platform
TitleSuggestion     # title, strategy, predicted_ctr
TitlesOutput        # titles: list[TitleSuggestion]
ThumbnailInput      # theme, title?, script_lines?, niche?, count
ThumbnailIdea       # concept, text_overlay, emotion, color_palette, composition
ThumbnailOutput     # ideas: list[ThumbnailIdea]
```

## Tipos TypeScript Adicionados

```typescript
YouTubeShortComment     // Comentario com analise
CommentSummary          // Resumo agregado
TitleSuggestion         // Titulo com estrategia
ThumbnailIdea           // Briefing visual
ScriptExperiment        // Experimento A/B
ExperimentStatus        // "draft" | "running" | "completed" | "cancelled"
WeeklyStrategyReport    // Relatorio semanal completo
InternalTrend           // Tendencia interna detectada
```

## Hooks React Criados

| Hook | Arquivo | Descricao |
|---|---|---|
| `useComments(shortId)` | `hooks/use-comments.ts` | Lista comentarios com filtros |
| `useCommentSummary(shortId)` | `hooks/use-comments.ts` | Resumo de comentarios |
| `useFetchComments(shortId)` | `hooks/use-comments.ts` | Dispara fetch de comentarios |
| `useAnalyzeComments(shortId)` | `hooks/use-comments.ts` | Dispara analise de comentarios |
| `useExperiments()` | `hooks/use-experiments.ts` | Lista experimentos |
| `useExperiment(id)` | `hooks/use-experiments.ts` | Detalhe de experimento |
| `useCreateExperiment()` | `hooks/use-experiments.ts` | Cria experimento |
| `useUpdateExperiment(id)` | `hooks/use-experiments.ts` | Atualiza experimento |
| `useCompleteExperiment(id)` | `hooks/use-experiments.ts` | Finaliza experimento |
| `useInternalTrends()` | `hooks/use-strategy.ts` | Tendencias internas |
| `useGenerateWeeklyStrategy()` | `hooks/use-strategy.ts` | Gera relatorio semanal |
| `useGenerateTitles()` | `hooks/use-strategy.ts` | Gera titulos |
| `useGenerateThumbnailIdeas()` | `hooks/use-strategy.ts` | Gera ideias de thumbnail |

## Componentes Frontend Criados

| Componente | Arquivo | Descricao |
|---|---|---|
| `CommentSummaryCard` | `components/comments/comment-summary-card.tsx` | Card com resumo de sentimento e intencao |
| `CommentList` | `components/comments/comment-list.tsx` | Lista de comentarios com badges e insights |
| `ExperimentList` | `components/experiments/experiment-list.tsx` | Lista de experimentos A/B com status |
| `TrendCards` | `components/strategy/trend-cards.tsx` | Cards de tendencias internas com setas |

## Paginas Frontend Criadas

| Pagina | Rota | Descricao |
|---|---|---|
| Experimentos | `/experiments` | Criacao e listagem de experimentos A/B |
| Estrategia | `/strategy` | Tendencias internas + gerar relatorio semanal |

## Arquivos Criados

### Backend
- `app/models/youtube_short_comment.py`
- `app/models/script_experiment.py`
- `app/agents/comment_analysis_agent.py`
- `app/agents/weekly_strategy_agent.py`
- `app/services/trend_detection_service.py`
- `app/api/routers/comments.py`
- `app/api/routers/experiments.py`
- `app/api/routers/strategy.py`
- `alembic/versions/f6a7b8c9d0e1_phase8b_comments.py`
- `tests/test_phase8b_intelligence.py`

### Frontend
- `src/hooks/use-comments.ts`
- `src/hooks/use-experiments.ts`
- `src/hooks/use-strategy.ts`
- `src/components/comments/comment-summary-card.tsx`
- `src/components/comments/comment-list.tsx`
- `src/components/experiments/experiment-list.tsx`
- `src/components/strategy/trend-cards.tsx`
- `src/app/experiments/page.tsx`
- `src/app/strategy/page.tsx`
- `tests/components/Phase8B.test.tsx`

## Arquivos Alterados

| Arquivo | Mudanca |
|---|---|
| `app/models/__init__.py` | Registra YouTubeShortComment, ScriptExperiment |
| `app/main.py` | Registra routers comments, experiments, strategy |
| `app/schemas/generate.py` | Schemas TitlesInput/Output, ThumbnailInput/Output |
| `app/api/routers/generate.py` | Endpoints /titles e /thumbnail-ideas |
| `app/tasks/youtube_tasks.py` | Task fetch_short_comments |
| `app/tasks/analysis_tasks.py` | Tasks analyze_short_comments, generate_weekly_strategy |
| `app/services/learning_loop_service.py` | maybe_learn_from_comments() |
| `src/types/api.ts` | Tipos Phase 8B |
| `src/components/layout/sidebar.tsx` | Links Experimentos e Estrategia |
| `tests/mocks/handlers.ts` | Mock data e handlers Phase 8B |

## Resultados

- Build: OK (0 errors, 22 routes)
- Lint: OK (0 warnings)
- Testes Frontend: 55 passed (6 files), incluindo 19 novos testes Phase 8B
- Testes Backend: Compilam OK (16 arquivos)

## Rate Limits Aplicados

| Recurso | per_minute | per_day |
|---|---|---|
| `fetch_comments` | 2 | 20 |
| `analyze_comments` | 3 | 30 |
| `generate_titles` | 10 | 100 |
| `generate_thumbnails` | 10 | 100 |
| `weekly_strategy` | 1 | 5 |

## Decisoes de Design

1. **Min 5 comentarios para learning**: evita conclusoes de amostra pequena
2. **Comment confidence modifier 0.6**: impacto moderado vs analise de performance (que usa metricas reais)
3. **Sem geracao de imagem**: thumbnails sao briefings textuais, criador executa
4. **Sem publicacao automatica**: nenhum endpoint publica no YouTube
5. **Max 500 comentarios por fetch**: evita timeouts e custos excessivos
6. **Experiments independentes de scripts**: pode vincular depois via PATCH
7. **Trends baseados em 4 semanas**: threshold de 10% para views/engajamento, 5% para retencao

## Limitacoes Restantes

1. **Sem paginacao de comentarios** — lista limitada a 200 por request
2. **Sem analise de respostas (replies)** — apenas top-level comments
3. **Sem graficos de tendencia** — dados disponíveis via API, sem visualizacao temporal
4. **Sem notificacao de experimento concluido** — usuario precisa verificar manualmente
5. **Sem auto-compare de experimentos** — compare manual ou via /complete com shorts vinculados
6. **Weekly strategy nao persiste** — retorna resultado via task, nao salva em tabela dedicada
