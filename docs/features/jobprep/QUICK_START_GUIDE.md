# Job Prep Feature - Quick Start Implementation Guide

This is a condensed, actionable guide to get the Job Prep feature running. For detailed information, see [JOBPREP_COMPREHENSIVE_RESEARCH.md](./JOBPREP_COMPREHENSIVE_RESEARCH.md).

## 🎯 Goal

Transform the frontend-only Job Prep UI into a fully functional feature with backend, database, and AI integration.

## ⚡ 30-Minute Setup

### Step 1: Create Database Schema (5 min)

```bash
cd backend

# Create the migration file
cat > alembic/versions/001_add_jobprep_tables.sql << 'EOF'
-- Copy the complete schema from Appendix D of the comprehensive research doc
-- Or download from: docs/features/jobprep/JOBPREP_COMPREHENSIVE_RESEARCH.md
EOF

# Run migration
psql -U your_user -d engunity -f alembic/versions/001_add_jobprep_tables.sql
```

### Step 2: Create Backend Models (10 min)

```bash
# Create the models file
touch backend/app/models/jobprep.py
```

```python
# backend/app/models/jobprep.py
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Text, JSON, Float, Date, DECIMAL
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base
import uuid

class JobPrepProfile(Base):
    __tablename__ = "jobprep_profiles"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    current_status = Column(String(50))
    target_timeline = Column(String(50))
    experience_level = Column(String(50))
    preferred_companies = Column(JSON, default=list)
    overall_readiness_score = Column(Integer, default=0)
    placement_mode_enabled = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())
    
    user = relationship("User", back_populates="jobprep_profile")
    target_roles = relationship("TargetRole", back_populates="profile", cascade="all, delete-orphan")
    skills = relationship("JobPrepSkill", back_populates="profile", cascade="all, delete-orphan")
    projects = relationship("JobPrepProject", back_populates="profile", cascade="all, delete-orphan")

class TargetRole(Base):
    __tablename__ = "jobprep_target_roles"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    profile_id = Column(UUID(as_uuid=True), ForeignKey("jobprep_profiles.id", ondelete="CASCADE"), nullable=False)
    role_title = Column(String(200), nullable=False)
    role_category = Column(String(100))
    seniority_level = Column(String(50))
    market_demand = Column(String(50))
    salary_range_min = Column(Integer)
    salary_range_max = Column(Integer)
    required_skills = Column(JSON, default=list)
    readiness_score = Column(Integer, default=0)
    is_primary = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())
    
    profile = relationship("JobPrepProfile", back_populates="target_roles")

class JobPrepSkill(Base):
    __tablename__ = "jobprep_skills"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    profile_id = Column(UUID(as_uuid=True), ForeignKey("jobprep_profiles.id", ondelete="CASCADE"), nullable=False)
    skill_name = Column(String(200), nullable=False)
    skill_category = Column(String(100), nullable=False)
    current_level = Column(Integer, default=0)
    target_level = Column(Integer)
    evidence_count = Column(Integer, default=0)
    evidence_strength = Column(DECIMAL(3, 2), default=0.00)
    is_critical = Column(Boolean, default=False)
    is_gap = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())
    
    profile = relationship("JobPrepProfile", back_populates="skills")

class JobPrepProject(Base):
    __tablename__ = "jobprep_projects"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    profile_id = Column(UUID(as_uuid=True), ForeignKey("jobprep_profiles.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(300), nullable=False)
    description = Column(Text)
    github_url = Column(Text)
    tech_stack = Column(JSON, default=list)
    complexity_score = Column(DECIMAL(3, 2))
    talking_points = Column(JSON)
    is_featured = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())
    
    profile = relationship("JobPrepProfile", back_populates="projects")

# Add to User model relationship
# In backend/app/models/user.py, add:
# jobprep_profile = relationship("JobPrepProfile", back_populates="user", uselist=False)
```

### Step 3: Create Pydantic Schemas (5 min)

```bash
touch backend/app/schemas/jobprep.py
```

```python
# backend/app/schemas/jobprep.py
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class ProfileBase(BaseModel):
    current_status: Optional[str] = None
    target_timeline: Optional[str] = None
    experience_level: Optional[str] = None
    
class ProfileCreate(ProfileBase):
    pass

class ProfileUpdate(ProfileBase):
    pass

class Profile(ProfileBase):
    id: UUID
    user_id: int
    overall_readiness_score: int
    placement_mode_enabled: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class TargetRoleBase(BaseModel):
    role_title: str
    role_category: Optional[str] = None
    seniority_level: Optional[str] = None
    
class TargetRoleCreate(TargetRoleBase):
    pass

class TargetRole(TargetRoleBase):
    id: UUID
    profile_id: UUID
    readiness_score: int
    is_primary: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class SkillBase(BaseModel):
    skill_name: str
    skill_category: str
    current_level: int = 0
    target_level: Optional[int] = None

class SkillCreate(SkillBase):
    pass

class Skill(SkillBase):
    id: UUID
    profile_id: UUID
    evidence_count: int
    is_gap: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class ProjectBase(BaseModel):
    title: str
    description: Optional[str] = None
    github_url: Optional[str] = None
    tech_stack: List[str] = []

class ProjectCreate(ProjectBase):
    pass

class Project(ProjectBase):
    id: UUID
    profile_id: UUID
    is_featured: bool
    created_at: datetime
    
    class Config:
        from_attributes = True
```

### Step 4: Create API Routes (10 min)

```bash
touch backend/app/api/v1/jobprep.py
```

```python
# backend/app/api/v1/jobprep.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.models.user import User
from app.models.jobprep import JobPrepProfile, TargetRole, JobPrepSkill, JobPrepProject
from app.schemas.jobprep import (
    Profile, ProfileCreate, ProfileUpdate,
    TargetRole as TargetRoleSchema, TargetRoleCreate,
    Skill as SkillSchema, SkillCreate,
    Project as ProjectSchema, ProjectCreate
)

router = APIRouter()

# ============================================================================
# Profile Endpoints
# ============================================================================

@router.get("/profile", response_model=Profile)
async def get_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's job prep profile"""
    profile = db.query(JobPrepProfile).filter(
        JobPrepProfile.user_id == current_user.id
    ).first()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    return profile

@router.post("/profile", response_model=Profile)
async def create_profile(
    profile_data: ProfileCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create job prep profile"""
    existing = db.query(JobPrepProfile).filter(
        JobPrepProfile.user_id == current_user.id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Profile already exists")
    
    profile = JobPrepProfile(
        user_id=current_user.id,
        **profile_data.dict()
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    
    return profile

@router.patch("/profile", response_model=Profile)
async def update_profile(
    profile_data: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update job prep profile"""
    profile = db.query(JobPrepProfile).filter(
        JobPrepProfile.user_id == current_user.id
    ).first()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    for key, value in profile_data.dict(exclude_unset=True).items():
        setattr(profile, key, value)
    
    db.commit()
    db.refresh(profile)
    
    return profile

# ============================================================================
# Target Roles Endpoints
# ============================================================================

@router.get("/roles", response_model=List[TargetRoleSchema])
async def get_roles(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get target roles"""
    profile = db.query(JobPrepProfile).filter(
        JobPrepProfile.user_id == current_user.id
    ).first()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    roles = db.query(TargetRole).filter(
        TargetRole.profile_id == profile.id
    ).all()
    
    return roles

@router.post("/roles", response_model=TargetRoleSchema)
async def add_role(
    role_data: TargetRoleCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add target role"""
    profile = db.query(JobPrepProfile).filter(
        JobPrepProfile.user_id == current_user.id
    ).first()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    role = TargetRole(
        profile_id=profile.id,
        **role_data.dict()
    )
    db.add(role)
    db.commit()
    db.refresh(role)
    
    return role

# ============================================================================
# Skills Endpoints
# ============================================================================

@router.get("/skills", response_model=List[SkillSchema])
async def get_skills(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get skills"""
    profile = db.query(JobPrepProfile).filter(
        JobPrepProfile.user_id == current_user.id
    ).first()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    skills = db.query(JobPrepSkill).filter(
        JobPrepSkill.profile_id == profile.id
    ).all()
    
    return skills

@router.post("/skills", response_model=SkillSchema)
async def add_skill(
    skill_data: SkillCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add skill"""
    profile = db.query(JobPrepProfile).filter(
        JobPrepProfile.user_id == current_user.id
    ).first()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    skill = JobPrepSkill(
        profile_id=profile.id,
        **skill_data.dict()
    )
    db.add(skill)
    db.commit()
    db.refresh(skill)
    
    return skill

# ============================================================================
# Projects Endpoints
# ============================================================================

@router.get("/projects", response_model=List[ProjectSchema])
async def get_projects(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get projects"""
    profile = db.query(JobPrepProfile).filter(
        JobPrepProfile.user_id == current_user.id
    ).first()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    projects = db.query(JobPrepProject).filter(
        JobPrepProject.profile_id == profile.id
    ).all()
    
    return projects

@router.post("/projects", response_model=ProjectSchema)
async def add_project(
    project_data: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add project"""
    profile = db.query(JobPrepProfile).filter(
        JobPrepProfile.user_id == current_user.id
    ).first()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    project = JobPrepProject(
        profile_id=profile.id,
        **project_data.dict()
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    
    return project
```

### Step 5: Register Routes (2 min)

```python
# backend/app/main.py
# Add this import
from app.api.v1.jobprep import router as jobprep_router

# Add this line with other router includes
app.include_router(jobprep_router, prefix=f"{settings.API_V1_STR}/jobprep", tags=["jobprep"])
```

### Step 6: Create Frontend Service (5 min)

```bash
# File already designed - copy from comprehensive doc
cp docs/features/jobprep/frontend_service_example.ts frontend/src/services/jobprep.ts
# Or create manually using the TypeScript code from Section 5.1
```

### Step 7: Test Basic Flow (3 min)

```bash
# Start backend
cd backend
uvicorn app.main:app --reload

# In another terminal, test the API
curl -X POST http://localhost:8000/api/v1/jobprep/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"current_status": "job_seeker", "experience_level": "mid"}'
```

## 🎯 Next Steps (Day 2+)

1. **Add AI Integration** (Section 4 of comprehensive doc)
2. **Implement Interview Simulator** (Phase 5)
3. **Add Practice Arena** (Phase 6)
4. **Build Readiness Tracker** (Phase 7)

## 📚 Full Documentation

For complete details, see:
- **[JOBPREP_COMPREHENSIVE_RESEARCH.md](./JOBPREP_COMPREHENSIVE_RESEARCH.md)** - 3,222 lines, everything you need
- **[README.md](./README.md)** - Overview and navigation

## 🆘 Troubleshooting

### Database Error
```bash
# Recreate tables
psql -U your_user -d engunity
DROP TABLE IF EXISTS jobprep_profiles CASCADE;
# Then re-run schema
```

### Import Error
```python
# Add to backend/app/models/__init__.py
from app.models.jobprep import JobPrepProfile, TargetRole, JobPrepSkill, JobPrepProject
```

### Profile Not Found
```python
# User must create profile first - it's not auto-created
# Frontend should check and prompt profile creation
```

## ✅ Success Criteria

You've successfully set up the MVP when:
- [ ] Database tables exist
- [ ] Backend returns profile data
- [ ] Can create roles and skills via API
- [ ] Frontend can fetch data (even if UI needs work)

**Estimated Time**: 30-40 minutes for basic setup, then follow the comprehensive roadmap for full features.

---

**Pro Tip**: Start with just profile + roles + skills. Get those working end-to-end before adding AI features.
