from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from uuid import UUID
import json
import re
import hashlib
from datetime import datetime
from loguru import logger

from app.models.jobprep import (
    JobPrepProfile, JobPrepTargetRole, JobPrepSkill,
    JobPrepSkillEvidence, JobPrepProject, JobPrepInterviewSimulation,
    JobPrepReadinessAssessment, JobPrepPracticeSession
)
from app.schemas.jobprep import (
    JobPrepProfileCreate, JobPrepProfileUpdate,
    JobPrepTargetRoleCreate, JobPrepTargetRoleUpdate,
    JobPrepSkillCreate, JobPrepSkillUpdate,
    JobPrepProjectCreate, JobPrepProjectUpdate,
    JobPrepInterviewSimulationCreate
)
from app.services.ai.groq_client import groq_client
from app.core.mongodb import get_mongodb
from app.services.github.client import github_client

class JobPrepService:
    def __init__(self, db: Session):
        self.db = db

    # --- Profile ---
    def get_profile(self, user_id: int) -> Optional[JobPrepProfile]:
        return self.db.query(JobPrepProfile).filter(JobPrepProfile.user_id == user_id).first()

    def create_profile(self, user_id: int, profile_in: JobPrepProfileCreate) -> JobPrepProfile:
        profile = JobPrepProfile(
            user_id=user_id,
            **profile_in.model_dump()
        )
        self.db.add(profile)
        self.db.commit()
        self.db.refresh(profile)
        return profile

    def update_profile(self, user_id: int, profile_in: JobPrepProfileUpdate) -> JobPrepProfile:
        profile = self.get_profile(user_id)
        if not profile:
            raise Exception("Profile not found")

        update_data = profile_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(profile, field, value)

        self.db.commit()
        self.db.refresh(profile)
        return profile

    # --- Skills ---
    def get_skills(self, profile_id: UUID) -> List[JobPrepSkill]:
        return self.db.query(JobPrepSkill).filter(JobPrepSkill.profile_id == profile_id).all()

    def add_skill(self, profile_id: UUID, skill_in: JobPrepSkillCreate) -> JobPrepSkill:
        skill = JobPrepSkill(
            profile_id=profile_id,
            **skill_in.model_dump()
        )
        self.db.add(skill)
        self.db.commit()
        self.db.refresh(skill)
        return skill

    def update_skill(self, skill_id: UUID, skill_in: JobPrepSkillUpdate) -> JobPrepSkill:
        skill = self.db.query(JobPrepSkill).filter(JobPrepSkill.id == skill_id).first()
        if not skill:
            raise Exception("Skill not found")

        update_data = skill_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(skill, field, value)

        self.db.commit()
        self.db.refresh(skill)
        return skill

    def delete_skill(self, skill_id: UUID) -> bool:
        skill = self.db.query(JobPrepSkill).filter(JobPrepSkill.id == skill_id).first()
        if not skill:
            return False
        self.db.delete(skill)
        self.db.commit()
        return True

    # --- Roles ---
    def update_role(self, role_id: UUID, role_in: JobPrepTargetRoleUpdate) -> JobPrepTargetRole:
        role = self.db.query(JobPrepTargetRole).filter(JobPrepTargetRole.id == role_id).first()
        if not role:
            raise Exception("Role not found")

        update_data = role_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(role, field, value)

        self.db.commit()
        self.db.refresh(role)
        return role

    def delete_role(self, role_id: UUID) -> bool:
        role = self.db.query(JobPrepTargetRole).filter(JobPrepTargetRole.id == role_id).first()
        if not role:
            return False
        self.db.delete(role)
        self.db.commit()
        return True

    # --- Projects ---
    def update_project(self, project_id: UUID, project_in: JobPrepProjectUpdate) -> JobPrepProject:
        project = self.db.query(JobPrepProject).filter(JobPrepProject.id == project_id).first()
        if not project:
            raise Exception("Project not found")

        update_data = project_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(project, field, value)

        self.db.commit()
        self.db.refresh(project)
        return project

    def delete_project(self, project_id: UUID) -> bool:
        project = self.db.query(JobPrepProject).filter(JobPrepProject.id == project_id).first()
        if not project:
            return False
        self.db.delete(project)
        self.db.commit()
        return True

    async def import_github_repo(self, profile_id: UUID, owner: str, repo_name: str) -> JobPrepProject:
        repo_info = github_client.get_repository_info(owner, repo_name)

        project = JobPrepProject(
            profile_id=profile_id,
            title=repo_info["name"],
            description=repo_info["description"],
            project_type="github_repo",
            github_url=repo_info["repository_url"],
            tech_stack=[repo_info["language"]] if repo_info["language"] != "Unknown" else [],
            is_complete=True
        )

        self.db.add(project)
        self.db.commit()
        self.db.refresh(project)

        # Trigger AI Analysis immediately
        await self.analyze_project_with_ai(project.id)

        return project

    # --- AI Integration ---
    def _generate_content_hash(self, content_parts: List[str]) -> str:
        """Generate a unique hash for a set of strings to cache AI results."""
        combined = "|".join([str(p).strip().lower() for p in content_parts if p])
        return hashlib.sha256(combined.encode()).hexdigest()

    async def analyze_project_with_ai(self, project_id: UUID):
        project = self.db.query(JobPrepProject).filter(JobPrepProject.id == project_id).first()
        if not project:
            return None

        # Content hashing for caching check
        content_parts = [project.title, project.description] + (project.tech_stack or [])
        content_hash = self._generate_content_hash(content_parts)

        # Check if we already have a recent analysis for this exact content
        if project.impact_metrics and project.impact_metrics.get("content_hash") == content_hash:
            logger.info(f"Using cached AI analysis for project {project.id}")
            return project

        # Fetch target roles for relevance scoring
        roles = self.db.query(JobPrepTargetRole).filter(JobPrepTargetRole.profile_id == project.profile_id).all()
        roles_context = [{"title": r.role_title, "skills": r.required_skills} for r in roles]

        prompt = f"""
        You are an expert technical interviewer and code auditor.
        Analyze this project for its technical depth and career impact:
        Title: {project.title}
        Description: {project.description}
        Tech Stack: {project.tech_stack}

        Target Roles Context: {roles_context}

        Provide a structured analysis in JSON:
        - complexity_score (float 0-1.0)
        - innovation_score (float 0-1.0)
        - interview_value_score (float 0-1.0)
        - role_relevance_scores (dict mapping role titles to float 0-1.0)
        - talking_points (list of 5 powerful interview bullet points)
        - technical_complexity_breakdown (string summary)
        - improvement_suggestions (list of strings)

        Ensure the output is ONLY the JSON object.
        """

        try:
            response = await groq_client.get_completion([{"role": "user", "content": prompt}])
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                try:
                    analysis = json.loads(json_match.group())

                    project.complexity_score = max(0.0, min(1.0, float(analysis.get('complexity_score', 0.5))))
                    project.innovation_score = max(0.0, min(1.0, float(analysis.get('innovation_score', 0.5))))
                    project.interview_value_score = max(0.0, min(1.0, float(analysis.get('interview_value_score', 0.5))))

                    # Store relevance and breakdown in metadata
                    project.impact_metrics = {
                        "role_relevance": analysis.get('role_relevance_scores', {}),
                        "complexity_breakdown": analysis.get('technical_complexity_breakdown', ''),
                        "improvement_suggestions": analysis.get('improvement_suggestions', []),
                        "content_hash": content_hash,
                        "analyzed_at": datetime.utcnow().isoformat()
                    }

                    talking_points = analysis.get('talking_points', [])
                    if isinstance(talking_points, list):
                        project.talking_points = [str(tp)[:500] for tp in talking_points[:10]]

                    self.db.commit()
                    self.db.refresh(project)
                except (json.JSONDecodeError, ValueError, TypeError) as parse_error:
                    logger.error(f"AI JSON parsing failed: {parse_error}")
        except Exception as e:
            logger.error(f"AI Project Analysis failed: {e}")

        return project

    async def generate_interview_question(self, role_id: UUID, difficulty: str, sim_id: Optional[UUID] = None):
        role = self.db.query(JobPrepTargetRole).filter(JobPrepTargetRole.id == role_id).first()
        if not role:
             return {"error": "Role not found"}

        # Fetch simulation context if available
        sim_context = ""
        if sim_id:
            sim = self.db.query(JobPrepInterviewSimulation).filter(JobPrepInterviewSimulation.id == sim_id).first()
            if sim:
                sim_context = f"Company Style: {sim.company_style or 'General'}, Interviewer Persona: {sim.persona_style or 'Professional'}."

        # Validate difficulty
        valid_difficulties = ['entry', 'mid-level', 'mid', 'senior', 'expert']
        if difficulty not in valid_difficulties:
            difficulty = 'mid-level'

        prompt = f"""
        Generate a {difficulty} level technical interview question for a {role.role_title} position.
        The question should focus on {role.required_skills}.
        {sim_context}

        Provide the output in JSON format with:
        - question (string)
        - question_type (string: coding, system_design, behavioral, theory)
        - difficulty (string)
        - expected_concepts (list of strings)
        - hints (list of strings)
        """

        try:
            response = await groq_client.get_completion([{"role": "user", "content": prompt}])
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                try:
                    question_data = json.loads(json_match.group())
                    # Sanitize and validate
                    return {
                        "question": str(question_data.get('question', ''))[:2000],
                        "question_type": str(question_data.get('question_type', 'theory'))[:50],
                        "difficulty": difficulty,
                        "expected_concepts": [str(c)[:200] for c in question_data.get('expected_concepts', [])[:10]],
                        "hints": [str(h)[:300] for h in question_data.get('hints', [])[:5]]
                    }
                except (json.JSONDecodeError, ValueError, TypeError) as e:
                    logger.error(f"Failed to parse question JSON: {e}")
        except Exception as e:
            logger.error(f"AI Question Generation failed: {e}")

        # Fallback question
        return {
            "question": f"Explain your experience with {role.role_title} requirements and key technologies.",
            "question_type": "theory",
            "difficulty": difficulty,
            "expected_concepts": [],
            "hints": []
        }

    async def evaluate_interview_response(self, sim_id: UUID, question: str, user_response: str):
        sim = self.db.query(JobPrepInterviewSimulation).filter(JobPrepInterviewSimulation.id == sim_id).first()
        if not sim:
            return None

        # Validate inputs
        if not user_response or not user_response.strip():
            return {
                "score": 0,
                "technical_accuracy": 0,
                "communication_clarity": 0,
                "feedback": "Empty response provided",
                "suggestions": ["Please provide a detailed answer to the question"]
            }

        # Truncate if too long (prevent token overflow)
        question_truncated = question[:2000]
        response_truncated = user_response[:10000]

        prompt = f"""
        Evaluate the following interview response.
        Question: {question_truncated}
        Candidate Response: {response_truncated}

        Provide evaluation in JSON:
        - score (int 0-100)
        - technical_accuracy (int 0-100)
        - communication_clarity (int 0-100)
        - feedback (string)
        - suggestions (list of strings)
        """

        try:
            response = await groq_client.get_completion([{"role": "user", "content": prompt}])
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                try:
                    evaluation = json.loads(json_match.group())
                    
                    # Sanitize and validate scores (clamp to 0-100)
                    sanitized_eval = {
                        "score": max(0, min(100, int(evaluation.get('score', 0)))),
                        "technical_accuracy": max(0, min(100, int(evaluation.get('technical_accuracy', 0)))),
                        "communication_clarity": max(0, min(100, int(evaluation.get('communication_clarity', 0)))),
                        "feedback": str(evaluation.get('feedback', ''))[:2000],
                        "suggestions": [str(s)[:500] for s in evaluation.get('suggestions', [])[:10]]
                    }

                    # Store in MongoDB for transcript preservation
                    try:
                        mongo_db = await get_mongodb()
                        if mongo_db is not None:
                            await mongo_db.jobprep_transcripts.insert_one({
                                "simulation_id": str(sim_id),
                                "question": question_truncated,
                                "response": response_truncated,
                                "evaluation": sanitized_eval,
                                "timestamp": datetime.utcnow()
                            })
                    except Exception as mongo_error:
                        logger.warning(f"MongoDB storage failed: {mongo_error}")

                    # Update simulation scores in PostgreSQL
                    sim.overall_score = sanitized_eval['score']
                    sim.technical_score = sanitized_eval['technical_accuracy']
                    sim.communication_score = sanitized_eval['communication_clarity']
                    sim.completed_at = datetime.utcnow()
                    sim.hiring_decision = "hire" if sim.overall_score > 70 else "no_hire"

                    self.db.commit()
                    self.db.refresh(sim)

                    # Trigger Readiness Update
                    await self.recalculate_readiness(sim.profile_id)

                    return sanitized_eval
                except (json.JSONDecodeError, ValueError, TypeError) as parse_error:
                    logger.error(f"Failed to parse evaluation JSON: {parse_error}. Response: {response[:200]}")
        except Exception as e:
            logger.error(f"AI Interview Evaluation failed: {e}")

        # Return fallback evaluation
        return {
            "score": 50,
            "technical_accuracy": 50,
            "communication_clarity": 50,
            "feedback": "Evaluation temporarily unavailable. Please try again.",
            "suggestions": ["Consider retrying the evaluation"]
        }

    # --- Role Analysis ---
    async def analyze_role_requirements(self, role_id: UUID) -> Dict[str, Any]:
        role = self.db.query(JobPrepTargetRole).filter(JobPrepTargetRole.id == role_id).first()
        if not role:
            return {"error": "Role not found"}

        # Caching check for roles
        content_parts = [role.role_title, role.role_category, role.seniority_level]
        content_hash = self._generate_content_hash(content_parts)

        if role.interview_pattern and role.interview_pattern.get("content_hash") == content_hash:
            logger.info(f"Using cached AI analysis for role {role.id}")
            return {
                "typical_interview_rounds": role.typical_interview_rounds,
                "recommended_skills": role.required_skills,
                "market_demand_description": role.market_demand_description,
                "suggested_salary_range": role.suggested_salary_range,
                "preparation_focus_areas": role.preparation_focus_areas
            }

        prompt = f"""
        You are an expert technical recruiter. Analyze the requirements for this role:
        Role: {role.role_title}
        Category: {role.role_category}
        Seniority: {role.seniority_level}

        Provide a structured analysis in JSON:
        - typical_interview_rounds (list of strings)
        - recommended_skills (list of strings)
        - market_demand_description (string)
        - suggested_salary_range (string)
        - preparation_focus_areas (list of strings)
        """

        try:
            response = await groq_client.get_completion([{"role": "user", "content": prompt}])
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                try:
                    analysis = json.loads(json_match.group())
                    
                    # Sanitize and validate before storing
                    rounds = analysis.get('typical_interview_rounds', [])
                    role.typical_interview_rounds = [str(r)[:200] for r in rounds[:20]] if isinstance(rounds, list) else []
                    
                    skills = analysis.get('recommended_skills', [])
                    role.required_skills = [str(s)[:100] for s in skills[:50]] if isinstance(skills, list) else []
                    
                    role.market_demand_description = str(analysis.get('market_demand_description', ''))[:2000]
                    role.suggested_salary_range = str(analysis.get('suggested_salary_range', ''))[:100]
                    
                    focus = analysis.get('preparation_focus_areas', [])
                    role.preparation_focus_areas = [str(f)[:100] for f in focus[:30]] if isinstance(focus, list) else []

                    role.interview_pattern = {
                        "content_hash": content_hash,
                        "analyzed_at": datetime.utcnow().isoformat()
                    }

                    self.db.commit()
                    return {
                        "typical_interview_rounds": role.typical_interview_rounds,
                        "recommended_skills": role.required_skills,
                        "market_demand_description": role.market_demand_description,
                        "suggested_salary_range": role.suggested_salary_range,
                        "preparation_focus_areas": role.preparation_focus_areas
                    }
                except (json.JSONDecodeError, ValueError, TypeError) as e:
                    logger.error(f"Role analysis JSON parse error: {e}")
        except Exception as e:
            logger.error(f"Role Analysis failed: {e}")

        return {"status": "AI analysis unavailable", "error": "Could not generate analysis"}

    # --- Skill Evidence ---
    def get_skill_evidence(self, skill_id: UUID) -> List[JobPrepSkillEvidence]:
        return self.db.query(JobPrepSkillEvidence).filter(JobPrepSkillEvidence.skill_id == skill_id).all()

    def add_skill_evidence(self, profile_id: UUID, skill_id: UUID, evidence_in: Any) -> JobPrepSkillEvidence:
        # Verify the skill exists and belongs to this profile
        skill = self.db.query(JobPrepSkill).filter(
            JobPrepSkill.id == skill_id,
            JobPrepSkill.profile_id == profile_id
        ).first()
        
        if not skill:
            raise Exception("Skill not found or does not belong to this profile")
        
        # Create evidence with explicit skill_id and profile_id (not from schema)
        evidence = JobPrepSkillEvidence(
            profile_id=profile_id,
            skill_id=skill_id,
            **evidence_in.model_dump()
        )
        self.db.add(evidence)

        # Increment evidence count on skill
        skill.evidence_count = (skill.evidence_count or 0) + 1

        self.db.commit()
        self.db.refresh(evidence)
        return evidence

    def delete_skill_evidence(self, evidence_id: UUID) -> bool:
        evidence = self.db.query(JobPrepSkillEvidence).filter(JobPrepSkillEvidence.id == evidence_id).first()
        if not evidence:
            return False

        skill = self.db.query(JobPrepSkill).filter(JobPrepSkill.id == evidence.skill_id).first()
        if skill:
            skill.evidence_count = max(0, (skill.evidence_count or 1) - 1)

        self.db.delete(evidence)
        self.db.commit()
        return True

    # --- Practice Evaluation ---
    async def evaluate_practice_attempt(self, profile_id: UUID, topic: str, user_answer: str, practice_type: str = "conceptual", difficulty: str = "medium"):
        # Validate inputs
        if not user_answer or not user_answer.strip():
            return {
                "score": 0,
                "feedback": "Empty answer provided",
                "suggestions": ["Please provide an answer to evaluate"],
                "concepts_mastered": []
            }

        # Truncate to prevent token overflow
        topic_truncated = topic[:500]
        answer_truncated = user_answer[:10000]

        prompt = f"""
        Evaluate this {difficulty} difficulty {practice_type} practice attempt for the topic: {topic_truncated}
        User Answer: {answer_truncated}

        Provide feedback in JSON:
        - score (0-100)
        - feedback (string)
        - suggestions (list of strings)
        - concepts_mastered (list of strings)
        """

        try:
            response = await groq_client.get_completion([{"role": "user", "content": prompt}])
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                try:
                    evaluation = json.loads(json_match.group())

                    # Sanitize and validate
                    sanitized_eval = {
                        "score": max(0, min(100, int(evaluation.get('score', 0)))),
                        "feedback": str(evaluation.get('feedback', ''))[:2000],
                        "suggestions": [str(s)[:500] for s in evaluation.get('suggestions', [])[:10]],
                        "concepts_mastered": [str(c)[:200] for c in evaluation.get('concepts_mastered', [])[:20]]
                    }

                    # Save session in PostgreSQL
                    session = JobPrepPracticeSession(
                        profile_id=profile_id,
                        practice_type=practice_type,
                        topic=topic_truncated,
                        difficulty=difficulty,
                        score=sanitized_eval['score'],
                        ai_feedback=sanitized_eval['feedback'],
                        completed=True,
                        started_at=datetime.utcnow(),
                        completed_at=datetime.utcnow()
                    )
                    self.db.add(session)
                    self.db.commit()

                    # Trigger Readiness Update
                    await self.recalculate_readiness(profile_id)

                    return sanitized_eval
                except (json.JSONDecodeError, ValueError, TypeError) as e:
                    logger.error(f"Practice evaluation JSON parse error: {e}")
        except Exception as e:
            logger.error(f"Practice Evaluation failed: {e}")

        # Return fallback
        return {
            "score": 50,
            "feedback": "Evaluation temporarily unavailable. Please try again.",
            "suggestions": ["Retry the evaluation"],
            "concepts_mastered": []
        }

    async def recalculate_readiness(self, profile_id: UUID):
        profile = self.db.query(JobPrepProfile).filter(JobPrepProfile.id == profile_id).first()
        if not profile:
            return

        # Fetch common data
        skills = self.db.query(JobPrepSkill).filter(JobPrepSkill.profile_id == profile_id).all()
        projects = self.db.query(JobPrepProject).filter(JobPrepProject.profile_id == profile_id).all()
        sims = self.db.query(JobPrepInterviewSimulation).filter(JobPrepInterviewSimulation.profile_id == profile_id).all()

        # Overall profile readiness
        skill_score_overall = (sum([s.current_level for s in skills]) / (len(skills) * 5)) * 100 if skills else 0
        proj_score_overall = (sum([float(p.interview_value_score or 0) for p in projects]) / len(projects)) * 100 if projects else 0
        sim_score_overall = sum([s.overall_score for s in sims if s.overall_score]) / len(sims) if sims else 0

        weighted_score_overall = int((sim_score_overall * 0.4) + (skill_score_overall * 0.3) + (proj_score_overall * 0.2) + 10)
        profile.overall_readiness_score = min(weighted_score_overall, 100)
        profile.last_assessment_date = datetime.utcnow()

        # Role-specific readiness
        for role in profile.target_roles:
            required = [s.lower() for s in (role.required_skills or [])]
            if not required:
                role.readiness_score = profile.overall_readiness_score
                continue

            # Filter skills relevant to this role
            relevant_skills = [s for s in skills if s.skill_name.lower() in required]
            role_skill_score = (sum([s.current_level for s in relevant_skills]) / (len(required) * 5)) * 100 if required else 0

            # Filter simulations relevant to this role
            role_sims = [s for s in sims if s.target_role_id == role.id]
            role_sim_score = sum([s.overall_score for s in role_sims if s.overall_score]) / len(role_sims) if role_sims else sim_score_overall

            # Weighted Role Score
            role_weighted = int((role_sim_score * 0.5) + (role_skill_score * 0.4) + (proj_score_overall * 0.1))
            role.readiness_score = min(role_weighted, 100)

        self.db.commit()

        # Create an assessment record
        assessment = JobPrepReadinessAssessment(
            profile_id=profile_id,
            overall_readiness_score=profile.overall_readiness_score,
            technical_skills_score=int(skill_score_overall),
            assessment_type="automatic",
            assessed_at=datetime.utcnow()
        )
        self.db.add(assessment)
        self.db.commit()

    async def analyze_skill_gaps(self, profile_id: UUID):
        profile = self.db.query(JobPrepProfile).filter(JobPrepProfile.id == profile_id).first()
        roles = profile.target_roles
        current_skills = {s.skill_name.lower(): s for s in profile.skills}

        gaps = []
        for role in roles:
            if role.is_active:
                required = role.required_skills or []
                for skill_name in required:
                    if skill_name.lower() not in current_skills:
                        gaps.append({
                            "role": role.role_title,
                            "skill": skill_name,
                            "type": "missing"
                        })
                    elif current_skills[skill_name.lower()].current_level < 3:
                        gaps.append({
                            "role": role.role_title,
                            "skill": skill_name,
                            "type": "low_level",
                            "current": current_skills[skill_name.lower()].current_level
                        })

        return gaps

    # --- New Advanced Features ---
    async def generate_role_curriculum(self, role_id: UUID) -> List[Dict[str, Any]]:
        role = self.db.query(JobPrepTargetRole).filter(JobPrepTargetRole.id == role_id).first()
        if not role:
            return []

        prompt = f"""
        Generate a 4-week preparation curriculum for a {role.role_title} position.
        Required Skills: {role.required_skills}
        Focus Areas: {role.preparation_focus_areas}

        Provide a structured weekly plan in JSON format:
        [
          {{
            "week": 1,
            "theme": "string",
            "topics": ["string"],
            "recommended_projects": ["string"],
            "success_criteria": "string"
          }},
          ...
        ]
        """

        try:
            response = await groq_client.get_completion([{"role": "user", "content": prompt}])
            json_match = re.search(r'\[.*\]', response, re.DOTALL)
            if json_match:
                try:
                    curriculum = json.loads(json_match.group())
                    if isinstance(curriculum, list):
                        role.role_curriculum = curriculum
                        self.db.commit()
                        return curriculum
                except json.JSONDecodeError:
                    logger.error(f"Failed to parse curriculum JSON: {response[:200]}")
        except Exception as e:
            logger.error(f"Failed to generate curriculum: {e}")

        return []

    async def evaluate_evidence_quality(self, evidence_id: UUID) -> Dict[str, Any]:
        evidence = self.db.query(JobPrepSkillEvidence).filter(JobPrepSkillEvidence.id == evidence_id).first()
        if not evidence:
            return {"error": "Evidence not found"}

        prompt = f"""
        Evaluate the quality and relevance of this career skill evidence:
        Title: {evidence.title}
        Type: {evidence.evidence_type}
        Description: {evidence.description}
        URL: {evidence.source_url}

        Provide a quality assessment in JSON format:
        - quality_score (float 0-1.0)
        - impact_level (string: high, medium, low)
        - strengths (list of strings)
        - improvements (list of strings)
        - verification_suggestion (string)
        """

        try:
            response = await groq_client.get_completion([{"role": "user", "content": prompt}])
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                try:
                    analysis = json.loads(json_match.group())
                    evidence.quality_score = max(0.0, min(1.0, float(analysis.get('quality_score', 0.5))))
                    evidence.impact_level = str(analysis.get('impact_level', 'medium'))[:50]
                    evidence.verified = True if evidence.quality_score > 0.8 else False

                    self.db.commit()
                    return analysis
                except (json.JSONDecodeError, ValueError, TypeError):
                    logger.error(f"Failed to parse evidence quality JSON: {response[:200]}")
        except Exception as e:
            logger.error(f"Failed to evaluate evidence: {e}")

        return {"error": "Evaluation failed"}

    def get_readiness_forecast(self, profile_id: UUID) -> Dict[str, Any]:
        history = self.db.query(JobPrepReadinessAssessment).filter(
            JobPrepReadinessAssessment.profile_id == profile_id
        ).order_by(JobPrepReadinessAssessment.assessed_at.asc()).all()

        if len(history) < 2:
            return {
                "current_score": history[-1].overall_readiness_score if history else 0,
                "projected_score_30d": history[-1].overall_readiness_score if history else 0,
                "velocity": 0,
                "confidence": "low"
            }

        # Simple linear projection
        first = history[0]
        last = history[-1]
        days = (last.assessed_at - first.assessed_at).days or 1
        velocity = (last.overall_readiness_score - first.overall_readiness_score) / days

        projected = min(100, last.overall_readiness_score + (velocity * 30))

        return {
            "current_score": last.overall_readiness_score,
            "projected_score_30d": int(projected),
            "velocity": round(velocity, 2),
            "confidence": "medium" if len(history) > 5 else "low"
        }
