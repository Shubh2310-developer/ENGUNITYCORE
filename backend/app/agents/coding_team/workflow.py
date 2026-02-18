from typing import Literal

from langgraph.graph import StateGraph, END
from app.agents.coding_team.state import AgentState
from app.agents.coding_team.nodes import team_lead_node, coder_node, reviewer_node

def should_continue(state: AgentState) -> Literal["team_lead", "end"]:
    """
    Determine next step after Reviewer.
    If status is 'completed', end.
    If status is 'planning' (rejected), go back to team lead.
    """
    status = state.get("status")
    if status == "completed":
        return "end"
    return "team_lead"

def create_coding_team_graph():
    workflow = StateGraph(AgentState)

    # Add nodes
    workflow.add_node("team_lead", team_lead_node)
    workflow.add_node("coder", coder_node)
    workflow.add_node("reviewer", reviewer_node)

    # Set entry point
    workflow.set_entry_point("team_lead")

    # Add edges
    # Lead always sends to Coder after planning
    workflow.add_edge("team_lead", "coder")

    # Coder always sends to Reviewer after coding
    workflow.add_edge("coder", "reviewer")

    # Reviewer decides: Loop back or End
    workflow.add_conditional_edges(
        "reviewer",
        should_continue,
        {
            "team_lead": "team_lead",
            "end": END
        }
    )

    return workflow.compile()
