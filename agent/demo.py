#!/usr/bin/env python3
"""
TradvisorAI Terminal Demo — Cursor-like experience for stock analysis.

Now powered by Grok's built-in tools:
  - web_search: Grok browses actual web pages server-side
  - code_interpreter: Grok runs Python in a real sandbox
  - update_plan: Our custom planning tool for Cursor-like progress tracking

Run:
    python demo.py
"""

from rich.console import Console
from rich.markdown import Markdown
from rich.panel import Panel
from rich.table import Table
from rich import box

from agent import (
    TradvisorAgent,
    PlanUpdate,
    ToolCall,
    TextDelta,
    Done,
)

console = Console()


# ═══════════════════════════════════════════════════════════════
# UI COMPONENTS
# ═══════════════════════════════════════════════════════════════


def print_banner():
    """Print the welcome banner."""
    console.print()
    console.print(Panel(
        "[bold]AI-powered stock research agent[/bold]\n"
        "[dim]Grok searches the web, executes code, and builds valuations autonomously.[/dim]\n\n"
        "[dim]Examples:[/dim]\n"
        '  [cyan]"Analyze NVDA"[/cyan]\n'
        '  [cyan]"Find undervalued tech stocks"[/cyan]\n'
        '  [cyan]"Compare AAPL vs MSFT"[/cyan]\n'
        '  [cyan]"What is TSLA\'s fair value?"[/cyan]\n\n'
        "[dim]Type [bold]quit[/bold] to exit.[/dim]",
        title="[bold blue] TradvisorAI [/bold blue]",
        subtitle="[dim]Powered by Grok (Responses API)[/dim]",
        border_style="blue",
        padding=(1, 2),
    ))
    console.print()


def render_plan(plan_data: dict, compact: bool = False):
    """Render the execution plan. Compact: one-line progress after first full plan."""
    steps = plan_data.get("steps", [])
    task = plan_data.get("task_summary", "Execution Plan")
    explanation = plan_data.get("explanation", "").strip()
    completed = sum(1 for s in steps if s.get("status") == "completed")
    total = len(steps)

    if compact and total > 0:
        line = f"  [dim]⟳[/dim] [cyan]{task[:50]}{'…' if len(task) > 50 else ''}[/cyan] [dim]({completed}/{total})[/dim]"
        if explanation:
            line += f"  [dim]— {explanation[:40]}{'…' if len(explanation) > 40 else ''}[/dim]"
        console.print(line)
        return

    if explanation:
        console.print(f"  [dim]→[/dim] [italic]{explanation}[/italic]")
    table = Table(
        box=box.ROUNDED,
        border_style="cyan",
        title=plan_data.get("task_summary", "Execution Plan"),
        title_style="bold cyan",
        show_header=False,
        padding=(0, 1),
        expand=True,
    )
    table.add_column("", width=3)
    table.add_column("Step", ratio=3)
    table.add_column("Result", ratio=2, style="dim")

    STATUS_ICONS = {
        "pending": ("[dim][ ][/dim]", "dim"),
        "in_progress": ("[yellow][>][/yellow]", "yellow"),
        "completed": ("[green][x][/green]", "green"),
        "skipped": ("[dim][-][/dim]", "dim strike"),
    }

    for step in plan_data.get("steps", []):
        status = step.get("status", "pending")
        icon, style = STATUS_ICONS.get(status, ("[dim][ ][/dim]", "dim"))
        result = step.get("result", "") or ""
        if len(result) > 60:
            result = result[:57] + "..."
        table.add_row(
            icon,
            f"[{style}]{step.get('description', '')}[/{style}]",
            f"[dim]{result}[/dim]",
        )

    console.print()
    console.print(table)


def render_tool_call(event: ToolCall):
    """Render a tool call indicator."""
    if event.name == "web_search":
        console.print(
            f"  [bold yellow]>> Web Search[/bold yellow] [dim](server-side)[/dim]"
        )
    elif event.name == "code_execution":
        console.print(
            f"  [bold magenta]>> Code Execution[/bold magenta] [dim](server-side)[/dim]"
        )
    elif event.name == "update_plan":
        pass  # Plan is rendered separately
    else:
        console.print(
            f"  [bold]>> {event.name}[/bold]: {event.description}"
        )


def render_final_response(text: str):
    """Render the final analysis response."""
    console.print()
    console.print(Panel(
        Markdown(text),
        title="[bold green] Analysis [/bold green]",
        border_style="green",
        padding=(1, 2),
    ))


# ═══════════════════════════════════════════════════════════════
# MAIN LOOP
# ═══════════════════════════════════════════════════════════════


def run_query(query: str):
    """Run a single query through the agent and display results."""
    agent = TradvisorAgent()
    collected_text = ""
    plan_count = 0

    console.print()
    console.print("[bold blue]Agent working...[/bold blue]")

    for event in agent.run(query):
        if isinstance(event, PlanUpdate):
            plan_count += 1
            compact = plan_count > 1 and not event.is_complete
            render_plan({
                "task_summary": event.task_summary,
                "steps": event.steps,
                "is_complete": event.is_complete,
                "explanation": getattr(event, "explanation", "") or "",
            }, compact=compact)

        elif isinstance(event, ToolCall):
            render_tool_call(event)

        elif isinstance(event, TextDelta):
            collected_text += event.content

        elif isinstance(event, Done):
            if collected_text:
                render_final_response(collected_text)
            console.print()
            console.print(
                f"[dim]Completed in {event.iterations} iteration(s)[/dim]"
            )


def main():
    """Main interactive loop."""
    print_banner()

    while True:
        try:
            console.print()
            query = console.input("[bold green]You:[/bold green] ").strip()

            if not query:
                continue
            if query.lower() in ("quit", "exit", "q"):
                console.print("[dim]Goodbye![/dim]")
                break

            run_query(query)

        except KeyboardInterrupt:
            console.print("\n[dim]Interrupted. Type 'quit' to exit.[/dim]")
        except Exception as e:
            console.print(f"[bold red]Error:[/bold red] {str(e)}")
            console.print("[dim]Try again or check your API key.[/dim]")


if __name__ == "__main__":
    main()
