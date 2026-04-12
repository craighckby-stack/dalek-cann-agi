import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, relative, extname } from 'path';

// All DARLEK CANN AGI system files to deploy
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

// Create a new GitHub repository for the authenticated user
async function createGitHubRepo(token: string, repoName: string, description: string): Promise<{ success: boolean; htmlUrl?: string; cloneUrl?: string; error?: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch('https://api.github.com/user/repos', {
      method: 'POST',
      signal: controller.signal,
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
    clearTimeout(timeout);

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
    clearTimeout(timeout);
    return { success: false, error: `Failed to create repo: ${err instanceof Error ? err.message : 'timeout'}` };
  }
}

// Push a single file to GitHub (no SHA needed for brand new repo)
async function pushFile(
  token: string,
  owner: string,
  repo: string,
  branch: string,
  filePath: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(filePath)}`;
    const res = await fetch(url, {
      method: 'PUT',
      signal: controller.signal,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `[DARLEK CANN AGI] Deploy: ${filePath}`,
        content: Buffer.from(content, 'utf-8').toString('base64'),
        branch,
      }),
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const err = await res.text().catch(() => 'Unknown error');
      return { success: false, error: `GitHub API ${res.status}: ${err.slice(0, 120)}` };
    }

    return { success: true };
  } catch (err) {
    clearTimeout(timeout);
    return { success: false, error: `Request failed: ${err instanceof Error ? err.message : 'timeout'}` };
  }
}

// Generate a .env.example file
function generateEnvExample(): string {
  return `# DARLEK CANN AGI v3.0
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

    const repoDescription = description || 'DARLEK CANN AGI v3.0 — Cognitive Dominance Code Evolution Engine';
    const targetBranch = branch || 'main';

    // Step 1: Get authenticated user info
    let username = '';
    try {
      const userRes = await fetch('https://api.github.com/user', {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json' },
      });
      if (userRes.ok) {
        const userData = await userRes.json();
        username = userData.login || '';
      }
    } catch { /* continue anyway */ }

    // Step 2: Create the new repository
    const repoResult = await createGitHubRepo(token, repoName, repoDescription);
    if (!repoResult.success) {
      return NextResponse.json({
        success: false,
        error: `Failed to create repository: ${repoResult.error}`,
      }, { status: 500 });
    }

    const owner = username;
    const results: Array<{ file: string; success: boolean; error?: string }> = [];
    let pushed = 0;
    let failed = 0;

    const projectRoot = join(process.cwd());

    // Step 3: Push all system source files
    for (const filePath of SYSTEM_FILES) {
      const localPath = join(projectRoot, filePath);

      if (!existsSync(localPath)) {
        results.push({ file: filePath, success: false, error: 'Not found locally' });
        failed++;
        continue;
      }

      let content: string;
      try {
        content = readFileSync(localPath, 'utf-8');
      } catch (err) {
        results.push({ file: filePath, success: false, error: `Read error` });
        failed++;
        continue;
      }

      // Rate limit delay
      if (pushed + failed > 0) await sleep(350);

      const result = await pushFile(token, owner, repoName, targetBranch, filePath, content);
      results.push({ file: filePath, ...result });
      if (result.success) pushed++;
      else failed++;
    }

    // Step 4: Push config files
    const specialFiles: Record<string, string> = {};

    // .env.example and .gitignore are generated
    specialFiles['.env.example'] = generateEnvExample();
    specialFiles['.gitignore'] = generateGitignore();

    // Read other config files if they exist
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
      await sleep(350);
      const result = await pushFile(token, owner, repoName, targetBranch, filePath, content);
      results.push({ file: filePath, ...result });
      if (result.success) pushed++;
      else failed++;
    }

    return NextResponse.json({
      success: true,
      owner,
      repo: repoName,
      branch: targetBranch,
      htmlUrl: repoResult.htmlUrl,
      cloneUrl: repoResult.cloneUrl,
      pushed,
      failed,
      total: SYSTEM_FILES.length + Object.keys(specialFiles).length,
      results,
      summary: `Repository "${repoName}" created and ${pushed}/${SYSTEM_FILES.length + Object.keys(specialFiles).length} files deployed.`,
    });
  } catch (error) {
    console.error('Create repo error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
