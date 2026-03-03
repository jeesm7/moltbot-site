export type SkillCategory =
  | "All"
  | "Productivity"
  | "Development"
  | "DevOps"
  | "Communication"
  | "Automation"
  | "Security"
  | "Finance"
  | "Media"
  | "AI Tools"
  | "Search"
  | "Other";

export interface Skill {
  name: string;
  slug: string;
  description: string;
  downloads: number;
  author: string;
  category: SkillCategory;
  icon: string;
}

const categoryIcons: Record<SkillCategory, string> = {
  All: "📦",
  Productivity: "⚡",
  Development: "🛠️",
  DevOps: "🔧",
  Communication: "💬",
  Automation: "🤖",
  Security: "🛡️",
  Finance: "📊",
  Media: "🎬",
  "AI Tools": "🧠",
  Search: "🔍",
  Other: "🔌",
};

function mapCategory(raw: string): SkillCategory {
  const map: Record<string, SkillCategory> = {
    productivity: "Productivity",
    development: "Development",
    devops: "DevOps",
    communication: "Communication",
    automation: "Automation",
    security: "Security",
    finance: "Finance",
    media: "Media",
    "ai-tools": "AI Tools",
    search: "Search",
    iot: "Other",
    crypto: "Other",
    research: "Other",
    data: "Other",
    system: "Other",
  };
  return map[raw] || "Other";
}

function getIcon(category: SkillCategory): string {
  return categoryIcons[category] || "🔌";
}

export const categories: SkillCategory[] = [
  "All",
  "Productivity",
  "Development",
  "DevOps",
  "Communication",
  "Automation",
  "Security",
  "Finance",
  "Media",
  "AI Tools",
  "Search",
  "Other",
];

export const skills: Skill[] = [
  { name: "Konteks", slug: "konteks", description: "Connect to Konteks for persistent memory, task management, and context sharing between conversations.", downloads: 0, author: "jamesalmeida", category: mapCategory("productivity"), icon: getIcon(mapCategory("productivity")) },
  { name: "IntoDNS", slug: "intodns", description: "DNS & email security analysis. Scan domains for DNS, DNSSEC, SPF, DKIM, DMARC issues.", downloads: 0, author: "RoscoNL", category: mapCategory("devops"), icon: getIcon(mapCategory("devops")) },
  { name: "Google Cloud Platform", slug: "gcloud", description: "Manage GCP resources via gcloud CLI. Compute Engine, Cloud Run, Firebase, Cloud Storage, and project management.", downloads: 0, author: "jortega0033", category: mapCategory("devops"), icon: getIcon(mapCategory("devops")) },
  { name: "Beszel Check", slug: "beszel-check", description: "Monitor home lab servers via Beszel (PocketBase).", downloads: 0, author: "karakuscem", category: mapCategory("devops"), icon: getIcon(mapCategory("devops")) },
  { name: "ClickUp", slug: "clickup", description: "Interact with ClickUp project management. Tasks, spaces, lists, assignees, and workflow automation.", downloads: 2, author: "shubhs0707", category: mapCategory("productivity"), icon: getIcon(mapCategory("productivity")) },
  { name: "Resume Builder", slug: "resume-cv-builder", description: "Create professional resumes and CVs. ATS-friendly formats, optimize bullet points, tailor for specific jobs.", downloads: 3, author: "Sebastian-Buitrag0", category: mapCategory("productivity"), icon: getIcon(mapCategory("productivity")) },
  { name: "Morning Briefing", slug: "morning-briefing", description: "Daily morning briefing with news, weather, calendar, and task summaries.", downloads: 1, author: "lucas-riverbi", category: mapCategory("productivity"), icon: getIcon(mapCategory("productivity")) },
  { name: "Spacescan", slug: "spacescan", description: "Scan and analyze space data and satellite imagery.", downloads: 1, author: "Koba42Corp", category: mapCategory("data"), icon: getIcon(mapCategory("data")) },
  { name: "Bitcoin Daily", slug: "bitcoin-daily", description: "Daily digest of Bitcoin Development mailing list and Bitcoin Core commits.", downloads: 4, author: "clawd21", category: mapCategory("crypto"), icon: getIcon(mapCategory("crypto")) },
  { name: "Telegram Bot Builder", slug: "telegram-bot", description: "Build and manage Telegram bots. Create bots, send messages, handle webhooks, manage groups and channels.", downloads: 211, author: "Sebastian-Buitrag0", category: mapCategory("communication"), icon: getIcon(mapCategory("communication")) },
  { name: "Update Plus", slug: "update-plus", description: "Full backup, update, and restore for Moltbot/Clawdbot with auto-rollback.", downloads: 18, author: "hopyky", category: mapCategory("system"), icon: getIcon(mapCategory("system")) },
  { name: "Lobster", slug: "lobster", description: "Workflow runtime for deterministic pipelines with approval gates and multi-step automations.", downloads: 8, author: "guwidoe", category: mapCategory("automation"), icon: getIcon(mapCategory("automation")) },
  { name: "Sure", slug: "sure", description: "Get financial reports from Sure personal financial board.", downloads: 7, author: "bt0r", category: mapCategory("finance"), icon: getIcon(mapCategory("finance")) },
  { name: "Prompt Guard", slug: "prompt-guard", description: "Advanced prompt injection defense. Multi-language detection, severity scoring, automatic logging.", downloads: 120, author: "seojoonkim", category: mapCategory("security"), icon: getIcon(mapCategory("security")) },
  { name: "Fabric Bridge", slug: "fabric-bridge", description: "Run Fabric AI patterns for text transformation, analysis, and content creation. 242+ patterns.", downloads: 21, author: "koriyoshi2041", category: mapCategory("ai-tools"), icon: getIcon(mapCategory("ai-tools")) },
  { name: "Flow", slug: "flow", description: "Intelligent skill orchestrator that compiles natural language requests into secure, reusable workflows.", downloads: 32, author: "bvinci1-design", category: mapCategory("automation"), icon: getIcon(mapCategory("automation")) },
  { name: "Paper Recommendation", slug: "paper-recommendation", description: "Academic paper recommendation and research discovery engine.", downloads: 13, author: "SJF-ECNU", category: mapCategory("research"), icon: getIcon(mapCategory("research")) },
  { name: "Find Skills", slug: "find-skills", description: "Discover and install agent skills from the marketplace. Search by capability or need.", downloads: 189, author: "JimLiuxinghai", category: mapCategory("system"), icon: getIcon(mapCategory("system")) },
  { name: "Dont Hack Me", slug: "dont-hack-me", description: "Security self-check for your AI assistant. Quick audit to catch dangerous misconfigurations.", downloads: 115, author: "peterokase42", category: mapCategory("security"), icon: getIcon(mapCategory("security")) },
  { name: "Skill Scanner", slug: "skill-scanner", description: "Scan skills for malware, spyware, crypto-miners, and malicious code before installing.", downloads: 99, author: "bvinci1-design", category: mapCategory("security"), icon: getIcon(mapCategory("security")) },
  { name: "QMD Markdown Search", slug: "qmd-markdown-search", description: "Local hybrid search for markdown notes and docs. Find related content across collections.", downloads: 14, author: "emcmillan80", category: mapCategory("productivity"), icon: getIcon(mapCategory("productivity")) },
  { name: "Agent Browser", slug: "agent-browser", description: "Automate browser interactions for web testing, form filling, screenshots, and data extraction.", downloads: 217, author: "tekkenKK", category: mapCategory("automation"), icon: getIcon(mapCategory("automation")) },
  { name: "Transcribee", slug: "transcribee", description: "Transcribe YouTube videos and audio files with speaker diarization. Clean speaker-labeled transcripts.", downloads: 71, author: "itsfabioroma", category: mapCategory("media"), icon: getIcon(mapCategory("media")) },
  { name: "My Tesla", slug: "my-tesla", description: "Control Tesla vehicles via the Tesla Owner API. Check status, lock/unlock, climate, charging, location.", downloads: 166, author: "officialpm", category: mapCategory("iot"), icon: getIcon(mapCategory("iot")) },
  { name: "SSH Essentials", slug: "ssh-essentials", description: "Essential SSH commands for secure remote access, key management, tunneling, and file transfers.", downloads: 68, author: "Arnarsson", category: mapCategory("devops"), icon: getIcon(mapCategory("devops")) },
  { name: "Curl HTTP", slug: "curl-http", description: "Essential curl commands for HTTP requests, API testing, and file transfers.", downloads: 40, author: "Arnarsson", category: mapCategory("devops"), icon: getIcon(mapCategory("devops")) },
  { name: "Git Essentials", slug: "git-essentials", description: "Essential Git commands and workflows for version control, branching, and collaboration.", downloads: 59, author: "Arnarsson", category: mapCategory("devops"), icon: getIcon(mapCategory("devops")) },
  { name: "Docker Essentials", slug: "docker-essentials", description: "Essential Docker commands for container management, image operations, and debugging.", downloads: 57, author: "Arnarsson", category: mapCategory("devops"), icon: getIcon(mapCategory("devops")) },
  { name: "AI Video Gen", slug: "ai-video-gen", description: "End-to-end AI video generation. Create videos from text prompts using image generation, voice-over, and editing.", downloads: 57, author: "rhanbourinajd", category: mapCategory("media"), icon: getIcon(mapCategory("media")) },
  { name: "Gamma Presentations", slug: "gamma-presentations", description: "Create presentations, documents, social posts, and websites using Gamma's AI API.", downloads: 32, author: "MrGoodB", category: mapCategory("productivity"), icon: getIcon(mapCategory("productivity")) },
  { name: "AI Compound", slug: "ai-compound", description: "Make your AI agent learn and improve automatically. Reviews sessions, extracts learnings, compounds knowledge.", downloads: 430, author: "lxgicstudios", category: mapCategory("ai-tools"), icon: getIcon(mapCategory("ai-tools")) },
  { name: "IMAP/SMTP Email", slug: "imap-smtp-email", description: "Read and send email via IMAP/SMTP. Check messages, search mailboxes, send with attachments.", downloads: 114, author: "gzlicanyi", category: mapCategory("communication"), icon: getIcon(mapCategory("communication")) },
  { name: "PowerPoint Automation", slug: "ppt-automation", description: "Automate PowerPoint/WPS operations. Read, export PDF, replace text, insert/delete slides.", downloads: 45, author: "Fadeloo", category: mapCategory("productivity"), icon: getIcon(mapCategory("productivity")) },
  { name: "Web Search", slug: "web-search", description: "Search the web using DuckDuckGo. Find current content, news, images, and videos.", downloads: 324, author: "billyutw", category: mapCategory("search"), icon: getIcon(mapCategory("search")) },
  { name: "Remotion Video Toolkit", slug: "remotion-video-toolkit", description: "Programmatic video creation with Remotion + React. Animations, rendering, captions, 3D.", downloads: 117, author: "shreefentsar", category: mapCategory("media"), icon: getIcon(mapCategory("media")) },
  { name: "Stock Info Explorer", slug: "stock-info-explorer", description: "Yahoo Finance powered financial analysis. Real-time quotes, charts with indicators, portfolio tracking.", downloads: 200, author: "kys42", category: mapCategory("finance"), icon: getIcon(mapCategory("finance")) },
  { name: "DuckDuckGo Search", slug: "ddg-search", description: "Web searches using DuckDuckGo. No API key required.", downloads: 257, author: "ParadoxFuzzle", category: mapCategory("search"), icon: getIcon(mapCategory("search")) },
  { name: "Quiver Quantitative", slug: "quiver", description: "Alternative financial data. Congress trading, lobbying, government contracts, insider transactions.", downloads: 33, author: "stuhorsman", category: mapCategory("finance"), icon: getIcon(mapCategory("finance")) },
  { name: "Clean Code", slug: "clean-code", description: "Pragmatic coding standards. Concise, direct, no over-engineering.", downloads: 163, author: "gabrielsubtil", category: mapCategory("development"), icon: getIcon(mapCategory("development")) },
  { name: "Compound Engineering", slug: "compound-engineering", description: "AI agent learning and improvement. Session review, knowledge extraction, memory updates.", downloads: 430, author: "lxgicstudios", category: mapCategory("ai-tools"), icon: getIcon(mapCategory("ai-tools")) },
  { name: "Code Comment Generator", slug: "ai-comment", description: "Add meaningful inline comments to complex code. Improve documentation.", downloads: 31, author: "lxgicstudios", category: mapCategory("development"), icon: getIcon(mapCategory("development")) },
  { name: "Codemod Generator", slug: "ai-codemod", description: "Generate codemods for large-scale code changes and refactoring.", downloads: 48, author: "lxgicstudios", category: mapCategory("development"), icon: getIcon(mapCategory("development")) },
  { name: "Code Review Assistant", slug: "ai-code-review", description: "Automated code review with best practices, security checks, and improvement suggestions.", downloads: 104, author: "lxgicstudios", category: mapCategory("development"), icon: getIcon(mapCategory("development")) },
  { name: "Architecture Decision Records", slug: "ai-adr", description: "Generate Architecture Decision Records with AI for documenting technical decisions.", downloads: 32, author: "lxgicstudios", category: mapCategory("development"), icon: getIcon(mapCategory("development")) },
  { name: "SQL Query Generator", slug: "ai-sql", description: "Generate SQL queries from natural language descriptions.", downloads: 65, author: "lxgicstudios", category: mapCategory("development"), icon: getIcon(mapCategory("development")) },
  { name: "Snapshot Test Generator", slug: "ai-snapshot-test", description: "Generate Jest snapshot tests for React components.", downloads: 11, author: "lxgicstudios", category: mapCategory("development"), icon: getIcon(mapCategory("development")) },
  { name: "Database Schema Generator", slug: "ai-schema", description: "Generate database schemas from natural language descriptions.", downloads: 26, author: "lxgicstudios", category: mapCategory("development"), icon: getIcon(mapCategory("development")) },
  { name: "Responsive Design Checker", slug: "ai-responsive", description: "Make components responsive with proper breakpoints and media queries.", downloads: 23, author: "lxgicstudios", category: mapCategory("development"), icon: getIcon(mapCategory("development")) },
];
