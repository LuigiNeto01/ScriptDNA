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

// === Auth ===

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  youtube_channel_id: string | null;
  youtube_channel_name: string | null;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

// === Scripts (Roteiros com Versionamento) ===

export type ScriptStatus = "draft" | "approved" | "published" | "analyzed" | "archived";

export interface Script {
  id: string;
  user_id: string;
  current_version_id: string | null;
  title: string;
  theme: string | null;
  objective: string | null;
  niche: string | null;
  speaking_style: string | null;
  estimated_duration_seconds: number | null;
  status: ScriptStatus;
  youtube_video_id: string | null;
  created_at: string;
  updated_at: string;
  current_version?: ScriptVersion;
}

export interface ScriptVersion {
  id: string;
  script_id: string;
  version_number: number;
  hook: string | null;
  narrative_structure: Record<string, unknown>[] | null;
  cta: string | null;
  lines: ScriptLine[] | null;
  analysis: ScriptAnalysis | null;
  generation_params: Record<string, unknown> | null;
  change_summary: string | null;
  created_by: "user" | "ai_generation" | "ai_improvement";
  created_at: string;
}

// === YouTube ===

export interface YouTubeChannel {
  connected: boolean;
  channel_id?: string;
  channel_name?: string;
}

export interface YouTubeShort {
  id: string;
  youtube_video_id: string;
  title: string | null;
  description: string | null;
  published_at: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  tags: string[] | null;
  transcript: string | null;
  transcript_source: string | null;
  script_id: string | null;
  synced_at: string | null;
}

export interface ShortMetrics {
  id: string;
  youtube_short_id: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  subscribers_gained: number;
  average_view_duration_seconds: number | null;
  average_view_percentage: number | null;
  impressions: number | null;
  impressions_ctr: number | null;
  engagement_rate: number | null;
  retention_score: number | null;
  source: "manual" | "youtube_api" | "youtube_analytics";
  collected_at: string | null;
  published_at: string | null;
}

export interface MetricsHistoryEntry {
  views: number | null;
  likes: number | null;
  comments: number | null;
  collected_at: string | null;
}

// === Insights ===

export type InsightCategory =
  | "hook" | "retention" | "cta" | "narrative" | "topic"
  | "speaking_style" | "timing" | "audience" | "general";

export type InsightSentiment = "positive" | "negative" | "neutral";

export interface ChannelInsight {
  id: string;
  category: InsightCategory;
  sentiment: InsightSentiment;
  title: string;
  description: string;
  evidence: InsightEvidence[] | null;
  niche: string | null;
  theme: string | null;
  speaking_style: string | null;
  video_type: string | null;
  confidence: number;
  times_validated: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InsightEvidence {
  short_id: string;
  metric: string;
  value: number;
  context?: string;
}

// === Suggestions ===

export type SuggestionCategory =
  | "high_view_potential" | "high_retention_potential" | "continuation"
  | "variation" | "experiment" | "brand_reinforcement";

export type SuggestionStatus = "pending" | "accepted" | "rejected" | "converted_to_script";

export interface VideoSuggestion {
  id: string;
  title: string;
  description: string;
  justification: string;
  category: SuggestionCategory;
  niche: string | null;
  theme: string | null;
  estimated_duration_seconds: number | null;
  suggested_hook: string | null;
  suggested_structure: string | null;
  based_on_shorts: unknown[] | null;
  based_on_insights: unknown[] | null;
  status: SuggestionStatus;
  converted_script_id: string | null;
  confidence_score: number | null;
  created_at: string;
}

// === Performance Analysis ===

export interface PerformanceAnalysis {
  id: string;
  youtube_short_id: string;
  script_id: string | null;
  scores: {
    hook: number | null;
    rhythm: number | null;
    curiosity: number | null;
    retention: number | null;
    clarity: number | null;
    promise_delivery: number | null;
    cta: number | null;
    narrative: number | null;
    overall: number | null;
  };
  strengths: AnalysisPoint[] | null;
  weaknesses: AnalysisPoint[] | null;
  actionable_learnings: ActionableLearning[] | null;
  script_correlation: unknown[] | null;
  created_at: string;
}

export interface AnalysisPoint {
  aspect: string;
  description: string;
  evidence?: string;
  suggestion?: string;
}

export interface ActionableLearning {
  learning: string;
  priority: "high" | "medium" | "low";
  applies_to: string;
}

// === Paginated Response ===

export interface PaginatedData<T> {
  items: T[];
  total: number;
}
