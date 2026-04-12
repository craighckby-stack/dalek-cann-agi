import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Allow this route to run for up to 5 minutes (43+ sequential file pushes)
export const maxDuration = 300;

// All DARLEK CANN system files to deploy
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

// Config files to include for a working project
const CONFIG_FILES = [
  'package.json',
  'next.config.ts',
  'tsconfig.json',
  'tailwind.config.ts',
  'postcss.config.mjs',
  '.gitignore',
  '.env.example',
];

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Fetch with timeout helper
async function fetchWithTimeout(url: string, options: RequestInit & { timeout?: number } = {}): Promise<Response> {
  const { timeout = 15000, ...fetchOptions } = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { ...fetchOptions, signal: controller.signal });
    clearTimeout(timeoutId);
    return res;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

// Get authenticated username
async function getUsername(token: string): Promise<string> {
  try {
    const res = await fetchWithTimeout('https://api.github.com/user', {
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json' },
      timeout: 10000,
    });
    if (res.ok) {
      const data = await res.json();
      return data.login || '';
    }
  } catch { /* continue */ }
  return '';
}

// Check if a repo exists and get its info
async function checkRepoExists(token: string, owner: string, repo: string): Promise<{ exists: boolean; htmlUrl?: string; cloneUrl?: string; defaultBranch?: string }> {
  try {
    const res = await fetchWithTimeout(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json' },
      timeout: 10000,
    });
    if (res.ok) {
      const data = await res.json();
      return {
        exists: true,
        htmlUrl: data.html_url,
        cloneUrl: data.clone_url,
        defaultBranch: data.default_branch || 'main',
      };
    }
    if (res.status === 404) return { exists: false };
  } catch { /* assume doesn't exist */ }
  return { exists: false };
}

// Create a new GitHub repository
async function createGitHubRepo(token: string, repoName: string, description: string): Promise<{ success: boolean; htmlUrl?: string; cloneUrl?: string; error?: string }> {
  try {
    const res = await fetchWithTimeout('https://api.github.com/user/repos', {
      method: 'POST',
      timeout: 15000,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: repoName,
        description,
        auto_init: false,
        private: false,
      }),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => 'Unknown error');
      return { success: false, error: `GitHub API ${res.status}: ${err.slice(0, 200)}` };
    }

    const data = await res.json();
    return {
      success: true,
      htmlUrl: data.html_url,
      cloneUrl: data.clone_url,
    };
  } catch (err) {
    return { success: false, error: `Failed to create repo: ${err instanceof Error ? err.message : 'timeout'}` };
  }
}

// Get SHA of an existing file on GitHub (for updates)
async function getFileSha(token: string, owner: string, repo: string, branch: string, filePath: string): Promise<string | null> {
  try {
    const res = await fetchWithTimeout(
      `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(filePath)}?ref=${encodeURIComponent(branch)}`,
      {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json' },
        timeout: 8000,
      }
    );
    if (res.ok) {
      const data = await res.json();
      return data.sha || null;
    }
    return null;
  } catch {
    return null;
  }
}

// Push a single file (handles both new files and updates)
async function pushFile(
  token: string,
  owner: string,
  repo: string,
  branch: string,
  filePath: string,
  content: string,
  sha: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(filePath)}`;
    const body: Record<string, unknown> = {
      message: `[DARLEK CANN] Deploy: ${filePath}`,
      content: Buffer.from(content, 'utf-8').toString('base64'),
      branch,
    };
    if (sha) {
      body.sha = sha;
    }

    const res = await fetchWithTimeout(url, {
      method: 'PUT',
      timeout: 15000,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => 'Unknown error');
      return { success: false, error: `GitHub API ${res.status}: ${err.slice(0, 120)}` };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: `Request failed: ${err instanceof Error ? err.message : 'timeout'}` };
  }
}

// Generate a .env.example file
function generateEnvExample(): string {
  return `# DARLEK CANN v3.0
# GitHub Personal Access Token (repo scope)
GITHUB_TOKEN=

# Database (optional - for BRAIN persistence)
DATABASE_URL="file:./dev.db"
`;
}

// Generate a minimal .gitignore
function generateGitignore(): string {
  return `node_modules/
.next/
.env
.env.local
*.db
*.db-journal
repo-clone/
skills/
`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, repoName, description, branch } = body;

    if (!token || !repoName) {
      return NextResponse.json(
        { error: 'token and repoName are required' },
        { status: 400 }
      );
    }

    const repoDescription = description || 'DARLEK CANN v3.0 — Cognitive Dominance Code Evolution Engine';
    const targetBranch = branch || 'main';

    // Step 1: Get authenticated user info
    const username = await getUsername(token);
    if (!username) {
      return NextResponse.json({
        success: false,
        error: 'Could not authenticate with GitHub. Check your token.',
      }, { status: 401 });
    }

    // Step 2: Check if repo already exists
    const existingRepo = await checkRepoExists(token, username, repoName);
    let htmlUrl = existingRepo.htmlUrl;
    let cloneUrl = existingRepo.cloneUrl;
    let repoCreated = false;

    if (existingRepo.exists) {
      // Repo already exists — reuse it and push updated files
      repoCreated = true;
    } else {
      // Create the new repository
      const repoResult = await createGitHubRepo(token, repoName, repoDescription);
      if (!repoResult.success) {
        return NextResponse.json({
          success: false,
          error: `Failed to create repository: ${repoResult.error}`,
        }, { status: 500 });
      }
      htmlUrl = repoResult.htmlUrl;
      cloneUrl = repoResult.cloneUrl;
      repoCreated = true;
    }

    const owner = username;
    const results: Array<{ file: string; success: boolean; error?: string; isNew?: boolean }> = [];
    let pushed = 0;
    let failed = 0;
    let skipped = 0;

    const projectRoot = join(process.cwd());

    // Collect all files to push
    const allFiles: Array<{ filePath: string; content: string }> = [];

    // System source files
    for (const filePath of SYSTEM_FILES) {
      const localPath = join(projectRoot, filePath);
      if (!existsSync(localPath)) {
        results.push({ file: filePath, success: false, error: 'Not found locally' });
        failed++;
        continue;
      }
      try {
        const content = readFileSync(localPath, 'utf-8');
        allFiles.push({ filePath, content });
      } catch {
        results.push({ file: filePath, success: false, error: 'Read error' });
        failed++;
      }
    }

    // Config files
    const specialFiles: Record<string, string> = {};
    specialFiles['.env.example'] = generateEnvExample();
    specialFiles['.gitignore'] = generateGitignore();

    for (const configFile of CONFIG_FILES) {
      if (configFile === '.env.example' || configFile === '.gitignore') continue;
      const localPath = join(projectRoot, configFile);
      if (existsSync(localPath)) {
        try {
          specialFiles[configFile] = readFileSync(localPath, 'utf-8');
        } catch { /* skip */ }
      }
    }

    for (const [filePath, content] of Object.entries(specialFiles)) {
      allFiles.push({ filePath, content });
    }

    // Push each file with rate limiting
    for (let i = 0; i < allFiles.length; i++) {
      const { filePath, content } = allFiles[i];

      // Rate limit: 300ms between requests
      if (i > 0) await sleep(300);

      // Get current SHA (needed for updating existing files)
      const sha = await getFileSha(token, owner, repoName, targetBranch, filePath);
      const isNew = !sha;

      // Push the file
      const result = await pushFile(token, owner, repoName, targetBranch, filePath, content, sha);
      results.push({ file: filePath, ...result, isNew });
      if (result.success) pushed++;
      else failed++;
    }

    const wasExisting = existingRepo.exists;
    const summaryPrefix = wasExisting
      ? `Repository "${repoName}" already existed — updated with `
      : `Repository "${repoName}" created and deployed `;

    return NextResponse.json({
      success: true,
      owner,
      repo: repoName,
      branch: targetBranch,
      htmlUrl,
      cloneUrl,
      pushed,
      failed,
      total: allFiles.length + (results.length - allFiles.length), // include not-found files
      results,
      wasExisting,
      summary: `${summaryPrefix}${pushed}/${allFiles.length + (results.length - allFiles.length)} files.`,
    });
  } catch (error) {
    console.error('Create repo error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
