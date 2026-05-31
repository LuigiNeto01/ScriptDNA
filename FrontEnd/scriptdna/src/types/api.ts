// === Respostas padronizadas da API ===

export interface ApiResponse<T> {
  data: T;
  meta?: {
    page: number;
    total: number;
  };
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// === Video ===

export type VideoStatus =
  | "pending"
  | "transcribing"
  | "analyzing"
  | "embedding"
  | "done"
  | "error";

export interface Video {
  id: string;
  title: string;
  source_type: "text" | "file" | "url";
  source_url: string | null;
  duration_seconds: number | null;
  creator_name: string | null;
  niche: string | null;
  status: VideoStatus;
  created_at: string;
}

// === Transcript Segment ===

export interface TranscriptSegment {
  id: string;
  video_id: string;
  start_time: number;
  end_time: number;
  text: string;
  word_count: number;
  position_percent: number;
}

// === Script Beat ===

export type BeatType =
  | "hook"
  | "setup"
  | "conflict"
  | "escalation"
  | "payoff"
  | "cta";

export interface ScriptBeat {
  id: string;
  video_id: string;
  segment_id: string;
  beat_type: BeatType;
  attention_goal: string;
  curiosity_question: string;
  retention_function: string;
  emotion: string;
  intensity_score: number;
}

// === Technique ===

export interface Technique {
  id: string;
  name: string;
  description: string;
}

export interface SegmentTechnique {
  segment_id: string;
  technique_id: string;
  confidence: number;
  evidence: string;
  technique?: Technique;
}

// === Style Profile ===

export interface StyleVideoRef {
  id: string;
  title: string;
}

export interface StyleProfile {
  id: string;
  name: string;
  description: string;
  tone: string;
  pacing: string;
  avg_sentence_length: number;
  common_hooks: string[];
  common_ctas: string[];
  narrative_patterns: string[];
  do_rules: string[];
  avoid_rules: string[];
  video_ids: string[];
  videos: StyleVideoRef[];
  created_at: string;
}

export interface UpdateStyleRequest {
  name?: string;
  add_video_ids?: string[];
  remove_video_ids?: string[];
}

// === Script Generation ===

export interface GenerateScriptRequest {
  theme: string;
  idea?: string;
  duration: number;
  niche: string;
  style_profile_id?: string;
  aggressiveness: number;
  hook_type: string;
  cta: string;
}

export interface ScriptLine {
  start: string;
  end: string;
  line: string;
  function: string;
  retention_note: string;
}

export interface ScriptAnalysis {
  hook_strength: number;
  curiosity_gaps: string[];
  weak_points: string[];
}

export interface GeneratedScript {
  lines: ScriptLine[];
  analysis: ScriptAnalysis;
}

export interface ImproveScriptRequest {
  script_text: string;
  style_profile_id?: string;
  focus: string;
}

export interface ImprovedScript {
  improved_lines: ScriptLine[];
  problems_found: string[];
  analysis: ScriptAnalysis;
}

export interface GenerateHooksRequest {
  theme: string;
  count: number;
  style_profile_id?: string;
  hook_type?: string;
}

// === Dashboard Metrics ===

export interface DashboardMetrics {
  total_videos: number;
  total_styles: number;
  top_techniques: { name: string; count: number }[];
  avg_hook_duration: number;
}

// === Search ===

export interface SearchResult {
  segment: TranscriptSegment;
  video: Video;
  score: number;
}

// === Task (Celery) ===

export interface TaskStatus {
  task_id: string;
  status:
    | "pending"
    | "started"
    | "success"
    | "failure"
    | "retry"
    | "done"
    | "error";
  progress?: number;
  current_step?: string;
  result?: unknown;
  error?: string;
}

// === Video Upload ===

export interface UploadVideoRequest {
  file: File;
  creator_name: string;
  niche: string;
}

export interface VideoCreateResponse {
  video_id: string;
  task_id?: string;
  status: VideoStatus;
}

export interface TextVideoRequest {
  text: string;
  title: string;
  creator_name: string;
  niche: string;
}

export interface UrlVideoRequest {
  url: string;
  creator_name: string;
  niche: string;
}

// === Video Detail (com segmentos e beats) ===

export interface VideoDetail extends Video {
  segments?: TranscriptSegment[];
  beats?: ScriptBeat[];
  segment_techniques?: SegmentTechnique[];
}
