from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from loguru import logger

from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.models.user import User
from app.models.jobprep import (
    JobPrepProfile, JobPrepTargetRole, JobPrepSkill,
    JobPrepSkillEvidence, JobPrepProject, JobPrepInterviewSimulation,
    JobPrepReadinessAssessment
)
from app.schemas.jobprep import (
    JobPrepProfile as ProfileSchema,
    JobPrepProfileCreate,
    JobPrepProfileUpdate,
    JobPrepTargetRole as TargetRoleSchema,
    JobPrepTargetRoleCreate,
    JobPrepTargetRoleUpdate,
    JobPrepSkill as SkillSchema,
    JobPrepSkillCreate,
    JobPrepSkillUpdate,
    JobPrepProject as ProjectSchema,
    JobPrepProjectCreate,
    JobPrepProjectUpdate,
    JobPrepInterviewSimulation as SimulationSchema,
    JobPrepInterviewSimulationCreate,
    JobPrepInterviewSimulationUpdate,
    JobPrepReadinessAssessment as AssessmentSchema,
    JobPrepSkillEvidence as EvidenceSchema,
    JobPrepSkillEvidenceCreate,
    JobPrepPracticeEvaluate,
    JobPrepInterviewEvaluate
)
from app.services.jobprep.jobprep_service import JobPrepService

router = APIRouter()


# --- Ownership helpers ---

def _require_profile(db: Session, user_id: int) -> JobPrepProfile:
    """Return the user's profile or raise 404."""
    profile = db.query(JobPrepProfile).filter(JobPrepProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found. Create your profile first.")
    return profile


def _require_role_owned(db: Session, role_id: UUID, profile_id: UUID) -> JobPrepTargetRole:
    """Return role if it belongs to the current user's profile, else 403."""
    role = db.query(JobPrepTargetRole).filter(JobPrepTargetRole.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    if role.profile_id != profile_id:
        raise HTTPException(status_code=403, detail="Access denied")
    return role


def _require_skill_owned(db: Session, skill_id: UUID, profile_id: UUID) -> JobPrepSkill:
    """Return skill if it belongs to the current user's profile, else 403."""
    skill = db.query(JobPrepSkill).filter(JobPrepSkill.id == skill_id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    if skill.profile_id != profile_id:
        raise HTTPException(status_code=403, detail="Access denied")
    return skill


def _require_project_owned(db: Session, project_id: UUID, profile_id: UUID) -> JobPrepProject:
    """Return project if it belongs to the current user's profile, else 403."""
    project = db.query(JobPrepProject).filter(JobPrepProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.profile_id != profile_id:
        raise HTTPException(status_code=403, detail="Access denied")
    return project


def _require_evidence_owned(db: Session, evidence_id: UUID, profile_id: UUID) -> JobPrepSkillEvidence:
    """Return evidence if its parent skill belongs to the current user's profile, else 403."""
    evidence = db.query(JobPrepSkillEvidence).filter(JobPrepSkillEvidence.id == evidence_id).first()
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")
    skill = db.query(JobPrepSkill).filter(JobPrepSkill.id == evidence.skill_id).first()
    if not skill or skill.profile_id != profile_id:
        raise HTTPException(status_code=403, detail="Access denied")
    return evidence


# --- Profile ---

@router.get("/profile", response_model=Optional[ProfileSchema])
def get_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = JobPrepService(db)
    profile = service.get_profile(current_user.id)
    return profile  # None is a valid response (no profile yet)


@router.post("/profile", response_model=ProfileSchema, status_code=status.HTTP_201_CREATED)
def create_profile(
    profile_in: JobPrepProfileCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = JobPrepService(db)
    existing_profile = service.get_profile(current_user.id)
    if existing_profile:
        raise HTTPException(status_code=409, detail="Profile already exists")
    return service.create_profile(current_user.id, profile_in)


@router.patch("/profile", response_model=ProfileSchema)
def update_profile(
    profile_in: JobPrepProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = JobPrepService(db)
    try:
        return service.update_profile(current_user.id, profile_in)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


# --- Target Roles ---

@router.get("/roles", response_model=List[TargetRoleSchema])
def get_target_roles(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    profile = db.query(JobPrepProfile).filter(JobPrepProfile.user_id == current_user.id).first()
    if not profile:
        return []
    return profile.target_roles


@router.post("/roles", response_model=TargetRoleSchema, status_code=status.HTTP_201_CREATED)
def create_target_role(
    role_in: JobPrepTargetRoleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    profile = _require_profile(db, current_user.id)
    role = JobPrepTargetRole(profile_id=profile.id, **role_in.model_dump())
    db.add(role)
    db.commit()
    db.refresh(role)
    return role


@router.patch("/roles/{role_id}", response_model=TargetRoleSchema)
def update_target_role(
    role_id: UUID,
    role_in: JobPrepTargetRoleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    profile = _require_profile(db, current_user.id)
    role = _require_role_owned(db, role_id, profile.id)
    service = JobPrepService(db)
    try:
        return service.update_role(role_id, role_in)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/roles/{role_id}", status_code=status.HTTP_200_OK)
def delete_target_role(
    role_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    profile = _require_profile(db, current_user.id)
    _require_role_owned(db, role_id, profile.id)
    service = JobPrepService(db)
    if not service.delete_role(role_id):
        raise HTTPException(status_code=404, detail="Role not found")
    return {"status": "success"}


# --- Skills ---

@router.get("/skills", response_model=List[SkillSchema])
def get_skills(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = JobPrepService(db)
    profile = service.get_profile(current_user.id)
    if not profile:
        return []
    return service.get_skills(profile.id)


@router.post("/skills", response_model=SkillSchema, status_code=status.HTTP_201_CREATED)
def create_skill(
    skill_in: JobPrepSkillCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = JobPrepService(db)
    profile = _require_profile(db, current_user.id)
    return service.add_skill(profile.id, skill_in)


@router.patch("/skills/{skill_id}", response_model=SkillSchema)
def update_skill(
    skill_id: UUID,
    skill_in: JobPrepSkillUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    profile = _require_profile(db, current_user.id)
    _require_skill_owned(db, skill_id, profile.id)
    service = JobPrepService(db)
    try:
        return service.update_skill(skill_id, skill_in)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/skills/{skill_id}", status_code=status.HTTP_200_OK)
def delete_skill(
    skill_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    profile = _require_profile(db, current_user.id)
    _require_skill_owned(db, skill_id, profile.id)
    service = JobPrepService(db)
    if not service.delete_skill(skill_id):
        raise HTTPException(status_code=404, detail="Skill not found")
    return {"status": "success"}


# --- Projects ---

@router.get("/projects", response_model=List[ProjectSchema])
def get_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    profile = db.query(JobPrepProfile).filter(JobPrepProfile.user_id == current_user.id).first()
    if not profile:
        return []
    return profile.projects


@router.post("/projects", response_model=ProjectSchema, status_code=status.HTTP_201_CREATED)
def create_project(
    project_in: JobPrepProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    profile = _require_profile(db, current_user.id)
    project = JobPrepProject(profile_id=profile.id, **project_in.model_dump())
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@router.patch("/projects/{project_id}", response_model=ProjectSchema)
def update_project(
    project_id: UUID,
    project_in: JobPrepProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    profile = _require_profile(db, current_user.id)
    _require_project_owned(db, project_id, profile.id)
    service = JobPrepService(db)
    try:
        return service.update_project(project_id, project_in)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/projects/{project_id}", status_code=status.HTTP_200_OK)
def delete_project(
    project_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    profile = _require_profile(db, current_user.id)
    _require_project_owned(db, project_id, profile.id)
    service = JobPrepService(db)
    if not service.delete_project(project_id):
        raise HTTPException(status_code=404, detail="Project not found")
    return {"status": "success"}


@router.post("/projects/{project_id}/analyze", response_model=ProjectSchema)
async def analyze_project(
    project_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    profile = _require_profile(db, current_user.id)
    _require_project_owned(db, project_id, profile.id)
    service = JobPrepService(db)
    project = await service.analyze_project_with_ai(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.post("/projects/import-github", response_model=ProjectSchema, status_code=status.HTTP_201_CREATED)
async def import_github_project(
    owner: str,
    repo_name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    profile = _require_profile(db, current_user.id)
    service = JobPrepService(db)
    try:
        return await service.import_github_repo(profile.id, owner, repo_name)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error importing GitHub repository {owner}/{repo_name}")
        raise HTTPException(status_code=422, detail=f"Failed to import repository: {str(e)}")


# --- Simulations ---

@router.get("/simulations", response_model=List[SimulationSchema])
def get_simulations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    profile = db.query(JobPrepProfile).filter(JobPrepProfile.user_id == current_user.id).first()
    if not profile:
        return []
    return profile.simulations


@router.post("/simulations", response_model=SimulationSchema, status_code=status.HTTP_201_CREATED)
def create_simulation(
    sim_in: JobPrepInterviewSimulationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    profile = _require_profile(db, current_user.id)
    sim = JobPrepInterviewSimulation(profile_id=profile.id, **sim_in.model_dump())
    db.add(sim)
    db.commit()
    db.refresh(sim)
    return sim


@router.get("/simulations/question")
async def get_simulation_question(
    role_id: UUID,
    difficulty: str = "mid-level",
    sim_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify the role belongs to the current user
    profile = _require_profile(db, current_user.id)
    _require_role_owned(db, role_id, profile.id)
    service = JobPrepService(db)
    return await service.generate_interview_question(role_id, difficulty, sim_id)


@router.post("/simulations/{sim_id}/evaluate")
async def evaluate_response(
    sim_id: UUID,
    eval_in: JobPrepInterviewEvaluate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify the simulation belongs to the current user
    profile = _require_profile(db, current_user.id)
    sim = db.query(JobPrepInterviewSimulation).filter(JobPrepInterviewSimulation.id == sim_id).first()
    if not sim:
        raise HTTPException(status_code=404, detail="Simulation not found")
    if sim.profile_id != profile.id:
        raise HTTPException(status_code=403, detail="Access denied")
    service = JobPrepService(db)
    evaluation = await service.evaluate_interview_response(sim_id, eval_in.question, eval_in.user_response)
    if not evaluation:
        raise HTTPException(status_code=500, detail="AI Evaluation failed")
    return evaluation


# --- Role Analysis ---

@router.post("/roles/{role_id}/analyze")
async def analyze_role(
    role_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    profile = _require_profile(db, current_user.id)
    _require_role_owned(db, role_id, profile.id)
    service = JobPrepService(db)
    return await service.analyze_role_requirements(role_id)


# --- Skill Evidence ---

@router.get("/skills/{skill_id}/evidence", response_model=List[EvidenceSchema])
def get_skill_evidence(
    skill_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    profile = _require_profile(db, current_user.id)
    _require_skill_owned(db, skill_id, profile.id)
    service = JobPrepService(db)
    return service.get_skill_evidence(skill_id)


@router.post("/skills/{skill_id}/evidence", response_model=EvidenceSchema, status_code=status.HTTP_201_CREATED)
def add_skill_evidence(
    skill_id: UUID,
    evidence_in: JobPrepSkillEvidenceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    profile = _require_profile(db, current_user.id)
    _require_skill_owned(db, skill_id, profile.id)
    service = JobPrepService(db)
    return service.add_skill_evidence(profile.id, skill_id, evidence_in)


@router.delete("/evidence/{evidence_id}", status_code=status.HTTP_200_OK)
def delete_skill_evidence(
    evidence_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    profile = _require_profile(db, current_user.id)
    _require_evidence_owned(db, evidence_id, profile.id)
    service = JobPrepService(db)
    if not service.delete_skill_evidence(evidence_id):
        raise HTTPException(status_code=404, detail="Evidence not found")
    return {"status": "success"}


# --- Practice Evaluation ---

@router.post("/practice/evaluate")
async def evaluate_practice(
    eval_in: JobPrepPracticeEvaluate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    profile = _require_profile(db, current_user.id)
    service = JobPrepService(db)
    evaluation = await service.evaluate_practice_attempt(
        profile.id,
        eval_in.topic,
        eval_in.user_answer,
        eval_in.practice_type,
        eval_in.difficulty
    )
    if not evaluation:
        raise HTTPException(status_code=500, detail="AI Evaluation failed")
    return evaluation


# --- Analysis ---

@router.get("/analysis/gaps")
async def get_skill_gaps(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = JobPrepService(db)
    profile = service.get_profile(current_user.id)
    if not profile:
        return []
    return await service.analyze_skill_gaps(profile.id)


@router.get("/analysis/readiness-history")
def get_readiness_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    profile = db.query(JobPrepProfile).filter(JobPrepProfile.user_id == current_user.id).first()
    if not profile:
        return []
    return profile.readiness_assessments


@router.get("/analysis/readiness-forecast")
def get_readiness_forecast(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = JobPrepService(db)
    profile = service.get_profile(current_user.id)
    if not profile:
        return None
    return service.get_readiness_forecast(profile.id)


@router.get("/roles/{role_id}/curriculum")
async def get_role_curriculum(
    role_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    profile = _require_profile(db, current_user.id)
    _require_role_owned(db, role_id, profile.id)
    service = JobPrepService(db)
    return await service.generate_role_curriculum(role_id)


@router.post("/evidence/{evidence_id}/evaluate")
async def evaluate_evidence(
    evidence_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    profile = _require_profile(db, current_user.id)
    _require_evidence_owned(db, evidence_id, profile.id)
    service = JobPrepService(db)
    return await service.evaluate_evidence_quality(evidence_id)
