import {
  LayoutDashboard,
  MessageSquarePlus,
  MessagesSquare,
  Sparkles,
  FolderKanban,
  Search,
  Bot,
  PlusCircle,
  Puzzle,
  Store,
  Workflow,
  Clock,
  Play,
  ShieldCheck,
  Library,
  FileText,
  Brain,
  Wrench,
  Plug,
  Globe,
  Globe2,
  Terminal,
  Network,
  BarChart3,
  FlaskConical,
  ScrollText,
  Settings,
  Lock,
  UserRound,
  History,
  Boxes,
  Activity,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  shortcut?: string;
  badge?: string;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export const navSections: NavSection[] = [
  {
    label: "Main",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, shortcut: "gd" },
      { title: "New Chat", href: "/chat", icon: MessageSquarePlus, shortcut: "gc" },
      { title: "Assistant", href: "/assistant", icon: Sparkles },
      { title: "Conversations", href: "/conversations", icon: MessagesSquare },
      { title: "Projects", href: "/projects", icon: FolderKanban },
      { title: "Website Builder", href: "/website-builder", icon: Globe2 },
      { title: "Search", href: "/search", icon: Search },
    ],
  },
  {
    label: "Agents",
    items: [
      { title: "My Agents", href: "/agents", icon: Bot },
      { title: "Create Agent", href: "/agents/new", icon: PlusCircle },
      { title: "Playground", href: "/playground", icon: Activity },
      { title: "Agent Templates", href: "/agents?tab=templates", icon: Puzzle },
      { title: "Marketplace", href: "/marketplace", icon: Store },
    ],
  },
  {
    label: "Automation",
    items: [
      { title: "Workflows", href: "/workflows", icon: Workflow },
      { title: "Multi-Agent", href: "/multi-agent", icon: Network },
      { title: "Schedules", href: "/schedules", icon: Clock },
      { title: "Agent Runs", href: "/runs", icon: Play },
      { title: "Approvals", href: "/approvals", icon: ShieldCheck, badge: "new" },
    ],
  },
  {
    label: "Knowledge",
    items: [
      { title: "Knowledge Base", href: "/knowledge", icon: Library },
      { title: "Documents", href: "/documents", icon: FileText },
      { title: "Memory", href: "/memory", icon: Brain },
    ],
  },
  {
    label: "Tools",
    items: [
      { title: "Tool Library", href: "/tools", icon: Wrench },
      { title: "Integrations", href: "/integrations", icon: Plug },
      { title: "Web Search", href: "/tools", icon: Globe },
      { title: "Code Execution", href: "/tools", icon: Terminal },
    ],
  },
  {
    label: "Observability",
    items: [
      { title: "Live Runs", href: "/observability", icon: Activity },
      { title: "Analytics", href: "/analytics", icon: BarChart3 },
      { title: "Evaluations", href: "/evaluations", icon: FlaskConical },
      { title: "Versions", href: "/versions", icon: Boxes },
      { title: "Logs", href: "/logs", icon: ScrollText },
    ],
  },
  {
    label: "System",
    items: [
      { title: "Settings", href: "/settings", icon: Settings },
      { title: "Security", href: "/settings?tab=security", icon: Lock },
      { title: "Profile", href: "/settings?tab=profile", icon: UserRound },
    ],
  },
];

export const modelOptions = [
  { id: "default", label: "Auto (Default)" },
  { id: "gpt-4o-mini", label: "GPT-4o mini" },
  { id: "gpt-4o", label: "GPT-4o" },
  { id: "claude-sonnet-4-5", label: "Claude Sonnet 4.5" },
];