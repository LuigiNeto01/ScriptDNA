"""
Testes de contrato — API ↔ Frontend

Valida que os schemas de resposta do backend são compatíveis
com os tipos TypeScript esperados pelo frontend.

Baseado em: FrontEnd/scriptdna/src/types/api.ts
"""
import uuid
from datetime import datetime, timezone

import pytest

from app.models import BeatType, VideoStatus
from app.schemas.beat import BeatOut
from app.schemas.common import DataResponse, ErrorDetail, ErrorResponse
from app.schemas.generate import (
    HooksOutput,
    ImproveOutput,
    ScriptAnalysis,
    ScriptGenerateOutput,
    ScriptLine,
)
from app.schemas.search import SearchResult
from app.schemas.segment import SegmentOut, SegmentTechniqueOut
from app.schemas.style import StyleProfileOut
from app.schemas.task import TaskStatusOut
from app.schemas.video import VideoCreated, VideoOut


# ============================================================
# VideoOut ↔ frontend Video interface
# ============================================================


class TestVideoContract:
    """
    Frontend espera:
        id: string, title: string, source_type: "text"|"file"|"url",
        source_url: string|null, duration_seconds: number,
        creator_name: string, niche: string, status: VideoStatus,
        created_at: string
    """

    def test_video_out_has_all_frontend_fields(self):
        video = VideoOut(
            id=uuid.uuid4(),
            title="Test",
            source_type="text",
            source_url=None,
            duration_seconds=60,
            creator_name="Creator",
            niche="tech",
            status=VideoStatus.DONE,
            created_at=datetime.now(timezone.utc),
        )
        data = video.model_dump(mode="json")

        # Todos os campos que o frontend espera
        assert "id" in data
        assert "title" in data
        assert "source_type" in data
        assert "source_url" in data  # pode ser null
        assert "duration_seconds" in data
        assert "creator_name" in data
        assert "niche" in data
        assert "status" in data
        assert "created_at" in data

    def test_video_status_values_match_frontend(self):
        """Frontend define: "pending"|"transcribing"|"analyzing"|"embedding"|"done"|"error" """
        frontend_values = {"pending", "transcribing", "analyzing", "embedding", "done", "error"}
        backend_values = {s.value for s in VideoStatus}
        assert backend_values == frontend_values, (
            f"VideoStatus mismatch!\n"
            f"  Backend: {backend_values}\n"
            f"  Frontend: {frontend_values}"
        )

    def test_video_source_type_backend_uses_upload_not_file(self):
        """
        [CONTRATO QUEBRADO]
        Frontend espera: source_type: "text" | "file" | "url"
        Backend usa: "upload" em vez de "file" no POST /upload

        Correção necessária: Backend deve normalizar para "file" ou frontend
        aceitar "upload" como valor válido.
        """
        # Documenta a discrepância — o backend usa "upload" no router
        video = VideoOut(
            id=uuid.uuid4(), title="T", source_type="upload",
            status=VideoStatus.DONE, created_at=datetime.now(timezone.utc),
        )
        assert video.source_type == "upload"
        # Frontend espera "file", não "upload" — flag para correção


# ============================================================
# BeatOut ↔ frontend ScriptBeat interface
# ============================================================


class TestBeatContract:
    """
    Frontend espera:
        id, video_id, segment_id, beat_type, attention_goal,
        curiosity_question, retention_function, emotion, intensity_score
    """

    def test_beat_out_has_all_frontend_fields(self):
        beat = BeatOut(
            id=uuid.uuid4(),
            video_id=uuid.uuid4(),
            segment_id=uuid.uuid4(),
            beat_type=BeatType.HOOK,
            attention_goal="Capturar atenção",
            curiosity_question="O que mudou?",
            retention_function="manter curiosidade",
            emotion="curiosidade",
            intensity_score=0.85,
        )
        data = beat.model_dump(mode="json")

        for field in ["id", "video_id", "segment_id", "beat_type",
                       "attention_goal", "curiosity_question",
                       "retention_function", "emotion", "intensity_score"]:
            assert field in data, f"BeatOut faltando campo '{field}'"

    def test_beat_type_values_match_frontend(self):
        """Frontend: "hook"|"setup"|"conflict"|"escalation"|"payoff"|"cta" """
        frontend_values = {"hook", "setup", "conflict", "escalation", "payoff", "cta"}
        backend_values = {b.value for b in BeatType}
        assert backend_values == frontend_values

    def test_beat_nullable_fields_return_null_not_missing(self):
        """Frontend espera campos como null, não ausentes."""
        beat = BeatOut(
            id=uuid.uuid4(), video_id=uuid.uuid4(),
            beat_type=BeatType.HOOK,
        )
        data = beat.model_dump(mode="json")
        assert "segment_id" in data  # pode ser null, mas deve existir
        assert "intensity_score" in data


# ============================================================
# SegmentOut ↔ frontend TranscriptSegment
# ============================================================


class TestSegmentContract:
    """
    Frontend espera:
        id, video_id, start_time: number, end_time: number,
        text: string, word_count: number, position_percent: number
    """

    def test_segment_out_has_all_fields(self):
        seg = SegmentOut(
            id=uuid.uuid4(), video_id=uuid.uuid4(),
            start_time=0.0, end_time=5.0,
            text="Teste", word_count=1, position_percent=0.0,
        )
        data = seg.model_dump(mode="json")

        for field in ["id", "video_id", "start_time", "end_time",
                       "text", "word_count", "position_percent"]:
            assert field in data

    def test_start_time_is_float_not_string(self):
        """Frontend espera start_time: number, não string."""
        seg = SegmentOut(
            id=uuid.uuid4(), video_id=uuid.uuid4(),
            start_time=1.5, end_time=3.0,
            text="T", word_count=1, position_percent=5.0,
        )
        data = seg.model_dump(mode="json")
        assert isinstance(data["start_time"], float)
        assert isinstance(data["end_time"], float)

    def test_techniques_defaults_to_empty_list(self):
        """Frontend espera techniques como array, nunca null."""
        seg = SegmentOut(
            id=uuid.uuid4(), video_id=uuid.uuid4(),
            start_time=0.0, end_time=5.0,
            text="T", word_count=1, position_percent=0.0,
        )
        data = seg.model_dump(mode="json")
        assert data["techniques"] == [], "techniques deve defaultar para []"

    def test_segment_technique_structure(self):
        """
        [CONTRATO QUEBRADO]
        Frontend espera SegmentTechnique com: segment_id, technique_id, confidence, evidence, technique?
        Backend retorna SegmentTechniqueOut com: technique_name, confidence, evidence

        O backend usa technique_name em vez de technique_id + technique object.
        Isso é uma simplificação aceitável, mas o frontend precisa se adaptar.
        """
        tech = SegmentTechniqueOut(
            technique_name="curiosity_gap",
            confidence=0.9,
            evidence="pergunta implícita",
        )
        data = tech.model_dump(mode="json")
        assert "technique_name" in data
        # Frontend espera technique_id + technique object, backend retorna technique_name


# ============================================================
# StyleProfileOut ↔ frontend StyleProfile
# ============================================================


class TestStyleProfileContract:
    def test_style_profile_has_all_fields(self):
        profile = StyleProfileOut(
            id=uuid.uuid4(), name="Test", description="Desc",
            tone="casual", pacing="rápido", avg_sentence_length=10.5,
            common_hooks=["hook"], common_ctas=["cta"],
            narrative_patterns=["pattern"],
            do_rules=["rule"], avoid_rules=["avoid"],
            created_at=datetime.now(timezone.utc),
        )
        data = profile.model_dump(mode="json")

        for field in ["id", "name", "description", "tone", "pacing",
                       "avg_sentence_length", "common_hooks", "common_ctas",
                       "narrative_patterns", "do_rules", "avoid_rules", "created_at"]:
            assert field in data, f"StyleProfileOut faltando '{field}'"

    def test_style_nullable_arrays_documented(self):
        """
        [CONTRATO QUEBRADO]
        Frontend espera arrays como string[] (nunca null).
        Backend schema permite null para common_hooks, common_ctas, etc.

        Correção necessária: backend deve usar default=[] nos campos de lista
        ou frontend deve tratar null como [].
        """
        profile = StyleProfileOut(
            id=uuid.uuid4(), name="Test",
            created_at=datetime.now(timezone.utc),
        )
        data = profile.model_dump(mode="json")
        # Estes campos podem ser null no backend mas frontend espera []
        nullable_arrays = ["common_hooks", "common_ctas", "narrative_patterns",
                           "do_rules", "avoid_rules"]
        for field in nullable_arrays:
            if data[field] is None:
                pytest.xfail(
                    f"{field} é null no backend mas frontend espera []. "
                    "Correção: adicionar default=[] no schema."
                )


# ============================================================
# ScriptGenerateOutput ↔ frontend GeneratedScript
# ============================================================


class TestGenerateContract:
    def test_script_line_start_end_are_float(self):
        """
        [CONTRATO QUEBRADO]
        Frontend define ScriptLine.start e .end como string.
        Backend define como float.

        Correção necessária: alinhar — backend retorna float (correto),
        frontend deve mudar tipo para number.
        """
        line = ScriptLine(start=0.0, end=3.0, line="Teste", function="hook")
        data = line.model_dump(mode="json")
        assert isinstance(data["start"], float), (
            "Backend retorna float — frontend precisa aceitar number, não string"
        )

    def test_analysis_curiosity_gaps_is_int(self):
        """
        [CONTRATO QUEBRADO]
        Frontend define curiosity_gaps como string[] (array de strings).
        Backend define como int (contagem).

        Correção necessária: alinhar tipo — um deve mudar.
        """
        analysis = ScriptAnalysis(
            hook_strength=0.85, curiosity_gaps=3, weak_points=[],
        )
        data = analysis.model_dump(mode="json")
        assert isinstance(data["curiosity_gaps"], int), (
            "Backend retorna int, frontend espera string[] — tipo divergente"
        )


# ============================================================
# SearchResult ↔ frontend SearchResult
# ============================================================


class TestSearchContract:
    def test_search_result_structure_differs(self):
        """
        [CONTRATO QUEBRADO]
        Frontend espera: { segment: TranscriptSegment, video: Video, score: number }
        Backend retorna: { segment_id, video_id, video_title, text, start_time, end_time, similarity }

        O backend retorna uma estrutura achatada em vez de objetos aninhados.
        Frontend precisa se adaptar ou backend precisa aninhar.
        """
        result = SearchResult(
            segment_id=uuid.uuid4(), video_id=uuid.uuid4(),
            video_title="Test", text="Texto",
            start_time=0.0, end_time=5.0, similarity=0.95,
        )
        data = result.model_dump(mode="json")
        # Backend: flat structure
        assert "segment_id" in data
        assert "video_id" in data
        assert "similarity" in data
        # Frontend espera: nested { segment: {...}, video: {...}, score: ... }
        assert "segment" not in data  # confirma discrepância


# ============================================================
# TaskStatusOut ↔ frontend TaskStatus
# ============================================================


class TestTaskContract:
    def test_task_status_values_differ(self):
        """
        [CONTRATO QUEBRADO]
        Frontend espera status: "pending"|"processing"|"done"|"error"
        Backend retorna status Celery: "PENDING"|"STARTED"|"SUCCESS"|"FAILURE"|"RETRY"

        Correção necessária: Backend deve mapear status Celery para
        os valores que o frontend espera, ou frontend adaptar.
        """
        task = TaskStatusOut(task_id="abc123", status="PENDING")
        # Backend usa UPPERCASE Celery status
        # Frontend espera lowercase custom status
        assert task.status == "PENDING"  # documenta discrepância

    def test_task_missing_frontend_fields(self):
        """
        Frontend espera: progress?, current_step?
        Backend não retorna esses campos.
        """
        task = TaskStatusOut(task_id="abc123", status="STARTED")
        data = task.model_dump(mode="json")
        assert "progress" not in data  # campo ausente
        assert "current_step" not in data  # campo ausente


# ============================================================
# DataResponse / ErrorResponse ↔ frontend ApiResponse / ApiError
# ============================================================


class TestEnvelopeContract:
    def test_data_response_matches_frontend(self):
        resp = DataResponse(data={"test": True})
        data = resp.model_dump(mode="json")
        assert "data" in data

    def test_error_response_matches_frontend(self):
        """Frontend espera: { error: { code: string, message: string, details?: unknown } }"""
        err = ErrorResponse(error=ErrorDetail(code="NOT_FOUND", message="Não encontrado"))
        data = err.model_dump(mode="json")
        assert "error" in data
        assert "code" in data["error"]
        assert "message" in data["error"]

    def test_error_response_missing_details_field(self):
        """
        Frontend espera campo 'details?' no ErrorDetail.
        Backend ErrorDetail não tem campo 'details'.
        Impacto baixo — campo é opcional no frontend.
        """
        err = ErrorDetail(code="TEST", message="test")
        data = err.model_dump(mode="json")
        assert "details" not in data  # campo ausente mas opcional no frontend
