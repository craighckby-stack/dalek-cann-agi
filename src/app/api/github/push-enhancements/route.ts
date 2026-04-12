import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Allow this route to run for up to 5 minutes (35+ sequential file pushes)
export const maxDuration = 300;

// Complete list of all DARLEK CANN system files
const SYSTEM_FILES = [
  // API routes
  'src/app/api/chat/route.ts',
  'src/app/api/evolution/propose/route.ts',
  'src/app/api/evolution/coherence-gate/route.ts',
  'src/app/api/evolution/health/route.ts',
  'src/app/api/evolution/debate/route.ts',
  'src/app/api/evolution/analyze-impact/route.ts',
  'src/app/api/evolution/auto-test/route.ts',
  'src/app/api/brain/route.ts',
  'src/app/api/github/write-file/route.ts',
  'src/app/api/github/read-file/route.ts',
  'src/app/api/github/scan/route.ts',
  'src/app/api/github/push-enhancements/route.ts',
  'src/app/api/github/create-repo/route.ts',
  'src/app/api/github/branches/route.ts',
  'src/app/api/setup/test-connection/route.ts',
  // Lib
  'src/lib/constants.ts',
  'src/lib/types.ts',
  'src/lib/utils.ts',
  'src/lib/db.ts',
  'src/lib/dalek-brain.ts',
  // Components
  'src/components/StatusBar.tsx',
  'src/components/ChatPanel.tsx',
  'src/components/ChatMessage.tsx',
  'src/components/QuickActions.tsx',
  'src/components/DashboardPanel.tsx',
  'src/components/DebateChamber.tsx',
  'src/components/EvolutionLog.tsx',
  'src/components/SaturationMetrics.tsx',
  'src/components/MutationDiffView.tsx',
  'src/components/MutationHistoryPanel.tsx',
  // Pages
  'src/app/page.tsx',
  'src/app/layout.tsx',
  'src/app/globals.css',
  // Schema
  'prisma/schema.prisma',
];

// Get the file SHA from GitHub (needed for updates)
async function getFileSha(token: string, owner: string, repo: string, branch: string, path: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(branch)}`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      return data.sha || null;
    }
    if (res.status === 404) return null;
    return null;
  } catch {
    return null;
  }
}

// Push a single file to GitHub
async function pushFile(
  token: string,
  owner: string,
  repo: string,
  branch: string,
  filePath: string,
  content: string,
  sha: string | null
): Promise<{ success: boolean; error?: string; commitSha?: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(filePath)}`;
  const body: Record<string, unknown> = {
    message: `[DARLEK CANN] Enhancement: ${filePath}`,
    content: Buffer.from(content, 'utf-8').toString('base64'),
    branch,
  };
  if (sha) {
    body.sha = sha;
  }

  try {
    const res = await fetch(url, {
      method: 'PUT',
      signal: controller.signal,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const err = await res.text().catch(() => 'Unknown error');
      return { success: false, error: `GitHub API ${res.status}: ${err.slice(0, 120)}` };
    }

    const data = await res.json();
    return { success: true, commitSha: data.commit?.sha };
  } catch (err) {
    clearTimeout(timeout);
    return { success: false, error: `Request failed: ${err instanceof Error ? err.message : 'timeout'}` };
  }
}

// Helper: sleep for rate limiting
function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, owner, repo, branch } = body;

    if (!token || !owner || !repo || !branch) {
      return NextResponse.json(
        { error: 'All fields required: token, owner, repo, branch' },
        { status: 400 }
      );
    }

    const projectRoot = join(process.cwd());
    const results: Array<{
      file: string;
      success: boolean;
      error?: string;
      isNew?: boolean;
      commitSha?: string;
    }> = [];

    let pushed = 0;
    let failed = 0;

    for (const filePath of SYSTEM_FILES) {
      const localPath = join(projectRoot, filePath);

      // Check file exists locally
      if (!existsSync(localPath)) {
        results.push({ file: filePath, success: false, error: 'File not found locally' });
        failed++;
        continue;
      }

      // Read local file with error handling
      let content: string;
      try {
        content = readFileSync(localPath, 'utf-8');
      } catch (err) {
        results.push({ file: filePath, success: false, error: `Read failed: ${err instanceof Error ? err.message : 'unknown'}` });
        failed++;
        continue;
      }

      // Get current SHA from GitHub (to update existing file)
      const sha = await getFileSha(token, owner, repo, branch, filePath);
      const isNew = !sha;

      // Small delay between files to avoid rate limiting
      if (pushed + failed > 0) {
        await sleep(300);
      }

      // Push to GitHub
      const result = await pushFile(token, owner, repo, branch, filePath, content, sha);

      if (result.success) {
        results.push({
          file: filePath,
          success: true,
          isNew,
          commitSha: result.commitSha,
        });
        pushed++;
      } else {
        results.push({
          file: filePath,
          success: false,
          error: result.error,
        });
        failed++;
      }
    }

    return NextResponse.json({
      success: true,
      pushed,
      failed,
      total: SYSTEM_FILES.length,
      results,
      summary: `${pushed}/${SYSTEM_FILES.length} system files pushed to ${owner}/${repo}@${branch}`,
    });
  } catch (error) {
    console.error('Push enhancements error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
