# 🛡️ Dalek Caan AGI: Evolution Engine

![Maturity: Functional-Prototype](https://img.shields.io/badge/Maturity-Functional--Prototype-yellow)
![Status: Active Development](https://img.shields.io/badge/Status-Active--Development-blue)
![Integrations: GitHub, Prisma](https://img.shields.io/badge/Integrations-GitHub%2C%20Prisma-green)

Dalek Caan is an autonomous evolution engine designed to scan, analyze, and mutate repositories through a multi-agent debate and coherence gating system. Unlike traditional AGI frameworks that rely exclusively on external LLMs, Dalek Caan utilizes a 'Deterministic Brain' for local, high-speed code logic assessment.

## 🛠️ Technical Stack
- **Framework:** Next.js 15 (App Router)
- **Persistence:** Prisma ORM with SQLite/Postgres
- **Automation:** GitHub API v3 (REST)
- **Analysis Engine:** Regex-based static analysis + Multi-agent deterministic debate
- **Styling:** Tailwind CSS

## 💎 Standalone Value Chunks

### 1. The Coherence Gate
Prevents 'System Saturation' by blocking mutations that exceed specific risk thresholds. It monitors structural change, semantic saturation, and identity preservation to ensure the codebase doesn't drift into incoherence.

### 2. Multi-Agent Debate Chamber
Features five deterministic agent personas (Humanist, Rationalist, Cooperator, Chaotic, Skeptic) that vote on code changes. Each agent applies unique biases toward risk, complexity, and type safety, ensuring a balanced 'consensus' before code is pushed.

### 3. Automated Evolution Lifecycle
Full lifecycle management: `Scan` -> `Analyze` -> `Propose` -> `Debate` -> `Test` -> `Apply`. Includes automatic TypeScript syntax verification (brace/parenthesis matching) and import depth validation.

## 🚀 Path to Production
- [ ] **AST Integration:** Replace regex-based code analysis in `api/evolution/propose` with a proper TypeScript AST parser (e.g., `ts-morph`).
- [ ] **Real-time Telemetry:** Update `api/evolution/health` to calculate metrics from actual DB-backed mutation success rates rather than randomized data.
- [ ] **External Brain Hooks:** Allow the deterministic 'Dalek Brain' to be augmented by Ollama or OpenAI for more complex semantic reasoning.
- [ ] **Auth & Security:** Implement NextAuth.js or Clerk to protect the system-level GitHub tokens and brain endpoints.
- [ ] **Containerization:** Bundle the entire environment for deployment on edge-ready runners to avoid Vercel's `maxDuration` limitations during large repo scans.

## 📦 Deployment
1. Copy `.env.example` to `.env`.
2. Add your `GITHUB_TOKEN`.
3. Run `npx prisma db push` to initialize the Evolution Brain.
4. Execute `npm run dev` to start the evolution cycle.