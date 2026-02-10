import os
from sqlalchemy import create_engine
from app.core.config import settings
from app.core.database import Base
from app.models.user import User
from app.models.chat import ChatSession
from app.models.document import Document, DocumentLink
from app.models.decision import Decision
from app.models.research import ResearchPaper
from app.models.code import CodeProject, CodeFile
from app.models.github import GitHubRepository
from app.models.analytics import (
    AnalyticsDataset, AnalyticsAnalysis, AnalyticsChart,
    AnalyticsDashboard, AnalyticsDashboardWidget
)
from app.models.jobprep import (
    JobPrepProfile, JobPrepTargetRole, JobPrepSkill,
    JobPrepSkillEvidence, JobPrepProject, JobPrepInterviewSimulation,
    JobPrepPracticeSession, JobPrepReadinessAssessment
)

def init_db():
    engine = create_engine(settings.DATABASE_URL)
    print(f"Initializing database at {settings.DATABASE_URL}")
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully.")

if __name__ == "__main__":
    init_db()
