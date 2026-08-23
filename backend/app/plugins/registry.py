from dataclasses import dataclass, field


@dataclass(frozen=True)
class Plugin:
    id: str
    name: str
    description: str
    icon: str
    category: str
    scopes: list[str] = field(default_factory=list)
    requires_approval: bool = False
    connected: bool = False


PLUGIN_CATALOG: list[Plugin] = [
    Plugin(
        id="notion",
        name="Notion",
        description="Read, create, and update pages and databases in your Notion workspace.",
        icon="📝",
        category="Productivity",
        scopes=["pages.read", "pages.write", "database.query"],
    ),
    Plugin(
        id="github",
        name="GitHub",
        description="Inspect repositories, issues, and pull requests, and run code through the agent.",
        icon="🐙",
        category="Development",
        scopes=["repo.read", "issues.read", "pr.read"],
    ),
    Plugin(
        id="google_drive",
        name="Google Drive",
        description="Search and retrieve documents and files stored in Google Drive.",
        icon="📁",
        category="Storage",
        scopes=["files.read"],
    ),
    Plugin(
        id="slack",
        name="Slack",
        description="Read and post messages in channels to coordinate work with your team.",
        icon="💬",
        category="Communication",
        scopes=["channels.read", "messages.read", "messages.write"],
        requires_approval=True,
    ),
    Plugin(
        id="jira",
        name="Jira",
        description="Fetch issues, sprints, and project status from Jira.",
        icon="🎯",
        category="Project Management",
        scopes=["issues.read", "projects.read"],
    ),
    Plugin(
        id="linear",
        name="Linear",
        description="Read and manage issues and cycles in Linear.",
        icon="📐",
        category="Project Management",
        scopes=["issues.read", "cycles.read"],
    ),
    Plugin(
        id="google_calendar",
        name="Google Calendar",
        description="Read availability and schedule events on your calendar.",
        icon="🗓",
        category="Productivity",
        scopes=["events.read", "events.write"],
        requires_approval=True,
    ),
    Plugin(
        id="gmail",
        name="Gmail",
        description="Search and read emails, and draft replies.",
        icon="✉️",
        category="Communication",
        scopes=["mail.read", "mail.write"],
        requires_approval=True,
    ),
    Plugin(
        id="dropbox",
        name="Dropbox",
        description="Access and retrieve files from your Dropbox storage.",
        icon="📦",
        category="Storage",
        scopes=["files.read"],
    ),
    Plugin(
        id="airtable",
        name="Airtable",
        description="Query and update records in Airtable bases.",
        icon="🟣",
        category="Productivity",
        scopes=["base.read", "records.read", "records.write"],
    ),
    Plugin(
        id="confluence",
        name="Confluence",
        description="Search and read pages from your Confluence knowledge space.",
        icon="📄",
        category="Knowledge",
        scopes=["pages.read", "space.read"],
    ),
    Plugin(
        id="figma",
        name="Figma",
        description="Inspect design files, frames, and components.",
        icon="🎨",
        category="Design",
        scopes=["files.read"],
    ),
    Plugin(
        id="gitlab",
        name="GitLab",
        description="Inspect repositories, merge requests, and CI pipelines.",
        icon="🦊",
        category="Development",
        scopes=["repo.read", "mr.read"],
    ),
    Plugin(
        id="zapier",
        name="Zapier",
        description="Trigger and monitor automations across thousands of connected apps.",
        icon="⚡",
        category="Automation",
        scopes=["zaps.run"],
        requires_approval=True,
    ),
]

CATALOG_BY_ID = {p.id: p for p in PLUGIN_CATALOG}


def plugin_context(plugin_ids: list[str]) -> str:
    """Builds the system-instruction block injected into the LLM for enabled plugins."""
    selected = [CATALOG_BY_ID[p] for p in plugin_ids if p in CATALOG_BY_ID]
    if not selected:
        return ""
    lines = [
        "The user has enabled the following integrations for this conversation. "
        "You MAY use them when the task requires it, but only if the needed data or action is within their scope:",
    ]
    for p in selected:
        scope_note = ", ".join(p.scopes) if p.scopes else "general access"
        approval = "NOTE: writes require explicit user approval." if p.requires_approval else "No approval needed for reads."
        lines.append(f"- {p.name} ({p.id}): {p.description} Scopes: {scope_note}. {approval}")
    lines.append("Do not fabricate data from these integrations. If you cannot actually reach them, say so clearly.")
    return "\n".join(lines)


def default_enabled_ids() -> list[str]:
    return [p.id for p in PLUGIN_CATALOG if p.connected]