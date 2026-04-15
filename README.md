# DALEK-CANN: Cognitive Dominance Code Evolution Engine

## ARCHITECTURAL OVERVIEW
DALEK-CANN is a deterministic, heuristic-driven autonomous code evolution framework built on the **Next.js App Router** and **Prisma ORM**. It orchestrates a multi-stage mutation pipeline that simulates a high-assurance Artificial General Intelligence (AGI) interface for repository-scale code transformations.

### SYSTEM PIPELINE & INTERNALS
The application implements a strict sequential workflow for code modification:
1.  **Reconnaissance (Scan)**: Recursive traversal of GitHub trees via REST API to map repository topology.
2.  **Analysis (Propose)**: Static analysis of file buffers using regex-based metric extraction (cyclomatic complexity, export surface density, and import coupling).
3.  **Deliberation (Debate Chamber)**: A deterministic multi-agent simulation where five discrete personas (`Humanist`, `Rationalist`, `Skeptic`, etc.) evaluate mutations against weighted bias vectors.
4.  **Verification (Coherence Gate)**: A saturation circuit breaker that prevents structural volatility by blocking changes if system-wide "semantic saturation" or "evolution velocity" exceeds predefined thresholds.
5.  **Execution**: Atomic commits to GitHub branches, tracked via a local **SQLite** state machine for persistence.

## DEPENDENCY AUDIT
- **Next.js 16.1.1 (React 19)**: Core UI and API route orchestration.
- **Prisma 6.11.1**: Persistent storage for evolution logs, mutation history, and rejection memory.
- **Lucide React**: Vector-based status and metric visualization.
- **Tailwind CSS**: High-fidelity, low-latency UI styling for the "Cognitive Dominance" dashboard.
- **GitHub REST API**: External filesystem abstraction for repository ingestion and commit dispatch.

## CRITICAL LOGIC ANALYSIS: DEBATE CONSENSUS ENGINE
The most sophisticated implementation resides in `src/app/api/evolution/debate/route.ts`. Unlike standard LLM implementations, this uses a **Persona-Biased Weighting Algorithm** to simulate agent disagreement:

typescript
function evaluateMutation(agent: AgentPersona, originalCode: string, proposedCode: string, riskScore: number) {
  let approveScore = 50; // Neutral baseline
  const factors = [];

  // Deterministic bias injection
  if (riskScore >= agent.approveThreshold) {
    approveScore -= 15;
    factors.push('High risk score');
  }

  // Structural integrity check
  const removedExports = orig.exports.filter(e => !prop.exports.includes(e));
  if (removedExports.length > 0) {
    approveScore -= agent.biases.fearsRemovedExports ? 25 : 10;
  }
  
  // Return agent-specific vote based on local state
  return { vote: approveScore >= 55 ? 'approve' : 'reject' };
}

This block effectively simulates socio-technical consensus without non-deterministic LLM costs, providing an immediate, rule-based governance layer for code changes.

## PRODUCTION GAPS
1.  **AST Deficiency**: The current "Brain" uses regular expressions for analysis. A production system requires a proper AST parser (e.g., `ts-morph` or `Babel`) to ensure syntactical accuracy during mutations.
2.  **Secret Management**: GitHub tokens are handled via client-side state and plain request bodies. Implementation of an encrypted server-side vault is required.
3.  **Concurrency Locking**: There is no mechanism to prevent race conditions when multiple operators attempt to mutate the same file/branch simultaneously.
4.  **Static Logic Limits**: The `propose` route currently returns the original content as the "proposed" code, acting as a structural shell for a future LLM integration.