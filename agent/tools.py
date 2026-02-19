"""
Tool definitions for TradvisorAI Agent.

Architecture:
- Built-in tools (web_search, code_interpreter) run SERVER-SIDE on xAI/Grok
  → No local DuckDuckGo or subprocess needed!
  → Grok browses actual web pages and runs code in a real sandbox
- Custom function tools (update_plan) run locally
  → We handle these in the agentic loop

OpenAI Responses API format.
"""

import json


# ═══════════════════════════════════════════════════════════════
# TOOL DEFINITIONS (Responses API format)
# ═══════════════════════════════════════════════════════════════

# Built-in tools (execute server-side, no local handling needed)
WEB_SEARCH_TOOL = {"type": "web_search"}
CODE_INTERPRETER_TOOL = {"type": "code_interpreter"}

# Custom function tools (we handle locally)
UPDATE_PLAN_TOOL = {
    "type": "function",
    "name": "update_plan",
    "description": (
        "Create or update the execution plan for the current task. "
        "MUST be called at the START of every task to create a plan. "
        "Call again after each major step to update progress. "
        "The user sees this plan in real-time, so make steps clear and concise."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "task_summary": {
                "type": "string",
                "description": "One-line summary of the overall task",
            },
            "steps": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "id": {"type": "integer"},
                        "description": {"type": "string"},
                        "status": {
                            "type": "string",
                            "enum": [
                                "pending",
                                "in_progress",
                                "completed",
                                "skipped",
                            ],
                        },
                        "result": {
                            "type": "string",
                            "description": "Brief result summary (when completed)",
                        },
                    },
                    "required": ["id", "description", "status"],
                },
            },
            "is_complete": {
                "type": "boolean",
                "description": "Set true when ALL steps are done and final analysis is ready",
            },
            "explanation": {
                "type": "string",
                "description": "Optional one-sentence on why this step and how it contributes. Shown to user as 'thinking out loud'.",
            },
        },
        "required": ["steps", "is_complete"],
    },
}

# All tools to pass to the API
ALL_TOOLS = [
    WEB_SEARCH_TOOL,
    CODE_INTERPRETER_TOOL,
    UPDATE_PLAN_TOOL,
]


# ═══════════════════════════════════════════════════════════════
# CUSTOM FUNCTION HANDLERS (only for our local functions)
# ═══════════════════════════════════════════════════════════════


def handle_update_plan(arguments: str) -> str:
    """Process update_plan call. Returns acknowledgment."""
    return json.dumps({"status": "ok", "message": "Plan updated. Continue with next step."})


FUNCTION_HANDLERS = {
    "update_plan": handle_update_plan,
}


def execute_function(name: str, arguments: str) -> str:
    """Execute a custom function by name."""
    handler = FUNCTION_HANDLERS.get(name)
    if not handler:
        return json.dumps({"error": f"Unknown function: {name}"})
    return handler(arguments)
