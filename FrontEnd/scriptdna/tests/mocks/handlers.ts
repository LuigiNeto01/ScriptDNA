import { http, HttpResponse } from "msw";

const API_URL = "http://localhost:8000";

// ============================================================
// Mock Data
// ============================================================

export const mockVideo = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  title: "Minecraft Update Video",
  source_type: "text",
  source_url: null,
  duration_seconds: 120,
  creator_name: "TestCreator",
  niche: "gaming",
  status: "done" as const,
  created_at: "2024-01-01T00:00:00Z",
};

export const mockBeat = {
  id: "660e8400-e29b-41d4-a716-446655440000",
  video_id: mockVideo.id,
  segment_id: "770e8400-e29b-41d4-a716-446655440000",
  beat_type: "hook" as const,
  attention_goal: "Capturar atenção",
  curiosity_question: "O que mudou?",
  retention_function: "manter curiosidade",
  emotion: "curiosidade",
  intensity_score: 0.85,
};

export const mockSegment = {
  id: "880e8400-e29b-41d4-a716-446655440000",
  video_id: mockVideo.id,
  start_time: 0.0,
  end_time: 5.0,
  text: "Isso vai mudar o Minecraft para sempre",
  word_count: 7,
  position_percent: 0.0,
  techniques: [],
};

export const mockStyle = {
  id: "990e8400-e29b-41d4-a716-446655440000",
  name: "Gaming Style",
  description: "Estilo energético para vídeos de gaming",
  tone: "casual-energético",
  pacing: "rápido",
  avg_sentence_length: 10.5,
  common_hooks: ["Você sabia que..."],
  common_ctas: ["Se inscreva!"],
  narrative_patterns: ["hook-conflict-payoff"],
  do_rules: ["usar perguntas retóricas"],
  avoid_rules: ["frases longas"],
  created_at: "2024-01-01T00:00:00Z",
};

export const mockGeneratedScript = {
  lines: [
    {
      start: 0.0,
      end: 3.0,
      line: "Você não vai acreditar no que aconteceu",
      function: "hook",
      retention_note: "curiosity gap forte",
      viewer_question: "O que aconteceu exatamente?",
    },
  ],
  analysis: {
    hook_strength: 0.85,
    curiosity_gaps: ["gancho criou pergunta imediata no espectador"],
    weak_points: ["payoff poderia ser mais forte"],
  },
  quality_evaluation: {
    quality_score: 0.78,
    scores: { hook: 0.85, retention: 0.75, clarity: 0.80, cta: 0.70, style: null },
    risks: { copy_reference: 0.2, long_sentences: 0.1, early_payoff: 0.6 },
    fix_suggestions: ["Adicione mais conflito no meio do roteiro"],
  },
};

export const mockMetrics = {
  total_videos: 10,
  total_styles: 3,
  top_techniques: [{ name: "curiosity_gap", count: 15 }],
  avg_hook_duration: 3.2,
};

export const mockScriptVersion = {
  id: "version-001",
  script_id: "script-001",
  version_number: 1,
  hook: "Você não vai acreditar",
  narrative_structure: null,
  cta: "Se inscreva!",
  lines: [
    {
      start: "0",
      end: "3",
      line: "Você não vai acreditar no que aconteceu",
      function: "hook",
      retention_note: "curiosity gap forte",
      viewer_question: "O que aconteceu exatamente?",
    },
  ],
  analysis: {
    hook_strength: 0.85,
    curiosity_gaps: ["gancho criou pergunta imediata no espectador"],
    weak_points: ["payoff poderia ser mais forte"],
    patterns_applied: ["curiosity gap"],
    patterns_avoided: ["payoff antecipado"],
    predicted_retention_risks: ["entrega de promessa cedo demais"],
    improvement_suggestions: ["adicionar conflito no meio"],
  },
  generation_params: {
    context_snapshot: {
      quality_score: 0.78,
      variant_id: 1,
      insight_ids: ["insight-001"],
      reference_ids: [],
      patterns_applied: ["curiosity gap"],
      patterns_avoided: ["payoff antecipado"],
    },
  },
  change_summary: "Versão inicial gerada pela IA",
  created_by: "ai_generation" as const,
  created_at: "2024-01-01T00:00:00Z",
};

export const mockScript = {
  id: "script-001",
  user_id: "user-001",
  current_version_id: "version-001",
  title: "Minecraft Hooks Test",
  theme: "Atualização do Minecraft",
  objective: "views",
  niche: "gaming",
  speaking_style: null,
  estimated_duration_seconds: 60,
  status: "draft" as const,
  youtube_video_id: null,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  current_version: mockScriptVersion,
};

export const mockChannel = {
  connected: true,
  channel_id: "UCtest123",
  channel_name: "TestChannel",
  thumbnail_url: null,
  subscriber_count: 1500,
  video_count: 24,
};

export const mockShort = {
  id: "short-001",
  youtube_id: "yt-short-001",
  youtube_video_id: "yt-short-001",
  title: "Short de Teste",
  description: "Descricao do Short",
  thumbnail_url: null,
  duration_seconds: 58,
  published_at: "2024-01-01T00:00:00Z",
  tags: [],
  transcript: "Transcricao de teste",
  transcript_source: "manual",
  script_id: null,
  synced_at: "2024-01-01T00:00:00Z",
  view_count: 5200,
  like_count: 340,
  comment_count: 28,
};

export const mockShortMetrics = {
  id: "metrics-001",
  youtube_short_id: "short-001",
  views: 5200,
  likes: 340,
  comments: 28,
  shares: 12,
  subscribers_gained: 7,
  average_view_duration_seconds: 41,
  average_view_percentage: 72,
  impressions: 9000,
  impressions_ctr: 0.08,
  engagement_rate: 7.2,
  retention_score: 0.72,
  source: "manual" as const,
  collected_at: "2024-01-02T00:00:00Z",
  published_at: "2024-01-01T00:00:00Z",
};

export const mockPerformanceAnalysis = {
  id: "analysis-001",
  youtube_short_id: "short-001",
  script_id: null,
  scores: {
    hook: 0.8,
    rhythm: 0.7,
    curiosity: 0.6,
    retention: 0.75,
    clarity: 0.8,
    promise_delivery: 0.7,
    cta: 0.5,
    narrative: 0.8,
    overall: 0.76,
  },
  strengths: [{ aspect: "hook", description: "A abertura prende atencao rapidamente" }],
  weaknesses: [{ aspect: "cta", description: "CTA discreto", suggestion: "Reforce o proximo passo" }],
  actionable_learnings: [{ learning: "Repita ganchos com promessa clara", priority: "high" as const }],
  script_correlation: [],
  script_adherence: null,
  timeline_analysis: null,
  beat_scores: { hook: 0.8, setup: 0.6, conflict: 0.7, escalation: 0.5, payoff: 0.9, cta: 0.4 },
  created_at: "2024-01-02T00:00:00Z",
};

export const mockInsight = {
  id: "insight-001",
  title: "Perguntas no gancho aumentam retenção",
  description: "Vídeos que começam com pergunta retêm 23% mais que os que começam com afirmação.",
  category: "hook" as const,
  sentiment: "positive" as const,
  confidence: 0.85,
  times_validated: 4,
  niche: "gaming",
  theme: null,
  speaking_style: null,
  video_type: null,
  evidence: [
    { short_id: "short-001", metric: "retention", value: 0.78, context: "gancho com pergunta" },
  ],
  is_active: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

export const mockInsightNegative = {
  id: "insight-002",
  title: "Vídeos longos demais perdem audiência",
  description: "Shorts acima de 75s tiveram retenção 35% menor que os abaixo de 60s.",
  category: "retention" as const,
  sentiment: "negative" as const,
  confidence: 0.75,
  times_validated: 3,
  niche: "gaming",
  theme: null,
  speaking_style: null,
  video_type: null,
  evidence: [],
  is_active: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

export const mockSuggestion = {
  id: "suggestion-001",
  title: "Teste A/B de ganchos com pergunta",
  description: "Com base nos seus aprendizados, tente um Short que começa com uma pergunta direta.",
  category: "high_view_potential" as const,
  niche: "gaming",
  theme: "ganchos",
  estimated_duration_seconds: 60,
  suggested_hook: "Você sabia que 90% dos criadores erram esse passo?",
  suggested_structure: "hook → conflito → payoff → CTA",
  based_on_shorts: [],
  based_on_insights: [],
  status: "pending" as const,
  converted_script_id: null,
  confidence_score: 0.82,
  justification: "Este formato teve alto CTR nos últimos 3 Shorts analisados.",
  created_at: "2024-01-01T00:00:00Z",
};

// ============================================================
// Phase 8A Mock Data
// ============================================================

export const mockAiCostSummary = {
  period_days: 30,
  total_runs: 42,
  total_cost_usd: 1.85,
  total_tokens: 125000,
  total_prompt_tokens: 80000,
  total_completion_tokens: 45000,
  avg_duration_ms: 3200,
  unknown_cost_runs: 3,
  error_runs: 2,
  error_rate: 0.0476,
  by_agent: [
    { agent: "ScriptGeneratorAgent", runs: 25, cost_usd: 1.2, tokens: 80000 },
    { agent: "PerformanceAnalysisAgent", runs: 10, cost_usd: 0.5, tokens: 30000 },
    { agent: "LearningMemoryAgent", runs: 7, cost_usd: 0.15, tokens: 15000 },
  ],
};

export const mockAiRuns = [
  {
    id: "run-001",
    agent_name: "ScriptGeneratorAgent",
    model: "gpt-4o",
    status: "success" as const,
    input_summary: "theme=minecraft variants=2",
    output_summary: "Generated 2 variants",
    total_tokens: 3200,
    prompt_tokens: 2000,
    completion_tokens: 1200,
    estimated_cost_usd: 0.017,
    duration_ms: 4500,
    error_message: null,
    created_at: "2026-06-01T14:30:00Z",
  },
  {
    id: "run-002",
    agent_name: "PerformanceAnalysisAgent",
    model: "gpt-4o",
    status: "error" as const,
    input_summary: "short_id=abc-123",
    output_summary: null,
    total_tokens: null,
    prompt_tokens: null,
    completion_tokens: null,
    estimated_cost_usd: null,
    duration_ms: 30000,
    error_message: "Timeout ao analisar performance",
    created_at: "2026-06-01T13:00:00Z",
  },
];

export const mockHealthDetailed = {
  status: "ok" as const,
  checks: {
    database: { status: "ok" as const },
    redis: { status: "ok" as const },
    celery_broker: { status: "ok" as const },
    openai_config: { status: "ok" as const },
    youtube_config: { status: "missing" as const },
  },
};

// ============================================================
// Phase 8B Mock Data
// ============================================================

export const mockComments = [
  {
    id: "c1",
    youtube_comment_id: "yt-c1",
    author_name: "TestUser",
    text: "Muito bom!",
    like_count: 5,
    published_at: "2026-06-01T14:00:00Z",
    sentiment: "positive" as const,
    sentiment_score: 0.9,
    intent: "praise" as const,
    topics: ["humor"],
    actionable_insight: null,
    analyzed_at: "2026-06-01T15:00:00Z",
  },
];

export const mockCommentSummaryData = {
  total_comments: 15,
  analyzed_comments: 12,
  avg_sentiment_score: 0.65,
  sentiment_distribution: { positive: 8, negative: 2 },
  intent_distribution: { praise: 6, question: 3 },
};

export const mockExperiments = [
  {
    id: "exp-1",
    name: "Hook test",
    hypothesis: "Questions work better",
    status: "draft" as const,
    variant_a_script_id: null,
    variant_b_script_id: null,
    variant_a_short_id: null,
    variant_b_short_id: null,
    winner: null,
    result_summary: null,
    metrics_comparison: null,
    started_at: null,
    completed_at: null,
    created_at: "2026-06-01T10:00:00Z",
  },
];

export const mockTrends = [
  {
    metric: "views",
    direction: "up" as const,
    change_percent: 25.3,
    recent_value: 5000,
    baseline_avg: 3990,
  },
];

// ============================================================
// Handlers
// ============================================================

export const handlers = [
  // Scripts
  http.get(`${API_URL}/api/scripts`, () => {
    return HttpResponse.json({ data: [mockScript] });
  }),

  http.get(`${API_URL}/api/scripts/:id`, ({ params }) => {
    if (params.id === mockScript.id) {
      return HttpResponse.json({ data: mockScript });
    }
    return HttpResponse.json(
      { error: { code: "NOT_FOUND", message: "Roteiro não encontrado" } },
      { status: 404 }
    );
  }),

  http.get(`${API_URL}/api/scripts/:id/versions`, ({ params }) => {
    if (params.id === mockScript.id) {
      return HttpResponse.json({ data: [mockScriptVersion] });
    }
    return HttpResponse.json({ data: [] });
  }),

  http.patch(`${API_URL}/api/scripts/:id/status`, ({ params }) => {
    if (params.id === mockScript.id) {
      return HttpResponse.json({ data: { ...mockScript, status: "approved" } });
    }
    return HttpResponse.json({ data: mockScript });
  }),

  http.post(`${API_URL}/api/scripts/:id/versions`, ({ params }) => {
    if (params.id === mockScript.id) {
      return HttpResponse.json({
        data: { ...mockScriptVersion, version_number: 2, id: "version-002" },
      });
    }
    return HttpResponse.json({ data: mockScriptVersion });
  }),

  http.post(`${API_URL}/api/scripts/:id/link-video`, ({ params }) => {
    if (params.id === mockScript.id) {
      return HttpResponse.json({ data: { ...mockScript, youtube_video_id: "yt-linked-001" } });
    }
    return HttpResponse.json({ data: mockScript });
  }),

  // YouTube
  http.get(`${API_URL}/api/youtube/channel`, () => {
    return HttpResponse.json({ data: mockChannel });
  }),

  http.get(`${API_URL}/api/youtube/shorts`, () => {
    return HttpResponse.json({
      data: { items: [mockShort], total: 1, page: 0, limit: 12 },
    });
  }),

  http.get(`${API_URL}/api/youtube/shorts/:id`, () => {
    return HttpResponse.json({ data: mockShort });
  }),

  http.get(`${API_URL}/api/youtube/shorts/:id/metrics`, () => {
    return HttpResponse.json({ data: mockShortMetrics });
  }),

  http.get(`${API_URL}/api/youtube/shorts/:id/metrics/history`, () => {
    return HttpResponse.json({ data: [{ views: 5200, likes: 340, comments: 28, collected_at: "2024-01-02T00:00:00Z" }] });
  }),

  http.get(`${API_URL}/api/auth/youtube/connect`, () => {
    return HttpResponse.json({
      data: { authorization_url: "https://accounts.google.com/o/oauth2/auth?test=1" },
    });
  }),

  // Insights
  http.get(`${API_URL}/api/insights`, () => {
    return HttpResponse.json({ data: { items: [mockInsight, mockInsightNegative], total: 2 } });
  }),

  http.patch(`${API_URL}/api/insights/:id`, ({ params }) => {
    const insight = params.id === mockInsight.id ? mockInsight : mockInsightNegative;
    return HttpResponse.json({ data: { ...insight, is_active: !insight.is_active } });
  }),

  http.post(`${API_URL}/api/insights/generate`, () => {
    return HttpResponse.json({ data: { task_id: "task-insights-1" } }, { status: 202 });
  }),

  // Suggestions
  http.get(`${API_URL}/api/suggestions`, () => {
    return HttpResponse.json({ data: { items: [mockSuggestion], total: 1 } });
  }),

  http.post(`${API_URL}/api/suggestions/:id/convert`, () => {
    return HttpResponse.json({
      data: { script_id: mockScript.id, version_id: mockScriptVersion.id },
    });
  }),

  // Videos
  http.get(`${API_URL}/api/videos`, () => {
    return HttpResponse.json({ data: [mockVideo] });
  }),

  http.get(`${API_URL}/api/videos/:id`, ({ params }) => {
    if (params.id === mockVideo.id) {
      return HttpResponse.json({ data: mockVideo });
    }
    return HttpResponse.json(
      { error: { code: "NOT_FOUND", message: "Vídeo não encontrado" } },
      { status: 404 }
    );
  }),

  http.get(`${API_URL}/api/videos/:id/beats`, () => {
    return HttpResponse.json({ data: [mockBeat] });
  }),

  http.get(`${API_URL}/api/videos/:id/segments`, () => {
    return HttpResponse.json({ data: [mockSegment] });
  }),

  http.post(`${API_URL}/api/videos/text`, () => {
    return HttpResponse.json(
      { data: { video_id: "new-video-id", status: "pending" } },
      { status: 202 }
    );
  }),

  http.post(`${API_URL}/api/videos/upload`, () => {
    return HttpResponse.json(
      { data: { video_id: "new-upload-id", status: "pending" } },
      { status: 202 }
    );
  }),

  // Styles
  http.get(`${API_URL}/api/styles`, () => {
    return HttpResponse.json({ data: [mockStyle] });
  }),

  http.get(`${API_URL}/api/styles/:id`, ({ params }) => {
    if (params.id === mockStyle.id) {
      return HttpResponse.json({ data: mockStyle });
    }
    return HttpResponse.json(
      { error: { code: "NOT_FOUND", message: "Perfil não encontrado" } },
      { status: 404 }
    );
  }),

  http.post(`${API_URL}/api/styles/generate`, () => {
    return HttpResponse.json(
      { data: { task_id: "task-123" } },
      { status: 202 }
    );
  }),

  // Generate
  http.post(`${API_URL}/api/generate/script`, () => {
    return HttpResponse.json({ data: mockGeneratedScript });
  }),

  http.post(`${API_URL}/api/generate/improve`, () => {
    return HttpResponse.json({
      data: {
        improved_lines: mockGeneratedScript.lines,
        problems_found: ["hook original era genérico"],
        analysis: mockGeneratedScript.analysis,
      },
    });
  }),

  http.post(`${API_URL}/api/generate/hooks`, () => {
    return HttpResponse.json({
      data: {
        hooks: [
          "Você sabia que 90% das pessoas erram isso?",
          "Isso mudou minha vida",
        ],
      },
    });
  }),

  // Search
  http.get(`${API_URL}/api/search`, () => {
    return HttpResponse.json({ data: [] });
  }),

  // Tasks
  http.get(`${API_URL}/api/tasks/:id`, () => {
    return HttpResponse.json({
      data: { task_id: "task-123", status: "SUCCESS", result: {}, error: null },
    });
  }),

  // Dashboard metrics
  http.get(`${API_URL}/api/dashboard/metrics`, () => {
    return HttpResponse.json({ data: mockMetrics });
  }),

  // AI Costs (Phase 8A)
  http.get(`${API_URL}/api/dashboard/ai-costs`, () => {
    return HttpResponse.json({ data: mockAiCostSummary });
  }),

  // AI Runs (Phase 8A)
  http.get(`${API_URL}/api/dashboard/ai-runs`, () => {
    return HttpResponse.json({ data: mockAiRuns });
  }),

  // Health check (Phase 8A)
  http.get(`${API_URL}/health/detailed`, () => {
    return HttpResponse.json({ data: mockHealthDetailed });
  }),

  // Comments (Phase 8B)
  http.get(`${API_URL}/api/comments/short/:shortId`, () => {
    return HttpResponse.json({ data: mockComments });
  }),

  http.get(`${API_URL}/api/comments/short/:shortId/summary`, () => {
    return HttpResponse.json({ data: mockCommentSummaryData });
  }),

  http.post(`${API_URL}/api/comments/short/:shortId/fetch`, () => {
    return HttpResponse.json({ data: { task_id: "task-comments-1" } }, { status: 202 });
  }),

  http.post(`${API_URL}/api/comments/short/:shortId/analyze`, () => {
    return HttpResponse.json({ data: { task_id: "task-analyze-1" } }, { status: 202 });
  }),

  // Experiments (Phase 8B)
  http.get(`${API_URL}/api/experiments`, () => {
    return HttpResponse.json({ data: mockExperiments });
  }),

  http.post(`${API_URL}/api/experiments`, () => {
    return HttpResponse.json({ data: mockExperiments[0] }, { status: 201 });
  }),

  // Strategy (Phase 8B)
  http.get(`${API_URL}/api/strategy/trends`, () => {
    return HttpResponse.json({ data: mockTrends });
  }),

  http.post(`${API_URL}/api/strategy/weekly`, () => {
    return HttpResponse.json({ data: { task_id: "task-weekly-1" } }, { status: 202 });
  }),

  // Titles (Phase 8B)
  http.post(`${API_URL}/api/generate/titles`, () => {
    return HttpResponse.json({
      data: {
        titles: [
          { title: "You won't believe this!", strategy: "curiosity_gap", predicted_ctr: "alto" },
        ],
      },
    });
  }),

  // Thumbnails (Phase 8B)
  http.post(`${API_URL}/api/generate/thumbnail-ideas`, () => {
    return HttpResponse.json({
      data: {
        ideas: [
          {
            concept: "Close-up surprised face",
            text_overlay: "NO WAY!",
            emotion: "surprise",
            color_palette: ["red", "yellow"],
            composition: "Center subject",
          },
        ],
      },
    });
  }),

  // Analysis (Phase 6)
  http.post(`${API_URL}/api/analysis/channel`, () => {
    return HttpResponse.json({ data: { task_id: "task-channel-1" } }, { status: 202 });
  }),

  http.post(`${API_URL}/api/analysis/patterns`, () => {
    return HttpResponse.json({ data: { task_id: "task-patterns-1" } }, { status: 202 });
  }),

  http.get(`${API_URL}/api/analysis/performance/:shortId`, () => {
    return HttpResponse.json({ data: mockPerformanceAnalysis });
  }),

  http.post(`${API_URL}/api/analysis/performance/:shortId`, () => {
    return HttpResponse.json({ data: { task_id: "task-performance-1" } }, { status: 202 });
  }),
];
