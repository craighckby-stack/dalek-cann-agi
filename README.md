# DARLEK CANN v3.0

Disregard agi brand.  old llm auto branding lolz.

**Autonomous Code Evolution Engine**

DARLEK CANN is a self-hosted Next.js dashboard that connects to a GitHub repository and autonomously proposes, debates, and applies code improvements through a multi-stage pipeline. The operator reviews and approves every change before it is committed. The system can also target and evolve its own source code, with a Reboot function that pulls and restarts on the enhanced version.

---

## How It Works

DARLEK CANN operates as a six-phase pipeline:

**1. SCAN** — The system reads your target GitHub repository via the GitHub API, cataloguing every file and mapping the codebase structure.

**2. ANALYZE** — A target file is selected. The Dalek Brain Engine reads its contents, identifies patterns, detects improvement opportunities, and assigns a risk score (1–10).

**3. PROPOSE MUTATION** — A specific code change is generated for the selected file. The proposal includes the diff, risk score, affected file size, and a plain-language explanation of the change.

**4. DEBATE CHAMBER** — Five AI agents with distinct perspectives deliberate on the proposal:
- **Humanist** — considers readability and developer experience
- **Rationalist** — evaluates logical soundness
- **Ethicist** — checks for unintended consequences
- **Cooperator** — assesses compatibility with the broader codebase
- **Chaotic** — stress-tests the proposal by arguing against consensus
- **Skeptic** — demands evidence that the change is an improvement
- **Empiricist** — focuses on measurable outcomes

**5. COHERENCE GATE** — Before any mutation is applied, the system checks cognitive dominance metrics. If saturation thresholds are exceeded, the mutation is blocked automatically, regardless of Debate Chamber outcome. Tracked metrics include:
- Structural Change (max 5)
- Semantic Saturation (max 0.35)
- Velocity (max 5)
- Identity Preservation (target 1.0)
- Capability Alignment (max 5)
- Cross-File Impact (max 3)

**6. EXECUTE** — With operator approval, the mutation is written directly to the target GitHub repository as a commit. The mutation is logged with timestamp, commit hash, and score.

---

## Self-Evolution

DARLEK CANN can target its own repository as the evolution target. The operator can approve mutations to the system's own source files, push them to the repository, then press the **Reboot** button — which pulls the updated code and restarts the running instance on the enhanced version.

---

## Batch Mode

Selecting **SELECT ALL** queues every code file in the repository for sequential mutation. The operator approves or rejects each proposal in turn. Typing `abort` exits batch mode at any point.

Enabling **AUTO APPROVE ALL** fully automates the batch — mutations are applied without manual confirmation at each step. Use with caution.

---

## Setup

### Requirements

- Node.js 18+ or Bun
- A GitHub Personal Access Token with `repo` scope
- (Optional) A SQLite-compatible environment for BRAIN persistence

### Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```env
GITHUB_TOKEN=ghp_your_token_here
DATABASE_URL="file:./dev.db"
```

### Install and Run

```bash
# Install dependencies
bun install
# or
npm install

# Set up the database
bun run db:push

# Start development server
bun run dev

# Production build
bun run build
bun run start
```

The dashboard runs on `http://localhost:3000` by default.

---

## Project Structure

```
src/
  app/
    api/          # GitHub read/write/reboot API routes
    layout.tsx
    page.tsx
  components/
    ChatMessage.tsx
    ChatPanel.tsx
    DashboardPanel.tsx
    DebateChamber.tsx
    EvolutionLog.tsx
    MutationDiffView.tsx
    MutationHistoryPanel.tsx
    QuickActions.tsx
  lib/
    constants.ts
    dalek-brain.ts    # Core intelligence and response engine
    db.ts             # Prisma/SQLite persistence (BRAIN memory)
    types.ts          # Shared TypeScript types
    utils.ts
prisma/
  schema.prisma       # Database schema for mutation history and state
```

---

## Tech Stack

- **Framework:** Next.js 16, React 19, TypeScript
- **UI:** Tailwind CSS 4, shadcn/ui, Radix UI, Framer Motion
- **Database:** Prisma ORM + SQLite
- **Auth:** NextAuth
- **State:** Zustand, TanStack Query
- **Forms:** React Hook Form + Zod
- **Runtime:** Bun
- **Hosting:** Deployable to [z.ai](https://z.ai) or any Node/Bun-compatible host

---

## Live Demo

[darlekcaan.space.z.ai](https://darlekcaan.space.z.ai)

---

## Notes

- No external AI API is required. The Dalek Brain Engine (`src/lib/dalek-brain.ts`) is fully self-contained and deterministic.
- The Coherence Gate is always active and cannot be disabled through the UI — it is the primary safety mechanism preventing runaway mutation cycles.
- Every mutation requires explicit operator approval unless AUTO APPROVE ALL is enabled.
- BRAIN persistence via SQLite means mutation history, evolution cycles, and saturation metrics survive across sessions.

---

*Named after Dalek Caan — the one who saw all of time and space.*
