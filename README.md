# Dalek-Cann-AGI

A code evolution and repository management system built with Next.js, Prisma, and the GitHub REST API. The system performs rule-based static analysis to propose code modifications, evaluates them through a deterministic multi-agent debate simulation, and applies changes directly to GitHub repositories.

### Key Systems
- **Static Analysis Engine**: Uses regular expressions to calculate cyclomatic complexity, function length, and export surfaces.
- **Multi-Agent Deliberation**: Simulates five distinct personas (e.g., Humanist, Rationalist) that vote on mutations based on hardcoded risk thresholds.
- **GitHub Synchronization**: Provides endpoints for scanning, reading, and committing files to remote repositories.
- **Automated Validation**: Performs post-mutation syntax checks, specifically for bracket balancing and import path depth.
- **State Persistence**: Records mutation history, operator rejections, and health snapshots using a Prisma-backed database.