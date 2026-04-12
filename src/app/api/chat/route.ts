import { NextRequest, NextResponse } from 'next/server';
import { generateFallbackResponse } from '@/lib/dalek-brain';
import type { ChatRequestBody } from '@/lib/types';
import { DALEK_CAAN_SYSTEM_PROMPT } from '@/lib/constants';

/**
 * DARLEK CANN — Chat API
 *
 * Uses the built-in Dalek Brain response engine.
 * No external LLM dependency. All intelligence is local and deterministic.
 */

export async function POST(req: NextRequest) {
  try {
    const body: ChatRequestBody = await req.json();
    const { message, history, systemState } = body;

    // Generate contextual response using the Dalek Brain engine
    const responseContent = generateFallbackResponse(message, {
      evolutionCycle: systemState.evolutionCycle,
      setupComplete: systemState.setupComplete,
      targetRepo: `${systemState.repoConfig.owner}/${systemState.repoConfig.repo}`,
      branch: systemState.repoConfig.branch,
      githubStatus: systemState.connectionStatus.github,
      saturation: systemState.saturation,
    });

    return NextResponse.json({
      content: responseContent,
      success: true,
      provider: 'Dalek-Brain',
    });
  } catch (error) {
    console.error('Chat API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { content: '', success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
