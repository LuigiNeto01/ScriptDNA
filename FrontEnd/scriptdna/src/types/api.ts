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
  visibility?: "private" | "public";
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
  user_id?: string | null;
  visibility?: "private" | "public";
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
  platform?: string;
  niche?: string;
  goal?: string;
  style_profile_id?: string;
  aggressiveness?: number;
  hook_type?: string;
  cta?: string;
  save?: boolean;
  variants?: number;
}

export interface ScriptLine {
  start: string;
  end: string;
  line: string;
  function: string;
  retention_note: string;
  viewer_question?: string | null;
}

export interface ScriptAnalysis {
  hook_strength: number;
  curiosity_gaps: string[];
  weak_points: string[];
  evidence_used?: string[];
  patterns_applied?: string[];
  patterns_avoided?: string[];
  predicted_retention_risks?: string[];
  improvement_suggestions?: string[];
}

export interface GeneratedScript {
  lines: ScriptLine[];
  analysis: ScriptAnalysis;
  evidence_used?: string[];
  patterns_applied?: string[];
  patterns_avoided?: string[];
  predicted_retention_risks?: string[];
  improvement_suggestions?: string[];
  quality_evaluation?: QualityEvaluation | null;
  script_id?: string;
  version_id?: string;
}

export interface GeneratedVariant extends GeneratedScript {
  variant_id: number;
  angle: string;
  score: number;
}

export interface GenerateScriptVariantsResponse {
  variants: GeneratedVariant[];
  recommended_variant: number;
  script_id?: string;
  version_id?: string;
}

export type GenerateScriptResponse = GeneratedScript | GenerateScriptVariantsResponse;

export interface QualityEvaluation {
  quality_score: number;
  scores: {
    hook?: number;
    retention?: number;
    clarity?: number;
    cta?: number;
    style?: number;
  };
  risks?: {
    copy_reference?: number;
    long_sentences?: number;
    early_payoff?: number;
  };
  problems?: string[];
  fix_suggestions?: string[];
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
  total_scripts?: number;
  total_shorts?: number;
  active_insights?: number;
  avg_views?: number;
  avg_retention?: number;
  avg_engagement?: number;
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
  created_by: "user" | "ai" | "ai_generation" | "ai_improvement";
  created_at: string;
}

// === YouTube ===

export interface YouTubeChannel {
  connected: boolean;
  channel_id?: string;
  channel_name?: string;
}

export interface ShortMetricsSummary {
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  average_view_percentage: number | null;
  engagement_rate: number | null;
  subscribers_gained: number | null;
  collected_at: string | null;
}

export interface ShortAnalysisStatus {
  has_transcript: boolean;
  has_segments: boolean;
  has_beats?: boolean;
  has_performance_analysis: boolean;
  has_timeline_analysis: boolean;
  has_comments: boolean;
  has_comment_analysis: boolean;
}

export interface ShortScriptLink {
  script_id: string;
  script_title: string;
  script_status: ScriptStatus | null;
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
  latest_metrics?: ShortMetricsSummary | null;
  analysis_status?: ShortAnalysisStatus | null;
  script_link?: ShortScriptLink | null;
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

export interface ShortScriptLinkResponse {
  short_id: string;
  script_id: string | null;
  youtube_video_id: string;
  message: string;
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
  script_adherence?: ScriptAdherence | null;
  timeline_analysis?: TimelineAnalysis | null;
  beat_scores?: BeatScores | null;
  created_at: string;
}

export interface AnalysisPoint {
  aspect: string;
  description: string;
  evidence?: string;
  suggestion?: string;
}

export interface ActionableLearning {
  learning?: string;
  priority?: "high" | "medium" | "low";
  applies_to?: string;
  category?: InsightCategory;
  sentiment?: InsightSentiment;
  claim?: string;
  recommended_action?: string;
  evidence?: unknown[];
}

export interface ScriptAdherence {
  script_adherence_score: number | null;
  major_differences: string[];
  missing_script_parts: string[];
  new_unscripted_parts: string[];
}

export interface RetentionWindow {
  start_time: number;
  end_time: number;
  retention_percentage: number | null;
  relative_retention: number | null;
  drop_rate: number | null;
  source: "youtube_analytics" | "manual" | "estimated" | "template" | "unknown" | string;
}

export interface TimelineMoment {
  start_time: number;
  end_time: number;
  reason?: string;
  possible_reason?: string;
  related_script_line?: string | null;
  beat_type?: BeatType | string | null;
  drop_rate?: number | null;
}

export type BeatScores = Partial<Record<BeatType, number | null>>;

export interface TimelineAnalysis {
  timeline_score: number | null;
  strong_moments: TimelineMoment[];
  drop_moments: TimelineMoment[];
  beat_performance?: Partial<Record<BeatType, { score: number | null }>>;
  beat_scores?: BeatScores;
  aligned_segments?: Array<{
    start_time: number;
    end_time: number;
    text: string;
    beat_type?: BeatType | string | null;
    retention_function?: string | null;
    related_script_line?: string | null;
    window?: RetentionWindow | null;
  }>;
  retention_windows?: RetentionWindow[];
}

// === AI Agent Runs (Phase 7/8A) ===

export type AgentRunStatus = "success" | "error" | "running";

export interface AiAgentRun {
  id: string;
  agent_name: string;
  model: string | null;
  status: AgentRunStatus;
  input_summary: string | null;
  output_summary: string | null;
  total_tokens: number | null;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  estimated_cost_usd: number | null;
  duration_ms: number | null;
  error_message: string | null;
  created_at: string | null;
}

export interface AiCostByAgent {
  agent: string;
  runs: number;
  cost_usd: number;
  tokens: number;
}

export interface AiCostSummary {
  period_days: number;
  total_runs: number;
  total_cost_usd: number;
  total_tokens: number;
  total_prompt_tokens: number;
  total_completion_tokens: number;
  avg_duration_ms: number;
  unknown_cost_runs: number;
  error_runs: number;
  error_rate: number;
  by_agent: AiCostByAgent[];
}

// === Health Check (Phase 7/8A) ===

export interface HealthCheckItem {
  status: "ok" | "error" | "missing" | "unknown";
  detail?: string;
}

export interface HealthDetailedResponse {
  status: "ok" | "degraded";
  checks: {
    database: HealthCheckItem;
    redis: HealthCheckItem;
    celery_broker: HealthCheckItem;
    openai_config: HealthCheckItem;
    youtube_config: HealthCheckItem;
  };
}

// === Rate Limit Error ===

export interface RateLimitError {
  detail: string;
  resource?: string;
  retry_after?: number;
}

// === Paginated Response ===

export interface PaginatedData<T> {
  items: T[];
  total: number;
}

// === Comments (Phase 8B) ===

export interface YouTubeShortComment {
  id: string;
  youtube_comment_id: string;
  author_name: string | null;
  text: string;
  like_count: number;
  published_at: string | null;
  sentiment: "positive" | "negative" | "neutral" | "mixed" | null;
  sentiment_score: number | null;
  intent: "praise" | "question" | "suggestion" | "complaint" | "engagement" | "spam" | null;
  topics: string[] | null;
  actionable_insight: string | null;
  analyzed_at: string | null;
}

export interface CommentSummary {
  total_comments: number;
  analyzed_comments: number;
  avg_sentiment_score: number | null;
  sentiment_distribution: Record<string, number>;
  intent_distribution: Record<string, number>;
}

// === Title & Thumbnail Suggestions (Phase 8B) ===

export interface TitleSuggestion {
  title: string;
  strategy: string;
  predicted_ctr: string | null;
}

export interface ThumbnailIdea {
  concept: string;
  text_overlay: string | null;
  emotion: string | null;
  color_palette: string[];
  composition: string | null;
}

// === Script Experiments / A/B Testing (Phase 8B) ===

export type ExperimentStatus = "draft" | "running" | "completed" | "cancelled";

export interface ScriptExperiment {
  id: string;
  name: string;
  hypothesis: string | null;
  status: ExperimentStatus;
  variant_a_script_id: string | null;
  variant_b_script_id: string | null;
  variant_a_short_id: string | null;
  variant_b_short_id: string | null;
  winner: "a" | "b" | "tie" | null;
  result_summary: string | null;
  metrics_comparison: {
    variant_a: Record<string, number>;
    variant_b: Record<string, number>;
  } | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string | null;
}

// === Weekly Strategy (Phase 8B) ===

export interface WeeklyStrategyReport {
  period: { start: string; end: string };
  summary: {
    total_views: number;
    total_likes: number;
    total_comments: number;
    shorts_published: number;
    trend: "growing" | "stable" | "declining";
    trend_detail: string;
  };
  best_short: { id: string; title: string; reason: string } | null;
  worst_short: { id: string; title: string; reason: string } | null;
  highlights: Array<{ observation: string; evidence: string; impact: "high" | "medium" | "low" }>;
  concerns: Array<{ observation: string; evidence: string; severity: "high" | "medium" | "low"; suggestion: string }>;
  internal_trends: Array<{ trend: string; direction: "up" | "down" | "stable"; confidence: number; evidence: string }>;
  action_plan: Array<{ action: string; priority: "high" | "medium" | "low"; reasoning: string; expected_impact: string }>;
  content_ideas: Array<{ theme: string; suggested_hook: string; justification: string; estimated_potential: "high" | "medium" | "low" }>;
}

export interface InternalTrend {
  metric: string;
  direction: "up" | "down" | "stable";
  change_percent: number;
  recent_value: number;
  baseline_avg: number;
}
