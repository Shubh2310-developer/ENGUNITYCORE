# Job Prep Feature - Comprehensive End-to-End Research & Implementation Guide

**Document Version:** 1.0  
**Last Updated:** February 5, 2026  
**Status:** Complete Research & Architecture Design  
**Target:** Production-Ready Implementation

---

## Executive Summary

This document provides a complete end-to-end research and implementation guide for making the Job Prep feature fully functional in the Engunity platform. The Job Prep feature is currently a frontend-only mock implementation that needs a complete backend infrastructure, database layer, AI integration, and service architecture.

### Current State Analysis
- ✅ **Frontend**: 987 lines of React/TypeScript with full UI implementation
- ❌ **Backend**: No API endpoints exist
- ❌ **Database**: No schema or models defined
- ❌ **Services**: No business logic layer
- ❌ **AI Integration**: No AI-powered features implemented
- ❌ **Authentication**: Not integrated with existing auth flow

### Implementation Scope
This research covers:
1. Complete database schema design (PostgreSQL + MongoDB)
2. Backend API architecture and endpoints
3. AI/ML service integration for intelligent features
4. Frontend service layer and state management
5. Authentication and authorization flow
6. Testing strategy and deployment plan
7. Step-by-step implementation roadmap

---

## Table of Contents

1. [System Architecture Overview](#1-system-architecture-overview)
2. [Database Schema Design](#2-database-schema-design)
3. [Backend API Architecture](#3-backend-api-architecture)
4. [AI/ML Integration Points](#4-aiml-integration-points)
5. [Frontend Service Layer](#5-frontend-service-layer)
6. [Authentication & Authorization](#6-authentication--authorization)
7. [Data Flow Diagrams](#7-data-flow-diagrams)
8. [Implementation Roadmap](#8-implementation-roadmap)
9. [Testing Strategy](#9-testing-strategy)
10. [Performance Considerations](#10-performance-considerations)
11. [Security Considerations](#11-security-considerations)
12. [Future Enhancements](#12-future-enhancements)

---

## 1. System Architecture Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ JobPrep UI   │  │ State Store  │  │ Service Layer│         │
│  │ (React/Next) │──│   (Zustand)  │──│  (TypeScript)│         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTP/REST API
                               │
┌──────────────────────────────┴──────────────────────────────────┐
│                      Backend Layer (FastAPI)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ API Routes   │  │  Services    │  │  AI Router   │         │
│  │ /jobprep/*   │──│  Business    │──│  (Groq/      │         │
│  │              │  │  Logic       │  │   Gemini)    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└──────────────────────────────┬──────────────────────────────────┘
                               │
              ┌────────────────┴────────────────┐
              │                                  │
┌─────────────┴──────────┐        ┌────────────┴─────────────┐
│   PostgreSQL (Relational)│        │   MongoDB (Documents)    │
│   - User profiles        │        │   - Interview sessions   │
│   - Target roles         │        │   - Practice attempts    │
│   - Skill assessments    │        │   - AI feedback logs     │
│   - Projects             │        │   - Chat transcripts     │
└──────────────────────────┘        └──────────────────────────┘
```

### 1.2 Feature Components

The Job Prep feature consists of 7 main modules:

1. **Role Intelligence**: Market analysis and role requirements
2. **Skill Matrix**: Evidence-based skill tracking
3. **Practice Arena**: Coding and conceptual challenges
4. **Interview Simulator**: AI-powered mock interviews
5. **Project Proof**: GitHub integration and project analysis
6. **Readiness Tracker**: Progress monitoring and gap analysis
7. **Placement Mode**: High-pressure evaluation mode

### 1.3 Technology Stack

**Frontend:**
- Next.js 14 (App Router)
- TypeScript
- Zustand (State Management)
- Framer Motion (Animations)
- TailwindCSS + Custom CSS Modules

**Backend:**
- FastAPI (Python 3.10+)
- SQLAlchemy (ORM)
- Pydantic (Validation)
- PyMongo (MongoDB Client)

**AI Services:**
- Groq (LLaMA 3.1 for fast inference)
- Gemini Flash (Vision capabilities)
- Custom RAG pipeline

**Databases:**
- PostgreSQL (Structured data)
- MongoDB (Unstructured/session data)
- Redis (Caching)

---

## 2. Database Schema Design

### 2.1 PostgreSQL Schema

#### 2.1.1 Core Tables

**Table: `jobprep_profiles`**
```sql
CREATE TABLE jobprep_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Career Path
    current_status VARCHAR(50), -- 'student', 'job_seeker', 'career_change', 'upskilling'
    target_timeline VARCHAR(50), -- 'immediate', '1-3_months', '3-6_months', '6+_months'
    experience_level VARCHAR(50), -- 'entry', 'mid', 'senior', 'staff'
    
    -- Preferences
    preferred_companies JSONB DEFAULT '[]',
    work_authorization VARCHAR(50),
    remote_preference VARCHAR(50),
    
    -- Metrics
    overall_readiness_score INTEGER DEFAULT 0,
    last_assessment_date TIMESTAMP,
    
    -- Settings
    placement_mode_enabled BOOLEAN DEFAULT FALSE,
    notifications_enabled BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(user_id)
);

CREATE INDEX idx_jobprep_profiles_user ON jobprep_profiles(user_id);
```

**Table: `jobprep_target_roles`**
```sql
CREATE TABLE jobprep_target_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES jobprep_profiles(id) ON DELETE CASCADE,
    
    role_title VARCHAR(200) NOT NULL,
    role_category VARCHAR(100),
    seniority_level VARCHAR(50),
    
    market_demand VARCHAR(50),
    salary_range_min INTEGER,
    salary_range_max INTEGER,
    
    required_skills JSONB DEFAULT '[]',
    nice_to_have_skills JSONB DEFAULT '[]',
    typical_interview_rounds JSONB DEFAULT '[]',
    
    readiness_score INTEGER DEFAULT 0,
    confidence_level VARCHAR(50) DEFAULT 'low',
    
    is_primary BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_target_roles_profile ON jobprep_target_roles(profile_id);
```

**Table: `jobprep_skills`**
```sql
CREATE TABLE jobprep_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES jobprep_profiles(id) ON DELETE CASCADE,
    
    skill_name VARCHAR(200) NOT NULL,
    skill_category VARCHAR(100) NOT NULL,
    skill_subcategory VARCHAR(100),
    
    current_level INTEGER DEFAULT 0,
    target_level INTEGER,
    
    evidence_count INTEGER DEFAULT 0,
    evidence_target INTEGER,
    evidence_strength DECIMAL(3,2) DEFAULT 0.00,
    
    practice_attempts INTEGER DEFAULT 0,
    last_practiced_at TIMESTAMP,
    
    is_critical BOOLEAN DEFAULT FALSE,
    is_gap BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(profile_id, skill_name)
);

CREATE INDEX idx_skills_profile ON jobprep_skills(profile_id);
CREATE INDEX idx_skills_gap ON jobprep_skills(is_gap) WHERE is_gap = TRUE;
```

**Table: `jobprep_skill_evidence`**
```sql
CREATE TABLE jobprep_skill_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_id UUID NOT NULL REFERENCES jobprep_skills(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES jobprep_profiles(id) ON DELETE CASCADE,
    
    evidence_type VARCHAR(50) NOT NULL,
    title VARCHAR(300) NOT NULL,
    description TEXT,
    
    source_url TEXT,
    source_type VARCHAR(50),
    
    verified BOOLEAN DEFAULT FALSE,
    verification_method VARCHAR(100),
    
    relevance_score DECIMAL(3,2) DEFAULT 0.50,
    impact_level VARCHAR(50),
    
    evidence_metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_evidence_skill ON jobprep_skill_evidence(skill_id);
CREATE INDEX idx_evidence_profile ON jobprep_skill_evidence(profile_id);
```

**Table: `jobprep_projects`**
```sql
CREATE TABLE jobprep_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES jobprep_profiles(id) ON DELETE CASCADE,
    
    title VARCHAR(300) NOT NULL,
    description TEXT,
    project_type VARCHAR(50),
    
    github_url TEXT,
    live_demo_url TEXT,
    documentation_url TEXT,
    
    tech_stack JSONB DEFAULT '[]',
    key_features JSONB DEFAULT '[]',
    challenges_solved JSONB DEFAULT '[]',
    
    lines_of_code INTEGER,
    commit_count INTEGER,
    complexity_score DECIMAL(3,2),
    innovation_score DECIMAL(3,2),
    interview_value_score DECIMAL(3,2),
    talking_points JSONB,
    
    impact_metrics JSONB,
    
    is_featured BOOLEAN DEFAULT FALSE,
    is_complete BOOLEAN DEFAULT TRUE,
    completion_date DATE,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_projects_profile ON jobprep_projects(profile_id);
```

**Table: `jobprep_interview_simulations`**
```sql
CREATE TABLE jobprep_interview_simulations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES jobprep_profiles(id) ON DELETE CASCADE,
    target_role_id UUID REFERENCES jobprep_target_roles(id) ON DELETE SET NULL,
    
    simulation_type VARCHAR(50) NOT NULL,
    difficulty_level VARCHAR(50) NOT NULL,
    company_style VARCHAR(100),
    
    duration_minutes INTEGER,
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    
    overall_score INTEGER,
    technical_score INTEGER,
    communication_score INTEGER,
    problem_solving_score INTEGER,
    
    hiring_decision VARCHAR(50),
    interviewer_feedback TEXT,
    
    strengths JSONB,
    weaknesses JSONB,
    improvement_recommendations JSONB,
    
    placement_mode BOOLEAN DEFAULT FALSE,
    session_document_id VARCHAR(100),
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_simulations_profile ON jobprep_interview_simulations(profile_id);
CREATE INDEX idx_simulations_date ON jobprep_interview_simulations(started_at DESC);
```

**Table: `jobprep_practice_sessions`**
```sql
CREATE TABLE jobprep_practice_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES jobprep_profiles(id) ON DELETE CASCADE,
    skill_id UUID REFERENCES jobprep_skills(id) ON DELETE SET NULL,
    
    practice_type VARCHAR(50) NOT NULL,
    topic VARCHAR(200) NOT NULL,
    difficulty VARCHAR(50),
    
    score INTEGER,
    time_spent_seconds INTEGER,
    attempts_count INTEGER DEFAULT 1,
    
    completed BOOLEAN DEFAULT FALSE,
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    
    ai_feedback TEXT,
    hint_used_count INTEGER DEFAULT 0,
    session_document_id VARCHAR(100),
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_practice_profile ON jobprep_practice_sessions(profile_id);
CREATE INDEX idx_practice_date ON jobprep_practice_sessions(started_at DESC);
```

**Table: `jobprep_readiness_assessments`**
```sql
CREATE TABLE jobprep_readiness_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES jobprep_profiles(id) ON DELETE CASCADE,
    target_role_id UUID REFERENCES jobprep_target_roles(id) ON DELETE SET NULL,
    
    overall_readiness_score INTEGER NOT NULL,
    readiness_level VARCHAR(50),
    
    technical_skills_score INTEGER,
    communication_skills_score INTEGER,
    problem_solving_score INTEGER,
    domain_knowledge_score INTEGER,
    
    critical_gaps JSONB,
    recommended_actions JSONB,
    estimated_time_to_ready_days INTEGER,
    
    interview_success_probability DECIMAL(3,2),
    
    assessment_type VARCHAR(50) DEFAULT 'automatic',
    assessed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_assessments_profile ON jobprep_readiness_assessments(profile_id);
CREATE INDEX idx_assessments_date ON jobprep_readiness_assessments(assessed_at DESC);
```


### 2.2 MongoDB Collections

MongoDB is used for storing unstructured session data, transcripts, and AI interactions.

#### Collection: `jobprep_interview_sessions`
```javascript
{
  _id: ObjectId,
  simulation_id: String, // Reference to PostgreSQL
  profile_id: String,
  user_id: Number,
  
  // Session Configuration
  config: {
    simulation_type: String,
    difficulty: String,
    company_style: String,
    time_limit_minutes: Number,
    placement_mode: Boolean
  },
  
  // Interview Content
  questions: [
    {
      question_id: String,
      question_text: String,
      question_type: String, // 'coding', 'system_design', 'behavioral', 'theory'
      difficulty: String,
      asked_at: ISODate,
      
      // User Response
      response: {
        text: String,
        code: String, // if coding question
        time_taken_seconds: Number,
        revisions_count: Number
      },
      
      // AI Evaluation
      evaluation: {
        correctness_score: Number, // 0-100
        efficiency_score: Number,
        clarity_score: Number,
        completeness_score: Number,
        feedback: String,
        suggestions: [String]
      }
    }
  ],
  
  // Conversation Transcript
  transcript: [
    {
      timestamp: ISODate,
      speaker: String, // 'interviewer', 'candidate'
      message: String,
      message_type: String, // 'question', 'answer', 'clarification', 'hint'
    }
  ],
  
  // Real-time Metrics
  metrics: {
    response_times: [Number], // milliseconds for each response
    pause_durations: [Number],
    code_execution_attempts: Number,
    hints_requested: Number,
    questions_asked: Number
  },
  
  // Session Metadata
  started_at: ISODate,
  completed_at: ISODate,
  duration_seconds: Number,
  status: String, // 'in_progress', 'completed', 'abandoned'
  
  created_at: ISODate,
  updated_at: ISODate
}
```

#### Collection: `jobprep_practice_attempts`
```javascript
{
  _id: ObjectId,
  session_id: String, // Reference to PostgreSQL
  profile_id: String,
  skill_id: String,
  
  // Challenge Details
  challenge: {
    type: String, // 'concept_stress', 'technical_problem', 'explain_why'
    title: String,
    description: String,
    difficulty: String,
    expected_duration_minutes: Number
  },
  
  // User Attempt
  attempt: {
    started_at: ISODate,
    completed_at: ISODate,
    solution: String,
    approach_explanation: String,
    code: String, // if applicable
    
    // Interaction Log
    actions: [
      {
        timestamp: ISODate,
        action_type: String, // 'hint_requested', 'test_run', 'submission'
        details: Object
      }
    ]
  },
  
  // AI Feedback
  feedback: {
    overall_assessment: String,
    correctness: Number, // 0-100
    efficiency: Number,
    clarity: Number,
    
    strengths: [String],
    areas_for_improvement: [String],
    follow_up_recommendations: [String],
    
    generated_at: ISODate
  },
  
  created_at: ISODate
}
```

#### Collection: `jobprep_ai_interactions`
```javascript
{
  _id: ObjectId,
  user_id: Number,
  profile_id: String,
  
  interaction_type: String, // 'skill_analysis', 'project_analysis', 'readiness_assessment'
  
  // Input Context
  input: {
    context_type: String,
    data: Object, // Flexible based on interaction type
    timestamp: ISODate
  },
  
  // AI Processing
  processing: {
    model: String, // 'groq-llama3', 'gemini-flash'
    prompt_tokens: Number,
    completion_tokens: Number,
    processing_time_ms: Number
  },
  
  // Output
  output: {
    result: Object,
    confidence_score: Number,
    generated_at: ISODate
  },
  
  created_at: ISODate
}
```

---

## 3. Backend API Architecture

### 3.1 API Endpoints Structure

**Base Path:** `/api/v1/jobprep`

#### 3.1.1 Profile Management

```
GET    /api/v1/jobprep/profile
POST   /api/v1/jobprep/profile
PATCH  /api/v1/jobprep/profile
DELETE /api/v1/jobprep/profile
```

#### 3.1.2 Target Roles

```
GET    /api/v1/jobprep/roles                    # Get all target roles
POST   /api/v1/jobprep/roles                    # Add target role
GET    /api/v1/jobprep/roles/{role_id}          # Get specific role
PATCH  /api/v1/jobprep/roles/{role_id}          # Update role
DELETE /api/v1/jobprep/roles/{role_id}          # Delete role
POST   /api/v1/jobprep/roles/{role_id}/analyze  # AI analysis of role requirements
GET    /api/v1/jobprep/roles/search             # Search available roles
```

#### 3.1.3 Skills Management

```
GET    /api/v1/jobprep/skills                   # Get all skills
POST   /api/v1/jobprep/skills                   # Add skill
PATCH  /api/v1/jobprep/skills/{skill_id}        # Update skill
DELETE /api/v1/jobprep/skills/{skill_id}        # Delete skill
GET    /api/v1/jobprep/skills/gaps              # Get skill gaps
POST   /api/v1/jobprep/skills/bulk-import       # Import from resume/profile
```

#### 3.1.4 Evidence Management

```
GET    /api/v1/jobprep/evidence                      # Get all evidence
POST   /api/v1/jobprep/evidence                      # Add evidence
GET    /api/v1/jobprep/evidence/skill/{skill_id}    # Get evidence for skill
DELETE /api/v1/jobprep/evidence/{evidence_id}       # Delete evidence
POST   /api/v1/jobprep/evidence/validate            # AI validation
```

#### 3.1.5 Projects

```
GET    /api/v1/jobprep/projects                      # Get all projects
POST   /api/v1/jobprep/projects                      # Add project
GET    /api/v1/jobprep/projects/{project_id}         # Get project details
PATCH  /api/v1/jobprep/projects/{project_id}         # Update project
DELETE /api/v1/jobprep/projects/{project_id}         # Delete project
POST   /api/v1/jobprep/projects/import-github        # Import from GitHub
POST   /api/v1/jobprep/projects/{project_id}/analyze # AI analysis
POST   /api/v1/jobprep/projects/{project_id}/talking-points # Generate talking points
```

#### 3.1.6 Interview Simulator

```
GET    /api/v1/jobprep/simulations                   # Get simulation history
POST   /api/v1/jobprep/simulations/start             # Start new simulation
GET    /api/v1/jobprep/simulations/{sim_id}          # Get simulation details
POST   /api/v1/jobprep/simulations/{sim_id}/submit   # Submit response
POST   /api/v1/jobprep/simulations/{sim_id}/complete # Complete simulation
GET    /api/v1/jobprep/simulations/{sim_id}/report   # Get detailed report
POST   /api/v1/jobprep/simulations/{sim_id}/feedback # Get AI feedback
```

#### 3.1.7 Practice Arena

```
GET    /api/v1/jobprep/practice/challenges          # Get available challenges
POST   /api/v1/jobprep/practice/start               # Start practice session
POST   /api/v1/jobprep/practice/{session_id}/submit # Submit solution
GET    /api/v1/jobprep/practice/history             # Get practice history
POST   /api/v1/jobprep/practice/{session_id}/hint   # Request hint
```

#### 3.1.8 Readiness Tracker

```
GET    /api/v1/jobprep/readiness                    # Get current readiness
POST   /api/v1/jobprep/readiness/assess             # Trigger assessment
GET    /api/v1/jobprep/readiness/history            # Get assessment history
GET    /api/v1/jobprep/readiness/gaps               # Get identified gaps
GET    /api/v1/jobprep/readiness/recommendations    # Get recommendations
```

#### 3.1.9 Placement Mode

```
POST   /api/v1/jobprep/placement/enable             # Enable placement mode
POST   /api/v1/jobprep/placement/disable            # Disable placement mode
POST   /api/v1/jobprep/placement/session            # Start placement session
GET    /api/v1/jobprep/placement/leaderboard        # Get leaderboard (optional)
```

### 3.2 Backend File Structure

```
backend/app/
├── api/v1/
│   └── jobprep.py                    # Main API routes
├── models/
│   ├── jobprep.py                    # SQLAlchemy models
│   └── __init__.py
├── schemas/
│   ├── jobprep.py                    # Pydantic schemas
│   └── __init__.py
├── services/
│   └── jobprep/
│       ├── __init__.py
│       ├── profile_service.py        # Profile management
│       ├── role_service.py           # Role intelligence
│       ├── skill_service.py          # Skills tracking
│       ├── project_service.py        # Project analysis
│       ├── simulation_service.py     # Interview simulations
│       ├── practice_service.py       # Practice arena
│       ├── assessment_service.py     # Readiness assessments
│       └── ai_integration.py         # AI/ML integration layer
└── ...
```

### 3.3 Key Service Layer Functions

#### Profile Service
```python
# backend/app/services/jobprep/profile_service.py

class JobPrepProfileService:
    async def create_profile(user_id: int, profile_data: dict) -> JobPrepProfile
    async def get_profile(user_id: int) -> JobPrepProfile
    async def update_profile(user_id: int, updates: dict) -> JobPrepProfile
    async def delete_profile(user_id: int) -> bool
    async def calculate_readiness(profile_id: str) -> dict
```

#### Role Service
```python
# backend/app/services/jobprep/role_service.py

class RoleService:
    async def add_target_role(profile_id: str, role_data: dict) -> TargetRole
    async def get_roles(profile_id: str) -> List[TargetRole]
    async def analyze_role_requirements(role_id: str) -> dict
    async def calculate_role_readiness(profile_id: str, role_id: str) -> float
    async def search_roles(query: str, filters: dict) -> List[dict]
```

#### AI Integration Service
```python
# backend/app/services/jobprep/ai_integration.py

class JobPrepAIService:
    async def analyze_project(project_data: dict) -> dict
    async def generate_talking_points(project: dict) -> List[str]
    async def evaluate_interview_response(question: str, response: str) -> dict
    async def generate_interview_question(role: str, difficulty: str) -> dict
    async def assess_skill_level(skill: str, evidence: List[dict]) -> float
    async def recommend_next_steps(profile: dict) -> List[dict]
```


---

## 4. AI/ML Integration Points

### 4.1 AI Service Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Job Prep AI Layer                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────┐      ┌──────────────────┐           │
│  │  Interview AI    │      │  Assessment AI   │           │
│  │  - Question Gen  │      │  - Skill Eval    │           │
│  │  - Response Eval │      │  - Gap Analysis  │           │
│  │  - Feedback      │      │  - Readiness     │           │
│  └────────┬─────────┘      └────────┬─────────┘           │
│           │                         │                      │
│  ┌────────┴─────────────────────────┴─────────┐           │
│  │         AI Router (Existing)                │           │
│  │  - Groq (Fast Inference)                    │           │
│  │  - Gemini (Vision, if needed)               │           │
│  │  - RAG Pipeline (Context Enhancement)       │           │
│  └─────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 AI-Powered Features

#### 4.2.1 Project Analysis
```python
# Input: GitHub repository or manual project data
# Output: Structured analysis with interview value

analysis = {
    "complexity_score": 0.85,  # 0-1 scale
    "innovation_score": 0.72,
    "interview_value_score": 0.88,
    
    "key_strengths": [
        "Production-grade architecture",
        "Scalability considerations",
        "Comprehensive testing"
    ],
    
    "talking_points": [
        {
            "topic": "Architecture Decision",
            "talking_point": "I chose microservices over monolith because...",
            "expected_follow_up": ["How did you handle inter-service communication?"]
        }
    ],
    
    "skill_evidence": [
        {"skill": "System Design", "strength": 0.9},
        {"skill": "Python", "strength": 0.85}
    ]
}
```

#### 4.2.2 Interview Question Generation
```python
# Context-aware question generation based on role and user profile

question = {
    "id": "uuid",
    "type": "system_design",
    "difficulty": "mid-level",
    "question": "Design a rate limiter for an API gateway...",
    
    "evaluation_criteria": {
        "key_concepts": ["sliding window", "token bucket", "distributed systems"],
        "expected_tradeoffs": ["accuracy vs performance", "memory vs cpu"],
        "red_flags": ["single point of failure", "no consideration of scale"]
    },
    
    "follow_up_questions": [
        "How would you handle distributed rate limiting?",
        "What happens if Redis goes down?"
    ],
    
    "hints": [
        {"level": 1, "hint": "Consider using a time-based algorithm"},
        {"level": 2, "hint": "Think about token bucket or sliding window"}
    ]
}
```

#### 4.2.3 Response Evaluation
```python
# Real-time evaluation during interview simulation

evaluation = {
    "overall_score": 78,
    
    "dimensions": {
        "technical_correctness": 85,
        "communication_clarity": 65,
        "problem_solving_approach": 80,
        "trade_off_analysis": 70
    },
    
    "strengths": [
        "Strong understanding of rate limiting algorithms",
        "Good consideration of edge cases"
    ],
    
    "weaknesses": [
        "Communication could be clearer when explaining tradeoffs",
        "Missed discussion on distributed consensus"
    ],
    
    "hiring_signal": "weak_hire",  # strong_hire, hire, weak_hire, no_hire
    
    "specific_feedback": {
        "what_went_well": "You quickly identified the core requirements...",
        "what_needs_improvement": "Your explanation of the sliding window...",
        "next_steps": "Practice explaining distributed systems concepts..."
    }
}
```

#### 4.2.4 Skill Level Assessment
```python
# AI-driven skill evaluation based on evidence

skill_assessment = {
    "skill_name": "Machine Learning",
    "current_level": 3.5,  # 0-5 scale
    "confidence": 0.85,  # How confident is the assessment
    
    "evidence_analysis": {
        "strong_evidence": [
            "Implemented CNN from scratch (project)",
            "Scored 85% on ML theory simulation"
        ],
        "weak_evidence": [
            "Only basic experience with deployment"
        ],
        "missing_evidence": [
            "No production ML experience",
            "Limited experience with MLOps"
        ]
    },
    
    "recommended_level_up_actions": [
        {
            "action": "Complete ML deployment project",
            "impact": "high",
            "time_estimate_hours": 20
        }
    ]
}
```

#### 4.2.5 Readiness Assessment
```python
# Comprehensive readiness calculation

readiness = {
    "overall_score": 68,  # 0-100
    "level": "partially_ready",  # not_ready, partially_ready, ready, highly_ready
    
    "dimension_scores": {
        "technical_skills": 75,
        "communication": 55,
        "problem_solving": 70,
        "domain_knowledge": 65
    },
    
    "role_specific_readiness": {
        "Junior ML Engineer": 85,
        "ML Engineer": 68,
        "Senior ML Engineer": 35
    },
    
    "critical_gaps": [
        {
            "gap": "System design communication",
            "severity": "high",
            "blocking_roles": ["ML Engineer", "Senior ML Engineer"],
            "recommended_action": "Complete 5 system design mocks"
        }
    ],
    
    "estimated_time_to_ready": {
        "Junior ML Engineer": "0 weeks (ready now)",
        "ML Engineer": "4-6 weeks",
        "Senior ML Engineer": "6+ months"
    },
    
    "interview_success_probability": {
        "Junior ML Engineer": 0.82,
        "ML Engineer": 0.58,
        "Senior ML Engineer": 0.15
    }
}
```

### 4.3 AI Prompts & Templates

#### Interview Question Generator Prompt
```python
INTERVIEW_QUESTION_PROMPT = """
You are an expert technical interviewer for {company_style} companies.
Generate a {difficulty} level {question_type} interview question for a {role_title} position.

User's Background:
- Experience Level: {experience_level}
- Strong Skills: {strong_skills}
- Target Areas: {target_areas}

Requirements:
1. Question should be realistic and commonly asked
2. Include clear evaluation criteria
3. Generate 2-3 relevant follow-up questions
4. Provide hints at different levels (without giving away the answer)

Output Format: JSON with keys: question, context, evaluation_criteria, follow_ups, hints
"""
```

#### Response Evaluation Prompt
```python
RESPONSE_EVALUATION_PROMPT = """
You are evaluating a candidate's interview response.

Question: {question}
Candidate Response: {response}
Expected Key Points: {key_points}
Role Level: {difficulty}

Evaluate on:
1. Technical Correctness (0-100)
2. Communication Clarity (0-100)
3. Problem Solving Approach (0-100)
4. Trade-off Analysis (0-100)

Provide:
- Overall hiring signal: strong_hire, hire, weak_hire, or no_hire
- 2-3 specific strengths
- 2-3 specific areas for improvement
- Constructive feedback paragraph

Be honest and direct. Use the same standards as {company_style} companies.
"""
```

---

## 5. Frontend Service Layer

### 5.1 TypeScript Service File

**Location:** `frontend/src/services/jobprep.ts`

```typescript
import { useAuthStore } from '@/stores/authStore';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface JobPrepProfile {
  id: string;
  user_id: number;
  current_status: string;
  target_timeline: string;
  experience_level: string;
  overall_readiness_score: number;
  placement_mode_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface TargetRole {
  id: string;
  profile_id: string;
  role_title: string;
  role_category: string;
  seniority_level: string;
  market_demand: string;
  salary_range_min: number;
  salary_range_max: number;
  required_skills: any[];
  readiness_score: number;
  confidence_level: string;
  is_primary: boolean;
}

export interface Skill {
  id: string;
  profile_id: string;
  skill_name: string;
  skill_category: string;
  current_level: number;
  target_level: number;
  evidence_count: number;
  evidence_strength: number;
  is_critical: boolean;
  is_gap: boolean;
}

export interface Project {
  id: string;
  profile_id: string;
  title: string;
  description: string;
  github_url?: string;
  tech_stack: string[];
  complexity_score?: number;
  talking_points?: any[];
  is_featured: boolean;
}

export interface InterviewSimulation {
  id: string;
  profile_id: string;
  simulation_type: string;
  difficulty_level: string;
  overall_score?: number;
  technical_score?: number;
  communication_score?: number;
  hiring_decision?: string;
  started_at: string;
  completed_at?: string;
}

export interface PracticeSession {
  id: string;
  profile_id: string;
  practice_type: string;
  topic: string;
  score?: number;
  completed: boolean;
  started_at: string;
}

export interface ReadinessAssessment {
  id: string;
  profile_id: string;
  overall_readiness_score: number;
  readiness_level: string;
  technical_skills_score: number;
  communication_skills_score: number;
  critical_gaps: any[];
  recommended_actions: any[];
  assessed_at: string;
}

// ============================================================================
// Profile Management
// ============================================================================

export const getProfile = async (): Promise<JobPrepProfile> => {
  const token = useAuthStore.getState().token;
  const response = await fetch(`${API_BASE}/api/v1/jobprep/profile`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch profile');
  }
  
  return response.json();
};

export const createProfile = async (data: Partial<JobPrepProfile>): Promise<JobPrepProfile> => {
  const token = useAuthStore.getState().token;
  const response = await fetch(`${API_BASE}/api/v1/jobprep/profile`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create profile');
  }
  
  return response.json();
};

export const updateProfile = async (data: Partial<JobPrepProfile>): Promise<JobPrepProfile> => {
  const token = useAuthStore.getState().token;
  const response = await fetch(`${API_BASE}/api/v1/jobprep/profile`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update profile');
  }
  
  return response.json();
};

// ============================================================================
// Target Roles
// ============================================================================

export const getRoles = async (): Promise<TargetRole[]> => {
  const token = useAuthStore.getState().token;
  const response = await fetch(`${API_BASE}/api/v1/jobprep/roles`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch roles');
  }
  
  return response.json();
};

export const addRole = async (data: Partial<TargetRole>): Promise<TargetRole> => {
  const token = useAuthStore.getState().token;
  const response = await fetch(`${API_BASE}/api/v1/jobprep/roles`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error('Failed to add role');
  }
  
  return response.json();
};

export const analyzeRole = async (roleId: string): Promise<any> => {
  const token = useAuthStore.getState().token;
  const response = await fetch(`${API_BASE}/api/v1/jobprep/roles/${roleId}/analyze`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to analyze role');
  }
  
  return response.json();
};

// ============================================================================
// Skills Management
// ============================================================================

export const getSkills = async (): Promise<Skill[]> => {
  const token = useAuthStore.getState().token;
  const response = await fetch(`${API_BASE}/api/v1/jobprep/skills`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch skills');
  }
  
  return response.json();
};

export const getSkillGaps = async (): Promise<Skill[]> => {
  const token = useAuthStore.getState().token;
  const response = await fetch(`${API_BASE}/api/v1/jobprep/skills/gaps`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch skill gaps');
  }
  
  return response.json();
};

// ============================================================================
// Projects
// ============================================================================

export const getProjects = async (): Promise<Project[]> => {
  const token = useAuthStore.getState().token;
  const response = await fetch(`${API_BASE}/api/v1/jobprep/projects`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch projects');
  }
  
  return response.json();
};

export const addProject = async (data: Partial<Project>): Promise<Project> => {
  const token = useAuthStore.getState().token;
  const response = await fetch(`${API_BASE}/api/v1/jobprep/projects`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error('Failed to add project');
  }
  
  return response.json();
};

export const analyzeProject = async (projectId: string): Promise<any> => {
  const token = useAuthStore.getState().token;
  const response = await fetch(`${API_BASE}/api/v1/jobprep/projects/${projectId}/analyze`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to analyze project');
  }
  
  return response.json();
};

export const generateTalkingPoints = async (projectId: string): Promise<any> => {
  const token = useAuthStore.getState().token;
  const response = await fetch(`${API_BASE}/api/v1/jobprep/projects/${projectId}/talking-points`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to generate talking points');
  }
  
  return response.json();
};

// ============================================================================
// Interview Simulator
// ============================================================================

export const getSimulations = async (): Promise<InterviewSimulation[]> => {
  const token = useAuthStore.getState().token;
  const response = await fetch(`${API_BASE}/api/v1/jobprep/simulations`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch simulations');
  }
  
  return response.json();
};

export const startSimulation = async (config: any): Promise<InterviewSimulation> => {
  const token = useAuthStore.getState().token;
  const response = await fetch(`${API_BASE}/api/v1/jobprep/simulations/start`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(config),
  });
  
  if (!response.ok) {
    throw new Error('Failed to start simulation');
  }
  
  return response.json();
};

export const submitSimulationResponse = async (
  simulationId: string, 
  response: any
): Promise<any> => {
  const token = useAuthStore.getState().token;
  const res = await fetch(`${API_BASE}/api/v1/jobprep/simulations/${simulationId}/submit`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(response),
  });
  
  if (!res.ok) {
    throw new Error('Failed to submit response');
  }
  
  return res.json();
};

// ============================================================================
// Readiness Tracker
// ============================================================================

export const getReadiness = async (): Promise<ReadinessAssessment> => {
  const token = useAuthStore.getState().token;
  const response = await fetch(`${API_BASE}/api/v1/jobprep/readiness`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch readiness');
  }
  
  return response.json();
};

export const triggerAssessment = async (): Promise<ReadinessAssessment> => {
  const token = useAuthStore.getState().token;
  const response = await fetch(`${API_BASE}/api/v1/jobprep/readiness/assess`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to trigger assessment');
  }
  
  return response.json();
};

export const getRecommendations = async (): Promise<any[]> => {
  const token = useAuthStore.getState().token;
  const response = await fetch(`${API_BASE}/api/v1/jobprep/readiness/recommendations`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch recommendations');
  }
  
  return response.json();
};
```


### 5.2 Frontend State Management (Zustand)

**Location:** `frontend/src/stores/jobprepStore.ts`

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as jobprepService from '@/services/jobprep';

interface JobPrepState {
  // Profile
  profile: jobprepService.JobPrepProfile | null;
  profileLoading: boolean;
  
  // Roles
  targetRoles: jobprepService.TargetRole[];
  rolesLoading: boolean;
  
  // Skills
  skills: jobprepService.Skill[];
  skillGaps: jobprepService.Skill[];
  skillsLoading: boolean;
  
  // Projects
  projects: jobprepService.Project[];
  projectsLoading: boolean;
  
  // Simulations
  simulations: jobprepService.InterviewSimulation[];
  activeSimulation: jobprepService.InterviewSimulation | null;
  simulationsLoading: boolean;
  
  // Readiness
  readiness: jobprepService.ReadinessAssessment | null;
  readinessLoading: boolean;
  
  // Placement Mode
  placementMode: boolean;
  
  // Actions
  loadProfile: () => Promise<void>;
  updateProfile: (data: Partial<jobprepService.JobPrepProfile>) => Promise<void>;
  
  loadRoles: () => Promise<void>;
  addRole: (data: Partial<jobprepService.TargetRole>) => Promise<void>;
  
  loadSkills: () => Promise<void>;
  loadSkillGaps: () => Promise<void>;
  
  loadProjects: () => Promise<void>;
  addProject: (data: Partial<jobprepService.Project>) => Promise<void>;
  analyzeProject: (projectId: string) => Promise<any>;
  
  loadSimulations: () => Promise<void>;
  startSimulation: (config: any) => Promise<void>;
  
  loadReadiness: () => Promise<void>;
  triggerAssessment: () => Promise<void>;
  
  togglePlacementMode: () => void;
  
  resetStore: () => void;
}

export const useJobPrepStore = create<JobPrepState>()(
  persist(
    (set, get) => ({
      // Initial State
      profile: null,
      profileLoading: false,
      targetRoles: [],
      rolesLoading: false,
      skills: [],
      skillGaps: [],
      skillsLoading: false,
      projects: [],
      projectsLoading: false,
      simulations: [],
      activeSimulation: null,
      simulationsLoading: false,
      readiness: null,
      readinessLoading: false,
      placementMode: false,
      
      // Profile Actions
      loadProfile: async () => {
        set({ profileLoading: true });
        try {
          const profile = await jobprepService.getProfile();
          set({ profile, profileLoading: false });
        } catch (error) {
          console.error('Failed to load profile:', error);
          set({ profileLoading: false });
        }
      },
      
      updateProfile: async (data) => {
        set({ profileLoading: true });
        try {
          const profile = await jobprepService.updateProfile(data);
          set({ profile, profileLoading: false });
        } catch (error) {
          console.error('Failed to update profile:', error);
          set({ profileLoading: false });
          throw error;
        }
      },
      
      // Roles Actions
      loadRoles: async () => {
        set({ rolesLoading: true });
        try {
          const targetRoles = await jobprepService.getRoles();
          set({ targetRoles, rolesLoading: false });
        } catch (error) {
          console.error('Failed to load roles:', error);
          set({ rolesLoading: false });
        }
      },
      
      addRole: async (data) => {
        try {
          const newRole = await jobprepService.addRole(data);
          set((state) => ({ 
            targetRoles: [...state.targetRoles, newRole] 
          }));
        } catch (error) {
          console.error('Failed to add role:', error);
          throw error;
        }
      },
      
      // Skills Actions
      loadSkills: async () => {
        set({ skillsLoading: true });
        try {
          const skills = await jobprepService.getSkills();
          set({ skills, skillsLoading: false });
        } catch (error) {
          console.error('Failed to load skills:', error);
          set({ skillsLoading: false });
        }
      },
      
      loadSkillGaps: async () => {
        try {
          const skillGaps = await jobprepService.getSkillGaps();
          set({ skillGaps });
        } catch (error) {
          console.error('Failed to load skill gaps:', error);
        }
      },
      
      // Projects Actions
      loadProjects: async () => {
        set({ projectsLoading: true });
        try {
          const projects = await jobprepService.getProjects();
          set({ projects, projectsLoading: false });
        } catch (error) {
          console.error('Failed to load projects:', error);
          set({ projectsLoading: false });
        }
      },
      
      addProject: async (data) => {
        try {
          const newProject = await jobprepService.addProject(data);
          set((state) => ({ 
            projects: [...state.projects, newProject] 
          }));
        } catch (error) {
          console.error('Failed to add project:', error);
          throw error;
        }
      },
      
      analyzeProject: async (projectId) => {
        try {
          return await jobprepService.analyzeProject(projectId);
        } catch (error) {
          console.error('Failed to analyze project:', error);
          throw error;
        }
      },
      
      // Simulations Actions
      loadSimulations: async () => {
        set({ simulationsLoading: true });
        try {
          const simulations = await jobprepService.getSimulations();
          set({ simulations, simulationsLoading: false });
        } catch (error) {
          console.error('Failed to load simulations:', error);
          set({ simulationsLoading: false });
        }
      },
      
      startSimulation: async (config) => {
        try {
          const simulation = await jobprepService.startSimulation(config);
          set({ activeSimulation: simulation });
        } catch (error) {
          console.error('Failed to start simulation:', error);
          throw error;
        }
      },
      
      // Readiness Actions
      loadReadiness: async () => {
        set({ readinessLoading: true });
        try {
          const readiness = await jobprepService.getReadiness();
          set({ readiness, readinessLoading: false });
        } catch (error) {
          console.error('Failed to load readiness:', error);
          set({ readinessLoading: false });
        }
      },
      
      triggerAssessment: async () => {
        set({ readinessLoading: true });
        try {
          const readiness = await jobprepService.triggerAssessment();
          set({ readiness, readinessLoading: false });
        } catch (error) {
          console.error('Failed to trigger assessment:', error);
          set({ readinessLoading: false });
          throw error;
        }
      },
      
      // Placement Mode
      togglePlacementMode: () => {
        set((state) => ({ placementMode: !state.placementMode }));
      },
      
      // Reset
      resetStore: () => {
        set({
          profile: null,
          targetRoles: [],
          skills: [],
          skillGaps: [],
          projects: [],
          simulations: [],
          activeSimulation: null,
          readiness: null,
          placementMode: false,
        });
      },
    }),
    {
      name: 'jobprep-storage',
      partialize: (state) => ({ 
        placementMode: state.placementMode 
      }),
    }
  )
);
```

---

## 6. Authentication & Authorization

### 6.1 Auth Flow Integration

Job Prep uses the existing authentication system:

```typescript
// All API calls use the existing auth token from authStore
const token = useAuthStore.getState().token;

// Protected routes in Next.js
// Already handled by (dashboard) layout
```

### 6.2 Authorization Rules

1. **Profile Access**: Users can only access their own profile
2. **Role-Based Features**: 
   - Free users: Limited simulations per month
   - Pro users: Unlimited access + advanced features
3. **Data Privacy**: All user data is isolated by user_id

### 6.3 Database Security

```sql
-- Row Level Security (RLS) for Supabase/PostgreSQL
CREATE POLICY "Users can only access their own jobprep data"
ON jobprep_profiles
FOR ALL
USING (user_id = current_user_id());

-- Similar policies for all jobprep tables
```

---

## 7. Data Flow Diagrams

### 7.1 Interview Simulation Flow

```
User                  Frontend              Backend              AI Service          Database
  |                      |                     |                     |                  |
  |--[Start Interview]-->|                     |                     |                  |
  |                      |--[POST /start]----->|                     |                  |
  |                      |                     |--[Create Session]-->|                  |
  |                      |                     |                     |                  |
  |                      |                     |--[Generate Q]------>|                  |
  |                      |                     |<--[Question]--------|                  |
  |                      |                     |--[Save]------------>|                  |
  |                      |<--[Question]--------|                     |                  |
  |<--[Display Q]--------|                     |                     |                  |
  |                      |                     |                     |                  |
  |--[Submit Answer]---->|                     |                     |                  |
  |                      |--[POST /submit]---->|                     |                  |
  |                      |                     |--[Evaluate]-------->|                  |
  |                      |                     |<--[Scores]----------|                  |
  |                      |                     |--[Save Result]----->|                  |
  |                      |<--[Feedback]--------|                     |                  |
  |<--[Show Feedback]----|                     |                     |                  |
```

### 7.2 Project Analysis Flow

```
User              Frontend           Backend          AI Service       GitHub API
  |                  |                  |                  |                |
  |--[Import]------->|                  |                  |                |
  |                  |--[POST /import]->|                  |                |
  |                  |                  |--[Fetch Repo]--->|                |
  |                  |                  |                  |--[Clone]------>|
  |                  |                  |                  |<--[Code]-------|
  |                  |                  |<--[Repo Data]----|                |
  |                  |                  |                  |                |
  |                  |                  |--[Analyze Code]->|                |
  |                  |                  |<--[Analysis]-----|                |
  |                  |                  |--[Generate TP]-->|                |
  |                  |                  |<--[Talking Pts]--|                |
  |                  |                  |--[Save to DB]--->|                |
  |                  |<--[Results]------|                  |                |
  |<--[Display]------|                  |                  |                |
```

---

## 8. Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
**Goal:** Set up core infrastructure

#### Backend Tasks
- [ ] Create database migration scripts
- [ ] Implement SQLAlchemy models (`jobprep.py`)
- [ ] Create Pydantic schemas (`jobprep.py`)
- [ ] Set up MongoDB collections
- [ ] Basic API route structure

#### Frontend Tasks
- [ ] Create TypeScript service file
- [ ] Implement Zustand store
- [ ] Set up error handling utilities

**Estimated Time:** 10-12 hours

---

### Phase 2: Profile & Roles (Week 2-3)
**Goal:** User can create profile and add target roles

#### Backend Implementation
```bash
# Files to create:
backend/app/models/jobprep.py           # SQLAlchemy models
backend/app/schemas/jobprep.py          # Pydantic schemas
backend/app/api/v1/jobprep.py           # API routes
backend/app/services/jobprep/__init__.py
backend/app/services/jobprep/profile_service.py
backend/app/services/jobprep/role_service.py
```

#### API Endpoints
- [x] GET /jobprep/profile
- [x] POST /jobprep/profile
- [x] PATCH /jobprep/profile
- [x] GET /jobprep/roles
- [x] POST /jobprep/roles
- [x] PATCH /jobprep/roles/{id}

#### Frontend Integration
- [ ] Connect profile UI to API
- [ ] Connect roles UI to API
- [ ] Add loading states
- [ ] Add error handling

**Estimated Time:** 15-18 hours

---

### Phase 3: Skills & Evidence (Week 3-4)
**Goal:** Track skills with evidence

#### Backend Implementation
- [ ] Skills CRUD endpoints
- [ ] Evidence management endpoints
- [ ] Skill assessment logic
- [ ] Evidence validation service

#### Frontend Integration
- [ ] Skills matrix UI integration
- [ ] Evidence upload/management
- [ ] Skill gap visualization

**Estimated Time:** 12-15 hours

---

### Phase 4: Projects (Week 4-5)
**Goal:** Import and analyze projects

#### Backend Implementation
- [ ] Projects CRUD endpoints
- [ ] GitHub integration service
- [ ] AI project analysis service
- [ ] Talking points generation

#### AI Integration
```python
# backend/app/services/jobprep/ai_integration.py
async def analyze_project(project_data: dict) -> dict:
    prompt = f"""
    Analyze this software project for interview readiness:
    
    Title: {project_data['title']}
    Description: {project_data['description']}
    Tech Stack: {project_data['tech_stack']}
    
    Provide:
    1. Complexity Score (0-1)
    2. Innovation Score (0-1)
    3. Interview Value Score (0-1)
    4. 3-5 compelling talking points
    5. Likely follow-up questions
    """
    
    result = await ai_router.route_request([
        {"role": "system", "content": "You are an expert technical interviewer."},
        {"role": "user", "content": prompt}
    ])
    
    return parse_ai_response(result)
```

**Estimated Time:** 18-20 hours

---

### Phase 5: Interview Simulator (Week 5-7)
**Goal:** AI-powered mock interviews

#### Backend Implementation
- [ ] Simulation session management
- [ ] Question generation service
- [ ] Response evaluation service
- [ ] Real-time feedback system
- [ ] Session storage (MongoDB)

#### Frontend Implementation
- [ ] Interview UI with timer
- [ ] Real-time question/answer flow
- [ ] Code editor integration (if needed)
- [ ] Feedback display

#### AI Services
```python
# Question Generation
async def generate_interview_question(
    role: str,
    difficulty: str,
    question_type: str,
    user_context: dict
) -> dict

# Response Evaluation
async def evaluate_response(
    question: str,
    response: str,
    evaluation_criteria: dict
) -> dict
```

**Estimated Time:** 25-30 hours

---

### Phase 6: Practice Arena (Week 7-8)
**Goal:** Targeted practice sessions

#### Backend Implementation
- [ ] Practice session management
- [ ] Challenge library
- [ ] Hint system
- [ ] Performance tracking

#### Frontend Implementation
- [ ] Practice UI
- [ ] Timer and progress tracking
- [ ] Hint request system

**Estimated Time:** 15-18 hours

---

### Phase 7: Readiness Tracker (Week 8-9)
**Goal:** Comprehensive readiness assessment

#### Backend Implementation
```python
# backend/app/services/jobprep/assessment_service.py

async def calculate_readiness(profile_id: str) -> dict:
    """
    Comprehensive readiness calculation based on:
    - Skill levels and evidence
    - Interview simulation performance
    - Practice session results
    - Project quality
    """
    
    profile = await get_profile(profile_id)
    skills = await get_skills(profile_id)
    simulations = await get_simulations(profile_id)
    projects = await get_projects(profile_id)
    
    # Calculate dimension scores
    technical_score = calculate_technical_score(skills, projects)
    communication_score = calculate_communication_score(simulations)
    problem_solving_score = calculate_problem_solving_score(simulations)
    
    # Identify gaps
    critical_gaps = identify_critical_gaps(skills, target_roles)
    
    # Generate recommendations
    recommendations = generate_recommendations(gaps, current_state)
    
    return {
        "overall_readiness_score": calculate_overall(scores),
        "dimension_scores": {...},
        "critical_gaps": critical_gaps,
        "recommended_actions": recommendations,
        "interview_success_probability": predict_success(all_data)
    }
```

#### Frontend Implementation
- [ ] Readiness dashboard
- [ ] Progress visualization
- [ ] Gap analysis display
- [ ] Recommendations UI

**Estimated Time:** 20-25 hours

---

### Phase 8: Placement Mode (Week 9-10)
**Goal:** High-pressure evaluation mode

#### Features
- [ ] Strict timer
- [ ] No hints
- [ ] No pauses
- [ ] Realistic pressure simulation
- [ ] Comprehensive evaluation

**Estimated Time:** 10-12 hours

---

### Phase 9: Testing & Polish (Week 10-11)
**Goal:** Production-ready quality

#### Backend Testing
```python
# tests/test_jobprep.py

def test_profile_creation()
def test_role_management()
def test_skill_tracking()
def test_interview_simulation()
def test_readiness_calculation()
def test_ai_integration()
```

#### Frontend Testing
- [ ] Component tests
- [ ] Integration tests
- [ ] E2E tests with Playwright

#### Performance Testing
- [ ] Load testing with locust
- [ ] Database query optimization
- [ ] API response time optimization

**Estimated Time:** 15-20 hours

---

### Phase 10: Deployment (Week 11-12)
**Goal:** Live in production

- [ ] Database migrations on production
- [ ] Environment variables setup
- [ ] Monitoring setup
- [ ] Documentation completion
- [ ] User guide creation

**Estimated Time:** 8-10 hours

---

### **Total Estimated Time: 150-180 hours (10-12 weeks part-time)**


## 9. Testing Strategy

### 9.1 Backend Testing

#### Unit Tests
```python
# tests/services/test_jobprep_profile_service.py

import pytest
from app.services.jobprep.profile_service import JobPrepProfileService
from app.models.jobprep import JobPrepProfile

@pytest.fixture
def profile_service():
    return JobPrepProfileService()

@pytest.fixture
def mock_user_id():
    return 1

async def test_create_profile(profile_service, mock_user_id):
    """Test profile creation"""
    profile_data = {
        "current_status": "job_seeker",
        "target_timeline": "1-3_months",
        "experience_level": "mid"
    }
    
    profile = await profile_service.create_profile(mock_user_id, profile_data)
    
    assert profile is not None
    assert profile.user_id == mock_user_id
    assert profile.current_status == "job_seeker"
    assert profile.overall_readiness_score == 0

async def test_calculate_readiness(profile_service, mock_user_id):
    """Test readiness calculation"""
    profile = await profile_service.get_profile(mock_user_id)
    readiness = await profile_service.calculate_readiness(profile.id)
    
    assert "overall_readiness_score" in readiness
    assert 0 <= readiness["overall_readiness_score"] <= 100
    assert "critical_gaps" in readiness
    assert "recommended_actions" in readiness
```

#### Integration Tests
```python
# tests/api/test_jobprep_api.py

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_profile_crud_flow(auth_token):
    """Test complete profile CRUD flow"""
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    # Create profile
    response = client.post(
        "/api/v1/jobprep/profile",
        json={
            "current_status": "job_seeker",
            "experience_level": "mid"
        },
        headers=headers
    )
    assert response.status_code == 200
    profile = response.json()
    
    # Get profile
    response = client.get("/api/v1/jobprep/profile", headers=headers)
    assert response.status_code == 200
    
    # Update profile
    response = client.patch(
        "/api/v1/jobprep/profile",
        json={"target_timeline": "3-6_months"},
        headers=headers
    )
    assert response.status_code == 200

def test_interview_simulation_flow(auth_token):
    """Test complete interview simulation"""
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    # Start simulation
    response = client.post(
        "/api/v1/jobprep/simulations/start",
        json={
            "simulation_type": "technical_coding",
            "difficulty_level": "mid",
            "company_style": "faang"
        },
        headers=headers
    )
    assert response.status_code == 200
    simulation = response.json()
    sim_id = simulation["id"]
    
    # Submit response
    response = client.post(
        f"/api/v1/jobprep/simulations/{sim_id}/submit",
        json={
            "response": "My solution is...",
            "code": "def solution()..."
        },
        headers=headers
    )
    assert response.status_code == 200
    
    # Get report
    response = client.get(
        f"/api/v1/jobprep/simulations/{sim_id}/report",
        headers=headers
    )
    assert response.status_code == 200
    report = response.json()
    assert "overall_score" in report
```

### 9.2 Frontend Testing

#### Component Tests
```typescript
// __tests__/jobprep/SkillMatrix.test.tsx

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SkillMatrix } from '@/app/(dashboard)/jobprep/components/SkillMatrix';

describe('SkillMatrix', () => {
  it('displays skills correctly', async () => {
    render(<SkillMatrix />);
    
    await waitFor(() => {
      expect(screen.getByText('Mathematical Foundations')).toBeInTheDocument();
      expect(screen.getByText('ML Theory')).toBeInTheDocument();
    });
  });
  
  it('allows adding new evidence', async () => {
    const user = userEvent.setup();
    render(<SkillMatrix />);
    
    const addButton = screen.getByText('Add Evidence');
    await user.click(addButton);
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
```

#### E2E Tests
```typescript
// e2e/jobprep.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Job Prep Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');
    
    // Navigate to Job Prep
    await page.goto('/jobprep');
  });
  
  test('complete profile setup', async ({ page }) => {
    // Create profile
    await page.click('text=Get Started');
    await page.selectOption('[name="current_status"]', 'job_seeker');
    await page.selectOption('[name="experience_level"]', 'mid');
    await page.click('button:has-text("Save")');
    
    await expect(page.locator('.profile-created')).toBeVisible();
  });
  
  test('start interview simulation', async ({ page }) => {
    // Navigate to simulator
    await page.click('text=Interview Simulator');
    
    // Configure simulation
    await page.selectOption('[name="simulation_type"]', 'technical_coding');
    await page.selectOption('[name="difficulty"]', 'mid');
    await page.click('button:has-text("Launch Session")');
    
    // Wait for question
    await expect(page.locator('.interview-question')).toBeVisible();
    
    // Submit answer
    await page.fill('textarea[name="response"]', 'My answer is...');
    await page.click('button:has-text("Submit")');
    
    // Check feedback
    await expect(page.locator('.feedback')).toBeVisible();
  });
});
```

### 9.3 Load Testing

```python
# locustfile.py

from locust import HttpUser, task, between

class JobPrepUser(HttpUser):
    wait_time = between(1, 3)
    
    def on_start(self):
        """Login and get token"""
        response = self.client.post("/api/v1/auth/login", json={
            "email": "test@example.com",
            "password": "password"
        })
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    @task(3)
    def get_profile(self):
        self.client.get("/api/v1/jobprep/profile", headers=self.headers)
    
    @task(2)
    def get_skills(self):
        self.client.get("/api/v1/jobprep/skills", headers=self.headers)
    
    @task(1)
    def start_simulation(self):
        self.client.post(
            "/api/v1/jobprep/simulations/start",
            json={
                "simulation_type": "technical_coding",
                "difficulty_level": "mid"
            },
            headers=self.headers
        )
```

---

## 10. Performance Considerations

### 10.1 Database Optimization

#### Indexing Strategy
```sql
-- Critical indexes for performance
CREATE INDEX CONCURRENTLY idx_jobprep_profiles_user_id ON jobprep_profiles(user_id);
CREATE INDEX CONCURRENTLY idx_jobprep_skills_profile_category ON jobprep_skills(profile_id, skill_category);
CREATE INDEX CONCURRENTLY idx_jobprep_simulations_profile_date ON jobprep_interview_simulations(profile_id, started_at DESC);
CREATE INDEX CONCURRENTLY idx_jobprep_practice_profile_date ON jobprep_practice_sessions(profile_id, started_at DESC);

-- Composite index for common queries
CREATE INDEX CONCURRENTLY idx_target_roles_active ON jobprep_target_roles(profile_id, is_active) WHERE is_active = TRUE;
CREATE INDEX CONCURRENTLY idx_skills_gaps ON jobprep_skills(profile_id, is_gap) WHERE is_gap = TRUE;
```

#### Query Optimization
```python
# Use select_related and prefetch_related for efficiency
from sqlalchemy.orm import selectinload

async def get_profile_with_roles(user_id: int):
    """Efficiently load profile with related data"""
    stmt = select(JobPrepProfile)\
        .options(
            selectinload(JobPrepProfile.target_roles),
            selectinload(JobPrepProfile.skills)
        )\
        .where(JobPrepProfile.user_id == user_id)
    
    result = await db.execute(stmt)
    return result.scalar_one_or_none()
```

### 10.2 Caching Strategy

```python
# backend/app/services/jobprep/role_service.py

from app.core.cache_middleware import cache_result

class RoleService:
    @cache_result(ttl=3600)  # Cache for 1 hour
    async def get_role_market_data(self, role_title: str):
        """Cache role market data as it changes infrequently"""
        # Expensive API call or computation
        return market_data
    
    async def get_user_roles(self, profile_id: str):
        """Don't cache user-specific data"""
        return await db.query(TargetRole).filter_by(profile_id=profile_id).all()
```

### 10.3 AI Service Optimization

```python
# Batch AI requests when possible
async def batch_evaluate_responses(responses: List[dict]) -> List[dict]:
    """Evaluate multiple responses in a single AI call"""
    prompt = "Evaluate the following interview responses:\n\n"
    
    for i, resp in enumerate(responses):
        prompt += f"Response {i+1}:\n{resp['text']}\n\n"
    
    result = await ai_router.route_request([
        {"role": "system", "content": "You are an interviewer evaluating candidates."},
        {"role": "user", "content": prompt}
    ])
    
    return parse_batch_results(result)

# Use streaming for long responses
async def stream_interview_feedback(simulation_id: str):
    """Stream feedback to improve perceived performance"""
    async for chunk in ai_router.stream_request(messages):
        yield chunk
```

### 10.4 Frontend Performance

```typescript
// Lazy load heavy components
const InterviewSimulator = dynamic(
  () => import('./components/InterviewSimulator'),
  { ssr: false }
);

// Virtualize long lists
import { FixedSizeList } from 'react-window';

function SkillsList({ skills }) {
  return (
    <FixedSizeList
      height={600}
      itemCount={skills.length}
      itemSize={80}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>
          <SkillCard skill={skills[index]} />
        </div>
      )}
    </FixedSizeList>
  );
}

// Debounce expensive operations
import { useDebouncedCallback } from 'use-debounce';

const debouncedSearch = useDebouncedCallback(
  (value) => searchRoles(value),
  300
);
```

---

## 11. Security Considerations

### 11.1 Input Validation

```python
# backend/app/schemas/jobprep.py

from pydantic import BaseModel, validator, Field
from typing import Optional, List

class ProfileCreate(BaseModel):
    current_status: str = Field(..., regex="^(student|job_seeker|career_change|upskilling)$")
    target_timeline: str = Field(..., regex="^(immediate|1-3_months|3-6_months|6\+_months)$")
    experience_level: str = Field(..., regex="^(entry|mid|senior|staff)$")
    
    @validator('current_status')
    def validate_status(cls, v):
        allowed = ['student', 'job_seeker', 'career_change', 'upskilling']
        if v not in allowed:
            raise ValueError(f'Status must be one of {allowed}')
        return v

class SimulationStart(BaseModel):
    simulation_type: str = Field(..., regex="^(technical_coding|system_design|ml_theory|behavioral)$")
    difficulty_level: str = Field(..., regex="^(entry|mid|senior|staff)$")
    company_style: Optional[str] = Field(None, max_length=100)
    placement_mode: bool = False
    
    @validator('simulation_type')
    def validate_type(cls, v):
        allowed = ['technical_coding', 'system_design', 'ml_theory', 'behavioral']
        if v not in allowed:
            raise ValueError(f'Type must be one of {allowed}')
        return v
```

### 11.2 Rate Limiting

```python
# backend/app/api/v1/jobprep.py

from app.core.rate_limit import limiter

@router.post("/simulations/start")
@limiter.limit("10/hour")  # Limit simulations to prevent abuse
async def start_simulation(
    config: SimulationStart,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Implementation
    pass

@router.post("/projects/{project_id}/analyze")
@limiter.limit("20/hour")  # Limit AI analysis calls
async def analyze_project(
    project_id: str,
    current_user: User = Depends(get_current_user)
):
    # Implementation
    pass
```

### 11.3 Data Privacy

```python
# Ensure users can only access their own data
async def verify_profile_ownership(profile_id: str, user_id: int, db: Session):
    """Verify user owns the profile"""
    profile = await db.get(JobPrepProfile, profile_id)
    if not profile or profile.user_id != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    return profile

# Use in endpoints
@router.get("/skills")
async def get_skills(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = await get_profile_by_user_id(current_user.id, db)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    skills = await db.query(Skill)\
        .filter(Skill.profile_id == profile.id)\
        .all()
    
    return skills
```

### 11.4 AI Content Safety

```python
# Filter inappropriate content in user submissions
from profanity_check import predict

async def validate_user_response(response: str) -> bool:
    """Check for inappropriate content"""
    if predict([response])[0] == 1:
        raise HTTPException(
            status_code=400, 
            detail="Inappropriate content detected"
        )
    return True

# Sanitize AI-generated content before storing
import bleach

def sanitize_ai_output(text: str) -> str:
    """Remove potentially harmful content from AI responses"""
    return bleach.clean(text, strip=True)
```

---

## 12. Future Enhancements

### 12.1 Phase 2 Features (Post-MVP)

#### 1. Peer Mock Interviews
```
- Match users for peer-to-peer practice
- Video/audio integration
- Mutual feedback system
- Scheduling and reminders
```

#### 2. Resume Analysis & Optimization
```
- Upload resume (PDF/DOCX)
- AI-powered gap analysis against target role
- ATS optimization suggestions
- Generate improved versions
```

#### 3. Salary Negotiation Simulator
```
- Practice negotiation conversations
- AI plays hiring manager role
- Evaluate negotiation tactics
- Provide market data and suggestions
```

#### 4. Company-Specific Prep
```
- Company culture insights
- Interview format information
- Common questions database
- Success rate by company
```

#### 5. Learning Path Generator
```
- AI-generated learning roadmap
- Course recommendations (Coursera, Udemy, etc.)
- Project suggestions for skill gaps
- Timeline estimation
```

#### 6. Community Features
```
- Discussion forums by role
- Success story sharing
- Mentor connections
- Study groups
```

### 12.2 Advanced AI Features

#### 1. Voice Interview Practice
```
- Speech-to-text integration
- Evaluate verbal communication
- Detect filler words, pace, confidence
- Real-time feedback on delivery
```

#### 2. Video Interview Analysis
```
- Facial expression analysis
- Body language feedback
- Eye contact tracking
- Professional appearance tips
```

#### 3. Adaptive Learning
```
- Personalized question difficulty
- Focus on weak areas automatically
- Track improvement over time
- Optimize practice efficiency
```

### 12.3 Integration Opportunities

```
- LinkedIn profile import
- GitHub deep integration (commits, PRs, reviews)
- LeetCode/HackerRank stats
- Coursera/Udemy certificates
- Calendar integration for practice scheduling
- Slack/Discord notifications
- Mobile app (React Native)
```

---

## 13. Quick Start Commands

### Database Setup
```bash
# Create migration
cd backend
alembic revision --autogenerate -m "Add jobprep tables"

# Apply migration
alembic upgrade head

# Or use SQL directly
psql -U your_user -d engunity < jobprep_schema.sql
```

### Backend Development
```bash
# Install dependencies
cd backend
pip install -r requirements.txt

# Run server
uvicorn app.main:app --reload --port 8000

# Run tests
pytest tests/test_jobprep.py -v
```

### Frontend Development
```bash
# Install dependencies
cd frontend
npm install

# Run dev server
npm run dev

# Run tests
npm test

# E2E tests
npx playwright test e2e/jobprep.spec.ts
```

### MongoDB Setup
```bash
# Start MongoDB
mongosh

# Create collections
use engunity
db.createCollection("jobprep_interview_sessions")
db.createCollection("jobprep_practice_attempts")
db.createCollection("jobprep_ai_interactions")

# Create indexes
db.jobprep_interview_sessions.createIndex({ "profile_id": 1, "started_at": -1 })
db.jobprep_practice_attempts.createIndex({ "profile_id": 1 })
```

---

## 14. Troubleshooting Guide

### Common Issues

#### 1. Database Connection Error
```
Error: Could not connect to PostgreSQL

Solution:
- Check DATABASE_URL in .env
- Verify PostgreSQL is running: sudo systemctl status postgresql
- Test connection: psql -U user -d engunity
```

#### 2. AI Service Timeout
```
Error: AI request timeout

Solution:
- Check GROQ_API_KEY in .env
- Verify API key is valid
- Increase timeout in config: timeout=60.0
- Check rate limits on Groq dashboard
```

#### 3. Profile Not Found
```
Error: 404 Profile not found

Solution:
- User must create profile first via POST /jobprep/profile
- Check user authentication token is valid
- Verify user_id matches authenticated user
```

#### 4. Frontend Build Error
```
Error: Module not found: Can't resolve '@/services/jobprep'

Solution:
- Ensure jobprep.ts exists in frontend/src/services/
- Check TypeScript paths in tsconfig.json
- Restart Next.js dev server
```

---

## 15. Deployment Checklist

### Pre-Deployment
- [ ] All tests passing (backend + frontend)
- [ ] Database migrations tested on staging
- [ ] Environment variables configured
- [ ] AI API keys valid and funded
- [ ] Rate limits configured appropriately
- [ ] Error logging configured (Sentry/LogRocket)
- [ ] Performance tested (load testing completed)

### Deployment Steps
1. [ ] Backup production database
2. [ ] Run database migrations
3. [ ] Deploy backend (Docker/Railway/Vercel)
4. [ ] Deploy frontend (Vercel)
5. [ ] Verify health endpoints
6. [ ] Test critical user flows
7. [ ] Monitor error rates

### Post-Deployment
- [ ] Monitor server logs for errors
- [ ] Check database connection pool
- [ ] Verify AI service calls working
- [ ] Test user registration → profile creation flow
- [ ] Monitor response times
- [ ] Set up alerts for failures

---

## 16. Conclusion

This comprehensive research document provides everything needed to implement the Job Prep feature from scratch. The implementation is structured in logical phases, allowing for incremental development and testing.

### Key Success Factors

1. **Start with Foundation**: Database schema and basic CRUD operations
2. **Iterate on AI**: Start with simple AI features, enhance over time
3. **Test Continuously**: Write tests alongside features
4. **Monitor Performance**: Use caching and optimization from day one
5. **User Feedback**: Launch MVP early, iterate based on real usage

### Estimated Timeline

- **MVP (Phases 1-4)**: 6-8 weeks
- **Full Feature Set (Phases 1-8)**: 10-12 weeks
- **Production Ready (with testing)**: 12-14 weeks

### Resources Required

- **Backend Developer**: 100-120 hours
- **Frontend Developer**: 50-60 hours
- **AI/ML Integration**: 20-30 hours
- **Testing & QA**: 20-25 hours

### Next Steps

1. Review this document with the team
2. Set up development environment
3. Create database migration for Phase 1
4. Implement profile and roles (Phase 2)
5. Integrate with frontend
6. Deploy to staging for testing

---

**Document Prepared By:** AI Development Team  
**For:** Engunity Platform  
**Date:** February 5, 2026  
**Version:** 1.0 - Complete Implementation Guide

---

## Appendix A: File Checklist

### Backend Files to Create
```
backend/app/models/jobprep.py                      ✓ Design complete
backend/app/schemas/jobprep.py                     ✓ Design complete
backend/app/api/v1/jobprep.py                      ✓ Design complete
backend/app/services/jobprep/__init__.py           ✓ Design complete
backend/app/services/jobprep/profile_service.py    ✓ Design complete
backend/app/services/jobprep/role_service.py       ✓ Design complete
backend/app/services/jobprep/skill_service.py      ✓ Design complete
backend/app/services/jobprep/project_service.py    ✓ Design complete
backend/app/services/jobprep/simulation_service.py ✓ Design complete
backend/app/services/jobprep/practice_service.py   ✓ Design complete
backend/app/services/jobprep/assessment_service.py ✓ Design complete
backend/app/services/jobprep/ai_integration.py     ✓ Design complete
```

### Frontend Files to Create
```
frontend/src/services/jobprep.ts                   ✓ Design complete
frontend/src/stores/jobprepStore.ts                ✓ Design complete
frontend/src/app/(dashboard)/jobprep/page.tsx      ✓ Already exists (UI only)
```

### Database Files
```
backend/alembic/versions/xxx_add_jobprep_tables.py ⏳ To be generated
jobprep_schema.sql                                 ✓ Design complete
```

### Test Files to Create
```
tests/services/test_jobprep_profile_service.py     ⏳ Pending
tests/services/test_jobprep_ai_integration.py      ⏳ Pending
tests/api/test_jobprep_api.py                      ⏳ Pending
frontend/__tests__/jobprep/SkillMatrix.test.tsx    ⏳ Pending
e2e/jobprep.spec.ts                                ⏳ Pending
```


## Appendix B: Quick Reference - API Endpoints

### Profile
```
GET    /api/v1/jobprep/profile              # Get user profile
POST   /api/v1/jobprep/profile              # Create profile
PATCH  /api/v1/jobprep/profile              # Update profile
DELETE /api/v1/jobprep/profile              # Delete profile
```

### Target Roles
```
GET    /api/v1/jobprep/roles                # List all roles
POST   /api/v1/jobprep/roles                # Add role
GET    /api/v1/jobprep/roles/{id}           # Get role
PATCH  /api/v1/jobprep/roles/{id}           # Update role
DELETE /api/v1/jobprep/roles/{id}           # Delete role
POST   /api/v1/jobprep/roles/{id}/analyze   # AI analysis
```

### Skills
```
GET    /api/v1/jobprep/skills               # List all skills
POST   /api/v1/jobprep/skills               # Add skill
PATCH  /api/v1/jobprep/skills/{id}          # Update skill
DELETE /api/v1/jobprep/skills/{id}          # Delete skill
GET    /api/v1/jobprep/skills/gaps          # Get gaps
```

### Projects
```
GET    /api/v1/jobprep/projects             # List projects
POST   /api/v1/jobprep/projects             # Add project
GET    /api/v1/jobprep/projects/{id}        # Get project
PATCH  /api/v1/jobprep/projects/{id}        # Update project
DELETE /api/v1/jobprep/projects/{id}        # Delete project
POST   /api/v1/jobprep/projects/import-github  # Import from GitHub
POST   /api/v1/jobprep/projects/{id}/analyze   # AI analysis
POST   /api/v1/jobprep/projects/{id}/talking-points  # Generate talking points
```

### Interview Simulator
```
GET    /api/v1/jobprep/simulations          # List simulations
POST   /api/v1/jobprep/simulations/start    # Start new
GET    /api/v1/jobprep/simulations/{id}     # Get details
POST   /api/v1/jobprep/simulations/{id}/submit    # Submit response
POST   /api/v1/jobprep/simulations/{id}/complete  # Complete
GET    /api/v1/jobprep/simulations/{id}/report    # Get report
```

### Practice Arena
```
GET    /api/v1/jobprep/practice/challenges  # List challenges
POST   /api/v1/jobprep/practice/start       # Start session
POST   /api/v1/jobprep/practice/{id}/submit # Submit solution
GET    /api/v1/jobprep/practice/history     # Get history
POST   /api/v1/jobprep/practice/{id}/hint   # Request hint
```

### Readiness
```
GET    /api/v1/jobprep/readiness            # Get readiness
POST   /api/v1/jobprep/readiness/assess     # Trigger assessment
GET    /api/v1/jobprep/readiness/history    # Get history
GET    /api/v1/jobprep/readiness/gaps       # Get gaps
GET    /api/v1/jobprep/readiness/recommendations  # Get recommendations
```

---

## Appendix C: Environment Variables

```bash
# .env file additions for Job Prep

# Database (already exists)
DATABASE_URL=postgresql://user:pass@localhost:5432/engunity
MONGODB_URL=mongodb://localhost:27017

# AI Services (already exists)
GROQ_API_KEY=your_groq_key
GEMINI_API_KEY=your_gemini_key

# GitHub Integration (for project import)
GITHUB_TOKEN=your_github_token

# Feature Flags (optional)
JOBPREP_ENABLED=true
JOBPREP_PLACEMENT_MODE_ENABLED=true
JOBPREP_AI_ANALYSIS_ENABLED=true

# Rate Limits (optional)
JOBPREP_SIMULATIONS_PER_DAY=10
JOBPREP_AI_ANALYSIS_PER_DAY=20
```

---

## Appendix D: Database Schema SQL (Complete)

```sql
-- ============================================================================
-- Job Prep Feature - Complete Database Schema
-- ============================================================================

-- Profile Table
CREATE TABLE jobprep_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    current_status VARCHAR(50),
    target_timeline VARCHAR(50),
    experience_level VARCHAR(50),
    preferred_companies JSONB DEFAULT '[]',
    work_authorization VARCHAR(50),
    remote_preference VARCHAR(50),
    overall_readiness_score INTEGER DEFAULT 0,
    last_assessment_date TIMESTAMP,
    placement_mode_enabled BOOLEAN DEFAULT FALSE,
    notifications_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE INDEX idx_jobprep_profiles_user ON jobprep_profiles(user_id);

-- Target Roles Table
CREATE TABLE jobprep_target_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES jobprep_profiles(id) ON DELETE CASCADE,
    role_title VARCHAR(200) NOT NULL,
    role_category VARCHAR(100),
    seniority_level VARCHAR(50),
    market_demand VARCHAR(50),
    salary_range_min INTEGER,
    salary_range_max INTEGER,
    salary_currency VARCHAR(3) DEFAULT 'USD',
    required_skills JSONB DEFAULT '[]',
    nice_to_have_skills JSONB DEFAULT '[]',
    typical_interview_rounds JSONB DEFAULT '[]',
    readiness_score INTEGER DEFAULT 0,
    confidence_level VARCHAR(50) DEFAULT 'low',
    is_primary BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_target_roles_profile ON jobprep_target_roles(profile_id);
CREATE INDEX idx_target_roles_category ON jobprep_target_roles(role_category);

-- Skills Table
CREATE TABLE jobprep_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES jobprep_profiles(id) ON DELETE CASCADE,
    skill_name VARCHAR(200) NOT NULL,
    skill_category VARCHAR(100) NOT NULL,
    skill_subcategory VARCHAR(100),
    current_level INTEGER DEFAULT 0,
    target_level INTEGER,
    evidence_count INTEGER DEFAULT 0,
    evidence_target INTEGER,
    evidence_strength DECIMAL(3,2) DEFAULT 0.00,
    practice_attempts INTEGER DEFAULT 0,
    last_practiced_at TIMESTAMP,
    is_critical BOOLEAN DEFAULT FALSE,
    is_gap BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(profile_id, skill_name)
);

CREATE INDEX idx_skills_profile ON jobprep_skills(profile_id);
CREATE INDEX idx_skills_category ON jobprep_skills(skill_category);
CREATE INDEX idx_skills_gap ON jobprep_skills(is_gap) WHERE is_gap = TRUE;

-- Skill Evidence Table
CREATE TABLE jobprep_skill_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_id UUID NOT NULL REFERENCES jobprep_skills(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES jobprep_profiles(id) ON DELETE CASCADE,
    evidence_type VARCHAR(50) NOT NULL,
    title VARCHAR(300) NOT NULL,
    description TEXT,
    source_url TEXT,
    source_type VARCHAR(50),
    verified BOOLEAN DEFAULT FALSE,
    verification_method VARCHAR(100),
    relevance_score DECIMAL(3,2) DEFAULT 0.50,
    impact_level VARCHAR(50),
    evidence_metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_evidence_skill ON jobprep_skill_evidence(skill_id);
CREATE INDEX idx_evidence_profile ON jobprep_skill_evidence(profile_id);

-- Projects Table
CREATE TABLE jobprep_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES jobprep_profiles(id) ON DELETE CASCADE,
    title VARCHAR(300) NOT NULL,
    description TEXT,
    project_type VARCHAR(50),
    github_url TEXT,
    live_demo_url TEXT,
    documentation_url TEXT,
    tech_stack JSONB DEFAULT '[]',
    key_features JSONB DEFAULT '[]',
    challenges_solved JSONB DEFAULT '[]',
    lines_of_code INTEGER,
    commit_count INTEGER,
    contributors_count INTEGER DEFAULT 1,
    stars_count INTEGER DEFAULT 0,
    complexity_score DECIMAL(3,2),
    innovation_score DECIMAL(3,2),
    interview_value_score DECIMAL(3,2),
    talking_points JSONB,
    impact_metrics JSONB,
    is_featured BOOLEAN DEFAULT FALSE,
    is_complete BOOLEAN DEFAULT TRUE,
    completion_date DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_projects_profile ON jobprep_projects(profile_id);
CREATE INDEX idx_projects_featured ON jobprep_projects(is_featured) WHERE is_featured = TRUE;

-- Interview Simulations Table
CREATE TABLE jobprep_interview_simulations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES jobprep_profiles(id) ON DELETE CASCADE,
    target_role_id UUID REFERENCES jobprep_target_roles(id) ON DELETE SET NULL,
    simulation_type VARCHAR(50) NOT NULL,
    difficulty_level VARCHAR(50) NOT NULL,
    company_style VARCHAR(100),
    duration_minutes INTEGER,
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    overall_score INTEGER,
    technical_score INTEGER,
    communication_score INTEGER,
    problem_solving_score INTEGER,
    hiring_decision VARCHAR(50),
    interviewer_feedback TEXT,
    strengths JSONB,
    weaknesses JSONB,
    improvement_recommendations JSONB,
    placement_mode BOOLEAN DEFAULT FALSE,
    time_pressure_handled BOOLEAN,
    session_document_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_simulations_profile ON jobprep_interview_simulations(profile_id);
CREATE INDEX idx_simulations_type ON jobprep_interview_simulations(simulation_type);
CREATE INDEX idx_simulations_date ON jobprep_interview_simulations(started_at DESC);

-- Practice Sessions Table
CREATE TABLE jobprep_practice_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES jobprep_profiles(id) ON DELETE CASCADE,
    skill_id UUID REFERENCES jobprep_skills(id) ON DELETE SET NULL,
    practice_type VARCHAR(50) NOT NULL,
    topic VARCHAR(200) NOT NULL,
    difficulty VARCHAR(50),
    score INTEGER,
    time_spent_seconds INTEGER,
    attempts_count INTEGER DEFAULT 1,
    completed BOOLEAN DEFAULT FALSE,
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    ai_feedback TEXT,
    hint_used_count INTEGER DEFAULT 0,
    session_document_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_practice_profile ON jobprep_practice_sessions(profile_id);
CREATE INDEX idx_practice_skill ON jobprep_practice_sessions(skill_id);
CREATE INDEX idx_practice_date ON jobprep_practice_sessions(started_at DESC);

-- Readiness Assessments Table
CREATE TABLE jobprep_readiness_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES jobprep_profiles(id) ON DELETE CASCADE,
    target_role_id UUID REFERENCES jobprep_target_roles(id) ON DELETE SET NULL,
    overall_readiness_score INTEGER NOT NULL,
    readiness_level VARCHAR(50),
    technical_skills_score INTEGER,
    communication_skills_score INTEGER,
    problem_solving_score INTEGER,
    domain_knowledge_score INTEGER,
    critical_gaps JSONB,
    recommended_actions JSONB,
    estimated_time_to_ready_days INTEGER,
    interview_success_probability DECIMAL(3,2),
    assessment_type VARCHAR(50) DEFAULT 'automatic',
    assessed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_assessments_profile ON jobprep_readiness_assessments(profile_id);
CREATE INDEX idx_assessments_date ON jobprep_readiness_assessments(assessed_at DESC);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_jobprep_profiles_updated_at BEFORE UPDATE ON jobprep_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_jobprep_target_roles_updated_at BEFORE UPDATE ON jobprep_target_roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_jobprep_skills_updated_at BEFORE UPDATE ON jobprep_skills FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_jobprep_projects_updated_at BEFORE UPDATE ON jobprep_projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_jobprep_simulations_updated_at BEFORE UPDATE ON jobprep_interview_simulations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## Appendix E: Example Data

### Sample Profile
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": 1,
  "current_status": "job_seeker",
  "target_timeline": "1-3_months",
  "experience_level": "mid",
  "overall_readiness_score": 68,
  "placement_mode_enabled": false,
  "created_at": "2026-02-01T10:00:00Z"
}
```

### Sample Target Role
```json
{
  "id": "650e8400-e29b-41d4-a716-446655440000",
  "profile_id": "550e8400-e29b-41d4-a716-446655440000",
  "role_title": "AI/ML Engineer",
  "role_category": "ml_ai",
  "seniority_level": "mid",
  "market_demand": "high",
  "salary_range_min": 140000,
  "salary_range_max": 220000,
  "required_skills": [
    {"name": "Machine Learning", "importance": 0.45, "required_level": 4},
    {"name": "Python", "importance": 0.35, "required_level": 5},
    {"name": "Mathematics", "importance": 0.20, "required_level": 3}
  ],
  "readiness_score": 68,
  "is_primary": true
}
```

### Sample Skill
```json
{
  "id": "750e8400-e29b-41d4-a716-446655440000",
  "profile_id": "550e8400-e29b-41d4-a716-446655440000",
  "skill_name": "Machine Learning",
  "skill_category": "ml_theory",
  "current_level": 3,
  "target_level": 4,
  "evidence_count": 8,
  "evidence_strength": 0.75,
  "is_critical": true,
  "is_gap": false
}
```

---

## Summary

This document provides a **complete, production-ready blueprint** for implementing the Job Prep feature in the Engunity platform. All major components are designed:

✅ **Database Schema** - PostgreSQL + MongoDB  
✅ **Backend API** - 40+ endpoints with FastAPI  
✅ **AI Integration** - Groq/Gemini for intelligent features  
✅ **Frontend Services** - TypeScript service layer + Zustand store  
✅ **Testing Strategy** - Unit, integration, E2E tests  
✅ **Security** - Authentication, authorization, rate limiting  
✅ **Performance** - Caching, indexing, optimization  
✅ **Deployment** - Complete checklist and troubleshooting  

**Ready to implement immediately!**

