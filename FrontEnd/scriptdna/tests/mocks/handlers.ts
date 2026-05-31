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
    },
  ],
  analysis: {
    hook_strength: 0.85,
    curiosity_gaps: 3,
    weak_points: ["payoff poderia ser mais forte"],
  },
};

export const mockMetrics = {
  total_videos: 10,
  total_styles: 3,
  top_techniques: [{ name: "curiosity_gap", count: 15 }],
  avg_hook_duration: 3.2,
};

// ============================================================
// Handlers
// ============================================================

export const handlers = [
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
];
