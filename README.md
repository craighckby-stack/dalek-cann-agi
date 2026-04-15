# dalek-cann-agi

## Summary
`dalek-cann-agi` is an automated code mutation and evolution platform designed to perform static analysis and rule-based refactoring on GitHub repositories. The system integrates a multi-agent deliberation protocol and cognitive saturation metrics to validate proposed changes before committing them to the target branch.

## Architecture Story
The system operates through a multi-stage pipeline: **Scan, Analyze, Propose, Debate, and Execute**. It interfaces with the GitHub REST API to ingest source code, which is then processed by a custom static analysis engine in the `/api/evolution` routes. Unlike systems relying on external LLMs, this implementation uses deterministic rule-sets to generate metrics (complexity, export surface, type safety). 

State is persisted via Prisma/SQLite, tracking "Evolution Cycles" and "Saturation Scores"—metrics that prevent excessive structural change within a single session. The UI utilizes a terminal-inspired dashboard with React components for real-time monitoring of agent deliberations and code diffs.

## Proof of Work
The core "intelligence" of the system resides in its deterministic agent deliberation logic. The following block from `src/app/api/evolution/debate/route.ts` demonstrates how the system calculates an approval score based on heuristic biases rather than generic prompts:

typescript
function evaluateMutation(agent: AgentPersona, originalCode: string, proposedCode: string, riskScore: number, analysis: string, affectedFiles: string[]): AgentVote {
  const orig = computeCodeMetrics(originalCode);
  const prop = computeCodeMetrics(proposedCode);

  let approveScore = 50; // Start neutral
  
  // Risk score assessment
  if (riskScore >= agent.approveThreshold) {
    approveScore -= 15;
  }

  // Removed exports check: A critical heuristic for library stability
  const removedExports = orig.exports.filter(e => !prop.exports.includes(e));
  if (removedExports.length > 0) {
    approveScore -= agent.biases.fearsRemovedExports ? 25 : 10;
  }

  // Type safety check
  if (prop.anyTypes > orig.anyTypes) {
    approveScore -= agent.biases.favorsTypeSafety ? 15 : 5;
  }
  // ... (truncation for brevity)
}


**Technical Proficiency:** This approach uses a weighted scoring matrix to simulate specialized perspectives (e.g., "Skeptics" vs. "Rationalists"). By mapping code metrics (size change, export delta, complexity) to agent biases, the system provides a structured validation layer that remains fully local and transparent.

## Engine Specs
| Category | Technology Stack |
| :--- | :--- |
| **Framework** | Next.js 15 (App Router) |
| **Language** | TypeScript |
| **Database** | Prisma + SQLite |
| **UI / Styling** | Tailwind CSS + Lucide Icons |
| **Integration** | GitHub REST API |
| **Analysis Engine** | Regex-based Static Analysis |

## Status
**Functional Prototype**  
The system is currently a feature-complete environment for testing rule-based code mutations. It includes a persistent history, GitHub synchronization, and a multi-agent UI, but relies on heuristic logic rather than broad-spectrum semantic understanding.