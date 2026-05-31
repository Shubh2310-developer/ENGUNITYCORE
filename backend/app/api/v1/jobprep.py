from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

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

# --- Profile ---
@router.get("/profile", response_model=Optional[ProfileSchema])
def get_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = JobPrepService(db)
    profile = service.get_profile(current_user.id)
    if not profile:
        return None
    return profile

@router.post("/profile", response_model=ProfileSchema)
def create_profile(
    profile_in: JobPrepProfileCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = JobPrepService(db)
    existing_profile = service.get_profile(current_user.id)
    if existing_profile:
        raise HTTPException(status_code=400, detail="Profile already exists")
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

@router.post("/roles", response_model=TargetRoleSchema)
def create_target_role(
    role_in: JobPrepTargetRoleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    profile = db.query(JobPrepProfile).filter(JobPrepProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found. Create profile first.")

    role = JobPrepTargetRole(
        profile_id=profile.id,
        **role_in.model_dump()
    )
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
    service = JobPrepService(db)
    try:
        return service.update_role(role_id, role_in)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.delete("/roles/{role_id}")
def delete_target_role(
    role_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
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

@router.post("/skills", response_model=SkillSchema)
def create_skill(
    skill_in: JobPrepSkillCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = JobPrepService(db)
    profile = service.get_profile(current_user.id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return service.add_skill(profile.id, skill_in)

@router.patch("/skills/{skill_id}", response_model=SkillSchema)
def update_skill(
    skill_id: UUID,
    skill_in: JobPrepSkillUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = JobPrepService(db)
    try:
        return service.update_skill(skill_id, skill_in)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.delete("/skills/{skill_id}")
def delete_skill(
    skill_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
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

@router.post("/projects", response_model=ProjectSchema)
def create_project(
    project_in: JobPrepProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    profile = db.query(JobPrepProfile).filter(JobPrepProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    project = JobPrepProject(
        profile_id=profile.id,
        **project_in.model_dump()
    )
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
    service = JobPrepService(db)
    try:
        return service.update_project(project_id, project_in)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.delete("/projects/{project_id}")
def delete_project(
    project_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
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
    service = JobPrepService(db)
    project = await service.analyze_project_with_ai(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@router.post("/projects/import-github", response_model=ProjectSchema)
async def import_github_project(
    owner: str,
    repo_name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = JobPrepService(db)
    profile = service.get_profile(current_user.id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    try:
        return await service.import_github_repo(profile.id, owner, repo_name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to import repository: {str(e)}")

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

@router.post("/simulations", response_model=SimulationSchema)
def create_simulation(
    sim_in: JobPrepInterviewSimulationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    profile = db.query(JobPrepProfile).filter(JobPrepProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    sim = JobPrepInterviewSimulation(
        profile_id=profile.id,
        **sim_in.model_dump()
    )
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
    service = JobPrepService(db)
    return await service.generate_interview_question(role_id, difficulty, sim_id)

@router.post("/simulations/{sim_id}/evaluate")
async def evaluate_response(
    sim_id: UUID,
    eval_in: JobPrepInterviewEvaluate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
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
    service = JobPrepService(db)
    return await service.analyze_role_requirements(role_id)

# --- Skill Evidence ---
@router.get("/skills/{skill_id}/evidence", response_model=List[EvidenceSchema])
def get_skill_evidence(
    skill_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = JobPrepService(db)
    return service.get_skill_evidence(skill_id)

@router.post("/skills/{skill_id}/evidence", response_model=EvidenceSchema)
def add_skill_evidence(
    skill_id: UUID,
    evidence_in: JobPrepSkillEvidenceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = JobPrepService(db)
    profile = service.get_profile(current_user.id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return service.add_skill_evidence(profile.id, skill_id, evidence_in)

@router.delete("/evidence/{evidence_id}")
def delete_skill_evidence(
    evidence_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
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
    service = JobPrepService(db)
    profile = service.get_profile(current_user.id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

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
    service = JobPrepService(db)
    return await service.generate_role_curriculum(role_id)

@router.post("/evidence/{evidence_id}/evaluate")
async def evaluate_evidence(
    evidence_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = JobPrepService(db)
    return await service.evaluate_evidence_quality(evidence_id)
