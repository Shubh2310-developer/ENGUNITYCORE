import pytest
from uuid import uuid4
from typing import Dict
from unittest.mock import AsyncMock

from app.api.v1.auth import AuthenticatedUser, get_current_user
from app.core.database import get_db
from app.main import app
from app.models.user import User as UserModel
from app.models.jobprep import (
    JobPrepProfile, JobPrepTargetRole, JobPrepSkill,
    JobPrepSkillEvidence, JobPrepProject, JobPrepInterviewSimulation,
    JobPrepPracticeSession, JobPrepReadinessAssessment
)
from app.services.ai.groq_client import groq_client

def _open_test_db_session():
    override = app.dependency_overrides[get_db]
    session_gen = override()
    db = next(session_gen)
    return db, session_gen

@pytest.fixture(scope="function")
def setup_jobprep_tables(setup_database):
    db, session_gen = _open_test_db_session()
    bind = db.get_bind()
    
    # Create tables in order of dependency
    JobPrepProfile.__table__.create(bind=bind, checkfirst=True)
    JobPrepTargetRole.__table__.create(bind=bind, checkfirst=True)
    JobPrepSkill.__table__.create(bind=bind, checkfirst=True)
    JobPrepSkillEvidence.__table__.create(bind=bind, checkfirst=True)
    JobPrepProject.__table__.create(bind=bind, checkfirst=True)
    JobPrepInterviewSimulation.__table__.create(bind=bind, checkfirst=True)
    JobPrepPracticeSession.__table__.create(bind=bind, checkfirst=True)
    JobPrepReadinessAssessment.__table__.create(bind=bind, checkfirst=True)
    
    db.close()
    try:
        next(session_gen)
    except StopIteration:
        pass

    yield

    db, session_gen = _open_test_db_session()
    bind = db.get_bind()
    
    # Drop tables in reverse order
    JobPrepReadinessAssessment.__table__.drop(bind=bind, checkfirst=True)
    JobPrepPracticeSession.__table__.drop(bind=bind, checkfirst=True)
    JobPrepInterviewSimulation.__table__.drop(bind=bind, checkfirst=True)
    JobPrepProject.__table__.drop(bind=bind, checkfirst=True)
    JobPrepSkillEvidence.__table__.drop(bind=bind, checkfirst=True)
    JobPrepSkill.__table__.drop(bind=bind, checkfirst=True)
    JobPrepTargetRole.__table__.drop(bind=bind, checkfirst=True)
    JobPrepProfile.__table__.drop(bind=bind, checkfirst=True)
    
    db.close()
    try:
        next(session_gen)
    except StopIteration:
        pass

@pytest.fixture(scope="function")
def jobprep_auth_override(setup_jobprep_tables):
    db, session_gen = _open_test_db_session()

    user_a = UserModel(
        id=101,
        email="jobprep-a@test.com",
        password_hash="local",
        role="user",
        is_active=True,
        provider="local",
    )
    user_b = UserModel(
        id=202,
        email="jobprep-b@test.com",
        password_hash="local",
        role="user",
        is_active=True,
        provider="local",
    )
    db.add_all([user_a, user_b])
    db.commit()
    db.close()
    try:
        next(session_gen)
    except StopIteration:
        pass

    active_user: Dict[str, AuthenticatedUser] = {
        "value": AuthenticatedUser(id=101, email="jobprep-a@test.com", role="user", is_active=True, provider="local")
    }

    def _get_user():
        return active_user["value"]

    app.dependency_overrides[get_current_user] = _get_user
    yield active_user
    app.dependency_overrides.pop(get_current_user, None)


class TestJobPrepAPI:
    def test_profile_lifecycle(self, client, jobprep_auth_override):
        # 1. Profile initially not found / None
        resp = client.get("/api/v1/jobprep/profile")
        assert resp.status_code == 200
        assert resp.json() is None

        # 2. Create Profile
        payload = {
            "current_status": "searching",
            "target_timeline": "3 months",
            "experience_level": "mid",
            "preferred_companies": ["Google", "DeepMind"],
            "work_authorization": "US Citizen",
            "remote_preference": "hybrid",
            "industry_focus": "AI Engineering",
            "salary_expectation_min": 150000,
            "salary_expectation_max": 220000,
            "timezone": "PST",
            "learning_style": "practical",
            "notifications_enabled": True
        }
        create_resp = client.post("/api/v1/jobprep/profile", json=payload)
        assert create_resp.status_code == 201
        created = create_resp.json()
        assert created["current_status"] == "searching"
        assert created["preferred_companies"] == ["Google", "DeepMind"]

        # 3. Duplicate profile creation fails
        dup_resp = client.post("/api/v1/jobprep/profile", json=payload)
        assert dup_resp.status_code == 409

        # 4. Get Profile
        get_resp = client.get("/api/v1/jobprep/profile")
        assert get_resp.status_code == 200
        assert get_resp.json()["id"] == created["id"]

        # 5. Patch Profile
        patch_resp = client.patch("/api/v1/jobprep/profile", json={"current_status": "placed", "remote_preference": "remote"})
        assert patch_resp.status_code == 200
        patched = patch_resp.json()
        assert patched["current_status"] == "placed"
        assert patched["remote_preference"] == "remote"

    def test_roles_management(self, client, jobprep_auth_override):
        # Must create profile first
        client.post("/api/v1/jobprep/profile", json={"current_status": "searching"})

        # Create target role
        role_payload = {
            "role_title": "AI Engineer",
            "role_category": "Software Engineering",
            "seniority_level": "senior",
            "required_skills": ["Python", "PyTorch", "Transformers"],
            "nice_to_have_skills": ["Rust", "C++"],
            "is_primary": True
        }
        create_resp = client.post("/api/v1/jobprep/roles", json=role_payload)
        assert create_resp.status_code == 201
        role = create_resp.json()
        assert role["role_title"] == "AI Engineer"
        role_id = role["id"]

        # List target roles
        list_resp = client.get("/api/v1/jobprep/roles")
        assert list_resp.status_code == 200
        assert len(list_resp.json()) == 1

        # Patch target role
        patch_resp = client.patch(f"/api/v1/jobprep/roles/{role_id}", json={"role_title": "Lead AI Scientist"})
        assert patch_resp.status_code == 200
        assert patch_resp.json()["role_title"] == "Lead AI Scientist"

        # Delete target role
        del_resp = client.delete(f"/api/v1/jobprep/roles/{role_id}")
        assert del_resp.status_code == 200
        
        # Verify empty list
        list_resp = client.get("/api/v1/jobprep/roles")
        assert len(list_resp.json()) == 0

    def test_skills_and_evidence(self, client, jobprep_auth_override):
        client.post("/api/v1/jobprep/profile", json={"current_status": "searching"})

        # Add skill
        skill_payload = {
            "skill_name": "Machine Learning",
            "skill_category": "AI",
            "skill_subcategory": "Deep Learning",
            "target_level": 5,
            "is_critical": True
        }
        create_resp = client.post("/api/v1/jobprep/skills", json=skill_payload)
        assert create_resp.status_code == 201
        skill = create_resp.json()
        assert skill["skill_name"] == "Machine Learning"
        skill_id = skill["id"]

        # List skills
        list_resp = client.get("/api/v1/jobprep/skills")
        assert len(list_resp.json()) == 1

        # Patch skill
        patch_resp = client.patch(f"/api/v1/jobprep/skills/{skill_id}", json={"current_level": 3})
        assert patch_resp.status_code == 200
        assert patch_resp.json()["current_level"] == 3

        # Add evidence
        evidence_payload = {
            "evidence_type": "project",
            "title": "LLM Fine-tuning pipeline",
            "description": "Fine-tuned Llama-3 using QLoRA",
            "source_url": "https://github.com/test/llm-finetune",
            "source_type": "github",
            "impact_level": "high"
        }
        ev_resp = client.post(f"/api/v1/jobprep/skills/{skill_id}/evidence", json=evidence_payload)
        assert ev_resp.status_code == 201
        evidence = ev_resp.json()
        assert evidence["title"] == "LLM Fine-tuning pipeline"
        evidence_id = evidence["id"]

        # Get evidence
        get_ev_resp = client.get(f"/api/v1/jobprep/skills/{skill_id}/evidence")
        assert len(get_ev_resp.json()) == 1

        # Delete evidence
        del_ev_resp = client.delete(f"/api/v1/jobprep/evidence/{evidence_id}")
        assert del_ev_resp.status_code == 200

        # Delete skill
        del_skill_resp = client.delete(f"/api/v1/jobprep/skills/{skill_id}")
        assert del_skill_resp.status_code == 200

    def test_projects_management(self, client, jobprep_auth_override):
        client.post("/api/v1/jobprep/profile", json={"current_status": "searching"})

        proj_payload = {
            "title": "Antigravity AI Agent",
            "description": "Self-healing coding agent framework",
            "project_type": "personal",
            "github_url": "https://github.com/agent/antigravity",
            "tech_stack": ["Python", "FastAPI", "React"],
            "is_complete": True
        }
        create_resp = client.post("/api/v1/jobprep/projects", json=proj_payload)
        assert create_resp.status_code == 201
        project = create_resp.json()
        assert project["title"] == "Antigravity AI Agent"
        project_id = project["id"]

        # Patch project
        patch_resp = client.patch(f"/api/v1/jobprep/projects/{project_id}", json={"is_featured": True})
        assert patch_resp.status_code == 200
        assert patch_resp.json()["is_featured"] is True

        # Delete project
        del_resp = client.delete(f"/api/v1/jobprep/projects/{project_id}")
        assert del_resp.status_code == 200

    @pytest.mark.asyncio
    async def test_ai_integration_endpoints(self, client, jobprep_auth_override, monkeypatch):
        client.post("/api/v1/jobprep/profile", json={"current_status": "searching"})

        # Add target role
        role_resp = client.post("/api/v1/jobprep/roles", json={
            "role_title": "Staff Engineer",
            "required_skills": ["Architecture", "Kubernetes"]
        })
        role_id = role_resp.json()["id"]

        # Add project
        proj_resp = client.post("/api/v1/jobprep/projects", json={
            "title": "Cloud Platform",
            "description": "High performance cluster orchestrator"
        })
        proj_id = proj_resp.json()["id"]

        # Add simulation
        sim_resp = client.post("/api/v1/jobprep/simulations", json={
            "simulation_type": "coding",
            "difficulty_level": "senior",
            "company_style": "Google",
            "persona_style": "Friendly"
        })
        sim_id = sim_resp.json()["id"]

        # Mock AI completion
        mock_completion = AsyncMock()
        monkeypatch.setattr(groq_client, "get_completion", mock_completion)

        # 1. Project Analysis
        mock_completion.return_value = """
        {
          "complexity_score": 0.85,
          "innovation_score": 0.78,
          "interview_value_score": 0.90,
          "role_relevance_scores": {"Staff Engineer": 0.95},
          "talking_points": ["Designed high performance orchestrator", "Scaled to 10k nodes"],
          "technical_complexity_breakdown": "Complex cluster layout",
          "improvement_suggestions": ["Add caching"]
        }
        """
        analyze_proj_resp = client.post(f"/api/v1/jobprep/projects/{proj_id}/analyze")
        assert analyze_proj_resp.status_code == 200
        assert float(analyze_proj_resp.json()["complexity_score"]) == 0.85

        # 2. Simulation Question Generation
        mock_completion.return_value = """
        {
          "question": "How do you handle consensus in a distributed database?",
          "question_type": "system_design",
          "difficulty": "senior",
          "expected_concepts": ["Raft", "Paxos", "Split-brain"],
          "hints": ["Think about majority quorum"]
        }
        """
        q_resp = client.get(f"/api/v1/jobprep/simulations/question?role_id={role_id}&difficulty=senior&sim_id={sim_id}")
        assert q_resp.status_code == 200
        assert "distributed database" in q_resp.json()["question"]

        # 3. Response Evaluation
        mock_completion.return_value = """
        {
          "score": 85,
          "technical_accuracy": 90,
          "communication_clarity": 80,
          "feedback": "Great overview of the Raft consensus algorithm.",
          "suggestions": ["Elaborate on leader election timeouts"]
        }
        """
        eval_resp = client.post(f"/api/v1/jobprep/simulations/{sim_id}/evaluate", json={
            "question": "How do you handle consensus in a distributed database?",
            "user_response": "We use Raft and ensure odd numbers of nodes for consensus."
        })
        assert eval_resp.status_code == 200
        assert eval_resp.json()["score"] == 85

        # 4. Role Analysis
        mock_completion.return_value = """
        {
          "typical_interview_rounds": ["Coding", "System Design"],
          "recommended_skills": ["Go", "Kubernetes"],
          "market_demand_description": "High demand for platform engineers",
          "suggested_salary_range": "$180,000 - $240,000",
          "preparation_focus_areas": ["Concurrency", "Networking"]
        }
        """
        role_anal_resp = client.post(f"/api/v1/jobprep/roles/{role_id}/analyze")
        assert role_anal_resp.status_code == 200
        assert "platform engineers" in role_anal_resp.json()["market_demand_description"]

        # 5. Practice Evaluate
        mock_completion.return_value = """
        {
          "score": 75,
          "feedback": "Good understanding of concurrency concepts.",
          "suggestions": ["Explain GIL constraints in Python"],
          "concepts_mastered": ["Multithreading"]
        }
        """
        prac_eval_resp = client.post("/api/v1/jobprep/practice/evaluate", json={
            "topic": "Concurrency",
            "user_answer": "Threading in Python is limited by the GIL, so multiprocessing is preferred for CPU-bound tasks."
        })
        assert prac_eval_resp.status_code == 200
        assert prac_eval_resp.json()["score"] == 75

        # 6. Readiness assessments list
        hist_resp = client.get("/api/v1/jobprep/analysis/readiness-history")
        assert hist_resp.status_code == 200
        assert len(hist_resp.json()) > 0

        # 7. Readiness forecast
        forecast_resp = client.get("/api/v1/jobprep/analysis/readiness-forecast")
        assert forecast_resp.status_code == 200
        assert "current_score" in forecast_resp.json()

        # 8. Skill gaps
        gaps_resp = client.get("/api/v1/jobprep/analysis/gaps")
        assert gaps_resp.status_code == 200
        assert isinstance(gaps_resp.json(), list)
