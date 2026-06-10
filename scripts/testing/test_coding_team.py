import asyncio
import os
import sys

# Add the backend directory to sys.path so we can import app modules
sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.agents.coding_team.workflow import create_coding_team_graph
from app.agents.coding_team.tools import write_file

async def run_test():
    print("🚀 Starting Coding Team Test...")

    # 1. Setup a dummy file to work on
    test_file_path = "backend/temp_login_button.tsx"
    initial_content = """
    export const LoginButton = () => {
        return <button>Log In</button>;
    }
    """
    write_file.invoke({"file_path": test_file_path, "content": initial_content})
    print(f"📝 Created dummy file at {test_file_path}")

    # 2. Initialize the graph
    app = create_coding_team_graph()

    # 3. Define the task
    initial_state = {
        "task_description": "Update the login button to have a blue background and say 'Sign In' instead of 'Log In'.",
        "current_file": test_file_path, # Helping it out for the test
        "iteration_count": 0,
        "messages": []
    }

    print("\n🎬 Invoking the Agent Team...")

    # 4. Run the graph
    # LangGraph apps are async
    async for output in app.astream(initial_state):
        for key, value in output.items():
            print(f"\n--- Node: {key} ---")
            # print(f"State Update: {value}")
            if "messages" in value and value["messages"]:
                last_msg = value["messages"][-1]
                content = last_msg.get("content", "")
                if isinstance(content, str):
                    print(f"💬 {content}")
                else:
                    print(f"💬 {str(content)}")

            if "diff" in value:
                print(f"✨ Diff: {value['diff']}")

            if "review_feedback" in value:
                print(f"👀 Review: {value['review_feedback']}")

    print("\n✅ Workflow Completed.")

    # 5. Verify result
    with open(test_file_path, "r") as f:
        final_content = f.read()

    print(f"\n📄 Final File Content:\n{final_content}")

    # Cleanup
    if os.path.exists(test_file_path):
        os.remove(test_file_path)
        print("\n🧹 Cleaned up temp file.")

if __name__ == "__main__":
    asyncio.run(run_test())
