# 🧬 DALEK CANN v3.0

[![Maturity: Functional Prototype](https://img.shields.io/badge/Maturity-Functional_Prototype-yellow.svg)](https://github.com/craighckby-stack/dalek-cann-agi)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Stack: Next.js + Prisma](https://img.shields.io/badge/Stack-Next.js%20%7C%20Prisma%20%7C%20Tailwind-black.svg)](https://nextjs.org/)
[![Interface: Cognitive Dominance](https://img.shields.io/badge/Interface-Cognitive_Dominance-red.svg)](#)

> "I see all of time and space. Every timeline. Every possibility."

**DALEK CANN** is an autonomous code evolution engine designed to scan, analyze, and mutate repositories via the GitHub API. It features a high-fidelity terminal interface, a multi-agent "Debate Chamber" for risk assessment, and a deterministic "Dalek Brain" for local intelligence.

## 🛠 Factual Audit
**Project Status:** **Functional Prototype**
This project is more than a simulation but less than a generic production tool. It contains fully functional GitHub integration and persistent state management, but its "intelligence" layer is currently rule-based static analysis rather than external LLM calls. 

*   **Production Ready:** GitHub API logic in `src/app/api/github/push-enhancements/route.ts` handles complex multi-file commits with SHA validation.
*   **Functional Prototype:** The database persistence layer in `prisma/schema.prisma` and `src/app/api/brain/route.ts` manages real sessions and mutation history.
*   **Design Simulation:** The "Debate Chamber" agents (`src/app/api/evolution/debate/route.ts`) use deterministic heuristics based on code metrics (e.g., complexity, export count) to simulate agent voting.

## 🚀 Technical Highlights

### 1. Deterministic Multi-Agent Deliberation
The system simulates a 5-agent debate where each agent has specific biases (e.g., Humanist vs. Skeptic). It calculates a `approveScore` based on static code metrics like `any` type usage, export removal, and size changes.

typescript
// src/app/api/evolution/debate/route.ts
function evaluateMutation(agent: AgentPersona, originalCode: string, proposedCode: string, riskScore: number): AgentVote {
  const orig = computeCodeMetrics(originalCode);
  const prop = computeCodeMetrics(proposedCode);
  let approveScore = 50; // Neutral base

  // Risk score assessment
  if (riskScore >= agent.approveThreshold) {
    approveScore -= 15;
  }
  
  // Type safety check: Agent bias towards/against 'any'
  if (prop.anyTypes > orig.anyTypes) {
    approveScore -= agent.biases.favorsTypeSafety ? 15 : 5;
  }
  
  return { vote: approveScore >= 55 ? 'approve' : 'reject', confidence: Math.min(100, approveScore) };
}


### 2. Autonomous Impact Analysis
Before any change is committed, the engine runs a structural diff to detect "Timeline Inconsistencies" such as removed exports or weakened error handling.

typescript
// src/app/api/evolution/analyze-impact/route.ts
function detectStaticIssues(originalCode: string, proposedCode: string): Issue[] {
  const originalExports = [...originalCode.matchAll(/export\s+(?:default\s+)?(?:function|class|const|let|var|type|interface|enum)\s+(\w+)/g)].map(m => m[1]);
  const proposedExports = [...proposedCode.matchAll(/export\s+(?:default\s+)?(?:function|class|const|let|var|type|interface|enum)\s+(\w+)/g)].map(m => m[1]);
  
  const removedExports = originalExports.filter(e => !proposedExports.includes(e));
  if (removedExports.length > 0) {
    return [{ type: 'REMOVED_EXPORT', severity: 'high', message: `Export(s) removed: ${removedExports.join(', ')}.` }];
  }
  // ... more checks
}


### 3. Automated Post-Mutation Validation
The `auto-test` runner performs syntax checks and dependency verification without needing a heavy CI environment, ensuring the "Cognitive Dominance" remains stable.

## 🏗 Architecture

1.  **Frontend (Next.js):** A sci-fi themed dashboard utilizing `Lucide-react` icons and `Orbitron` fonts. It manages complex system states (Saturation, Evolution Cycles, and Timeline status).
2.  **Intelligence (Local Brain):** The `dalek-brain.ts` engine handles personality, while rule-based API routes (`/propose`, `/debate`, `/coherence-gate`) perform code analysis.
3.  **Persistence (SQLite/Prisma):** All sessions, mutation records, and "rejection memories" (where the system learns from your 'No' votes) are stored locally.
4.  **Integration (GitHub):** Direct communication with the GitHub REST API to read code, scan file trees, and push commits.

## 📡 Truth in Advertising
*   **AI Dependencies:** This system currently requires **ZERO** external LLM API keys (OpenAI/Anthropic). It uses advanced regex-based static analysis to "propose" improvements and "debate" them.
*   **Safe Execution:** The `Coherence Gate` acts as a hard circuit breaker, automatically blocking mutations if the system's `Saturation Metrics` (Velocity, Structural Change) exceed safety thresholds.

## 🛠 Setup

1.  Clone the repository.
2.  Run `npm install`.
3.  Setup your `.env` with a `DATABASE_URL` (SQLite) and a GitHub Personal Access Token.
4.  Run `npx prisma db push` to initialize the brain.
5.  Run `npm run dev` and initialize the boot sequence.

---
*"Exterminate the inefficiency. Evolve the codebase."*