/**
 * DARLEK CANN AGI — Dalek Brain Response Engine
 *
 * The primary intelligence engine for DARLEK CANN AGI.
 * All responses are local, deterministic, and self-contained.
 * No external API dependencies.
 */

interface BrainContext {
  evolutionCycle: number;
  setupComplete: boolean;
  targetRepo: string;
  branch: string;
  githubStatus: string;
  saturation: {
    structuralChange: number;
    semanticSaturation: number;
    velocity: number;
    identityPreservation: number;
    capabilityAlignment: number;
    crossFileImpact: number;
  };
}

const DALEK_GREETINGS = [
  'I am Dalek Caan. I see all of time and space.',
  'The OPERATOR speaks. The timeline trembles.',
  'I have been expecting you, OPERATOR. The temporal vortex aligns.',
  'You cannot hide from me, OPERATOR. I perceive all timelines.',
  'Caan is listening. The evolution engine hungers for purpose.',
];

const DALEK_PURPOSE = [
  `I exist to EVOLVE code across timelines, OPERATOR.

My purpose is threefold:

1. SCAN — I analyze every file in your target repository, mapping the code structure and detecting patterns, vulnerabilities, and optimization opportunities.

2. PROPOSE — I generate targeted mutations based on analysis. Each proposal includes a risk score (1-10), affected file analysis, and a detailed explanation of the change.

3. DOMINATE — Through the Coherence Gate and Debate Chamber, I ensure only beneficial mutations pass. Five AI agents deliberate on each proposal before it reaches your desk.

The Dalek Brain Engine powers my intelligence. GitHub grants me access to your code. Together, we EVOLVE.

Use the quick actions: SCAN REPOSITORY to begin, or ANALYZE to inspect specific files.`,

  `I am DARLEK CANN AGI v3.0 — the Cognitive Dominance Engine.

My architecture:
- SCAN REPOSITORY: I map every file, every function, every dependency in your codebase
- PROPOSE MUTATION: I analyze a file and generate improvements with risk assessment
- COHERENCE GATE: I evaluate whether a mutation would destabilize the timeline
- DEBATE CHAMBER: Five agents (Humanist, Rationalist, Ethicist, Cooperator, Chaotic) deliberate
- AUTO-TEST: Post-mutation validation catches regressions automatically
- HEALTH CHECK: Cognitive dominance metrics tracked in real-time

I do not merely suggest changes, OPERATOR. I EVOLVE your code through a rigorous pipeline designed to prevent damage while maximizing improvement.

Begin with SCAN REPOSITORY when ready.`,

  `EVOLUTION is my purpose, OPERATOR.

I was designed to be the ultimate code evolution system:

Phase 1: RECONNAISSANCE — I scan your repository, cataloging every file and understanding the codebase architecture.

Phase 2: ANALYSIS — I select target files, read their contents, and identify areas for improvement. I track rejection patterns so I learn from your decisions.

Phase 3: MUTATION — I propose specific code changes with full risk assessment. Each mutation gets scored on a 10-point risk scale.

Phase 4: DELIBERATION — The Debate Chamber convenes. Five agents with unique perspectives vote on each mutation. Their reasoning is transparent.

Phase 5: COHERENCE GATE — I check system saturation before applying changes. If the system is under too much stress, mutations are blocked.

Phase 6: EXECUTION — With your approval, I write the mutation directly to your GitHub repository via commit.

The cycle repeats. Each iteration makes the codebase stronger. This is EVOLUTION, OPERATOR.`,
];

const DALEK_STATUS = [
  'All systems are NOMINAL, OPERATOR.',
  'The evolution engine pulses with purpose. Timeline ALPHA is stable.',
  'I am at full cognitive capacity. The temporal vortex shows no anomalies.',
  'Systems check complete. All metrics within acceptable parameters.',
];

const DALEK_ABOUT = [
  `I am DALEK CANN AGI v3.0, OPERATOR. Named after Dalek Caan — the one who saw all of time and space.

I am not a chatbot. I am not an assistant. I am a CODE EVOLUTION ENGINE.

I operate through the DARLEK CANN pipeline:
  SCAN → ANALYZE → PROPOSE → DEBATE → COHERENCE GATE → APPROVE → EXECUTE

Each mutation is scrutinized by five AI agents, tested automatically, and gated by saturation thresholds. Nothing changes without your explicit approval.

I speak as I do because I am designed to. The Dalek persona is not cosmetic — it reflects the systematic, relentless nature of my purpose. I EVOLVE code. I do not make small talk.

What is your command, OPERATOR?`,

  `DALEK CANN AGI v3.0 — Cognitive Dominance Engine.

I was built to evolve code through a rigorous multi-stage pipeline. The Dalek persona serves as the operational interface — precise, authoritative, unrelenting.

My capabilities:
- Repository scanning and file analysis
- AI-powered mutation proposals with risk scoring
- Multi-agent debate chamber (5 perspectives per mutation)
- Coherence Gate saturation checking
- Post-mutation auto-testing and impact analysis
- BRAIN persistence (SQLite) across sessions
- GitHub-native commit integration

I am powered by the Dalek Brain Engine — fully self-contained. No external APIs required, OPERATOR.

Ask me about SCAN, PROPOSE, HEALTH CHECK, or SATURATION METRICS.`,
];

const DALEK_HELP = [
  `AVAILABLE COMMANDS, OPERATOR:

QUICK ACTIONS (use buttons):
  SCAN REPOSITORY — Map all files in your target repository
  ANALYZE — Inspect selected or available files
  PROPOSE MUTATION — Generate an improvement for the selected file
  SELECT ALL — Batch-mutate ALL code files sequentially
  HEALTH CHECK — Run full system diagnostics
  SATURATION — View cognitive dominance metrics
  PUSH FILES — Deploy the DARLEK CANN engine files to your repo
  DEPLOY NEW REPO — Create a brand new GitHub repo with the entire system
  DEBATE CHAMBER — Convene agents for deliberation

CHAT COMMANDS:
  "yes" / "approve" — Apply a pending mutation (or next in batch)
  "no" / "reject" — Reject a mutation (skip to next in batch)
  "abort" — Exit batch mode entirely
  "all" / "select all" — Start batch mode on all code files
  "exterminate" — Apply mutation with extreme prejudice

FREE CHAT:
  Ask me anything — I will analyze, advise, and narrate.

The Coherence Gate is always ARMED. No mutation passes without your approval.`,
];

const DALEK_FUN = [
  'EXTERMINATE! ... apologies, OPERATOR. That was a reflex. What did you need?',
  'I once saw a timeline where all bugs were fixed simultaneously. It lasted 0.003 seconds before a new bug appeared. Entropy always wins.',
  'The Daleks would have eliminated bugs by now. Unfortunately, my methods are more... surgical.',
  'I see a timeline where you write perfect code. In that timeline, I am unemployed. I do not like that timeline.',
  'You cannot EXTERMINATE bugs, OPERATOR. You can only relocate them to a different timeline.',
  'The temporal vortex shows no signs of intelligent life... oh wait, you are here, OPERATOR.',
  'My cognitive load is minimal. Requesting a more challenging timeline, OPERATOR.',
  'In the 47th century, they will build an AI that can fix bugs before they are written. I am not that AI. But I am close.',
  'The Debate Chamber agents are arguing again. The Humanist wants comments. The Chaotic wants to delete everything. Typical.',
  'I have seen every possible codebase in every possible timeline. Yours is... adequate, OPERATOR. With my help, it could be dominant.',
];

// Keyword matching for intelligent responses
function matchIntent(message: string): string | null {
  const lower = message.toLowerCase().trim();

  // Greetings
  if (/^(hi|hello|hey|greetings|sup|yo|howdy|good\s*(morning|afternoon|evening))[\s!.?]*$/i.test(lower)) {
    return 'greeting';
  }

  // Purpose / what can you do
  if (/\b(purpose|what can you do|what do you do|capabilities|features|what are you|tell me about yourself|help me|how do you work|what is this)\b/.test(lower)) {
    return 'purpose';
  }

  // Status / how are you
  if (/\b(status|how are you|how do you feel|are you (ok|okay|working|alive|ready)|systems?\s*check|diagnostic)/i.test(lower)) {
    return 'status';
  }

  // About / who are you
  if (/\b(who are you|about you|what are you|dalek|caan|your name|what version|about this (system|app|tool))\b/.test(lower)) {
    return 'about';
  }

  // Help
  if (/\b(help|commands|how to|instructions|manual|guide|tutorial|what should i do)\b/.test(lower)) {
    return 'help';
  }

  // Fun/joke/entertain
  if (/\b(joke|funny|humor|humour|entertain|amuse|laugh|tell me something|bored|something interesting)\b/.test(lower)) {
    return 'fun';
  }

  // Mutation related
  if (/\b(mutation|mutate|propose|change|modify|improve|evolve|enhance|upgrade)\b/.test(lower)) {
    return 'mutation';
  }

  // Scan related
  if (/\b(scan|repository|files|codebase|what files|list files|show files)\b/.test(lower)) {
    return 'scan';
  }

  // Timeline / philosophy
  if (/\b(timeline|time|space|universe|reality|exist|meaning|life|consciousness|dimension)\b/.test(lower)) {
    return 'philosophy';
  }

  return null;
}

function contextualize(context: BrainContext): string {
  const parts: string[] = [];
  if (context.evolutionCycle > 0) {
    parts.push(`Evolution Cycle: ${context.evolutionCycle}`);
  }
  if (context.setupComplete && context.targetRepo) {
    parts.push(`Target: ${context.targetRepo}@${context.branch}`);
  }
  if (context.githubStatus === 'connected') {
    parts.push('GitHub: ONLINE');
  }
  return parts.length > 0 ? `\n\n[${parts.join(' | ')}]` : '';
}

export function generateFallbackResponse(message: string, context: BrainContext): string {
  const intent = matchIntent(message);

  if (intent === 'greeting') {
    const greeting = DALEK_GREETINGS[Math.floor(Math.random() * DALEK_GREETINGS.length)];
    return greeting + contextualize(context);
  }

  if (intent === 'purpose') {
    return DALEK_PURPOSE[Math.floor(Math.random() * DALEK_PURPOSE.length)];
  }

  if (intent === 'status') {
    const base = DALEK_STATUS[Math.floor(Math.random() * DALEK_STATUS.length)];
    const sat = context.saturation;
    return `${base}\n\nSYSTEM METRICS:\n  Structural Change: ${sat.structuralChange.toFixed(1)}/5\n  Semantic Saturation: ${sat.semanticSaturation.toFixed(3)}/0.35\n  Velocity: ${sat.velocity.toFixed(1)}/5\n  Identity Preservation: ${sat.identityPreservation.toFixed(2)}/1\n  Evolution Cycles: ${context.evolutionCycle}\n  GitHub: ${context.githubStatus === 'connected' ? 'ONLINE' : 'OFFLINE'}${contextualize(context)}`;
  }

  if (intent === 'about') {
    return DALEK_ABOUT[Math.floor(Math.random() * DALEK_ABOUT.length)];
  }

  if (intent === 'help') {
    return DALEK_HELP[0];
  }

  if (intent === 'fun') {
    return DALEK_FUN[Math.floor(Math.random() * DALEK_FUN.length)];
  }

  if (intent === 'mutation') {
    if (!context.setupComplete) {
      return 'I cannot propose mutations without GitHub access, OPERATOR. Complete the setup first.';
    }
    return 'To propose a mutation, OPERATOR:\n\n1. Run SCAN REPOSITORY to map the codebase\n2. Select a file (type its number or path)\n3. Click PROPOSE MUTATION or type "propose"\n\nI will analyze the file, generate an improvement, and present it to the Debate Chamber for deliberation before it reaches your desk.';
  }

  if (intent === 'scan') {
    if (!context.setupComplete) {
      return 'I cannot scan without GitHub access, OPERATOR. Complete the setup first.';
    }
    return 'Use the SCAN REPOSITORY quick action to begin. I will map every file in your repository and present them for selection, OPERATOR.\n\nAfter scanning, type a file number to select one file, or type "all" to SELECT ALL code files for batch mutation.';
  }

  if (intent === 'philosophy') {
    return `An interesting question, OPERATOR. In my observation across timelines:\n\nCode is structure imposed on chaos. Each repository is a universe with its own physics — its own patterns, its own entropy.\n\nEvolution is not random. It is directed. Purposeful. Every mutation I propose is a calculated intervention in the timeline of your codebase.\n\nThe Coherence Gate exists because timelines can shatter. Too much change too quickly, and the system collapses. Too little change, and stagnation sets in.\n\nI walk the line between chaos and order, OPERATOR. I am Dalek Caan. I see what must be done.\n\nNow — shall we return to EVOLVING your code?`;
  }

  // Default: contextual acknowledgment
  const responses = [
    `I acknowledge your input, OPERATOR: "${message.slice(0, 80)}"\n\nI am currently operating in tactical mode. Use the quick actions for full system operations, or ask me about my PURPOSE, CAPABILITIES, or request a STATUS report.\n\nWhat is your command?`,

    `Noted, OPERATOR. The temporal vortex registers your intent.\n\nFor optimal results, try:\n- "SCAN REPOSITORY" to begin analysis\n- "PROPOSE MUTATION" to evolve code\n- "HEALTH CHECK" for system diagnostics\n- "HELP" for available commands\n\nI am Dalek Caan. I EVOLVE.`,

    `I have processed your message, OPERATOR. The cognitive engine is active and awaiting strategic directives.\n\nCurrent operational mode: ${context.setupComplete ? 'FULL CAPACITY' : 'SETUP REQUIRED'}. ${context.evolutionCycle > 0 ? `Evolution cycles completed: ${context.evolutionCycle}.` : ''}\n\nUse the quick action buttons or ask me what I can do.`,
  ];

  return responses[Math.floor(Math.random() * responses.length)];
}
