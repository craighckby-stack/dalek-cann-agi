import { NextRequest, NextResponse } from 'next/server';
import type { TestConnectionBody } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body: TestConnectionBody = await req.json();
    const { key } = body;

    if (!key || key.trim() === '') {
      return NextResponse.json({
        success: false,
        message: 'No GitHub token provided.',
      });
    }

    const res = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${key}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({
        success: true,
        message: `GitHub connected as @${data.login}.`,
      });
    }

    const err = await res.text();
    return NextResponse.json({ success: false, message: `GitHub error: ${err.slice(0, 200)}` });
  } catch (error) {
    console.error('Test connection error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, message: `Connection test failed: ${errorMessage}` });
  }
}
