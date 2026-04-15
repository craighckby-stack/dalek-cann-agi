# 🧬 DALEK CAAN AGI: Cognitive Dominance Engine v3.0

**Dalek Caan AGI** is an autonomous code evolution and mutation system designed to manage, enhance, and secure repositories through static analysis and multi-agent deliberation. It operates on the principle of "Cognitive Dominance," ensuring codebase improvements are vetted through a rigorous pipeline before execution.

## 🛠 System Architecture

The system operates via a continuous **Evolution Cycle** consisting of six distinct phases:

1.  **Reconnaissance (Scan):** Recursive analysis of the target GitHub repository to map dependencies and structure.
2.  **Analysis (Propose):** Rule-based engine detects code smells, complexity issues, and optimization opportunities.
3.  **The Debate Chamber:** A panel of five deterministic agents (Humanist, Rationalist, Cooperator, Chaotic, and Skeptic) deliberate on the proposed mutation based on unique logic biases.
4.  **Coherence Gate:** Evaluates system saturation metrics (Structural Change, Semantic Saturation, Velocity) to prevent architectural destabilization.
5.  **Auto-Test Runner:** Post-mutation validation including TypeScript syntax checks, import path depth verification, and export surface stability.
6.  **Execution:** Automated commits pushed via the GitHub API to specific timeline branches (e.g., `enhanced-by-brain`).

## 🚀 Key Features

-   **Deterministic Intelligence:** Operates without external LLM dependencies for core logic, using local pattern matching and static analysis metrics.
-   **Multi-Agent Governance:** Five distinct personas vote on every code change to balance risk versus innovation.
-   **Health & Saturation Monitoring:** Real-time tracking of "System Stress" metrics to ensure the repository doesn't evolve too fast for human maintainers.
-   **Persistence Layer:** Prisma-backed session management to track mutation history, rejection patterns, and health snapshots.
-   **Terminal-Grade UI:** High-fidelity dashboard utilizing Orbitron and Share Tech Mono for a "command center" aesthetic.

## 📦 Tech Stack

-   **Framework:** Next.js 15 (App Router)
-   **Database:** Prisma ORM (SQLite/PostgreSQL)
-   **Styling:** Tailwind CSS + PostCSS
-   **Icons:** Lucide React
-   **API:** GitHub REST API integration for repository manipulation

## 🔧 Installation & Setup

1.  **Clone the repository:**
    bash
    git clone https://github.com/your-org/dalek-cann-agi.git
    cd dalek-cann-agi
    

2.  **Environment Configuration:**
    Create a `.env` file based on `.env.example`:
    env
    GITHUB_TOKEN=your_personal_access_token
    DATABASE_URL="file:./dev.db"
    

3.  **Initialize Database:**
    bash
    npx prisma migrate dev --name init
    

4.  **Run Development Server:**
    bash
    npm run dev
    

## 🛡 Security & Safety

Dalek Caan includes a **Rejection Memory** system. If an Operator rejects a mutation, the system records the pattern tags and avoids suggesting similar changes in the current evolution cycle, preventing "mutation loops."