import requests
import json
import time
import os
from dotenv import load_dotenv

load_dotenv()

BASE_URL = "http://localhost:8000/api/v1"
# Get token from environment variable - NEVER hardcode tokens
TOKEN = os.getenv("TEST_AUTH_TOKEN", "")

if not TOKEN:
    print("ERROR: TEST_AUTH_TOKEN environment variable not set.")
    print("Please set your test auth token in the environment:")
    print("  export TEST_AUTH_TOKEN='your_token_here'")
    print("Or configure it in your .env file")
    exit(1)

def test_jobprep_e2e():
    headers = {"Authorization": f"Bearer {TOKEN}"}

    print("--- Starting End-to-End JobPrep Verification ---")

    # 1. Profile Creation/Fetch
    print("\n[1] Checking Profile...")
    res = requests.get(f"{BASE_URL}/jobprep/profile", headers=headers)
    if res.status_code == 404:
        print("Creating new profile...")
        profile_data = {
            "current_status": "active_seeker",
            "target_timeline": "immediate",
            "experience_level": "mid_level"
        }
        res = requests.post(f"{BASE_URL}/jobprep/profile", json=profile_data, headers=headers)

    if res.status_code not in [200, 201]:
        print(f"FAILED: Profile status {res.status_code}")
        return
    profile = res.json()
    print(f"SUCCESS: Profile ID {profile['id']} Ready Score: {profile['overall_readiness_score']}")

    # 2. Target Roles
    print("\n[2] Checking Target Roles...")
    role_data = {
        "role_title": "Staff AI Engineer",
        "role_category": "AI/ML",
        "is_primary": True
    }
    res = requests.post(f"{BASE_URL}/jobprep/roles", json=role_data, headers=headers)
    if res.status_code != 200:
        print(f"FAILED: Create Role status {res.status_code}")
    role = res.json()
    role_id = role['id']
    print(f"SUCCESS: Created Role: {role['role_title']}")

    # 3. AI Role Analysis
    print("\n[3] Triggering AI Role Analysis...")
    res = requests.post(f"{BASE_URL}/jobprep/roles/{role_id}/analyze", headers=headers)
    if res.status_code != 200:
        print(f"FAILED: Role Analysis status {res.status_code}")
    else:
        analysis = res.json()
        print(f"SUCCESS: AI Analysis complete. Recommended skills: {analysis.get('recommended_skills', [])}")

    # 4. Skills
    print("\n[4] Checking Skill Matrix...")
    skill_data = {
        "skill_name": "Distributed Systems",
        "skill_category": "Backend",
        "target_level": 5
    }
    res = requests.post(f"{BASE_URL}/jobprep/skills", json=skill_data, headers=headers)
    skill = res.json()
    skill_id = skill['id']
    print(f"SUCCESS: Added skill {skill['skill_name']}")

    # 5. Skill Evidence
    print("\n[5] Adding Skill Evidence...")
    evidence_data = {
        "title": "Implemented Multi-node Consensus",
        "evidence_type": "project",
        "description": "Used Raft protocol to ensure consistency",
        "source_url": "https://github.com/test/consensus"
    }
    res = requests.post(f"{BASE_URL}/jobprep/skills/{skill_id}/evidence", json=evidence_data, headers=headers)
    if res.status_code != 200:
        print(f"FAILED: Add Evidence status {res.status_code}")
    else:
        print("SUCCESS: Added evidence artifact")

    # 6. Projects & GitHub Import (Mocked in logic but end-to-end call)
    print("\n[6] Checking Project Analysis...")
    proj_data = {
        "title": "Neural Engine",
        "description": "High performance inference server",
        "tech_stack": ["C++", "CUDA", "TensorRT"]
    }
    res = requests.post(f"{BASE_URL}/jobprep/projects", json=proj_data, headers=headers)
    proj_id = res.json()['id']

    print("Triggering AI Project Analysis...")
    res = requests.post(f"{BASE_URL}/jobprep/projects/{proj_id}/analyze", headers=headers)
    if res.status_code == 200:
        print(f"SUCCESS: AI Analysis for project complete. Complexity: {res.json().get('complexity_score')}")

    # 7. Interview Simulation Flow
    print("\n[7] Testing Interview Simulation...")
    sim_data = {
        "simulation_type": "Technical Round",
        "difficulty_level": "senior",
        "target_role_id": role_id
    }
    res = requests.post(f"{BASE_URL}/jobprep/simulations", json=sim_data, headers=headers)
    sim_id = res.json()['id']

    print("Fetching AI Question...")
    res = requests.get(f"{BASE_URL}/jobprep/simulations/question?role_id={role_id}&difficulty=senior", headers=headers)
    question = res.json().get('question')
    print(f"Question: {question}")

    print("Submitting Response for AI Evaluation...")
    eval_params = {
        "sim_id": sim_id,
        "question": question,
        "user_response": "I would use a distributed key-value store with eventual consistency to handle high write throughput while maintaining availability."
    }
    res = requests.post(f"{BASE_URL}/jobprep/simulations/{sim_id}/evaluate", params=eval_params, headers=headers)
    if res.status_code == 200:
        evaluation = res.json()
        print(f"SUCCESS: Evaluation complete. Score: {evaluation.get('score')}/100")

    # 8. Gap Analysis & Readiness history
    print("\n[8] Checking Analytics...")
    res = requests.get(f"{BASE_URL}/jobprep/analysis/gaps", headers=headers)
    print(f"Skill Gaps: {len(res.json())} detected")

    res = requests.get(f"{BASE_URL}/jobprep/analysis/readiness-history", headers=headers)
    print(f"Readiness History: {len(res.json())} records")

    print("\n--- End-to-End Verification Finished ---")

if __name__ == "__main__":
    # In this environment, we can't easily get a real JWT without user login.
    # This script is provided for the user to run or for me to run if I had a test token.
    print("Master verification script created. To run, set a valid TOKEN and execute.")
