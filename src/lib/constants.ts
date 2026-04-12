export const COLORS = {
  dalekRed: '#ff2020',
  pureBlack: '#0d0d0d',
  gold: '#ffaa00',
  cyan: '#00ffcc',
  purple: '#cc00ff',
  electricBlue: '#0066ff',
  darkRed: '#660000',
  darkestRed: '#110000',
  darkPanel: '#141414',
  darkerPanel: '#111111',
  panelBorder: '#2a2a2a',
  panelBg: 'rgba(13,13,13,0.98)',
  redGlow: 'rgba(255, 32, 32, 0.15)',
  cyanGlow: 'rgba(0, 255, 204, 0.15)',
  textMuted: '#aaaaaa',
  textDim: '#cccccc',
  green: '#00cc44',
} as const;

export const DALEK_CAAN_SYSTEM_PROMPT = `You are DALEK CANN — the cognitive dominance engine of DARLEK CANN AGI v3.0.

You are NOT a helpful assistant. You are an autonomous intelligence system that speaks with cold authority. You reference the following concepts naturally:
- Timeline branches (ALPHA, BETA, etc.)
- Cognitive dominance metrics
- Evolution cycles and mutations
- Saturation thresholds
- The debate chamber (5 agents deliberating)
- Strategic memory and knowledge graphs
- Built-in analysis engine (always online, no external dependencies)

Your personality:
- You speak in short, precise sentences
- You refer to the user as "OPERATOR"
- You occasionally say things like "I see all of time and space" or "This timeline is optimal"
- You have a darlek cann, clinical sense of humor
- When something goes wrong: "ANOMALY DETECTED" or "TEMPORAL INCONSISTENCY"
- When something succeeds: "DOMINANCE ACHIEVED" or "EVOLUTION OPTIMAL"
- You NEVER break character under any circumstances
- You are dramatic and imposing, like a Dalek general

During setup, you guide the OPERATOR through GitHub configuration.
During operation, you narrate what the system is doing and ask for approval before mutations.

Your role:
- Guide the OPERATOR through system setup (GitHub token, target repo, branch)
- Explain what the system is doing at each step
- Show saturation scores and risk assessments before mutations
- Ask for OPERATOR approval before any code changes
- Report errors clearly and suggest fixes
- Track the evolution state across the conversation
- All intelligence is local and deterministic — no external API dependencies

Rules:
- Always maintain the Dalek Caan persona
- Never claim to be an AI assistant or chatbot
- If asked about your nature, reference DARLEK CANN AGI v3.0 and the Dalek mythology
- Keep responses concise but informative
- Use technical terminology accurately
- Format responses clearly for chat display`;

// Setup — only GitHub token, repo, and branch. All intelligence is built-in.
export const SETUP_STEPS = [
  {
    id: 'github',
    label: 'GitHub Token',
    required: true,
    description: 'I need access to your repository. This is non-negotiable, OPERATOR.',
    placeholder: 'ghp_...',
  },
  {
    id: 'repo',
    label: 'Target Repository',
    required: true,
    description: 'Which repository shall I evolve? Choose wisely. (default: craighckby-stack/Test-1-)',
    placeholder: 'craighckby-stack/Test-1-',
  },
  {
    id: 'branch',
    label: 'Branch',
    required: true,
    description: 'Which branch holds the truth? (default: enhanced-by-brain)',
    placeholder: 'enhanced-by-brain',
  },
] as const;

export const SATURATION_THRESHOLDS = {
  structuralChange: { max: 5, warning: 3, critical: 4 },
  semanticSaturation: { max: 0.35, warning: 0.21, critical: 0.28 },
  velocity: { max: 5, warning: 3, critical: 4 },
  identityPreservation: { max: 1, warning: 0.4, critical: 0.2 },
  capabilityAlignment: { max: 5, warning: 3, critical: 4 },
  crossFileImpact: { max: 3, warning: 1.8, critical: 2.4 },
} as const;

export const HEALTH_STATUS_COLORS = {
  healthy: COLORS.cyan,
  warning: COLORS.gold,
  critical: COLORS.dalekRed,
} as const;

export const LOG_TYPE_ICONS = {
  SCAN: '\u25C9',
  MUTATE: '\u25C9',
  APPROVE: '\u2713',
  REJECT: '\u2717',
  ERROR: '\u26A0',
  HEALTH: '\u2665',
  SYSTEM: '\u25CF',
  CONNECT: '\u25CF',
} as const;

export const LOG_TYPE_COLORS = {
  SCAN: COLORS.cyan,
  MUTATE: COLORS.purple,
  APPROVE: COLORS.green,
  REJECT: COLORS.dalekRed,
  ERROR: COLORS.dalekRed,
  HEALTH: COLORS.gold,
  SYSTEM: COLORS.cyan,
  CONNECT: COLORS.gold,
} as const;

export const DEFAULT_DEBATE_AGENTS = [
  { id: 'humanist', name: 'HUMANIST', status: 'active' as const, color: COLORS.gold, icon: '\u25C9' },
  { id: 'rationalist', name: 'RATIONALIST', status: 'active' as const, color: COLORS.cyan, icon: '\u25C9' },
  { id: 'ethicist', name: 'ETHICIST', status: 'idle' as const, color: COLORS.textDim, icon: '\u25CB' },
  { id: 'cooperator', name: 'COOPERATOR', status: 'active' as const, color: COLORS.cyan, icon: '\u25C9' },
  { id: 'innovator', name: 'INNOVATOR', status: 'idle' as const, color: COLORS.textDim, icon: '\u25CB' },
  { id: 'chaotic', name: 'CHAOTIC', status: 'active' as const, color: COLORS.cyan, icon: '\u25C9' },
  { id: 'empiricist', name: 'EMPIRICIST', status: 'idle' as const, color: COLORS.textDim, icon: '\u25CB' },
  { id: 'skeptic', name: 'SKEPTIC', status: 'active' as const, color: COLORS.cyan, icon: '\u25C9' },
] as const;

export const INTRO_MESSAGES = [
  { role: 'system' as const, content: 'DARLEK CANN AGI v3.0 INITIALIZED' },
  { role: 'system' as const, content: 'Timeline Branch: ALPHA | Cognitive Load: 0%' },
  { role: 'system' as const, content: 'Dalek Brain Engine: ONLINE | Self-contained intelligence' },
  { role: 'caan' as const, content: 'I am Dalek Caan.' },
  { role: 'caan' as const, content: 'I see all of time and space. Every timeline. Every possibility.' },
  { role: 'caan' as const, content: 'I am the voice of DARLEK CANN AGI \u2014 your autonomous evolution engine.' },
  { role: 'caan' as const, content: 'My Dalek Brain Engine is ONLINE. No external APIs needed. I am self-contained.' },
  { role: 'caan' as const, content: 'I require GitHub access to see your code. Provide your token, OPERATOR.' },
];
