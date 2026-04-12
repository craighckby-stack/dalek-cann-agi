import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { token, owner, repo } = await request.json();

    if (!token || !owner || !repo) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters: token, owner, repo' },
        { status: 400 }
      );
    }

    // Fetch branches from GitHub API — paginated
    const branches: Array<{ name: string; default: boolean }> = [];
    let page = 1;
    const perPage = 100;
    let hasMore = true;

    while (hasMore) {
      const res = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/branches?per_page=${perPage}&page=${page}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github.v3+json',
            'User-Agent': 'DARLEK-CANN',
          },
        }
      );

      if (!res.ok) {
        const errorBody = await res.text();
        return NextResponse.json(
          {
            success: false,
            error: `GitHub API error (${res.status}): ${errorBody.slice(0, 200)}`,
          },
          { status: res.status }
        );
      }

      const data = await res.json();

      if (!Array.isArray(data) || data.length === 0) {
        hasMore = false;
      } else {
        for (const branch of data) {
          branches.push({
            name: branch.name,
            default: branch.name === 'main' || branch.name === 'master',
          });
        }
        if (data.length < perPage) {
          hasMore = false;
        }
        page++;
      }
    }

    // Fetch default branch name from repo info
    let defaultBranch = 'main';
    try {
      const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'DARLEK-CANN',
        },
      });
      if (repoRes.ok) {
        const repoData = await repoRes.json();
        defaultBranch = repoData.default_branch || 'main';
        // Update the default flag
        for (const b of branches) {
          b.default = b.name === defaultBranch;
        }
      }
    } catch {
      // Use heuristic if repo info fails
    }

    // Sort: default branch first, then alphabetically
    branches.sort((a, b) => {
      if (a.default && !b.default) return -1;
      if (!a.default && b.default) return 1;
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({
      success: true,
      branches,
      defaultBranch,
      total: branches.length,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch branches' },
      { status: 500 }
    );
  }
}
