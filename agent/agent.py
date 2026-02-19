"""
TradvisorAI Agentic Loop — OpenAI Responses API with Grok built-in tools.

Key upgrade from v1:
  - web_search runs SERVER-SIDE on Grok (browses actual pages, not just snippets)
  - code_interpreter runs SERVER-SIDE (real sandbox with numpy/pandas)
  - Stateful conversations via previous_response_id (cheaper, automatic caching)
  - Only custom functions (update_plan) are handled locally

Architecture:
  User gives high-level intent
    → Grok creates a plan (calls update_plan → returns to us)
    → Grok searches web + executes code AUTOMATICALLY (server-side)
    → Grok calls update_plan to report progress → returns to us
    → Repeat until plan is_complete
    → Grok produces final analysis text
"""

import json
from dataclasses import dataclass, field
from typing import Generator

from openai import OpenAI

from config import XAI_API_KEY, BASE_URL, MODEL, MAX_ITERATIONS
from prompts import SYSTEM_PROMPT
from tools import ALL_TOOLS, execute_function


# ═══════════════════════════════════════════════════════════════
# EVENT TYPES (yielded by the agent to the UI layer)
# ═══════════════════════════════════════════════════════════════


@dataclass
class PlanUpdate:
    """Agent created or updated its execution plan."""
    task_summary: str
    steps: list
    is_complete: bool
    explanation: str = ""


@dataclass
class ToolCall:
    """Agent is calling a tool (built-in or custom)."""
    name: str
    description: str = ""


@dataclass
class TextDelta:
    """Text chunk from the agent's response."""
    content: str


@dataclass
class Done:
    """Agent finished."""
    iterations: int
    plan: dict | None


# ═══════════════════════════════════════════════════════════════
# AGENT
# ═══════════════════════════════════════════════════════════════


class TradvisorAgent:
    """
    Agentic loop using the Responses API.

    Built-in tools (web_search, code_interpreter) execute automatically on
    Grok's servers.  Only custom function calls (update_plan) return to us
    for handling, creating the Cursor-style plan-update loop.
    """

    def __init__(self):
        self.client = OpenAI(
            api_key=XAI_API_KEY,
            base_url=BASE_URL,
        )
        self.plan: dict | None = None
        self.response_id: str | None = None

    # ── public ──────────────────────────────────────────────

    def run(self, user_query: str) -> Generator:
        """
        Run the full agentic loop for a user query.
        Yields events as the agent works.
        """
        self.plan = None
        self.response_id = None

        # First call — full input with system + user message
        input_messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_query},
        ]

        for iteration in range(1, MAX_ITERATIONS + 1):
            # ── Call the Responses API ──────────────────────
            try:
                kwargs = {
                    "model": MODEL,
                    "tools": ALL_TOOLS,
                    "input": input_messages,
                }
                # Continue stateful conversation if we have a previous response
                if self.response_id:
                    kwargs["previous_response_id"] = self.response_id

                response = self.client.responses.create(**kwargs)
                self.response_id = response.id

            except Exception as e:
                yield TextDelta(f"\n\nAPI Error: {e}")
                yield Done(iterations=iteration, plan=self.plan)
                return

            # ── Parse output items ──────────────────────────
            function_call_outputs = []

            for item in response.output:
                item_type = item.type

                # --- Built-in: web search executed server-side ---
                if item_type == "web_search_call":
                    yield ToolCall(name="web_search", description="Searching the web...")

                # --- Built-in: code interpreter executed server-side ---
                elif item_type == "code_interpreter_call":
                    yield ToolCall(name="code_execution", description="Executing Python code...")

                # --- Custom function call (update_plan) ---
                elif item_type == "function_call":
                    name = item.name
                    arguments = item.arguments
                    call_id = item.call_id

                    try:
                        args_dict = json.loads(arguments)
                    except json.JSONDecodeError:
                        args_dict = {}

                    yield ToolCall(name=name, description=args_dict.get("task_summary", ""))

                    # Track plan state
                    if name == "update_plan":
                        self.plan = args_dict
                        yield PlanUpdate(
                            task_summary=args_dict.get("task_summary", ""),
                            steps=args_dict.get("steps", []),
                            is_complete=args_dict.get("is_complete", False),
                            explanation=args_dict.get("explanation", "") or "",
                        )

                    # Execute the custom function
                    result = execute_function(name, arguments)

                    # Queue the result to send back
                    function_call_outputs.append({
                        "type": "function_call_output",
                        "call_id": call_id,
                        "output": result,
                    })

                # --- Text message from the model ---
                elif item_type == "message":
                    for content_part in getattr(item, "content", []):
                        if getattr(content_part, "type", "") == "output_text":
                            yield TextDelta(content_part.text)

            # ── Decide whether to continue ──────────────────
            if not function_call_outputs:
                # No custom function calls → model is done
                yield Done(iterations=iteration, plan=self.plan)
                return

            # Send function results back and continue the loop
            input_messages = function_call_outputs

        # Max iterations
        yield TextDelta("\n\n(Reached maximum iterations.)")
        yield Done(iterations=MAX_ITERATIONS, plan=self.plan)


def run_agent(query: str) -> Generator:
    """Convenience function to run the agent."""
    agent = TradvisorAgent()
    return agent.run(query)
