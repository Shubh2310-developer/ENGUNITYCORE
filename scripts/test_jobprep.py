import requests
import json

BASE_URL = "http://localhost:8000/api/v1"
TOKEN = "" # Need a valid token for testing

def test_jobprep_flow():
    if not TOKEN:
        print("Please provide a valid JWT TOKEN for testing")
        return

    headers = {"Authorization": f"Bearer {TOKEN}"}

    # 1. Create Profile
    print("Creating Profile...")
    profile_data = {
        "current_status": "job_seeker",
        "target_timeline": "1-3_months",
        "experience_level": "mid"
    }
    res = requests.post(f"{BASE_URL}/jobprep/profile", json=profile_data, headers=headers)
    print(res.status_code, res.json())

    # 2. Get Profile
    print("\nGetting Profile...")
    res = requests.get(f"{BASE_URL}/jobprep/profile", headers=headers)
    print(res.status_code, res.json())
    profile_id = res.json().get("id")

    # 3. Create Target Role
    print("\nCreating Target Role...")
    role_data = {
        "role_title": "Senior AI Engineer",
        "role_category": "AI/ML",
        "is_primary": True
    }
    res = requests.post(f"{BASE_URL}/jobprep/roles", json=role_data, headers=headers)
    print(res.status_code, res.json())
    role_id = res.json().get("id")

    # 4. Create Skill
    print("\nCreating Skill...")
    skill_data = {
        "skill_name": "Python",
        "skill_category": "Programming",
        "target_level": 5
    }
    res = requests.post(f"{BASE_URL}/jobprep/skills", json=skill_data, headers=headers)
    print(res.status_code, res.json())

    # 5. Create Project
    print("\nCreating Project...")
    project_data = {
        "title": "Engunity AI",
        "description": "End-to-end AI platform",
        "tech_stack": ["FastAPI", "React", "Groq"]
    }
    res = requests.post(f"{BASE_URL}/jobprep/projects", json=project_data, headers=headers)
    print(res.status_code, res.json())
    project_id = res.json().get("id")

    # 6. Analyze Project (AI)
    print("\nAnalyzing Project with AI...")
    res = requests.post(f"{BASE_URL}/jobprep/projects/{project_id}/analyze", headers=headers)
    print(res.status_code, res.json())

    # 7. Start Simulation
    print("\nStarting Simulation...")
    sim_data = {
        "simulation_type": "Technical Round",
        "difficulty_level": "Mid-Level",
        "target_role_id": role_id
    }
    res = requests.post(f"{BASE_URL}/jobprep/simulations", json=sim_data, headers=headers)
    print(res.status_code, res.json())
    sim_id = res.json().get("id")

    # 8. Get Question (AI)
    print("\nGetting AI Interview Question...")
    res = requests.get(f"{BASE_URL}/jobprep/simulations/question?role_id={role_id}", headers=headers)
    print(res.status_code, res.json())

if __name__ == "__main__":
    # Note: This script requires a running backend and a valid token.
    # It is intended for manual verification or as a template for automated tests.
    pass
